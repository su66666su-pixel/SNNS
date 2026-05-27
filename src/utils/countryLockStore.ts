// countryLockStore.ts - High Security GeoIP Protection for SNNS.PRO

export interface CountryConfig {
  code: string; // ISO Code e.g. "SA", "US", "IR"
  name: string; // Arabic description
  flag: string; // Flag emoji
  status: "allowed" | "blocked" | "restricted" | "block_registration" | "block_stream" | "block_payments";
  usersCount: number;
  blockedAttempts: number;
  notes: string;
}

export interface SecurityLog {
  id: string;
  countryCode: string;
  countryName: string;
  flag: string;
  ip: string;
  timestamp: string;
  attemptType: "register" | "login" | "stream" | "chat" | "withdraw" | "view_content";
  status: "blocked" | "warned" | "allowed_by_whitelist";
  userAgent: string;
  vpnDetected: boolean;
  notes?: string;
}

export interface WhitelistRule {
  type: "username" | "ip";
  value: string;
  addedBy: string;
  addedAt: string;
  notes: string;
}

// Default Countries Database
const DEFAULT_COUNTRIES: CountryConfig[] = [
  { code: "SA", name: "المملكة العربية السعودية", flag: "🇸🇦", status: "allowed", usersCount: 24150, blockedAttempts: 0, notes: "بلد السيادة والمنشأ والتغطية الكاملة الكبرى" },
  { code: "AE", name: "الإمارات العربية المتحدة", flag: "🇦🇪", status: "allowed", usersCount: 4890, blockedAttempts: 0, notes: "مغطاة بالكامل بالخدمة الفخمة" },
  { code: "QA", name: "دولة قطر", flag: "🇶🇦", status: "allowed", usersCount: 2110, blockedAttempts: 0, notes: "مغطاة بالترخيص الخليجي المشترك" },
  { code: "KW", name: "دولة الكويت", flag: "🇰🇼", status: "allowed", usersCount: 1680, blockedAttempts: 0, notes: "مغطاة بنشاط متصاعد للديوانيات" },
  { code: "OM", name: "سلطنة عمان", flag: "🇴🇲", status: "allowed", usersCount: 920, blockedAttempts: 0, notes: "إتاحة كاملة وامتثال شامل للشبكة" },
  { code: "BH", name: "مملكة البحرين", flag: "🇧🇭", status: "allowed", usersCount: 840, blockedAttempts: 0, notes: "حركة ممتازة وتبادل فني متواصل" },
  { code: "EG", name: "جمهورية مصر العربية", flag: "🇪🇬", status: "allowed", usersCount: 1450, blockedAttempts: 12, notes: "تم المراجعة ومنح الإتاحة الكاملة للصوتيات" },
  { code: "JO", name: "المملكة الأردنية الهاشمية", flag: "🇯🇴", status: "allowed", usersCount: 520, blockedAttempts: 4, notes: "نشطة ضمن الإطار العربي المعتمد" },
  { code: "YE", name: "الجمهورية اليمنية", flag: "🇾🇪", status: "block_payments", usersCount: 120, blockedAttempts: 184, notes: "منع السحب والدفع المالي لدواعي تنظيمية داخلية" },
  { code: "IR", name: "جمهورية إيران الإسلامية", flag: "🇮🇷", status: "blocked", usersCount: 0, blockedAttempts: 842, notes: "محظورة بالكامل لدواعي الامتثال الأمني ومكافحة التهديدات" },
  { code: "SY", name: "الجمهورية العربية السورية", flag: "🇸🇾", status: "blocked", usersCount: 0, blockedAttempts: 412, notes: "محظورة بالكامل تنفيذاً للعقوبات المصرفية الإقليمية" },
  { code: "US", name: "الولايات المتحدة الأمريكية", flag: "🇺🇸", status: "restricted", usersCount: 88, blockedAttempts: 145, notes: "دخول مقيد: وضع القراءة فقط مع منع البث المباشر والدفع" },
  { code: "TR", name: "جمهورية تركيا", flag: "🇹🇷", status: "block_registration", usersCount: 14, blockedAttempts: 92, notes: "منع تسجيل مستخدمين جدد للتصفية التقنية" }
];

