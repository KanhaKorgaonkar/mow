import * as THREE from 'three';
import { TerrainGenerator } from './TerrainGenerator';

// Types of scenery objects
type SceneryType = 'House' | 'Tree' | 'Fence' | 'Garden' | 'Shed' | 'Mailbox' | 'Bench';

// Scenery object data
interface SceneryObject {
  type: SceneryType;
  position: THREE.Vector3;
  rotation: number;
  scale: number;
  mesh: THREE.Group;
  discovered: boolean;
  chunkKey: string; // Identifies which chunk this object belongs to
}

// Chunk key format: "x,z"
interface SceneryChunk {
  key: string;
  objects: SceneryObject[];
  generated: boolean;
}

export class SceneryGenerator {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private sceneryObjects: SceneryObject[] = [];
  private sceneryChunks: Map<string, SceneryChunk> = new Map();
  private onSceneryDiscovered: (scenery: string) => void;
  private chunkSize: number; // Size of each terrain chunk
  private loadDistance: number = 2; // How many chunks to load in each direction
  private currentPlayerChunk: { x: number, z: number } = { x: 0, z: 0 };
  private discoveredTypes: Set<string> = new Set(); // Track already discovered scenery types
  private seed: number = Date.now(); // Seed for deterministic generation
  
  constructor(
    scene: THREE.Scene,
    terrain: TerrainGenerator,
    onSceneryDiscovered: (scenery: string) => void
  ) {
    this.scene = scene;
    this.terrain = terrain;
    this.onSceneryDiscovered = onSceneryDiscovered;
    this.chunkSize = terrain.getSize().width;
  }
  
  public async initialize() {
    // Generate initial scenery around origin
    await this.generateSceneryInArea(0, 0, this.loadDistance);
    return true;
  }
  
