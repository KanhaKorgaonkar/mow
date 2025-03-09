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
  private grassColors: Float32Array | null = null; // For color variation
  private grassMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private grassCount: number = 80000; // Increased number of grass instances
  private grassPerChunk: number = 10000; // Number of grass instances per terrain chunk
  private grassData: {
    position: THREE.Vector3;
    scale: number;
    rotation: number;
    state: number; // 0 = not mowed, 1 = mowed
    color: THREE.Color; // Color variation for each grass blade
  }[] = [];
  private totalGrass: number = 0;
  private mowedGrass: number = 0;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private windTime: number = 0;
  private chunkSize: number; // Size of each terrain chunk
  private sunDirection: THREE.Vector3 = new THREE.Vector3(0.5, 1, 0.3).normalize();
  private sunColor: THREE.Color = new THREE.Color(1, 1, 0.9);
  private ambientColor: THREE.Color = new THREE.Color(0.2, 0.2, 0.3);
  private windStrength: number = 0.15;
  private currentPlayerChunk: { x: number, z: number } = { x: 0, z: 0 };
  
  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    this.chunkSize = terrain.getSize().width;
    this.totalGrass = this.grassCount;
  }
  
  public async initialize() {
    // Create more detailed grass blade geometry (cross-shaped for better 3D effect)
    this.createGrassGeometry();
    
    // Create states and colors buffer attributes
    this.grassStates = new Float32Array(this.grassCount);
    this.grassColors = new Float32Array(this.grassCount * 3);
    
    // Initialize all states to not mowed
    for (let i = 0; i < this.grassCount; i++) {
      this.grassStates[i] = 0;
      
      // Generate slight color variations for natural look
      this.grassColors[i * 3] = 0.1 + Math.random() * 0.1; // R (green variation)
      this.grassColors[i * 3 + 1] = 0.4 + Math.random() * 0.2; // G (dominant green)
      this.grassColors[i * 3 + 2] = 0.05 + Math.random() * 0.1; // B (slight blue tint)
    }
    
    // Create custom shader material for grass with enhanced uniforms
    this.grassMaterial = new THREE.ShaderMaterial({
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        windStrength: { value: this.windStrength },
        mowedHeight: { value: 0.05 },
        sunDirection: { value: this.sunDirection },
        sunColor: { value: this.sunColor },
        ambientColor: { value: this.ambientColor }
      }
    });
    
    // Create instanced mesh for efficient rendering
    this.grassMesh = new THREE.InstancedMesh(
      this.grassGeometry,
      this.grassMaterial,
      this.grassCount
    );
    
    // Add state attribute (for mowed vs. not mowed)
    this.grassGeometry.setAttribute(
      'grassState',
      new THREE.InstancedBufferAttribute(this.grassStates, 1)
    );
    
    // Add color attribute for variation
    this.grassGeometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(this.grassColors, 3)
    );
    
    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;
    this.scene.add(this.grassMesh);
    
    // Generate initial grass around origin
    await this.generateGrassInChunk(0, 0);
    
    // Update instanced mesh
    this.updateGrassInstances();
    
    return true;
  }
  
  private createGrassGeometry() {
    // Create cross-shaped grass blade for better 3D appearance
    const bladeHeight = 0.4; // Taller grass
    const bladeWidth = 0.1;
    
    // Create a more detailed grass blade with multiple segments for better bending
    this.grassGeometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 4);
    this.grassGeometry.translate(0, bladeHeight / 2, 0); // Center pivot at bottom
    
    // Create a second plane rotated 90 degrees to make a cross shape
    const grassGeometry2 = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 1, 4);
    grassGeometry2.translate(0, bladeHeight / 2, 0);
    grassGeometry2.rotateY(Math.PI / 2); // Rotate 90 degrees
    
    // Merge the two planes
    const mergedGeometry = new THREE.BufferGeometry();
    
    // Copy attributes from both geometries
    const positions1 = this.grassGeometry.attributes.position.array;
    const positions2 = grassGeometry2.attributes.position.array;
    const uvs1 = this.grassGeometry.attributes.uv.array;
    const uvs2 = grassGeometry2.attributes.uv.array;
    const normals1 = this.grassGeometry.attributes.normal.array;
    const normals2 = grassGeometry2.attributes.normal.array;
    
    // Create merged arrays
    const positions = new Float32Array(positions1.length + positions2.length);
    const uvs = new Float32Array(uvs1.length + uvs2.length);
    const normals = new Float32Array(normals1.length + normals2.length);
    
    // Copy data
    positions.set(positions1, 0);
    positions.set(positions2, positions1.length);
    uvs.set(uvs1, 0);
    uvs.set(uvs2, uvs1.length);
    normals.set(normals1, 0);
    normals.set(normals2, normals1.length);
    
    // Set attributes
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    mergedGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    
    // Combine the indices
    const indices1 = this.grassGeometry.index?.array;
    const indices2 = grassGeometry2.index?.array;
    
    if (indices1 && indices2) {
      const vertexCount1 = positions1.length / 3;
      const indices = new Uint16Array(indices1.length + indices2.length);
      indices.set(indices1, 0);
      
      // Offset indices from the second geometry
      for (let i = 0; i < indices2.length; i++) {
        indices[indices1.length + i] = indices2[i] + vertexCount1;
      }
      
      mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    
    this.grassGeometry = mergedGeometry;
  }
  
  private async generateGrassInChunk(chunkX: number, chunkZ: number) {
    // Calculate chunk boundaries
    const startX = chunkX * this.chunkSize;
    const startZ = chunkZ * this.chunkSize;
    const endX = startX + this.chunkSize;
    const endZ = startZ + this.chunkSize;
    
    // Determine how many instances to create in this chunk
    const instancesInChunk = Math.min(this.grassPerChunk, this.grassCount - this.grassData.length);
    
    // Create grass blades with random positions within this chunk
    for (let i = 0; i < instancesInChunk; i++) {
      const x = startX + Math.random() * this.chunkSize;
      const z = startZ + Math.random() * this.chunkSize;
      const y = this.terrain.getHeightAt(x, z);
      
      // Skip positions that are too high or too low (water)
      if (y > 5 || y < 0.05) continue;
      
      // Varied scales for more natural look
      const scale = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      const rotation = Math.random() * Math.PI * 2;
      
      // Create random color variation
      const color = new THREE.Color(
        0.05 + Math.random() * 0.1,  // R (subtle red)
        0.3 + Math.random() * 0.2,   // G (dominant green)
        0.05 + Math.random() * 0.05  // B (subtle blue)
      );
      
      this.grassData.push({
        position: new THREE.Vector3(x, y, z),
        scale,
        rotation,
        state: 0, // Not mowed initially
        color
      });
    }
    
    this.totalGrass = this.grassData.length;
    return true;
  }
  
  public updateGrassChunks(playerPosition: THREE.Vector3) {
    // Calculate which chunk the player is in
    const chunkX = Math.floor(playerPosition.x / this.chunkSize);
    const chunkZ = Math.floor(playerPosition.z / this.chunkSize);
    
    // If player moved to a new chunk, generate more grass
    if (chunkX !== this.currentPlayerChunk.x || chunkZ !== this.currentPlayerChunk.z) {
      // Only generate new grass if we haven't reached the limit
      if (this.grassData.length < this.grassCount) {
        this.generateGrassInChunk(chunkX, chunkZ);
        this.updateGrassInstances();
      }
      
      this.currentPlayerChunk = { x: chunkX, z: chunkZ };
    }
  }
  
  private updateGrassInstances() {
    if (!this.grassMesh) return;
    
    // Update all grass instances
    for (let i = 0; i < this.grassData.length; i++) {
      const grass = this.grassData[i];
      
      this.dummy.position.copy(grass.position);
      this.dummy.rotation.y = grass.rotation;
      
      // Scale based on whether it's mowed or not
      const heightScale = grass.state === 0 ? 1 : 0.2;
      this.dummy.scale.set(grass.scale, grass.scale * heightScale, grass.scale);
      this.dummy.updateMatrix();
      
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
      
      // Update grass state attribute
      if (this.grassStates) {
        this.grassStates[i] = grass.state;
      }
      
      // Update grass color attribute
      if (this.grassColors) {
        this.grassColors[i * 3] = grass.color.r;
        this.grassColors[i * 3 + 1] = grass.color.g;
        this.grassColors[i * 3 + 2] = grass.color.b;
      }
    }
    
    // Update buffer attributes
    this.grassMesh.instanceMatrix.needsUpdate = true;
    (this.grassGeometry?.getAttribute('grassState') as THREE.InstancedBufferAttribute).needsUpdate = true;
    (this.grassGeometry?.getAttribute('instanceColor') as THREE.InstancedBufferAttribute).needsUpdate = true;
  }
  
  public update(delta: number) {
    if (!this.grassMaterial) return;
    
    // Update wind animation with slower time progression for more gentle movement
    this.windTime += delta * 0.5;
    this.grassMaterial.uniforms.time.value = this.windTime;
    
    // Slightly vary wind strength over time for more natural effect
    const windVariation = Math.sin(this.windTime * 0.1) * 0.05 + 0.1;
    this.grassMaterial.uniforms.windStrength.value = this.windStrength + windVariation;
    
    // Update sun direction based on time of day (if we had a day/night cycle)
    // For now, just use a slight wobble to simulate atmosphere
    const sunWobble = new THREE.Vector3(
      Math.sin(this.windTime * 0.05) * 0.02,
      Math.cos(this.windTime * 0.04) * 0.02,
      Math.sin(this.windTime * 0.03) * 0.02
    );
    this.sunDirection.add(sunWobble).normalize();
    this.grassMaterial.uniforms.sunDirection.value = this.sunDirection;
  }
  
  public mow(position: THREE.Vector3, direction: THREE.Vector3): number {
    if (!this.grassMesh) return 0;
    
    const mowRadius = 0.8; // Mower cutting radius
    const directionFactor = 0.5; // How much to consider direction (forward only)
    let mowedThisFrame = 0;
    
    // Normalize direction for dot product calculations
    const normalizedDirection = direction.clone().normalize();
    
    // Check for grass blades within cutting radius
    for (let i = 0; i < this.grassData.length; i++) {
      const grass = this.grassData[i];
      
      // Skip already mowed grass
      if (grass.state === 1) continue;
      
      // Vector from mower to grass
      const toGrass = new THREE.Vector3(
        grass.position.x - position.x,
        0,
        grass.position.z - position.z
      );
      
      const distance = toGrass.length();
      
      // Skip if too far away
      if (distance > mowRadius) continue;
      
      // Only mow grass that's in front of the mower
      const dotProduct = normalizedDirection.dot(toGrass.normalize());
      if (dotProduct < -directionFactor) { // Grass is in front of the mower
        // Mow the grass
        grass.state = 1;
        
        // Update color to be more yellow/brown when mowed
        grass.color.setRGB(
          0.5 + Math.random() * 0.2, // More red
          0.45 + Math.random() * 0.15, // Less green
          0.1 + Math.random() * 0.1  // More brown
        );
        
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
      
      // Reset to original grass colors
      this.grassData[i].color.setRGB(
        0.05 + Math.random() * 0.1,  // R
        0.3 + Math.random() * 0.2,   // G
        0.05 + Math.random() * 0.05  // B
      );
    }
    
    this.mowedGrass = 0;
    this.updateGrassInstances();
  }
}
