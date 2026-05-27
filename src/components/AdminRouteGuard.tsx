import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Lock, Loader2, RefreshCw, Key, ShieldCheck, LogOut, Timer } from "lucide-react";
import { auth, db } from "../utils/firebase";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
      const roleText = parsed.role || "";
      if (roleText === "super_admin" || roleText === "Super Admin" || parsed.email === "su66666su@gmail.com") return "super_admin";
      if (roleText === "admin" || roleText === "Admin") return "admin";
      if (roleText === "moderator" || roleText.includes("Moderator") || roleText === "مشرف") return "moderator";
      if (roleText === "creator" || roleText === "صانع محتوى") return "creator";
    }
  } catch (err) {
    console.warn("Error reading active role, falling back to user", err);
  }
  return "user";
}

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: RouteGuardProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [securityLogged, setSecurityLogged] = useState<boolean>(false);

  useEffect(() => {
    // Check authenticity with real Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        
        try {
          // Fetch role from Firestore "user_roles"
          const roleDocRef = doc(db, "user_roles", user.uid);
          const roleSnap = await getDoc(roleDocRef);
          
          let role: UserRole = "user";
          let permissions: string[] = [];
          
          if (roleSnap.exists()) {
            const data = roleSnap.data();
            role = (data.role || "user") as UserRole;
            permissions = data.permissions || [];
          } else if (user.email === "su66666su@gmail.com") {
            // Auto-provision Super Admin inside genuine Firestore database
            role = "super_admin";
            permissions = Object.keys(SECTION_REQUIRED_ROLES);
            await setDoc(roleDocRef, {
              user_id: user.uid,
              role: role,
              permissions: permissions
            });
          }
          
          setUserRole(role);
          
          // Check general dashboard authorization (moderator, admin, super_admin)
          const authorized = ["moderator", "admin", "super_admin"].includes(role);
          setIsAuthorized(authorized);
          
          // Sync profile in local storage to keep client states updated
          const savedProfile = localStorage.getItem("snns_user_profile");
          if (savedProfile) {
            try {
              const parsed = JSON.parse(savedProfile);
              parsed.role = role;
              parsed.email = user.email;
              localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
              window.dispatchEvent(new Event("snns_role_changed"));
            } catch {}
          }
          
          // Log unauthorized access directly inside Firestore security_logs
          if (!authorized && !securityLogged) {
            setSecurityLogged(true);
            const logId = "unauth_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
            
            // Record to Firestore "security_logs"
            await setDoc(doc(db, "security_logs", logId), {
              id: logId,
              user_id: user.uid,
              username: user.displayName || user.email?.split("@")[0] || "unknown",
              email: user.email || "",
              ip: "185.120.44.18", // Typical user geo-referenced Saudi IP
              timestamp: new Date().toISOString(),
              attemptedPath: window.location.pathname,
              role: role,
              riskLevel: "high",
              userAgent: navigator.userAgent,
              countryCode: "SA",
              vpnDetected: false
            });
          }
        } catch (error) {
          console.error("Error checking user roles in Firestore:", error);
          setIsAuthorized(false);
        }
      } else {
        // Not logged in
        setCurrentUser(null);
        setIsAuthorized(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [securityLogged]);

  // ========================================================
  // RENDER 1: LOADING VERIFICATION STATE
  // ========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-saudi-green/10 to-transparent blur-3xl" />
        <div className="relative mb-6">
          <Loader2 className="w-14 h-14 text-saudi-glow animate-spin" />
          <div className="absolute inset-0 w-14 h-14 bg-saudi-glow/10 rounded-full blur-md animate-pulse" />
        </div>
        <h2 className="text-lg font-black tracking-wide text-white mb-2 font-tajawal">جاري فحص رخص الهوية الوطنية والامتثال...</h2>
        <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
          يقوم نظام الحارس الذكي بالتحقق الآمن المباشر من قاعدة البيانات السحابية المركزية لـ SNNS.PRO.
        </p>
      </div>
    );
  }

  // ========================================================
  // RENDER 2: GUEST NOT LOGGED IN -> Redirect to Landing/Login
  // ========================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-red-500/5 to-transparent blur-3xl" />
        <div className="w-20 h-20 bg-neutral-900 border border-white/5 rounded-3xl flex items-center justify-center text-red-500 mb-6 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-white mb-2">مكتب الإدارة والامتثال الرقمي مقفل</h1>
        <p className="text-gray-400 text-xs md:text-sm max-w-md leading-relaxed mb-8">
          يرجى تسجيل الدخول أولاً باستخدام حساب Google المعتمد للمتابعة. جاري تحويلك تلقائياً للواجهة الرئيسية...
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/")}
            className="py-3 px-8 bg-saudi-green hover:bg-saudi-green/90 text-white font-black text-xs rounded-xl shadow-lg shadow-saudi-green/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            الذهاب لصفحة تسجيل الدخول والتوثيق 🇸🇦
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER 3: LOGGED IN BUT UNAUTHORIZED ROLE (user or creator)
  // ========================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-center items-center p-6 text-center font-tajawal relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-red-500/10 to-transparent blur-3xl" />
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-400 mb-6 shadow-[0_0_25px_rgba(239,68,68,0.15)] animate-bounce">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-red-400 mb-2 font-tajawal">غير مصرح بالدخول</h1>
        <p className="text-gray-400 text-xs md:text-sm max-w-md leading-relaxed mb-8">
          إن حسابك مسجل الآن بالدور الفعلي: <span className="text-red-400 font-bold">({ROLE_LABELS[userRole] || userRole})</span>، وليست لديك الصلاحية الأمنية الكافية للوصول إلى لوحات التحكم الحساسة وسجلات الإدارة لـ SNNS.PRO.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => {
              auth.signOut();
              localStorage.removeItem("snns_user_profile");
              window.dispatchEvent(new Event("snns_role_changed"));
              navigate("/");
            }}
            className="text-xs bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-xl text-red-400 font-bold flex items-center gap-1.5 hover:bg-red-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل خروج الحساب الحالي</span>
          </button>
          <span className="text-gray-700 flex items-center">|</span>
          <Link
            to="/"
            className="text-xs text-saudi-glow font-bold hover:text-white flex items-center"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER 4: HIGH SECURITY GRANTED ACCESS VIEW
  // ========================================================
  return (
    <div className="relative min-h-screen" dir="rtl">
      {/* Real-time Session Status floating telemetry bar */}
      <div className="bg-[#0c0c0c] border-b border-saudi-green/10 text-right px-4 py-2 font-tajawal text-[10.5px] text-gray-400 flex flex-wrap gap-x-6 gap-y-2 items-center justify-between sticky top-0 z-[100] scale-[1]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-saudi-green animate-ping shadow-[0_0_6px_#00A34F]" />
          <span className="font-bold text-gray-350">الترخيص الرقمي النشط للديوان العام:</span>
          <span className="bg-saudi-green/10 border border-saudi-green/20 text-saudi-glow px-1.5 rounded text-[9.5px] font-black">{ROLE_LABELS[userRole]}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="text-gray-500 select-none">المسؤول: {currentUser.email}</span>
          </div>
          <button
            onClick={() => {
              auth.signOut();
              localStorage.removeItem("snns_user_profile");
              window.dispatchEvent(new Event("snns_role_changed"));
              navigate("/");
            }}
            className="text-[9.5px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-0.5 px-2 rounded cursor-pointer"
          >
            تسجيل الخروج الآمن 🔒
          </button>
        </div>
      </div>
      
      {/* Real layout child */}
      {children}
    </div>
  );
}
