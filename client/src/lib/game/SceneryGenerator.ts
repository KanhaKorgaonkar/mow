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
}

export class SceneryGenerator {
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private sceneryObjects: SceneryObject[] = [];
  private onSceneryDiscovered: (scenery: string) => void;
  
  constructor(
    scene: THREE.Scene,
    terrain: TerrainGenerator,
    onSceneryDiscovered: (scenery: string) => void
  ) {
    this.scene = scene;
    this.terrain = terrain;
    this.onSceneryDiscovered = onSceneryDiscovered;
  }
  
  public async initialize() {
    // Generate scenery objects
    await this.generateScenery();
    return true;
  }
  
  private async generateScenery() {
    const terrainSize = this.terrain.getSize();
    const halfWidth = terrainSize.width / 2;
    const halfDepth = terrainSize.depth / 2;
    
    // Clear existing scenery
    this.clearScenery();
    
    // Generate houses
    const houseCount = 3;
    for (let i = 0; i < houseCount; i++) {
      // Place houses at random positions, but not too close to center
      const distance = 20 + Math.random() * 20;
      const angle = Math.random() * Math.PI * 2;
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = this.terrain.getHeightAt(x, z);
      
      await this.createHouse(x, y, z, Math.random() * Math.PI * 2);
    }
    
    // Generate trees
    const treeCount = 15;
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() * terrainSize.width * 0.8) - (halfWidth * 0.8);
      const z = (Math.random() * terrainSize.depth * 0.8) - (halfDepth * 0.8);
      const y = this.terrain.getHeightAt(x, z);
      
      await this.createTree(x, y, z);
    }
    
    // Generate fences
    const fenceSegments = 40;
    let fenceX = -15;
    let fenceZ = -15;
    let fenceDirection = 0; // 0 = right, 1 = down, 2 = left, 3 = up
    
    for (let i = 0; i < fenceSegments; i++) {
      const y = this.terrain.getHeightAt(fenceX, fenceZ);
      
      await this.createFence(fenceX, y, fenceZ, fenceDirection * Math.PI / 2);
      
      // Move to next fence position
      if (fenceDirection === 0) fenceX += 2;
      else if (fenceDirection === 1) fenceZ += 2;
      else if (fenceDirection === 2) fenceX -= 2;
      else if (fenceDirection === 3) fenceZ -= 2;
      
      // Change direction to create rectangle
      if ((i + 1) % 10 === 0) {
        fenceDirection = (fenceDirection + 1) % 4;
      }
    }
    
    // Generate garden
    await this.createGarden(10, this.terrain.getHeightAt(10, 10), 10);
    
    // Generate shed
    await this.createShed(-12, this.terrain.getHeightAt(-12, 8), 8, Math.PI / 4);
    
    // Generate mailbox
    await this.createMailbox(15, this.terrain.getHeightAt(15, -15), -15);
    
    // Generate bench
    await this.createBench(5, this.terrain.getHeightAt(5, -10), -10, Math.PI);
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
