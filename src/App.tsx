import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Edit3, 
  Upload, 
  ShieldCheck, 
  Wallet,
  Users,
  UserCheck,
  Eye,
  Coins,
  Gift,
  Clock,
  Play,
  TrendingUp,
  Settings,
  Bell,
  Home,
  PlusSquare,
  Search,
  User,
  ShieldAlert,
  Heart,
  Share2,
  MessageCircle,
  Camera,
  Check,
  X,
  Lock,
  Globe,
  Trash2,
  FileText,
  Scale,
  CreditCard,
  History,
  Info,
  ChevronRight,
  Award,
  LogOut
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import VideoCall from "./components/VideoCall";
import { ShareModal, ShareItem } from "./components/ShareModal";
import { getOrCreateReferrals, getOrCreateShareStats, getOrCreateTrafficSources } from "./utils/shareStore";
import AdminDashboard from "./components/admin/AdminDashboard";
import HeritagePlayer from "./components/HeritagePlayer";
import PrivateChat from "./components/PrivateChat";
import ImageUploader from "./components/ImageUploader";
import { TrustedBadge } from "./components/TrustedBadge";
import { isUserTrusted } from "./utils/trustedBadgesStore";
import { detectGeoIP, evaluateAccess, addSecurityLog } from "./utils/countryLockStore";
import { 
  getDeviceSessions, saveDeviceSessions, getThreatLogs, 
  getUserSecurityProfile, saveUserSecurityProfile, 
  maskIpAddress, maskDeviceName, hasSecurityAccess,
  checkRateLimitAndIncrement, addThreatLog
} from "./utils/securityWatchdogStore";
import AccessDeniedScreen from "./components/AccessDeniedScreen";
import SmartSentryUserModal from "./components/SmartSentryUserModal";
import RegistrationModal from "./components/RegistrationModal";
import AdCenter from "./components/AdCenter";
import LandingPage from "./components/LandingPage";
import AdminRouteGuard from "./components/AdminRouteGuard";
import AccessPortal from "./components/AccessPortal";
import { auth, googleProvider, signInWithPopup } from "./utils/firebase";
import { AlertCircle, Download } from "lucide-react";
import ContentDownloadModal from "./components/ContentDownloadModal";
import MyDownloadsTab from "./components/MyDownloadsTab";
import NotFoundPage from "./components/NotFoundPage";

export const getUsernameFromDisplayName = (displayName: string): string => {
  if (!displayName) return "";
  const d = displayName.trim();
  if (d.includes("سارة") || d.toLowerCase().includes("sara")) return "sara_a";
  if (d.includes("عبدالله") || d.toLowerCase().includes("abdullah") || d.includes("الشمري")) return "abdullah_sh";
  if (d.includes("نورة") || d.toLowerCase().includes("noura")) return "noura_ali";
  if (d.includes("فهد") || d.toLowerCase().includes("f_harbi")) return "fhd_hrb";
  if (d.includes("أريج") || d.toLowerCase().includes("areej")) return "arij_m";
  return d.toLowerCase().replace(/\s+/g, "_");
};

// Interfaces
interface ProfileData {
  name: string;
  username: string;
  bio: string;
  location: string;
  joinDate: string;
  isVerified: boolean;
  isOnline: boolean;
  avatar: string;
  cover: string;
  stats: {
    followers: string;
    following: string;
    views: string;
    coins: number;
    gifts: number;
    liveHours: string;
  };
  creatorStatus: {
    level: number;
    subscription: string;
    completion: number;
  };
  accountType?: "individual" | "business";
  businessDetails?: {
    id: string;
    username: string;
    email: string;
    phone: string;
    businessName: string;
    activityType: string;
    crNumber: string;
    crDocumentUrl: string;
    crDocumentName: string;
    officialMobile: string;
    officialEmail: string;
    address: string;
    website?: string;
    logoUrl?: string;
    managerName: string;
    registrationDate: string;
    status: string;
    verificationStatus: string;
    businessType: string;
  };
  phone?: string;
  email?: string;
}

interface VideoPost {
  id: string;
  title: string;
  category: string;
  views: string;
  likes: number;
  hasLiked: boolean;
  thumbnailUrl: string;
  hashtags: string;
  description: string;
  privacy: string;
  status: string;
  comments: { user: string; text: string; time: string }[];
}

interface PhotoPost {
  id: string;
  url: string;
  likes: number;
  hasLiked: boolean;
  caption: string;
}

const initialMockUser: ProfileData = {
  name: "سليمان العتيبي",
  username: "su66666su",
  bio: "مستخدم موثق | مرحباً بكم في منصة SNNS.PRO الفخمة 🇸🇦",
  location: "الرياض، المملكة العربية السعودية",
  joinDate: "مايو ٢٠٢٦",
  isVerified: true,
  isOnline: true,
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
  cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&h=400&fit=crop",
  stats: {
    followers: "0",
    following: "0",
    views: "0",
    coins: 0,
    gifts: 0,
    liveHours: "0",
  },
  creatorStatus: {
    level: 1,
    subscription: "عادي",
    completion: 10,
  }
};

const initialVideos: VideoPost[] = [
  {
    id: "v_heritage_1",
    title: "رحلتي الاستكشافية في فضاء العلا التاريخية 🇸🇦",
    category: "سفر وسياحة",
    views: "١٢.٥ ألف مشاهدة",
    likes: 382,
    hasLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&fit=crop",
    hashtags: "#العلا #المملكة_العربية_السعودية #سياحة",
    description: "توثيق سينمائي عالي الجودة لمعابد وجبال العلا القديمة وتأثير الضوء على الصخور الرملية الفاخرة.",
    privacy: "public",
    status: "approved",
    comments: [
      { user: "عبدالله الشمري", text: "عمل جبار وتصوير نقي جداً يا سليمان! 🇸🇦", time: "قبل ساعتين" },
      { user: "سارة العلي", text: "زوايا التصوير مبهرة للغاية ومطابقة للمقاييس العالمية.", time: "قبل ساعة" }
    ]
  },
  {
    id: "v_tech_2",
    title: "تكنولوجيا الرمال واستدامة الطاقة الشمسية بالربع الخالي 🏜️",
    category: "تكنولوجيا الصحراء",
    views: "٨.٩ ألف مشاهدة",
    likes: 245,
    hasLiked: false,
    thumbnailUrl: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=800&fit=crop",
    hashtags: "#رؤية_٢٠٣٠ #تكنولوجيا #الطاقة_الشمسية",
    description: "مراجعة علمية حديثة لأقوى المحركات والخلايا الضوئية التي تحتمل حرارة الصحراء العالية وتغذي المشاريع الجديدة.",
    privacy: "public",
    status: "approved",
    comments: [
      { user: "فهد الحربي", text: "موضوع رائع يواكب مستهدفات الرؤية الوطنية الفخمة.", time: "قبل ٥ ساعات" }
    ]
  }
];

const initialPhotos: PhotoPost[] = [
  {
    id: "p_gallery_1",
    url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&fit=crop",
    likes: 189,
    hasLiked: false,
    caption: "غروب شمس مهيب من قمة حافة العالم بالرياض 🌅"
  },
  {
    id: "p_gallery_2",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&fit=crop",
    likes: 312,
    hasLiked: false,
    caption: "التطور العمراني البصري الساحر لمركز الملك عبدالله المالي الكافد 🏢"
  }
];

const initialReplays: any[] = [
  {
    id: "rep_live_1",
    title: "البث المباشر: احتفال اليوم الوطني بساحة المربع 🇸🇦",
    duration: "١ ساعة و٢٠ دقيقة",
    date: "٢٠٢٦/٠٥/٢٠",
    viewers: "٩.٢ ألف مشاهد",
    url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&fit=crop",
    creator: "su66666su"
  },
  {
    id: "rep_live_2",
    title: "تغطية منتدى الرياض الدولي للذكاء الاصطناعي الرقمي 🤖",
    duration: "٤٥ دقيقة",
    date: "٢٠٢٦/٠٥/٢٣",
    viewers: "٤.١ ألف مشاهد",
    url: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=800&fit=crop",
    creator: "su66666su"
  }
];

const initialGiftsList: any[] = [];

