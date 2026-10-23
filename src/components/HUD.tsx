import React from 'react';
import { Volume2, VolumeX, Pause } from 'lucide-react';
import { DeskCompanion } from './DeskCompanion.tsx';

interface HUDProps {
  score: number;
  multiplier: number;
  roomName: string;
  roomNumber: number;
  notificationBadge: string;
  motivation: number;
  maxMotivation: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  isRolling: boolean;
  canRoll: boolean;
  isHit: boolean;
  isGameOver: boolean;
  isWin?: boolean;
  isStreakPopping: boolean;
  showStreakLost: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  multiplier,
  roomName,
  notificationBadge,
  motivation,
  maxMotivation,
  ammo,
  maxAmmo,
  isReloading,
  reloadProgress,
  isRolling,
  canRoll,
  isWin = false,
  isHit,
  isGameOver,
  isStreakPopping,
  showStreakLost,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 font-mono">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Stage, Score, Streak & Utilities */}
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex items-center gap-2">
            <div className="bg-[#0b0f19]/90 border border-[#334155]/70 px-2.5 py-1 rounded text-xs lowercase text-[#f1f5f9] tracking-wider shadow-md">
              <span className="text-[#f97316] font-bold">room:</span> {roomName}
            </div>

            <div className="bg-[#0b0f19]/90 border border-[#334155]/70 px-3 py-1 rounded text-xs lowercase text-[#f1f5f9] flex items-center gap-2 shadow-md">
              <span className="text-[#94a3b8]">score:</span>
              <span className="font-bold text-[#f8fafc] tabular-nums">{score}</span>
              <span className="text-[#475569]">|</span>
              <span className="text-[#64748b]">streak:</span>
              <span
                className={`font-bold tabular-nums transition-all duration-200 inline-block ${
                  isStreakPopping
                    ? 'scale-130 text-[#38bdf8] drop-shadow-[0_0_8px_#38bdf8]'
                    : multiplier > 1.0
                    ? 'text-[#38bdf8]'
                    : 'text-[#94a3b8]'
                }`}
              >
                {multiplier.toFixed(1)}x
              </span>

              {/* "streak lost" flash indicator */}
              {showStreakLost && (
                <span className="text-[10px] text-[#ef4444] font-bold tracking-tight animate-bounce ml-1 lowercase">
                  streak lost!
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={onToggleMute}
              tabIndex={-1}
              aria-label={isMuted ? 'unmute audio' : 'mute audio'}
              className="p-1.5 rounded bg-[#0b0f19]/80 border border-[#334155]/60 hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={onPause}
              tabIndex={-1}
              aria-label="pause game"
              className="p-1.5 rounded bg-[#0b0f19]/80 border border-[#334155]/60 hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              <Pause size={14} />
            </button>
            <span className="text-[9px] text-[#64748b] lowercase hidden sm:inline">
              [m] mute · [esc] pause
            </span>
          </div>
        </div>

        {/* Top Center: Completely open for the north exit door passage */}
        <div className="hidden sm:block" />

        {/* Top-Right: Ultra-compact Desk Companion (< 116px x 70px) */}
        <div className="flex justify-end">
          <DeskCompanion
            motivation={motivation}
            maxMotivation={maxMotivation}
            streakMultiplier={multiplier}
            isHit={isHit}
            isGameOver={isGameOver}
            isWin={isWin}
            notificationBadge={notificationBadge}
          />
        </div>
      </div>

      {/* Bottom Center: Weapon Ammo Clip & Roll Status */}
      <div className="flex justify-center items-end w-full pb-1">
        <div className="bg-[#0b0f19]/90 border border-[#334155]/70 px-4 py-2 rounded-md shadow-lg flex items-center gap-4">
          {/* Ammo clip */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center justify-between w-full text-[9px] lowercase text-[#94a3b8]">
              <span>sacred pages</span>
              {ammo === 0 && !isReloading ? (
                <span className="text-[#ef4444] font-bold animate-pulse">[r] reload!</span>
              ) : (
                <span>[r] reload</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: maxAmmo }).map((_, i) => {
                const hasAmmo = i < ammo;
                return (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-[1px] transition-all border ${
                      hasAmmo
                        ? 'bg-[#fef3c7] border-[#fde68a] shadow-[0_0_2px_#fef3c7]'
                        : 'bg-[#1e293b]/40 border-[#334155]/30'
                    }`}
                  />
                );
              })}
            </div>

            {/* Circular or linear reload bar */}
            {isReloading && (
              <div className="w-full bg-[#1e293b] h-1 rounded overflow-hidden mt-0.5">
                <div
                  className="bg-[#38bdf8] h-full transition-all duration-75"
                  style={{ width: `${reloadProgress * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="h-7 w-[1px] bg-[#334155]/60" />

          {/* Roll Status Indicator */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] lowercase text-[#64748b]">[space]</span>
            <div
              className={`px-2 py-0.5 rounded text-[9px] lowercase font-bold border transition-colors ${
                isRolling
                  ? 'bg-[#f97316] text-[#0b0f19] border-[#fb923c]'
                  : canRoll
                  ? 'bg-[#1e293b] text-[#38bdf8] border-[#38bdf8]/50'
                  : 'bg-[#0f172a] text-[#475569] border-[#1e293b]'
              }`}
            >
              {isRolling ? 'rolling' : canRoll ? 'roll ready' : 'cooling'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
