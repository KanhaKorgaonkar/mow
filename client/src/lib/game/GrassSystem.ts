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
  private grassCount: number = 50000; // Number of grass instances
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

    // Create grass blades with random positions, scales, and rotations
    for (let i = 0; i < this.grassCount; i++) {
      // Get random position within terrain with improved distribution
      // Use a slightly smaller area with higher density
      const terrainCoverage = 0.85; // Cover more of the terrain 
      const x = (Math.random() - 0.5) * terrainSize.width * terrainCoverage;
      const z = (Math.random() - 0.5) * terrainSize.depth * terrainCoverage;
      const y = this.terrain.getHeightAt(x, z);

      // Random scale and rotation
      const scale = 0.7 + Math.random() * 0.4; // Slightly smaller grass for better performance
      const rotation = Math.random() * Math.PI * 2;

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

  public reset() {
    // Reset all grass to not mowed
    for (let i = 0; i < this.grassData.length; i++) {
      this.grassData[i].state = 0;
    }

    this.mowedGrass = 0;
    this.updateGrassInstances();
  }
}