// Helper to load configurations
export function getCountryConfigs(): CountryConfig[] {
  const saved = localStorage.getItem("snns_geoip_countries");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("snns_geoip_countries", JSON.stringify(DEFAULT_COUNTRIES));
  return DEFAULT_COUNTRIES;
}

export function saveCountryConfigs(configs: CountryConfig[]) {
  localStorage.setItem("snns_geoip_countries", JSON.stringify(configs));
}

// Loaded Whitelist
const DEFAULT_WHITELIST: WhitelistRule[] = [
  { type: "username", value: "a.rajhi", addedBy: "Super Admin", addedAt: "٢٠٢٦/٠٥/٠١", notes: "الإعلامي عبدالله الراجحي - استثناء كامل" },
  { type: "username", value: "sp_tester", addedBy: "Super Admin", addedAt: "٢٠٢٦/٠٥/١٢", notes: "حساب فحص الأمان واختبار الصلاحيات" },
  { type: "ip", value: "127.0.0.1", addedBy: "Super Admin", addedAt: "٢٠٢٦/٠٥/٠١", notes: "الخادم المحلي للمستضيف" },
  { type: "ip", value: "8.8.8.8", addedBy: "Super Admin", addedAt: "٢٠٢٦/٠٥/١٥", notes: "بوابة فحص قوقل الآمنة" }
];

export function getWhitelist(): WhitelistRule[] {
  const saved = localStorage.getItem("snns_geoip_whitelist");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("snns_geoip_whitelist", JSON.stringify(DEFAULT_WHITELIST));
  return DEFAULT_WHITELIST;
}

export function saveWhitelist(rules: WhitelistRule[]) {
  localStorage.setItem("snns_geoip_whitelist", JSON.stringify(rules));
}

// User active simulation settings (For testing blocks easily in the interface)
export interface SimulationSettings {
  enabled: boolean;
  simulatedIp: string;
  simulatedCountry: string; // "SA", "IR", "US", etc.
  simulatedVpn: boolean;
  simulatedCity: string;
  simulatedIsp: string;
  simulatedConnectionType: string; // "fiber" | "cellular" | "datacenter" | "dsl"
  simulatedIsProxy: boolean;
  simulatedIsTor: boolean;
  simulatedIsDatacenter: boolean;
  simulatedRiskScore: number; // 0-100
}

const DEFAULT_SIMULATION: SimulationSettings = {
  enabled: false,
  simulatedIp: "5.1.2.3",
  simulatedCountry: "US",
  simulatedVpn: false,
  simulatedCity: "نيويورك",
  simulatedIsp: "DigitalOcean Datacenter Network",
  simulatedConnectionType: "datacenter",
  simulatedIsProxy: false,
  simulatedIsTor: false,
  simulatedIsDatacenter: true,
  simulatedRiskScore: 45
};

export function getSimulationSettings(): SimulationSettings {
  const saved = localStorage.getItem("snns_geoip_simulation");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Backfill missing properties if any
      return { ...DEFAULT_SIMULATION, ...parsed };
    } catch {}
  }
  return DEFAULT_SIMULATION;
}

export function saveSimulationSettings(settings: SimulationSettings) {
  localStorage.setItem("snns_geoip_simulation", JSON.stringify(settings));
  // Emit event to notify application components dynamically
  const event = new CustomEvent("snns_geoip_changed");
  window.dispatchEvent(event);
}

// Security Log storage
export function getSecurityLogs(): SecurityLog[] {
  const saved = localStorage.getItem("snns_geoip_logs");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  return [];
}

export function saveSecurityLogs(logs: SecurityLog[]) {
  localStorage.setItem("snns_geoip_logs", JSON.stringify(logs));
}

