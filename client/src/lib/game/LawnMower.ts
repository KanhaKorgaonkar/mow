import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';

export class LawnMower {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private mowerObject: THREE.Group;
  private mowerBody: THREE.Mesh;
  private mowerBlades: THREE.Mesh;
  private mowerWheels: THREE.Mesh[];
  private headlights: THREE.SpotLight[] = [];
  private headlightMeshes: THREE.Mesh[] = [];
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  private headlightsOn: boolean = false;
  
  // Simplified movement parameters
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private rotationSpeed: number = 2.5; // how fast the mower turns
  
  // Speed parameters - increased for faster gameplay
  private maxSpeedRunning: number = 5.5; // meters per second when mower is running (increased from 2.5)
  private maxSpeedOff: number = 3.8; // meters per second when mower is off (increased from 4.0)
  private acceleration: number = 2.5; // faster acceleration for more responsive controls (increased from 6.0)
  private deceleration: number = 9.0; // faster slowdown for better control (increased from 8.0)
  private friction: number = 0.94; // slightly less friction for smoother gliding (increased from 0.92)
  
  // Current maximum speed (set based on running state)
  private currentMaxSpeed: number = 3.8; // Updated to match maxSpeedOff
  
  private isRunning: boolean = false;
  private bladeRotation: number = 0;
  private lastCollisionTime: number = 0;
  
  // Control flags
  private moveForwardActive: boolean = false;
  private moveBackwardActive: boolean = false;
  private turnLeftActive: boolean = false;
  private turnRightActive: boolean = false;
  
