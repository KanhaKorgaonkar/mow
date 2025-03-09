import { Howl, Howler } from 'howler';

export class AudioManager {
  private sounds: {
    ambient: Howl | null;
    mower: Howl | null;
    grassCut: Howl | null;
    discovery: Howl | null;
    rain: Howl | null;
    thunder: Howl | null;
  };
  
  constructor() {
    this.sounds = {
      ambient: null,
      mower: null,
      grassCut: null,
      discovery: null,
      rain: null,
      thunder: null
    };
  }
  
  public async initialize() {
    // Load audio files
    this.sounds.ambient = new Howl({
      src: ['https://assets.codepen.io/123446/birds-nature-ambient.mp3'],
      loop: true,
      volume: 0.3,
      html5: true
    });
    
    this.sounds.mower = new Howl({
      src: ['https://assets.codepen.io/123446/lawn-mower-engine.mp3'],
      loop: true,
      volume: 0.5,
      html5: true
    });
    
    this.sounds.grassCut = new Howl({
      src: ['https://assets.codepen.io/123446/grass-cut.mp3'],
      volume: 0.4,
      html5: true
    });
    
    this.sounds.discovery = new Howl({
      src: ['https://assets.codepen.io/123446/discovery-chime.mp3'],
      volume: 0.5,
      html5: true
    });
    
    this.sounds.rain = new Howl({
      src: ['https://assets.codepen.io/123446/rain-sound.mp3'],
      loop: true,
      volume: 0.4,
      html5: true
    });
    
    this.sounds.thunder = new Howl({
      src: ['https://assets.codepen.io/123446/thunder-crack.mp3'],
      volume: 0.6,
      html5: true
    });
    
    return true;
  }
  
  public playAmbient() {
    if (this.sounds.ambient) {
      this.sounds.ambient.play();
    }
  }
  
  public playMower() {
    if (this.sounds.mower) {
      this.sounds.mower.play();
    }
  }
  
  public pauseMower() {
    if (this.sounds.mower) {
      this.sounds.mower.pause();
    }
  }
  
  public playGrassCut() {
    if (this.sounds.grassCut) {
      // Clone to allow multiple overlapping sounds
      this.sounds.grassCut.play();
    }
  }
  
  public playDiscovery() {
    if (this.sounds.discovery) {
      this.sounds.discovery.play();
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
    Object.values(this.sounds).forEach(sound => {
      if (sound) {
        sound.stop();
      }
    });
  }
}
