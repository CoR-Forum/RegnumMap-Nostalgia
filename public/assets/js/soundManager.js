/**
 * Sound Manager Module
 * Handles sound effects and background music for the game
 */
(function() {
  'use strict';

  class SoundManager {
    constructor() {
      this.sounds = {};
      this.music = {};
      this.currentMusic = null;
      this.musicVolume = 0.7;
      this.soundVolume = 0.8;
      this.musicEnabled = true;
      this.soundEnabled = true;
      this.currentRegion = null;
      this.walkStepIndex = 0;
      
      // Initialize audio context (for better control)
      this.audioContext = null;
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        try {
          this.audioContext = new (AudioContext || webkitAudioContext)();
        } catch (e) {
          console.warn('AudioContext not available:', e);
        }
      }
      
      this.initSounds();
    }

    initSounds() {
      // Define sound effect mappings
      const sfxFiles = {
        step1: 'assets/sounds/sfx/step1.mp3',
        step2: 'assets/sounds/sfx/step2.mp3',
        equip: 'assets/sounds/sfx/equip.mp3',
        unequip: 'assets/sounds/sfx/unequip.mp3',
        window_close: 'assets/sounds/sfx/window_close.mp3',
        fort_captured: 'assets/sounds/sfx/fort_captured.mp3'
      };

      // Define music mappings by realm
      const musicFiles = {
        alsius: 'assets/sounds/music/alsius.mp3',
        ignis: 'assets/sounds/music/ignis.mp3',
        syrtis: 'assets/sounds/music/syrtis.mp3',
        warzone: 'assets/sounds/music/warzone.mp3'
      };

      // Preload sound effects
      for (const [key, path] of Object.entries(sfxFiles)) {
        this.loadSound(key, path);
      }

      // Preload music
      for (const [key, path] of Object.entries(musicFiles)) {
        this.loadMusic(key, path);
      }
    }

    loadSound(key, path) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.soundVolume;
      
      // Handle loading errors gracefully
      audio.addEventListener('error', () => {
        console.warn(`Sound file not found: ${path}`);
      });
      
      audio.src = path;
      this.sounds[key] = audio;
    }

    loadMusic(key, path) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = this.musicVolume;
      
      // Handle loading errors gracefully
      audio.addEventListener('error', () => {
        console.warn(`Music file not found: ${path}`);
      });
      
      audio.src = path;
      this.music[key] = audio;
    }

    playSound(soundKey) {
      if (!this.soundEnabled) return;
      
      const sound = this.sounds[soundKey];
      if (!sound) {
        console.warn(`Sound not found: ${soundKey}`);
        return;
      }

      // Clone the audio to allow overlapping sounds
      const clone = sound.cloneNode();
      clone.volume = this.soundVolume;
      
      // Resume AudioContext on user interaction (required by browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      clone.play().catch(err => {
        // Silently fail if autoplay is blocked
        console.debug(`Sound play blocked: ${soundKey}`, err.message);
      });
    }

    playWalkSound() {
      // Alternate between step1 and step2
      const stepKey = this.walkStepIndex % 2 === 0 ? 'step1' : 'step2';
      this.walkStepIndex++;
      this.playSound(stepKey);
    }

    playMusic(musicKey) {
      if (!this.musicEnabled) return;
      
      const newMusic = this.music[musicKey];
      if (!newMusic) {
        console.warn(`Music not found: ${musicKey}`);
        return;
      }

      // If same music is already playing, do nothing
      if (this.currentMusic === newMusic && !newMusic.paused) {
        return;
      }

      // Stop current music
      this.stopMusic();

      // Play new music
      this.currentMusic = newMusic;
      this.currentMusic.volume = this.musicVolume;
      
      // Resume AudioContext on user interaction
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      this.currentMusic.play().catch(err => {
        console.debug(`Music play blocked: ${musicKey}`, err.message);
      });
    }

    stopMusic() {
      if (this.currentMusic) {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }
    }

    setMusicVolume(volume) {
      // volume should be 0-100
      this.musicVolume = Math.max(0, Math.min(100, volume)) / 100;
      
      // Update all music volumes
      for (const music of Object.values(this.music)) {
        music.volume = this.musicVolume;
      }
      
      // Update current music if playing
      if (this.currentMusic) {
        this.currentMusic.volume = this.musicVolume;
      }
    }

    setSoundVolume(volume) {
      // volume should be 0-100
      this.soundVolume = Math.max(0, Math.min(100, volume)) / 100;
      
      // Update all sound volumes
      for (const sound of Object.values(this.sounds)) {
        sound.volume = this.soundVolume;
      }
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = enabled;
      if (!enabled) {
        this.stopMusic();
      } else if (this.currentRegion) {
        // Resume music for current region
        this.updateRegionMusic(this.currentRegion);
      }
    }

    setSoundEnabled(enabled) {
      this.soundEnabled = enabled;
    }

    updateRegionMusic(region) {
      this.currentRegion = region;
      
      if (!this.musicEnabled) return;
      
      // Determine which music to play based on region
      let musicKey = 'warzone'; // default
      
      if (region) {
        // Map region to realm music
        // This is a simplified mapping - adjust based on actual region data
        if (region.realm === 'alsius' || region.name?.toLowerCase().includes('alsius')) {
          musicKey = 'alsius';
        } else if (region.realm === 'ignis' || region.name?.toLowerCase().includes('ignis')) {
          musicKey = 'ignis';
        } else if (region.realm === 'syrtis' || region.name?.toLowerCase().includes('syrtis')) {
          musicKey = 'syrtis';
        }
      }
      
      this.playMusic(musicKey);
    }

    applySettings(settings) {
      if (settings.music_enabled !== undefined) {
        this.setMusicEnabled(Boolean(settings.music_enabled));
      }
      if (settings.sound_enabled !== undefined) {
        this.setSoundEnabled(Boolean(settings.sound_enabled));
      }
      if (settings.music_volume !== undefined) {
        this.setMusicVolume(settings.music_volume);
      }
      if (settings.sound_volume !== undefined) {
        this.setSoundVolume(settings.sound_volume);
      }
    }
  }

  // Create global instance
  window.soundManager = new SoundManager();

  // Export for module use
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
  }
})();
