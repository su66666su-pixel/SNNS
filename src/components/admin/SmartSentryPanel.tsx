import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, ShieldAlert, Cpu, Terminal, Users, AlertOctagon, 
  RefreshCw, Ban, UserX, Unlock, Eye, EyeOff, Globe, Sparkles, 
  Fingerprint, HelpCircle, Flame, Shield, Play, Trash2, KeyRound,
  RotateCcw, Search, ExternalLink, HelpCircle as InfoIcon
} from "lucide-react";
import { 
  getThreatLogs, saveThreatLogs, SecurityThreatLog,
  getBlockedIpsList, saveBlockedIpsList,
  getUserSecurityProfile, saveUserSecurityProfile, UserSecurityProfile,
  hasSecurityAccess, maskIpAddress, maskDeviceName, addThreatLog,
  evaluateSentryThreat, ThreatRiskLevel
} from "../../utils/securityWatchdogStore";

export default function SmartSentryPanel() {
  const [logs, setLogs] = useState<SecurityThreatLog[]>(() => getThreatLogs());
  const [blockedIps, setBlockedIps] = useState<string[]>(() => getBlockedIpsList());
  const [userSec, setUserSec] = useState<UserSecurityProfile>(() => getUserSecurityProfile());
  const [viewUnmasked, setViewUnmasked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");
  
  // Simulation ongoing effects
  const [simType, setSimType] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Security center parameters
  const [stats, setStats] = useState({
    attemptsCount: 184,
    highRiskUsers: 2,
    vpnDetections: 48,
    integrity: 98,
    compromisedCredentialsStopped: 15
  });

  useEffect(() => {
    // Recount stats from live counts
    const extremeAndHigh = logs.filter(l => l.riskScore === "extreme" || l.riskScore === "high").length;
    const vpnCount = logs.filter(l => l.eventType === "vpn_detected").length;
    setStats({
      attemptsCount: logs.length * 4 + 48,
      highRiskUsers: userSec.isLocked ? 3 : 2,
      vpnDetections: vpnCount + 32,
      integrity: userSec.isLocked ? 84 : 98,
      compromisedCredentialsStopped: extremeAndHigh * 2 + 5
    });
  }, [logs, userSec]);

  // Handle live custom event when logs added
  useEffect(() => {
    const handleNewThreatLog = (e: any) => {
      setLogs(getThreatLogs());
      setBlockedIps(getBlockedIpsList());
      setUserSec(getUserSecurityProfile());
    };
    window.addEventListener("snns_sentry_threat_added", handleNewThreatLog);
    return () => {
      window.removeEventListener("snns_sentry_threat_added", handleNewThreatLog);
    };
  }, []);

  // Flush Sentry threat logs
  const handleClearLogs = () => {
    if (confirm("هل أنت متأكد من رغبتك في مسح سجل تهديدات الحارس الذكي بالكامل؟")) {
      saveThreatLogs([]);
      setLogs([]);
      showToast("تم تصفير سجل عمليات الحارس الذكي");
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Add customized simulated attacks in real time
  const triggerSimulationBruteforce = () => {
    setSimType("bruteforce");
    setTimeout(() => {
      // Simulate multiple failed password attempts on 'su66666su'
      const activeSec = getUserSecurityProfile();
      const updatedSec = {
        ...activeSec,
        failedAttempts: 5,
        isLocked: true,
        userAlerts: [
          {
            id: String(Math.random()),
            msg: "الحارس الذكي: تم قفل الحساب مؤقتاً بعد رصد 5 محاولات دخول خاطئة ومتكررة.",
            timestamp: new Date().toLocaleTimeString("ar-SA"),
            type: "critical" as const
          },
          ...activeSec.userAlerts
        ]
      };
      saveUserSecurityProfile(updatedSec);
      setUserSec(updatedSec);

      // Log threat
      addThreatLog({
        userId: "su66666su",
        ip: "185.220.101.9",
        countryName: "جمهورية إيران الإسلامية",
        countryCode: "IR",
        flag: "🇮🇷",
        device: "Tor Nodes Proxy Server",
        browser: "Armitage SSH Bruteforcer v4",
        eventType: "bruteforce",
        riskScore: "extreme",
        actionTaken: "locked_account",
        notes: "رصد هجوم تخمين متزامن عنيف من خادوم تور على معرف 'su66666su'. قام النظام الآلي بقفل الحساب ومنع الاختراق فورياً.",
        verified: true
      });

      setSimType(null);
      showToast("💡 تم محاكاة هجوم التخمين وإيقافه بواسطة الحارس الذكي بنجاح!");
    }, 1500);
  };

  const triggerSimulationVPN = () => {
    setSimType("vpn_hijack");
    setTimeout(() => {
      const activeIp = "192.140.12.8";
      // Simulate foreign intrusion
      addThreatLog({
        userId: "guest",
        ip: activeIp,
        countryName: "الولايات المتحدة الأمريكية",
        countryCode: "US",
        flag: "🇺🇸",
        device: "Google Cloud Platform Virtual Server",
        browser: "Chrome Headless AutoBot v1",
        eventType: "vpn_detected",
        riskScore: "high",
        actionTaken: "ip_banned_temp",
        notes: "رصد خادم وكيل (Proxy Tunnel) مشبوه يحاول الكشط التلقائي وحقن الكود. تم حظر الـ IP المعني مؤقتاً وعقد جدار حماية Cloudflare.",
        verified: true
      });

      // Add to blocked IP list
      const ips = getBlockedIpsList();
      if (!ips.includes(activeIp)) {
        const next = [activeIp, ...ips];
        saveBlockedIpsList(next);
        setBlockedIps(next);
      }

      setSimType(null);
      showToast("⚓ تم رصد ومحاكاة محاولة تجاوز VPN أجنبي ومنعها فورياً!");
    }, 1600);
  };

  // Turn off account lock manually (Administrative Release)
  const handleReleaseAccountLocks = () => {
    const activeSec = getUserSecurityProfile();
    const updated = {
      ...activeSec,
      isLocked: false,
      failedAttempts: 0,
      userAlerts: [
        {
          id: String(Math.random()),
          msg: "الحارس الذكي: تم الإفراج الإداري وفك قفل الحساب بالتنسيق مع المشرفين.",
          timestamp: new Date().toLocaleTimeString("ar-SA"),
          type: "info" as const
        },
        ...activeSec.userAlerts
      ]
    };
    saveUserSecurityProfile(updated);
    setUserSec(updated);

    addThreatLog({
      userId: "su66666su",
      ip: "127.0.0.1",
      countryName: "المملكة العربية السعودية",
      countryCode: "SA",
      flag: "🇸🇦",
      device: "Admin Security Center",
      browser: "SuperAdmin Dashboard Terminal",
      eventType: "account_uclock_admin",
      riskScore: "low",
      actionTaken: "none",
      notes: "تم إلغاء قفل الحساب المذكور بطلب إداري معتمد بعد التحقق اليدوي الخارجي من مالك الحساب.",
      verified: true
    });

    showToast("✓ تم فك القفل عن الحساب وسماح تداول الجلسات.");
  };

  // Custom manual IP Block
  const [customIpToBlock, setCustomIpToBlock] = useState("");
  const handleManualBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = customIpToBlock.trim();
    if (!cleanIp) return;
    
    const ips = getBlockedIpsList();
    if (ips.includes(cleanIp)) {
      alert("هذا العنوان محظور مسبقاً في جدار الحماية الرقمي.");
      return;
    }

    const next = [cleanIp, ...ips];
    saveBlockedIpsList(next);
    setBlockedIps(next);
    setCustomIpToBlock("");
    showToast(`✓ تم حجب العنوان ${cleanIp} يدوياً في كتل الفايروال.`);
  };

  const handleManualUnblockIp = (ip: string) => {
    const next = blockedIps.filter(item => item !== ip);
    saveBlockedIpsList(next);
    setBlockedIps(next);
    showToast(`✓ تم رفع الحظر عن الـ IP: ${ip}`);
  };

  // Helper translations for display
  const getRiskColor = (level: ThreatRiskLevel) => {
    switch (level) {
      case "extreme": return "text-red-500 border-red-500 bg-red-500/10";
      case "high": return "text-orange-500 border-orange-500 bg-orange-500/10";
      case "medium": return "text-yellow-500 border-yellow-500 bg-yellow-500/10";
      default: return "text-neutral-400 border-white/5 bg-white/2";
    }
  };

  const getRiskLabel = (level: ThreatRiskLevel) => {
    switch (level) {
      case "extreme": return "🔴 خطير جداً";
      case "high": return "🟠 عالي الخطورة";
      case "medium": return "🟡 متوسط الخطورة";
      default: return "🟢 منخفض الآثار";
    }
  };

  const getEventNameAr = (ev: string) => {
    switch (ev) {
      case "bruteforce": return "تخمين كلمة المرور";
      case "vpn_detected": return "مرور VPN مخفي وكيل";
      case "country_mismatch": return "تغير جيوغرافي مستبعد";
      case "new_device": return "دخول جهاز غير مسجل";
      case "ip_anomaly": return "تغير IP سريع ومشبوه";
      case "rate_limit": return "تجاوز معدل الطلبات";
      case "account_uclock_admin": return "إلغاء قفل إداري";
      default: return "تفحص روتيني للجلسة";
    }
  };

  const getActionNameAr = (act: string) => {
    switch (act) {
      case "locked_account": return "🔒 قفل الحساب الفوري";
      case "ip_banned_temp": return "🌐 حظر الـ IP تلقائياً";
      case "two_factor_sent": return "🔑 طلب مصادقة 2FA";
      case "captcha_triggered": return "🧩 فرض اختبار كابتشا روبوت";
      default: return "بدون - رصد فقط";
    }
  };

  // Filtering threat logs
  const filteredLogs = logs.filter(l => {
    const matchSearch = 
      l.userId.includes(searchQuery) || 
      l.ip.includes(searchQuery) || 
      l.notes.includes(searchQuery);
    const matchRisk = selectedRiskFilter === "all" || l.riskScore === selectedRiskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="space-y-8 text-right font-tajawal relative" dir="rtl">
      
      {/* Toast Overlay notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-6 z-[99999] bg-[#0c0c0c] border border-saudi-green px-5 py-3.5 rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(0,163,79,0.25)] flex items-center gap-2"
          >
            <ShieldCheck className="w-4.5 h-4.5 text-saudi-glow shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Smart system status banner */}
      <div className="p-6 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-white/5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-4 opacity-5">
          <Cpu className="w-56 h-56 text-saudi-green" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-[#00A34F]/10 border border-[#00A34F]/30 text-saudi-glow rounded-lg text-[10px] font-black tracking-widest uppercase">الذكاء الاصطناعي الأمني الآلي</span>
              <h2 className="text-xl font-black text-white flex items-center gap-1.5 font-tajawal">
                الحارس الذكي 🇸🇦 <span className="text-saudi-glow">Sentry-AI v3.5</span>
              </h2>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
              يقوم "الحارس الذكي" السيرفر المحلي بمراقبة عادات وسلوكيات تسجيل الدخول لـ SNNS.PRO، كشف التخمينات الجغرافية المتكررة، صد هجمات الروبوتات والـ VPN، واتخاذ قرارات فورية مثل الحظر وطلب كود الـ 2FA أو كابتشا تلقائياً لحماية الممتلكات الرقمية.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {/* View unmasked toggler */}
            <button
              onClick={() => setViewUnmasked(!viewUnmasked)}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                viewUnmasked 
                  ? "bg-saudi-green/10 border-saudi-green text-saudi-glow" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {viewUnmasked ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>حجب عناوين IP الخصوصية</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>كشف بيانات الآي بي الحقيقية (خيار المشرف)</span>
                </>
              )}
            </button>
            <span className="hidden lg:inline text-[10px] text-gray-400">تحت حكم (Super Admin)</span>
          </div>
        </div>
      </div>

      {/* Interactive Core Security stats panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Stat 1: Threat Score */}
        <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-bold">مؤشر سلامة خادم المنصة</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-2xl font-black font-mono ${stats.integrity > 90 ? "text-saudi-glow" : "text-red-400"}`}>{stats.integrity}%</span>
            <span className="text-[9px] text-gray-550">مستقر</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${stats.integrity > 90 ? "bg-saudi-green" : "bg-red-500"}`} 
              style={{ width: `${stats.integrity}%` }} 
            />
          </div>
        </div>

        {/* Stat 2: Attempts count */}
        <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-bold">الرصد والحماية اليوم</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-amber-500 font-mono">+{stats.attemptsCount}</span>
            <span className="text-[9px] text-gray-550 font-tajawal">هجمات</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2">تغيرات IP وتخمين خاطئ</p>
        </div>

        {/* Stat 3: High risk accounts */}
        <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-bold">حسابات مشبوهة / خطيرة</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-2xl font-black font-mono ${stats.highRiskUsers > 2 ? "text-red-500" : "text-yellow-500"}`}>{stats.highRiskUsers}</span>
            <span className="text-[9px] text-gray-550">حالة نشطة</span>
          </div>
          <p className="text-[9px] text-red-400 mt-2">{userSec.isLocked ? "حساب سليمان مغلق أمنياً" : "لا حسابات مقفلة كلياً"}</p>
        </div>

        {/* Stat 4: Credentials Stopped */}
        <div className="p-4 bg-[#050505] border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-bold">إجهاض محاولات هجوم</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-saudi-glow font-mono">{stats.compromisedCredentialsStopped}</span>
            <span className="text-[9px] text-gray-550">عملية</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2">إفشال اختراق عبر الذكاء</p>
        </div>

        {/* Stat 5: VPN attempts */}
        <div className="p-4 col-span-2 md:col-span-1 bg-[#050505] border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-bold">محاولات VPN محجوبة</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{stats.vpnDetections}</span>
            <span className="text-[9px] text-gray-550">تسلل</span>
          </div>
          <p className="text-[9px] text-gray-400 mt-2">روابط بروكسيات أجنبية</p>
        </div>
      </div>

      {/* Simulator Actions triggers / Quick controls panel */}
      <div className="p-5 bg-[#080808]/70 border border-white/5 rounded-2xl">
        <h3 className="font-bold text-xs text-white flex items-center gap-1.5 justify-end mb-2">
          <span>غرفة اختبار الاختراقات وإجراءات الحارس الذكي</span>
          <Sparkles className="w-4 h-4 text-saudi-glow" />
        </h3>
        <p className="text-[11px] text-gray-500 mb-4">كـ Super Admin، يمكنك توليد واختبار هجمات حية لتفقد كيف يتصرف الـ AI في تفويض السيرفر، ومراقبة تهميش الثغرات على المنصة وكتابة السجل فورا.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* BruteForce simulation button */}
          <button
            onClick={triggerSimulationBruteforce}
            disabled={!!simType}
            className="p-4 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 rounded-xl text-right transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="p-1 text-[9px] font-bold text-red-400 bg-red-500/10 rounded">اختلاق هجوم</span>
              <Flame className="w-5 h-5 text-red-500 group-hover:animate-bounce" />
            </div>
            <h4 className="font-bold text-xs text-white">1. هجوم تخمين كلمة المرور (Bruteforce)</h4>
            <p className="text-[10px] text-gray-405 mt-1 leading-relaxed">تخمين 5 كلمات مرور متتالية للحساب المعتمد. سيقوم السنتري بقفل الحساب وتحويل ريسك التهديد إلى (خطير جداً) وإرسال تنبيه.</p>
            {simType === "bruteforce" && <p className="text-[10px] text-red-400 font-bold mt-2 animate-pulse">جاري حقن محاكاة هجوم الهيدرا... ☠️</p>}
          </button>

          {/* VPN injection simulation */}
          <button
            onClick={triggerSimulationVPN}
            disabled={!!simType}
            className="p-4 bg-orange-950/20 hover:bg-orange-950/40 border border-orange-900/40 rounded-xl text-right transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="p-1 text-[9px] font-bold text-orange-400 bg-orange-500/10 rounded">اختلاق هجوم</span>
              <Fingerprint className="w-5 h-5 text-orange-500 group-hover:rotate-12" />
            </div>
            <h4 className="font-bold text-xs text-white">2. تجاوز VPN / بروكسي مخفي أجنبي</h4>
            <p className="text-[10px] text-gray-405 mt-1 leading-relaxed">محاكاة دخول مستخدم من دولة خارج الخليج عبر نفق مشفر. سيتم كشفه جغرافيا وإحالة الأي بي ميكانيكياً لبلاك ليست الحجب.</p>
            {simType === "vpn_hijack" && <p className="text-[10px] text-orange-400 font-bold mt-2 animate-pulse">جاري تفيل الكاشف الجغرافي للمحاكاة... 🛡️</p>}
          </button>

          {/* Admin remediation release zone */}
          <div className="p-4 bg-[#0a1410] border border-saudi-green/20 rounded-xl text-right flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-saudi-glow" />
                الإصلاحات والتحكم الطارئ
              </h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">فك أقفال تسجيل الحسابات وحظر العناوين المشفرة فوريا للتحقق وحل مشاكل الفنيين الميدانيين.</p>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleReleaseAccountLocks}
                className="flex-1 py-1.5 px-2 bg-saudi-green hover:bg-saudi-green/90 text-white text-[10.5px] font-bold rounded-lg transition-all"
              >
                فك قفل حساب سليمان
              </button>
              
              <button
                onClick={() => {
                  setUserSec({
                    ...userSec,
                    failedAttempts: 0,
                    isLocked: false,
                    forcePasswordChange: false,
                    underSurveillance: false
                  });
                  showToast("تم إعادة تهيئة إعدادات الأمان الطبيعية");
                }}
                className="py-1.5 px-2.5 bg-white/5 hover:bg-white/10 text-gray-350 text-[10.5px] rounded-lg border border-white/5"
                title="تصفير الأمان"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid: Threats log timeline and blocked IPs firewall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: live Threat logs Timeline analysis */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Terminal className="w-5 h-5 text-saudi-green" />
                  سجل استخبارات التهديدات وهجمات الإحاطة بالأمان
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">تقارير الذكاء الاصطناعي الأمني في تصنيف المخاطر وتتبع الجلسات الجغرافية النشطة</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="bg-neutral-900 border border-white/5 text-[11px] text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-saudi-green"
                >
                  <option value="all">كل مستويات الخطورة</option>
                  <option value="extreme">🔴 خطير جداً</option>
                  <option value="high">🟠 عالي الخطورة</option>
                  <option value="medium">🟡 متوسط الخطورة</option>
                  <option value="low">🟢 منخفض الآثار</option>
                </select>

                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالـ IP، الحساب، أو الملاحظة..."
                    className="bg-neutral-900 border border-white/5 py-1 pr-7 pl-2.5 text-[11px] rounded-lg text-white w-full sm:w-44 focus:outline-none focus:border-saudi-green"
                  />
                </div>
              </div>
            </div>

            {/* Logs List Container */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 pad-scrolling">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-550 text-xs">لا توجد سجلات تهديد تتطابق مع بحثك الحالي</div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-4 bg-neutral-950/50 border border-white/5 rounded-xl hover:border-white/10 transition-all text-right"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border ${getRiskColor(log.riskScore)} font-bold`}>
                          {getRiskLabel(log.riskScore)}
                        </span>
                        <span className="text-[11px] bg-white/5 px-2.5 py-0.5 rounded-md font-bold text-gray-300">
                          {getEventNameAr(log.eventType)}
                        </span>
                        <span className="text-[11px] text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                          {getActionNameAr(log.actionTaken)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono font-bold">{log.timestamp}</span>
                    </div>

                    <p className="text-xs text-white leading-relaxed mb-3">{log.notes}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950 p-2.5 rounded-lg border border-white/3 text-[11px]">
                      <div>
                        <span className="text-gray-550 block text-[9.5px]">الحساب المستهدف</span>
                        <span className="text-saudi-glow font-bold">@{log.userId}</span>
                      </div>
                      <div>
                        <span className="text-gray-550 block text-[9.5px]">عنوان الآي بي</span>
                        <span className="font-mono text-gray-200">
                          {viewUnmasked ? log.ip : maskIpAddress(log.ip)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-550 block text-[9.5px]">الجهاز والمحيط</span>
                        <span className="text-gray-300 truncate block max-w-full">
                          {viewUnmasked ? log.device : maskDeviceName(log.device)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-550 block text-[9.5px]">الموقع الجغرافي</span>
                        <span className="text-gray-200 flex items-center gap-1 justify-end">
                          <span>{log.flag}</span>
                          <span className="truncate">{log.countryName}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Clear logs footer button */}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-gray-500">تم فحص جميع الجلسات بموجب قانون العقوبات السيبراني للمملكة 🇸🇦</span>
              <button 
                onClick={handleClearLogs}
                className="py-1 px-3 text-[10px] text-red-400 hover:text-red-300 font-bold hover:bg-red-500/10 rounded transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                تطهير السجل الأمني
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Firewall (IP blocks) list */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5 justify-end">
              <span>عناوين IP المحجوبة مؤقتاً (Firewall Blocks)</span>
              <Ban className="w-5 h-5 text-red-500" />
            </h3>
            <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
              العناوين المدرجة هنا تم تجميد اتصالاتها بالكامل ومنعها من إفشاء أي تدوير محتوى أو تصفح لأسباب أمنية عاجلة. يتم تصفية جدار الحماية دورياً.
            </p>

            {/* Manual IP add form */}
            <form onSubmit={handleManualBlockIp} className="flex gap-2 mb-4">
              <input
                type="text"
                required
                pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                placeholder="عنوان IPv4 يدوي... (1.1.1.1)"
                value={customIpToBlock}
                onChange={(e) => setCustomIpToBlock(e.target.value)}
                className="bg-neutral-950 border border-white/5 text-xs py-2 px-3 rounded-xl flex-1 text-white text-left font-mono focus:outline-none focus:border-red-500Unified"
              />
              <button
                type="submit"
                className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 text-xs font-bold rounded-xl transition-all font-tajawal cursor-pointer shrink-0"
              >
                حجب +
              </button>
            </form>

            {/* Blocked IPs List scrollable */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scr select-scrollbar">
              {blockedIps.length === 0 ? (
                <div className="p-6 text-center text-gray-600 text-[11px]">لا توجد أي عناوين آي بي محظورة من السيرفر حالياً.</div>
              ) : (
                blockedIps.map((ip) => (
                  <div key={ip} className="p-3 bg-neutral-950/60 border border-white/5 rounded-xl flex items-center justify-between text-xs hover:bg-neutral-950 transition-all font-mono">
                    <button
                      onClick={() => handleManualUnblockIp(ip)}
                      className="py-1 px-2.5 bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 rounded-lg hover:bg-saudi-green/20 text-[10px] font-tajawal cursor-pointer transition-all"
                    >
                      فك الحظر
                    </button>
                    <div className="text-right">
                      <span className="text-red-400 font-bold">{viewUnmasked ? ip : maskIpAddress(ip)}</span>
                      <span className="text-[10px] text-gray-550 block font-tajawal mt-0.5 bg-red-500/10 px-1.5 py-0.5 rounded w-fit border border-red-500/10 text-right">✓ محمي بجزيئات الـ ACL</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick FAQ info panel */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 text-xs space-y-2 text-right">
            <h4 className="font-bold text-white flex items-center justify-end gap-1 text-[11px]">
              <span>كيف تعمل تقنية الكبح التلقائي؟</span>
              <InfoIcon className="w-4 h-4 text-saudi-glow" />
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              عند إخفاق العميل في فحص الـ Captcha أو تخطي حد الـ 2FA المشفر أو تكرار تخمين كلمة المرور تزامناً مع عنوان IP جديد، يسجل السنتري مستوى خطورة أقصى يعقبه إلغاء للجلسات الحالية بالكامل لدرء محاولات الهندسة والابتزاز التقني.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
