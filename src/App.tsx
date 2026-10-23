/**
 * Airplane Mode - 2D Bullet-Hell Meditation Roguelike
 * Phaser 3.88 + React 19 Shell
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from './game/GameScene.ts';
import { soundEngine } from './game/audio.ts';
import { checkIsNewBest } from './game/rules.ts';
import { HUD } from './components/HUD.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  // High score and best progress from local storage
  const [bestScore, setBestScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airplane_mode_best_score');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [bestRoom, setBestRoom] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airplane_mode_best_room');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [bestStreak, setBestStreak] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airplane_mode_best_streak');
      return saved ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });

  // Tutorial run toggle: first run defaults to true, subsequently starts in Bedroom unless toggled
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('airplane_mode_show_tutorial');
      if (saved !== null) return saved === 'true';
      const hasPlayed = localStorage.getItem('airplane_mode_has_played');
      return !hasPlayed;
    }
    return true;
  });

  // Game UI State
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [motivation, setMotivation] = useState(6);
  const [maxMotivation, setMaxMotivation] = useState(6);
  const [ammo, setAmmo] = useState(8);
  const [maxAmmo, setMaxAmmo] = useState(8);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [canRoll, setCanRoll] = useState(true);
  const [roomName, setRoomName] = useState("mind's entry");
  const [roomNumber, setRoomNumber] = useState(1);
  const [notificationBadge, setNotificationBadge] = useState('1');
  const [isHitReaction, setIsHitReaction] = useState(false);
  const [isStreakPopping, setIsStreakPopping] = useState(false);
  const [showStreakLost, setShowStreakLost] = useState(false);
  const [isMonkPickingUpPhone, setIsMonkPickingUpPhone] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.getMuted());

  // Update document body dataset for ultra-mode verification
  useEffect(() => {
    const stateAttr = gameState === 'victory' ? 'gameover' : gameState;
    document.body.dataset.state = stateAttr;
  }, [gameState]);

  // Focus the game canvas so WASD and keys are immediately captured without clicking
  const focusCanvas = useCallback(() => {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const canvas = mountRef.current?.querySelector('canvas') || document.querySelector('canvas');
        if (canvas) {
          canvas.tabIndex = 0;
          canvas.focus();
        }
      }, 30);
    }
  }, []);

  // Handle tutorial toggle change and save to localStorage
  const handleToggleTutorial = useCallback((val: boolean) => {
    setShowTutorial(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('airplane_mode_show_tutorial', String(val));
    }
  }, []);

  // Update best records
  const updateBestStats = useCallback((finalScore: number, finalRoom: number, finalStreak: number) => {
    const newBestDetected = checkIsNewBest(
      finalScore,
      bestScore,
      finalRoom,
      bestRoom,
      finalStreak,
      bestStreak
    );
    setIsNewBest(newBestDetected);

    const nextScore = Math.max(bestScore, finalScore);
    const nextRoom = Math.max(bestRoom, finalRoom);
    const nextStreak = Math.max(bestStreak, finalStreak);

    setBestScore(nextScore);
    setBestRoom(nextRoom);
    setBestStreak(nextStreak);

    if (typeof window !== 'undefined') {
      localStorage.setItem('airplane_mode_best_score', String(nextScore));
      localStorage.setItem('airplane_mode_best_room', String(nextRoom));
      localStorage.setItem('airplane_mode_best_streak', String(nextStreak.toFixed(1)));
      localStorage.setItem('airplane_mode_has_played', 'true');
    }
  }, [bestScore, bestRoom, bestStreak]);

  // Latest values for the game callbacks. Kept in refs so the Phaser game is created ONCE
  // and never torn down when React state (score, multiplier, best stats) changes.
  const showTutorialRef = useRef(showTutorial);
  const updateBestStatsRef = useRef(updateBestStats);
  const multiplierRef = useRef(multiplier);
  showTutorialRef.current = showTutorial;
  updateBestStatsRef.current = updateBestStats;
  multiplierRef.current = multiplier;

  // Initialize Phaser Game instance (once)
  useEffect(() => {
    if (!mountRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: mountRef.current,
      width: 480,
      height: 270,
      pixelArt: true,
      backgroundColor: '#0F1423',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen for scene ready to wire callbacks
    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      sceneRef.current = scene;

      scene.init({
        startRoomIndex: showTutorialRef.current ? 0 : 1,
        callbacks: {
          onScoreUpdate: (s, m, isStreakIncrease) => {
            setScore(s);
            setMultiplier(m);
            if (isStreakIncrease) {
              setIsStreakPopping(true);
              setTimeout(() => setIsStreakPopping(false), 220);
            }
          },
          onMotivationUpdate: (mot, max) => {
            setMotivation(mot);
            setMaxMotivation(max);
          },
          onAmmoUpdate: (a, max, reloading, prog) => {
            setAmmo(a);
            setMaxAmmo(max);
            setIsReloading(reloading);
            setReloadProgress(prog);
          },
          onRollStateUpdate: (rolling, ready) => {
            setIsRolling(rolling);
            setCanRoll(ready);
          },
          onRoomChange: (num, name, badge) => {
            setRoomNumber(num + 1);
            setRoomName(name);
            setNotificationBadge(badge);
          },
          onMonkDefeatedPreScreen: () => {
            // First show meditating guy reaching for and gripping his phone
            setIsMonkPickingUpPhone(true);
          },
          onGameOver: (finalScore, roomReached, finalStreak) => {
            updateBestStatsRef.current(finalScore, roomReached, finalStreak);
            setGameState('gameover');
          },
          onVictory: (finalScore) => {
            updateBestStatsRef.current(finalScore, 4, multiplierRef.current);
            setGameState('victory');
          },
          onMonkHitReaction: () => {
            setIsHitReaction(true);
            setShowStreakLost(true);
            setTimeout(() => setIsHitReaction(false), 450);
            setTimeout(() => setShowStreakLost(false), 1200);
          },
        },
      });
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start game from title
  const handleStartGame = () => {
    setGameState('playing');
    setIsMonkPickingUpPhone(false);
    setIsNewBest(false);
    soundEngine.playChime();
    focusCanvas();

    if (sceneRef.current) {
      sceneRef.current.setGameActive(true);
      const startRoom = showTutorial ? 0 : 1;
      sceneRef.current.restartGame(startRoom);
    }
  };

  // Full reset run (from death screen AND pause menu)
  const handleRestartGame = () => {
    if (gameState === 'paused') {
      gameRef.current?.scene.resume('GameScene');
    }
    setGameState('playing');
    setIsMonkPickingUpPhone(false);
    setIsNewBest(false);
    setScore(0);
    setMultiplier(1.0);
    setMotivation(6);
    setAmmo(8);
    setIsReloading(false);
    setReloadProgress(0);
    setIsRolling(false);
    setCanRoll(true);
    soundEngine.playChime();
    focusCanvas();

    if (sceneRef.current) {
      sceneRef.current.setGameActive(true);
      const startRoom = showTutorial ? 0 : 1;
      sceneRef.current.restartGame(startRoom);
    }
  };

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Pause / Resume
  const handlePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
      gameRef.current?.scene.pause('GameScene');
    }
  }, [gameState]);

  const handleResume = useCallback(() => {
    if (gameState === 'paused') {
      setGameState('playing');
      gameRef.current?.scene.resume('GameScene');
      focusCanvas();
    }
  }, [gameState, focusCanvas]);

  // Window key listeners for Mute and Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, handleToggleMute, handlePause, handleResume]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#070a13] flex items-center justify-center select-none font-mono"
      onClick={focusCanvas}
    >
      {/* Phaser Canvas Container */}
      <div
        ref={mountRef}
        data-testid="phaser-container"
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair outline-none"
        style={{ imageRendering: 'pixelated' }}
        tabIndex={0}
      />

      {/* In-Game HUD: shown during playing, paused, or game over */}
      {gameState !== 'title' && (
        <HUD
          score={score}
          multiplier={multiplier}
          roomName={roomName}
          roomNumber={roomNumber}
          notificationBadge={notificationBadge}
          motivation={motivation}
          maxMotivation={maxMotivation}
          ammo={ammo}
          maxAmmo={maxAmmo}
          isReloading={isReloading}
          reloadProgress={reloadProgress}
          isRolling={isRolling}
          canRoll={canRoll}
          isHit={isHitReaction}
          isGameOver={gameState === 'gameover' || isMonkPickingUpPhone}
          isWin={gameState === 'victory'}
          isStreakPopping={isStreakPopping}
          showStreakLost={showStreakLost}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {/* Screen Modals */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          bestScore={bestScore}
          showTutorial={showTutorial}
          onToggleTutorial={handleToggleTutorial}
        />
      )}

      {gameState === 'paused' && (
        <PauseModal onResume={handleResume} onRestart={handleRestartGame} />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          score={score}
          bestScore={bestScore}
          roomReached={roomNumber}
          bestRoom={bestRoom}
          bestStreak={bestStreak}
          isNewBest={isNewBest}
          onRestart={handleRestartGame}
        />
      )}

      {gameState === 'victory' && (
        <VictoryModal
          score={score}
          bestScore={bestScore}
          onRestart={handleRestartGame}
        />
      )}
    </div>
  );
}
