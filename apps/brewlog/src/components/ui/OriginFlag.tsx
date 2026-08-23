import React from "react";
import { getCountryCode } from "@/utils/flag";
import { Globe } from "lucide-react";

interface OriginFlagProps {
  origin: string | null | undefined;
  className?: string;
  size?: number;
}

export const OriginFlag: React.FC<OriginFlagProps> = ({ origin, className = "", size = 16 }) => {
  const code = getCountryCode(origin);

  if (!code) {
    return <Globe className={`text-coffee-secondary/40 flex-shrink-0 ${className}`} size={size} />;
  }

  // アスペクト比約 4:3 で描画
  const width = Math.round((size * 4) / 3);

  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={origin || "origin"}
      className={`object-cover rounded-[2px] border border-coffee-secondary/15 shadow-sm flex-shrink-0 ${className}`}
      style={{
        width: `${width}px`,
        height: `${size}px`,
      }}
      loading="lazy"
    />
  );
};
export default OriginFlag;
