import React, { useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#070a13]/85 px-4 py-6 font-mono text-[#f8fafc] select-none"
      role="dialog"
      aria-label="pause modal"
    >
      <div className="max-w-xs w-full bg-[#0c101d] border border-[#334155]/80 rounded-lg p-5 shadow-2xl flex flex-col items-center text-center gap-4">
        <div className="text-xl font-bold text-[#f97316] lowercase tracking-wider">
          meditation paused
        </div>

        <div className="flex flex-col gap-2 w-full text-xs lowercase">
          <button
            onClick={onResume}
            className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] text-[#070a13] font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Play size={14} fill="currentColor" />
            <span>resume</span>
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2 bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] font-bold rounded flex items-center justify-center gap-1.5 border border-[#475569]/40 cursor-pointer transition-colors"
          >
            <RotateCcw size={14} />
            <span>restart run</span>
          </button>
        </div>

        <span className="text-[10px] text-[#64748b] lowercase">
          press esc or p to resume
        </span>
      </div>
    </div>
  );
};
