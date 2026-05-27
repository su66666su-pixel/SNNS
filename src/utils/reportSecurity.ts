// reportSecurity.ts - Robust security subsystem for SNNS.PRO reporting protocols
// Handles trust index, anti-malicious blockades, IPs, and local persistence linking

export interface ReporterMetrics {
  username: string;
  reportsSubmitted: number;
  falseReportsCount: number; // الكيدية
  correctReportsCount: number; // المعتمدة
  trustPercentage: number; // نسبة المصداقية
  trustLevel: "موثوق" | "متوسط" | "منخفض"; // مستوى ثقة البلاغات
  isRestricted: boolean;
  restrictedUntil: string | null; // تقييد البلاغات مؤقتاً
  violationsCount: number; // تسجيل مخالفة على الحساب لربطه بجرائم معلوماتية كيدية
  logs: ReportTransaction[];
}

export interface ReportTransaction {
  reportId: string;
  timestamp: string;
  ip: string;
  contentType: string;
  reportedUsername: string;
  reason: string;
  reviewResult: "قيد الانتظار" | "تم القبول - صحيح" | "مرفوض - كيدي" | "قيد التحقيق";
  status: "صحيح" | "كيدي" | "معلق";
}

// Helper to generate a realistic user IP address
export function generateRandomIP(): string {
  const segments = [
    "185",
    "80",
    Math.floor(Math.random() * 255).toString(),
    Math.floor(Math.random() * 254 + 1).toString()
  ];
  return segments.join(".");
}

// Load metrics for a specific user
export function getOrCreateReporterMetrics(username: string): ReporterMetrics {
  const key = `snns_reporter_metrics_${username}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data) as ReporterMetrics;
      // Double check active restrictions based on time
      if (parsed.restrictedUntil) {
        const until = new Date(parsed.restrictedUntil);
        if (new Date() > until) {
          parsed.isRestricted = false;
          parsed.restrictedUntil = null;
          localStorage.setItem(key, JSON.stringify(parsed));
        }
      }
      return parsed;
    } catch {
      // Fallback
    }
  }

  // Initial pristine metrics
  const newMetrics: ReporterMetrics = {
    username,
    reportsSubmitted: 0,
    falseReportsCount: 0,
    correctReportsCount: 0,
    trustPercentage: 100,
    trustLevel: "موثوق",
    isRestricted: false,
    restrictedUntil: null,
    violationsCount: 0,
    logs: []
  };
  localStorage.setItem(key, JSON.stringify(newMetrics));
  return newMetrics;
}

// Log a new report transaction with security metadata
export function registerNewReportTransaction(
  reporterUsername: string,
  reportId: string,
  contentType: string,
  reportedUsername: string,
  reason: string
): ReportTransaction {
  const metrics = getOrCreateReporterMetrics(reporterUsername);
  const ip = generateRandomIP();
  const timestamp = new Date().toISOString();

  const transaction: ReportTransaction = {
    reportId,
    timestamp,
    ip,
    contentType,
    reportedUsername,
    reason,
    reviewResult: "قيد الانتظار",
    status: "معلق"
  };

  metrics.reportsSubmitted += 1;
  metrics.logs = [transaction, ...metrics.logs];

  // Recurse update
  localStorage.setItem(`snns_reporter_metrics_${reporterUsername}`, JSON.stringify(metrics));
  return transaction;
}

// Core Synchronizer: Called by AdminDashboard when status is updated
export function syncReporterDecision(
  reporterUsername: string,
  reportId: string,
  adminOutcome: "تم الحل" | "مرفوض"
) {
  const metrics = getOrCreateReporterMetrics(reporterUsername);
  
  // Find transaction in logs
  const logIndex = metrics.logs.findIndex(l => l.reportId === reportId);
  if (logIndex !== -1) {
    const currentLog = metrics.logs[logIndex];
    
    if (adminOutcome === "مرفوض") {
      currentLog.reviewResult = "مرفوض - كيدي";
      currentLog.status = "كيدي";
      metrics.falseReportsCount += 1;
    } else {
      currentLog.reviewResult = "تم القبول - صحيح";
      currentLog.status = "صحيح";
      metrics.correctReportsCount += 1;
    }
    
    // Recalculate Trust Index
    const evaluated = metrics.correctReportsCount + metrics.falseReportsCount;
    if (evaluated > 0) {
      metrics.trustPercentage = Math.round((metrics.correctReportsCount / evaluated) * 100);
    } else {
      metrics.trustPercentage = 100;
    }

    // Determine trust category level
    if (metrics.trustPercentage >= 80) {
      metrics.trustLevel = "موثوق";
    } else if (metrics.trustPercentage >= 50) {
      metrics.trustLevel = "متوسط";
    } else {
      metrics.trustLevel = "منخفض";
    }

    // Repeated Malicious Reports Rules (If false reports counted > 1)
    if (adminOutcome === "مرفوض" && metrics.falseReportsCount >= 2) {
      metrics.violationsCount += 1;
      
      // Reduce priority trigger or apply restrict time (e.g., block submissions for 24 hours)
      metrics.isRestricted = true;
      const banTime = new Date();
      banTime.setHours(banTime.getHours() + 24); // Restrict for 24 hours
      metrics.restrictedUntil = banTime.toISOString();

      // Dispatch simulated audit alert payload for Admin Logs
      const alertPayload = {
        id: "alert_" + Date.now(),
        type: "أمني",
        timestamp: new Date().toLocaleTimeString("ar-SA"),
        desc: `🚨 كشف الاحتيال الذكي: تكرار البلاغات الكيدية من العميل @${reporterUsername}. تم تقييد بلاغاته مؤقتاً وتسجيل مخالفة سلوكية مع تقليل مصداقيته لشرفية المنصة.`,
        reporter: reporterUsername,
        severity: "حرجة"
      };

      try {
        const liveLogs = JSON.parse(localStorage.getItem("snns_admin_ops_logs") || "[]");
        localStorage.setItem("snns_admin_ops_logs", JSON.stringify([alertPayload, ...liveLogs]));
      } catch (err) {
        console.error(err);
      }
    }

    localStorage.setItem(`snns_reporter_metrics_${reporterUsername}`, JSON.stringify(metrics));
  }
}
