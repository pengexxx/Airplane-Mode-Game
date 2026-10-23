import Phaser from 'phaser';
import { soundEngine } from '../audio.ts';

export class CoverTable extends Phaser.Physics.Arcade.Sprite {
  public isFlipped: boolean = false;
  public durability: number = 5;
  public isBroken: boolean = false;
  private promptText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'table_h');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body initially

    this.setOrigin(0.5, 0.5);
    this.setDepth(5);

    // Floating interaction prompt
    this.promptText = scene.add.text(x, y - 16, '[E] flip', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FEF08A',
      backgroundColor: '#0F172ACC',
      padding: { x: 3, y: 1 },
    });
    this.promptText.setOrigin(0.5, 0.5);
    this.promptText.setDepth(20);
    this.promptText.setVisible(false);
  }

  public updatePrompt(playerX: number, playerY: number) {
    if (this.isFlipped || this.isBroken) {
      this.promptText.setVisible(false);
      return;
    }
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    this.promptText.setVisible(dist <= 42);
  }

  public flip() {
    if (this.isFlipped || this.isBroken) return;
    this.isFlipped = true;
    this.promptText.setVisible(false);
    this.setTexture('table_flipped_h');
    this.refreshBody();
    soundEngine.playTableFlip();

    // Minor dust puff
    this.createWoodParticles(4);
  }

  public takeBulletHit(): boolean {
    if (!this.isFlipped || this.isBroken) return false;

    this.durability -= 1;
    soundEngine.playHit();
    this.createWoodParticles(3);

    // Flash white
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.durability <= 2 && this.durability > 0) {
      this.setTexture('table_damaged_h');
    }

    if (this.durability <= 0) {
      this.break();
      return true;
    }
    return true;
  }

  private break() {
    this.isBroken = true;
    soundEngine.playTableBreak();
    this.createWoodParticles(16);
    this.promptText.destroy();
    this.destroy();
  }

  private createWoodParticles(count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.scene.physics.add.sprite(
        this.x + (Math.random() * 20 - 10),
        this.y + (Math.random() * 10 - 5),
        'particle_wood'
      );
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      p.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      p.setDepth(15);
      this.scene.tweens.add({
        targets: p,
        alpha: 0,
        scale: 0.2,
        duration: 350 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  destroy(fromScene?: boolean) {
    if (this.promptText && this.promptText.active) {
      this.promptText.destroy();
    }
    super.destroy(fromScene);
  }
}
