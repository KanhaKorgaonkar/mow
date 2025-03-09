import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';

// Car-like physics parameters
interface PhysicsState {
  velocity: THREE.Vector3;
  angularVelocity: number;
  wheelAngle: number;
}

export class LawnMower {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private mowerObject: THREE.Group;
  private mowerBody: THREE.Mesh;
  private mowerBlades: THREE.Mesh;
  private mowerWheels: THREE.Mesh[];
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  
  // Car physics properties
  private physics: PhysicsState = {
    velocity: new THREE.Vector3(0, 0, 0),
    angularVelocity: 0,
    wheelAngle: 0
  };
  
  // Movement parameters
  private maxSpeedRunning: number = 2.0; // meters per second when mower is running
  private maxSpeedOff: number = 3.0; // meters per second when mower is off (faster)
  private accelerationRunning: number = 1.5;
  private accelerationOff: number = 2.0; // faster acceleration when off
  private deceleration: number = 3.0;
  private maxReverseSpeed: number = 1.0; // max reverse speed
  private maxWheelAngle: number = Math.PI / 4; // 45 degrees max steering angle
  private wheelTurnSpeed: number = 2.0; // how fast wheels turn
  private wheelReturnSpeed: number = 3.0; // how fast wheels center themselves
  private turnInfluence: number = 0.8; // how much turning affects movement at low speeds
  private friction: number = 0.98; // friction to gradually slow down
  
  // Current speed parameters (will be set based on running state)
  private maxSpeed: number = 2.0;
  private acceleration: number = 1.5;
  
  private isRunning: boolean = false;
  private bladeRotation: number = 0;
  private isReversing: boolean = false;
  private lastCollisionTime: number = 0;
  
  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    
    // Initialize speed parameters based on mower state (initially off)
    this.maxSpeed = this.maxSpeedOff;
    this.acceleration = this.accelerationOff;
    
    // Create mower group
    this.mowerObject = new THREE.Group();
    
