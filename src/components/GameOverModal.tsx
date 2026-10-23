import React, { useEffect } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  bestScore: number;
  roomReached: number;
  bestRoom: number;
  bestStreak: number;
  isNewBest: boolean;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  bestScore,
  roomReached,
  bestRoom,
  bestStreak,
  isNewBest,
  onRestart,
}) => {
  // Listen for R, Enter, or Space to restart with one key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' || e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#070a13]/90 px-4 py-6 font-mono text-[#f8fafc] select-none"
      role="dialog"
      aria-label="game over modal"
    >
      <div className="max-w-sm w-full bg-[#0c101d] border border-[#ef4444]/60 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* New Best Banner if a record was broken */}
        {isNewBest && (
          <div className="w-full bg-[#f59e0b]/20 border border-[#f59e0b]/50 px-3 py-1 rounded text-xs text-[#fde047] font-bold flex items-center justify-center gap-1.5 shadow-sm lowercase">
            <Sparkles size={13} className="text-[#facc15]" />
            <span>new best!</span>
          </div>
        )}

        {/* End screen title strictly lowercase */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#ef4444] lowercase tracking-wide">
            you opened tiktok.
          </div>
          <p className="text-xs text-[#94a3b8] lowercase">
            the notifications overwhelmed your mindfulness.
          </p>
        </div>

        {/* Progress vs Best */}
        <div className="w-full bg-[#070a13] border border-[#1e293b] rounded p-3 flex flex-col gap-2 lowercase text-xs">
          <div className="flex justify-between items-center text-[#94a3b8]">
            <span>progress:</span>
            <span className="font-bold text-[#38bdf8] tabular-nums">
              room {roomReached} of 4
            </span>
          </div>

          <div className="flex justify-between items-center text-[#94a3b8]">
            <span>best room:</span>
            <span className="font-bold text-[#facc15] tabular-nums">
              room {Math.max(roomReached, bestRoom)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#94a3b8]">
            <span>best streak:</span>
            <span className="font-bold text-[#facc15] tabular-nums">
              {bestStreak.toFixed(1)}x
            </span>
          </div>

          <div className="h-[1px] bg-[#1e293b] my-0.5" />

          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8]">final score:</span>
            <span className="font-bold text-[#f8fafc] tabular-nums text-sm">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8]">best score:</span>
            <span className="font-bold text-[#facc15] tabular-nums text-sm">{bestScore}</span>
          </div>
        </div>

        {/* Restart CTA */}
        <button
          onClick={onRestart}
          data-start="true"
          className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-[#070a13] font-bold text-xs tracking-wider rounded flex items-center justify-center gap-2 shadow-lg shadow-[#ea580c]/25 cursor-pointer transition-all lowercase"
        >
          <RotateCcw size={14} />
          <span>restart</span>
        </button>

        <span className="text-[10px] text-[#64748b] lowercase">
          press r or enter to restart
        </span>
      </div>
    </div>
  );
};
