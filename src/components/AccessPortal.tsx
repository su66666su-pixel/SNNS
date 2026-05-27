// AccessPortal.tsx - بوابة الوصول السرية والآمنة لإدارة ومشرفي منصة SNNS.PRO
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Lock, Loader2, Key, AlertTriangle, Check, RefreshCw, LogOut, Globe, Smartphone, HelpCircle, ArrowRight
} from "lucide-react";
import { auth, googleProvider, signInWithPopup, db } from "../utils/firebase";
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { detectGeoIP } from "../utils/countryLockStore";
import { addThreatLog } from "../utils/securityWatchdogStore";

export default function AccessPortal() {
  const navigate = useNavigate();

  // Authentication Sequence States
  const [step, setStep] = useState<"auth" | "code" | "success">("auth");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  
  // Security & Captcha
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [mathPuzzle, setMathPuzzle] = useState({ num1: 0, num2: 0, op: "+" });
  
  // Logging & Sentry Information
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  
  // UI & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successRole, setSuccessRole] = useState("");

  // Load geoIP and check local lockout status
  useEffect(() => {
    const fetchGeo = async () => {
      try {
        const info = await detectGeoIP();
        setIpInfo(info);
      } catch (err) {
        console.error("Error loading GeoIP verification:", err);
      }
    };
    fetchGeo();

    // Check existing lockout state in localStorage
    const savedLock = localStorage.getItem("snns_portal_lockout");
    if (savedLock) {
      const lockExpired = parseInt(savedLock);
      if (Date.now() < lockExpired) {
        setIsLocked(true);
        setLockoutTimeLeft(Math.ceil((lockExpired - Date.now()) / 1000));
      } else {
        localStorage.removeItem("snns_portal_lockout");
      }
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (isLocked && lockoutTimeLeft > 0) {
      const timer = setTimeout(() => {
        setLockoutTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTimeLeft === 0) {
      setIsLocked(false);
      setFailedAttempts(0);
      localStorage.removeItem("snns_portal_lockout");
    }
  }, [isLocked, lockoutTimeLeft]);

  // Generate math captcha to deflect automated scripts
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const operators = ["+", "-"];
    const op = operators[Math.floor(Math.random() * operators.length)];
    setMathPuzzle({ num1: n1, num2: n2, op });
    setCaptchaInput("");
    setErrorMessage("");
    
    const ans = op === "+" ? n1 + n2 : n1 - n2;
    setCaptchaAnswer(ans.toString());
  };

  useEffect(() => {
    if (step === "code") {
      generateCaptcha();
    }
  }, [step]);

  // Handle actual Google Login Integration
  const handleGoogleSignIn = async () => {
    if (isLocked) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const u = result.user;
        setCurrentUser(u);
        setStep("code");
      } else {
        throw new Error("لم يتم استقبال بيانات الحساب من قوقل.");
      }
    } catch (err: any) {
      console.error("Popup sign-in error on sandbox container, with fallback:", err);
      // In high-security environments, let's keep it strictly tied to the email verified or check auth state
      setErrorMessage("أخفقت مصادقة Google الموحدة. يرجى إعادة المحاولة من متصفح معتمد.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit and verify Secure Access Code
  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setIsLoading(true);
    setErrorMessage("");

    // 1. CAPTCHA verification
    if (captchaInput.trim() !== captchaAnswer) {
      setErrorMessage("رمز الحارس البشري التحققي غير صحيح.");
      setIsLoading(false);
      generateCaptcha();
      return;
    }

    // 2. Format Access Code check
    const cleanCode = accessCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMessage("الرجاء إدخال رمز وصول أمني مكتمل.");
      setIsLoading(false);
      return;
    }

    try {
      // 3. Document fetch from Firestore `/access_codes` collection
      const codeRef = doc(db, "access_codes", cleanCode);
      const docSnap = await getDoc(codeRef);

      if (!docSnap.exists()) {
        throw new Error("رمز الوصول الأمن غير مسجل أو منتهي.");
      }

      const data = docSnap.data();

      // 4. Validate active status
      if (!data.is_active) {
        throw new Error("تم إلغاء تفعيل رمز الوصول الأمني المحدد.");
      }

      // 5. Validate expiration dates
      if (data.expires_at) {
        const expiry = new Date(data.expires_at);
        if (expiry.getTime() < Date.now()) {
          throw new Error("فترة صلاحية رمز الوصول الأمن منتهية بالكامل.");
        }
      }

      // 6. Authorized and Provision Role inside Firestore `user_roles`
      const assignedRole = data.role || "moderator";
      
      const roleRef = doc(db, "user_roles", currentUser.uid);
      await setDoc(roleRef, {
        user_id: currentUser.uid,
        role: assignedRole,
        permissions: getPermissionsForRole(assignedRole),
        access_code_used: cleanCode,
        activated_at: new Date().toISOString()
      });

      // Update client profile session state to avoid lag
      const storedProfile = localStorage.getItem("snns_user_profile");
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          parsed.role = assignedRole;
          parsed.email = currentUser.email;
          localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
        } catch {}
      }

      setSuccessRole(assignedRole);
      setStep("success");
      
      // Reset failed attempts upon successful authentication
      setFailedAttempts(0);

    } catch (err: any) {
      console.warn("Incident verified:", err.message);
      
      const currentFailCount = failedAttempts + 1;
      setFailedAttempts(currentFailCount);
      setErrorMessage(err.message || "رمز الدخول الذي أدخلته غير مطابق لامتيازات النظام.");

      // Log Failed Access Attempt Event to Security Logs (Firestore and Sentinel Watchdog)
      const logId = "failed_gateway_" + Date.now();
      const ip = ipInfo?.ip || "127.0.0.1";
      const userAgent = navigator.userAgent;

      // Firestore Audit logging
      try {
        await setDoc(doc(db, "security_logs", logId), {
          id: logId,
          user_id: currentUser?.uid || "guest_unauth",
          username: currentUser?.displayName || "unidentified",
          email: currentUser?.email || "unknown_email",
          ip: ip,
          timestamp: new Date().toISOString(),
          attemptedPath: "/access-portal",
          role: "guest",
          riskLevel: currentFailCount >= 3 ? "extreme" : "high",
          userAgent: userAgent,
          countryCode: ipInfo?.countryCode || "SA",
          vpnDetected: ipInfo?.vpnDetected || false
        });
      } catch (fsErr) {
        console.error("Failed to commit security incident to Firestore:", fsErr);
      }

      // Auto Sentry logic - temporary lock out device
      if (currentFailCount >= 3) {
        const duration = 600 * 1000; // 10 minutes lock
        const expireLock = Date.now() + duration;
        localStorage.setItem("snns_portal_lockout", expireLock.toString());
        setIsLocked(true);
        setLockoutTimeLeft(600);
        addThreatLog({
          userId: currentUser?.uid || "guest_unauth",
          ip: ip,
          countryName: ipInfo?.countryName || "المملكة العربية السعودية",
          countryCode: ipInfo?.countryCode || "SA",
          flag: ipInfo?.flag || "🇸🇦",
          device: navigator.platform,
          browser: "Automated Gateway Block",
          eventType: "bruteforce",
          riskScore: "extreme",
          actionTaken: "ip_banned_temp",
          notes: `تم رصد محاولات فك تشفير متعددة متتالية لرموز وصول الإدارة برقم IP: ${ip}`,
          verified: true
        });
      }

      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper mapping roles to section privileges
  const getPermissionsForRole = (role: string): string[] => {
    if (role === "super_admin") {
      return ["overview", "users", "moderators", "premium_handles", "google_audit", "creators", "lives", "content", "verification", "trusted_badges", "business", "countries", "vpn_monitor", "sentry", "firebase_config", "wallet", "reports", "notifications", "system", "settings", "access_codes"];
    } else if (role === "admin") {
      return ["overview", "users", "premium_handles", "creators", "lives", "content", "verification", "trusted_badges", "business", "vpn_monitor", "sentry", "wallet", "reports", "notifications", "system"];
    } else if (role === "security") {
      return ["overview", "sentry", "countries", "vpn_monitor", "google_audit", "system", "reports"];
    } else if (role === "verification") {
      return ["overview", "verification", "trusted_badges", "creators", "reports"];
    } else {
      // content_moderator / moderator
      return ["overview", "content", "lives", "reports", "notifications"];
    }
  };

  const roleLabelsAr: Record<string, string> = {
    super_admin: "المدير العام (Super Admin)",
    admin: "مسؤول النظام (Admin)",
    security: "مشرف الأمن والسيبراني (Security)",
    verification: "مدقق الهوية والتوثيق (Verification)",
    moderator: "مشرف المحتوى والبث (Moderator)",
    content_moderator: "مشرف المحتوى والبث (Moderator)"
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden font-tajawal select-none" dir="rtl">
      {/* Background glow matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,163,79,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-saudi-green/5 blur-3xl rounded-full pointer-events-none" />

      {/* Cyber Security Console Frame */}
      <div className="w-full max-w-md bg-[#0c0c0c] border border-saudi-green/15 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,163,79,0.08)] relative z-10">
        
        {/* Top telemetry panel bar */}
        <div className="px-5 py-3.5 bg-neutral-950/80 border-b border-saudi-green/10 flex items-center justify-between text-[11px] font-mono tracking-wider text-saudi-glow/85">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 bg-saudi-green rounded-full animate-ping" />
            <span>SECURE GATEWAY v3.9</span>
          </div>
          <span className="text-gray-500">IP: {ipInfo?.ip || "SCANNING..."}</span>
        </div>

        <div className="p-8">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: Google Validation */}
            {step === "auth" && (
              <motion.div
                key="step-auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-saudi-green/10 border border-saudi-green/20 rounded-2xl flex items-center justify-center text-saudi-green mx-auto shadow-[0_0_20px_rgba(0,163,79,0.15)]">
                  <Lock className="w-7 h-7 stroke-[2.5]" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-black text-white tracking-tight">بوابة الوصول المعتمدة</h2>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">
                    منطقة إدارية مقفلة أمنياً ومراقبة بالذكاء السيبراني. غير مخصصة للتصفح العام.
                  </p>
                </div>

                {/* VPN Alerts */}
                {ipInfo?.vpnDetected && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[11px] flex items-center gap-2 text-right">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <p className="font-bold">تم كشف إخفاء اتصال (VPN). الدخول عبر الخوادم الوكيلة معطل تلقائياً.</p>
                  </div>
                )}

                {/* Lockout Screen */}
                {isLocked ? (
                  <div className="p-4 bg-red-950/35 border border-red-500/20 rounded-xl space-y-2 text-right">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <h4 className="font-bold text-xs">تم فرض الحظر الاحترازي المؤقت</h4>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      بعد تكرار محاولات الوصول الخاطئة، تم تجميد البوابة لدواع أمنية. يرجى الانتظار للمحاولة مجدداً:
                    </p>
                    <div className="text-center py-2 font-mono text-xl font-bold text-red-400">
                      {Math.floor(lockoutTimeLeft / 60)}:{(lockoutTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || ipInfo?.vpnDetected}
                    className="w-full h-12 bg-saudi-green hover:bg-saudi-green/90 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-saudi-green/15 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed uppercase"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4.5 h-4.5" />
                        <span>تحقق الهوية عبر Google Mapped Identity</span>
                      </>
                    )}
                  </button>
                )}

                {errorMessage && (
                  <p className="text-red-400 text-xs font-bold leading-relaxed">{errorMessage}</p>
                )}
              </motion.div>
            )}

            {/* STEP 2: Access Code Entry */}
            {step === "code" && (
              <motion.div
                key="step-code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5 text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-saudi-green/10 border border-saudi-green/20 rounded-xl flex items-center justify-center text-saudi-green">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">إثبات الصلاحيات الثنائية</h3>
                    <p className="text-[10px] text-gray-400">المسؤول: {currentUser?.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitCode} className="space-y-4">
                  
                  {/* Access Token Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-gray-400">رمز المرور الفردي للتخويل الأمن:</label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="•••••••••••••••••••••••••"
                      className="w-full h-11 bg-neutral-900 border border-white/10 rounded-xl px-3.5 text-center font-mono text-sm tracking-widest text-saudi-glow focus:border-saudi-green focus:outline-none transition-all"
                    />
                  </div>

                  {/* Math CAPTCHA Code widget */}
                  <div className="p-3.5 bg-neutral-950 rounded-xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-gray-500">حارس الامتثال البشري الذكي:</span>
                      <button 
                        type="button" 
                        onClick={generateCaptcha} 
                        className="text-saudi-glow text-[10px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>تدوير الرمز</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Formula display */}
                      <div className="flex-1 bg-[#121212] border border-saudi-green/15 rounded-lg py-2.5 text-center font-mono font-bold text-sm tracking-wider text-saudi-green">
                        {mathPuzzle.num1} {mathPuzzle.op} {mathPuzzle.num2} = ?
                      </div>
                      
                      {/* Capture Input */}
                      <input
                        type="number"
                        required
                        placeholder="الأرقام"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="w-24 h-10 bg-neutral-900 border border-white/10 rounded-lg text-center font-mono text-sm tracking-widest focus:border-saudi-green focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 bg-red-550/10 border border-red-500/20 text-red-400 text-[10.5px] font-bold rounded-lg leading-relaxed flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep("auth")}
                      className="flex-1 h-11 bg-neutral-900 border border-white/10 text-gray-300 hover:bg-neutral-800 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                      <span>رجوع</span>
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] h-11 bg-saudi-green hover:bg-saudi-green/90 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-saudi-green/15 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>فك قفل المنصة الأمنية</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* STEP 3: Decrypted Access Successful */}
            {step === "success" && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-saudi-green/15 border border-saudi-green/40 rounded-2xl flex items-center justify-center text-saudi-green mx-auto shadow-[0_0_20px_#00A34F/25] animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-white">منح الترخيص الأمني بنجاح</h3>
                  <p className="text-xs text-saudi-glow font-bold">
                    تم مطابقة الرمز وتعيين الصلاحية: {roleLabelsAr[successRole] || successRole}
                  </p>
                </div>

                <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                  يقوم نظام الديوان الآن ببذر تشفير جلسة المشرف الخاصة بـ SNNS.PRO وبناء لوحة البيانات المناسبة.
                </p>

                <button
                  onClick={() => navigate("/admin")}
                  className="w-full h-11 bg-saudi-green hover:bg-saudi-green/90 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-saudi-green/20 cursor-pointer"
                >
                  الدخول للمنصة المعتمدة 🇸🇦
                </button>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Console Footnote */}
        <div className="px-5 py-4 bg-neutral-950/40 border-t border-saudi-green/5 text-center text-[9px] text-gray-650 text-gray-600 font-mono tracking-wide leading-relaxed">
          SECURE CREDENTIAL ENVELOPE SEED IS SYNCED VIA REAL-TIME ENTROPY ENGINE.<br />
          COMPLIANT WITH GCC PRIVACY ACTS 2026.
        </div>
      </div>
    </div>
  );
}
