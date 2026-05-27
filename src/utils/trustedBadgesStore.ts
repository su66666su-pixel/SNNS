// trustedBadgesStore.ts - High security trusted accounts badge subsystem for SNNS.PRO

export interface TrustedBadgeRecord {
  username: string;
  name: string;
  avatar: string;
  isTrusted: boolean;
  accountType: "شخصي" | "صانع محتوى" | "شركة" | "جهة رسمية";
  grantedBy: string;
  grantedAt: string;
  reason: string;
}

export interface TrustedBadgeAuditLog {
  id: string;
  timestamp: string;
  ip: string;
  adminName: string;
  targetUsername: string;
  action: "منح الشارة" | "سحب الشارة" | "تعديل سبب التوثيق";
  reason: string;
}

const INITIAL_RECORDS: TrustedBadgeRecord[] = [];

const INITIAL_AUDIT_LOGS: TrustedBadgeAuditLog[] = [];

export function getTrustedRecords(): TrustedBadgeRecord[] {
  const saved = localStorage.getItem("snns_trusted_badge_records");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem("snns_trusted_badge_records", JSON.stringify(INITIAL_RECORDS));
  return INITIAL_RECORDS;
}

export function getTrustedAuditLogs(): TrustedBadgeAuditLog[] {
  const saved = localStorage.getItem("snns_trusted_badge_audit_logs");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem("snns_trusted_badge_audit_logs", JSON.stringify(INITIAL_AUDIT_LOGS));
  return INITIAL_AUDIT_LOGS;
}

// Check if user is trusted (by username)
export function isUserTrusted(username: string): boolean {
  if (!username) return false;
  // Hardcoded check for administrative accounts or prefix
  if (username === "official_m_qahtani" || username.startsWith("official_")) {
    return true;
  }
  const records = getTrustedRecords();
  const found = records.find(r => r.username.toLowerCase() === username.toLowerCase());
  return found ? found.isTrusted : false;
}

// Get account type / reason tooltips
export function getTrustedDetails(username: string): TrustedBadgeRecord | null {
  if (!username) return null;
  const records = getTrustedRecords();
  return records.find(r => r.username.toLowerCase() === username.toLowerCase() && r.isTrusted) || null;
}

// Grant trusted status
export function grantTrustedBadge(
  targetUsername: string,
  targetName: string,
  targetAvatar: string,
  adminName: string,
  accountType: "شخصي" | "صانع محتوى" | "شركة" | "جهة رسمية",
  reason: string,
  ip: string
): { success: boolean; message: string } {
  const records = getTrustedRecords();
  const logs = getTrustedAuditLogs();

  // Safety rule: Cannot verify oneself (simulating Super Admin vs target name safety)
  if (targetUsername.toLowerCase() === adminName.toLowerCase()) {
    return {
      success: false,
      message: "🔴 عذراً، لا يُسمح بمنح شارة التوثيق لحسابك الخاص بنفسك إلا من خلال Super Admin مستقل آخر."
    };
  }

  const existingIndex = records.findIndex(r => r.username.toLowerCase() === targetUsername.toLowerCase());
  if (existingIndex !== -1) {
    if (records[existingIndex].isTrusted) {
      return {
        success: false,
        message: `حساب @${targetUsername} يمتلك بالفعل شارة التحقق النشطة.`
      };
    }
    records[existingIndex].isTrusted = true;
    records[existingIndex].accountType = accountType;
    records[existingIndex].grantedBy = adminName;
    records[existingIndex].grantedAt = new Date().toISOString();
    records[existingIndex].reason = reason;
  } else {
    records.push({
      username: targetUsername,
      name: targetName || targetUsername,
      avatar: targetAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop",
      isTrusted: true,
      accountType,
      grantedBy: adminName,
      grantedAt: new Date().toISOString(),
      reason
    });
  }

  // Create Audit Log
  const newLog: TrustedBadgeAuditLog = {
    id: "t_audit_" + Date.now(),
    timestamp: new Date().toISOString(),
    ip,
    adminName,
    targetUsername,
    action: "منح الشارة",
    reason
  };

  const updatedRecords = [...records];
  const updatedLogs = [newLog, ...logs];

  localStorage.setItem("snns_trusted_badge_records", JSON.stringify(updatedRecords));
  localStorage.setItem("snns_trusted_badge_audit_logs", JSON.stringify(updatedLogs));

  // Sync back to system users_records
  syncWithUsersRecords(targetUsername, true);

  // Dispatch administrative notification simulation
  const sysNotification = {
    id: "notif_" + Date.now(),
    title: "🎉 تم توثيق حسابك رسمياً!",
    message: `يسعدنا إعلامك بأن إدارة SNNS.PRO منحتك شارة التوثيق الذهبية بصفتك (${accountType}) بناءً على: ${reason}. شكراً لجهودك الوطنية الفاخرة! 🇸🇦`,
    time: "الآن",
    read: false,
    type: "نظام"
  };

  try {
    const key = `snns_notifications_${targetUsername}`;
    const notifications = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([sysNotification, ...notifications]));
  } catch (err) {
    console.error(err);
  }

  return { success: true, message: `تم منح شارة التحقق بنجاح للحساب @${targetUsername}` };
}

