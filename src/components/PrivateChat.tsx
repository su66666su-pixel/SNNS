import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  Video, 
  PhoneOff, 
  Mic, 
  MicOff, 
  VideoOff, 
  ShieldAlert, 
  Trash2, 
  Bell, 
  BellOff, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Search, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  X, 
  ChevronLeft, 
  UserX, 
  AlertTriangle, 
  Download, 
  History, 
  UserCheck,
  Volume2,
  VolumeX,
  User as UserIcon,
  Lock,
  MessageCircle,
  FileText
} from "lucide-react";
import { getOrCreateReporterMetrics, registerNewReportTransaction } from "../utils/reportSecurity";
import { TrustedBadge } from "./TrustedBadge";
import { resolveShareLinkData } from "../utils/shareStore";

// Types
export interface ChatMessage {
  id: string;
  senderId: string; // "me" or contact userId
  text?: string;
  mediaUrl?: string;
  mediaType?: "image" | "file";
  fileName?: string;
  timestamp: string; // ISO or local HH:MM
  status: "sending" | "sent" | "read";
}

export interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: "متصل" | "مشغول" | "غير متصل";
  isBlocked: boolean;
  isMuted: boolean;
}

export interface CallRecord {
  id: string;
  contactName: string;
  contactAvatar: string;
  type: "voice" | "video";
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
  duration?: string;
}

// Simulated automated responses library for active Arabic characters
const AUTO_RESPONSES: Record<string, string[]> = {
  "sara_a": [
    "مرحباً بك! أسعدتني رسالتك 🇸🇦 كيف يمكنني مساعدتك اليوم؟",
    "جميل جداً! أنا متواجدة حالياً لمتابعة بثي التراثي، سأجيبك بالتفصيل.",
    "تعتبر العلا مكاني المفضل في المملكة! لقد قمت بتوثيق رحلة كاملة هناك وسأنشرها قريباً.",
    "شكراً لك على كلماتك الراقية، هذا الدعم يسعد ممارسي الثقافة الحرة بوطننا العظيم.",
    "بالتأكيد! ما رأيك بالانضمام للبث القادم لمناقشة التنمية السياحية؟"
  ],
  "noura_ali": [
    "أهلاً، أنا مشغولة حالياً في اجتماع عمل رقمي 💼 سأرد فور انتهائي.",
    "رسالتك وصلتني! يسعدني جداً اهتمامك بريادة الأعمال السعودية والتصاميم الفاخرة.",
    "هل اطلعت على منشورات حي الطريف التاريخي؟ إنه يسرد قصة فخرنا القومي.",
    "أعمل حالياً على إنجاز مشروع التوثيق الفني، وسأحدثك فوراً عند التفرغ."
  ],
  "abdullah_sh": [
    "السلام عليكم يا غالي! أنا خارج التغطية حالياً بالنفود الشمالية 🐫 سأرد فور وصولي لشبكة.",
    "أهلاً بك! فخور بتواصلي معك، تراث نجد والشمال يسري بمشاعري.",
    "تسلم والله على المتابعة الطيبة! أشوفك بالبث قريباً بإذن الله."
  ],
  "fhd_hrb": [
    "مرحباً! أهلاً بصديقي من منصة SNNS.PRO الفاخرة ✨",
    "تصوير جبال الحجاز وعسير هو عشقي الشخصي! ما هي منطقتك المفضلة؟",
    "رسالتك محل اهتمامي، لحظات وسأتفرغ لمحادثتنا الشيقة.",
    "سأقوم بنشر مجموعة فوتوغرافية حصرية شتوية قريباً، شاركني رأيك!"
  ]
};

