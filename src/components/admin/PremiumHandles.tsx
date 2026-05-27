import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  User, 
  Lock, 
  Unlock, 
  ArrowLeftRight, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Fingerprint, 
  CheckCircle2,
  Shield,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types
export interface PremiumHandle {
  id: number;
  handle: string;
  status: "متاح" | "مستخدم" | "محجوز";
  assignedTo: string; // username
  assignedName: string; // display name
  assignedDate: string; // Date
  assignedBy: string; // admin who assigned
}

export interface PremiumHandleLog {
  id: string;
  handleId: number;
  handle: string;
  action: "تخصيص" | "سحب" | "نقل" | "قفل" | "فك قفل" | "إعادة تعيين";
  userFrom: string;
  userTo: string;
  performedBy: string;
  performedByRole: string;
  timestamp: string;
  notes: string;
}

interface PremiumHandlesProps {
  usersList: any[];
  setUsersList: React.Dispatch<React.SetStateAction<any[]>>;
  logAdminAction: (modName: string, role: string, actionType: string, detail: string, targetAccount: string) => void;
  currentProfileUser?: any;
  onSyncProfile?: (updatedProfile: any) => void;
}

export default function PremiumHandles({ 
  usersList, 
  setUsersList, 
  logAdminAction,
  currentProfileUser,
  onSyncProfile
}: PremiumHandlesProps) {
  // Simulating Admin Roles for Testing & Control Validation
  const [adminRole, setAdminRole] = useState<"Super Admin" | "Content Moderator" | "Admin">(() => {
    return (localStorage.getItem("snns_active_admin_role") as any) || "Super Admin";
  });

  const [handles, setHandles] = useState<PremiumHandle[]>(() => {
    const saved = localStorage.getItem("snns_premium_handles");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Initialize 100 handles starting from @1 to @100
    const initialList: PremiumHandle[] = [];
    for (let i = 1; i <= 100; i++) {
      // Handles 1-10 are default "محجوز" for System officials
      const isReserved = i <= 10;
      initialList.push({
        id: i,
        handle: `@${i}`,
        status: isReserved ? "محجوز" : "متاح",
        assignedTo: isReserved ? "system_official" : "",
        assignedName: isReserved ? "الحساب الرسمي للإدارة" : "",
        assignedDate: isReserved ? "2026-05-26" : "",
        assignedBy: isReserved ? "النظام الملقائي" : ""
      });
    }
    try { localStorage.setItem("snns_premium_handles", JSON.stringify(initialList)); } catch {}
    return initialList;
  });

  const [logs, setLogs] = useState<PremiumHandleLog[]>(() => {
    const saved = localStorage.getItem("snns_premium_handles_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const initialLogs: PremiumHandleLog[] = [
      {
        id: "hlog-1",
        handleId: 1,
        handle: "@1",
        action: "قفل",
        userFrom: "",
        userTo: "system_official",
        performedBy: "عبدالرحمن الحربي",
        performedByRole: "Super Admin",
        timestamp: "١٠:٠٠ - ٢٠٢٦/٠٥/٢٦",
        notes: "حجز المعرف الأول كمعرف سيادي معتمد للمنصة"
      }
    ];
    try { localStorage.setItem("snns_premium_handles_logs", JSON.stringify(initialLogs)); } catch {}
    return initialLogs;
  });

  // UI Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"الكل" | "متاح" | "مستخدم" | "محجوز">("الكل");

  // Authentication Modals & Password confirmations
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    type: "assign" | "revoke" | "transfer" | "lock" | "unlock" | "reset_all";
    handleId?: number;
    userId?: string;
    extraData?: any;
  } | null>(null);

  // Interaction Dialogs
  const [activeDialog, setActiveDialog] = useState<"assign" | "transfer" | "none">("none");
  const [selectedHandleForAction, setSelectedHandleForAction] = useState<PremiumHandle | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("snns_active_admin_role", adminRole);
  }, [adminRole]);

  // Save handles data and alert state whenever updated
  const updateHandlesAndLocalState = (newHandles: PremiumHandle[]) => {
    setHandles(newHandles);
    localStorage.setItem("snns_premium_handles", JSON.stringify(newHandles));
  };

  const addLog = (
    handleId: number, 
    handleStr: string, 
    action: PremiumHandleLog["action"], 
    userFrom: string, 
    userTo: string, 
    notes: string
  ) => {
    const newLog: PremiumHandleLog = {
      id: "hlog-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      handleId,
      handle: handleStr,
      action,
      userFrom,
      userTo,
      performedBy: "عبدالرحمن الحربي",
      performedByRole: adminRole,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "numeric" }) + " - " + new Date().toLocaleDateString("ar-SA"),
      notes
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem("snns_premium_handles_logs", JSON.stringify(updated));
  };

  // Check super admin permission helper
  const isSuperAdmin = adminRole === "Super Admin";

  const checkSuperAdminPermission = (): boolean => {
    if (!isSuperAdmin) {
      alert("⚠️ خطأ في الصلاحيات: فقط رتبة (Super Admin) مخول له التعديل على نظام المعرفات المميزة وحجزها وسحبها!");
      return false;
    }
    return true;
  };

  // Validate password
  const confirmWithPassword = () => {
    // The super-secure password for allocating handles is 'saudi2030' or 'admin123'
    if (passwordInput !== "saudi2030" && passwordInput !== "admin123") {
      setPasswordError("كلمة المرور غير صحيحة! يرجى إدخال رمز الأمان الإداري المعتمد.");
      return;
    }

    setShowPasswordConfirm(false);
    setPasswordInput("");
    setPasswordError("");

    if (pendingAction) {
      executePendingAction(pendingAction);
    }
  };

  // Trigger Action with security confirmation
  const triggerActionSecured = (action: typeof pendingAction) => {
    if (!checkSuperAdminPermission()) return;
    
    setPendingAction(action);
    setPasswordInput("");
    setPasswordError("");
    setShowPasswordConfirm(true);
  };

  // Core functions
  const executePendingAction = (act: typeof pendingAction) => {
    if (!act) return;

    const { type, handleId, userId, extraData } = act;

    if (type === "reset_all") {
      // Reset the entire handles database
      const initialList: PremiumHandle[] = [];
      for (let i = 1; i <= 100; i++) {
        const isReserved = i <= 10;
        initialList.push({
          id: i,
          handle: `@${i}`,
          status: isReserved ? "محجوز" : "متاح",
          assignedTo: isReserved ? "system_official" : "",
          assignedName: isReserved ? "الحساب الرسمي للإدارة" : "",
          assignedDate: isReserved ? "2026-05-16" : "",
          assignedBy: "النظام التلقائي"
        });
      }
      updateHandlesAndLocalState(initialList);

      // Clean all user handles in snns_users_records
      const updatedUsers = usersList.map(usr => {
        if (usr.premiumHandle) {
          const { premiumHandle, ...rest } = usr;
          return { ...rest, premiumHandle: "" };
        }
        return usr;
      });
      setUsersList(updatedUsers);
      localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));

      // Check current active profile
      const storedProfile = localStorage.getItem("snns_user_profile");
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile);
          if (parsed.premiumHandle) {
            parsed.premiumHandle = "";
            localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
            if (onSyncProfile) onSyncProfile(parsed);
          }
        } catch {}
      }

      addLog(0, "@الكل", "إعادة تعيين", "الجميع", "", "إعادة تعيين النظام بالكامل إلى قيم الصنع الافتراضية للشركة");
      logAdminAction("عبدالرحمن الحربي", adminRole, "تهيئة المعرفات", "إعادة تعيين كامل قاعدة المعرفات الـ 100 وحجز الأرقام 1-10", "System");
      alert("✅ تم إعادة تعيين نظام المعرفات الـ 100 المميزة وتطهير هويات المنتحلين بنجاح!");
      setPendingAction(null);
      return;
    }

    // Single Handle actions
    if (!handleId) return;
    const targetHandle = handles.find(h => h.id === handleId);
    if (!targetHandle) return;

    if (type === "lock") {
      const updated = handles.map(h => {
        if (h.id === handleId) {
          return {
            ...h,
            status: "محجوز" as const,
            assignedTo: "system_official",
            assignedName: "الحساب الرسمي للإدارة",
            assignedDate: new Date().toLocaleDateString("en-US"),
            assignedBy: "عبدالرحمن الحربي"
          };
        }
        return h;
      });

      // If it was assigned to someone, we must remove it from that user
      if (targetHandle.assignedTo && targetHandle.assignedTo !== "system_official") {
        removeHandleFromUserRecords(targetHandle.assignedTo);
      }

      updateHandlesAndLocalState(updated);
      addLog(handleId, targetHandle.handle, "قفل", targetHandle.assignedTo, "system_official", "قفل وحجز المعرف للأغراض الإدارية والسيادية العليا");
      logAdminAction("عبدالرحمن الحربي", adminRole, "حجز معرف", `قفل المعرف المميز ${targetHandle.handle} وحظره عن الاستخدام المعني لمستخدم عادي`, targetHandle.handle);
      alert(`🔒 تم حجز المعرف وعزله (${targetHandle.handle}) بنجاح.`);

    } else if (type === "unlock") {
      const updated = handles.map(h => {
        if (h.id === handleId) {
          return {
            ...h,
            status: "متاح" as const,
            assignedTo: "",
            assignedName: "",
            assignedDate: "",
            assignedBy: ""
          };
        }
        return h;
      });
      updateHandlesAndLocalState(updated);
      addLog(handleId, targetHandle.handle, "فك قفل", targetHandle.assignedTo, "", "إزالة حالة الحجز وجعل المعرف المميز متاحاً للاستخدام والتخصيص");
      logAdminAction("عبدالرحمن الحربي", adminRole, "فك حجز المعرف", `فك حجز وإتاحة المعرف المميز ${targetHandle.handle}`, targetHandle.handle);
      alert(`🔓 تم إلغاء حظر وإعادة المعرف (${targetHandle.handle}) للحالة المتاحة.`);

    } else if (type === "revoke") {
      const prevOwner = targetHandle.assignedTo;
      const updated = handles.map(h => {
        if (h.id === handleId) {
          return {
            ...h,
            status: "متاح" as const,
            assignedTo: "",
            assignedName: "",
            assignedDate: "",
            assignedBy: ""
          };
        }
        return h;
      });

      // Clear the handle references from the user database directly!
      if (prevOwner) {
        removeHandleFromUserRecords(prevOwner);
      }

      updateHandlesAndLocalState(updated);
      addLog(handleId, targetHandle.handle, "سحب", prevOwner, "", "سحب وتطهير المعرف المميز عن الحساب وإرجاعه للمخزن العام للوزارة");
      logAdminAction("عبدالرحمن الحربي", adminRole, "سحب معرف مميز", `سحب وإلغاء المعرف ${targetHandle.handle} من المستخدم @${prevOwner}`, prevOwner);
      
      // Send interactive in-app notifications
      triggerAppNotification(prevOwner, `تم إلغاء تخصيص وسحب المعرف المميز النادر ${targetHandle.handle} وعودته للسيادة.`);
      
      alert(`✅ تم إلغاء التخصيص وسحب المعرف المميز (${targetHandle.handle}) بنجاح.`);

    } else if (type === "assign") {
      if (!userId) return;
      
      // Get target user details
      const targetUser = usersList.find(u => u.username === userId || u.id?.toString() === userId?.toString());
      if (!targetUser) {
        alert("لم يتم العثور على الحساب المختار في قائمة مستخدمي المنصة.");
        return;
      }

      const prevOwner = targetHandle.assignedTo;

      // 1. Assign handle in handles database
      const updatedHandles = handles.map(h => {
        if (h.id === handleId) {
          return {
            ...h,
            status: "مستخدم" as const,
            assignedTo: targetUser.username,
            assignedName: targetUser.name,
            assignedDate: new Date().toLocaleDateString("en-US"),
            assignedBy: "عبدالرحمن الحربي"
          };
        }
        // If the user already had another premium handle, we should free up that handle
        if (h.assignedTo === targetUser.username && h.id !== handleId) {
          return {
            ...h,
            status: "متاح" as const,
            assignedTo: "",
            assignedName: "",
            assignedDate: "",
            assignedBy: ""
          };
        }
        return h;
      });

      // 2. Clear former handle connection if any user is losing this handle
      if (prevOwner) {
        removeHandleFromUserRecords(prevOwner);
      }

      // 3. Update modern user records database to have premiumHandle property
      const updatedUsers = usersList.map(usr => {
        if (usr.username === targetUser.username) {
          return { ...usr, premiumHandle: targetHandle.handle };
        }
        // If someone else had this handle, clean it
        if (usr.premiumHandle === targetHandle.handle) {
          return { ...usr, premiumHandle: "" };
        }
        return usr;
      });

      setUsersList(updatedUsers);
      localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));
      updateHandlesAndLocalState(updatedHandles);

      // 4. Sync current logged-in user profile, if he wants it
      const currentProfileSaved = localStorage.getItem("snns_user_profile");
      if (currentProfileSaved) {
        try {
          const parsed = JSON.parse(currentProfileSaved);
          if (parsed.username === targetUser.username) {
            parsed.premiumHandle = targetHandle.handle;
            localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
            if (onSyncProfile) onSyncProfile(parsed);
          }
        } catch {}
      }

      addLog(handleId, targetHandle.handle, "تخصيص", prevOwner || "", targetUser.username, `ربط المعرف مباشرة بالحساب وتثبيت نظام التوثيق النادر`);
      logAdminAction("عبدالرحمن الحربي", adminRole, "تخصيص معرف مميز", `تثبيت وتخصيص المعرف المميز ${targetHandle.handle} لحساب @${targetUser.username}`, targetUser.username);
      
      triggerAppNotification(targetUser.username, `تهانينا! 🎉 تم منحك وتخصيص المعرف النادر المميز ${targetHandle.handle} لحسابك رسمياً.`);

      alert(`🎉 أهلاً وسهلاً! تم ربط وتخصيص المعرف المميز (${targetHandle.handle}) بالحساب (${targetUser.name}) بنجاح.`);
      setActiveDialog("none");

    } else if (type === "transfer") {
      const newUserId = extraData?.newUserId;
      if (!newUserId) return;

      const newUser = usersList.find(u => u.username === newUserId || u.id?.toString() === newUserId?.toString());
      if (!newUser) {
        alert("لم يتم العثور على الحساب الذي ترغب بالنقل إليه.");
        return;
      }

      const prevOwner = targetHandle.assignedTo;

      // 1. Update Handles database
      const updatedHandles = handles.map(h => {
        if (h.id === handleId) {
          return {
            ...h,
            status: "مستخدم" as const,
            assignedTo: newUser.username,
            assignedName: newUser.name,
            assignedDate: new Date().toLocaleDateString("en-US"),
            assignedBy: "عبدالرحمن الحربي"
          };
        }
        // Free this user's former handle if any
        if (h.assignedTo === newUser.username && h.id !== handleId) {
          return {
            ...h,
            status: "متاح" as const,
            assignedTo: "",
            assignedName: "",
            assignedDate: "",
            assignedBy: ""
          };
        }
        return h;
      });

      // 2. Remove from previous owner records
      if (prevOwner) {
        removeHandleFromUserRecords(prevOwner);
      }

      // 3. Update user base
      const updatedUsers = usersList.map(usr => {
        if (usr.username === newUser.username) {
          return { ...usr, premiumHandle: targetHandle.handle };
        }
        if (usr.username === prevOwner) {
          return { ...usr, premiumHandle: "" };
        }
        return usr;
      });

      setUsersList(updatedUsers);
      localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));
      updateHandlesAndLocalState(updatedHandles);

      // Sync active logged-in profile if involved
      const currentProfileSaved = localStorage.getItem("snns_user_profile");
      if (currentProfileSaved) {
        try {
          const parsed = JSON.parse(currentProfileSaved);
          if (parsed.username === newUser.username) {
            parsed.premiumHandle = targetHandle.handle;
          } else if (parsed.username === prevOwner) {
            parsed.premiumHandle = "";
          }
          localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
          if (onSyncProfile) onSyncProfile(parsed);
        } catch {}
      }

      addLog(handleId, targetHandle.handle, "نقل", prevOwner, newUser.username, `نقل ملكية المعرف وحقوقه التنظيمية للمستخدم الجديد بسجلات الإدارة`);
      logAdminAction("عبدالرحمن الحربي", adminRole, "نقل معرف مميز", `نقل المعرف ${targetHandle.handle} من @${prevOwner} إلى @${newUser.username}`, targetHandle.username);
      
      triggerAppNotification(prevOwner, `تم نقل المعرف النادر ${targetHandle.handle} من حسابك لحساب آخر.`);
      triggerAppNotification(newUser.username, `تم استلام وتحويل المعرف المميز النادر ${targetHandle.handle} لحسابك رسمياً 🇸🇦`);

      alert(`🔄 تم نقل ملكية المعرف المميز (${targetHandle.handle}) بنجاح من (@${prevOwner}) إلى (@${newUser.username}).`);
      setActiveDialog("none");
    }

    setPendingAction(null);
  };

  const removeHandleFromUserRecords = (username: string) => {
    const updatedUsers = usersList.map(usr => {
      if (usr.username === username) {
        return { ...usr, premiumHandle: "" };
      }
      return usr;
    });
    setUsersList(updatedUsers);
    localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));

    // Also update logged-in user profile if it is the current user
    const currentProfileSaved = localStorage.getItem("snns_user_profile");
    if (currentProfileSaved) {
      try {
        const parsed = JSON.parse(currentProfileSaved);
        if (parsed.username === username) {
          parsed.premiumHandle = "";
          localStorage.setItem("snns_user_profile", JSON.stringify(parsed));
          if (onSyncProfile) onSyncProfile(parsed);
        }
      } catch {}
    }
  };

  // Helper trigger inline notification dispatch
  const triggerAppNotification = (targetAccount: string, message: string) => {
    try {
      const savedAlerts = localStorage.getItem("snns_system_alerts");
      const alerts = savedAlerts ? JSON.parse(savedAlerts) : [];
      const newAlert = {
        id: "alert-" + Date.now() + "-" + Math.floor(Math.random() * 100),
        title: `حساب @${targetAccount}: ${message}`,
        time: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "numeric" }),
        timestamp: Date.now()
      };
      localStorage.setItem("snns_system_alerts", JSON.stringify([newAlert, ...alerts]));
    } catch {}
  };


  // Filtering logic
  const filteredHandles = handles.filter(h => {
    const cleanQuery = searchQuery.trim().toLowerCase().replace(/^@/, "");
    // Filter by number (cleanQuery could be '5' for @5)
    const matchesNumber = cleanQuery === "" || h.id.toString() === cleanQuery || h.handle.toLowerCase().includes(cleanQuery);
    
    // Filter by user (either assigned name or assignedTo contains query)
    const matchesUser = userSearchQuery.trim() === "" || 
      h.assignedName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      h.assignedTo.toLowerCase().includes(userSearchQuery.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === "الكل" || h.status === statusFilter;

    return matchesNumber && matchesUser && matchesStatus;
  });

  return (
    <div className="space-y-6 text-right font-tajawal pb-12 select-none" dir="rtl">
      
      {/* 1. Gorgeous Interactive Saudi Header Panel */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-saudi-green/5 rounded-full blur-2xl" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">إدارة المعرفات المميزة (Nadir Handles @1-@100)</h1>
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-[#00843D]/20 text-saudi-glow px-2.5 py-1 rounded-full border border-[#00843D]/30">
              مكتب التحكم بالنزاهة 🇸🇦
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-normal max-w-2xl">
            تنظيم وحجز المعرفات النادرة والقصيرة جداً لخدمة السيادة وحماية هوية المسؤولين والصناع المعتمدين وطفرة النزاهة داخل منصة SNNS.PRO الفاخرة.
          </p>
        </div>

        {/* Action Testing Environment Component Controls */}
        <div className="flex items-center gap-3 bg-white/2 border border-white/5 p-2 rounded-2xl relative z-10 w-full md:w-auto self-stretch md:self-auto justify-between sm:justify-start">
          <div className="text-right pl-3 pr-1">
            <span className="block text-[8px] text-gray-500 font-bold">ملاحظة للتدوير والفحص:</span>
            <span className="text-[10px] text-saudi-glow font-bold font-mono">تغيير دور الإدارة الحالية</span>
          </div>
          <select 
            value={adminRole} 
            onChange={(e: any) => setAdminRole(e.target.value)}
            className="bg-black/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-saudi-green min-w-[130px] font-tajawal cursor-pointer"
          >
            <option value="Super Admin">منصب: Super Admin</option>
            <option value="Admin">منصب: Admin</option>
            <option value="Content Moderator">منصب: Content Moderator</option>
          </select>
        </div>
      </div>

      {/* 2. Key stats of handles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
          <span className="block text-gray-400 text-[10px] font-bold">إجمالي المخزون</span>
          <span className="block text-xl font-black font-mono text-white mt-1">100</span>
          <span className="text-[9px] text-gray-500 font-normal">من @1 إلى @100</span>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
          <span className="block text-emerald-400 text-[10px] font-bold">المعّرفات الشاغرة (متاحة)</span>
          <span className="block text-xl font-black font-mono text-emerald-400 mt-1">
            {handles.filter(h => h.status === "متاح").length}
          </span>
          <span className="text-[9px] text-gray-500 font-normal">جاهزة للتخصيص الفوري</span>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
          <span className="block text-amber-400 text-[10px] font-bold">المخصصة للمستخدمين</span>
          <span className="block text-xl font-black font-mono text-amber-400 mt-1">
            {handles.filter(h => h.status === "مستخدم").length}
          </span>
          <span className="text-[9px] text-gray-500 font-normal">مرتبطة بحسابات نشطة</span>
        </div>
        <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
          <span className="block text-red-400 text-[10px] font-bold">المغلقة والسيادية</span>
          <span className="block text-xl font-black font-mono text-red-400 mt-1">
            {handles.filter(h => h.status === "محجوز").length}
          </span>
          <span className="text-[9px] text-gray-500 font-normal">محظورة ومقيدة بقرار إداري</span>
        </div>
      </div>

      {/* 3. Filters & general actions container */}
      <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            {/* Filter by handle */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="ابحث برقم المعرف (مثال: 5)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-xs focus:border-saudi-green outline-none text-white font-tajawal placeholder:text-gray-600"
              />
            </div>

            {/* Filter by profile user */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="ابحث باسم صاحب المعرف..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-xs focus:border-saudi-green outline-none text-white font-tajawal placeholder:text-gray-600"
              />
            </div>

            {/* Filter by state status */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl py-2.5 px-4 text-xs focus:border-saudi-green outline-none text-white font-tajawal cursor-pointer"
              >
                <option value="الكل">جميع الحالات</option>
                <option value="متاح">شاغر متاح</option>
                <option value="مستخدم">قيد الاستخدام المباشر</option>
                <option value="محجوز">محجوز للإدارة والمصلحة العامة</option>
              </select>
            </div>
          </div>

          <button 
            onClick={() => triggerActionSecured({ type: "reset_all" })}
            className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 duration-150 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تهيئة وإعادة ضبط المصنع</span>
          </button>
        </div>

        {/* 4. Display of premium handles grid / table */}
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#050505] border-b border-white/5 text-gray-400 font-bold">
                <tr>
                  <th className="p-4 font-tajawal">رقم المعرف</th>
                  <th className="p-4 font-tajawal">رقم الرابط المخصص</th>
                  <th className="p-4 font-tajawal">حالة المعرف</th>
                  <th className="p-4 font-tajawal">المستخدم المستفيد</th>
                  <th className="p-4 font-tajawal">تاريخ التخصيص</th>
                  <th className="p-4 font-tajawal">المسؤول عن الإجراء</th>
                  <th className="p-4 text-left font-tajawal">عمليات التحكم السيادية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredHandles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 font-tajawal">
                      لا توجد معرفات تطابق شروط الفلترة الحالية في السجلات.
                    </td>
                  </tr>
                ) : (
                  filteredHandles.map((h) => (
                    <tr key={h.id} className="hover:bg-white/1 transition-all">
                      {/* ID / Handle */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span className="w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center justify-center text-[10px] font-mono shrink-0">
                            ★
                          </span>
                          <span className="font-mono text-saudi-glow text-sm">{h.handle}</span>
                        </div>
                      </td>

                      {/* Web representation Link */}
                      <td className="p-4 font-mono text-xs text-gray-500">
                        snns.pro/{h.handle}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {h.status === "متاح" && (
                          <span className="px-2.5 py-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                            شاغر متاح
                          </span>
                        )}
                        {h.status === "مستخدم" && (
                          <span className="px-2.5 py-1 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-bold">
                            قيد الاستخدام
                          </span>
                        )}
                        {h.status === "محجوز" && (
                          <span className="px-2.5 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold flex items-center gap-1 w-fit">
                            🔒 سيادي محجوز
                          </span>
                        )}
                      </td>

                      {/* Current owner */}
                      <td className="p-4">
                        {h.status === "مستخدم" ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-white block">{h.assignedName}</span>
                            <span className="text-[10px] text-gray-500 font-mono block">@{h.assignedTo}</span>
                          </div>
                        ) : h.status === "محجوز" ? (
                          <span className="text-gray-500 font-bold">{h.assignedName || "القيادة العامة للشركة"}</span>
                        ) : (
                          <span className="text-gray-600 italic">لا يوجد مستفيد</span>
                        )}
                      </td>

                      {/* Assigned Date */}
                      <td className="p-4 font-mono text-gray-400">
                        {h.assignedDate ? h.assignedDate : "—"}
                      </td>

                      {/* Moderator who assigned */}
                      <td className="p-4">
                        {h.assignedBy ? (
                          <span className="text-gray-400 font-tajawal">{h.assignedBy}</span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>

                      {/* Core control action buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {h.status === "متاح" ? (
                            <>
                              {/* Assign Button */}
                              <button 
                                onClick={() => {
                                  setSelectedHandleForAction(h);
                                  // Pick first user by default if available
                                  const firstUsr = usersList.length > 0 ? usersList[0].username : "";
                                  setTargetUserId(firstUsr);
                                  setActiveDialog("assign");
                                }}
                                className="px-2.5 py-1.5 bg-saudi-green/10 text-saudi-glow border border-[#00843D]/20 hover:bg-saudi-green hover:text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <span>تخصيص لمستخدم</span>
                              </button>

                              {/* Lock Button */}
                              <button 
                                onClick={() => triggerActionSecured({ type: "lock", handleId: h.id })}
                                className="p-1.5 bg-white/2 border border-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                title="حجز المعرفة للإدارة"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">قفل</span>
                              </button>
                            </>
                          ) : h.status === "مستخدم" ? (
                            <>
                              {/* Transfer Button */}
                              <button 
                                onClick={() => {
                                  setSelectedHandleForAction(h);
                                  // Pick first user other than current beneficiary by default
                                  const firstUsr = usersList.find(u => u.username !== h.assignedTo)?.username || "";
                                  setTargetUserId(firstUsr);
                                  setActiveDialog("transfer");
                                }}
                                className="px-2.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-black rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                                <span>نقل ملكية</span>
                              </button>

                              {/* Revoke Button */}
                              <button 
                                onClick={() => triggerActionSecured({ type: "revoke", handleId: h.id })}
                                className="px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                              >
                                <span>سحب المعرف</span>
                              </button>
                            </>
                          ) : (
                            // Reserved Handle Lock
                            <button 
                              onClick={() => triggerActionSecured({ type: "unlock", handleId: h.id })}
                              className="px-2.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>فك قفل وحجز</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Assigned & locked Interactive dialogs */}
      <AnimatePresence>
        {activeDialog === "assign" && selectedHandleForAction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[95] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-surface border border-dark-border rounded-3xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="font-bold text-base flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-saudi-glow" />
                  منح وتخصيص المعرف المميز {selectedHandleForAction.handle}
                </h4>
                <button onClick={() => setActiveDialog("none")} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs mb-1.5 text-gray-400">اختر المستخدم المستفيد من قائمة الأعضاء:</label>
                  <select 
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-saudi-green outline-none font-tajawal cursor-pointer"
                  >
                    <option value="" disabled>-- اختر مستخدماً --</option>
                    {usersList.map(usr => (
                      <option key={usr.username} value={usr.username}>
                        {usr.name} (@{usr.username}) {usr.premiumHandle ? `[يمتلك حالياً ${usr.premiumHandle}]` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-1.5">
                  <p className="text-[10px] leading-relaxed text-yellow-400 flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      سيتم ربط المعرف النادر مباشرة بالحساب المختار وتحويله في المنصة. سيصبح رابط حسابه: snns.pro/{selectedHandleForAction.handle} وسوف يظهر إلى جانب اسمه شارة وميزات التوثيق الخاصة بالمنصب والنزاهة!
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    onClick={() => {
                      if (!targetUserId) {
                        alert("يرجى اختيار مستفيد لتخصيص الحساب");
                        return;
                      }
                      triggerActionSecured({
                        type: "assign",
                        handleId: selectedHandleForAction.id,
                        userId: targetUserId
                      });
                    }}
                    className="flex-1 py-2.5 bg-saudi-green text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer text-center"
                  >
                    منح وتأكيد التخصيص
                  </button>
                  <button 
                    onClick={() => setActiveDialog("none")}
                    className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl text-xs"
                  >
                    إلغاء الإجراء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeDialog === "transfer" && selectedHandleForAction && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[95] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-surface border border-dark-border rounded-3xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="font-bold text-base flex items-center gap-2 text-amber-400">
                  <ArrowLeftRight className="w-4 h-4" />
                  نقل ملكية المعرف {selectedHandleForAction.handle}
                </h4>
                <button onClick={() => setActiveDialog("none")} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-white/2 rounded-xl text-xs space-y-1">
                  <p className="text-gray-400">المالك الحالي للمعرف: <span className="font-bold text-white">@{selectedHandleForAction.assignedTo}</span></p>
                  <p className="text-gray-400">الاسم المسجل: <span className="text-saudi-glow font-bold">{selectedHandleForAction.assignedName}</span></p>
                </div>

                <div>
                  <label className="block text-xs mb-1.5 text-gray-400">اختر المستخدم المستهدف الجديد لنقل المعرف إليه:</label>
                  <select 
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-saudi-green outline-none font-tajawal cursor-pointer"
                  >
                    <option value="" disabled>-- اختر مستخدماً --</option>
                    {usersList.filter(u => u.username !== selectedHandleForAction.assignedTo).map(usr => (
                      <option key={usr.username} value={usr.username}>
                        {usr.name} (@{usr.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    onClick={() => {
                      if (!targetUserId) {
                        alert("يرجى اختيار مستلم لنقل المعرف");
                        return;
                      }
                      triggerActionSecured({
                        type: "transfer",
                        handleId: selectedHandleForAction.id,
                        userId: selectedHandleForAction.assignedTo,
                        extraData: { newUserId: targetUserId }
                      });
                    }}
                    className="flex-1 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer text-center"
                  >
                    نقل وتأكيد الإجراء
                  </button>
                  <button 
                    onClick={() => setActiveDialog("none")}
                    className="flex-1 py-2.5 bg-white/5 text-gray-400 rounded-xl text-xs"
                  >
                    إلغاء الإجراء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Password confirmation security dialog */}
        {showPasswordConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#0D0D0D] border border-red-500/10 rounded-3xl p-6 w-full max-w-sm space-y-4 text-center shadow-2xl shadow-red-500/2"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">تأكيد سلطة الأمان (Super Admin Authorization)</h4>
                <p className="text-[10px] text-gray-400 tracking-wide font-normal">
                  يرجى إدخال كلمة مرور المشرف العام لتخويل منح أو سحب أو تعديل المعرف النادر السيادي في النظام.
                </p>
              </div>

              <div className="space-y-2">
                <input 
                  type="password"
                  placeholder="أدخل كلمة مرور الأمان (مثال: admin123)..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-center outline-none focus:border-red-500 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmWithPassword();
                  }}
                  autoFocus
                />
                
                {passwordError && (
                  <p className="text-[10px] text-red-400 font-bold">{passwordError}</p>
                )}
                <div className="bg-white/2 rounded-xl p-2.5 text-[9px] text-gray-500 text-right leading-relaxed border border-white/5">
                  🛡️ كلمة مرور محاكاة طقم الأمان للمعاينة السلسة هي: <span className="text-saudi-glow font-bold font-mono">admin123</span> أو <span className="text-saudi-glow font-bold font-mono">saudi2030</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={confirmWithPassword}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  تحقق واعتماد الخطوة
                </button>
                <button 
                  onClick={() => {
                    setShowPasswordConfirm(false);
                    setPasswordInput("");
                    setPasswordError("");
                    setPendingAction(null);
                  }}
                  className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-xs hover:bg-white/10"
                >
                  إلغاء التخويل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Independent local transactions log for Premium handles */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Fingerprint className="w-4 h-4 text-saudi-glow" />
            سجل حركة المعرفات المميزة التاريخي (Ledger @1-@100)
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">سجل تراكمي لجميع عمليات منح ونقل وحظر وإلغاء المعرفات القصيرة داخل قاعدة البيانات</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/2 text-gray-500">
                <th className="pb-3 pt-1 font-tajawal font-bold">المعرف المميز</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">نوع العملية</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">المالك السابق</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">المالك الجديد</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">بواسطة المسؤول</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">الرتبة</th>
                <th className="pb-3 pt-1 font-tajawal font-bold">التاريخ والتوقيت</th>
                <th className="pb-3 pt-1 text-left font-tajawal font-bold">ملاحظات وسبب الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 text-gray-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/1 transition-all">
                  <td className="py-3 font-bold font-mono text-saudi-glow">{log.handle}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      log.action === "تخصيص" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      log.action === "سحب" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      log.action === "نقل" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      log.action === "قفل" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-gray-400">{log.userFrom ? `@${log.userFrom}` : "—"}</td>
                  <td className="py-3 font-mono text-gray-200">{log.userTo ? `@${log.userTo}` : "—"}</td>
                  <td className="py-3 font-bold text-white">{log.performedBy}</td>
                  <td className="py-3">
                    <span className="text-[10px] text-gray-400">{log.performedByRole}</span>
                  </td>
                  <td className="py-3 font-mono text-[10.5px] text-gray-500">{log.timestamp}</td>
                  <td className="py-3 text-left max-w-xs truncate text-[10px] text-gray-400" title={log.notes}>{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
