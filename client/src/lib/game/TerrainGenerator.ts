import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface TerrainChunk {
  mesh: THREE.Mesh;
  heightMap: number[][];
}

export class TerrainGenerator {
  private scene: THREE.Scene;
  private chunks: Map<string, TerrainChunk> = new Map();
  private chunkSize: number = 50; // Size of each terrain chunk
  private chunkResolution: number = 1; // Grid size within chunk
  private visibleDistance: number = 3; // Number of chunks visible in each direction (increased for more coverage)
  private maxHeight: number = 0.5; // Maximum terrain height (further reduced for very flat lawn)
  private noise2D: (x: number, y: number) => number;
  private seed: number; // Random seed for terrain generation
  
  // Ground texture materials
  private groundTextures: THREE.MeshStandardMaterial[];
  
  // Obstacles for collision detection
  private obstacles: THREE.Object3D[] = [];
  
  constructor(scene: THREE.Scene, width: number, depth: number) {
    this.scene = scene;
    this.noise2D = createNoise2D();
    // Generate random seed for terrain variation between game sessions
    this.seed = Math.random() * 10000;
    
    // Create uniform lawn-like ground texture materials
    // Using a narrower range of greens for more consistent lawn appearance
    this.groundTextures = [
      new THREE.MeshStandardMaterial({ 
        color: 0x4D8A2F, // Base lawn green
        roughness: 0.9,   // More rough for grass-like appearance
        metalness: 0.1    // Slight reflectivity for morning dew effect
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x528A34, // Slightly lighter green variant
        roughness: 0.9,
        metalness: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x498930, // Slightly more vibrant green
        roughness: 0.9,
        metalness: 0.1
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x4A8A33, // Very similar base green
        roughness: 0.9,
        metalness: 0.1
      })
    ];
  }
  
  public async initialize() {
    // Generate initial terrain around origin
    await this.updateTerrain(new THREE.Vector3(0, 0, 0));
    return true;
  }
  
  // Update terrain chunks based on player position
  public async updateTerrain(playerPosition: THREE.Vector3) {
    const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
    const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
    
    // Keep track of chunks that should be visible
    const chunksToKeep = new Set<string>();
    
    // Generate/show chunks within visible distance
    for (let x = playerChunkX - this.visibleDistance; x <= playerChunkX + this.visibleDistance; x++) {
      for (let z = playerChunkZ - this.visibleDistance; z <= playerChunkZ + this.visibleDistance; z++) {
        const chunkKey = `${x},${z}`;
        chunksToKeep.add(chunkKey);
        
        // Create chunk if it doesn't exist
        if (!this.chunks.has(chunkKey)) {
          await this.createChunk(x, z);
        }
      }
    }
    
    // Remove chunks that are too far away
    Array.from(this.chunks.entries()).forEach(([key, chunk]) => {
      if (!chunksToKeep.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        if (chunk.mesh.material instanceof THREE.Material) {
          chunk.mesh.material.dispose();
        }
        this.chunks.delete(key);
      }
    });
  }
  
  private async createChunk(chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Generate height map for this chunk
    const heightMap = this.generateChunkHeightMap(chunkX, chunkZ);
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      this.chunkSize / this.chunkResolution,
      this.chunkSize / this.chunkResolution
    );
    
    // Apply height map to geometry
    this.applyHeightMapToGeometry(geometry, heightMap);
    
    // Select a random ground texture for this chunk
    const material = this.groundTextures[Math.floor(Math.random() * this.groundTextures.length)];
    
    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    mesh.position.set(
      chunkX * this.chunkSize,
      0,
      chunkZ * this.chunkSize
    );
    mesh.receiveShadow = true;
    
    // Add to scene
    this.scene.add(mesh);
    
    // Store chunk
    this.chunks.set(chunkKey, { mesh, heightMap });
    