export function UserProfile() {
  const [googleUser, setGoogleUser] = useState<{ id: string; name: string; email: string; avatar: string } | null>(() => {
    const saved = localStorage.getItem("snns_google_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem("snns_user_profile");
    return saved ? JSON.parse(saved) : initialMockUser;
  });

  const { username: urlUsername } = useParams();
  const [displayedProfile, setDisplayedProfile] = useState<ProfileData>(profile);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [isFollowedByMe, setIsFollowedByMe] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleHiddenLogoClick = () => {
    setLogoClicks(prev => {
      const next = prev + 1;
      if (next >= 5) {
        navigate("/secure-access");
        return 0;
      }
      return next;
    });
  };

  // Sync displayed profile when urlUsername changes
  useEffect(() => {
    if (!urlUsername) {
      setDisplayedProfile(profile);
      setIsOwnProfile(true);
      return;
    }

    const cleanUrl = urlUsername.trim().toLowerCase().replace(/^@/, "");
    const myCleanUsername = profile.username.toLowerCase();
    const myCleanPremium = profile.premiumHandle?.toLowerCase().replace(/^@/, "") || "";

    if (cleanUrl === myCleanUsername || cleanUrl === myCleanPremium) {
      setDisplayedProfile(profile);
      setIsOwnProfile(true);
      return;
    }

    // Try finding in users list database
    try {
      const savedUsers = localStorage.getItem("snns_users_records");
      if (savedUsers) {
        const list = JSON.parse(savedUsers);
        const matched = list.find((u: any) => {
          const uName = u.username.toLowerCase();
          const uPrem = u.premiumHandle?.toLowerCase().replace(/^@/, "") || "";
          return cleanUrl === uName || cleanUrl === uPrem;
        });

        if (matched) {
          setDisplayedProfile({
            name: matched.name,
            username: matched.username,
            bio: matched.bio || "مستخدم موثق وصانع محتوى في منصة SNNS.PRO الفاخرة",
            location: matched.location || "الرياض، المملكة العربية السعودية",
            joinDate: matched.joinDate || "مايو ٢٠٢٤",
            isVerified: matched.verified || false,
            isOnline: matched.status === "نشط",
            avatar: matched.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
            cover: matched.cover || "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&h=400&fit=crop",
            stats: matched.stats || { followers: "١.٥ ألف", following: "٢٠٠", views: "١٠ آلاف", coins: matched.balance || 0, gifts: 10, liveHours: "٥" },
            creatorStatus: { level: matched.role === "صانع محتوى" ? 25 : 0, subscription: "عادي", completion: 100 },
            premiumHandle: matched.premiumHandle || ""
          } as any);
          setIsOwnProfile(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Checking fixed IDs @1 to @100
    const parsedId = parseInt(cleanUrl, 10);
    if (!isNaN(parsedId) && parsedId >= 1 && parsedId <= 100) {
      setDisplayedProfile({
        name: `معرّف مميز سيادي @${parsedId}`,
        username: `official_${parsedId}`,
        bio: "هذا المعرّف نادِر وقصير جداً ومحجوز حصرياً لملكية القيادة العامة ووزارة النزاهة لمنصة SNNS.PRO الفاخرة.",
        location: "الديوان العام، الرياض",
        joinDate: "مايو ٢٠٢٦",
        isVerified: true,
        isOnline: true,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&fit=crop",
        stats: { followers: "١ مليون", following: "٠", views: "١٠ مليون", coins: 999999, gifts: 999, liveHours: "٩٩٩" },
        creatorStatus: { level: 99, subscription: "سيادي", completion: 100 },
        premiumHandle: `@${parsedId}`
      } as any);
      setIsOwnProfile(false);
      return;
    }

    // Default fallback if path didn't match anyone
    setDisplayedProfile(profile);
    setIsOwnProfile(true);
  }, [urlUsername, profile]);

  const [videosList, setVideosList] = useState<VideoPost[]>(() => {
    try {
      const deleted = JSON.parse(localStorage.getItem("snns_deleted_contents") || "[]");
      return initialVideos.filter(v => !deleted.includes(v.id));
    } catch {
      return initialVideos;
    }
  });
  const [photosList, setPhotosList] = useState<PhotoPost[]>(() => {
    try {
      const deleted = JSON.parse(localStorage.getItem("snns_deleted_contents") || "[]");
      return initialPhotos.filter(p => !deleted.includes(p.id));
    } catch {
      return initialPhotos;
    }
  });
  const [activeTab, setActiveTab] = useState("posts");
  const [showCall, setShowCall] = useState(false);

  // Download system states
  const [downloadTargetContent, setDownloadTargetContent] = useState<any | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [creatorAllowDownloads, setCreatorAllowDownloads] = useState<boolean>(() => {
    const saved = localStorage.getItem("snns_allow_my_downloads");
    return saved !== "false";
  });

  useEffect(() => {
    const handleSync = () => {
      const saved = localStorage.getItem("snns_allow_my_downloads");
      setCreatorAllowDownloads(saved !== "false");
    };
    window.addEventListener("snns_allow_my_downloads_changed", handleSync);
    return () => {
      window.removeEventListener("snns_allow_my_downloads_changed", handleSync);
    };
  }, []);

  // Modal displays
  const [showPrivateChat, setShowPrivateChat] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(1);
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUploadVideo, setShowUploadVideo] = useState(false);
  const [showUploadPhoto, setShowUploadPhoto] = useState(false);
  const [showVerificationRequest, setShowVerificationRequest] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const [showSmartSentryUserModal, setShowSmartSentryUserModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Dynamic secure GeoIP checks inside UserProfile actions
  const tryStartStream = async () => {
    const geo = await detectGeoIP();
    const evaluation = evaluateAccess(profile.username, geo.ip, geo.countryCode, geo.vpnDetected, "stream");
    if (evaluation.blocked) {
      addSecurityLog({
        countryCode: geo.countryCode,
        countryName: evaluation.countryName,
        flag: evaluation.flag,
        ip: geo.ip,
        attemptType: "stream",
        status: "blocked",
        userAgent: navigator.userAgent,
        vpnDetected: geo.vpnDetected,
        notes: `محاولة بدء بث مباشر مرفوضة: ${evaluation.reason}`
      });
      alert(`⚠️ عذراً، لا تمتلك صلاحية البث المباشر الموفرة في موقعك الحالي: ${evaluation.reason}`);
      return;
    }
    setShowCall(true);
  };

  const tryOpenPrivateChat = async (contactId: string | null = null) => {
    const geo = await detectGeoIP();
    const evaluation = evaluateAccess(profile.username, geo.ip, geo.countryCode, geo.vpnDetected, "chat");
    if (evaluation.blocked) {
      addSecurityLog({
        countryCode: geo.countryCode,
        countryName: evaluation.countryName,
        flag: evaluation.flag,
        ip: geo.ip,
        attemptType: "chat",
        status: "blocked",
        userAgent: navigator.userAgent,
        vpnDetected: geo.vpnDetected,
        notes: `محاولة محادثة خاصة مرفوضة: ${evaluation.reason}`
      });
      alert(`⚠️ عذراً، الوصول لخدمات الدردشة التفاعلية معطل في منطقتك الجغرافية: ${evaluation.reason}`);
      return;
    }
    setActiveChatContactId(contactId);
    setShowPrivateChat(true);
  };

  const tryOpenGoogleSignIn = async () => {
    const geo = await detectGeoIP();
    const evaluation = evaluateAccess("guest", geo.ip, geo.countryCode, geo.vpnDetected, "register");
    if (evaluation.blocked) {
      addSecurityLog({
        countryCode: geo.countryCode,
        countryName: evaluation.countryName,
        flag: evaluation.flag,
        ip: geo.ip,
        attemptType: "register",
        status: "blocked",
        userAgent: navigator.userAgent,
        vpnDetected: geo.vpnDetected,
        notes: `محاولة تسجيل حساب جديد مرفوضة: ${evaluation.reason}`
      });
      alert(`⚠️ عذراً، التسجيل غير متاح حالياً لمنطقتك المبرهنة: ${evaluation.reason}`);
      return;
    }

    try {
      // Attempt real Google login with Firebase API
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        const gUser = {
          id: "G_" + user.uid,
          name: user.displayName || "مستخدم قوقل",
          email: user.email || "",
          avatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
        };
        setGoogleUser(gUser);
        localStorage.setItem("snns_google_user", JSON.stringify(gUser));
        
        // Update user profile automatically
        const updatedProfile = {
          ...profile,
          name: gUser.name,
          avatar: gUser.avatar,
          username: gUser.email.split("@")[0] || "google_user",
          bio: "مستخدم سعودي موثق | متصل عبر حساب Google المعتمد الحقيقي 🇸🇦",
        };
        setProfile(updatedProfile);
        localStorage.setItem("snns_user_profile", JSON.stringify(updatedProfile));
        
        setEditName(gUser.name);
        setEditAvatarUrl(gUser.avatar);

        triggerShareToast("✓ تم تسجيل الدخول بحساب Google الحقيقي بنجاح!");
        return;
      }
    } catch (err: any) {
      console.warn("Real Google login interrupted or failed inside preview iframe, launching fallback modal:", err);
      // If real login fails/is blocked, open the elegant interactive simulation/manual entry modal
      setShowGoogleSignIn(true);
    }
  };

  // Active Video TikTok Player
  const [activePlayVideo, setActivePlayVideo] = useState<VideoPost | null>(null);

  // Google sign in simulation inputs
  const [googleEmailInput, setGoogleEmailInput] = useState("su66666su@gmail.com");
  const [googleNameInput, setGoogleNameInput] = useState("سليمان العتيبي");
  const [googleAvatarInput, setGoogleAvatarInput] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop");

  // Form states
  const [editName, setEditName] = useState(profile.name);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatar);
  const [editCoverUrl, setEditCoverUrl] = useState(profile.cover);

  // Video Form
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoCategory, setVideoCategory] = useState("سفر وسياحة");
  const [videoHashtags, setVideoHashtags] = useState("#سفر #السعودية");
  const [videoPrivacy, setVideoPrivacy] = useState("public");
  const [videoStatus, setVideoStatus] = useState("published");
  const [videoUploadProgress, setVideoUploadProgress] = useState(-1);
  const [videoFile, setVideoFile] = useState<string | null>(null);

  // Photo Form
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoUploadProgress, setPhotoUploadProgress] = useState(-1);
  const [photoFile, setPhotoFile] = useState<string | null>(null);

  // Verification Form
  const [verifFullName, setVerifFullName] = useState("");
  const [verifBadgeType, setVerifBadgeType] = useState("creator"); // official, creator, business
  const [verifDocName, setVerifDocName] = useState("");
  const [isVerifSubmitted, setIsVerifSubmitted] = useState(false);

  // Wallet Form
  const [walletAmount, setWalletAmount] = useState("١٠٠");
  const [walletIBAN, setWalletIBAN] = useState("SA80 1000 0000 1234 5678 9012");
  const [walletWithdrawAmount, setWalletWithdrawAmount] = useState("");
  const [walletTab, setWalletTab] = useState<"charge" | "withdraw">("charge");
  const [walletSuccessMessage, setWalletSuccessMessage] = useState("");

  // Discovery & Search & Followers
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [showFollowersModal, setShowFollowersModal] = useState<"followers" | "following" | null>(null);

  // Policy Documents Modals
  const [showPolicyModal, setShowPolicyModal] = useState<"privacy" | "terms" | "delete_account" | null>(null);

  // Share Modal States
  const [selectedShareItem, setSelectedShareItem] = useState<ShareItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [referralsList, setReferralsList] = useState<any[]>(() => getOrCreateReferrals());
  const [invitesCount, setInvitesCount] = useState(() => getOrCreateReferrals().filter(r => r.status === "completed").length);

  // Load users
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("snns_users_records");
      if (saved) {
        setAllRegisteredUsers(JSON.parse(saved));
      } else {
        const initialUsers: any[] = [];
        localStorage.setItem("snns_users_records", JSON.stringify(initialUsers));
        setAllRegisteredUsers(initialUsers);
      }
    } catch {}
  }, [showSearchModal, showFollowersModal, urlUsername]);

  const navigate = useNavigate();

  // Smart Shared Link navigation listener inside App
  useEffect(() => {
    const handleOpenShared = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent || !customEvent.detail) return;
      const { type, id } = customEvent.detail;
      
      if (type === "live") {
        setShowCall(true);
      } else if (type === "video" || type === "post") {
        const found = videosList.find(v => v.id === id || v.id.toString() === id.toString());
        if (found) {
          setActivePlayVideo(found);
        } else if (videosList.length > 0) {
          setActivePlayVideo(videosList[0]);
        }
        setActiveTab("posts");
      } else if (type === "account") {
        if (id === profile.username) {
          navigate("/");
          setDisplayedProfile(profile);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate(`/@${id}`);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (type === "audio_room") {
        const node = document.getElementById("heritage-music-node");
        if (node) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
          node.classList.add("ring-2", "ring-saudi-green");
          setTimeout(() => {
            node.classList.remove("ring-2", "ring-saudi-green");
          }, 3000);
        }
      } else if (type === "invite") {
        // Increment referral locally since someone accepted invitation!
        const parsed = getOrCreateReferrals();
        const existing = parsed.find(r => r.username === id);
        if (existing && existing.status === "pending") {
          existing.status = "completed";
          localStorage.setItem("snns_referral_invites", JSON.stringify(parsed));
          setReferralsList(parsed);
          setInvitesCount(parsed.filter(r => r.status === "completed").length);
          alert(`🤝 تم مراجعة واستلام قبول دعوة جديدة من @${id}! تمت إضافة ١٠٠ عملة تقديرية بمحفظتك الفاخرة! 🇸🇦`);
          
          // Credit profile balance
          setProfile(prev => {
            const next = {
              ...prev,
              stats: {
                ...prev.stats,
                coins: prev.stats.coins + 100
              }
            };
            localStorage.setItem("snns_user_profile", JSON.stringify(next));
            return next;
          });
        } else {
          alert(`🤝 أهلاً بك! لقد زرت المنصة عبر رابط دعوة الصديق @${id}. يمكنك استكشاف التراث والصوتيات والمشاركة!`);
        }
      }
    };

    window.addEventListener("snns_open_shared", handleOpenShared);
    return () => {
      window.removeEventListener("snns_open_shared", handleOpenShared);
    };
  }, [videosList, profile]);

  const initiateShare = (
    id: string,
    type: "live" | "video" | "post" | "account" | "audio_room",
    title: string,
    creator: string,
    viewsOrFollowers?: string,
    thumbnail?: string,
    username?: string
  ) => {
    setSelectedShareItem({ id, type, title, creator, viewsOrFollowers, thumbnail, username });
    setIsShareModalOpen(true);
  };

  // Handle Edit Action
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...profile,
      name: editName,
      bio: editBio,
      location: editLocation,
      avatar: editAvatarUrl,
      cover: editCoverUrl
    };
    setProfile(updated);
    localStorage.setItem("snns_user_profile", JSON.stringify(updated));
    setShowEditProfile(false);
  };

  // Handle Video Upload Animation Simulation
  const handleUploadVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle) return;

    setVideoUploadProgress(0);
    const interval = setInterval(() => {
      setVideoUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Add new video
            const newVid: VideoPost = {
              id: "v_" + Date.now(),
              title: videoTitle,
              category: videoCategory,
              views: "0 مشاهدة",
              likes: 0,
              hasLiked: false,
              thumbnailUrl: photoFile || "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=800&fit=crop",
              hashtags: videoHashtags,
              description: videoDesc,
              privacy: videoPrivacy,
              status: videoStatus,
              comments: []
            };
            setVideosList(prevList => [newVid, ...prevList]);
            setVideoUploadProgress(-1);
            setVideoTitle("");
            setVideoDesc("");
            setPhotoFile(null);
            setShowUploadVideo(false);
          }, 600);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  // Handle Photo Upload Simulation
  const handleUploadPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return;

    setPhotoUploadProgress(0);
    const interval = setInterval(() => {
      setPhotoUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newPhoto: PhotoPost = {
              id: "p_" + Date.now(),
              url: photoFile,
              likes: 0,
              hasLiked: false,
              caption: photoCaption
            };
            setPhotosList(prevList => [newPhoto, ...prevList]);
            setPhotoUploadProgress(-1);
            setPhotoCaption("");
            setPhotoFile(null);
            setShowUploadPhoto(false);
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Handle Verification Request
  const handleVerificationRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifFullName) return;
    setIsVerifSubmitted(true);
    setTimeout(() => {
      setIsVerifSubmitted(false);
      setShowVerificationRequest(false);
      setVerifFullName("");
      setVerifDocName("");
    }, 2500);
  };

  // Handle Coins recharge
  const handleRechargeSubmit = (amount: number) => {
    setWalletSuccessMessage(`تم شحن ${amount} عملة بنجاح عبر Apple Pay! 🇸🇦`);
    setProfile(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        coins: prev.stats.coins + amount
      }
    }));
    setTimeout(() => {
      setWalletSuccessMessage("");
    }, 4000);
  };

  // Handle Withdraw
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(walletWithdrawAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    // Financial action geolocation evaluation
    const geo = await detectGeoIP();
    const evaluation = evaluateAccess(profile.username, geo.ip, geo.countryCode, geo.vpnDetected, "withdraw");
    if (evaluation.blocked) {
      addSecurityLog({
        countryCode: geo.countryCode,
        countryName: evaluation.countryName,
        flag: evaluation.flag,
        ip: geo.ip,
        attemptType: "withdraw",
        status: "blocked",
        userAgent: navigator.userAgent,
        vpnDetected: geo.vpnDetected,
        notes: `محاولة سحب مالي معطلة لسياسة الدولة الجغرافية: ${evaluation.reason}`
      });
      alert(`⚠️ إخفاق الدورة المالية: ${evaluation.reason}`);
      return;
    }

    if (parsed > profile.stats.coins) {
      alert("رصيد العملات غير كافي لإتمام هذه العملية!");
      return;
    }
    setProfile(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        coins: prev.stats.coins - parsed
      }
    }));
    setWalletSuccessMessage(`طلب سحب مبلغ يعادل ${parsed} عملة قيد المراجعة والتحويل لحسابك البنكي!`);
    setWalletWithdrawAmount("");
    setTimeout(() => {
      setWalletSuccessMessage("");
    }, 5000);
  };

  // Toggle Video Like state on main or player
  const toggleVideoLike = (video: VideoPost) => {
    setVideosList(prev => prev.map(v => {
      if (v.id === video.id) {
        return {
          ...v,
          hasLiked: !v.hasLiked,
          likes: v.hasLiked ? v.likes - 1 : v.likes + 1
        };
      }
      return v;
    }));
    if (activePlayVideo && activePlayVideo.id === video.id) {
      setActivePlayVideo(prev => {
        if (!prev) return null;
        return {
          ...prev,
          hasLiked: !prev.hasLiked,
          likes: prev.hasLiked ? prev.likes - 1 : prev.likes + 1
        };
      });
    }
  };

  // Toggle Photo Like
  const togglePhotoLike = (photoId: string) => {
    setPhotosList(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          hasLiked: !p.hasLiked,
          likes: p.hasLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  // Add Comment inside player
  const [userCommentText, setUserCommentText] = useState("");
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommentText || !activePlayVideo) return;
    const newComment = {
      user: "أنا",
      text: userCommentText,
      time: "الآن"
    };

    setVideosList(prev => prev.map(v => {
      if (v.id === activePlayVideo.id) {
        return {
          ...v,
          comments: [...v.comments, newComment]
        };
      }
      return v;
    }));

    setActivePlayVideo(prev => {
      if (!prev) return null;
      return {
        ...prev,
        comments: [...prev.comments, newComment]
      };
    });

    setUserCommentText("");
  };

  // Share Content Alert Toast
  const [shareToastText, setShareToastText] = useState("");
  const triggerShareToast = (title: string) => {
    setShareToastText(`تم نسخ رابط "${title}" بنجاح! جاهز للمشاركة 🇸🇦`);
    setTimeout(() => {
      setShareToastText("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white font-inter pb-24 md:pb-0 scroll-smooth" dir="rtl">
      {/* Absolute Private Chat Overlay */}
      <AnimatePresence>
        {showPrivateChat && (
          <PrivateChat 
            onClose={() => {
              setShowPrivateChat(false);
              setUnreadMessagesCount(0);
              setActiveChatContactId(null);
            }} 
            currentUserProfile={{
              name: profile.name,
              username: profile.username,
              avatar: profile.avatar,
              coins: profile.stats.coins
            }}
            initialContactId={activeChatContactId}
          />
        )}
      </AnimatePresence>

      {/* Absolute Active Video call Overlay */}
      <AnimatePresence>
        {showCall && (
          <VideoCall 
            onEnd={() => setShowCall(false)} 
            onShare={() => {
              initiateShare("r1", "live", "بث عشاء التأسيس الحصري مع متابعينا الكرام 🇸🇦", "عبدالله الراجحي", "٣،٢٠٠ مشاهد الآن وبث ذو جودة ناطقة بالتقاليد", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&fit=crop");
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Toast Notification Banner */}
      <AnimatePresence>
        {shareToastText && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 30 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[99] bg-saudi-green text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-saudi-glow/30"
          >
            <Check className="w-5 h-5 text-white" />
            <span className="font-tajawal text-sm font-bold">{shareToastText}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Ambience Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-screen pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-saudi-green blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-saudi-glow blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-2xl mx-auto md:border-x md:border-dark-border min-h-screen pb-10">
        {/* Header Banner */}
        <section id="profile-banner-sec" className="relative">
          <div className="relative h-44 md:h-56 overflow-hidden bg-gradient-to-l from-saudi-dark to-dark-bg border-b border-white/5">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #00843D 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <img 
              src={displayedProfile.cover} 
              alt="Cover Image" 
              className="w-full h-full object-cover opacity-35 mix-blend-overlay transition-opacity duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
          
          <div className="px-5 -mt-16 flex flex-col items-center relative z-10 text-center">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-[3.5px] border-[#050505] bg-[#0A0A0A] overflow-hidden shadow-2xl relative">
                <img 
                  src={displayedProfile.avatar} 
                  alt={displayedProfile.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {displayedProfile.isOnline && (
                <span className="absolute bottom-2 right-2 w-4.5 h-4.5 bg-saudi-green rounded-full border-[3px] border-[#050505] shadow-[0_0_12px_rgba(0,225,129,0.6)]" />
              )}
            </div>

            {/* Profile Core Attributes */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <h1 className="text-xl md:text-2xl font-black font-tajawal text-white tracking-tight">{displayedProfile.name}</h1>
                <TrustedBadge username={displayedProfile.username} size="sm" />
                {displayedProfile.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-saudi-glow fill-saudi-glow/10 shrink-0" />
                )}
                {displayedProfile.accountType === "business" && (
                  <span className="bg-saudi-green/10 text-saudi-glow border border-saudi-green/35 text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                    🏢 {displayedProfile.businessDetails?.businessType === "company" ? "شركة موثقة" : "مؤسسة موثقة"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono tracking-wider mt-0.5">@{displayedProfile.username}</p>
              
              {displayedProfile.premiumHandle && (
                <div className="mt-1.5 inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500/15 to-amber-500/15 text-yellow-500 border border-yellow-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  <span>💎 معرّف متميز:</span>
                  <span className="font-sans text-[10px]">{displayedProfile.premiumHandle}</span>
                </div>
              )}
            </div>

            {/* Followers / Following / Likes Row RIGHT under the Name/Username summary! */}
            <div className="mt-4 py-2 px-6 w-full max-w-sm grid grid-cols-3 gap-2 border-y border-white/5 text-center bg-white/[0.01] rounded-xl">
              <div onClick={() => setShowFollowersModal("followers")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-sm md:text-base font-black text-white font-mono tracking-tight">
                  {isFollowedByMe ? (displayedProfile.stats.followers === "0" ? "١" : `${displayedProfile.stats.followers} + ١`) : displayedProfile.stats.followers}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">متابع</span>
              </div>
              <div onClick={() => setShowFollowersModal("following")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="block text-sm md:text-base font-black text-white font-mono tracking-tight">{displayedProfile.stats.following}</span>
                <span className="text-[10px] text-gray-500 font-medium">يتابع</span>
              </div>
              <div>
                <span className="block text-sm md:text-base font-black text-white font-mono tracking-tight">
                  {videosList.reduce((acc, v) => acc + (v.likes || 0), 0) + photosList.reduce((acc, p) => acc + (p.likes || 0), 0) || displayedProfile.stats.gifts || 12}
                </span>
                <span className="text-[10px] text-gray-500 font-medium font-tajawal">الإعجابات</span>
              </div>
            </div>

            {/* Bio statement */}
            <div className="mt-3.5 max-w-md">
              <p className="text-xs text-gray-350 leading-relaxed font-tajawal">
                {displayedProfile.bio}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{displayedProfile.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>انضم {displayedProfile.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Core Action Grid: Clean, Unified, Clutter-Free Buttons */}
            <div className="mt-5 w-full max-w-sm flex flex-wrap items-center justify-center gap-2">
              {isOwnProfile ? (
                <>
                  {/* Start Live call */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={tryStartStream}
                    className="flex-1 h-10 bg-[#00843D] hover:bg-saudi-green/90 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(0,132,61,0.2)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>ابدأ بث مباشر</span>
                  </motion.button>

                  {/* Private Messages Button */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => tryOpenPrivateChat(null)}
                    className="flex-1 h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-saudi-glow shrink-0" />
                    <span>الرسائل</span>
                    {unreadMessagesCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold animate-pulse">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </motion.button>

                  {/* Share button */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => initiateShare(displayedProfile.username, "account", displayedProfile.name, `@${displayedProfile.username}`, `${displayedProfile.stats.followers} متابع`, displayedProfile.avatar, displayedProfile.username)}
                    className="w-10 h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer"
                    title="مشاركة الحساب"
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-300" />
                  </motion.button>

                  {/* Slim More Trigger Popover to prevent layout crowding */}
                  <div className="relative">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${showMoreDropdown ? 'bg-saudi-green/20 border border-saudi-green/45 text-saudi-glow' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-white'}`}
                      title="المزيد من الأدوات الفاخرة"
                    >
                      <PlusSquare className="w-3.5 h-3.5" />
                    </motion.button>

                    {showMoreDropdown && (
                      <div className="absolute left-0 mt-2 w-60 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-[95] text-right">
                        <div className="px-2 py-1.5 border-b border-white/5 mb-1.5">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">خيارات إدارية وتحكم</p>
                        </div>
                        
                        {["super_admin", "admin", "moderator", "security", "verification", "content_moderator"].includes(profile.role) && (
                          <>
                            <button 
                              onClick={() => { setShowMoreDropdown(false); navigate("/admin"); }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-saudi-glow hover:bg-saudi-green/10 rounded-xl transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-saudi-glow" />
                              <span>لوحة الإدارة والأمان</span>
                            </button>

                            <button 
                              onClick={() => { setShowMoreDropdown(false); setShowSmartSentryUserModal(true); }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-yellow-500" />
                              <span>بوابة الحارس الذكي</span>
                            </button>
                          </>
                        )}

                        <button 
                          onClick={() => { setShowMoreDropdown(false); setShowAuthModal(true); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>بوابة الأعمال والفرادى 🇸🇦</span>
                        </button>

                        <button 
                          onClick={() => {
                            setShowMoreDropdown(false);
                            setEditName(profile.name);
                            setEditBio(profile.bio);
                            setEditLocation(profile.location);
                            setEditAvatarUrl(profile.avatar);
                            setEditCoverUrl(profile.cover);
                            setShowEditProfile(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                          <span>تعديل بيانات الحساب</span>
                        </button>

                        <button 
                          onClick={() => { setShowMoreDropdown(false); setShowUploadVideo(true); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-gray-400" />
                          <span>رفع مقطع فيديو تراثي</span>
                        </button>

                        <button 
                          onClick={() => { setShowMoreDropdown(false); setShowUploadPhoto(true); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-gray-400" />
                          <span>رفع صورة للمعرض</span>
                        </button>

                        <button 
                          onClick={() => { setShowMoreDropdown(false); setShowVerificationRequest(true); }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <span>المطالبة بشارة توثيق</span>
                        </button>

                        <div className="border-t border-white/5 my-1.5" />

                        <button 
                          onClick={() => {
                            setShowMoreDropdown(false);
                            if (confirm("هل تود تسجيل الخروج والعودة للحساب الفردي الافتراضي؟")) {
                              localStorage.removeItem("snns_user_profile");
                              localStorage.removeItem("snns_google_user");
                              window.location.reload();
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>تسجيل الخروج 🚪</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Visitor Action Grid */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsFollowedByMe(!isFollowedByMe);
                      try {
                        let audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
                        audio.volume = 0.15;
                        audio.play().catch(()=>{});
                      } catch {}
                    }}
                    className={`flex-1 h-10 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none transition-all ${isFollowedByMe ? 'bg-white/10 text-white border border-white/10' : 'bg-[#00843D] text-white hover:bg-saudi-green/90'}`}
                  >
                    <span>{isFollowedByMe ? "إلغاء المتابعة" : "متابعة الحساب"}</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => tryOpenPrivateChat(displayedProfile.username)}
                    className="flex-1 h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-saudi-glow shrink-0" />
                    <span>مراسلة 💬</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => initiateShare(displayedProfile.username, "account", displayedProfile.name, `@${displayedProfile.username}`, `${displayedProfile.stats.followers} متابع`, displayedProfile.avatar, displayedProfile.username)}
                    className="w-10 h-10 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-center cursor-pointer"
                    title="مشاركة الحساب"
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-300" />
                  </motion.button>

                  <div className="relative">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${showMoreDropdown ? 'bg-saudi-green/20 border border-saudi-green/45 text-saudi-glow' : 'bg-white/5 border border-white/5 hover:bg-white/10 text-white'}`}
                      title="المزيد من الأدوات"
                    >
                      <PlusSquare className="w-3.5 h-3.5" />
                    </motion.button>

                    {showMoreDropdown && (
                      <div className="absolute left-0 mt-2 w-52 bg-[#0A0A0A] border border-white/10 rounded-2xl p-2 shadow-2xl z-[95] text-right">
                        <button 
                          onClick={() => {
                            setShowMoreDropdown(false);
                            alert(`🎁 تم إرسال باقة ورود وهدايا فاخرة من التقدير إلى الحساب @${displayedProfile.username} بنجاح!`);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Gift className="w-4 h-4 text-yellow-500" />
                          <span>منح هدايا وثوب 🎁</span>
                        </button>
                        
                        <Link 
                          to="/"
                          onClick={() => setShowMoreDropdown(false)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer block"
                        >
                          <Home className="w-4 h-4 text-gray-400" />
                          <span>العودة لملفي الشخصي</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Heritage Background Saudi Soundscapes Synth Player */}
        <section id="heritage-player-sec" className="px-5 mt-6">
          <HeritagePlayer 
            onShare={() => {
              initiateShare("aud1", "audio_room", "ديوانية الصوت والربابة التراثية الأصيلة 🎻", "منصة SNNS الموثقة", "عروض أوتار العود والربابة الحجازية", "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&fit=crop");
            }}
          />
        </section>

        {/* Secondary Details & Wallet Cards Block */}
        <section id="account-status" className="px-5 mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-dark-bg border border-white/5 p-4 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-gray-500 font-bold tracking-wider font-tajawal">مستوى صانع التراث</span>
              <span className="text-xs font-extrabold text-saudi-green uppercase">المستوى {displayedProfile.creatorStatus.level}</span>
            </div>
            <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${displayedProfile.creatorStatus.completion}%` }}
                className="h-full bg-saudi-green shadow-[0_0_8px_rgba(0,132,61,0.4)]"
              />
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <span className="text-[10px] text-gray-500">امتيازات الصانع نشطة ومحمية</span>
              <span className="text-[10px] font-mono text-gray-500">{displayedProfile.creatorStatus.completion}%</span>
            </div>
          </div>

          <div 
            onClick={() => { if (isOwnProfile) setShowWalletDetails(true); }}
            className={`flex-1 bg-dark-bg border border-white/5 p-4 rounded-2xl relative overflow-hidden group transition-all ${isOwnProfile ? 'cursor-pointer hover:border-saudi-green/30' : 'opacity-85'}`}
          >
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-500 font-tajawal">محفظة العملات</span>
                <span className="text-lg font-black font-mono mt-0.5">{displayedProfile.stats.coins.toLocaleString()} <span className="text-[9px] text-saudi-green font-tajawal font-bold">عملة</span></span>
              </div>
              <div className="px-2 py-0.5 bg-saudi-green/10 border border-saudi-green/30 rounded text-[9px] text-saudi-glow font-black tracking-tighter">PRO</div>
            </div>
            {isOwnProfile && (
              <div className="grid grid-cols-2 gap-2 relative z-10">
                <button onClick={(e) => { e.stopPropagation(); setWalletTab("charge"); setShowWalletDetails(true); }} className="py-1 bg-saudi-green/10 border border-saudi-green/35 rounded-lg text-[9px] font-bold text-saudi-glow hover:bg-saudi-green/20 transition-all cursor-pointer">شحن كوينز</button>
                <button onClick={(e) => { e.stopPropagation(); setWalletTab("withdraw"); setShowWalletDetails(true); }} className="py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-gray-300 hover:bg-white/10 transition-all cursor-pointer">سحب أرباح</button>
              </div>
            )}
          </div>
        </section>

        {/* Tabs and Custom Gallery Section */}
        <section id="profile-tabs" className="mt-10">
          <div className="flex border-b border-dark-border scrollbar-hide overflow-x-auto px-5 sticky top-0 bg-dark-bg/95 backdrop-blur-md z-30">
            <TabItem id="posts" current={activeTab} onClick={setActiveTab} label="المنشورات (الفيديو)" />
            <TabItem id="photos" current={activeTab} onClick={setActiveTab} label="معرض الصور" />
            <TabItem id="replays" current={activeTab} onClick={setActiveTab} label="الإعادة المباشرة" />
            <TabItem id="gifts" current={activeTab} onClick={setActiveTab} label="هدايا الصانع" />
            {isOwnProfile && (
              <TabItem id="referrals" current={activeTab} onClick={setActiveTab} label="الدعوات والأرباح 🇸🇦" />
            )}
            <TabItem id="downloads" current={activeTab} onClick={setActiveTab} label="المحفوظات والتنزيلات 📥" />
            {displayedProfile.accountType === "business" && (
              <TabItem id="business_ads" current={activeTab} onClick={setActiveTab} label="مركز الإعلانات 🏢" />
            )}
          </div>

          <div className="px-5 py-6">
            <AnimatePresence mode="wait">
              {activeTab === "posts" && (
                <motion.div 
                  key="posts-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {videosList.map(video => (
                    <div 
                      key={video.id} 
                      className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden group hover:border-saudi-green/30 transition-all relative"
                    >
                      <div className="relative aspect-video bg-black cursor-pointer" onClick={() => setActivePlayVideo(video)}>
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title} 
                          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                          <Eye className="w-3.5 h-3.5 text-saudi-glow" />
                          <span>{video.views}</span>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-saudi-green text-white rounded-full flex items-center justify-center opacity-90 group-hover:scale-110 transition-all shadow-lg shadow-saudi-green/20">
                          <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
                        </div>
                        {video.status === "under_review" && (
                          <div className="absolute top-3 right-3 bg-yellow-500/90 text-black px-2 py-0.5 rounded text-[9px] font-bold">
                            تحت المراجعة
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <span className="text-[10px] text-saudi-glow font-bold bg-saudi-green/10 px-2.5 py-0.5 rounded-full">{video.category}</span>
                        <h3 className="font-bold text-sm leading-snug line-clamp-1 font-tajawal cursor-pointer" onClick={() => setActivePlayVideo(video)}>{video.title}</h3>
                        <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{video.description}</p>
                        <p className="text-[10px] text-saudi-glow font-mono font-bold">{video.hashtags}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-dark-border/40 mt-3 text-xs">
                          <button 
                            onClick={() => toggleVideoLike(video)}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${video.hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                            <span>{video.likes}</span>
                          </button>

                          {creatorAllowDownloads ? (
                            <button 
                              onClick={() => {
                                setDownloadTargetContent({
                                  id: video.id,
                                  title: video.title,
                                  type: "video",
                                  url: video.thumbnailUrl,
                                  creator: displayedProfile.username,
                                });
                                setShowDownloadModal(true);
                              }}
                              className="flex items-center gap-1 text-saudi-glow hover:text-white transition-colors font-bold cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-saudi-glow" />
                              <span>تحميل</span>
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-600 bg-white/2 px-2 py-0.5 rounded border border-white/5 text-[9px] font-bold">
                              <Lock className="w-2.5 h-2.5" />
                              <span>التحميل غير متاح</span>
                            </span>
                          )}

                          <button 
                            onClick={() => initiateShare(video.id.toString(), "video", video.title, video.creator, `${video.views} مشاهدة`, video.thumbnailUrl)}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-saudi-glow transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>مشاركة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {videosList.length === 0 && <EmptyState />}
                </motion.div>
              )}

              {activeTab === "photos" && (
                <motion.div 
                  key="photos-grid"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {photosList.map(photo => (
                    <div key={photo.id} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden group relative">
                      <img src={photo.url} alt="Gallery" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                        <p className="text-[10px] text-gray-200 line-clamp-2 leading-tight font-tajawal mb-2">{photo.caption}</p>
                        <div className="flex justify-between items-center bg-black/40 p-1.5 rounded-xl border border-white/5">
                          <button 
                            onClick={() => togglePhotoLike(photo.id)}
                            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-500 font-bold cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${photo.hasLiked ? "fill-red-400" : ""}`} />
                            <span>{photo.likes}</span>
                          </button>

                          {creatorAllowDownloads ? (
                            <button
                              onClick={() => {
                                setDownloadTargetContent({
                                  id: photo.id,
                                  title: photo.caption || "صورة روعة من منصة SNNS",
                                  type: "photo",
                                  url: photo.url,
                                  creator: displayedProfile.username,
                                });
                                setShowDownloadModal(true);
                              }}
                              className="text-saudi-glow hover:text-white p-1 rounded transition-colors cursor-pointer"
                              title="تحميل الصورة"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-500 p-1" title="التحميل معطل">
                              <Lock className="w-3.5 h-3.5 text-gray-600" />
                            </span>
                          )}

                          <button 
                            onClick={() => {
                              if(confirm("هل تود حذف هذه الصورة من المعرض؟")) {
                                setPhotosList(prev => prev.filter(p => p.id !== photo.id));
                              }
                            }}
                            className="p-1 hover:bg-white/10 text-red-500 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {photosList.length === 0 && <EmptyState />}
                </motion.div>
              )}

              {activeTab === "replays" && (
                <motion.div 
                  key="replays"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {initialReplays.map(rep => (
                    <div key={rep.id} className="flex flex-col sm:flex-row justify-between items-center p-5 bg-dark-surface border border-dark-border rounded-2xl gap-4 hover:border-saudi-green/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-saudi-green/10 rounded-full flex items-center justify-center text-saudi-glow shrink-0">
                          <Play className="w-5 h-5 fill-saudi-glow" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm font-tajawal mb-1">{rep.title}</h4>
                          <p className="text-xs text-gray-500">مدة البث: {rep.duration} | {rep.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">{rep.viewers}</span>
                        {creatorAllowDownloads ? (
                          <button
                            onClick={() => {
                              setDownloadTargetContent({
                                id: rep.id,
                                title: rep.title,
                                type: "replay",
                                url: rep.url,
                                creator: displayedProfile.username,
                              });
                              setShowDownloadModal(true);
                            }}
                            className="bg-saudi-green/10 text-saudi-glow border border-saudi-green/30 p-2.5 rounded-xl hover:bg-saudi-green hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold font-tajawal"
                            title="تنزيل إعادة البث 📥"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold bg-white/2 border border-white/5 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-gray-600 font-tajawal">
                            <Lock className="w-3 h-3" />
                            <span>التحميل معطل</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "gifts" && (
                <motion.div 
                  key="gifts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                  {initialGiftsList.map(item => (
                    <div key={item.id} className="p-5 bg-gradient-to-br from-dark-surface to-dark-bg border border-dark-border rounded-2xl text-center relative group">
                      <span className="text-5xl block mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                      <h4 className="font-bold text-xs mb-1 font-tajawal">{item.name}</h4>
                      <p className="text-[10px] text-saudi-glow mb-2">{item.price}</p>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold font-mono">
                        مستلم ({item.count})
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "referrals" && (
                <motion.div 
                  key="referrals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 font-tajawal text-right"
                >
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-neutral-900/60 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">دعوات مكتملة ومقبولة</span>
                      <h4 className="text-2xl font-black font-mono text-saudi-glow mt-2">{invitesCount} دعوة</h4>
                      <p className="text-[9px] text-gray-550 mt-1">تمنحك كل دعوة ١٠٠ عملة لتكريم المبدعين</p>
                    </div>

                    <div className="p-5 bg-neutral-900/60 border border-white/5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">إجمالي الأرباح المكتسبة</span>
                      <h4 className="text-2xl font-black font-mono text-yellow-500 mt-2">{invitesCount * 100} عملة</h4>
                      <p className="text-[9px] text-gray-550 mt-1">رصيد وطني تقديري متكامل ومستمر</p>
                    </div>

                    {/* Invitation Link Card */}
                    <div className="p-5 bg-saudi-green/5 border border-saudi-green/20 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      <span className="text-[10px] text-saudi-glow font-bold">رابط الدعوة الوطني الخاص بك</span>
                      <div className="font-mono text-xs text-white bg-black/40 p-2 rounded-lg truncate mt-2 select-all">
                        snns.pro/invite/{profile.username}
                      </div>
                      <button 
                        onClick={() => {
                          const inviteLink = `snns.pro/invite/${profile.username}`;
                          navigator.clipboard.writeText(`https://${inviteLink}`);
                          triggerShareToast("تم نسخ رابط دعوتك! شاركه واكسب ١٠٠ عملة 🇸🇦");
                        }}
                        className="w-full mt-2.5 py-1.5 bg-saudi-green text-white text-[10px] font-black rounded-lg hover:bg-saudi-green/90 transition-all font-tajawal cursor-pointer"
                      >
                        نسخ رابط الدعوة 🔗
                      </button>
                    </div>
                  </div>

                  {/* Invitations Tracker Table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-saudi-glow animate-bounce" />
                        سجل تتبع الدعوات والمكافآت (Referral Ledger)
                      </h4>
                      <span className="text-[9px] text-gray-500 font-mono text-left">Real-time Invitation Logs</span>
                    </div>

                    <div className="bg-neutral-900/40 border border-white/4 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {referralsList.map((ref, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between gap-3 text-xs hover:bg-white/2 transition-colors">
                          <div className="flex items-center gap-3">
                            <img 
                              src={ref.avatar} 
                              alt={ref.name} 
                              className="w-10 h-10 object-cover rounded-full border border-white/10" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h5 className="font-bold text-white text-xs leading-none">{ref.name}</h5>
                              <p className="text-[10px] text-gray-500 mt-1">@{ref.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-[10px] text-gray-500 font-mono">{ref.date}</span>
                            
                            {ref.status === "completed" ? (
                              <div className="flex items-center gap-1.5 text-saudi-glow font-bold bg-saudi-green/10 px-2.5 py-1 rounded-full text-[9px] border border-saudi-green/25">
                                <span>✓ اكتملت الدعوة</span>
                                <span className="font-mono text-yellow-500 leading-none">+{ref.rewardCoins}🪙</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-full border border-amber-550/20">⌛ في الانتظار</span>
                                <button
                                  onClick={() => {
                                    // Simulated event to trigger invitation acceptance!
                                    const event = new CustomEvent("snns_open_shared", { 
                                      detail: { type: "invite", id: ref.username } 
                                    });
                                    window.dispatchEvent(event);
                                  }}
                                  className="bg-saudi-green/20 text-saudi-glow border border-saudi-green/30 px-3 py-1 rounded-full text-[9.5px] font-bold hover:bg-saudi-green hover:text-white transition-all cursor-pointer"
                                >
                                  محاكاة قبولها 🤝
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "downloads" && (
                <motion.div
                  key="downloads"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <MyDownloadsTab 
                    isOwnProfile={isOwnProfile}
                    username={displayedProfile.username}
                    onOpenDownloadModal={(item) => {
                      setDownloadTargetContent(item);
                      setShowDownloadModal(true);
                    }}
                  />
                </motion.div>
              )}

              {activeTab === "business_ads" && displayedProfile.accountType === "business" && (
                <motion.div 
                  key="business_ads_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AdCenter 
                    businessDetails={displayedProfile.businessDetails as any} 
                    onSyncCampaigns={() => {
                      const saved = localStorage.getItem("snns_user_profile");
                      if (saved) {
                        setProfile(JSON.parse(saved));
                      }
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer with Policy Links */}
        <footer className="w-full max-w-7xl mx-auto px-5 py-8 mt-12 border-t border-white/5 text-center text-xs text-gray-400 font-tajawal relative z-10 bg-dark-bg/40">
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mb-4">
            <button 
              onClick={() => setShowPolicyModal("privacy")} 
              className="hover:text-saudi-glow active:scale-95 transition-all cursor-pointer font-bold text-gray-300"
            >
              سياسة الخصوصية
            </button>
            <span className="text-white/10 hidden sm:inline">&bull;</span>
            <button 
              onClick={() => setShowPolicyModal("terms")} 
              className="hover:text-saudi-glow active:scale-95 transition-all cursor-pointer font-bold text-gray-300"
            >
              الشروط والأحكام
            </button>
            <span className="text-white/10 hidden sm:inline">&bull;</span>
            <button 
              onClick={() => setShowPolicyModal("delete_account")} 
              className="hover:text-red-400 active:scale-95 transition-all cursor-pointer font-bold text-red-500/90"
            >
              سياسة حذف الحساب والبيانات
            </button>
          </div>
          <p 
            onClick={handleHiddenLogoClick}
            className="text-[10px] text-gray-550 font-mono cursor-pointer select-none active:text-white/20 transition-colors"
          >
            &copy; 2026 SNNS.PRO. جميع الحقوق محفوظة لمنصة التراث والصوتيات الوطنية الرقمية 🇸🇦
          </p>
        </footer>
      </main>

      {/* Slide Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center shrink-0">
                <h3 className="font-bold font-tajawal text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-saudi-glow" />
                  تعديل معلومات الحساب
                </h3>
                <button onClick={() => setShowEditProfile(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold">اسم الحساب الكامل (العرض)</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none" 
                    placeholder="ادخل الاسم الكامل للظهور"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 border-t border-b border-white/5 py-5 my-2">
                  <ImageUploader 
                    type="avatar"
                    currentUrl={editAvatarUrl}
                    defaultUrl="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop"
                    onUploadComplete={(newUrl) => setEditAvatarUrl(newUrl)}
                    onDelete={() => setEditAvatarUrl("https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop")}
                  />

                  <ImageUploader 
                    type="cover"
                    currentUrl={editCoverUrl}
                    defaultUrl="https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&h=400&fit=crop"
                    onUploadComplete={(newUrl) => setEditCoverUrl(newUrl)}
                    onDelete={() => setEditCoverUrl("https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1200&h=400&fit=crop")}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold">الموقع الجغرافي</label>
                  <input 
                    type="text" 
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none" 
                    placeholder="مدينة، دولة"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-bold">نبذة شخصية (Bio)</label>
                  <textarea 
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none resize-none font-tajawal" 
                    placeholder="اكتب نبذة مميزة عنك وعن مجالك..."
                  />
                </div>

                <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                  <div>
                    <span className="block text-xs font-bold text-gray-400">إدارة الحساب والخصوصية</span>
                    <span className="block text-[10px] text-gray-500">تصفح أو اطلب حذف حسابك وبياناتك بشكل آمن</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowEditProfile(false);
                      setShowPolicyModal("delete_account");
                    }}
                    className="px-3 py-1.5 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/20 rounded-lg text-[10px] font-bold transition-all"
                  >
                    حذف الحساب والبيانات ⚠️
                  </button>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-saudi-green text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20">
                    حفظ التغييرات
                  </button>
                  <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 py-3 bg-white/5 text-gray-400 rounded-xl text-sm">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search/Discovery Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[85] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-950 border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]"
            >
              <div className="p-5 border-b border-white/5 bg-neutral-900/40 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-saudi-green" />
                  اكتشف الحسابات ومبدعي المملكة 🇸🇦
                </h3>
                <button onClick={() => setShowSearchModal(false)} className="text-gray-500 hover:text-white">&times;</button>
              </div>

              <div className="p-4 border-b border-white/5 bg-black/60 shrink-0">
                <div className="relative">
                  <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="ابحث بالنخبة، بالاسم، أو بالمعرّف الرقمي..."
                    value={internalSearchQuery}
                    onChange={(e) => setInternalSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 bg-neutral-900 border border-[#222] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-saudi-green"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/10 custom-scrollbar">
                {(allRegisteredUsers || []).filter(u => {
                  const query = internalSearchQuery.trim().toLowerCase();
                  if (!query) return true;
                  return u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
                }).map(u => (
                  <div
                    key={u.username}
                    onClick={() => {
                      setShowSearchModal(false);
                      setInternalSearchQuery("");
                      navigate(`/@${u.username}`);
                    }}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/2 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white leading-none mb-0.5">{u.name}</span>
                          <TrustedBadge username={u.username} size="sm" />
                        </div>
                        <span className="text-[10px] text-gray-550 font-mono">@{u.username}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-saudi-green/10 text-saudi-glow px-2 py-0.5 rounded-full border border-saudi-green/20">
                      {u.role || "مستخدم"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Followers / Following List Modal */}
      <AnimatePresence>
        {showFollowersModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[85] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-950 border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
            >
              <div className="p-5 border-b border-white/5 bg-neutral-900/40 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-saudi-green" />
                  {showFollowersModal === "followers" ? "قائمة المتابعين المعتمدين" : "الذين تتابعهم على المنصة"}
                </h3>
                <button onClick={() => setShowFollowersModal(null)} className="text-gray-500 hover:text-white">&times;</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-black/10">
                {(allRegisteredUsers || []).filter(u => u.username !== displayedProfile.username).map(u => (
                  <div
                    key={u.username}
                    onClick={() => {
                      setShowFollowersModal(null);
                      navigate(`/@${u.username}`);
                    }}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-indigo-505/5 hover:bg-white/2 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white leading-none">{u.name}</span>
                          <TrustedBadge username={u.username} size="sm" />
                        </div>
                        <span className="text-[9px] text-gray-500 font-mono">@{u.username}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-saudi-glow hover:underline">عرض &larr;</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Policy Documents Modals */}
      <AnimatePresence>
        {showPolicyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[90] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-neutral-950 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 bg-neutral-900/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2.5">
                  {showPolicyModal === "privacy" && <ShieldCheck className="w-5 h-5 text-saudi-green" />}
                  {showPolicyModal === "terms" && <Scale className="w-5 h-5 text-saudi-glow" />}
                  {showPolicyModal === "delete_account" && <Trash2 className="w-5 h-5 text-red-550" />}
                  <h3 className="font-bold text-sm text-white font-tajawal">
                    {showPolicyModal === "privacy" && "سياسة الخصوصية وحماية بيانات المستخدمين"}
                    {showPolicyModal === "terms" && "الشروط والأحكام العامة للمنصة"}
                    {showPolicyModal === "delete_account" && "سياسة وضوابط حذف الحساب والبيانات"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowPolicyModal(null)} 
                  className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-black/20 custom-scrollbar font-tajawal text-right" dir="rtl">
                <div className="text-center pb-4 border-b border-white/5">
                  <span className="text-[10px] bg-saudi-green/10 text-saudi-glow px-2.5 py-1 rounded-full border border-saudi-green/20 font-mono">
                    آخر تحديث: 2026 م
                  </span>
                  <h2 className="text-base font-black text-white mt-3">SNNS.PRO &bull; المنصة الوطنية العريقة</h2>
                  <p className="text-xs text-gray-500 mt-1">نلتزم بحماية خصوصيتكم وتأمين هويتكم التراثية الرقمية وفقاً للأنظمة والتشريعات المنظمة لخدمات الفضاء السيبراني</p>
                </div>

                {showPolicyModal === "privacy" && (
                  <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                    <p className="font-bold text-saudi-glow">مرحبًا بك في SNNS.PRO. نحن نحترم خصوصية المستخدمين ونلتزم بحماية بياناتهم وفق الأنظمة المعمول بها في المملكة العربية السعودية.</p>
                    
                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        المعلومات التي نقوم بجمعها
                      </h4>
                      <p className="text-gray-400 mb-1">قد نقوم بجمع:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>الاسم ومعرف المستخدم الفريد (المستعار والاسم الكامل)</li>
                        <li>البريد الإلكتروني المعتمد</li>
                        <li>رقم الجوال لتأكيد الحساب ومنع الاختراقات</li>
                        <li>صورة الملف الشخصي والغلاف المعتمد</li>
                        <li>بيانات وتفاصيل تسجيل الدخول</li>
                        <li>عنوان IP ومعلومات بروتوكولات الجهاز لسلامة الحسابات</li>
                        <li>المحتوى التراثي والصوتيات التي يتم نشرها أو رفعها في المعرض</li>
                        <li>معلومات التوثيق والتحقق الرسمية عند طلب شارة الحساب الموثوق</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        استخدام المعلومات
                      </h4>
                      <p className="text-gray-400 mb-1 font-bold">يتم استخدام البيانات حصراً من أجل:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>تشغيل المنصة وتحسين جودة الفنون الصوتية المقدمة</li>
                        <li>حماية المستخدمين وتطبيق الضوابط السيادية لمنع الاحتيال الإلكتروني</li>
                        <li>مراجعة البلاغات الصادرة والمخالفات المرتكبة ضد شروط النشر</li>
                        <li>tفعيل طلبات التوثيق والتحقق من الحسابات الرسمية والشخصية</li>
                        <li>التواصل الإداري لخدمة العملاء والتأكيد المالي للودائع والعملات الرقمية</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        حماية البيانات والخصوصية السيبرانية
                      </h4>
                      <p className="text-gray-400 mb-1">ضوابط النظم لدينا:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>يتم تخزين كافة البيانات الحساسة في خوادم مشفرة بالكامل وآمنة وطنياً</li>
                        <li>لا يتم بيع أو مشاركة بياناتك الفردية مع أي طرف خارجي لأغراض ترويجية</li>
                        <li>يتم تقييد الوصول للمعلومات الشخصية الحساسة لضمان سرية معلومات النخبة</li>
                        <li>ملفات ووثائق التوثيق الرسمية لا يراها إلا المشرفون والمتحكمون المخولون قانونياً</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        المحتوى والأنظمة الرقابية
                      </h4>
                      <p className="text-gray-400 mb-1">تحتفظ إدارة المنصة بحقوقها في:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>مراجعة وتدقيق المحتوى الصوتي المرئي المخالف للأنظمة الوطنية</li>
                        <li>إزالة وحجب المحتوى غير القانوني فوراً ودون إشعار مسبق</li>
                        <li>تعليق، تجميد أو إيقاف الحسابات المخالفة للبنود السيادية للمنصة</li>
                        <li>اتخاذ الإجراءات التأديبية والتقييدية ضد البلاغات الكيدية وضد انتحال الشخصيات</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        الحسابات الموثقة
                      </h4>
                      <p className="text-gray-400">
                        قد نطلب عند الرغبة في التوثيق: الاسم الكامل، رقم الجوال المدني، صورة الهوية الوطنية أو السجل التجاري الرسمي، أو الدخول بحساب Google معتمد. تُسخدم هذه البيانات للأغراض المطابقة والتأكيدية البحتة.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-green" />
                        الأطفال وشروط العمر لسلامة المحتوى
                      </h4>
                      <p className="text-gray-400">
                        يجب أن يكون عمر كافة مستخدمي المنصة 13 سنة أو أكثر للاستفادة الكاملة من البثوث المباشرة الآمنة والتفاعل مع الصناع.
                      </p>
                    </div>

                    <div className="p-3 bg-saudi-green/5 border border-saudi-green/10 rounded-xl flex items-center gap-2">
                      <Lock className="w-4 h-4 text-saudi-glow shrink-0" />
                      <span className="text-[10px] text-gray-400 font-medium font-tajawal">لأي تساؤلات أو تفاصيل قانونية حول الخصوصية، يرجى التواصل عبر البريد الرسمي للمؤسسة: <a href="mailto:support@snns.pro" className="text-saudi-glow underline">support@snns.pro</a></span>
                    </div>
                  </div>
                )}

                {showPolicyModal === "terms" && (
                  <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                    <p className="font-bold text-saudi-glow">باستخدامك لمنصة SNNS.PRO الرقمية وخدماتها التراثية الراقية، فإنك تقر وتوافق صراحة على الالتزام الكامل بالشروط والأحكام التالية:</p>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow animate-pulse" />
                        الاستخدامات المحظورة والمخالفات السيادية
                      </h4>
                      <p className="text-gray-400 mb-1">يُمنع منعاً باتاً:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>نشر أو بث محتوى تزييفي يسيء للهوية الوطنية السعودية أو يخالف الأنظمة العامة.</li>
                        <li>انتحال شخصيات النخبة، أو المسؤولين، أو الشركات، أو ترويج معرفات تابعة لآخرين.</li>
                        <li>الإساءة للآخرين، التشهير، الابتزاز، أو التهديد بكافة أنواعه الرقمية.</li>
                        <li>استخدام آليات المنصة لرفع رسائل السبام، تزييف الألعاب والعملات، أو الاحتيال المالي.</li>
                        <li>رفع محتوى فني أو صوتي ينتهك حقوق الملكية الفكرية والنشر الخاصة للغير.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow" />
                        نظام البلاغات والمسؤولية القانونية
                      </h4>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>تقديم بلاغات كيدية أو إساءة استخدام غرف الإبلاغ قد يعرض الحساب المقيد للعقوبة الفورية والتجميد.</li>
                        <li>يمتلك المشرفون والأمناء الصلاحية المطلقة لمراجعة وفحص البلاغات وحذف المشاركات المخالفة.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow" />
                        حماية الحساب الشخصي
                      </h4>
                      <p className="text-gray-400">
                        المستخدم هو المسؤول الوحيد عن حماية بيانات حسابه، وتفاصيل محفظته المعتمدة. كما يحق للمنصة تجميد أو حذف أي حساب ينتهك الشروط أو يعرض المنصة للخطر.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow" />
                        سياسات البث المباشر
                      </h4>
                      <p className="text-gray-400 mb-1">يُمنع في البثوث الحية والمباشرة:</p>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li>كل محتوى عنيف، أو مروع، أو محتوى غير قانوني يقع تحت طائلة الجرائم المعلوماتية.</li>
                        <li>نشر أو نقل أخبار مزيفة أو معلومات مضللة لتضليل المتابعين.</li>
                        <li>استغلال غرف البث الآمنة أو اللقاءات لتشكيل شبهات أو التحريض ضد الآخرين.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow" />
                        العملات والهدايا وذمم المحفظة
                      </h4>
                      <p className="text-gray-400">
                        العملات الرقمية التقديرية الحصرية داخل منصة SNNS.PRO هي لتقدير المبدعين وهدايا تذكارية غير قابلة للاسترجاع إلا وفق ضوابط السحب والتحويل المعتمدة على الحساب البنكي، ويحق للإدارة تجميد الودائع للمحافظ المشتبه بمشاركتها في عمليات احتيالية.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-saudi-glow" />
                        منح شارات التوثيق المعتمدة
                      </h4>
                      <p className="text-gray-400">
                        تُمنح شارات التحقق الذهبية أو الزرقاء والميزات بحسب تقدير إدارة المنصة السيادي للتحقق من هوية الشخص، ولا تُعد حقاً مكتسباً يمكن المطالبة به دون التقيد التام بمعايير الأمن والتحقق.
                      </p>
                    </div>
                  </div>
                )}

                {showPolicyModal === "delete_account" && (
                  <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
                    <p className="font-bold text-red-400">نحن في SNNS.PRO ندرك رغبة المستخدمين في التحكم المستقل ببياناتهم الرقمية ونتيح لكم سياسة الحذف الذاتي والنهائي للحساب والبيانات.</p>

                    <div>
                      <h4 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        إجراءات ومآل حذف الحساب والبيانات الشخصية
                      </h4>
                      <ul className="list-disc pr-5 space-y-1 text-[11px] text-gray-400">
                        <li><strong>إزالة الملف والملحقات:</strong> عند تأكيد طلب الحذف، يتم فوراً إخفاء ملفك الشخصي بالكامل وصورتك وأعمالك وتراثك الصوتي عن المتابعين والزوار.</li>
                        <li><strong>حذف البيانات المباشرة:</strong> يتم مسح كافة بيانات التسجيل الشخصية بما يتوافق مع الأنظمة السعودية لخصوصية المستخدم.</li>
                        <li><strong>السجلات الاحتياطية الاستثنائية:</strong> قد تحتفظ المنصة ببعض سجلات الأمان أو العمليات المالية للامتثال القانوني، أو التحقق من عدم تهرب الحساب من بلاغ نشط أو قضية أمنية جارية وبلاغات نشطة.</li>
                        <li><strong>المعالجة وتأكيد الحذف:</strong> تستغرق مراجعة ومعالجة الطلب كلياً بضعة أيام للتأكد من خلو محفظتك من الالتزامات وملاءمتك للشروط.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-2xl space-y-3">
                      <p className="text-[11px] text-red-400 font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        تحذير أمني هام قبل التأكيد:
                      </p>
                      <p className="text-[10px] text-gray-400">
                        حذف الحساب هو إجراء لا يمكن استرجاعه. ستفقد كافة أعمالك، ومستلم الهدايا في محفظتك، وشارة التوثيق الذهبية المخصصة فورياً.
                      </p>
                      
                      <button 
                        onClick={() => {
                          if (confirm("هل أنت متأكد تماماً من رغبتك في تقديم طلب حذف حسابك وبياناتك بشكل نهائي من SNNS.PRO؟ لا يمكن التراجع عن هذا الإجراء لسلامة البيانات.")) {
                            alert("مرحباً بك، تم تسجيل طلب حذف حسابك تحت الرقم المرجعي الموثق #DEL-2026-X842A. سيتم تجميد حسابك حالياً ومسح بياناتك بالكامل خلال ٧٢ ساعة بعد انتهاء مراجعة المشرفين المعتمدين لسلامة المحفظة. شكراً لتواجدك معنا.");
                            setShowPolicyModal(null);
                          }
                        }}
                        className="w-full py-2.5 bg-red-900/40 text-red-200 border border-red-800 hover:bg-red-900 transition-all font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        أنا متأكد، تقديم طلب حذف الحساب والبيانات فورياً 🔴
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-white/5 bg-neutral-900/60 flex items-center justify-end shrink-0">
                <button 
                  onClick={() => setShowPolicyModal(null)}
                  className="px-6 py-2 bg-white/5 text-gray-400 rounded-xl text-xs hover:bg-white/10 transition-all cursor-pointer font-bold font-tajawal"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide Upload Video Modal */}
      <AnimatePresence>
        {showUploadVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative my-8"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-bold font-tajawal text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-saudi-glow" />
                  رفع فيديو جديد على المنصة
                </h3>
                <button onClick={() => setShowUploadVideo(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {videoUploadProgress >= 0 ? (
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-saudi-green/10 rounded-full flex items-center justify-center mx-auto relative">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-saudi-green rounded-full opacity-20 blur-md"
                    />
                    <Upload className="w-10 h-10 text-saudi-glow animate-bounce" />
                  </div>
                  <h4 className="font-bold text-lg">جاري معالجة ورفع الفيديو الفاخر...</h4>
                  <div className="w-full bg-dark-border h-3 rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div 
                      className="h-full bg-saudi-green shadow-[0_0_10px_rgba(0,132,61,0.5)]"
                      animate={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{videoUploadProgress}% مكتمل</p>
                </div>
              ) : (
                <form onSubmit={handleUploadVideoSubmit} className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-dark-border hover:border-saudi-green/40 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                       onClick={() => {
                         // choose an Unsplash preset image to act as the gorgeous video preview file
                         const presets = [
                           "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=800&fit=crop",
                           "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&fit=crop",
                           "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&fit=crop"
                         ];
                         const picked = presets[Math.floor(Math.random() * presets.length)];
                         setPhotoFile(picked);
                       }}
                  >
                    {photoFile ? (
                      <div className="space-y-2">
                        <img src={photoFile} alt="Preview" className="w-32 aspect-video object-cover mx-auto rounded-lg border border-saudi-green" />
                        <p className="text-xs text-saudi-glow">تم اختيار ملف الفيديو بنجاح! جاهز للمعالجة</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Play className="w-10 h-10 text-gray-500 mx-auto" />
                        <p className="text-sm font-bold font-tajawal">اضغط هنا لاختيار ملف الفيديو من جهازك</p>
                        <p className="text-[10px] text-gray-500">أو اسحب وأفلت الملف مباشرة (الحد الأقصى ١٢٠ ميغابايت)</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">عنوان الفيديو</label>
                    <input 
                      type="text" 
                      required
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none" 
                      placeholder="اكتب عنواناً جذاباً وملائماً للفيديو"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 font-bold">التصنيف</label>
                      <select 
                        value={videoCategory}
                        onChange={(e) => setVideoCategory(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-3 text-sm focus:border-saudi-green outline-none text-white appearance-none"
                      >
                        <option value="سفر وسياحة">سفر وسياحة</option>
                        <option value="ثقافة وفن">ثقافة وفن</option>
                        <option value="مستكشف نجد">مستكشف نجد</option>
                        <option value="تكنولوجيا الصحراء">تكنولوجيا الصحراء</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 font-bold">الخصوصية</label>
                      <select 
                        value={videoPrivacy}
                        onChange={(e) => setVideoPrivacy(e.target.value)}
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-3 text-sm focus:border-saudi-green outline-none text-white appearance-none"
                      >
                        <option value="public">عام (مرئي للكل)</option>
                        <option value="followers_only">المتابعين فقط</option>
                        <option value="private">خاص</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">الوسوم (Hashtags)</label>
                    <input 
                      type="text" 
                      value={videoHashtags}
                      onChange={(e) => setVideoHashtags(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none font-mono" 
                      placeholder="#سفر #السعودية"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">وصف الفيديو التفصيلي</label>
                    <textarea 
                      rows={3}
                      value={videoDesc}
                      onChange={(e) => setVideoDesc(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none resize-none" 
                      placeholder="اشرح لمتابعيك موضوع الفيديو المثير..."
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-1 py-3 bg-saudi-green text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20">
                      نشر الفيديو الآن
                    </button>
                    <button type="button" onClick={() => setShowUploadVideo(false)} className="flex-1 py-3 bg-white/5 text-gray-400 rounded-xl text-sm">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide Upload Photo Modal */}
      <AnimatePresence>
        {showUploadPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-bold font-tajawal text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-saudi-glow" />
                  رفع صورة جديدة لمعرضك الفاخر
                </h3>
                <button onClick={() => setShowUploadPhoto(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {photoUploadProgress >= 0 ? (
                <div className="p-12 text-center space-y-6">
                  <Upload className="w-10 h-10 text-saudi-glow animate-bounce mx-auto" />
                  <h4 className="font-bold text-lg">جاري حفظ ومعالجة الصورة بمكان آمن...</h4>
                  <div className="w-full bg-dark-border h-3 rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div 
                      className="h-full bg-saudi-green shadow-[0_0_10px_rgba(0,132,61,0.5)]"
                      animate={{ width: `${photoUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">{photoUploadProgress}% مكتمل</p>
                </div>
              ) : (
                <form onSubmit={handleUploadPhotoSubmit} className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-dark-border hover:border-saudi-green/40 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                       onClick={() => {
                         // choose an Unsplash preset image
                         const presets = [
                           "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=800&fit=crop",
                           "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&fit=crop",
                           "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&fit=crop"
                         ];
                         const picked = presets[Math.floor(Math.random() * presets.length)];
                         setPhotoFile(picked);
                       }}
                  >
                    {photoFile ? (
                      <div className="space-y-2">
                        <img src={photoFile} alt="Preview" className="w-40 h-40 object-cover mx-auto rounded-xl border border-saudi-green" />
                        <p className="text-xs text-saudi-glow font-bold">تم تحديد الصورة بنجاح</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-10 h-10 text-gray-500 mx-auto" />
                        <p className="text-sm font-bold font-tajawal">اضغط لاختيار صورة مذهلة من جهازك</p>
                        <p className="text-[10px] text-gray-500">حجم الملف الأقصى: ١٥ ميغابايت</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">التعليق المكتوب (Caption)</label>
                    <textarea 
                      rows={2}
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none resize-none font-tajawal" 
                      placeholder="شارك بعض الكلمات المشوقة الراقية حول الصورة..."
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-1 py-3 bg-saudi-green text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20">
                      رفع الصورة الآن
                    </button>
                    <button type="button" onClick={() => setShowUploadPhoto(false)} className="flex-1 py-3 bg-white/5 text-gray-400 rounded-xl text-sm">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide Verification Request Modal */}
      <AnimatePresence>
        {showVerificationRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-bold font-tajawal text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-saudi-glow" />
                  تقديم طلب توثيق رسمي للحساب
                </h3>
                <button onClick={() => setShowVerificationRequest(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isVerifSubmitted ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-saudi-green/10 rounded-full flex items-center justify-center text-saudi-glow mx-auto animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg font-tajawal">تم إرسال طلب التوثيق بنجاح!</h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                    سيقوم فريق المراجعة في إدارة SNNS.PRO بمراجعة الوثائق المرفقة ومراجعة الهوية للتحقق من طلبك وإصدار الشارة المناسبة خلال ٢٤ ساعة.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleVerificationRequestSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">الاسم الكامل المطابق للهوية الوطنية أو السجل التجاري</label>
                    <input 
                      type="text" 
                      required
                      value={verifFullName}
                      onChange={(e) => setVerifFullName(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none animate-fade-in" 
                      placeholder="الاسم الثلاثي أو اسم المنشأة"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">نوع الشارة المطلوبة</label>
                    <select 
                      value={verifBadgeType}
                      onChange={(e) => setVerifBadgeType(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-3 text-sm focus:border-saudi-green outline-none text-white text-right appearance-none"
                    >
                      <option value="creator">شارة صانع محتوى متميز (خضراء)</option>
                      <option value="official">شارة توثيق الحساب الرسمية (زرقاء)</option>
                      <option value="business">شارة قطاع الأعمال الراقية (ذهبية/سوداء)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">إرفاق بطاقة الهوية الوطنية أو الملف الثبوتي</label>
                    <div 
                      onClick={() => setVerifDocName("Saudi_ID_Verification_Document.pdf")}
                      className="border-2 border-dashed border-dark-border hover:border-saudi-green/40 rounded-xl p-5 text-center cursor-pointer transition-colors"
                    >
                      {verifDocName ? (
                        <p className="text-xs text-saudi-glow font-bold">📎 {verifDocName} (تم الإرفاق)</p>
                      ) : (
                        <p className="text-xs text-gray-400">اضغط هنا لإرفاق صورة الهوية أو السجل (PDF, JPG)</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button type="submit" className="flex-1 py-3 bg-saudi-green text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20">
                      إرسال الطلب للمراجعة
                    </button>
                    <button type="button" onClick={() => setShowVerificationRequest(false)} className="flex-1 py-3 bg-white/5 text-gray-400 text-sm rounded-xl">
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide Wallet recharging and withdrawal Dialog */}
      <AnimatePresence>
        {showWalletDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-dark-surface border border-dark-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 border-b border-dark-border flex justify-between items-center">
                <h3 className="font-bold font-tajawal text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-saudi-glow" />
                  رصيد المحفظة والعملات الذهبية
                </h3>
                <button onClick={() => setShowWalletDetails(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success Notification */}
              {walletSuccessMessage && (
                <div className="mx-6 mt-6 p-4 bg-saudi-green/10 border border-saudi-green/30 text-saudi-glow text-xs font-bold rounded-2xl">
                  {walletSuccessMessage}
                </div>
              )}

              {/* Local Tabs */}
              <div className="flex border-b border-dark-border px-6 mt-4">
                <button 
                  onClick={() => setWalletTab("charge")}
                  className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${walletTab === "charge" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500"}`}
                >
                  شراء عملات (شحن)
                </button>
                <button 
                  onClick={() => setWalletTab("withdraw")}
                  className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${walletTab === "withdraw" ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500"}`}
                >
                  استرداد وسحب أرباحك
                </button>
              </div>

              {walletTab === "charge" ? (
                <div className="p-6 space-y-6">
                  <p className="text-xs text-gray-400">اختر أحد الباقات الحصرية لشحن رصيد عملاتك لدعم صناعك المفضلين على SNNS.PRO:</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleRechargeSubmit(500)} className="p-4 bg-dark-bg border border-dark-border rounded-xl text-center hover:border-saudi-green transition-all group">
                      <span className="block text-xl font-bold font-mono">٥٠٠</span>
                      <span className="block text-[8px] text-saudi-glow font-bold">عملة</span>
                      <span className="block text-[9px] text-gray-500 mt-2 font-black">١٩.٩٩ ر.س</span>
                    </button>
                    <button onClick={() => handleRechargeSubmit(2000)} className="p-4 bg-dark-bg border border-saudi-green hover:border-saudi-green rounded-xl text-center relative group">
                      <div className="absolute top-1 inset-x-0 mx-auto w-fit bg-saudi-green text-white text-[7px] font-bold px-1.5 py-0.5 rounded">الأكثر طلباً</div>
                      <span className="block text-xl font-bold font-mono mt-1">٢,٠٠٠</span>
                      <span className="block text-[8px] text-saudi-glow font-bold">عملة</span>
                      <span className="block text-[9px] text-gray-200 mt-2 font-black">٨٩.٩٩ ر.س</span>
                    </button>
                    <button onClick={() => handleRechargeSubmit(5000)} className="p-4 bg-dark-bg border border-dark-border rounded-xl text-center hover:border-saudi-green transition-all group">
                      <span className="block text-xl font-bold font-mono">٥,٠٠٠</span>
                      <span className="block text-[8px] text-saudi-glow font-bold">عملة</span>
                      <span className="block text-[9px] text-gray-500 mt-2 font-black">١٩٩.٩٩ ر.س</span>
                    </button>
                  </div>

                  <div className="p-4 bg-dark-bg border border-dark-border rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-bold">الضيافة عبر Apple Pay</p>
                        <p className="text-[10px] text-gray-500">رقم آمن ومتصل بنسخ دفع الهواتف الذكية</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-saudi-glow font-bold">مفعل</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
                  <p className="text-xs text-gray-400">يمكنك سحب وتحويل قيمة العملات المستلمة من الهدايا إلى رصيد مالي بالريال السعودي مباشرة لحسابك البنكي المحلي:</p>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">رقم الأيبان البنكي (Local IBAN)</label>
                    <input 
                      type="text" 
                      required
                      value={walletIBAN}
                      onChange={(e) => setWalletIBAN(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs focus:border-saudi-green outline-none font-mono tracking-wider" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-bold">مجموع العملات التي تود سحبها</label>
                    <input 
                      type="number" 
                      required
                      placeholder="الأدنى ١,٠٠٠ عملة"
                      value={walletWithdrawAmount}
                      onChange={(e) => setWalletWithdrawAmount(e.target.value)}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-saudi-green outline-none font-mono" 
                    />
                    <span className="text-[9px] text-gray-500 mt-1 block">ملاحظة: كل ١,٠٠٠ عملة تعادل ٢٥٠ ريال سعودي تقريباً.</span>
                  </div>

                  <button type="submit" className="w-full py-3 bg-saudi-green text-white rounded-xl text-sm font-bold shadow-lg shadow-saudi-green/20">
                    تقديم طلب السحب المالي
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Google Sign-In simulated popup */}
      <AnimatePresence>
        {showGoogleSignIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99] flex items-center justify-center p-4 select-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white text-gray-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 font-sans border border-gray-100"
            >
              {/* Google Header */}
              <div className="flex flex-col items-center text-center space-y-2 pb-6 border-b border-gray-100">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-1.14 2.77-2.4 3.61v3.02h3.87c2.26-2.08 3.58-5.14 3.58-8.46z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-4.99H1.27v3.12C3.25 21.32 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.24 14.24a7.19 7.19 0 0 1 0-4.48V6.64H1.27a11.96 11.96 0 0 0 0 10.72l3.97-3.12z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.37 0 3.25 2.68 1.27 6.64l3.97 3.12c.95-2.86 3.61-4.99 6.76-4.99z" />
                </svg>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">سجل الدخول باستخدام Google</h3>
                <p className="text-xs text-gray-500 font-medium">للمتابعة والربط المباشر مع منصة SNNS.PRO</p>
              </div>

              {/* Accounts Selector Section */}
              <div className="pt-5 space-y-3">
                <button 
                  onClick={async () => {
                    try {
                      const result = await signInWithPopup(auth, googleProvider);
                      const user = result.user;
                      if (user) {
                        const gUser = {
                          id: "G_" + user.uid,
                          name: user.displayName || "مستخدم قوقل",
                          email: user.email || "",
                          avatar: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
                        };
                        setGoogleUser(gUser);
                        localStorage.setItem("snns_google_user", JSON.stringify(gUser));
                        
                        const updatedProfile = {
                          ...profile,
                          name: gUser.name,
                          avatar: gUser.avatar,
                          username: gUser.email.split("@")[0] || "google_user",
                          bio: "مستخدم سعودي موثق | متصل عبر حساب Google المعتمد الحقيقي 🇸🇦",
                        };
                        setProfile(updatedProfile);
                        localStorage.setItem("snns_user_profile", JSON.stringify(updatedProfile));
                        
                        setEditName(gUser.name);
                        setEditAvatarUrl(gUser.avatar);

                        triggerShareToast("✓ تسجيل الدخول بحساب Google الحقيقي بنجاح!");
                        setShowGoogleSignIn(false);
                      }
                    } catch (err: any) {
                      alert("⚠️ تعذر الاتصال المباشر بـ Google. يرجى اختيار أحد الحسابات السريعة أدناه أو كتابة بيانات يدويّة.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-blue-600 font-extrabold text-xs text-white hover:bg-blue-700 transition-colors shadow-[0_4px_12px_rgba(37,99,235,0.2)] cursor-pointer"
                >
                  <svg className="w-4 h-4 text-white fill-white shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.078 0-5.586-2.433-5.586-5.513s2.508-5.513 5.586-5.513c1.38 0 2.632.503 3.599 1.43l3.203-3.21C18.816 3.66 15.7 2.4 12.24 2.4 6.784 2.4 2.4 6.784 2.4 12.24s4.384 9.84 9.84 9.84 9.84-4.384 9.84-9.84c0-.737-.08-1.442-.24-2.115H12.24z"/>
                  </svg>
                  <span>الدخول المباشر بحساب Google الحقيقي</span>
                </button>

                <div className="relative text-center my-3">
                  <span className="bg-white px-3 text-[10px] text-gray-400 font-semibold relative z-10">أو تجربة حسابات تفاعلية محاكاة</span>
                  <hr className="absolute top-1/2 left-0 right-0 border-gray-100 -z-1" />
                </div>

                <p className="text-[10px] font-bold text-gray-400 text-right pr-1">حسابات تجريبية سريعة بنقرة واحدة:</p>

                {/* Account Preset 1 (User Email) */}
                <button 
                  onClick={() => {
                    const gUser = {
                      id: "G_SU666",
                      name: "سليمان العتيبي",
                      email: "su66666su@gmail.com",
                      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
                    };
                    setGoogleUser(gUser);
                    localStorage.setItem("snns_google_user", JSON.stringify(gUser));
                    
                    // Copy coordinates to active profile
                    const updatedProfile = {
                      ...profile,
                      name: gUser.name,
                      avatar: gUser.avatar,
                      username: "su66666su",
                      bio: "مستخدم سعودي موثق | متصل عبر حساب Google المعتمد ومطابق للمعايير 🇸🇦",
                    };
                    setProfile(updatedProfile);
                    localStorage.setItem("snns_user_profile", JSON.stringify(updatedProfile));
                    
                    // Sync Edit values as well
                    setEditName(gUser.name);
                    setEditAvatarUrl(gUser.avatar);

                    triggerShareToast("تسجيل الدخول بقوقل بنجاح");
                    setShowGoogleSignIn(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" 
                      alt="Google avatar" 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">سليمان العتيبي</h4>
                      <p className="text-[10px] text-gray-500 font-mono">su66666su@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-saudi-green/10 text-saudi-green px-2 py-0.5 rounded font-bold font-tajawal">موصى به</span>
                </button>

                {/* Account Preset 2 */}
                <button 
                  onClick={() => {
                    const gUser = {
                      id: "G_YASMINE",
                      name: "ياسمين الحربي",
                      email: "yasmine.h@gmail.com",
                      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
                    };
                    setGoogleUser(gUser);
                    localStorage.setItem("snns_google_user", JSON.stringify(gUser));
                    
                    const updatedProfile = {
                      ...profile,
                      name: gUser.name,
                      avatar: gUser.avatar,
                      username: "yasmine_h",
                      bio: "مستكشفة وصانعة محتوى سعودية متميزة | مسجلة بـ Google 🇸🇦",
                    };
                    setProfile(updatedProfile);
                    localStorage.setItem("snns_user_profile", JSON.stringify(updatedProfile));
                    
                    setEditName(gUser.name);
                    setEditAvatarUrl(gUser.avatar);

                    triggerShareToast("تسجيل الدخول بقوقل بنجاح");
                    setShowGoogleSignIn(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-right cursor-pointer"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt="Google avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">ياسمين الحربي</h4>
                    <p className="text-[10px] text-gray-500 font-mono">yasmine.h@gmail.com</p>
                  </div>
                </button>

                {/* Custom User Custom Input Section */}
                <div className="pt-3 border-t border-gray-100 space-y-2.5">
                  <p className="text-[10px] font-bold text-gray-500 text-right pr-1">أو كتابة بيانات حساب قوقل مخصص:</p>
                  
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="الاسم الكامل بقوقل"
                      value={googleNameInput}
                      onChange={(e) => setGoogleNameInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 text-right font-medium" 
                    />
                    <input 
                      type="email" 
                      placeholder="بريد Gmail الإلكتروني"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500 text-right font-mono" 
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (!googleNameInput || !googleEmailInput) {
                        alert("يرجى ملء الاسم والبريد الإلكتروني لإتمام عملية المحاكاة!");
                        return;
                      }
                      const gUser = {
                        id: "G_CUSTOM_" + Math.floor(1000 + Math.random() * 9000),
                        name: googleNameInput,
                        email: googleEmailInput,
                        avatar: googleAvatarInput
                      };
                      setGoogleUser(gUser);
                      localStorage.setItem("snns_google_user", JSON.stringify(gUser));
                      
                      const updatedProfile = {
                        ...profile,
                        name: gUser.name,
                        avatar: gUser.avatar,
                        username: gUser.email.split("@")[0] || "google_user",
                        bio: "مستخدم ذكي | متصل عبر بوابات Google الموثقة 🌐",
                      };
                      setProfile(updatedProfile);
                      localStorage.setItem("snns_user_profile", JSON.stringify(updatedProfile));
                      
                      setEditName(gUser.name);
                      setEditAvatarUrl(gUser.avatar);

                      triggerShareToast("تم الدخول والتزامن بنجاح");
                      setShowGoogleSignIn(false);
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    الدخول بالحساب المكتوب
                  </button>
                </div>
              </div>

              {/* Cancel Button */}
              <button 
                onClick={() => setShowGoogleSignIn(false)}
                className="w-full text-center mt-5 text-xs text-gray-400 font-medium hover:text-gray-600 block transition-colors"
              >
                إلغاء وتراجع
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Vertical Video Player TikTok style Modal Screen Overlay */}
      <AnimatePresence>
        {activePlayVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[99] overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-white/5"
          >
            {/* Immersive Visual Player Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
              {/* Blur background */}
              <div className="absolute inset-0 filter blur-2xl opacity-40 scale-110 pointer-events-none">
                <img src={activePlayVideo.thumbnailUrl} alt="Background visual blur" className="w-full h-full object-cover" />
              </div>

              {/* Main Simulated video */}
              <div className="relative w-full h-full max-w-[450px] aspect-[9/16] bg-black shadow-2xl overflow-hidden flex flex-col justify-end">
                <img 
                  src={activePlayVideo.thumbnailUrl} 
                  alt="Simulated video file" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80" 
                />
                {/* Visual Gradient protection */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent pointer-events-none" />

                {/* Immersive Controls overlap */}
                <div className="relative z-10 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-saudi-green overflow-hidden">
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{profile.name}</h4>
                      <p className="text-[10px] text-gray-300">@{profile.username}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-base font-tajawal leading-snug">{activePlayVideo.title}</h3>
                  <p className="text-xs text-gray-300 leading-normal line-clamp-3">{activePlayVideo.description}</p>
                  <p className="text-xs text-saudi-glow font-mono font-bold">{activePlayVideo.hashtags}</p>
                </div>

                {/* Simulated playback bar */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="h-full bg-saudi-green shadow-[0_0_10px_#00A34F]"
                  />
                </div>
              </div>

              {/* Close Button top corner */}
              <button 
                onClick={() => setActivePlayVideo(null)} 
                className="absolute top-6 right-6 z-50 p-2.5 bg-black/50 backdrop-blur-md text-white/80 hover:text-white rounded-full border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Details, Comments and Interactions Area */}
            <div className="w-full md:w-[380px] h-[340px] md:h-full bg-dark-bg border-r border-dark-border/40 shrink-0 flex flex-col overflow-hidden relative z-20">
              <div className="p-5 border-b border-dark-border/40 flex justify-between items-center bg-dark-surface">
                <div>
                  <h4 className="font-bold font-tajawal text-sm">التفاعلات والتعليقات المباشرة</h4>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {activePlayVideo.id}</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleVideoLike(activePlayVideo)} 
                    className="p-2.5 hover:bg-white/5 rounded-xl border border-white/5 transition-all text-red-500 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${activePlayVideo.hasLiked ? "fill-red-500" : ""}`} />
                    <span className="text-xs font-mono font-bold text-gray-300">{activePlayVideo.likes}</span>
                  </button>
                  
                  {creatorAllowDownloads ? (
                    <button 
                      onClick={() => {
                        setDownloadTargetContent({
                          id: activePlayVideo.id,
                          title: activePlayVideo.title,
                          type: "video",
                          url: activePlayVideo.thumbnailUrl,
                          creator: displayedProfile.username,
                        });
                        setShowDownloadModal(true);
                      }}
                      className="p-2.5 bg-saudi-green/10 hover:bg-saudi-green text-saudi-glow hover:text-white rounded-xl border border-saudi-green/30 transition-all cursor-pointer"
                      title="تحميل المقال/الفيديو 📥"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="p-2.5 bg-white/2 text-gray-600 rounded-xl border border-white/5 cursor-not-allowed opacity-50"
                      title="التحميل معطل من الصانع"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  )}

                  <button 
                    onClick={() => initiateShare(activePlayVideo.id.toString(), "video", activePlayVideo.title, activePlayVideo.creator, `${activePlayVideo.views} مشاهدة`, activePlayVideo.thumbnailUrl)}
                    className="p-2.5 hover:bg-white/5 rounded-xl border border-white/5 text-gray-400 font-bold cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable comments list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {activePlayVideo.comments.map((cmt, idx) => (
                  <div key={idx} className="flex gap-3 text-xs bg-white/2 p-3.5 rounded-2xl border border-white/5 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-saudi-green/10 flex items-center justify-center font-bold text-saudi-glow shrink-0">
                      {cmt.user[0]}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-200">{cmt.user}</span>
                          <TrustedBadge username={getUsernameFromDisplayName(cmt.user)} size="sm" />
                          <span className="text-[9px] text-gray-600 font-mono">{cmt.time}</span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            let contactId = "sara_a";
                            if (cmt.user.includes("عبدالله Шمري") || cmt.user.includes("الشمري") || cmt.user.toLowerCase().includes("abdullah")) {
                              contactId = "abdullah_sh";
                            } else if (cmt.user.includes("نورة") || cmt.user.toLowerCase().includes("noura")) {
                              contactId = "noura_ali";
                            } else if (cmt.user.includes("فهد") || cmt.user.toLowerCase().includes("f_harbi") || cmt.user.includes("الحربي")) {
                              contactId = "fhd_hrb";
                            }
                            setActivePlayVideo(null);
                            tryOpenPrivateChat(contactId);
                          }}
                          className="text-[9px] text-saudi-glow hover:underline font-tajawal cursor-pointer flex items-center gap-1 shrink-0 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md active:scale-95"
                        >
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>مراسلة 💬</span>
                        </button>
                      </div>
                      <p className="text-gray-300 leading-relaxed font-tajawal">{cmt.text}</p>
                    </div>
                  </div>
                ))}

                {activePlayVideo.comments.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                    <p className="text-xs font-tajawal">لا يوجد أي تعليقات بعد. كن أول من يعلق!</p>
                  </div>
                )}
              </div>

              {/* Add Comment bottom form */}
              <form onSubmit={handleAddComment} className="p-4 border-t border-dark-border/40 bg-dark-surface flex gap-2">
                <input 
                  type="text" 
                  value={userCommentText}
                  onChange={(e) => setUserCommentText(e.target.value)}
                  placeholder="اكتب تعليقاً راقياً الآن..." 
                  className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs focus:border-saudi-green outline-none" 
                />
                <button type="submit" className="px-5 bg-saudi-green text-white font-bold text-xs rounded-xl hover:bg-saudi-green/90 transition-colors shrink-0">
                  إرسال
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation on desktop side for easy usage */}
      <footer className="max-w-xl mx-auto text-center py-10 opacity-30 text-[10px] font-mono select-none pointer-events-none">
        SNNS.PRO Premium Saudi Platforms Console V2.0
      </footer>

      {/* Mobile Bottom Bar navigation system */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-dark-bg/95 border-t border-dark-border px-8 py-4 flex justify-between items-center z-50 backdrop-blur-md">
        <NavIcon icon={<Home />} label="الرئيسية" active />
        <NavIcon icon={<Search />} label="اكتشف" onClick={() => setShowSearchModal(true)} />
        <div className="relative -mt-8">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowUploadVideo(true)}
            className="w-12 h-12 bg-saudi-green rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(0,132,61,0.4)] border border-saudi-glow/20"
          >
            <PlusSquare className="w-7 h-7 text-white" />
          </motion.button>
        </div>
        <NavIcon icon={<MessageCircle />} label="الرسائل" onClick={() => tryOpenPrivateChat(null)} />
        <NavIcon icon={<User />} label="حسابي" active />
      </nav>

      {/* Smart Sentry User Control Center */}
      <SmartSentryUserModal 
        isOpen={showSmartSentryUserModal}
        onClose={() => setShowSmartSentryUserModal(false)}
        username={profile.username}
      />

      {/* Unified Registration and Authentication Gateway */}
      <RegistrationModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onRegistrationSuccess={(newProfile, isBusiness) => {
          localStorage.setItem("snns_user_profile", JSON.stringify(newProfile));
          setProfile(newProfile);
          setDisplayedProfile(newProfile);
          setShowAuthModal(false);
          if (isBusiness) {
            setActiveTab("business_ads");
          } else {
            setActiveTab("posts");
          }
          alert("✓ تمت المزامنة والتحقق بنجاح! سيتم الآن تحديث ديوانيتك بالصلاحيات الجديدة.");
          window.location.reload();
        }}
      />

      {/* Smart Share Modal Overlay */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={selectedShareItem}
        onInternalShareSuccess={(msg) => {
          // Trigger a beautiful visual confirmation toast or feedback
          triggerShareToast("تمت المشاركة داخل غرف المحادثة بنجاح 🇸🇦");
        }}
      />

      {/* Saudi Sovereign Downloads Engine Overlay Modal */}
      <ContentDownloadModal 
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        content={downloadTargetContent}
        creatorAllowDownloads={creatorAllowDownloads}
      />
    </div>
  );
}

export default function App() {
  const [geoInfo, setGeoInfo] = useState<any>(null);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [accessResult, setAccessResult] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function initCheck() {
      setLoadingGeo(true);
      try {
        const geo = await detectGeoIP();
        setGeoInfo(geo);
        
        let username = "guest";
        try {
          const saved = localStorage.getItem("snns_user_profile");
          if (saved) {
            username = JSON.parse(saved).username || "guest";
          }
        } catch {}

        const res = evaluateAccess(username, geo.ip, geo.countryCode, geo.vpnDetected, "view_content");
        setAccessResult(res);
      } catch (err) {
        console.error("GeoIP evaluation error:", err);
      } finally {
        setLoadingGeo(false);
      }
    }
    
    initCheck();
    
    const onGeoChanged = () => {
      setRefreshCount(prev => prev + 1);
    };
    window.addEventListener("snns_geoip_changed", onGeoChanged);
    return () => {
      window.removeEventListener("snns_geoip_changed", onGeoChanged);
    };
  }, [refreshCount]);

  // If we are currently loading, show a neat themed splash loader
  if (loadingGeo) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center text-center p-6 font-tajawal" dir="rtl">
        <div className="w-16 h-16 border-4 border-t-saudi-green border-white/5 rounded-full animate-spin mb-6" />
        <h2 className="text-lg font-bold">جاري الفحص الأمني للاتصال... 🔒</h2>
        <p className="text-xs text-gray-550 mt-2">نقوم بالتحقق الآمن من موقعك الجغرافي وحماية الحدود الرقمية لمنصة SNNS.PRO</p>
      </div>
    );
  }

  // If the user's country is fully blocked for viewing, intercept and display the Access Denied guard overlay
  // Note: Only enforce if they are not visiting /admin, to always allow administrators to unlock them in admin view!
  const isViewingAdmin = window.location.pathname.startsWith("/admin");
  if (accessResult?.blocked && !isViewingAdmin) {
    return <AccessDeniedScreen geoInfo={geoInfo} onRefresh={() => setRefreshCount(prev => prev + 1)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/access-portal" element={<AccessPortal />} />
      <Route path="/secure-access" element={<AccessPortal />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/admin/*" element={
        <AdminRouteGuard>
          <AdminDashboard initialSection="overview" />
        </AdminRouteGuard>
      } />
      <Route path="/security" element={
        <AdminRouteGuard>
          <AdminDashboard initialSection="sentry" />
        </AdminRouteGuard>
      } />
      <Route path="/reports" element={
        <AdminRouteGuard>
          <AdminDashboard initialSection="reports" />
        </AdminRouteGuard>
      } />
      <Route path="/verification" element={
        <AdminRouteGuard>
          <AdminDashboard initialSection="verification" />
        </AdminRouteGuard>
      } />
      <Route path="/moderation" element={
        <AdminRouteGuard>
          <AdminDashboard initialSection="content" />
        </AdminRouteGuard>
      } />
      <Route path="/:username" element={<UserProfile />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Sub-components
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-dark-surface border border-dark-border rounded-xl text-center relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-12 h-12 bg-saudi-green/5 rounded-full blur-md -mr-4 -mt-4" />
      <span className="block text-base font-bold font-mono tracking-tight text-white group-hover:scale-105 transition-transform duration-300">{value}</span>
      <span className="text-[9px] text-gray-500 uppercase tracking-wider font-tajawal font-medium">{label}</span>
    </div>
  );
}

function TabItem({ id, current, onClick, label }: { id: string; current: string; onClick: (id: string) => void; label: string }) {
  const active = current === id;
  return (
    <button 
      onClick={() => onClick(id)}
      className={`px-5 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap font-tajawal ${active ? "border-saudi-green text-saudi-glow" : "border-transparent text-gray-500 hover:text-gray-300"}`}
    >
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 w-full col-span-full">
      <div className="w-20 h-20 mb-4 rounded-full bg-dark-surface flex items-center justify-center border border-dark-border">
        <Play className="w-8 h-8 text-saudi-green opacity-40 shrink-0" />
      </div>
      <h2 className="text-base font-bold mb-1 font-tajawal">لم يتم نشر محتوى بعد</h2>
      <p className="text-xs text-gray-500 max-w-xs font-tajawal mx-auto">
        ابدأ بمشاركة لحظاتك مع متابعيك على منصة SNNS.PRO الفاخرة
      </p>
    </div>
  );
}

function NavIcon({ icon, label, active = false, onClick }: { icon: React.ReactNode; label?: string; active?: boolean; onClick?: () => void }) {
  return (
    <motion.button 
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`p-2 transition-colors flex flex-col items-center gap-1 ${active ? "text-saudi-glow" : "text-gray-500 hover:text-gray-300"}`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      <span className="text-[8px] font-bold font-tajawal">{label}</span>
    </motion.button>
  );
}
