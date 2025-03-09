import * as THREE from 'three';

type WeatherType = 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';

export class WeatherSystem {
  private scene: THREE.Scene;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private skyColor: THREE.Color = new THREE.Color();
  private rainParticles: THREE.Points | null = null;
  private currentWeather: WeatherType = 'Sunny';
  private nextWeather: WeatherType = 'Sunny';
  private weatherTransitionTime: number = 0;
  private weatherTransitionDuration: number = 10; // seconds
  private weatherDuration: number = 120; // seconds between weather changes
  private weatherTimer: number = 0;
  private currentTime: number = 0; // seconds since day start
  private dayDuration: number = 600; // seconds for one day/night cycle
  private timeString: string = '10:30';
  
  private onWeatherChange: (weather: string) => void;
  private onTimeChange: (time: string) => void;
  
  constructor(
    scene: THREE.Scene,
    onWeatherChange: (weather: string) => void,
    onTimeChange: (time: string) => void
  ) {
    this.scene = scene;
    this.onWeatherChange = onWeatherChange;
    this.onTimeChange = onTimeChange;
    
    // Create directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.left = -15;
    this.directionalLight.shadow.camera.right = 15;
    this.directionalLight.shadow.camera.top = 15;
    this.directionalLight.shadow.camera.bottom = -15;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 30;
    this.scene.add(this.directionalLight);
    
    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);
    
    // Set initial time
    this.setDayTime(10.5); // 10:30 AM
  }
  
  public async initialize() {
    // Create sky background
    this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
    
    // Create rain system (initially not visible)
    this.createRainSystem();
    
    return true;
  }
  
  private createRainSystem() {
    const rainCount = 5000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    
    // Create rain drops at random positions
    for (let i = 0; i < rainCount; i++) {
      const i3 = i * 3;
      // Random position in a 50x50 area, height from 10 to 20
      rainPositions[i3] = (Math.random() - 0.5) * 50;
      rainPositions[i3 + 1] = 10 + Math.random() * 10;
      rainPositions[i3 + 2] = (Math.random() - 0.5) * 50;
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    
    // Create rain material
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xAAAAAA,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });
    
    // Create rain system
    this.rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }
  
  private setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.onWeatherChange(weather);
    
    // Update scene based on weather
    switch (weather) {
      case 'Sunny':
        if (this.rainParticles) this.rainParticles.visible = false;
        this.scene.background = new THREE.Color(0x87CEEB);
        this.directionalLight.intensity = 1;
        this.ambientLight.intensity = 0.5;
        break;
        
      case 'Cloudy':
        if (this.rainParticles) this.rainParticles.visible = false;
        this.scene.background = new THREE.Color(0x9CA3AF);
        this.directionalLight.intensity = 0.7;
        this.ambientLight.intensity = 0.7;
        break;
        
      case 'Rainy':
        if (this.rainParticles) this.rainParticles.visible = true;
        this.scene.background = new THREE.Color(0x6B7280);
        this.directionalLight.intensity = 0.4;
        this.ambientLight.intensity = 0.6;
        break;
        
      case 'Stormy':
        if (this.rainParticles) this.rainParticles.visible = true;
        this.scene.background = new THREE.Color(0x4B5563);
        this.directionalLight.intensity = 0.2;
        this.ambientLight.intensity = 0.4;
        break;
    }
  }
  
  private updateRain(delta: number) {
    if (!this.rainParticles || !this.rainParticles.visible) return;
    
    const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
    const rainSpeed = this.currentWeather === 'Stormy' ? 15 : 10;
    
    // Update each raindrop position
    for (let i = 0; i < positions.length; i += 3) {
      // Move down with rain speed
      positions[i + 1] -= rainSpeed * delta;
      
      // If below ground, reset to top
      if (positions[i + 1] < 0) {
        positions[i] = (Math.random() - 0.5) * 50; // Random x
        positions[i + 1] = 10 + Math.random() * 10; // Reset height
        positions[i + 2] = (Math.random() - 0.5) * 50; // Random z
      }
    }
    
    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }
  
  private setDayTime(hours: number) {
    // Calculate sun position based on time of day
    // 0 = midnight, 6 = sunrise, 12 = noon, 18 = sunset
    const angle = ((hours - 6) / 24) * Math.PI * 2;
    const radius = 20;
    
    // Position sun
    this.directionalLight.position.x = Math.cos(angle) * radius;
    this.directionalLight.position.y = Math.sin(angle) * radius;
    this.directionalLight.position.z = 0;
    
    // Update light intensity based on time
    const nighttime = hours < 6 || hours > 18;
    const dawnDusk = (hours > 5 && hours < 7) || (hours > 17 && hours < 19);
    
    if (nighttime) {
      // Night
      this.directionalLight.intensity = 0.1;
      this.ambientLight.intensity = 0.3;
      this.scene.background = new THREE.Color(0x1E293B);
    } else if (dawnDusk) {
      // Dawn/Dusk
      this.directionalLight.intensity = 0.5;
      this.ambientLight.intensity = 0.6;
      this.scene.background = new THREE.Color(0xFB923C);
    } else {
      // Day - adjust based on weather
      this.setWeather(this.currentWeather);
    }
    
    // Format time string
    const hourInt = Math.floor(hours);
    const minute = Math.floor((hours - hourInt) * 60);
    this.timeString = `${hourInt}:${minute < 10 ? '0' : ''}${minute}`;
    this.onTimeChange(this.timeString);
  }
  
  public update(delta: number) {
    // Update day/night cycle
    this.currentTime += delta;
    if (this.currentTime > this.dayDuration) {
      this.currentTime = 0;
    }
    
    // Calculate time of day (0-24 hours)
    const hours = (this.currentTime / this.dayDuration) * 24;
    this.setDayTime(hours);
    
    // Update weather
    this.weatherTimer += delta;
    
    // Check if it's time for weather transition
    if (this.weatherTimer > this.weatherDuration && this.weatherTransitionTime === 0) {
      // Select new random weather
      const weathers: WeatherType[] = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'];
      let newWeather: WeatherType;
      
      // Avoid same weather twice in a row
      do {
        newWeather = weathers[Math.floor(Math.random() * weathers.length)];
      } while (newWeather === this.currentWeather);
      
      this.nextWeather = newWeather;
      this.weatherTransitionTime = 0.01; // Start transition
    }
    
    // Handle weather transition
    if (this.weatherTransitionTime > 0) {
      this.weatherTransitionTime += delta;
      
      // Transition complete
      if (this.weatherTransitionTime >= this.weatherTransitionDuration) {
        this.setWeather(this.nextWeather);
        this.weatherTransitionTime = 0;
        this.weatherTimer = 0;
      }
    }
    
    // Update rain animation
    this.updateRain(delta);
  }
  
  public reset() {
    this.currentTime = 0;
    this.weatherTimer = 0;
    this.weatherTransitionTime = 0;
    this.setWeather('Sunny');
    this.setDayTime(10.5); // 10:30 AM
  }
}
