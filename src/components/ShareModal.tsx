import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Navigation,
  Share2, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Globe, 
  Eye, 
  Award,
  Lock,
  MessageCircle,
  Twitter,
  Facebook,
  PhoneCall
} from "lucide-react";
import { recordShareEvent } from "../utils/shareStore";
import { TrustedBadge } from "./TrustedBadge";

export interface ShareItem {
  id: string;
  type: "live" | "video" | "post" | "account" | "audio_room";
  title: string;
  creator: string;
  viewsOrFollowers?: string;
  thumbnail?: string;
  username?: string; // for accounts
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem | null;
  onInternalShareSuccess?: (messageText: string) => void;
}

export function ShareModal({ isOpen, onClose, item, onInternalShareSuccess }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"options" | "og_simulator" | "deep_link">("options");
  const [internalContacts, setInternalContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [internalShareSuccess, setInternalShareSuccess] = useState(false);
  
  // Custom deep link simulator values
  const [deviceOS, setDeviceOS] = useState<"iOS" | "Android">("iOS");
  const [deepLinkRunning, setDeepLinkRunning] = useState(false);
  const [deepLinkResult, setDeepLinkResult] = useState<"app" | "browser" | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load saved contacts to support "Share Inside Platform"
      const saved = localStorage.getItem("snns_chat_contacts");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setInternalContacts(parsed);
          if (parsed.length > 0) {
            setSelectedContactId(parsed[0].id);
          }
        } catch {}
      }
      setInternalShareSuccess(false);
      setCopied(false);
      setActiveTab("options");
    }
  }, [isOpen]);

  if (!item) return null;

  // Link generator
  const getSmartLink = () => {
    switch (item.type) {
      case "live":
        return `snns.pro/live/${item.id}`;
      case "video":
        return `snns.pro/video/${item.id}`;
      case "post":
        return `snns.pro/post/${item.id}`;
      case "account":
        return `snns.pro/@${item.username || item.id}`;
      case "audio_room":
        return `snns.pro/audio_room/${item.id}`;
      default:
        return `snns.pro/post/${item.id}`;
    }
  };

  const shareLink = getSmartLink();

  // Social sharing handlers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${shareLink}`);
    setCopied(true);
    recordShareEvent(item.id, item.type, item.title, item.creator, item.thumbnail || "", "نسخ الرابط");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSocialShare = (platform: string, destination: string) => {
    let url = "";
    const text = encodeURIComponent(`شاهد هذا المحتوى الفاخر الموثق على منصة SNNS.PRO الوطنية 🇸🇦:\n${item.title}\n`);
    const finalUrl = encodeURIComponent(`https://${shareLink}`);

    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${text}${finalUrl}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${finalUrl}&text=${text}`;
        break;
      case "x":
        url = `https://twitter.com/intent/tweet?text=${text}&url=${finalUrl}`;
        break;
      case "snapchat":
        url = `https://www.snapchat.com/share?url=${finalUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${finalUrl}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(item.title)}&body=${text}%20https://${shareLink}`;
        break;
      default:
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
    
    recordShareEvent(item.id, item.type, item.title, item.creator, item.thumbnail || "", destination);
  };

  // Perform "Share Inside Platform"
  const handleInternalShare = () => {
    if (!selectedContactId) return;
    
    // Create the message content
    const fullMessage = `https://${shareLink}`;
    
    // Save to private chat history
    let currentHistory: Record<string, any[]> = {};
    const savedHistory = localStorage.getItem("snns_chat_history");
    if (savedHistory) {
      try {
        currentHistory = JSON.parse(savedHistory);
      } catch {}
    }

    const newMsg = {
      id: "msg_shared_" + Date.now(),
      senderId: "me",
      text: fullMessage,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" }),
      status: "sent"
    };

    const targetHistory = currentHistory[selectedContactId] || [];
    currentHistory[selectedContactId] = [...targetHistory, newMsg];
    localStorage.setItem("snns_chat_history", JSON.stringify(currentHistory));

    // Post to BroadcastChannel so the PrivateChat window updates live too!
    try {
      const channel = new BroadcastChannel("snns_private_chat_room");
      channel.postMessage({
        type: "message_received",
        payload: {
          senderId: "me",
          targetId: selectedContactId,
          message: { ...newMsg, senderId: "me_shared_link" } // customized identifier
        }
      });
      channel.close();
    } catch {}

    setInternalShareSuccess(true);
    recordShareEvent(item.id, item.type, item.title, item.creator, item.thumbnail || "", "مشاركة داخلية");

    if (onInternalShareSuccess) {
      onInternalShareSuccess(fullMessage);
    }

    setTimeout(() => {
      setInternalShareSuccess(false);
    }, 3000);
  };

  // Simulated Deep Link Process
  const triggerDeepLinkSimulation = () => {
    setDeepLinkRunning(true);
    setDeepLinkResult(null);
    
    setTimeout(() => {
      // Simulating system check: 80% chance app is installed
      const success = Math.random() < 0.8;
      setDeepLinkRunning(false);
      setDeepLinkResult(success ? "app" : "browser");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div 
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-neutral-950 border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative z-10 font-tajawal text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-neutral-900/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-saudi-green" />
                <h3 className="font-bold text-sm text-white">بوابة المشاركة الذكية والنشر الفاخر</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Subbar */}
            <div className="flex border-b border-white/5 bg-black/40 px-5 shrink-0">
              <button 
                onClick={() => setActiveTab("options")}
                className={`py-3 px-4 text-xs font-bold transition-all relative ${activeTab === "options" ? "text-saudi-glow" : "text-gray-400 hover:text-white"}`}
              >
                خيارات المشاركة الرقمية
                {activeTab === "options" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-saudi-green" />}
              </button>
              <button 
                onClick={() => setActiveTab("og_simulator")}
                className={`py-3 px-4 text-xs font-bold transition-all relative ${activeTab === "og_simulator" ? "text-saudi-glow" : "text-gray-400 hover:text-white"}`}
              >
                مستعرض البطاقات الذكية (Open Graph)
                {activeTab === "og_simulator" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-saudi-green" />}
              </button>
              <button 
                onClick={() => setActiveTab("deep_link")}
                className={`py-3 px-4 text-xs font-bold transition-all relative ${activeTab === "deep_link" ? "text-saudi-glow" : "text-gray-400 hover:text-white"}`}
              >
                محاكي اللينكات العميقة (Deep Linking)
                {activeTab === "deep_link" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-saudi-green" />}
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">

              {/* Dynamic Entity Preview Box */}
              <div className="bg-neutral-900/60 p-4 border border-white/5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-saudi-green/10 border border-saudi-green/20 px-2 py-0.5 rounded text-[8px] font-bold text-saudi-glow font-mono uppercase">
                  {item.type === "live" && "🎥 بث مباشر"}
                  {item.type === "video" && "🎬 فيديو تراثي"}
                  {item.type === "post" && "📝 منشور"}
                  {item.type === "account" && "👤 صانع محتوى"}
                  {item.type === "audio_room" && "🎙️ ديوانية صوتية"}
                </div>

                {item.thumbnail || item.type === "account" ? (
                  <img 
                    src={item.thumbnail || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop"} 
                    alt={item.title} 
                    className={`w-14 h-14 object-cover border border-white/10 shrink-0 ${item.type === "account" ? "rounded-full" : "rounded-xl"}`}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-saudi-green/15 flex items-center justify-center border border-saudi-green/20 text-saudi-glow shrink-0">
                    <Share2 className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-1 select-none">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h4 className="font-bold text-xs text-white truncate max-w-[200px] leading-snug">{item.title}</h4>
                    {item.type === "account" && <TrustedBadge username={item.username || item.id} size="sm" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">بواسطة: {item.creator}</p>
                  {item.viewsOrFollowers && (
                    <span className="text-[9px] text-saudi-glow font-bold block mt-1">{item.viewsOrFollowers}</span>
                  )}
                </div>
              </div>

              {activeTab === "options" && (
                <div className="space-y-6">
                  {/* Share Grid Buttons */}
                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      onClick={handleCopyLink}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-saudi-green/10 border border-white/5 hover:border-saudi-green/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white group-hover:text-saudi-glow transition-colors">
                        {copied ? <Check className="w-5 h-5 text-saudi-green" /> : <Copy className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">{copied ? "تم النسخ!" : "نسخ الرابط"}</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("whatsapp", "واتساب")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-green-600/10 border border-white/5 hover:border-green-600/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-[#25D366]">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">واتساب</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("telegram", "تيليجرام")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-[#0088cc]">
                        <Send className="w-5 h-5 fill-current -translate-x-0.5" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">تيليجرام</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("x", "منصة X")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/15 border border-white/5 hover:border-white/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white">
                        <Twitter className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">منصة X</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("snapchat", "سناب شات")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-yellow-300">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">سناب شات</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("facebook", "فيسبوك")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-600/10 border border-white/5 hover:border-blue-600/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-[#1877F2]">
                        <Facebook className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">فيسبوك</span>
                    </button>

                    <button 
                      onClick={() => handleSocialShare("email", "البريد الإلكتروني")}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-red-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">البريد المعتمد</span>
                    </button>
                    
                    <button 
                      onClick={handleCopyLink}
                      className="p-3 bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-saudi-green/10 border border-white/5 hover:border-saudi-green/30 transition-all group active:scale-95"
                    >
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white group-hover:text-saudi-glow transition-colors">
                        <Globe className="w-5 h-5 text-saudi-glow animate-pulse" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold leading-none">أيقونة الويب</span>
                    </button>
                  </div>

                  {/* Smart Link Container with copy action clickable */}
                  <div className="p-3.5 bg-neutral-950 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-gray-400 select-all truncate">https://{shareLink}</span>
                    <button 
                      onClick={handleCopyLink}
                      className="shrink-0 text-[10px] bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 px-3 py-1.5 rounded-lg hover:bg-saudi-green/20 transition-all font-bold"
                    >
                      {copied ? "تم النسخ!" : "نسخ سريع"}
                    </button>
                  </div>

                  {/* Share Inside Platform Segment */}
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-saudi-green" />
                        مشاركة مباشرة داخل غرف المحادثات الخاصة بالمنصة 🇸🇦
                      </h4>
                      <span className="text-[9px] text-gray-550 font-mono">SNNS Secure Chat</span>
                    </div>

                    {internalContacts.length === 0 ? (
                      <p className="text-[10px] text-gray-500">لا يوجد جهات اتصال مراسلة بالمنصة حالياً لإرساء الرابط الوطني.</p>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <select 
                          value={selectedContactId}
                          onChange={(e) => setSelectedContactId(e.target.value)}
                          className="flex-1 bg-neutral-900 border border-[#222] rounded-xl text-xs text-white p-3 font-tajawal focus:outline-none focus:border-saudi-green"
                        >
                          {internalContacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (@{c.username})
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={handleInternalShare}
                          disabled={internalShareSuccess}
                          className="px-5 py-3 bg-saudi-green text-white font-bold rounded-xl text-xs hover:bg-saudi-green/90 transition-all shrink-0 active:scale-95 flex items-center gap-1.5 shadow-md disabled:bg-gray-700 disabled:text-gray-400"
                        >
                          {internalShareSuccess ? (
                            <>
                              <Check className="w-4 h-4 text-white" />
                              تمت المشاركة!
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-white -translate-x-0.5" />
                              أرسل الآن
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {internalShareSuccess && (
                      <p className="text-[10px] text-saudi-glow block mt-1 leading-none text-center">
                        ✓ تم إرسال رابط {item.type === "live" ? "البث المباشر" : "المقطع"} بنجاح إلى صندوق المراسلة المشفر للجهة المختارة!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "og_simulator" && (
                <div className="space-y-5 animate-fade-in font-tajawal">
                  <div className="bg-neutral-900/40 p-3.5 border border-white/5 rounded-xl text-[10px] text-gray-400 leading-normal">
                    أدناه معاينة بصرية كاملة لنظام المعاينة التلقائي (Open Graph / Meta Tags) الذي تعرضه المنصات الشريكة مثل WhatsApp أو X عند نشر روابط SNNS.PRO. يتميز بأنه حقيقي ومشفر ويحمل شعار الهوية الوطنية لترسيخ الروح التراثية.
                  </div>

                  {/* WhatsApp/Telegram Card Simulator */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-500 font-bold block">١. المعاينة على تطبيق (واتساب / تيليجرام):</span>
                    <div className="bg-[#0b141a] border-l-4 border-[#075e54] p-3 rounded-2xl max-w-sm ml-auto text-right">
                      <span className="text-[10px] text-[#34b7f1] font-bold block mb-0.5">https://{shareLink}</span>
                      
                      <div className="bg-[#101d25] p-2.5 rounded-lg border border-white/5 flex gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] text-[#34b7f1] tracking-tight uppercase font-mono block mb-1">SNNS.PRO • الصوتيات والتراث</span>
                          <h5 className="font-bold text-gray-200 text-[11px] leading-snug mb-1 truncate">{item.title}</h5>
                          <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed font-tajawal">
                             انضم إلينا الآن لحضور المادة المقدمة بواسطة {item.creator}. الفنون التراثية الحية والأصوات الشامخة للمملكة 🇸🇦.
                          </p>
                        </div>
                        <img 
                          src={item.thumbnail || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop"} 
                          alt="" 
                          className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Twitter / X Card Simulator */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-gray-500 font-bold block">٢. المعاينة في بطاقات منصة (Twitter / X Card):</span>
                    <div className="bg-black border border-neutral-800 rounded-2xl overflow-hidden max-w-sm ml-auto">
                      <img 
                        src={item.thumbnail || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&fit=crop"} 
                        alt="" 
                        className="w-full aspect-video object-cover" 
                      />
                      <div className="p-3 bg-[#15181c] border-t border-neutral-800 text-xs text-right">
                        <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wide block font-mono">snns.pro</span>
                        <h5 className="font-bold text-white text-[11px] leading-tight my-1 truncate">{item.title}</h5>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 leading-normal">
                          موروث غنائي وصوتي ووطني معتمد. شاهد المادة الحية وبادر بالدعم بنظام العملات الرقمية المدمج للسيادة الفخرية.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "deep_link" && (
                <div className="space-y-5 animate-fade-in font-tajawal text-right">
                  <div className="bg-neutral-900/40 p-4 border border-white/5 rounded-2xl space-y-2">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-saudi-glow" />
                      ميزة الروابط العميقة والاندماج السريع (Smart Deep Links)
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed font-tajawal">
                      عند انتقال المتابعين من الجوال وفتح روابط <code className="font-mono text-saudi-glow text-[11px]">snns.pro/live/*</code> أو معرفك الشخصي، سيقوم نظام التشغيل للخلوي تلقائياً بفحص الهاتف:
                    </p>
                    <ul className="list-disc pr-5 text-[11px] text-gray-400 space-y-1">
                      <li>توجيه المستخدم فوراً في أقل من ٩٠ جزء من الثانية إلى <strong>تطبيق SNNS الوطني للهواتف الذكية</strong> (إذا كان معتمداً ومثبتاً).</li>
                      <li>توجيه المستخدم بشكل افتراضي إلى <strong>متصفح الويب الآمن</strong> لتفادي مقاطعة تجربة البث في حال عدم وجود التطبيق.</li>
                    </ul>
                  </div>

                  {/* Interactive Device Simulation */}
                  <div className="border border-white/5 p-4 rounded-2xl bg-black/45 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">لوحة محاكاة الهاتف الخلوي</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setDeviceOS("iOS"); setDeepLinkResult(null); }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${deviceOS === "iOS" ? "bg-white text-black" : "bg-white/5 text-gray-400"}`}
                        >
                          Apple iOS 🍏
                        </button>
                        <button 
                          onClick={() => { setDeviceOS("Android"); setDeepLinkResult(null); }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${deviceOS === "Android" ? "bg-white text-black" : "bg-white/5 text-gray-400"}`}
                        >
                          Google Android 🤖
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-6 bg-neutral-900/20 rounded-xl min-h-[140px] text-center gap-3">
                      {deepLinkRunning ? (
                        <div className="space-y-2 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full border-2 border-saudi-green border-t-transparent animate-spin" />
                          <span className="text-[10px] text-gray-400">يجري فحص بروتوكولات الحزمة السيادية للموبايل...</span>
                        </div>
                      ) : deepLinkResult === "app" ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="space-y-2 p-3 bg-saudi-green/10 border border-saudi-green/20 rounded-xl max-w-xs"
                        >
                          <span className="text-xl">📲</span>
                          <h6 className="font-bold text-xs text-white font-tajawal">استجابة: بروتوكول Universal Link نجح!</h6>
                          <p className="text-[9px] text-saudi-glow font-tajawal">سيتم فتح المعرض والبث الآن مباشرة بداخل تطبيق SNNS.PRO native للهواتف الذكية بسلاسة.</p>
                        </motion.div>
                      ) : deepLinkResult === "browser" ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="space-y-2 p-3 bg-[#111] border border-white/5 rounded-xl max-w-xs"
                        >
                          <span className="text-xl">🌐</span>
                          <h6 className="font-bold text-xs text-gray-300 font-tajawal">استجابة: توجيه المستعرض المباشر نجح!</h6>
                          <p className="text-[9px] text-gray-400 font-tajawal">الهاتف لا يحتوي تطبيق مثبت. يتم تشغيل البث المباشر وبوابة الدعم للعملات الرقمية عبر المتصفح الافتراضي بنجاح.</p>
                        </motion.div>
                      ) : (
                        <div className="text-center">
                          <span className="text-gray-500 text-[10px] block mb-2">اضغط على الزر أدناه لاختبار استجابة الرابط الذكي على الهاتف</span>
                          <button 
                            onClick={triggerDeepLinkSimulation}
                            className="bg-saudi-green/20 border border-saudi-green/40 hover:bg-saudi-green/30 text-saudi-glow hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            محاكاة النقر على هاتف {deviceOS === "iOS" ? "آيفون" : "أندرويد"} ⚡
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer with safety warning about privacy */}
            <div className="p-5 border-t border-white/5 bg-neutral-900/60 flex items-center justify-between shrink-0 text-xs">
              <div className="flex gap-1.5 items-center text-gray-500 text-[10px]">
                <Lock className="w-3.5 h-3.5" />
                <span>الخصوصية مضمونة: نمرر الروابط دون تتبع أو تجسس</span>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-white/5 text-gray-400 rounded-xl text-xs hover:bg-white/10 transition-all cursor-pointer font-bold font-tajawal"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
