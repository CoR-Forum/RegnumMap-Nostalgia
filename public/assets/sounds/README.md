# Sound Assets

This directory contains audio files for the game's sound system.

## Directory Structure

- `sfx/` - Sound effects
- `music/` - Background music for regions

## Sound Effects (sfx/)

Place the following sound effect files in the `sfx/` directory:

- `step1.mp3` - First walking step sound
- `step2.mp3` - Second walking step sound (alternates with step1)
- `equip.mp3` - Sound when equipping an item
- `unequip.mp3` - Sound when unequipping an item
- `window_close.mp3` - Sound when closing a window/dialog
- `fort_captured.mp3` - Sound when a fort changes ownership

## Background Music (music/)

Place region-specific background music files in the `music/` directory.
Each realm should have its own music file:

- `alsius.mp3` - Music for Alsius regions
- `ignis.mp3` - Music for Ignis regions
- `syrtis.mp3` - Music for Syrtis regions
- `warzone.mp3` - Music for contested/warzone areas (optional)

## Audio Format

- Format: MP3 (recommended for broad browser support)
- Sample rate: 44.1kHz recommended
- Bit rate: 128-192 kbps for music, 64-128 kbps for SFX

## Note

Currently, placeholder files are used. Replace these with actual audio files to enable sound in the game.
