import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';

// Type for collision objects
interface CollisionObject {
  position: THREE.Vector3;
  radius: number;
  type: string;
}

export class LawnMower {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private mowerObject: THREE.Group;
  private mowerBody: THREE.Mesh;
  private mowerHandlebar: THREE.Mesh;
  private mowerBlades: THREE.Mesh;
  private mowerWheels: THREE.Mesh[];
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  private speed: number = 0;
  private maxSpeed: number = 4; // meters per second
  private acceleration: number = 3.5; // meters per second squared
  private deceleration: number = 5; // meters per second squared
  private rotationSpeed: number = 2; // radians per second
  private isRunning: boolean = false;
  private bladeRotation: number = 0;
  private collisionRadius: number = 0.4; // Radius for collision detection
  private collisionObjects: CollisionObject[] = []; // Stores obstacles to avoid
  private lastCollisionTime: number = 0; // Time tracking for collision recovery
  private collisionRecoveryTime: number = 1; // Time in seconds to recover from collision
  private hasCollided: boolean = false; // Flag for if we're currently handling a collision
  private previousPosition: THREE.Vector3 = new THREE.Vector3();
  
  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    
    // Create mower group
    this.mowerObject = new THREE.Group();
    
    // Create black mower body
    this.mowerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.3, 0.9),
      new THREE.MeshStandardMaterial({ 
        color: 0x111111, // Black color
        roughness: 0.7,
        metalness: 0.4
      })
    );
    this.mowerBody.position.y = 0.17;
    this.mowerBody.castShadow = true;
    this.mowerBody.receiveShadow = true;
    this.mowerObject.add(this.mowerBody);
    
    // Add red stripe detail
    const redStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.05, 0.2),
      new THREE.MeshStandardMaterial({ 
        color: 0xAA0000, // Red accent
        roughness: 0.5,
        metalness: 0.6
      })
    );
    redStripe.position.set(0, 0.19, -0.3);
    this.mowerBody.add(redStripe);
    
    // Create handlebar
    this.mowerHandlebar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x333333, // Dark gray
        roughness: 0.7,
        metalness: 0.6
      })
    );
    this.mowerHandlebar.position.set(0, 0.5, 0.4);
    this.mowerHandlebar.rotation.x = Math.PI / 6; // Angle the handlebar
    this.mowerBody.add(this.mowerHandlebar);
    
    // Add handlebar grips
    const gripLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    gripLeft.rotation.z = Math.PI / 2;
    gripLeft.position.set(-0.25, 0.88, 0.43);
    this.mowerBody.add(gripLeft);
    
    const gripRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    gripRight.rotation.z = Math.PI / 2;
    gripRight.position.set(0.25, 0.88, 0.43);
    this.mowerBody.add(gripRight);
    
    // Create mower blades (now steel-colored)
    this.mowerBlades = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xC0C0C0, // Steel color
        roughness: 0.3,
        metalness: 0.9
      })
    );
    this.mowerBlades.rotation.x = Math.PI / 2;
    this.mowerBlades.position.set(0, 0.08, 0);
    this.mowerBlades.castShadow = true;
    this.mowerBody.add(this.mowerBlades);
    
    // Add blade protection cover
    const bladeGuard = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 16, Math.PI * 1.6),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    bladeGuard.position.set(0, 0.08, -0.15);
    bladeGuard.rotation.set(Math.PI / 2, 0, 0);
    this.mowerBody.add(bladeGuard);
    
    // Create wheels (larger and more detailed)
    this.mowerWheels = [];
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222, // Dark black
      roughness: 0.9,
      metalness: 0.2
    });
    
    const wheelHubGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.085, 16);
    const wheelHubMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888, // Light gray
      roughness: 0.5,
      metalness: 0.8
    });
    
    // Front-left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-0.35, 0.15, -0.35);
    wheelFL.castShadow = true;
    this.mowerBody.add(wheelFL);
    this.mowerWheels.push(wheelFL);
    
    // Front-left wheel hub
    const hubFL = new THREE.Mesh(wheelHubGeometry, wheelHubMaterial);
    hubFL.rotation.z = Math.PI / 2;
    hubFL.position.set(-0.35, 0.15, -0.35);
    this.mowerBody.add(hubFL);
    
    // Front-right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(0.35, 0.15, -0.35);
    wheelFR.castShadow = true;
    this.mowerBody.add(wheelFR);
    this.mowerWheels.push(wheelFR);
    
    // Front-right wheel hub
    const hubFR = new THREE.Mesh(wheelHubGeometry, wheelHubMaterial);
    hubFR.rotation.z = Math.PI / 2;
    hubFR.position.set(0.35, 0.15, -0.35);
    this.mowerBody.add(hubFR);
    
    // Rear-left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.rotation.z = Math.PI / 2;
    wheelRL.position.set(-0.35, 0.15, 0.35);
    wheelRL.castShadow = true;
    this.mowerBody.add(wheelRL);
    this.mowerWheels.push(wheelRL);
    
    // Rear-left wheel hub
    const hubRL = new THREE.Mesh(wheelHubGeometry, wheelHubMaterial);
    hubRL.rotation.z = Math.PI / 2;
    hubRL.position.set(-0.35, 0.15, 0.35);
    this.mowerBody.add(hubRL);
    
    // Rear-right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.rotation.z = Math.PI / 2;
    wheelRR.position.set(0.35, 0.15, 0.35);
    wheelRR.castShadow = true;
    this.mowerBody.add(wheelRR);
    this.mowerWheels.push(wheelRR);
    
    // Rear-right wheel hub
    const hubRR = new THREE.Mesh(wheelHubGeometry, wheelHubMaterial);
    hubRR.rotation.z = Math.PI / 2;
    hubRR.position.set(0.35, 0.15, 0.35);
    this.mowerBody.add(hubRR);
    
    // Set initial position
    this.mowerObject.position.copy(this.position);
    this.previousPosition.copy(this.position);
  }
  
  public async initialize() {
    // In a full implementation, this would load a detailed 3D model
    // of a lawn mower instead of the geometry created in constructor
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
  }
  
  public stop() {
    this.isRunning = false;
  }
  
  // Register a collidable object
  public registerCollisionObject(position: THREE.Vector3, radius: number, type: string) {
    this.collisionObjects.push({ position, radius, type });
  }
  
  // Clear collision objects
  public clearCollisionObjects() {
    this.collisionObjects = [];
  }
  
  // Check for collisions with registered objects
  private checkCollisions(): boolean {
    // Skip collision check if we're already handling a collision
    if (this.hasCollided) {
      const currentTime = performance.now() / 1000;
      if (currentTime - this.lastCollisionTime > this.collisionRecoveryTime) {
        this.hasCollided = false; // Reset collision state after recovery time
      } else {
        return true; // Still in collision recovery
      }
    }
    
    for (const object of this.collisionObjects) {
      const distanceX = this.position.x - object.position.x;
      const distanceZ = this.position.z - object.position.z;
      const distance = Math.sqrt(distanceX * distanceX + distanceZ * distanceZ);
      
      // Check if collision occurred (allowing for combined radii)
      const minimumDistance = this.collisionRadius + object.radius;
      if (distance < minimumDistance) {
        // We have a collision
        this.handleCollision(object);
        return true;
      }
    }
    
    return false;
  }
  
  // Handle collision response
  private handleCollision(object: CollisionObject) {
    // Mark collision state
    this.hasCollided = true;
    this.lastCollisionTime = performance.now() / 1000;
    
    // Bounce back: move away from the collision
    const pushDirection = new THREE.Vector3(
      this.position.x - object.position.x,
      0,
      this.position.z - object.position.z
    ).normalize();
    
    // Add a small perpendicular component to avoid getting stuck
    pushDirection.x += (Math.random() - 0.5) * 0.5;
    pushDirection.z += (Math.random() - 0.5) * 0.5;
    pushDirection.normalize();
    
    // Push away and revert to previous position
    this.position.copy(this.previousPosition);
    this.position.add(pushDirection.multiplyScalar(0.2)); // Small push back
    
    // Stop movement
    this.speed = -this.speed * 0.3; // Slight bounce back
  }
  
  // Update collision objects based on player movement
  public updateCollisionObjects(sceneryObjects: any[]) {
    // Clear previous collision objects
    this.clearCollisionObjects();
    
    // Register new collision objects from scenery
    for (const scenery of sceneryObjects) {
      if (scenery.mesh && !scenery.discovered) {
        // Skip already discovered items or ones without meshes
        this.registerCollisionObject(
          scenery.position,
          scenery.type === 'Fence' ? 1.0 : 2.0, // Different collision radii based on type
          scenery.type
        );
      }
    }
  }
  
  public moveForward(active: boolean, delta: number) {
    // Store previous position for collision recovery
    this.previousPosition.copy(this.position);
    
    if (active) {
      // Accelerate
      this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
    } else if (this.speed > 0) {
      // Decelerate when moving forward
      this.speed = Math.max(this.speed - this.deceleration * delta, 0);
    } else if (this.speed < 0) {
      // Decelerate when moving backward
      this.speed = Math.min(this.speed + this.deceleration * delta, 0);
    }
    
    // Move forward in current direction
    const movement = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(movement);
    
    // Adjust height based on terrain
    const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = terrainHeight;
    
    // Check for collisions
    if (this.checkCollisions()) {
      // Collision occurred, position has been adjusted
      this.speed *= 0.5; // Reduce speed after collision
    }
    
    // Update object position
    this.mowerObject.position.copy(this.position);
  }
  
  public turn(direction: 'left' | 'right', delta: number) {
    const angle = (direction === 'left' ? 1 : -1) * this.rotationSpeed * delta;
    
    // Store previous position
    this.previousPosition.copy(this.position);
    
    // Rotate direction vector
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    
    // Update object rotation
    this.mowerObject.rotation.y -= angle;
    
    // Rotate wheels based on turning direction and speed
    const wheelSpeed = Math.abs(this.speed) * delta * 10;
    this.mowerWheels.forEach(wheel => {
      wheel.rotation.x += this.speed > 0 ? wheelSpeed : -wheelSpeed;
    });
  }
  
  public update(delta: number) {
    // Rotate blades if mower is running
    if (this.isRunning) {
      this.bladeRotation += delta * 20; // Fast rotation
      this.mowerBlades.rotation.z = this.bladeRotation;
    }
    
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
    
    // If mower is running, apply a small vibration effect
    if (this.isRunning && this.speed > 0.5) {
      this.mowerBody.position.y = 0.17 + Math.sin(performance.now() / 50) * 0.005;
    }
  }
  
  public reset() {
    this.position.set(0, 0, 0);
    this.direction.set(0, 0, -1);
    this.speed = 0;
    this.isRunning = false;
    this.hasCollided = false;
    this.collisionObjects = [];
    this.previousPosition.copy(this.position);
    this.mowerObject.position.copy(this.position);
    this.mowerObject.rotation.set(0, 0, 0);
    this.mowerBody.rotation.set(0, 0, 0);
  }
}