  // Pseudo-random number generator with seed
  private random(x: number, z: number, salt: number = 0) {
    const n = Math.sin(x * 12.9898 + z * 78.233 + salt * 43.5453 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }
  
  // Generate a deterministic angle based on position
  private randomAngle(x: number, z: number, salt: number = 0) {
    return this.random(x, z, salt) * Math.PI * 2;
  }
  
  // Generate scenery in all chunks around the player
  private async generateSceneryInArea(centerX: number, centerZ: number, radius: number) {
    // Generate chunks in a square around player
    for (let x = centerX - radius; x <= centerX + radius; x++) {
      for (let z = centerZ - radius; z <= centerZ + radius; z++) {
        await this.generateSceneryInChunk(x, z);
      }
    }
  }
  
  // Update visible chunks based on player position
  public async updateSceneryChunks(playerPosition: THREE.Vector3) {
    // Calculate which chunk the player is in
    const chunkX = Math.floor(playerPosition.x / this.chunkSize);
    const chunkZ = Math.floor(playerPosition.z / this.chunkSize);
    
    // If player moved to a new chunk, update visible chunks
    if (chunkX !== this.currentPlayerChunk.x || chunkZ !== this.currentPlayerChunk.z) {
      this.currentPlayerChunk = { x: chunkX, z: chunkZ };
      
      // Generate new chunks around player
      await this.generateSceneryInArea(chunkX, chunkZ, this.loadDistance);
      
      // Remove chunks that are too far away
      this.removeDistantChunks(chunkX, chunkZ, this.loadDistance + 1);
    }
    
    // Return all scenery objects for collision detection
    return this.sceneryObjects;
  }
  
  // Remove chunks that are too far from player
  private removeDistantChunks(centerX: number, centerZ: number, maxDistance: number) {
    const chunksToRemove: string[] = [];
    
    this.sceneryChunks.forEach((chunk, key) => {
      const [chunkX, chunkZ] = key.split(',').map(Number);
      const distance = Math.max(
        Math.abs(chunkX - centerX),
        Math.abs(chunkZ - centerZ)
      );
      
      if (distance > maxDistance) {
        chunksToRemove.push(key);
      }
    });
    
    // Remove distant chunks
    chunksToRemove.forEach(key => {
      const chunk = this.sceneryChunks.get(key);
      if (chunk) {
        // Remove all objects in this chunk from the scene
        chunk.objects.forEach(obj => {
          this.scene.remove(obj.mesh);
          
          // Also remove from sceneryObjects array
          const index = this.sceneryObjects.findIndex(o => o === obj);
          if (index >= 0) {
            this.sceneryObjects.splice(index, 1);
          }
        });
        
        // Remove chunk from map
        this.sceneryChunks.delete(key);
      }
    });
  }
  
  // Generate scenery in a specific chunk
  private async generateSceneryInChunk(chunkX: number, chunkZ: number) {
    const chunkKey = `${chunkX},${chunkZ}`;
    
    // Check if chunk already exists
    if (this.sceneryChunks.has(chunkKey)) {
      const chunk = this.sceneryChunks.get(chunkKey);
      if (chunk && chunk.generated) {
        return; // Already generated
      }
    }
    
    // Create new chunk if it doesn't exist
    if (!this.sceneryChunks.has(chunkKey)) {
      this.sceneryChunks.set(chunkKey, {
        key: chunkKey,
        objects: [],
        generated: false
      });
    }
    
    // Get chunk for adding objects
    const chunk = this.sceneryChunks.get(chunkKey)!;
    
    // Calculate chunk boundaries
    const startX = chunkX * this.chunkSize;
    const startZ = chunkZ * this.chunkSize;
    
    // Use deterministic randomness based on chunk position
    const randomValue = this.random(chunkX, chunkZ);
    
    // Determine what to generate in this chunk
    const features = [];
    
    // Every chunk has a different set of features
    if (randomValue < 0.3) {
      // 30% chance for a house
      features.push('house');
    }
    
    if (randomValue < 0.7) {
      // 70% chance for trees (5-10 trees per chunk)
      const treeCount = 5 + Math.floor(this.random(chunkX, chunkZ, 1) * 5);
      features.push({ type: 'tree', count: treeCount });
    }
    
    if (randomValue > 0.4 && randomValue < 0.5) {
      // 10% chance for a garden
      features.push('garden');
    }
    
    if (randomValue > 0.5 && randomValue < 0.6) {
      // 10% chance for a shed
      features.push('shed');
    }
    
    if (randomValue > 0.9) {
      // 10% chance for a mailbox
      features.push('mailbox');
    }
    
    if (randomValue > 0.7 && randomValue < 0.8) {
      // 10% chance for a bench
      features.push('bench');
    }
    
    // 25% chance for a fence
    if (randomValue > 0.75) {
      features.push('fence');
    }
    
    // Generate each feature
    for (const feature of features) {
      if (feature === 'house') {
        // Place house at a semi-random position within the chunk
        const houseX = startX + this.chunkSize * (0.3 + this.random(chunkX, chunkZ, 2) * 0.4);
        const houseZ = startZ + this.chunkSize * (0.3 + this.random(chunkX, chunkZ, 3) * 0.4);
        const houseY = this.terrain.getHeightAt(houseX, houseZ);
        
        // Skip if terrain is unsuitable (too high or too low)
        if (houseY > 3 || houseY < 0.1) continue;
        
        const houseRotation = this.randomAngle(chunkX, chunkZ, 4);
        await this.createHouse(houseX, houseY, houseZ, houseRotation, chunkKey);
      }
      else if (typeof feature === 'object' && feature.type === 'tree') {
        // Generate trees
        for (let i = 0; i < feature.count; i++) {
          const treeX = startX + this.random(chunkX, chunkZ, 10 + i) * this.chunkSize;
          const treeZ = startZ + this.random(chunkX, chunkZ, 20 + i) * this.chunkSize;
          const treeY = this.terrain.getHeightAt(treeX, treeZ);
          
          // Skip if terrain is unsuitable
          if (treeY > 4 || treeY < 0.1) continue;
          
          await this.createTree(treeX, treeY, treeZ, chunkKey);
        }
      }
      else if (feature === 'garden') {
        const gardenX = startX + this.chunkSize * (0.4 + this.random(chunkX, chunkZ, 5) * 0.2);
        const gardenZ = startZ + this.chunkSize * (0.4 + this.random(chunkX, chunkZ, 6) * 0.2);
        const gardenY = this.terrain.getHeightAt(gardenX, gardenZ);
        
        if (gardenY > 3 || gardenY < 0.1) continue;
        
        await this.createGarden(gardenX, gardenY, gardenZ, chunkKey);
      }
      else if (feature === 'shed') {
        const shedX = startX + this.chunkSize * (0.2 + this.random(chunkX, chunkZ, 7) * 0.6);
        const shedZ = startZ + this.chunkSize * (0.2 + this.random(chunkX, chunkZ, 8) * 0.6);
        const shedY = this.terrain.getHeightAt(shedX, shedZ);
        
        if (shedY > 3 || shedY < 0.1) continue;
        
        const shedRotation = this.randomAngle(chunkX, chunkZ, 9);
        await this.createShed(shedX, shedY, shedZ, shedRotation, chunkKey);
      }
      else if (feature === 'mailbox') {
        const mailboxX = startX + this.chunkSize * (0.4 + this.random(chunkX, chunkZ, 10) * 0.2);
        const mailboxZ = startZ + this.chunkSize * (0.1 + this.random(chunkX, chunkZ, 11) * 0.2);
        const mailboxY = this.terrain.getHeightAt(mailboxX, mailboxZ);
        
        if (mailboxY > 3 || mailboxY < 0.1) continue;
        
        await this.createMailbox(mailboxX, mailboxY, mailboxZ, chunkKey);
      }
      else if (feature === 'bench') {
        const benchX = startX + this.chunkSize * (0.3 + this.random(chunkX, chunkZ, 12) * 0.4);
        const benchZ = startZ + this.chunkSize * (0.3 + this.random(chunkX, chunkZ, 13) * 0.4);
        const benchY = this.terrain.getHeightAt(benchX, benchZ);
        
        if (benchY > 3 || benchY < 0.1) continue;
        
        const benchRotation = this.randomAngle(chunkX, chunkZ, 14);
        await this.createBench(benchX, benchY, benchZ, benchRotation, chunkKey);
      }
      else if (feature === 'fence') {
        // Create a fence line or enclosure
        const fenceStartX = startX + this.chunkSize * (0.2 + this.random(chunkX, chunkZ, 15) * 0.6);
        const fenceStartZ = startZ + this.chunkSize * (0.2 + this.random(chunkX, chunkZ, 16) * 0.6);
        const fenceLength = 5 + Math.floor(this.random(chunkX, chunkZ, 17) * 15);
        
        let fenceX = fenceStartX;
        let fenceZ = fenceStartZ;
        let fenceDirection = Math.floor(this.random(chunkX, chunkZ, 18) * 4); // 0-3 for directions
        
        // Create fence segments
        for (let i = 0; i < fenceLength; i++) {
          const fenceY = this.terrain.getHeightAt(fenceX, fenceZ);
          
          if (fenceY <= 3 && fenceY >= 0.1) {
            await this.createFence(fenceX, fenceY, fenceZ, fenceDirection * Math.PI / 2, chunkKey);
          }
          
          // Move to next fence position
          if (fenceDirection === 0) fenceX += 2;
          else if (fenceDirection === 1) fenceZ += 2;
          else if (fenceDirection === 2) fenceX -= 2;
          else if (fenceDirection === 3) fenceZ -= 2;
          
          // Check if we're still in the chunk
          const stillInChunk = 
            fenceX >= startX && 
            fenceX < startX + this.chunkSize &&
            fenceZ >= startZ && 
            fenceZ < startZ + this.chunkSize;
          
          if (!stillInChunk) break;
          
          // Occasionally change direction to create more interesting shapes
          if (this.random(fenceX, fenceZ, i) < 0.2) {
            fenceDirection = (fenceDirection + 1) % 4;
          }
        }
      }
    }
    
    // Mark chunk as generated
    chunk.generated = true;
  }
  
  private clearScenery() {
    // Remove existing scenery objects from scene
    for (const scenery of this.sceneryObjects) {
      this.scene.remove(scenery.mesh);
    }
    
    this.sceneryObjects = [];
  }
  
  private async createHouse(x: number, y: number, z: number, rotation: number) {
    const houseGroup = new THREE.Group();
    
    // House types
    const houseTypes = ['Colonial', 'Victorian', 'Modern', 'Ranch', 'Cottage'];
    const houseType = houseTypes[Math.floor(Math.random() * houseTypes.length)];
    
    // House colors
    const houseColors = [0xF5F5DC, 0xD3D3D3, 0xFFF8DC, 0xFFE4C4, 0xE0FFFF];
    const roofColors = [0x8B4513, 0x800000, 0x2F4F4F, 0x696969, 0x000000];
    
    const houseColor = houseColors[Math.floor(Math.random() * houseColors.length)];
    const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
    
    // Create main house body
    const houseMaterial = new THREE.MeshStandardMaterial({ color: houseColor });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: roofColor });
    
