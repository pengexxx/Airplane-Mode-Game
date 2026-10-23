import Phaser from 'phaser';
import { BaseEnemy, WalkerEnemy, SprinterEnemy, TankEnemy, MatchaPickup } from './entities/Enemy.ts';
import { CoverTable } from './entities/CoverTable.ts';
import { soundEngine } from './audio.ts';
import { ROOM_CONFIGS, RoomConfig } from './rules.ts';

export class RoomManager {
  private scene: Phaser.Scene;
  public currentRoomIndex: number = 0;
  public enemies: BaseEnemy[] = [];
  public enemiesGroup: Phaser.Physics.Arcade.Group;
  public tables: CoverTable[] = [];
  public tablesGroup: Phaser.Physics.Arcade.StaticGroup;
  public matchaPickups: MatchaPickup[] = [];
  public wallsGroup: Phaser.Physics.Arcade.StaticGroup;
  public exitDoor: Phaser.Physics.Arcade.Sprite | null = null;
  public isDoorUnlocked: boolean = false;
  private floorTileSprite: Phaser.GameObjects.TileSprite | null = null;
  private doorPromptText: Phaser.GameObjects.Text | null = null;

  // Tutorial contextual floor hints
  private tutorialFloorHint: Phaser.GameObjects.Text | null = null;
  private hasShownShootHint: boolean = false;
  private hasShownRollHint: boolean = false;
  private hasShownFlipHint: boolean = false;
  private hasShownReloadHint: boolean = false;
  private currentHintKey: string | null = null;

  // Callbacks
  public onRoomCleared?: (roomNumber: number) => void;
  public onFloorCompleted?: () => void;
  public onEnemyKilled?: (enemy: BaseEnemy) => void;
  public onMatchaCollected?: () => void;

