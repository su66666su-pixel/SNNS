// VpnCountryMonitor.tsx - نظام مراقبة الدول وVPN والحارس الذكي لمنصة SNNS.PRO الفاخرة
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, 
  RotateCw, RefreshCw, Eye, EyeOff, CheckCircle, Terminal, 
  User, Server, Smartphone, Cpu, Shield, HelpCircle, Lock, Unlock, Mail, Play, AlertOctagon
} from "lucide-react";
import { 
  getCountryConfigs, CountryConfig, getSecurityLogs, SecurityLog,
  getSimulationSettings, saveSimulationSettings, SimulationSettings, addSecurityLog
} from "../../utils/countryLockStore";
import { 
  getThreatLogs, SecurityThreatLog, addThreatLog,
  getUserSecurityProfile, saveUserSecurityProfile, maskIpAddress, hasSecurityAccess
} from "../../utils/securityWatchdogStore";

interface ConnectionItem {
  id: string;
  username: string;
  email: string;
  countryCode: string;
  countryName: string;
  flag: string;
  city: string;
  ip: string;
  isp: string;
  connectionType: "ألياف ضوئية - Fiber" | "خلوية - Mobile 5G" | "مخدم سحابي - Cloud Server" | "منزلي - Broadband Broadband";
  vpnDetected: boolean;
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  riskScore: number; // 0-100
  lastActive: string;
  surveillanceEnabled: boolean;
  challengeActive?: "none" | "captcha" | "otp" | "restricted";
}

