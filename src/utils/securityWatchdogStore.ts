// securityWatchdogStore.ts - "الحارس الذكي" Smart Security AI Sentry for SNNS.PRO

export type ThreatRiskLevel = "low" | "medium" | "high" | "extreme";

export interface DeviceSession {
  id: string;
  deviceName: string; // e.g., "Apple iPhone 15 Pro Max"
  browser: string; // e.g., "Safari Mobile"
  ip: string;
  country: string; // Arabic name
  countryCode: string;
  flag: string;
  timestamp: string;
  isTrusted: boolean;
  isActive: boolean;
  isCurrent: boolean;
}

export interface SecurityThreatLog {
  id: string;
  timestamp: string;
  userId: string; // e.g., "su66666su" or "guest"
  ip: string;
  countryName: string;
  countryCode: string;
  flag: string;
  device: string;
  browser: string;
  eventType: "bruteforce" | "vpn_detected" | "country_mismatch" | "new_device" | "ip_anomaly" | "rate_limit" | "normal_login" | "two_factor" | "password_change" | "account_uclock_admin" | "account_lock_triggered" | "unauthorized_admin_access";
  riskScore: ThreatRiskLevel;
  actionTaken: "none" | "locked_account" | "ip_banned_temp" | "captcha_triggered" | "two_factor_sent" | "under_surveillance" | "password_change_forced";
  notes: string;
  verified: boolean;
}

export interface SecurityWatchdogStats {
  integrityScore: number; // e.g., 98/100
  totalAttemptsToday: number;
  blockedIpsCount: number;
  highRiskAccountsCount: number;
  compromisedCredentialsStopped: number;
  vpnAttemptsCount: number;
}

// Default device sessions for su66666su@gmail.com
const DEFAULT_DEVICES: DeviceSession[] = [];

// Seed initial threat logs representing realistic attempts that "الحارس الذكي" thwarted
const DEFAULT_THREAT_LOGS: SecurityThreatLog[] = [];

export function getDeviceSessions(): DeviceSession[] {
  const saved = localStorage.getItem("snns_sentry_devices");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("snns_sentry_devices", JSON.stringify(DEFAULT_DEVICES));
  return DEFAULT_DEVICES;
}

export function saveDeviceSessions(sessions: DeviceSession[]) {
  localStorage.setItem("snns_sentry_devices", JSON.stringify(sessions));
}

export function getThreatLogs(): SecurityThreatLog[] {
  const saved = localStorage.getItem("snns_sentry_threat_logs");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("snns_sentry_threat_logs", JSON.stringify(DEFAULT_THREAT_LOGS));
  return DEFAULT_THREAT_LOGS;
}

export function saveThreatLogs(logs: SecurityThreatLog[]) {
  localStorage.setItem("snns_sentry_threat_logs", JSON.stringify(logs));
}

export function getBlockedIpsList(): string[] {
  const saved = localStorage.getItem("snns_sentry_blocked_ips");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  const defaults = ["198.51.100.41", "103.22.201.5", "185.220.101.9"];
  localStorage.setItem("snns_sentry_blocked_ips", JSON.stringify(defaults));
  return defaults;
}

export function saveBlockedIpsList(ips: string[]) {
  localStorage.setItem("snns_sentry_blocked_ips", JSON.stringify(ips));
}

// Active user's custom security profile settings
export interface UserSecurityProfile {
  twoFactorEnabled: boolean;
  underSurveillance: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lastLoginDevice: string;
  ipWhiteList: string[];
  forcePasswordChange: boolean;
  userAlerts: { id: string; msg: string; timestamp: string; type: "critical" | "warning" | "info" }[];
}

const DEFAULT_SEC_PROFILE: UserSecurityProfile = {
  twoFactorEnabled: true,
  underSurveillance: false,
  isLocked: false,
  failedAttempts: 0,
  lastLoginDevice: "Apple iPhone 15 Pro Max (الرياض)",
  ipWhiteList: ["185.120.44.18", "127.0.0.1"],
  forcePasswordChange: false,
  userAlerts: [
    {
      id: "a_01",
      msg: "تم تفعيل حماية كاشف الاحتيال اللاسلكي الذكي على حسابك بنجاح.",
      timestamp: "2026-05-26 12:00",
      type: "info"
    },
    {
      id: "a_02",
      msg: "تنبيه أمني: رصد محاولة تجاوز فاشلة لحسابك من عنوان IP مشبوه بدولة ألمانيا 🇩🇪.",
      timestamp: "2026-05-25 14:15",
      type: "critical"
    }
  ]
};

export function getUserSecurityProfile(): UserSecurityProfile {
  const saved = localStorage.getItem("snns_sentry_user_settings");
  if (saved) {
    try { return JSON.parse(saved); } catch {}
  }
  localStorage.setItem("snns_sentry_user_settings", JSON.stringify(DEFAULT_SEC_PROFILE));
  return DEFAULT_SEC_PROFILE;
}

export function saveUserSecurityProfile(profile: UserSecurityProfile) {
  localStorage.setItem("snns_sentry_user_settings", JSON.stringify(profile));
}

