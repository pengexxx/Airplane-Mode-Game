# Airplane Mode - 2D Top-Down Bullet-Hell Roguelike

A 2D top-down pixel-art bullet-hell roguelike in the style of *Enter the Gungeon*, where a player controls a meditating monk fighting distractions manifested as phone-holding zombies inside his mind.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your Phase 1 answers, the following technical and artistic decisions have been locked into the architectural blueprint:

- **Game Engine**: Phaser 3.88 with pixel art renderer (`pixelArt: true`) and Arcade Physics, running inside a lightweight React 19 wrapper with custom full-screen pixel canvas scaling.
- **Audio System**: Built-in procedural Web Audio API retro sound synthesizer providing zero-latency retro sound effects (page shot flutter, hit impacts, dodge roll whoosh, table flip crash, zombie eye-beams, meditation chime, room clear fanfare) with an in-game mute toggle.
- **Rendering & Resolution**: Internal virtual resolution of $480 \times 270$ (16:9 ratio) scaled cleanly with crisp nearest-neighbor integer scaling, dark cozy palette, and procedural pixel art designed to easily accept future custom sprite uploads.
- **Scope & Extensibility**: Modular architecture built around an extensible `RoomManager`, `EnemyRegistry`, and `WeaponSystem` designed to smoothly scale from Stages 1–3 in this build up to the planned 9 rooms and final boss.

---

### 1. Overview & Core Concept

- **The Story**: A guy throws his phone on his desk and closes his eyes to meditate. The player is a monk inside his mind fighting waves of digital distractions.
- **Core Loop**: Enter a locked room $\rightarrow$ dodge wavy eye-beam bullets and roll through bullet curtains $\rightarrow$ flip tables for temporary cover $\rightarrow$ blast phone zombies with flying book pages $\rightarrow$ manage motivation (health) and clip reloads $\rightarrow$ unlock doors to progress through Stages 1 (Bedroom), 2 (Closet), and 3 (Hallway).
- **Stakes & Feedback**: The top-right HUD features the meditating guy at his physical desk whose micro-animations reflect the monk's battle: twitching when hit, creeping a hand toward his phone at low motivation, glowing when maintaining a hitless kill streak, and grabbing the phone upon defeat.

---

### 2. User Experience & Visual Design

#### Key User Flows & Game States

```
┌─────────────────┐      Start       ┌────────────────────────────────┐
│  SPLASH SCREEN  │ ───────────────> │    ROOM 1: BEDROOM (STAGE 1)   │
│ Title, Story,   │                  │  3 Slow Walkers · 2 Tables     │
│ Controls, Best  │                  └──────────────┬─────────────────┘
└─────────────────┘                                 │
                                                    │ Door Unlocks
                                                    ▼
┌─────────────────┐      Restart     ┌────────────────────────────────┐
│  DEATH SCREEN   │ <─────────────── │     ROOM 2: CLOSET (STAGE 2)   │
│ "you opened     │   (Motivation 0) │  5 Walkers · 2 Sprinters       │
│  tiktok."       │                  └──────────────┬─────────────────┘
└─────────────────┘                                 │
         ▲                                          │ Door Unlocks
         │                                          ▼
         │ (Motivation 0)            ┌────────────────────────────────┐
         └────────────────────────── │    ROOM 3: HALLWAY (STAGE 3)   │
                                     │  6 Mixed Zombies · 1 Tank      │
                                     └──────────────┬─────────────────┘
                                                    │
                                                    │ All Clear
                                                    ▼
                                     ┌────────────────────────────────┐
                                     │     FLOOR 1 CLEARED SCREEN     │
                                     │ Score, Multiplier, Boss Tease  │
                                     └────────────────────────────────┘
```

#### Visual Identity & Palette
- **Palette**: Cozy deep midnight indigos (`#0F1423`, `#1E1F3B`), warm parchment paper (`#F5E6CA`, `#D8C3A5`), monk robe saffron/chestnut (`#C86D2C`, `#8B3A18`), eerie phone-screen cyan/wave rings (`#38BDF8`, `#818CF8`), table wood tones (`#5C3A21`, `#3E2717`).
- **Monk Character**: 16x16 pixel monk sprite with robe folds, bald head highlight, and directional facing toward mouse reticle. When rolling, he tucks into a spinning ball with ghosting trail particles.
- **Cover Tables**: Upright wooden tables that can be flipped with `E` toward the monk's facing direction. Flipped tables absorb 5 enemy bullets before splintering into wood debris.
- **Interactive Feedback**:
  - **Monk Hit**: Loses 1 motivation segment, triggers screen wobble, brief chromatic glitch ($\sim 0.5$s, never pausing the game), and guy at desk twitches with phone screen flare.
  - **Enemy Damaged**: Pure white flash (1 frame), fluttering paper particles floating outward, and knockback nudge.
  - **Enemy Defeated**: Small camera shake, burst of digitized notification pixel sparks and confetti particles, score pop-up text.

