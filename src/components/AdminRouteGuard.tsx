import React, { useEffect, useState } from "react";
import { ShieldAlert, Lock, RefreshCw, Key, UserCheck, Timer, Sliders, AlertTriangle, ShieldCheck, UserX, LogOut } from "lucide-react";
import { addThreatLog, getDeviceSessions } from "../utils/securityWatchdogStore";

// Let's model the possible roles
export type UserRole = "user" | "creator" | "moderator" | "admin" | "super_admin";

// Role Label Translations
export const ROLE_LABELS: Record<UserRole, string> = {
  user: "مستخدم عادي",
  creator: "صانع محتوى تراثي",
  moderator: "مشرف أمني/محتوى",
  admin: "مدير إداري",
  super_admin: "مدير عام النظام (Super Admin)"
};

// Sub-sections access requirements
export const SECTION_REQUIRED_ROLES: Record<string, UserRole[]> = {
  overview: ["moderator", "admin", "super_admin"],
  users: ["admin", "super_admin"],
  moderators: ["super_admin"],
  premium_handles: ["admin", "super_admin"],
  google_audit: ["moderator", "admin", "super_admin"],
  creators: ["moderator", "admin", "super_admin"],
  lives: ["moderator", "admin", "super_admin"],
  content: ["moderator", "admin", "super_admin"],
  verification: ["moderator", "admin", "super_admin"],
  trusted_badges: ["admin", "super_admin"],
  business: ["admin", "super_admin"],
  countries: ["super_admin"],
  vpn_monitor: ["admin", "super_admin"],
  sentry: ["admin", "super_admin"],
  firebase_config: ["super_admin"],
  wallet: ["admin", "super_admin"],
  reports: ["moderator", "admin", "super_admin"],
  notifications: ["moderator", "admin", "super_admin"],
  system: ["admin", "super_admin"],
  settings: ["super_admin"]
};

// Section Title dictionary in Arabic
export const SECTION_TITLES: Record<string, string> = {
  overview: "لوحة المراقبة العامة والنشاط",
  users: "إدارة أعضاء ومستخدمي المنصة",
  moderators: "المشرفين العامين وتوزيع الصلاحيات المعقدة",
  premium_handles: "تأجير وإدارة المعرفات الفاخرة المعتمدة",
  google_audit: "بوابة مطابقة هويات قوقل الموثقة",
  creators: "إدارة حسابات صناع المحتوى",
  lives: "مراقبة البثوث المباشرة النشطة",
  content: "فلترة وتدقيق الفيديوهات المرفوعة",
  verification: "طلبات التوثيق والهوية المدنية الرسمية",
  trusted_badges: "صرف شارات الموثوقية الخاصة",
  business: "إدارة حسابات المنشآت والقطاع التجاري",
  countries: "الحدود الرقمية وحظر دول الاستهداف السيبراني",
  vpn_monitor: "مراقبة اتصالات VPN وكاشف خوادم البروكسي",
  sentry: "الحارس الذكي المركزي ومستشعرات الخطر",
  firebase_config: "اتصالات قواعد البيانات وسحابة Firebase الأمنية",
  wallet: "المحفظة الرقمية وحركات الدعم المالي",
  reports: "مركز فرز البلاغات والتقارير الطارئة",
  notifications: "إصدار التنبيهات السيبرانية العامة للمستخدمين",
  system: "الأداء السيبراني وحالة سلامة النظام",
  settings: "الإعدادات العامة لمستوى الخطر ومفاتيح الحماية"
};

// Check if role has permission
export function hasPermission(userRole: UserRole, targetSection: string): boolean {
  const allowed = SECTION_REQUIRED_ROLES[targetSection];
  if (!allowed) return true; // fallback
  return allowed.includes(userRole);
}

