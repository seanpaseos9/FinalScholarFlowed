import React, { useState, useEffect } from 'react';

interface ScholarFlowLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'transparent';
  showBorder?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
};

export const ScholarFlowLogo: React.FC<ScholarFlowLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'transparent',
  showBorder = false,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('scholarflow_custom_logo') || null;
    } catch {
      return null;
    }
  });
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Check if a persisted logo exists in Cloud Firestore or server branding
    fetch('/api/branding')
      .then((r) => r.json())
      .then((data) => {
        if (data?.logoBase64) {
          setCustomLogo(data.logoBase64);
          setImgError(false);
        }
      })
      .catch(() => {});
  }, []);

  const containerBg =
    variant === 'dark'
      ? 'bg-slate-900 border-slate-800'
      : variant === 'light'
      ? 'bg-white border-slate-200'
      : 'bg-transparent border-transparent';

  const logoSrc = customLogo && !imgError ? customLogo : '/scholarflow_LOGO.png';

  return (
    <div
      title="ScholarFlow"
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden ${
        showBorder ? 'border shadow-2xs' : ''
      } ${containerBg} ${sizeMap[size]} ${className}`}
    >
      <img
        src={logoSrc}
        alt="ScholarFlow Official Logo"
        referrerPolicy="no-referrer"
        onError={() => {
          if (customLogo && !imgError) {
            setImgError(true);
          }
        }}
        className="w-full h-full object-contain select-none"
      />
    </div>
  );
};