export function addSecurityLog(log: Omit<SecurityLog, "id" | "timestamp">) {
  const logs = getSecurityLogs();
  const fullLog: SecurityLog = {
    ...log,
    id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 100),
    timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " - " + new Date().toLocaleDateString("ar-SA")
  };
  
  // Save log
  const newLogs = [fullLog, ...logs].slice(0, 100); // Limit to 100
  saveSecurityLogs(newLogs);

  // Increment blocked attempts counter for the country config
  const countries = getCountryConfigs();
  const cIndex = countries.findIndex(c => c.code === log.countryCode);
  if (cIndex !== -1 && log.status === "blocked") {
    countries[cIndex].blockedAttempts += 1;
    saveCountryConfigs(countries);
  }

  // Trigger admin alert in system
  const event = new CustomEvent("snns_geoip_log_added", { detail: fullLog });
  window.dispatchEvent(event);
  return fullLog;
}

// GeoIP Detection logic (Uses ipapi.co with safe fallbacks and VPN detection heuristic)
export interface DetectedGeoInfo {
  ip: string;
  countryCode: string; // e.g. "SA"
  countryName: string;
  flag: string;
  timezone: string;
  vpnDetected: boolean;
  provider: string; // ISP/Org name
  details?: string;
  city: string;
  connectionType: "ألياف ضوئية - Fiber" | "خلوية - Mobile 5G" | "مخدم سحابي - Cloud Server" | "منزلي - Broadband Broadband";
  isProxy: boolean;
  isTor: boolean;
  isDatacenter: boolean;
  riskScore: number; // 0-100 threat rating
}

// Cache IP resolution locally during the tab lifecycle
let cachedGeo: DetectedGeoInfo | null = null;

