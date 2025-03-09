import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';
import { grassVertexShader, grassFragmentShader } from './Shaders';

export class GrassSystem {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private grassMesh: THREE.InstancedMesh | null = null;
  private grassGeometry: THREE.PlaneGeometry | null = null;
  private grassMaterial: THREE.ShaderMaterial | null = null;
  private grassPositions: Float32Array | null = null;
  private grassStates: Float32Array | null = null; // 0 = not mowed, 1 = mowed
  private grassMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private grassCount: number = 100000; // Number of grass instances - doubled for denser coverage
  private grassData: {
    position: THREE.Vector3;
    scale: number;
    rotation: number;
    state: number; // 0 = not mowed, 1 = mowed
  }[] = [];
  private totalGrass: number = 0;
  private mowedGrass: number = 0;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private windTime: number = 0;

  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    this.totalGrass = this.grassCount;
  }

  public async initialize() {
    // Create grass blade geometry (simple plane for now)
    this.grassGeometry = new THREE.PlaneGeometry(0.1, 0.3, 1, 3);
    this.grassGeometry.translate(0, 0.15, 0); // Center pivot at bottom

    // Create custom shader material for grass
    this.grassMaterial = new THREE.ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        windStrength: { value: 0.1 },
        mowedHeight: { value: 0.05 }
      }
    });

    // Create instanced mesh for efficient rendering
    this.grassMesh = new THREE.InstancedMesh(
      this.grassGeometry,
      this.grassMaterial,
      this.grassCount
    );
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;
    this.scene.add(this.grassMesh);

    // Generate grass positions on terrain
    await this.generateGrass();

    // Update instanced mesh
    this.updateGrassInstances();

    return true;
  }

  private async generateGrass() {
    const terrainSize = this.terrain.getSize();
    const halfWidth = terrainSize.width / 2;
    const halfDepth = terrainSize.depth / 2;

    this.grassData = [];

    // Create grass blades with random positions near the player's starting point
    // We'll use a higher density but smaller initial area
    // More grass will be generated/placed as player moves
    const initialRadius = 60; // Much higher initial radius to see more grass
    const densityFactor = 0.8; // Higher density

    for (let i = 0; i < this.grassCount; i++) {
      // Use polar coordinates for better distribution
      const radius = Math.sqrt(Math.random()) * initialRadius;
      const theta = Math.random() * Math.PI * 2;
      
      // Convert to Cartesian coordinates
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = this.terrain.getHeightAt(x, z);

      // Higher grass density by using more tightly packed positions
      const densityVariation = Math.random() * densityFactor;
      
      // Random scale and rotation with more height variation
      const scale = 0.6 + Math.random() * 0.5;
      const rotation = Math.random() * Math.PI * 2;

      // Skip positions that are too close to objects or obstacles
      if (this.terrain.checkCollision(new THREE.Vector3(x, y, z), 1.0)) {
        // Try again with a new position
        i--;
        continue;
      }

      this.grassData.push({
        position: new THREE.Vector3(x, y, z),
        scale,
        rotation,
        state: 0 // Not mowed initially
      });
    }

    this.totalGrass = this.grassData.length;
    this.mowedGrass = 0;

    return true;
  }

  private updateGrassInstances() {
    if (!this.grassMesh) return;

    // Update all grass instances
    for (let i = 0; i < this.grassData.length; i++) {
      const grass = this.grassData[i];

      this.dummy.position.copy(grass.position);
      this.dummy.rotation.y = grass.rotation;
      this.dummy.scale.set(grass.scale, grass.scale * (grass.state === 0 ? 1 : 0.2), grass.scale);
      this.dummy.updateMatrix();

      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
  }

  public update(delta: number) {
    if (!this.grassMaterial) return;

    // Update wind animation
    this.windTime += delta;
    this.grassMaterial.uniforms.time.value = this.windTime;
  }

  public mow(position: THREE.Vector3, direction: THREE.Vector3): number {
    if (!this.grassMesh) return 0;

    const mowRadius = 0.8; // Mower cutting radius
    let mowedThisFrame = 0;

    // Check for grass blades within cutting radius
    for (let i = 0; i < this.grassData.length; i++) {
      const grass = this.grassData[i];

      // Skip already mowed grass
      if (grass.state === 1) continue;

      // Check if grass is within mowing radius
      const dx = grass.position.x - position.x;
      const dz = grass.position.z - position.z;
      const distSquared = dx * dx + dz * dz;

      if (distSquared < mowRadius * mowRadius) {
        // Mow the grass
        grass.state = 1;
        this.mowedGrass++;
        mowedThisFrame++;
      }
    }

    // Update instanced mesh if any grass was mowed
    if (mowedThisFrame > 0) {
      this.updateGrassInstances();
    }

    return mowedThisFrame;
  }

  public getTotalGrass() {
    return this.totalGrass;
  }

  public getMowedGrass() {
    return this.mowedGrass;
  }

  public getMowedPercentage() {
    return (this.mowedGrass / this.totalGrass) * 100;
  }
  
  public getMowedSquareFeet() {
    // Each grass instance represents a small area
    // We'll use a conversion factor where each grass blade is ~0.5 square feet
    const SQUARE_FEET_PER_BLADE = 0.5;
    return Math.floor(this.mowedGrass * SQUARE_FEET_PER_BLADE);
  }

  public reset() {
    // Reset all grass to not mowed
    for (let i = 0; i < this.grassData.length; i++) {
      this.grassData[i].state = 0;
    }

    this.mowedGrass = 0;
    this.updateGrassInstances();
  }
}