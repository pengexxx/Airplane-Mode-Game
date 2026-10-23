import Phaser from 'phaser';

/**
 * Impact effects. Each kind of hit gets its own look so the player can read what happened:
 * - page hits a zombie: torn paper scraps flutter out + cyan/indigo glitch pixels from the phone
 * - page hits a wall: a gray dust puff kicked back off the wall
 * - zombie bullet hits a wall or a flipped table: a short cyan fizzle
 * Emitters are created once per scene and reused with explode(), which is cheap.
 */
export class ImpactEffects {
  private scraps: Phaser.GameObjects.Particles.ParticleEmitter;
  private glitch: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  private fizzle: Phaser.GameObjects.Particles.ParticleEmitter;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scraps = scene.add.particles(0, 0, 'fx_scrap', {
      emitting: false,
      lifespan: { min: 380, max: 620 },
      speed: { min: 45, max: 110 },
      rotate: { min: -180, max: 180 },
      gravityY: 140, // scraps drift down like paper
      scale: { start: 1.6, end: 0.8 },
      alpha: { start: 1, end: 0 },
      tint: [0xfef3c7, 0xffffff, 0xf5e6ca],
    });

    this.glitch = scene.add.particles(0, 0, 'fx_pixel', {
      emitting: false,
      lifespan: { min: 160, max: 280 },
      speed: { min: 80, max: 170 },
      scale: { start: 1.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x38bdf8, 0x818cf8, 0xe879f9],
      blendMode: 'ADD',
    });

    this.dust = scene.add.particles(0, 0, 'fx_pixel', {
      emitting: false,
      lifespan: { min: 220, max: 420 },
      speed: { min: 25, max: 70 },
      scale: { start: 2.2, end: 0.6 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x64748b, 0x94a3b8, 0x475569],
    });

    this.fizzle = scene.add.particles(0, 0, 'fx_pixel', {
      emitting: false,
      lifespan: { min: 120, max: 240 },
      speed: { min: 30, max: 90 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: [0x38bdf8, 0x818cf8],
      blendMode: 'ADD',
    });

    for (const e of [this.scraps, this.glitch, this.dust, this.fizzle]) e.setDepth(16);
  }

  /** Book page tears into a zombie. travelAngle = direction the page was flying. */
  pageHitsEnemy(x: number, y: number, travelAngle: number) {
    const deg = Phaser.Math.RadToDeg(travelAngle);
    // Scraps spray forward through the target, glitch pixels pop in all directions
    this.scraps.updateConfig({ angle: { min: deg - 55, max: deg + 55 } });
    this.scraps.explode(10, x, y);
    this.glitch.updateConfig({ angle: { min: 0, max: 360 } });
    this.glitch.explode(6, x, y);
    this.flash(x, y, 0xfef3c7, 9);
  }

  /** Book page smacks a wall or a flipped table: dust kicks back toward the shooter. */
  pageHitsWall(x: number, y: number, travelAngle: number) {
    const back = Phaser.Math.RadToDeg(travelAngle) + 180;
    this.dust.updateConfig({ angle: { min: back - 70, max: back + 70 } });
    this.dust.explode(10, x, y);
    this.scraps.updateConfig({ angle: { min: back - 40, max: back + 40 } });
    this.scraps.explode(3, x, y);
  }

  /** Zombie eye-wave fizzles out against a wall or cover. */
  enemyShotFizzles(x: number, y: number) {
    this.fizzle.updateConfig({ angle: { min: 0, max: 360 } });
    this.fizzle.explode(7, x, y);
    this.flash(x, y, 0x38bdf8, 5);
  }

  /** Tiny expanding ring that sells the moment of impact. */
  private flash(x: number, y: number, color: number, radius: number) {
    const ring = this.scene.add.circle(x, y, radius, color, 0).setStrokeStyle(1, color, 0.9).setDepth(16);
    this.scene.tweens.add({
      targets: ring,
      scale: 1.8,
      alpha: 0,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}

/** Direction a physics sprite is moving, in radians (falls back to its rotation). */
export function travelAngleOf(sprite: Phaser.Physics.Arcade.Sprite): number {
  const body = sprite.body as Phaser.Physics.Arcade.Body | null;
  if (body && (body.velocity.x !== 0 || body.velocity.y !== 0)) {
    return Math.atan2(body.velocity.y, body.velocity.x);
  }
  return sprite.rotation;
}
