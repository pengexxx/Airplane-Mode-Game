/**
 * Procedural Pixel Art Texture Generator for Airplane Mode.
 * Generates crisp 16-bit retro pixel textures dynamically onto Phaser's Texture Manager.
 */

import Phaser from 'phaser';

export function createPixelTextures(scene: Phaser.Scene) {
  const textures = scene.textures;

  // Helper to draw pixel array [rows of hex strings or null]
  const createFromGrid = (
    key: string,
    width: number,
    height: number,
    pixelMap: (string | null)[][],
    scale: number = 1
  ) => {
    if (textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < pixelMap.length; y++) {
      const row = pixelMap[y];
      for (let x = 0; x < row.length; x++) {
        const color = row[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    textures.addCanvas(key, canvas);
  };

  // Color Palette Constants
  const SKIN = '#F5D0A9';
  const SKIN_SHADOW = '#D8A47F';
  const MONK_ORANGE = '#EA580C';
  const MONK_DARK_ORANGE = '#C2410C';
  const MONK_SAFFRON = '#F97316';
  const HIGHLIGHT = '#FFFFFF';
  const EYE = '#1E1B4B';
  const HOODIE_GREY = '#475569';
  const HOODIE_DARK = '#334155';
  const ZOMBIE_SKIN = '#94A3B8';
  const PHONE_CYAN = '#38BDF8';
  const PHONE_BEZEL = '#0F172A';
  const PHONE_WAVE = '#818CF8';
  const WOOD_LIGHT = '#9A6B41';
  const WOOD_MID = '#784826';
  const WOOD_DARK = '#4E2C17';
  const PARCHMENT = '#FEF3C7';
  const INK = '#78350F';
  const GOLD = '#FBBF24';
  const GOLD_LIGHT = '#FEF08A';

  // 1. Monk Idle (16x16)
  // Meditating / standing monk with saffron robe, prayer beads, calm head
  const monkIdleMap: (string | null)[][] = [
    [null, null, null, null, null, SKIN, SKIN, SKIN, SKIN, null, null, null, null, null, null, null],
    [null, null, null, null, SKIN, HIGHLIGHT, SKIN, SKIN, SKIN, SKIN, null, null, null, null, null, null],
    [null, null, null, null, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, null, null, null, null, null, null],
    [null, null, null, null, SKIN, EYE, SKIN, SKIN, EYE, SKIN, null, null, null, null, null, null],
    [null, null, null, null, SKIN_SHADOW, SKIN, SKIN, SKIN, SKIN, SKIN_SHADOW, null, null, null, null, null, null],
    [null, null, null, MONK_SAFFRON, MONK_ORANGE, MONK_SAFFRON, MONK_SAFFRON, MONK_SAFFRON, MONK_ORANGE, MONK_SAFFRON, null, null, null, null, null, null],
    [null, null, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, SKIN, SKIN, SKIN, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, null, null, null, null, null],
    [null, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, SKIN, SKIN, SKIN, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, null, null, null, null],
    [null, MONK_SAFFRON, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_SAFFRON, null, null, null, null],
    [null, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, null, null, null, null],
    [null, null, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, null, null, null, null, null],
    [null, null, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, null, null, null, null, null],
    [null, null, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, null, null, null, null, null],
    [null, null, null, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, null, null, null, null, null, null],
    [null, null, null, SKIN_SHADOW, SKIN_SHADOW, null, null, null, SKIN_SHADOW, SKIN_SHADOW, null, null, null, null, null, null],
    [null, null, null, WOOD_DARK, WOOD_DARK, null, null, null, WOOD_DARK, WOOD_DARK, null, null, null, null, null, null],
  ];
  createFromGrid('monk_idle', 16, 16, monkIdleMap);

  // 2. Monk Roll (14x14) - Spinning sphere/ball with robe trails
  const monkRollMap: (string | null)[][] = [
    [null, null, null, MONK_ORANGE, MONK_SAFFRON, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, null, null, null, null],
    [null, null, MONK_ORANGE, MONK_SAFFRON, HIGHLIGHT, SKIN, SKIN, MONK_SAFFRON, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, null, null, null],
    [null, MONK_ORANGE, MONK_SAFFRON, SKIN, SKIN, SKIN, SKIN, SKIN, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, null, null],
    [MONK_ORANGE, MONK_SAFFRON, SKIN, SKIN, EYE, SKIN, EYE, SKIN, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, null],
    [MONK_SAFFRON, MONK_ORANGE, SKIN, SKIN, SKIN, SKIN, SKIN, SKIN, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_SAFFRON, null],
    [MONK_SAFFRON, MONK_DARK_ORANGE, MONK_ORANGE, SKIN, SKIN, SKIN, MONK_DARK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_SAFFRON, null],
    [MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, null],
    [MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_SAFFRON, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, null],
    [null, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, null, null],
    [null, null, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, null, null, null],
    [null, null, null, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_ORANGE, MONK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, MONK_DARK_ORANGE, null, null, null, null],
  ];
  createFromGrid('monk_roll', 14, 11, monkRollMap);

  // 3. Page Projectile (10x8) - Sacred flying parchment page
  const pageMap: (string | null)[][] = [
    [PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, null],
    [PARCHMENT, INK, INK, INK, PARCHMENT, INK, INK, INK, PARCHMENT, PARCHMENT],
    [PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT],
    [PARCHMENT, INK, INK, PARCHMENT, INK, INK, INK, PARCHMENT, PARCHMENT, PARCHMENT],
    [PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT],
    [PARCHMENT, INK, INK, INK, INK, PARCHMENT, INK, INK, PARCHMENT, null],
    [null, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, PARCHMENT, null, null],
  ];
  createFromGrid('page_projectile', 10, 7, pageMap);

  // 4. Walker Enemy (16x18) - Slouching zombie staring into glowing cyan phone
  const walkerMap: (string | null)[][] = [
    [null, null, null, HOODIE_DARK, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null, null, null],
    [null, null, HOODIE_DARK, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null, null],
    [null, null, HOODIE_DARK, HOODIE_GREY, ZOMBIE_SKIN, ZOMBIE_SKIN, ZOMBIE_SKIN, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null, null],
    [null, null, HOODIE_DARK, ZOMBIE_SKIN, PHONE_CYAN, ZOMBIE_SKIN, PHONE_CYAN, ZOMBIE_SKIN, HOODIE_DARK, null, null, null, null, null, null, null], // Eye reflection
    [null, null, null, HOODIE_DARK, ZOMBIE_SKIN, ZOMBIE_SKIN, ZOMBIE_SKIN, HOODIE_DARK, null, null, null, null, null, null, null, null],
    [null, null, HOODIE_DARK, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null, null],
    [null, HOODIE_DARK, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null],
    [null, HOODIE_DARK, HOODIE_GREY, ZOMBIE_SKIN, PHONE_BEZEL, PHONE_CYAN, PHONE_CYAN, PHONE_BEZEL, ZOMBIE_SKIN, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null],
    [null, HOODIE_DARK, HOODIE_GREY, ZOMBIE_SKIN, PHONE_BEZEL, HIGHLIGHT, PHONE_CYAN, PHONE_BEZEL, ZOMBIE_SKIN, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null],
    [null, null, HOODIE_DARK, HOODIE_GREY, HOODIE_DARK, PHONE_BEZEL, PHONE_BEZEL, HOODIE_DARK, HOODIE_GREY, HOODIE_DARK, null, null, null, null, null, null],
    [null, null, null, HOODIE_DARK, HOODIE_DARK, HOODIE_DARK, HOODIE_DARK, HOODIE_DARK, HOODIE_DARK, null, null, null, null, null, null, null],
    [null, null, null, HOODIE_DARK, HOODIE_DARK, null, null, HOODIE_DARK, HOODIE_DARK, null, null, null, null, null, null, null],
    [null, null, null, '#1E293B', '#1E293B', null, null, '#1E293B', '#1E293B', null, null, null, null, null, null, null],
    [null, null, null, '#0F172A', '#0F172A', null, null, '#0F172A', '#0F172A', null, null, null, null, null, null, null],
  ];
  createFromGrid('walker', 16, 14, walkerMap);

  // 5. Sprinter Enemy (14x16) - Lean, electric purple-hooded glitching runner
  const sprinterMap: (string | null)[][] = [
    [null, null, null, '#6B21A8', '#9333EA', '#9333EA', '#6B21A8', null, null, null, null, null, null, null],
    [null, null, '#6B21A8', '#A855F7', '#C084FC', '#C084FC', '#A855F7', '#6B21A8', null, null, null, null, null, null],
    [null, null, '#6B21A8', ZOMBIE_SKIN, '#EC4899', ZOMBIE_SKIN, '#EC4899', '#6B21A8', null, null, null, null, null, null],
    [null, null, '#6B21A8', '#9333EA', '#9333EA', '#9333EA', '#9333EA', '#6B21A8', null, null, null, null, null, null],
    [null, '#6B21A8', '#A855F7', '#A855F7', '#A855F7', '#A855F7', '#A855F7', '#A855F7', '#6B21A8', null, null, null, null, null],
    [null, '#6B21A8', ZOMBIE_SKIN, '#0F172A', '#EC4899', '#F472B6', '#0F172A', ZOMBIE_SKIN, '#6B21A8', null, null, null, null, null],
    [null, null, '#6B21A8', '#9333EA', '#0F172A', '#0F172A', '#9333EA', '#6B21A8', null, null, null, null, null, null],
    [null, null, null, '#581C87', '#581C87', '#581C87', '#581C87', null, null, null, null, null, null, null],
    [null, null, null, '#3B0764', '#3B0764', null, '#3B0764', '#3B0764', null, null, null, null, null, null],
    [null, null, null, '#1E1B4B', '#1E1B4B', null, null, '#1E1B4B', '#1E1B4B', null, null, null, null, null],
  ];
  createFromGrid('sprinter', 14, 10, sprinterMap);

  // 6. Tank Enemy (24x22) - Massive heavy brick zombie with dual screens
  const tankMap: (string | null)[][] = [
    [null, null, null, null, '#1E293B', '#334155', '#475569', '#475569', '#475569', '#475569', '#334155', '#1E293B', null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, '#1E293B', '#475569', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#475569', '#1E293B', null, null, null, null, null, null, null, null, null, null, null],
    [null, null, '#1E293B', '#475569', ZOMBIE_SKIN, PHONE_CYAN, PHONE_CYAN, ZOMBIE_SKIN, ZOMBIE_SKIN, PHONE_CYAN, PHONE_CYAN, ZOMBIE_SKIN, '#475569', '#1E293B', null, null, null, null, null, null, null, null, null, null],
    [null, null, '#1E293B', '#475569', ZOMBIE_SKIN, PHONE_CYAN, HIGHLIGHT, ZOMBIE_SKIN, ZOMBIE_SKIN, PHONE_CYAN, HIGHLIGHT, ZOMBIE_SKIN, '#475569', '#1E293B', null, null, null, null, null, null, null, null, null, null],
    [null, '#1E293B', '#334155', '#475569', '#475569', '#475569', '#475569', '#475569', '#475569', '#475569', '#475569', '#475569', '#475569', '#334155', '#1E293B', null, null, null, null, null, null, null, null, null],
    ['#1E293B', '#334155', '#475569', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#64748B', '#475569', '#334155', '#1E293B', null, null, null, null, null, null, null, null],
    ['#1E293B', '#475569', ZOMBIE_SKIN, PHONE_BEZEL, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_BEZEL, PHONE_BEZEL, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_BEZEL, ZOMBIE_SKIN, '#475569', '#1E293B', null, null, null, null, null, null, null, null],
    ['#1E293B', '#475569', ZOMBIE_SKIN, PHONE_BEZEL, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, PHONE_BEZEL, PHONE_BEZEL, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, PHONE_BEZEL, ZOMBIE_SKIN, '#475569', '#1E293B', null, null, null, null, null, null, null, null],
    ['#1E293B', '#475569', ZOMBIE_SKIN, PHONE_BEZEL, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_BEZEL, PHONE_BEZEL, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_BEZEL, ZOMBIE_SKIN, '#475569', '#1E293B', null, null, null, null, null, null, null, null],
    [null, '#1E293B', '#334155', '#475569', '#334155', PHONE_BEZEL, PHONE_BEZEL, '#334155', '#334155', PHONE_BEZEL, PHONE_BEZEL, '#334155', '#475569', '#334155', '#1E293B', null, null, null, null, null, null, null, null, null],
    [null, null, '#1E293B', '#334155', '#334155', '#334155', '#334155', '#334155', '#334155', '#334155', '#334155', '#334155', '#334155', '#1E293B', null, null, null, null, null, null, null, null, null, null],
    [null, null, null, '#1E293B', '#1E293B', '#1E293B', null, null, null, null, '#1E293B', '#1E293B', '#1E293B', null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, '#0F172A', '#0F172A', '#0F172A', null, null, null, null, '#0F172A', '#0F172A', '#0F172A', null, null, null, null, null, null, null, null, null, null, null],
  ];
  createFromGrid('tank', 24, 13, tankMap);

  // 7. Phone Wave Bullet (12x12 concentric cyber ring)
  const waveMap: (string | null)[][] = [
    [null, null, null, null, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, null, null, null, null],
    [null, null, PHONE_CYAN, PHONE_WAVE, HIGHLIGHT, HIGHLIGHT, PHONE_WAVE, PHONE_CYAN, PHONE_CYAN, null, null, null],
    [null, PHONE_CYAN, PHONE_WAVE, HIGHLIGHT, PHONE_CYAN, PHONE_CYAN, HIGHLIGHT, PHONE_WAVE, PHONE_CYAN, null, null, null],
    [null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, null],
    [PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, null, null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null],
    [PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, null, null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null],
    [null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, PHONE_CYAN, HIGHLIGHT, PHONE_CYAN, null, null, null],
    [null, PHONE_CYAN, PHONE_WAVE, HIGHLIGHT, PHONE_CYAN, PHONE_CYAN, HIGHLIGHT, PHONE_WAVE, PHONE_CYAN, null, null, null],
    [null, null, PHONE_CYAN, PHONE_WAVE, HIGHLIGHT, HIGHLIGHT, PHONE_WAVE, PHONE_CYAN, PHONE_CYAN, null, null, null],
    [null, null, null, null, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, PHONE_CYAN, null, null, null, null],
  ];
  createFromGrid('phone_wave', 12, 10, waveMap);

  // 8. Cover Table Horizontal (32x16) - Upright standard wooden desk
  const tableHMap: (string | null)[][] = [];
  for (let y = 0; y < 14; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < 30; x++) {
      if (y < 4) {
        row.push(x % 6 === 0 ? WOOD_DARK : y === 0 ? WOOD_LIGHT : WOOD_MID);
      } else if (y < 6) {
        row.push(WOOD_DARK);
      } else {
        // Legs
        if (x >= 2 && x <= 5) row.push(WOOD_DARK);
        else if (x >= 24 && x <= 27) row.push(WOOD_DARK);
        else row.push(null);
      }
    }
    tableHMap.push(row);
  }
  createFromGrid('table_h', 30, 14, tableHMap);

  // 9. Cover Table Flipped Horizontal (32x16) - Upright barricade shield
  const tableFlippedHMap: (string | null)[][] = [];
  for (let y = 0; y < 14; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < 30; x++) {
      if (y === 0 || y === 13 || x === 0 || x === 29) {
        row.push(WOOD_DARK);
      } else if (x % 5 === 0) {
        row.push(WOOD_DARK);
      } else if (y % 4 === 0) {
        row.push(WOOD_LIGHT);
      } else {
        row.push(WOOD_MID);
      }
    }
    tableFlippedHMap.push(row);
  }
  createFromGrid('table_flipped_h', 30, 14, tableFlippedHMap);

  // 10. Table Damaged (cracks and splinters)
  const tableDamagedMap: (string | null)[][] = [];
  for (let y = 0; y < 14; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < 30; x++) {
      if ((x === y + 4 || x === 26 - y) && y > 2 && y < 12) {
        row.push(null); // crack hole
      } else if (y === 0 || y === 13 || x === 0 || x === 29) {
        row.push(WOOD_DARK);
      } else if (x % 5 === 0) {
        row.push(WOOD_DARK);
      } else {
        row.push(x % 2 === 0 ? WOOD_MID : WOOD_LIGHT);
      }
    }
    tableDamagedMap.push(row);
  }
  createFromGrid('table_damaged_h', 30, 14, tableDamagedMap);

  // 11. Locked Door (32x20)
  const doorLockedMap: (string | null)[][] = [];
  for (let y = 0; y < 20; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < 32; x++) {
      if (y === 0 || x === 0 || x === 31 || y === 19) {
        row.push('#1E293B');
      } else if (x >= 12 && x <= 19 && y >= 7 && y <= 14) {
        // Red padlock symbol
        if (y === 7 || y === 8) row.push(x >= 14 && x <= 17 ? '#EF4444' : '#1E293B');
        else row.push('#EF4444');
      } else {
        row.push(y % 3 === 0 ? '#334155' : '#475569');
      }
    }
    doorLockedMap.push(row);
  }
  createFromGrid('door_locked', 32, 20, doorLockedMap);

  // 12. Unlocked Door (32x20) - Golden portal doorway
  const doorUnlockedMap: (string | null)[][] = [];
  for (let y = 0; y < 20; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < 32; x++) {
      if (y === 0 || x === 0 || x === 31 || y === 19) {
        row.push(GOLD);
      } else if (x >= 4 && x <= 27 && y >= 2 && y <= 17) {
        row.push(GOLD_LIGHT);
      } else {
        row.push(GOLD);
      }
    }
    doorUnlockedMap.push(row);
  }
  createFromGrid('door_unlocked', 32, 20, doorUnlockedMap);

  // 13. Floor Bedroom (32x32 warm wood planks)
  const floorBedroomCanvas = document.createElement('canvas');
  floorBedroomCanvas.width = 32;
  floorBedroomCanvas.height = 32;
  const fbCtx = floorBedroomCanvas.getContext('2d')!;
  fbCtx.fillStyle = '#2C1D18';
  fbCtx.fillRect(0, 0, 32, 32);
  fbCtx.fillStyle = '#3E2922';
  fbCtx.fillRect(0, 0, 31, 15);
  fbCtx.fillRect(0, 16, 31, 15);
  fbCtx.fillStyle = '#221612';
  fbCtx.fillRect(16, 0, 1, 15);
  fbCtx.fillRect(8, 16, 1, 15);
  textures.addCanvas('floor_bedroom', floorBedroomCanvas);

  // 14. Floor Closet (32x32 deep navy cozy carpet tiles)
  const floorClosetCanvas = document.createElement('canvas');
  floorClosetCanvas.width = 32;
  floorClosetCanvas.height = 32;
  const fcCtx = floorClosetCanvas.getContext('2d')!;
  fcCtx.fillStyle = '#17192F';
  fcCtx.fillRect(0, 0, 32, 32);
  fcCtx.fillStyle = '#1D2140';
  fcCtx.fillRect(1, 1, 14, 14);
  fcCtx.fillRect(17, 17, 14, 14);
  textures.addCanvas('floor_closet', floorClosetCanvas);

  // 15. Floor Hallway (32x32 checkered deep midnight tiles)
  const floorHallwayCanvas = document.createElement('canvas');
  floorHallwayCanvas.width = 32;
  floorHallwayCanvas.height = 32;
  const fhCtx = floorHallwayCanvas.getContext('2d')!;
  fhCtx.fillStyle = '#111827';
  fhCtx.fillRect(0, 0, 32, 32);
  fhCtx.fillStyle = '#1F2937';
  fhCtx.fillRect(0, 0, 16, 16);
  fhCtx.fillRect(16, 16, 16, 16);
  textures.addCanvas('floor_hallway', floorHallwayCanvas);

  // 16. Wall Block (32x32 stone/brick)
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = 32;
  wallCanvas.height = 32;
  const wCtx = wallCanvas.getContext('2d')!;
  wCtx.fillStyle = '#0B0F19';
  wCtx.fillRect(0, 0, 32, 32);
  wCtx.fillStyle = '#1E293B';
  wCtx.fillRect(2, 2, 28, 12);
  wCtx.fillRect(2, 16, 28, 14);
  wCtx.fillStyle = '#334155';
  wCtx.fillRect(2, 2, 28, 2);
  wCtx.fillRect(2, 16, 28, 2);
  textures.addCanvas('wall_block', wallCanvas);

  // 17. Particle dot (4x4)
  const pPaper = document.createElement('canvas');
  pPaper.width = 4;
  pPaper.height = 4;
  const ppCtx = pPaper.getContext('2d')!;
  ppCtx.fillStyle = PARCHMENT;
  ppCtx.fillRect(0, 0, 4, 4);
  textures.addCanvas('particle_paper', pPaper);

  const pWood = document.createElement('canvas');
  pWood.width = 4;
  pWood.height = 4;
  const pwCtx = pWood.getContext('2d')!;
  pwCtx.fillStyle = WOOD_LIGHT;
  pwCtx.fillRect(0, 0, 4, 4);
  textures.addCanvas('particle_wood', pWood);

  const pSpark = document.createElement('canvas');
  pSpark.width = 4;
  pSpark.height = 4;
  const psCtx = pSpark.getContext('2d')!;
  psCtx.fillStyle = PHONE_CYAN;
  psCtx.fillRect(0, 0, 4, 4);
  textures.addCanvas('particle_spark', pSpark);

  // Reticle Crosshair (12x12)
  const reticleCanvas = document.createElement('canvas');
  reticleCanvas.width = 12;
  reticleCanvas.height = 12;
  const rCtx = reticleCanvas.getContext('2d')!;
  rCtx.fillStyle = '#F59E0B';
  rCtx.fillRect(5, 0, 2, 4);
  rCtx.fillRect(5, 8, 2, 4);
  rCtx.fillRect(0, 5, 4, 2);
  rCtx.fillRect(8, 5, 4, 2);
  rCtx.fillStyle = '#FEF08A';
  rCtx.fillRect(5, 5, 2, 2);
  textures.addCanvas('reticle', reticleCanvas);

  // 18. Matcha Tea Bowl (14x12) - Ceramic bowl with frothy vibrant green matcha
  const matchaMap: (string | null)[][] = [
    [null, null, null, null, '#DCFCE7', '#BBF7D0', null, null, null, null, null, null, null, null],
    [null, null, null, '#BBF7D0', '#4ADE80', '#22C55E', '#BBF7D0', null, null, null, null, null, null, null],
    [null, null, '#78350F', '#78350F', '#78350F', '#78350F', '#78350F', '#78350F', '#78350F', '#78350F', null, null, null, null],
    [null, '#78350F', '#22C55E', '#16A34A', '#22C55E', '#BBF7D0', '#16A34A', '#22C55E', '#16A34A', '#78350F', null, null, null, null],
    [null, '#78350F', '#16A34A', '#15803D', '#16A34A', '#22C55E', '#15803D', '#16A34A', '#15803D', '#78350F', null, null, null, null],
    [null, '#78350F', '#92400E', '#78350F', '#92400E', '#78350F', '#92400E', '#78350F', '#92400E', '#78350F', null, null, null, null],
    [null, null, '#78350F', '#92400E', '#78350F', '#92400E', '#78350F', '#92400E', '#78350F', null, null, null, null, null],
    [null, null, null, '#78350F', '#78350F', '#78350F', '#78350F', '#78350F', null, null, null, null, null, null],
    [null, null, null, null, '#581C0C', '#581C0C', '#581C0C', null, null, null, null, null, null, null],
  ];
  createFromGrid('matcha', 14, 9, matchaMap);

  const pMatcha = document.createElement('canvas');
  pMatcha.width = 4;
  pMatcha.height = 4;
  const pmCtx = pMatcha.getContext('2d')!;
  pmCtx.fillStyle = '#22C55E';
  pmCtx.fillRect(0, 0, 4, 4);
  textures.addCanvas('particle_matcha', pMatcha);
}
