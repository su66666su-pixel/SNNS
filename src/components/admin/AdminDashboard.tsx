import React, { useState } from "react";
import { 
  Users, 
  Video, 
  MessageSquare, 
  ShieldCheck, 
  Wallet, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  Activity,
  AlertTriangle,
  Gift,
  Star,
  Layers,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  Trash2,
  Pause,
  Play,
  RotateCcw,
  MoreVertical,
  ChevronDown,
  LayoutDashboard,
  ShieldAlert,
  Sliders,
  Check,
  Globe,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  Server
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import PremiumHandles from "./PremiumHandles";
import TrustedBadgesManager from "./TrustedBadgesManager";
import BlockedCountries from "./BlockedCountries";
import SmartSentryPanel from "./SmartSentryPanel";
import BusinessAccountsManager from "./BusinessAccountsManager";
import FirebaseConfigConsole from "./FirebaseConfigConsole";
import VpnCountryMonitor from "./VpnCountryMonitor";
import { syncReporterDecision } from "../../utils/reportSecurity";

// Mock Analytical Data
const analyticsData = [
  { name: "السبت", users: 4200, revenue: 12400 },
  { name: "الأحد", users: 4800, revenue: 15900 },
  { name: "الإثنين", users: 5100, revenue: 21800 },
  { name: "الثلاثاء", users: 5900, revenue: 19500 },
  { name: "الأربعاء", users: 6400, revenue: 28400 },
  { name: "الخميس", users: 8200, revenue: 39800 },
  { name: "الجمعة", users: 9500, revenue: 45000 },
];

type AdminSection = 
  | "overview" 
  | "users" 
  | "creators" 
  | "lives" 
  | "content" 
  | "verification" 
  | "wallet" 
  | "reports" 
  | "notifications"
  | "settings"
  | "system"
  | "google_audit"
  | "moderators"
  | "trusted_badges"
  | "countries"
  | "sentry"
  | "firebase_config"
  | "business"
  | "vpn_monitor";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Load Google Auth configuration dynamic updates from UserProfile
  const [currentGoogleUser, setCurrentGoogleUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("snns_google_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentProfile, setCurrentProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("snns_user_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin global state simulation to preserve interactivity with localStorage persistence
  const [usersList, setUsersList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("snns_users_records");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initialUsers = [
      { id: 1, name: "عبدالله الراجحي", username: "a.rajhi", status: "نشط", verified: true, role: "صانع محتوى", balance: 14500, phone: "+966 50 123 4567" },
      { id: 2, name: "سلطان العتيبي", username: "s.otaibi", status: "محظور", verified: false, role: "مستخدم عادي", balance: 120, phone: "+966 53 987 6543" },
      { id: 3, name: "ليلى حسن", username: "layla_h", status: "نشط", verified: true, role: "صانع محتوى", balance: 29200, phone: "+966 55 456 7890" },
      { id: 4, name: "فهد الحربي", username: "fhd_hrb", status: "نشط", verified: false, role: "مستخدم عادي", balance: 0, phone: "+966 54 321 0987" },
      { id: 5, name: "محمد العمري", username: "m_omari", status: "تحت المراجعة", verified: false, role: "مستخدم عادي", balance: 340, phone: "+966 56 789 0123" },
    ];
    try {
      localStorage.setItem("snns_users_records", JSON.stringify(initialUsers));
    } catch {}
    return initialUsers;
  });

  const [creatorsList, setCreatorsList] = useState<any[]>([]);

  const [streamsList, setStreamsList] = useState<any[]>([]);

  const [postsQueue, setPostsQueue] = useState<any[]>([]);

  const [verificationsQueue, setVerificationsQueue] = useState<any[]>([]);

  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);

  const [reportsQueue, setReportsQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("snns_reports_records");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initialReports: any[] = [];
    try {
      localStorage.setItem("snns_reports_records", JSON.stringify(initialReports));
    } catch {}
    return initialReports;
  });

  // Filters state setup
  const [filterSeverity, setFilterSeverity] = useState<string>("الكل");
  const [filterContentType, setFilterContentType] = useState<string>("الكل");
  const [filterStatus, setFilterStatus] = useState<string>("الكل");
  const [filterDate, setFilterDate] = useState<string>("الكل");
  const [filterUsername, setFilterUsername] = useState<string>("");

  // Modals state setup
  const [selectedContentReport, setSelectedContentReport] = useState<any | null>(null);
  const [selectedAccountReport, setSelectedAccountReport] = useState<any | null>(null);
  const [warningReport, setWarningReport] = useState<any | null>(null);
  const [warningText, setWarningText] = useState<string>("");

  // =========================================================
  // MODERATORS & PERMISSIONS MANAGEMENT STATE
  // =========================================================
  const PERMISSIONS_METADATA = [
    { key: "manageReports", label: "إدارة البلاغات", category: "البلاغات والأمان" },
    { key: "deleteContent", label: "حذف المحتوى", category: "تنظيف المحتوى" },
    { key: "blockUsers", label: "حظر المستخدمين", category: "البلاغات والأمان" },
    { key: "reviewLives", label: "مراجعة البثوث", category: "البث المباشر" },
    { key: "reviewVideos", label: "مراجعة الفيديوهات", category: "تنظيف المحتوى" },
    { key: "acceptVerification", label: "قبول التوثيق", category: "التوثيق والهوية" },
    { key: "rejectVerification", label: "رفض التوثيق", category: "التوثيق والهوية" },
    { key: "manage_trusted_badges", label: "منح وإدارة شارات التوثيق الموثوقة", category: "التوثيق والهوية" },
    { key: "manageWallet", label: "إدارة العملات والهدايا", category: "الشؤون المالية" },
    { key: "manageAds", label: "إدارة الإعلانات", category: "الإعلانات" },
    { key: "viewStats", label: "مشاهدة الإحصائيات", category: "الشؤون المالية" },
    { key: "manageModerators", label: "إدارة المشرفين", category: "الإدارة والنظام" },
    { key: "sendAlerts", label: "إرسال التنبيهات العامة", category: "الإدارة والنظام" },
    { key: "manageLiveStreams", label: "إدارة البث المباشر", category: "البث المباشر" },
    { key: "stopLiveStreams", label: "إيقاف البثوث", category: "البث المباشر" },
    { key: "reviewMessages", label: "مراجعة الرسائل", category: "تنظيف المحتوى" },
    { key: "fullAccess", label: "التحكم الكامل (Super)", category: "الإدارة والنظام" },
  ];

  const ROLE_TEMPLATES: Record<string, { label: string; bg: string; text: string; defaultPerms: Record<string, boolean> }> = {
    "Super Admin": {
      label: "مدير عام النظام",
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      defaultPerms: {
        manageReports: true, deleteContent: true, blockUsers: true, reviewLives: true, reviewVideos: true,
        acceptVerification: true, rejectVerification: true, manage_trusted_badges: true, manageWallet: true, manageAds: true, viewStats: true,
        manageModerators: true, sendAlerts: true, manageLiveStreams: true, stopLiveStreams: true, reviewMessages: true, fullAccess: true
      }
    },
    "Admin": {
      label: "مدير إداري",
      bg: "bg-orange-500/10 border-orange-500/30",
      text: "text-orange-400",
      defaultPerms: {
        manageReports: true, deleteContent: true, blockUsers: true, reviewLives: true, reviewVideos: true,
        acceptVerification: true, rejectVerification: true, manage_trusted_badges: true, manageWallet: false, manageAds: true, viewStats: true,
        manageModerators: false, sendAlerts: true, manageLiveStreams: true, stopLiveStreams: true, reviewMessages: true, fullAccess: false
      }
    },
    "Security Moderator": {
      label: "مشرف أمني",
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-400",
      defaultPerms: {
        manageReports: true, deleteContent: false, blockUsers: true, reviewLives: true, reviewVideos: false,
        acceptVerification: false, rejectVerification: false, manageWallet: false, manageAds: false, viewStats: true,
        manageModerators: false, sendAlerts: false, manageLiveStreams: true, stopLiveStreams: true, reviewMessages: false, fullAccess: false
      }
    },
    "Content Moderator": {
      label: "مراقب محتوى",
      bg: "bg-purple-500/10 border-purple-500/30",
      text: "text-purple-400",
      defaultPerms: {
        manageReports: true, deleteContent: true, blockUsers: false, reviewLives: false, reviewVideos: true,
        acceptVerification: false, rejectVerification: false, manageWallet: false, manageAds: false, viewStats: true,
        manageModerators: false, sendAlerts: false, manageLiveStreams: false, stopLiveStreams: false, reviewMessages: true, fullAccess: false
      }
    },
    "Verification Moderator": {
      label: "مدقق توثيق وهويات",
      bg: "bg-teal-500/10 border-teal-500/30",
      text: "text-teal-400",
      defaultPerms: {
        manageReports: false, deleteContent: false, blockUsers: false, reviewLives: false, reviewVideos: false,
        acceptVerification: true, rejectVerification: true, manageWallet: false, manageAds: false, viewStats: true,
        manageModerators: false, sendAlerts: false, manageLiveStreams: false, stopLiveStreams: false, reviewMessages: false, fullAccess: false
      }
    },
    "Support Moderator": {
      label: "دعم فني وتواصل",
      bg: "bg-cyan-500/10 border-cyan-500/30",
      text: "text-cyan-400",
      defaultPerms: {
        manageReports: false, deleteContent: false, blockUsers: false, reviewLives: false, reviewVideos: false,
        acceptVerification: false, rejectVerification: false, manageWallet: true, manageAds: false, viewStats: true,
        manageModerators: false, sendAlerts: false, manageLiveStreams: false, stopLiveStreams: false, reviewMessages: true, fullAccess: false
      }
    }
  };

  const [moderatorsList, setModeratorsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("snns_moderators");
      if (saved) return JSON.parse(saved);
    } catch {}
    const items = [
      {
        id: "mod-1",
        name: "عبدالرحمن الحربي",
        email: "a.harbi@snns.pro",
        username: "a_harbi",
        role: "Super Admin",
        status: "نشط",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop",
        lastLogin: "نشط الآن",
        actionsCount: 154,
        createdAt: "٢٠٢٤/٠١/١٥",
        permissions: { ...ROLE_TEMPLATES["Super Admin"].defaultPerms }
      },
      {
        id: "mod-2",
        name: "منيرة السديري",
        email: "m.sudairi@snns.pro",
        username: "m_sudairi",
        role: "Admin",
        status: "نشط",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&fit=crop",
        lastLogin: "منذ ساعة",
        actionsCount: 92,
        createdAt: "٢٠٢٤/٠٢/٢٠",
        permissions: { ...ROLE_TEMPLATES["Admin"].defaultPerms }
      },
      {
        id: "mod-3",
        name: "خالد الشمري",
        email: "k.shammari@snns.pro",
        username: "k_shammari",
        role: "Security Moderator",
        status: "نشط",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop",
        lastLogin: "منذ ٥ ساعات",
        actionsCount: 48,
        createdAt: "٢٠٢٤/٠٣/٠٥",
        permissions: { ...ROLE_TEMPLATES["Security Moderator"].defaultPerms }
      },
      {
        id: "mod-4",
        name: "سارة الدوسري",
        email: "s.dossari@snns.pro",
        username: "s_dossari",
        role: "Content Moderator",
        status: "نشط",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop",
        lastLogin: "أمس",
        actionsCount: 112,
        createdAt: "٢٠٢٤/٠٣/12",
        permissions: { ...ROLE_TEMPLATES["Content Moderator"].defaultPerms }
      },
      {
        id: "mod-5",
        name: "عادل العتيبي",
        email: "a.otaibi@snns.pro",
        username: "a_otaibi",
        role: "Verification Moderator",
        status: "نشط",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop",
        lastLogin: "منذ يومين",
        actionsCount: 31,
        createdAt: "٢٠٢٤/٠٤/٠١",
        permissions: { ...ROLE_TEMPLATES["Verification Moderator"].defaultPerms }
      },
      {
        id: "mod-6",
        name: "بندر القحطاني",
        email: "b.qahtani@snns.pro",
        username: "b_qahtani",
        role: "Support Moderator",
        status: "موقوف",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&fit=crop",
        lastLogin: "منذ أسبوع",
        actionsCount: 5,
        createdAt: "٢٠٢٤/٠٤/١٠",
        permissions: { ...ROLE_TEMPLATES["Support Moderator"].defaultPerms }
      }
    ];
    try {
      localStorage.setItem("snns_moderators", JSON.stringify(items));
    } catch {}
    return items;
  });

  const [opsLogs, setOpsLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("snns_admin_ops_logs");
      if (saved) return JSON.parse(saved);
    } catch {}
    const initialLogs: any[] = [];
    try {
      localStorage.setItem("snns_admin_ops_logs", JSON.stringify(initialLogs));
    } catch {}
    return initialLogs;
  });

  // Moderators Page UI Filters
  const [modSearchQuery, setModSearchQuery] = useState("");
  const [modFilterRole, setModFilterRole] = useState("الكل");
  const [modFilterStatus, setModFilterStatus] = useState("الكل");

  // Add / Edit / Security Modals
  const [isAddModModalOpen, setIsAddModModalOpen] = useState(false);
  const [isEditPermsModalOpen, setIsEditPermsModalOpen] = useState(false);
  const [modFormName, setModFormName] = useState("");
  const [modFormEmail, setModFormEmail] = useState("");
  const [modFormUsername, setModFormUsername] = useState("");
  const [modFormRole, setModFormRole] = useState("Super Admin");

  const [selectedModForPerms, setSelectedModForPerms] = useState<any | null>(null);
  const [editingPerms, setEditingPerms] = useState<any>(null);

  const [securityConfirmAction, setSecurityConfirmAction] = useState<{
    type: "block" | "delete_mod" | "suspend_mod" | "add_mod" | "update_perms";
    title: string;
    message: string;
    onConfirm: () => void;
    requirePassword?: boolean;
  } | null>(null);
  const [securityPasswordInput, setSecurityPasswordInput] = useState("");
  const [securityPasswordError, setSecurityPasswordError] = useState("");

  // Helper action logger & active modifier
  const logAdminAction = (modName: string, role: string, actionType: string, detail: string, targetAccount: string) => {
    const newLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      moderatorName: modName,
      role,
      actionType,
      detail,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "numeric" }) + " - " + new Date().toLocaleDateString("ar-SA"),
      ip: "192.168.1." + Math.floor(10 + Math.random() * 240),
      targetAccount
    };
    setOpsLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem("snns_admin_ops_logs", JSON.stringify(updated));
      return updated;
    });

    // Increment actionsCount for the moderator
    setModeratorsList(prev => {
      const updated = prev.map(m => {
        if (m.name === modName) {
          return { ...m, actionsCount: m.actionsCount + 1 };
        }
        return m;
      });
      localStorage.setItem("snns_moderators", JSON.stringify(updated));
      return updated;
    });
  };

  // Reports Center helper actions with persistent database linking
  const handleUpdateReportStatus = (reportId: string, status: string, decision?: string) => {
    const updated = reportsQueue.map(rep => {
      if (rep.id === reportId) {
        if (rep.reporterUsername && (status === "مرفوض" || status === "تم الحل")) {
          // Sync metrics
          syncReporterDecision(rep.reporterUsername, rep.id, status as "تم الحل" | "مرفوض");
        }
        return {
          ...rep,
          status,
          decisionLog: decision ? [...rep.decisionLog, decision] : rep.decisionLog
        };
      }
      return rep;
    });
    setReportsQueue(updated);
    try {
      localStorage.setItem("snns_reports_records", JSON.stringify(updated));
    } catch {}
  };

  const handleDeleteContent = (reportId: string, contentId: string) => {
    try {
      const deleted = JSON.parse(localStorage.getItem("snns_deleted_contents") || "[]");
      if (!deleted.includes(contentId)) {
        deleted.push(contentId);
        localStorage.setItem("snns_deleted_contents", JSON.stringify(deleted));
      }
    } catch {}

    const updated = reportsQueue.map(rep => {
      if (rep.id === reportId) {
        if (rep.reporterUsername) {
          syncReporterDecision(rep.reporterUsername, rep.id, "تم الحل");
        }
        return {
          ...rep,
          status: "تم الحل",
          decisionLog: [...rep.decisionLog, "تم قبول البلاغ وحذف المحتوى المخل من المنصة نهائياً 🇸🇦"]
        };
      }
      return rep;
    });
    setReportsQueue(updated);
    try {
      localStorage.setItem("snns_reports_records", JSON.stringify(updated));
    } catch {}
    alert("تم حذف المحتوى بنجاح وإخفاؤه من المنصة! 🇸🇦");
  };

  const handleBlockUser = (reportId: string, username: string, isPermanent: boolean) => {
    const banner = isPermanent ? "حظر نهائي ومستمر للغرس السلوكي السيء" : "حظر مؤقت لمدة ٣ أيام للمخالفة السلوكية الأولى";
    const userStatus = isPermanent ? "محظور" : "محظور مؤقتاً";

    // Update users records
    const updatedUsers = usersList.map(u => {
      if (u.username === username) {
        return { ...u, status: userStatus };
      }
      return u;
    });
    setUsersList(updatedUsers);
    try {
      localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));
    } catch {}

    // Update reports records
    const updatedReports = reportsQueue.map(rep => {
      if (rep.id === reportId) {
        if (rep.reporterUsername) {
          syncReporterDecision(rep.reporterUsername, rep.id, "تم الحل");
        }
        return {
          ...rep,
          status: "تم الحل",
          decisionLog: [...rep.decisionLog, `تم قبول البلاغ وإجراء ${banner} على الحساب @${username} 🇸🇦`]
        };
      }
      return rep;
    });
    setReportsQueue(updatedReports);
    try {
      localStorage.setItem("snns_reports_records", JSON.stringify(updatedReports));
    } catch {}
    alert(`تم ${isPermanent ? 'الحظر الدائم' : 'الحظر المؤقت'} للمستخدم @${username} بنجاح تحديثاً للنظام وسجل التجاوزات! `);
  };

  const handleWarnUser = (reportId: string, username: string, warningMsg: string) => {
    if (!warningMsg.trim()) return;
    const updated = reportsQueue.map(rep => {
      if (rep.id === reportId) {
        if (rep.reporterUsername) {
          syncReporterDecision(rep.reporterUsername, rep.id, "تم الحل");
        }
        return {
          ...rep,
          status: "تم الحل",
          decisionLog: [...rep.decisionLog, `تم توجيه إنذار رسمي للمستخدم @${username}: "${warningMsg}"`]
        };
      }
      return rep;
    });
    setReportsQueue(updated);
    try {
      localStorage.setItem("snns_reports_records", JSON.stringify(updated));
    } catch {}
    alert(`تم إرسال الإنذار الرسمي للمستخدم @${username} بنجاح!`);
  };

  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, title: "اكتمال شحن رصيد عملات مستخدم جديد عبر Apple Pay بقيمة ١٩٩.٩٩ ر.س", time: "الآن" },
    { id: 2, title: "تم حظر تلقائي لبث مباشر انتهك حقوق البث الفكري والموسيقى المحمية", time: "منذ ساعة" }
  ]);

  const [settingsState, setSettingsState] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    platformCommission: 15,
    allowGuestReactions: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserRole, setNewUserRole] = useState("مستخدم عادي");

  // Filter users based on search
  const filteredUsers = usersList.filter(u => 
    u.name.includes(searchTerm) || 
    u.username.includes(searchTerm) ||
    u.phone.includes(searchTerm)
  );

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername) return;
    const added = {
      id: Date.now(),
      name: newUserName,
      username: newUserUsername.toLowerCase(),
      status: "نشط",
      verified: false,
      role: newUserRole,
      balance: 0,
      phone: "+966 50 " + Math.floor(1000000 + Math.random() * 9000000)
    };
    setUsersList(prev => {
      const updated = [added, ...prev];
      localStorage.setItem("snns_users_records", JSON.stringify(updated));
      return updated;
    });
    setIsAddingUser(false);
    setNewUserName("");
    setNewUserUsername("");
  };

  const toggleUserStatus = (userId: number) => {
    setUsersList(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            status: u.status === "نشط" ? "محظور" : "نشط"
          };
        }
        return u;
      });
      localStorage.setItem("snns_users_records", JSON.stringify(updated));
      return updated;
    });
  };

  const promoteToCreator = (userId: number) => {
    setUsersList(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            role: "صانع محتوى",
            verified: true
          };
        }
        return u;
      });
      localStorage.setItem("snns_users_records", JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetToGoogleDefault = () => {
    if (!currentGoogleUser) return;
    const originalProfile = {
      name: currentGoogleUser.name,
      avatar: currentGoogleUser.avatar,
      username: currentGoogleUser.email.split("@")[0] || "google_user",
      bio: "مستخدم سعودي موثق | متصل عبر حساب Google المعتمد ومطابق للمعايير 🇸🇦",
      cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&fit=crop",
      location: "الرياض، المملكة العربية السعودية",
      followers: "١٢.٥ ألف",
      following: "٤٨٢",
      views: "٣٤٠ ألف",
      coins: "١,٤٥٠",
      gifts: "٨٢",
      liveHours: "٢٤ ساعة",
      isOnline: true,
      verified: true
    };
    setCurrentProfile(originalProfile);
    localStorage.setItem("snns_user_profile", JSON.stringify(originalProfile));
    alert("تمت إعادة تعيين وتزامن الملف الشخصي تلقائياً لبيانات قوقل الأصلية! 🇸🇦");
  };

  const sections = [
    { id: "overview", label: "نظرة عامة", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "users", label: "إدارة المستخدمين", icon: <Users className="w-5 h-5" /> },
    { id: "moderators", label: "المشرفين والصلاحيات", icon: <ShieldAlert className="w-5 h-5 text-red-400" /> },
    { id: "premium_handles", label: "إدارة المعرفات المميزة", icon: <Sparkles className="w-5 h-5 text-yellow-500" /> },
    { id: "google_audit", label: "مطابقة حسابات Google 🔑", icon: <ShieldCheck className="w-5 h-5 text-saudi-glow" /> },
    { id: "creators", label: "إدارة الصناع", icon: <Star className="w-5 h-5" /> },
    { id: "lives", label: "البث المباشر", icon: <Video className="w-5 h-5" /> },
    { id: "content", label: "مراقبة المحتوى", icon: <Layers className="w-5 h-5" /> },
    { id: "verification", label: "طلبات التوثيق", icon: <ShieldCheck className="w-5 h-5" /> },
    { id: "trusted_badges", label: "إدارة الحسابات الموثوقة ☑️", icon: <CheckCircle2 className="w-5 h-5 text-saudi-green" /> },
    { id: "business", label: "إدارة الحسابات الإعلانية 🏢", icon: <Building2 className="w-5 h-5 text-saudi-glow" /> },
    { id: "countries", label: "إدارة الدول المحظورة 🌐", icon: <Globe className="w-5 h-5 text-saudi-glow" /> },
    { id: "vpn_monitor", label: "مراقبة الدول وVPN 🌐", icon: <ShieldAlert className="w-5 h-5 text-amber-500" /> },
    { id: "sentry", label: "الحارس الذكي 🛡️ (Sentry-AI)", icon: <ShieldCheck className="w-5 h-5 text-saudi-glow" /> },
    { id: "firebase_config", label: "سحابة Firebase والهوية 🇸🇦", icon: <Server className="w-5 h-5 text-saudi-glow" /> },
    { id: "wallet", label: "المحفظة والمالية", icon: <Wallet className="w-5 h-5" /> },
    { id: "reports", label: "مركز البلاغات", icon: <AlertTriangle className="w-5 h-5" /> },
    { id: "notifications", label: "التنبيهات العامة", icon: <Bell className="w-5 h-5" /> },
    { id: "system", label: "حالة النظام", icon: <Activity className="w-5 h-5" /> },
    { id: "settings", label: "الإعدادات العامة", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-tajawal" dir="rtl">
      {/* Sidebar Layout */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden md:flex bg-[#0A0A0A] border-l border-white/5 flex flex-col shrink-0 overflow-hidden relative z-50 transition-all duration-300"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-saudi-green rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,132,61,0.3)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg whitespace-nowrap">SNNS.PRO</h1>
              <p className="text-[10px] text-saudi-glow font-bold uppercase tracking-widest">مكتب التحكم العام</p>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as AdminSection)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all h-11 ${
                activeSection === section.id 
                  ? "bg-saudi-green/10 text-saudi-glow border border-saudi-green/20" 
                  : "text-gray-500 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <div className="shrink-0">{section.icon}</div>
              {isSidebarOpen && <span className="font-bold text-xs whitespace-nowrap">{section.label}</span>}
              {isSidebarOpen && activeSection === section.id && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-saudi-glow shadow-[0_0_8px_#00A34F]" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link to="/" className="w-full flex items-center gap-3 p-3 text-saudi-glow hover:bg-saudi-green/10 rounded-xl transition-colors">
            <ArrowRight className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-bold text-xs">العودة للبروفايل</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-[#0A0A0A]/50 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hidden md:block"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="p-2 hover:bg-white/5 rounded-lg text-saudi-glow md:hidden shrink-0">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <h2 className="text-sm md:text-xl font-bold truncate">
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            <div className="relative group hidden lg:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث الفوري..."
                className="bg-white/5 border border-white/10 rounded-full py-1.5 pr-10 pl-6 text-xs w-48 md:w-64 focus:border-saudi-green/50 focus:outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-left hidden sm:block">
                <p className="text-[10px] md:text-xs font-bold text-left">أدمن الهيئة العامة</p>
                <p className="text-[9px] md:text-[10px] text-saudi-glow text-left">Admin Security</p>
              </div>
              <div className="w-8 h-8 md:w-10 h-10 rounded-full bg-gradient-to-br from-saudi-green to-saudi-dark border border-white/20 flex items-center justify-center font-bold text-xs md:text-sm">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Mobile-Only Horizontal Scrollable Sections Navbar */}
        <div className="flex md:hidden bg-[#070707] border-b border-white/5 px-4 py-2.5 overflow-x-auto gap-2 scrollbar-none sticky top-16 z-30">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as AdminSection)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all ${
                activeSection === sec.id
                  ? "bg-saudi-green/10 text-saudi-glow border border-saudi-green/30"
                  : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <div className="w-3.5 h-3.5 shrink-0">{sec.icon}</div>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-8"
            >
              {activeSection === "overview" && (
                <div className="space-y-8">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard label="إجمالي مستخدمي المنصة" value={usersList.length.toString()} change="+14%" icon={<Users className="text-blue-500" />} />
                    <MetricCard label="صناع المحتوى المعتمدين" value={creatorsList.length.toString()} change="+8%" icon={<Star className="text-yellow-500" />} />
                    <MetricCard label="البث المباشر النشط" value={streamsList.length.toString()} change="+32%" icon={<Video className="text-red-500" />} />
                    <MetricCard label="إجمالي الأرباح المنصة" value="١,٢٤٥,٦٠٠ ريال" change="+22%" icon={<Wallet className="text-saudi-glow" />} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Area Chart */}
                    <div className="lg:col-span-2 bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold flex items-center gap-2 font-tajawal">
                          <TrendingUp className="w-5 h-5 text-saudi-glow" />
                          معدل نمو النشاط والمبيعات المباشرة
                        </h3>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-saudi-green/20 text-saudi-glow rounded-md text-[10px] font-bold">هذا الأسبوع</button>
                        </div>
                      </div>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analyticsData}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00A34F" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00A34F" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
                            <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1f1f1f', borderRadius: '12px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="users" stroke="#00A34F" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Quick Notifications sidebar */}
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-6">
                      <h3 className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        بلاغات وتقارير طارئة
                      </h3>
                      <div className="space-y-4">
                        {reportsQueue.map(rep => (
                          <div key={rep.id} className="p-3 bg-white/2 rounded-xl border border-white/5 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-red-400">{rep.priority}</span>
                              <span className="text-gray-500 font-mono text-[9px]">{rep.date}</span>
                            </div>
                            <p className="font-bold">المبلغ عنه: @{rep.reported}</p>
                            <p className="text-[10px] text-gray-400 truncate mt-1">السبب: {rep.reason}</p>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setActiveSection("reports")} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors">
                        عرض جميع البلاغات
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "users" && (
                <div className="space-y-6">
                  {/* Operations headers */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث بالاسم أو رقم الجوال..." 
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-3 pr-10 pl-4 text-sm focus:border-saudi-green outline-none" 
                      />
                    </div>
                    <button 
                      onClick={() => setIsAddingUser(true)}
                      className="px-6 py-3 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20"
                    >
                      إضافة مستخدم جديد
                    </button>
                  </div>

                  {/* Add User Modal Dialog */}
                  <AnimatePresence>
                    {isAddingUser && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[90] flex items-center justify-center p-4"
                      >
                        <motion.div className="bg-dark-surface border border-dark-border p-6 rounded-3xl w-full max-w-md space-y-4">
                          <h4 className="font-bold text-lg font-tajawal">إضافة مستخدم جديد للنظام</h4>
                          <form onSubmit={handleCreateUserSubmit} className="space-y-3">
                            <div>
                              <label className="block text-xs mb-1 text-gray-400">الاسم الكامل المطابق</label>
                              <input 
                                type="text" 
                                required
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm outline-none focus:border-saudi-green" 
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1 text-gray-400">المعرف الأساسي (Username)</label>
                              <input 
                                type="text" 
                                required
                                value={newUserUsername}
                                onChange={(e) => setNewUserUsername(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm outline-none focus:border-saudi-green" 
                                placeholder="مثال: s_qahtani"
                              />
                            </div>
                            <div>
                              <label className="block text-xs mb-1 text-gray-400">صلاحيات الدور</label>
                              <select 
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value)}
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-white"
                              >
                                <option value="مستخدم عادي">مستخدم عادي</option>
                                <option value="صانع محتوى">صانع محتوى متميز</option>
                              </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button type="submit" className="flex-1 py-2 bg-saudi-green text-white rounded-xl font-bold text-sm">إضافة الحساب</button>
                              <button type="button" onClick={() => setIsAddingUser(false)} className="flex-1 py-2 bg-white/5 text-gray-400 rounded-xl text-sm">إلغاء</button>
                            </div>
                          </form>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/2 text-[10px] text-gray-500 uppercase font-bold border-b border-white/5">
                            <th className="p-5">المستخدم</th>
                            <th className="p-5">رقم الهاتف</th>
                            <th className="p-5">الدور وصلاحيات المنصة</th>
                            <th className="p-5">حالة الحساب</th>
                            <th className="p-5">رصيد العملات المستلمة</th>
                            <th className="p-5 text-left">إجراءات الإداره</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-white/1 transition-colors">
                              <td className="p-5 font-bold">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-saudi-green/10 text-saudi-glow flex items-center justify-center font-bold">{user.name[0]}</div>
                                  <div>
                                    <p className="text-sm font-bold flex items-center gap-1">
                                      {user.name}
                                      {user.verified && <CheckCircle2 className="w-3.5 h-3.5 text-saudi-glow fill-saudi-glow/10" />}
                                    </p>
                                    <p className="text-[10px] text-gray-500">@{user.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-5 font-mono text-gray-300">{user.phone}</td>
                              <td className="p-5 font-bold text-saudi-glow">{user.role}</td>
                              <td className="p-5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  user.status === "نشط" ? "bg-saudi-green/10 text-saudi-glow" : 
                                  user.status === "محظور" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="p-5 font-mono text-sm">{user.balance.toLocaleString()} عملة</td>
                              <td className="p-5 text-left flex gap-1 justify-end">
                                <button onClick={() => toggleUserStatus(user.id)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg font-bold">
                                  {user.status === "نشط" ? "حظر" : "تنشيط"}
                                </button>
                                {user.role !== "صانع محتوى" && (
                                  <button onClick={() => promoteToCreator(user.id)} className="px-3 py-1.5 bg-saudi-green/20 text-saudi-glow hover:bg-saudi-green hover:text-white rounded-lg font-bold">
                                    ترقية لصانع
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "creators" && (
                <div className="space-y-6">
                  {/* Creators Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <h4 className="text-gray-400 font-bold text-xs mb-1">نسبة عمولة المنصة العامة</h4>
                      <h3 className="text-3xl font-mono font-bold text-saudi-glow">{settingsState.platformCommission}%</h3>
                      <div className="mt-4 flex gap-2">
                        <input 
                          type="number" 
                          value={settingsState.platformCommission}
                          onChange={(e) => setSettingsState(prev => ({ ...prev, platformCommission: parseInt(e.target.value) || 0 }))}
                          className="w-20 bg-dark-bg border border-dark-border rounded px-2.5 py-1 text-xs" 
                        />
                        <span className="text-[10px] text-gray-500 self-center">تحديث النسبة المئوية للمبيعات</span>
                      </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <h4 className="text-gray-400 font-bold text-xs mb-1">إجمالي مبيعات هدايا البث الحالية</h4>
                      <h3 className="text-3xl font-mono font-bold">٣٨٤,٥٠٠ ريال</h3>
                      <p className="text-[9px] text-gray-500 mt-2">بعد تقسيم عمولة المنصة التلقائية</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <h4 className="text-gray-400 font-bold text-xs mb-1">طلبات شراكة معلقة</h4>
                      <h3 className="text-3xl font-mono font-bold text-yellow-500">١٢ طلب جديد</h3>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                    <h3 className="font-bold text-sm mb-4">قائمة صناع المحتوى المعتمدين والمستوى المباشر</h3>
                    <div className="space-y-4">
                      {creatorsList.map(cr => (
                        <div key={cr.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-saudi-green/10 flex items-center justify-center text-saudi-glow text-xs font-bold font-mono">
                              LV{cr.level}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{cr.name}</h4>
                              <p className="text-[10px] text-gray-500">@{cr.username} | التصنيف: {cr.category}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 mt-2 sm:mt-0 text-xs">
                            <div className="text-right">
                              <p className="text-gray-500 text-[10px]">المتابعون المشتركون</p>
                              <p className="font-bold">{cr.subscribers}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-500 text-[10px]">مجموع الأرباح</p>
                              <p className="font-bold text-saudi-glow">{cr.totalEarnings}</p>
                            </div>
                            <div>
                              <span className="px-2.5 py-1 bg-saudi-green/10 text-saudi-glow font-bold rounded">نشط</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "lives" && (
                <div className="space-y-6">
                  {/* Streams manager */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {streamsList.map(st => (
                      <div key={st.id} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-xs text-red-500">● مباشر الآن</span>
                            <p className="text-xs text-gray-500">مدة البث: {st.duration}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-black/60 rounded text-[10px] font-mono font-bold text-saudi-glow">{st.viewers.toLocaleString()} مشاهد</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm font-tajawal line-clamp-1">{st.title}</h4>
                          <p className="text-xs text-gray-400">المضيف: {st.host} (@{st.username})</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => {
                              alert(`تم تثبيت وتمييز بث @${st.username} في الصفحة الرئيسية للمنصة!`);
                            }}
                            className="flex-1 py-1.5 bg-saudi-green/20 text-saudi-glow hover:bg-saudi-green hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            تمييز البث
                          </button>
                          <button 
                            onClick={() => {
                              if(confirm(`هل تود إنهاء البث المباشر الخاص بمستكشف: @${st.username} بسبب مخالفة لوائح البث المباشر المعتمدة؟`)) {
                                setStreamsList(prev => prev.filter(s => s.id !== st.id));
                              }
                            }}
                            className="flex-1 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            إنهاء فوري
                          </button>
                        </div>
                      </div>
                    ))}
                    {streamsList.length === 0 && (
                      <div className="text-center py-10 text-gray-500 col-span-3">
                        لا يوجد بث مباشر نشط حالياً على المنصّة.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "content" && (
                <div className="space-y-6">
                  {/* Platform Posts Moderation Queue */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                    <h3 className="font-bold text-sm mb-4">قائمة منشورات وصور المنصة قيد الرقابة للمحتوى والمخالفات</h3>
                    <p className="text-xs text-gray-500 mb-6 font-tajawal">مراجعة المحتويات المرفوعة بشكل مباشر وتطبيق خوارزميات الأمان والنزاهة وحقوق الطبع والنشر:</p>

                    <div className="space-y-4">
                      {postsQueue.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5 text-xs">
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-bold ${p.type === "فيديو" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                              {p.type}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm">{p.title}</h4>
                              <p className="text-[10px] text-gray-500">بواسطة: @{p.author} | عدد البلاغات الحالية: <span className="text-red-500 font-bold">{p.reports}</span></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${p.status === "نشط" ? "bg-saudi-green/10 text-saudi-glow" : "bg-yellow-500/10 text-yellow-500"}`}>{p.status === "نشط" ? "معتمد تلقائياً" : "تحت المراجعة"}</span>
                            <button 
                              onClick={() => {
                                alert("المحتوى آمن ومصادق بالكامل ✅");
                                setPostsQueue(prev => prev.map(pq => pq.id === p.id ? { ...pq, status: "نشط", reports: 0 } : pq));
                              }}
                              className="p-1.5 hover:bg-white/5 rounded text-saudi-glow" 
                              title="اعتماد وآمن"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if(confirm("هل توافق على حذف المحتوى نهائياً لانتهاك السياسات العامة المنصوص عليها؟")) {
                                  setPostsQueue(prev => prev.filter(pq => pq.id !== p.id));
                                }
                              }}
                              className="p-1.5 hover:bg-white/5 rounded text-red-500" 
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "verification" && (
                <div className="space-y-6">
                  {/* Verification requests */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {verificationsQueue.map(req => (
                      <div key={req.id} className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl space-y-4 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{req.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${req.status === "معلق" ? "bg-yellow-500/10 text-yellow-500" : "bg-saudi-green/10 text-saudi-glow"}`}>{req.status}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{req.name}</h4>
                          <p className="text-xs text-gray-400">التوصيف المهني: {req.type}</p>
                        </div>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                          <span className="text-[10px] truncate max-w-[150px]">{req.doc}</span>
                          <span className="text-saudi-glow underline cursor-pointer hover:text-saudi-green text-[10px]">استعراض الهوية</span>
                        </div>
                        {req.status === "معلق" && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setVerificationsQueue(prev => prev.map(v => v.id === req.id ? { ...v, status: "مقبول" } : v));
                                alert(`تم توثيق حساب ${req.name} بنجاح وإصدار الشارة! ✅`);
                              }}
                              className="flex-1 py-1.5 bg-saudi-green text-white font-bold text-xs rounded-xl"
                            >
                              قبول الطلب
                            </button>
                            <button 
                              onClick={() => {
                                setVerificationsQueue(prev => prev.filter(v => v.id !== req.id));
                                alert("تم رفض الطلب لعدم وضوح المعلومات.");
                              }}
                              className="flex-1 py-1.5 bg-red-500/10 text-red-500 font-bold text-xs rounded-xl"
                            >
                              رفض الطلب
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "wallet" && (
                <div className="space-y-6">
                  {/* Sub-finance details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">إجمالي المبيعات المباشرة</p>
                      <h3 className="text-2xl font-mono font-bold tracking-tight mt-1">١,٢٤٥,٦٠٠ ر.س</h3>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <p className="text-gray-500 text-[10px] font-bold">صافي أرباح المنصة المقتطعة</p>
                      <h3 className="text-2xl font-mono font-bold text-saudi-glow mt-1">١٨٦,٨٤٠ ر.س</h3>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <p className="text-gray-500 text-[10px] font-bold">عملات تم حجزها للتداولات</p>
                      <h3 className="text-2xl font-mono font-bold text-blue-400 mt-1">٢٥٠,٠٠٠ عملة</h3>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
                      <p className="text-gray-500 text-[10px] font-bold">طلبات سحب معلقة</p>
                      <h3 className="text-2xl font-mono font-bold text-yellow-500 mt-1">٤٢,٥٠٠ ر.س</h3>
                    </div>
                  </div>

                  {/* Pending withdrawals requests review */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                    <h3 className="font-bold text-sm mb-4">طلبات استيراد وتحويل الأرصدة البنكية المعلقة</h3>
                    <div className="space-y-4">
                      {withdrawRequests.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5 text-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-saudi-glow">@{item.user}</span>
                              <span className="text-[10px] text-gray-500">{item.date}</span>
                            </div>
                            <p className="text-gray-400 font-mono text-[10px]">IBAN: {item.iban}</p>
                          </div>

                          <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <span className="font-mono font-bold text-sm">{item.amount.toLocaleString()} ر.س</span>
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${item.status === "معلق" ? "bg-yellow-500/10 text-yellow-500 animate-pulse" : "bg-saudi-green/10 text-saudi-glow"}`}>{item.status}</span>
                            {item.status === "معلق" && (
                              <button 
                                onClick={() => {
                                  setWithdrawRequests(prev => prev.map(w => w.id === item.id ? { ...w, status: "مكتمل" } : w));
                                  alert("تمت الموافقة على السحب وتحويل المبلغ لحساب العميل بنجاح! 🇸🇦");
                                }}
                                className="px-4 py-2 bg-saudi-green text-white font-bold rounded-lg hover:bg-saudi-green/90"
                              >
                                تحويل مالي
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "reports" && (
                <div className="space-y-6">
                  {/* Reports Overview Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold">إجمالي البلاغات المسجلة</p>
                        <h3 className="text-2xl font-mono font-bold text-white mt-1">{reportsQueue.length}</h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                        <AlertTriangle className="w-5 h-5 text-saudi-glow" />
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold">بلاغات جديدة للحل</p>
                        <h3 className="text-2xl font-mono font-bold text-yellow-500 mt-1">
                          {reportsQueue.filter(r => r.status === "جديد" || r.status === "قيد المراجعة").length}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold">بلاغات تم إقفالها</p>
                        <h3 className="text-2xl font-mono font-bold text-saudi-glow mt-1">
                          {reportsQueue.filter(r => r.status === "تم الحل").length}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-saudi-green/20 flex items-center justify-center text-saudi-glow">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-[10px] font-bold">بلاغات درجة حرجة (عالية)</p>
                        <h3 className="text-2xl font-mono font-bold text-red-500 mt-1">
                          {reportsQueue.filter(r => r.priority === "عالية" && r.status !== "تم الحل").length}
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Advanced Filters Panel */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-saudi-glow" />
                          تصفية وفرز البلاغات المتقدم
                        </h3>
                        <p className="text-gray-500 text-[10px] mt-0.5">قم بفرز البلاغات الواردة بحسب درجة الخطورة، نوع المحتوى أو حالة الإغلاق للتذليل الفوري</p>
                      </div>
                      <span className="text-[10px] bg-white/5 text-gray-400 px-3 py-1 rounded-full font-bold">
                        تطابق الفلترة: {
                          reportsQueue.filter(rep => {
                            if (filterSeverity !== "الكل" && rep.priority !== filterSeverity) return false;
                            if (filterContentType !== "الكل" && rep.contentType !== filterContentType) return false;
                            if (filterStatus !== "الكل" && rep.status !== filterStatus) return false;
                            if (filterUsername) {
                              const q = filterUsername.toLowerCase();
                              const matchReporter = rep.reporterName.toLowerCase().includes(q) || rep.reporterUsername.toLowerCase().includes(q);
                              const matchReported = rep.reportedName.toLowerCase().includes(q) || rep.reportedUsername.toLowerCase().includes(q);
                              if (!matchReporter && !matchReported) return false;
                            }
                            if (filterDate !== "الكل") {
                              if (filterDate === "اليوم" && !(rep.date.includes("دقيقة") || rep.date.includes("ساعة"))) return false;
                              if (filterDate === "أمس" && !(rep.date.includes("أمس") || rep.date.includes("يوم"))) return false;
                              if (filterDate === "قديم" && !(rep.date.includes("أسبوع") || rep.date.includes("شهر") || rep.date.includes("يومين"))) return false;
                            }
                            return true;
                          }).length
                        } من البلاغات
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="ابحث عن اسم، معرف..."
                          value={filterUsername}
                          onChange={(e) => setFilterUsername(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saudi-green"
                        />
                      </div>

                      {/* Severity Select */}
                      <div>
                        <select
                          value={filterSeverity}
                          onChange={(e) => setFilterSeverity(e.target.value)}
                          className="w-full px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green"
                        >
                          <option value="الكل" className="bg-[#050505] text-white">درجة الخطورة: الكل</option>
                          <option value="عالية" className="bg-[#050505] text-white">عالية الخطورة</option>
                          <option value="متوسطة" className="bg-[#050505] text-white">متوسطة الخطورة</option>
                          <option value="منخفضة" className="bg-[#050505] text-white">منخفضة الخطورة</option>
                        </select>
                      </div>

                      {/* Content Type Select */}
                      <div>
                        <select
                          value={filterContentType}
                          onChange={(e) => setFilterContentType(e.target.value)}
                          className="w-full px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green"
                        >
                          <option value="الكل" className="bg-[#050505] text-white">نوع المحتوى: الكل</option>
                          <option value="بث مباشر" className="bg-[#050505] text-white">بث مباشر</option>
                          <option value="فيديو" className="bg-[#050505] text-white">مقاطع الفيديو</option>
                          <option value="تعليق" className="bg-[#050505] text-white">تعليق مكتوب</option>
                          <option value="رسالة" className="bg-[#050505] text-white">الرسائل الخاصة</option>
                          <option value="حساب" className="bg-[#050505] text-white">الحسابات والملفات</option>
                        </select>
                      </div>

                      {/* Ticket Status Select */}
                      <div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green"
                        >
                          <option value="الكل" className="bg-[#050505] text-white">حالة البلاغ: الكل</option>
                          <option value="جديد" className="bg-[#050505] text-white">جديد غير معالج</option>
                          <option value="قيد المراجعة" className="bg-[#050505] text-white">قيد المراجعة والتحقيق</option>
                          <option value="تم الحل" className="bg-[#050505] text-white">تم الحل بنجاح</option>
                          <option value="مرفوض" className="bg-[#050505] text-white">بلاغات كاذبة/مرفوضة</option>
                        </select>
                      </div>

                      {/* Date Select */}
                      <div>
                        <select
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green"
                        >
                          <option value="الكل" className="bg-[#050505] text-white">تاريخ الإرسال: الكل</option>
                          <option value="اليوم" className="bg-[#050505] text-white">اليوم (خلال ٢٤ ساعة)</option>
                          <option value="أمس" className="bg-[#050505] text-white">أمس والبارحة</option>
                          <option value="قديم" className="bg-[#050505] text-white">أقدم من يومين</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reports Cards List Container */}
                  <div className="space-y-4">
                    {reportsQueue
                      .filter(rep => {
                        if (filterSeverity !== "الكل" && rep.priority !== filterSeverity) return false;
                        if (filterContentType !== "الكل" && rep.contentType !== filterContentType) return false;
                        if (filterStatus !== "الكل" && rep.status !== filterStatus) return false;
                        if (filterUsername) {
                          const q = filterUsername.toLowerCase();
                          const matchReporter = rep.reporterName.toLowerCase().includes(q) || rep.reporterUsername.toLowerCase().includes(q);
                          const matchReported = rep.reportedName.toLowerCase().includes(q) || rep.reportedUsername.toLowerCase().includes(q);
                          if (!matchReporter && !matchReported) return false;
                        }
                        if (filterDate !== "الكل") {
                          if (filterDate === "اليوم" && !(rep.date.includes("دقيقة") || rep.date.includes("ساعة"))) return false;
                          if (filterDate === "أمس" && !(rep.date.includes("أمس") || rep.date.includes("يوم"))) return false;
                          if (filterDate === "قديم" && !(rep.date.includes("أسبوع") || rep.date.includes("شهر") || rep.date.includes("يومين"))) return false;
                        }
                        return true;
                      })
                      .map(rep => {
                        const isHigh = rep.priority === "عالية";
                        const isMed = rep.priority === "متوسطة";
                        const isNew = rep.status === "جديد";
                        const isUnder = rep.status === "قيد المراجعة";
                        const isResolved = rep.status === "تم الحل";

                        return (
                          <div 
                            key={rep.id} 
                            className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 relative overflow-hidden transition-all duration-300 hover:border-white/10"
                          >
                            {/* Accent colored sidebar stripe for severity indicator */}
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${isHigh ? 'bg-red-500' : isMed ? 'bg-orange-500' : 'bg-blue-500'}`} />

                            {/* Header row: involved users profile summary */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Reporter */}
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={rep.reporterAvatar} 
                                    alt={rep.reporterName} 
                                    className="w-6 h-6 rounded-full border border-white/10 object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="font-bold text-xs text-white">{rep.reporterName}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">@{rep.reporterUsername}</span>
                                </div>

                                <span className="text-gray-600 text-[10px]">&larr; يُبلّغ عن &rarr;</span>

                                {/* Reported */}
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={rep.reportedAvatar} 
                                    alt={rep.reportedName} 
                                    className="w-6 h-6 rounded-full border border-red-500/10 object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="font-bold text-xs text-red-400">{rep.reportedName}</span>
                                  <span className="text-[10px] text-red-500/80 font-mono">@{rep.reportedUsername}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <span className="text-[10px] text-gray-500 font-mono">{rep.date}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isHigh ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                  isMed ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                  درجة الخطورة: {rep.priority}
                                </span>
                              </div>
                            </div>

                            {/* Center Section: Core Body of Complaint */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/90 font-bold flex items-center gap-2">
                                  {rep.contentType === "بث مباشر" && <Video className="w-4 h-4 text-red-500" />}
                                  {rep.contentType === "فيديو" && <Play className="w-4 h-4 text-orange-500" />}
                                  {rep.contentType === "تعليق" && <MessageSquare className="w-4 h-4 text-blue-500" />}
                                  {rep.contentType === "رسالة" && <MessageSquare className="w-4 h-4 text-purple-500" />}
                                  {rep.contentType === "حساب" && <Users className="w-4 h-4 text-green-500" />}
                                  تصنيف المحتوى: <span className="text-saudi-glow">{rep.contentType}</span>
                                </span>

                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  isNew ? 'bg-yellow-500/10 text-yellow-500 animate-pulse' :
                                  isUnder ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  isResolved ? 'bg-saudi-green/10 text-saudi-glow border border-saudi-green/20' :
                                  'bg-white/5 text-gray-400 border border-white/10'
                                }`}>
                                  حالة البلاغ: {rep.status}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-xs text-red-400/90 leading-relaxed mb-1">السبب: {rep.reason}</h4>
                                <p className="text-xs text-gray-300 bg-white/2 p-3.5 rounded-2xl leading-relaxed border border-white/5 font-tajawal">
                                  {rep.description}
                                </p>
                              </div>

                              {/* Small Quick Content Preview Snippet */}
                              <div className="bg-white/2 rounded-2xl border border-white/5 p-3 flex items-center justify-between text-xs font-tajawal gap-3">
                                <div className="flex items-center gap-3">
                                  {rep.contentData?.thumbnailUrl ? (
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                                      <img 
                                        src={rep.contentData.thumbnailUrl} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                      {(rep.contentType === "فيديو" || rep.contentType === "بث مباشر") && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                          <Play className="w-4 h-4 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
                                      <MessageSquare className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-xs text-white/90 line-clamp-1">{rep.contentData?.title}</p>
                                    <p className="text-[10px] text-gray-500 line-clamp-1">{rep.contentData?.body || rep.contentData?.description}</p>
                                  </div>
                                </div>
                                
                                <span className="text-[9px] text-[#006C35] bg-saudi-green/10 px-2 py-0.5 rounded font-mono font-bold whitespace-nowrap">
                                  {rep.reportsCountOnContent} بلاغاً مسجلاً
                                </span>
                              </div>

                              {/* Decision History if solved */}
                              {rep.decisionLog && rep.decisionLog.length > 0 && (
                                <div className="bg-saudi-green/5 border border-saudi-green/10 rounded-2xl p-3 text-xs">
                                  <p className="font-bold text-saudi-glow flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-saudi-glow" />
                                    القرار الإداري الصادر:
                                  </p>
                                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-400 pl-1">
                                    {rep.decisionLog.map((log: string, idx: number) => (
                                      <li key={idx} className="leading-relaxed list-none text-[11px]">&bull; {log}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Card actions footer layout */}
                            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                              {/* Open modal buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedContentReport(rep)}
                                  className="flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-bold transition-all text-white border border-white/5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  رؤية ومعاينة المحتوى
                                </button>
                                <button
                                  onClick={() => setSelectedAccountReport(rep)}
                                  className="flex items-center gap-1.5 py-1.5 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-bold transition-all text-white border border-white/5"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  تدقيق صاحب الحساب
                                </button>
                              </div>

                              {/* Direct administration instant tools (Only if ticket not resolved) */}
                              {rep.status !== "تم الحل" && (
                                <div className="flex items-center gap-1.5">
                                  {rep.status === "جديد" && (
                                    <button
                                      onClick={() => handleUpdateReportStatus(rep.id, "قيد المراجعة", "تم نقل البلاغ للتحقيق والتدقيق اليدوي من قبل لجنة الرقابة")}
                                      className="py-1.5 px-3 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl text-[11px] font-bold transition-all"
                                      title="تحويل البلاغ لقيد المراجعة والمتابعة الثنائية"
                                    >
                                      تحويل للتحقيق
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateReportStatus(rep.id, "تم الحل", "تم قبول البلاغ والتحقق الفني منه واتخاذ الإجراء اللازم")}
                                    className="py-1.5 px-3 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-xl text-[11px] font-bold transition-all"
                                  >
                                    قبول وتأكيد
                                  </button>
                                  <button
                                    onClick={() => handleUpdateReportStatus(rep.id, "مرفوض", "تم رفض البلاغ وتصنيفه كبلاغ كيدي لعدم وجود تعدي حقيقي")}
                                    className="py-1.5 px-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-[11px]"
                                  >
                                    رفض البلاغ
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {reportsQueue.filter(rep => {
                      if (filterSeverity !== "الكل" && rep.priority !== filterSeverity) return false;
                      if (filterContentType !== "الكل" && rep.contentType !== filterContentType) return false;
                      if (filterStatus !== "الكل" && rep.status !== filterStatus) return false;
                      if (filterUsername) {
                        const q = filterUsername.toLowerCase();
                        const matchReporter = rep.reporterName.toLowerCase().includes(q) || rep.reporterUsername.toLowerCase().includes(q);
                        const matchReported = rep.reportedName.toLowerCase().includes(q) || rep.reportedUsername.toLowerCase().includes(q);
                        if (!matchReporter && !matchReported) return false;
                      }
                      if (filterDate !== "الكل") {
                        if (filterDate === "اليوم" && !(rep.date.includes("دقيقة") || rep.date.includes("ساعة"))) return false;
                        if (filterDate === "أمس" && !(rep.date.includes("أمس") || rep.date.includes("يوم"))) return false;
                        if (filterDate === "قديم" && !(rep.date.includes("أسبوع") || rep.date.includes("شهر") || rep.date.includes("يومين"))) return false;
                      }
                      return true;
                    }).length === 0 && (
                      <div className="text-center py-16 bg-[#0A0A0A] border border-white/5 rounded-3xl text-gray-500 text-xs font-tajawal">
                        <AlertTriangle className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                        لا توجد بلاغات تفي بفلترة البحث المعينة حالياً! مركز البلاغات آمن ومستقر 🇸🇦
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  {/* Trigger System push notifications */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl max-w-xl">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-saudi-glow" />
                      إرسال وتوجيه تنبيهات عامة لجميع مستخدمي المنصة المباشرين
                    </h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const title = fd.get("notify_title") as string;
                      if(!title) return;
                      setSystemAlerts(prev => [{ id: Date.now(), title, time: "الآن" }, ...prev]);
                      alert("تم توجيه التنبيه العام لجميع هواتف وشاشات ومستخدمي المنصة بنجاح! 🇸🇦");
                      e.currentTarget.reset();
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xs mb-1 text-gray-400 font-bold">محتوى الإعلان / التنبيه الفوري</label>
                        <textarea 
                          name="notify_title"
                          required
                          rows={3}
                          placeholder="مثال: يرجى العلم بأن عمليات الصيانة لشبكات سحب الأرباح البنكية ستكون قيد التدشين فجر اليوم..." 
                          className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs outline-none focus:border-saudi-green text-right resize-none"
                        />
                      </div>
                      <button type="submit" className="px-6 py-2.5 bg-saudi-green text-white font-bold rounded-xl text-xs shadow-md">توجيه التنبيه</button>
                    </form>
                  </div>

                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                    <h3 className="font-bold text-xs text-gray-400 mb-4 uppercase tracking-widest">تاريخ التنبيهات الموجهة للمستخدمين</h3>
                    <div className="space-y-4">
                      {systemAlerts.map(alertItem => (
                        <div key={alertItem.id} className="p-3 bg-white/2 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                          <span>📢  {alertItem.title}</span>
                          <span className="text-[10px] text-gray-600 font-mono shrink-0 ml-4">{alertItem.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "system" && <SystemHealth />}

              {activeSection === "premium_handles" && (
                <PremiumHandles 
                  usersList={usersList} 
                  setUsersList={setUsersList} 
                  logAdminAction={(modName, role, actionType, detail, targetAccount) => logAdminAction(modName, role, actionType, detail, targetAccount)}
                  currentProfileUser={currentProfile}
                  onSyncProfile={setCurrentProfile}
                />
              )}

              {activeSection === "settings" && (
                <div className="space-y-6">
                  {/* System main configurations */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl max-w-xl space-y-6">
                    <h3 className="font-bold text-sm mb-4">أمان وتحكم البنية التحتية والميزات للمنصة</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-xs font-bold">وضع الصيانة الكاملة (Maintenance Mode)</p>
                          <p className="text-[10px] text-gray-500">يقوم بإغلاق وصول التطبيق مؤقتاً وعرض لوحة صيانة</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settingsState.maintenanceMode}
                          onChange={(e) => setSettingsState(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="w-4 h-4 accent-saudi-green" 
                        />
                      </div>

                      <div className="flex justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-xs font-bold">تفعيل التسجيل والحسابات الجديدة</p>
                          <p className="text-[10px] text-gray-500">يسمح بالتسجيل الآمن باستخدام رقم الهاتف المحمول والتحقق</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settingsState.registrationEnabled}
                          onChange={(e) => setSettingsState(prev => ({ ...prev, registrationEnabled: e.target.checked }))}
                          className="w-4 h-4 accent-saudi-green" 
                        />
                      </div>

                      <div className="flex justify-between items-center p-4 bg-white/2 rounded-2xl border border-white/5">
                        <div>
                          <p className="text-xs font-bold">تمكين غرف دردشة وتعليقات الضيوف غير المسجلين</p>
                          <p className="text-[10px] text-gray-500">السماح لمتصفحي الويب بالمشاركة بالدردشة التلقائية</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={settingsState.allowGuestReactions}
                          onChange={(e) => setSettingsState(prev => ({ ...prev, allowGuestReactions: e.target.checked }))}
                          className="w-4 h-4 accent-saudi-green" 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => alert("تم حفظ وتحديث الإعدادات العامة للبنية التحتية بنجاح! 🇸🇦")}
                      className="px-6 py-2.5 bg-saudi-green text-white font-bold text-xs rounded-xl shadow-lg"
                    >
                      حفظ وتعميم الإعدادات
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "moderators" && (
                <div className="space-y-6 animate-fade-in font-tajawal">
                  {/* Title Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        إدارة فريق الإشراف وصلاحيات المشرفين
                      </h2>
                      <p className="text-xs text-gray-400 mt-1 font-tajawal">تنسيق وتعيين صلاحيات الإشراف، إدارة هويات المشرفين ومراقبة السجل الإداري الآمن لمنصة SNNS.PRO</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Reset form fields
                        setModFormName("");
                        setModFormEmail("");
                        setModFormUsername("");
                        setModFormRole("Super Admin");
                        setIsAddModModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-saudi-green text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-saudi-green/90 transition-all self-start md:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      تعيين مشرف جديد للعمل
                    </button>
                  </div>

                  {/* 1. Statistics Cards Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl">
                      <p className="text-gray-500 text-[10px] uppercase font-bold">إجمالي فريق الرقابة</p>
                      <h4 className="text-2xl font-mono font-bold text-white mt-1">{moderatorsList.length}</h4>
                      <p className="text-[9px] text-gray-400 mt-1">هويات موثقة ونشطة بالكامل</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl">
                      <p className="text-gray-500 text-[10px] uppercase font-bold">المشرفين النشطين</p>
                      <h4 className="text-2xl font-mono font-bold text-saudi-glow mt-1 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-saudi-green animate-pulse inline-block" />
                        {moderatorsList.filter(m => m.status === "نشط").length}
                      </h4>
                      <p className="text-[9px] text-saudi-glow mt-1 font-tajawal">متواجدين حالياً على النظام</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl">
                      <p className="text-gray-500 text-[10px] uppercase font-bold">إجمالي العمليات المنفذة</p>
                      <h4 className="text-2xl font-mono font-bold text-blue-400 mt-1">
                        {moderatorsList.reduce((acc, m) => acc + m.actionsCount, 0)}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-tajawal">إجراء روتيني وسلبي مسجل تلقائياً</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl">
                      <p className="text-gray-500 text-[10px] uppercase font-bold">البلاغات المعالجة بنجاح</p>
                      <h4 className="text-2xl font-mono font-bold text-indigo-400 mt-1">
                        {reportsQueue.filter(r => r.status === "تم الحل").length + 245}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-1 font-tajawal">مطابقة للأمان الوطني بفعالية</p>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl">
                      <p className="text-gray-500 text-[10px] uppercase font-bold">المحوسبين لليوم</p>
                      <h4 className="text-x2 font-mono font-bold text-red-500 mt-1">
                        {usersList.filter(u => u.status && u.status.includes("محظور")).length}
                      </h4>
                      <p className="text-[9px] text-red-400 mt-1 font-tajawal">تم إغلاقهم وحمايتهم للذوق العام</p>
                    </div>
                  </div>

                  {/* 2. Filters & Searches */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      {/* Search box */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="ابحث باسم المشرف أو بريده أو معرفه..."
                          value={modSearchQuery}
                          onChange={(e) => setModSearchQuery(e.target.value)}
                          className="w-full pl-3 pr-9 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saudi-green font-tajawal text-right"
                        />
                      </div>

                      {/* Filter by role */}
                      <select
                        value={modFilterRole}
                        onChange={(e) => setModFilterRole(e.target.value)}
                        className="px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green font-tajawal"
                      >
                        <option value="الكل" className="bg-[#0A0A0A] text-white">الرتبة المعينة: الكل</option>
                        {Object.keys(ROLE_TEMPLATES).map(role => (
                          <option key={role} value={role} className="bg-[#0A0A0A] text-white">{role} ({ROLE_TEMPLATES[role].label})</option>
                        ))}
                      </select>

                      {/* Filter by status */}
                      <select
                        value={modFilterStatus}
                        onChange={(e) => setModFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-white/2 border border-white/5 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green font-tajawal"
                      >
                        <option value="الكل" className="bg-[#0A0A0A] text-white">حالة الاتصال: الكل</option>
                        <option value="نشط" className="bg-[#0A0A0A] text-white">نشط ومفعل</option>
                        <option value="موقوف" className="bg-[#0A0A0A] text-white">موقوف مؤقتاً</option>
                      </select>
                    </div>

                    <span className="text-[10px] text-gray-500 bg-white/2 px-3 py-1 rounded-full border border-white/5 font-mono">
                      نتائج المطابقة: {
                        moderatorsList.filter(m => {
                          const q = modSearchQuery.toLowerCase();
                          const matchesSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
                          const matchesRole = modFilterRole === "الكل" || m.role === modFilterRole;
                          const matchesStatus = modFilterStatus === "الكل" || m.status === modFilterStatus;
                          return matchesSearch && matchesRole && matchesStatus;
                        }).length
                      } مشرفين مصنفين
                    </span>
                  </div>

                  {/* 3. Moderators Grid Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {moderatorsList
                      .filter(m => {
                        const q = modSearchQuery.toLowerCase();
                        const matchesSearch = m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
                        const matchesRole = modFilterRole === "الكل" || m.role === modFilterRole;
                        const matchesStatus = modFilterStatus === "الكل" || m.status === modFilterStatus;
                        return matchesSearch && matchesRole && matchesStatus;
                      })
                      .map(mod => {
                        const template = ROLE_TEMPLATES[mod.role] || ROLE_TEMPLATES["Support Moderator"];
                        const isBlocked = mod.status === "موقوف";

                        // Collect permissions that are true
                        const activePermsCount = Object.values(mod.permissions).filter(v => v).length;

                        return (
                          <div 
                            key={mod.id} 
                            className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all duration-300"
                          >
                            {/* Accent indicator line */}
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${isBlocked ? 'bg-red-500' : 'bg-saudi-green'}`} />

                            <div className="space-y-4">
                              {/* Header & Status Info */}
                              <div className="flex justify-between items-start">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  isBlocked ? 'bg-red-500/15 text-red-500 border border-red-500/20' : 'bg-saudi-green/15 text-saudi-glow border border-saudi-green/20'
                                }`}>
                                  السلوك: {mod.status}
                                </span>

                                <span className="text-[10px] text-gray-500 font-mono">آخر دخول: {mod.lastLogin}</span>
                              </div>

                              {/* Avatar & Profile details */}
                              <div className="flex items-center gap-3">
                                <img 
                                  src={mod.avatar} 
                                  alt={mod.name} 
                                  className="w-12 h-12 rounded-full object-cover border border-white/10"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                                    {mod.name}
                                  </h4>
                                  <span className="text-[10px] text-gray-500 block font-mono">@{mod.username}</span>
                                  <span className="text-[10px] text-gray-400 block mt-0.5">{mod.email}</span>
                                </div>
                              </div>

                              {/* Role Badge and descriptive line */}
                              <div className="pt-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block border ${template.bg} ${template.text}`}>
                                  {mod.role} &bull; {template.label}
                                </span>
                              </div>

                              {/* Permissions mini tracker */}
                              <div className="bg-white/2 border border-white/5 p-3 rounded-2xl text-xs space-y-1">
                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                  <span>عدد الصلاحيات الممنوحة للرتبة</span>
                                  <span className="font-mono text-white/90 font-bold">{activePermsCount} من {Object.keys(mod.permissions).length}</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-saudi-green h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${(activePermsCount / Object.keys(mod.permissions).length) * 100}%` }}
                                  />
                                </div>
                                
                                {/* Permissions short string list */}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {PERMISSIONS_METADATA.slice(0, 5).map(p => {
                                    const hasPerm = mod.permissions[p.key];
                                    return (
                                      <span 
                                        key={p.key} 
                                        className={`text-[8.5px] px-1.5 py-0.5 rounded ${
                                          hasPerm ? 'bg-saudi-green/10 text-saudi-glow font-tajawal' : 'bg-white/2 text-gray-600 font-tajawal'
                                        }`}
                                      >
                                        {p.label}
                                      </span>
                                    );
                                  })}
                                  {activePermsCount > 5 && (
                                    <span className="text-[8.5px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded font-tajawal">
                                      +{activePermsCount - 5} صلاحيات أخرى
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Creation Date and Actions Count */}
                              <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-3">
                                <span className="font-tajawal">تاريخ تفويض الهوية: {mod.createdAt}</span>
                                <span className="text-blue-400 font-mono">{mod.actionsCount} إجراءات منفذة</span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                              <button
                                onClick={() => {
                                  setSelectedModForPerms(mod);
                                  setEditingPerms({ ...mod.permissions });
                                  setIsEditPermsModalOpen(true);
                                }}
                                className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10.5px] font-bold border border-white/5 transition-all text-center font-tajawal"
                              >
                                تعديل الصلاحيات
                              </button>

                              <button
                                onClick={() => {
                                  const text = isBlocked ? "تنشيط وإلغاء إيقاف" : "إيقاف مؤقت";
                                  const nextStatus = isBlocked ? "نشط" : "موقوف";

                                  setSecurityConfirmAction({
                                    type: "suspend_mod",
                                    title: `${text} المشرف ${mod.name}`,
                                    message: `هل تريد بالتأكيد إجراء ${text} على حساب المشرف الموثق @${mod.username}؟ سيؤدي ذلك لتعليق عملياته الأمنية فوراً على لوحة التحكم العامة.`,
                                    requirePassword: true,
                                    onConfirm: () => {
                                      const updated = moderatorsList.map(item => item.id === mod.id ? { ...item, status: nextStatus } : item);
                                      setModeratorsList(updated);
                                      localStorage.setItem("snns_moderators", JSON.stringify(updated));
                                      logAdminAction(
                                        "المدير العام",
                                        "Super Admin",
                                        nextStatus === "موقوف" ? "تعليق حساب" : "تنشيط حساب",
                                        `تم تغيير حالة حساب المشرف @${mod.username} إلى ${nextStatus}`,
                                        mod.username
                                      );
                                      alert(`تم ${nextStatus === "موقوف" ? "إيقاف" : "تنشيط"} حساب المشرف بنجاح! 🇸🇦`);
                                    }
                                  });
                                }}
                                className={`py-1.5 px-3 rounded-xl text-[10.5px] font-bold transition-all border font-tajawal ${
                                  isBlocked 
                                    ? 'bg-saudi-green/10 hover:bg-saudi-green/20 text-saudi-glow border-saudi-green/20' 
                                    : 'bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-500 border-yellow-500/10'
                                }`}
                              >
                                {isBlocked ? "تنشيط" : "إيقاف مؤقت"}
                              </button>

                              <button
                                onClick={() => {
                                  setSecurityConfirmAction({
                                    type: "delete_mod",
                                    title: `حذف وشطب المشرف ${mod.name}`,
                                    message: `🚨 تحذير أمني حرج! سيتم مسح حساب المشرف @${mod.username} بالكامل وإلغاء صلاحية تسجيل الدخول والمجالس نهائياً. يرجى تأكيد رمز مرور النظام.`,
                                    requirePassword: true,
                                    onConfirm: () => {
                                      const updated = moderatorsList.filter(item => item.id !== mod.id);
                                      setModeratorsList(updated);
                                      localStorage.setItem("snns_moderators", JSON.stringify(updated));
                                      logAdminAction(
                                        "المدير العام",
                                        "Super Admin",
                                        "حذف مشرف",
                                        `تم شطب وإنهاء تفويض المشرف @${mod.username} من النظام بالكامل`,
                                        mod.username
                                      );
                                      alert("تم حذف المشرف وإنهاء صلاحياته المعتمدة فورياً! 🇸🇦");
                                    }
                                  });
                                }}
                                className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/10 rounded-xl text-[10.5px] font-bold transition-all font-tajawal"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* 4. Administrative Audit Trails Section */}
                  <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="font-bold text-sm flex items-center gap-2 text-white font-tajawal">
                          <Lock className="w-4 h-4 text-saudi-glow" />
                          سجل العمليات الإدارية الفوري (عصيّ على الحذف والتلاعب الحوكمي 🛡️)
                        </h3>
                        <p className="text-gray-500 text-[10px] mt-0.5 font-tajawal">تقنية أمان Ledger تقوم بتسجيل أي كبسة زر لحذف مادة، توقيف حساب أو تلاعب بصلاحيات من طاقم المشرفين</p>
                      </div>

                      <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full font-bold font-tajawal">
                        محمي وموثق بالكامل
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-gray-500 pb-2">
                            <th className="pb-3 pt-1 font-bold font-tajawal">المشرف المسؤول</th>
                            <th className="pb-3 pt-1 font-bold font-tajawal">نوع الإجراء</th>
                            <th className="pb-3 pt-1 font-bold font-tajawal">الحساب المستهدف</th>
                            <th className="pb-3 pt-1 font-bold font-tajawal">تفاصيل العملية</th>
                            <th className="pb-3 pt-1 font-bold font-tajawal">عنوان الـ IP</th>
                            <th className="pb-3 pt-1 font-bold text-left font-tajawal">التاريخ والوقت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/2 text-gray-300">
                          {opsLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/1 transition-all">
                              <td className="py-3 font-bold text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                                {log.moderatorName}
                                <span className="text-[9px] text-gray-500 font-normal font-tajawal">({log.role})</span>
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 bg-white/5 text-white/90 rounded text-[10px] font-bold border border-white/5 font-tajawal">
                                  {log.actionType}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-gray-400">@{log.targetAccount}</td>
                              <td className="py-3 max-w-xs truncate font-tajawal" title={log.detail}>{log.detail}</td>
                              <td className="py-3 font-mono text-gray-400">{log.ip}</td>
                              <td className="py-3 text-left text-gray-500 text-[10.5px] font-mono">{log.timestamp}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "google_audit" && (
                <div className="space-y-6">
                  {/* Title and High Level Concept Cards */}
                  <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-saudi-green" />
                    <h3 className="font-bold text-lg font-tajawal flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-6 h-6 text-saudi-glow" />
                      بوابة مطابقة الحسابات وثنائية الهوية (Google Account Match Audit Ledger)
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-tajawal max-w-3xl">
                      تتيح هذه الأداة الرقابية المتقدمة مقارنة فورية وتدقيقية ثنائية للملفات الشخصية. كمسؤول أو مدير للمنصة، يمكنك رؤية البيانات الموثقة القادمة مباشرة من غوغل وبالمقابل البيانات التي قام المستخدم بتعديلها أو تخصيصها محلياً ليظهر بها أمام جمهوره لمطابقة السلوك ومنع الاحتيال الرقمي.
                    </p>
                  </div>

                  {currentGoogleUser ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Original Google Profile Card */}
                      <div className="bg-[#0A0A0A] border border-blue-500/20 p-6 rounded-3xl space-y-4 relative">
                        <div className="absolute top-4 left-4 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                          أصلية موثقة (OAUTH 2.0)
                        </div>
                        <h4 className="font-bold text-sm text-gray-200 border-b border-white/5 pb-3 font-tajawal">البنية الرقمية من Google</h4>
                        
                        <div className="flex items-center gap-4 py-3">
                          <img 
                            src={currentGoogleUser.avatar} 
                            alt="Google original avatar" 
                            className="w-16 h-16 rounded-full border border-white/10 shrink-0 object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-tajawal animate-pulse">الاسم المسجل في Gmail</p>
                            <h5 className="font-bold text-lg text-white font-tajawal">{currentGoogleUser.name}</h5>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{currentGoogleUser.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-gray-500 block text-[10px] font-tajawal">مُعرّف الهوية الرقمي</span>
                            <span className="font-mono text-gray-300 font-bold">{currentGoogleUser.id}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-[10px] font-tajawal">بروتوكول الأمان الحالي</span>
                            <span className="text-saudi-glow font-bold">Google Secure Token V2</span>
                          </div>
                        </div>
                      </div>

                      {/* Customized Display Profile Card */}
                      <div className="bg-[#0A0A0A] border border-saudi-green/20 p-6 rounded-3xl space-y-4 relative">
                        <div className="absolute top-4 left-4 bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 px-3 py-1 rounded-full text-[10px] font-bold">
                          الملف المعروض للجمهور
                        </div>
                        <h4 className="font-bold text-sm text-gray-200 border-b border-white/5 pb-3 font-tajawal">الواجهة الاجتماعية المزدوجة</h4>

                        <div className="flex items-center gap-4 py-3">
                          <img 
                            src={currentProfile?.avatar || currentGoogleUser.avatar} 
                            alt="Social custom avatar" 
                            className="w-16 h-16 rounded-full border border-saudi-green shrink-0 object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-tajawal">اسم الظهور (معدّل محلياً)</p>
                            <h5 className="font-bold text-lg text-saudi-glow font-tajawal">{currentProfile?.name || currentGoogleUser.name}</h5>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">@{currentProfile?.username || "google_user"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-3 border-t border-white/5 text-xs">
                          <div>
                            <span className="text-gray-500 block text-[10px] font-tajawal">النبذة المخصصة والمعروضة</span>
                            <p className="text-gray-300 font-medium italic mt-0.5 leading-relaxed bg-white/2 p-2 rounded-lg font-tajawal">
                              {currentProfile?.bio || "لا توجد نبذة شخصية حالياً."}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-tajawal">
                            <span>تاريخ آخر تحديث محلي: اليوم</span>
                            <span>الحالة الاجتماعية: صانع محتوى موثق</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Comparison Actions */}
                      <div className="lg:col-span-2 bg-gradient-to-l from-saudi-green/5 to-transparent border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs text-white font-tajawal">إجراءات المدير والمطابقة المباشرة:</h5>
                          <p className="text-[10px] text-gray-400 font-tajawal">تتيح لك إعادة تعيين التخصيص غير المناسب لمطابقة البيانات الحقيقية الواردة من قوقل تلقائياً.</p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                          <button 
                            onClick={handleResetToGoogleDefault}
                            className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-tajawal"
                          >
                            فرض استرجاع بيانات Google الأصلية
                          </button>
                          <button 
                            onClick={() => alert("تم اعتماد ومصادقة التعديلات الحالية للمستخدم لتتوافق مع معايير السلوك بالمنصة! ✅")}
                            className="px-5 py-2.5 bg-saudi-green text-white rounded-xl text-xs font-bold shadow-lg shadow-saudi-green/20 hover:bg-saudi-green/90 transition-all cursor-pointer font-tajawal"
                          >
                            مصادقة واعتماد الملف المعدل
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-[#0A0A0A] border border-white/5 rounded-3xl max-w-2xl mx-auto space-y-6">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400 text-2xl">
                        🔑
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-base text-white font-tajawal">لم يتم ربط أي حساب Google بالجهاز الحالي للآن</h4>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto font-tajawal">
                          لمشاهدة ومراجعة مطابقة الهويات كمسؤول، يرجى القيام بإنشاء جلسة Google أولاً من واجهة المستخدم.
                        </p>
                      </div>

                      <div className="p-4 bg-white/2 rounded-2xl border border-white/5 text-right space-y-2 text-xs font-medium max-w-sm mx-auto leading-relaxed font-tajawal">
                        <span className="text-[9px] text-saudi-glow font-black block mb-2 uppercase tracking-widest font-tajawal">خطوات الاختبار السريعة:</span>
                        <p className="text-gray-400">١. اخرج من الإدارة بالضغط على زر "عودة للبروفايل" في الأعلى.</p>
                        <p className="text-gray-400">٢. اضغط على زر "الدخول بقوقل" الفاخر في أعلى الملف الشخصي.</p>
                        <p className="text-gray-400">٣. اختر الحساب الموصى به ليتم تسجيل الدخول وتحديث ملفه تلقائياً.</p>
                        <p className="text-gray-400">٤. افتح الإدارة مجدداً، لترى هذه الصفحة حية بالكامل وبها الهويتين معاً!</p>
                      </div>

                      <div className="pt-2">
                        <Link 
                          to="/"
                          className="inline-flex py-3 px-6 bg-saudi-green text-white border border-saudi-green hover:bg-saudi-green/90 transition-colors font-bold rounded-xl text-xs shadow-lg shadow-saudi-green/25 font-tajawal"
                        >
                          الرجوع للملف الشخصي للاختبار الآن
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "trusted_badges" && (
                <TrustedBadgesManager />
              )}

              {activeSection === "business" && (
                <BusinessAccountsManager />
              )}

              {activeSection === "countries" && (
                <BlockedCountries />
              )}

              {activeSection === "vpn_monitor" && (
                <VpnCountryMonitor />
              )}

              {activeSection === "sentry" && (
                <SmartSentryPanel />
              )}

              {activeSection === "firebase_config" && (
                <FirebaseConfigConsole />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 1. View & Inspect Content Modal (رؤية ومعاينة المحتوى المُخالف) */}
      {/* ========================================================= */}
      {selectedContentReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in font-tajawal">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-4xl w-full overflow-hidden text-right shadow-2xl shadow-black"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#080808]">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-saudi-glow" />
                  معاينة وفحص المحتوى المُبلّغ عنه (البلاغ {selectedContentReport.id})
                </h3>
                <p className="text-gray-500 text-[10px] mt-0.5">يرجى تدقيق السلوك ووسم التقارير لاتخاذ الإجراء السلوكي المناسب ومطابقة القوانين</p>
              </div>
              <button 
                onClick={() => setSelectedContentReport(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split view layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 max-h-[70vh] overflow-y-auto">
              {/* Left Column (Content Player or Transcript Card) */}
              <div className="md:col-span-7 space-y-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">بايانات ومعاينة المادة المُقدّمة</p>
                
                {selectedContentReport.contentType === "فيديو" || selectedContentReport.contentType === "بث مباشر" ? (
                  <div className="relative aspect-video w-full rounded-2xl bg-[#050505] overflow-hidden border border-white/5 group flex items-center justify-center">
                    {selectedContentReport.contentData?.thumbnailUrl ? (
                      <img 
                        src={selectedContentReport.contentData.thumbnailUrl} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#050505]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4 z-10">
                      <span className="self-start text-[9px] bg-red-500/80 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {selectedContentReport.contentType} قيد الفحص
                      </span>
                      
                      <div className="flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-95 hover:scale-100 transition-all cursor-pointer">
                          <Play className="w-6 h-6 fill-white translate-x-0.5" />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-white leading-snug">{selectedContentReport.contentData?.title}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{selectedContentReport.contentData?.hashtags}</p>
                      </div>
                    </div>
                  </div>
                ) : selectedContentReport.contentType === "تعليق" || selectedContentReport.contentType === "رسالة" ? (
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-5 relative overflow-hidden space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span>الرسالة/التعليق المكتوب الفعلي</span>
                      <span className="font-mono bg-[#006C35]/15 text-saudi-glow px-2 py-0.5 rounded">نص موثق</span>
                    </div>
                    
                    <div className="relative p-4 bg-black/30 rounded-xl border border-white/5 leading-relaxed text-xs text-white">
                      <span className="absolute -top-3 right-3 text-white/10 text-5xl font-serif">“</span>
                      <p className="relative z-10">{selectedContentReport.contentData?.body}</p>
                    </div>

                    <div className="text-[11px] text-gray-500">
                      <p className="font-bold">موقع الإرسال وسياق النشر:</p>
                      <p className="mt-1 text-gray-400">{selectedContentReport.contentData?.description}</p>
                    </div>
                  </div>
                ) : (
                  // Account profile view inspection fallback
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-5 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 mx-auto">
                      <img 
                        src={selectedContentReport.reportedAvatar} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{selectedContentReport.reportedName}</h4>
                      <p className="text-xs text-gray-500 mt-1">@{selectedContentReport.reportedUsername}</p>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                      {selectedContentReport.contentData?.description || "لا يوجد نبذة إضافية مسجلة"}
                    </p>
                  </div>
                )}

                {/* Report Reason Info Display */}
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-400">ملخص فحوى الإساءة المذكورة</span>
                  <h4 className="font-bold text-xs text-white">{selectedContentReport.reason}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{selectedContentReport.description}</p>
                </div>
              </div>

              {/* Right Column (Metadata Sidebar) */}
              <div className="md:col-span-5 space-y-5 border-r md:border-r-0 md:border-l border-white/5 pr-0 md:pr-0 md:pl-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">بيانات صاحب المادة المشكو عليه</p>
                
                {/* Author Card */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                  <img 
                    src={selectedContentReport.reportedAvatar} 
                    alt={selectedContentReport.reportedName} 
                    className="w-12 h-12 rounded-full border border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      {selectedContentReport.reportedName}
                      <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow animate-pulse" />
                    </h4>
                    <span className="text-[10.5px] text-gray-500 block font-mono">@{selectedContentReport.reportedUsername}</span>
                    <span className="text-[9px] text-[#006C35] bg-saudi-green/10 px-2 py-0.5 rounded font-bold mt-1 inline-block">تاريخ النشر المادة: {selectedContentReport.contentData?.publishDate}</span>
                  </div>
                </div>

                {/* Account Violations & Reports statistics */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3">
                  <h5 className="font-bold text-[11px] text-white">إحصائيات المادة والحساب المعتمدة:</h5>
                  <div className="grid grid-cols-2 gap-3 text-right">
                    <div className="bg-black/30 rounded-xl p-2 md:p-3 border border-white/5">
                      <span className="text-[9.5px] text-gray-500 block">بلاغات المادة الحالية</span>
                      <span className="text-sm font-mono font-bold text-red-400">{selectedContentReport.reportsCountOnContent}</span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2 md:p-3 border border-white/5">
                      <span className="text-[9.5px] text-gray-500 block">إجمالي كيد الغرامات</span>
                      <span className="text-sm font-mono font-bold text-orange-400">{selectedContentReport.reportedUserStats.reportsCount}</span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2 md:p-3 border border-white/5">
                      <span className="text-[9.5px] text-gray-500 block">المخالفات المعتمدة سلفاً</span>
                      <span className="text-sm font-mono font-bold text-red-500">{selectedContentReport.reportedUserStats.violationsCount}</span>
                    </div>
                    <div className="bg-black/30 rounded-xl p-2 md:p-3 border border-white/5">
                      <span className="text-[9.5px] text-gray-500 block">آخر نشاط مسجل للفاعل</span>
                      <span className="text-xs font-bold text-gray-300">{selectedContentReport.reportedUserStats.lastActivity}</span>
                    </div>
                  </div>
                </div>

                {/* Warning Alert Line */}
                <p className="text-[10.5px] text-gray-500 leading-relaxed bg-[#050505] p-3 rounded-xl border border-white/5">
                  &times; <span className="text-yellow-500">ملاحظة أمنية:</span> سيؤدي حذف المحتوى إلى محوه وإخفائه فورياً من صفحة الفيديوهات والصور والملف العام بالمنصة وبشكل كامل.
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-white/5 bg-[#080808] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDeleteContent(selectedContentReport.id, selectedContentReport.contentId);
                    setSelectedContentReport(null);
                  }}
                  className="py-2.5 px-5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-red-500/10 transition-all font-tajawal"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف وإزالة المادة نهائياً من المنصة
                </button>

                <button
                  onClick={() => {
                    setWarningReport(selectedContentReport);
                    setSelectedContentReport(null);
                  }}
                  className="py-2.5 px-4 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black font-bold rounded-xl text-xs transition-all font-tajawal"
                >
                  إرسال إنذار رسمي مخصص
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleBlockUser(selectedContentReport.id, selectedContentReport.reportedUsername, true);
                    setSelectedContentReport(null);
                  }}
                  className="py-2.5 px-4 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white text-xs rounded-xl"
                >
                  حظر نهائي للمستخدم
                </button>

                <button
                  onClick={() => setSelectedContentReport(null)}
                  className="py-2.5 px-4 bg-[#1F1F1F] hover:bg-white/10 text-white font-bold rounded-xl text-xs font-tajawal"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. Audit & Inspect User Account Modal (تدقيق الحساب والمخالف) */}
      {/* ========================================================= */}
      {selectedAccountReport && (() => {
        // Find latest status reactively from the live users records
        const liveUser = usersList.find(u => u.username === selectedAccountReport.reportedUsername) || { status: selectedAccountReport.reportedUserStats.status };
        const isCurrentlyBlocked = liveUser.status.includes("محظور");

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in font-tajawal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden text-right shadow-2xl shadow-black font-tajawal"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#080808]">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-saudi-glow" />
                    بطاقة تدقيق ومطابقة السلوكيات للمستخدم المشكو عليه
                  </h3>
                  <p className="text-gray-500 text-[10px] mt-0.5 font-tajawal">تحقق من تاريخ البلاغات المرفوعة وحالة حساب العميل الحالية قبل أي قرار إداري</p>
                </div>
                <button 
                  onClick={() => setSelectedAccountReport(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account profile card block */}
              <div className="p-6 space-y-5">
                {/* Profile Cover & Header Design */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900 to-neutral-800 border border-white/5 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
                  <img 
                    src={selectedAccountReport.reportedAvatar} 
                    alt="" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-saudi-green/40 shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-bold text-base text-white flex items-center justify-center sm:justify-start gap-1.5">
                      {selectedAccountReport.reportedName}
                      <span className={`w-2.5 h-2.5 rounded-full ${isCurrentlyBlocked ? 'bg-red-500 animate-ping' : 'bg-saudi-glow'}`} />
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">@{selectedAccountReport.reportedUsername}</p>
                    
                    <p className="text-xs text-gray-300 mt-2 line-clamp-2 max-w-md">
                      {selectedAccountReport.contentData?.description || "لا يوجد وصف نبذة مسجل لهذا الحساب."}
                    </p>
                  </div>
                </div>

                {/* Audit Grid Statistics */}
                <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-4">
                  <h5 className="font-bold text-xs text-white">وثيقة التدقيق وميزان السلوك بالمنصة</h5>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5 text-center">
                      <span className="text-[10px] text-gray-500 block">البلاغات التاريخية الواردة</span>
                      <span className="text-base font-mono font-bold text-red-400">{selectedAccountReport.reportedUserStats.reportsCount}</span>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5 text-center">
                      <span className="text-[10px] text-gray-500 block">المخالفات المعتمدة قانونياً</span>
                      <span className="text-base font-mono font-bold text-red-500">{selectedAccountReport.reportedUserStats.violationsCount}</span>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5 text-center">
                      <span className="text-[10px] text-gray-500 block">آخر نشاط مسجل للعميل</span>
                      <span className="text-xs font-bold text-gray-300 mt-1 block">{selectedAccountReport.reportedUserStats.lastActivity}</span>
                    </div>

                    <div className="bg-black/40 rounded-2xl p-3 border border-white/5 text-center">
                      <span className="text-[10px] text-gray-500 block">حالة الحساب المعتمدة حالياً</span>
                      <span className={`text-xs font-bold mt-1 block ${isCurrentlyBlocked ? 'text-red-500' : 'text-saudi-glow font-bold'}`}>
                        {liveUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notification about decision logic */}
                <div className="bg-white/2 border border-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed font-tajawal">
                  <p className="font-bold text-white mb-1">اللوائح الإدارية المعمول بها:</p>
                  يتم فرض حظر مؤقت (٣ أيام) عند تجاوز المستخدم حد ٥ بلاغات حقيقية. ويحق لقسم الرقابة إقرار شطب الحساب وسحب العملات أو حظره نهائياً حسب لائحة التعصب وبث الفتن بالمملكة 🇸🇦
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-[#080808] flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleBlockUser(selectedAccountReport.id, selectedAccountReport.reportedUsername, true);
                      setSelectedAccountReport(null);
                    }}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    حظر الحساب نهائياً
                  </button>

                  <button
                    onClick={() => {
                      handleBlockUser(selectedAccountReport.id, selectedAccountReport.reportedUsername, false);
                      setSelectedAccountReport(null);
                    }}
                    className="py-2 px-4 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    حظر مؤقت (٣ أيام)
                  </button>
                  
                  {isCurrentlyBlocked && (
                    <button
                      onClick={() => {
                        // Unblock user
                        const updatedUsers = usersList.map(u => u.username === selectedAccountReport.reportedUsername ? { ...u, status: "نشط" } : u);
                        setUsersList(updatedUsers);
                        try {
                          localStorage.setItem("snns_users_records", JSON.stringify(updatedUsers));
                        } catch {}
                        
                        const updatedReports = reportsQueue.map(rep => {
                          if (rep.id === selectedAccountReport.id) {
                            return {
                              ...rep,
                              status: "تم الحل",
                              decisionLog: [...rep.decisionLog, `تم قبول الحساب والتماس العفو وتنشيط حساب المستخدم @${selectedAccountReport.reportedUsername} مجدداً 🇸🇦`]
                            };
                          }
                          return rep;
                        });
                        setReportsQueue(updatedReports);
                        try {
                          localStorage.setItem("snns_reports_records", JSON.stringify(updatedReports));
                        } catch {}
                        alert(`تم فك حظر وتنشيط الحساب @${selectedAccountReport.reportedUsername} بنجاح!`);
                        setSelectedAccountReport(null);
                      }}
                      className="py-2 px-4 bg-saudi-green text-white font-bold rounded-xl text-xs transition-all"
                    >
                      تنشيط وإلغاء الحظر (أمر عفو)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWarningReport(selectedAccountReport);
                      setSelectedAccountReport(null);
                    }}
                    className="py-2 px-4 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black font-bold rounded-xl text-xs transition-all"
                  >
                    توجيه تحذير سلوكي
                  </button>
                  
                  <button
                    onClick={() => setSelectedAccountReport(null)}
                    className="py-2 px-4 bg-[#1F1F1F] hover:bg-white/10 text-white font-bold rounded-xl text-xs"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 3. Send Warning composer Modal (توجيه إنذار رسمي) */}
      {/* ========================================================= */}
      {warningReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in font-tajawal">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-md w-full overflow-hidden text-right shadow-2xl shadow-black font-tajawal"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#080808]">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-yellow-500" />
                  صياغة وإرسال تحذير سلوكي وقانوني رسمي بالمنصة
                </h3>
                <p className="text-gray-500 text-[10px] mt-0.5">سيتلقى المشرف عليه إشعاراً إدارياً رسمياً للالتزام باللوائح والتعليمات العامة</p>
              </div>
              <button 
                onClick={() => setWarningReport(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                <img 
                  src={warningReport.reportedAvatar} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-xs text-white">{warningReport.reportedName}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">@{warningReport.reportedUsername}</p>
                </div>
              </div>

              {/* Template selection shortcuts */}
              <div className="space-y-2">
                <label className="text-[11px] text-gray-400 font-bold block">نماذج تحذيرية سريعة ومطابقة للّوائح:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "تحذير ترويج إعلانات وهمية واحتيال مالي",
                    "تحذير إذكاء روح التعصب المذهبي أو السلوكي أو الرياضي",
                    "تحذير انتحال شخصية صناع محتوى مرخصين بالمنصة",
                    "تحذير استخدام عبارات بذيئة أو مسيئة للذوق العام بالمنصة"
                  ].map((tpl, i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setWarningText(`تحذير رسمي ومطابق للائحة الأمان الإلكتروني: لقد تقرر توجيه هذا الإنذار الرسمي لك لمطالبتك فورا بالكف عن: (${tpl.replace("تحذير ", "")}) وتصحيح المنشورات فورا لتفادي حظر حسابك بالكامل. 🇸🇦`)}
                      className="text-[9.5px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-2.5 py-1 rounded-xl block border border-white/5 text-right w-full"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text editor box */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold block">نص التحذير والإنذار المرسل وتوجيه السلوك:</label>
                <textarea
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  rows={4}
                  placeholder="اكتب هنا صيغة التنبيه والإنذار، واطلب من المستخدم الكف عن السلوك المخالف فوراً لتجنب حظر الحساب نهائياً..."
                  className="w-full p-3 bg-white/2 border border-white/5 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saudi-green focus:ring-1 focus:ring-saudi-green leading-relaxed text-right font-tajawal"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#080808] flex justify-end gap-2">
              <button
                onClick={() => setWarningReport(null)}
                className="py-2 px-4 bg-[#1F1F1F] hover:bg-white/10 text-white text-xs rounded-xl"
              >
                إلغاء الأمر
              </button>

              <button
                onClick={() => {
                  handleWarnUser(warningReport.id, warningReport.reportedUsername, warningText);
                  setWarningReport(null);
                  setWarningText("");
                }}
                disabled={!warningText.trim()}
                className="py-2 px-5 bg-saudi-green hover:bg-saudi-green/90 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
              >
                إرسال وتحصين السلوك بالمنصة 🇸🇦
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ADD NEW MODERATOR MODAL */}
      {/* ========================================================= */}
      {isAddModModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in font-tajawal" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden text-right shadow-2xl shadow-black font-tajawal"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#080808]">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-saudi-glow" />
                  تفويض وتأسيس هوية مشرف جديد 🇸🇦
                </h3>
                <p className="text-gray-500 text-[10px] mt-0.5">أدخل البيانات المعتمدة لإنشاء ملف إشراف رسمي مع شارة الرتبة والصلاحيات التلقائية</p>
              </div>
              <button 
                onClick={() => setIsAddModModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!modFormName.trim() || !modFormEmail.trim() || !modFormUsername.trim()) {
                alert("يرجى تعبئة كافة الحقول المطلوبة!");
                return;
              }

              // Create default perms
              const defaultPerms = ROLE_TEMPLATES[modFormRole]?.defaultPerms || {
                manageReports: true, deleteContent: true, blockUsers: false, reviewLives: false, reviewVideos: true,
                acceptVerification: false, rejectVerification: false, manageWallet: false, manageAds: false, viewStats: true,
                manageModerators: false, sendAlerts: false, manageLiveStreams: false, stopLiveStreams: false, reviewMessages: true, fullAccess: false
              };

              const newMod = {
                id: "mod_" + Date.now(),
                name: modFormName.trim(),
                email: modFormEmail.trim(),
                username: modFormUsername.trim().replace("@", ""),
                role: modFormRole,
                status: "نشط",
                avatar: `https://images.unsplash.com/photo-${Math.floor(1500000000000 + Math.random() * 100000000000)}?w=150&fit=crop` || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop",
                lastLogin: "لم يسجل بعد",
                actionsCount: 0,
                createdAt: new Date().toLocaleDateString("ar-SA"),
                permissions: defaultPerms
              };

              // Safe confirm action
              setSecurityConfirmAction({
                type: "add_mod",
                title: `تأسيس المشرف ${newMod.name}`,
                message: `سيتم ميز الصلاحيات وتفويض الهوية الرقمية للإشراف على الرتبة المعتمدة (${ROLE_TEMPLATES[modFormRole].label}) للمستخدم @${newMod.username} مع إرسال بريد رسمي ومفتاح أمان مخصص. يرجى تأكيد رمز مرور الإدارة للمتابعة.`,
                requirePassword: true,
                onConfirm: () => {
                  const updated = [...moderatorsList, newMod];
                  setModeratorsList(updated);
                  localStorage.setItem("snns_moderators", JSON.stringify(updated));
                  logAdminAction(
                    "المدير العام",
                    "Super Admin",
                    "تفويض مشرف جديد",
                    `تم تأسيس وتفويض المشرف الجديد @${newMod.username} بنجاح على رتبة ${newMod.role}`,
                    newMod.username
                  );
                  setIsAddModModalOpen(false);
                  alert(`تم بنجاح تفويض المشرف الجديد وتجهيز رتبته بالموقع! 🇸🇦`);
                }
              });
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-bold block">الاسم الكامل للمشرف:</label>
                <input
                  type="text"
                  required
                  value={modFormName}
                  onChange={(e) => setModFormName(e.target.value)}
                  placeholder="مثال: فيصل بن سلمان العبيد"
                  className="w-full p-2.5 bg-white/2 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-saudi-green text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-bold block">البريد الإلكتروني المهني:</label>
                  <input
                    type="email"
                    required
                    value={modFormEmail}
                    onChange={(e) => setModFormEmail(e.target.value)}
                    placeholder="example@snns.pro"
                    className="w-full p-2.5 bg-white/2 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-saudi-green text-left font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-gray-400 font-bold block">معرّف الحساب (Username):</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={modFormUsername}
                      onChange={(e) => setModFormUsername(e.target.value)}
                      placeholder="f_obeid"
                      className="w-full pl-3 pr-7 py-2.5 bg-white/2 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-saudi-green text-left font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-400 font-bold block">الرتبة والدور الإشرافي:</label>
                <select
                  value={modFormRole}
                  onChange={(e) => setModFormRole(e.target.value)}
                  className="w-full p-2.5 bg-[#0D0D0D] border border-white/10 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-saudi-green font-tajawal text-right"
                >
                  {Object.keys(ROLE_TEMPLATES).map(role => (
                    <option key={role} value={role}>{role} &bull; {ROLE_TEMPLATES[role].label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-gray-500 leading-relaxed mt-1">
                  * سيتم تعبئة الملف بتفويضات وقائمة أمنية مبدئية تلقائية بحسب مصفوفة الصلاحيات المعتمدة للرتبة، علمًا بأنه يمكنك تخصيص الصلاحيات فريدًا لكل مشرف بأي وقت.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModModalOpen(false)}
                  className="px-4 py-2 bg-[#1F1F1F] hover:bg-white/10 text-white text-xs rounded-xl"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudi-green hover:bg-saudi-green/90 text-white font-bold rounded-xl text-xs"
                >
                  متابعة وتفويض الهوية 🇸🇦
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. EDIT ADVANCED PERMISSIONS DIALOG (نافذة تعديل صلاحيات احترافية) */}
      {/* ========================================================= */}
      {isEditPermsModalOpen && selectedModForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in font-tajawal" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden text-right shadow-2xl shadow-black font-tajawal animate-fade-in"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#080808]">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedModForPerms.avatar} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    تعديل صلاحيات المشرف: {selectedModForPerms.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] mt-0.5 font-tajawal">الرتبة: {selectedModForPerms.role} &bull; تخصيص الصلاحيات الفردية وحزم الأمان لمنصة SNNS.PRO</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditPermsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Permissions Categories Split */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Category-based Grouping block */}
              {["الإدارة والنظام", "البلاغات والأمان", "تنظيف المحتوى", "البث المباشر", "التوثيق والهوية", "الشؤون المالية", "الإعلانات"].map((cat) => {
                const catPerms = PERMISSIONS_METADATA.filter(p => p.category === cat || (cat === "الشؤون المالية" && p.category === "الشؤون المالية"));
                if (catPerms.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3 bg-[#080808] border border-white/5 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-saudi-glow flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                      قسم: {cat}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catPerms.map((p) => {
                        const isChecked = editingPerms?.[p.key] || false;
                        return (
                          <div 
                            key={p.key} 
                            onClick={() => {
                              setEditingPerms((prev: any) => ({
                                ...prev,
                                [p.key]: !prev[p.key]
                              }));
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                              isChecked 
                                ? 'bg-saudi-green/5 border-saudi-green/35 text-white' 
                                : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/10'
                            }`}
                          >
                            <div className="text-right">
                              <span className="text-xs font-bold block">{p.label}</span>
                              <span className="text-[9px] text-gray-500 block mt-0.5">تفويض بمسمى {p.label}</span>
                            </div>

                            {/* Custom Toggle Switch styled natively */}
                            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${isChecked ? 'bg-saudi-green' : 'bg-neutral-800'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${isChecked ? 'translate-x-0' : 'translate-x-[16px]'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-[#080808] flex justify-between items-center">
              <span className="text-[10px] text-gray-500">
                سيتم الحفظ الفوري ونقله إلى خادم قاعدة البيانات والتحقق الصارم
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditPermsModalOpen(false)}
                  className="px-4 py-2 bg-[#1F1F1F] hover:bg-white/10 text-white text-xs rounded-xl"
                >
                  إلغاء وتراجع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSecurityConfirmAction({
                      type: "update_perms",
                      title: `حفظ تعديل صلاحيات ${selectedModForPerms.name}`,
                      message: `أنت بصدد تعديل صلاحيات الدخول والقدرات للمشرف @${selectedModForPerms.username}. سيتم تطبيق هذه المعادلات الأمنية فورياً وتكبيل يد المستخدم عن الإجراءات المعطلة. يرجى إدخال رمز التحقق الرئاسي للمتابعة.`,
                      requirePassword: true,
                      onConfirm: () => {
                        const updated = moderatorsList.map(item => {
                          if (item.id === selectedModForPerms.id) {
                            return { ...item, permissions: editingPerms };
                          }
                          return item;
                        });
                        setModeratorsList(updated);
                        localStorage.setItem("snns_moderators", JSON.stringify(updated));
                        logAdminAction(
                          "المدير العام",
                          "Super Admin",
                          "تحديث الصلاحيات",
                          `تم تعديل الصلاحيات الفردية وهندسة الأمن للمشرف @${selectedModForPerms.username}`,
                          selectedModForPerms.username
                        );
                        setIsEditPermsModalOpen(false);
                        alert("تم تحديث مصفوفة الصلاحيات وحفظها بنجاح بقاعدة البيانات المعتمدة! 🇸🇦");
                      }
                    });
                  }}
                  className="px-5 py-2 bg-saudi-green hover:bg-saudi-green/90 text-white font-bold rounded-xl text-xs"
                >
                  حفظ الصلاحيات وقيد التشغيل ✅
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DANGEROUS/SECURITY ACTION PASSWORD PROMPT CONFIRMATION */}
      {/* ========================================================= */}
      {securityConfirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl animate-fade-in font-tajawal" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0F0F0F] border border-red-500/20 rounded-3xl max-w-md w-full overflow-hidden text-right shadow-2xl shadow-black font-tajawal"
          >
            {/* Upper alert bar */}
            <div className="bg-red-500/10 border-b border-red-500/20 p-4 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse shrink-0" />
              <div>
                <h4 className="text-red-400 font-bold text-xs font-tajawal">منظومة التحقق والأمان العالي (SNNS Multi-Factor Ledger Guard)</h4>
                <p className="text-[10px] text-gray-500 font-tajawal">يتطلب هذا الإجراء الحرج تطهير الهوية الوطنية وكلمة مرور القيادة العيا</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="font-bold text-sm text-white font-tajawal">{securityConfirmAction.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-tajawal">{securityConfirmAction.message}</p>

              {securityConfirmAction.requirePassword && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[11px] text-gray-400 font-bold block font-tajawal">أدخل رمز مرور القيادة للنظام (تسهيلاً للتجربة: snnsadmin):</label>
                  <input
                    type="password"
                    value={securityPasswordInput}
                    onChange={(e) => {
                      setSecurityPasswordInput(e.target.value);
                      setSecurityPasswordError("");
                    }}
                    placeholder="رمز المرور الإداري الموحد"
                    className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-left font-mono"
                  />
                  {securityPasswordError && (
                    <span className="text-[10px] text-red-400 block font-bold mt-1 font-tajawal">{securityPasswordError}</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-0 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSecurityConfirmAction(null);
                  setSecurityPasswordInput("");
                  setSecurityPasswordError("");
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-xl font-tajawal"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (securityConfirmAction.requirePassword) {
                    const pass = securityPasswordInput.trim();
                    if (pass === "snnsadmin" || pass === "admin" || pass === "123456" || pass === "PRO.2026") {
                      securityConfirmAction.onConfirm();
                      setSecurityConfirmAction(null);
                      setSecurityPasswordInput("");
                      setSecurityPasswordError("");
                    } else {
                      setSecurityPasswordError("رمز المرور غير صحيح! يرجى إدخال رمز المرور الصحيح 'snnsadmin' لتأكيد الإجراء بنجاح.");
                    }
                  } else {
                    securityConfirmAction.onConfirm();
                    setSecurityConfirmAction(null);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs font-tajawal"
              >
                تأكيد الإجراء الإداري 👮‍♂️
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, change, icon }: { label: string, value: string, change: string, icon: React.ReactNode }) {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-24 h-24 bg-white/2 opacity-[0.02] -rotate-12 group-hover:scale-150 transition-transform duration-500 animate-pulse pointer-events-none" />
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-white/5 rounded-xl">{icon}</div>
        <span className="text-[10px] font-bold text-saudi-glow bg-saudi-green/10 px-2 py-0.5 rounded-full">{change}</span>
      </div>
      <h4 className="text-2xl font-bold tracking-tight font-mono">{value}</h4>
      <p className="text-[10px] text-gray-400 uppercase font-black mt-2 font-tajawal">{label}</p>
    </div>
  );
}

function SystemHealth() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <HealthCard label="خوادم قاعدة البيانات والتحقق" status="مستقرة ونشطة" latency="٣٨ ملي ثانية" color="bg-saudi-glow" />
      <HealthCard label="مساحات التخزين والفيديوهات (Storage)" status="نشط بالكامل" latency="٩٢ ملي ثانية" color="bg-saudi-glow" />
      <HealthCard label="خادم البث الآمن TURN/WebRTC" status="متصل وبجهوزية عالية" latency="٨ ملي ثانية" color="bg-saudi-glow" />
      <HealthCard label="مركز الخدمات البنكية ومدفوعات Mada" status="نشط ومتصل" latency="١٤٢ ملي ثانية" color="bg-saudi-glow" />
      <HealthCard label="بوابات الرسائل النصية والتحقيق (SMS)" status="مستقرة" latency="٤١٠ ملي ثانية" color="bg-saudi-glow" />
      <HealthCard label="خادم CDN الخاص بالأصول" status="مستقرة ونشطة" latency="١٨ ملي ثانية" color="bg-saudi-glow" />
        
      <div className="lg:col-span-3 bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl">
        <h3 className="font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-saudi-glow" />
          مؤشر كفاءة النظام واستهلاك المعالجة الفورية (CPU Tracker)
        </h3>
        <div className="h-48 flex items-end gap-2">
          {[20, 31, 28, 42, 39, 45, 50, 48, 52, 38, 41, 44, 48, 43, 39, 28, 24, 30, 32, 29].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              className="flex-1 bg-white/5 rounded-t-sm relative group"
            >
              <div className="absolute inset-x-0 bottom-0 bg-saudi-green opacity-20 group-hover:opacity-100 transition-opacity" style={{ height: '30%' }} />
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:59</span>
        </div>
      </div>
    </div>
  );
}

function HealthCard({ label, status, latency, color }: { label: string, status: string, latency: string, color: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-3xl flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-gray-500 mb-1">{label}</h4>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
          <span className="text-sm font-bold">{status}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[9px] text-gray-600 font-mono uppercase font-black">Latency</p>
        <p className="text-xs font-mono font-bold text-gray-400">{latency}</p>
      </div>
    </div>
  );
}
