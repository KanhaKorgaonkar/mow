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
        html5: true, // Try using HTML5 Audio for better compatibility
        onload: () => {
          console.log("Mower sound loaded successfully");
          this.soundsLoaded = true;
        },
        onloaderror: (id, error) => {
          console.error("Error loading mower sound:", error);
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
      
      // Create other sound effects based on the mower sound
      this.sounds.grassCut = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.2,
        rate: 1.8,  // Higher pitch for a quick cut sound
        html5: true,
        sprite: {
          short: [2000, 300] // Create a 300ms sprite starting at 2 seconds in
        }
      });
      
      this.sounds.discovery = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.3,
        rate: 0.6,  // Lower pitch for discovery sound
        html5: true,
        sprite: {
          medium: [0, 800] // Create an 800ms sprite for medium length
        }
      });
      
      // Simple ambient sounds
      this.sounds.rain = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.1,
        rate: 0.4,  // Much lower pitch for rain effect
        loop: true,
        html5: true
      });
      
      // Thunder sound effect
      this.sounds.thunder = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.2,
        rate: 0.3,  // Very low pitch for thunder
        html5: true,
        sprite: {
          rumble: [1000, 2000] // 2 second rumble
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
}
