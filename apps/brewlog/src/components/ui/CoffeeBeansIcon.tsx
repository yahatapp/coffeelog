import React from "react";

interface CoffeeBeansIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const CoffeeBeansIcon: React.FC<CoffeeBeansIconProps> = ({
  size = 24,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-shrink-0 ${className}`}
      {...props}
    >
      {/* A single, beautifully stylized coffee bean, tilted organically */}
      <g transform="rotate(-30 12 12)">
        {/* Elongated organic coffee bean outline */}
        <path d="M 12 3 C 8.1 3, 5 7, 5 12 C 5 17, 8.1 21, 12 21 C 15.9 21, 19 17, 19 12 C 19 7, 15.9 3, 12 3 Z" />
        {/* Characteristic organic S-curve crease */}
        <path d="M 12 5 C 9.5 9, 14.5 15, 12 19" />
      </g>
    </svg>
  );
};

export default CoffeeBeansIcon;
