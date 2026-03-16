/**
 * OfficeContext.jsx — Colyseus client for the virtual office.
 *
 * Responsibilities:
 *  1. Connect to the Colyseus game server at ws://localhost:2567
 *  2. Read `user.name` from AuthContext → use as displayName in the room
 *  3. Expose { room, players, connected } so GameContainer can pass
 *     the live room reference into the Phaser scene registry
 *
 * This is the SHARED STATE BRIDGE: the chat app username flows into
 * the avatar name without any extra configuration.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Colyseus from 'colyseus.js';
import { useAuth } from '../hooks/useAuth';

export const OfficeContext = createContext(null);

export function OfficeProvider({ children }) {
    const { user } = useAuth();
    const clientRef = useRef(null);
    const [room, setRoom] = useState(null);
    const [connected, setConnected] = useState(false);
    const [playerCount, setPlayerCount] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        let mounted = true;

        const connect = async () => {
            try {
                // Determine Colyseus server URL:
                // In dev the Vite proxy forwards /colyseus → ws://localhost:2567
                // In production, set VITE_COLYSEUS_URL in .env
                const wsUrl = import.meta.env.VITE_COLYSEUS_URL || 'ws://localhost:2567';

                const client = new Colyseus.Client(wsUrl);
                clientRef.current = client;

                // displayName from AuthContext — the shared-state bridge
                const displayName =
                    user.name ||
                    user.username ||
                    user.email?.split('@')[0] ||
                    'Anonymous';

                const joinedRoom = await client.joinOrCreate('office', { displayName });

                if (!mounted) {
                    joinedRoom.leave();
                    return;
                }

                setRoom(joinedRoom);
                setConnected(true);
                setError(null);

                // Track live player count
                joinedRoom.state.players.onAdd(() => {
                    if (mounted) setPlayerCount(joinedRoom.state.players.size);
                });
                joinedRoom.state.players.onRemove(() => {
                    if (mounted) setPlayerCount(joinedRoom.state.players.size);
                });

                joinedRoom.onLeave(() => {
                    if (mounted) setConnected(false);
                });

                joinedRoom.onError((code, message) => {
                    console.error('[Office] Room error:', code, message);
                    if (mounted) setError(`Room error ${code}: ${message}`);
                });
            } catch (err) {
                console.warn('[Office] Could not connect to Colyseus:', err.message);
                if (mounted) {
                    setConnected(false);
                    setError('Could not connect to game server. Offline mode.');
                }
            }
        };

        connect();

        return () => {
            mounted = false;
            if (room) {
                room.leave();
            }
            setRoom(null);
            setConnected(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]); // reconnect only on user switch, not on every render

    return (
        <OfficeContext.Provider value={{ room, connected, playerCount, error }}>
            {children}
        </OfficeContext.Provider>
    );
}

export function useOffice() {
    const ctx = useContext(OfficeContext);
    if (!ctx) throw new Error('useOffice must be used inside <OfficeProvider>');
    return ctx;
}
