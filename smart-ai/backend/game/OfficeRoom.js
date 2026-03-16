/**
 * OfficeRoom.js — Colyseus Room for the multiplayer virtual office.
 *
 * State: a MapSchema of Player objects, keyed by session ID.
 * Clients send "playerMove" messages and receive full state diffs.
 */
const colyseus = require('colyseus');
const schema = require('@colyseus/schema');

const { Schema, MapSchema, type } = schema;

// ── Player schema ────────────────────────────────────────────────
class Player extends Schema {}

// Define typed properties on Player
type('number')(Player.prototype, 'x');
type('number')(Player.prototype, 'y');
type('string')(Player.prototype, 'displayName');
type('string')(Player.prototype, 'avatar');   // color hex e.g. "#3B82F6"

// ── Room state schema ────────────────────────────────────────────
class OfficeState extends Schema {}
type({ map: Player })(OfficeState.prototype, 'players');

// ── OfficeRoom ────────────────────────────────────────────────────
class OfficeRoom extends colyseus.Room {
    maxClients = 50;

    onCreate(options) {
        // Initialise state
        const state = new OfficeState();
        state.players = new MapSchema();
        this.setState(state);

        console.log(`🏢 [OfficeRoom] Created — roomId: ${this.roomId}`);

        // Handle player movement messages
        this.onMessage('playerMove', (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // Clamp to reasonable bounds (2000×2000 office world)
            player.x = Math.max(0, Math.min(2000, Number(data.x) || player.x));
            player.y = Math.max(0, Math.min(2000, Number(data.y) || player.y));
        });

        // Handle chat messages in office
        this.onMessage('officeChat', (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;

            // Broadcast to all other clients
            this.broadcast('officeChatMessage', {
                sessionId: client.sessionId,
                displayName: player.displayName,
                message: String(data.message || '').substring(0, 256),
                timestamp: Date.now(),
            }, { except: client });

            // Echo back to sender too
            client.send('officeChatMessage', {
                sessionId: client.sessionId,
                displayName: player.displayName,
                message: String(data.message || '').substring(0, 256),
                timestamp: Date.now(),
            });
        });
    }

    onJoin(client, options) {
        // Assign a random spawn position and a colour avatar
        const AVATARS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
        const player = new Player();

        // Spawn randomly in the 400–1600 range to avoid edges
        player.x = Math.floor(Math.random() * 1200) + 400;
        player.y = Math.floor(Math.random() * 1200) + 400;
        player.displayName = (options && options.displayName)
            ? String(options.displayName).substring(0, 32)
            : `Player-${client.sessionId.substring(0, 4)}`;
        player.avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

        this.state.players.set(client.sessionId, player);

        console.log(`👤 [OfficeRoom] ${player.displayName} joined (${client.sessionId}). Total: ${this.state.players.size}`);
    }

    onLeave(client, consented) {
        const player = this.state.players.get(client.sessionId);
        const name = player ? player.displayName : client.sessionId;

        this.state.players.delete(client.sessionId);
        console.log(`👋 [OfficeRoom] ${name} left. Total: ${this.state.players.size}`);
    }

    onDispose() {
        console.log(`🗑️  [OfficeRoom] Disposed — roomId: ${this.roomId}`);
    }
}

module.exports = { OfficeRoom };
