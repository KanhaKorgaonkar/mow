import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
  private scene: THREE.Scene;
  private terrainChunks: Map<string, THREE.Mesh> = new Map();
  private width: number;
  private depth: number;
  private heightMaps: Map<string, number[][]> = new Map();
  private gridSize = 1; // Size of each grid cell
  private chunkSize: number; // Size of each terrain chunk
  private noise2D: (x: number, y: number) => number;
  private currentChunkX: number = 0;
  private currentChunkZ: number = 0;
  private loadDistance: number = 2; // How many chunks to load in each direction
  
  constructor(scene: THREE.Scene, width: number, depth: number) {
    this.scene = scene;
    this.width = width;
    this.depth = depth;
    this.chunkSize = width; // Each chunk is the same size as the original terrain
    this.noise2D = createNoise2D();
  }
  
  public async initialize() {
    // Initialize the terrain at the origin
    this.updateVisibleChunks(0, 0);
    return true;
  }
  
  // Generate a chunk at specified coordinates
  private generateChunk(chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Check if chunk already exists
    if (this.terrainChunks.has(chunkKey)) {
      return;
    }
    
    // Generate height map for this chunk
    this.generateHeightMapForChunk(chunkX, chunkZ);
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      this.chunkSize / this.gridSize,
      this.chunkSize / this.gridSize
    );
    
    // Apply height map to geometry
    this.applyHeightMapToChunk(geometry, chunkX, chunkZ);
    
    // Create material with grass texture
    const material = new THREE.MeshStandardMaterial({
      color: 0x7CFC00,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create mesh
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2; // Rotate to horizontal
    terrain.position.set(
      chunkX * this.chunkSize, 
      0, 
      chunkZ * this.chunkSize
    );
    terrain.receiveShadow = true;
    this.scene.add(terrain);
    
    // Store the chunk
    this.terrainChunks.set(chunkKey, terrain);
  }
  
  private generateHeightMapForChunk(chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    const gridX = Math.ceil(this.chunkSize / this.gridSize) + 1;
    const gridZ = Math.ceil(this.chunkSize / this.gridSize) + 1;
    
    const heightMap: number[][] = [];
    
    // Generate height map using multiple octaves of Perlin noise
    for (let z = 0; z < gridZ; z++) {
      heightMap[z] = [];
      for (let x = 0; x < gridX; x++) {
        // Convert grid coordinates to world coordinates (factoring in chunk position)
        const worldX = (x * this.gridSize) + (chunkX * this.chunkSize);
        const worldZ = (z * this.gridSize) + (chunkZ * this.chunkSize);
        
        // Generate height using multiple octaves of noise
        let height = 0;
        let amplitude = 0.5;
        let frequency = 0.02;
        
        // Add multiple octaves of noise
        for (let octave = 0; octave < 4; octave++) {
          height += this.noise2D(worldX * frequency, worldZ * frequency) * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }
        
        // Scale and offset height
        height *= 1.0; // Overall height scale
        height = Math.max(0, height); // Ensure minimum height is 0
        
        heightMap[z][x] = height;
      }
    }
    
    // Store the height map for this chunk
    this.heightMaps.set(chunkKey, heightMap);
  }
  
  private applyHeightMapToChunk(geometry: THREE.PlaneGeometry, chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    const heightMap = this.heightMaps.get(chunkKey);
    
    if (!heightMap) {
      console.error('No height map found for chunk', chunkKey);
      return;
    }
    
    const vertices = geometry.attributes.position.array;
    
    // Update vertex positions based on height map
    for (let i = 0; i < vertices.length; i += 3) {
      // Convert vertex index to local grid coordinates within the chunk
      const vertexIndex = i / 3;
      const gridX = vertexIndex % (this.chunkSize / this.gridSize + 1);
      const gridZ = Math.floor(vertexIndex / (this.chunkSize / this.gridSize + 1));
      
      // Get height from height map
      const height = heightMap[gridZ][gridX];
      
      // Apply height to vertex
      vertices[i + 2] = height;
    }
    
    // Update geometry
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }
  
  public updateVisibleChunks(playerX: number, playerZ: number) {
    // Calculate which chunk the player is in
    const chunkX = Math.floor(playerX / this.chunkSize);
    const chunkZ = Math.floor(playerZ / this.chunkSize);
    
    // If player has moved to a new chunk, update visible chunks
    if (chunkX !== this.currentChunkX || chunkZ !== this.currentChunkZ) {
      this.currentChunkX = chunkX;
      this.currentChunkZ = chunkZ;
      
      // Generate chunks in a square around player
      for (let x = chunkX - this.loadDistance; x <= chunkX + this.loadDistance; x++) {
        for (let z = chunkZ - this.loadDistance; z <= chunkZ + this.loadDistance; z++) {
          this.generateChunk(x, z);
        }
      }
      
      // Remove chunks that are too far away
      this.terrainChunks.forEach((chunk, key) => {
        const [chunkX, chunkZ] = key.split(',').map(Number);
        const distance = Math.max(
          Math.abs(chunkX - this.currentChunkX),
          Math.abs(chunkZ - this.currentChunkZ)
        );
        
        if (distance > this.loadDistance + 1) {
          this.scene.remove(chunk);
          chunk.geometry.dispose();
          this.terrainChunks.delete(key);
          this.heightMaps.delete(key);
        }
      });
    }
  }
  
  public getHeightAt(x: number, z: number): number {
    // Calculate which chunk the position is in
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkZ = Math.floor(z / this.chunkSize);
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Get local coordinates within the chunk
    const localX = x - (chunkX * this.chunkSize);
    const localZ = z - (chunkZ * this.chunkSize);
    
    // Get height map for this chunk
    const heightMap = this.heightMaps.get(chunkKey);
    
    // If height map doesn't exist, generate it
    if (!heightMap) {
      this.generateHeightMapForChunk(chunkX, chunkZ);
      return this.getHeightAt(x, z); // Retry after generating
    }
    
    // Convert local coordinates to grid coordinates
    const gridX = Math.floor(localX / this.gridSize);
    const gridZ = Math.floor(localZ / this.gridSize);
    
    // Clamp grid coordinates to valid range
    const clampedGridX = Math.max(0, Math.min(gridX, heightMap[0].length - 2));
    const clampedGridZ = Math.max(0, Math.min(gridZ, heightMap.length - 2));
    
    // Get heights at surrounding grid points
    const h00 = heightMap[clampedGridZ][clampedGridX];
    const h10 = heightMap[clampedGridZ][clampedGridX + 1];
    const h01 = heightMap[clampedGridZ + 1][clampedGridX];
    const h11 = heightMap[clampedGridZ + 1][clampedGridX + 1];
    
    // Calculate fractional position within grid cell
    const fx = (localX / this.gridSize) - clampedGridX;
    const fz = (localZ / this.gridSize) - clampedGridZ;
    
    // Bilinear interpolation
    const top = h00 * (1 - fx) + h10 * fx;
    const bottom = h01 * (1 - fx) + h11 * fx;
    const height = top * (1 - fz) + bottom * fz;
    
    return height;
  }
  
  public getSize() {
    return {
      width: this.width,
      depth: this.depth
    };
  }
  
  public reset() {
    // Clear all existing chunks
    this.terrainChunks.forEach((chunk) => {
      this.scene.remove(chunk);
      chunk.geometry.dispose();
    });
    
    this.terrainChunks.clear();
    this.heightMaps.clear();
    
    // Reset current chunk position
    this.currentChunkX = 0;
    this.currentChunkZ = 0;
    
    // Reinitialize
    this.initialize();
  }
}
