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
  private discoveredScenery: Set<string> = new Set(); // Track discovered scenery to prevent duplicates
  private backgroundAudio: boolean = true;
  private chunkSize: number = 100; // Size of each terrain chunk
  
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
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Configure camera with wider FOV for better visibility
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Setup renderer with better quality settings
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance' 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    options.container.appendChild(this.renderer.domElement);
    
    // Initialize clock for animation
    this.clock = new THREE.Clock();
    
    // Initialize systems with larger terrain
    this.terrain = new TerrainGenerator(this.scene, this.chunkSize, this.chunkSize);
    this.grassSystem = new GrassSystem(this.scene, this.terrain);
    
    // Initialize weather system with daylight start
    this.weatherSystem = new WeatherSystem(
      this.scene, 
      (weather) => this.callbacks.onWeatherChange(weather),
      (time) => this.callbacks.onTimeChange(time),
      true // Start with daylight
    );
    
    this.lawnMower = new LawnMower(this.scene, this.terrain);
    
    // Configure third-person controls instead of first-person
    this.playerControls = new PlayerControls(this.camera, this.lawnMower, true); // true for third-person
    
    this.sceneryGenerator = new SceneryGenerator(
      this.scene, 
      this.terrain, 
      (scenery) => this.handleSceneryDiscovery(scenery)
    );
    
    this.audioManager = new AudioManager();
    
    // Set up camera in third-person position
    this.camera.position.set(0, 3, 8); // Position camera behind and above mower
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.lawnMower.getObject());
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Initialize progress
    this.callbacks.onProgress(0.1);
    
    // Preload necessary assets and initialize scene
    this.preloadAssets();
  }
  
  private preloadAssets() {
    // Simulate asset loading with progress steps
    let loadingSteps = 0;
    const totalSteps = 6; // Total number of initialization steps
    
    const updateProgress = () => {
      loadingSteps++;
      const progress = 0.1 + (loadingSteps / totalSteps) * 0.9; // Start at 10%, go to 100%
      this.callbacks.onProgress(progress);
    };
    
    // Initialize each system with progress updates
    this.terrain.initialize().then(() => {
      updateProgress();
      return this.grassSystem.initialize();
    }).then(() => {
      updateProgress();
      return this.weatherSystem.initialize();
    }).then(() => {
      updateProgress();
      return this.lawnMower.initialize();
    }).then(() => {
      updateProgress();
      return this.sceneryGenerator.initialize();
    }).then(() => {
      updateProgress();
      return this.audioManager.initialize();
    }).then(() => {
      updateProgress();
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
  
  private handleSceneryDiscovery(scenery: string) {
    // Only notify of discoveries once
    if (!this.discoveredScenery.has(scenery)) {
      this.discoveredScenery.add(scenery);
      this.callbacks.onSceneryDiscovered(scenery);
      this.audioManager.playDiscovery();
    }
  }
  
  public startGame() {
    this.gameStarted = true;
    this.isRunning = true;
    this.mowerRunning = false; // Start with mower off
    
    // Start background audio
    if (this.backgroundAudio) {
      this.audioManager.playAmbient();
    }
    
    // Lock pointer for control
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
    this.discoveredScenery.clear();
    
    // Reset all systems
    this.terrain.reset();
    this.grassSystem.reset();
    this.weatherSystem.reset();
    this.lawnMower.reset();
    this.sceneryGenerator.reset();
    this.audioManager.stopAll();
    
    // Reset camera position for third-person view
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
    
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
    
    // Update player position and controls
    this.playerControls.update(delta);
    
    // Get current player position
    const playerPosition = this.lawnMower.getPosition();
    
    // Update terrain chunks based on player position
    this.terrain.updateVisibleChunks(playerPosition.x, playerPosition.z);
    
    // Update weather with slower transitions
    this.weatherSystem.update(delta);
    
    if (this.mowerRunning) {
      // Check for grass cutting
      const mowedThisFrame = this.grassSystem.mow(playerPosition, this.lawnMower.getDirection());
      
      if (mowedThisFrame > 0) {
        this.totalAreaMowed += mowedThisFrame;
        this.callbacks.onMowed(Math.min(Math.floor((this.totalAreaMowed / this.grassSystem.getTotalGrass()) * 100), 100));
        
        // Play mowing sound effect if grass was cut
        this.audioManager.playGrassCut();
      }
    }
    
    // Check for scenery discovery
    this.sceneryGenerator.checkForDiscovery(playerPosition);
    
    // Update lawnmower physics (including collision detection)
    this.lawnMower.update(delta);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}
