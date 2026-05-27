// businessStore.ts - إدارة الحسابات التجارية والتوثيق والإعلانات لمنصة SNNS.PRO

export type BusinessVerificationStatus = "pending" | "approved" | "rejected" | "edit_requested";
export type AdCategoryType = "stream" | "account" | "product" | "video";
export type AdViewType = "main" | "in_stream" | "between_videos" | "sponsored" | "banner";
export type AdStatus = "pending_review" | "approved" | "rejected" | "edit_requested" | "active" | "completed";

export interface BusinessAccount {
  id: string; // matches username if logged-in account, or unique ID
  username: string;
  email: string;
  phone: string;
  businessName: string;
  activityType: string;
  crNumber: string; // Commercial Registration
  crDocumentUrl: string; // base64 payload or simulated secure path
  crDocumentName: string; // e.g. "cert.pdf"
  officialMobile: string;
  officialEmail: string;
  address: string;
  website?: string;
  logoUrl?: string; // Brand company logo
  managerName: string;
  registrationDate: string;
  status: "active" | "suspended" | "pending"; // account state
  verificationStatus: BusinessVerificationStatus;
  businessType: "company" | "institution"; // شركة أو مؤسسة
  notes?: string;
  signupIp?: string;
  signupDevice?: string;
}

export interface AdCampaign {
  id: string;
  businessId: string;
  businessName: string;
  campaignName: string;
  category: AdCategoryType; // ترويج بث، ترويج حساب، ترويج منتج، ترويج فيديو
  type: AdViewType; // إعلان رئيسي، داخل البث، بين الفيديوهات، ممول، بانر
  budget: number; // ميزانية بالريال السعودي
  durationDays: number; // مدة الحملة بالأيام
  startDate: string;
  targetAudience: string; // الجمهور المستهدف
  targetCountry: string; // الدولة المستهدفة
  targetViewsCount: number; // عدد المشاهدات المستهدفة
  currentViews: number; // المشاهدات الحالية المحققة
  clicksCount: number; // عدد النقرات المحققة
  status: AdStatus;
  mediaUrl?: string; // صورة أو فيديو الإعلان
  linkUrl?: string; // رابط توجيه الزوار
  rejectionReason?: string;
}

// Initial seeding of realistic business entities inside SNNS
const INITIAL_BUSINESSES: BusinessAccount[] = [];

// Initial seeding of ads
const INITIAL_CAMPAIGNS: AdCampaign[] = [];

// Safe local storage helpers
export function getBusinessAccounts(): BusinessAccount[] {
  const saved = localStorage.getItem("snns_business_accounts");
  if (!saved) {
    localStorage.setItem("snns_business_accounts", JSON.stringify(INITIAL_BUSINESSES));
    return INITIAL_BUSINESSES;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_BUSINESSES;
  }
}

export function saveBusinessAccounts(accounts: BusinessAccount[]) {
  localStorage.setItem("snns_business_accounts", JSON.stringify(accounts));
}

export function getAdCampaigns(): AdCampaign[] {
  const saved = localStorage.getItem("snns_ad_campaigns");
  if (!saved) {
    localStorage.setItem("snns_ad_campaigns", JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return INITIAL_CAMPAIGNS;
  }
}

export function saveAdCampaigns(campaigns: AdCampaign[]) {
  localStorage.setItem("snns_ad_campaigns", JSON.stringify(campaigns));
}

// 14. Anti-fake systems logic: detect duplicate CR numbers, emails, or duplicate handles
export interface ValidationResult {
  isValid: boolean;
  errorMsg?: string;
}

export function validateNewBusinessAccount(data: {
  username: string;
  email: string;
  crNumber: string;
}): ValidationResult {
  const currentAccounts = getBusinessAccounts();
  
  // Check CR duplicate
  const crDuplicate = currentAccounts.find(
    acc => acc.crNumber === data.crNumber
  );
  if (crDuplicate) {
    return {
      isValid: false,
      errorMsg: `رقم السجل التجاري مدخل مسبقاً ومطابق للمنشأة (${crDuplicate.businessName}). يمنع تسجيل السجلات المكررة لمنع انتحال الهويات.`
    };
  }

  // Check email duplicate
  const emailDuplicate = currentAccounts.find(
    acc => acc.email.toLowerCase() === data.email.toLowerCase() || acc.officialEmail.toLowerCase() === data.email.toLowerCase()
  );
  if (emailDuplicate) {
    return {
      isValid: false,
      errorMsg: "البريد الإلكتروني التجاري مسجل مسبقاً لحساب شركة أخرى."
    };
  }

  // Check username duplicate
  const handleDuplicate = currentAccounts.find(
    acc => acc.username.toLowerCase() === data.username.toLowerCase()
  );
  if (handleDuplicate) {
    return {
      isValid: false,
      errorMsg: "اسم المعرف التجاري محجوز بالفعل لمنشأة تجارية نشطة."
    };
  }

  return { isValid: true };
}

// Check privilege for privacy (super admin or safety officer 'review_business_accounts')
export function canViewOfficialBusinessData(userRole: string, permissions: string[] = []): boolean {
  if (userRole === "super_admin") return true;
  return permissions.includes("review_business_accounts");
}
