import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Play, Radio, MessageSquare, CheckCircle, ShieldAlert, 
  Building2, ArrowLeft, ChevronLeft, ArrowRight, UserCheck, 
  Sparkles, Award, Users, ShieldCheck, Heart, Eye, Bell,
  Loader2, CheckCircle2, AlertCircle, Check, User, Phone, Tag, Camera, Shield as ShieldIcon, Globe
} from "lucide-react";
import { auth, googleProvider, signInWithPopup, db, handleFirestoreError, OperationType } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getBusinessAccounts, saveBusinessAccounts } from "../utils/businessStore";

export default function LandingPage() {
  const navigate = useNavigate();
  const [videoError, setVideoError] = useState(false);

  // Auth and profile states
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authLoadingMessage, setAuthLoadingMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  
  // Simulated Google Auth modal fallback (when real sign-in popup blocks inside iframe)
  const [showFallbackPopup, setShowFallbackPopup] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState("su66666su@gmail.com");
  const [simulatedName, setSimulatedName] = useState("سليمان العتيبي");
  const [simulatedAvatar, setSimulatedAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop");

  // Multi-step Onboarding form states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardName, setOnboardName] = useState("");
  const [onboardUsername, setOnboardUsername] = useState("");
  const [onboardPhone, setOnboardPhone] = useState("");
  const [onboardAccountType, setOnboardAccountType] = useState<"individual" | "business">("individual");
  const [onboardAvatar, setOnboardAvatar] = useState("");
  const [onboardError, setOnboardError] = useState("");

  // Check state & Sync on mount using real Firebase Auth and database roles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch role from Firestore "user_roles" collection
          const roleDocRef = doc(db, "user_roles", user.uid);
          const roleSnap = await getDoc(roleDocRef);
          
          let role = "user";
          if (roleSnap.exists()) {
            role = roleSnap.data().role || "user";
          } else if (user.email === "su66666su@gmail.com") {
            role = "super_admin";
          }
          
          const isUserAuthorizedAdmin = ["moderator", "admin", "super_admin"].includes(role);
          setIsAdmin(isUserAuthorizedAdmin);
          
          // Sync profile to local state
          const savedProfile = localStorage.getItem("snns_user_profile");
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            parsed.role = role;
            parsed.email = user.email;
            setActiveProfile(parsed);
          } else {
            // Reconstruct activeProfile from Google user if not logged in
            const newProfileData = {
              name: user.displayName || "مستخدم موثق",
              username: user.email?.split("@")[0] || "member",
              bio: "عضو موثق ومميز في مجتمع منصة التواصل الاجتماعي الفاخرة SNNS.PRO 🇸🇦",
              location: "الرياض، المملكة العربية السعودية",
              avatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
              cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
              joinDate: "مايو ٢٠٢٦",
              isVerified: true,
              isOnline: true,
              stats: { followers: "0", following: "0", views: "0", coins: 1500, gifts: 0, liveHours: "0" },
              creatorStatus: { level: 1, subscription: "بريميوم مجاني", completion: 50 },
              accountType: "individual",
              email: user.email,
              role: role
            };
            localStorage.setItem("snns_user_profile", JSON.stringify(newProfileData));
            setActiveProfile(newProfileData);
          }
        } catch (e) {
          console.error("Error fetching user role on landing page:", e);
          setIsAdmin(false);
          setActiveProfile(null);
        }
      } else {
        setIsAdmin(false);
        setActiveProfile(null);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Real Google Sign-In with robust Fallback for Iframe blocks
  const handleGoogleSignInTrigger = async () => {
    setAuthError("");
    setAuthLoading(true);
    setAuthLoadingMessage("جارٍ المتابعة عبر خوادم Google الدبلوماسية المعتمدة... 🇸🇦");

    try {
      // Try real Google Auth first with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        await processAuthenticatedUser({
          id: "G_" + user.uid,
          name: user.displayName || "مستخدم Google الموثق",
          email: user.email || "",
          avatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
        });
      } else {
        throw new Error("لم يتم استرجاع معلومات المستخدم");
      }
    } catch (err: any) {
      console.warn("Real Google Popup is blocked or disabled inside iframe. Activating safe simulation panel:", err);
      // Give the user a prompt or fallback panel immediately so they is not stuck.
      setTimeout(() => {
        setAuthLoading(false);
        setShowFallbackPopup(true);
      }, 950);
    }
  };

  // Process authenticated metadata
  const processAuthenticatedUser = async (googleUserObj: { id: string; name: string; email: string; avatar: string }) => {
    setAuthLoading(true);
    setAuthLoadingMessage("جارٍ فحص استمارات الديوانية والمطابقة الأمنية... 🛡️");

    // Retrieve global lists
    const savedUsersStr = localStorage.getItem("snns_users_records");
    const usersList = savedUsersStr ? JSON.parse(savedUsersStr) : [];
    
    // Check if user is registered in ordinary records
    const existingUser = usersList.find(
      (u: any) => u.email && u.email.toLowerCase() === googleUserObj.email.toLowerCase()
    );

    // Also search business accounts
    const bizList = getBusinessAccounts();
    const existingBiz = bizList.find(
      (b: any) => b.email && b.email.toLowerCase() === googleUserObj.email.toLowerCase()
    );

    setTimeout(() => {
      setAuthLoading(false);

      if (existingUser) {
        // Build user profile structure
        const profileData = {
          name: existingUser.name,
          username: existingUser.username.startsWith("@") ? existingUser.username : "@" + existingUser.username,
          bio: existingUser.bio || "عضو موثق ومميز في مجتمع منصة التواصل الاجتماعي الفاخرة SNNS.PRO 🇸🇦",
          location: existingUser.location || "الرياض، المملكة العربية السعودية",
          avatar: existingUser.avatar || googleUserObj.avatar,
          cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
          joinDate: existingUser.joinDate || "مايو ٢٠٢٦",
          isVerified: existingUser.verified || true,
          isOnline: true,
          stats: { followers: "١٢٥", following: "١٤", views: "٦٥٠", coins: existingUser.balance || 1500, gifts: 0, liveHours: "٢" },
          creatorStatus: { level: 2, subscription: "بريميوم زائر موثق", completion: 90 },
          accountType: "individual",
          email: existingUser.email,
          phone: existingUser.phone || "0500000000",
          role: existingUser.role || "user"
        };

        finalizeSuccessLogin(profileData);

      } else if (existingBiz) {
        // Build business profile structure
        const profileData = {
          name: existingBiz.businessName,
          username: existingBiz.username.startsWith("@") ? existingBiz.username : "@" + existingBiz.username,
          bio: `${existingBiz.businessType === "company" ? "شركة" : "مؤسسة"} رسمية موثقة ومعتمدة سحابياً 🇸🇦`,
          location: existingBiz.address || "المملكة العربية السعودية",
          avatar: existingBiz.logoUrl || googleUserObj.avatar,
          cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
          joinDate: "مايو ٢٠٢٦",
          isVerified: existingBiz.verificationStatus === "approved",
          isOnline: true,
          stats: { followers: "٢.٥ ألف", following: "١٥", views: "٨٠ ألف", coins: 0, gifts: 0, liveHours: "٠" },
          creatorStatus: { level: 5, subscription: "بريميوم القطاع التجاري المعتمد", completion: 100 },
          accountType: "business",
          businessDetails: existingBiz,
          email: existingBiz.email,
          phone: existingBiz.phone || "0550000000",
          role: "user"
        };

        finalizeSuccessLogin(profileData);

      } else {
        // Open Onboarding directly!
        setOnboardEmail(googleUserObj.email);
        setOnboardName(googleUserObj.name);
        
        // Auto generate suggestions for username
        const cleanEmailPrefix = googleUserObj.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
        setOnboardUsername(cleanEmailPrefix);
        
        setOnboardAvatar(googleUserObj.avatar);
        setOnboardPhone("");
        setOnboardAccountType("individual");
        setOnboardError("");
        setShowOnboarding(true);
      }
    }, 1000);
  };

  // Submit onboarding details
  const handleOnboardFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError("");

    // Validate Username
    const cleanUsername = onboardUsername.trim().replace("@", "");
    if (!cleanUsername || cleanUsername.length < 3) {
      setOnboardError("يجب أن يحتوي المعرف (@username) على ٣ أحرف أو أرقام على الأقل.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setOnboardError("المعرف يجب أن يتوفر على أحرف إنجليزية وأرقام أو علامة شرطة سفلية (_) فقط.");
      return;
    }

    // Validate unique username
    const savedUsersStr = localStorage.getItem("snns_users_records");
    const usersList = savedUsersStr ? JSON.parse(savedUsersStr) : [];
    const isUsernameTaken = usersList.some(
      (u: any) => u.username && u.username.toLowerCase().replace("@", "") === cleanUsername.toLowerCase()
    );
    if (isUsernameTaken) {
      setOnboardError("عذراً، هذا المعرف (@username) محجوز لـ ديوانية أخرى نشطة.");
      return;
    }

    // Validate Saudi Phone Format
    const phoneInput = onboardPhone.trim();
    const saudiPhoneRegex = /^(05|5|\+9665)[0-9]{8}$/;
    if (!saudiPhoneRegex.test(phoneInput)) {
      setOnboardError("الرجاء إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من ١٠ أرقام.");
      return;
    }

    // Process and finalize onboarding
    const finalUsername = "@" + cleanUsername;
    
    // Save new record back to records database
    if (onboardAccountType === "individual") {
      const newUserRecord = {
        name: onboardName,
        username: finalUsername,
        email: onboardEmail,
        phone: phoneInput,
        joinedOn: new Date().toISOString(),
        verified: true,
        role: "user",
        balance: 1500,
        status: "نشط",
        avatar: onboardAvatar
      };
      const updatedList = [...usersList, newUserRecord];
      localStorage.setItem("snns_users_records", JSON.stringify(updatedList));

      const profileData = {
        name: onboardName,
        username: finalUsername,
        bio: "ديوانية فخمة تم توثيقها والإنضمام عبر الهوية السحابية المعتمدة لـ Google في SNNS.PRO 🇸🇦",
        location: "المملكة العربية السعودية",
        avatar: onboardAvatar,
        cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
        joinDate: "مايو ٢٠٢٦",
        isVerified: true,
        isOnline: true,
        stats: { followers: "٠", following: "٠", views: "١", coins: 1500, gifts: 0, liveHours: "٠" },
        creatorStatus: { level: 1, subscription: "بريميوم عضو جديد", completion: 60 },
        accountType: "individual",
        email: onboardEmail,
        phone: phoneInput,
        role: "user"
      };

      finalizeSuccessLogin(profileData);

    } else {
      // Create commercial record
      const newBizRecord: any = {
        id: "biz_" + Math.floor(1000 + Math.random() * 9000),
        username: finalUsername,
        email: onboardEmail,
        phone: phoneInput,
        businessName: onboardName,
        activityType: "خدمات ترفيه وعلاقات مجتمعية",
        crNumber: "CR-" + Math.floor(1000000 + Math.random() * 9000000),
        crDocumentUrl: "data:application/pdf;base64,VEVTVF9CRVNU",
        crDocumentName: "سجل_تجاري_معتمد.pdf",
        officialMobile: phoneInput,
        officialEmail: onboardEmail,
        address: "المملكة العربية السعودية",
        website: "https://snns.pro",
        logoUrl: onboardAvatar,
        managerName: onboardName,
        registrationDate: new Date().toISOString().split('T')[0],
        status: "active",
        verificationStatus: "approved",
        businessType: "company"
      };

      const bizList = getBusinessAccounts();
      const updatedBizList = [...bizList, newBizRecord];
      saveBusinessAccounts(updatedBizList);

      const profileData = {
        name: onboardName,
        username: finalUsername,
        bio: "سجل تجاري إلكتروني موثق بمزاولة البث الرقمي المعتمد لـ SNNS.PRO 🇸🇦",
        location: "المملكة العربية السعودية",
        avatar: onboardAvatar,
        cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&fit=crop",
        joinDate: "مايو ٢٠٢٦",
        isVerified: true,
        isOnline: true,
        stats: { followers: "١٠", following: "٠", views: "١٥", coins: 0, gifts: 0, liveHours: "٠" },
        creatorStatus: { level: 2, subscription: "بريميوم تجاري معتمد", completion: 80 },
        accountType: "business",
        businessDetails: newBizRecord,
        email: onboardEmail,
        phone: phoneInput,
        role: "user"
      };

      finalizeSuccessLogin(profileData);
    }

    setShowOnboarding(false);
  };

  // Helper finalized success handling - with real database provisioning
  const finalizeSuccessLogin = async (profileObj: any) => {
    // 1. Ensure Firebase Auth contains the user session!
    let loggedUser = auth.currentUser;
    if (!loggedUser) {
      try {
        // Sign in anonymously to back their session with a genuine Firebase user
        const { signInAnonymously } = await import("firebase/auth");
        const cred = await signInAnonymously(auth);
        loggedUser = cred.user;
      } catch (err) {
        console.error("Error signing in anonymously for iframe fallback:", err);
      }
    }

    if (loggedUser) {
      // 2. Provision the user_role and user profile inside the real Firestore databases!
      try {
        const { setDoc, doc } = await import("firebase/firestore");
        const role = profileObj.role || "user";
        
        // Setup permissions
        let permissions: string[] = [];
        if (role === "super_admin") {
          permissions = ["overview", "users", "moderators", "premium_handles", "google_audit", "creators", "lives", "content", "verification", "trusted_badges", "business", "countries", "vpn_monitor", "sentry", "firebase_config", "wallet", "reports", "notifications", "system", "settings"];
        } else if (role === "admin") {
          permissions = ["overview", "users", "premium_handles", "google_audit", "creators", "lives", "content", "verification", "trusted_badges", "business", "vpn_monitor", "sentry", "wallet", "reports", "notifications", "system"];
        } else if (role === "moderator") {
          permissions = ["overview", "google_audit", "creators", "lives", "content", "verification", "reports", "notifications"];
        }

        // Save to user_roles
        try {
          await setDoc(doc(db, "user_roles", loggedUser.uid), {
            user_id: loggedUser.uid,
            role: role,
            permissions: permissions
          });
          console.log("Successfully wrote user_role to Firestore:", loggedUser.uid);
        } catch (roleErr) {
          console.error("Could not write role to user_roles collection in Firestore:", roleErr);
          handleFirestoreError(roleErr, OperationType.WRITE, `user_roles/${loggedUser.uid}`);
        }

        // Save to users
        try {
          await setDoc(doc(db, "users", loggedUser.uid), {
            id: loggedUser.uid,
            name: profileObj.name,
            username: profileObj.username,
            bio: profileObj.bio || "",
            location: profileObj.location || "",
            avatar: profileObj.avatar || "",
            cover: profileObj.cover || "",
            joinDate: profileObj.joinDate || "",
            role: role,
            email: profileObj.email || "",
            phone: profileObj.phone || ""
          });
          console.log("Successfully wrote user profile to Firestore:", loggedUser.uid);
        } catch (profileErr) {
          console.error("Could not write profile to users collection in Firestore:", profileErr);
          handleFirestoreError(profileErr, OperationType.WRITE, `users/${loggedUser.uid}`);
        }
      } catch (err) {
        console.error("Could not write role/profile to Firestore:", err);
      }
    }

    localStorage.setItem("snns_user_profile", JSON.stringify(profileObj));
    localStorage.setItem("snns_google_user", JSON.stringify({
      id: loggedUser ? loggedUser.uid : "G_PRESET_" + Math.floor(1000 + Math.random() * 9000),
      name: profileObj.name,
      email: profileObj.email,
      avatar: profileObj.avatar
    }));

    // Trigger visual success screen directly
    setShowSuccessAnim(true);

    setTimeout(() => {
      // Trigger general listeners to sync and update components across system
      window.dispatchEvent(new Event("snns_role_changed"));
      window.dispatchEvent(new Event("storage"));

      setShowSuccessAnim(false);
      
      // Redirect to profile
      const rawUser = profileObj.username.replace("@", "");
      navigate("/" + rawUser);
    }, 2000);
  };

  // Clear Session Logout Helper 
  const handleClearLogout = () => {
    localStorage.removeItem("snns_user_profile");
    localStorage.removeItem("snns_google_user");
    window.dispatchEvent(new Event("snns_role_changed"));
    window.dispatchEvent(new Event("storage"));
    setActiveProfile(null);
    setIsAdmin(false);
  };

  // Saudi Inspired Featured Live Broadcasts
  const featuredLives = [
    {
      id: "live_1",
      title: "توثيق حي لمعالم الدرعية التاريخية وحي الطريف 🇸🇦",
      creator: "سليمان العتيبي",
      username: "su66666su",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      viewers: "٣.٢ ألف",
      location: "الدرعية، الرياض",
      cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=600&fit=crop"
    },
    {
      id: "live_2",
      title: "بحر الحكايات وجلسة الفلكلور والتراث الموسيقي القديم 🎵",
      creator: "سارة العبدالله",
      username: "sara_a",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      viewers: "١.٨ ألف",
      location: "البلد، جدة التاريخية",
      cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&fit=crop"
    }
  ];

  const creators = [
    { name: "سليمان العتيبي", username: "@su66666su", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", role: "موثق آثار" },
    { name: "سارة العبدالله", username: "@sara_a", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", role: "صانعة أفلام تراثية" },
    { name: "عبدالله الشمري", username: "@abdullah_sh", avatar: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop", role: "فارس وخيال" },
  ];

  const features = [
    { icon: <Radio className="w-5 h-5 text-saudi-glow" />, title: "بث مباشر سينمائي", desc: "نظام بث نقي وبجودة عالية لمشاركة الفعاليات والتراث مباشرة وبدون تقطيع." },
    { icon: <MessageSquare className="w-5 h-5 text-saudi-glow" />, title: "دردشة أمنية خاصة", desc: "تواصل اجتماعي مشفر يضمن خصوصيتك التامة، مع الحماية من المحتوى الاحتيالي." },
    { icon: <CheckCircle className="w-5 h-5 text-saudi-glow" />, title: "توثيق حسابات حكومي", desc: "تحقق بيومتري وسيبراني يمنح ديوانيتك علامة التوثيق السعودية المعتمدة." },
    { icon: <Award className="w-5 h-5 text-saudi-glow" />, title: "محتوى عربي أصيل", desc: "منصة مخصصة لثقافتنا وقيمنا وتاريخنا العريق، بعيداً عن التشويش الخارجي." },
    { icon: <ShieldAlert className="w-5 h-5 text-saudi-glow" />, title: "حارس رقمي وحماية", desc: "رصد فوري وحظر فوري لعنوان IP المشبوه وحماية كاملة مدعومة بالذكاء الرقمي." },
    { icon: <Building2 className="w-5 h-5 text-saudi-glow" />, title: "إعلانات وبوابة أعمال", desc: "بوابة متكاملة للمؤسسات لترويج فعالياتها وتوثيق السجلات التجارية فورياً." }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-tajawal relative overflow-x-hidden selection:bg-saudi-green selection:text-white" dir="rtl">
      
      {/* Absolute Header Branding */}
      <header className="absolute top-0 left-0 right-0 z-50 h-20 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#00843D] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,132,61,0.4)] border border-saudi-glow/20">
            <span className="font-sans font-black text-white text-base tracking-tighter">S</span>
          </div>
          <span className="font-sans font-black text-white text-lg tracking-wider">SNNS<span className="text-saudi-glow">.PRO</span></span>
        </div>

        {activeProfile ? (
          <Link 
            to={`/${activeProfile.username.replace("@", "")}`} 
            className="text-[10px] md:text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5"
          >
            <img src={activeProfile.avatar} alt="" className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
            <span>ديوانيتي الشخصية</span>
          </Link>
        ) : (
          <button 
            onClick={handleGoogleSignInTrigger}
            className="text-[10px] md:text-xs font-bold bg-[#030303]/80 border border-white/10 hover:border-saudi-green/45 hover:shadow-[0_0_15px_rgba(0,163,79,0.15)] text-gray-200 px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>دخول سريع</span>
          </button>
        )}
      </header>

      {/* Cinematic Full Header Video Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Dynamic Background Video/Image Block */}
        <div className="absolute inset-0 z-0">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover scale-105 pointer-events-none transition-opacity duration-1000 opacity-40 mix-blend-lighten"
            >
              <source src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b9e28d183b91ec65aa04001d5&profile_id=139&oauth2_token_id=57447761" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-sandy-desert-landscape-with-mountains-42289-large.mp4" type="video/mp4" />
            </video>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1600&fit=crop)' }}
            />
          )}

          {/* High-quality Deep Dark Gradients Over Video */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-radial-at-c from-saudi-green/10 via-transparent to-transparent opacity-60" />
        </div>

        {/* Content Centered Over Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col justify-center items-center pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/25 text-amber-500 px-4 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide mb-6 shadow-[0_4px_12px_rgba(245,158,11,0.05)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span>صناعة سعودية • بث حي مباشر • بيئة رقمية موثوقة</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight font-tajawal"
          >
            SNNS<span className="text-saudi-glow">.PRO</span>
            <span className="block text-xl sm:text-3xl md:text-4xl mt-3 text-gray-150 font-medium">منصة البث والتواصل السعودية الحديثة</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-xs sm:text-base md:text-lg text-gray-450 leading-relaxed mt-6 max-w-2xl font-normal text-gray-400 px-4"
          >
            شارك هيبتك ولحظاتك، ابث قصصك التراثية واليومية، واكتشف محتوى عربي وسعودي فخم ومحمي بجودة سينمائية فائقة تليق بك.
          </motion.p>

          {/* Golden & Saudi Green Clean Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="flex flex-col items-center gap-4 mt-8 w-full max-w-lg px-6 justify-center"
          >
            <div className="flex flex-col sm:flex-row gap-3.5 w-full justify-center">
              <button 
                onClick={() => {
                  if (activeProfile) {
                    navigate("/" + activeProfile.username.replace("@", ""));
                  } else {
                    handleGoogleSignInTrigger();
                  }
                }}
                className="px-8 h-12 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(0,132,61,0.3)] ring-2 ring-saudi-glow/20 shrink-0 select-none"
              >
                <span>{activeProfile ? "انتقل إلى ديوانيتك الشخصية" : "ابدأ الآن واستكشف ديوانيتك"}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <a 
                href="#featured-broadcasts"
                className="px-6 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-saudi-glow fill-saudi-glow/10" />
                <span>مشاهدة البثوث الحية</span>
              </a>
            </div>

            {/* Google Apple-glass premium button */}
            {!activeProfile ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleGoogleSignInTrigger}
                className="w-full max-w-xs h-12 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-saudi-green/45 hover:shadow-[0_0_20px_rgba(0,163,79,0.25)] text-white text-xs font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer shadow-lg"
              >
                {/* Official Google Vector Icon */}
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>المتابعة باستخدام Google</span>
              </motion.button>
            ) : (
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصل كـ: {activeProfile.name}</span>
                </span>
                <button 
                  onClick={handleClearLogout}
                  className="text-red-400 hover:text-red-350 hover:underline transition-all font-bold cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Floating Ambient Light */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 text-gray-500 animate-bounce pointer-events-none">
          <span className="text-[9px] font-sans tracking-widest uppercase">اكتشف الأسفل</span>
          <div className="w-1.5 h-6 bg-gradient-to-b from-saudi-green to-transparent rounded-full" />
        </div>
      </section>

      {/* Featured Live Streams (البثوث المباشرة المميزة) */}
      <section id="featured-broadcasts" className="py-20 max-w-5xl mx-auto px-6 relative z-10 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 text-right">
          <div>
            <div className="flex items-center gap-2 mb-1 justify-start">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-saudi-glow">مباشر الآن</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">البثوث المباشرة المميزة</h2>
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            بثوث سينمائية تنقل لك عبق التراث والأصالة السعودية من مختلف مناطق ومدن المملكة الغالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredLives.map((live, idx) => (
            <div 
              key={live.id} 
              onClick={() => navigate(`/@${live.username}`)}
              className="bg-white/[0.01] border border-white/5 rounded-3xl p-4 cursor-pointer hover:border-saudi-green/45 transition-all duration-300 group overflow-hidden relative"
            >
              {/* Cover with simulated play button */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden relative mb-4 bg-black">
                <img 
                  src={live.cover} 
                  alt={live.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Stats overlays */}
                <div className="absolute top-3 right-3 bg-red-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span> مباشر </span>
                </div>

                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-gray-200.text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3 text-saudi-glow" />
                  <span>{live.viewers} مشاهد</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-saudi-green/90 group-hover:bg-saudi-glow rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white shrink-0 mr-0.5" />
                  </div>
                </div>
              </div>

              {/* Creator Metadata Row */}
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <img src={live.avatar} alt={live.creator} className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                  <div className="text-right">
                    <p className="text-xs font-black text-white flex items-center gap-1">
                      <span>{live.creator}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-saudi-glow fill-saudi-glow/10" />
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">@{live.username}</p>
                  </div>
                </div>

                <span className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded text-gray-400 font-bold">
                  📍 {live.location}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-3 text-right leading-relaxed group-hover:text-saudi-glow transition-colors">
                {live.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="py-16 bg-white/[0.01] border-y border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white mb-2">كبار منشئي المحتوى وصناع التراث</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-10">
            رواة، مؤرخون، وفنانون سعوديون يشاركونك روايات الأصالة والتراث الإنساني عبر بث صلب وآمن.
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            {creators.map((c, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/${c.username}`)}
                className="flex flex-col items-center hover:opacity-90 cursor-pointer transition-opacity group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/5 group-hover:border-saudi-green/40 p-1 bg-black transition-colors">
                  <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <h4 className="text-xs font-black text-gray-200 mt-3 group-hover:text-saudi-glow flex items-center gap-1">
                  <span>{c.name}</span>
                  <CheckCircle className="w-3 h-3 text-saudi-glow" />
                </h4>
                <p className="text-[9px] text-gray-500 font-mono">{c.username}</p>
                <p className="text-[9px] font-bold text-saudi-glow mt-1 bg-saudi-green/5 border border-saudi-green/10 px-2 py-0.5 rounded-full">{c.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brief Core Features Grid */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white">مميزات منصة SNNS.PRO الفخمة</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
            تم هندسة وتصميم كل ميزة بعناية فائقة لتعكس الرفاهية والأمان السيبراني المتناغم.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={i}
              className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-saudi-green/20 transition-all duration-300 text-right"
            >
              <div className="w-10 h-10 rounded-2xl bg-saudi-green/10 border border-saudi-green/20 flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,132,61,0.05)]">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pure Call-to-Action Join Section */}
      <section className="py-20 bg-gradient-to-t from-[#010101] via-transparent to-transparent relative z-10 text-center px-4">
        <div className="max-w-2xl mx-auto border border-white/5 bg-white/[0.01] p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-saudi-green opacity-5 blur-[60px] pointer-events-none" />
          
          <h2 className="text-2xl md:text-3.5xl font-black text-white">انضم إلى ديوانيتك الفاخرة الرقمية اليوم</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mt-4">
            تواصل، تصفح، وبث محتواك وعالمك في منصة تفاعلية تجسد قوة الأمان والسيادة التقنية السعودية المصقولة.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button 
              onClick={() => {
                if (activeProfile) {
                  navigate("/" + activeProfile.username.replace("@", ""));
                } else {
                  handleGoogleSignInTrigger();
                }
              }}
              className="px-8 h-12 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-black rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <span>{activeProfile ? "دخول ديوانيتي الشخصية 🇸🇦" : "دخول ديوانيتي الافتراضية 🇸🇦"}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Simple Clean Premium Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-[10px] text-gray-650 text-gray-600 font-mono relative z-20">
        <p className="tracking-wide">SNNS.PRO Premium Saudi Platforms Console V2.1 • © 2026</p>
      </footer>

      {/* ─── MODAL OVERLAY PORTALS AND ANIMATIONS ─── */}
      <AnimatePresence>
        {/* 1. Global Authentication / Loading Spinner Overlay */}
        {authLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-center"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-sm w-full bg-[#080808] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,132,61,0.15)] flex flex-col items-center"
            >
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-16 h-16 rounded-full border border-saudi-green/10 animate-ping" />
                <div className="w-12 h-12 rounded-2xl bg-saudi-green/10 border border-saudi-green/25 flex items-center justify-center text-saudi-glow">
                  <Loader2 className="w-6 h-6 animate-spin text-saudi-glow" />
                </div>
              </div>

              <h3 className="text-base font-black text-white mb-2">تسجيل الدخول عبر Google</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs">
                {authLoadingMessage || "جارٍ تسجيل الدخول..."}
              </p>
              
              <p className="text-[10px] text-gray-600 font-mono mt-6 uppercase tracking-wider">
                SNNS.PRO Secure Auth Sockets V2
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* 2. Interactive Google Fallback Simulator Modal */}
        {showFallbackPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-right"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-md w-full bg-[#090909] border border-white/10 rounded-3rem rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(0,163,79,0.2)] overflow-hidden relative"
            >
              {/* Premium Background Accent */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-saudi-green opacity-5 blur-[50px] pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#4285F4]/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="text-xs font-black text-gray-300">منفذ المصادقة الموحد لـ Google</span>
                </div>
                <button 
                  onClick={() => setShowFallbackPopup(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <span className="text-[10px] text-amber-500 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block mb-3 animate-pulse">
                  🛡️ بيئة المعاينة الفورية للأمان
                </span>
                <h3 className="text-lg font-black text-white">تسجيل الدخول التفاعلي لـ Google</h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-2.5">
                  تم رصد قيود حظر الإطارات المتداخلة (iFrame Sandbox) في متصفحك الحالي التي تمنع فتح النوافذ المنبثقة التابعة لـ Google. الرجاء إكمال استخدام الهوية عبر خوض المحاكي الآمن أدناه:
                </p>
              </div>

              {/* Account Quick Select presets or Manual entry */}
              <div className="space-y-3.5">
                <label className="text-[10px] text-gray-500 font-bold block">اختر مستند هوية معتمد أو اكتب بياناتك للمتابعة:</label>
                
                {/* Simulated profiles list */}
                <div 
                  onClick={() => {
                    setSimulatedName("سليمان العتيبي");
                    setSimulatedEmail("su66666su@gmail.com");
                    setSimulatedAvatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop");
                  }}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    simulatedEmail === "su66666su@gmail.com" 
                      ? "bg-saudi-green/10 border-saudi-green/45 shadow-[0_4px_12px_rgba(0,132,61,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-white flex items-center gap-1">
                        <span>سليمان العتيبي</span>
                        <span className="text-[9px] bg-red-500/35 border border-red-500/40 text-[9px] text-white px-2 py-0.1 rounded font-bold">المشرف العام (Admin)</span>
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">su66666su@gmail.com</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${simulatedEmail === "su66666su@gmail.com" ? "border-saudi-green bg-saudi-green" : "border-white/20"}`}>
                    {simulatedEmail === "su66666su@gmail.com" && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setSimulatedName("عبدالمحسن الخالدي");
                    setSimulatedEmail("abdulmohsen@gmail.com");
                    setSimulatedAvatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop");
                  }}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    simulatedEmail === "abdulmohsen@gmail.com" 
                      ? "bg-saudi-green/10 border-saudi-green/45 shadow-[0_4px_12px_rgba(0,132,61,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-white">عبدالمحسن الخالدي (فردي)</p>
                      <p className="text-[10px] text-gray-500 font-mono">abdul_kh@gmail.com</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${simulatedEmail === "abdulmohsen@gmail.com" ? "border-saudi-green bg-saudi-green" : "border-white/20"}`}>
                    {simulatedEmail === "abdulmohsen@gmail.com" && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setSimulatedName("مؤسسة تراث الجزيرة التجارية");
                    setSimulatedEmail("aljazeera_corp@gmail.com");
                    setSimulatedAvatar("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop");
                  }}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                    simulatedEmail === "aljazeera_corp@gmail.com" 
                      ? "bg-saudi-green/10 border-saudi-green/45 shadow-[0_4px_12px_rgba(0,132,61,0.1)]" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-saudi-green/10 flex items-center justify-center border border-saudi-green/20 text-saudi-glow font-black shrink-0">
                      T
                    </div>
                    <div>
                      <p className="text-xs font-black text-white flex items-center gap-1">
                        <span>مؤسسة تراث الجزيرة</span>
                        <span className="text-[9px] bg-saudi-green/30 border border-saudi-green/40 text-[9px] text-saudi-glow px-1.5 py-0.1 rounded font-bold">تجاري</span>
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">aljazeera_corp@gmail.com</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${simulatedEmail === "aljazeera_corp@gmail.com" ? "border-saudi-green bg-saudi-green" : "border-white/20"}`}>
                    {simulatedEmail === "aljazeera_corp@gmail.com" && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                  </div>
                </div>

                {/* Custom inputs */}
                <div className="border border-white/5 rounded-xl p-3.5 bg-white/[0.01]">
                  <p className="text-[10px] text-gray-400 font-black mb-2 flex items-center gap-1">
                    <span>أو كتابة حساب مخصص بالكامل (لتجربة حساب جديد)</span>
                  </p>
                  
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      value={simulatedName}
                      onChange={(e) => setSimulatedName(e.target.value)}
                      placeholder="الاسم الكامل لـ الحساب"
                      className="w-full h-8 bg-black border border-white/5 focus:border-saudi-green/50 px-2.5 rounded-lg text-xs font-bold text-white outline-none placeholder:text-gray-600"
                    />
                    <input 
                      type="email" 
                      value={simulatedEmail}
                      onChange={(e) => setSimulatedEmail(e.target.value)}
                      placeholder="البريد الإلكتروني"
                      className="w-full h-8 bg-black border border-white/5 focus:border-saudi-green/50 px-2.5 rounded-lg text-xs font-bold text-white outline-none placeholder:text-gray-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Accept & Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    setShowFallbackPopup(false);
                    // Open Processing immediately with prefilled
                    processAuthenticatedUser({
                      id: "G_SIM_" + Math.floor(1000 + Math.random() * 9000),
                      name: simulatedName,
                      email: simulatedEmail,
                      avatar: simulatedAvatar
                    });
                  }}
                  className="flex-1 h-11 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(0,132,61,0.2)]"
                >
                  <span>متابعة تسجيل الدخول الآمن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowFallbackPopup(false)}
                  className="px-4 h-11 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 3. Sleek Apple-Minimal Profile Onboarding Completion Modal */}
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 text-right"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="max-w-md w-full bg-[#070707] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,132,61,0.25)] relative overflow-hidden"
            >
              {/* Decorative Subtle Glowing Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-saudi-green opacity-5 blur-[60px] pointer-events-none" />

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-saudi-green/10 flex items-center justify-center text-saudi-glow border border-saudi-green/20">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">إكمال تهيئة الحساب السحابي</h3>
                    <p className="text-[9px] text-gray-500 font-bold">يرجى تعبئة الحقول للتسجيل لأول مرة في مجتمعنا</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOnboarding(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* User Identity Draft Row */}
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-3.5">
                <img src={onboardAvatar} alt="" className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-white">{onboardName}</h4>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{onboardEmail}</p>
                </div>
              </div>

              {onboardError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-relaxed flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{onboardError}</span>
                </div>
              )}

              <form onSubmit={handleOnboardFormSubmit} className="space-y-4">
                
                {/* ACCOUNT TYPE */}
                <div>
                  <label className="text-[11px] text-gray-400 font-bold block mb-2">نوع التسجيل والبيئة الرعوية</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOnboardAccountType("individual")}
                      className={`h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        onboardAccountType === "individual" 
                          ? "bg-saudi-green/15 border-saudi-green text-white shadow-[0_2px_10px_rgba(0,132,61,0.1)]" 
                          : "bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>حساب فردي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnboardAccountType("business")}
                      className={`h-11 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        onboardAccountType === "business" 
                          ? "bg-saudi-green/15 border-saudi-green text-white shadow-[0_2px_10px_rgba(0,132,61,0.1)]" 
                          : "bg-white/[0.01] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>حساب تجاري / منشأة</span>
                    </button>
                  </div>
                </div>

                {/* USERNAME / IDENTIFIER */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] text-gray-400 font-bold">المعرف الرقمي الفريد (@username)</label>
                    <span className="text-[9px] text-gray-500">مطلوب • أحرف وأرقام إنجليزية</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      dir="ltr"
                      required
                      value={onboardUsername}
                      onChange={(e) => setOnboardUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="e.g. su66666su"
                      className="w-full h-11 bg-black border border-white/15 focus:border-saudi-green/50 px-3 pl-7 rounded-xl text-xs font-extrabold text-white outline-none font-mono"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center justify-center text-gray-500 font-mono text-xs select-none pointer-events-none">
                      @
                    </div>
                  </div>
                </div>

                {/* PHONE NUMBER */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] text-gray-400 font-bold">رقم الجوال المدني السعودي</label>
                    <span className="text-[9px] text-gray-500">مثال: 05xxxxxxxx</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="tel"
                      dir="ltr"
                      required
                      pattern="^(05|5|\+9665)[0-9]{8}$"
                      value={onboardPhone}
                      onChange={(e) => setOnboardPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      placeholder="05xxxxxxxx"
                      className="w-full h-11 bg-black border border-white/15 focus:border-saudi-green/50 px-3.5 rounded-xl text-xs font-mono font-extrabold text-white outline-none"
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center justify-center text-gray-500 pointer-events-none text-xs">
                      🇸🇦
                    </div>
                  </div>
                </div>

                {/* OPTIONAL AVATAR PRESETS IMAGES */}
                <div>
                  <label className="text-[11px] text-gray-400 font-bold block mb-1.5">الصورة الرمزية المعتمدة</label>
                  <div className="flex gap-2.5 items-center">
                    <img src={onboardAvatar} alt="" className="w-10 h-10 rounded-full border border-saudi-green/30 object-cover shrink-0" />
                    <div className="flex-1 flex gap-1.5 overflow-x-auto py-1">
                      {[
                        "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=150&h=150&fit=crop",
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
                        "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&h=150&fit=crop"
                      ].map((av, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setOnboardAvatar(av)}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 ${onboardAvatar === av ? "border-saudi-green" : "border-transparent opacity-60 hover:opacity-100"}`}
                        >
                          <img src={av} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom URL Option */}
                  <input 
                    type="text"
                    value={onboardAvatar}
                    onChange={(e) => setOnboardAvatar(e.target.value)}
                    placeholder="رابط رابط مخصص لصورتك (اختياري)"
                    className="w-full h-8 mt-2 bg-black border border-white/5 focus:border-saudi-green/45 px-2.5 rounded-lg text-[10px] text-gray-300 outline-none"
                  />
                </div>

                {/* SECURITY NOTICE & SUBMIT */}
                <div className="pt-2 text-[10px] text-gray-500 leading-relaxed font-normal">
                  تلتزم هذه المنصة بلائحة حماية البيانات الهيئة الوطنية للأمن السيبراني وعقود الترخيص لـ SNNS.PRO. يتم توفير حسابك على بنية سحابية مقفلة.
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_15px_rgba(0,132,61,0.25)] mt-6 ring-2 ring-saudi-glow/15"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد وتسجيل الحساب الفاخر</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* 4. Elegant Glowing Success Animation Dialog */}
        {showSuccessAnim && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xs w-full bg-[#030303] border border-saudi-green/20 rounded-3xl p-8 shadow-[0_0_80px_rgba(0,163,79,0.3)] flex flex-col items-center"
            >
              <div className="relative mb-6">
                {/* Pulsing light rings around checkmark */}
                <div className="absolute inset-0 rounded-full bg-saudi-green/20 blur-xl animate-pulse" />
                <motion.div 
                  initial={{ rotate: -45, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-saudi-green/10 border-2 border-saudi-green flex items-center justify-center text-saudi-glow relative z-10 shadow-[0_0_20px_rgba(0,132,61,0.4)]"
                >
                  <Check className="w-8 h-8 text-saudi-glow stroke-[4]" />
                </motion.div>
              </div>

              <h2 className="text-lg font-black text-white mb-2">اكتمل التسجيل والأمان</h2>
              <p className="text-xs text-gray-350 text-gray-400 leading-relaxed font-bold">
                ✓ تم تسجيل دخولك بنجاح.
              </p>
              <p className="text-[10px] text-saudi-glow font-bold mt-1 max-w-xs px-2">
                جارٍ توجيهك إلى ديوانيتك الافتراضية الموثقة... 🇸🇦
              </p>
              
              <div className="w-16 h-1 bg-white/10 rounded-full mt-6 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-saudi-green animate-loading-bar w-full h-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
