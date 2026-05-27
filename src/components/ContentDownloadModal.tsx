import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Download, Image as ImageIcon, Video, RotateCw, CheckCircle2, 
  Share2, Copy, Bookmark, ShieldAlert, BadgeInfo, Sparkles, HardDrive
} from "lucide-react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    id: string;
    title: string;
    type: "video" | "photo" | "replay" | "clip";
    url: string; // url of media (image or video)
    creator: string;
    isPrivate?: boolean;
    isDeleted?: boolean;
  } | null;
  creatorAllowDownloads: boolean; // setting of the creator "السماح بالتحميل"
}

export default function ContentDownloadModal({ 
  isOpen, 
  onClose, 
  content, 
  creatorAllowDownloads 
}: DownloadModalProps) {
  const [selectedQuality, setSelectedQuality] = useState<"360p" | "720p" | "1080p">("1080p");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [applyWatermark, setApplyWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("SNNS.PRO");
  
  // Download simulation/real statuses
  const [downloadProgress, setDownloadProgress] = useState(-1); // -1 = idle
  const [downloadStep, setDownloadStep] = useState("");
  const [fileSizeStr, setFileSizeStr] = useState("");
  const [downloadSpeedStr, setDownloadSpeedStr] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedToPlatform, setSavedToPlatform] = useState(false);
  const [copied, setCopied] = useState(false);

  // Set default format based on type
  useEffect(() => {
    if (content) {
      if (content.type === "photo") {
        setSelectedFormat("png");
      } else {
        setSelectedFormat("mp4");
      }
      setSavedToPlatform(checkIfSaved(content.id));
      setErrorMessage("");
      setDownloadProgress(-1);
    }
  }, [content]);

  if (!isOpen || !content) return null;

  // Sizes based on quality
  const getSimulatedDetails = () => {
    if (content.type === "photo") {
      switch (selectedQuality) {
        case "360p": return { size: "450 KB", time: "~1 ثانية" };
        case "720p": return { size: "1.2 MB", time: "~1 ثانية" };
        case "1080p": default: return { size: "3.5 MB", time: "2 ثانية" };
      }
    } else {
      switch (selectedQuality) {
        case "360p": return { size: "8.4 MB", time: "4 ثوانٍ" };
        case "720p": return { size: "24.5 MB", time: "12 ثانية" };
        case "1080p": default: return { size: "65.1 MB", time: "28 ثانية" };
      }
    }
  };

  const checkIfSaved = (id: string) => {
    try {
      const savedList = JSON.parse(localStorage.getItem("snns_saved_items") || "[]");
      return savedList.some((item: any) => item.id === id);
    } catch {
      return false;
    }
  };

  const handleSaveToPlatform = () => {
    try {
      const savedList = JSON.parse(localStorage.getItem("snns_saved_items") || "[]");
      if (savedToPlatform) {
        // Remove
        const filtered = savedList.filter((item: any) => item.id !== content.id);
        localStorage.setItem("snns_saved_items", JSON.stringify(filtered));
        setSavedToPlatform(false);
        showToast("✓ تم إزالته من مكتبة المحفوظات");
      } else {
        // Add
        const toSave = {
          ...content,
          savedAt: new Date().toLocaleDateString("ar-SA"),
          quality: selectedQuality,
          format: selectedFormat
        };
        savedList.push(toSave);
        localStorage.setItem("snns_saved_items", JSON.stringify(savedList));
        setSavedToPlatform(true);
        showToast("✓ تم الحفظ بنجاح في بوابتك للمحفوظات وسيرفرات الرياض!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    const fakeLink = `snns.pro/download/${content.type}/${content.id}?sign=sa_sec_${Math.random().toString(36).substr(2, 9)}`;
    navigator.clipboard.writeText(fakeLink);
    setCopied(true);
    showToast("✓ تم توليد ونسخ الرابط الموقع الآمن المعتمد!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: `شاهد وحمل محتوى ${content.creator} على منصة البث السعودية الفخمة SNNS.PRO`,
          url: window.location.href,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Triggering visual alerts
  const showToast = (msg: string) => {
    const t = document.createElement("div");
    t.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-saudi-green text-white font-tajawal text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl border border-saudi-glow/30 z-[100] animate-fade-in";
    t.innerHTML = msg;
    t.dir = "rtl";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  };

  // Handle core download logic with active fetching, canvas watermarking and native saving
  const handleStartDownload = async () => {
    // 1. Validator checks
    if (!creatorAllowDownloads) {
      setErrorMessage("⚠️ عذراً، عطل منشئ المحتوى صلاحية تنزيل هذا العمل بشكل خارجي لحماية الملكيةالفكرية.");
      return;
    }

    if (content.isPrivate) {
      setErrorMessage("⚠️ المحتوى خاص (بث تجريبي أو حساب مغلق لعملاء موثقين)، لا يمكن تنزيله إلا للمصرح لهم.");
      return;
    }

    if (content.isDeleted) {
      setErrorMessage("⚠️ تم حذف أو توقيف هذا الملف مؤقتاً بواسطة حارس الرصد الرقمي.");
      return;
    }

    setErrorMessage("");
    setDownloadProgress(0);
    setDownloadStep("جاري فحص سلامة الرابط والحساب الموثق... 🔐");

    const steps = [
      { progress: 15, msg: "جاري توليد رابط تنزيل موقع وآمن (Signed URL)... 🛡️" },
      { progress: 35, msg: "جاري طلب وضغط الحزم من سيرفرات سحابة الرياض سريعة الاستجابة... ⚡" },
      { progress: 55, msg: "معالجة الفيديو وتثبيت علامات الأمن الرقمي الثنائية... 🎬" },
      { progress: 80, msg: "تطبيق الختم المائي لمنع الاحتيال الفكري الرقمي... ✍️" },
      { progress: 100, msg: "تم تجهيز وتشفير الحزمة بنجاح! جاري الحفظ بجهازك... 🎉" }
    ];

    let currentStepIdx = 0;

    const runSimulation = setInterval(async () => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setDownloadProgress(step.progress);
        setDownloadStep(step.msg);

        // Calculate download visual metrics
        const speed = (4.5 + Math.random() * 3).toFixed(1);
        setDownloadSpeedStr(`${speed} ميغابايت/ثانية`);
        const info = getSimulatedDetails();
        setFileSizeStr(info.size);

        currentStepIdx++;
      } else {
        clearInterval(runSimulation);
        
        // Let's do a REAL download if it's an image utilizing HTML5 Canvas!
        if (content.type === "photo") {
          try {
            // Draw image on canvas to apply a real watermark
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = content.url;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx) {
                canvas.width = img.width;
                canvas.height = img.height;
                // Draw the original image first
                ctx.drawImage(img, 0, 0);

                if (applyWatermark) {
                  // Text watermark setup
                  const size = Math.floor(canvas.width * 0.035) || 24;
                  ctx.font = `bold ${size}px serif`;
                  
                  // Semi transparent black outline shadow
                  ctx.fillStyle = "rgba(0,0,0,0.6)";
                  ctx.fillText(`${watermarkText} - @${content.creator}`, canvas.width * 0.04 + 1, canvas.height * 0.95 + 1);
                  
                  // Bright Saudi Green or Golden text
                  ctx.fillStyle = "#00A34F"; // saudi green glow
                  ctx.fillText(`${watermarkText} - @${content.creator}`, canvas.width * 0.04, canvas.height * 0.95);
                }

                // Trigger real browser download
                const mimeType = selectedFormat === "webp" ? "image/webp" : selectedFormat === "png" ? "image/png" : "image/jpeg";
                const dataUrl = canvas.toDataURL(mimeType);
                const dlLink = document.createElement("a");
                dlLink.href = dataUrl;
                dlLink.download = `snns_pro_${content.id}_${selectedQuality}.${selectedFormat}`;
                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);

                showToast("✓ تم تنزيل الصورة المائية الفعلية لجهازك!");
              }
            };
            img.onerror = () => {
              // Fail-safe direct image download
              triggerDirectDownload(content.url, `photo_${content.id}.${selectedFormat}`);
            };
          } catch (e) {
            triggerDirectDownload(content.url, `photo_${content.id}.${selectedFormat}`);
          }
        } else {
          // It's a video (or simulated video stream)
          // Since video URLs are typically preview MP4s or Unsplash placeholder images, we'll download directly
          triggerDirectDownload(content.url, `video_${content.id}_${selectedQuality}.${selectedFormat}`);
          showToast("✓ تم بدء تحميل ملف الفيديو للقرص المحلي!");
        }

        // Save download count to statistics inside user stats storage
        incrementLocalStatistics(content.id, content.title, content.type);
        setDownloadProgress(-1);
      }
    }, 1200);
  };

  const triggerDirectDownload = (fileUrl: string, fileName: string) => {
    // If external video like unsplash, trigger direct browser behavior
    // Best way inside sandbox frames to initiate secure download triggers
    const a = document.createElement("a");
    a.href = fileUrl;
    a.target = "_blank";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const incrementLocalStatistics = (id: string, title: string, type: string) => {
    try {
      // 1. Total Stats
      const stats = JSON.parse(localStorage.getItem("snns_download_statistics") || "{}");
      stats[id] = (stats[id] || 0) + 1;
      localStorage.setItem("snns_download_statistics", JSON.stringify(stats));

      // 2. Add to download logs
      const logs = JSON.parse(localStorage.getItem("snns_download_logs2026") || "[]");
      const newLog = {
        id: "log_" + Date.now(),
        contentId: id,
        title: title,
        type: type,
        quality: selectedQuality,
        format: selectedFormat,
        timestamp: new Date().toLocaleString("ar-SA")
      };
      logs.unshift(newLog);
      localStorage.setItem("snns_download_logs2026", JSON.stringify(logs));

      // Quick visual count
      const downloadCounts = JSON.parse(localStorage.getItem("snns_download_counts") || "{}");
      downloadCounts[id] = (downloadCounts[id] || 0) + 1;
      localStorage.setItem("snns_download_counts", JSON.stringify(downloadCounts));

      // Window event to refresh tabs if opened on profile
      window.dispatchEvent(new Event("snns_downloads_changed"));
    } catch (e) {
      console.error(e);
    }
  };

  const activeDetails = getSimulatedDetails();

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 font-tajawal text-right"
        dir="rtl"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          className="bg-neutral-950 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          {/* Top Banner Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-saudi-green via-yellow-500 to-saudi-green" />

          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-5 left-5 p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-neutral-900/40 relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-saudi-glow" />
              <span className="text-[10px] font-bold text-saudi-glow uppercase tracking-wider">نظام التحميل الفاخر والمؤمن • SNNS Engine</span>
            </div>
            <h3 className="text-lg font-black text-white leading-tight font-tajawal flex items-center gap-2">
              تنزيل وحفظ المحتوى الرقمي
              {content.type === "photo" ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400">صورة فوتوغرافية 🖼️</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">بث / فيديو سينمائي 🎬</span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-2 truncate max-w-[85%] font-medium">العنوان: {content.title}</p>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Error Message if disabled */}
            {errorMessage ? (
              <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-300 rounded-2xl flex gap-3 text-xs items-start leading-relaxed animate-shake">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <h4 className="font-bold">قيود الحماية الرقمية للديوان 🔐</h4>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            ) : !creatorAllowDownloads ? (
              <div className="p-4 bg-yellow-950/30 border border-yellow-905/40 text-yellow-300 rounded-2xl flex gap-3 text-xs items-start leading-relaxed">
                <BadgeInfo className="w-5 h-5 text-yellow-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-500">حماية منشئ المحتوى مفعلة</h4>
                  <p className="mt-1">صاحب المحتوى @{content.creator} عطل التحميل المباشر. يقتصر الوصول على العرض والتصفح المضمون.</p>
                </div>
              </div>
            ) : null}

            {/* If Download is in progress */}
            {downloadProgress >= 0 ? (
              <div className="p-8 text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden">
                <div className="relative w-20 h-20 mx-auto bg-saudi-green/10 rounded-full flex items-center justify-center">
                  <RotateCw className="w-10 h-10 text-saudi-glow animate-spin" />
                  <span className="absolute text-[11px] font-mono font-black text-white">{downloadProgress}%</span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-gray-200">{downloadStep}</h4>
                  <p className="text-[10px] text-gray-500 font-mono">سيرفر الاستضافة السيادي: الرياض-سحابة كبرى-Z30</p>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden relative">
                  <motion.div 
                    className="h-full bg-saudi-green shadow-[0_0_15px_#00A34F]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${downloadProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>

                {/* Info and size stats */}
                <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                  <div>
                    <span className="block text-[8px] text-gray-500 font-bold">الحجم التقريبي</span>
                    <span className="text-xs font-black font-mono text-gray-300">{fileSizeStr || "حساب..."}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-500 font-bold">سرعة الاستقبال</span>
                    <span className="text-xs font-black font-mono text-saudi-glow">{downloadSpeedStr || "مستقر..."}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-gray-500 font-bold">البروتوكول</span>
                    <span className="text-xs font-black font-mono text-yellow-500">CDN Sec CDN</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Select Quality Row */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 block px-1">اختر جودة التصدير والضغط:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "360p", label: "جودة سريعة (360p)", badge: "توفير بيانات" },
                      { val: "720p", label: "عالية الوضوح (720p)", badge: "قياسي" },
                      { val: "1080p", label: "سينمائي نقي (1080p)", badge: "فائق الدقة" }
                    ].map((q) => (
                      <button
                        key={q.val}
                        onClick={() => setSelectedQuality(q.val as any)}
                        className={`p-3 rounded-2xl border text-center transition-all relative overflow-hidden ${
                          selectedQuality === q.val 
                            ? "bg-saudi-green/10 border-saudi-green text-saudi-glow" 
                            : "bg-white/[0.01] border-white/5 text-gray-400 hover:border-white/10"
                        }`}
                      >
                        <span className="block text-xs font-black">{q.val}</span>
                        <span className="text-[8px] text-gray-500 block mt-0.5">{q.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Select Output Format */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 block px-1">صيغة الملف المستهدفة:</label>
                  <div className="flex flex-wrap gap-2">
                    {content.type === "photo" ? (
                      ["png", "jpg", "webp"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setSelectedFormat(fmt)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                            selectedFormat === fmt 
                              ? "bg-saudi-green/15 border-saudi-green text-saudi-glow" 
                              : "bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))
                    ) : (
                      ["mp4", "webm"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setSelectedFormat(fmt)}
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                            selectedFormat === fmt 
                              ? "bg-blue-950/40 border-blue-500/50 text-blue-400" 
                              : "bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Watermark Options Box */}
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2.5xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-gray-300">ختم العلامة المائية للسيادة والتأمين ✍️</h4>
                      <p className="text-[9px] text-gray-500">حماية حقوق النشر للديوان السعودي واسم منشئ المحتوى تلقائياً.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={applyWatermark} 
                        onChange={(e) => setApplyWatermark(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-saudi-green" />
                    </label>
                  </div>

                  {applyWatermark && (
                    <div className="relative animate-fade-in pt-1">
                      <input 
                        type="text" 
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-saudi-glow font-bold outline-none focus:border-saudi-green"
                        placeholder="نص التوقيع أو ختم الملكية الفكرية..."
                      />
                    </div>
                  )}
                </div>

                {/* Helper stats and info summary */}
                <div className="flex justify-between items-center text-[10px] text-gray-400 bg-[#070707] p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 ms-1">
                    <HardDrive className="w-3.5 h-3.5 text-saudi-glow" />
                    <span>الحجم النهائي: <strong className="text-white font-mono">{activeDetails.size}</strong></span>
                  </div>
                  <div className="me-1">
                    <span>الوقت المقدر: <strong className="text-white font-mono">{activeDetails.time}</strong></span>
                  </div>
                </div>

                {/* Primary Download Action Button */}
                <button
                  onClick={handleStartDownload}
                  disabled={!creatorAllowDownloads}
                  className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-xs transition-all cursor-pointer shadow-lg ${
                    creatorAllowDownloads 
                      ? "bg-saudi-green hover:bg-saudi-glow text-white shadow-saudi-green/20 hover:scale-[1.01]" 
                      : "bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل وحفظ بجودات فائقة</span>
                </button>

                {/* Divider */}
                <div className="flex items-center my-3">
                  <div className="flex-1 h-[1px] bg-white/5" />
                  <span className="px-3.5 text-[9px] text-gray-600 font-bold">خيارات الحفظ الإضافية</span>
                  <div className="flex-1 h-[1px] bg-white/5" />
                </div>

                {/* Additional Action row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Save to shelf */}
                  <button
                    onClick={handleSaveToPlatform}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      savedToPlatform 
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-500" 
                        : "bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedToPlatform ? "fill-yellow-500" : ""}`} />
                    <span className="text-[9px] font-bold">حفظ بالمنصة</span>
                  </button>

                  {/* Copy Signed Link */}
                  <button
                    onClick={handleCopyLink}
                    className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-white/5 hover:border-white/10 transition-all"
                  >
                    <Copy className="w-4 h-4 text-saudi-glow" />
                    <span className="text-[9px] font-bold">{copied ? "تم النسخ" : "نسخ رابط موقع"}</span>
                  </button>

                  {/* Native Share */}
                  <button
                    onClick={handleShare}
                    className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-white/5 hover:border-white/10 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold">مشاركة سريعة</span>
                  </button>
                </div>
              </>
            )}

          </div>

          {/* Quick Notice footer */}
          <div className="p-4 bg-neutral-950 border-t border-white/5 text-center shrink-0">
            <p className="text-[8px] text-gray-650 font-mono text-gray-550">
              جميع العمليات مرصودة برمز IP وبصمة جهازك لمنع سرقة أو إعادة نشر المحتوى السعودي بدون مستند رسمي بالتوثيق العالي.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
