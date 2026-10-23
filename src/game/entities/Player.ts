import Phaser from 'phaser';
import { soundEngine } from '../audio.ts';
import { PlayerBullet } from './Bullet.ts';
import { CoverTable } from './CoverTable.ts';

export class Player extends Phaser.Physics.Arcade.Sprite {
  // Stats
  public maxMotivation: number = 6;
  public motivation: number = 6;
  public maxAmmo: number = 8;
  public ammo: number = 8;
  public isReloading: boolean = false;
  public reloadProgress: number = 0; // 0 to 1
  public isRolling: boolean = false;
  public canRoll: boolean = true;
  public isInvulnerable: boolean = false;

  // Controls & Physics
  private moveSpeed: number = 135;
  private rollSpeed: number = 275;
  private rollDuration: number = 350; // ms
  private rollCooldown: number = 550; // ms
  private reloadDuration: number = 1000; // ms
  private fireCooldown: number = 180; // ms
  private lastFireTime: number = 0;
  private reloadTimer: number = 0;
  private lastDryClickTime: number = 0;

  // Active key tracker (ensures WASD never drops across focus transitions)
  private activeKeys: Set<string> = new Set();
  private invulnerabilityTween: Phaser.Tweens.Tween | null = null;
  private reloadPromptText: Phaser.GameObjects.Text | null = null;
  public invulnerableUntil: number = 0;

  // Roll velocity vector
  private rollVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  // References
  private gameScene: Phaser.Scene;
  private playerBulletsGroup: Phaser.Physics.Arcade.Group;
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    e: Phaser.Input.Keyboard.Key;
    r: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  // Callback events
  public onDamageTaken?: (remainingMotivation: number) => void;
  public onAmmoChanged?: (currentAmmo: number, maxAmmo: number, isReloading: boolean, progress: number) => void;
  public onRollStateChanged?: (isRolling: boolean, canRoll: boolean) => void;
  public onTableFlipped?: () => void;
  public onEmptyClipFired?: () => void;