  // Create headlights for the mower
  private createHeadlights() {
    // Create headlight meshes (the visible bulb/housing)
    const headlightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5
    });
    
    // Left headlight
    const leftHeadlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlightMesh.position.set(-0.25, 0.2, -0.4);
    this.mowerBody.add(leftHeadlightMesh);
    this.headlightMeshes.push(leftHeadlightMesh);
    
    // Right headlight
    const rightHeadlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlightMesh.position.set(0.25, 0.2, -0.4);
    this.mowerBody.add(rightHeadlightMesh);
    this.headlightMeshes.push(rightHeadlightMesh);
    
    // Create actual light sources (initially off)
    const leftLight = new THREE.SpotLight(0xFFFFFF, 0, 15, Math.PI / 6, 0.5, 1);
    leftLight.position.copy(leftHeadlightMesh.position);
    leftLight.target.position.set(-0.5, 0, -5); // Aim slightly outward
    this.mowerBody.add(leftLight);
    this.mowerBody.add(leftLight.target);
    this.headlights.push(leftLight);
    
    const rightLight = new THREE.SpotLight(0xFFFFFF, 0, 15, Math.PI / 6, 0.5, 1);
    rightLight.position.copy(rightHeadlightMesh.position);
    rightLight.target.position.set(0.5, 0, -5); // Aim slightly outward
    this.mowerBody.add(rightLight);
    this.mowerBody.add(rightLight.target);
    this.headlights.push(rightLight);
  }
  
  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    
    // Set current max speed based on running state (initially off)
    this.currentMaxSpeed = this.maxSpeedOff;
    
    // Create mower group
    this.mowerObject = new THREE.Group();
    
    // Create a more robust mower body 
    this.mowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x22AA22 })
    );
    this.mowerBody.position.y = 0.25; // Raised slightly higher
    this.mowerBody.castShadow = true;
    this.mowerObject.add(this.mowerBody);
    
    // Add handle to mower for better visual appearance
    const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 0.5, 0.3);
    handle.rotation.x = Math.PI / 4;
    this.mowerBody.add(handle);
    
    // Create mower blades
    this.mowerBlades = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    this.mowerBlades.rotation.x = Math.PI / 2;
    this.mowerBlades.position.set(0, 0.05, 0);
    this.mowerBody.add(this.mowerBlades);
    
    // Create wheels
    this.mowerWheels = [];
    const wheelGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front-left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-0.3, 0.12, -0.35);
    this.mowerBody.add(wheelFL);
    this.mowerWheels.push(wheelFL);
    
    // Front-right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(0.3, 0.12, -0.35);
    this.mowerBody.add(wheelFR);
    this.mowerWheels.push(wheelFR);
    
    // Rear-left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.z = Math.PI / 2;
    wheelRL.position.set(-0.3, 0.12, 0.35);
    this.mowerBody.add(wheelRL);
    this.mowerWheels.push(wheelRL);
    
    // Rear-right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(0.3, 0.12, 0.35);
    this.mowerBody.add(wheelRR);
    this.mowerWheels.push(wheelRR);
    
    // Add headlights
    this.createHeadlights();
    
    // Set initial position
    this.mowerObject.position.copy(this.position);
    this.scene.add(this.mowerObject);
  }
  
  public async initialize() {
    // In a full implementation, this would load a detailed 3D model
    // of a lawn mower instead of the simple geometry created in constructor
    return true;
  }
  
  public getObject() {
    return this.mowerObject;
  }
  
  public getPosition() {
    return this.position.clone();
  }
  
  public getDirection() {
    return this.direction.clone();
  }
  
  public start() {
    this.isRunning = true;
    // When mower starts, use the running speed parameters (slower)
    this.currentMaxSpeed = this.maxSpeedRunning;
  }
  
  public stop() {
    this.isRunning = false;
    // When mower stops, use the off speed parameters (faster)
    this.currentMaxSpeed = this.maxSpeedOff;
  }
  
  // Handle collisions with obstacles
  public handleCollision() {
    // Prevent multiple collision responses in quick succession
    const now = performance.now();
    if (now - this.lastCollisionTime < 500) return; // 500ms cooldown
    
    this.lastCollisionTime = now;
    
    // Reverse direction of velocity (bounce back a bit)
    this.velocity.multiplyScalar(-0.3);
    
    // Add a small random rotation to prevent getting stuck
    const randomAngle = (Math.random() - 0.5) * 0.2;
    this.mowerObject.rotation.y += randomAngle;
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomAngle);
    
    // Reduce speed
    const speed = this.velocity.length();
    if (speed > 0.2) {
      this.velocity.normalize().multiplyScalar(0.2);
    }
  }
  
  // Set control flags - used by PlayerControls
  public setMoveForward(active: boolean) {
    this.moveForwardActive = active;
  }
  
  public setMoveBackward(active: boolean) {
    this.moveBackwardActive = active;
  }
  
  public setTurnLeft(active: boolean) {
    this.turnLeftActive = active;
  }
  
  public setTurnRight(active: boolean) {
    this.turnRightActive = active;
  }
  
  // Process movement based on current control flags
  public update(delta: number) {
    // Process movement based on control flags - Pure W/A/D control scheme
    
    // W = Forward movement only
    if (this.moveForwardActive) {
      // Accelerate forward in the direction we're facing
      const accel = this.direction.clone().multiplyScalar(this.acceleration * delta);
      this.velocity.add(accel);
    } else {
      // Apply stronger deceleration when not moving forward for a more responsive feel
      if (this.velocity.length() > 0.01) {
        const decel = this.velocity.clone().normalize().multiplyScalar(-this.deceleration * 1.2 * delta);
        this.velocity.add(decel);
        
        // Stop completely if very slow
        if (this.velocity.length() < 0.01) {
          this.velocity.set(0, 0, 0);
        }
      }
    }
    
    // A/D = Turn while moving or stationary
    // Turning rate is higher when stationary for more responsive controls
    const baseTurnRate = this.rotationSpeed * delta;
    
    // Enhanced turning factor: significantly faster turning when stationary, 
    // more moderate when moving slowly, and standard when at speed
    let turningFactor = 1.0; 
    if (this.velocity.length() < 0.1) {
      turningFactor = 2.0; // Much faster turning when completely stopped
    } else if (this.velocity.length() < 1.0) {
      turningFactor = 1.5; // Enhanced turning at slow speeds
    }
    
    if (this.turnLeftActive && !this.turnRightActive) {
      // Simple left turning - directly rotate the direction and mower
      const rotationAmount = baseTurnRate * turningFactor;
      this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAmount);
      this.mowerObject.rotation.y += rotationAmount;
    } else if (this.turnRightActive && !this.turnLeftActive) {
      // Simple right turning in the opposite direction
      const rotationAmount = -baseTurnRate * turningFactor;
      this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAmount);
      this.mowerObject.rotation.y += rotationAmount;
    }
    
    // Apply friction to slow down
    this.velocity.multiplyScalar(this.friction);
    
    // Apply speed limit
    const speed = this.velocity.length();
    if (speed > this.currentMaxSpeed) {
      this.velocity.normalize().multiplyScalar(this.currentMaxSpeed);
    }
    
    // Update position based on velocity
    const movement = this.velocity.clone().multiplyScalar(delta);
    this.position.add(movement);
    
    // Get terrain height at current position
    const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
    
    // Keep mower on the terrain surface
    this.position.y = terrainHeight + 0.02; // Slight offset to prevent z-fighting
    
    // Update mower object position
    this.mowerObject.position.copy(this.position);
    
    // Rotate blades if mower is running
    if (this.isRunning) {
      this.bladeRotation += delta * 15; // Fast rotation
      this.mowerBlades.rotation.z = this.bladeRotation;
    }
    
    // Rotate wheels based on speed
    const wheelRotationSpeed = this.velocity.length() * 10;
    const isMovingBackward = this.velocity.dot(this.direction) < 0;
    
    this.mowerWheels.forEach(wheel => {
      // Rotate all wheels based on speed
      wheel.rotation.x += wheelRotationSpeed * delta * (isMovingBackward ? -1 : 1);
    });
    
    // Adjust mower to terrain slope
    const ahead = this.direction.clone().multiplyScalar(0.4);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), this.direction).normalize().multiplyScalar(0.3);
    
    // Sample terrain at 3 points to determine tilt
    const heightCenter = terrainHeight;
    const heightFront = this.terrain.getHeightAt(this.position.x + ahead.x, this.position.z + ahead.z);
    const heightRight = this.terrain.getHeightAt(this.position.x + right.x, this.position.z + right.z);
    
    // Calculate pitch (front-back tilt)
    const pitch = Math.atan2(heightFront - heightCenter, ahead.length());
    
    // Calculate roll (side-to-side tilt)
    const roll = Math.atan2(heightRight - heightCenter, right.length());
    
    // Apply smooth rotation
    const targetRotationX = roll;
    const targetRotationZ = -pitch;
    
    // Blend current rotation with target rotation (smooth transition)
    this.mowerBody.rotation.x += (targetRotationX - this.mowerBody.rotation.x) * 0.1;
    this.mowerBody.rotation.z += (targetRotationZ - this.mowerBody.rotation.z) * 0.1;
  }
  
  // Turn headlights on/off
  public setHeadlights(on: boolean) {
    this.headlightsOn = on;
    
    // Update headlight intensity
    const intensity = on ? 1.5 : 0;
    
    // Update spotlight intensity
    this.headlights.forEach(light => {
      light.intensity = intensity;
    });
    
    // Update headlight mesh appearance
    const emissiveIntensity = on ? 1.0 : 0.2;
    this.headlightMeshes.forEach(mesh => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissiveIntensity = emissiveIntensity;
      }
    });
  }
  
  // Check if headlights are on
  public areHeadlightsOn(): boolean {
    return this.headlightsOn;
  }

  public reset() {
    this.position.set(0, 0, 0);
    this.direction.set(0, 0, -1);
    this.velocity.set(0, 0, 0);
    this.isRunning = false;
    this.lastCollisionTime = 0;
    this.moveForwardActive = false;
    this.moveBackwardActive = false;
    this.turnLeftActive = false;
    this.turnRightActive = false;
    this.mowerObject.position.copy(this.position);
    this.mowerObject.rotation.set(0, 0, 0);
    this.mowerBody.rotation.set(0, 0, 0);
    
    // Reset wheel rotations
    this.mowerWheels.forEach(wheel => {
      wheel.rotation.y = 0;
    });
    
    // Reset headlights to off
    this.setHeadlights(false);
  }
}