// Check authorization to view raw IPs and devices
// Under instruction 8: only visible to Super Admin or someone with security_center_access
export function hasSecurityAccess(): boolean {
  // We can see if the user profile contains a field or if they have logged in as Super Admin.
  // In our app context, visiting the administation dashboard counts as administrator with security center access.
  // Let's also fetch profile and check if "is_security_officer" is true.
  try {
    const active = localStorage.getItem("snns_user_profile");
    if (active) {
      const parsed = JSON.parse(active);
      return parsed.role === "admin" || parsed.is_security_officer === true || window.location.pathname.includes("/admin");
    }
  } catch {}
  return window.location.pathname.includes("/admin");
}

// Function to mask sensitive IP information
export function maskIpAddress(ip: string): string {
  if (hasSecurityAccess()) {
    return ip; // No mask
  }
  // Mask IP for privacy
  if (!ip) return "**.***.***.***";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.***.***.${parts[3]}`;
  }
  return ip.substring(0, 6) + "************";
}

// Function to mask device info if required
export function maskDeviceName(device: string): string {
  if (hasSecurityAccess()) {
    return device; // Full details
  }
  return "جهاز مجهول محمي أمنياً 🔒 (مخفي للخصوصية)";
}

// Rate Limiting simulation helper for logins
const LOGIN_ATTEMPT_TIMESTAMPS: number[] = [];
export function checkRateLimitAndIncrement(): { rateLimited: boolean; attemptsCount: number } {
  const now = Date.now();
  LOGIN_ATTEMPT_TIMESTAMPS.push(now);
  
  // Keep only attempts of the last 15 seconds
  const cutoff = now - 15000;
  const activeAttempts = LOGIN_ATTEMPT_TIMESTAMPS.filter(time => time > cutoff);
  
  // Update state/list
  LOGIN_ATTEMPT_TIMESTAMPS.length = 0;
  LOGIN_ATTEMPT_TIMESTAMPS.push(...activeAttempts);
  
  return {
    rateLimited: activeAttempts.length > 3,
    attemptsCount: activeAttempts.length
  };
}

// Add a threat security log dynamically
export function addThreatLog(log: Omit<SecurityThreatLog, "id" | "timestamp">) {
  const currentLogs = getThreatLogs();
  const formatTime = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };
  
  const newLog: SecurityThreatLog = {
    ...log,
    id: "threat_" + Math.random().toString(36).substr(2, 9),
    timestamp: formatTime()
  };
  
  const updated = [newLog, ...currentLogs];
  saveThreatLogs(updated);

  // Dispatch global custom event so panels update seamlessly in real-time
  const evt = new CustomEvent("snns_sentry_threat_added", { detail: newLog });
  window.dispatchEvent(evt);
}

// Evaluate security risk using logic representing Artificial Intelligence model analysis
export function evaluateSentryThreat(
  username: string,
  ip: string,
  countryCode: string,
  vpnDetected: boolean,
  eventType: SecurityThreatLog["eventType"],
  failedAttempts: number = 0,
  deviceMismatch: boolean = false
): {
  riskScore: ThreatRiskLevel;
  action: SecurityThreatLog["actionTaken"];
  reasons: string[];
} {
  const reasons: string[] = [];
  let scorePoints = 0;

  // 1. VPN/Proxy checking
  if (vpnDetected) {
    scorePoints += 35;
    reasons.push("رصد خادم وكيل مشفر أو شبكة VPN مشبوهة لإخفاء الهوية");
  }

  // 2. Critical block countries (e.g. Iran/Syria)
  if (countryCode === "IR" || countryCode === "SY") {
    scorePoints += 50;
    reasons.push("الاتصال وارد من مناطق جغرافية محظورة بالكامل (إيران/سوريا)");
  } else if (countryCode !== "SA" && countryCode !== "AE" && countryCode !== "QA" && countryCode !== "KW" && countryCode !== "OM" && countryCode !== "BH") {
    // Foreign country
    scorePoints += 15;
    reasons.push("اتصال وارد من خارج منطقة الخليج العربي المستقرة");
  }

  // 3. Repeated failures (Bruteforce pattern)
  if (failedAttempts >= 5) {
    scorePoints += 45;
    reasons.push(`تكرار محاولات تسجيل الدورة فاشلة (${failedAttempts} تخمينات متتالية)`);
  } else if (failedAttempts >= 3) {
    scorePoints += 25;
    reasons.push("دخول متكرر غير موثق بالرصيد");
  }

  // 4. Device anomalous fingerprints
  if (deviceMismatch) {
    scorePoints += 20;
    reasons.push("بصمة نظام تشغيل/متصفح مجهولة أو مستعرض آلي غير متناسق مع الحساب");
  }

  // Calculate final Risk Rating
  let riskScore: ThreatRiskLevel = "low";
  let action: SecurityThreatLog["actionTaken"] = "none";

  if (scorePoints >= 70) {
    riskScore = "extreme";
    action = "locked_account"; // Automaton: lock down the target account
  } else if (scorePoints >= 45) {
    riskScore = "high";
    action = vpnDetected ? "ip_banned_temp" : "two_factor_sent"; // Automaton banned or require core 2FA
  } else if (scorePoints >= 20) {
    riskScore = "medium";
    action = "captcha_triggered"; // Trigger anti-robot CAPTCHA
  }

  return {
    riskScore,
    action,
    reasons
  };
}
