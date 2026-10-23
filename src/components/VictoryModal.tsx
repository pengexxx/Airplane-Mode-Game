import React, { useEffect } from 'react';
import { Award, RotateCcw } from 'lucide-react';

interface VictoryModalProps {
  score: number;
  bestScore: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ score, bestScore, onRestart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
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
      aria-label="victory modal"
    >
      <div className="max-w-sm w-full bg-[#0c101d] border border-[#facc15]/60 rounded-lg p-6 shadow-2xl flex flex-col items-center text-center gap-4">
        {/* Victory title strictly lowercase */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-[#facc15]/20 border border-[#facc15]/40 flex items-center justify-center text-[#facc15] mb-1">
            <Award size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#facc15] lowercase tracking-wide">
            floor 1 cleared
          </div>
          <p className="text-xs text-[#94a3b8] lowercase">
            your mind is calm and untethered from the infinite scroll.
          </p>
        </div>

        {/* Stats card strictly lowercase */}
        <div className="w-full bg-[#070a13] border border-[#1e293b] rounded p-3 flex flex-col gap-2 lowercase text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8]">final score:</span>
            <span className="font-bold text-[#f8fafc] tabular-nums text-sm">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8]">best score:</span>
            <span className="font-bold text-[#facc15] tabular-nums text-sm">{bestScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#94a3b8]">status:</span>
            <span className="font-bold text-[#4ade80]">zen master</span>
          </div>
        </div>

        {/* Play Again CTA */}
        <button
          onClick={onRestart}
          data-start="true"
          className="w-full py-2.5 bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-[#070a13] font-bold text-xs tracking-wider rounded flex items-center justify-center gap-2 shadow-lg shadow-[#ea580c]/25 cursor-pointer transition-all lowercase"
        >
          <RotateCcw size={14} />
          <span>play again</span>
        </button>

        <span className="text-[10px] text-[#64748b] lowercase">
          press space or enter to meditate again
        </span>
      </div>
    </div>
  );
};
