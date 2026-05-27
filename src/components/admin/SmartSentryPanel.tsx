import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, ShieldAlert, Cpu, Terminal, Users, AlertOctagon, 
  RefreshCw, Ban, UserX, Unlock, Eye, EyeOff, Globe, Sparkles, 
  Fingerprint, HelpCircle, Flame, Shield, Play, Trash2, KeyRound,
  RotateCcw, Search, ExternalLink, HelpCircle as InfoIcon,
  FileText, Printer, X, Calendar, Smartphone, Laptop
} from "lucide-react";
import { 
  getThreatLogs, saveThreatLogs, SecurityThreatLog,
  getBlockedIpsList, saveBlockedIpsList,
  getUserSecurityProfile, saveUserSecurityProfile, UserSecurityProfile,
  hasSecurityAccess, maskIpAddress, maskDeviceName, addThreatLog,
  evaluateSentryThreat, ThreatRiskLevel,
  getDeviceSessions, terminateDeviceSession, DeviceSession
} from "../../utils/securityWatchdogStore";
import { db, collection, onSnapshot, query, orderBy, limit } from "../../utils/firebase";
import { 
  setupFCM, 
  requestNotificationPermission, 
  getNotificationPermissionStatus, 
  triggerBrowserNotification 
} from "../../utils/fcmNotifications";