    // Main house body
    const houseWidth = 4 + Math.random() * 2;
    const houseDepth = 5 + Math.random() * 2;
    const houseHeight = 2.5 + Math.random() * 1;
    
    const house = new THREE.Mesh(
      new THREE.BoxGeometry(houseWidth, houseHeight, houseDepth),
      houseMaterial
    );
    house.position.y = houseHeight / 2;
    house.castShadow = true;
    house.receiveShadow = true;
    houseGroup.add(house);
    
    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(houseWidth, houseDepth) * 0.7, 2, 4),
      roofMaterial
    );
    roof.position.y = houseHeight + 1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);
    
    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xADD8E6 });
    
    // Front windows
    const frontWindow1 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      windowMaterial
    );
    frontWindow1.position.set(-houseWidth * 0.25, houseHeight * 0.5, houseDepth / 2 + 0.01);
    houseGroup.add(frontWindow1);
    
    const frontWindow2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.8),
      windowMaterial
    );
    frontWindow2.position.set(houseWidth * 0.25, houseHeight * 0.5, houseDepth / 2 + 0.01);
    houseGroup.add(frontWindow2);
    
    // Door
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 2),
      doorMaterial
    );
    door.position.set(0, 1, houseDepth / 2 + 0.01);
    houseGroup.add(door);
    
    // Position and rotate house
    houseGroup.position.set(x, y, z);
    houseGroup.rotation.y = rotation;
    
    // Add to scene and scenery objects
    this.scene.add(houseGroup);
    this.sceneryObjects.push({
      type: 'House',
      position: new THREE.Vector3(x, y, z),
      rotation,
      scale: 1,
      mesh: houseGroup,
      discovered: false
    });
    
    return houseGroup;
  }
  
  private async createTree(x: number, y: number, z: number) {
    const treeGroup = new THREE.Group();
    
    // Tree types
    const treeTypes = ['Oak', 'Pine', 'Maple', 'Birch', 'Apple'];
    const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
    
    // Tree trunk
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
      trunkMaterial
    );
    trunk.position.y = 1;
    trunk.castShadow = true;
    treeGroup.add(trunk);
    
    // Tree foliage
    const foliageColors = [0x228B22, 0x006400, 0x556B2F, 0x8FBC8F, 0x2E8B57];
    const foliageColor = foliageColors[Math.floor(Math.random() * foliageColors.length)];
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: foliageColor });
    
    if (treeType === 'Pine') {
      // Pine tree has multiple cone layers
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1 - i * 0.2, 1.5, 8),
          foliageMaterial
        );
        cone.position.y = 2 + i * 0.8;
        cone.castShadow = true;
        treeGroup.add(cone);
      }
    } else {
      // Deciduous tree has a round canopy
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        foliageMaterial
      );
      canopy.position.y = 2.5;
      canopy.castShadow = true;
      treeGroup.add(canopy);
    }
    
    // Position tree
    treeGroup.position.set(x, y, z);
    
    // Add to scene and scenery objects
    this.scene.add(treeGroup);
    this.sceneryObjects.push({
      type: 'Tree',
      position: new THREE.Vector3(x, y, z),
      rotation: 0,
      scale: 1,
      mesh: treeGroup,
      discovered: false
    });
    
    return treeGroup;
  }
  
  private async createFence(x: number, y: number, z: number, rotation: number) {
    const fenceGroup = new THREE.Group();
    
    // Fence material
    const fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
    
    // Fence post
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1, 0.1),
      fenceMaterial
    );
    post.position.y = 0.5;
    post.castShadow = true;
    fenceGroup.add(post);
    
    // Fence rails
    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.05, 0.05),
      fenceMaterial
    );
    railTop.position.y = 0.8;
    railTop.position.x = 1;
    railTop.castShadow = true;
    fenceGroup.add(railTop);
    
    const railBottom = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.05, 0.05),
      fenceMaterial
    );
    railBottom.position.y = 0.4;
    railBottom.position.x = 1;
    railBottom.castShadow = true;
    fenceGroup.add(railBottom);
    
    // Position and rotate fence
    fenceGroup.position.set(x, y, z);
    fenceGroup.rotation.y = rotation;
    
    // Add to scene and scenery objects
    this.scene.add(fenceGroup);
    this.sceneryObjects.push({
      type: 'Fence',
      position: new THREE.Vector3(x, y, z),
      rotation,
      scale: 1,
      mesh: fenceGroup,
      discovered: false
    });
    
    return fenceGroup;
  }
  
  private async createGarden(x: number, y: number, z: number) {
    const gardenGroup = new THREE.Group();
    
    // Garden soil
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const soil = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.1, 3),
      soilMaterial
    );
    soil.position.y = 0.05;
    soil.receiveShadow = true;
    gardenGroup.add(soil);
    
    // Garden plants
    const plantColors = [0xFF0000, 0xFFFF00, 0xFF00FF, 0xFFA500, 0x800080];
    
    // Create several plants
    for (let i = 0; i < 15; i++) {
      const plantColor = plantColors[Math.floor(Math.random() * plantColors.length)];
      const plantMaterial = new THREE.MeshStandardMaterial({ color: plantColor });
      
      // Flower
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        plantMaterial
      );
      
      // Stem
      const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x008000 });
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
        stemMaterial
      );
      
      // Position flower and stem
      const px = (Math.random() * 3) - 1.5;
      const pz = (Math.random() * 2) - 1;
      
      stem.position.set(px, 0.2, pz);
      flower.position.set(px, 0.35, pz);
      
      stem.castShadow = true;
      flower.castShadow = true;
      
      gardenGroup.add(stem);
      gardenGroup.add(flower);
    }
    
    // Position garden
    gardenGroup.position.set(x, y, z);
    
    // Add to scene and scenery objects
    this.scene.add(gardenGroup);
    this.sceneryObjects.push({
      type: 'Garden',
      position: new THREE.Vector3(x, y, z),
      rotation: 0,
      scale: 1,
      mesh: gardenGroup,
      discovered: false
    });
    
    return gardenGroup;
  }
  
  private async createShed(x: number, y: number, z: number, rotation: number) {
    const shedGroup = new THREE.Group();
    
    // Shed materials
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x800000 });
    
    // Shed body
    const shed = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 2),
      wallMaterial
    );
    shed.position.y = 1.25;
    shed.castShadow = true;
    shed.receiveShadow = true;
    shedGroup.add(shed);
    
    // Shed roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 1, 4),
      roofMaterial
    );
    roof.position.y = 3;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    shedGroup.add(roof);
    
    // Shed door
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 2),
      doorMaterial
    );
    door.position.set(0, 1, 1.01);
    shedGroup.add(door);
    
    // Position and rotate shed
    shedGroup.position.set(x, y, z);
    shedGroup.rotation.y = rotation;
    
    // Add to scene and scenery objects
    this.scene.add(shedGroup);
    this.sceneryObjects.push({
      type: 'Shed',
      position: new THREE.Vector3(x, y, z),
      rotation,
      scale: 1,
      mesh: shedGroup,
      discovered: false
    });
    
    return shedGroup;
  }
  
  private async createMailbox(x: number, y: number, z: number) {
    const mailboxGroup = new THREE.Group();
    
    // Mailbox materials
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF });
    
    // Mailbox post
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
      postMaterial
    );
    post.position.y = 0.6;
    post.castShadow = true;
    mailboxGroup.add(post);
    
    // Mailbox
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.5),
      boxMaterial
    );
    box.position.y = 1.2;
    box.castShadow = true;
    mailboxGroup.add(box);
    
    // Position mailbox
    mailboxGroup.position.set(x, y, z);
    
    // Add to scene and scenery objects
    this.scene.add(mailboxGroup);
    this.sceneryObjects.push({
      type: 'Mailbox',
      position: new THREE.Vector3(x, y, z),
      rotation: 0,
      scale: 1,
      mesh: mailboxGroup,
      discovered: false
    });
    
    return mailboxGroup;
  }
  
  private async createBench(x: number, y: number, z: number, rotation: number) {
    const benchGroup = new THREE.Group();
    
    // Bench materials
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
    // Bench seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 0.5),
      woodMaterial
    );
    seat.position.y = 0.5;
    seat.castShadow = true;
    benchGroup.add(seat);
    
    // Bench back
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.5, 0.1),
      woodMaterial
    );
    back.position.set(0, 0.75, -0.2);
    back.castShadow = true;
    benchGroup.add(back);
    
    // Bench legs
    for (let i = 0; i < 4; i++) {
      const legX = ((i % 2) * 2 - 1) * 0.6;
      const legZ = (Math.floor(i / 2) * 2 - 1) * 0.15;
      
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8),
        woodMaterial
      );
      leg.position.set(legX, 0.25, legZ);
      leg.castShadow = true;
      benchGroup.add(leg);
    }
    
    // Position and rotate bench
    benchGroup.position.set(x, y, z);
    benchGroup.rotation.y = rotation;
    
    // Add to scene and scenery objects
    this.scene.add(benchGroup);
    this.sceneryObjects.push({
      type: 'Bench',
      position: new THREE.Vector3(x, y, z),
      rotation,
      scale: 1,
      mesh: benchGroup,
      discovered: false
    });
    
    return benchGroup;
  }
  
  public checkForDiscovery(playerPosition: THREE.Vector3) {
    const discoveryRadius = 5; // Discovery distance
    
    for (const scenery of this.sceneryObjects) {
      if (scenery.discovered) continue;
      
      // Check distance
      const distance = playerPosition.distanceTo(scenery.position);
      
      if (distance < discoveryRadius) {
        // Mark as discovered
        scenery.discovered = true;
        
        // Generate descriptive name for the discovered object
        let name = '';
        
        switch (scenery.type) {
          case 'House':
            const houseStyles = ['Colonial', 'Victorian', 'Modern', 'Ranch', 'Cottage'];
            const houseStyle = houseStyles[Math.floor(Math.random() * houseStyles.length)];
            name = `${houseStyle} House`;
            break;
          case 'Tree':
            const treeTypes = ['Oak', 'Pine', 'Maple', 'Birch', 'Apple'];
            const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            name = `${treeType} Tree`;
            break;
          case 'Garden':
            const gardenTypes = ['Flower', 'Vegetable', 'Herb', 'Rose', 'Tulip'];
            const gardenType = gardenTypes[Math.floor(Math.random() * gardenTypes.length)];
            name = `${gardenType} Garden`;
            break;
          default:
            name = scenery.type;
        }
        
        // Trigger discovery callback
        this.onSceneryDiscovered(name);
        
        // Only report one discovery at a time
        break;
      }
    }
  }
  
  public reset() {
    // Clear existing scenery
    this.clearScenery();
    
    // Generate new scenery
    this.generateScenery();
  }
}
