// shareStore.ts - High Quality Share State Management and Statistics for SNNS.PRO

export interface ShareStat {
  id: string;
  type: "live" | "video" | "post" | "account" | "audio_room";
  title: string;
  creator: string;
  viewsOrFollowers: string;
  thumbnail?: string;
  count: number;
}

export interface TrafficSource {
  source: string; // "WhatsApp" | "Telegram" | "X" | "Snapchat" | "Facebook" | "Email" | "Copy Link" | "Internal Chat"
  shares: number;
}

export interface ReferralData {
  username: string;
  name: string;
  avatar: string;
  date: string;
  status: "completed" | "pending";
  rewardCoins: number;
}

// Simulated dynamic share records
export function getOrCreateShareStats(): ShareStat[] {
  const saved = localStorage.getItem("snns_share_stats");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }

  // Initial defaults
  const defaults: ShareStat[] = [
    {
      id: "r1",
      type: "live",
      title: "بث عشاء التأسيس الحصري مع متابعينا الكرام 🇸🇦",
      creator: "عبدالله الراجحي",
      viewsOrFollowers: "٣،٢٠٠ مشاهد",
      thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&fit=crop",
      count: 412
    },
    {
      id: "v1",
      type: "video",
      title: "رحلتي الاستكشافية في جبال العُلا الخلابة",
      creator: "عبدالله الراجحي",
      viewsOrFollowers: "١٥ ألف مشاهدة",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&fit=crop",
      count: 289
    },
    {
      id: "v2",
      type: "video",
      title: "عرضة نجدية مهيبة بمناسبة يوم العلم الوطني ٣ مارس",
      creator: "سليمان الفهد",
      viewsOrFollowers: "٢٩ ألف مشاهدة",
      thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&fit=crop",
      count: 198
    },
    {
      id: "a.rajhi",
      type: "account",
      title: "الحساب الرسمي للإعلامي عبدالله الراجحي",
      creator: "عبدالله الراجحي",
      viewsOrFollowers: "١.٥ ألف متابع",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop",
      count: 145
    }
  ];

  localStorage.setItem("snns_share_stats", JSON.stringify(defaults));
  return defaults;
}

export function getOrCreateTrafficSources(): TrafficSource[] {
  const saved = localStorage.getItem("snns_traffic_sources");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }

  const defaults: TrafficSource[] = [
    { source: "واتساب", shares: 489 },
    { source: "تيليجرام", shares: 324 },
    { source: "منصة X", shares: 251 },
    { source: "سناب شات", shares: 187 },
    { source: "مشاركة داخلية", shares: 154 },
    { source: "نسخ الرابط", shares: 112 },
    { source: "فيسبوك", shares: 45 },
    { source: "البريد الإلكتروني", shares: 23 }
  ];

  localStorage.setItem("snns_traffic_sources", JSON.stringify(defaults));
  return defaults;
}

