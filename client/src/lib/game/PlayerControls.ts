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
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0.5);
  private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
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
  
  constructor(camera: THREE.PerspectiveCamera, mower: LawnMower) {
    this.camera = camera;
    this.mower = mower;
    
    // Initialize controls
    this.initKeyboardControls();
    this.initMouseControls();
    this.initTouchControls();
  }
  
  private initKeyboardControls() {
    // Keyboard controls - Using pure WAD control scheme:
    // W: Move forward only
    // A: Turn left
    // D: Turn right
    // Also supporting arrow keys as alternatives
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.turnLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.turnRight = true;
          break;
      }
    };
    
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
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
  
  private initMouseControls() {
    // Mouse look controls
    const onMouseMove = (event: MouseEvent) => {
      if (!this.isLocked) return;
      
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      
      // Update rotation
      this.euler.y -= movementX * this.mouseSensitivity;
      this.euler.x -= movementY * this.mouseSensitivity;
      
      // Clamp vertical rotation
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
      
      // Apply rotation to camera
      this.camera.quaternion.setFromEuler(this.euler);
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
          this.euler.y += 0.05;
          this.camera.quaternion.setFromEuler(this.euler);
          break;
        case 'KeyE':
          this.euler.y -= 0.05;
          this.camera.quaternion.setFromEuler(this.euler);
          break;
      }
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
    // Set control flags on the mower based on inputs
    this.mower.setMoveForward(this.moveForward);
    this.mower.setMoveBackward(this.moveBackward);
    this.mower.setTurnLeft(this.turnLeft);
    this.mower.setTurnRight(this.turnRight);
    
    // Update mower physics
    this.mower.update(delta);
    
    // Update camera position based on mower position and direction
    const mowerPosition = this.mower.getPosition();
    const mowerDirection = this.mower.getDirection();
    
    // Position camera slightly above and behind mower
    const cameraPosition = mowerPosition.clone().add(this.cameraOffset);
    this.camera.position.copy(cameraPosition);
    
    // Look at a point slightly ahead of mower
    const lookTarget = mowerPosition.clone().add(mowerDirection.clone().multiplyScalar(2));
    lookTarget.y = cameraPosition.y;
    // this.camera.lookAt(lookTarget);
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
