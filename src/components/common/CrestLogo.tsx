import React from 'react';

interface CrestLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

const sizeStyles = {
  sm: {
    container: 'w-7 h-8',
    inner: 'w-5 h-5 text-[10px]',
    star: 'text-[8px] -right-0.5 -bottom-0.5',
  },
  md: {
    container: 'w-9 h-10',
    inner: 'w-6 h-6 text-xs',
    star: 'text-[9px] -right-0.5 bottom-0.5',
  },
  lg: {
    container: 'w-12 h-14',
    inner: 'w-8 h-8 text-sm',
    star: 'text-[11px] right-0 bottom-1',
  },
  xl: {
    container: 'w-16 h-18',
    inner: 'w-10 h-10 text-base',
    star: 'text-[13px] right-0.5 bottom-1.5',
  },
};

export const CrestLogo: React.FC<CrestLogoProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const styles = sizeStyles[size];

  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <div
        className={`relative grid place-items-center bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 shadow-md ${styles.container}`}
        style={{
          clipPath: 'polygon(50% 0%, 92% 15%, 88% 72%, 50% 100%, 12% 72%, 8% 15%)',
        }}
        aria-label="Meridian MMSU Institutional Crest"
      >
        {/* Inner border line */}
        <div
          className="absolute inset-[3px] border border-white/50 pointer-events-none"
          style={{
            clipPath: 'polygon(50% 0%, 92% 15%, 88% 72%, 50% 100%, 12% 72%, 8% 15%)',
          }}
        />
        {/* Circular inner ring with "M" */}
        <div
          className={`grid place-items-center border border-white/80 rounded-full text-white font-serif font-bold select-none ${styles.inner}`}
        >
          M
        </div>
        {/* Crest star accent */}
        <span className={`absolute text-emerald-200 select-none ${styles.star}`}>
          ✦
        </span>
      </div>

      {showLabel && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
            Meridian <span className="text-indigo-600">University</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Office of Student Financial Assistance
          </span>
        </div>
      )}
    </div>
  );
};
