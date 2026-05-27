// AccessCodesManager.tsx - نظام إدارة رموز الوصول المشفرة لمشرفي منصة SNNS.PRO
import React, { useState, useEffect } from "react";
import { 
  Plus, Shield, ShieldCheck, Trash2, Key, Calendar, PlusCircle, CheckCircle, RefreshCcw, Loader2, Search, Filter, Ban, ToggleLeft, ToggleRight, Copy, Check
} from "lucide-react";
import { db, auth } from "../../utils/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

interface AccessCode {
  code: string;
  role: string;
  expires_at: string;
  created_by: string;
  is_active: boolean;
}

export default function AccessCodesManager() {
  const [codesList, setCodesList] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // New Code Form states
  const [newCode, setNewCode] = useState("");
  const [newRole, setNewRole] = useState("moderator");
  const [expiryDays, setExpiryDays] = useState("7");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Copy indicator state mapping code to boolean
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // Fetch access codes from database
  const fetchAccessCodes = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const accessCodesRef = collection(db, "access_codes");
      const snap = await getDocs(accessCodesRef);
      const list: AccessCode[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          code: docSnap.id,
          role: data.role || "moderator",
          expires_at: data.expires_at || "",
          created_by: data.created_by || "مجهول",
          is_active: data.is_active !== false
        });
      });
      setCodesList(list);
    } catch (err: any) {
      console.error("Error fetching access codes from Firestore:", err);
      setErrorMsg("حدث خطأ أثناء الاتصال بقاعدة البيانات لجلب رموز التحكم.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessCodes();
  }, []);

  // Generate random strong security code
  const handleAutoGenerateCode = () => {
    setIsGenerating(true);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "SNNS-";
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) token += "-";
    }
    setNewCode(token);
    setTimeout(() => setIsGenerating(false), 200);
  };

  // Create a brand new code in Firestore
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const codeString = newCode.trim();
    if (!codeString || codeString.length < 5) {
      setErrorMsg("الرجاء صياغة أو توليد رمز مرور أمني صحيح ومكتمل.");
      return;
    }

    // Determine absolute expiration datetime
    let expiryISO = "";
    if (expiryDays === "custom") {
      if (!customExpiryDate) {
        setErrorMsg("الرجاء اختيار تاريخ انتهاء الصلاحية المخصص.");
        return;
      }
      expiryISO = new Date(customExpiryDate).toISOString();
    } else {
      const days = parseInt(expiryDays);
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiryISO = d.toISOString();
    }

    try {
      const creatorEmail = auth.currentUser?.email || "super_admin@snns.pro";
      const docRef = doc(db, "access_codes", codeString);
      
      const payload: AccessCode = {
        code: codeString,
        role: newRole,
        expires_at: expiryISO,
        created_by: creatorEmail,
        is_active: true
      };

      await setDoc(docRef, payload);
      setSuccessMsg("✓ تم توليد الرمز وإيداعه بقاعدة البيانات بنجاح!");
      setNewCode("");
      setCustomExpiryDate("");
      
      // Refresh list
      fetchAccessCodes();
    } catch (err: any) {
      console.error("Error writing access code to Firestore:", err);
      setErrorMsg("فشل تسجيل الرمز في Firestore: تأكد من الصلاحيات الأمنية.");
    }
  };

  // Toggle activation status
  const handleToggleActive = async (code: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, "access_codes", code);
      await updateDoc(docRef, { is_active: !currentStatus });
      
      setCodesList(prev => prev.map(item => 
        item.code === code ? { ...item, is_active: !currentStatus } : item
      ));
      
      setSuccessMsg("✓ تم تعديل حالة تنشيط الرمز فورا.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error toggling active state:", err);
      setErrorMsg("فشل تحديث حالة التفعيل في قاعدة البيانات.");
    }
  };

  // Delete code
  const handleDeleteCode = async (code: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الرمز الأمني (${code}) نهائياً؟`)) {
      return;
    }
    try {
      const docRef = doc(db, "access_codes", code);
      await deleteDoc(docRef);
      
      setCodesList(prev => prev.filter(item => item.code !== code));
      setSuccessMsg("✓ تم إتلاف الرمز الأمني بأمان.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error deleting access code:", err);
      setErrorMsg("تعذر حذف الرمز من الخادم.");
    }
  };

  // Helper function to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [text]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [text]: false }));
    }, 2500);
  };

  // Role labels
  const roleLabels: Record<string, string> = {
    super_admin: "المدير العام (Super Admin)",
    admin: "مسؤول النظام (Admin)",
    security: "مشرف الأمن والسيبراني (Security)",
    verification: "مدقق التوثيق والهويات (Verification)",
    moderator: "مشرف المحتوى والبث (Moderator)",
    content_moderator: "مشرف محتوى متخصص"
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === "super_admin") return "bg-red-500/10 border-red-500/30 text-red-400";
    if (role === "admin") return "bg-orange-500/10 border-orange-500/30 text-orange-400";
    if (role === "security") return "bg-blue-500/10 border-blue-500/30 text-blue-400";
    if (role === "verification") return "bg-purple-500/10 border-purple-500/30 text-purple-400";
    return "bg-saudi-green/10 border-saudi-green/30 text-saudi-glow";
  };

  // Filter & Search computation
  const filteredCodes = codesList.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.created_by.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || item.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 font-tajawal text-right" dir="rtl">
      
      {/* Header telemetry info bar */}
      <div className="bg-[#0A0A0A] border border-saudi-green/10 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-saudi-green/5 blur-3xl pointer-events-none rounded-full" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-saudi-glow" />
              <span>مستودع ورموز الوصول المشفرة 🔑</span>
            </h2>
            <p className="text-xs text-gray-400">
              يمكنك كمدير عام توليد وتوزيع رموز وصول فوري مخصصة للمشرفين والمسؤولين لربط صلاحياتهم بقاعدة بيانات ديوان الهوية الرقمية.
            </p>
          </div>
          <button 
            onClick={fetchAccessCodes}
            disabled={isLoading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-white/5 transition-all cursor-pointer"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>تحديث البيانات المباشرة</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CREATE SECTION FORM */}
        <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl h-fit space-y-6">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <PlusCircle className="w-5 h-5 text-saudi-green" />
            <span>توليد كود وصول جديد</span>
          </h3>

          <form onSubmit={handleCreateCode} className="space-y-4">
            
            {/* Enter / Generate Code */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400 font-bold">الرمز السري الفريد:</label>
                <button
                  type="button"
                  onClick={handleAutoGenerateCode}
                  disabled={isGenerating}
                  className="text-saudi-glow text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>توليد عشوائي آمن</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="مثال: SNNS-AZ9J-P14D-T88X"
                className="w-full h-11 bg-neutral-900 border border-white/10 rounded-xl px-4 text-center text-xs font-mono font-bold tracking-wider text-saudi-glow focus:border-saudi-green focus:outline-none transition-all"
              />
            </div>

            {/* Select Role Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold">مستوى الترخيص الممنوح بالرمز:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-11 bg-neutral-900 border border-white/10 rounded-xl px-3.5 text-xs text-gray-300 focus:border-saudi-green focus:outline-none transition-all"
              >
                <option value="super_admin">المدير العام (Super Admin)</option>
                <option value="admin">مسؤول النطاق (Admin)</option>
                <option value="security">حرس الأمن والسيبرانية (Security Officer)</option>
                <option value="verification">مدقق الوثائق والتوثيق المعتمد (Verification)</option>
                <option value="moderator">مشرف رقابة المحتوى ورصد البث (Content Moderator)</option>
              </select>
            </div>

            {/* Expired date period */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold">مدة الصلاحية الفعالة للرمز:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "1", label: "يوم واحد" },
                  { value: "7", label: "7 أيام" },
                  { value: "30", label: "شهر" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpiryDays(opt.value)}
                    className={`h-9 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                      expiryDays === opt.value
                        ? "bg-saudi-green/15 text-saudi-glow border-saudi-green/40 shadow-[0_0_10px_rgba(0,163,79,0.1)]"
                        : "bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setExpiryDays("custom")}
                className={`w-full h-9 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  expiryDays === "custom"
                    ? "bg-saudi-green/15 text-saudi-glow border-saudi-green/40"
                    : "bg-white/[0.02] text-gray-400 border-white/5 hover:bg-white/5"
                }`}
              >
                تحديد تاريخ مخصص
              </button>

              {expiryDays === "custom" && (
                <div className="pt-2">
                  <input
                    type="date"
                    required
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    className="w-full h-10 bg-neutral-900 border border-white/10 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:border-saudi-green font-mono"
                  />
                </div>
              )}
            </div>

            {/* Error & Success Feeds */}
            {errorMsg && (
              <p className="text-red-400 text-xs font-bold leading-relaxed">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-saudi-glow text-xs font-bold leading-relaxed">{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-saudi-green hover:bg-saudi-green/90 text-white text-xs font-black rounded-xl shadow-lg shadow-saudi-green/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إرسال وتسجيل الكلمة 🔑</span>
            </button>
          </form>
        </div>

        {/* LIST SECTION VIEW */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-6">
          
          {/* List Headers with search and filter controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-saudi-glow animate-pulse" />
              <span>الرموز النشطة والمنهية ({filteredCodes.length})</span>
            </h3>
            
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-neutral-905 bg-[#121212] border border-white/10 rounded-xl py-1.5 px-3 pr-8 text-[11px] font-bold text-gray-400 focus:outline-none focus:border-saudi-green cursor-pointer"
                >
                  <option value="all">كل الرخص</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="security">Security</option>
                  <option value="verification">Verification</option>
                  <option value="moderator">Moderator</option>
                </select>
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بالرمز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-905 bg-[#121212] border border-white/10 rounded-xl py-1.5 px-3.5 pr-8 pl-3 text-[11px] w-36 md:w-48 focus:outline-none focus:border-saudi-green transition-all"
                />
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              </div>
            </div>
          </div>

          {isLoading && codesList.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="w-10 h-10 text-saudi-green animate-spin mx-auto" />
              <p className="text-xs text-gray-500">جاري قراءة وتشفير خلايا الرموز الأمنية...</p>
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl">
              <Key className="w-10 h-10 text-gray-750 text-gray-600 mx-auto mb-3" />
              <p className="text-xs text-gray-400">لا توجد رموز فك قفل مطابقة لفرز البحث الحالي.</p>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[500px] scrollbar-none">
              {filteredCodes.map((item) => {
                const isExpired = new Date(item.expires_at).getTime() < Date.now();
                return (
                  <div 
                    key={item.code}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      !item.is_active || isExpired
                        ? "bg-white/[0.01] border-white/5 opacity-60"
                        : "bg-[#0d0d0d] border-[#00A34F]/10 hover:border-[#00A34F]/25 shadow-[0_2px_10px_rgba(0,163,79,0.01)]"
                    }`}
                  >
                    
                    {/* Left block information */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[12.5px] font-black text-white select-all">{item.code}</span>
                        
                        <button
                          onClick={() => copyToClipboard(item.code)}
                          className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                          title="نسخ الرمز السري"
                        >
                          {copiedStates[item.code] ? (
                            <Check className="w-3.5 h-3.5 text-saudi-glow" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeColor(item.role)}`}>
                          {roleLabels[item.role] || item.role}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>انتهاء: {new Date(item.expires_at).toLocaleDateString('ar-SA')}</span>
                        </span>
                        <span>•</span>
                        <span>بواسطة: {item.created_by}</span>
                      </div>
                    </div>

                    {/* Right actions block controls */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 border-white/5 pt-2 md:pt-0">
                      
                      {/* Expired indicators */}
                      {isExpired ? (
                        <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg font-bold">منتهي الصلاحية</span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(item.code, item.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border cursor-pointer transition-all ${
                            item.is_active
                              ? "bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-saudi-green/5 hover:bg-saudi-green/10 text-saudi-glow border-saudi-green/20"
                          }`}
                        >
                          {item.is_active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                          <span>{item.is_active ? "تعطيل العمل" : "تنشيط العمل"}</span>
                        </button>
                      )}

                      {/* Delete icon */}
                      <button
                        onClick={() => handleDeleteCode(item.code)}
                        className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/15 text-red-400 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