export default function VpnCountryMonitor() {
  const [countries] = useState<CountryConfig[]>(() => getCountryConfigs());
  const [simulation, setSimulation] = useState<SimulationSettings>(() => getSimulationSettings());
  
  // Custom states
  const [activeFilter, setActiveFilter] = useState<"all" | "vpn" | "blocked_countries" | "high_risk" | "tor" | "datacenter">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFullIps, setShowFullIps] = useState(true);
  
  // Mock Active Connections incorporating current simulated state
  const [connections, setConnections] = useState<ConnectionItem[]>([
    {
      id: "conn_1",
      username: "su66666su",
      email: "su66666su@gmail.com",
      countryCode: "SA",
      countryName: "المملكة العربية السعودية",
      flag: "🇸🇦",
      city: "الرياض",
      ip: "185.120.44.18",
      isp: "STC (Saudi Telecom Company)",
      connectionType: "ألياف ضوئية - Fiber",
      vpnDetected: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      riskScore: 4,
      lastActive: "الآن",
      surveillanceEnabled: false,
      challengeActive: "none"
    },
    {
      id: "conn_2",
      username: "yasmine_h",
      email: "yasmine.h@snns.pro",
      countryCode: "AE",
      countryName: "الإمارات العربية المتحدة",
      flag: "🇦🇪",
      city: "دبي",
      ip: "5.10.42.221",
      isp: "Du Telecom Premium Broadband",
      connectionType: "خلوية - Mobile 5G",
      vpnDetected: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      riskScore: 8,
      lastActive: "قبل ٤ د",
      surveillanceEnabled: false,
      challengeActive: "none"
    },
    {
      id: "conn_3",
      username: "f_alrajhi",
      email: "f_alrajhi@yahoo.com",
      countryCode: "US",
      countryName: "الولايات المتحدة الأمريكية",
      flag: "🇺🇸",
      city: "فرانكفورت سريرية",
      ip: "64.233.160.41",
      isp: "Linode Cloud Services LLC",
      connectionType: "مخدم سحابي - Cloud Server",
      vpnDetected: true,
      isProxy: true,
      isTor: false,
      isDatacenter: true,
      riskScore: 72,
      lastActive: "قبل ١٢ د",
      surveillanceEnabled: true,
      challengeActive: "captcha"
    },
    {
      id: "conn_4",
      username: "anonymous_sa",
      email: "guest_98412@snns.pro",
      countryCode: "IR",
      countryName: "جمهورية إيران الإسلامية",
      flag: "🇮🇷",
      city: "طهران",
      ip: "185.220.101.9",
      isp: "Tor Exit Node Network Germany",
      connectionType: "مخدم سحابي - Cloud Server",
      vpnDetected: true,
      isProxy: true,
      isTor: true,
      isDatacenter: true,
      riskScore: 98,
      lastActive: "قبل ٣٠ ث",
      surveillanceEnabled: true,
      challengeActive: "restricted"
    },
    {
      id: "conn_5",
      username: "saleh_qtr",
      email: "saleh@qatar.net",
      countryCode: "QA",
      countryName: "دولة قطر",
      flag: "🇶🇦",
      city: "الدوحة",
      ip: "78.100.22.4",
      isp: "Ooredoo Qatar Mobile",
      connectionType: "خلوية - Mobile 5G",
      vpnDetected: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      riskScore: 12,
      lastActive: "قبل ٢ د",
      surveillanceEnabled: false,
      challengeActive: "none"
    }
  ]);

  // Handle live changes to simulation dynamically
  useEffect(() => {
    if (simulation.enabled) {
      // Find the country
      const selectedCountry = countries.find(c => c.code === simulation.simulatedCountry) || countries[0];
      
      let connLabel: ConnectionItem["connectionType"] = "ألياف ضوئية - Fiber";
      if (simulation.simulatedConnectionType === "cellular") connLabel = "خلوية - Mobile 5G";
      else if (simulation.simulatedConnectionType === "datacenter") connLabel = "مخدم سحابي - Cloud Server";
      else if (simulation.simulatedConnectionType === "dsl") connLabel = "منزلي - Broadband Broadband";

      // If user profile is simulated, inject in connections
      const simulatedConnection: ConnectionItem = {
        id: "conn_simulated",
        username: "su66666su (محاكي المعاينة)",
        email: "su66666su@gmail.com",
        countryCode: simulation.simulatedCountry,
        countryName: selectedCountry.name,
        flag: selectedCountry.flag,
        city: simulation.simulatedCity,
        ip: simulation.simulatedIp,
        isp: simulation.simulatedIsp,
        connectionType: connLabel,
        vpnDetected: simulation.simulatedVpn,
        isProxy: simulation.simulatedIsProxy,
        isTor: simulation.simulatedIsTor,
        isDatacenter: simulation.simulatedIsDatacenter,
        riskScore: simulation.simulatedRiskScore,
        lastActive: "الآن",
        surveillanceEnabled: simulation.simulatedVpn || simulation.simulatedRiskScore > 40,
        challengeActive: simulation.simulatedRiskScore > 75 ? "restricted" : (simulation.simulatedRiskScore > 40 ? "otp" : "none")
      };

      // Check if simulated user connection should spark alert of VPN/New Location
      setConnections(prev => {
        const filtered = prev.filter(c => c.id !== "conn_simulated");
        return [simulatedConnection, ...filtered];
      });
    } else {
      setConnections(prev => prev.filter(c => c.id !== "conn_simulated"));
    }
  }, [simulation, countries]);

  // Listener for simulation updates from the localStorage
  useEffect(() => {
    const syncSimulation = () => {
      setSimulation(getSimulationSettings());
    };
    window.addEventListener("snns_geoip_changed", syncSimulation);
    return () => window.removeEventListener("snns_geoip_changed", syncSimulation);
  }, []);

  // Update specific connection state locally (escalate surveillance, trigger challenge etc)
  const handleUpdateSurveillance = (id: string, state: boolean) => {
    setConnections(prev => prev.map(c => {
      if (c.id === id) {
        if (state) {
          // Log inside general threat logs
          addThreatLog({
            userId: c.username,
            ip: c.ip,
            countryName: c.countryName,
            countryCode: c.countryCode,
            flag: c.flag,
            device: "متصفح المشرف - لوحة الرقابة المباشرة",
            browser: "Sovereign Web Core 🇸🇦",
            eventType: "vpn_detected",
            riskScore: "high",
            actionTaken: "under_surveillance",
            notes: `تم رفع مستوى الرقابة السيبرانية وتصعيد الحظر المعماري للاتصال من الـ IP [${c.ip}] بناء على أوامر يدوية من المشرف الرئيسي.`,
            verified: true
          });
        }
        return { ...c, surveillanceEnabled: state };
      }
      return c;
    }));
  };

  const handleTriggerChallenge = (id: string, challenge: ConnectionItem["challengeActive"]) => {
    setConnections(prev => prev.map(c => {
      if (c.id === id) {
        let actionMsg = "";
        let eventType: any = "ip_anomaly";
        let actTaken: any = "captcha_triggered";

        if (challenge === "captcha") {
          actionMsg = "تحدي كابتشا التحقق الأوتوماتيكي (CAPTCHA challenge applied)";
          eventType = "rate_limit";
          actTaken = "captcha_triggered";
        } else if (challenge === "otp") {
          actionMsg = "تم إرسال كود تحقق مؤقت ثنائي المصادقة للجوال (SMS OTP 2FA required)";
          eventType = "two_factor";
          actTaken = "two_factor_sent";
        } else if (challenge === "restricted") {
          actionMsg = "تم إخضاع الحساب لحظر نشاط مؤقت لدواعي الاشتباه العالي (Account temporarily locked)";
          eventType = "account_lock_triggered";
          actTaken = "ip_banned_temp";
        } else {
          actionMsg = "تم الموافقة وفك جميع التحديات والمطابقات بنجاح (All checks bypassed)";
          eventType = "account_uclock_admin";
          actTaken = "none";
        }

        // Add to threat logs
        addThreatLog({
          userId: c.username,
          ip: c.ip,
          countryName: c.countryName,
          countryCode: c.countryCode,
          flag: c.flag,
          device: "ذراع الرقابة - بوابة النفاذ والمحيط",
          browser: "Smart Sentry Console",
          eventType,
          riskScore: c.riskScore > 75 ? "extreme" : (c.riskScore > 40 ? "high" : "medium"),
          actionTaken: actTaken,
          notes: `إجراء المشرف: تم فرض تحدي [${actionMsg}] لحقن القيود والتحقق من بشرية وسلامة اتصال الحساب.`,
          verified: true
        });

        // Trigger SMS notification alert mockup
        alert(`✓ تم إرسال أمر فوري لهيكل الحساب [ ${c.username} ] لتطبيق الإجراء:  ${actionMsg}`);

        return { ...c, challengeActive: challenge };
      }
      return c;
    }));
  };

  // Add dynamic connection override via simple admin entry (For simulation requirement testing)
  const [newSimIp, setNewSimIp] = useState("142.250.200.46");
  const [newSimCountry, setNewSimCountry] = useState("SA");
  const [newSimCity, setNewSimCity] = useState("جدة عروس البحر 🌊");
  const [newSimIsp, setNewSimIsp] = useState("Zain Saudi Arabia Mobile Premium Cloud");
  const [newSimVpn, setNewSimVpn] = useState(false);
  const [newSimTor, setNewSimTor] = useState(false);
  const [newSimProxy, setNewSimProxy] = useState(false);
  const [newSimDatacenter, setNewSimDatacenter] = useState(false);
  const [newSimType, setNewSimType] = useState<"cellular" | "fiber" | "datacenter">("cellular");

  const applyCustomSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evaluate mock risk score
    let risk = 5;
    if (newSimVpn) risk += 30;
    if (newSimTor) risk += 55;
    if (newSimProxy) risk += 25;
    if (newSimDatacenter) risk += 20;
    if (newSimCountry !== "SA" && newSimCountry !== "AE" && newSimCountry !== "QA") risk += 15;
    if (risk > 100) risk = 100;

    const updatedSim: SimulationSettings = {
      enabled: true,
      simulatedIp: newSimIp,
      simulatedCountry: newSimCountry,
      simulatedCity: newSimCity,
      simulatedIsp: newSimIsp,
      simulatedVpn: newSimVpn,
      simulatedConnectionType: newSimType,
      simulatedIsProxy: newSimProxy,
      simulatedIsTor: newSimTor,
      simulatedIsDatacenter: newSimDatacenter,
      simulatedRiskScore: risk
    };

    setSimulation(updatedSim);
    saveSimulationSettings(updatedSim);

    // Notify alert layout
    addSecurityLog({
      countryCode: newSimCountry,
      countryName: countries.find(c => c.code === newSimCountry)?.name || "دولة مجهولة",
      flag: countries.find(c => c.code === newSimCountry)?.flag || "🌐",
      ip: newSimIp,
      attemptType: "login",
      status: risk > 75 ? "blocked" : (risk > 40 ? "warned" : "allowed_by_whitelist"),
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)",
      vpnDetected: newSimVpn,
      notes: `تنبيه: محاكاة دخول مستخدم من دولة جديدة (${newSimCountry} - ${newSimCity})، IP: [${newSimIp}]، VPN: [${newSimVpn ? "نشط" : "معطل"}]`
    });

    // Alert
    alert(`💡 تم تنشيط محاكي الاتصال وخصائص GeoIP بنجاح: تم التوجيه إلى ${newSimCity} (${newSimCountry}) باستخدام الـ IP: ${newSimIp}`);
  };

  const handleDeactivateSim = () => {
    const disabled = { ...simulation, enabled: false };
    setSimulation(disabled);
    saveSimulationSettings(disabled);
  };

  // Connection filters
  const filteredConnections = connections.filter(conn => {
    // Search
    const matchesSearch = 
      conn.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.ip.includes(searchQuery) ||
      conn.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.isp.toLowerCase().includes(searchQuery.toLowerCase());

    // Tabs
    if (activeFilter === "vpn") return matchesSearch && conn.vpnDetected;
    if (activeFilter === "blocked_countries") {
      const isBlockedCountry = countries.find(c => c.code === conn.countryCode)?.status === "blocked";
      return matchesSearch && (isBlockedCountry || conn.countryCode === "IR" || conn.countryCode === "SY");
    }
    if (activeFilter === "high_risk") return matchesSearch && conn.riskScore >= 60;
    if (activeFilter === "tor") return matchesSearch && conn.isTor;
    if (activeFilter === "datacenter") return matchesSearch && conn.isDatacenter;

    return matchesSearch;
  });

  // Calculating overall real-time analytics
  const activeCount = connections.length;
  const vpnCount = connections.filter(c => c.vpnDetected).length;
  const torCount = connections.filter(c => c.isTor).length;
  const highRiskCount = connections.filter(c => c.riskScore >= 60).length;

  return (
    <div className="space-y-6 text-right font-tajawal pb-12" dir="rtl">
      
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-l from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl gap-4">
        <div>
          <span className="text-[10px] text-saudi-glow font-bold block mb-1">المركز السيبراني وإدارة الحدود الرقمية الموحدة 🇸🇦</span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-saudi-green animate-pulse" />
            نظام كشف الدول والـ VPN والحارس الذكي (Sovereign Geolocation Intel)
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            مستودع متكامل لمطابقة الاتصالات الجغرافية، كشف تكتلات ومخدمات الوكيل (VPN, Proxy, Tor, Datacenters)، وسرعة فحص وتوثيق الهويات الوطنية والشركات.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => {
              setConnections(prev => [...prev]);
              alert("✓ تم تحديث ومطابقة عناوين IP وسجلات السحابة الوطنية في اللحظة بنجاح!");
            }}
            className="px-3.5 py-1.5 bg-saudi-green/10 hover:bg-saudi-green/20 text-saudi-glow border border-saudi-green/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>تحديث السجلات</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowFullIps(!showFullIps)}
            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/5"
          >
            {showFullIps ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showFullIps ? "إخفاء الـ IPs الكاملة" : "إظهار الـ IPs الكاملة"}</span>
          </button>
        </div>
      </div>

      {/* Cyber Intelligence Quick-stats Segment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0c0c0c] border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-gray-400 font-bold block">الاتصالات النشطة بالمنصة</span>
            <span className="text-2xl font-black text-white font-mono">{activeCount} جَلسة</span>
            <p className="text-[9px] text-gray-550 leading-none mt-1">يتم مراجعة موقعها الإلكتروني بالتناوب</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-saudi-green/10 flex items-center justify-center text-saudi-green border border-saudi-green/15 text-lg">
            🌐
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-red-400 font-bold block">مستخدمي شبكة VPN (نشط)</span>
            <span className="text-2xl font-black text-red-500 font-mono">{vpnCount} متصل</span>
            <p className="text-[9px] text-red-400/80 leading-none mt-1">تم إخضاعهم لرقابة مكثفة من الحارس الذكي</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/15 text-lg">
            🛡️
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-amber-500 font-bold block">تسلل عبر شبكة Tor البصلية</span>
            <span className="text-2xl font-black text-amber-500 font-mono">{torCount} جَلسة</span>
            <p className="text-[9px] text-amber-500/80 leading-none mt-1">كشف Tor Exit Nodes بالبصلة المشفرة</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/15 text-lg">
            🧅
          </div>
        </div>

        <div className="bg-[#0c0c0c] border border-white/5 p-4.5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-saudi-glow font-bold block">تهديدات عالية الحجم (Risk &gt; 60)</span>
            <span className="text-2xl font-black text-saudi-glow font-mono">{highRiskCount} مستخدم</span>
            <p className="text-[9px] text-saudi-glow/80 leading-none mt-1">تتطلب تحقق إضافي SMS / CAPTCHA فوراً</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-saudi-green/10 flex items-center justify-center text-saudi-glow border border-saudi-green/15 text-lg animate-pulse">
            ⚠️
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Columns: Active connections Ledger directory with filter Tabs */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 space-y-4">
            
            {/* Filter buttons and Search bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5 justify-end">
                  <span>سجل وجدول مطابقة الاتصالات والمخاطر الجغرافية المباشرة دقيقة بدقيقة</span>
                  <Terminal className="w-4 h-4 text-saudi-green" />
                </h3>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="ابحث بالحساب، الـ IP، المدينة أو مزود الخدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-950 border border-white/5 text-xs py-2 pr-9 pl-3 rounded-lg w-full text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 text-[10.5px] font-bold">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "all" ? "bg-saudi-green text-white border-saudi-green" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                الكل ({connections.length})
              </button>
              <button
                onClick={() => setActiveFilter("vpn")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "vpn" ? "bg-red-500 text-white border-red-500" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                VPN نشط فقط ({vpnCount})
              </button>
              <button
                onClick={() => setActiveFilter("tor")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "tor" ? "bg-amber-500 text-white border-amber-500" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                شبكات Tor المجهولة ({torCount})
              </button>
              <button
                onClick={() => setActiveFilter("datacenter")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "datacenter" ? "bg-purple-600 text-white border-purple-600" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                شبكات مخدمات سحابية Cloud Servers
              </button>
              <button
                onClick={() => setActiveFilter("blocked_countries")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "blocked_countries" ? "bg-orange-500 text-white border-orange-500" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                البلدان المحظورة الجغرافية
              </button>
              <button
                onClick={() => setActiveFilter("high_risk")}
                className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeFilter === "high_risk" ? "bg-saudi-glow text-white border-saudi-glow" : "bg-neutral-950 text-gray-400 border-white/5"}`}
              >
                مخاطر عالية (Score &gt; 60)
              </button>
            </div>

            {/* Monitored List */}
            <div className="space-y-4 pt-2">
              {filteredConnections.length === 0 ? (
                <div className="p-12 text-center text-gray-550 text-xs">لا يوجد حالياً اتصالات ومطابقات جغرافية تندمج تحت هذا القسم الفرعي.</div>
              ) : (
                filteredConnections.map((conn) => (
                  <div 
                    key={conn.id} 
                    className={`p-4 bg-neutral-950/45 border rounded-2xl space-y-3 hover:border-saudi-green/20 transition-all ${
                      conn.riskScore >= 75 
                        ? "border-red-500/20 bg-red-950/2" 
                        : (conn.riskScore >= 40 ? "border-amber-500/15 bg-amber-950/2" : "border-white/5")
                    }`}
                  >
                    
                    {/* Upper row: User profile, Country, and IP */}
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-center text-gray-300">
                          <User className="w-5 h-5 text-saudi-green" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{conn.username}</span>
                            <span className="text-[10px] text-gray-500 font-mono">({conn.email})</span>
                          </p>
                          <div className="flex gap-2 items-center text-[10px] text-gray-400 mt-1">
                            <span className="text-lg leading-none">{conn.flag}</span>
                            <span className="font-bold">{conn.countryName}</span>
                            <span>•</span>
                            <span>{conn.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Info */}
                      <div className="text-left font-mono space-y-1">
                        <p className="text-xs text-white font-bold">
                          {showFullIps ? conn.ip : maskIpAddress(conn.ip)}
                        </p>
                        <div className="flex items-center gap-1.5 justify-end text-[10px]">
                          <span className="px-2 py-0.5 bg-neutral-900 rounded border border-white/5 text-gray-400">{conn.connectionType}</span>
                          <span className="text-gray-500">{conn.lastActive}</span>
                        </div>
                      </div>

                    </div>

                    {/* Middle row: Extra metrics (ISP, bad indicators, risk slider, status badges) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-3 rounded-xl text-[10.5px]">
                      
                      {/* Left Block ISP & Anomalies */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-550">مزود ومحاذاة الـ ISP:</span>
                          <span className="text-gray-200 font-bold truncate max-w-[180px] text-left">{conn.isp}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          
                          {conn.vpnDetected ? (
                            <span className="px-1.5 py-0.5 bg-red-950/50 border border-red-500/30 text-red-400 rounded-md font-bold text-[9px]">
                              ⚠️ VPN Detected
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-500/10 text-emerald-400 rounded-md text-[9px]">
                              ✓ لا VPN
                            </span>
                          )}

                          {conn.isProxy && (
                            <span className="px-1.5 py-0.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-md font-bold text-[9px]">
                              🔗 Proxy Proxied
                            </span>
                          )}

                          {conn.isTor && (
                            <span className="px-1.5 py-0.5 bg-amber-900/40 border border-amber-500/30 text-amber-300 rounded-md font-bold text-[9px] animate-pulse">
                              🧅 Tor Onion Node
                            </span>
                          )}

                          {conn.isDatacenter && (
                            <span className="px-1.5 py-0.5 bg-purple-950/40 border border-purple-500/20 text-purple-300 rounded-md text-[9px]">
                              ☁️ Datacenter Host
                            </span>
                          )}

                        </div>
                      </div>

                      {/* Right Block Risk Slider and Challenge type status */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="text-gray-400">تقييم خطورة الاتصال الرقمي (Threat Score):</span>
                            <span className={`font-bold ${
                              conn.riskScore >= 75 ? "text-red-500" : (conn.riskScore >= 40 ? "text-amber-500" : "text-emerald-400")
                            }`}>{conn.riskScore}%</span>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                conn.riskScore >= 75 ? "bg-red-500" : (conn.riskScore >= 40 ? "bg-amber-500" : "bg-emerald-400")
                              }`}
                              style={{ width: `${conn.riskScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400">الرقابة السيبرانية:</span>
                          <div className="flex items-center gap-1.5">
                            {conn.surveillanceEnabled ? (
                              <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md font-bold">تصعيد مرتفع وعين ساهرة</span>
                            ) : (
                              <span className="text-gray-500 font-bold">عامة (طبيعية)</span>
                            )}
                            <span>•</span>
                            <span className="text-gray-400">التحدي الفوري:</span>
                            <span className="font-bold text-white">
                              {conn.challengeActive === "captcha" ? "كابتشا أمني" :
                               conn.challengeActive === "otp" ? "مزدوج المصادقة 2FA" :
                               conn.challengeActive === "restricted" ? "حساب مقيد مؤقتاً" : "مصرح وتلقائي"}
                            </span>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Lower row: Interactive rapid actions for admin overlay controls */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-white/3 justify-end items-center">
                      <span className="text-[10px] text-gray-500 font-bold ml-auto">أمر التدخل السريع للحارس الذكي:</span>
                      
                      {/* Escalate surveillance */}
                      <button
                        type="button"
                        onClick={() => handleUpdateSurveillance(conn.id, !conn.surveillanceEnabled)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          conn.surveillanceEnabled
                            ? "bg-red-950/30 border-red-500/50 text-red-400 hover:bg-neutral-900"
                            : "bg-[#0b0b0b] border-white/5 hover:border-red-500/20 text-gray-400 hover:text-red-400"
                        }`}
                      >
                        {conn.surveillanceEnabled ? "إلغاء المراقبة المركزة ✕" : "تصعيد المراقبة المرتفعة 👁️"}
                      </button>

                      {/* Challenge types */}
                      <button
                        type="button"
                        onClick={() => handleTriggerChallenge(conn.id, conn.challengeActive === "captcha" ? "none" : "captcha")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          conn.challengeActive === "captcha"
                            ? "bg-amber-500/20 border-amber-500 text-amber-400"
                            : "bg-[#0b0b0b] border-white/5 hover:border-amber-500/20 text-gray-400 hover:text-white"
                        }`}
                      >
                        طلب كود كابتشا سلوكي 🧩
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerChallenge(conn.id, conn.challengeActive === "otp" ? "none" : "otp")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          conn.challengeActive === "otp"
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                            : "bg-[#0b0b0b] border-white/5 hover:border-blue-500/20 text-gray-400 hover:text-white"
                        }`}
                      >
                        إلزام بـ SMS / OTP 📱
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerChallenge(conn.id, conn.challengeActive === "restricted" ? "none" : "restricted")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          conn.challengeActive === "restricted"
                            ? "bg-red-500/20 border-red-500/40 text-red-400"
                            : "bg-[#0b0b0b] border-white/5 hover:border-red-550/20 text-gray-400 hover:text-white"
                        }`}
                      >
                        حظر وحجم أنشطة مؤقت 🚫
                      </button>

                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Left Columns: Interactive Simulator Tool tuning board */}
        <div className="space-y-6">
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 space-y-4">
            
            <div className="border-b border-white/5 pb-3">
              <span className="text-[10px] text-saudi-glow font-bold block mb-1">بيئة اختبار الامتثال الجغرافي 🛡️</span>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                <span>محاكي الحوادث الأمني لـ SNNS.PRO</span>
                <Server className="w-4 h-4 text-saudi-glow" />
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                برمج واحقن أي حالة اتصال لدراسة كفاءة رصد الحارس الذكي، اختبار حظر الدول وسحابة Firebase. 
              </p>
            </div>

            {/* Simulated settings form */}
            <form onSubmit={applyCustomSimulation} className="space-y-4.5 text-right text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">١. أدخل عنوان IP وهمي (IPv4)</label>
                <input 
                  type="text"
                  required
                  value={newSimIp}
                  onChange={(e) => setNewSimIp(e.target.value)}
                  className="bg-neutral-950 border border-white/5 hover:border-saudi-green/45 py-2 px-3 text-xs w-full rounded-xl text-white font-mono text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">٢. حدد الدولة الجغرافية وطابع العلم</label>
                <select
                  value={newSimCountry}
                  onChange={(e) => setNewSimCountry(e.target.value)}
                  className="bg-neutral-950 font-bold border border-white/5 py-2 px-3 text-xs w-full rounded-xl text-white focus:outline-none"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">٣. المدينة السكنية</label>
                <input 
                  type="text"
                  required
                  value={newSimCity}
                  onChange={(e) => setNewSimCity(e.target.value)}
                  className="bg-neutral-950 border border-white/5 py-2 px-3 text-xs w-full rounded-xl text-white font-tajawal text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">٤. اسم المخدم السحابي أو الـ ISP</label>
                <input 
                  type="text"
                  required
                  value={newSimIsp}
                  onChange={(e) => setNewSimIsp(e.target.value)}
                  className="bg-neutral-950 border border-white/5 py-2 px-3 text-xs w-full rounded-xl text-white font-tajawal text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-bold block">٥. نوع وسير الاتصال المادي</label>
                <select
                  value={newSimType}
                  onChange={(e) => setNewSimType(e.target.value as any)}
                  className="bg-neutral-950 border border-white/5 py-2 px-3 text-xs w-full rounded-xl text-white focus:outline-none"
                >
                  <option value="fiber">ألياف ضوئية منزلية (Fiber opt)</option>
                  <option value="cellular">شبكة نقالة خلوية (STC/Zain 5G Mobile)</option>
                  <option value="datacenter">مخدم سحابي لبرامج الوكيل (Data Center VM)</option>
                </select>
              </div>

              {/* Toggle checklist items */}
              <div className="space-y-2 pt-2 border-t border-white/5 text-[10.5px]">
                <span className="text-gray-400 block font-bold">٦. مؤشرات كاشف التحايل والتوجيه المجهول:</span>
                
                <label className="flex items-center gap-2 text-gray-255 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={newSimVpn}
                    onChange={(e) => {
                      setNewSimVpn(e.target.checked);
                      if (e.target.checked) {
                        setNewSimIsp("ExpressVPN Secure Gateway");
                        setNewSimType("datacenter");
                      }
                    }}
                    className="rounded text-saudi-green accent-saudi-green"
                  />
                  <span>تنشيط رصد الـ VPN (VPN Detected Status)</span>
                </label>

                <label className="flex items-center gap-2 text-gray-255 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={newSimTor}
                    onChange={(e) => {
                      setNewSimTor(e.target.checked);
                      if (e.target.checked) {
                        setNewSimVpn(true);
                        setNewSimProxy(true);
                        setNewSimType("datacenter");
                        setNewSimIsp("Tor Exit Node [ onion1984 ]");
                      }
                    }}
                    className="rounded text-saudi-green accent-saudi-green"
                  />
                  <span>اتصال مجهول عبر شبكة Onion Tor البصلية</span>
                </label>

                <label className="flex items-center gap-2 text-gray-255 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={newSimProxy}
                    onChange={(e) => setNewSimProxy(e.target.checked)}
                    className="rounded text-saudi-green accent-saudi-green"
                  />
                  <span>رصد مخدم بروكسي تتبع وساطة (Proxy detected)</span>
                </label>

                <label className="flex items-center gap-2 text-gray-255 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox"
                    checked={newSimDatacenter}
                    onChange={(e) => {
                      setNewSimDatacenter(e.target.checked);
                      if (e.target.checked) {
                        setNewSimType("datacenter");
                      }
                    }}
                    className="rounded text-saudi-green accent-saudi-green"
                  />
                  <span>الاتصال وارد من داتا سنتر سحابي (Datacenter Host IP)</span>
                </label>

              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer text-center"
                >
                  حقن وتفعيل التهديد ⚡
                </button>

                {simulation.enabled && (
                  <button
                    type="button"
                    onClick={handleDeactivateSim}
                    className="py-2.5 px-3 bg-red-955/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء المحاكي
                  </button>
                )}
              </div>

            </form>

            {simulation.enabled && (
              <div className="p-3.5 bg-saudi-green/10 border border-saudi-green/20 rounded-2xl text-[10px] text-white leading-relaxed flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-saudi-glow animate-ping shrink-0" />
                <span>المحاكي نشط الآن ويتحكم بجميع اتصالات SNNS.PRO المباشرة بنجاح.</span>
              </div>
            )}

          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 space-y-4 text-xs">
            <h3 className="font-extrabold text-white flex items-center gap-1.5 justify-end border-b border-white/5 pb-2.5">
              <span>بروتوكول التعامل مع التهديدات</span>
              <Shield className="w-4.5 h-4.5 text-saudi-green" />
            </h3>
            
            <p className="text-gray-400 leading-relaxed text-[10.5px]">
              تحمي منصة <strong>SNNS.PRO</strong> مستخدميها من خلال نظام مركب لا يحظر مباشرة بالظلم وإنما يلتزم بالنظام التدرجي:
            </p>

            <div className="space-y-2.5 text-[9.5px]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 flex items-center justify-center shrink-0 font-bold">١</span>
                <div>
                  <h4 className="font-bold text-white">الإنذار السلوكي والرقابة المركزة:</h4>
                  <p className="text-gray-500 mt-0.5">عند رصد اتصال VPN سليم ولكن من دولة غريبة، يتم رفع درجة الحذر لمراقبة العمليات الحساسة دون حظر التصفح.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 flex items-center justify-center shrink-0 font-bold">٢</span>
                <div>
                  <h4 className="font-bold text-white">التحدي الفوري (CAPTCHA Challenge):</h4>
                  <p className="text-gray-550 mt-0.5">في حال حدوث نقرات أو محاولات إرسال مكثفة لمنع سبام الدردشة ومكافحة بوتات التتبع.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 flex items-center justify-center shrink-0 font-bold">٣</span>
                <div>
                  <h4 className="font-bold text-white">تحقق الجوال والامتثال المزدوج (SMS OTP 2FA):</h4>
                  <p className="text-gray-550 mt-0.5 font-tajawal">يطبق إجبارياً على العمليات المالية واللوجستية وبث المحتوى كوقاية ضد السرقة.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 flex items-center justify-center shrink-0 font-bold">٤</span>
                <div>
                  <h4 className="font-bold text-white">الحظر المؤقت التام للأي بي:</h4>
                  <p className="text-gray-550 mt-0.5">فقط عند تكرار هجومات التخمين (Bruteforce) أو تلاقح شبكات Tor المشبوهة المتطرفة.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