export default function SmartSentryPanel() {
  const [logs, setLogs] = useState<SecurityThreatLog[]>(() => getThreatLogs());
  const [blockedIps, setBlockedIps] = useState<string[]>(() => getBlockedIpsList());
  const [userSec, setUserSec] = useState<UserSecurityProfile>(() => getUserSecurityProfile());
  const [sessions, setSessions] = useState<DeviceSession[]>(() => getDeviceSessions());
  const [viewUnmasked, setViewUnmasked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("all");
  const [showPdfReport, setShowPdfReport] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<"light" | "dark">("light");

  // Firebase Cloud Messaging & Browser Push States
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [fcmConnected, setFcmConnected] = useState(false);
  const [isFcmSimulated, setIsFcmSimulated] = useState(false);
  const [fcmError, setFcmError] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  // Determine notification permission on launch & initialize FCM setup
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }

    const initializePushSystem = async () => {
      const fcmState = await setupFCM();
      setFcmToken(fcmState.token);
      setFcmError(fcmState.error);
      setIsFcmSimulated(fcmState.isSimulated);
      setFcmConnected(fcmState.token !== null);
    };

    initializePushSystem();
  }, []);

  // Request browser Notification permission yielder
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted);
    if (granted === "granted") {
      showToast("✓ تم تفعيل إشعارات المتصفح من الحارس الذكي.");
      triggerBrowserNotification(
        "🔔 تم تفعيل منصة الحارس الذكي",
        "سيتلقى هذا الجهاز إشعارات فورية عند رصد عمليات التلبيس والتهديدات ذات الخطورة القصوى (Extreme Risk)."
      );
    } else {
      showToast("⚠ لم يتم منح إذن الإشعارات. يرجى تفعيله يدوياً في إعدادات المتصفح.");
    }
  };

  // Dispatch a simulated extreme threat test to verify FCM and system synchronization
  const handleTestPushNotification = () => {
    const title = "🚨 تجربة إشعار الحارس الذكي | Sentry Test";
    const body = `الحارس الذكي: رصد محاولة دخول مشبوهة ذات خطورة قصوى (Extreme Risk) من خادوم غريب.`;
    
    // Trigger local push
    triggerBrowserNotification(title, body);

    // Write a real extreme log to firestore & localStorage to test synchronization
    addThreatLog({
      userId: "su66666su",
      ip: "185.120.44.180",
      countryName: "المملكة العربية السعودية",
      countryCode: "SA",
      flag: "🇸🇦",
      device: "FCM Push Tester Engine",
      browser: "Chrome Admin Simulator v4",
      eventType: "ip_anomaly",
      riskScore: "extreme",
      actionTaken: "locked_account",
      notes: "محاكاة دفع أوتوماتيكي معتمد للتحقق من سلامة قنوات التوزيع الفوري (Real-time FCM Gateway Listener).",
      verified: true
    });

    showToast("✓ تم إرسال الإشعار وتجربة السور السيبراني بنجاح.");
  };

  // Real-time Firestore document updates listener to intercept pushed extreme logs instantly
  useEffect(() => {
    let initialized = false;
    
    // Setup listener on threat_logs collection
    const unsubscribe = onSnapshot(collection(db, "threat_logs"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const logData = change.doc.data();
          
          // Only fire notifications for new logs written *after* the dashboard page is active
          if (initialized) {
            if (logData.riskScore === "extreme") {
              const title = `🚨 هجوم سيبراني قيد التنفيذ! [${getEventNameAr(logData.eventType)}]`;
              const body = `الحارس الذكي: رصد ثغرة/تهديد خطير من IP ${logData.ip} يستهدف حساب @${logData.userId}. الإجراء: ${getActionNameAr(logData.actionTaken)}`;
              
              // Trigger browser notification
              triggerBrowserNotification(title, body);
              
              // Local alerts
              showToast(`🔔 تنبيه فوري: رصد تهديد خطير جداً لحساب @${logData.userId}`);
            }
          }
        }
      });
      initialized = true;
    }, (error) => {
      console.warn("Real-time sentry_threat listener permission check or connection error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
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
      setSessions(getDeviceSessions());
    };
    window.addEventListener("snns_sentry_threat_added", handleNewThreatLog);
    return () => {
      window.removeEventListener("snns_sentry_threat_added", handleNewThreatLog);
    };
  }, []);

  const handleRemoteLogout = (sessionId: string, deviceName: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في إجهاض أو إنهاء جلسة الدخول للجهاز "${deviceName}" وسحب الترخيص عنه بقوة؟`)) {
      const remainingUpdated = terminateDeviceSession(sessionId);
      setSessions(remainingUpdated);
      showToast(`✓ تم تسجيل الخروج عن بُعد للجهاز "${deviceName}" بنجاح.`);
    }
  };

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

          <div className="flex gap-2 items-center flex-wrap">
            {/* Export Security Report (PDF) */}
            <button
              onClick={() => setShowPdfReport(true)}
              className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-saudi-green hover:from-emerald-500 hover:to-saudi-green/90 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-saudi-green/15"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>تصدير تقرير أمني (PDF)</span>
            </button>

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

      {/* 🛡️ Sentry WNS / FCM Real-Time Push Gateway */}
      <div className="p-5 bg-gradient-to-r from-neutral-950 via-[#0c0c0c] to-neutral-950 border border-white/5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-3 opacity-[0.02]">
          <Shield className="w-40 h-40 text-saudi-green" />
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${fcmConnected ? "bg-saudi-green" : "bg-amber-400"}`} />
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 font-tajawal">
                بوابة التوجيه وبث الإشعارات الفورية (Sentry Real-Time FCM Push Hub)
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 max-w-2xl leading-relaxed">
              تستخدم هذه الحاوية نظام <strong className="text-saudi-glow">Firebase Cloud Messaging (FCM)</strong> المتكامل لنقل وبث إشارات المخاطر قيد التنفيذ. عند تسجيل تهديد سيبراني بقيمة خطورة (خطير جداً)، يتم بث تنبيه فوري عبر متصفح المشرف حتى لو كانت الصفحة في الخلفية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto self-end lg:self-center">
            {/* Permission Toggler Button */}
            {notifPermission !== "granted" ? (
              <button
                onClick={handleRequestPermission}
                className="py-2 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>تفعيل إشعار المتصفح</span>
              </button>
            ) : (
              <div className="py-2 px-4 bg-emerald-500/10 border border-emerald-500/30 text-saudi-glow text-xs font-bold rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-saudi-glow" />
                <span>مرخص بالمتصفح ✓</span>
              </div>
            )}

            {/* Test Broadcast Probe Button */}
            <button
              onClick={handleTestPushNotification}
              className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="دفع إشعار تجريبي فوري وفحصه"
            >
              <RefreshCw className="w-3.5 h-3.5 text-saudi-glow" />
              <span>فحص بث FCM التجريبي</span>
            </button>
          </div>
        </div>

        {/* Technical pipeline diagnostic rail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5 text-[10.5px]">
          {/* Diagnostic 1 */}
          <div className="p-2.5 bg-[#050505] border border-white/3 rounded-xl flex justify-between items-center">
            <span className="text-gray-550 font-bold">بوابة FCM والاشتراك:</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
              fcmConnected 
                ? (isFcmSimulated ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-saudi-green/10 text-saudi-glow border border-saudi-green/25") 
                : "bg-red-500/10 text-red-400 border border-red-500/25"
            }`}>
              {fcmConnected ? (isFcmSimulated ? "قناة محاكاة معتمدة" : "سيرفر السحابة نشط (Live)") : "خطأ أو غير متصل"}
            </span>
          </div>

          {/* Diagnostic 2 */}
          <div className="p-2.5 bg-[#050505] border border-white/3 rounded-xl flex justify-between items-center">
            <span className="text-gray-550 font-bold">حالة إذن المتصفح:</span>
            <span className="font-mono text-gray-350 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {notifPermission === "granted" ? "GRANTED" : notifPermission === "denied" ? "DENIED" : "PROMPT"}
            </span>
          </div>

          {/* Diagnostic 3 */}
          <div className="p-2.5 bg-[#050505] border border-white/3 rounded-xl flex items-center justify-between gap-2 overflow-hidden">
            <span className="text-gray-550 font-bold shrink-0">مفتاح FCM Token:</span>
            <span 
              className="text-gray-400 font-mono text-[9px] truncate selection:bg-saudi-green/30 cursor-help"
              title={fcmToken || "غير متوفر"}
            >
              {fcmToken ? `${fcmToken.substring(0, 15)}...${fcmToken.substring(fcmToken.length - 8)}` : "جاري التوليد..."}
            </span>
          </div>
        </div>
      </div>

      {/* 📱 الأجهزة النشطة والتحكم عن بعد بمعدلات الدخول (Active Sessions) */}
      <div className="p-6 bg-[#080808]/50 border border-white/5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-white/5">
          <div className="text-right">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-saudi-glow" />
              أحدث الأجهزة والجلسات النشطة على المنصة (Active Device Sessions)
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              يعرض هذا الجدول جميع ملقنات الدخول الجارية والموثقة للمستخدمين، مع إمكانية إنهاء الجلسات فورياً وطرد الأجهزة الغريبة عن بُعد.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 rounded-lg text-[10px] font-bold shrink-0">
            إجمالي الأجهزة النشطة: {sessions.length}
          </span>
        </div>

        {/* Responsive Interactive Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-right border-collapse text-xs whitespace-nowrap md:whitespace-normal">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 text-[11px] font-bold text-right">
                <th className="pb-3 pt-1 px-3">الجهاز والمنصة</th>
                <th className="pb-3 pt-1 px-3">المتصفح والمحرك</th>
                <th className="pb-3 pt-1 px-3">عنوان الـ IP</th>
                <th className="pb-3 pt-1 px-3">المنطقة والشبكة</th>
                <th className="pb-3 pt-1 px-3 text-center">آخر ظهور / نشاط</th>
                <th className="pb-3 pt-1 px-3 text-center">حالة الحماية</th>
                <th className="pb-3 pt-1 px-4 text-left">إجراء فوري</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-bold">
                    🟢 لا توجد أي دورات هويات نشطة مسجلة في الوقت الحاضر.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Device & Platform */}
                    <td className="py-3.5 px-3 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-saudi-glow shrink-0">
                          {sess.deviceName.toLowerCase().includes("mac") || sess.deviceName.toLowerCase().includes("pc") || sess.deviceName.toLowerCase().includes("linux") ? (
                            <Laptop className="w-4 h-4" />
                          ) : (
                            <Smartphone className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span>{sess.deviceName}</span>
                          {sess.isCurrent && (
                            <span className="text-[9px] text-[#00a34f] bg-[#00a34f]/10 border border-[#00a34f]/25 rounded px-2 py-0.5 mt-0.5 w-fit font-black">
                              جهازك الحالي (Super Admin)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Browser Engine */}
                    <td className="py-3.5 px-3 text-gray-350 font-mono">
                      {sess.browser}
                    </td>

                    {/* Masked/Unmasked IP */}
                    <td className="py-3.5 px-3 text-gray-350 font-mono">
                      {viewUnmasked ? sess.ip : maskIpAddress(sess.ip)}
                    </td>

                    {/* Country & ISP Network */}
                    <td className="py-3.5 px-3 text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="text-base" role="img" aria-label={sess.country}>
                          {sess.flag}
                        </span>
                        <div className="flex flex-col">
                          <span>{sess.country}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {sess.countryCode === "SA" ? "STC Broadband" : "Foreign Proxy Tunnel"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Activity Timestamp */}
                    <td className="py-3.5 px-3 text-center text-gray-400 font-mono">
                      {sess.timestamp}
                    </td>

                    {/* Trust status */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        sess.isTrusted 
                          ? "bg-saudi-green/10 border-saudi-green/30 text-saudi-glow" 
                          : "bg-red-500/10 border-red-500/30 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sess.isTrusted ? "bg-saudi-green" : "bg-red-500 animate-pulse"}`} />
                        {sess.isTrusted ? "موثوق وآمن" : "جلسة مشبوهة / مغتربة"}
                      </span>
                    </td>

                    {/* Quick Remote logout action */}
                    <td className="py-3.5 px-4 text-left">
                      {sess.isCurrent ? (
                        <button
                          disabled
                          className="py-1 px-3 bg-white/5 text-gray-500 text-[10px] rounded-lg border border-white/5 cursor-not-allowed opacity-60 font-bold"
                          title="لا يمكنك إنهاء جلستك النشطة من هنا لمنع إغلاق لوحة التحكم"
                        >
                          جلستك نشطة
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoteLogout(sess.id, sess.deviceName)}
                          className="py-1 px-3 bg-red-400/10 hover:bg-red-500/20 text-red-400 hover:text-red-350 text-[10px] font-bold rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                        >
                          طرد وإنهاء الجلسة 🔒
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Dynamic PDF Preview and High-Fidelity A4 Printing Modal */}
      <AnimatePresence>
        {showPdfReport && (
          <div id="printable-pdf-report-root" className="fixed inset-0 z-[10000] overflow-y-auto bg-[#050505]/95 flex justify-center items-start p-4 sm:p-6 md:p-10 font-tajawal" dir="rtl">
            
            {/* Quick print configuration style overrides */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                /* Hide everything in the document body */
                body > * {
                  display: none !important;
                }
                /* Show ONLY this printable container */
                #printable-pdf-report-root {
                  display: block !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: ${pdfTheme === "light" ? "#ffffff" : "#050505"} !important;
                  color: ${pdfTheme === "light" ? "#111827" : "#ffffff"} !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                .no-print-element {
                  display: none !important;
                }
                .print-card {
                  box-shadow: none !important;
                  border: 1px solid ${pdfTheme === "light" ? "#e5e7eb" : "#262626"} !important;
                  background: ${pdfTheme === "light" ? "#ffffff" : "#050505"} !important;
                }
              }
            ` }} />

            <div className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_50px_rgba(0,163,79,0.15)] no-print-element">
              
              {/* Sidebar controls: no-print */}
              <div className="w-full md:w-80 bg-neutral-950 p-6 border-l border-white/5 flex flex-col justify-between gap-6 no-print-element shrink-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm text-saudi-glow flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>معالج التقارير الأمنية EXPORT</span>
                    </h3>
                    <button 
                      onClick={() => setShowPdfReport(false)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    مرحباً بكم في جناح التوزيع الأمني لـ SNNS Sentry-AI. يقوم المعالج بجمع كل التقارير السيبرانية الحالية وعقد تحليل وطني مشفر قابل للاستخراج والمشاركة والطباعة بصيغة PDF.
                  </p>

                  {/* Print Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-bold block">مظهر وموضوع التقرير المطبوع:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPdfTheme("light")}
                        className={`p-2 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer ${
                          pdfTheme === "light" 
                            ? "bg-white text-black border-white font-black" 
                            : "bg-neutral-900 text-gray-400 border-white/5 hover:text-white"
                        }`}
                      >
                        ☀️ حبري رسمي (Light)
                      </button>
                      <button
                        onClick={() => setPdfTheme("dark")}
                        className={`p-2 rounded-xl border text-[10.5px] font-bold text-center transition-all cursor-pointer ${
                          pdfTheme === "dark" 
                            ? "bg-saudi-green/10 text-saudi-glow border-saudi-green/40 font-black" 
                            : "bg-neutral-900 text-gray-400 border-white/5 hover:text-white"
                        }`}
                      >
                        🌙 نيون سيبراني (Dark)
                      </button>
                    </div>
                  </div>

                  {/* Filter Info summary */}
                  <div className="bg-[#050505] p-3.5 rounded-xl border border-white/5 text-[10.5px] space-y-1.5 text-gray-400">
                    <span className="text-gray-550 font-black block">إحصاءات التقرير المولد:</span>
                    <div>• السجلات المدرجة: <strong className="text-white font-mono">{filteredLogs.length} سجل</strong></div>
                    <div>• فلترة المخاطر: <strong className="text-saudi-glow">{selectedRiskFilter === "all" ? "الكل" : getRiskLabel(selectedRiskFilter as ThreatRiskLevel)}</strong></div>
                    {searchQuery && <div>• حصر تصفية البحث: <strong className="text-white">"{searchQuery}"</strong></div>}
                  </div>
                </div>

                {/* Print Trigger Button */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        window.print();
                      }, 100);
                    }}
                    className="w-full py-3 px-4 bg-saudi-green hover:bg-saudi-green/90 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-saudi-green/20"
                  >
                    <Printer className="w-4 h-4" />
                    <span>حفظ كـ PDF / طباعة التقرير</span>
                  </button>
                  <p className="text-[9px] text-gray-650 text-center uppercase tracking-widest font-mono">SNNS.PRO SECURITIES INC.</p>
                </div>
              </div>

              {/* PDF Sheet Preview frame */}
              <div className="flex-1 p-4 sm:p-8 max-h-[85vh] overflow-y-auto bg-neutral-950 inline-block align-middle pad-scrolling">
                
                {/* Visual A4 paper wrapper */}
                <div 
                  id="printable-pdf-report"
                  className={`w-full max-w-4xl mx-auto rounded-2xl p-6 sm:p-10 border transition-all text-right ${
                    pdfTheme === "light" 
                      ? "bg-white text-gray-950 border-gray-200 shadow-2xl" 
                      : "bg-[#050505] text-white border-white/10 shadow-[0_0_50px_rgba(0,163,79,0.05)]"
                  }`}
                >
                  
                  {/* DOCUMENT LETTERHEAD */}
                  <div className="flex justify-between items-start pb-6 border-b border-dashed mb-6 flex-wrap gap-4" style={{ borderColor: pdfTheme === "light" ? "#d1d5db" : "#262626" }}>
                    
                    {/* SNNS cyber crest & Title */}
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2">
                        {/* Custom vector elegant logo icon */}
                        <div className={`p-2 rounded-xl border ${pdfTheme === "light" ? "bg-emerald-550/10 border-emerald-500/20 text-emerald-600" : "bg-saudi-green/10 border-saudi-green/35 text-saudi-glow"}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <h1 className={`text-base font-black tracking-tight ${pdfTheme === "light" ? "text-gray-900" : "text-white"}`}>منصة سـنـس للتواصل الاجتماعي</h1>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">SNNS SOCIAL PLATFORM • SENTRY HUB</p>
                        </div>
                      </div>
                      <h2 className={`text-xs font-black mt-3 ${pdfTheme === "light" ? "text-emerald-700" : "text-saudi-glow"}`}>تقرير استخبارات وأمن المعلومات السيبراني المعتمد 🇸🇦</h2>
                    </div>

                    {/* Official stamp & metadata */}
                    <div className="text-[10px] space-y-1 text-right">
                      <div>تاريخ التحليل: <strong className="font-mono">{new Date().toLocaleDateString("ar-SA")}</strong></div>
                      <div>توقيت التصدير: <strong className="font-mono">{new Date().toLocaleTimeString("ar-SA")} (KSA)</strong></div>
                      <div>سند الترخيص: <span className="font-mono text-gray-400">#SNNS-SENTRY-AI-99X</span></div>
                      <div className="pt-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${
                          pdfTheme === "light" ? "bg-emerald-50 border-emerald-300 text-emerald-600" : "bg-emerald-950/30 border-saudi-green/20 text-saudi-glow"
                        }`}>SECURE EXPORTED</span>
                      </div>
                    </div>

                  </div>

                  {/* EXECUTIVE SUMMARY PANELS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-[11px] text-right">
                    <div className={`p-3 rounded-xl border text-right ${pdfTheme === "light" ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0c0c0c] border-[#1c1c1c]"}`}>
                      <span className="text-gray-550 block text-[9px] font-bold">المشرف المسؤول</span>
                      <strong className={`block mt-0.5 ${pdfTheme === "light" ? "text-gray-950" : "text-white"}`}>سليمان العتيبي</strong>
                      <span className="text-gray-450 block text-[8px]">رئيس مكتب الامتثال (SA)</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${pdfTheme === "light" ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0c0c0c] border-[#1c1c1c]"}`}>
                      <span className="text-gray-550 block text-[9px] font-bold">سلامة النظام الإجمالية</span>
                      <strong className="block mt-0.5 text-emerald-600 font-mono text-sm font-black">%98.0</strong>
                      <span className="text-gray-450 block text-[8px]">مستوى الحصانة القصوى</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${pdfTheme === "light" ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0c0c0c] border-[#1c1c1c]"}`}>
                      <span className="text-gray-550 block text-[9px] font-bold">عدد التهديدات بالتقرير</span>
                      <strong className="block mt-0.5 text-amber-500 font-mono text-sm font-black">{filteredLogs.length}</strong>
                      <span className="text-gray-450 block text-[8px]">سجلات رصد مفصلة</span>
                    </div>

                    <div className={`p-3 rounded-xl border ${pdfTheme === "light" ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-[#0c0c0c] border-[#1c1c1c]"}`}>
                      <span className="text-gray-550 block text-[9px] font-bold">عناوين الـ IP المحجوبة</span>
                      <strong className="block mt-0.5 text-red-500 font-mono text-sm font-black">{blockedIps.length}</strong>
                      <span className="text-gray-450 block text-[8px]">جدار حماية الجلسات</span>
                    </div>
                  </div>

                  {/* LOGS TABLE (HIGH FIDELITY REPORT TABLE) */}
                  <div className="mb-8 select-text">
                    <h3 className={`font-black text-[11.5px] mb-3 pb-1.5 border-b text-right ${pdfTheme === "light" ? "text-gray-800 border-gray-200" : "text-white border-[#1c1c1c]"}`}>
                      تفاصيل الرصد الأمني واستخبارات العقد السيبرانية:
                    </h3>

                    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>
                      <table className="w-full text-right text-[10.5px] border-collapse">
                        <thead>
                          <tr className={`${pdfTheme === "light" ? "bg-gray-50 text-gray-850" : "bg-neutral-950 text-gray-400"} font-black`}>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>تاريخ/توقيت العمل</th>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>المستهدف</th>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>عنصر التهديد</th>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>العنوان والجهاز</th>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>إجراء الـ AI الأمني</th>
                            <th className="p-2.5 border-b text-right" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>مستوى الخطر</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-gray-500">لا توجد سجلات تهديد مدرجة بالتقرير حالياً</td>
                            </tr>
                          ) : (
                            filteredLogs.map((log) => (
                              <tr 
                                key={log.id} 
                                className="border-b hover:bg-white/1" 
                                style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#1a1a1a" }}
                              >
                                <td className="p-2.5 font-mono select-all text-right shrink-0" style={{ whiteSpace: "nowrap" }}>{log.timestamp}</td>
                                <td className="p-2.5 font-bold text-right text-saudi-glow">@{log.userId}</td>
                                <td className="p-2.5 font-medium text-right">{getEventNameAr(log.eventType)}</td>
                                <td className="p-2.5 text-right select-all">
                                  <div className="font-mono text-gray-450">{viewUnmasked ? log.ip : maskIpAddress(log.ip)}</div>
                                  <div className="text-[8.5px] text-gray-500 font-mono truncate max-w-[120px]" title={log.device}>{log.device}</div>
                                </td>
                                <td className="p-2.5 font-black text-amber-500 text-right">{getActionNameAr(log.actionTaken)}</td>
                                <td className="p-2.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black ${
                                    log.riskScore === "extreme" ? "bg-red-500/15 text-red-500 border border-red-500/20" :
                                    log.riskScore === "high" ? "bg-orange-500/15 text-orange-500 border border-orange-500/20" :
                                    "bg-yellow-500/15 text-yellow-500 border border-yellow-500/20"
                                  }`}>
                                    {getRiskLabel(log.riskScore)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* DOCUMENT WATERMARK FOOTER / LEGAL STAMP */}
                  <div className="mt-12 flex justify-between items-end pt-6 border-t flex-wrap gap-6" style={{ borderColor: pdfTheme === "light" ? "#e5e7eb" : "#262626" }}>
                    
                    {/* Legal security notification */}
                    <div className="max-w-md text-right">
                      <h4 className={`text-[10px] font-black ${pdfTheme === "light" ? "text-gray-900" : "text-white"}`}>بند الاستخدام والسرية الإدارية:</h4>
                      <p className="text-[9px] text-gray-500 leading-relaxed mt-1">
                        يعتبر هذا التقرير الأمني مستخرجاً رسمياً سرياً للغاية وملكاً خاصاً بإدارة تفعيل منصة SNNS.PRO. يُحظر مشاركة أو تسريب محتويات هذا المستند لأطراف خارجية غير مخولة، ويقع فاعلها تحت طائلة المسؤولية المدنية والسيبرانية المشددة بالمملكة العربية السعودية 🇸🇦.
                      </p>
                    </div>

                    {/* Official authorized signature block */}
                    <div className="text-center min-w-[140px]">
                      <span className="text-[9px] text-gray-500 block">اعتماد المدير التنفيذي</span>
                      
                      {/* Signature graphic SVG mockup */}
                      <div className="h-10 my-1.5 flex items-center justify-center text-emerald-600">
                        <svg className="w-28 h-8 opacity-75" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 15C15 5 25 30 35 15C45 5 50 25 65 15C80 5 90 20 95 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                          <path d="M10 20C30 20 50 10 90 25" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"/>
                        </svg>
                      </div>

                      <strong className={`text-[10px] block ${pdfTheme === "light" ? "text-gray-950" : "text-white"}`}>سليمان العتيبي</strong>
                      <span className="text-[8px] text-gray-550 block font-mono">Sentry Chief Seal</span>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
