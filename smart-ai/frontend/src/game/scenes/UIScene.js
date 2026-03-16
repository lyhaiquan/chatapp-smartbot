/**
 * UIScene.js — Runs in parallel with OfficeScene to render HUD.
 * Uses a fixed camera so it always overlays the game viewport.
 */
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this._playerCountText = null;
        this._helpText = null;
    }

    create() {
        // Fixed camera — HUD elements stay on screen regardless of scrolling
        this.cameras.main.setScroll(0, 0);

        // Player count badge (bottom-left)
        this._playerCountText = this.add.text(12, this.scale.height - 40, '👥 1 online', {
            fontSize: '13px',
            fill: '#9CA3AF',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#111827CC',
            padding: { x: 8, y: 4 },
        });

        // Controls help (bottom-right)
        this._helpText = this.add.text(
            this.scale.width - 12,
            this.scale.height - 40,
            '🕹 WASD / Arrow Keys to move',
            {
                fontSize: '12px',
                fill: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                backgroundColor: '#111827CC',
                padding: { x: 8, y: 4 },
            }
        ).setOrigin(1, 0);

        // Office name badge (top-left)
        this.add.text(12, 12, '🏢 Virtual Office', {
            fontSize: '15px',
            fill: '#E5E7EB',
            fontFamily: 'Inter, sans-serif',
            fontStyle: 'bold',
            backgroundColor: '#1F2937CC',
            padding: { x: 10, y: 6 },
        });

        // Resize listener
        this.scale.on('resize', this._onResize, this);
    }

    update() {
        // Poll remote player count from OfficeScene's room
        const officeScene = this.scene.get('OfficeScene');
        if (officeScene?.room?.state?.players) {
            const count = officeScene.room.state.players.size;
            this._playerCountText?.setText(`👥 ${count} online`);
        }
    }

    _onResize(gameSize) {
        if (this._helpText) {
            this._helpText.setPosition(gameSize.width - 12, gameSize.height - 40);
        }
        if (this._playerCountText) {
            this._playerCountText.setPosition(12, gameSize.height - 40);
        }
    }
}