// Get Active Google Or Local profile role in a robust, safe way
export function getActiveUserRole(): UserRole {
  try {
    const profileSaved = localStorage.getItem("snns_user_profile");
    if (profileSaved) {
      const parsed = JSON.parse(profileSaved);
      // If a simulation role override is active, prioritize it
      const simOverride = localStorage.getItem("snns_simulated_role");
      if (simOverride) return simOverride as UserRole;

      // Translate database role text to system key
      const roleText = parsed.role || "";
      if (roleText === "super_admin" || roleText === "Super Admin" || parsed.email === "su66666su@gmail.com") return "super_admin";
      if (roleText === "admin" || roleText === "Admin") return "admin";
      if (roleText === "moderator" || roleText.includes("Moderator") || roleText === "مشرف") return "moderator";
      if (roleText === "creator" || roleText === "صانع محتوى") return "creator";
    }
  } catch (err) {
    console.warn("Error reading active role, falling back to user", err);
  }
  
  // Try direct simulation fallback if none matches
  const simOverride = localStorage.getItem("snns_simulated_role");
  if (simOverride) return simOverride as UserRole;

  // Default to user
  return "user";
}

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: RouteGuardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Rate limits
  const [rateLimitBlock, setRateLimitBlock] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);

  // Session Expiration
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes count down
  const [simExpiredState, setSimExpiredState] = useState(false);

  // Check state and loop
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // 1. Fetch profile and login session
    const savedProfile = localStorage.getItem("snns_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        setIsLoggedIn(true);

        // Fetch / establish role
        const activeRole = getActiveUserRole();
        setRole(activeRole);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }

    // Initialize session timer once entered
    const sessionStart = sessionStorage.getItem("snns_admin_session_start");
    if (!sessionStart) {
      sessionStorage.setItem("snns_admin_session_start", Date.now().toString());
    }
  }, [refreshTrigger]);

  // Session timer ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      const sessionStartStr = sessionStorage.getItem("snns_admin_session_start");
      if (sessionStartStr) {
        const elapsed = Math.floor((Date.now() - parseInt(sessionStartStr)) / 1000);
        const limit = 300; // 5 mins simulation limit
        const remaining = Math.max(0, limit - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          setSessionExpired(true);
        }
      }
    }, 1000);

    return () => clearInterval(ticker);
  }, []);

  // Rate Limiting monitoring
  useEffect(() => {
    const clickHandler = () => {
      const now = Date.now();
      const clickHistoryStr = sessionStorage.getItem("snns_admin_click_history") || "[]";
      let history = JSON.parse(clickHistoryStr) as number[];
      history.push(now);

      // Keep only last 10 seconds clicks
      history = history.filter(t => now - t < 10000);
      sessionStorage.setItem("snns_admin_click_history", JSON.stringify(history));

      // Trigger Rate Limit lock if clicked more than 8 times in 10 seconds
      if (history.length > 8 && !rateLimitBlock) {
        setRateLimitBlock(true);
        setRateLimitTimer(10);
        
        // Log this rate limit threat
        const currentSession = getDeviceSessions()[0];
        addThreatLog({
          userId: profile?.username || "unauthorized_guest",
          ip: currentSession?.ip || "185.120.44.18",
          countryName: currentSession?.country || "المملكة العربية السعودية",
          countryCode: "SA",
          flag: "🇸🇦",
          device: currentSession?.deviceName || "Unmasked Device client",
          browser: currentSession?.browser || "Browser Engine",
          eventType: "rate_limit",
          riskScore: "high",
          actionTaken: "ip_banned_temp",
          notes: `محاولة إغراق وتكثيف طلبات سريعة على لوحة التحكم العامة لجهة الإدارة بمعدل (${history.length} نرة/١٠ ثوانٍ).`,
          verified: true
        });
      }
    };

    window.addEventListener("click", clickHandler);
    return () => window.removeEventListener("click", clickHandler);
  }, [rateLimitBlock, profile]);

  // Rate Limit timer countdown
  useEffect(() => {
    if (rateLimitBlock && rateLimitTimer > 0) {
      const delay = setTimeout(() => {
        setRateLimitTimer(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(delay);
    } else if (rateLimitTimer === 0) {
      setRateLimitBlock(false);
    }
  }, [rateLimitBlock, rateLimitTimer]);

  // Handle Developer simulated role change
  const handleRoleChange = (targetRole: UserRole) => {
    localStorage.setItem("snns_simulated_role", targetRole);
    // Overwrite the current profile role if profile exists to keep visual consistency
    const savedProfile = localStorage.getItem("snns_user_profile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        parsed.role = targetRole;
        localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
      } catch {}
    }
    setRefreshTrigger(prev => prev + 1);
    
    // Dispatch custom event to notify layout
    window.dispatchEvent(new Event("snns_role_changed"));
  };

  // Renew/Reset Session
  const handleRenewSession = () => {
    sessionStorage.setItem("snns_admin_session_start", Date.now().toString());
    setSessionExpired(false);
    setSimExpiredState(false);
    setTimeLeft(300);
    setRefreshTrigger(prev => prev + 1);
  };

  // Simulate instant expiration
  const handleSimulateExpiration = () => {
    setSessionExpired(true);
    setSimExpiredState(true);
  };

  // Check general dashboard authorization
  const isAuthorized = isLoggedIn && (role === "moderator" || role === "admin" || role === "super_admin");

  // Log unauthorized access attempt if authenticated as normal user or creator
  useEffect(() => {
    if (isLoggedIn && !isAuthorized) {
      const key = `logged_unauth_access_${role}`;
      const alreadyLogged = sessionStorage.getItem(key);
      if (!alreadyLogged) {
        sessionStorage.setItem(key, "true");
        const currentSession = getDeviceSessions()[0];
        addThreatLog({
          userId: profile?.username || "unauthorized_guest",
          ip: currentSession?.ip || "185.120.44.18",
          countryName: currentSession?.country || "المملكة العربية السعودية",
          countryCode: "SA",
          flag: "🇸🇦",
          device: currentSession?.deviceName || "Unmasked Device client",
          browser: currentSession?.browser || "Browser Engine",
          eventType: "unauthorized_admin_access",
          riskScore: "high",
          actionTaken: "captcha_triggered",
          notes: `محاولة غير مصرح بها للعبور إلى لوحة الإدارة العامة ومخازن البيانات الحساسة بواسطة دور (${ROLE_LABELS[role]}).`,
          verified: true
        });
      }
    }
  }, [isLoggedIn, isAuthorized, role, profile]);

  // ========================================================
  // RENDER 1: RATE LIMIT BLOCK
  // ========================================================
  if (rateLimitBlock) {
    return (
      <div className="fixed inset-0 bg-[#050505] text-white z-[10000] flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-red-500/15 to-transparent blur-3xl" />
        <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-8 animate-bounce shadow-[0_0_35px_rgba(239,68,68,0.25)]">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-red-400 mb-4 font-tajawal">🚨 تم قفل المعالجة مؤقتاً (Rate Limit Blocked)</h1>
        <p className="text-gray-400 text-sm max-w-md leading-relaxed mb-6">
          اكتشف حارس الأمان الذكي SNNS Sentry-AI تتابعاً سريعاً ومكثفاً للنقرات والطلبات يُحاكي محاولات تخمين كلمات المرور (Brute Force). تم فرض حظر أمان مؤقت لحماية البيانات.
        </p>
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl py-3 px-8 text-white font-mono text-xl font-black mb-8">
          يرجى إيقاف الطلبات والمحاولة بعد: {rateLimitTimer} ثوانٍ
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">SNNS.PRO SECURITIES PROTOCOL • BANNED TEMPORARILY</p>
      </div>
    );
  }

  // ========================================================
  // RENDER 2: SESSION EXPIRED
  // ========================================================
  if (sessionExpired || simExpiredState) {
    return (
      <div className="fixed inset-0 bg-[#050505] text-white z-[9999] flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-yellow-500/10 to-transparent blur-3xl" />
        <div className="w-20 h-20 bg-yellow-500/15 border border-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">
          <Timer className="w-10 h-10" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-white mb-2 pb-1">انتهت الجلسة، يرجى تسجيل الدخول مجددًا.</h1>
        <p className="text-gray-400 text-xs md:text-sm max-w-md leading-relaxed mb-8">
          من أجل سلامة البيانات وحماية الملف الإداري للمنصة من هجمات اختطاف الجلسات المفتوحة (Session Hijacking)، يتم إلغاء ترخيص لوحة التحكم تلقائياً وتجميد الصلاحيات كل ٥ دقائق.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRenewSession}
            className="py-3 px-8 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-saudi-green/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            تجديد الجلسة وتمديد الترخيص 🔐
          </button>
          <a
            href="/"
            className="py-3 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
          >
            العودة للمنصة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER 3: GUEST LOGGED OUT (Requirement 4)
  // ========================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-saudi-green/5 to-transparent blur-3xl" />
        <div className="w-20 h-20 bg-neutral-900 border border-white/5 rounded-3xl flex items-center justify-center text-saudi-glow mb-6 shadow-[0_0_25px_rgba(0,163,79,0.15)]">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-white mb-2">مكتب الإدارة والامتثال الرقمي المقفل</h1>
        <p className="text-gray-400 text-xs md:text-sm max-w-sm leading-relaxed mb-8">
          الوصول لهذه اللوحة يتطلب إجراء مصادقة مسبقة والربط المضمون بالهوية الوطنية أو حساب Google موثق ومعتمد سيبرانياً.
        </p>

        {/* Guest Simulation Sandbox controls to make testing smooth */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 w-full max-w-md mb-8 text-right">
          <p className="text-[10px] font-bold text-saudi-glow mb-3 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>بوابة فحص الهوية والوصول المباشر (المطورين والمصححين):</span>
          </p>
          <div className="space-y-2.5">
            <button
              onClick={() => {
                const mockAdminProfile = {
                  name: "سليمان العتيبي",
                  username: "su66666su",
                  bio: "مدير عام النظام لـ SNNS.PRO 🇸🇦",
                  location: "الرياض، المملكة العربية السعودية",
                  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
                  cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
                  joinDate: "مايو ٢٠٢٦",
                  isVerified: true,
                  isOnline: true,
                  stats: { followers: "٢.٥ ألف", following: "٨", views: "١٥٠ ألف", coins: 1500, gifts: 0, liveHours: "٠" },
                  creatorStatus: { level: 5, subscription: "بريميوم القطاع الإداري رئيسي", completion: 100 },
                  accountType: "individual",
                  email: "su66666su@gmail.com",
                  phone: "+966505555555",
                  role: "super_admin"
                };
                localStorage.setItem("snns_user_profile", JSON.stringify(mockAdminProfile));
                localStorage.setItem("snns_simulated_role", "super_admin");
                setRefreshTrigger(prev => prev + 1);
              }}
              className="w-full py-2.5 px-4 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <span>تسجيل دخول ومحاكاة دور: مدير عام (Super Admin) 👑</span>
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const mockUserProfile = {
                  name: "عبدالمحسن الخالدي",
                  username: "moh_kh",
                  bio: "عضو عادي نشط 🇸🇦",
                  location: "الدمام، المملكة العربية السعودية",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
                  cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
                  joinDate: "مايو ٢٠٢٦",
                  isVerified: false,
                  isOnline: true,
                  stats: { followers: "٥", following: "٢", views: "١٢", coins: 50, gifts: 0, liveHours: "٠" },
                  creatorStatus: { level: 1, subscription: "بريميوم مجاني", completion: 30 },
                  accountType: "individual",
                  email: "test.user@snns.pro",
                  phone: "+966541112222",
                  role: "user"
                };
                localStorage.setItem("snns_user_profile", JSON.stringify(mockUserProfile));
                localStorage.setItem("snns_simulated_role", "user");
                setRefreshTrigger(prev => prev + 1);
              }}
              className="w-full py-2.5 px-4 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <span>تسجيل دخول ومحاكاة دور: مستخدم عادي (User - Blocked) 🔴</span>
              <UserX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <a
          href="/"
          className="text-xs text-saudi-glow border-b border-saudi-green/30 pb-0.5 hover:text-white hover:border-white transition-all font-bold"
        >
          العودة للواجهة الرئيسية المفتوحة للجميع
        </a>
      </div>
    );
  }

  // ========================================================
  // RENDER 4: LOGGED IN BUT BLOCKED ROLE (Requirement 1, 3)
  // ========================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-red-500/10 to-transparent blur-3xl" />
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-400 mb-6 shadow-[0_0_25px_rgba(239,68,68,0.15)] animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-red-400 mb-2 font-tajawal">عذراً، غير مصرح لك بدخول لوحة الإدارة</h1>
        <p className="text-gray-400 text-xs md:text-sm max-w-sm leading-relaxed mb-6">
          إن حسابك مسجل الآن بالدور الفعلي: <span className="text-red-400 font-bold">({ROLE_LABELS[role]})</span>، وليست لديك الصلاحية الأمنية الكافية للوصول إلى لوحات التحكم الحساسة وسجلات الإدارة لـ SNNS.PRO.
        </p>

        {/* Sandbox Role Switcher directly visible on Blocked state to allow immediate testing! */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 w-full max-w-md mb-8 text-right space-y-3">
          <p className="text-[10.5px] font-bold text-saudi-glow flex items-center gap-1 mb-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>لوحة المطورين: اختبار ترقية وتغيير دور الحساب مرحلياً:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRoleChange("user")}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${role === "user" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-neutral-950 border-white/5 text-gray-400 hover:text-white"}`}
            >
              مستخدم عادي (ممنوع)
            </button>
            <button
              onClick={() => handleRoleChange("creator")}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${role === "creator" ? "bg-orange-500/10 border-orange-500/30 text-orange-450" : "bg-neutral-950 border-white/5 text-gray-400 hover:text-white"}`}
            >
              صانع محتوى (ممنوع)
            </button>
            <button
              onClick={() => handleRoleChange("moderator")}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${role === "moderator" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-neutral-950 border-white/5 text-gray-400 hover:text-white"}`}
            >
              مشرف أمني (مسموح)
            </button>
            <button
              onClick={() => handleRoleChange("admin")}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${role === "admin" ? "bg-green-500/10 border-green-500/30 text-saudi-glow" : "bg-neutral-950 border-white/5 text-gray-400 hover:text-white"}`}
            >
              إداري (مسموح)
            </button>
          </div>
          <button
            onClick={() => handleRoleChange("super_admin")}
            className={`w-full p-2.5 rounded-xl text-xs font-black transition-all border text-center flex items-center justify-center gap-1.5 ${role === "super_admin" ? "bg-saudi-green/10 border-saudi-green/30 text-saudi-glow" : "bg-neutral-950 border-white/5 text-gray-400 hover:text-white"}`}
          >
            <span>👑 ترقية إلى مدير عام النظام (التحكم الكامل)</span>
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              // Sign out from local registry
              localStorage.removeItem("snns_user_profile");
              setRefreshTrigger(prev => prev + 1);
            }}
            className="text-xs text-gray-450 font-bold flex items-center gap-1 hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>تسجيل خروج الحساب الحالي</span>
          </button>
          <span className="text-gray-700">|</span>
          <a
            href="/"
            className="text-xs text-saudi-glow font-bold hover:text-white"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER 5: PERMITTED ACCESS CO-EXIST WITH DEVELOPMENT BAR
  // ========================================================
  return (
    <div className="relative min-h-screen" dir="rtl">
      {/* Real-time Session Status floating telemetry bar for premium user experience */}
      <div className="bg-[#0c0c0c] border-b border-saudi-green/10 text-right px-4 py-2 font-tajawal text-[10.5px] text-gray-400 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between sticky top-0 z-[100] scale-[1]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-saudi-green animate-ping shadow-[0_0_6px_#00A34F]" />
          <span className="font-bold text-gray-350">الترخيص الرقمي النشط:</span>
          <span className="bg-saudi-green/10 border border-saudi-green/20 text-saudi-glow px-1.5 rounded text-[9.5px] font-black">{ROLE_LABELS[role]}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <Timer className="w-3.5 h-3.5 text-yellow-500" />
            <span>جلسة الإدارة الآمنة تموت بعد: </span>
            <span className="text-yellow-500 font-bold select-none">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>

          {/* Tester controls inside Admin page for comfortable debugging! */}
          <div className="hidden sm:flex items-center gap-1.5 border-r border-white/10 pr-4">
            <span className="text-gray-500 font-bold ml-1 text-[9.5px]">تبديل الدور للاختبار:</span>
            {(["moderator", "admin", "super_admin"] as UserRole[]).map(r => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${role === r ? "bg-saudi-green text-white border-saudi-green" : "bg-neutral-950 text-gray-500 border-white/5 hover:text-white"}`}
              >
                {r === "moderator" ? "مشرف" : r === "admin" ? "إداري" : "مدير عام 👑"}
              </button>
            ))}
            <button
              onClick={() => handleRoleChange("user")}
              className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-950 text-red-500 border border-red-500/15 hover:bg-red-500/20 cursor-pointer"
            >
              طرد (User) 🔴
            </button>
          </div>

          <button
            onClick={handleSimulateExpiration}
            className="text-[9.5px] font-bold bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 py-0.5 px-2 rounded cursor-pointer"
            title="اختبار سلوك انتهاء صلاحية الجلسة فجأة"
          >
            ⏳ انتهاء مباغت للامتثال
          </button>
        </div>
      </div>
      
      {/* Real layout child */}
      {children}
    </div>
  );
}