  public static readonly SPRITE_SCALE = 0.23;
  private walkAnimTimer: number = 0;
  private bookPoseUntil: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bulletsGroup: Phaser.Physics.Arcade.Group
  ) {
    super(scene, x, y, 'monk_idle');
    this.gameScene = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.playerBulletsGroup = bulletsGroup;
    this.setCollideWorldBounds(true);
    this.setDepth(8);

    // Hand-made sprite is 84x128; shrink it to ~30px tall in the 480x270 world.
    this.setScale(Player.SPRITE_SCALE);

    // Hitbox tuning: small torso box (in source-image pixels) for fair bullet-hell dodging
    if (this.body) {
      this.body.setSize(32, 52);
      this.body.setOffset(26, 46);
    }

    // Input setup
    const kb = scene.input.keyboard;
    this.keys = {
      w: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      e: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      r: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      up: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      left: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      down: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      right: kb!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };

    // Window event listeners for rock-solid WASD 8-directional movement
    if (typeof window !== 'undefined') {
      const handleWindowKeyDown = (e: KeyboardEvent) => {
        this.activeKeys.add(e.code);
      };
      const handleWindowKeyUp = (e: KeyboardEvent) => {
        this.activeKeys.delete(e.code);
      };
      window.addEventListener('keydown', handleWindowKeyDown);
      window.addEventListener('keyup', handleWindowKeyUp);

      this.once(Phaser.GameObjects.Events.DESTROY, () => {
        window.removeEventListener('keydown', handleWindowKeyDown);
        window.removeEventListener('keyup', handleWindowKeyUp);
        if (this.reloadPromptText) this.reloadPromptText.destroy();
      });
    }

    // Floating reload prompt
    this.reloadPromptText = scene.add.text(this.x, this.y - 18, 'reload!', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#EF4444',
      backgroundColor: '#0F172ACC',
      padding: { x: 3, y: 1 },
    });
    this.reloadPromptText.setOrigin(0.5, 0.5);
    this.reloadPromptText.setDepth(22);
    this.reloadPromptText.setVisible(false);
  }

  public updatePlayer(
    time: number,
    delta: number,
    pointerWorldX: number,
    pointerWorldY: number,
    isPointerDown: boolean,
    tables: CoverTable[]
  ) {
    if (!this.active || !this.body) return;

    if (this.motivation <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    // Keep reload prompt text positioned over monk if visible
    if (this.reloadPromptText && this.reloadPromptText.visible) {
      this.reloadPromptText.setPosition(this.x, this.y - 18);
    }

    // Handle Reloading progress
    if (this.isReloading) {
      this.reloadTimer += delta;
      this.reloadProgress = Math.min(1, this.reloadTimer / this.reloadDuration);
      this.onAmmoChanged?.(this.ammo, this.maxAmmo, true, this.reloadProgress);

      if (this.reloadTimer >= this.reloadDuration) {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
        this.reloadTimer = 0;
        this.reloadProgress = 0;
        if (this.reloadPromptText) this.reloadPromptText.setVisible(false);
        this.onAmmoChanged?.(this.ammo, this.maxAmmo, false, 0);
      }
    }

    // Manual Reload trigger ('R')
    const rPressed = Phaser.Input.Keyboard.JustDown(this.keys.r) || this.activeKeys.has('KeyR');
    if (rPressed && !this.isReloading && this.ammo < this.maxAmmo) {
      this.startReload();
    }

    // Check Dodge Roll input ('Space')
    const spacePressed = Phaser.Input.Keyboard.JustDown(this.keys.space) || this.activeKeys.has('Space');
    if (spacePressed && this.canRoll && !this.isRolling) {
      this.startDodgeRoll(pointerWorldX, pointerWorldY);
    }

    // Handle Dodge Roll physics
    if (this.isRolling) {
      this.setVelocity(this.rollVector.x * this.rollSpeed, this.rollVector.y * this.rollSpeed);
      this.createGhostTrail();
      return;
    }

    // Normal 8-Directional Movement (W, A, S, D, and Arrows)
    let vx = 0;
    let vy = 0;

    const isUp = this.keys.w.isDown || this.keys.up.isDown || this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp');
    const isDown = this.keys.s.isDown || this.keys.down.isDown || this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown');
    const isLeft = this.keys.a.isDown || this.keys.left.isDown || this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft');
    const isRight = this.keys.d.isDown || this.keys.right.isDown || this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight');

    if (isUp) vy -= 1;
    if (isDown) vy += 1;
    if (isLeft) vx -= 1;
    if (isRight) vx += 1;

    // Normalize diagonal velocity so diagonal travel is not faster
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    this.setVelocity(vx * this.moveSpeed, vy * this.moveSpeed);

    // Facing toward mouse (flip only; tilting a tall sprite looks off)
    const aimAngle = Phaser.Math.Angle.Between(this.x, this.y, pointerWorldX, pointerWorldY);
    this.setRotation(0);
    this.setFlipX(pointerWorldX < this.x);

    // Pose: book while shooting, alternate idle/walk frames while moving
    const isMoving = vx !== 0 || vy !== 0;
    if (time < this.bookPoseUntil) {
      this.setTexture('monk_book');
    } else if (isMoving) {
      this.walkAnimTimer += delta;
      this.setTexture(Math.floor(this.walkAnimTimer / 160) % 2 === 0 ? 'monk_walk' : 'monk_idle');
    } else {
      this.walkAnimTimer = 0;
      this.setTexture('monk_idle');
    }

    // Shooting / Empty Clip Dry Click
    if (isPointerDown && time > this.lastFireTime + this.fireCooldown) {
      if (this.ammo > 0 && !this.isReloading) {
        this.firePage(aimAngle, time);
      } else if (this.ammo <= 0) {
        // Empty clip feedback: dry click sound + reload flash
        this.lastFireTime = time;
        if (time > this.lastDryClickTime + 250) {
          this.lastDryClickTime = time;
          soundEngine.playDryClick();
          this.showReloadFlash();
          this.onEmptyClipFired?.();
        }
        if (!this.isReloading) {
          this.startReload();
        }
      }
    }

    // Table Interaction ('E')
    const ePressed = Phaser.Input.Keyboard.JustDown(this.keys.e) || this.activeKeys.has('KeyE');
    if (ePressed) {
      this.tryFlipNearestTable(tables);
    }

    // Update table prompt distance checks
    tables.forEach((t) => t.updatePrompt(this.x, this.y));
  }

  public setVelocity(vx: number, vy: number): this {
    if (this.body) {
      super.setVelocity(vx, vy);
    }
    return this;
  }

  private startDodgeRoll(pointerWorldX: number, pointerWorldY: number) {
    this.isRolling = true;
    this.canRoll = false;
    this.isInvulnerable = true;
    soundEngine.playRoll();

    // Determine roll direction
    let dirX = 0;
    let dirY = 0;
    if (this.keys.w.isDown || this.keys.up.isDown || this.activeKeys.has('KeyW')) dirY -= 1;
    if (this.keys.s.isDown || this.keys.down.isDown || this.activeKeys.has('KeyS')) dirY += 1;
    if (this.keys.a.isDown || this.keys.left.isDown || this.activeKeys.has('KeyA')) dirX -= 1;
    if (this.keys.d.isDown || this.keys.right.isDown || this.activeKeys.has('KeyD')) dirX += 1;

    if (dirX === 0 && dirY === 0) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, pointerWorldX, pointerWorldY);
      dirX = Math.cos(angle);
      dirY = Math.sin(angle);
    } else {
      const len = Math.hypot(dirX, dirY) || 1;
      dirX /= len;
      dirY /= len;
    }

    this.rollVector.set(dirX, dirY);
    this.setTexture('monk_roll');
    this.onRollStateChanged?.(true, false);

    // Roll spin animation
    this.scene.tweens.add({
      targets: this,
      rotation: this.rotation + Math.PI * 2,
      duration: this.rollDuration,
      ease: 'Cubic.easeOut',
    });

    // Roll duration end
    this.scene.time.delayedCall(this.rollDuration, () => {
      this.isRolling = false;
      this.isInvulnerable = false;
      this.setTexture('monk_idle');
      this.setRotation(0);
      this.onRollStateChanged?.(false, false);

      // Cooldown timer
      this.scene.time.delayedCall(this.rollCooldown - this.rollDuration, () => {
        this.canRoll = true;
        this.onRollStateChanged?.(false, true);
      });
    });
  }

  private firePage(aimAngle: number, time: number) {
    this.lastFireTime = time;
    this.bookPoseUntil = time + 180;
    this.ammo -= 1;
    soundEngine.playShoot();

    const bullet = new PlayerBullet(this.scene, this.x, this.y);
    this.scene.add.existing(bullet);
    this.playerBulletsGroup.add(bullet);
    bullet.fire(this.x, this.y, aimAngle);

    this.onAmmoChanged?.(this.ammo, this.maxAmmo, false, 0);

    if (this.ammo <= 0) {
      this.startReload();
    }
  }

  public startReload() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadTimer = 0;
    this.reloadProgress = 0;
    soundEngine.playReload();
    this.onAmmoChanged?.(this.ammo, this.maxAmmo, true, 0);
  }

  private showReloadFlash() {
    if (this.reloadPromptText) {
      this.reloadPromptText.setPosition(this.x, this.y - 18);
      this.reloadPromptText.setVisible(true);
      this.reloadPromptText.setScale(1.2);
      this.scene.tweens.add({
        targets: this.reloadPromptText,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 200,
        yoyo: true,
      });
    }
  }

  private tryFlipNearestTable(tables: CoverTable[]) {
    let nearestTable: CoverTable | null = null;
    let minDist = 44;

    for (const table of tables) {
      if (!table.isFlipped && !table.isBroken) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, table.x, table.y);
        if (dist < minDist) {
          minDist = dist;
          nearestTable = table;
        }
      }
    }

    if (nearestTable) {
      nearestTable.flip();
      this.onTableFlipped?.();
    }
  }

  /**
   * Grants invulnerability with flashing animation for a specified duration in ms.
   * Used for 1.5s after hits and 2.0s at room starts.
   */
  public grantInvincibility(durationMs: number) {
    this.isInvulnerable = true;
    this.invulnerableUntil = Date.now() + durationMs;
    if (this.invulnerabilityTween) {
      this.invulnerabilityTween.stop();
    }

    const blinkStep = 80;
    const repeatCount = Math.floor(durationMs / blinkStep);

    if (this.gameScene && this.gameScene.tweens) {
      this.invulnerabilityTween = this.gameScene.tweens.add({
        targets: this,
        alpha: 0.25,
        yoyo: true,
        repeat: repeatCount,
        duration: blinkStep / 2,
        onComplete: () => {
          this.alpha = 1;
          this.isInvulnerable = false;
          this.invulnerabilityTween = null;
        },
      });
    } else {
      this.scene.time.delayedCall(durationMs, () => {
        this.isInvulnerable = false;
        this.alpha = 1;
      });
    }
  }

  public takeHit(damage: number = 1): boolean {
    if (this.isRolling || this.isInvulnerable || Date.now() < this.invulnerableUntil || this.motivation <= 0) {
      return false;
    }

    // Exactly 1 segment removed
    this.motivation = Math.max(0, this.motivation - 1);
    console.log(`[MONK HIT] Motivation: ${this.motivation}/${this.maxMotivation}`);

    // Audio: thud + phone notification ding
    soundEngine.playHurt();
    soundEngine.playPhoneDing();

    this.onDamageTaken?.(this.motivation);

    // Camera shake
    if (this.gameScene && this.gameScene.cameras && this.gameScene.cameras.main) {
      this.gameScene.cameras.main.shake(160, 0.008);
    }

    // Exactly 1.5 seconds of invincibility (flashing) after hit
    this.grantInvincibility(1500);

    return true;
  }

  public resetState() {
    this.motivation = this.maxMotivation;
    this.ammo = this.maxAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadProgress = 0;
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollCooldownTimer = 0;
    this.canRoll = true;
    this.isInvulnerable = false;
    this.invulnerableUntil = 0;
    this.alpha = 1;
    if (this.invulnerabilityTween) {
      this.invulnerabilityTween.stop();
      this.invulnerabilityTween = null;
    }
    if (this.reloadPromptText) {
      this.reloadPromptText.setVisible(false);
    }
    this.setTexture('monk_idle');
    this.setVelocity(0, 0);
  }

  /**
   * Collects matcha tea drop: restores 2 motivation segments, plays slurp, and floats notification
   */
  public collectMatcha() {
    this.motivation = Math.min(this.maxMotivation, this.motivation + 2);
    soundEngine.playSlurp();
    this.onDamageTaken?.(this.motivation);

    // Green tea particles
    for (let i = 0; i < 8; i++) {
      const p = this.scene.physics.add.sprite(
        this.x + (Math.random() * 12 - 6),
        this.y + (Math.random() * 12 - 6),
        'particle_matcha'
      );
      const angle = Math.random() * Math.PI * 2;
      p.setVelocity(Math.cos(angle) * 60, Math.sin(angle) * 60);
      p.setDepth(16);
      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.3,
        duration: 350,
        onComplete: () => p.destroy(),
      });
    }

    // Floating text "+2 motivation"
    const text = this.scene.add.text(this.x, this.y - 16, '+2 motivation', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#4ADE80',
      backgroundColor: '#0F172ACC',
      padding: { x: 3, y: 1 },
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(25);
    this.scene.tweens.add({
      targets: text,
      y: this.y - 32,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private createGhostTrail() {
    const ghost = this.scene.add.sprite(this.x, this.y, 'monk_roll');
    ghost.setRotation(this.rotation);
    ghost.setScale(Player.SPRITE_SCALE);
    ghost.setAlpha(0.4);
    ghost.setTint(0xf97316);
    ghost.setDepth(7);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scale: Player.SPRITE_SCALE * 0.8,
      duration: 220,
      onComplete: () => ghost.destroy(),
    });
  }
}
