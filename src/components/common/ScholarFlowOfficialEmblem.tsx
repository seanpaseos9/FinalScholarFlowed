import React from 'react';

interface ScholarFlowOfficialEmblemProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const pixelSizes = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

export const ScholarFlowOfficialEmblem: React.FC<ScholarFlowOfficialEmblemProps> = ({
  className = '',
  size = 'md',
}) => {
  const px = pixelSizes[size];

  return (
    <svg
      viewBox="0 0 500 500"
      width={px}
      height={px}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="ScholarFlow Official Emblem"
    >
      <defs>
        {/* Cap Top Gradients */}
        <linearGradient id="capTopGrad" x1="120" y1="110" x2="330" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#241B58" />
          <stop offset="35%" stopColor="#2D236E" />
          <stop offset="70%" stopColor="#20174F" />
          <stop offset="100%" stopColor="#150E3A" />
        </linearGradient>

        <linearGradient id="capEdgeGrad" x1="100" y1="210" x2="350" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3F328E" />
          <stop offset="50%" stopColor="#261E58" />
          <stop offset="100%" stopColor="#120B30" />
        </linearGradient>

        {/* Cap Skull Base Gradient */}
        <linearGradient id="capBaseGrad" x1="160" y1="200" x2="290" y2="280" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2D236B" />
          <stop offset="45%" stopColor="#392F82" />
          <stop offset="85%" stopColor="#1C1548" />
          <stop offset="100%" stopColor="#110A30" />
        </linearGradient>

        {/* Chrome Arrow Gradients */}
        <linearGradient id="arrowShaftGrad" x1="280" y1="310" x2="420" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="25%" stopColor="#6B7280" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="75%" stopColor="#F9FAFB" />
          <stop offset="90%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>

        <linearGradient id="arrowHeadLeft" x1="330" y1="170" x2="440" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D1D5DB" />
          <stop offset="40%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>

        <linearGradient id="arrowHeadRight" x1="430" y1="120" x2="450" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="50%" stopColor="#9CA3AF" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>

        {/* Scroll Gradients */}
        <linearGradient id="scrollPaper" x1="180" y1="230" x2="350" y2="390" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="scrollInnerRoll" x1="140" y1="280" x2="220" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E174E" />
          <stop offset="50%" stopColor="#281F66" />
          <stop offset="100%" stopColor="#120C33" />
        </linearGradient>

        <linearGradient id="chromeRim" x1="140" y1="290" x2="240" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>

        {/* Tassel Gradient */}
        <linearGradient id="tasselGrad" x1="90" y1="200" x2="120" y2="310" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#251B5C" />
          <stop offset="40%" stopColor="#382C80" />
          <stop offset="100%" stopColor="#130D35" />
        </linearGradient>

        {/* Drop Shadow */}
        <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="3" dy="8" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        {/* ============================================================== */}
        {/* 1. CHROME ASCENSION ARROW (Sweeping behind scroll, up to right) */}
        {/* ============================================================== */}
        {/* Arrow Shaft */}
        <path
          d="M 285 270 C 330 250 365 210 395 165 L 430 195 C 395 245 350 290 295 315 Z"
          fill="url(#arrowShaftGrad)"
        />
        {/* Arrow Head - 3D Facets */}
        <polygon points="435,105 365,160 405,170" fill="url(#arrowHeadLeft)" />
        <polygon points="435,105 405,170 445,200" fill="url(#arrowHeadRight)" />
        {/* Sharp Ridge Highlight */}
        <line x1="435" y1="105" x2="405" y2="170" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* ============================================================== */}
        {/* 2. GRADUATION MORTARBOARD CAP (Upper Left, 3D tilted)          */}
        {/* ============================================================== */}
        {/* Skull Cap Base Cylinder */}
        <path
          d="M 140 220 C 140 220 155 270 215 272 C 275 274 300 230 305 215 C 300 240 265 275 210 274 C 155 272 140 220 140 220 Z"
          fill="#0D0728"
        />
        <path
          d="M 145 220 C 145 220 160 262 215 264 C 270 265 295 228 300 215 C 295 238 265 260 215 260 C 165 260 145 220 145 220 Z"
          fill="url(#capBaseGrad)"
        />

        {/* Diamond Mortarboard Top */}
        <polygon
          points="215,115 355,142 225,278 72,228"
          fill="url(#capTopGrad)"
        />
        {/* Diamond Edge Bevel for 3D thickness */}
        <polygon
          points="72,228 225,278 227,284 72,233"
          fill="url(#capEdgeGrad)"
        />
        <polygon
          points="225,278 355,142 357,146 227,284"
          fill="#110A30"
        />

        {/* Cap Button on center top */}
        <ellipse cx="215" cy="188" rx="8" ry="6" fill="#18123E" />
        <ellipse cx="214" cy="187" rx="5" ry="4" fill="#3D3284" />

        {/* Tassel Cord & Hanging Fringe on Left */}
        <path
          d="M 215 188 Q 140 180 108 245"
          stroke="#1F174D"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 215 188 Q 140 180 108 245"
          stroke="#392E82"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel Ring & Bead */}
        <ellipse cx="107" cy="258" rx="7" ry="5.5" fill="#20174F" />
        <ellipse cx="106" cy="257" rx="5" ry="3.5" fill="#4B3D9E" />
        {/* Tassel Bell & Fringe strands */}
        <path
          d="M 102 263 C 100 285 96 305 95 312 C 105 315 115 314 120 308 C 117 300 113 280 112 263 Z"
          fill="url(#tasselGrad)"
        />

        {/* ============================================================== */}
        {/* 3. PARCHMENT DIPLOMA SCROLL (Center, with ScholarFlow text)    */}
        {/* ============================================================== */}
        {/* Scroll Body (Center curved sheet) */}
        <path
          d="M 180 305 L 310 238 C 335 225 358 248 350 270 L 265 410 C 235 425 210 405 180 305 Z"
          fill="url(#scrollPaper)"
        />

        {/* Left Double Roll / Curl */}
        {/* Outer Silver Rim */}
        <path
          d="M 185 305 C 160 280 140 310 145 340 C 150 370 180 380 205 365 C 225 350 225 330 210 320 C 195 310 178 322 180 338 C 182 350 195 355 203 348"
          stroke="url(#chromeRim)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Inner Roll Navy Core Fill */}
        <path
          d="M 185 307 C 163 285 145 312 149 339 C 153 366 179 375 202 362 C 220 348 220 332 208 323 C 196 314 182 324 183 336 Z"
          fill="url(#scrollInnerRoll)"
        />

        {/* Right Scroll Outer Roll */}
        <path
          d="M 350 270 C 375 285 390 320 395 345 C 398 365 385 380 365 385 C 345 390 310 385 270 410 C 265 413 260 410 262 405 C 295 380 335 375 350 370 C 370 365 375 350 372 338 C 368 320 355 295 335 285 Z"
          fill="url(#scrollInnerRoll)"
        />
        <path
          d="M 350 270 C 375 285 390 320 395 345 C 398 365 385 380 365 385 C 345 390 310 385 270 410"
          stroke="url(#chromeRim)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Typography on the Scroll */}
        <g transform="rotate(-23 250 315)">
          {/* Main Title */}
          <text
            x="200"
            y="300"
            fill="#1E174B"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="30"
            fontWeight="bold"
            letterSpacing="-0.5"
          >
            ScholarFlow
          </text>
          {/* Placeholder Line 1 */}
          <text
            x="202"
            y="322"
            fill="#334155"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="500"
          >
            [Student Name placeholder] -----
          </text>
          {/* Placeholder Line 2 */}
          <text
            x="202"
            y="337"
            fill="#475569"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="10"
            fontWeight="500"
          >
            [Date placeholder] ------------
          </text>
        </g>
      </g>
    </svg>
  );
};
