import React, { useState, useEffect } from "react";
import { 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  UserX, 
  Edit3, 
  History, 
  User, 
  Key, 
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Lock,
  Search
} from "lucide-react";
import { 
  getTrustedRecords, 
  getTrustedAuditLogs, 
  grantTrustedBadge, 
  revokeTrustedBadge, 
  updateTrustedReason,
  TrustedBadgeRecord,
  TrustedBadgeAuditLog
} from "../../utils/trustedBadgesStore";

export default function TrustedBadgesManager() {
  // Real Local Storage records
  const [records, setRecords] = useState<TrustedBadgeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<TrustedBadgeAuditLog[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // System Moderators to act as
  const [availableModerators, setAvailableModerators] = useState<any[]>([]);
  const [actingModIndex, setActingModIndex] = useState<number>(0);

  // Form states
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Focus targets
  const [selectedRecord, setSelectedRecord] = useState<TrustedBadgeRecord | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  // Inputs for action forms
  const [targetUserSelected, setTargetUserSelected] = useState<string>("");
  const [grantAccountType, setGrantAccountType] = useState<"شخصي" | "صانع محتوى" | "شركة" | "جهة رسمية">("شخصي");
  const [grantReason, setGrantReason] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [editReasonText, setEditReasonText] = useState("");
  const [formIP, setFormIP] = useState("185.80.12.24");

  // Status indicators
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; text: string; success: boolean } | null>(null);

  // Reload data
  const reloadData = () => {
    setRecords(getTrustedRecords());
    setAuditLogs(getTrustedAuditLogs());
    
    // Load global users from snns_users_records
    try {
      const savedUsers = localStorage.getItem("snns_users_records");
      if (savedUsers) {
        setGlobalUsers(JSON.parse(savedUsers));
      }
    } catch {}

    // Load moderators from snns_moderators
    try {
      const savedMods = localStorage.getItem("snns_moderators");
      if (savedMods) {
        setAvailableModerators(JSON.parse(savedMods));
      }
    } catch {}
  };

  useEffect(() => {
    reloadData();
    // Prepopulate IP
    setFormIP("185.80.22." + Math.floor(10 + Math.random() * 89));
  }, []);

  // Currently acting moderator details
  const currentActingMod = availableModerators[actingModIndex] || {
    name: "مدير عام النظام (Super Admin)",
    role: "Super Admin",
    username: "super_admin",
    permissions: { manage_trusted_badges: true, fullAccess: true }
  };

  // Check if current moderator has permission
  const isAuthorized = () => {
    if (!currentActingMod) return false;
    if (currentActingMod.role === "Super Admin") return true;
    if (currentActingMod.permissions?.fullAccess) return true;
    return !!currentActingMod.permissions?.manage_trusted_badges;
  };

  // Display feedback helper
  const triggerFeedback = (text: string, success: boolean) => {
    setFeedbackMsg({ id: Date.now().toString(), text, success });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 5000);
  };

  // Grant Badge submitting action
  const handleGrantBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized()) {
      triggerFeedback("🔴 عذراً، هذا المشرف ليس لديه صلاحية (manage_trusted_badges) لمنح شارات التوثيق.", false);
      setShowGrantModal(false);
      return;
    }

    if (!targetUserSelected) {
      triggerFeedback("يرجى اختيار الحساب المطلوب توثيقه أولاً.", false);
      return;
    }

    // Safety check: Cannot self-verify unless super admin (prevent self review)
    // We compare selecting users vs acting moderator name
    if (targetUserSelected.toLowerCase() === currentActingMod.username?.toLowerCase()) {
      triggerFeedback("🔒 حماية أمنية: لا يمكنك منح شارة التوثيق لنفسك، يجب منحها من قبل مدير آخر.", false);
      setShowGrantModal(false);
      return;
    }

    // Find user details to retrieve full name & avatar
    const targetUserObj = globalUsers.find(u => u.username === targetUserSelected) || {
      name: targetUserSelected,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop"
    };

    const res = grantTrustedBadge(
      targetUserSelected,
      targetUserObj.name,
      targetUserObj.avatar,
      currentActingMod.name,
      grantAccountType,
      grantReason || "حساب موثوق ومعتمد رسمياً على المنصة",
      formIP
    );

    if (res.success) {
      triggerFeedback(res.message, true);
      // Log on admin log screen too
      logExternalAdminAction(
        currentActingMod.name,
        currentActingMod.role,
        "منح الشارة",
        `تم منح شارة تحقق (${grantAccountType}) للحساب @${targetUserSelected}`,
        targetUserSelected
      );
      reloadData();
      setShowGrantModal(false);
      // Reset
      setTargetUserSelected("");
      setGrantReason("");
    } else {
      triggerFeedback(res.message, false);
    }
  };

  // Revoke badge submitting action
  const handleRevokeBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized()) {
      triggerFeedback("🔴 عذراً، المشرف لا يملك الصلاحية اللازمة لسحب الشارات.", false);
      setShowRevokeModal(false);
      return;
    }

    if (!selectedUsername) return;

    if (!revokeReason.trim()) {
      alert("يجب كتابة سبب سحب شارة التوثيق لحفظه بالسجلات الرسمية.");
      return;
    }

    const res = revokeBadgeWithAction();
    if (res.success) {
      triggerFeedback(res.message, true);
      reloadData();
      setShowRevokeModal(false);
      setRevokeReason("");
    } else {
      triggerFeedback(res.message, false);
    }
  };

  const revokeBadgeWithAction = () => {
    const res = revokeTrustedBadge(selectedUsername, currentActingMod.name, revokeReason, formIP);
    if (res.success) {
      logExternalAdminAction(
        currentActingMod.name,
        currentActingMod.role,
        "سحب الشارة",
        `تم سحب شارة التحقق من @${selectedUsername} بسبب: ${revokeReason}`,
        selectedUsername
      );
    }
    return res;
  };

  // Modify reason action
  const handleUpdateReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized()) {
      triggerFeedback("🔴 غير مصرح للمشرف الحالي بتعديل سجلات التوثيق.", false);
      setShowReasonModal(false);
      return;
    }

    if (!selectedUsername) return;

    if (!editReasonText.trim()) {
      alert("يرجى إدخال مبرر التعديل.");
      return;
    }

    const res = updateTrustedReason(selectedUsername, currentActingMod.name, editReasonText, formIP);
    if (res.success) {
      triggerFeedback(res.message, true);
      logExternalAdminAction(
        currentActingMod.name,
        currentActingMod.role,
        "تعديل سبب التوثيق",
        `تم تعديل مبرر التوثيق لـ @${selectedUsername} إلى: ${editReasonText}`,
        selectedUsername
      );
      reloadData();
      setShowReasonModal(false);
      setEditReasonText("");
    } else {
      triggerFeedback(res.message, false);
    }
  };

  // Helper to log actions back in original AdminDashboard ops logs
  const logExternalAdminAction = (modName: string, role: string, actionType: string, detail: string, targetAccount: string) => {
    try {
      const savedLogs = localStorage.getItem("snns_admin_ops_logs");
      const currentLogs = savedLogs ? JSON.parse(savedLogs) : [];
      const newLog = {
        id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        moderatorName: modName,
        role,
        actionType,
        detail,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "numeric" }) + " - " + new Date().toLocaleDateString("ar-SA"),
        ip: formIP,
        targetAccount
      };
      localStorage.setItem("snns_admin_ops_logs", JSON.stringify([newLog, ...currentLogs]));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter records & users
  const filteredRecords = records.filter(r => {
    const query = searchTerm.toLowerCase();
    return (
      r.username.toLowerCase().includes(query) ||
      r.name.toLowerCase().includes(query) ||
      (r.reason && r.reason.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in font-tajawal text-right" dir="rtl">
      {/* Upper Status Cards */}
      <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-saudi-green" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-lg font-tajawal flex items-center gap-2 mb-2 text-white">
              <ShieldCheck className="w-6 h-6 text-saudi-green" />
              منصة توثيق وإدارة الحسابات المعتمدة (SNNS.PRO Official Verified Badges Console)
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
              تتحكم هذه البوابة الأمنية في منح وسحب "شارة الحساب المعتمد الموثق" لحسابات النخبة والكيانات الوطنية والشركات. الشارة هي علامة ذهبية مشعة بتأثيرات النيون تشير لعدم إمكانية تزييف الهوية. 
              <span className="text-saudi-glow font-bold"> لا يمكن للمستخدمين تفعيل أو طلب الشارة ذاتياً.</span>
            </p>
          </div>
          
          <button
            onClick={() => {
              // Pre-select first unverified user if available
              const unverified = globalUsers.find(u => !records.some(r => r.username === u.username && r.isTrusted));
              if (unverified) setTargetUserSelected(unverified.username);
              setShowGrantModal(true);
            }}
            className="px-5 py-3 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-2xl flex items-center gap-2 font-bold text-xs shrink-0 self-end md:self-auto shadow-[0_0_15px_rgba(20,220,120,0.2)] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            منح شارة توثيق جديدة
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border ${
          feedbackMsg.success 
            ? "bg-saudi-green/10 border-saudi-green/30 text-saudi-glow" 
            : "bg-red-500/10 border-red-500/30 text-red-400"
          } text-xs font-bold animate-fade-in`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Acting Admin Selection Box */}
      <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-bold">المشرف النشط لإجراء العمليات:</div>
            <div className="text-xs text-gray-300 font-medium">
              بصفتك: <span className="text-saudi-glow font-bold">{currentActingMod.name}</span> ({currentActingMod.role})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <label className="text-xs text-gray-400 font-bold hidden sm:inline">تبديل المشرف للمطابقة:</label>
          <select
            value={actingModIndex}
            onChange={(e) => setActingModIndex(parseInt(e.target.value, 10))}
            className="bg-black text-white px-3 py-2 text-xs rounded-xl border border-white/10 outline-none w-full sm:w-auto"
          >
            {availableModerators.map((mod, index) => (
              <option key={mod.id || index} value={index}>
                {mod.name} &bull; {mod.role}
              </option>
            ))}
            <option value={999}>مشرف خارجي غير مصرح له (تجربة حماية الصلاحية)</option>
          </select>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 bg-neutral-900 border border-white/10 text-xs hover:bg-[#151515] rounded-xl flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            عرض كامل سجل التدقيق 📋
          </button>
        </div>
      </div>

      {/* Main List and Search Grid */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
        {/* Table Top Header controls */}
        <div className="p-5 border-b border-white/5 bg-[#0C0C0C] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-saudi-green" />
            قائمة الحسابات الموثقة حالياً بالمنصة
          </h4>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو المعرف الرقمي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-neutral-900 border border-white/15 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saudi-green"
            />
          </div>
        </div>

        {/* Responsive Cards Stack & Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0F0F0F] text-gray-400 font-bold border-b border-white/5">
                <th className="p-4">صورة الحساب والاسم</th>
                <th className="p-4">حالة الشارة</th>
                <th className="p-4">تصنيف الحساب</th>
                <th className="p-4">المُفوض المانح للتوثيق</th>
                <th className="p-4">تاريخ المنح</th>
                <th className="p-4 text-center">سبب وثيقة التوثيق والاعتماد</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filteredRecords.map((rec) => (
                <tr key={rec.username} className={`hover:bg-white/2 transition-colors ${!rec.isTrusted ? "opacity-50" : ""}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={rec.avatar} 
                        alt={rec.name} 
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                      />
                      <div>
                        <div className="font-bold text-white text-xs">{rec.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">@{rec.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {rec.isTrusted ? (
                      <span className="inline-flex items-center gap-1.5 bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <Check className="w-3 h-3 text-saudi-green stroke-[3]" />
                        موثق ومؤمن
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <UserX className="w-3 h-3 text-red-400" />
                        مسحوب التوثيق
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-md bg-neutral-800 text-gray-300 font-medium text-[10px]">
                      {rec.accountType}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-gray-400">
                    {rec.grantedBy || "ـ"}
                  </td>
                  <td className="p-4 font-mono text-gray-500 text-[10px]">
                    {rec.grantedAt ? new Date(rec.grantedAt).toLocaleDateString("ar-SA") : "قيد المراجعة"}
                  </td>
                  <td className="p-4 text-right max-w-xs truncate">
                    <span className="text-gray-400 italic text-[11px]" title={rec.reason}>
                      {rec.reason || "لا يوجد شرح تفصيلي"}
                    </span>
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      {rec.isTrusted ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUsername(rec.username);
                              setEditReasonText(rec.reason);
                              setShowReasonModal(true);
                            }}
                            title="تعديل سبب التوثيق"
                            className="p-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/5 rounded-lg font-bold text-[10px] flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            تعديل السبب
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUsername(rec.username);
                              setShowRevokeModal(true);
                            }}
                            title="سحب شارة التوثيق"
                            className="p-1 px-2.5 bg-red-650 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors"
                          >
                            <UserX className="w-3 h-3" />
                            سحب الشارة
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setTargetUserSelected(rec.username);
                            setGrantAccountType(rec.accountType);
                            setShowGrantModal(true);
                          }}
                          className="p-1 px-2.5 bg-saudi-green/20 hover:bg-saudi-green text-saudi-glow hover:text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          إعادة تفعيل
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 font-medium">
                    🔍 لا توجد حسابات مطابقة لشروط البحث بالمنصة حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================== GRANT MOUNT MODAL ================== */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <form onSubmit={handleGrantBadge} className="bg-neutral-950 border border-saudi-green/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-white/5 bg-neutral-900 flex justify-between items-center">
              <h3 className="font-bold font-tajawal text-sm text-saudi-glow flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-saudi-green" />
                منح شارة الحساب الموثوق (تأكيد معتمد)
              </h3>
              <button type="button" onClick={() => setShowGrantModal(false)} className="text-gray-500 hover:text-white text-xs">&times; إغلاق</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>يرجى مراجعة الاسم والصفة القانونية والتحقق المزدوج قبل منح شارة التوثيق. النظام يحفظ الإجراء كقرار سيادي غير قابل للمسح.</span>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">المستخدم المستهدف بالمنصة:</label>
                <select
                  value={targetUserSelected}
                  onChange={(e) => setTargetUserSelected(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-saudi-green outline-none"
                >
                  <option value="">-- اختر حساباً من المسجلين بالمنصة --</option>
                  {globalUsers.map(usr => (
                    <option key={usr.id} value={usr.username}>
                      {usr.name} (@{usr.username}) &bull; {usr.phone || "معرف مجهول"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">تصنيف جهة التوثيق:</label>
                  <select
                    value={grantAccountType}
                    onChange={(e) => setGrantAccountType(e.target.value as any)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-saudi-green outline-none"
                  >
                    <option value="شخصي">شخصي (شخصية عامة / إعلامي)</option>
                    <option value="صانع محتوى">صانع محتوى (مستكشف / فنان)</option>
                    <option value="شركة">شركة (قطاع أعمال وطني)</option>
                    <option value="جهة رسمية">جهة رسمية (رسمي حكومي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">عنوان الـ IP للمسؤول:</label>
                  <input
                    type="text"
                    value={formIP}
                    onChange={(e) => setFormIP(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">مبررات وسبب منح شارة التوثيق (يظهر عند مرور المؤشر):</label>
                <textarea
                  required
                  rows={3}
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="مثال: يمتلك سجلاً تجارياً موثقاً / صانع محتوى فوتوغرافي مشارك في شروق الرياض..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-saudi-green outline-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-white/5 bg-neutral-900 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-saudi-green text-white rounded-xl text-xs font-bold font-tajawal hover:bg-saudi-green/95"
              >
                تأكيد ومنح الشارة المعتمدة رسمياً 🇸🇦
              </button>
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
                className="px-5 py-3 bg-neutral-800 text-white rounded-xl text-xs font-bold font-tajawal hover:bg-neutral-700"
              >
                إلغاء التراجع
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================== REVOKE MOUNT MODAL ================== */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <form onSubmit={handleRevokeBadge} className="bg-neutral-950 border border-red-500/20 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-white/5 bg-neutral-900 flex justify-between items-center">
              <h3 className="font-bold font-tajawal text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                سحب وإلغاء شارة التوثيق
              </h3>
              <button type="button" onClick={() => setShowRevokeModal(false)} className="text-gray-500 hover:text-white text-xs">&times; إغلاق</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-300 leading-normal">
                أنت على وشك القيام بإلغاء شارة الحساب المعتمد للمستخدم <span className="text-red-400 font-bold">@{selectedUsername}</span>. سيتم سحب تأثيرات النيون وشعار وثيقة الأمان من كامل ملفه الشخصي ومشاركاته فوراً.
              </p>

              <div>
                <label className="block text-gray-400 font-bold mb-1">سبب سحب شارة التوثيق الحالي (إلزامي):</label>
                <textarea
                  required
                  rows={2}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="مثال: انتهاك ميثاق السلوك الفاخر / استخدام اسم مستعار مضلل..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">عنوان الـ IP للمسؤول:</label>
                <input
                  type="text"
                  value={formIP}
                  onChange={(e) => setFormIP(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                />
              </div>
            </div>

            <div className="p-5 border-t border-white/5 bg-neutral-900 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-tajawal transition-colors"
              >
                تأكيد سحب الشارة وتوثيق السجل 🔒
              </button>
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="px-5 py-3 bg-neutral-800 text-white rounded-xl text-xs font-bold font-tajawal hover:bg-neutral-700"
              >
                إلغاء التراجع
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================== EDIT REASON MODAL ================== */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateReason} className="bg-neutral-950 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-white/5 bg-neutral-900 flex justify-between items-center">
              <h3 className="font-bold font-tajawal text-sm text-gray-200 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-saudi-green" />
                تعديل وتحديث مبررات التوثيق المعتمد
              </h3>
              <button type="button" onClick={() => setShowReasonModal(false)} className="text-gray-500 hover:text-white text-xs">&times; إغلاق</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-gray-400">
                سيتم تحديث النص المكتوب الذي يظهر كـ Tooltip للمتابعين وللمجتمع عند الوقوف على شارة الحساب @{selectedUsername}.
              </p>

              <div>
                <label className="block text-gray-400 font-bold mb-1">سبب ومبررات التوثيق الجديدة:</label>
                <textarea
                  required
                  rows={3}
                  value={editReasonText}
                  onChange={(e) => setEditReasonText(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-saudi-green outline-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-white/5 bg-neutral-900 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-saudi-green text-white rounded-xl text-xs font-bold font-tajawal hover:bg-saudi-green/95"
              >
                تحديث وحفظ التغييرات
              </button>
              <button
                type="button"
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2.5 bg-neutral-800 text-white rounded-xl text-xs font-bold font-tajawal hover:bg-neutral-700"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================== AUDIT LOGS MODAL ================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999] flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
            <div className="p-5 border-b border-white/5 bg-neutral-900 flex justify-between items-center shrink-0">
              <h3 className="font-bold font-tajawal text-sm text-white flex items-center gap-2">
                <History className="w-5 h-5 text-yellow-500" />
                سجل تدقيق وإدارة شارات التحقق (Audit Trail Logs - Read Only)
              </h3>
              <button type="button" onClick={() => setShowHistoryModal(false)} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs">إغلاق النافذة</button>
            </div>

            <div className="p-4 bg-yellow-550/10 border-b border-white/5 text-[10px] text-yellow-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-yellow-500" />
              <span>هوية أمنية سيادية: السجل مشفر بالكامل ولا توجد أي أدوات أو مفاتيح تسمح بحذف أو تعديل عمليات تدقيق منح وسحب الشارات بأثر رجعي.</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar text-right">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-white/2 border border-white/5 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        log.action === "منح الشارة" 
                          ? "bg-saudi-green/10 text-saudi-glow" 
                          : log.action === "سحب الشارة" 
                          ? "bg-red-500/10 text-red-400" 
                          : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-gray-300">للمستخدم: <span className="font-bold text-white">@{log.targetUsername}</span></span>
                    </div>
                    
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      سبب الإجراء: {log.reason}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 pt-1.5 border-t border-white/2 mt-1.5">
                      <span>المدير المسؤول: <span className="text-gray-300 font-bold">{log.adminName}</span></span>
                      <span>معرّف الإجراء: <span className="font-mono text-gray-400">{log.id}</span></span>
                      <span>توقيت العملية: <span className="font-mono text-gray-400">{new Date(log.timestamp).toLocaleString("ar-SA")}</span></span>
                    </div>
                  </div>

                  <div className="text-left font-mono text-[10px] text-gray-500 shrink-0 self-start sm:self-auto">
                    🌐 IP: {log.ip}
                  </div>
                </div>
              ))}

              {auditLogs.length === 0 && (
                <div className="py-16 text-center text-gray-500 space-y-2">
                  <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="font-tajawal text-xs">لا يوجد أي عمليات مسجلة بالسجل بعد.</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/5 bg-neutral-900 flex justify-end shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl font-bold text-xs"
              >
                تأكيد ومطابقة السجل الأمني
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
