import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';

export class LawnMower {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private mowerObject: THREE.Group;
  private mowerBody: THREE.Mesh;
  private mowerBlades: THREE.Mesh;
  private mowerWheels: THREE.Mesh[];
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  private speed: number = 0;
  private maxSpeed: number = 3; // meters per second
  private acceleration: number = 3; // meters per second squared
  private deceleration: number = 5; // meters per second squared
  private rotationSpeed: number = 2; // radians per second
  private isRunning: boolean = false;
  private bladeRotation: number = 0;
  
  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    
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
  }
  
  public stop() {
    this.isRunning = false;
  }
  
  public moveForward(active: boolean, delta: number) {
    if (active) {
      // Accelerate
      this.speed = Math.min(this.speed + this.acceleration * delta, this.maxSpeed);
    } else {
      // Decelerate
      this.speed = Math.max(this.speed - this.deceleration * delta, 0);
    }
    
    // Move forward in current direction
    const movement = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(movement);
    
    // Adjust height based on terrain
    const terrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
    this.position.y = terrainHeight;
    
    // Update object position
    this.mowerObject.position.copy(this.position);
  }
  
  public turn(direction: 'left' | 'right', delta: number) {
    const angle = (direction === 'left' ? 1 : -1) * this.rotationSpeed * delta;
    
    // Rotate direction vector
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    
    // Update object rotation
    this.mowerObject.rotation.y -= angle;
    
    // Rotate wheels based on turning direction and speed
    this.mowerWheels.forEach(wheel => {
      wheel.rotation.x += this.speed * delta * 10; // Rotate based on movement speed
    });
  }
  
  public update(delta: number) {
    // Rotate blades if mower is running
    if (this.isRunning) {
      this.bladeRotation += delta * 15; // Fast rotation
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
  }
  
  public reset() {
    this.position.set(0, 0, 0);
    this.direction.set(0, 0, -1);
    this.speed = 0;
    this.isRunning = false;
    this.mowerObject.position.copy(this.position);
    this.mowerObject.rotation.set(0, 0, 0);
    this.mowerBody.rotation.set(0, 0, 0);
  }
}
