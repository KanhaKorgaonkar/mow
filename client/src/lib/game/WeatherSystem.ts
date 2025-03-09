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
  private weatherTransitionDuration: number = 30; // seconds - longer transitions
  private weatherDuration: number = 300; // seconds between weather changes - less frequent changes
  private weatherTimer: number = 0;
  private currentTime: number = 0; // seconds since day start
  private dayDuration: number = 1200; // seconds for one day/night cycle - slower day/night cycle
  private timeString: string = '12:00';
  private startWithDaylight: boolean;
  
  private onWeatherChange: (weather: string) => void;
  private onTimeChange: (time: string) => void;
  
  constructor(
    scene: THREE.Scene,
    onWeatherChange: (weather: string) => void,
    onTimeChange: (time: string) => void,
    startWithDaylight: boolean = false
  ) {
    this.scene = scene;
    this.onWeatherChange = onWeatherChange;
    this.onTimeChange = onTimeChange;
    this.startWithDaylight = startWithDaylight;
    
    // Create directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    this.directionalLight.position.set(10, 10, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.left = -50; // Expanded shadow area
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 100; // Increased shadow distance
    this.scene.add(this.directionalLight);
    
    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(this.ambientLight);
    
    // Set initial time - noon for better visibility
    this.setDayTime(this.startWithDaylight ? 12.0 : 10.5);
  }
  
  public async initialize() {
    // Create sky background
    this.scene.background = new THREE.Color(0x87CEEB); // Light blue sky
    
    // Create rain system (initially not visible)
    this.createRainSystem();
    
    // If starting with daylight, set the current time to midday
    if (this.startWithDaylight) {
      this.currentTime = this.dayDuration / 2; // Start at midday
      this.setDayTime(12.0); // Noon
    }
    
    return true;
  }
  
  private createRainSystem() {
    const rainCount = 8000; // More raindrops
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    
    // Create rain drops at random positions in a larger area
    for (let i = 0; i < rainCount; i++) {
      const i3 = i * 3;
      // Random position in a larger area, varied height
      rainPositions[i3] = (Math.random() - 0.5) * 100; // x
      rainPositions[i3 + 1] = 10 + Math.random() * 15; // y (height)
      rainPositions[i3 + 2] = (Math.random() - 0.5) * 100; // z
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    
    // Create rain material with better appearance
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xCCCCDD, // Slight blue tint
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true // Proper perspective scaling
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
        this.scene.background = new THREE.Color(0x87CEEB); // Bright blue
        this.directionalLight.intensity = 1;
        this.ambientLight.intensity = 0.5;
        break;
        
      case 'Cloudy':
        if (this.rainParticles) this.rainParticles.visible = false;
        this.scene.background = new THREE.Color(0xA8B0BC); // Light gray with blue tint
        this.directionalLight.intensity = 0.7;
        this.ambientLight.intensity = 0.6;
        break;
        
      case 'Rainy':
        if (this.rainParticles) this.rainParticles.visible = true;
        this.scene.background = new THREE.Color(0x78838F); // Darker gray-blue
        this.directionalLight.intensity = 0.5;
        this.ambientLight.intensity = 0.6;
        break;
        
      case 'Stormy':
        if (this.rainParticles) this.rainParticles.visible = true;
        this.scene.background = new THREE.Color(0x4B5563); // Dark gray
        this.directionalLight.intensity = 0.3;
        this.ambientLight.intensity = 0.4;
        break;
    }
  }
  
  private updateRain(delta: number) {
    if (!this.rainParticles || !this.rainParticles.visible) return;
    
    const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
    const rainSpeed = this.currentWeather === 'Stormy' ? 15 : 10;
    
    // Get player position (assumed to be at 0,0,0 for this function)
    const playerX = 0;
    const playerZ = 0;
    const rainArea = 100; // Width/length of rain area
    
    // Update each raindrop position
    for (let i = 0; i < positions.length; i += 3) {
      // Move down with rain speed
      positions[i + 1] -= rainSpeed * delta;
      
      // If below ground, reset to top
      if (positions[i + 1] < 0) {
        // Reset around player position
        positions[i] = playerX + (Math.random() - 0.5) * rainArea;
        positions[i + 1] = 15 + Math.random() * 10; // Reset height
        positions[i + 2] = playerZ + (Math.random() - 0.5) * rainArea;
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
      this.directionalLight.intensity = 0.15; // Slightly brighter night
      this.ambientLight.intensity = 0.3;
      
      // Darker blue night sky
      this.scene.background = new THREE.Color(0x12223F);
    } else if (dawnDusk) {
      // Dawn/Dusk with orange/pink sky
      this.directionalLight.intensity = 0.6;
      this.ambientLight.intensity = 0.5;
      
      if (hours < 12) {
        // Dawn - more orange
        this.scene.background = new THREE.Color(0xFFA07A);
      } else {
        // Dusk - more pink/purple
        this.scene.background = new THREE.Color(0xDDA0DD);
      }
    } else {
      // Day - adjust based on weather
      this.setWeather(this.currentWeather);
    }
    
    // Format time string
    const hourInt = Math.floor(hours);
    const minute = Math.floor((hours - hourInt) * 60);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12; // Convert to 12-hour format
    this.timeString = `${hour12}:${minute < 10 ? '0' : ''}${minute} ${ampm}`;
    this.onTimeChange(this.timeString);
  }
  
  public update(delta: number) {
    // Use a slower delta for slower transitions
    const slowedDelta = delta * 0.7; // 70% normal speed
    
    // Update day/night cycle
    this.currentTime += slowedDelta;
    if (this.currentTime > this.dayDuration) {
      this.currentTime = 0;
    }
    
    // Calculate time of day (0-24 hours)
    const hours = (this.currentTime / this.dayDuration) * 24;
    this.setDayTime(hours);
    
    // Update weather with slowed transitions
    this.weatherTimer += slowedDelta;
    
    // Check if it's time for weather transition
    if (this.weatherTimer > this.weatherDuration && this.weatherTransitionTime === 0) {
      // Select new random weather, with sunny being more common
      const weathers: WeatherType[] = ['Sunny', 'Sunny', 'Cloudy', 'Rainy', 'Stormy'];
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
      this.weatherTransitionTime += slowedDelta;
      
      // Gradual transition - blend colors and lighting based on transition progress
      if (this.weatherTransitionTime < this.weatherTransitionDuration) {
        const progress = this.weatherTransitionTime / this.weatherTransitionDuration;
        
        // Gradually adjust rain visibility for smoother transitions
        if (this.rainParticles) {
          if ((this.currentWeather === 'Sunny' || this.currentWeather === 'Cloudy') && 
              (this.nextWeather === 'Rainy' || this.nextWeather === 'Stormy')) {
            // Fade in rain
            this.rainParticles.visible = true;
            (this.rainParticles.material as THREE.PointsMaterial).opacity = 0.7 * progress;
          } else if ((this.currentWeather === 'Rainy' || this.currentWeather === 'Stormy') && 
                    (this.nextWeather === 'Sunny' || this.nextWeather === 'Cloudy')) {
            // Fade out rain
            (this.rainParticles.material as THREE.PointsMaterial).opacity = 0.7 * (1 - progress);
            if (progress > 0.9) this.rainParticles.visible = false;
          }
        }
      }
      
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
    this.currentTime = this.startWithDaylight ? this.dayDuration / 2 : 0;
    this.weatherTimer = 0;
    this.weatherTransitionTime = 0;
    this.setWeather('Sunny');
    this.setDayTime(this.startWithDaylight ? 12.0 : 10.5);
  }
}
