/**
 * config.js — Phaser 3 game configuration.
 * Imported once when GameContainer mounts the game.
 */
import Preloader from './scenes/Preloader';
import OfficeScene from './scenes/OfficeScene';
import UIScene from './scenes/UIScene';

/** @type {Phaser.Types.Core.GameConfig} */
const PhaserConfig = {
    type: Phaser.AUTO,
    parent: 'phaser-container',   // mount inside <div id="phaser-container">
    backgroundColor: '#1F2937',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [Preloader, OfficeScene, UIScene],
    // Reduce pixel ratio on hi-DPI for performance
    pixelArt: true,
    antialias: false,
};

export default PhaserConfig;
