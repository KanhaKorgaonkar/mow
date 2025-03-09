// Simplified AudioManager for debugging
export class AudioManager {
  constructor() {
    console.log("AudioManager created");
  }
  
  public async initialize() {
    console.log("AudioManager initialized");
    return true;
  }
  
  public playAmbient() {
    console.log("Playing ambient sound");
  }
  
  public playMower() {
    console.log("Playing mower sound");
  }
  
  public pauseMower() {
    console.log("Pausing mower sound");
  }
  
  public playGrassCut() {
    console.log("Playing grass cut sound");
  }
  
  public playDiscovery() {
    console.log("Playing discovery sound");
  }
  
  public playRain() {
    console.log("Playing rain sound");
  }
  
  public pauseRain() {
    console.log("Pausing rain sound");
  }
  
  public playThunder() {
    console.log("Playing thunder sound");
  }
  
  public pauseAll() {
    console.log("Pausing all sounds");
  }
  
  public resumeAll() {
    console.log("Resuming all sounds");
  }
  
  public stopAll() {
    console.log("Stopping all sounds");
  }
}
