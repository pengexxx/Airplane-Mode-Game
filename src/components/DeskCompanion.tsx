import React, { useEffect, useState } from 'react';

interface DeskCompanionProps {
  motivation: number;
  maxMotivation: number;
  streakMultiplier: number;
  isHit: boolean;
  isGameOver: boolean;
  notificationBadge?: string;
}

export const DeskCompanion: React.FC<DeskCompanionProps> = ({
  motivation,
  maxMotivation,
  streakMultiplier,
  isHit,
  isGameOver,
  notificationBadge = '1',
}) => {
  const [twitch, setTwitch] = useState(false);

  useEffect(() => {
    if (isHit) {
      setTwitch(true);
      const timer = setTimeout(() => setTwitch(false), 450);
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  const isLowMotivation = motivation <= 2 && motivation > 0;
  const hasStreakAura = streakMultiplier >= 1.5 && !isGameOver;

  // Hand position toward phone:
  // Normal: folded at x=52, y=42
  // Low motivation: creeping closer at x=38, y=42
  // Game over: hand gripping phone at x=26, y=41
  let handX = 52;
  let handY = 42;
  if (isGameOver) {
    handX = 26;
    handY = 41;
  } else if (isLowMotivation) {
    handX = 38;
    handY = 42;
  }

  return (
    <div
      className="pointer-events-none select-none flex flex-col items-end gap-1"
      aria-label="meditation desk companion"
    >
      {/* Compact Desk Vignette Frame (116px x 70px) */}
      <div className="relative w-[116px] h-[70px] bg-[#0c101c]/90 border border-[#334155]/80 rounded-md overflow-hidden shadow-lg shadow-black/40">
        <svg
          viewBox="0 0 116 70"
          className="w-full h-full"
          shapeRendering="crispEdges"
        >
          <defs>
            {/* Lamp light cone */}
            <radialGradient id="lampGlow" cx="88" cy="18" r="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0C101C" stopOpacity="0" />
            </radialGradient>
            {/* Golden Serene Aura for high streaks */}
            <radialGradient id="sereneAura" cx="62" cy="30" r="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0C101C" stopOpacity="0" />
            </radialGradient>
            {/* Phone Screen Cyan Glare */}
            <radialGradient id="phoneGlow" cx="24" cy="40" r="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity={twitch || isGameOver ? '0.75' : '0.2'} />
              <stop offset="100%" stopColor="#0C101C" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Wall */}
          <rect x="0" y="0" width="116" height="46" fill="#13192B" />

          {/* Lamp Light Projection */}
          <path d="M 88 18 L 40 46 L 116 46 Z" fill="url(#lampGlow)" />

          {/* Golden Serene Aura when on streak */}
          {hasStreakAura && (
            <circle
              cx="62"
              cy="30"
              r="22"
              fill="url(#sereneAura)"
              className="animate-pulse"
            />
          )}

          {/* Wooden Desk Surface */}
          <rect x="0" y="46" width="116" height="24" fill="#58311B" />
          <line x1="0" y1="46" x2="116" y2="46" stroke="#784826" strokeWidth="1" />
          <line x1="0" y1="48" x2="116" y2="48" stroke="#3D2010" strokeWidth="1" />

          {/* Desk Lamp */}
          <path d="M 94 46 L 94 22 L 88 20" stroke="#94A3B8" strokeWidth="2" fill="none" />
          <polygon points="82,23 94,18 90,26" fill="#CBD5E1" />
          <circle cx="87" cy="23" r="2.5" fill="#FEF08A" />

          {/* Smartphone lying on desk */}
          <rect
            x="18"
            y="41"
            width="14"
            height="22"
            rx="1.5"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="0.8"
          />
          {/* Phone Screen */}
          <rect
            x="19.5"
            y="43"
            width="11"
            height="18"
            fill={twitch || isGameOver ? '#38BDF8' : '#1E293B'}
          />

          {/* Red Notification Badge (1, 3, 9, 99+) */}
          {!isGameOver && (
            <g>
              <circle
                cx={notificationBadge.length > 2 ? '30' : '29'}
                cy="41"
                r={notificationBadge.length > 2 ? '5.5' : '4.5'}
                fill="#EF4444"
                stroke="#0F172A"
                strokeWidth="0.8"
              />
              <text
                x={notificationBadge.length > 2 ? '30' : '29'}
                y="43.2"
                textAnchor="middle"
                fontSize={notificationBadge.length > 2 ? '5' : '6'}
                fontFamily="monospace"
                fontWeight="bold"
                fill="#FFFFFF"
              >
                {notificationBadge}
              </text>
            </g>
          )}

          {/* Cyan Glow effect when hit or game over */}
          {(twitch || isGameOver) && (
            <circle cx="25" cy="50" r="20" fill="url(#phoneGlow)" />
          )}

          {/* Meditating Character Group */}
          <g
            className={`transition-transform duration-200 ${
              twitch ? 'translate-x-[-1px] translate-y-[-2px]' : ''
            }`}
          >
            {/* Shoulders & Torso */}
            <path
              d="M 44 46 C 44 38, 52 35, 62 35 C 72 35, 80 38, 80 46 Z"
              fill="#334155"
            />

            {/* Breathing Head Animation */}
            <g className={!isGameOver ? 'animate-[bounce_3s_ease-in-out_infinite]' : ''}>
              {/* Head / Neck */}
              <rect x="58" y="32" width="8" height="4" fill="#F5D0A9" />
              <circle cx="62" cy="24" r="8" fill="#F5D0A9" />

              {/* Hair */}
              <path d="M 54 23 C 54 16, 62 15, 70 20 Z" fill="#1E293B" />

              {/* Closed Eyes vs Distracted Wide Eyes */}
              {!isGameOver ? (
                <>
                  <line x1="58" y1="24" x2="61" y2="24" stroke="#475569" strokeWidth="1" />
                  <line x1="63" y1="24" x2="66" y2="24" stroke="#475569" strokeWidth="1" />
                </>
              ) : (
                <>
                  <circle cx="59" cy="24" r="1.5" fill="#38BDF8" />
                  <circle cx="64" cy="24" r="1.5" fill="#38BDF8" />
                </>
              )}

              {/* Calm serene mouth */}
              <line x1="60" y1="28" x2="64" y2="28" stroke="#D8A47F" strokeWidth="0.8" />
            </g>

            {/* Arm & Hand */}
            <line
              x1="52"
              y1="40"
              x2={handX}
              y2={handY}
              stroke="#334155"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx={handX} cy={handY} r="2.5" fill="#F5D0A9" />
          </g>
        </svg>

        {/* Small Corner Badge indicating state */}
        <div className="absolute top-1 left-1.5 text-[8px] font-mono tracking-tight text-[#94a3b8] opacity-80 lowercase">
          {isGameOver ? 'distracted' : hasStreakAura ? 'focused' : 'meditating'}
        </div>
      </div>

      {/* Motivation Meter directly below desk frame */}
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 text-[8px] font-mono lowercase text-[#94a3b8] tracking-wider">
          <span>motivation</span>
          <span className="text-[#f97316] font-bold">
            {motivation}/{maxMotivation}
          </span>
        </div>

        {/* 6 Discrete Motivation Segments */}
        <div className="flex items-center gap-1 bg-[#0b0f19]/80 p-1 rounded border border-[#334155]/60">
          {Array.from({ length: maxMotivation }).map((_, i) => {
            const isFilled = i < motivation;
            const isCritical = motivation <= 2 && isFilled;
            return (
              <div
                key={i}
                className={`w-3.5 h-2 rounded-[1px] transition-all duration-200 border ${
                  isFilled
                    ? isCritical
                      ? 'bg-[#ef4444] border-[#f87171] shadow-[0_0_4px_#ef4444]'
                      : 'bg-[#f97316] border-[#fb923c] shadow-[0_0_3px_#ea580c]'
                    : 'bg-[#1e293b]/50 border-[#334155]/40'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