#### HUD & Desktop Meditation Companion
- **Top-Right Companion**: Desk view with lamp, wooden surface, phone, and meditating pixel character:
  - *Normal*: Gentle breathing bobbing animation.
  - *Monk Hit*: Jolt animation, phone screen flashes bright blue.
  - *Low Motivation ($\le 2$)*: Hand subtly creeps closer to the phone.
  - *Hitless Streak ($\ge 1.5\times$)*: Subtle serene golden pulse/aura radiating outward.
  - *Death*: Hand grips phone and screen illuminates his face.
- **Motivation Meter**: Directly below the desk companion, 6 distinct segment blocks labeled `"motivation"`.
- **Top-Center Score Banner**: Current Score (100 pts/kill, 1000 pts/room clear), active Streak Multiplier ($+0.1\times$ per hitless kill, max $5.0\times$, resets to $1.0\times$ on hit).
- **Weapon Display**: Bottom-center active page ammo counter showing remaining shots in clip (8 max), with circular reload progress indicator during the $\sim 1$s reload.

---

### 3. Key Product Decisions & Trade-Offs

- **Phaser 3.88 + React UI Hybrid**: Phaser canvas handles 60 FPS physics, camera follow, particles, bullet hell collision math, and tile rendering. React overlays manage the stylish retro splash screen, pause/audio toggles, and game over screens with pixel-perfect typography.
- **Procedural Pixel Texture Generation**: All sprites (Monk 8-directional frames, Walker, Sprinter, Tank Zombie, phone wave rings, table states, paper pages, meditating desk scene) are generated via an internal procedural Pixel Texture Factory onto Phaser textures. This guarantees instant loading, zero 404 network assets, crisp pixel art, and clean plug-and-play slots for user image uploads.
- **Procedural Web Audio Engine**: Uses browser `AudioContext` with custom synthesizers for white noise paper flutters, sine-wave eye beam rings, low-pass table slams, noise-filtered dodge dashes, and harmonic meditation bells. Includes a clean mute button.
- **Dodge Roll Invincibility**: True Enter the Gungeon roll mechanic: pressing `Space` initiates a directional dash with speed burst, disabling player collision layer against enemy bullets for 350ms, with a recovery cooldown.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              React Root                                │
│                     (App.tsx / CanvasContainer)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ mounts
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Phaser 3.88 Game Instance                       │
│  ┌─────────────────────────┐            ┌────────────────────────────┐ │
│  │      BootScene          │            │       GameScene            │ │
│  │  Generates Pixel        │ ─────────> │  • Player / Monk           │ │
│  │  Textures & Audio Nodes │            │  • RoomManager (1-3)       │ │
│  └─────────────────────────┘            │  • EnemyRegistry           │ │
│                                         │  • BulletHell System       │ │
│                                         │  • Table Cover Physics     │ │
│                                         │  • Particle Emitters       │ │
│                                         └─────────────┬──────────────┘ │
└───────────────────────────────────────────────────────┼────────────────┘
                                                        │ Event Bus
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             HUD & State                                │
│   • Motivation Segments (6)             • Streak Multiplier (1x-5x)    │
│   • Meditating Guy Micro-States         • Local High Score (Storage)   │
│   • Clip Ammo (8 Pages + Reload)        • Sound Synth Audio Controls   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Modular Entity Architecture
- `Player.ts`: Monk state machine (Idle, Walk, DodgeRoll, Hurt, Dead), clip management (8 shots), table interaction trigger.
- `Weapon.ts`: Book firing logic, page projectile physics with fluttering angle drift, reload timer.
- `CoverTable.ts`: Dual-state obstacle (unflipped floor block $\rightarrow$ flipped bullet shield with 5 HP durability).
- `Enemy.ts` & Subclasses:
  - `WalkerEnemy`: Standard phone zombie, moves toward monk, fires single eye-wave rings.
  - `SprinterEnemy`: Faster, lower HP, erratic flanking movement, fires twin waves.
  - `TankEnemy`: High HP, slow, periodic 8-bullet radial eye-beam ring.
- `RoomManager.ts`: State machine for Room 1 (Bedroom), Room 2 (Closet), and Room 3 (Hallway). Spawns barricaded doors that open only when enemies reach 0.
- `AudioManager.ts`: Web Audio API sound generator with mute toggle.

---

### Verification & Testing Plan

1. **Compilation**: Verify build using `compile_applet` and TypeScript checks.
2. **Controls Testing**:
   - WASD movement, mouse aim, left-click continuous/tap page shooting.
   - Space dodge roll invulnerability verification against active bullet rings.
   - 'E' key proximity detection to flip wooden tables into shields.
   - 'R' manual reload and automatic clip empty reload countdown.
3. **Stage Progression**:
   - Stage 1 Bedroom clearing and door transition.
   - Stage 2 Closet with sprinters and tighter corridors.
   - Stage 3 Hallway with tank zombie 8-bullet radial bursts.
   - Victory state ("Floor 1 Cleared") and death state ("You opened TikTok").
4. **HUD & Local Storage**:
   - Meditating guy animation states reacting to monk damage and streaks.
   - High score persistence across browser reloads.