  constructor(scene: Phaser.Scene, wallsGroup: Phaser.Physics.Arcade.StaticGroup) {
    this.scene = scene;
    this.wallsGroup = wallsGroup;
    this.enemiesGroup = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    });
    this.tablesGroup = scene.physics.add.staticGroup();
  }

  public loadRoom(
    roomIndex: number,
    playerX: number,
    playerY: number,
    enemyBulletsGroup: Phaser.Physics.Arcade.Group
  ) {
    this.currentRoomIndex = roomIndex;
    const config: RoomConfig = ROOM_CONFIGS[roomIndex] || ROOM_CONFIGS[0];
    this.isDoorUnlocked = false;

    // Clear previous room entities
    this.enemiesGroup.clear(true, true);
    this.enemies = [];
    this.tablesGroup.clear(true, true);
    this.tables.forEach((t) => t.destroy());
    this.tables = [];
    this.matchaPickups.forEach((m) => m.destroy());
    this.matchaPickups = [];
    this.wallsGroup.clear(true, true);

    if (this.exitDoor) this.exitDoor.destroy();
    if (this.floorTileSprite) this.floorTileSprite.destroy();
    if (this.doorPromptText) this.doorPromptText.destroy();
    if (this.tutorialFloorHint) this.tutorialFloorHint.destroy();

    const worldW = 480;
    const worldH = 270;

    // 1. Floor background
    let floorKey = 'floor_bedroom';
    if (roomIndex === 2) floorKey = 'floor_closet';
    if (roomIndex === 3) floorKey = 'floor_hallway';

    this.floorTileSprite = this.scene.add.tileSprite(0, 0, worldW, worldH, floorKey);
    this.floorTileSprite.setOrigin(0, 0);
    this.floorTileSprite.setDepth(1);

    // 2. Tutorial floor hint container (only in tutorial room)
    if (config.isTutorial) {
      this.tutorialFloorHint = this.scene.add.text(240, 170, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#FBBF24',
        backgroundColor: '#0F172ACC',
        padding: { x: 6, y: 3 },
      });
      this.tutorialFloorHint.setOrigin(0.5, 0.5);
      this.tutorialFloorHint.setDepth(3);
      this.tutorialFloorHint.setVisible(false);
    }

    // 3. Perimeter Walls
    // Top wall
    for (let x = 0; x < worldW; x += 32) {
      if (x < 208 || x > 256) {
        const wall = this.wallsGroup.create(x + 16, 12, 'wall_block');
        wall.setDepth(4);
        wall.refreshBody();
      }
    }
    // Bottom wall
    for (let x = 0; x < worldW; x += 32) {
      const wall = this.wallsGroup.create(x + 16, worldH - 12, 'wall_block');
      wall.setDepth(4);
      wall.refreshBody();
    }
    // Left wall
    for (let y = 16; y < worldH; y += 32) {
      const wall = this.wallsGroup.create(12, y + 16, 'wall_block');
      wall.setDepth(4);
      wall.refreshBody();
    }
    // Right wall
    for (let y = 16; y < worldH; y += 32) {
      const wall = this.wallsGroup.create(worldW - 12, y + 16, 'wall_block');
      wall.setDepth(4);
      wall.refreshBody();
    }

    // 4. Exit Door (positioned top center)
    this.exitDoor = this.scene.physics.add.sprite(240, 14, 'door_locked');
    this.exitDoor.setImmovable(true);
    this.exitDoor.setDepth(4);

    this.doorPromptText = this.scene.add.text(240, 32, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FEF08A',
      backgroundColor: '#0F172ACC',
      padding: { x: 4, y: 2 },
    });
    this.doorPromptText.setOrigin(0.5, 0.5);
    this.doorPromptText.setDepth(20);
    this.doorPromptText.setVisible(false);

    // 5. Spawn Tables
    const tablePositions = this.getTablePositions(roomIndex);
    tablePositions.forEach((pos) => {
      const table = new CoverTable(this.scene, pos.x, pos.y);
      this.tables.push(table);
      this.tablesGroup.add(table);
    });

    // 6. Spawn Enemies: strictly > 140px away from monk
    this.spawnEnemies(config, playerX, playerY, enemyBulletsGroup);
  }

  private getTablePositions(roomIndex: number): { x: number; y: number }[] {
    if (roomIndex === 0) {
      // Tutorial: 2 flanking tables
      return [
        { x: 160, y: 140 },
        { x: 320, y: 140 },
      ];
    } else if (roomIndex === 1) {
      // Bedroom: 2 tables
      return [
        { x: 170, y: 140 },
        { x: 310, y: 140 },
      ];
    } else if (roomIndex === 2) {
      // Closet: 3 tables
      return [
        { x: 150, y: 100 },
        { x: 330, y: 100 },
        { x: 240, y: 175 },
      ];
    } else {
      // Hallway: 4 tables
      return [
        { x: 130, y: 110 },
        { x: 350, y: 110 },
        { x: 170, y: 180 },
        { x: 310, y: 180 },
      ];
    }
  }

  private spawnEnemies(
    config: RoomConfig,
    playerX: number,
    playerY: number,
    enemyBulletsGroup: Phaser.Physics.Arcade.Group
  ) {
    if (config.isTutorial) {
      // Tutorial: ONE slow walker zombie spawned far from monk at (240, 75)
      // Player is at (240, 220), distance is 145px
      const tutorialWalker = new WalkerEnemy(this.scene, 240, 75, enemyBulletsGroup, true);
      tutorialWalker.onDropMatcha = (x, y) => this.spawnMatcha(x, y);
      this.enemies.push(tutorialWalker);
      this.enemiesGroup.add(tutorialWalker);
      return;
    }

    // Stages 1-3: Enemies spawn strictly in upper half (y: 55 to 125), guaranteed > 100px from monk
    const minSpawnDist = 135;
    const getRandomPos = () => {
      let x = 60 + Math.random() * 360;
      let y = 55 + Math.random() * 70; // Upper room only
      let attempts = 0;
      while (Phaser.Math.Distance.Between(x, y, playerX, playerY) < minSpawnDist && attempts < 25) {
        x = 60 + Math.random() * 360;
        y = 55 + Math.random() * 70;
        attempts++;
      }
      return { x, y };
    };

    // Spawn Walkers
    for (let i = 0; i < config.walkers; i++) {
      const pos = getRandomPos();
      const enemy = new WalkerEnemy(this.scene, pos.x, pos.y, enemyBulletsGroup, false);
      enemy.onDropMatcha = (x, y) => this.spawnMatcha(x, y);
      this.enemies.push(enemy);
      this.enemiesGroup.add(enemy);
    }

    // Spawn Sprinters
    for (let i = 0; i < config.sprinters; i++) {
      const pos = getRandomPos();
      const enemy = new SprinterEnemy(this.scene, pos.x, pos.y, enemyBulletsGroup);
      enemy.onDropMatcha = (x, y) => this.spawnMatcha(x, y);
      this.enemies.push(enemy);
      this.enemiesGroup.add(enemy);
    }

    // Spawn Tanks
    for (let i = 0; i < config.tanks; i++) {
      const pos = getRandomPos();
      const enemy = new TankEnemy(this.scene, pos.x, pos.y, enemyBulletsGroup);
      enemy.onDropMatcha = (x, y) => this.spawnMatcha(x, y);
      this.enemies.push(enemy);
      this.enemiesGroup.add(enemy);
    }
  }

  public spawnMatcha(x: number, y: number) {
    const matcha = new MatchaPickup(this.scene, x, y);
    this.matchaPickups.push(matcha);
  }

  public updateEnemies(
    playerX: number,
    playerY: number,
    delta: number,
    playerAmmo: number,
    enemyBullets: Phaser.Physics.Arcade.Group
  ) {
    // Clean up dead enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active || enemy.isDefeated) {
        this.enemies.splice(i, 1);
        this.onEnemyKilled?.(enemy);
      } else {
        enemy.updateAI(playerX, playerY, delta);
      }
    }

    // Tutorial Floor Hints Update
    if (this.currentRoomIndex === 0 && this.tutorialFloorHint) {
      this.updateTutorialHints(playerX, playerY, playerAmmo, enemyBullets);
    }

    // Check if room is cleared
    if (this.enemies.length === 0 && !this.isDoorUnlocked) {
      this.unlockDoor();
    }
  }

  private updateTutorialHints(
    playerX: number,
    playerY: number,
    playerAmmo: number,
    enemyBullets: Phaser.Physics.Arcade.Group
  ) {
    if (!this.tutorialFloorHint) return;

    // Hint 1: "click to shoot" when zombie is in range
    const zombie = this.enemies[0];
    if (zombie && zombie.active) {
      const distToZombie = Phaser.Math.Distance.Between(playerX, playerY, zombie.x, zombie.y);
      if (distToZombie < 185 && !this.hasShownShootHint) {
        this.showTutorialHint('click to shoot', 'shoot');
        this.hasShownShootHint = true;
      }
    }

    // Hint 2: "space to roll" the first time a bullet comes near monk (< 90px)
    if (!this.hasShownRollHint) {
      let bulletNear = false;
      enemyBullets.getChildren().forEach((bObj) => {
        const bullet = bObj as Phaser.Physics.Arcade.Sprite;
        if (bullet.active) {
          const dist = Phaser.Math.Distance.Between(playerX, playerY, bullet.x, bullet.y);
          if (dist < 90) {
            bulletNear = true;
          }
        }
      });
      if (bulletNear) {
        this.showTutorialHint('space to roll (dodge bullets)', 'roll');
        this.hasShownRollHint = true;
      }
    }

    // Hint 3: "e to flip" when standing next to a table (< 44px)
    if (!this.hasShownFlipHint) {
      let nearTable = false;
      this.tables.forEach((t) => {
        if (!t.isFlipped && !t.isBroken) {
          const dist = Phaser.Math.Distance.Between(playerX, playerY, t.x, t.y);
          if (dist < 44) nearTable = true;
        }
      });
      if (nearTable) {
        this.showTutorialHint('e to flip table for cover', 'flip');
        this.hasShownFlipHint = true;
      }
    }

    // Hint 4: "r to reload" the first time clip is empty
    if (playerAmmo === 0 && !this.hasShownReloadHint) {
      this.showTutorialHint('r to reload sacred pages', 'reload');
      this.hasShownReloadHint = true;
    }
  }

  private showTutorialHint(text: string, key: string) {
    if (!this.tutorialFloorHint) return;
    this.currentHintKey = key;
    this.tutorialFloorHint.setText(text);
    this.tutorialFloorHint.setVisible(true);
    this.tutorialFloorHint.setAlpha(1);

    // Auto fade hint after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (this.currentHintKey === key && this.tutorialFloorHint && this.tutorialFloorHint.active) {
        this.scene.tweens.add({
          targets: this.tutorialFloorHint,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            if (this.tutorialFloorHint) this.tutorialFloorHint.setVisible(false);
          },
        });
      }
    });
  }

  private unlockDoor() {
    this.isDoorUnlocked = true;

    // Chime + door slide whoosh
    soundEngine.playChime();
    soundEngine.playDoorSlide();

    if (this.exitDoor) {
      this.exitDoor.setTexture('door_unlocked');
      // Door slide animation: smoothly slide upward to reveal open passage
      this.scene.tweens.add({
        targets: this.exitDoor,
        y: -4,
        duration: 450,
        ease: 'Cubic.easeOut',
      });
    }

    if (this.doorPromptText) {
      const isFinal = this.currentRoomIndex === ROOM_CONFIGS.length - 1;
      this.doorPromptText.setText(isFinal ? 'portal open - clear mind' : 'door open - enter next room');
      this.doorPromptText.setVisible(true);

      // Pulse animation
      this.scene.tweens.add({
        targets: this.doorPromptText,
        alpha: 0.4,
        yoyo: true,
        repeat: -1,
        duration: 400,
      });
    }

    // Hide any lingering tutorial hint
    if (this.tutorialFloorHint) {
      this.tutorialFloorHint.setVisible(false);
    }

    this.onRoomCleared?.(this.currentRoomIndex + 1);
  }

  public checkDoorOverlap(playerX: number, playerY: number): boolean {
    if (!this.isDoorUnlocked || !this.exitDoor) return false;
    const dist = Phaser.Math.Distance.Between(playerX, playerY, 240, 14);
    return dist < 26;
  }
}
