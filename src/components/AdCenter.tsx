// AdCenter.tsx - مركز إدارة الإعلانات والحملات الممولة لقطاع الأعمال لمنصة SNNS.PRO

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, Plus, BarChart3, Clock, DollarSign, Target, Award, ListFilter, Play, Sparkles, AlertTriangle, 
  HelpCircle, Eye, MousePointer, Info, ShieldCheck, CheckCircle, Calendar, Link2, FileImage, Trash2, X
} from "lucide-react";
import { 
  getAdCampaigns, saveAdCampaigns, AdCampaign, AdCategoryType, AdViewType, BusinessAccount 
} from "../utils/businessStore";

interface Props {
  businessDetails: BusinessAccount;
  onSyncCampaigns?: () => void;
}

export default function AdCenter({ businessDetails, onSyncCampaigns }: Props) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [campName, setCampName] = useState("");
  const [campCategory, setCampCategory] = useState<AdCategoryType>("product");
  const [campType, setCampType] = useState<AdViewType>("main");
  const [campBudget, setCampBudget] = useState(5000); // SAR
  const [campDuration, setCampDuration] = useState(7); // Days
  const [campAudience, setCampAudience] = useState("");
  const [campCountry, setCampCountry] = useState("المملكة العربية السعودية");
  const [campMediaUrl, setCampMediaUrl] = useState("");
  const [campLinkUrl, setCampLinkUrl] = useState("");
  const [formError, setFormError] = useState("");

  // AI Campaign Copilot States & Presets
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiCustomConcept, setAiCustomConcept] = useState("");
  const [showAiConsole, setShowAiConsole] = useState(false);

  const aiPresets = [
    {
      id: "coffee",
      label: "☕ قهوة ونبيذ فاخر",
      title: "الحملة الكبرى: المذاق السيادي للقهوة السعودية المختصة",
      category: "product" as AdCategoryType,
      type: "main" as AdViewType,
      budget: 15000,
      duration: 10,
      audience: "عشاق ومستثمري القهوة المختصة في مدن الرياض، جدة، وعموم المنطقة الشرقية، الفئات العمرية 21-50، المهتمين بجلسات الفخامة وتجمعات كبار الشخصيات والبروتوكول التجاري.",
      media: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&fit=crop",
      link: "https://snns.pro/ad/specialty-coffee"
    },
    {
      id: "realestate",
      label: "🏢 بروج سكنية واستثمارية",
      title: "أيقونة الاستدامة العقارية - فلل وعقارات الأركان الراقية بوسط الرياض",
      category: "product" as AdCategoryType,
      type: "sponsored" as AdViewType,
      budget: 85000,
      duration: 30,
      audience: "رجال وسيدات الأعمال، المهتمين بالاستثمار العقاري الفاخر، عائلات الـ VIP الراغبين في حياة الخصوصية والأمن السكني المتكامل بضواحي العاصمة.",
      media: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&fit=crop",
      link: "https://snns.pro/ad/luxury-villas"
    },
    {
      id: "creator",
      label: "📈 ترويج حسابي الشخصي",
      title: "توسيع هالتك الرقمية - انضم للمتابع الشغوف مع الإعلامي سليمان العتيبي",
      category: "account" as AdCategoryType,
      type: "main" as AdViewType,
      budget: 5000,
      duration: 7,
      audience: "أبناء وبنات الوطن المهتمين بتحليلات ريادة الأعمال، النقاشات الدبلوماسية، والبث المباشر الفاخر في مجالس وديوانيات المملكة والخليج العربي.",
      media: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=1200&fit=crop",
      link: "https://snns.pro/u/otaibi"
    },
    {
      id: "perfume",
      label: "✨ عطور وبخور ملكي",
      title: "عبير ملوكي خالص - دهن العود والورد الطائفي الفاخر",
      category: "product" as AdCategoryType,
      type: "banner" as AdViewType,
      budget: 12000,
      duration: 15,
      audience: "المهتمين باقتناء أثمن العطور الشرقية الملوكية، مستخدمي البخور ودهن العود النادر، المناسب للمجالس والديوانيات والمناسبات الوطنية السنوية.",
      media: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&fit=crop",
      link: "https://snns.pro/ad/royal-oud"
    }
  ];

  const runCustomAiGenerator = () => {
    if (!aiCustomConcept.trim()) {
      alert("الرجاء كتابة فكرة أو فئة مشروعك أولاً ليساعدك المساعد الـ AI!");
      return;
    }
    
    setIsAiGenerating(true);
    
    setTimeout(() => {
      const p = aiCustomConcept.trim();
      let title = `حملة تسويقية كبرى: ${p}`;
      let audience = `الفئات العمرية المهتمة بـ [${p}] بين ٢٠-٤٠ عاماً، من المقيمين وأصحاب الشأن في الخليج العربي المهتمين بالجودة، الفخامة، والخدمات المتقدمة الموثقة.`;
      let media = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop";
      let category: AdCategoryType = "product";
      let budget = 12000;
      let duration = 14;

      if (p.includes("عيادة") || p.includes("تجميل") || p.includes("صحة") || p.includes("أسنان")) {
        title = `طفرة الابتسامة المشرقة - خدمات تجميل وزراعة الأسنان الاحترافية 💎`;
        audience = `الباحثين عن أفضل عيادات الأسنان، الفئة المستهدفة رجالاً ونساءً من ١٨-٥٠ عاماً، المهتمين بالابتسامة الفاخرة ومنتجات العناية بالصحة والجمال في النطاق الجغرافي القريب.`;
        media = "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&fit=crop";
      } else if (p.includes("سيار") || p.includes("عجلات") || p.includes("ايجار")) {
        title = `فخامة الطرقات الممهدة - اقتني تجربة القيادة الرياضية الأرقى 🏎️`;
        audience = `محبي السيارات السريعة والرياضية، الشباب وعشاق الفخامة والهيبة الحركية في العاصمة والمنطقة الغربية، الباحثين عن التميز وإبهار الحشد بمحركات ذات سمعة قوية.`;
        media = "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&fit=crop";
      } else if (p.includes("تطبيق") || p.includes("برنامج") || p.includes("تقنية") || p.includes("تكنولوج")) {
        title = `ثورة الحوسبة الذكية لجهازك - بوابتك لعالم السرعة الفائقة 📱`;
        audience = `رواد الأعمال، التقنيين، والمتحمسين لأحدث تطبيقات الأتمتة والذكاء الاصطناعي، مستخدمي الأجهزة الذكية الباحثين عن خفض الأوقات وتسهيل المعاملات اليومية بلمسات نيون متفاعلة.`;
        media = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&fit=crop";
      }

      setCampName(title);
      setCampAudience(audience);
      setCampCategory(category);
      setCampBudget(budget);
      setCampDuration(duration);
      setCampMediaUrl(media);
      setCampLinkUrl("https://snns.pro/ad/ai-generated");
      
      setIsAiGenerating(false);
      setShowAiConsole(false);
      alert(`✓ تم بنجاح استخدام الذكاء الاصطناعي لتأليف وتعبئة جميع حقول الحملة التسويقية بناء على تطلعاتك: "${p}"!`);
    }, 2000);
  };

  const applyPreset = (preset: typeof aiPresets[0]) => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setCampName(preset.title);
      setCampAudience(preset.audience);
      setCampCategory(preset.category);
      setCampType(preset.type);
      setCampBudget(preset.budget);
      setCampDuration(preset.duration);
      setCampMediaUrl(preset.media);
      setCampLinkUrl(preset.link);
      
      setIsAiGenerating(false);
      setShowAiConsole(false);
      alert(`✓ تم تطبيق القالب الإعلاني الذكي المولد بالـ AI: "${preset.label}" بنجاح!`);
    }, 1200);
  };

  useEffect(() => {
    loadMyCampaigns();
  }, [businessDetails]);

  const loadMyCampaigns = () => {
    const all = getAdCampaigns();
    // Filter only campaigns belonging to this commercial account
    const mine = all.filter(c => c.businessId === businessDetails.id);
    setCampaigns(mine);
  };

  // 12. Estimated views indicator (1 SAR = approx 3 views)
  const estimatedViews = Math.floor(campBudget * 3);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!campName || !campAudience) {
      setFormError("الرجاء تعبئة اسم الحملة وتحديد خصائص الجمهور المستهدف بدقة.");
      return;
    }

    if (campBudget < 1000) {
      setFormError("الحد الأدنى لميزانية تشغيل الحملة الإعلانية المروجة هو 1000 ريال سعودي.");
      return;
    }

    const newCampaign: AdCampaign = {
      id: "camp_" + Math.floor(100000 + Math.random() * 900000),
      businessId: businessDetails.id,
      businessName: businessDetails.businessName,
      campaignName: campName,
      category: campCategory,
      type: campType,
      budget: campBudget,
      durationDays: campDuration,
      startDate: new Date().toISOString().split("T")[0],
      targetAudience: campAudience,
      targetCountry: campCountry,
      targetViewsCount: estimatedViews,
      currentViews: 0,
      clicksCount: 0,
      status: "pending_review", // 13. Needs admin approval first
      mediaUrl: campMediaUrl || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&fit=crop",
      linkUrl: campLinkUrl || undefined
    };

    const all = getAdCampaigns();
    all.push(newCampaign);
    saveAdCampaigns(all);
    
    // Refresh local lists
    loadMyCampaigns();
    
    // Reset Form
    setCampName("");
    setCampAudience("");
    setCampMediaUrl("");
    setCampLinkUrl("");
    setShowCreateModal(false);

    if (onSyncCampaigns) onSyncCampaigns();
    alert("✓ تم حفظ حملتك الإعلانية وإرسالها لمركز المراقبة والإشراف للتحقق والموافقة الأمنية قبل النشر!");
  };

  // Helper stats summation
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.status === "active" ? c.budget : 0), 0);
  const totalViewsRealized = campaigns.reduce((acc, c) => acc + c.currentViews, 0);
  const totalClicksRealized = campaigns.reduce((acc, c) => acc + c.clicksCount, 0);
  const clickThroughRate = totalViewsRealized > 0 ? ((totalClicksRealized / totalViewsRealized) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-[#050505] p-6 rounded-3xl border border-white/5 space-y-6 text-right" dir="rtl">
      
      {/* Top Welcome Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-l from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl gap-4">
        <div>
          <span className="text-[10px] text-saudi-glow font-bold block mb-1">لوحة الترويج الإعلاني ورأس المال 📈</span>
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Megaphone className="w-5.5 h-5.5 text-saudi-glow" />
            مركز إدارة الإعلانات • {businessDetails.businessName}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            حساب تجاري نشط تحت مظلة السجل التجاري الوطني الرقم: <code className="text-white font-bold font-mono">{businessDetails.crNumber}</code>
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs py-3 px-5 rounded-xl flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,163,79,0.3)] transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>إطلاق حملة ترويجية ممولة 🌟</span>
        </button>
      </div>

      {/* Analytical Bento Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-tajawal">
        
        <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 block">إجمالي الميزانية الفعالة</span>
          <p className="text-xl font-black text-white font-mono">{totalSpent.toLocaleString()} <span className="text-xs text-saudi-glow font-tajawal">ر.س</span></p>
          <span className="text-[9px] text-saudi-glow font-sans block">للحملات النشطة والموافق عليها</span>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 block">مشاهدات إعلاناتك المحققة</span>
          <p className="text-xl font-black text-white font-mono">{totalViewsRealized.toLocaleString()}</p>
          <span className="text-[9px] text-gray-400 block">مرات الظهور العضوية</span>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 block">نقرات الرابط الموجه</span>
          <p className="text-xl font-black text-white font-mono">{totalClicksRealized.toLocaleString()}</p>
          <span className="text-[9px] text-gray-400 block">تحويلات الرابط للموقع</span>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 space-y-1">
          <span className="text-[10px] text-gray-500 block">نسبة النقر الترويجي (CTR)</span>
          <p className="text-xl font-black text-green-400 font-mono">{clickThroughRate}%</p>
          <span className="text-[9px] text-gray-500 block">معدل تحويل الزائرين الأمني</span>
        </div>

      </div>

      {/* Campaigns Listing Section */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-xs text-white">تفاصيل وحالة حملاتك الترويجية القائمة:</h4>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-neutral-950/40 rounded-3xl border border-white/5">
            <Megaphone className="w-10 h-10 text-gray-650 mx-auto mb-3" />
            <p className="text-xs">لا توجد حملات منشأة حالياً. ابدأ بإطلاق حملتك الإعلانية الأولى لجذب العملاء وتنمية استثماراتك!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-[#0b0b0b] border border-white/5 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      camp.status === "active" ? "bg-saudi-green/10 text-saudi-glow" :
                      camp.status === "pending_review" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                      camp.status === "rejected" ? "bg-red-500/10 text-red-500" :
                      "bg-purple-500/10 text-purple-400"
                    }`}>
                      {camp.status === "active" ? "نشط وممول" :
                       camp.status === "pending_review" ? "⏳ بانتظار موافقة الإدارة" :
                       camp.status === "rejected" ? "❌ حملة مرفوضة" : "⚠️ بحاجة لتعديل"}
                    </span>
                    <h5 className="font-extrabold text-xs text-white">{camp.campaignName}</h5>
                  </div>

                  <p className="text-[10px] text-gray-400">
                    نوع الإعلان: <span className="text-saudi-glow font-bold">{camp.type === "main" ? "إعلان رئيسي 🌟" : "تفرد في البث التلفزي لتطبيقك 🔴"}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-[#050505] p-2 rounded-xl text-[10px] text-gray-400 font-mono text-center">
                    <div>
                      <span className="text-gray-550 block text-[8px] font-tajawal">الميزانية</span>
                      <span className="text-white font-bold">{camp.budget} ر.س</span>
                    </div>
                    <div>
                      <span className="text-gray-550 block text-[8px] font-tajawal">الظهور المحقق</span>
                      <span className="text-white font-bold">{camp.currentViews}</span>
                    </div>
                    <div>
                      <span className="text-gray-550 block text-[8px] font-tajawal">النقرات</span>
                      <span className="text-white font-bold">{camp.clicksCount}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500">
                    الجمهور المستهدف: <span className="text-gray-300 font-medium">{camp.targetAudience}</span>
                  </p>
                </div>

                {camp.status === "rejected" && (
                  <div className="p-2.5 bg-red-950/15 border border-red-500/20 rounded-xl text-[10px] text-red-300">
                    🚩 تم استبعاد تفعيل الحملة بسبب: <strong className="text-white">{camp.rejectionReason}</strong>
                  </div>
                )}

                {camp.status === "edit_requested" && (
                  <div className="p-2.5 bg-purple-950/15 border border-purple-500/20 rounded-xl text-[10px] text-purple-300">
                    ⚠️ توصية من المدقق الأمني: <strong className="text-white">{camp.rejectionReason}</strong>
                  </div>
                )}

                <div className="text-[9px] text-gray-650 font-sans text-left border-t border-white/5 pt-2">
                  ID الحملة: {camp.id} • مرئي في: {camp.targetCountry}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[180] flex items-center justify-center p-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#080808] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0c0c0c] shrink-0">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <Megaphone className="w-5 h-5 text-saudi-glow" />
                تأسيس حملة ترويجية ممولة جديدة
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/25 rounded-xl text-xs text-red-300">
                  {formError}
                </div>
              )}

              {/* AI CAMPAIGN COPILOT EXPANDABLE SYSTEM */}
              <div className="bg-[#050505] border border-saudi-green/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-saudi-green animate-pulse" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-saudi-glow" />
                    <span className="font-extrabold text-white">المُساعد الإعلاني الذكي (AI Copilot)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowAiConsole(!showAiConsole)}
                    className="px-2.5 py-1 bg-saudi-green/10 hover:bg-saudi-green/20 text-saudi-glow text-[10px] font-bold rounded-lg border border-saudi-green/20 transition-all cursor-pointer"
                  >
                    {showAiConsole ? "إغلاق المساعد" : "توليد حملة بالذكاء الاصطناعي 🔮"}
                  </button>
                </div>

                <p className="text-[9px] text-gray-400 leading-normal">
                  دع الذكاء الاصطناعي الخاص بـ <strong>SNNS.PRO</strong> يولد لك العناوين الفاخرة، والاستهداف الملكي، والميزانية المقترحة في أقل من ثانيتين.
                </p>

                {showAiConsole && (
                  <div className="pt-2 border-t border-white/5 space-y-3 animate-fade-in text-right">
                    
                    {/* Custom Input */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-gray-400 block font-bold">اكتب فكرة حملتك لإضفاء اللمسة التقنية السريعة:</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="مثال: عطر بخور ملكي، أو عيادة أسنان فخمة، أو شقق سكنية..."
                          value={aiCustomConcept}
                          onChange={(e) => setAiCustomConcept(e.target.value)}
                          className="flex-1 bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 outline-none focus:border-saudi-green"
                        />
                        <button
                          type="button"
                          disabled={isAiGenerating}
                          onClick={runCustomAiGenerator}
                          className="px-3 bg-saudi-green hover:bg-saudi-green/90 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                        >
                          {isAiGenerating ? "جاري التوليد..." : "تأليف 🚀"}
                        </button>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-400 block font-bold">قوالب تسويقية مسبقة التوليد:</span>
                      <div className="grid grid-cols-2 gap-2">
                        {aiPresets.map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            disabled={isAiGenerating}
                            onClick={() => applyPreset(preset)}
                            className="p-2 bg-neutral-900 hover:bg-neutral-950 border border-white/5 hover:border-saudi-green/30 text-right rounded-xl text-[10px] transition-all cursor-pointer block text-white/90"
                          >
                            <div className="font-bold flex items-center justify-between text-saudi-glow">
                              <span>{preset.label}</span>
                              <span className="text-[8px] opacity-75">{preset.budget} ر.س</span>
                            </div>
                            <p className="text-[8.5px] text-gray-400 truncate mt-0.5">{preset.title}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {isAiGenerating && (
                      <div className="space-y-1 py-1.5 text-center bg-saudi-green/5 border border-saudi-green/10 rounded-xl">
                        <span className="text-[9px] text-saudi-glow font-bold block animate-pulse">جاري صياغة الاستهداف وحقن الأبعاد والخطط...</span>
                      </div>
                    )}

                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">اسم الحملة الإعلانية المروجة</label>
                <input 
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="مثال: مهرجان شتاء المنشأة الاستثماري ٢٠٢٦"
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:border-saudi-green outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">نوع الترويج والهدف</label>
                  <select
                    value={campCategory}
                    onChange={(e: any) => setCampCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-saudi-green outline-none"
                  >
                    <option value="product">ترويج منتج تجاري 🛒</option>
                    <option value="stream">ترويج بث مباشر 🔴</option>
                    <option value="account">ترويج وزيادة تفاعل الحساب 👤</option>
                    <option value="video">ترويج فيديو ترويجي قصير 🎬</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">موضع ونوع ظهور الإعلان</label>
                  <select
                    value={campType}
                    onChange={(e: any) => setCampType(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-saudi-green outline-none"
                  >
                    <option value="main">إعلان واجهة المنصة الرئيسي 🌟</option>
                    <option value="in_stream">إعلان شريطي داخل البث المباشر 📺</option>
                    <option value="between_videos">فاصل إعلاني بين الفيديوهات (الريلز) 🎬</option>
                    <option value="sponsored">منشور ممول في الصفحة العامة 🔥</option>
                    <option value="banner">بانر عرضي متناسق 🗺️</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">الميزانية الإجمالية (ريال سعودي)</label>
                  <input 
                    type="number"
                    required
                    min={1000}
                    value={campBudget}
                    onChange={(e) => setCampBudget(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-saudi-green outline-none font-mono text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">مدة الحملة المقررة (أيام)</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={campDuration}
                    onChange={(e) => setCampDuration(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-saudi-green outline-none font-mono text-center"
                  />
                </div>
              </div>

              {/* Estimate viewer reach (Req 12) */}
              <div className="p-3 bg-saudi-green/10 border border-saudi-green/20 rounded-xl text-xs text-saudi-glow text-center font-sans font-bold">
                🔮 الوصول المرتقب والمشاهدات المقدرة: <span className="font-mono text-white text-sm">{estimatedViews.toLocaleString()} مشاهدة موثقة</span>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">تحديد خصائص الجمهور المستهدف (Audience Details)</label>
                <textarea 
                  required
                  rows={2}
                  value={campAudience}
                  onChange={(e) => setCampAudience(e.target.value)}
                  placeholder="مثال: الباحثين عن عقارات بالرياض، الفئة العمرية ١٨-٤٥ عاماً، المهتمين بالسيارات..."
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-xs focus:border-saudi-green outline-none text-white leading-normal"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">الدولة الجغرافية المستهدفة</label>
                <input 
                  type="text"
                  required
                  value={campCountry}
                  onChange={(e) => setCampCountry(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:border-saudi-green outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">رابط المرفق البصري (صورة أو فيديو الإعلان)</label>
                <input 
                  type="url"
                  value={campMediaUrl}
                  onChange={(e) => setCampMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Image or Video link)"
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:border-saudi-green outline-none font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">رابط توجيه الزوار الخارجي (Call to Action URL)</label>
                <input 
                  type="url"
                  value={campLinkUrl}
                  onChange={(e) => setCampLinkUrl(e.target.value)}
                  placeholder="https://mywebsite.sa/offer"
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:border-saudi-green outline-none font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-saudi-green/10 cursor-pointer"
                >
                  حفظ وتأكيد تشفير ترويج الحملة 🟢
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