    // Create temporary placeholder mower (will be replaced with proper model)
    this.mowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.3, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x22AA22 })
    );
    this.mowerBody.position.y = 0.15;
    this.mowerBody.castShadow = true;
    this.mowerObject.add(this.mowerBody);
    
    // Create mower blades
    this.mowerBlades = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    this.mowerBlades.rotation.x = Math.PI / 2;
    this.mowerBlades.position.set(0, 0.1, 0);
    this.mowerBody.add(this.mowerBlades);
    
    // Create wheels
    this.mowerWheels = [];
    const wheelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front-left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-0.3, 0.1, -0.3);
    this.mowerBody.add(wheelFL);
    this.mowerWheels.push(wheelFL);
    
    // Front-right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(0.3, 0.1, -0.3);
    this.mowerBody.add(wheelFR);
    this.mowerWheels.push(wheelFR);
    
    // Rear-left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.z = Math.PI / 2;
    wheelRL.position.set(-0.3, 0.1, 0.3);
    this.mowerBody.add(wheelRL);
    this.mowerWheels.push(wheelRL);
    
    // Rear-right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(0.3, 0.1, 0.3);
    this.mowerBody.add(wheelRR);
    this.mowerWheels.push(wheelRR);
    
    // Set initial position
    this.mowerObject.position.copy(this.position);
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
    this.maxSpeed = this.maxSpeedRunning;
    this.acceleration = this.accelerationRunning;
  }
  
  public stop() {
    this.isRunning = false;
    // When mower stops, use the off speed parameters (faster)
    this.maxSpeed = this.maxSpeedOff;
    this.acceleration = this.accelerationOff;
  }
  
  // Handle collisions with obstacles
  public handleCollision() {
    // Prevent multiple collision responses in quick succession
    const now = performance.now();
    if (now - this.lastCollisionTime < 500) return; // 500ms cooldown
    
    this.lastCollisionTime = now;
    
    // Reverse direction of velocity (bounce back a bit)
    this.physics.velocity.multiplyScalar(-0.3);
    
    // Add a small random offset to prevent getting stuck
    const randomAngle = (Math.random() - 0.5) * 0.5;
    this.physics.angularVelocity += randomAngle;
    
    // Reduce speed
    const speed = this.physics.velocity.length();
    if (speed > 0.2) {
      this.physics.velocity.normalize().multiplyScalar(0.2);
    }
  }
  
  public moveForward(active: boolean, delta: number) {
    const forwardDir = this.direction.clone();
    const speedMultiplier = this.isReversing ? -1 : 1;
    
    // Calculate acceleration direction
    if (active) {
      // Car moves in the direction it's facing, not the direction of the input
      const acceleration = forwardDir.clone().multiplyScalar(
        speedMultiplier * this.acceleration * delta
      );
      
      // Apply acceleration to velocity
      this.physics.velocity.add(acceleration);
      
      // Limit max speed
      const maxSpeed = this.isReversing ? this.maxReverseSpeed : this.maxSpeed;
      const speed = this.physics.velocity.length();
      if (speed > maxSpeed) {
        this.physics.velocity.normalize().multiplyScalar(maxSpeed);
      }
    } else {
      // Apply deceleration
      if (this.physics.velocity.length() > 0.01) {
        const deceleration = this.physics.velocity.clone().normalize().multiplyScalar(
          -this.deceleration * delta
        );
        this.physics.velocity.add(deceleration);
        
        // Stop completely if very slow
        if (this.physics.velocity.length() < 0.01) {
          this.physics.velocity.set(0, 0, 0);
        }
      }
    }
    
    // Apply friction
    this.physics.velocity.multiplyScalar(this.friction);
    
    // Update position based on velocity
    const movement = this.physics.velocity.clone().multiplyScalar(delta);
    this.position.add(movement);
    
    // Adjust height based on terrain
    const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = terrainHeight;
    
    // Update object position
    this.mowerObject.position.copy(this.position);
    
    // Rotate wheels based on speed
    const wheelRotationSpeed = this.physics.velocity.length() * 10;
    this.mowerWheels.forEach((wheel, index) => {
      // Front wheels (first two) should also show steering angle
      if (index < 2) {
        wheel.rotation.y = this.physics.wheelAngle;
      }
      // All wheels rotate based on speed
      wheel.rotation.x += wheelRotationSpeed * delta * (this.isReversing ? -1 : 1);
    });
  }
  
  public turn(direction: 'left' | 'right', delta: number) {
    // Update wheel angle for steering
    const turnDirection = direction === 'left' ? 1 : -1;
    
    // How much to change wheel angle - increased for more responsive turning
    this.physics.wheelAngle += turnDirection * this.wheelTurnSpeed * delta * 2.0;
    
    // Limit wheel angle
    this.physics.wheelAngle = Math.max(
      -this.maxWheelAngle, 
      Math.min(this.maxWheelAngle, this.physics.wheelAngle)
    );
    
    // Calculate turn amount based on speed and wheel angle
    const speed = this.physics.velocity.length();
    
    // Ensure minimum turning effect even at very low speeds
    const effectiveSpeed = Math.max(speed, 0.5);
    
    // Increased turning effectiveness
    const turnAmount = this.physics.wheelAngle * 
                      ((effectiveSpeed / this.maxSpeed) + 0.2) * 
                      this.turnInfluence * 
                      delta * 1.5; // Increased turning multiplier
    
    // Update angular velocity with enhanced effect
    this.physics.angularVelocity = turnAmount * 3;
    
    // Apply rotation to direction vector and object
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.physics.angularVelocity);
    this.mowerObject.rotation.y -= this.physics.angularVelocity;
  }
  
  public setReverse(isReversing: boolean) {
    // Only change direction when nearly stopped
    if (this.physics.velocity.length() < 0.5) {
      this.isReversing = isReversing;
    }
  }
  
  public update(delta: number) {
    // Rotate blades if mower is running
    if (this.isRunning) {
      this.bladeRotation += delta * 15; // Fast rotation
      this.mowerBlades.rotation.z = this.bladeRotation;
    }
    
    // If no active turn input, return wheels gradually to center
    if (Math.abs(this.physics.wheelAngle) > 0.01) {
      const returnDirection = this.physics.wheelAngle > 0 ? -1 : 1;
      this.physics.wheelAngle += returnDirection * this.wheelReturnSpeed * delta;
      
      // If very close to center, just center it
      if (Math.abs(this.physics.wheelAngle) < 0.01) {
        this.physics.wheelAngle = 0;
      }
    }
    
    // Apply angular velocity decay (stops spinning)
    this.physics.angularVelocity *= 0.95;
    
    // Adjust mower to terrain slope (simplified)
    const ahead = this.direction.clone().multiplyScalar(0.4);
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), this.direction).normalize().multiplyScalar(0.3);
    
    // Sample terrain at 3 points to determine tilt
    const heightCenter = this.terrain.getHeightAt(this.position.x, this.position.z);
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
  
  public reset() {
    this.position.set(0, 0, 0);
    this.direction.set(0, 0, -1);
    this.physics.velocity.set(0, 0, 0);
    this.physics.angularVelocity = 0;
    this.physics.wheelAngle = 0;
    this.isRunning = false;
    this.isReversing = false;
    this.lastCollisionTime = 0;
    this.mowerObject.position.copy(this.position);
    this.mowerObject.rotation.set(0, 0, 0);
    this.mowerBody.rotation.set(0, 0, 0);
    
    // Reset wheel rotations
    this.mowerWheels.forEach(wheel => {
      wheel.rotation.y = 0;
    });
  }
}
import * as THREE from 'three';
import { AudioManager } from './AudioManager';

