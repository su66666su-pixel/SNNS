import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, ShieldAlert, Cpu, Fingerprint, RefreshCw, Key, 
  Trash2, Globe, Shield, Terminal, Server, X, Check, Lock, Power,
  Eye, EyeOff, Smartphone, Sparkles, Send, Ban, AlertOctagon, HelpCircle
} from "lucide-react";
import { 
  getDeviceSessions, saveDeviceSessions, DeviceSession,
  getThreatLogs, SecurityThreatLog,
  getUserSecurityProfile, saveUserSecurityProfile, UserSecurityProfile,
  maskIpAddress, maskDeviceName, addThreatLog, hasSecurityAccess
} from "../utils/securityWatchdogStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function SmartSentryUserModal({ isOpen, onClose, username }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "verify" | "logs">("overview");
  const [secProfile, setSecProfile] = useState<UserSecurityProfile>(() => getUserSecurityProfile());
  const [sessions, setSessions] = useState<DeviceSession[]>(() => getDeviceSessions());
  const [logs, setLogs] = useState<SecurityThreatLog[]>([]);
  
  // Custom states for verification sandbox
  const [otpSent, setOtpSent] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [twoFactorInputError, setTwoFactorInputError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // CAPTCHA slide challenge simulation
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [captchaMathQuestion, setCaptchaMathQuestion] = useState({ q: "", a: 0 });
  const [captchaAnswerInput, setCaptchaAnswerInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  // Instruction 8 compliant: unmasked viewer toggle
  const [temporarySecurityApproved, setTemporarySecurityApproved] = useState(false);
  const [otpForUnmaskSent, setOtpForUnmaskSent] = useState(false);
  const [unmaskOtpInput, setUnmaskOtpInput] = useState("");
  const [unmaskCodeGenerated, setUnmaskCodeGenerated] = useState("");
  const [unmaskError, setUnmaskError] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load relevant user logs
  useEffect(() => {
    if (isOpen) {
      const allLogs = getThreatLogs();
      const userLogs = allLogs.filter(l => l.userId === username);
      setLogs(userLogs);
      generateNewMathCaptcha();
    }
  }, [isOpen, username]);

  // Recalculate OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const generateNewMathCaptcha = () => {
    const num1 = Math.floor(Math.random() * 8) + 2;
    const num2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaMathQuestion({
      q: `${num1} + ${num2} = ؟`,
      a: num1 + num2
    });
    setCaptchaAnswerInput("");
    setCaptchaSolved(false);
    setCaptchaError("");
  };

  const handleVerifyCaptcha = (e: React.FormEvent) => {
    e.preventDefault();
    const ans = parseInt(captchaAnswerInput.trim());
    if (ans === captchaMathQuestion.a) {
      setCaptchaSolved(true);
      setCaptchaError("");
      addThreatLog({
        userId: username,
        ip: "185.120.44.18",
        countryName: "المملكة العربية السعودية",
        countryCode: "SA",
        flag: "🇸🇦",
        device: "Apple iPhone 15 Pro Max",
        browser: "Safari Mobile Sentry Engine",
        eventType: "rate_limit",
        riskScore: "low",
        actionTaken: "none",
        notes: "تم تجاوز وفحص كابتشا بنجاح للتأكد من بشرية المستخدم والمطالبة بالجلسات.",
        verified: true
      });
      triggerToast("✓ تم اجتياز فحص الروبوت بنجاح!");
    } else {
      setCaptchaError("الرمز الرياضي خاطئ. يرجى المحاولة المبرهنة مجدداً.");
    }
  };

  // 2FA Actions
  const handleToggleTwoFactor = () => {
    if (secProfile.twoFactorEnabled) {
      const updated = { ...secProfile, twoFactorEnabled: false };
      saveUserSecurityProfile(updated);
      setSecProfile(updated);
      triggerToast("تم تعطيل المصادقة الثنائية 2FA");
    } else {
      // Simulate sending activation OTP
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(generated);
      setOtpSent(true);
      setOtpCountdown(60);
      setTwoFactorInputError("");
      triggerToast(`تم إرسال رمز تفعيل تجريبي: ${generated}`);
    }
  };

  const verifyToggleOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCodeInput === simulatedOtp) {
      const updated = { ...secProfile, twoFactorEnabled: true };
      saveUserSecurityProfile(updated);
      setSecProfile(updated);
      setOtpSent(false);
      setOtpCodeInput("");
      addThreatLog({
        userId: username,
        ip: "185.120.44.18",
        countryName: "المملكة العربية السعودية",
        countryCode: "SA",
        flag: "🇸🇦",
        device: "Apple iPhone 15 Pro Max",
        browser: "Safari Mobile",
        eventType: "two_factor",
        riskScore: "low",
        actionTaken: "none",
        notes: "قام العميل بتفعيل المصادقة الجوالية الثنائية لـ 2FA وتأكيد الـ OTP.",
        verified: true
      });
      triggerToast("✓ تم تفعيل المصادقة الثنائية 2FA بنجاح!");
    } else {
      setTwoFactorInputError("رمز التحقق غير صحيح، فحص فاشل.");
    }
  };

  // Logout from all other devices (Instruction 6 Requirement)
  const handleLogoutAllOtherDevices = () => {
    if (confirm("هل أنت متأكد من رغبتك في سحب الترخيص وتسجيل الخروج من كافة الأجهزة والمتصفحات الأخرى؟")) {
      const activeSession = sessions.find(s => s.isCurrent) || sessions[0];
      const updatedSessions: DeviceSession[] = [
        {
          ...activeSession,
          id: "dev_current_reset",
          isCurrent: true,
          isActive: true
        }
      ];
      saveDeviceSessions(updatedSessions);
      setSessions(updatedSessions);
      
      // Log threat action taken
      addThreatLog({
        userId: username,
        ip: activeSession.ip,
        countryName: activeSession.country,
        countryCode: activeSession.countryCode,
        flag: activeSession.flag,
        device: activeSession.deviceName,
        browser: activeSession.browser,
        eventType: "new_device",
        riskScore: "low",
        actionTaken: "none",
        notes: "تم سحب صلاحيات تداول الخادم وتم الفك وتسجيل الخروج من كافة الأجهزة الأخرى يدوياً.",
        verified: true
      });

      triggerToast("✓ تم تسجيل الخروج من كل الأجهزة الأخرى بنجاح!");
    }
  };

  // Instruction 8 IP Unmask OTP simulation
  const initiateIPUnmaskOTP = () => {
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setUnmaskCodeGenerated(generated);
    setOtpForUnmaskSent(true);
    setUnmaskError("");
    triggerToast(`رمز OTP لفتح بيانات الخصوصية: ${generated}`);
  };

  const handleVerifyUnmaskOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (unmaskOtpInput === unmaskCodeGenerated) {
      setTemporarySecurityApproved(true);
      setOtpForUnmaskSent(false);
      setUnmaskOtpInput("");
      triggerToast("🔓 تم التحقق بنجاح! كشف بيانات الـ IP والأجهزة النشطة.");
    } else {
      setUnmaskError("الكود المُدخل غير متطابق. تم إحباط المتابعة.");
    }
  };

  // Quick Password resets simulation
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const handleSimulatePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      alert("كلمة المرور يجب أن تكون أكثر من 6 خانات.");
      return;
    }

    addThreatLog({
      userId: username,
      ip: "185.120.44.18",
      countryName: "المملكة العربية السعودية",
      countryCode: "SA",
      flag: "🇸🇦",
      device: "Apple iPhone 15 Pro Max",
      browser: "Safari Mobile System Settings",
      eventType: "password_change",
      riskScore: "low",
      actionTaken: "none",
      notes: "تم تغيير كلمة المرور للمستخدم وتم مسح احتمالات التخمين العشري.",
      verified: true
    });

    setOldPass("");
    setNewPass("");
    triggerToast("✓ تم تحديث كلمة مرور الحساب بنجاح!");
  };

  // Clear in-app notification alerts
  const handleClearAlerts = () => {
    const updated = { ...secProfile, userAlerts: [] };
    saveUserSecurityProfile(updated);
    setSecProfile(updated);
    triggerToast("تم مسح التنبيهات الأمنية الواردة.");
  };

  if (!isOpen) return null;

  // View masked values under condition
  const isAuthorizedToUnmask = temporarySecurityApproved || hasSecurityAccess();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-3 font-tajawal text-right" dir="rtl">
      
      {/* Visual Toast Notification inside modal */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 z-[201] bg-[#0c0c0c] border border-saudi-green px-4 py-2.5 rounded-lg text-xs font-bold text-white shadow-[0_0_15px_rgba(0,163,79,0.3)] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-saudi-glow" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#080808] border border-white/5 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(0,132,61,0.05)] text-white relative pr-1 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0d0d0d]">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/10 text-[9px] font-bold">مستشار الحماية</span>
            <h3 className="font-black text-sm text-white flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-saudi-glow" />
              الحارس الذكي 🇸🇦 <span className="text-gray-400">ملف الأمان الشخصي</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-450 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic tabs navigation */}
        <div className="flex border-b border-white/5 bg-neutral-950 px-4 text-xs font-bold shrink-0">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === "overview" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            نظرة عامة والتقييم
          </button>
          <button 
            onClick={() => setActiveTab("sessions")}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === "sessions" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            الأجهزة النشطة ({sessions.length})
          </button>
          <button 
            onClick={() => setActiveTab("verify")}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === "verify" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            فحوصات السلامة (2FA)
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`py-3.5 px-4 border-b-2 transition-all cursor-pointer ${activeTab === "logs" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            سجل التدقيق الأمني
          </button>
        </div>

        {/* Modal Body scrollable */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 flex-1 text-right">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              
              {/* Security Meter Score Display */}
              <div className="p-5 bg-gradient-to-l from-neutral-900 via-neutral-950 to-neutral-900 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-right flex-1">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">نقاط الجاهزية والامتثال السيبراني</span>
                  <h4 className="font-bold text-sm text-white">حساب حذر ومحمي بالذكاء الاصطناعي</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                    يعمل "الحارس الذكي" على تحليل حركة الدخول والبيزو-متريات لمطابقتها مع خريطة أمان المملكة وموانع الاحتيال الجغرافي.
                  </p>
                </div>

                <div className="flex items-center gap-4 border-r border-white/5 pr-4 shrink-0">
                  <div className="text-center">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-white/5" />
                      <div className="absolute inset-0 rounded-full border-2 border-saudi-green border-t-transparent animate-spin duration-3000" />
                      <span className="text-lg font-black font-mono text-saudi-glow">
                        {secProfile.twoFactorEnabled ? "٩٨" : "٧٥"}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold block mt-1.5">مؤشر أمان الحساب</span>
                  </div>
                </div>
              </div>

              {/* Active Security Alerts Panel */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <button 
                    onClick={handleClearAlerts}
                    className="text-[9.5px] text-red-400 hover:underline outline-none"
                  >
                    تجاهل وتصفير التنبيهات
                  </button>
                  <h4 className="font-bold text-xs text-white flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-amber-500 animate-bounce" />
                    الإشعارات والتنبيهات الأمنية النشطة ({secProfile.userAlerts.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {secProfile.userAlerts.length === 0 ? (
                    <div className="p-5 bg-[#050505] border border-white/5 rounded-2xl text-center text-xs text-gray-550">
                      🟢 لا توجد أي تحذيرات أو هجمات مشبوهة في صفوف حماية حسابك حالياً.
                    </div>
                  ) : (
                    secProfile.userAlerts.map(alert => (
                      <div 
                        key={alert.id} 
                        className={`p-3 border rounded-xl text-xs flex items-start gap-2.5 justify-between ${
                          alert.type === "critical" 
                            ? "bg-red-950/20 border-red-900/30 text-red-200" 
                            : "bg-neutral-900 border-white/5 text-gray-300"
                        }`}
                      >
                        <span className="text-[9.5px] text-gray-550 font-mono shrink-0">{alert.timestamp}</span>
                        <div className="text-right flex-1">
                          <p className="font-medium leading-relaxed">{alert.msg}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Interactive Settings switches */}
              <div className="p-4 bg-neutral-950 border border-white/5 rounded-2xl space-y-3.5">
                <h4 className="font-bold text-xs text-white pb-2 border-b border-white/5">أدوات التحكم السريعة بالأمان</h4>
                
                {/* 2FA switch */}
                <div className="flex justify-between items-center text-xs">
                  <button 
                    onClick={handleToggleTwoFactor}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      secProfile.twoFactorEnabled 
                        ? "bg-red-500/10 text-red-400 border border-red-500/10" 
                        : "bg-saudi-green text-white"
                    }`}
                  >
                    {secProfile.twoFactorEnabled ? "تعطيل 2FA" : "تفعيل ثنائي 2FA"}
                  </button>
                  <div className="text-right">
                    <span className="font-bold block text-white text-[11.5px]">المصادقة الثنائية (Two-Factor Authentication)</span>
                    <p className="text-[10px] text-gray-400">طلب كود التحقق OTP المرسل لهاتفك المسجل عند الدخول من جهاز مشبوه.</p>
                  </div>
                </div>

                {/* 2nd Factor SMS activation drawer simulator */}
                <AnimatePresence>
                  {otpSent && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={verifyToggleOTP}
                      className="p-3 bg-neutral-900 rounded-xl space-y-2 mt-2 border border-saudi-green/20"
                    >
                      <p className="text-[10.5px] text-saudi-glow font-bold leading-normal">
                        صالح لتفعيل الأمان المشدد: يرجى كتابة كود الـ OTP المرسل إليك الآن في الخانة أدناه لتأكيد الترقية:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="الرمز (6 خانات)..."
                          value={otpCodeInput}
                          onChange={(e) => setOtpCodeInput(e.target.value)}
                          className="bg-neutral-950 border border-white/5 py-1.5 px-3 rounded-lg text-xs text-center font-mono w-40 flex-1"
                        />
                        <button
                          type="submit"
                          className="bg-saudi-green text-white font-bold text-[10.5px] px-3.5 rounded-lg shrink-0 cursor-pointer"
                        >
                          إنهاء وتفعيل 2FA
                        </button>
                      </div>
                      {twoFactorInputError && <p className="text-[10px] text-red-400 font-bold">{twoFactorInputError}</p>}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}

          {/* TAB 2: ACTIVE SESSIONS */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <button 
                  onClick={handleLogoutAllOtherDevices}
                  className="py-1 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10.5px] font-bold rounded-lg border border-red-500/10 transition-all ml-1 cursor-pointer"
                >
                  تسجيل الخروج من كل الأجهزة الأخرى 🔒
                </button>
                <div className="text-right">
                  <h4 className="font-bold text-xs text-white">الأجهزة المصرحة والنشطة</h4>
                  <p className="text-[10px] text-gray-500">الأجهزة المصادق عليها حالياً للوصول للملف والمالية.</p>
                </div>
              </div>

              {/* Masking toggle mechanism - Instruction 8 compliant */}
              {!isAuthorizedToUnmask ? (
                <div className="p-4 bg-orange-950/10 border border-orange-900/30 rounded-2xl text-right text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <button 
                      onClick={initiateIPUnmaskOTP}
                      className="py-1.5 px-3.5 bg-orange-500 text-white font-bold text-[10.5px] rounded-xl hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/15"
                    >
                      كشف معلومات الآي بي (تجاوز فحص OTP) 🔑
                    </button>
                    <div className="flex-1">
                      <p className="font-bold text-orange-400">سياسة حماية الأمن الموحد (بند 8 من لائحة SNNS):</p>
                      <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                        حفاظاً على معلومات الخصوصية والمقررات السيبرانية، تُحجب عناوين الـ IP الحقيقية وتفاصيل الأجهزة عن العامة، ولا تُفرد إلا لإدارة الفايروال (Super Admin) أو بطلب فحص OTP معتمد لمالك الحساب.
                      </p>
                    </div>
                  </div>

                  {/* Drawer OTP Input for unmasking */}
                  <AnimatePresence>
                    {otpForUnmaskSent && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleVerifyUnmaskOTP}
                        className="mt-4 p-3 bg-[#0d0d0d] rounded-xl border border-orange-500/20 space-y-2 text-right"
                      >
                        <p className="text-[10px] text-orange-200">الرجاء إدخال رمز التحقق (OTP) الذي ظهر بالنافذة لتعدي تصنيف الحساب والكشف:</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="6 خانات..."
                            value={unmaskOtpInput}
                            onChange={(e) => setUnmaskOtpInput(e.target.value)}
                            className="bg-neutral-950 border border-white/5 py-1.5 px-3 rounded-lg text-xs text-center font-mono w-40 flex-1"
                          />
                          <button
                            type="submit"
                            className="bg-orange-500 text-white font-bold text-[10.5px] px-4 rounded-lg cursor-pointer"
                          >
                            تخويل واستعراض
                          </button>
                        </div>
                        {unmaskError && <p className="text-[10px] text-red-400">{unmaskError}</p>}
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-3 bg-saudi-green/10 border border-saudi-green/20 rounded-xl text-[10.5px] text-saudi-glow flex justify-between items-center">
                  <span>التخويل نشط: يتم عرض العناوين غير المقنعة الآن بنجاح.</span>
                  <button 
                    onClick={() => setTemporarySecurityApproved(false)} 
                    className="underline text-gray-400 text-[10px] hover:text-white"
                  >
                    إعادة القفل الأمني للخصوصية
                  </button>
                </div>
              )}

              {/* Sessions Ledger list */}
              <div className="space-y-3">
                {sessions.map(sess => (
                  <div key={sess.id} className="p-4 bg-neutral-950/60 border border-white/5 rounded-2xl flex items-center justify-between text-xs hover:bg-neutral-950 transition-all">
                    <div className="flex items-center gap-1.5">
                      {sess.isCurrent ? (
                        <span className="bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 text-[9px] font-bold px-2 py-0.5 rounded-full">الجهاز الحالي</span>
                      ) : (
                        <span className="text-gray-500 text-[9.5px]">جهاز سابق</span>
                      )}
                    </div>

                    <div className="text-right">
                      <h5 className="font-bold text-white flex items-center gap-1.5 justify-end">
                        <span>{sess.deviceName}</span>
                        <span className="text-[10px] text-gray-400 font-normal">({sess.browser})</span>
                      </h5>
                      
                      <div className="flex items-center gap-2 justify-end mt-1 text-[10.5px] text-gray-450 font-mono flex-wrap">
                        <span>{sess.flag} {sess.country}</span>
                        <span>•</span>
                        <span>{sess.countryCode === "SA" ? "الرياض" : "دبي"}</span>
                        <span>•</span>
                        <span className="text-gray-300">{sess.countryCode === "SA" ? "STC Broadband" : "Du Premium Network"}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 bg-neutral-900 border border-white/5 rounded text-[9px] text-gray-400">
                          {sess.countryCode === "SA" ? "ألياف ضوئية - Fiber" : "خلوية - Mobile 5G"}
                        </span>
                        <span>•</span>
                        <span>
                          {isAuthorizedToUnmask ? sess.ip : maskIpAddress(sess.ip)}
                        </span>
                        <span>•</span>
                        <span className="text-gray-500 font-sans">{sess.timestamp}</span>
                        {sess.countryCode !== "SA" && (
                          <span className="bg-red-500/15 border border-red-500/30 text-red-400 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase shrink-0">
                            VPN Detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: SAFETY CHALLENGE / SIMULATION (CAPTCHA & PASSWORDS) */}
          {activeTab === "verify" && (
            <div className="space-y-6">
              
              {/* Interactive Captcha module (Anti-Bruteforce / Rate limiting) */}
              <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl space-y-4">
                <div className="border-b border-white/5 pb-2.5">
                  <h4 className="font-bold text-xs text-neutral-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-saudi-glow" />
                    اختبار الذكاء البشري وحظر الكشط الرياضي (CAPTCHA)
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                    تفرضه الخوادم تلقائياً عند طلب تسجيلات سريعة متكررة أو تخمينات فاشلة متتالية لحماية بوابات الدياجير الرقمية.
                  </p>
                </div>

                {!captchaSolved ? (
                  <form onSubmit={handleVerifyCaptcha} className="space-y-3 max-w-sm mx-auto p-4 bg-neutral-950 rounded-xl border border-white/4">
                    <p className="text-xs text-center text-gray-300">أثبت أنك إنسان لحل المسألة الحسابية التالية:</p>
                    <div className="text-center text-xl font-bold font-mono text-saudi-glow p-2 bg-white/3 rounded-lg border border-white/5">
                      {captchaMathQuestion.q}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        placeholder="أدخل الناتج هنا..."
                        value={captchaAnswerInput}
                        onChange={(e) => setCaptchaAnswerInput(e.target.value)}
                        className="bg-neutral-900 border border-white/5 py-2 px-3 text-center text-xs text-white placeholder-gray-650 rounded-xl flex-1 focus:outline-none focus:border-saudi-green"
                      />
                      <button
                        type="submit"
                        className="bg-saudi-green hover:bg-saudi-green/90 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                      >
                        تحقق من الحل
                      </button>
                    </div>

                    {captchaError && <p className="text-[10px] text-red-400 text-center font-bold mt-1.5">{captchaError}</p>}
                  </form>
                ) : (
                  <div className="p-4 bg-saudi-green/5 border border-saudi-green/15 rounded-xl text-center space-y-2 max-w-sm mx-auto">
                    <div className="w-8 h-8 rounded-full bg-saudi-green/10 flex items-center justify-center mx-auto text-saudi-glow">✓</div>
                    <h5 className="font-bold text-xs text-white">تم التحقق من بشريتك بنجاح</h5>
                    <p className="text-[10px] text-gray-400">يمكنك محاكاة اختبار آخر للحارس عبر النقر أدناه:</p>
                    <button 
                      onClick={generateNewMathCaptcha}
                      className="text-[10px] text-saudi-glow hover:underline mt-1"
                    >
                      تغيير وتجربة مسألة جديدة
                    </button>
                  </div>
                )}
              </div>

              {/* Password change panel */}
              <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                <h4 className="font-bold text-xs text-white pb-2 border-b border-white/5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-saudi-glow" />
                  حماية كلمة مرور الحساب (Force Update Simulation)
                </h4>
                <p className="text-[10px] text-gray-500 mt-1 mb-4 leading-relaxed">
                  إذا واجهت تطفلاً أو شككت في تسريب معلومات من قنوات التواصل، تغيير كلمتك هو الإجابة الأمثل لإلغاء صلاحية الهاكرز.
                </p>

                <form onSubmit={handleSimulatePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">كلمة المرور القديمة</label>
                    <input
                      type="password"
                      required
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-950 border border-white/5 py-2 px-3 text-xs text-white rounded-xl focus:outline-none focus:border-saudi-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">كلمة المرور الجديدة المقترحة</label>
                    <input
                      type="password"
                      required
                      value={newPass}
                      placeholder="الأدنى 6 رموز..."
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/5 py-2 px-3 text-xs text-white rounded-xl focus:outline-none focus:border-saudi-green"
                    />
                  </div>
                  <div className="md:col-span-2 text-left mt-2">
                    <button
                      type="submit"
                      className="py-2 px-4 bg-saudi-green text-white font-bold text-xs rounded-xl hover:bg-saudi-green/90 transition-all cursor-pointer"
                    >
                      تأكيد وحفظ تغيير كلمة المرور
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: THREAT / ROUTINE SECURITY LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-[10px] text-gray-450 font-mono">تتبع الحوادث الأمنية الجارية للحساب</span>
                <h4 className="font-bold text-xs text-white">سجل الدورة ورصد الأخطار الأخير</h4>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 pad">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-550 text-xs">لا توجد سجلات أمان مسجلة باسمك بعد. جرب توليد هجوم من شاشة الإدارة لترى السجلات حية!</div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-3 bg-neutral-950 border border-white/5 rounded-xl hover:border-white/10 transition-all text-xs text-right">
                      <div className="flex justify-between items-center text-[10.5px] text-gray-400 mb-2">
                        <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10 font-bold">
                          {log.riskScore === "extreme" ? "🔴 خطير جداً" : log.riskScore === "high" ? "🟠 مرتفع" : "🟢 روتيني"}
                        </span>
                        <span className="font-mono font-bold text-[9.5px]">{log.timestamp}</span>
                      </div>

                      <p className="text-white leading-relaxed mb-2 font-medium">{log.notes}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0c0c0c] p-2 rounded border border-white/3 text-[10px] text-gray-400 font-mono">
                        <div>
                          <span className="text-gray-550 block text-[8px] font-tajawal">IP المصدر:</span>
                          <span>
                            {isAuthorizedToUnmask ? log.ip : maskIpAddress(log.ip)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-550 block text-[8px] font-tajawal">جهاز الإتصال:</span>
                          <span className="truncate block">
                            {isAuthorizedToUnmask ? log.device : maskDeviceName(log.device)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-550 block text-[8px] font-tajawal">الترتيب الجغرافي:</span>
                          <span className="font-tajawal truncate block">{log.flag} {log.countryName}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 bg-[#0d0d0d] flex justify-between items-center text-xs">
          <span className="text-gray-500">ماتريكس الحارس الذكي يمتثل لقوانين الهيئة الوطنية للامن السيبراني 🇸🇦</span>
          <button 
            onClick={onClose} 
            className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all border border-white/5 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
