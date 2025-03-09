import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';
import { GrassSystem } from './GrassSystem';
import { WeatherSystem } from './WeatherSystem';
import { LawnMower } from './LawnMower';
import { PlayerControls } from './PlayerControls';
import { SceneryGenerator } from './SceneryGenerator';
import { AudioManager } from './AudioManager';

interface GameManagerOptions {
  container: HTMLElement;
  onProgress: (progress: number) => void;
  onMowed: (totalArea: number) => void;
  onWeatherChange: (weather: string) => void;
  onTimeChange: (time: string) => void;
  onSceneryDiscovered: (scenery: string) => void;
}

export class GameManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private terrain: TerrainGenerator;
  private grassSystem: GrassSystem;
  private weatherSystem: WeatherSystem;
  private lawnMower: LawnMower;
  private playerControls: PlayerControls;
  private sceneryGenerator: SceneryGenerator;
  private audioManager: AudioManager;
  private callbacks: {
    onProgress: (progress: number) => void;
    onMowed: (totalArea: number) => void;
    onWeatherChange: (weather: string) => void;
    onTimeChange: (time: string) => void;
    onSceneryDiscovered: (scenery: string) => void;
  };
  private isRunning: boolean = false;
  private gameStarted: boolean = false;
  private mowerRunning: boolean = false;
  private totalAreaMowed: number = 0;
  
  constructor(options: GameManagerOptions) {
    this.callbacks = {
      onProgress: options.onProgress,
      onMowed: options.onMowed,
      onWeatherChange: options.onWeatherChange,
      onTimeChange: options.onTimeChange,
      onSceneryDiscovered: options.onSceneryDiscovered
    };
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    options.container.appendChild(this.renderer.domElement);
    
    // Initialize clock for animation
    this.clock = new THREE.Clock();
    
    // Initialize systems
    this.terrain = new TerrainGenerator(this.scene, 150, 150); // Larger initial area for better generation
    this.grassSystem = new GrassSystem(this.scene, this.terrain);
    this.weatherSystem = new WeatherSystem(this.scene, (weather) => {
      this.callbacks.onWeatherChange(weather);
    }, (time) => {
      this.callbacks.onTimeChange(time);
    });
    this.lawnMower = new LawnMower(this.scene, this.terrain);
    this.playerControls = new PlayerControls(this.camera, this.lawnMower);
    this.sceneryGenerator = new SceneryGenerator(this.scene, this.terrain, (scenery) => {
      this.callbacks.onSceneryDiscovered(scenery);
    });
    this.audioManager = new AudioManager();
    
    // Set up camera
    this.camera.position.set(0, 1.7, 5); // Typical standing height
    this.scene.add(this.lawnMower.getObject());
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initialize progress
    this.callbacks.onProgress(0.1);
    
    // Preload necessary assets and initialize scene
    this.preloadAssets();
  }
  
  private preloadAssets() {
    // Simulate asset loading with progress
    Promise.all([
      this.terrain.initialize(),
      this.grassSystem.initialize(),
      this.weatherSystem.initialize(),
      this.lawnMower.initialize(),
      this.sceneryGenerator.initialize(),
      this.audioManager.initialize()
    ]).then(() => {
      this.callbacks.onProgress(1);
    }).catch(error => {
      console.error("Error initializing game:", error);
    });
  }
  
  private handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  public startGame() {
    this.gameStarted = true;
    this.isRunning = true;
    this.mowerRunning = true;
    
    // Start audio
    this.audioManager.playAmbient();
    if (this.mowerRunning) {
      this.audioManager.playMower();
    }
    
    // Lock pointer for first-person control
    this.playerControls.lock();
  }
  
  public pauseGame() {
    this.isRunning = false;
    this.audioManager.pauseAll();
    this.playerControls.unlock();
  }
  
  public resumeGame() {
    this.isRunning = true;
    this.audioManager.resumeAll();
    this.playerControls.lock();
  }
  
  public resetGame() {
    this.isRunning = false;
    this.gameStarted = false;
    this.mowerRunning = false;
    this.totalAreaMowed = 0;
    
    // Reset all systems
    this.terrain.reset();
    this.grassSystem.reset();
    this.weatherSystem.reset();
    this.lawnMower.reset();
    this.sceneryGenerator.reset();
    this.audioManager.stopAll();
    
    // Reset camera position
    this.camera.position.set(0, 1.7, 5);
    this.camera.lookAt(0, 1.7, 0);
    
    this.callbacks.onMowed(0);
    this.playerControls.unlock();
  }
  
  public toggleMower() {
    this.mowerRunning = !this.mowerRunning;
    
    if (this.mowerRunning) {
      this.audioManager.playMower();
      this.lawnMower.start();
    } else {
      this.audioManager.pauseMower();
      this.lawnMower.stop();
    }
  }
  
  public update() {
    if (!this.isRunning || !this.gameStarted) return;
    
    const delta = this.clock.getDelta();
    
    // Update all systems
    this.playerControls.update(delta);
    this.weatherSystem.update(delta);
    
    // Update terrain based on player position for infinite terrain
    this.terrain.updateTerrain(this.lawnMower.getPosition());
    
    // Check for collisions with obstacles
    const playerPosition = this.lawnMower.getPosition();
    if (this.terrain.checkCollision(playerPosition, 0.6)) {
      // Collision detected, stop the mower movement
      this.lawnMower.handleCollision();
    }
    
    if (this.mowerRunning) {
      // Check for grass cutting
      const mowedThisFrame = this.grassSystem.mow(this.lawnMower.getPosition(), this.lawnMower.getDirection());
      
      if (mowedThisFrame > 0) {
        this.totalAreaMowed += mowedThisFrame;
        this.callbacks.onMowed(Math.min(Math.floor((this.totalAreaMowed / this.grassSystem.getTotalGrass()) * 100), 100));
        
        // Play mowing sound effect if grass was cut
        this.audioManager.playGrassCut();
      }
    }
    
    // Check for scenery discovery
    this.sceneryGenerator.checkForDiscovery(this.lawnMower.getPosition());
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}
