// BusinessAccountsManager.tsx - وحدة التحكم في الحسابات التجارية وحملات الإعلانات لمنصة SNNS.PRO

import React, { useState, useEffect } from "react";
import { 
  Building2, ShieldCheck, ShieldAlert, FileText, Download, Check, X, AlertTriangle, 
  Search, Eye, Ban, HelpCircle, Calendar, Mail, Phone, Globe, User, ListFilter, Play, Award, Sparkles, MessageCircle
} from "lucide-react";
import { 
  getBusinessAccounts, saveBusinessAccounts, BusinessAccount,
  getAdCampaigns, saveAdCampaigns, AdCampaign, 
  canViewOfficialBusinessData, BusinessVerificationStatus, AdStatus
} from "../../utils/businessStore";
import { addThreatLog } from "../../utils/securityWatchdogStore";

export default function BusinessAccountsManager() {
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [tabMode, setTabMode] = useState<"accounts" | "campaigns">("accounts");
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignSearch, setCampaignSearch] = useState("");
  
  // Privacy Role simulator - to test constraint #15 explicitly in UI
  const [currentRole, setCurrentRole] = useState<"super_admin" | "moderator_no_claim" | "moderator_with_claim">("super_admin");
  const [unlockedSensitiveData, setUnlockedSensitiveData] = useState(false);

  // Rejection Modals/States
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionType, setRejectionType] = useState<"account" | "campaign">("account");

  // Load Store data on Mount and keep synchronized
  useEffect(() => {
    setAccounts(getBusinessAccounts());
    setCampaigns(getAdCampaigns());
  }, []);

  const syncData = () => {
    setAccounts(getBusinessAccounts());
    setCampaigns(getAdCampaigns());
  };

  // Helper to count active ads per merchant
  const getMerchantAdsCount = (businessId: string) => {
    return campaigns.filter(c => c.businessId === businessId).length;
  };

  // Verification Privilege check (Req 15)
  const isAuthorized = () => {
    if (currentRole === "super_admin") return true;
    if (currentRole === "moderator_with_claim") return true;
    return unlockedSensitiveData; // or temporary unlocked via Sentry authorization
  };

  // Masking helpers for privacy (Req 15)
  const maskText = (text: string, count = 4) => {
    if (!text) return "—";
    if (isAuthorized()) return text;
    return text.substring(0, text.length - count) + "•".repeat(count);
  };

  // 6. Verification state change actions
  const handleVerifyAccountStatus = (id: string, newStatus: BusinessVerificationStatus, reason?: string) => {
    const list = getBusinessAccounts();
    const updated = list.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          verificationStatus: newStatus,
          status: newStatus === "approved" ? "active" : acc.status,
          notes: reason ? `ملاحظات المراجعة: ${reason}` : acc.notes
        };
      }
      return acc;
    });
    saveBusinessAccounts(updated);
    setAccounts(updated);

    // Track in security logs for smart sentry audit
    const changedAcc = updated.find(a => a.id === id);
    if (changedAcc) {
      addThreatLog({
        userId: "admin_panel",
        ip: changedAcc.signupIp || "127.0.0.1",
        countryName: "المملكة العربية السعودية",
        countryCode: "SA",
        flag: "🇸🇦",
        device: "لوحة تحكم المشرف العام",
        browser: "SNNS Chrome Admin Profile",
        eventType: "account_uclock_admin",
        riskScore: "low",
        actionTaken: "none",
        notes: `تم تحديث حالة تفعيل منشأة (${changedAcc.businessName}) إلى [${newStatus}] بنجاح.`,
        verified: true
      });
    }
  };

  // Account suspend / activate toggle
  const handleToggleAccountSuspension = (id: string) => {
    const list = getBusinessAccounts();
    const updated = list.map(acc => {
      if (acc.id === id) {
        const nextState = acc.status === "active" ? "suspended" : "active";
        return { ...acc, status: nextState as any };
      }
      return acc;
    });
    saveBusinessAccounts(updated);
    setAccounts(updated);
  };

  // 13. Campaign Reviews before publication (Accept, Reject, Request Edits)
  const handleCampaignReview = (id: string, newStatus: AdStatus, reason?: string) => {
    const list = getAdCampaigns();
    const updated = list.map(camp => {
      if (camp.id === id) {
        return {
          ...camp,
          status: newStatus,
          rejectionReason: reason || camp.rejectionReason
        };
      }
      return camp;
    });
    saveAdCampaigns(updated);
    setCampaigns(updated);
  };

  // Handle document download / inspect modal
  const handleInspectDocument = (acc: BusinessAccount) => {
    if (!isAuthorized()) {
      alert("❌ خطأ بالخصوصية والاختراق: ليس لديك صلاحية الاطلاع على السجل التجاري الرسمي لهذه المنشأة (المستوى الأمني review_business_accounts مطلوب)!");
      return;
    }
    
    // Simulate safe document rendering download
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>معاينة السجل التجاري - ${acc.businessName}</title>
            <style>
              body { background: #080808; color: #fff; font-family: system-ui, sans-serif; text-align: center; padding: 40px; }
              .box { border: 2px dashed #00A34F; padding: 30px; border-radius: 12px; display: inline-block; max-width: 600px; margin-top: 50px; }
              h2 { color: #00A34F; }
              p { font-size: 14px; opacity: 0.8; }
              .btn { background: #00A34F; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="box">
              <h2>السجل التجاري الرسمي والبيانات الجمركية الموثقة</h2>
              <hr style="opacity: 0.1; margin: 20px 0;">
              <p>📍 المنشأة: <strong>${acc.businessName}</strong></p>
              <p>📇 رقم السجل: <code>${acc.crNumber}</code></p>
              <p>👤 المسؤول: <strong>${acc.managerName}</strong></p>
              <p>📅 تاريخ التسجيل: ${acc.registrationDate}</p>
              <p>اسم المستند المرفوع: <strong>${acc.crDocumentName}</strong></p>
              <br>
              <p style="color: #ea9a3c; font-size:12px;">✅ مستند السجل سليم وتم تشفيره وتخزينه في الخادم الآمن للمنصة وفق تشريعات الأمن السيبراني.</p>
              <br>
              <a href="#" class="btn" onclick="window.close()">إغلاق المعاينة</a>
            </div>
          </body>
        </html>
      `);
      win.document.close();
    } else {
      alert(`📂 تمت محاكاة تحميل المستند بالنجاح: ${acc.crDocumentName}\nالرقم المعتمد: ${acc.crNumber}`);
    }
  };

  // Filtered Lists
  const filteredAccounts = accounts.filter(acc => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = 
      acc.businessName.toLowerCase().includes(s) || 
      acc.crNumber.includes(s) || 
      acc.username.toLowerCase().includes(s) || 
      acc.managerName.toLowerCase().includes(s);
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && acc.verificationStatus === statusFilter;
  });

  const filteredCampaigns = campaigns.filter(camp => {
    const s = campaignSearch.toLowerCase();
    return (
      camp.campaignName.toLowerCase().includes(s) || 
      camp.businessName.toLowerCase().includes(s) || 
      camp.category.includes(s)
    );
  });

  return (
    <div className="p-6 space-y-6 text-right" dir="rtl">
      
      {/* Page Header and Subtitle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-l from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl gap-4">
        <div>
          <span className="text-[10px] text-saudi-glow font-bold block mb-1">مركز معالجات التحقق ورصد الانتحال 🇸🇦</span>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-saudi-glow" />
            إدارة المنشآت والحسابات التجارية والإعلانات
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            مراجعة السجلات التجارية الصادرة من وزارة التجارة وتراخيص الشركات والمؤسسات لضمان خلو منصة SNNS.PRO من الحسابات الوهمية.
          </p>
        </div>

        {/* 15. Privacy control authorization switcher */}
        <div className="p-3 bg-[#0d0d0d] border border-white/5 rounded-2xl flex flex-col gap-1 shrink-0 text-xs w-full sm:w-auto">
          <span className="font-bold text-gray-400 text-[10px] block">المستوى الأمني والصلاحيات (اختبار الخصوصية):</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <button 
              onClick={() => { setCurrentRole("super_admin"); setUnlockedSensitiveData(true); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${currentRole === "super_admin" ? "bg-saudi-green text-white border-saudi-green" : "bg-neutral-900 text-gray-500 border-white/5"}`}
            >
              Super Admin 👑
            </button>
            <button 
              onClick={() => { setCurrentRole("moderator_with_claim"); setUnlockedSensitiveData(true); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${currentRole === "moderator_with_claim" ? "bg-blue-600 text-white border-blue-600" : "bg-neutral-900 text-gray-500 border-white/5"}`}
            >
              مدقق مالي ولديه ترخيص 🔐
            </button>
            <button 
              onClick={() => { setCurrentRole("moderator_no_claim"); setUnlockedSensitiveData(false); }}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${currentRole === "moderator_no_claim" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-neutral-900 text-gray-500 border-white/5"}`}
            >
              مدقق عادي (محجوب البيانات) 🚫
            </button>
          </div>
        </div>
      </div>

      {/* Internal Navigation tabs */}
      <div className="flex border-b border-white/5 bg-neutral-950 rounded-2xl p-1 gap-1 text-xs font-bold">
        <button 
          onClick={() => setTabMode("accounts")}
          className={`flex-1 py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tabMode === "accounts" ? "bg-saudi-green/10 text-saudi-glow border border-saudi-green/20" : "text-gray-500 hover:text-white"}`}
        >
          <Building2 className="w-4 h-4" />
          <span>إدارة طلبات توثيق المنشآت ({filteredAccounts.length} حساب)</span>
        </button>
        <button 
          onClick={() => setTabMode("campaigns")}
          className={`flex-1 py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${tabMode === "campaigns" ? "bg-saudi-green/10 text-saudi-glow border border-saudi-green/20" : "text-gray-500 hover:text-white"}`}
        >
          <Play className="w-4 h-4" />
          <span>مراجعة الحملات الإعلانية ({filteredCampaigns.length} إعلان جاري)</span>
        </button>
      </div>

      {/* TAB 1: ACCOUNTS LISTING AND CONTROLS */}
      {tabMode === "accounts" && (
        <div className="space-y-4">
          
          {/* Quick Filter actions bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-xs bg-[#0b0b0b] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-gray-500 shrink-0">حالة المستند:</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-white/5 px-3 py-1.5 rounded-xl text-xs text-white outline-none focus:border-saudi-green w-40"
              >
                <option value="all">كافة الطلبات</option>
                <option value="pending">قيد مراجعة السجل ⏳</option>
                <option value="approved">موثق ومعتمد رسميًا ✅</option>
                <option value="rejected">مستبعد / مرفوض ❌</option>
                <option value="edit_requested">مستند يحتاج تعديل ⚠️</option>
              </select>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="ابحث باسم الشركة، السجل أو المسؤول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-xl pr-10 pl-4 py-2 text-xs focus:border-saudi-green outline-none"
              />
            </div>
          </div>

          {/* Accounts grid ledger */}
          <div className="grid grid-cols-1 gap-4">
            {filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-neutral-950/40 rounded-3xl border border-white/5">
                <ShieldAlert className="w-10 h-10 text-gray-650 mx-auto mb-3" />
                <p className="text-xs">لم يتم العثور على أي حسابات في هذه الفئة حالياً.</p>
              </div>
            ) : (
              filteredAccounts.map(acc => {
                const isApproved = acc.verificationStatus === "approved";
                const isPending = acc.verificationStatus === "pending";
                
                return (
                  <div key={acc.id} className="bg-neutral-950/80 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
                    
                    {/* Upper row: brand, type, badges & status */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
                      <div className="flex items-start gap-3.5 text-right">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                          {acc.logoUrl ? (
                            <img src={acc.logoUrl} alt="logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-sm text-white">{acc.businessName}</h3>
                            {acc.businessType === "company" ? (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                شركة موثقة 🏢
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" />
                                مؤسسة موثقة 🇸🇦
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10.5px] text-gray-400 mt-0.5">
                            المعرف العام: <span className="text-saudi-glow font-mono">@{acc.username}</span> • البريد: {acc.email}
                          </p>
                        </div>
                      </div>

                      {/* Status signals */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border ${
                          acc.verificationStatus === "approved" ? "bg-saudi-green/10 text-saudi-glow border-saudi-green/20" :
                          acc.verificationStatus === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                          acc.verificationStatus === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}>
                          {acc.verificationStatus === "approved" ? "✓ معتمد وموثق تجاريًا" :
                           acc.verificationStatus === "pending" ? "⏳ بانتظار تدقيق السجل" :
                           acc.verificationStatus === "rejected" ? "❌ تفعيل مرفوض" :
                           "⚠️ مطلوب تعديل المستند"}
                        </span>

                        <span className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold ${
                          acc.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
                        }`}>
                          {acc.status === "active" ? "المنشأة نشطة" : "الحساب موقوف"}
                        </span>
                      </div>
                    </div>

                    {/* Middle grid details - strictly governed by permission review_business_accounts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0a0a0a] p-4 rounded-2xl border border-white/3 text-xs leading-relaxed">
                      <div>
                        <span className="text-[9px] text-gray-550 block mb-0.5">نوع النشاط التجاري:</span>
                        <p className="text-white font-medium">{acc.activityType}</p>
                      </div>

                      {/* Confidential Details under lock constraint */}
                      <div>
                        <span className="text-[9px] text-gray-550 block mb-0.5">رقم السجل التجاري والمسؤول الحقيقي:</span>
                        <p className="font-mono text-white">
                          CR-{isAuthorized() ? acc.crNumber : "••••••••••"}
                        </p>
                        <p className="text-[10px] text-saudi-glow font-bold">
                          مدير المنشأة: {maskText(acc.managerName, 5)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-550 block mb-0.5">الاتصال الجغرافي والجوال الموثق:</span>
                        <p className="font-mono text-gray-300">{maskText(acc.officialMobile, 6)}</p>
                        <p className="text-gray-400 truncate">{maskText(acc.officialEmail, 7)}</p>
                      </div>

                      <div>
                        <span className="text-[9px] text-gray-550 block mb-0.5">إحصائيات إعلانات الحساب:</span>
                        <p className="text-white font-bold text-sm font-mono text-end">{getMerchantAdsCount(acc.id)} إعلانات ترويجية</p>
                        <span className="text-[9.5px] text-gray-550 font-sans block text-right">تاريخ التسجيل: {acc.registrationDate}</span>
                      </div>
                    </div>

                    {/* Extra security metadata log attached */}
                    <div className="flex flex-col sm:flex-row justify-between text-[10px] text-gray-500 gap-2 border-t border-white/5 pt-3">
                      <div>
                        📍 عنوان الشركة الجغرافي: {maskText(acc.address, 12)}
                        {acc.website && (
                          <span className="mr-2 border-r border-white/10 pr-2">
                            الموقع: <a href={acc.website} target="_blank" rel="noreferrer" className="text-saudi-glow hover:underline">{acc.website}</a>
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-left">
                        IP المنشئ: {maskText(acc.signupIp || "45.120.55.90", 6)} • العتاد: {maskText(acc.signupDevice || "Windows PC", 5)}
                      </div>
                    </div>

                    {/* Action Panel for reviewing & approving registrations */}
                    <div className="flex flex-wrap gap-2 justify-end pt-2">
                      <button 
                        onClick={() => handleInspectDocument(acc)}
                        className={`py-1.5 px-3 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                          isAuthorized() 
                            ? "bg-saudi-green/10 text-saudi-glow border-saudi-green/20 hover:bg-saudi-green/25" 
                            : "bg-red-950/25 text-red-400 border-red-900/40"
                        }`}
                      >
                        <FileText className="w-4.5 h-4.5" />
                        <span>معاينة وثيقة السجل التجاري المرفوعة 📄</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            onClick={() => handleVerifyAccountStatus(acc.id, "approved", "تم الموافقة والاعتماد بمطابقة السجل التجاري عبر الفايروال بنجاح.")}
                            className="bg-saudi-green hover:bg-saudi-green/90 text-white font-bold text-[11px] py-1.5 px-4 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Check className="w-4 h-4" />
                            قبول واعتماد الشارة الموثقة 🟢
                          </button>
                          
                          <button
                            onClick={() => {
                              setRejectionType("account");
                              setRejectionTargetId(acc.id);
                              setRejectionReason("");
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] py-1.5 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <X className="w-4 h-4" />
                            رفض وصرف السجل
                          </button>

                          <button
                            onClick={() => handleVerifyAccountStatus(acc.id, "edit_requested", "الرجاء رفع صورة سجل تجاري حديثة وواضحة المعالم وصادرة هذا العام.")}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                          >
                            ⚠️ طلب تعديل
                          </button>
                        </>
                      )}

                      {!isPending && (
                        <button
                          onClick={() => handleToggleAccountSuspension(acc.id)}
                          className={`py-1.5 px-3.5 rounded-xl text-[10.5px] font-bold transition-all border cursor-pointer ${
                            acc.status === "active" 
                              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" 
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5 shrink-0 inline ml-1" />
                          {acc.status === "active" ? "إيقاف المنشأة مؤقتاً" : "تنشيط وإلغاء التعليق"}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AD CAMPAIGNS REVIEWING */}
      {tabMode === "campaigns" && (
        <div className="space-y-4">
          
          <div className="flex justify-between items-center text-xs bg-[#0b0b0b] p-4 rounded-2xl border border-white/5">
            <span className="text-gray-400">ماتريكس رصد محتوى الإعلانات والجمهور المستهدف لمنع غسيل الأموال والابتزاز</span>
            <div className="relative w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="ابحث بالحملة أو المنشأة..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-xl pr-10 pl-4 py-2 text-xs focus:border-saudi-green outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.length === 0 ? (
              <div className="p-12 text-center text-gray-500 bg-neutral-950/40 rounded-3xl border border-white/5 col-span-2">
                <AlertTriangle className="w-10 h-10 text-gray-650 mx-auto mb-3" />
                <p className="text-xs">لا توجد حملات ترويجية في قاعدة البيانات حالياً.</p>
              </div>
            ) : (
              filteredCampaigns.map(camp => {
                const isUnderReview = camp.status === "pending_review";
                return (
                  <div key={camp.id} className="bg-neutral-950/90 border border-white/5 rounded-3xl p-5 space-y-4 hover:border-white/10 transition-all flex flex-col justify-between">
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2.5">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${
                          camp.status === "active" ? "bg-saudi-green/10 text-saudi-glow" :
                          camp.status === "pending_review" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                          camp.status === "rejected" ? "bg-red-500/10 text-red-500" :
                          "bg-purple-500/10 text-purple-400"
                        }`}>
                          {camp.status === "active" ? "نشط وممول" :
                           camp.status === "pending_review" ? "⏳ بانتظار المراجعة" :
                           camp.status === "rejected" ? "❌ مرفوض" : "⚠️ مطلوب تعديل"}
                        </span>

                        <div className="text-right">
                          <h4 className="font-extrabold text-xs text-white leading-normal">{camp.campaignName}</h4>
                          <span className="text-[10px] text-gray-500 font-bold block">بواسطة: {camp.businessName}</span>
                        </div>
                      </div>

                      {/* Campaign Graphics mockup */}
                      <div className="h-32 rounded-xl overflow-hidden relative border border-white/5">
                        {camp.mediaUrl ? (
                          <img src={camp.mediaUrl} alt="ad graphic" className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <div className="w-full h-full bg-white/2 flex items-center justify-center text-gray-650 text-xs">
                            لا يوجد مرفق بصري
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[8.5px] font-mono text-white">
                          تصنيف الإعلان: {
                            camp.type === "main" ? "إعلان رئيسي 🌟" :
                            camp.type === "in_stream" ? "داخل البث 🔴" :
                            camp.type === "between_videos" ? "بين الفيديوهات 🎬" :
                            camp.type === "sponsored" ? "ممول 🔥" : "بانر عريض 🗺️"
                          }
                        </div>
                      </div>

                      {/* Auditing criteria info */}
                      <div className="grid grid-cols-2 gap-2 bg-[#0c0c0c] p-2.5 rounded-xl text-[11px] text-gray-300 font-sans border border-white/3">
                        <div>
                          <span className="text-gray-500 block text-[9px] font-tajawal">ميزانية الحملة الفعلية:</span>
                          <span className="text-saudi-glow font-bold font-mono">{camp.budget.toLocaleString()} ر.س</span>
                        </div>
                        <div>
                          <span className="text-gray-550 block text-[9px] font-tajawal">المدة المقررة:</span>
                          <span>{camp.durationDays} أيام</span>
                        </div>
                        <div>
                          <span className="text-gray-550 block text-[9px] font-tajawal">البلد المستهدف:</span>
                          <span>🇸🇦 {camp.targetCountry}</span>
                        </div>
                        <div>
                          <span className="text-gray-550 block text-[9px] font-tajawal">المشاهدات المخططة:</span>
                          <span className="font-mono">{camp.targetViewsCount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-450 leading-relaxed pt-1">
                        🎯 الجمهور المستهدف: <span className="text-white font-medium">{camp.targetAudience}</span>
                        {camp.linkUrl && (
                          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-saudi-glow mt-1">
                            🔗 الرابط: <a href={camp.linkUrl} className="underline">{camp.linkUrl}</a>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action reviews footer */}
                    <div className="flex gap-2 justify-end pt-3 border-t border-white/5 shrink-0">
                      {isUnderReview ? (
                        <>
                          <button
                            onClick={() => handleCampaignReview(camp.id, "active")}
                            className="bg-saudi-green hover:bg-saudi-green/90 text-white font-bold text-[10.5px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            قبول وترخيص النشر 🟢
                          </button>
                          <button
                            onClick={() => {
                              setRejectionType("campaign");
                              setRejectionTargetId(camp.id);
                              setRejectionReason("");
                            }}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold text-[10.5px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            رفض الحملة
                          </button>
                          <button
                            onClick={() => handleCampaignReview(camp.id, "edit_requested", "يرجى تحسين وتوسيع الجمهور المستهدف وتدقيق جودة الإضاءة بالفيديو المرفق.")}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10.5px] py-1.5 px-3 rounded-lg cursor-pointer"
                          >
                            طلب تعديل
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-bold block leading-relaxed py-1">
                          ✓ تم مراجعة هذا الإعلان بالفعل والقرار الصادر نهائي.
                          {camp.rejectionReason && <p className="text-red-400 mt-1">السبب: {camp.rejectionReason}</p>}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT DRAWER / MODAL */}
      {rejectionTargetId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[202] flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-red-500/20 max-w-sm w-full rounded-2xl p-6 text-right space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <h4 className="font-extrabold text-sm text-red-400 flex items-center gap-1.5 justify-start">
              <AlertTriangle className="w-5 h-5" />
              تأكيد رفض وتوثيق المستند / الحملة
            </h4>
            
            <p className="text-xs text-gray-400 leading-normal">
              يرجى توضيح أسباب الاستبعاد والرفض ليتسنى لمجلس تداول المنشآت معالجتها وتصحيح الخلل:
            </p>

            <textarea 
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب العيب هنا (مثال: السجل منتهي الصلاحية، أو الملف المرفوع غير مقروء)..."
              className="w-full bg-neutral-950 border border-white/15 rounded-xl p-3 text-xs text-white focus:border-red-500 focus:outline-none"
            />

            <div className="flex gap-2 justify-end text-xs font-bold pt-1">
              <button 
                onClick={() => setRejectionTargetId(null)}
                className="py-1.5 px-3.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/5 cursor-pointer"
              >
                إلغاء وتراجع
              </button>
              <button 
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert("يرجى كتابة سبب الرفض لتوعية المنشآت!");
                    return;
                  }
                  if (rejectionType === "account") {
                    handleVerifyAccountStatus(rejectionTargetId, "rejected", rejectionReason);
                  } else {
                    handleCampaignReview(rejectionTargetId, "rejected", rejectionReason);
                  }
                  setRejectionTargetId(null);
                }}
                className="py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer"
              >
                تحديث بالرفض المكتوب
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
