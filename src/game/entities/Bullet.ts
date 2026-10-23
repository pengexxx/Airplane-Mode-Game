import Phaser from 'phaser';

export class PlayerBullet extends Phaser.Physics.Arcade.Sprite {
  private flutterPhase: number = Math.random() * Math.PI * 2;
  private baseAngle: number = 0;
  private lifeTime: number = 0;
  private maxLifeTime: number = 1800; // ms

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'page_projectile');
  }

  public fire(x: number, y: number, targetAngle: number, speed: number = 360) {
    this.enableBody(true, x, y, true, true);
    this.baseAngle = targetAngle;
    this.setRotation(targetAngle);
    this.lifeTime = 0;
    this.flutterPhase = Math.random() * Math.PI * 2;

    const vx = Math.cos(targetAngle) * speed;
    const vy = Math.sin(targetAngle) * speed;
    this.setVelocity(vx, vy);
    this.setDepth(10);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.lifeTime += delta;
    if (this.lifeTime >= this.maxLifeTime) {
      this.destroy();
      return;
    }
    // Subtle flutter wobble
    this.flutterPhase += delta * 0.015;
    this.setRotation(this.baseAngle + Math.sin(this.flutterPhase) * 0.15);
  }
}

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  private lifeTime: number = 0;
  private maxLifeTime: number = 3000;
  private waveSpeed: number = 0.008;
  private waveAmplitude: number = 12;
  private baseDirX: number = 0;
  private baseDirY: number = 0;
  private speed: number = 140;
  private traveled: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'phone_wave');
  }

  public fire(x: number, y: number, dirX: number, dirY: number, speed: number = 140) {
    this.enableBody(true, x, y, true, true);
    this.lifeTime = 0;
    this.traveled = 0;
    this.speed = speed;

    const len = Math.hypot(dirX, dirY) || 1;
    this.baseDirX = dirX / len;
    this.baseDirY = dirY / len;

    this.setVelocity(this.baseDirX * speed, this.baseDirY * speed);
    this.setDepth(10);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.lifeTime += delta;
    this.traveled += delta;

    if (this.lifeTime >= this.maxLifeTime) {
      this.destroy();
      return;
    }

    // Subtle sinusoidal wave drift perpendicular to motion
    const perpX = -this.baseDirY;
    const perpY = this.baseDirX;
    const wiggle = Math.sin(this.traveled * this.waveSpeed) * this.waveAmplitude;

    this.setVelocity(
      this.baseDirX * this.speed + perpX * wiggle,
      this.baseDirY * this.speed + perpY * wiggle
    );
  }
}
