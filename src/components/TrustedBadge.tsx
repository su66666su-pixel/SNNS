import React, { useState } from "react";
import { Check } from "lucide-react";
import { isUserTrusted, getTrustedDetails } from "../utils/trustedBadgesStore";

interface TrustedBadgeProps {
  username: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const TrustedBadge: React.FC<TrustedBadgeProps> = ({ username, size = "sm", className = "" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const trusted = isUserTrusted(username);

  if (!trusted) return null;

  const details = getTrustedDetails(username);
  const catText = details ? `فئة: ${details.accountType}` : "";

  // Size dimensions for consistent sizing
  const dimensions = {
    xs: "w-3 h-3 text-[8px]",
    sm: "w-4 h-4 text-[10px]",
    md: "w-5 h-5 text-[12px]",
    lg: "w-6 h-6 text-[14px]"
  };

  const selectedDim = dimensions[size];

  return (
    <div 
      className={`relative inline-flex items-center select-none cursor-pointer group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dir="rtl"
    >
      {/* Glow effect behind badge */}
      <span className="absolute inset-0 bg-saudi-green/40 blur-sm rounded-full animate-pulse group-hover:bg-saudi-green/60" />

      {/* The visible Badge */}
      <div className={`relative flex items-center justify-center bg-black border border-saudi-green/80 text-saudi-green rounded-full shadow-[0_0_8px_rgba(20,220,120,0.5)] transition-all duration-300 transform group-hover:scale-110 group-hover:border-saudi-glow group-hover:text-saudi-glow group-hover:shadow-[0_0_12px_rgba(20,240,160,0.8)] ${selectedDim}`}>
        <Check className="stroke-[3] w-[80%] h-[80%]" />
      </div>

      {/* Saudi Premium Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 z-[9999] min-w-[200px] p-3 rounded-2xl bg-neutral-950/95 border border-saudi-green/30 text-white shadow-[0_5px_25px_rgba(0,0,0,0.91),0_0_15px_rgba(20,220,120,0.15)] backdrop-blur-md pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center bg-saudi-green/10 border border-saudi-green text-saudi-green rounded-full w-4 h-4">
              <Check className="stroke-[3.5] w-2.5 h-2.5" />
            </div>
            <span className="text-[11px] font-bold text-saudi-green font-tajawal">حساب موثوق بواسطة SNNS.PRO</span>
          </div>
          {details && (
            <div className="space-y-1 text-right font-tajawal text-[10px] text-gray-300">
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                <span className="text-gray-400">فئة التوثيق:</span>
                <span className="font-bold text-saudi-glow">{details.accountType}</span>
              </div>
              <div className="text-[9px] text-gray-400 leading-normal line-clamp-2 mt-1 bg-white/5 p-1 rounded">
                💡 {details.reason}
              </div>
            </div>
          )}
          {/* Arrow */}
          <div className="absolute top-full right-1/2 translate-x-1/2 -mt-1.5 border-[6px] border-transparent border-t-neutral-950/95" />
        </div>
      )}
    </div>
  );
};
