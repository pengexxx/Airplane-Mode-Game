import Phaser from 'phaser';
import { soundEngine } from '../audio.ts';
import { EnemyBullet } from './Bullet.ts';

export class MatchaPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'matcha');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(6);
    // Gentle floating bob
    scene.tweens.add({
      targets: this,
      y: y - 4,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: 'Sine.easeInOut',
    });
  }
}

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  public isDefeated: boolean = false;
  protected shootTimer: number = 0;
  protected shootInterval: number = 2400; // ms
  protected enemyBulletsGroup: Phaser.Physics.Arcade.Group;
  protected isTelegraphing: boolean = false;

  // Callback when enemy drops matcha tea (5% chance)
  public onDropMatcha?: (x: number, y: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    hp: number,
    enemyBullets: Phaser.Physics.Arcade.Group
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = hp;
    this.maxHp = hp;
    this.enemyBulletsGroup = enemyBullets;
    this.setCollideWorldBounds(true);
    this.setDepth(6);
  }

  public takeDamage(damage: number, knockbackAngle: number): boolean {
    if (this.isDefeated) return false;

    this.hp -= damage;
    soundEngine.playHit();

    // White flash
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active && !this.isDefeated) {
        this.clearTint();
      }
    });

    // Knockback
    const knockSpeed = 120;
    this.setVelocity(Math.cos(knockbackAngle) * knockSpeed, Math.sin(knockbackAngle) * knockSpeed);

    // (impact scraps now come from ImpactEffects in GameScene)
    for (let i = 0; i < 0; i++) {
      const p = this.scene.physics.add.sprite(
        this.x + (Math.random() * 10 - 5),
        this.y + (Math.random() * 10 - 5),
        'particle_paper'
      );
      const angle = knockbackAngle + (Math.random() * 1.2 - 0.6);
      p.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70);
      p.setDepth(15);
      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => p.destroy(),
      });
    }

    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    return false;
  }

  public defeat() {
    if (this.isDefeated) return;
    this.isDefeated = true;
    soundEngine.playEnemyDefeat();

    // ~5% chance to drop matcha
    if (Math.random() < 0.05) {
      this.onDropMatcha?.(this.x, this.y);
    }

    // Burst of digital confetti / sparks
    for (let i = 0; i < 14; i++) {
      const spark = this.scene.physics.add.sprite(this.x, this.y, 'particle_spark');
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      spark.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      spark.setDepth(15);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        scale: 0.2,
        duration: 400 + Math.random() * 250,
        onComplete: () => spark.destroy(),
      });
    }

    // Small camera shake
    this.scene.cameras.main.shake(120, 0.005);
    this.destroy();
  }

  abstract updateAI(playerX: number, playerY: number, delta: number): void;
}

export class WalkerEnemy extends BaseEnemy {
  private isTutorial: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemyBullets: Phaser.Physics.Arcade.Group,
    isTutorial: boolean = false
  ) {
    super(scene, x, y, 'walker', isTutorial ? 2 : 3, enemyBullets);
    this.isTutorial = isTutorial;
    // Tutorial zombie fires slowly and waits 2 seconds before attacking
    this.shootInterval = isTutorial ? 3800 : 2400;
    this.shootTimer = isTutorial ? -2000 : -1000;
  }

  updateAI(playerX: number, playerY: number, delta: number) {
    if (this.isDefeated || !this.body) return;

    this.shootTimer += delta;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    // Telegraph 350ms before shot
    if (this.shootTimer >= this.shootInterval - 350 && !this.isTelegraphing) {
      this.isTelegraphing = true;
      this.setTint(0x38bdf8); // Cyan phone flash
    }

    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      this.isTelegraphing = false;
      this.clearTint();
      this.fireBullet(playerX, playerY);
    }

    // Move toward monk
    const baseSpeed = this.isTutorial ? 30 : 50;
    const speed = this.isTelegraphing ? 10 : baseSpeed;
    if (dist > (this.isTutorial ? 70 : 35)) {
      this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    } else {
      this.setVelocity(0, 0);
    }
  }

  private fireBullet(targetX: number, targetY: number) {
    const bullet = new EnemyBullet(this.scene, this.x, this.y);
    this.scene.add.existing(bullet);
    this.enemyBulletsGroup.add(bullet);
    const dirX = targetX - this.x;
    const dirY = targetY - this.y;
    bullet.fire(this.x, this.y, dirX, dirY, this.isTutorial ? 115 : 135);
    soundEngine.playEnemyShoot();
  }
}

export class SprinterEnemy extends BaseEnemy {
  private flankAngle: number = Math.random() * Math.PI * 2;
  private switchTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, enemyBullets: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'sprinter', 2, enemyBullets);
    this.shootInterval = 2100;
    this.shootTimer = -1000;
  }

  updateAI(playerX: number, playerY: number, delta: number) {
    if (this.isDefeated || !this.body) return;

    this.shootTimer += delta;
    this.switchTimer += delta;

    if (this.switchTimer > 1200) {
      this.switchTimer = 0;
      this.flankAngle = (Math.random() - 0.5) * 1.5;
    }

    const directAngle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
    const moveAngle = directAngle + this.flankAngle;

    if (this.shootTimer >= this.shootInterval - 250 && !this.isTelegraphing) {
      this.isTelegraphing = true;
      this.setTint(0xf472b6);
    }

    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      this.isTelegraphing = false;
      this.clearTint();
      this.fireTwinBullets(directAngle);
    }

    const speed = 95;
    this.setVelocity(Math.cos(moveAngle) * speed, Math.sin(moveAngle) * speed);
  }

  private fireTwinBullets(directAngle: number) {
    [-0.15, 0.15].forEach((offset) => {
      const bullet = new EnemyBullet(this.scene, this.x, this.y);
      this.scene.add.existing(bullet);
      this.enemyBulletsGroup.add(bullet);
      const angle = directAngle + offset;
      bullet.fire(this.x, this.y, Math.cos(angle), Math.sin(angle), 145);
    });
    soundEngine.playEnemyShoot();
  }
}

export class TankEnemy extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, enemyBullets: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'tank', 12, enemyBullets);
    this.shootInterval = 3400;
    this.shootTimer = -1500;
  }

  updateAI(playerX: number, playerY: number, delta: number) {
    if (this.isDefeated || !this.body) return;

    this.shootTimer += delta;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);

    // 500ms telegraph for heavy radial burst
    if (this.shootTimer >= this.shootInterval - 500 && !this.isTelegraphing) {
      this.isTelegraphing = true;
      this.setTint(0x38bdf8);
      soundEngine.playTankTelegraph();
      this.scene.tweens.add({
        targets: this,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 220,
        yoyo: true,
      });
    }

    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0;
      this.isTelegraphing = false;
      this.clearTint();
      this.fireRadialRing();
    }

    // Heavy slow march
    const speed = this.isTelegraphing ? 0 : 35;
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private fireRadialRing() {
    const bulletCount = 8;
    for (let i = 0; i < bulletCount; i++) {
      const angle = (i * Math.PI * 2) / bulletCount;
      const bullet = new EnemyBullet(this.scene, this.x, this.y);
      this.scene.add.existing(bullet);
      this.enemyBulletsGroup.add(bullet);
      bullet.fire(this.x, this.y, Math.cos(angle), Math.sin(angle), 125);
    }
    soundEngine.playEnemyShoot();
    this.scene.cameras.main.shake(150, 0.007);
  }

  public defeat() {
    this.scene.cameras.main.shake(300, 0.015);
    super.defeat();
  }
}
