import Phaser from 'phaser';
import { createPixelTextures } from './textures.ts';
import { Player } from './entities/Player.ts';
import { RoomManager } from './RoomManager.ts';
import { calculateKillScore, calculateRoomClearScore, ROOM_CONFIGS } from './rules.ts';
import { soundEngine } from './audio.ts';

export interface GameEventCallbacks {
  onScoreUpdate: (score: number, multiplier: number, isStreakIncrease?: boolean) => void;
  onMotivationUpdate: (motivation: number, max: number) => void;
  onAmmoUpdate: (ammo: number, max: number, isReloading: boolean, progress: number) => void;
  onRollStateUpdate: (isRolling: boolean, canRoll: boolean) => void;
  onRoomChange: (roomNum: number, roomName: string, notificationBadge: string) => void;
  onGameOver: (finalScore: number, roomReached: number, finalStreak: number) => void;
  onMonkDefeatedPreScreen: () => void;
  onVictory: (finalScore: number) => void;
  onMonkHitReaction: () => void;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private roomManager!: RoomManager;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private reticle!: Phaser.GameObjects.Sprite;

  private score: number = 0;
  private multiplier: number = 1.0;
  private callbacks?: GameEventCallbacks;
  private isGameActive: boolean = false;
  private isFloorWon: boolean = false;
  private startRoomIndex: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: { callbacks?: GameEventCallbacks; startRoomIndex?: number }) {
    this.callbacks = data.callbacks;
    this.startRoomIndex = data.startRoomIndex ?? 0;
    this.score = 0;
    this.multiplier = 1.0;
    this.isGameActive = false;
    this.isFloorWon = false;
  }

  public setGameActive(active: boolean) {
    this.isGameActive = active;
  }

  preload() {
    // Hand-made sprites. Loaded under the same keys the procedural texture factory uses,
    // so the factory skips them and only fills in what's still code-drawn (zombies, tables...).
    for (const key of ['monk_idle', 'monk_walk', 'monk_roll', 'monk_book']) {
      this.load.image(key, `sprites/${key}.png`);
    }
  }

  create() {
    // 1. Generate procedural pixel textures
    createPixelTextures(this);

    // 2. Set world & camera bounds (480x270 virtual pixel canvas)
    this.physics.world.setBounds(0, 0, 480, 270);
    this.cameras.main.setBounds(0, 0, 480, 270);

    // 3. Static walls group
    this.walls = this.physics.add.staticGroup();

    // 4. Bullets groups
    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    });
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    });

    // 5. Spawn Player at bottom center
    this.player = new Player(this, 240, 220, this.playerBullets);

    // 6. Setup RoomManager
    this.roomManager = new RoomManager(this, this.walls);

    // Wire RoomManager callbacks
    this.roomManager.onEnemyKilled = () => {
      const { newScore, newMultiplier } = calculateKillScore(this.score, this.multiplier);
      const isStreakIncrease = newMultiplier > this.multiplier;
      this.score = newScore;
      this.multiplier = newMultiplier;
      this.callbacks?.onScoreUpdate(this.score, this.multiplier, isStreakIncrease);
    };

    this.roomManager.onRoomCleared = (nextRoomNum) => {
      this.score = calculateRoomClearScore(this.score);
      this.callbacks?.onScoreUpdate(this.score, this.multiplier, false);
    };

    // Wire Player callbacks
    this.player.onDamageTaken = (newMotivation) => {
      this.multiplier = 1.0;
      this.callbacks?.onScoreUpdate(this.score, this.multiplier, false);
      this.callbacks?.onMotivationUpdate(newMotivation, this.player.maxMotivation);
      this.callbacks?.onMonkHitReaction();

      if (newMotivation <= 0) {
        this.triggerDefeat();
      }
    };

    this.player.onAmmoChanged = (ammo, max, isReloading, progress) => {
      this.callbacks?.onAmmoUpdate(ammo, max, isReloading, progress);
    };

    this.player.onRollStateChanged = (isRolling, canRoll) => {
      this.callbacks?.onRollStateUpdate(isRolling, canRoll);
    };

    // 7. Physics Colliders & Overlaps
    // Player vs Walls
    this.physics.add.collider(this.player, this.walls);

    // Bullets vs Walls
    this.physics.add.collider(this.playerBullets, this.walls, (bullet) => {
      bullet.destroy();
    });
    this.physics.add.collider(this.enemyBullets, this.walls, (bullet) => {
      bullet.destroy();
    });

    // Player Bullets vs Enemies -> damage
    this.physics.add.overlap(this.playerBullets, this.roomManager.enemiesGroup, (bulletObj, enemyObj) => {
      const enemy = enemyObj as unknown as import('./entities/Enemy.ts').BaseEnemy;
      const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Sprite;

      if (bullet.active && enemy.active && !enemy.isDefeated) {
        bullet.disableBody(true, true);
        bullet.destroy();
        const knockAngle = Phaser.Math.Angle.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        enemy.takeDamage(1, knockAngle);
      }
    });

    // Enemy Bullets vs Player -> bullet is destroyed the moment it touches monk, removes exactly 1 motivation
    // NOTE: Phaser passes the single sprite (the player) FIRST when one side is a sprite and the
    // other a group, so pick the bullet explicitly. Destroying the wrong one deleted the monk.
    this.physics.add.overlap(this.player, this.enemyBullets, (objA, objB) => {
      const bullet = (objA === this.player ? objB : objA) as unknown as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active || (bullet as unknown) === this.player) return;
      bullet.disableBody(true, true);
      bullet.destroy();
      if (this.isGameActive) {
        this.player.takeHit(1);
      }
    });

    // Enemy Bullets vs Cover Tables -> absorbed if flipped
    this.physics.add.overlap(this.enemyBullets, this.roomManager.tablesGroup, (bulletObj, tableObj) => {
      const table = tableObj as unknown as import('./entities/CoverTable.ts').CoverTable;
      const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Sprite;

      if (bullet.active && table.isFlipped && !table.isBroken) {
        bullet.disableBody(true, true);
        bullet.destroy();
        table.takeBulletHit();
      }
    });

    // Player Bullets vs Cover Tables -> blocked if flipped
    this.physics.add.overlap(this.playerBullets, this.roomManager.tablesGroup, (bulletObj, tableObj) => {
      const table = tableObj as unknown as import('./entities/CoverTable.ts').CoverTable;
      const bullet = bulletObj as unknown as Phaser.Physics.Arcade.Sprite;

      if (bullet.active && table.isFlipped && !table.isBroken) {
        bullet.disableBody(true, true);
        bullet.destroy();
      }
    });

    // Player vs Tables collider
    this.physics.add.collider(this.player, this.roomManager.tablesGroup);

    // Enemies vs Tables & Walls collider
    this.physics.add.collider(this.roomManager.enemiesGroup, this.walls);
    this.physics.add.collider(this.roomManager.enemiesGroup, this.roomManager.tablesGroup);

    // 8. Custom Reticle
    this.reticle = this.add.sprite(240, 135, 'reticle');
    this.reticle.setOrigin(0.5, 0.5);
    this.reticle.setDepth(25);

    // Load initial stage
    this.loadStage(this.startRoomIndex);

    // Initial HUD notification
    this.callbacks?.onMotivationUpdate(this.player.motivation, this.player.maxMotivation);
    this.callbacks?.onAmmoUpdate(this.player.ammo, this.player.maxAmmo, false, 0);
    this.callbacks?.onRollStateUpdate(false, true);
    this.callbacks?.onScoreUpdate(this.score, this.multiplier, false);
  }

  public loadStage(stageIndex: number) {
    const config = ROOM_CONFIGS[stageIndex] || ROOM_CONFIGS[0];
    this.roomManager.loadRoom(stageIndex, 240, 220, this.enemyBullets);
    this.callbacks?.onRoomChange(stageIndex, config.name, config.notificationBadge);

    // Reset player position cleanly
    this.player.setPosition(240, 220);
    this.player.setVelocity(0, 0);

    // Exactly 2 seconds of invincibility at the start of every room
    this.player.grantInvincibility(2000);
  }

  update(time: number, delta: number) {
    if (!this.isGameActive || this.isFloorWon) return;

    // Convert mouse screen coordinates to world
    const pointer = this.input.activePointer;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    // Reticle follow pointer
    this.reticle.setPosition(worldX, worldY);

    // Update Player
    this.player.updatePlayer(time, delta, worldX, worldY, pointer.isDown, this.roomManager.tables);

    // Update Enemies & Tutorial Hints
    this.roomManager.updateEnemies(
      this.player.x,
      this.player.y,
      delta,
      this.player.ammo,
      this.enemyBullets
    );

    // Check Matcha pickups collection
    for (let i = this.roomManager.matchaPickups.length - 1; i >= 0; i--) {
      const matcha = this.roomManager.matchaPickups[i];
      if (matcha.active) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, matcha.x, matcha.y);
        if (dist < 18) {
          this.player.collectMatcha();
          matcha.destroy();
          this.roomManager.matchaPickups.splice(i, 1);
        }
      }
    }

    // Check Door transition
    if (this.roomManager.isDoorUnlocked && this.roomManager.checkDoorOverlap(this.player.x, this.player.y)) {
      if (this.roomManager.currentRoomIndex < ROOM_CONFIGS.length - 1) {
        this.loadStage(this.roomManager.currentRoomIndex + 1);
      } else {
        this.triggerVictory();
      }
    }
  }

  private triggerDefeat() {
    this.isGameActive = false;
    soundEngine.playGameOver();

    // Clear any flying bullets immediately
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);

    // Show meditating guy picking up his phone FIRST
    this.callbacks?.onMonkDefeatedPreScreen?.();

    // Dramatic beat (~850ms) before opening death screen
    this.time.delayedCall(850, () => {
      this.callbacks?.onGameOver(
        this.score,
        this.roomManager.currentRoomIndex + 1,
        this.multiplier
      );
    });
  }

  private triggerVictory() {
    this.isFloorWon = true;
    this.isGameActive = false;
    soundEngine.playVictory();
    this.callbacks?.onVictory(this.score);
  }

  public restartGame(startRoomIndex: number = 0) {
    this.score = 0;
    this.multiplier = 1.0;
    this.isGameActive = true;
    this.isFloorWon = false;
    this.startRoomIndex = startRoomIndex;

    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);

    this.player.resetState();

    this.callbacks?.onScoreUpdate(this.score, this.multiplier, false);
    this.callbacks?.onMotivationUpdate(this.player.motivation, this.player.maxMotivation);
    this.callbacks?.onAmmoUpdate(this.player.ammo, this.player.maxAmmo, false, 0);
    this.callbacks?.onRollStateUpdate(false, true);

    this.loadStage(startRoomIndex);
  }
}