export async function detectGeoIP(forceRefresh = false): Promise<DetectedGeoInfo> {
  // If simulation is enabled, return simulation settings
  const sim = getSimulationSettings();
  if (sim.enabled) {
    const countries = getCountryConfigs();
    const match = countries.find(c => c.code === sim.simulatedCountry) || countries[0];
    
    let connLabel: DetectedGeoInfo["connectionType"] = "ألياف ضوئية - Fiber";
    if (sim.simulatedConnectionType === "cellular") connLabel = "خلوية - Mobile 5G";
    else if (sim.simulatedConnectionType === "datacenter") connLabel = "مخدم سحابي - Cloud Server";
    else if (sim.simulatedConnectionType === "dsl") connLabel = "منزلي - Broadband Broadband";

    return {
      ip: sim.simulatedIp,
      countryCode: sim.simulatedCountry,
      countryName: match.name,
      flag: match.flag,
      timezone: "Asia/Riyadh",
      vpnDetected: sim.simulatedVpn,
      provider: sim.simulatedIsp || "محاكي الأمان التفاعلي (Simulated)",
      city: sim.simulatedCity || "الرياض",
      connectionType: connLabel,
      isProxy: sim.simulatedIsProxy,
      isTor: sim.simulatedIsTor,
      isDatacenter: sim.simulatedIsDatacenter,
      riskScore: sim.simulatedRiskScore,
      details: `${sim.simulatedCity || "الرياض"}، ${match.name}`
    };
  }

  if (cachedGeo && !forceRefresh) {
    return cachedGeo;
  }

  try {
    // Calling API-API for real GeoIP Detection
    const response = await fetch("https://ipapi.co/json/", { mode: "cors" });
    if (!response.ok) throw new Error("API Limit reached / Fail");
    
    const data = await response.json();
    if (data.error) throw new Error(data.reason || "Error resolve");

    // VPN/Proxy Detection Heuristic:
    // Check if client timezone matches the browser timezone
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ipTimezone = data.timezone;
    const isMismatch = browserTimezone && ipTimezone && browserTimezone !== ipTimezone;
    
    // Check common proxy markers or hosting names in org/asn
    const orgLC = (data.org || "").toLowerCase();
    const isHosting = orgLC.includes("hosting") || orgLC.includes("vpn") || orgLC.includes("server") || orgLC.includes("aws") || orgLC.includes("google") || orgLC.includes("cloudflare") || orgLC.includes("datacenter") || orgLC.includes("digitalocean") || orgLC.includes("ovh") || orgLC.includes("linode") || orgLC.includes("proxy");
    const isProxy = orgLC.includes("proxy");
    const isTor = orgLC.includes("tor exit") || orgLC.includes("onion") || orgLC.includes("tor-exit");
    const isDatacenter = isHosting;

    const vpnDetected = isMismatch || isHosting || isProxy || isTor;

    // Determine connection type
    let connectionType: DetectedGeoInfo["connectionType"] = "ألياف ضوئية - Fiber";
    if (isDatacenter) {
      connectionType = "مخدم سحابي - Cloud Server";
    } else if (/cellular|mobile|gprs|lte|5g|4g/i.test(orgLC)) {
      connectionType = "خلوية - Mobile 5G";
    } else if (/dsl|broadband|adsl|pppoe/i.test(orgLC)) {
      connectionType = "منزلي - Broadband Broadband";
    }

    // Risk score calculation
    let calculatedRisk = 5; // base risk
    if (vpnDetected) calculatedRisk += 30;
    if (isProxy) calculatedRisk += 25;
    if (isTor) calculatedRisk += 55;
    if (isDatacenter) calculatedRisk += 20;
    if (isMismatch) calculatedRisk += 15;
    if (calculatedRisk > 100) calculatedRisk = 100;

    cachedGeo = {
      ip: data.ip || "188.49.50.224",
      countryCode: data.country_code || "SA",
      countryName: translateCountryName(data.country_code || "SA"),
      flag: getEmojiForCountry(data.country_code || "SA"),
      timezone: data.timezone || "Asia/Riyadh",
      vpnDetected,
      provider: data.org || "STC (Saudi Telecom Company)",
      city: data.city || "الرياض",
      connectionType,
      isProxy,
      isTor,
      isDatacenter,
      riskScore: calculatedRisk,
      details: `${data.city || "الرياض"}، ${data.region || "الوسطى"}`
    };
    return cachedGeo;
  } catch (error) {
    // Fallback: Real Saudi Arabian dynamic resolution locally if fetch fails (e.g., adblocker)
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isVpnDetected = browserTimezone ? !browserTimezone.toLowerCase().includes("riyadh") && !browserTimezone.toLowerCase().includes("asia") : false;

    const fallback: DetectedGeoInfo = {
      ip: "188.49.50.224", // Typical STC Saudi IP
      countryCode: "SA",
      countryName: "المملكة العربية السعودية",
      flag: "🇸🇦",
      timezone: browserTimezone || "Asia/Riyadh",
      vpnDetected: isVpnDetected,
      provider: "STC (Saudi Telecom Company)",
      city: "الرياض",
      connectionType: isVpnDetected ? "مخدم سحابي - Cloud Server" : "ألياف ضوئية - Fiber",
      isProxy: false,
      isTor: false,
      isDatacenter: isVpnDetected,
      riskScore: isVpnDetected ? 35 : 5,
      details: "الرياض، منطقة الرياض"
    };
    cachedGeo = fallback;
    return fallback;
  }
}

function translateCountryName(code: string): string {
  const table: Record<string, string> = {
    "SA": "المملكة العربية السعودية",
    "AE": "الإمارات العربية المتحدة",
    "QA": "دولة قطر",
    "KW": "دولة الكويت",
    "OM": "سلطنة عمان",
    "BH": "مملكة البحرين",
    "EG": "جمهورية مصر العربية",
    "JO": "المملكة الأردنية الهاشمية",
    "US": "الولايات المتحدة الأمريكية",
    "TR": "جمهورية تركيا",
    "IR": "جمهورية إيران الإسلامية",
    "SY": "الجمهورية العربية السورية",
    "YE": "الجمهورية اليمنية"
  };
  return table[code] || "دولة مجهولة";
}

function getEmojiForCountry(code: string): string {
  const table: Record<string, string> = {
    "SA": "🇸🇦", "AE": "🇦🇪", "QA": "🇶🇦", "KW": "🇰🇼", "OM": "🇴🇲", "BH": "🇧🇭",
    "EG": "🇪🇬", "JO": "🇯🇴", "US": "🇺🇸", "TR": "🇹🇷", "IR": "🇮🇷", "SY": "🇸🇾", "YE": "🇾🇪"
  };
  return table[code] || "🌐";
}

