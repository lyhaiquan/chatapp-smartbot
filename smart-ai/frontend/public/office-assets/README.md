# Office Assets Directory

Place your real SkyOffice-compatible assets here. The Phaser `Preloader` scene
will automatically load them if present. If they're missing (404), the engine
falls back to procedural placeholder graphics.

## Expected File Structure

```
public/office-assets/
├── tileset.png          # Tileset image (e.g. from SkyOffice / itch.io)
├── tilemap.json         # Tiled map JSON export
├── characters.png       # Spritesheet: 32×48 px per frame, rows = directions
└── README.md            # This file
```

## Tileset Requirements

| Property | Value |
|---|---|
| Tile size | 32 × 32 px |
| Format | PNG |
| Tiled export | JSON (not CSV) |

## Character Spritesheet Requirements

| Property | Value |
|---|---|
| Frame size | 32 × 48 px |
| Columns | 3 (walk frames) |
| Rows | 4 (down, left, right, up) |

## Recommended Free Assets

- [LPC Character Sprites](https://lpc.opengameart.org/) — OpenGameArt (CC-BY-SA)
- [Tiny Town Tileset](https://kenney.nl/assets/tiny-town) — Kenney.nl (CC0)
