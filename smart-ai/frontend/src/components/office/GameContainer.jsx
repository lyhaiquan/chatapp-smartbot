/**
 * GameContainer.jsx — Mounts the Phaser game into the DOM.
 *
 * Flow:
 *  1. Receives `displayName` (from AuthContext via OfficePage)
 *     and `room` (from OfficeContext)
 *  2. Writes them into the Phaser registry BEFORE launching scenes
 *  3. Instantiates Phaser.Game in a useEffect
 *  4. Destroys the game on unmount (clean navigation back to chat)
 */
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PhaserConfig from '../../game/config';

export default function GameContainer({ displayName, room }) {
    const gameRef = useRef(null);

    useEffect(() => {
        // Prevent double-mount in React StrictMode
        if (gameRef.current) return;

        // Build config with parent tied to our container div
        const config = {
            ...PhaserConfig,
            parent: 'phaser-container',
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;

        // Write shared state into the Phaser registry so scenes can read it
        game.registry.set('displayName', displayName || 'Anon');
        game.registry.set('colyseusRoom', room || null);

        return () => {
            // Clean up Phaser on unmount (e.g. navigating back to chat)
            game.destroy(true);
            gameRef.current = null;
        };
    // We only want this to run once, room/displayName pushed via registry
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the registry in sync if room becomes available after game starts
    useEffect(() => {
        if (gameRef.current && room) {
            gameRef.current.registry.set('colyseusRoom', room);
        }
    }, [room]);

    return (
        <div
            id="phaser-container"
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#111827',
            }}
        />
    );
}
