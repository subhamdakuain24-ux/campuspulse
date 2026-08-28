import React from 'react';

interface CampusPulseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  pulseAnimated?: boolean;
  white?: boolean;
}

export const CampusPulseLogo: React.FC<CampusPulseLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
  pulseAnimated = false,
  white = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const primaryColor = white ? '#FFFFFF' : '#2563EB';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          {/* Mortarboard Diamond Top with integrated Pulse */}
          {/* Outer Cap Shape */}
          <path
            d="M50 8 L92 28 L50 48 L8 28 Z"
            stroke={primaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={white ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.05)'}
          />
          
          {/* Cap Lower Band with curve */}
          <path
            d="M26 38 C26 54, 74 54, 74 38"
            stroke={primaryColor}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right Tassel Hanging Down */}
          <path
            d="M78 30 L80 50 L77 50 L78 60 L83 60 L84 50 L81 50"
            stroke={primaryColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={primaryColor}
          />

          {/* Heartbeat Pulse line through the center */}
          <path
            d="M20 28 L35 28 L40 18 L46 36 L52 14 L58 32 L64 28 L80 28"
            stroke={primaryColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={pulseAnimated ? 'animate-pulse' : ''}
          />
        </svg>
      </div>

      {/* Text Label */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-bold tracking-tight font-['Plus_Jakarta_Sans',sans-serif] ${
              white ? 'text-white' : 'text-slate-900'
            } ${textSizes[size]}`}
          >
            Campus<span className={white ? 'text-blue-200' : 'text-blue-600'}>Pulse</span>
          </span>
          {subtitle && (
            <span
              className={`text-[11px] font-medium tracking-wide uppercase ${
                white ? 'text-blue-100/80' : 'text-slate-400'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
