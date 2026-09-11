import React, { useState } from "react";

interface Minda2LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "full" | "icon" | "horizontal" | "badge";
}

export const Minda2Logo: React.FC<Minda2LogoProps> = ({
  className = "",
  size = "md",
  showTagline = true,
  variant = "full",
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeConfig = {
    sm: { height: 28, text: "text-base" },
    md: { height: 38, text: "text-xl" },
    lg: { height: 48, text: "text-2xl" },
    xl: { height: 62, text: "text-3xl" },
  };

  const { height, text } = sizeConfig[size] || sizeConfig.md;

  if (imgError) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-black tracking-tight ${className}`}>
        <span className={`${text} bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
          MIND2I
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src="/logo.png"
        alt="MIND2I Logo"
        onError={(e) => {
          const target = e.currentTarget;
          if (target.src.endsWith("/logo.png")) {
            target.src = "/media/Mind2i Multi color logo.png";
          } else {
            setImgError(true);
          }
        }}
        style={{ height: `${height}px`, width: "auto", objectFit: "contain" }}
        className="transition-transform duration-200 hover:scale-105"
      />
    </div>
  );
};
