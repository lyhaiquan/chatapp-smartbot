/**
 * Preloader.js — Loads all game assets before the main scene.
 *
 * Assets are expected under /public/office-assets/.
 * Because we ship placeholder graphics, we generate them
 * programmatically and only load real files if they exist.
 */
export default class Preloader extends Phaser.Scene {
    constructor() {
        super({ key: 'Preloader' });
    }

    preload() {
        // ── Progress bar ─────────────────────────────────────────
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const barBg = this.add.rectangle(width / 2, height / 2, 320, 20, 0x374151);
        const bar = this.add.rectangle(width / 2 - 160, height / 2, 0, 20, 0x6366F1);
        bar.setOrigin(0, 0.5);

        const label = this.add.text(width / 2, height / 2 + 30, 'Loading Office...', {
            fontSize: '16px',
            fill: '#9CA3AF',
            fontFamily: 'Inter, sans-serif',
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            bar.width = 320 * value;
        });

        // ── Attempt to load real SkyOffice-compatible assets ─────
        // Place your real tileset/spritesheet under:
        //   public/office-assets/tileset.png
        //   public/office-assets/tilemap.json
        //   public/office-assets/characters.png
        // They will be used if present; otherwise placeholders are used.
        this.load.image('tileset', '/office-assets/tileset.png');
        this.load.tilemapTiledJSON('tilemap', '/office-assets/tilemap.json');
        this.load.spritesheet('characters', '/office-assets/characters.png', {
            frameWidth: 32,
            frameHeight: 48,
        });
    }

    create() {
        // If real assets failed to load (404), that's fine—
        // OfficeScene will fall back to procedural graphics.
        this.scene.start('OfficeScene');
    }
}
