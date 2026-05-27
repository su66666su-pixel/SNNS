import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Camera, 
  Volume2, 
  Monitor, 
  MessageSquare, 
  UserPlus, 
  Heart, 
  ShieldCheck, 
  ChevronDown, 
  MoreVertical,
  X,
  Share2
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

const mockRemoteUser: Participant = {
  id: "1",
  name: "سارة العبدالله",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1200&fit=crop",
};

const mockLocalUser: Participant = {
  id: "2",
  name: "أنا",
  avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
};

type CallState = "ringing" | "connecting" | "active" | "ended";

export default function VideoCall({ onEnd, onShare }: { onEnd: () => void; onShare?: () => void }) {
  const [callState, setCallState] = useState<CallState>("ringing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [reactions, setReactions] = useState<{ id: number; x: number }[]>([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (callState === "ringing") setCallState("connecting");
      if (callState === "connecting") setCallState("active");
    }, 2500);
    return () => clearTimeout(timer);
  }, [callState]);

  const addReaction = () => {
    const id = Date.now();
    const x = Math.random() * 100 - 50;
    setReactions(prev => [...prev, { id, x }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col font-inter">
      {/* Background Video (Remote) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={mockRemoteUser.avatar} 
          alt="Remote User" 
          className="w-full h-full object-cover opacity-60 transition-all duration-700 blur-[2px] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 px-6 pt-12 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Live 01:24</span>
            <div className="w-[1px] h-3 bg-white/20 mx-1" />
            <ShieldCheck className="w-3 h-3 text-saudi-glow" />
            <span className="text-[10px] text-gray-300">Encrypted</span>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mt-2"
          >
            <div className="w-10 h-10 rounded-full border-2 border-saudi-green overflow-hidden">
                <img src={mockRemoteUser.avatar} alt={mockRemoteUser.name} className="w-full h-full object-cover" />
            </div>
            <div>
                <h3 className="text-sm font-bold font-tajawal flex items-center gap-1.5 justify-end">
                  <span>{mockRemoteUser.name}</span>
                  <span>🇸🇦</span>
                </h3>
                <p className="text-[10px] text-gray-400">الرياض، المملكة العربية السعودية</p>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col items-end gap-3">
            <button onClick={onEnd} className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/5 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-saudi-green/10 backdrop-blur-md px-3 py-1 rounded-full border border-saudi-green/30">
                <Volume2 className="w-3 h-3 text-saudi-glow" />
                <span className="text-[10px] font-medium">85dB</span>
            </div>
        </div>
      </div>

      {/* Local Video Card */}
      <motion.div 
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute top-32 right-6 z-20 w-32 h-44 md:w-40 md:h-56 bg-dark-surface rounded-3xl border-2 border-saudi-green/30 overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      >
        <div className="w-full h-full relative">
            {isVideoOn ? (
                <img 
                    src={mockLocalUser.avatar} 
                    alt="Me" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <VideoOff className="w-8 h-8 text-gray-700" />
                </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/5">
                <span className="text-[8px] font-bold">You</span>
                {isMuted && <MicOff className="w-2 h-2 text-red-500" />}
            </div>
        </div>
      </motion.div>

      {/* Center States */}
      <AnimatePresence mode="wait">
        {callState !== "active" && (
            <motion.div 
                key={callState}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex-1 flex flex-col items-center justify-center relative z-10"
            >
                <div className="w-32 h-32 rounded-full border-4 border-saudi-green/20 relative flex items-center justify-center">
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-saudi-green rounded-full blur-2xl"
                    />
                    <img 
                      src={mockRemoteUser.avatar} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover relative z-10 border-4 border-dark-bg"
                    />
                </div>
                <h2 className="mt-8 text-2xl font-bold font-tajawal tracking-wide">
                    {callState === "ringing" ? "اتصال وارد..." : "جاري التوصيل..."}
                </h2>
                <p className="text-gray-400 mt-2 font-tajawal">مكالمة فيديو فاخرة من SNNS.PRO</p>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Reactions Area */}
      <div className="absolute bottom-40 right-10 z-30 pointer-events-none h-64 w-32 overflow-hidden">
        <AnimatePresence>
            {reactions.map(r => (
                <motion.div
                    key={r.id}
                    initial={{ y: 200, opacity: 0, x: r.x }}
                    animate={{ y: -100, opacity: [0, 1, 1, 0], x: r.x + Math.sin(Date.now() / 100) * 20 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute bottom-0 text-3xl"
                >
                    ❤️
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-40 px-6 pb-12 mt-auto">
        <div className="flex flex-col gap-6 max-w-lg mx-auto">
            {/* Reaction Shortcuts */}
            <div className="flex justify-center gap-4">
                <ReactionEmoji emoji="😍" onClick={addReaction} />
                <ReactionEmoji emoji="🔥" onClick={addReaction} />
                <ReactionEmoji emoji="👏" onClick={addReaction} />
                <ReactionEmoji emoji="✨" onClick={addReaction} />
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={addReaction}
                    className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white"
                >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </motion.button>
            </div>

            {/* Main Controls Panel */}
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] px-4 py-4 flex items-center justify-between shadow-2xl">
                <ControlGroup>
                    <ControlButton 
                        active={isMuted} 
                        onClick={() => setIsMuted(!isMuted)} 
                        icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />} 
                        label="Mute"
                    />
                    <ControlButton 
                        active={!isVideoOn} 
                        onClick={() => setIsVideoOn(!isVideoOn)} 
                        icon={isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />} 
                        label="Video"
                    />
                </ControlGroup>

                <div className="h-10 w-[1px] bg-white/10" />

                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEnd}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                    <PhoneOff className="w-7 h-7 text-white" />
                </motion.button>

                <div className="h-10 w-[1px] bg-white/10" />

                <ControlGroup>
                    <ControlButton 
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)} 
                        icon={<Camera className="w-5 h-5" />} 
                        label="Flip"
                    />
                    <ControlButton 
                        onClick={() => {}} 
                        icon={<MessageSquare className="w-5 h-5" />} 
                        label="Chat"
                    />
                    {onShare && (
                        <ControlButton 
                            onClick={onShare} 
                            icon={<Share2 className="w-5 h-5 text-saudi-glow" />} 
                            label="Share"
                        />
                    )}
                </ControlGroup>
            </div>

            {/* Participants Row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-saudi-green/10 backdrop-blur-xl border border-saudi-green/20 rounded-2xl w-fit mx-auto">
                <div className="flex -space-x-2">
                    <ParticipantChip avatar={mockRemoteUser.avatar} />
                    <ParticipantChip avatar={mockLocalUser.avatar} />
                </div>
                <span className="text-[10px] font-bold text-saudi-glow">2 Participants</span>
                <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
                    <UserPlus className="w-3 h-3" />
                </button>
            </div>
        </div>
      </div>

      {/* Decorative Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-saudi-green/20 to-transparent pointer-events-none" />
    </div>
  );
}

function ReactionEmoji({ emoji, onClick }: { emoji: string; onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.2, y: -5 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center text-xl bg-black/20 backdrop-blur-md rounded-full border border-white/5"
    >
      {emoji}
    </motion.button>
  );
}

function ControlGroup({ children }: { children: React.ReactNode }) {
    return <div className="flex items-center gap-4">{children}</div>;
}

function ControlButton({ icon, active = false, onClick, label }: { icon: React.ReactNode; active?: boolean; onClick: () => void; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClick}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? "bg-white text-black" : "bg-white/10 text-white/60 hover:text-white"}`}
            >
                {icon}
            </motion.button>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        </div>
    );
}

function ParticipantChip({ avatar }: { avatar: string }) {
    return (
        <div className="w-6 h-6 rounded-full border-2 border-dark-bg overflow-hidden">
            <img src={avatar} className="w-full h-full object-cover" />
        </div>
    );
}