    return { mesh, heightMap };
  }
  

  
  private generateChunkHeightMap(chunkX: number, chunkZ: number): number[][] {
    const gridSize = Math.ceil(this.chunkSize / this.chunkResolution) + 1;
    const heightMap: number[][] = [];
    
    for (let z = 0; z < gridSize; z++) {
      heightMap[z] = [];
      for (let x = 0; x < gridSize; x++) {
        // Convert local grid coordinates to world coordinates
        const worldX = (chunkX * this.chunkSize) + (x * this.chunkResolution);
        const worldZ = (chunkZ * this.chunkSize) + (z * this.chunkResolution);
        
        // Generate height using noise with seed
        heightMap[z][x] = this.calculateHeightAt(worldX, worldZ);
      }
    }
    
    return heightMap;
  }
  
  private calculateHeightAt(x: number, z: number): number {
    // Add seed to coordinates for variation between game sessions
    const nx = x * 0.01 + this.seed; // Reduce frequency for smoother terrain
    const nz = z * 0.01 + this.seed;
    
    // Generate base height using simplified noise approach for flatter terrain
    let height = 0;
    let amplitude = 0.4; // Reduced amplitude
    let frequency = 0.5; // Lower frequency for smoother lawn
    
    // Use fewer octaves for smoother, more lawn-like terrain
    for (let octave = 0; octave < 2; octave++) { // Reduced from 4 to 2 octaves
      height += this.noise2D(nx * frequency, nz * frequency) * amplitude;
      amplitude *= 0.4; // Steeper falloff for flatter result
      frequency *= 1.5; // Gentler frequency increase
    }
    
    // Normalize and scale
    height = (height + 1) * 0.5; // Convert from -1..1 to 0..1
    height = Math.pow(height, 2.0); // More aggressive flattening
    height *= this.maxHeight; // Scale to max height
    
    // Add very minimal detail noise for slight texture
    const detailNoise = this.noise2D(nx * 8, nz * 8) * 0.02; // Reduced detail noise
    height += detailNoise;
    
    // Keep terrain slightly above 0 to prevent clipping
    return Math.max(0.05, height);
  }
  
  private applyHeightMapToGeometry(geometry: THREE.PlaneGeometry, heightMap: number[][]) {
    const vertices = geometry.attributes.position.array;
    const gridSize = Math.ceil(this.chunkSize / this.chunkResolution) + 1;
    
    // Update vertex positions based on height map
    for (let i = 0; i < vertices.length; i += 3) {
      // Convert vertex index to grid coordinates
      const vertexIndex = i / 3;
      const gridX = vertexIndex % gridSize;
      const gridZ = Math.floor(vertexIndex / gridSize);
      
      // Get height from height map
      const height = heightMap[gridZ][gridX];
      
      // Apply height to vertex y position (note: when rotated, y becomes up)
      vertices[i + 2] = height;
    }
    
    // Update geometry
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }
  
  public getHeightAt(x: number, z: number): number {
    // Find which chunk contains this position
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // If chunk doesn't exist, calculate height algorithmically
    if (!this.chunks.has(chunkKey)) {
      return this.calculateHeightAt(x, z);
    }
    
    // Get local coordinates within chunk
    const localX = x - (chunkX * this.chunkSize);
    const localZ = z - (chunkZ * this.chunkSize);
    
    // Convert to grid coordinates
    const chunk = this.chunks.get(chunkKey)!;
    const gridX = Math.floor(localX / this.chunkResolution);
    const gridZ = Math.floor(localZ / this.chunkResolution);
    
    // Clamp to valid range
    const gridSizeX = chunk.heightMap[0].length - 1;
    const gridSizeZ = chunk.heightMap.length - 1;
    const clampedGridX = Math.max(0, Math.min(gridX, gridSizeX));
    const clampedGridZ = Math.max(0, Math.min(gridZ, gridSizeZ));
    
    // Get heights of surrounding grid points for interpolation
    const x0 = Math.min(clampedGridX, gridSizeX - 1);
    const x1 = Math.min(x0 + 1, gridSizeX);
    const z0 = Math.min(clampedGridZ, gridSizeZ - 1);
    const z1 = Math.min(z0 + 1, gridSizeZ);
    
    const h00 = chunk.heightMap[z0][x0];
    const h10 = chunk.heightMap[z0][x1];
    const h01 = chunk.heightMap[z1][x0];
    const h11 = chunk.heightMap[z1][x1];
    
    // Calculate fractional position for interpolation
    const fx = (localX / this.chunkResolution) - x0;
    const fz = (localZ / this.chunkResolution) - z0;
    
    // Bilinear interpolation
    const top = h00 * (1 - fx) + h10 * fx;
    const bottom = h01 * (1 - fx) + h11 * fx;
    const height = top * (1 - fz) + bottom * fz;
    
    return height;
  }
  
  public getSize() {
    // Return visible terrain size (in practice, this is infinite)
    return {
      width: this.chunkSize * (this.visibleDistance * 2 + 1),
      depth: this.chunkSize * (this.visibleDistance * 2 + 1)
    };
  }
  
  // Ground level functions
  public getBaseLevel(): number {
    return 0.05; // Minimum ground height
  }
  
  public addObstacle(obstacle: THREE.Object3D) {
    this.obstacles.push(obstacle);
  }
  
  public removeObstacle(obstacle: THREE.Object3D) {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
    }
  }
  
  public checkCollision(position: THREE.Vector3, radius: number = 0.5): boolean {
    // Check collision with obstacles
    for (const obstacle of this.obstacles) {
      // Simple distance-based collision
      const obstaclePos = new THREE.Vector3();
      obstacle.getWorldPosition(obstaclePos);
      
      // Use obstacle's bounding box for collision size
      const boundingBox = new THREE.Box3().setFromObject(obstacle);
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      
      // Approximate collision radius
      const obstacleRadius = (size.x + size.z) / 4;
      
      // Check distance-based collision
      const distance = position.distanceTo(obstaclePos);
      if (distance < (radius + obstacleRadius)) {
        return true;
      }
    }
    
    return false;
  }
  
  public reset() {
    // Remove all chunks
    Array.from(this.chunks.entries()).forEach(([key, chunk]) => {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      if (chunk.mesh.material instanceof THREE.Material) {
        chunk.mesh.material.dispose();
      }
    });
    this.chunks.clear();
    
    // Clear all obstacles
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle);
    }
    this.obstacles = [];
    
    // Generate new seed for terrain variation
    this.seed = Math.random() * 10000;
    
    // Initialize terrain again
    this.initialize();
  }
}
