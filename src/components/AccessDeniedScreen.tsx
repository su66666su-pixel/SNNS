import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Globe, Activity, RefreshCw, Layers, ExternalLink, Sliders } from "lucide-react";
import { detectGeoIP, getSimulationSettings, saveSimulationSettings, DetectedGeoInfo, getCountryConfigs } from "../utils/countryLockStore";

export default function AccessDeniedScreen({ 
  geoInfo, 
  onRefresh 
}: { 
  geoInfo: DetectedGeoInfo | null;
  onRefresh: () => void;
}) {
  const [countriesList] = useState(() => getCountryConfigs());
  const [simSettings, setSimSettings] = useState(() => getSimulationSettings());
  const [showTester, setShowTester] = useState(false);

  const handleSimulate = (code: string) => {
    const updated = {
      ...simSettings,
      enabled: true,
      simulatedCountry: code,
      simulatedIp: code === "SA" ? "188.49.50.224" : code === "IR" ? "185.120.45.62" : "64.233.160.201"
    };
    setSimSettings(updated);
    saveSimulationSettings(updated);
    onRefresh();
  };

  const handleDisableSim = () => {
    const updated = {
      ...simSettings,
      enabled: false
    };
    setSimSettings(updated);
    saveSimulationSettings(updated);
    onRefresh();
  };

  const toggleVpnSim = () => {
    const updated = {
      ...simSettings,
      simulatedVpn: !simSettings.simulatedVpn
    };
    setSimSettings(updated);
    saveSimulationSettings(updated);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-[#050505] text-white z-[9999] flex flex-col justify-between p-6 overflow-y-auto font-tajawal text-right" dir="rtl">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-saudi-green/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-[#00A34F]/3 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-saudi-glow" />
          <span className="font-mono text-[10px] text-gray-400">SNNS.PRO • GEOPROTECT</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
      </header>

      {/* Main Info */}
      <main className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center items-center py-12 relative z-10 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-400 mb-8 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
        >
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </motion.div>

        <motion.h1 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-4"
        >
          الخدمة غير متاحة حالياً في منطقتك
        </motion.h1>

        <motion.p 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm"
        >
          نأسف لعدم إمكانية تصفح منصة <span className="text-saudi-glow font-bold">SNNS.PRO</span>. يرجع ذلك إلى قيود التواجد أو سياسات الامتثال الوقائي الإقليمية في موقعك الجغرافي الحالي.
        </motion.p>

        {/* IP and Geo details terminal */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-neutral-900/80 border border-white/5 rounded-2xl p-5 mb-8 text-right font-mono text-xs relative overflow-hidden backdrop-blur-md"
        >
          {/* Header line */}
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-[10px] text-gray-500">
            <span className="font-mono">IP RECONNAISSANCE</span>
            <span className="font-tajawal">تفاصيل اتصالك الحالي</span>
          </div>

          <div className="space-y-3 font-tajawal">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">عنوان بروتوكول الإنترنت (IP):</span>
              <span className="font-mono text-white font-bold select-all bg-white/5 px-2 py-0.5 rounded">{geoInfo?.ip || "ـ"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">المنطقة والبلد:</span>
              <span className="text-saudi-glow font-bold flex items-center gap-1.5 direction-ltr">
                <span className="font-mono">({geoInfo?.countryCode || "ـ"})</span>
                <span>{geoInfo?.countryName || "ـ"}</span>
                <span className="text-base leading-none">{geoInfo?.flag}</span>
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">المنطقة الزمنية للكلاينت:</span>
              <span className="font-mono text-gray-200">{geoInfo?.timezone || "ـ"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">مزود ومسار الإنترنت:</span>
              <span className="text-gray-200 truncate max-w-[200px]" title={geoInfo?.provider}>{geoInfo?.provider || "ـ"}</span>
            </div>

            {geoInfo?.vpnDetected && (
              <div className="mt-2.5 p-3.5 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-[11px] flex items-start gap-2 text-right">
                <Activity className="w-4.5 h-4.5 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-bold">تم الكشف عن شبكة VPN أو Proxy!</p>
                  <p className="text-[10px] text-red-300/80 mt-1">تتناقض معلومات المنطقة الزمنية لجهازك مع موقع الـ IP الحالي. يرجى إيقاف أدوات الوسيط لإعادة المعالجة.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Call to actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            onClick={onRefresh}
            className="flex-1 py-3 px-4 bg-white/5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            إعادة اختبار الاتصال الـ IP
          </button>

          <button 
            onClick={() => setShowTester(!showTester)}
            className="flex-1 py-3 px-4 bg-saudi-green/10 text-saudi-glow border border-saudi-green/20 rounded-xl text-xs font-bold hover:bg-saudi-green/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            تغيير محاكي الدولة للفحص
          </button>
        </div>

        {/* Administration Simulation Console (Only visible if the toggle is pressed) */}
        {showTester && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6 bg-black/80 border border-amber-500/20 rounded-2xl p-5 text-right font-tajawal text-xs"
          >
            <h5 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5 justify-end">
              <span>كونسول فحص الأمان واختبار الحظر (منطقة محاكاة الإدارة)</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </h5>
            <p className="text-[10.5.px] text-gray-400 mb-4 leading-relaxed">
              يمكنك محاكاة موقعك من أي دولة عبر الأزرار التالية للتأكد من سلوك الحظر، أو كشف الـ VPN فورياً دون تغيير عنوانك الفعلي لتجربة لوحة التحكم.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-4">
              {countriesList.map((c) => (
                <button
                  key={c.code}
                  onClick={() => handleSimulate(c.code)}
                  className={`p-2.5 rounded-xl text-right border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                    simSettings.enabled && simSettings.simulatedCountry === c.code 
                      ? "bg-amber-500/10 border-amber-500 text-amber-300" 
                      : "bg-[#0c0c0c] border-white/5 hover:border-white/15 text-gray-300"
                  }`}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    c.status === "allowed" ? "bg-saudi-green/10 text-saudi-glow" :
                    c.status === "blocked" ? "bg-red-500/10 text-red-400" :
                    "bg-orange-500/10 text-orange-400"
                  }`}>
                    {c.status === "allowed" ? "مسموح" : c.status === "blocked" ? "محظور" : "مقيد"}
                  </span>
                  <span className="flex items-center gap-1 leading-none">
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-between border-t border-white/5 pt-3">
              <button
                onClick={toggleVpnSim}
                className={`py-2 px-3 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  simSettings.simulatedVpn 
                    ? "bg-red-500/10 border-red-500/40 text-red-400" 
                    : "bg-white/5 border-white/10 text-gray-450 hover:bg-white/10"
                }`}
              >
                {simSettings.simulatedVpn ? "🔴 محاكي VPN: نشط" : "⚪ محاكي VPN: ملغى"}
              </button>

              {simSettings.enabled && (
                <button
                  onClick={handleDisableSim}
                  className="py-2 px-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  إيقاف المحاكاة والعودة لـ IP الفعلي
                </button>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-4 border-t border-white/5 relative z-10 text-[10px] text-gray-500 font-mono">
        <p className="order-2 md:order-1 font-tajawal">حقوق الأمن والامتثال الرقمي محفوظة © {new Date().getFullYear()} SNNS.PRO</p>
        <div className="order-1 md:order-2 flex items-center gap-4 font-tajawal">
          <a href="#" className="hover:text-saudi-glow transition-colors">مكافحة غسيل الأموال</a>
          <span>•</span>
          <a href="#" className="hover:text-saudi-glow transition-colors">الشروط والأمان القانوني</a>
        </div>
      </footer>
    </div>
  );
}
