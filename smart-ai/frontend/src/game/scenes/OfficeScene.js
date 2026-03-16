/**
 * OfficeScene.js — Main Phaser game scene for the virtual office.
 *
 * Architecture:
 *  - Reads `displayName` and `colyseusRoom` from the Phaser registry
 *    (set by GameContainer.jsx before the game boots)
 *  - Draws a procedural office floor with rooms as fallback graphics
 *    (real SkyOffice tilemap can be swapped in via /office-assets/)
 *  - Syncs remote players via Colyseus state changes
 *  - Handles local player movement via arrow keys / WASD
 */
export default class OfficeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OfficeScene' });

        // Local player
        this.localPlayer = null;
        this.localName = '';
        this.localNameTag = null;

        // Remote players: sessionId → { body, nameTag }
        this.remotePlayers = new Map();

        // Colyseus room reference
        this.room = null;

        // Input
        this.cursors = null;
        this.wasd = null;

        // Player speed (px / frame)
        this.SPEED = 160;
    }

    // ── Lifecycle ───────────────────────────────────────────────────

    create() {
        // Retrieve shared state from Phaser registry (set by GameContainer)
        this.localName = this.registry.get('displayName') || 'You';
        this.room = this.registry.get('colyseusRoom');

        // ── World bounds (2000×2000) ──────────────────────────────
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.cameras.main.setBounds(0, 0, 2000, 2000);

        // ── Draw procedural office floor ──────────────────────────
        this._drawOfficeFloor();

        // ── Spawn local player in centre ──────────────────────────
        this.localPlayer = this.add.circle(1000, 1000, 18, this._hexToInt('#6366F1'));
        this.physics.add.existing(this.localPlayer);
        this.localPlayer.body.setCollideWorldBounds(true);
        this.localPlayer.body.setCircle(18);

        this.localNameTag = this._makeNameTag(this.localName, '#A5B4FC');

        this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);

        // ── Input ─────────────────────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });

        // ── Colyseus integration ──────────────────────────────────
        if (this.room) {
            this._attachColyseusListeners();
        } else {
            // Retry — room may not be ready yet
            this.time.addEvent({
                delay: 500,
                callback: () => {
                    this.room = this.registry.get('colyseusRoom');
                    if (this.room) this._attachColyseusListeners();
                },
                loop: true,
                callbackScope: this,
                repeat: 10,
            });
        }

        // Start UI scene in parallel
        this.scene.launch('UIScene');
    }

    update() {
        if (!this.localPlayer) return;

        const body = this.localPlayer.body;
        body.setVelocity(0);

        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;

        if (left) body.setVelocityX(-this.SPEED);
        else if (right) body.setVelocityX(this.SPEED);
        if (up) body.setVelocityY(-this.SPEED);
        else if (down) body.setVelocityY(this.SPEED);

        // Normalise diagonal movement
        body.velocity.normalize().scale(this.SPEED);

        // Update name tag position
        if (this.localNameTag) {
            this.localNameTag.setPosition(
                this.localPlayer.x,
                this.localPlayer.y - 28,
            );
        }

        // Send position to server (throttled via dirty flag)
        this._syncPosition();
    }

    // ── Colyseus listeners ──────────────────────────────────────────

    _attachColyseusListeners() {
        const room = this.room;

        // When remote players join / update
        room.state.players.onAdd((player, sessionId) => {
            // Skip our own player (server mirrors us too)
            if (sessionId === room.sessionId) return;

            const color = this._hexToInt(player.avatar || '#EC4899');
            const body = this.add.circle(player.x, player.y, 18, color);
            const nameTag = this._makeNameTag(player.displayName, player.avatar || '#FCA5A5');
            this.remotePlayers.set(sessionId, { body, nameTag });

            // Listen for position changes on this player
            player.onChange(() => {
                const rp = this.remotePlayers.get(sessionId);
                if (!rp) return;
                // Smooth interpolation
                this.tweens.add({
                    targets: rp.body,
                    x: player.x, y: player.y,
                    duration: 100,
                    ease: 'Linear',
                });
                rp.nameTag.setPosition(player.x, player.y - 28);
            });
        });

        // When remote players leave
        room.state.players.onRemove((_player, sessionId) => {
            const rp = this.remotePlayers.get(sessionId);
            if (!rp) return;
            rp.body.destroy();
            rp.nameTag.destroy();
            this.remotePlayers.delete(sessionId);
        });
    }

    // ── Throttled position sync ─────────────────────────────────────

    _lastSendTime = 0;

    _syncPosition() {
        if (!this.room) return;
        const now = Date.now();
        if (now - this._lastSendTime < 50) return; // ~20 Hz
        this._lastSendTime = now;
        this.room.send('playerMove', {
            x: Math.round(this.localPlayer.x),
            y: Math.round(this.localPlayer.y),
        });
    }

    // ── Procedural floor drawing ────────────────────────────────────

    _drawOfficeFloor() {
        const g = this.add.graphics();

        // Background floor
        g.fillStyle(0x111827, 1);
        g.fillRect(0, 0, 2000, 2000);

        // Floor tiles (subtle grid)
        g.lineStyle(1, 0x1F2937, 1);
        for (let x = 0; x < 2000; x += 64) {
            g.lineBetween(x, 0, x, 2000);
        }
        for (let y = 0; y < 2000; y += 64) {
            g.lineBetween(0, y, 2000, y);
        }

        // Office rooms
        const rooms = [
            { x: 100, y: 100, w: 400, h: 300, label: '🖥 Dev Room', color: 0x1E3A5F },
            { x: 600, y: 100, w: 300, h: 300, label: '☕ Lounge', color: 0x3B1F2B },
            { x: 1000, y: 100, w: 400, h: 300, label: '📊 Board Room', color: 0x1B3F2F },
            { x: 100, y: 500, w: 300, h: 300, label: '🎨 Design Hub', color: 0x3B2B1B },
            { x: 500, y: 500, w: 500, h: 300, label: '🗣 Open Space', color: 0x1A1A2E },
            { x: 1100, y: 500, w: 350, h: 300, label: '🔒 Private', color: 0x2D1B2E },
            { x: 100, y: 900, w: 600, h: 300, label: '📚 Library', color: 0x1F2F1F },
            { x: 800, y: 900, w: 350, h: 300, label: '🎮 Game Room', color: 0x2D1B1B },
        ];

        rooms.forEach(({ x, y, w, h, label, color }) => {
            // Room fill
            g.fillStyle(color, 1);
            g.fillRect(x, y, w, h);

            // Room border
            g.lineStyle(2, 0x374151, 1);
            g.strokeRect(x, y, w, h);

            // Room label
            this.add.text(x + w / 2, y + h / 2, label, {
                fontSize: '14px',
                fill: '#6B7280',
                fontFamily: 'Inter, sans-serif',
                align: 'center',
            }).setOrigin(0.5);
        });

        // Walkways (lighter strips between rooms)
        g.fillStyle(0x1C2533, 1);
        g.fillRect(450, 0, 100, 2000); // vertical corridor
        g.fillRect(0, 450, 2000, 100); // horizontal corridor

        // Spawn area glow at centre
        g.fillStyle(0x4F46E5, 0.08);
        g.fillCircle(1000, 1000, 80);
        this.add.text(1000, 950, '📍 Spawn', {
            fontSize: '12px',
            fill: '#6366F1',
            fontFamily: 'Inter, sans-serif',
        }).setOrigin(0.5);
    }

    // ── Helpers ─────────────────────────────────────────────────────

    _makeNameTag(name, colorHex = '#E5E7EB') {
        return this.add.text(0, 0, name, {
            fontSize: '12px',
            fill: colorHex,
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#00000099',
            padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
    }

    _hexToInt(hex) {
        return parseInt(hex.replace('#', ''), 16);
    }
}