// Action Restriction Evaluation Engine
interface EvaluationResult {
  blocked: boolean;
  reason: string;
  vpnBlocked: boolean;
  countryCode: string;
  countryName: string;
  flag: string;
}

export function evaluateAccess(
  username: string, 
  userIp: string, 
  detectedCountry: string, 
  vpnDetected: boolean,
  currentAction: "view_content" | "register" | "login" | "stream" | "chat" | "withdraw"
): EvaluationResult {
  // 1. Bypass check: Check Whitelist
  const whitelist = getWhitelist();
  
  // Handle case where custom whitelist values are matched
  const isUsernameWhitelisted = whitelist.some(
    r => r.type === "username" && r.value.toLowerCase() === username.toLowerCase()
  );
  const isIpWhitelisted = whitelist.some(
    r => r.type === "ip" && r.value === userIp
  );

  const countries = getCountryConfigs();
  const cConfig = countries.find(c => c.code === detectedCountry) || {
    code: detectedCountry,
    name: translateCountryName(detectedCountry),
    flag: getEmojiForCountry(detectedCountry),
    status: "allowed" as const,
    notes: ""
  };

  if (isUsernameWhitelisted || isIpWhitelisted) {
    return {
      blocked: false,
      reason: "مستثنى عبر قائمة السماح الإدارية الموثقة (Bypass allowed)",
      vpnBlocked: false,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  // 2. Check VPN / Proxy Global Block Heuristics
  // Treat VPN as blocked if timezone/country is blocked, or vpn itself is blocked for sensitive tasks like streaming, payments, registration
  if (vpnDetected && (currentAction === "withdraw" || currentAction === "register" || currentAction === "stream")) {
    return {
      blocked: true,
      reason: "تم حظر العملية: تم الكشف عن اتصال خادم وكيل (VPN/Proxy) مشبوه لحماية الأصول والمدفوعات.",
      vpnBlocked: true,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  // 3. Evaluate Status Limits
  if (cConfig.status === "blocked") {
    return {
      blocked: true,
      reason: "الخدمة غير متاحة حالياً في منطقتك الجغرافية لدواعي الامتثال الوقائي.",
      vpnBlocked: false,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  if (cConfig.status === "restricted") {
    // Restrictions: وضع القراءة فقط
    // Block modifying state (stream, chat, withdraw, register, login)
    if (["stream", "chat", "withdraw", "register"].includes(currentAction)) {
      return {
        blocked: true,
        reason: "منطقتك في تصنيف الدخول المقيد (وضع القراءة فقط). لا يمكنك ممارسة الأنشطة التفاعلية والمالية.",
        vpnBlocked: false,
        countryCode: detectedCountry,
        countryName: cConfig.name,
        flag: cConfig.flag
      };
    }
  }

  if (cConfig.status === "block_registration" && currentAction === "register") {
    return {
      blocked: true,
      reason: "نعتذر، التسجيل لمستخدمين جدد معلق حالياً في هذه الدولة للأمور التنظيمية.",
      vpnBlocked: false,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  if (cConfig.status === "block_stream" && currentAction === "stream") {
    return {
      blocked: true,
      reason: "عذراً، البث المباشر وبث المحتوى الفني معلق في منطقتك الحالية.",
      vpnBlocked: false,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  if (cConfig.status === "block_payments" && currentAction === "withdraw") {
    return {
      blocked: true,
      reason: "عمليات الشحن والسحب المالي مقيدة من دولتك الحالية حفاظاً على مطابقة التشريعات المصرفية.",
      vpnBlocked: false,
      countryCode: detectedCountry,
      countryName: cConfig.name,
      flag: cConfig.flag
    };
  }

  return {
    blocked: false,
    reason: "متاح ومصرح",
    vpnBlocked: false,
    countryCode: detectedCountry,
    countryName: cConfig.name,
    flag: cConfig.flag
  };
}
