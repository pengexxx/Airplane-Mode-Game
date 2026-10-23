import React, { useState, useEffect } from 'react';
import { Play, HelpCircle, X, Check } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  bestScore: number;
  showTutorial: boolean;
  onToggleTutorial: (val: boolean) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  bestScore,
  showTutorial,
  onToggleTutorial,
}) => {
  const [showControlsModal, setShowControlsModal] = useState(false);

  // Listen for Enter or Space to start (when controls modal is closed)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showControlsModal) {
        if (e.code === 'Escape') {
          setShowControlsModal(false);
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, showControlsModal]);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#070a13]/92 px-4 py-6 font-mono text-[#f8fafc] select-none"
      role="dialog"
      aria-label="title screen"
    >
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-4">
        {/* Title emblem */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-wider text-[#f97316] drop-shadow-[0_2px_10px_rgba(249,115,22,0.4)] lowercase">
            airplane mode
          </div>
          <p className="text-xs text-[#94a3b8] tracking-widest lowercase">
            bullet-hell meditation roguelike
          </p>
        </div>

        {/* Narrative / Context */}
        <div className="bg-[#0f172a]/80 border border-[#334155]/60 rounded-md p-3 text-xs text-[#cbd5e1] leading-relaxed text-left lowercase shadow-inner">
          <p className="mb-1">
            you threw your phone on the desk and closed your eyes to meditate.
          </p>
          <p className="text-[#94a3b8]">
            deep inside your mind, phone zombies are attacking with wave beams. dodge roll through bullets, flip wooden tables, and blast distractions with sacred book pages.
          </p>
        </div>

        {/* Action Bar: Controls Modal Button + Show Tutorial Toggle */}
        <div className="w-full flex items-center justify-between px-1 text-xs lowercase">
          {/* Small controls button */}
          <button
            onClick={() => setShowControlsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-[#f8fafc] border border-[#334155]/60 transition-colors cursor-pointer"
            aria-label="view controls"
          >
            <HelpCircle size={13} />
            <span>controls</span>
          </button>

          {/* Show tutorial toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#94a3b8] hover:text-[#cbd5e1] transition-colors">
            <input
              type="checkbox"
              checked={showTutorial}
              onChange={(e) => onToggleTutorial(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                showTutorial
                  ? 'bg-[#f97316] border-[#ea580c] text-[#070a13]'
                  : 'bg-[#0f172a] border-[#334155]'
              }`}
            >
              {showTutorial && <Check size={12} strokeWidth={3} />}
            </div>
            <span>show tutorial</span>
          </label>
        </div>

        {/* Best Score */}
        {bestScore > 0 && (
          <div className="text-xs text-[#94a3b8] lowercase">
            best score: <span className="text-[#facc15] font-bold">{bestScore}</span>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={onStart}
          data-start="true"
          className="w-full py-3 bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-[#070a13] font-bold text-sm tracking-wider rounded-md flex items-center justify-center gap-2 shadow-lg shadow-[#ea580c]/30 cursor-pointer transition-all lowercase"
        >
          <Play size={16} fill="currentColor" />
          <span>start meditation</span>
        </button>

        <span className="text-[10px] text-[#64748b] lowercase">
          press space or enter to begin
        </span>
      </div>

      {/* Controls Modal Popover */}
      {showControlsModal && (
        <div
          className="fixed inset-0 z-40 bg-[#070a13]/85 flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-label="controls guide"
        >
          <div className="max-w-xs w-full bg-[#0c101d] border border-[#334155] rounded-lg p-5 shadow-2xl flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
              <span className="text-sm font-bold text-[#f97316] lowercase">controls</span>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-[#94a3b8] hover:text-[#f8fafc] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs lowercase">
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">wasd:</span>
                <span className="text-[#cbd5e1]">8-direction move</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">space:</span>
                <span className="text-[#cbd5e1]">dodge roll (invulnerable)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">mouse:</span>
                <span className="text-[#cbd5e1]">aim & shoot pages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">e:</span>
                <span className="text-[#cbd5e1]">flip table cover</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">r:</span>
                <span className="text-[#cbd5e1]">reload sacred pages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#f97316] font-bold">m / esc:</span>
                <span className="text-[#cbd5e1]">mute audio / pause</span>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="mt-2 w-full py-1.5 bg-[#1e293b] hover:bg-[#334155] text-xs font-bold rounded text-[#cbd5e1] lowercase cursor-pointer"
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
