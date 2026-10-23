import React, { useEffect, useState } from 'react';

interface DeskCompanionProps {
  motivation: number;
  maxMotivation: number;
  streakMultiplier: number;
  isHit: boolean;
  isGameOver: boolean;
  isWin?: boolean;
  notificationBadge?: string;
}

// Hand-made frames of the meditating guy (public/sprites)
const FRAMES = {
  calm: 'sprites/desk_calm.png',
  hit: 'sprites/desk_hit.png',
  reaching: 'sprites/desk_reaching.png',
  dead: 'sprites/desk_dead.png',
  win: 'sprites/desk_win.png',
};

export const DeskCompanion: React.FC<DeskCompanionProps> = ({
  motivation,
  maxMotivation,
  streakMultiplier,
  isHit,
  isGameOver,
  isWin = false,
  notificationBadge = '1',
}) => {
  const [twitch, setTwitch] = useState(false);

  useEffect(() => {
    if (isHit) {
      setTwitch(true);
      const timer = setTimeout(() => setTwitch(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  const isLowMotivation = motivation <= 2 && motivation > 0;
  const hasStreakAura = streakMultiplier >= 1.5 && !isGameOver && !isWin;

  // Priority: win > death > hit > low motivation > calm
  const frame = isWin
    ? FRAMES.win
    : isGameOver
      ? FRAMES.dead
      : twitch
        ? FRAMES.hit
        : isLowMotivation
          ? FRAMES.reaching
          : FRAMES.calm;

  const label = isWin ? 'airplane mode' : isGameOver ? 'distracted' : hasStreakAura ? 'focused' : 'meditating';

  return (
    <div
      className="pointer-events-none select-none flex flex-col items-end gap-1"
      aria-label="meditation desk companion"
    >
      {/* Desk vignette */}
      <div
        className={`relative w-[92px] h-[96px] bg-[#0c101c]/90 border rounded-md overflow-hidden shadow-lg shadow-black/40 transition-shadow duration-300 ${
          hasStreakAura
            ? 'border-[#f59e0b]/80 shadow-[0_0_14px_#f59e0b88]'
            : 'border-[#334155]/80'
        }`}
      >
        <img
          src={frame}
          alt=""
          draggable={false}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[84px] w-auto ${
            twitch ? 'animate-[wiggle_0.12s_linear_3]' : ''
          }`}
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Phone notification badge: climbs each room */}
        {!isWin && (
          <div className="absolute top-[38px] right-[6px] min-w-[13px] h-[13px] px-[3px] rounded-full bg-[#ef4444] text-white text-[8px] leading-[13px] font-bold font-mono text-center shadow-[0_0_4px_#ef4444]">
            {notificationBadge}
          </div>
        )}

        <div className="absolute top-1 left-1.5 text-[8px] font-mono tracking-tight text-[#94a3b8] opacity-80 lowercase">
          {label}
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
