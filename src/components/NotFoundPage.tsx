// NotFoundPage.tsx - بوابة الخطأ 404 المخصصة والفاخرة لمنصة SNNS.PRO
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ShieldAlert, Home, LogIn, LayoutDashboard, Crown, AlertOctagon, HelpCircle 
} from "lucide-react";
import { auth, db } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function NotFoundPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Synchronously read role from localStorage fallback for instantaneous page load
    try {
      const savedProfile = localStorage.getItem("snns_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.role === "super_admin" || parsed.role === "admin" || parsed.role === "moderator" || parsed.email === "su66666su@gmail.com") {
          setIsAdmin(true);
        }
      }
    } catch (e) {
      console.warn("Could not parse fall-back profile role:", e);
    }

    // 2. Real-time Firebase Auth subscription for secure dynamic role confirmation
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Double check email override
          if (user.email === "su66666su@gmail.com" || user.email?.toLowerCase().includes("super_admin")) {
            setIsAdmin(true);
          }

          const roleDocRef = doc(db, "user_roles", user.uid);
          const roleSnap = await getDoc(roleDocRef);
          
          if (roleSnap.exists()) {
            const role = roleSnap.data().role || "user";
            if (["moderator", "admin", "super_admin"].includes(role)) {
              setIsAdmin(true);
            }
          }
        } catch (err) {
          console.error("Error reading live role credentials inside 404 portal:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden px-6 py-10 font-tajawal" dir="rtl">
      
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute inset-0 bg-[#020202] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,163,79,0.06)_0%,transparent_70%)] pointer-events-none blur-3xl animate-pulse" />
      
      {/* Decorative Top Neon Line Accent */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-saudi-glow to-transparent shadow-[0_1px_15px_rgba(0,163,79,0.8)]" />

      {/* SNNS.PRO Logo Container */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-2 mb-10 select-none relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-15 bg-gradient-to-br from-saudi-green to-saudi-glow flex items-center justify-center shadow-[0_0_20px_rgba(0,163,79,0.4)] border border-white/10 relative group">
            <span className="font-extrabold text-white text-base font-mono tracking-tighter">S</span>
            <div className="absolute inset-0 rounded-15 border border-saudi-glow/40 animate-ping opacity-25" />
          </div>
          <span className="text-2xl font-black tracking-widest text-white font-mono uppercase">
            SNNS<span className="text-saudi-glow saudi-glow-text">.</span>PRO
          </span>
        </div>
        <div className="px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full text-[9px] uppercase tracking-wider font-mono text-gray-550 ml-1 mt-1">
          Saudi Sovereign Network Security
        </div>
      </motion.div>

      {/* Main Glassmorphism Presentation Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="max-w-md w-full bg-[#070707]/90 border border-white/5 rounded-3xl p-8 md:p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden"
      >
        {/* Abstract Cinematic Warning Hologram */}
        <div className="flex justify-center mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-saudi-green/5 border border-saudi-glow/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,163,79,0.05)] relative animate-pulse">
            <ShieldAlert className="w-11 h-11 text-saudi-glow saudi-glow-text animate-bounce duration-[2000ms]" />
          </div>
          {/* Subtle glowing sparkles */}
          <div className="absolute top-2 right-1/3 w-1.5 h-1.5 rounded-full bg-saudi-glow animate-ping" />
          <div className="absolute bottom-1 left-1/3 w-1 h-1 rounded-full bg-saudi-glow animate-ping delay-500" />
        </div>

        {/* Dynamic Warning Header Code */}
        <span className="text-[11px] font-mono font-extrabold text-saudi-glow tracking-widest uppercase mb-2 block">
          Error Level : 404 / NOT FOUND
        </span>

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mb-3">
          Page Not Found
        </h1>

        {/* Arabic Title */}
        <h2 className="text-sm md:text-base font-bold text-gray-350 tracking-wide mb-4">
          الصفحة غير موجودة
        </h2>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto mb-8 font-tajawal">
          The page you are trying to access does not exist or has been moved.
          <span className="block mt-2 text-[11px] text-gray-500">
            الصفحة التي تحاول الوصول إليها غير موجودة، قد تم تغيير مسار الرابط أو تمت إزالتها كإجراء أمني صادر.
          </span>
        </p>

        {/* Buttons Action Suite */}
        <div className="space-y-3 flex flex-col">
          {/* Back to Home Button */}
          <Link 
            to="/" 
            className="w-full py-3 px-4 bg-gradient-to-r from-saudi-green to-saudi-glow hover:brightness-110 text-white font-extrabold text-xs rounded-xl transition-all duration-300 shadow-md shadow-saudi-green/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>العودة للرئيسية • Back to Home</span>
          </Link>

          {/* Secure Login Entry Button */}
          {!currentUser && (
            <Link 
              to="/secure-access" 
              className="w-full py-3 px-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-saudi-glow/20 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول الرقمي • Login Entrance</span>
            </Link>
          )}

          {/* Admin Control Panel Access if elevated user detected */}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="w-full py-3 px-4 bg-neutral-950 hover:bg-saudi-green/10 border border-saudi-glow/30 text-saudi-glow font-extrabold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,163,79,0.15)] animate-shimmer"
            >
              <LayoutDashboard className="w-4 h-4 text-saudi-glow" />
              <span>بوابة الإدارة العليا • Control Panel</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Elegant Aesthetic Page Footer Branding */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="text-[10px] text-gray-500 font-mono tracking-wider text-center mt-12 relative z-10"
      >
        SNNS.PRO Sovereign Saudi Network • Security Audit Console v2.5
      </motion.p>
    </div>
  );
}
