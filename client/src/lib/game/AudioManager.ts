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
      
      // Load the actual lawnmower sound file
      this.sounds.mower = new Howl({
        src: ['/audio/lawnmower.mp3'],
        loop: true,
        volume: 0.7,
        rate: 1.0,
        preload: true,
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
          }, 10);
        }
      });
      
      // Create other sounds from the same file with different rates
      this.sounds.grassCut = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.3,
        rate: 1.5,  // Higher pitch
        sprite: {
          short: [0, 300] // Create a 300ms sprite for the short clip
        }
      });
      
      this.sounds.discovery = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.5,
        rate: 0.8,  // Lower pitch
        sprite: {
          medium: [0, 1000] // Create a 1000ms sprite for medium length
        }
      });
      
      this.sounds.rain = new Howl({
        src: ['/audio/lawnmower.mp3'],
        volume: 0.2,
        rate: 0.5,  // Much lower pitch
        loop: true
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
      this.sounds.thunder.play();
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
