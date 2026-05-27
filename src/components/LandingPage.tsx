import React, { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Play, Radio, MessageSquare, CheckCircle, ShieldAlert, 
  Building2, ArrowLeft, ChevronLeft, ArrowRight, UserCheck, 
  Sparkles, Award, Users, ShieldCheck, Heart, Eye, Bell
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [videoError, setVideoError] = useState(false);

  // Saudi Inspired Featured Live Broadcasts
  const featuredLives = [
    {
      id: "live_1",
      title: "توثيق حي لمعالم الدرعية التاريخية وحي الطريف 🇸🇦",
      creator: "سليمان العتيبي",
      username: "su66666su",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      viewers: "٣.٢ ألف",
      location: "الدرعية، الرياض",
      cover: "https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=600&fit=crop"
    },
    {
      id: "live_2",
      title: "بحر الحكايات وجلسة الفلكلور والتراث الموسيقي القديم 🎵",
      creator: "سارة العبدالله",
      username: "sara_a",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      viewers: "١.٨ ألف",
      location: "البلد، جدة التاريخية",
      cover: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&fit=crop"
    }
  ];

  const creators = [
    { name: "سليمان العتيبي", username: "@su66666su", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", role: "موثق آثار" },
    { name: "سارة العبدالله", username: "@sara_a", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", role: "صانعة أفلام تراثية" },
    { name: "عبدالله الشمري", username: "@abdullah_sh", avatar: "https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=100&h=100&fit=crop", role: "فارس وخيال" },
  ];

  const features = [
    { icon: <Radio className="w-5 h-5 text-saudi-glow" />, title: "بث مباشر سينمائي", desc: "نظام بث نقي وبجودة عالية لمشاركة الفعاليات والتراث مباشرة وبدون تقطيع." },
    { icon: <MessageSquare className="w-5 h-5 text-saudi-glow" />, title: "دردشة أمنية خاصة", desc: "تواصل اجتماعي مشفر يضمن خصوصيتك التامة، مع الحماية من المحتوى الاحتيالي." },
    { icon: <CheckCircle className="w-5 h-5 text-saudi-glow" />, title: "توثيق حسابات حكومي", desc: "تحقق بيومتري وسيبراني يمنح ديوانيتك علامة التوثيق السعودية المعتمدة." },
    { icon: <Award className="w-5 h-5 text-saudi-glow" />, title: "محتوى عربي أصيل", desc: "منصة مخصصة لثقافتنا وقيمنا وتاريخنا العريق، بعيداً عن التشويش الخارجي." },
    { icon: <ShieldAlert className="w-5 h-5 text-saudi-glow" />, title: "حارس رقمي وحماية", desc: "رصد فوري وحظر فوري لعنوان IP المشبوه وحماية كاملة مدعومة بالذكاء الرقمي." },
    { icon: <Building2 className="w-5 h-5 text-saudi-glow" />, title: "إعلانات وبوابة أعمال", desc: "بوابة متكاملة للمؤسسات لترويج فعالياتها وتوثيق السجلات التجارية فورياً." }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-tajawal relative overflow-x-hidden selection:bg-saudi-green selection:text-white" dir="rtl">
      
      {/* Absolute Header Branding */}
      <header className="absolute top-0 left-0 right-0 z-50 h-20 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#00843D] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,132,61,0.4)] border border-saudi-glow/20">
            <span className="font-sans font-black text-white text-base tracking-tighter">S</span>
          </div>
          <span className="font-sans font-black text-white text-lg tracking-wider">SNNS<span className="text-saudi-glow">.PRO</span></span>
        </div>

        <Link 
          to="/admin" 
          className="text-[10px] md:text-xs font-bold bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-saudi-glow" />
          <span>المنصة الأمنية للمراقبين</span>
        </Link>
      </header>

      {/* Cinematic Full Header Video Hero Section */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
        {/* Dynamic Background Video/Image Block */}
        <div className="absolute inset-0 z-0">
          {!videoError ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover scale-105 pointer-events-none transition-opacity duration-1000 opacity-40 mix-blend-lighten"
            >
              <source src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b9e28d183b91ec65aa04001d5&profile_id=139&oauth2_token_id=57447761" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-sandy-desert-landscape-with-mountains-42289-large.mp4" type="video/mp4" />
            </video>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center opacity-30 mix-blend-overlay"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549413203-0402e1c9e88d?w=1600&fit=crop)' }}
            />
          )}

          {/* High-quality Deep Dark Gradients Over Video */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-radial-at-c from-saudi-green/10 via-transparent to-transparent opacity-60" />
        </div>

        {/* Content Centered Over Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col justify-center items-center pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/25 text-amber-500 px-4 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-wide mb-6 shadow-[0_4px_12px_rgba(245,158,11,0.05)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span>صناعة سعودية • بث حي مباشر • بيئة رقمية موثوقة</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tight font-tajawal"
          >
            SNNS<span className="text-saudi-glow">.PRO</span>
            <span className="block text-xl sm:text-3xl md:text-4xl mt-3 text-gray-150 font-medium">منصة البث والتواصل السعودية الحديثة</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-xs sm:text-base md:text-lg text-gray-450 leading-relaxed mt-6 max-w-2xl font-normal text-gray-400 px-4"
          >
            شارك هيبتك ولحظاتك، ابث قصصك التراثية واليومية، واكتشف محتوى عربي وسعودي فخم ومحمي بجودة سينمائية فائقة تليق بك.
          </motion.p>

          {/* Golden & Saudi Green Clean Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3.5 mt-8 w-full max-w-md px-6 justify-center"
          >
            <button 
              onClick={() => navigate("/su66666su")}
              className="px-8 h-12 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-extrabold rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(0,132,61,0.3)] ring-2 ring-saudi-glow/20"
            >
              <span>ابدأ الآن واستكشف ديوانيتك</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <a 
              href="#featured-broadcasts"
              className="px-6 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-saudi-glow fill-saudi-glow/10" />
              <span>مشاهدة البثوث الحية</span>
            </a>
          </motion.div>
        </div>

        {/* Floating Ambient Light */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50 text-gray-500 animate-bounce pointer-events-none">
          <span className="text-[9px] font-sans tracking-widest uppercase">اكتشف الأسفل</span>
          <div className="w-1.5 h-6 bg-gradient-to-b from-saudi-green to-transparent rounded-full" />
        </div>
      </section>

      {/* Featured Live Streams (البثوث المباشرة المميزة) */}
      <section id="featured-broadcasts" className="py-20 max-w-5xl mx-auto px-6 relative z-10 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 text-right">
          <div>
            <div className="flex items-center gap-2 mb-1 justify-start">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-saudi-glow">مباشر الآن</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">البثوث المباشرة المميزة</h2>
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            بثوث سينمائية تنقل لك عبق التراث والأصالة السعودية من مختلف مناطق ومدن المملكة الغالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredLives.map((live, idx) => (
            <div 
              key={live.id} 
              onClick={() => navigate(`/@${live.username}`)}
              className="bg-white/[0.01] border border-white/5 rounded-3xl p-4 cursor-pointer hover:border-saudi-green/45 transition-all duration-300 group overflow-hidden relative"
            >
              {/* Cover with simulated play button */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden relative mb-4 bg-black">
                <img 
                  src={live.cover} 
                  alt={live.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Stats overlays */}
                <div className="absolute top-3 right-3 bg-red-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  <span> مباشر </span>
                </div>

                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-gray-200.text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3 text-saudi-glow" />
                  <span>{live.viewers} مشاهد</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-saudi-green/90 group-hover:bg-saudi-glow rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white shrink-0 mr-0.5" />
                  </div>
                </div>
              </div>

              {/* Creator Metadata Row */}
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                  <img src={live.avatar} alt={live.creator} className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
                  <div className="text-right">
                    <p className="text-xs font-black text-white flex items-center gap-1">
                      <span>{live.creator}</span>
                      <CheckCircle className="w-3.5 h-3.5 text-saudi-glow fill-saudi-glow/10" />
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">@{live.username}</p>
                  </div>
                </div>

                <span className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded text-gray-400 font-bold">
                  📍 {live.location}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-3 text-right leading-relaxed group-hover:text-saudi-glow transition-colors">
                {live.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="py-16 bg-white/[0.01] border-y border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white mb-2">كبار منشئي المحتوى وصناع التراث</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-10">
            رواة، مؤرخون، وفنانون سعوديون يشاركونك روايات الأصالة والتراث الإنساني عبر بث صلب وآمن.
          </p>

          <div className="flex flex-wrap justify-center gap-8">
            {creators.map((c, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/${c.username}`)}
                className="flex flex-col items-center hover:opacity-90 cursor-pointer transition-opacity group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/5 group-hover:border-saudi-green/40 p-1 bg-black transition-colors">
                  <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
                </div>
                <h4 className="text-xs font-black text-gray-200 mt-3 group-hover:text-saudi-glow flex items-center gap-1">
                  <span>{c.name}</span>
                  <CheckCircle className="w-3 h-3 text-saudi-glow" />
                </h4>
                <p className="text-[9px] text-gray-500 font-mono">{c.username}</p>
                <p className="text-[9px] font-bold text-saudi-glow mt-1 bg-saudi-green/5 border border-saudi-green/10 px-2 py-0.5 rounded-full">{c.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brief Core Features Grid */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-black text-white">مميزات منصة SNNS.PRO الفخمة</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
            تم هندسة وتصميم كل ميزة بعناية فائقة لتعكس الرفاهية والأمان السيبراني المتناغم.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={i}
              className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-saudi-green/20 transition-all duration-300 text-right"
            >
              <div className="w-10 h-10 rounded-2xl bg-saudi-green/10 border border-saudi-green/20 flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,132,61,0.05)]">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pure Call-to-Action Join Section */}
      <section className="py-20 bg-gradient-to-t from-[#010101] via-transparent to-transparent relative z-10 text-center px-4">
        <div className="max-w-2xl mx-auto border border-white/5 bg-white/[0.01] p-10 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-saudi-green opacity-5 blur-[60px] pointer-events-none" />
          
          <h2 className="text-2xl md:text-3.5xl font-black text-white">انضم إلى ديوانيتك الفاخرة الرقمية اليوم</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mt-4">
            تواصل، تصفح، وبث محتواك وعالمك في منصة تفاعلية تجسد قوة الأمان والسيادة التقنية السعودية المصقولة.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button 
              onClick={() => navigate("/su66666su")}
              className="px-8 h-12 bg-saudi-green hover:bg-saudi-glow text-white text-xs font-black rounded-xl transition-all shadow-xl flex items-center gap-2 cursor-pointer"
            >
              <span>دخول ديوانيتي الافتراضية 🇸🇦</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link 
              to="/admin" 
              className="px-6 h-12 bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              <span>لوحة الإدارة والأمان</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Clean Premium Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-[10px] text-gray-650 text-gray-600 font-mono relative z-20">
        <p className="tracking-wide">SNNS.PRO Premium Saudi Platforms Console V2.1 • © 2026</p>
      </footer>
    </div>
  );
}
