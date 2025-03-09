import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class TerrainGenerator {
  private scene: THREE.Scene;
  private terrain: THREE.Mesh | null = null;
  private width: number;
  private depth: number;
  private heightMap: number[][] = [];
  private gridSize = 1; // Size of each grid cell
  private noise2D: (x: number, y: number) => number;
  
  constructor(scene: THREE.Scene, width: number, depth: number) {
    this.scene = scene;
    this.width = width;
    this.depth = depth;
    this.noise2D = createNoise2D();
  }
  
  public async initialize() {
    // Generate height map using Perlin noise
    this.generateHeightMap();
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.depth,
      this.width / this.gridSize,
      this.depth / this.gridSize
    );
    
    // Apply height map to geometry
    this.applyHeightMap(geometry);
    
    // Create material with grass texture
    const material = new THREE.MeshStandardMaterial({
      color: 0x7CFC00,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create mesh
    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2; // Rotate to horizontal
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    
    return true;
  }
  
  private generateHeightMap() {
    const gridX = Math.ceil(this.width / this.gridSize) + 1;
    const gridZ = Math.ceil(this.depth / this.gridSize) + 1;
    
    this.heightMap = [];
    
    // Generate height map using multiple octaves of Perlin noise
    for (let z = 0; z < gridZ; z++) {
      this.heightMap[z] = [];
      for (let x = 0; x < gridX; x++) {
        // Convert grid coordinates to world coordinates
        const worldX = (x * this.gridSize) - (this.width / 2);
        const worldZ = (z * this.gridSize) - (this.depth / 2);
        
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
        
        this.heightMap[z][x] = height;
      }
    }
  }
  
  private applyHeightMap(geometry: THREE.PlaneGeometry) {
    const vertices = geometry.attributes.position.array;
    
    // Update vertex positions based on height map
    for (let i = 0; i < vertices.length; i += 3) {
      // Convert vertex index to grid coordinates
      const vertexIndex = i / 3;
      const gridX = vertexIndex % (this.width / this.gridSize + 1);
      const gridZ = Math.floor(vertexIndex / (this.width / this.gridSize + 1));
      
      // Get height from height map
      const height = this.heightMap[gridZ][gridX];
      
      // Apply height to vertex
      vertices[i + 2] = height;
    }
    
    // Update geometry
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
  }
  
  public getHeightAt(x: number, z: number): number {
    // Convert world coordinates to grid coordinates
    const gridX = Math.floor((x + (this.width / 2)) / this.gridSize);
    const gridZ = Math.floor((z + (this.depth / 2)) / this.gridSize);
    
    // Clamp grid coordinates to valid range
    const clampedGridX = Math.max(0, Math.min(gridX, this.heightMap[0].length - 2));
    const clampedGridZ = Math.max(0, Math.min(gridZ, this.heightMap.length - 2));
    
    // Get heights at surrounding grid points
    const h00 = this.heightMap[clampedGridZ][clampedGridX];
    const h10 = this.heightMap[clampedGridZ][clampedGridX + 1];
    const h01 = this.heightMap[clampedGridZ + 1][clampedGridX];
    const h11 = this.heightMap[clampedGridZ + 1][clampedGridX + 1];
    
    // Calculate fractional position within grid cell
    const fx = ((x + (this.width / 2)) / this.gridSize) - clampedGridX;
    const fz = ((z + (this.depth / 2)) / this.gridSize) - clampedGridZ;
    
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
    // Regenerate terrain with new randomization
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      this.terrain = null;
    }
    
    this.initialize();
  }
}