// Revoke trusted status
export function revokeTrustedBadge(
  targetUsername: string,
  adminName: string,
  reason: string,
  ip: string
): { success: boolean; message: string } {
  const records = getTrustedRecords();
  const logs = getTrustedAuditLogs();

  const recordIndex = records.findIndex(r => r.username.toLowerCase() === targetUsername.toLowerCase());
  if (recordIndex === -1 || !records[recordIndex].isTrusted) {
    return {
      success: false,
      message: "هذا الحساب غير موثق بالأساس أو لا توجد شارة نشطة لسحبها."
    };
  }

  records[recordIndex].isTrusted = false;
  records[recordIndex].reason = ""; // reset description

  // Create Audit Log
  const newLog: TrustedBadgeAuditLog = {
    id: "t_audit_" + Date.now(),
    timestamp: new Date().toISOString(),
    ip,
    adminName,
    targetUsername,
    action: "سحب الشارة",
    reason
  };

  const updatedRecords = [...records];
  const updatedLogs = [newLog, ...logs];

  localStorage.setItem("snns_trusted_badge_records", JSON.stringify(updatedRecords));
  localStorage.setItem("snns_trusted_badge_audit_logs", JSON.stringify(updatedLogs));

  // Sync to system users
  syncWithUsersRecords(targetUsername, false);

  // Dispatch administrative warning payload
  const sysWarning = {
    id: "notif_revoke_" + Date.now(),
    title: "⚠️ تم سحب شارة التوثيق الرسمية",
    message: `تود إدارة المنصة إشعارك بأنه قد تم سحب شارة التحقق الممنوحة لملفك لسبب الرقابة السلوكية التالي: ${reason}. متاح الاستئناف عبر بطاقات الدعم.`,
    time: "الآن",
    read: false,
    type: "تنبيه"
  };

  try {
    const key = `snns_notifications_${targetUsername}`;
    const notifications = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([sysWarning, ...notifications]));
  } catch (err) {
    console.error(err);
  }

  return { success: true, message: `تم سحب شارة التحقق بنجاح من الحساب @${targetUsername}` };
}

// Modify Reason
export function updateTrustedReason(
  targetUsername: string,
  adminName: string,
  newReason: string,
  ip: string
): { success: boolean; message: string } {
  const records = getTrustedRecords();
  const logs = getTrustedAuditLogs();

  const recordIndex = records.findIndex(r => r.username.toLowerCase() === targetUsername.toLowerCase());
  if (recordIndex === -1 || !records[recordIndex].isTrusted) {
    return {
      success: false,
      message: "هذا الحساب غير موثق بالأساس."
    };
  }

  records[recordIndex].reason = newReason;

  const newLog: TrustedBadgeAuditLog = {
    id: "t_audit_" + Date.now(),
    timestamp: new Date().toISOString(),
    ip,
    adminName,
    targetUsername,
    action: "تعديل سبب التوثيق",
    reason: newReason
  };

  const updatedRecords = [...records];
  const updatedLogs = [newLog, ...logs];

  localStorage.setItem("snns_trusted_badge_records", JSON.stringify(updatedRecords));
  localStorage.setItem("snns_trusted_badge_audit_logs", JSON.stringify(updatedLogs));

  return { success: true, message: `تم تعديل سبب التوثيق بنجاح للحساب @${targetUsername}` };
}

// Internal utility to sync changes with "snns_users_records"
function syncWithUsersRecords(username: string, verifiedStatus: boolean) {
  try {
    const usersStr = localStorage.getItem("snns_users_records");
    if (usersStr) {
      const users = JSON.parse(usersStr) as any[];
      const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
      if (idx !== -1) {
        users[idx].verified = verifiedStatus;
        localStorage.setItem("snns_users_records", JSON.stringify(users));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
