import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Download, Bookmark, Trash2, History, Settings, ShieldCheck, 
  Play, Image as ImageIcon, ExternalLink, RefreshCw, Radio
} from "lucide-react";

interface MyDownloadsTabProps {
  onOpenDownloadModal: (item: any) => void;
  isOwnProfile: boolean;
  username: string;
}

export default function MyDownloadsTab({ onOpenDownloadModal, isOwnProfile, username }: MyDownloadsTabProps) {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<any[]>([]);
  const [allowMyDownloads, setAllowMyDownloads] = useState<boolean>(() => {
    const saved = localStorage.getItem("snns_allow_my_downloads");
    return saved !== "false"; // default true
  });

  const [activeSubTab, setActiveSubTab] = useState<"saved" | "logs">("saved");

  const loadData = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("snns_saved_items") || "[]");
      setSavedItems(saved);

      const logs = JSON.parse(localStorage.getItem("snns_download_logs2026") || "[]");
      setDownloadLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    
    // Add event listener to refresh on changes
    window.addEventListener("snns_downloads_changed", loadData);
    return () => {
      window.removeEventListener("snns_downloads_changed", loadData);
    };
  }, []);

  const handleToggleAllowDownloads = (checked: boolean) => {
    setAllowMyDownloads(checked);
    localStorage.setItem("snns_allow_my_downloads", String(checked));
    
    // Dispatch event to sync other views
    window.dispatchEvent(new Event("snns_allow_my_downloads_changed"));
    
    // Toast alert
    const t = document.createElement("div");
    t.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-saudi-green text-white font-tajawal text-xs font-bold py-3.5 px-6 rounded-2xl shadow-xl border border-saudi-glow/30 z-[100] animate-fade-in";
    t.innerHTML = checked 
      ? "✓ تم تفعيل خيار 'السماح بالتحميل' لمنشوراتك بنجاح!" 
      : "⚠️ تم تعطيل التنزيل الخارجي؛ سيظهر زر التحميل مغلَقاً للآخرين.";
    t.dir = "rtl";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  };

  const handleRemoveSavedItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("هل تود إزالة هذا العنصر من مكتبة المحفوظات والرف الدائم؟")) {
      const filtered = savedItems.filter(item => item.id !== id);
      localStorage.setItem("snns_saved_items", JSON.stringify(filtered));
      setSavedItems(filtered);
    }
  };

  const handleClearLogs = () => {
    if (confirm("هل أنت متأكد من تصفير وإخلاء سجل تحميلات النظام لهذا الجهاز؟")) {
      localStorage.setItem("snns_download_logs2026", "[]");
      setDownloadLogs([]);
    }
  };

  return (
    <div className="space-y-6 text-right font-tajawal" dir="rtl">
      
      {/* 1. Global Downloads Settings Option available if own profile */}
      {isOwnProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-l from-neutral-900 via-neutral-950 to-neutral-900 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden"
        >
          {/* Subtle gold line decorative */}
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-saudi-green to-yellow-500" />
          
          <div className="space-y-1 pr-2">
            <h3 className="font-extrabold text-sm text-gray-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-saudi-glow animate-pulse" />
              إعدادات الخصوصية والتحميل لمنشوراتي 🔐
            </h3>
            <p className="text-[10px] text-gray-400">
              بصفتك منشئ محتوى سعودي موثَّق، يمكنك تفعيل أو تعطيل زر التنزيل لجميع المتابعين والزوار.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5 shrink-0 self-end md:self-center">
            <span className="text-xs font-bold text-gray-300">السماح بالتحميل والتخزين:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={allowMyDownloads} 
                onChange={(e) => handleToggleAllowDownloads(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-saudi-green" />
            </label>
          </div>
        </motion.div>
      )}

      {/* 2. Sub-tabs Navigation */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        <button
          onClick={() => setActiveSubTab("saved")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "saved" ? "text-saudi-glow" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5" />
            تخزينات الرف الخاص بالمنصة ({savedItems.length})
          </span>
          {activeSubTab === "saved" && (
            <motion.div layoutId="subtab_download_indicator" className="absolute bottom-0 inset-x-0 h-1 bg-saudi-green rounded-full shadow-[0_0_8px_#10B981]" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("logs")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative ${
            activeSubTab === "logs" ? "text-saudi-glow" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <History className="w-3.5 h-3.5" />
            سجل ومحفوظات تنزيلات الجهاز ({downloadLogs.length})
          </span>
          {activeSubTab === "logs" && (
            <motion.div layoutId="subtab_download_indicator" className="absolute bottom-0 inset-x-0 h-1 bg-saudi-green rounded-full shadow-[0_0_8px_#10B981]" />
          )}
        </button>
      </div>

      {/* 3. Render Items */}
      <div className="space-y-4">
        
        {/* Sub-tab 1: SAVED ON PLATFORM */}
        {activeSubTab === "saved" && (
          <div className="space-y-3.5">
            {savedItems.length === 0 ? (
              <div className="py-14 text-center border-2 border-dashed border-white/5 rounded-3xl space-y-3.5">
                <Bookmark className="w-12 h-12 text-gray-650 opacity-20 mx-auto" />
                <h4 className="font-bold text-sm text-gray-400">لا يوجد محفوظات رقمية حالياً</h4>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                  احفظ الفيديوهات، الصور، أو البثوث داخل المنصة للرجوع السريع وتصديرها بالصيغ الموثقة في أي وقت.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedItems.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => onOpenDownloadModal(item)}
                    className="p-4 bg-neutral-900/40 border border-white/5 rounded-3xl flex hover:border-saudi-green/30 transition-all cursor-pointer group items-center relative overflow-hidden"
                  >
                    {/* Visual Media Indicator on left or right */}
                    <div className="w-20 aspect-video rounded-xl bg-black overflow-hidden border border-white/10 shrink-0 relative flex items-center justify-center">
                      <img src={item.url} alt="Thumbnail bg" className="w-full h-full object-cover opacity-60" />
                      
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                        {item.type === "photo" ? (
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        ) : (
                          <Play className="w-5 h-5 text-saudi-glow fill-saudi-glow/20" />
                        )}
                      </div>
                    </div>

                    {/* Metadata details */}
                    <div className="flex-1 px-4 text-right space-y-1">
                      <div className="flex items-center gap-1.5 justify-start">
                        {item.type === "photo" ? (
                          <span className="text-[8px] bg-green-500/15 text-green-400 font-bold px-2 py-0.5 rounded-md">صورة</span>
                        ) : item.type === "replay" ? (
                          <span className="text-[8px] bg-red-500/15 text-red-500 font-bold px-2 py-0.5 rounded-md">إعادة بث</span>
                        ) : (
                          <span className="text-[8px] bg-blue-500/15 text-blue-400 font-bold px-2 py-0.5 rounded-md">فيديو</span>
                        )}
                        <span className="text-[9px] text-gray-500 font-mono">حُفظ في: {item.savedAt}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{item.title}</h4>
                      <p className="text-[9px] text-gray-400 font-medium">الناشر: @{item.creator}</p>
                    </div>

                    {/* Actions and deletions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleRemoveSavedItem(item.id, e)}
                        className="p-2 hover:bg-red-950/20 hover:text-red-400 text-gray-500 rounded-xl transition-all border border-transparent hover:border-red-900/30"
                        title="حذف من المحفوظات"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sub-tab 2: SYSTEM DOWNLOADS LOGS HISTORY */}
        {activeSubTab === "logs" && (
          <div className="space-y-3.5">
            {downloadLogs.length > 0 && (
              <div className="flex justify-between items-center mb-1 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-500 font-bold">هذا السجل آمن ومحفوظ محلياً فقط.</span>
                <button 
                  onClick={handleClearLogs}
                  className="text-[10px] text-red-400 hover:text-red-500 font-bold font-tajawal cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  مسح وتصفير السجل ⚠️
                </button>
              </div>
            )}

            {downloadLogs.length === 0 ? (
              <div className="py-14 text-center border-2 border-dashed border-white/5 rounded-3xl space-y-3.5">
                <History className="w-12 h-12 text-gray-650 opacity-20 mx-auto" />
                <h4 className="font-bold text-sm text-gray-400">لا يوجد سجل تنزيلات للجوال أو المتصفح</h4>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                  سيظهر الجدول الموثَّق لجميع عمليات تصدير وحفظ الصور والفيديوهات عبر بوابة الـ CDN الآمنة هنا.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-neutral-900/20 p-2">
                <table className="w-full text-xs text-right divide-y divide-white/5 font-tajawal">
                  <thead>
                    <tr className="text-gray-400 text-[9px] font-bold uppercase">
                      <th className="p-3">اسم المستند/الملف</th>
                      <th className="p-3 text-center">نوع الملف</th>
                      <th className="p-3 text-center font-mono">الجودة</th>
                      <th className="p-3 text-center font-mono">الصيغة</th>
                      <th className="p-3 text-left">تاريخ ووقت التحميل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {downloadLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white max-w-[200px] truncate">{log.title}</td>
                        <td className="p-3 text-center">
                          {log.type === "photo" ? (
                            <span className="text-[9px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded">صورة</span>
                          ) : (
                            <span className="text-[9px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded">فيديو</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-saudi-glow">{log.quality}</td>
                        <td className="p-3 text-center font-mono uppercase text-amber-500">{log.format}</td>
                        <td className="p-3 text-left text-[9px] text-gray-500 font-mono">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