export function getOrCreateReferrals(): ReferralData[] {
  const saved = localStorage.getItem("snns_referral_invites");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }

  const defaults: ReferralData[] = [
    { username: "sultan.k", name: "سلطان الخالدي", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop", date: "منذ يومين", status: "completed", rewardCoins: 100 },
    { username: "yasser_al", name: "ياسر الحربي", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&fit=crop", date: "منذ ٣ أيام", status: "completed", rewardCoins: 100 },
    { username: "munira_m", name: "منيرة محمد", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop", date: "منذ أسبوع", status: "completed", rewardCoins: 100 },
    { username: "faisal_j", name: "فيصل الجبر", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop", date: "أمس", status: "pending", rewardCoins: 100 }
  ];

  localStorage.setItem("snns_referral_invites", JSON.stringify(defaults));
  return defaults;
}

// Logic to track share event
export function recordShareEvent(
  itemId: string,
  itemType: "live" | "video" | "post" | "account" | "audio_room",
  itemTitle: string,
  creatorName: string,
  thumbnailUrl: string,
  destination: string // "واتساب" | "تيليجرام" | "منصة X" | "سناب شات" | "فيسبوك" | "البريد الإلكتروني" | "نسخ الرابط" | "مشاركة داخلية"
) {
  // 1. Update views stats
  const stats = getOrCreateShareStats();
  const existing = stats.find((s) => s.id === itemId);
  if (existing) {
    existing.count += 1;
    existing.title = itemTitle;
    existing.thumbnail = thumbnailUrl || existing.thumbnail;
  } else {
    stats.push({
      id: itemId,
      type: itemType,
      title: itemTitle,
      creator: creatorName,
      viewsOrFollowers: itemType === "live" ? "بث مباشر" : itemType === "account" ? "صانع محتوى موثوق" : "منشور تراثي",
      thumbnail: thumbnailUrl,
      count: 1
    });
  }
  localStorage.setItem("snns_share_stats", JSON.stringify(stats));

  // 2. Update traffic source
  const sources = getOrCreateTrafficSources();
  const sourceRecord = sources.find((s) => s.source === destination);
  if (sourceRecord) {
    sourceRecord.shares += 1;
  } else {
    sources.push({ source: destination, shares: 1 });
  }
  localStorage.setItem("snns_traffic_sources", JSON.stringify(sources));
}

// Direct mock mapping of entities for previews
export function resolveShareLinkData(linkText: string): {
  id: string;
  type: "live" | "video" | "post" | "account" | "audio_room" | "invite";
  title: string;
  subtitle: string;
  imageUrl: string;
  actionText: string;
} | null {
  // Regex match for snns.pro
  // Support variations including http/https
  const clean = linkText.replace(/^(https?:\/\/)?(www\.)?/, "");
  
  if (clean.startsWith("snns.pro/live/")) {
    const id = clean.split("/").pop() || "r1";
    return {
      id,
      type: "live",
      title: "بث عشاء التأسيس الحصري مع متابعينا الكرام 🇸🇦",
      subtitle: "بواسطة عبدالله الراجحي • ٣،٢٠٠ مشاهد الآن وبث ذو جودة ناطقة بالتقاليد",
      imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&fit=crop",
      actionText: "انضم للبث المباشر 🎥"
    };
  }
  
  if (clean.startsWith("snns.pro/video/") || clean.startsWith("snns.pro/post/")) {
    const id = clean.split("/").pop() || "v1";
    const isV2 = id.includes("v2") || id === "2";
    return {
      id,
      type: "video",
      title: isV2 ? "العرضة النجدية المهيبة بمناسبة يوم العلم 🇸🇦" : "رحلتي الاستكشافية في جبال العُلا الخلابة",
      subtitle: isV2 ? "الصانع: سليمان الفهد • تراث وأصالة الفخر السعودي" : "بواسطة عبدالله الراجحي • جولات صحراوية استكشافية مهيبة",
      imageUrl: isV2 
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop",
      actionText: "شاهد المقطع الموثق 🎬"
    };
  }

  if (clean.startsWith("snns.pro/audio/") || clean.startsWith("snns.pro/audio_room/")) {
    const id = clean.split("/").pop() || "aud1";
    return {
      id,
      type: "audio_room",
      title: "ديوانية الصوت والربابة التراثية الأصيلة 🎻",
      subtitle: "جلسة صوتية حية يشارك فيها نخبة من عازفي العود السعودي والمؤرخين",
      imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&fit=crop",
      actionText: "احضر الديوانية الصوتية 🎙️"
    };
  }

  if (clean.startsWith("snns.pro/@")) {
    const username = clean.split("@").pop() || "a.rajhi";
    const users = [
      { name: "عبدالله الراجحي", username: "a.rajhi", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop" },
      { name: "سارة العتيبي", username: "sara_a", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop" },
      { name: "ليلى حسن", username: "layla_h", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&fit=crop" }
    ];
    const match = users.find(u => u.username === username) || users[0];
    return {
      id: username,
      type: "account",
      title: `الملف الشخصي: ${match.name}`,
      subtitle: `@${match.username} • صانع محتوى وطني معتمد بشارات الأمان المذهبة`,
      imageUrl: match.avatar,
      actionText: "عرض الملف والتوثيقات 🇸🇦"
    };
  }

  if (clean.startsWith("snns.pro/invite/")) {
    const sender = clean.split("/").pop() || "المشترك";
    return {
      id: sender,
      type: "invite",
      title: "🇸🇦 دعوة خاصة للانضمام إلى منصة SNNS.PRO",
      subtitle: `أرسل لك @${sender} دعوة حصرية لتجربة الفضاء الرقمي الموثق الأرقى لجمع التراث الفني وصناعة الكلمة والصوت. سجل واحصل على مكافأتك التقديرية!`,
      imageUrl: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&fit=crop",
      actionText: "قبول الدعوة والتسجيل 🤝"
    };
  }

  return null;
}