export class LawnMower {
  private scene: THREE.Scene;
  private mower: THREE.Object3D | null = null;
  private running: boolean = false;
  private audioManager: AudioManager;
  private speed: number = 0.05;
  private turnSpeed: number = 0.03;
  
  constructor(scene: THREE.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
  }
  
  public initialize(): Promise<void> {
    return new Promise((resolve) => {
      // Create a simple cuboid lawnmower
      const body = new THREE.BoxGeometry(1, 0.5, 1.5);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xE53935 });
      const mowerBody = new THREE.Mesh(body, bodyMaterial);
      mowerBody.castShadow = true;
      
      // Create wheels
      const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
      const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const wheels = [];
      const wheelPositions = [
        { x: 0.4, y: -0.2, z: 0.5 },
        { x: -0.4, y: -0.2, z: 0.5 },
        { x: 0.4, y: -0.2, z: -0.5 },
        { x: -0.4, y: -0.2, z: -0.5 }
      ];
      
      for (const pos of wheelPositions) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheels.push(wheel);
      }
      
      // Create handle
      const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
      const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(0, 0.3, -0.7);
      handle.rotation.x = Math.PI / 4;
      handle.castShadow = true;
      
      // Assemble mower
      this.mower = new THREE.Group();
      this.mower.add(mowerBody);
      wheels.forEach(wheel => this.mower.add(wheel));
      this.mower.add(handle);
      
      // Position the mower
      this.mower.position.set(0, 0.2, 0); // Slightly above ground
      this.scene.add(this.mower);
      
      resolve();
    });
  }
  
  public update(controls: { forward: boolean, backward: boolean, left: boolean, right: boolean }): void {
    if (!this.mower) return;
    
    // Calculate movement speed based on mower state
    const currentSpeed = this.running ? this.speed : this.speed * 1.5;
    
    // Handle forward/backward movement
    if (controls.forward) {
      // Move in the direction the mower is facing
      this.mower.position.x += Math.sin(this.mower.rotation.y) * currentSpeed;
      this.mower.position.z += Math.cos(this.mower.rotation.y) * currentSpeed;
    }
    
    if (controls.backward) {
      // Move backwards in the direction the mower is facing
      this.mower.position.x -= Math.sin(this.mower.rotation.y) * (currentSpeed * 0.5);
      this.mower.position.z -= Math.cos(this.mower.rotation.y) * (currentSpeed * 0.5);
    }
    
    // Handle turning
    if (controls.left) {
      this.mower.rotation.y += this.turnSpeed;
    }
    
    if (controls.right) {
      this.mower.rotation.y -= this.turnSpeed;
    }
  }
  
  public getPosition(): THREE.Vector3 {
    return this.mower ? this.mower.position.clone() : new THREE.Vector3();
  }
  
  public getRotation(): number {
    return this.mower ? this.mower.rotation.y : 0;
  }
  
  public isRunning(): boolean {
    return this.running;
  }
  
  public toggleRunning(): void {
    this.running = !this.running;
    
    if (this.running) {
      this.audioManager.playMower();
    } else {
      this.audioManager.stopMower();
    }
  }
  
  public setRunning(running: boolean): void {
    if (this.running !== running) {
      this.running = running;
      
      if (this.running) {
        this.audioManager.playMower();
      } else {
        this.audioManager.stopMower();
      }
    }
  }
  
  public reset(): void {
    if (this.mower) {
      this.mower.position.set(0, 0.2, 0);
      this.mower.rotation.set(0, 0, 0);
    }
    
    this.running = false;
    this.audioManager.stopMower();
  }
}
