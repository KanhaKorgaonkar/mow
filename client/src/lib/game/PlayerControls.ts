import * as THREE from 'three';
import { LawnMower } from './LawnMower';

export class PlayerControls {
  private camera: THREE.PerspectiveCamera;
  private mower: LawnMower;
  private isLocked: boolean = false;
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private turnLeft: boolean = false;
  private turnRight: boolean = false;
  private mouseSensitivity: number = 0.002;
  private cameraOffsetThirdPerson: THREE.Vector3 = new THREE.Vector3(0, 4, 8); // Higher and further back
  private cameraOffsetFirstPerson: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0.5);
  private cameraOffset: THREE.Vector3;
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private thirdPersonView: boolean = false;
  private orbitAngle: number = 0; // For camera orbiting in third-person
  private orbitDistance: number = 8; // Distance from mower
  private orbitHeight: number = 4; // Height above mower
  private orbitSpeed: number = 0; // Orbital rotation speed
  private touchControls: {
    forward: HTMLElement | null;
    backward: HTMLElement | null;
    left: HTMLElement | null;
    right: HTMLElement | null;
  } = {
    forward: null,
    backward: null,
    left: null,
    right: null
  };
  
  constructor(camera: THREE.PerspectiveCamera, mower: LawnMower, thirdPersonView: boolean = false) {
    this.camera = camera;
    this.mower = mower;
    this.thirdPersonView = thirdPersonView;
    
    // Set the appropriate camera offset based on view mode
    this.cameraOffset = thirdPersonView ? this.cameraOffsetThirdPerson : this.cameraOffsetFirstPerson;
    
    // Initialize controls
    this.initKeyboardControls();
    this.initMouseControls();
    this.initTouchControls();
  }
  
  private initKeyboardControls() {
    // Keyboard controls
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.turnLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.turnRight = true;
          break;
        // Toggle camera view with 'C' key
        case 'KeyC':
          if (event.type === 'keydown' && !event.repeat) {
            this.toggleCameraView();
          }
          break;
      }
    };
    
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.turnLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.turnRight = false;
          break;
      }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }
  
  private toggleCameraView() {
    this.thirdPersonView = !this.thirdPersonView;
    this.cameraOffset = this.thirdPersonView ? this.cameraOffsetThirdPerson : this.cameraOffsetFirstPerson;
  }
  
  private initMouseControls() {
    // Mouse look controls
    const onMouseMove = (event: MouseEvent) => {
      if (!this.isLocked) return;
      
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      if (this.thirdPersonView) {
        // In third-person, mouse movement orbits the camera around the mower
        this.orbitAngle -= movementX * this.mouseSensitivity * 0.5;
        
        // Update orbit height (limited range)
        this.orbitHeight = Math.max(2, Math.min(10, 
          this.orbitHeight - movementY * this.mouseSensitivity * 5
        ));
      } else {
        // First-person view
        // Update rotation
        this.euler.y -= movementX * this.mouseSensitivity;
        this.euler.x -= movementY * this.mouseSensitivity;
        
        // Clamp vertical rotation
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        
        // Apply rotation to camera
        this.camera.quaternion.setFromEuler(this.euler);
      }
    };
    
    document.addEventListener('mousemove', onMouseMove);
    
    // Pointer lock change handler
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement !== null;
    });
    
    // Fallback for when pointer lock is not available
    document.addEventListener('keydown', (event) => {
      if (!this.isLocked) return;
      
      // Use Q and E for camera rotation when pointer lock isn't available
      switch (event.code) {
        case 'KeyQ':
          if (this.thirdPersonView) {
            this.orbitAngle += 0.05;
          } else {
            this.euler.y += 0.05;
            this.camera.quaternion.setFromEuler(this.euler);
          }
          break;
        case 'KeyE':
          if (this.thirdPersonView) {
            this.orbitAngle -= 0.05;
          } else {
            this.euler.y -= 0.05;
            this.camera.quaternion.setFromEuler(this.euler);
          }
          break;
        case 'KeyR': // R for raising camera
          if (this.thirdPersonView) {
            this.orbitHeight = Math.min(10, this.orbitHeight + 0.5);
          }
          break;
        case 'KeyF': // F for lowering camera
          if (this.thirdPersonView) {
            this.orbitHeight = Math.max(2, this.orbitHeight - 0.5);
          }
          break;
      }
    });
    
    // Mouse wheel for zoom in third-person
    document.addEventListener('wheel', (event) => {
      if (!this.isLocked || !this.thirdPersonView) return;
      
      // Adjust orbit distance with scroll wheel
      this.orbitDistance = Math.max(3, Math.min(15, 
        this.orbitDistance + (event.deltaY * 0.01)
      ));
    });
  }
  
  private initTouchControls() {
    // Find touch control elements
    setTimeout(() => {
      this.touchControls.forward = document.querySelector('[data-control="forward"]');
      this.touchControls.backward = document.querySelector('[data-control="backward"]');
      this.touchControls.left = document.querySelector('[data-control="left"]');
      this.touchControls.right = document.querySelector('[data-control="right"]');
      
      // Add touch listeners
      if (this.touchControls.forward) {
        this.touchControls.forward.addEventListener('touchstart', () => { this.moveForward = true; });
        this.touchControls.forward.addEventListener('touchend', () => { this.moveForward = false; });
      }
      
      if (this.touchControls.backward) {
        this.touchControls.backward.addEventListener('touchstart', () => { this.moveBackward = true; });
        this.touchControls.backward.addEventListener('touchend', () => { this.moveBackward = false; });
      }
      
      if (this.touchControls.left) {
        this.touchControls.left.addEventListener('touchstart', () => { this.turnLeft = true; });
        this.touchControls.left.addEventListener('touchend', () => { this.turnLeft = false; });
      }
      
      if (this.touchControls.right) {
        this.touchControls.right.addEventListener('touchstart', () => { this.turnRight = true; });
        this.touchControls.right.addEventListener('touchend', () => { this.turnRight = false; });
      }
    }, 1000); // Delay to ensure elements are in DOM
  }
  
  public update(delta: number) {
    // Handle movement
    if (this.moveForward) {
      this.mower.moveForward(true, delta);
    } else if (this.moveBackward) {
      // Implement reverse motion
      this.mower.moveForward(false, delta);
    } else {
      // Decelerate
      this.mower.moveForward(false, delta);
    }
    
    // Handle turning
    if (this.turnLeft) {
      this.mower.turn('left', delta);
    } else if (this.turnRight) {
      this.mower.turn('right', delta);
    }
    
    // Update camera based on view mode
    const mowerPosition = this.mower.getPosition();
    const mowerDirection = this.mower.getDirection();
    
    if (this.thirdPersonView) {
      // Third-person camera - orbits around the mower
      
      // Apply slow automatic orbit if no manual control
      this.orbitAngle += this.orbitSpeed * delta;
      
      // Calculate camera position in orbit
      const cameraX = mowerPosition.x + Math.sin(this.orbitAngle) * this.orbitDistance;
      const cameraZ = mowerPosition.z + Math.cos(this.orbitAngle) * this.orbitDistance;
      const cameraY = mowerPosition.y + this.orbitHeight;
      
      // Set camera position
      this.camera.position.set(cameraX, cameraY, cameraZ);
      
      // Look at the mower
      this.camera.lookAt(
        mowerPosition.x, 
        mowerPosition.y + 0.5, // Look slightly above the mower
        mowerPosition.z
      );
    } else {
      // First-person view - position camera on the mower
      const cameraPosition = mowerPosition.clone().add(this.cameraOffset);
      this.camera.position.copy(cameraPosition);
      
      // First-person camera orientation is handled by mouse look
    }
  }
  
  public lock() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        canvas.requestPointerLock();
      } catch (error) {
        console.warn("Pointer lock failed:", error);
        // Set a flag to use keyboard-only controls
        this.isLocked = true;
      }
    }
  }
  
  public unlock() {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    } catch (error) {
      console.warn("Exit pointer lock failed:", error);
      this.isLocked = false;
    }
  }
}
