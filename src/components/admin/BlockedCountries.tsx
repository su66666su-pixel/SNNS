import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, ShieldCheck, ShieldAlert, AlertTriangle, 
  Trash2, Plus, Search, Edit3, Sliders, Volume2, 
  Settings, Check, Lock, Unlock, HelpCircle, Activity,
  Database, UserCheck, Terminal, HeartCrack
} from "lucide-react";
import { 
  getCountryConfigs, saveCountryConfigs, CountryConfig,
  getSecurityLogs, saveSecurityLogs, SecurityLog,
  getWhitelist, saveWhitelist, WhitelistRule,
  addSecurityLog, getSimulationSettings, saveSimulationSettings
} from "../../utils/countryLockStore";

export default function BlockedCountries() {
  const [countries, setCountries] = useState<CountryConfig[]>(() => getCountryConfigs());
  const [logs, setLogs] = useState<SecurityLog[]>(() => getSecurityLogs());
  const [whitelist, setWhitelist] = useState<WhitelistRule[]>(() => getWhitelist());
  const [simulation, setSimulation] = useState(() => getSimulationSettings());

  // Alerts for admin notifications when VPN attempts happen
  const [adminNotification, setAdminNotification] = useState<SecurityLog | null>(null);

  // Search & Filters state
  const [countrySearch, setCountrySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Whitelist manual entry states
  const [newWhType, setNewWhType] = useState<"username" | "ip">("username");
  const [newWhValue, setNewWhValue] = useState("");
  const [newWhNotes, setNewWhNotes] = useState("");

  // Edit Country Administrative Note state
  const [editingCountry, setEditingCountry] = useState<CountryConfig | null>(null);
  const [newNoteText, setNewNoteText] = useState("");

  // Track simulated active metrics
  const [stats, setStats] = useState({
    mostActive: "المملكة العربية السعودية 🇸🇦",
    mostBlocked: "جمهورية إيران الإسلامية 🇮🇷",
    totalBlockedAttempts: 0,
    blockedToday: 14
  });

  useEffect(() => {
    // Calc total blocked attempts count
    const total = countries.reduce((acc, c) => acc + c.blockedAttempts, 0);
    setStats(prev => ({ ...prev, totalBlockedAttempts: total }));
  }, [countries]);

  // Listen to new logs dynamically to show instant notification toast in real-time
  useEffect(() => {
    const handleNewLog = (e: any) => {
      const newLog = e.detail as SecurityLog;
      // Refresh local logs
      setLogs(getSecurityLogs());
      // Refresh countries
      setCountries(getCountryConfigs());
      
      // If it's blocked, show real-time administrator alert toast!
      if (newLog.status === "blocked") {
        setAdminNotification(newLog);
        // Play an attention-grabbing click sound or effect
        setTimeout(() => setAdminNotification(null), 8000);
      }
    };

    window.addEventListener("snns_geoip_log_added", handleNewLog);
    return () => {
      window.removeEventListener("snns_geoip_log_added", handleNewLog);
    };
  }, []);

  // Update Country Status
  const handleUpdateStatus = (code: string, newStatus: CountryConfig["status"]) => {
    const updated = countries.map(c => {
      if (c.code === code) {
        return { ...c, status: newStatus };
      }
      return c;
    });
    setCountries(updated);
    saveCountryConfigs(updated);
    
    // Log administrative change as a security audit record
    addSecurityLog({
      countryCode: code,
      countryName: translateCountry(code),
      flag: getEmoji(code),
      ip: "127.0.0.1 (المشرف)",
      attemptType: "view_content",
      status: "allowed_by_whitelist",
      userAgent: "SNNS-Sec-Console/3.0",
      vpnDetected: false,
      notes: `تم تعديل مستوى أمان الدولة الجغرافي إلى: ${newStatus}`
    });
  };

  // Add whitelisted item
  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhValue.trim()) return;

    const newRule: WhitelistRule = {
      type: newWhType,
      value: newWhValue.trim().toLowerCase(),
      addedBy: "أدمن النظام",
      addedAt: new Date().toLocaleDateString("ar-SA"),
      notes: newWhNotes.trim() || "استثناء معتمد"
    };

    const updated = [newRule, ...whitelist];
    setWhitelist(updated);
    saveWhitelist(updated);

    setNewWhValue("");
    setNewWhNotes("");
    
    alert("تم إضافة الاستثناء بنجاح لقائمة السماح الأمنية!");
  };

  // Delete whitelisted item
  const handleDeleteWhitelist = (index: number) => {
    const updated = whitelist.filter((_, idx) => idx !== index);
    setWhitelist(updated);
    saveWhitelist(updated);
  };

  // Save admin note update
  const handleSaveNote = () => {
    if (!editingCountry) return;
    const updated = countries.map(c => {
      if (c.code === editingCountry.code) {
        return { ...c, notes: newNoteText };
      }
      return c;
    });
    setCountries(updated);
    saveCountryConfigs(updated);
    setEditingCountry(null);
    setNewNoteText("");
  };

  // Simulation controls
  const handleToggleSim = () => {
    const nextStatus = !simulation.enabled;
    const updated = { ...simulation, enabled: nextStatus };
    setSimulation(updated);
    saveSimulationSettings(updated);
  };

  const handleSimCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = { ...simulation, simulatedCountry: e.target.value };
    setSimulation(updated);
    saveSimulationSettings(updated);
  };

  // Clear system security logs
  const handleClearLogs = () => {
    if (confirm("هل أنت متأكد من رغبتك في تصفير سجلات الأمان؟")) {
      saveSecurityLogs([]);
      setLogs([]);
    }
  };

  // Filtering list
  const filteredCountries = countries.filter(c => {
    const matchSearch = c.name.includes(countrySearch) || c.code.toLowerCase().includes(countrySearch.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const translateCountry = (code: string) => countries.find(c => c.code === code)?.name || "دولة مجهولة";
  const getEmoji = (code: string) => countries.find(c => c.code === code)?.flag || "🌐";

  return (
    <div className="space-y-8 text-right font-tajawal relative" dir="rtl">
      {/* Real-time Admin System Alert Overlay Toast */}
      <AnimatePresence>
        {adminNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -50 }}
            className="fixed top-6 left-6 z-[99999] bg-[#0c0c0c] border-2 border-red-500 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.3)] max-w-sm w-full font-tajawal text-right flex gap-4"
          >
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">تنبيه أمني عاجل ⚠️</span>
                <button 
                  onClick={() => setAdminNotification(null)}
                  className="text-gray-500 hover:text-white text-xs leading-none"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-bold text-white text-xs mt-2.5">محاولة وصول جغرافية مرفوضة!</h4>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                قام مستخدم من دولة <span className="text-white font-bold">{adminNotification.countryName} ({adminNotification.countryCode})</span> بمحاولة إجراء <span className="text-white font-bold">({adminNotification.attemptType})</span> من الـ IP المجهول: <span className="font-mono text-amber-500">{adminNotification.ip}</span> وتم إفشالها فورياً.
              </p>
              {adminNotification.vpnDetected && (
                <p className="text-[10px] text-red-400 mt-1.5 font-bold">✓ تم كشف واستبعاد خادم وكيل (VPN) مشبوه.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Admin Statistics Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-100 font-bold uppercase tracking-wide">النشاط الإقليمي العام</span>
            <Activity className="w-4 h-4 text-saudi-glow" />
          </div>
          <p className="text-sm font-black text-white mt-4">{stats.mostActive}</p>
          <p className="text-[9px] text-gray-550 mt-1">الدولة الأكثر دخولاً وبثاً للمحتوى بصفة متصلة</p>
        </div>

        <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">المناطق المحظورة كلياً</span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-sm font-black text-white mt-4">{stats.mostBlocked}</p>
          <p className="text-[9px] text-gray-550 mt-1">أكثر نطاق مسجل فيه محاولات هجوم وتسلل مرصودة</p>
        </div>

        <div className="p-5 bg-neutral-900/50 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">إجمالي المحاولات المرفوضة</span>
            <Terminal className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 mt-3 font-mono">{stats.totalBlockedAttempts} محاولة</p>
          <p className="text-[9px] text-gray-550 mt-1">تراكمي جميع البلدان المحظورة أو المقيدة جزئياً</p>
        </div>

        <div className="p-5 bg-[#0a1410] border-2 border-saudi-green/30 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(0,163,79,0.08)]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-saudi-glow font-bold uppercase tracking-wide">الـ Blocked اليوم</span>
            <span className="w-2 h-2 rounded-full bg-saudi-glow animate-ping" />
          </div>
          <p className="text-2xl font-black text-saudi-glow mt-3 font-mono">+{stats.blockedToday} رصد</p>
          <p className="text-[9px] text-saudi-glow/85 mt-1">محاولات تسجيل أو دفع مالي تم حجبها في الـ ٢٤ ساعة الماضية</p>
        </div>
      </div>

      {/* Simulator Quick Testing Action Bar Card */}
      <div className="p-5 bg-neutral-900/30 border border-white/5 rounded-2xl text-right flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5 justify-end">
            <span>التحكم التفاعلي بموقعك الجغرافي للاختبار</span>
            <Settings className="w-4 h-4 text-saudi-glow" />
          </h4>
          <p className="text-[10px] text-gray-400 mt-1">لحسن رصد وتقييم النظام، يمكنك محاكاة موقعك من أي دولة لترصد بنفسك سلوك الـ IP والتنبيهات المباشرة دون الحاجة لأدوات إضافية.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleToggleSim}
            className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              simulation.enabled 
                ? "bg-amber-500/10 border-amber-500 text-amber-400" 
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            {simulation.enabled ? "✓ تفعيل محاكاة الإدارة: نشط" : "⚪ تفعيل كونسول محاكاة الدولة"}
          </button>

          {simulation.enabled && (
            <select
              value={simulation.simulatedCountry}
              onChange={handleSimCountryChange}
              className="bg-[#0e0e0e] text-xs font-bold py-2 px-3 rounded-xl border border-white/10 text-white focus:outline-none focus:border-saudi-green"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid of Main Countries configuration list and Whitelist Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Countries Config list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#0a0a0a] p-4 border border-white/5 rounded-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Globe className="w-5 h-5 text-saudi-glow" />
              قوائم تهيئة الحدود الرقمية والدول الجغرافية
            </h3>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="ابحث بالاسم أو رمز ISO..."
                  className="bg-neutral-900 border border-white/5 py-1.5 pr-9 pl-3 text-xs w-full sm:w-48 rounded-xl text-white focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-white/5 text-xs text-gray-300 rounded-xl px-2.5 focus:outline-none"
              >
                <option value="all">كل الحالات</option>
                <option value="allowed">مسموحة</option>
                <option value="blocked">محظورة كلياً</option>
                <option value="restricted">تقييد جزئي</option>
                <option value="block_registration">منع التسجيل جغرافياً</option>
                <option value="block_stream">منع البث المباشر جغرافياً</option>
                <option value="block_payments">منع سحوبات المحافظ جغرافياً</option>
              </select>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {filteredCountries.length === 0 ? (
              <div className="p-8 text-center text-gray-550 text-xs">لا يوجد بلدان تتطابق مع بحثك</div>
            ) : (
              filteredCountries.map((country) => (
                <div key={country.code} className="p-4 hover:bg-white/2 transition-all flex flex-col md:flex-row justify-between gap-4 text-right">
                  {/* Left part: Country profile */}
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none pt-1 shrink-0">{country.flag}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5 justify-end">
                        <span className="font-mono text-[10px] text-gray-550">({country.code})</span>
                        <span>{country.name}</span>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-sm line-clamp-1">{country.notes || "لا توجد أي ملاحظات إدارية مضافة."}</p>
                      
                      <div className="flex gap-4 mt-2.5 text-[10px] font-mono text-gray-400">
                        <span>مستخدمين: <span className="text-white font-bold">{country.usersCount.toLocaleString()}</span></span>
                        <span>•</span>
                        <span>محاولات حظر: <span className="text-red-400 font-bold">{country.blockedAttempts.toLocaleString()}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Right part: Restriction actions */}
                  <div className="flex flex-wrap items-center gap-2 md:justify-end self-end md:self-center">
                    <select
                      value={country.status}
                      onChange={(e) => handleUpdateStatus(country.code, e.target.value as any)}
                      className="bg-neutral-900 border border-white/10 text-[11px] font-bold text-white py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-saudi-green cursor-pointer"
                    >
                      <option value="allowed">🟢 مسموح وموثوق</option>
                      <option value="blocked">🔴 حظر كامل للوصول</option>
                      <option value="restricted">🟡 تقييد جزئي (قراءة فقط)</option>
                      <option value="block_registration">🚫 منع تسجيل حساب جديد</option>
                      <option value="block_stream">🎥 حظر البثوث القادمة</option>
                      <option value="block_payments">💸 حظر سحب/شحن الرصيد</option>
                    </select>

                    <button
                      onClick={() => {
                        setEditingCountry(country);
                        setNewNoteText(country.notes);
                      }}
                      className="p-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] text-gray-300 transition-all flex items-center gap-1 cursor-pointer"
                      title="ملاحظة إدارية"
                    >
                      <Edit3 className="w-3 h-3" />
                      ملاحظة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Whitelist/Allowlist overrides management panel */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-1.5 flex items-center gap-1.5 justify-end">
              <span>قائمة الاستبعاد والسماح الأمنية (Whitelist)</span>
              <UserCheck className="w-5 h-5 text-saudi-glow" />
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed mb-4">أي حساب موثق أو عنوان IP مستهدف في هذا المدخل سيتم تصفيتة وتخطيه من قيود الحظر الجغرافي تماماً لضمان تجربة فحص مريحة للفنيين والمراجعين.</p>

            {/* Quick Add Form */}
            <form onSubmit={handleAddWhitelist} className="space-y-3 p-3 bg-neutral-950 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">نوع الاستثناء</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWhType("username")}
                    className={`py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                      newWhType === "username" 
                        ? "bg-saudi-green/10 border-saudi-green text-saudi-glow" 
                        : "bg-neutral-900 border-white/5 text-gray-400"
                    }`}
                  >
                    اسم حساب (@)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWhType("ip")}
                    className={`py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                      newWhType === "ip" 
                        ? "bg-saudi-green/10 border-saudi-green text-saudi-glow" 
                        : "bg-neutral-900 border-white/5 text-gray-400"
                    }`}
                  >
                    عنوان IP محدد
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">المعرف المطلوب</span>
                <input
                  type="text"
                  required
                  placeholder={newWhType === "username" ? "مثال: a.rajhi" : "مثال: 192.168.1.1"}
                  value={newWhValue}
                  onChange={(e) => setNewWhValue(e.target.value)}
                  className="bg-neutral-900 border border-white/5 text-xs py-2 px-3 rounded-lg w-full text-white text-left font-mono focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold block mb-1">سبب الاستثناء</span>
                <input
                  type="text"
                  placeholder="مثال: حساب فحص أمني معتمد"
                  value={newWhNotes}
                  onChange={(e) => setNewWhNotes(e.target.value)}
                  className="bg-neutral-900 border border-white/5 text-xs py-2 px-3 rounded-lg w-full text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-saudi-green hover:bg-saudi-green/90 text-white text-xs py-2 rounded-lg font-bold transition-all cursor-pointer"
              >
                ضم المعرف لقائمة البايباس +
              </button>
            </form>

            {/* List and Deletion */}
            <div className="mt-4 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {whitelist.map((rule, idx) => (
                <div key={idx} className="p-3 bg-neutral-950/40 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:bg-[#121212] transition-all">
                  <button
                    onClick={() => handleDeleteWhitelist(idx)}
                    className="p-1 hover:bg-red-500/10 hover:text-red-400 text-gray-500 rounded transition-all cursor-pointer"
                    title="حذف الاستثناء"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[9px] text-[#00A34F] bg-saudi-green/10 border border-saudi-green/20 px-1.5 rounded-full font-bold">
                        {rule.type === "username" ? "@ حساب" : "IP عنوان"}
                      </span>
                      <span className="font-mono text-white font-bold">{rule.value}</span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">{rule.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security and Protection Attempts Audit Logs Ledger Table (سجل محاولات الاختراق والمحاولات المشبوهة) */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
          <button
            onClick={handleClearLogs}
            className="p-1.5 px-3 bg-red-950/20 text-red-400 border border-red-900/40 hover:bg-red-950/40 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
          >
            تصفير السجل وتطهير النفايات
          </button>

          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Terminal className="w-5 h-5 text-saudi-glow" />
              سجل حماية المحيط وإيقاف محاولات تجاوز الحظر (Proxy & Intrusion Ledger)
            </h3>
            <p className="text-gray-550 text-[10px] mt-0.5">تقارير الرصد الجغرافي الفوري ومحاولات التحايل المكشوفة عبر أدوات الـ VPN والـ IPv4/IPv6 المجهولة</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right text-gray-300">
            <thead>
              <tr className="border-b border-white/5 text-gray-105 font-bold">
                <th className="py-2.5 px-3">الوقت</th>
                <th className="py-2.5 px-3">عنوان IP</th>
                <th className="py-2.5 px-3">الدولة والمنطقة</th>
                <th className="py-2.5 px-3">نوع العملية المرفوضة</th>
                <th className="py-2.5 px-3">كشف Proxy/VPN</th>
                <th className="py-2.5 px-3">الإجراء المعالج</th>
                <th className="py-2.5 px-3">ملاحظات وراصد النظام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500 text-xs font-tajawal">سجل الأمان الحامي للمنصة فارغ حتى الآن. 🔐</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/1 transition-all">
                    <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-3 font-bold text-gray-100">{log.ip}</td>
                    <td className="py-3 px-3 font-tajawal text-gray-200">
                      <span className="flex items-center gap-1">
                        <span>{log.flag}</span>
                        <span>{log.countryName}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-tajawal">
                      <span className="px-2 py-0.5 bg-neutral-900 rounded text-amber-500 font-bold border border-white/3">
                        {log.attemptType === "register" ? "تسجيل حساب" :
                         log.attemptType === "withdraw" ? "سحب مالي" :
                         log.attemptType === "stream" ? "بث مباشر" :
                         log.attemptType === "chat" ? "دردشة تفاعلية" :
                         log.attemptType === "login" ? "تسجيل دخول" : "تصفح المحتوى"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {log.vpnDetected ? (
                        <span className="text-xs text-red-400 font-bold bg-red-505/10 bg-red-950/20 px-2 py-0.5 rounded border border-red-900/30 font-tajawal">✓ كشف VPN</span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-tajawal">لا يوجد</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-tajawal">
                      {log.status === "blocked" ? (
                        <span className="text-[10.5px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-550/20">✖ حظر المعالجة</span>
                      ) : log.status === "warned" ? (
                        <span className="text-[10.5px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">⚠️ إنذار سلوكي</span>
                      ) : (
                        <span className="text-[10.5px] text-saudi-glow font-bold bg-saudi-green/10 px-2 py-0.5 rounded border border-saudi-green/20">✓ سماح (استثناء)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-tajawal text-[11px] text-gray-400 max-w-[220px] truncate" title={log.notes}>
                      {log.notes || "ـ"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Administrative Country Note modal overlay */}
      {editingCountry && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0b0b] border border-white/10 rounded-2xl w-full max-w-md p-6"
          >
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5 justify-end mb-2">
              <span>تعديل الملاحظات الإدارية الأمنية للدولة</span>
              <Globe className="w-5 h-5 text-saudi-glow" />
            </h4>
            <p className="text-[10.5px] text-gray-400 mb-4 leading-relaxed">
              يرجى إضافة أو مراجعة الملاحظة الملحقة بالدولة <span className="text-white font-bold">{editingCountry.name} ({editingCountry.code})</span> لضمان إعلام بقية مشرفي المنصة بسبب تصنيف أو فرض هذه القيود الجغرافية.
            </p>

            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="bg-neutral-900 border border-white/5 rounded-xl w-full p-3 font-tajawal text-xs text-white h-28 focus:outline-none focus:border-saudi-green mb-5"
              placeholder="مثال: تم حظرها كلياً تنفيذاً لمتطلبات الترخيص المصرفي ومكافحة غسيل الأموال الحالية."
            />

            <div className="flex gap-2.5">
              <button
                onClick={handleSaveNote}
                className="flex-1 py-2 bg-saudi-green text-white text-xs font-bold rounded-xl hover:bg-saudi-green/90 transition-all cursor-pointer"
              >
                تحديث وحفظ الملاحظة
              </button>
              <button
                onClick={() => setEditingCountry(null)}
                className="flex-1 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                إلغاء الأمر
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
