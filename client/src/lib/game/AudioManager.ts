import { Howl, Howler } from 'howler';

export class AudioManager {
  private sounds: {
    mower?: Howl;
    grassCut?: Howl;
    discovery?: Howl;
    rain?: Howl;
    thunder?: Howl;
    ambient?: Howl;
  } = {};
  
  private isMowerPlaying: boolean = false;
  private soundsLoaded: boolean = false;
  private masterMuted: boolean = false;
  private previousVolume: number = 1.0;

  constructor() {
    console.log("AudioManager created");
  }
  
  public async initialize() {
    try {
      console.log("AudioManager initializing...");
      
      // Load the lawnmower sound file
      this.sounds.mower = new Howl({
        src: ['/audio/lawnmower.mp3'],
        loop: true,
        volume: 0.4, // Lower volume to avoid overpowering
        rate: 0.9, // Slightly lower pitch for a more natural sound
        preload: true,
        html5: false, // Use Web Audio API as the primary, fallback to HTML5 Audio
        onload: () => {
          console.log("Mower sound loaded successfully");
          this.soundsLoaded = true;
        },
        onloaderror: (id, error) => {
          console.error("Error loading mower sound:", error);
          // Create a fallback silent sound so the game can continue without audio
          this.soundsLoaded = true; // Mark as loaded even if there's an error
        },
        onplayerror: (id, error) => {
          console.error("Error playing mower sound:", error);
          // Try unlocking audio
          Howler.volume(0);
          setTimeout(() => {
            Howler.volume(1);
          }, 100);
        }
      });
      
      // Create other sound effects based on the mower sound with better error handling
      this.sounds.grassCut = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.2,
        rate: 1.8,  // Higher pitch for a quick cut sound
        html5: false, // Use Web Audio API for better performance
        sprite: {
          short: [2000, 300] // Create a 300ms sprite starting at 2 seconds in
        },
        onloaderror: (id, error) => {
          console.log("Non-critical: Error loading grass cut sound");
        }
      });
      
      this.sounds.discovery = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.3,
        rate: 0.6,  // Lower pitch for discovery sound
        html5: false, // Use Web Audio API for better performance
        sprite: {
          medium: [0, 800] // Create an 800ms sprite for medium length
        },
        onloaderror: (id, error) => {
          console.log("Non-critical: Error loading discovery sound");
        }
      });
      
      // Simple ambient sounds
      this.sounds.rain = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.1,
        rate: 0.4,  // Much lower pitch for rain effect
        loop: true,
        html5: false, // Use Web Audio API for better performance
        onloaderror: (id, error) => {
          console.log("Non-critical: Error loading rain sound");
        }
      });
      
      // Thunder sound effect
      this.sounds.thunder = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.2,
        rate: 0.3,  // Very low pitch for thunder
        html5: false, // Use Web Audio API for better performance
        sprite: {
          rumble: [1000, 2000] // 2 second rumble
        },
        onloaderror: (id, error) => {
          console.log("Non-critical: Error loading thunder sound");
        }
      });
      
      console.log("AudioManager initialized");
      return true;
    } catch (error) {
      console.error("Error initializing AudioManager:", error);
      return false;
    }
  }
  
  public playAmbient() {
    if (this.sounds.ambient) {
      this.sounds.ambient.play();
    }
  }
  
  public playMower() {
    if (this.sounds.mower && !this.isMowerPlaying) {
      this.sounds.mower.play();
      this.isMowerPlaying = true;
    }
  }
  
  public pauseMower() {
    if (this.sounds.mower && this.isMowerPlaying) {
      this.sounds.mower.pause();
      this.isMowerPlaying = false;
    }
  }
  
  public playGrassCut() {
    if (this.sounds.grassCut) {
      // Play a fresh instance to allow overlapping sounds
      this.sounds.grassCut.play('short');
    }
  }
  
  public playDiscovery() {
    if (this.sounds.discovery) {
      this.sounds.discovery.play('medium');
    }
  }
  
  public playRain() {
    if (this.sounds.rain) {
      this.sounds.rain.play();
    }
  }
  
  public pauseRain() {
    if (this.sounds.rain) {
      this.sounds.rain.pause();
    }
  }
  
  public playThunder() {
    if (this.sounds.thunder) {
      this.sounds.thunder.play('rumble');
    }
  }
  
  public pauseAll() {
    Howler.volume(0);
  }
  
  public resumeAll() {
    Howler.volume(1);
  }
  
  public stopAll() {
    Howler.stop();
    this.isMowerPlaying = false;
  }
  
  // Sound toggle functions
  public toggleMute() {
    if (this.masterMuted) {
      // Unmute - restore previous volume
      Howler.volume(this.previousVolume);
      this.masterMuted = false;
    } else {
      // Mute - save current volume and set to 0
      this.previousVolume = Howler.volume();
      Howler.volume(0);
      this.masterMuted = true;
    }
    return this.masterMuted;
  }
  
  public isMuted(): boolean {
    return this.masterMuted;
  }
  
  public setVolume(volume: number) {
    // Ensure volume is between 0 and 1
    const safeVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(safeVolume);
    this.previousVolume = safeVolume;
    this.masterMuted = (safeVolume === 0);
    return safeVolume;
  }
  
  public getVolume(): number {
    return Howler.volume();
  }
}
