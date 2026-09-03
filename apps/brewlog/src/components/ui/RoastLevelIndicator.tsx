import React from "react";
import { getRoastLabel as getSharedRoastLabel } from "@yahatapp/coffee-reference";

interface RoastLevelIndicatorProps {
  level: number;
  className?: string;
  showLabel?: boolean;
}

export const getRoastLabel = getSharedRoastLabel;

export const getRoastConfig = (level: number) => {
  const label = getRoastLabel(level);

  switch (level) {
    case 1:
      return {
        color: "#d4a373", // Cinnamon / Light Brown
        label,
        bg: "bg-[#d4a373]/10",
        border: "border-[#d4a373]/20",
        text: "text-[#a2663e]",
      };
    case 2:
      return {
        color: "#b5835a", // Medium Light Brown
        label,
        bg: "bg-[#b5835a]/10",
        border: "border-[#b5835a]/20",
        text: "text-[#8a5a36]",
      };
    case 3:
      return {
        color: "#9c6644", // Medium Brown
        label,
        bg: "bg-[#9c6644]/10",
        border: "border-[#9c6644]/20",
        text: "text-[#6f4e37]",
      };
    case 4:
      return {
        color: "#7f4f24", // Medium Dark Brown
        label,
        bg: "bg-[#7f4f24]/10",
        border: "border-[#7f4f24]/20",
        text: "text-[#583920]",
      };
    case 5:
      return {
        color: "#582f0e", // Deep Dark Brown
        label,
        bg: "bg-[#582f0e]/10",
        border: "border-[#582f0e]/20",
        text: "text-[#3d200a]",
      };
    default:
      return {
        color: "#a67b5b",
        label,
        bg: "bg-gray-100",
        border: "border-gray-200",
        text: "text-gray-500",
      };
  }
};

export const RoastLevelIndicator: React.FC<RoastLevelIndicatorProps> = ({
  level,
  className = "",
  showLabel = true,
}) => {
  const config = getRoastConfig(level);

  return (
    <div
      className={`inline-flex items-center ${showLabel ? "space-x-1.5 py-1 px-2.5" : "p-1.5"} rounded-full border ${config.bg} ${config.border} flex-shrink-0 transition-all duration-300 shadow-sm shadow-coffee-primary/2 hover:scale-[1.02] ${className}`}
      title={config.label}
      aria-label={`焙煎度: ${config.label}`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{
          backgroundColor: config.color,
          boxShadow: `0 1px 2px ${config.color}30, inset 0 -0.5px 1px rgba(0,0,0,0.15)`,
        }}
      />
      {showLabel && (
        <span className={`text-[10px] font-bold ${config.text} tracking-wider`} aria-hidden="true">
          {config.label}
        </span>
      )}
    </div>
  );
};

export default RoastLevelIndicator;
