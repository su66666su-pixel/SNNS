import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Music, Play, Pause, RefreshCw, Volume2, Sparkles, Compass, Share2 } from "lucide-react";

interface Track {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  notes: number[]; // frequency ratios
  tempo: number;
}

const TRACKS: Track[] = [
  {
    id: "oud",
    name: "نسيم العود النجدي",
    desc: "ألحان تراثية دافئة تحاكي أوتار العود الأصيل",
    emoji: "🎻",
    notes: [110, 165, 220, 247.5, 275, 330, 440], // Arabic Bayati scale frequencies based on A2 (approx)
    tempo: 450,
  },
  {
    id: "ardah",
    name: "إيقاع العرضة السعودية",
    desc: "نبضات حماسية تحاكي طبول العرضة المهيبة",
    emoji: "🥁",
    notes: [60, 90, 120, 180], // Low drum fundamental frequencies
    tempo: 380,
  },
  {
    id: "alula",
    name: "هدوء رمال العلا",
    desc: "أصوات هادئة ومريحة تعبر عن عمق الصحراء الساحرة",
    emoji: "🏜️",
    notes: [220, 275, 330, 412.5, 495, 660], // Major pentatonic for spacey sandscape
    tempo: 800,
  }
];

export default function HeritagePlayer({ onShare }: { onShare?: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track>(TRACKS[0]);
  const [volume, setVolume] = useState(0.5);
  const [pulsingRipples, setPulsingRipples] = useState<number[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalIdRef = useRef<any>(null);
  const stepRef = useRef(0);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  const playNote = (freq: number, type: "sine" | "triangle" | "sawtooth" | "square" = "triangle") => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Filter to make it warmer/less aggressive
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    // Oud string-like envelope: fast attack, steady exponential decay
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.35, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.25);

    // Visual effect triggers
    const id = Date.now() + Math.random();
    setPulsingRipples(prev => [...prev.slice(-3), id]);
    setTimeout(() => {
      setPulsingRipples(prev => prev.filter(r => r !== id));
    }, 1000);
  };

  const playDrum = (freq: number) => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    
    // Drum body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Pitch sweep downwards to feel like a real drum skin impact
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(volume * 0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    // Add high wooden snap accent
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    const snapFilter = ctx.createBiquadFilter();

    snapOsc.type = "triangle";
    snapOsc.frequency.setValueAtTime(1400, ctx.currentTime);
    
    snapFilter.type = "highpass";
    snapFilter.frequency.setValueAtTime(1000, ctx.currentTime);

    snapGain.gain.setValueAtTime(0, ctx.currentTime);
    snapGain.gain.linearRampToValueAtTime(volume * 0.08, ctx.currentTime + 0.01);
    snapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    snapOsc.connect(snapFilter);
    snapFilter.connect(snapGain);
    snapGain.connect(ctx.destination);

    snapOsc.start();
    snapOsc.stop(ctx.currentTime + 0.06);

    const id = Date.now() + Math.random();
    setPulsingRipples(prev => [...prev.slice(-3), id]);
    setTimeout(() => {
      setPulsingRipples(prev => prev.filter(r => r !== id));
    }, 300);
  };

  const startAudioLoop = (track: Track) => {
    stopAudio();
    initAudio();
    setIsPlaying(true);
    stepRef.current = 0;

    const playStep = () => {
      if (!audioContextRef.current) return;
      const index = stepRef.current;
      
      if (track.id === "oud") {
        // Melodic Saudi chord pattern style
        const baseNote = track.notes[index % track.notes.length];
        const isAccent = index % 3 === 0;
        
        // Root chord background note (drone) on certain steps
        if (index % 4 === 0) {
          playNote(track.notes[0] / 2, "sine"); // Deep sub drone (55Hz)
        }
        
        playNote(baseNote, isAccent ? "sawtooth" : "triangle");
      } 
      else if (track.id === "ardah") {
        // Ardah Saudi dynamic drumming rhythm: DUM-DUM-TAC-DUM style
        const cycle = index % 8;
        if (cycle === 0 || cycle === 1 || cycle === 4) {
          playDrum(100); // Dum heavy drum strike
        } else if (cycle === 2 || cycle === 6) {
          playDrum(190); // Higher accent drumming head
        } else if (cycle === 3) {
          // Double fast low strike
          playDrum(90);
          setTimeout(() => playDrum(90), 100);
        }
      } 
      else if (track.id === "alula") {
        // Soft desert sunset pad chords
        const choice = track.notes[Math.floor(Math.random() * track.notes.length)];
        playNote(choice, "sine");
        
        if (index % 2 === 0) {
          const companion = track.notes[(index + 2) % track.notes.length];
          setTimeout(() => {
            playNote(companion, "triangle");
          }, 300);
        }
      }

      stepRef.current = (stepRef.current + 1) % 16;
    };

    // run first immediately
    playStep();
    intervalIdRef.current = setInterval(playStep, track.tempo);
  };

  const stopAudio = () => {
    setIsPlaying(false);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudioLoop(activeTrack);
    }
  };

  const selectTrack = (track: Track) => {
    setActiveTrack(track);
    if (isPlaying) {
      startAudioLoop(track);
    }
  };

  return (
    <div id="heritage-music-node" className="bg-[#0A0A0A]/90 border border-white/5 p-4 rounded-3xl relative overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Background glow animation */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-r from-saudi-green to-saudi-glow blur-xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Visual audio feedback rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              {pulsingRipples.map((rippleId) => (
                <motion.div
                  key={rippleId}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute w-12 h-12 rounded-full border border-saudi-green/40 pointer-events-none"
                />
              ))}
            </div>

            <button 
              onClick={togglePlay}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? "bg-saudi-green text-white shadow-[0_0_15px_rgba(0,163,79,0.3)]" : "bg-white/5 hover:bg-white/10 text-gray-400"}`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />}
            </button>
          </div>

          <div className="text-right sm:text-right">
            <div className="flex items-center gap-1.5 justify-start">
              <span className="text-xs font-bold text-saudi-glow flex items-center gap-1">
                {activeTrack.emoji}
                {activeTrack.name}
              </span>
              <Sparkles className="w-3 h-3 text-saudi-glow animate-pulse" />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 max-w-[200px] font-tajawal leading-tight">{activeTrack.desc}</p>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTrack(t)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-tajawal transition-all border ${activeTrack.id === t.id ? "bg-saudi-green/20 text-saudi-glow border-saudi-green/30" : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"}`}
            >
              {t.emoji} {t.name.split(" ")[1] || t.name}
            </button>
          ))}
        </div>

        {/* Volume & Compass Bar info */}
        <div className="flex items-center gap-2.5">
          {onShare && (
            <button 
              onClick={onShare}
              className="p-2 hover:bg-saudi-green/10 text-gray-400 hover:text-saudi-glow border border-white/5 hover:border-saudi-green/25 rounded-xl transition-all cursor-pointer shadow-md shrink-0"
              title="مشاركة الديوانية الصوتية"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <Volume2 className="w-4 h-4 text-gray-500 shrink-0" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 sm:w-20 accent-saudi-green h-1 bg-white/10 rounded-lg cursor-pointer" 
          />
        </div>
      </div>
    </div>
  );
}