export default function PrivateChat({ 
  onClose,
  currentUserProfile,
  initialContactId,
  onOpenSharedItem
}: { 
  onClose?: () => void;
  currentUserProfile: { name: string; username: string; avatar: string; coins: number };
  initialContactId?: string | null;
  onOpenSharedItem?: (type: string, id: string) => void;
}) {
  // --- Local states ---
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem("snns_chat_contacts");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activeContactId, setActiveContactId] = useState<string | null>(initialContactId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messagesDict, setMessagesDict] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem("snns_chat_history");
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [callLogs, setCallLogs] = useState<CallRecord[]>(() => {
    const saved = localStorage.getItem("snns_call_records");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [typingContacts, setTypingContacts] = useState<Record<string, boolean>>({});
  const [showCallHistoryOnly, setShowCallHistoryOnly] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  // Attachment states
  const [selectedAttachmentType, setSelectedAttachmentType] = useState<"image" | "file" | null>(null);
  const [mockAttachmentName, setMockAttachmentName] = useState("");
  const [mockAttachmentUrl, setMockAttachmentUrl] = useState("");

  // Report Modal state
  const [reportingContext, setReportingContext] = useState<{ type: "message" | "user"; targetId: string; targetName: string } | null>(null);
  const [reportReason, setReportReason] = useState("إزعاج ورسائل متكررة (Spam)");
  const [reportNotes, setReportNotes] = useState("");
  const [pledgeChecked, setPledgeChecked] = useState(false);
  const [showWarningStep, setShowWarningStep] = useState(false);

  // System calling modal states (WhatsApp style)
  // CallState: "none" | "ringing_in" (incoming) | "ringing_out" (dialing) | "active"
  const [currentCall, setCurrentCall] = useState<{
    contact: Contact;
    type: "video" | "voice";
    state: "none" | "ringing_in" | "ringing_out" | "active";
    duration: number; // in seconds
    isMuted: boolean;
    isVideoOff: boolean;
    isCameraFlipped: boolean;
  } | null>(null);

  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringSoundRef = useRef<AudioContext | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // We utilize HTML5 BroadcastChannel for Multi-tab messaging to demonstrate true Real-time binding
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize Broadcaster and local storage updates
  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("snns_private_chat_room");

    broadcastChannelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case "message_received":
          const { senderId, targetId, message } = payload;
          // If message is addressed to me (currentUserProfile.username or "me")
          if (targetId === "me" || targetId === currentUserProfile.username) {
            setMessagesDict(prev => {
              const list = prev[senderId] || [];
              const updated = [...list, message];
              localStorage.setItem("snns_chat_history", JSON.stringify({ ...prev, [senderId]: updated }));
              return { ...prev, [senderId]: updated };
            });
            // Play a soft notification chime if not muted
            const activeCont = contacts.find(c => c.id === senderId);
            if (activeCont && !activeCont.isMuted) {
              playChatTone();
            }
          }
          break;

        case "typing_state":
          const { typerId, isTyping } = payload;
          setTypingContacts(prev => ({ ...prev, [typerId]: isTyping }));
          break;

        case "call_invite":
          // Receive incoming call from another tab/user
          const callerContact = contacts.find(c => c.id === payload.fromId) || {
            id: payload.fromId,
            name: payload.fromName,
            username: payload.fromUsername,
            avatar: payload.fromAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop",
            status: "متصل",
            isBlocked: false,
            isMuted: false
          } as Contact;

          setCurrentCall({
            contact: callerContact,
            type: payload.callType,
            state: "ringing_in",
            duration: 0,
            isMuted: false,
            isVideoOff: false,
            isCameraFlipped: false
          });
          startRingerTone();
          break;

        case "call_accepted":
          if (currentCall && currentCall.state === "ringing_out") {
            stopRingerTone();
            setCurrentCall(prev => prev ? { ...prev, state: "active", duration: 0 } : null);
            startCallTimer();
          }
          break;

        case "call_declined":
          if (currentCall) {
            stopRingerTone();
            logCallEvent(currentCall.contact, currentCall.type, "missed");
            setCurrentCall(null);
            alert("تم رفض المكالمة من الطرف الآخر");
          }
          break;

        case "call_ended":
          if (currentCall) {
            stopRingerTone();
            stopCallTimer();
            logCallEvent(currentCall.contact, currentCall.type, "incoming", formatCallDuration(currentCall.duration));
            setCurrentCall(null);
            alert("انتهت المكالمة الخاصة");
          }
          break;
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
      stopRingerTone();
      stopCallTimer();
    };
  }, [contacts, currentCall]);

  // Scroll to bottom when active contact changes or messages are added
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesDict, activeContactId, typingContacts]);

  // Save state helpers
  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem("snns_chat_contacts", JSON.stringify(updated));
  };

  // --- HTML5 Audio Synthesis for Ringtones & Ding Alerts ---
  const playChatTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5 note
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio Context block", e);
    }
  };

  const startRingerTone = () => {
    try {
      if (ringSoundRef.current) return;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ringSoundRef.current = ctx;

      // Pulse a beautiful ring tone chords repeatedly
      const playPulse = (timeOffset: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const rGain = ctx.createGain();

        osc1.frequency.setValueAtTime(440, ctx.currentTime + timeOffset);
        osc2.frequency.setValueAtTime(480, ctx.currentTime + timeOffset);

        rGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        rGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + timeOffset + 0.1);
        rGain.gain.setValueAtTime(0.1, ctx.currentTime + timeOffset + 1.2);
        rGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 1.8);

        osc1.connect(rGain);
        osc2.connect(rGain);
        rGain.connect(ctx.destination);

        osc1.start(ctx.currentTime + timeOffset);
        osc2.start(ctx.currentTime + timeOffset);
        
        osc1.stop(ctx.currentTime + timeOffset + 2);
        osc2.stop(ctx.currentTime + timeOffset + 2);
      };

      // Play initially, then periodically
      playPulse(0);
      let offset = 2.5;
      const interval = setInterval(() => {
        if (!ringSoundRef.current) {
          clearInterval(interval);
          return;
        }
        playPulse(0);
      }, 2500);

    } catch (e) {
      console.warn("Audio block", e);
    }
  };

  const stopRingerTone = () => {
    if (ringSoundRef.current) {
      ringSoundRef.current.close().catch(() => {});
      ringSoundRef.current = null;
    }
  };

  // --- Call Timer handling ---
  const startCallTimer = () => {
    stopCallTimer();
    callTimerRef.current = setInterval(() => {
      setCurrentCall(prev => {
        if (!prev || prev.state !== "active") return prev;
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatCallDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const logCallEvent = (
    contact: Contact, 
    type: "voice" | "video", 
    direction: "incoming" | "outgoing" | "missed",
    duration?: string
  ) => {
    const newRecord: CallRecord = {
      id: "call_" + Date.now(),
      contactName: contact.name,
      contactAvatar: contact.avatar,
      type,
      direction,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) + " اليوم",
      duration: duration || (direction === "missed" ? undefined : "١٠ ثوانٍ")
    };
    const updated = [newRecord, ...callLogs];
    setCallLogs(updated);
    localStorage.setItem("snns_call_records", JSON.stringify(updated));
  };


  // --- Message Posting Rules & Spam Protection ---
  const lastSentTimeRef = useRef<number>(0);

  const sendMessage = (textVal?: string, customMedia?: { url: string; type: "image" | "file"; name?: string }) => {
    if (!activeContactId) return;
    const activeCont = contacts.find(c => c.id === activeContactId);
    if (!activeCont) return;

    if (activeCont.isBlocked) {
      alert("هذا المستخدم محظور، لا يمكنك إرسال رسائل إليه.");
      return;
    }

    // Anti-spam warning (max 1 message per 0.5s)
    const now = Date.now();
    if (now - lastSentTimeRef.current < 500 && !customMedia) {
      alert("تم رصد إرسال سريع للرسائل المتكررة! يرجى الحفاظ على معايير الأمان لمنصة SNNS.PRO.");
      return;
    }
    lastSentTimeRef.current = now;

    const cleanText = textVal?.trim();
    if (!cleanText && !customMedia) return;

    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      senderId: "me",
      text: cleanText,
      mediaUrl: customMedia?.url,
      mediaType: customMedia?.type,
      fileName: customMedia?.name,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" }),
      status: "sent"
    };

    // Update messages dict locally
    const history = messagesDict[activeContactId] || [];
    const updatedHistory = [...history, newMsg];
    
    setMessagesDict(prev => {
      const updated = { ...prev, [activeContactId]: updatedHistory };
      localStorage.setItem("snns_chat_history", JSON.stringify(updated));
      return updated;
    });

    setMessageText("");
    setSelectedAttachmentType(null);
    setMockAttachmentUrl("");
    setMockAttachmentName("");

    // Broadcast through channel to other open tabs
    broadcastChannelRef.current?.postMessage({
      type: "message_received",
      payload: {
        senderId: "me",
        targetId: activeContactId,
        message: { ...newMsg, senderId: currentUserProfile.username }
      }
    });

    // Simulating logical Arab characters chatbot replies for standalone single-tab UX
    const responsePool = AUTO_RESPONSES[activeContactId];
    if (responsePool && !activeCont.isBlocked) {
      // Trigger typing state
      setTimeout(() => {
        setTypingContacts(prev => ({ ...prev, [activeContactId]: true }));
        broadcastChannelRef.current?.postMessage({
          type: "typing_state",
          payload: { typerId: activeContactId, isTyping: true }
        });
      }, 1000);

      // Deliver reply
      setTimeout(() => {
        setTypingContacts(prev => ({ ...prev, [activeContactId]: false }));
        broadcastChannelRef.current?.postMessage({
          type: "typing_state",
          payload: { typerId: activeContactId, isTyping: false }
        });

        const randomReply = responsePool[Math.floor(Math.random() * responsePool.length)];
        const replyMsg: ChatMessage = {
          id: "reply_" + Date.now(),
          senderId: activeContactId,
          text: randomReply,
          timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" }),
          status: "read"
        };

        setMessagesDict(prev => {
          const freshHistory = [...(prev[activeContactId] || []), replyMsg];
          const dict = { ...prev, [activeContactId]: freshHistory };
          localStorage.setItem("snns_chat_history", JSON.stringify(dict));
          return dict;
        });

        // Ticks sound if notifications are not muted
        if (!activeCont.isMuted) {
          playChatTone();
        }
      }, 3500);
    }
  };

  // Handle uploading photos and files directly
  const triggerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setMockAttachmentUrl(url);
      setMockAttachmentName(file.name);
      setSelectedAttachmentType("image");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setMockAttachmentUrl(url);
      setMockAttachmentName(file.name);
      setSelectedAttachmentType("file");
    };
    reader.readAsDataURL(file);
  };

  const confirmSendAttachment = () => {
    if (!mockAttachmentUrl || !selectedAttachmentType) return;
    sendMessage(undefined, {
      url: mockAttachmentUrl,
      type: selectedAttachmentType,
      name: mockAttachmentName
    });
  };

  // --- Call Dialing/Ringing Handling ---
  const launchCall = (type: "video" | "voice") => {
    if (!activeContactId) return;
    const activeCont = contacts.find(c => c.id === activeContactId);
    if (!activeCont) return;

    if (activeCont.isBlocked) {
      alert("هذا المستخدم محظور لا يمكنك الاتصال به.");
      return;
    }

    // Set call outgoing dialing
    setCurrentCall({
      contact: activeCont,
      type,
      state: "ringing_out",
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isCameraFlipped: false
    });

    startRingerTone();
    logCallEvent(activeCont, type, "outgoing");

    // Broadcast through tab channel to evoke the ringing popup in another window
    broadcastChannelRef.current?.postMessage({
      type: "call_invite",
      payload: {
        fromId: currentUserProfile.username || "me",
        fromName: currentUserProfile.name,
        fromUsername: currentUserProfile.username,
        fromAvatar: currentUserProfile.avatar,
        callType: type
      }
    });

    // Standalone auto-connect response simulated after 3.5 seconds
    setTimeout(() => {
      setCurrentCall(prev => {
        if (prev && prev.state === "ringing_out") {
          stopRingerTone();
          startCallTimer();
          return { ...prev, state: "active", duration: 0 };
        }
        return prev;
      });
    }, 3500);
  };

  const acceptIncomingCall = () => {
    if (!currentCall) return;
    stopRingerTone();
    setCurrentCall(prev => prev ? { ...prev, state: "active", duration: 0 } : null);
    startCallTimer();

    broadcastChannelRef.current?.postMessage({
      type: "call_accepted",
      payload: {}
    });
  };

  const declineIncomingCall = () => {
    if (!currentCall) return;
    stopRingerTone();
    logCallEvent(currentCall.contact, currentCall.type, "missed");
    setCurrentCall(null);

    broadcastChannelRef.current?.postMessage({
      type: "call_declined",
      payload: {}
    });
  };

  const endActiveCall = () => {
    if (!currentCall) return;
    stopRingerTone();
    stopCallTimer();
    logCallEvent(currentCall.contact, currentCall.type, "incoming", formatCallDuration(currentCall.duration));

    broadcastChannelRef.current?.postMessage({
      type: "call_ended",
      payload: {}
    });
    
    setCurrentCall(null);
  };


  // --- Block, Mute, Delete Conversation actions ---
  const toggleMuteContact = (cid: string) => {
    const updated = contacts.map(c => c.id === cid ? { ...c, isMuted: !c.isMuted } : c);
    saveContacts(updated);
    setHeaderDropdownOpen(false);
  };

  const toggleBlockContact = (cid: string) => {
    const activeC = contacts.find(c => c.id === cid);
    if (!activeC) return;
    const blockConfirm = confirm(`هل تود بالتأكيد تغيير حالة حظر المستخدم ${activeC.name}؟`);
    if (!blockConfirm) return;

    const updated = contacts.map(c => c.id === cid ? { ...c, isBlocked: !c.isBlocked } : c);
    saveContacts(updated);
    setHeaderDropdownOpen(false);
  };

  const deleteConversationHistory = (cid: string) => {
    const dConfirm = confirm("تنبيه: سيتم مسح كافة سجلات الرسائل والمرفقات لهذه المحادثة نهائياً من جهازك. هل تود المتابعة؟");
    if (!dConfirm) return;

    setMessagesDict(prev => {
      const dict = { ...prev, [cid]: [] };
      localStorage.setItem("snns_chat_history", JSON.stringify(dict));
      return dict;
    });
    setHeaderDropdownOpen(false);
  };


  // --- Security Report Filing System ---
  const handleFileReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingContext) return;

    // Check if reporter is blocked or temporarily restricted
    const metrics = getOrCreateReporterMetrics(currentUserProfile.username);
    if (metrics.isRestricted && metrics.restrictedUntil) {
      const untilDate = new Date(metrics.restrictedUntil);
      if (new Date() < untilDate) {
        alert(`❌ حسابك مقيد من رفع البلاغات لغاية ${untilDate.toLocaleString("ar-SA")} بسبب تكرار تقديم بلاغات كيدية أثبت الرقابة عدم دقتها.`);
        return;
      }
    }

    if (!reportNotes.trim()) {
      alert("الرجاء كتابة تفاصيل وملاحظات البلاغ أولاً.");
      return;
    }

    // Move to step 2: legal and safety warning validation
    setShowWarningStep(true);
  };

  const submitReportAfterWarning = () => {
    if (!reportingContext) return;
    if (!pledgeChecked) {
      alert("الرجاء الموافقة على التعهد الإجباري وصحة البيانات أولاً.");
      return;
    }

    // Load metrics
    const metrics = getOrCreateReporterMetrics(currentUserProfile.username);
    if (metrics.isRestricted && metrics.restrictedUntil) {
      const untilDate = new Date(metrics.restrictedUntil);
      if (new Date() < untilDate) {
        alert(`❌ حسابك مقيد من رفع البلاغات لغاية ${untilDate.toLocaleString("ar-SA")}`);
        return;
      }
    }

    const reportId = "rep_" + Date.now();

    // Reduce report priority to LOW if trust rating is low
    let reportPriority = "عالية";
    if (metrics.trustLevel === "متوسط") {
      reportPriority = "متوسطة";
    } else if (metrics.trustLevel === "منخفض") {
      reportPriority = "منخفضة";
    }

    // Build the report according to Admin Dashboard database records
    const newReport = {
      id: reportId,
      status: "جديد",
      priority: reportPriority,
      type: reportingContext.type === "message" ? "محتوى مخالف" : "دردشة مريبة",
      reporterName: currentUserProfile.name,
      reporterUsername: currentUserProfile.username,
      reporterAvatar: currentUserProfile.avatar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&fit=crop",
      reportedName: reportingContext.targetName,
      reportedUsername: reportingContext.targetId,
      reported: reportingContext.targetId,
      reportedAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop",
      reason: reportReason,
      date: "الآن",
      description: `فئة الانتهاك: ${reportReason}. تفاصيل ومخالفات البلاغ: ${reportNotes}. وبموجب البصمة الأمنية المعتمدة رقمياً بالنزاهة والمسؤولية الكاملة.`,
      contentType: reportingContext.type === "message" ? "رسالة" : "حساب",
      contentId: reportingContext.type === "message" ? reportingContext.targetId : "user_" + reportingContext.targetId,
      reportsCountOnContent: 1,
      contentData: {
        type: reportingContext.type === "message" ? "رسالة" : "حساب كامل",
        title: reportingContext.type === "message" ? "رسالة خاصة في الدردشة المشفرة" : "دردشة ثنائية",
        publishDate: new Date().toLocaleDateString("ar-SA"),
        hashtags: "#بلاغ_أمني #رصد #نزاهة_المعلومات",
        description: reportNotes || `ملاحظات أمنية مسجلة ضد هذا المحتوى والمستخدم.`
      },
      reportedUserStats: {
        reportsCount: Math.floor(Math.random() * 5 + 1),
        violationsCount: Math.floor(Math.random() * 2),
        lastActivity: "الآن",
        status: "نشط"
      },
      decisionLog: [] as string[]
    };

    // Save into Admin Reports
    const existingReportsStr = localStorage.getItem("snns_reports_records");
    let currentReports: any[] = [];
    try {
      currentReports = existingReportsStr ? JSON.parse(existingReportsStr) : [];
    } catch {
      currentReports = [];
    }

    // Register transaction with logs
    const transaction = registerNewReportTransaction(
      currentUserProfile.username,
      reportId,
      reportingContext.type === "message" ? "رسالة" : "حساب كامل",
      reportingContext.targetId,
      reportReason
    );

    const updated = [newReport, ...currentReports];
    localStorage.setItem("snns_reports_records", JSON.stringify(updated));

    alert(`🟢 تم التحقق من البصمة الرقمية والتعهد العالي للمبلّغ! تم تسجيل البلاغ بنجاح برقم مرجعي #${reportId.slice(-6)} ورمز تشفير IP التلقائي: ${transaction.ip}. سيقوم مشرفونا بمراجعته واتخاذ الإجراء الفوري وصوناً للنزاهة الشرفية. 🇸🇦`);

    setReportingContext(null);
    setReportNotes("");
    setShowWarningStep(false);
    setPledgeChecked(false);
  };


  // Filtering contacts
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 left-0 md:left-auto md:w-[650px] bg-[#0A0A0A] border-l border-white/10 shadow-2xl z-[90] flex flex-col font-tajawal animate-fade-in text-white" dir="rtl">
      
      {/* ========================================================= */}
      {/* PRIVATE CALLS MODALS / OVERLAYS (WhatsApp Lookalike) */}
      {/* ========================================================= */}
      {currentCall && (
        <div className="absolute inset-0 z-50 bg-[#060606] flex flex-col justify-between p-8 text-center overscroll-contain animate-fade-in">
          {/* Top Info */}
          <div className="space-y-4 pt-10">
            <div className="w-24 h-24 rounded-full border-2 border-saudi-green mx-auto overflow-hidden relative shadow-lg shadow-saudi-green/10">
              <img src={currentCall.contact.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{currentCall.contact.name}</h2>
              <p className="text-xs text-saudi-glow font-mono">@{currentCall.contact.username}</p>
            </div>

            {currentCall.state === "ringing_in" && (
              <div className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full w-fit mx-auto text-xs flex items-center gap-1.5 animate-pulse">
                <Phone className="w-3.5 h-3.5 fill-red-400" />
                <span>مكالمة واردة خاصة...</span>
              </div>
            )}
            
            {currentCall.state === "ringing_out" && (
              <div className="px-3 py-1 bg-saudi-green/10 text-saudi-green border border-saudi-green/20 rounded-full w-fit mx-auto text-xs flex items-center gap-1.5 animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span>رنين الاتصال الخاص...</span>
              </div>
            )}

            {currentCall.state === "active" && (
              <div className="px-3 py-1 bg-saudi-green/20 text-saudi-glow border border-saudi-green/45 rounded-full w-fit mx-auto text-xs flex items-center gap-1.5">
                <div className="w-2 h-2 bg-saudi-green rounded-full animate-ping" />
                <span>مكالمة نشطة &bull; <span className="font-mono text-white text-xs font-bold">{formatCallDuration(currentCall.duration)}</span></span>
              </div>
            )}
          </div>

          {/* WebRTC Interactive camera video player */}
          {currentCall.type === "video" && currentCall.state === "active" && (
            <div className="my-4 aspect-video bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden relative flex items-center justify-center">
              {currentCall.isVideoOff ? (
                <div className="text-center text-xs text-gray-500 flex flex-col items-center gap-1">
                  <VideoOff className="w-8 h-8 text-neutral-700" />
                  <span>الكاميرا مغلقة</span>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full bg-neutral-950 flex items-center justify-center font-bold">
                  {/* Local Video simulation layer with responsive aspect ratio */}
                  <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl z-[1] pointer-events-none" />
                  <img src={currentUserProfile.avatar} alt="" className="w-full h-full object-cover opacity-80" />
                  <span className="absolute bottom-3 right-3 z-10 text-[10px] bg-black/60 px-2 py-0.5 rounded-full">أنا (WebRTC Stream)</span>
                </div>
              )}
              {/* Remote webcam simulate */}
              <div className="absolute top-3 left-3 w-1/4 aspect-[2/3] bg-black border border-white/20 rounded-xl overflow-hidden shadow-xl z-20">
                <img src={currentCall.contact.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Interactive hints */}
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-[10px] text-gray-500 leading-relaxed max-w-sm mx-auto">
            🛡️ اتصالات SNNS.PRO مشفرة بالكامل بين الطرفين (Peer-to-Peer WebRTC) وتحظى بأمان فائق ونزاهة تامة.
          </div>

          {/* Action Buttons */}
          <div className="pb-10 flex justify-center gap-5">
            {currentCall.state === "ringing_in" ? (
              <>
                <button
                  onClick={declineIncomingCall}
                  className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
                  title="رفض"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={acceptIncomingCall}
                  className="w-14 h-14 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-full flex items-center justify-center shadow-lg shadow-saudi-green/30 active:scale-95 transition-transform animate-bounce"
                  title="قبول"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4 w-full max-w-md">
                {/* Mid-call settings row */}
                {currentCall.state === "active" && (
                  <div className="flex justify-center gap-6 mb-2">
                    <button 
                      onClick={() => setCurrentCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)}
                      className={`p-3 rounded-full border transition-colors ${currentCall.isMuted ? "bg-white text-black border-white" : "bg-white/10 text-white hover:bg-white/15 border-white/10"}`}
                      title="كتم المايك"
                    >
                      {currentCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {currentCall.type === "video" && (
                      <>
                        <button 
                          onClick={() => setCurrentCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null)}
                          className={`p-3 rounded-full border transition-colors ${currentCall.isVideoOff ? "bg-white text-black border-white" : "bg-white/10 text-white hover:bg-white/15 border-white/10"}`}
                          title="إغلاق الكاميرا"
                        >
                          {currentCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>

                        <button 
                          onClick={() => setCurrentCall(prev => prev ? { ...prev, isCameraFlipped: !prev.isCameraFlipped } : null)}
                          className={`p-3 rounded-full border border-white/10 text-white hover:bg-white/15 transition-colors ${currentCall.isCameraFlipped ? "bg-saudi-green/20 text-saudi-green border-saudi-green" : ""}`}
                          title="تبديل الكاميرا"
                        >
                          <Video className="w-5 h-5 scale-95 select-none animate-pulse" />
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                <button
                  onClick={endActiveCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
                  title="إنهاء المكالمة"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* ATTACHMENT UPLOAD PREVIEW MODAL */}
      {/* ========================================================= */}
      {selectedAttachmentType && mockAttachmentUrl && (
        <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-6 animate-fade-in text-right">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0C0C0C] rounded-2xl">
            <h3 className="font-bold text-xs flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-saudi-glow" />
              مرفق جاهز للإرسال الفوري
            </h3>
            <button 
              onClick={() => {
                setSelectedAttachmentType(null);
                setMockAttachmentUrl("");
                setMockAttachmentName("");
              }}
              className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {selectedAttachmentType === "image" ? (
              <img src={mockAttachmentUrl} alt="Preview" className="max-h-[50vh] max-w-full rounded-2xl border border-white/10 object-contain shadow-2xl" />
            ) : (
              <div className="p-8 bg-neutral-900 border border-white/10 rounded-3xl text-center max-w-sm w-full space-y-4 shadow-xl">
                <FileText className="w-16 h-16 text-saudi-glow mx-auto animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm text-white truncate">{mockAttachmentName}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">امتداد ملف معتمد SNNS Secure Binary</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0C0C0C] rounded-2xl border border-white/5 space-y-3">
            <p className="text-[10px] text-gray-500">
              * سيتم تشفير الملف وتمريره عبر خوادم النزاهة قبل العرض التلقائي للطرف الآخر.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setSelectedAttachmentType(null);
                  setMockAttachmentUrl("");
                  setMockAttachmentName("");
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmSendAttachment}
                className="px-5 py-2 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-xl text-xs font-bold"
              >
                إرسال المرفق الآمن 🚀
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* SECURITY / ABUSE REPORT MODAL (TWO-STEP PROTOCOL) */}
      {/* ========================================================= */}
      {reportingContext && (() => {
        const metrics = getOrCreateReporterMetrics(currentUserProfile.username);
        
        return (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0E0E0E] border border-red-500/20 max-w-md w-full rounded-3xl overflow-hidden shadow-2xl text-right font-tajawal"
            >
              {/* Header */}
              <div className="bg-red-500/10 border-b border-red-500/20 p-5 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-red-400">
                    {showWarningStep ? "⚠️ خطوة التعهد الأمني والمساءلة القانونية" : "إجراء أمان: رفع شكوى لمركز بلاغات الرئاسة 👮‍♂️"}
                  </h3>
                  <p className="text-[9px] text-gray-400 mt-0.5">صيانة نزاهة وحرية منصة SNNS.PRO المعتمدة بالمملكة</p>
                </div>
              </div>

              {!showWarningStep ? (
                /* STEP 1: Reason and Notes */
                <form onSubmit={handleFileReport} className="p-6 space-y-4">
                  <div className="p-3 bg-white/2 rounded-2xl text-xs text-gray-300">
                    جهة البلاغ: <span className="text-white font-bold">{reportingContext.type === "message" ? "رسالة محددة" : "حساب المستخدم الكامل"}</span> <br />
                    المُستهدَف بالبلاغ: <span className="text-saudi-glow font-bold">{reportingContext.targetName}</span>
                  </div>

                  {/* Trust Rating Widget for Awareness */}
                  <div className="bg-neutral-900/60 p-3 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">مستوى ثقتك بالبلاغات:</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${
                        metrics.trustLevel === "موثوق" ? "bg-saudi-green/10 text-saudi-glow" :
                        metrics.trustLevel === "متوسط" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>{metrics.trustLevel}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400">نسبة المصداقية المحسوبة:</span>
                      <span className="text-white font-bold">{metrics.trustPercentage}%</span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          metrics.trustLevel === "موثوق" ? "bg-saudi-green" :
                          metrics.trustLevel === "متوسط" ? "bg-yellow-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${metrics.trustPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 block font-bold">فئة المخالفة الأمنية:</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-gray-200 outline-none focus:border-red-500"
                    >
                      <option value="إزعاج ورسائل متكررة (Spam)">إزعاج ورسائل متكررة (Spam)</option>
                      <option value="محتوى غير لائق أو مخالف للتراث والآداب">محتوى غير لائق أو مخالف للتراث والآداب</option>
                      <option value="انتحال شخصية أو حساب مزيف">انتحال شخصية أو حساب مزيف</option>
                      <option value="خطاب كراهية أو مضايقات صريحة">خطاب كراهية أو مضايقات صريحة</option>
                      <option value="أخرى (يرجى التوضيح أدناه)">أخرى (يرجى التوضيح أدناه)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 block font-bold">ملاحظات توضيحية إضافية:</label>
                    <textarea
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      rows={3}
                      placeholder="أدخل تفاصيل المخالفة لمساعدة المراجعين في اتخاذ القرار بصورة سريعة..."
                      className="w-full p-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-red-500 text-right"
                      required
                    />
                  </div>

                  <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10 text-[9px] text-gray-500 leading-normal">
                    ⚠️ بموجب نظام مكافحة الجرائم المعلوماتية بالمملكة العربية السعودية، سيتم حفظ الهوية الرقمية للمبلِّغ والرمز المعرّف لربط النزاهة وحظر البلاغات العشوائية.
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setReportingContext(null);
                        setReportNotes("");
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs"
                    >
                      تراجع وإلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs text-right"
                    >
                      التالي: التعهد القانوني 👮‍♂️
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: Legal Caution & Pledge Acceptance */
                <div className="p-6 space-y-4">
                  
                  {/* Warning Header Panel */}
                  <div className="bg-red-950/40 p-4 border border-red-500/30 rounded-2xl">
                    <h4 className="text-red-400 font-bold text-xs mb-1">تحذير قبل إرسال البلاغ</h4>
                    <p className="text-[10px] text-gray-300 leading-relaxed">
                      نرجو التأكد من صحة البلاغ والمحتوى المُبلغ عنه.
                      البلاغات الكيدية أو البلاغات المزيفة أو استخدام النظام للإساءة للآخرين قد يعرض حسابك للإجراءات القانونية أو إيقاف الحساب حسب قوانين المنصة والأنظمة السيادية لمكافحة الجرائم المعلوماتية.
                    </p>
                  </div>

                  {/* Crucial stats awareness warning if user has LOW trust */}
                  {metrics.trustLevel !== "موثوق" && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 rounded-xl space-y-1">
                      <strong>⚠️ تنبيه انخفاض الكفاءة السلوكية:</strong>
                      <p>
                        نسبة دقتك السابقة هي {metrics.trustPercentage}%. لقد تم خفض معيار الأولوية لبلاغاتك. تقديم بلاغات غير دقيقة يهدد سلامة حسابك بالإيقاف الفوري.
                      </p>
                    </div>
                  )}

                  {metrics.violationsCount > 0 && (
                    <div className="p-2.5 bg-red-600/15 border border-red-600/40 text-[9px] text-red-400 rounded-xl">
                      🔴 <strong>شبهة إساءة الاستخدام:</strong> مسجل على حسابك ({metrics.violationsCount}) مخالفة تقديم بلاغ كيدي من قبل مشرفي المنصة. البلاغ الكيدي القادم سيجمد حسابك.
                    </div>
                  )}

                  {/* Bullet points of validation */}
                  <div className="space-y-2 text-[10px] text-gray-400 bg-neutral-900/40 p-3 rounded-xl border border-white/5">
                    <p className="text-white font-bold text-[11px] mb-1">بتقديمك لهذا البلاغ فأنت تؤكد رسمياً:</p>
                    <ul className="list-disc pr-4 space-y-1">
                      <li>أن البلاغ حقيقي وواقع لانتهاك صارخ</li>
                      <li>أن المحتوى يخالف السياسات والشرفية فعلاً</li>
                      <li>أنك تتحمل المسؤولية القانونية الكاملة عن البلاغ المرسل</li>
                    </ul>
                  </div>

                  {/* Pledge Checkbox */}
                  <label className="flex items-start gap-2.5 p-3.5 bg-[#050505] border border-red-500/10 rounded-2xl cursor-pointer select-none active:scale-98 transition-transform">
                    <input 
                      type="checkbox"
                      checked={pledgeChecked}
                      onChange={(e) => setPledgeChecked(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 text-red-600 focus:ring-red-500 bg-black mt-0.5 shrink-0 accent-red-600"
                    />
                    <div className="text-[11px] text-gray-200 leading-relaxed">
                      <span className="font-bold text-white block">التعهد الرقمي المعزز للشهادة</span>
                      أتعهد بقسم النزاهة بأن هذا البلاغ صحيح بالكامل ومستند لحقائق، وغير كيدي أو كاذب.
                    </div>
                  </label>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWarningStep(false);
                        setPledgeChecked(false);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300"
                    >
                      تراجع وتعديل البلاغ
                    </button>
                    <button
                      type="button"
                      onClick={submitReportAfterWarning}
                      disabled={!pledgeChecked}
                      className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-35 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs text-right transition-all flex items-center gap-1.5"
                    >
                      <span>متابعة إرسال البلاغ 👮‍♂️</span>
                    </button>
                  </div>

                </div>
              )}
            </motion.div>
          </div>
        );
      })()}


      {/* ========================================================= */}
      {/* HEADER BAR PANEL */}
      {/* ========================================================= */}
      <div className="p-4 border-b border-white/10 bg-[#0E0E0E] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-saudi-green/10 rounded-xl text-saudi-glow">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-1.5">
              منظومة المراسلة الفورية الخاصة 💬
              <span className="text-[9px] leading-none bg-saudi-green/10 border border-saudi-green/30 text-saudi-glow px-2 py-0.5 rounded-full font-sans">v2.0 PRO</span>
            </h1>
            <p className="text-[9px] text-gray-500 font-tajawal mt-0.5">بوابات تشفير أمنية بين الأطراف لضمان النزاهة والسرية التامة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
              title="إغلاق اللوحة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>


      {/* ========================================================= */}
      {/* MAIN VIEWPORT SPLIT */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --------------------------------------------------------- */}
        {/* 1. CONTACTS / CALL LOGS LEFT LIST SIDEBAR (Responsive hidden on detail open on small screen) */}
        {/* --------------------------------------------------------- */}
        <div className={`w-full sm:w-[240px] border-l border-white/5 flex flex-col shrink-0 ${activeContactId ? "hidden sm:flex" : "flex"}`}>
          {/* Quick Tabs Toggle (Chats vs Call Logs) */}
          <div className="grid grid-cols-2 p-2 border-b border-white/5 bg-[#080808]">
            <button
              onClick={() => setShowCallHistoryOnly(false)}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${!showCallHistoryOnly ? "bg-saudi-green/10 text-saudi-glow" : "text-gray-400 hover:text-white"}`}
            >
              الدردشات
            </button>
            <button
              onClick={() => setShowCallHistoryOnly(true)}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${showCallHistoryOnly ? "bg-saudi-green/10 text-saudi-glow" : "text-gray-400 hover:text-white"}`}
            >
              <History className="w-3.5 h-3.5" />
              <span>المكالمات</span>
            </button>
          </div>

          {!showCallHistoryOnly ? (
            <>
              {/* Search Bar */}
              <div className="p-3 border-b border-white/5 relative bg-[#090909]">
                <Search className="absolute right-4.5 top-5.5 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="ابحث عن صديقك..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 bg-neutral-900 border border-white/5 rounded-xl text-xs text-white placeholder-gray-650 focus:outline-none focus:border-saudi-green"
                />
              </div>

              {/* Contacts scrolled stack list */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/2 bg-[#050505] custom-scrollbar">
                {filteredContacts.map(c => {
                  const history = messagesDict[c.id] || [];
                  const lastMsg = history[history.length - 1];
                  const isTyping = typingContacts[c.id] || false;
                  const isSelected = activeContactId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveContactId(c.id)}
                      className={`p-3.5 flex gap-3 cursor-pointer select-none transition-all items-start relative ${
                        isSelected ? "bg-white/5 border-r-2 border-saudi-green" : "hover:bg-white/2"
                      }`}
                    >
                      {/* Avatar with Status badge */}
                      <div className="relative shrink-0">
                        <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#090909] ${
                          c.status === "متصل" ? "bg-saudi-green" : c.status === "مشغول" ? "bg-yellow-500" : "bg-gray-500"
                        }`} />
                      </div>

                      {/* Info preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold truncate text-white">{c.name}</span>
                            <TrustedBadge username={c.username || c.id} size="sm" />
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono tracking-tighter">
                            {lastMsg ? lastMsg.timestamp : ""}
                          </span>
                        </div>
                        
                        {isTyping ? (
                          <span className="text-[10px] font-bold text-saudi-green animate-pulse block">يكتب الآن...</span>
                        ) : (
                          <p className="text-[10px] text-gray-500 truncate">
                            {lastMsg ? (lastMsg.text || (lastMsg.mediaType === "image" ? "📷 صورة" : "📎 ملف ملموس")) : "لا توجد رسائل سابقة."}
                          </p>
                        )}
                      </div>

                      {/* Mute status flag */}
                      {c.isMuted && (
                        <div className="absolute left-3 bottom-3 text-gray-500 flex font-bold gap-0.5">
                          <BellOff className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredContacts.length === 0 && (
                  <div className="py-12 text-center text-xs text-gray-500">
                    لا يوجد أي أصدقاء مسجلين حالياً.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Call record history stacked list */
            <div className="flex-1 overflow-y-auto divide-y divide-white/2 bg-[#050505] custom-scrollbar">
              {callLogs.map(log => (
                <div key={log.id} className="p-3.5 flex gap-3 items-center">
                  <div className="relative shrink-0">
                    <img src={log.contactAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/5" />
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <h4 className="text-xs font-bold text-white truncate">{log.contactName}</h4>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mt-0.5">
                      {log.direction === "missed" && <span className="text-red-400 font-bold border border-red-500/10 px-1 bg-red-500/5 rounded">فائتة</span>}
                      {log.direction === "incoming" && <span className="text-saudi-green font-bold border border-saudi-green/10 px-1 bg-saudi-green/5 rounded">واردة</span>}
                      {log.direction === "outgoing" && <span className="text-saudi-glow font-bold border border-saudi-glow/10 px-1 bg-saudi-green/5 rounded">صادرة</span>}

                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-gray-400">
                    {log.type === "video" ? <Video className="w-4 h-4 text-saudi-glow" /> : <Phone className="w-4 h-4 text-saudi-green" />}
                    {log.duration && <span className="text-[9px] font-mono font-medium">{log.duration}</span>}
                  </div>
                </div>
              ))}

              {callLogs.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-500">
                  لا يوجد سجل بمكالمات فائتة أو حالية.
                </div>
              )}
            </div>
          )}
        </div>


        {/* --------------------------------------------------------- */}
        {/* 2. CHAT CONVERSATION AREA COMPONENT (Hidden on mobile if no active contact) */}
        {/* --------------------------------------------------------- */}
        <div className={`flex-1 flex flex-col bg-[#070707] relative ${!activeContactId ? "hidden sm:flex items-center justify-center p-8 text-center" : "flex"}`}>
          {activeContactId ? (
            <>
              {/* Active Conversation Header */}
              {(() => {
                const contact = contacts.find(c => c.id === activeContactId)!;
                const isTyping = typingContacts[contact.id] || false;

                return (
                  <>
                    <div className="p-3 border-b border-white/5 bg-[#0C0C0C] flex justify-between items-center shrink-0">
                      {/* Back, avatar, names */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button 
                          onClick={() => setActiveContactId(null)}
                          className="sm:hidden p-1.5 rounded-lg bg-white/5 text-gray-400"
                        >
                          <ChevronLeft className="w-4.5 h-4.5" />
                        </button>
                        
                        <div className="relative shrink-0">
                          <img src={contact.avatar} alt={contact.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-neutral-900 ${
                            contact.status === "متصل" ? "bg-saudi-green" : contact.status === "مشغول" ? "bg-yellow-500" : "bg-gray-500"
                          }`} />
                        </div>

                         <div className="min-w-0">
                           <div className="flex items-center gap-1.5 min-w-0">
                             <h3 className="text-xs font-bold text-white truncate">{contact.name}</h3>
                             <TrustedBadge username={contact.username || contact.id} size="sm" />
                              <span className="text-xs shrink-0" title="الدولة المكتشفة تلقائياً عبر موقع الـ IP">
                                {contact.id === "sara_a" ? "🇸🇦" : contact.id === "noura_ali" ? "🇰🇼" : contact.id === "abdullah_sh" ? "🇶🇦" : "🇦🇪"}
                              </span>
                              {contact.id === "fhd_hrb" && (
                                <span className="bg-red-500/10 border border-red-500/30 text-red-500 px-1 py-0.5 rounded text-[8px] font-bold uppercase font-sans shrink-0">
                                  VPN Detected
                                </span>
                              )}
                           </div>
                           {isTyping ? (
                             <span className="text-[9px] font-medium text-saudi-green block animate-pulse">يكتب الآن...</span>
                           ) : (
                             <span className="text-[9px] text-gray-500 font-medium block">
                               @{contact.username} &bull; {contact.status}
                             </span>
                           )}
                         </div>
                      </div>

                      {/* Header interactive controls */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => launchCall("voice")}
                          className="p-2 transition-colors hover:bg-white/5 rounded-xl border border-white/5 text-saudi-green active:scale-95"
                          title="اتصال صوتي خاص"
                        >
                          <Phone className="w-4 h-4 fill-saudi-green/10" />
                        </button>
                        <button 
                          onClick={() => launchCall("video")}
                          className="p-2 transition-colors hover:bg-white/5 rounded-xl border border-white/5 text-saudi-glow active:scale-95"
                          title="مكالمة فيديو مشفرة"
                        >
                          <Video className="w-4 h-4 fill-saudi-glow/10" />
                        </button>

                        <div className="relative">
                          <button 
                            onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                            className="p-2 transition-colors hover:bg-white/5 rounded-xl text-gray-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {headerDropdownOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-[#0F0F0F] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-30 space-y-0.5 text-right text-xs">
                              <button 
                                onClick={() => toggleMuteContact(contact.id)}
                                className="w-full text-right p-2 hover:bg-white/5 rounded-xl flex items-center justify-between text-gray-350"
                              >
                                <span>{contact.isMuted ? "تفعيل التنبيهات" : "كتم الإشعارات"}</span>
                                {contact.isMuted ? <Bell className="w-3.5 h-3.5 text-saudi-green" /> : <BellOff className="w-3.5 h-3.5" />}
                              </button>

                              <button 
                                onClick={() => toggleBlockContact(contact.id)}
                                className="w-full text-right p-2 hover:bg-white/5 rounded-xl flex items-center justify-between"
                              >
                                <span className={contact.isBlocked ? "text-saudi-green font-bold" : "text-red-400"}>
                                  {contact.isBlocked ? "إلغاء الحظر" : "حظر المستخدم"}
                                </span>
                                <UserX className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => deleteConversationHistory(contact.id)}
                                className="w-full text-right p-2 hover:bg-white/5 rounded-xl flex items-center justify-between text-red-400"
                              >
                                <span>حذف المحادثة</span>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button 
                                onClick={() => setReportingContext({ type: "user", targetId: contact.id, targetName: contact.name })}
                                className="w-full text-right p-2 hover:bg-white/5 rounded-xl flex items-center justify-between text-orange-400 border-t border-white/5"
                              >
                                <span>الإبلاغ عن الحساب</span>
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Scroll Area for messages bubbles */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#040404] custom-scrollbar">
                      <div className="bg-white/2 border border-white/5 p-3 rounded-2xl text-center text-[10px] text-gray-500 max-w-sm mx-auto leading-normal">
                        🔒 المحادثة مشفرة وصادرة ومحمية عبر الموحد. الهوية الرقمية الموثقة قيد التشغيل والتحقق التلقائي.
                      </div>

                      {contact.isBlocked && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold leading-normal text-center p-3 rounded-2xl max-w-sm mx-auto flex items-center gap-2 justify-center">
                          <Lock className="w-4 h-4 text-red-500" />
                          <span>قمت بحظر هذا الحساب، يرجى فك الحظر لتتمكن من المراسلة.</span>
                        </div>
                      )}

                      {(messagesDict[contact.id] || []).map((msg) => {
                        const isMe = msg.senderId === "me";
                        return (
                          <div 
                            key={msg.id}
                            className={`flex ${isMe ? "justify-start" : "justify-end"} group relative pr-1 pl-1`}
                          >
                            <div className={`max-w-[75%] space-y-1 relative group`}>
                              
                              {/* Bubble element */}
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                                isMe 
                                  ? "bg-saudi-green/15 text-white border border-saudi-green/25 rounded-tr-none" 
                                  : "bg-[#111] text-gray-200 border border-white/5 rounded-tl-none"
                              }`}>
                                
                                {/* Image attachment check */}
                                {msg.mediaType === "image" && msg.mediaUrl && (
                                  <div className="mb-2 rounded-xl overflow-hidden border border-white/10 max-h-[220px]">
                                    <img src={msg.mediaUrl} alt="Attached Preview" className="w-full object-cover" />
                                  </div>
                                )}

                                {/* Document attachment check */}
                                {msg.mediaType === "file" && msg.mediaUrl && (
                                  <div className="mb-2 p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="w-5 h-5 text-saudi-glow shrink-0" />
                                      <span className="font-bold text-[10px] truncate max-w-[120px] text-white">{msg.fileName}</span>
                                    </div>
                                    <a 
                                      href={msg.mediaUrl} 
                                      download={msg.fileName}
                                      className="p-1 rounded-lg bg-[#111] hover:bg-neutral-800 text-saudi-glow cursor-pointer shrink-0"
                                      title="تنزيل الملف الموثق"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}

                                {/* Message text content */}
                                {msg.text && (
                                  (() => {
                                    const shareData = resolveShareLinkData(msg.text);
                                    if (shareData) {
                                      return (
                                        <div className="my-1.5 p-2 bg-neutral-950 border border-saudi-green/45 hover:border-saudi-green rounded-xl flex flex-col gap-2 max-w-[240px] text-right font-tajawal shadow-md">
                                          <div className="flex gap-2.5 items-start">
                                            {shareData.imageUrl && (
                                              <img 
                                                src={shareData.imageUrl} 
                                                alt="" 
                                                className={`w-11 h-11 object-cover border border-white/5 shrink-0 ${shareData.type === "account" ? "rounded-full" : "rounded-lg"}`} 
                                                referrerPolicy="no-referrer"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <span className="text-[8px] bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 px-1.5 py-0.5 rounded text-[7px] font-bold block w-fit mb-1 font-mono">
                                                {shareData.type === "live" && "🎥 بث مباشر"}
                                                {shareData.type === "video" && "🎬 مقطع مرئي"}
                                                {shareData.type === "account" && "👤 ملف صانع"}
                                                {shareData.type === "audio_room" && "🎙️ ديوانية صوتية"}
                                                {shareData.type === "invite" && "🤝 دعوة انضمام"}
                                              </span>
                                              <h5 className="font-bold text-[10px] text-white truncate leading-tight">{shareData.title}</h5>
                                              <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{shareData.subtitle}</p>
                                            </div>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              if (onOpenSharedItem) {
                                                onOpenSharedItem(shareData.type, shareData.id);
                                              } else {
                                                const event = new CustomEvent("snns_open_shared", { 
                                                  detail: { type: shareData.type, id: shareData.id } 
                                                });
                                                window.dispatchEvent(event);
                                              }
                                              if (onClose) onClose();
                                            }}
                                            className="w-full py-1.5 bg-saudi-green text-white text-[9px] font-black rounded-lg transition-all hover:bg-saudi-green/90 active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <span>{shareData.actionText}</span>
                                          </button>
                                        </div>
                                      );
                                    }
                                    return <p className="font-tajawal leading-normal">{msg.text}</p>;
                                  })()
                                )}

                                {/* Time stamp and read status */}
                                <div className="flex justify-end items-center gap-1.5 mt-1.5 opacity-60 text-[8px] select-none font-mono">
                                  <span>{msg.timestamp}</span>
                                  {isMe && (
                                    <span>
                                      {msg.status === "read" ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-saudi-green" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Message actions like trigger Report message directly */}
                              <button
                                onClick={() => setReportingContext({ 
                                  type: "message", 
                                  targetId: msg.id, 
                                  targetName: isMe ? "محيى من قبلك" : contact.name 
                                })}
                                className="absolute top-2 left-[-24px] opacity-0 group-hover:opacity-100 text-[10px] text-gray-600 hover:text-red-400 bg-black/60 p-1.5 rounded-lg border border-white/5 transition-opacity"
                                title="إبلاغ عن هذه الرسالة المحددة"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Reply Bottom Input Section */}
                    <div className="p-3 bg-[#0B0B0B] border-t border-white/10 shrink-0">
                      
                      {/* Invisible Inputs */}
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={triggerImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={triggerFileUpload} 
                        className="hidden" 
                      />

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage(messageText);
                        }} 
                        className="flex gap-2 items-center"
                      >
                        
                        {/* Attachments buttons */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="p-2 bg-neutral-900 border border-white/5 text-gray-400 hover:text-white rounded-xl active:scale-95 transition-transform"
                            title="إرفاق صورة وصورة شخصية"
                            disabled={contact.isBlocked}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-neutral-900 border border-white/5 text-gray-400 hover:text-white rounded-xl active:scale-95 transition-transform"
                            title="إرفاق وثيقة أو مستند"
                            disabled={contact.isBlocked}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Input Field text */}
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={contact.isBlocked ? "لا يمكنك الرد بسبب حظر الحساب" : "اكتب رسالتك المشفرة الراقية هنا..."}
                          className="flex-1 px-4 py-2.5 bg-[#050505] border border-white/5 focus:border-saudi-green focus:outline-none rounded-xl text-xs text-white"
                          disabled={contact.isBlocked}
                        />

                        {/* Submit Send Button */}
                        <button
                          type="submit"
                          disabled={contact.isBlocked || !messageText.trim()}
                          className="p-2.5 bg-saudi-green hover:bg-saudi-green/90 text-white rounded-xl active:scale-95 transition-transform shrink-0 disabled:opacity-30 disabled:pointer-events-none"
                          title="إرسال تشفير"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </form>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            /* Selected Contact is empty greeting card view */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#050505]/40 relative">
              <div className="w-20 h-20 bg-saudi-green/10 border border-saudi-green/20 rounded-full flex items-center justify-center text-saudi-glow mb-5 animate-pulse">
                <MessageCircle className="w-10 h-10" />
              </div>

              <h2 className="text-base font-bold text-white mb-2">منظومة الدردشات المشفرة الفورية</h2>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                حدد أحد الأصدقاء المعتمدين من القائمة الجانبية لبدء حوار آمن فوري أو الاتصال به مكالمة صوت وفيديو بالامتثال التام للنزاهة الشرفية.
              </p>

              <div className="absolute bottom-6 text-[10px] text-neutral-600">
                SNNS.PRO Security Protocols Ledger &bull; Real-time Active
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
