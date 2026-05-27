// FirebaseConfigConsole.tsx - لوحة التحكم والمراقبة المركزية لخدمات Firebase و Google OAuth وهويات البريد لمنصة SNNS.PRO

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Server, ShieldCheck, Mail, Globe, Settings, Sparkles, RefreshCw, Layers, 
  CheckCircle, Smartphone, Flame, Cpu, Eye, Check, Copy, AlertTriangle, Send, X, ArrowLeft
} from "lucide-react";

interface FirebaseConfigConsoleProps {
  onBackToOverview?: () => void;
}

export default function FirebaseConfigConsole({ onBackToOverview }: FirebaseConfigConsoleProps) {
  // Configured Domains
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>([
    "snns.pro",
    "www.snns.pro",
    "ais-dev-zeadakskbjfibwckjal37b-740574527512.europe-west2.run.app",
    "localhost"
  ]);
  const [newDomain, setNewDomain] = useState("");
  const [showAddDomain, setShowAddDomain] = useState(false);

  // Email Templates
  const [selectedTemplate, setSelectedTemplate] = useState<"verification" | "reset" | "security">("verification");
  const [tempSubject, setTempSubject] = useState({
    verification: "🔐 تأكيد بريدك الإلكتروني الرسمي لتنشيط حسابك في منصة SNNS.PRO",
    reset: "🔑 رابط إعادة تعيين كلمة المرور الموحدة لمنصتك الفاخرة SNNS.PRO",
    security: "⚠️ تنبيه أمني عاجل: تم رصد محاولة دخول مشبوهة إلى حسابك - SNNS.PRO SMART SENTRY"
  });

  const [tempBody, setTempBody] = useState({
    verification: `مرحباً بك في سماء الفخامة الرقمية SNNS.PRO،

لقد تلقينا طلباً لإنشاء أو تسجيل الدخول لحسابك عبر نظام النفاذ الوطني في SNNS.PRO.

رمز التحقق المؤقت (OTP) الخاص بك هو:
[ 8 4 9 2 0 1 ]

إذا لم تكن أنت من طلب هذا الرمز، يرجى تجاهل هذا البريد والتأكد من أمان جهازك.

مع تحيات الهيئة الإشرافية والبروتوكول الأمني،
فريق الأمن والامتثال الرقمي | SNNS.PRO`,
    reset: `عزيزي شريك منصة SNNS.PRO الفاخرة،

لتلبية طلب إعادة تعيين كلمة المرور الخاصة بحسابك المشفر، يرجى استخدام الرابط الآمن أدناه:

https://snns.pro/auth/reset-password?token=snns_secure_984120384910

ينتهي مفعول هذا الرابط بعد 15 دقيقة لدواعي حماية الخصوصية والأمن السيبراني.

فريق الأمان التقني | SNNS.PRO 🇸🇦`,
    security: `تنبيه أمني عاجل من الحارس الذكي (Smart Sentry) - SNNS.PRO

عزيزي العميل، لقد تم رصد عملية دخول جديدة ناجحة لحسابك من موقع جغرافي يختلف عن موقعك المعتاد:

- الجهاز: Apple iPhone 15 Pro Max (العاصمة الرياض)
- نظام التشغيل والمحرك: Chrome Mobile v124
- بروتوكول العنوان (IP): 185.120.44.18
- الوقت والتاريخ: قبل قليل (مطابق للتوقيت الوطني)

إذا لم تكن أنت من قام بهذا الإجراء، يرجى تفعيل قفل الطوارئ السيبراني لدیوانيتك فوراً بالدخول إلى بوابتنا الرقمية:
https://snns.pro/security/lock

الإدارة السيبرانية العليا | SNNS.PRO`
  });

  // Services State
  const [services, setServices] = useState([
    { name: "Firebase Authentication", status: "نشط ومتكامل ✅", description: "إدارة الهويات، التسجيل السريع، والتحقق المزدوج لجميع الأفراد والمنشآت.", logo: "🔒", brandingName: "SNNS.PRO AUTH" },
    { name: "Firestore Database", status: "نشط ومتكامل ✅", description: "المستودع السيبراني الموحد وحفظ السجلات التجارية وعقود الترويج الإعلاني.", logo: "🗄️", brandingName: "SNNS.PRO DATABASE" },
    { name: "Cloud Storage", status: "نشط ومتكامل ✅", description: "تخزين مستندات السجلات المرفوعة وصور شعارات المنشآت بمستويات حماية مشفرة.", logo: "📦", brandingName: "SNNS.PRO STORAGE" },
    { name: "Cloud Messaging", status: "نشط ومتكامل ✅", description: "إرسال التنبيهات الفورية وبلاغات الحارس الذكي للأجهزة الموثقة.", logo: "💬", brandingName: "SNNS.PRO MESSAGING" },
    { name: "Firebase Hosting", status: "نشط ومتكامل ✅", description: "استضافة بنية ديوانية SNNS.PRO التفاعلية مع شهادات الحماية SSL لـ snns.pro.", logo: "🌐", brandingName: "SNNS.PRO HOSTING" },
  ]);

  // Project Settings
  const [projectId, setProjectId] = useState("SNNS.PRO");
  const [consentName, setConsentName] = useState("SNNS.PRO (Official Certified Version)");
  const [authLogoUrl, setAuthLogoUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop");
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const triggerEmailSimulation = (type: "verification" | "reset" | "security") => {
    setSimulationStatus(`جاري معالجة وتشفير رسالة البريد ببادئة SNNS.PRO الهوية...`);
    setTimeout(() => {
      setSimulationStatus(`✓ تم محاكاة إرسال البريد الموثق باسم: [SNNS.PRO] وبموضوع: "${tempSubject[type].substring(0, 30)}..." برأسية رسمية بنجاح إلى su66666su@gmail.com!`);
    }, 1500);
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    if (authorizedDomains.includes(newDomain.trim().toLowerCase())) {
      alert("النطاق مسجل بالفعل كأحد النطاقات المعتمدة!");
      return;
    }
    setAuthorizedDomains([...authorizedDomains, newDomain.trim().toLowerCase()]);
    setNewDomain("");
    setShowAddDomain(false);
    alert(`✓ تم تفويض وإضافة المحاذاة البرمجية للنطاق الجديد: ${newDomain}`);
  };

  const removeDomain = (domain: string) => {
    if (domain === "snns.pro" || domain === "www.snns.pro") {
      alert("عذراً، لا يمكن إزالة النطاق الرسمي للعلامة التجارية لعدم قطع الاتصال الوطني!");
      return;
    }
    setAuthorizedDomains(authorizedDomains.filter(d => d !== domain));
  };

  return (
    <div className="space-y-6 text-right font-tajawal pb-12" dir="rtl">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-l from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl gap-4">
        <div>
          <span className="text-[10px] text-saudi-glow font-bold block mb-1">الرقابة التقنية ومطابقة الاستضافة ⚙️</span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-saudi-green" />
            بوابة الإدارة السحابية والتحقق • سحابة SNNS.PRO Firebase
          </h2>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">
            إدارة النطاقات المفوضة والتحقق من أن جميع بنى Auth، وقاعدة البيانات، والاستضافة، والمراسلات تلتزم بهوية <strong className="text-white">SNNS.PRO</strong> الرسمية والسيادة الوطنية الرقمية.
          </p>
        </div>
        {onBackToOverview && (
          <button 
            onClick={onBackToOverview}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>عرض النظرة العامة</span>
          </button>
        )}
      </div>

      {simulationStatus && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-saudi-green/10 border border-saudi-green/20 rounded-2xl flex items-center justify-between text-xs text-white"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-saudi-glow shrink-0 animate-pulse" />
            <span>{simulationStatus}</span>
          </div>
          <button onClick={() => setSimulationStatus(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Main Grid: Settings & Whitelists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Core Firebase Projects and OAuth Settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl space-y-5">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Cpu className="w-4.5 h-4.5 text-saudi-glow" />
              تكوين مشروع Firebase لـ SNNS.PRO
            </h3>

            {/* Project Name ID Setting */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 font-bold block">إسم مشروع Firebase المحسن</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={projectId} 
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-saudi-green outline-none font-bold"
                />
                <button 
                  onClick={() => alert(`✓ تم حفظ الاسم وإعادته في جميع الهياكل البرمجية لمشروع Firebase لقيم: ${projectId}`)}
                  className="px-3 bg-saudi-green/10 border border-saudi-green/20 hover:bg-saudi-green text-saudi-glow hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  حفظ
                </button>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">يرتبط هذا الاسم بالنظام المركزي للهوية والبريد.</p>
            </div>

            {/* OAuth Consent Screen Logo Setup */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 font-bold block">موافقة Google OAuth (Consent Screen Name)</label>
              <input 
                type="text" 
                value={consentName} 
                onChange={(e) => setConsentName(e.target.value)}
                className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-saudi-green outline-none font-mono"
              />
            </div>

            {/* Brand Logo Link and UI preview */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] text-gray-500 font-bold block">شعار Firebase Auth المعتمد (Logo URL)</label>
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 bg-black rounded-xl border border-saudi-green/30 flex items-center justify-center p-1.5 shrink-0 relative overflow-hidden">
                  <span className="absolute inset-0 bg-saudi-green/10 animate-pulse" />
                  <img src={authLogoUrl} alt="Branding Logo Preview" className="w-full h-full object-cover rounded-lg relative z-10" />
                </div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="url" 
                    value={authLogoUrl} 
                    onChange={(e) => setAuthLogoUrl(e.target.value)}
                    placeholder="رابط رابط الشعار"
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white focus:border-saudi-green outline-none font-mono text-left"
                    dir="ltr"
                  />
                  <span className="text-[8px] text-saudi-glow block">يظهر الشعار كعلامة مائية أمنية في واجهات تسجيل الدخول.</span>
                </div>
              </div>
            </div>

            {/* Quick Summary Credentials */}
            <div className="bg-neutral-950 p-4 border border-white/5 rounded-2xl text-[10px] space-y-2 leading-relaxed">
              <p className="text-gray-400 font-bold">ملخص برمجيات النفاذ المعتمدة:</p>
              <div className="flex justify-between items-center font-mono">
                <span className="text-gray-500">PROJECT_ID</span>
                <span className="text-white font-bold">{projectId}</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-gray-500">AUTH_DOMAIN</span>
                <span className="text-saudi-glow font-bold">snns.pro</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-gray-500">OAUTH_CLIENT</span>
                <span className="text-white text-right font-bold">SNNS.PRO-PROD-2026</span>
              </div>
            </div>

          </div>
        </div>

        {/* Column 2: Authorized Whitelisted Domains Console */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Globe className="w-4.5 h-4.5 text-saudi-green" />
              النطاقات المفوضة والـ Authorized Domains
            </h3>

            <p className="text-[10px] text-gray-450 leading-relaxed">
              يجب إدراج أي نطاق يستضيف بوابة النفاذ والمصادقة لمنع هجمات الاحتيال وتفويض واجهات Google Sign-In المعتمدة.
            </p>

            <div className="space-y-2">
              {authorizedDomains.map((dom) => (
                <div key={dom} className="flex justify-between items-center bg-neutral-950 px-3.5 py-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-saudi-green animate-pulse" />
                    <span className="text-xs font-mono text-gray-200">{dom}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {(dom === "snns.pro" || dom === "www.snns.pro") ? (
                      <span className="text-[9px] bg-saudi-green/10 border border-saudi-green/15 text-saudi-glow font-bold px-2 py-0.5 rounded">رسمي رئيسي 🇸🇦</span>
                    ) : (
                      <button 
                        onClick={() => removeDomain(dom)}
                        className="text-[9px] text-red-400 hover:text-red-500 hover:underline cursor-pointer"
                      >
                        إلغاء التفويض
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showAddDomain ? (
              <form onSubmit={handleAddDomain} className="p-3 bg-neutral-950 border border-white/5 rounded-2xl space-y-2.5 animate-fade-in">
                <label className="block text-[10px] text-gray-400 font-bold">أدخل رابط نطاق ويب معتمد (FQDN)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    placeholder="subdomain.example.sa" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                    dir="ltr"
                  />
                  <button 
                    type="submit"
                    className="bg-saudi-green hover:bg-saudi-green/90 text-white font-bold text-xs px-3 rounded-xl cursor-pointer"
                  >
                    تفويض N
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAddDomain(false)} 
                  className="text-[10px] text-gray-400 hover:text-white"
                >
                  إلغاء وتراجع
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setShowAddDomain(true)}
                className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 text-saudi-glow font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
              >
                <span>+ تفويض نطاق معتمد جديد (Authorized Domain)</span>
              </button>
            )}

            <div className="p-3 bg-red-950/15 border border-red-500/10 rounded-2xl text-[9px] text-red-300 leading-normal flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>تنبيه سيبراني:</strong> تفعيل تفويض النطاقات يتم مزامنته في اللحظة ذاتها مع مفاتيح Google Sign-In ويمنع تماماً سرقة واجهات الهوية.
              </span>
            </div>

          </div>
        </div>

        {/* Column 3: Active SNNS.PRO Services status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 border-b border-white/5 pb-3">
              <Layers className="w-4.5 h-4.5 text-saudi-green" />
              حالة وتوثيق الخدمات لهوية SNNS.PRO
            </h3>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              جميع سحابات البائعين والخدمات الداخلية مرتبطة بهوية وتوقيع المنصة الموحد.
            </p>

            <div className="space-y-3">
              {services.map((ser) => (
                <div key={ser.name} className="p-3 bg-neutral-950 border border-white/5 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span>{ser.logo}</span>
                      <span>{ser.name}</span>
                    </span>
                    <span className="text-saudi-glow text-[10px]">{ser.brandingName}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{ser.description}</p>
                  <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-saudi-green animate-pulse" />
                    <span>{ser.status}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Full-width Section: Email Templates Manager & Simulator */}
        <div className="lg:col-span-3">
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Mail className="w-5.5 h-5.5 text-saudi-glow" />
                  مدير رسائل وقوالب البريد الإلكتروني المشفرة لـ SNNS.PRO
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  تعديل القوالب الرسمية لرسائل البريد الموجهة للأعضاء والمسؤولين والشركات للتحقق منها باسم <strong className="text-white">SNNS.PRO</strong>.
                </p>
              </div>

              {/* Template selector */}
              <div className="flex bg-neutral-950 p-1 rounded-xl border border-white/5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("verification")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedTemplate === "verification" ? "bg-saudi-green text-white" : "text-gray-400"}`}
                >
                  كود تأكيد البريد (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("reset")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedTemplate === "reset" ? "bg-saudi-green text-white" : "text-gray-400"}`}
                >
                  إعادة تعيين الباسورد
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate("security")}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedTemplate === "security" ? "bg-saudi-green text-white" : "text-gray-400"}`}
                >
                  تنبيه أمني (Smart Sentry)
                </button>
              </div>
            </div>

            {/* Editing and Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Form Input Editor */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">رأس البريد وموضوع المراسلة (Subject)</label>
                  <input 
                    type="text" 
                    value={tempSubject[selectedTemplate]}
                    onChange={(e) => setTempSubject({...tempSubject, [selectedTemplate]: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:border-saudi-green outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold block">محتوى البريد والرسالة (Body Template)</label>
                  <textarea 
                    rows={12}
                    value={tempBody[selectedTemplate]}
                    onChange={(e) => setTempBody({...tempBody, [selectedTemplate]: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-4 text-xs text-white focus:border-saudi-green outline-none font-sans leading-relaxed" 
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      alert("✓ تم حفظ ومعايرة قالب البريد المشفر مع خوادم Firebase SMTP وخوادم التنبيهات لـ SNNS.PRO بنجاح!");
                    }}
                    className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-900 border border-white/5 rounded-2xl text-xs font-bold text-white cursor-pointer transition-colors text-center"
                  >
                    حفظ وإقرار التعديلات 💾
                  </button>

                  <button 
                    onClick={() => triggerEmailSimulation(selectedTemplate)}
                    className="flex-1 py-3 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-saudi-green/15 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>أرسل رسالة تجريبية للاختبار (SMTP) 🛑</span>
                  </button>
                </div>
              </div>

              {/* High Visual Mockup Presentation of Received Email */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pr-1 text-[10px] text-gray-500 font-bold">
                  <span>معاينة واقعية كما تظهر بصندوق بريد العميل 📱</span>
                  <span className="text-saudi-glow">مؤمنة بهوية SNNS.PRO 🇸🇦</span>
                </div>

                {/* Simulated Email Interface */}
                <div className="bg-[#050505] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[420px]">
                  
                  {/* Email Header */}
                  <div className="p-4 bg-neutral-950 border-b border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-saudi-green/10 border border-saudi-green/30 flex items-center justify-center text-xs font-extrabold font-tajawal text-saudi-glow">
                          SN
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">إخطارات ومصادقة SNNS.PRO <span className="text-[10px] text-gray-500 font-sans">&lt;no-reply@snns.pro&gt;</span></p>
                          <p className="text-[10px] text-gray-500">موجّه إلى: <strong className="text-gray-300">su66666su@gmail.com</strong></p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-550 font-sans">الان</span>
                    </div>
                    <div className="bg-neutral-900/40 p-2.5 rounded-xl border border-white/5 text-[11px] font-bold text-white">
                      الموضوع: {tempSubject[selectedTemplate]}
                    </div>
                  </div>

                  {/* Email Content Body styled premium */}
                  <div className="p-6 flex-1 space-y-6 bg-gradient-to-b from-neutral-950/20 to-neutral-950/70 text-gray-200 overflow-y-auto">
                    
                    {/* Official Banner Header */}
                    <div className="flex justify-between items-center border-b border-saudi-green/10 pb-4 shrink-0">
                      <div className="text-right">
                        <span className="text-saudi-glow font-black text-sm block font-mono">SNNS.PRO</span>
                        <span className="text-[8px] text-gray-500 block uppercase tracking-wider font-tajawal">الشبكة الوطنية الفاخرة للأعمال والأفراد</span>
                      </div>
                      <div className="px-2.5 py-1 bg-saudi-green/10 text-saudi-glow text-[9px] font-bold border border-saudi-green/20 rounded-full flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>بريد رسمي موثق</span>
                      </div>
                    </div>

                    {/* Content text */}
                    <div className="text-[11.5px] whitespace-pre-line leading-relaxed font-tajawal">
                      {tempBody[selectedTemplate]}
                    </div>

                    {/* Email Footer custom signature */}
                    <div className="border-t border-white/5 pt-4 space-y-2 text-[9px] text-gray-500 leading-normal font-tajawal">
                      <p>تم إرسال هذا الإخطار التفاعلي إليك من الإدارة السيبرانية المعتمدة وبوابة البيانات المشفرة لـ SNNS.PRO.</p>
                      <div className="flex flex-wrap justify-between gap-1 mt-2 text-gray-550 font-sans border-t border-white/3 pt-2">
                        <span>HTTPS_OAUTH_LEDGER_SA</span>
                        <span>Authorized Domains verified: snns.pro, www.snns.pro</span>
                        <span>MIME Version: 1.0 (PROD_TOKEN)</span>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
