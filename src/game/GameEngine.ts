import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraView,
  EquipmentId,
  EquipmentItem,
  GameMode,
  PlayerVitals,
  WeaponId,
} from '../types/game';
import { TerrainGenerator } from '../world/TerrainGenerator';
import {
  createHunterModel,
  createMahoganyTree,
  createPalmTree,
  createHunterCabin,
  createWatchtower,
  createCampfire,
  HunterRig,
  Materials,
} from '../world/ProceduralMeshes';
import { EnvironmentManager } from '../world/EnvironmentManager';
import { WildlifeManager } from '../wildlife/WildlifeManager';
import { TrackingManager } from '../wildlife/TrackingManager';
import { VehicleManager } from '../vehicles/VehicleManager';
import { HuntingSystem } from '../hunting/HuntingSystem';
import { MissionManager } from '../game/MissionManager';
import { WildlifeRegistry } from '../wildlife/WildlifeRegistry';
import { soundEngine } from '../audio/SoundEngine';
import { DogCompanion } from '../wildlife/DogCompanion';

export interface GameEngineState {
  mode: GameMode;
  cameraView: CameraView;
  vitals: PlayerVitals;
  interactionPrompt: string | null;
  notification: string | null;
  targetRange: number | null; // distance to crosshair in meters
  currentWeaponId: WeaponId;
  equippedTool: EquipmentId;
  activeVehicleSpeed: number | null;
  activeVehicleFuel: number | null;
  playerPos: [number, number, number];
  playerHeading: number;
  dogState: string;
  dogTarget: string | null;
}

export class GameEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public clock = new THREE.Clock();

  // Systems
  public terrain: TerrainGenerator;
  public environment: EnvironmentManager;
  public wildlife: WildlifeManager;
  public tracking: TrackingManager;
  public vehicles: VehicleManager;
  public hunting: HuntingSystem;
  public missions: MissionManager;
  public wildlifeRegistry: WildlifeRegistry;
  public dogCompanion: DogCompanion;

  // Player state
  public playerPos = new THREE.Vector3(0, 0, 8); // Start at base camp
  public playerVelocity = new THREE.Vector3();
  public playerYaw = 0;
  public playerPitch = 0;
  public cameraView: CameraView = 'third_person';
  public gameMode: GameMode = 'walking';
  public equippedTool: EquipmentId = 'binoculars';

  public vitals: PlayerVitals = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    hydration: 95,
    maxHydration: 100,
    isSprinting: false,
    isCrouching: false,
    isAiming: false,
    holdingBreath: false,
    flashlightOn: false,
  };

  public inventory: Record<EquipmentId, EquipmentItem> = {
    binoculars: { id: 'binoculars', name: 'Leupold 10x42 Binoculars', count: 1, maxCount: 1, description: 'High-clarity optical glass with integrated laser rangefinder.', icon: 'Eye' },
    camera: { id: 'camera', name: 'Wildlife Field Camera', count: 1, maxCount: 1, description: 'High-speed shutter camera for documenting wildlife species.', icon: 'Camera' },
    compass: { id: 'compass', name: 'Tactical Magnetic Compass', count: 1, maxCount: 1, description: 'Indicates precise directional bearings and cardinal points.', icon: 'Compass' },
    gps: { id: 'gps', name: 'Handheld GPS Tracker', count: 1, maxCount: 1, description: 'Topographic GPS display linked to reserve satellites.', icon: 'MapPin' },
    flashlight: { id: 'flashlight', name: 'Tactical LED Torch', count: 1, maxCount: 1, description: 'High-lumen flashlight for night navigation and predator detection.', icon: 'Flashlight' },
    canteen: { id: 'canteen', name: 'Hydration Canteen', count: 3, maxCount: 5, description: 'Fresh filtered spring water. Restores 35% hydration.', icon: 'Droplet' },
    medkit: { id: 'medkit', name: 'Field Trauma Kit', count: 2, maxCount: 4, description: 'Antiseptic and pressure bandages. Restores 50% health.', icon: 'PlusCircle' },
    repair_kit: { id: 'repair_kit', name: 'Vehicle Tool Roll', count: 2, maxCount: 3, description: 'Spanners and spare parts to service vehicles in the wild.', icon: 'Wrench' },
  };

  // 3D Player Meshes
  public hunterRig: HunterRig;
  public playerSpotlight: THREE.SpotLight;

  // Flashlight mesh & light
  private isPointerLocked = false;
  private isSoftwareGl = false;
  private animFrameId = 0;
  private stepDistanceAccumulator = 0;

  // Input keys
  public keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    jump: false,
  };

  // Reusable math helpers (zero GC per frame)
  private _vecA = new THREE.Vector3();
  private _vecB = new THREE.Vector3();
  private _raycaster = new THREE.Raycaster();

  // Callbacks
  public onStateUpdate?: (state: GameEngineState) => void;
  public onNotification?: (msg: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);

    // Studio Environment map reflection (mandatory per skill)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. World Systems
    this.terrain = new TerrainGenerator();
    const terrainMesh = this.terrain.buildTerrainMesh();
    const waterMesh = this.terrain.buildWaterMesh();
    this.scene.add(terrainMesh, waterMesh);

    this.environment = new EnvironmentManager(this.scene);
    this.wildlife = new WildlifeManager(this.scene, this.terrain);
    this.tracking = new TrackingManager(this.scene, this.terrain);
    this.vehicles = new VehicleManager(this.scene, this.terrain);
    this.hunting = new HuntingSystem();
    this.missions = new MissionManager();
    this.wildlifeRegistry = new WildlifeRegistry();

    // Mission status listener
    this.missions.onMissionStatusChange = (msg: string) => {
      this.notify(msg);
    };

    // 4. Hunter Character Mesh & Hunting Dog Companion
    this.hunterRig = createHunterModel();
    this.scene.add(this.hunterRig.group);

    this.dogCompanion = new DogCompanion(this.scene, this.terrain, this.playerPos);

    // 5. Player Flashlight
    this.playerSpotlight = new THREE.SpotLight(0xfffae0, 2.5, 55, Math.PI / 4, 0.4);
    this.playerSpotlight.visible = false;
    this.scene.add(this.playerSpotlight);
    this.scene.add(this.playerSpotlight.target);

    // 6. Populate World with Vegetation, Trees & Structures
    this.populateJungleScenery();

    // 7. Input listeners
    this.setupEventListeners();

    // Start audio
    soundEngine.startAmbient();

    // Start Render Loop
    this.startLoop();
  }

  private populateJungleScenery() {
    // A. Base Camp Cabin & Watchtower
    const cabin = createHunterCabin();
    cabin.position.set(0, this.terrain.getHeight(0, 0), 0);
    this.scene.add(cabin);

    const watchtower = createWatchtower();
    watchtower.position.set(45, this.terrain.getHeight(45, -50), -50);
    this.scene.add(watchtower);

    const campfire = createCampfire();
    campfire.position.set(0, this.terrain.getHeight(0, 10), 10);
    this.scene.add(campfire);

    // B. Procedural Trees & Rocks (Instanced placement)
    const treeCount = this.isSoftwareGl ? 60 : 160;
    for (let i = 0; i < treeCount; i++) {
      // Scatter trees across map, avoiding base camp center (dist > 35) and deep river
      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 450;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const waterDepth = this.terrain.getWaterDepth(x, z);
      if (waterDepth > 0.4) continue; // Don't plant inside deep river

      const y = this.terrain.getHeight(x, z);

      // Alternating Mahogany and Palm trees
      const tree = Math.random() < 0.65 ? createMahoganyTree() : createPalmTree();
      tree.position.set(x, y, z);
      const scale = 0.8 + Math.random() * 0.45;
      tree.scale.set(scale, scale, scale);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    }

    // C. Stone Ruins Pillars at Ruins POI (260, -220)
    for (let i = 0; i < 8; i++) {
      const rx = 260 + (Math.random() - 0.5) * 40;
      const rz = -220 + (Math.random() - 0.5) * 40;
      const ry = this.terrain.getHeight(rx, rz);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.1, 7 + Math.random() * 4, 6),
        Materials.rock
      );
      pillar.position.set(rx, ry + 3.5, rz);
      pillar.rotation.y = Math.random() * Math.PI;
      pillar.castShadow = true;
      this.scene.add(pillar);
    }
  }

  private setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('wheel', this.handleMouseWheel);
    window.addEventListener('resize', this.handleResize);

    this.renderer.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    });
  }

  public requestPointerLock() {
    this.renderer.domElement.requestPointerLock?.();
  }

  public exitPointerLock() {
    document.exitPointerLock?.();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        if (this.gameMode === 'aiming' || this.gameMode === 'binoculars') {
          this.vitals.holdingBreath = true;
        }
        break;
      case 'ControlLeft':
      case 'KeyC':
        this.keys.crouch = !this.keys.crouch;
        this.vitals.isCrouching = this.keys.crouch;
        break;
      case 'Space':
        this.keys.jump = true;
        break;
      case 'KeyE':
        this.triggerInteraction();
        break;
      case 'KeyF':
        // Primary Fire on Button 'F' (User Request)
        this.triggerFire();
        break;
      case 'KeyB':
        // Scope ON/OFF on Button 'B' (User Request)
        this.toggleScope();
        break;
      case 'KeyT':
        this.toggleFlashlight();
        break;
      case 'KeyR':
        if (this.gameMode === 'driving') {
          this.vehicles.resetVehicle();
        } else {
          this.hunting.reload();
        }
        break;
      case 'KeyV':
        this.toggleCameraView();
        break;
      case 'Digit1':
        this.hunting.selectWeapon('rifle');
        break;
      case 'Digit2':
        this.hunting.selectWeapon('bow');
        break;
      case 'Digit3':
        this.hunting.selectWeapon('dart_gun');
        break;
      case 'Digit4':
        this.hunting.selectWeapon('revolver');
        break;
      case 'Digit5':
        this.setEquippedTool('binoculars');
        break;
      case 'Digit6':
        this.setEquippedTool('camera');
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        this.vitals.holdingBreath = false;
        break;
      case 'Space':
        this.keys.jump = false;
        break;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    const sens = 0.0022;
    this.playerYaw -= e.movementX * sens;
    this.playerPitch -= e.movementY * sens;

    // Clamp pitch between -80° and +80°
    this.playerPitch = Math.max(-1.4, Math.min(1.4, this.playerPitch));
  };

  public triggerFire() {
    if (this.gameMode === 'driving') return;

    if (this.equippedTool === 'camera') {
      this.snapWildlifePhoto();
    } else {
      const result = this.hunting.fire(this.camera, this.wildlife, this.playerPos);
      if (result.hit && result.animal) {
        this.missions.recordProgress('m1_harvest', 1);
        this.missions.recordProgress('m2_boar', result.animal.type === 'boar' ? 1 : 0);
        this.missions.recordProgress('m4_tiger', result.animal.type === 'tiger' ? 1 : 0);
        this.wildlifeRegistry.recordHarvest(result.animal.type);
        this.notify(result.message || 'Hit!');
      } else if (result.message) {
        this.notify(result.message);
      }
    }
  }

  public toggleScope() {
    if (this.gameMode === 'walking') {
      this.gameMode = this.equippedTool === 'binoculars' ? 'binoculars' : 'aiming';
      this.vitals.isAiming = true;
      soundEngine.playInteract();
      this.notify(this.gameMode === 'aiming' ? 'Optical Scope [B] Active' : 'Binoculars Active');
    } else if (this.gameMode === 'aiming' || this.gameMode === 'binoculars') {
      this.gameMode = 'walking';
      this.vitals.isAiming = false;
      soundEngine.playInteract();
      this.notify('Scope Deactivated');
    }
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;

    if (e.button === 2) {
      e.preventDefault();
      this.toggleScope();
    } else if (e.button === 0) {
      this.triggerFire();
    }
  };

  private handleMouseWheel = (e: WheelEvent) => {
    if (this.gameMode === 'aiming' || this.gameMode === 'binoculars') {
      // Adjust scope zoom
      const zoomDelta = e.deltaY > 0 ? 2 : -2;
      this.camera.fov = Math.max(8, Math.min(45, this.camera.fov + zoomDelta));
      this.camera.updateProjectionMatrix();
    }
  };

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public toggleCameraView() {
    this.cameraView = this.cameraView === 'first_person' ? 'third_person' : 'first_person';
    this.hunterRig.group.visible = this.cameraView === 'third_person' && this.gameMode !== 'driving';
    soundEngine.playInteract();
  }

  public toggleFlashlight() {
    this.vitals.flashlightOn = !this.vitals.flashlightOn;
    this.playerSpotlight.visible = this.vitals.flashlightOn;
    soundEngine.playInteract();
  }

  public setEquippedTool(tool: EquipmentId) {
    this.equippedTool = tool;
    soundEngine.playInteract();
    this.notify(`Equipped: ${this.inventory[tool].name}`);
  }

  public useItem(id: EquipmentId): boolean {
    const item = this.inventory[id];
    if (item.count <= 0) {
      this.notify(`No ${item.name} remaining`);
      return false;
    }

    if (id === 'canteen') {
      if (this.vitals.hydration >= 100) {
        this.notify('Hydration is already full!');
        return false;
      }
      this.vitals.hydration = Math.min(100, this.vitals.hydration + 35);
      item.count--;
      soundEngine.playFootstep('water');
      this.notify('Drank fresh water (+35% Hydration)');
      if (this.vitals.hydration >= 90) {
        this.missions.recordProgress('m3_hydrate', 1);
      }
      return true;
    }

    if (id === 'medkit') {
      if (this.vitals.health >= 100) {
        this.notify('Health is already at maximum');
        return false;
      }
      this.vitals.health = Math.min(100, this.vitals.health + 50);
      item.count--;
      soundEngine.playInteract();
      this.notify('Applied field dressing (+50% Health)');
      return true;
    }

    if (id === 'repair_kit') {
      if (this.vehicles.activeVehicle) {
        this.vehicles.activeVehicle.state.health = 100;
        this.vehicles.activeVehicle.state.fuel = Math.min(100, this.vehicles.activeVehicle.state.fuel + 40);
        item.count--;
        soundEngine.playReload();
        this.notify('Vehicle repaired & refueled!');
        return true;
      } else {
        this.notify('Must be inside a vehicle to use repair kit');
        return false;
      }
    }

    this.setEquippedTool(id);
    return true;
  }

  public triggerInteraction() {
    // 1. Vehicle Entry / Exit
    if (this.gameMode === 'driving') {
      const exitPos = this.vehicles.exitVehicle();
      this.playerPos.copy(exitPos);
      this.gameMode = 'walking';
      this.hunterRig.group.visible = this.cameraView === 'third_person';
      this.notify('Exited vehicle');
      return;
    } else {
      const nearVehicle = this.vehicles.getNearestVehicle(this.playerPos);
      if (nearVehicle) {
        const ok = this.vehicles.enterVehicle(nearVehicle);
        if (ok) {
          this.gameMode = 'driving';
          this.hunterRig.group.visible = false;
          this.notify(`Driving ${nearVehicle.state.type === 'truck' ? '4x4 Expedition Rig' : 'Enduro Motorbike'}`);
          this.missions.recordProgress('m3_drive', 1);
          return;
        }
      }
    }

    // 2. Tracking Clue Inspection
    const nearClue = this.tracking.getNearestClue(this.playerPos);
    if (nearClue) {
      const clue = this.tracking.inspectClue(nearClue.clue.id);
      if (clue) {
        this.missions.recordProgress('m2_clues', 1);
        this.wildlifeRegistry.recordSighting(clue.type);
        const freshnessText = clue.freshness > 0.9 ? 'Very Fresh (< 2 mins)' : 'Recent (< 15 mins)';
        this.notify(`Inspected ${clue.type.toUpperCase()} ${clue.kind} — ${freshnessText}`);
        return;
      }
    }

    // 3. River Water Drinking
    const waterDepth = this.terrain.getWaterDepth(this.playerPos.x, this.playerPos.z);
    if (waterDepth > 0.1 && waterDepth < 1.2) {
      this.vitals.hydration = 100;
      this.inventory.canteen.count = this.inventory.canteen.maxCount;
      soundEngine.playFootstep('water');
      this.notify('Refilled canteen with pure mountain stream water (+100% Hydration)');
      this.missions.recordProgress('m3_hydrate', 1);
      return;
    }

    // 4. Watchtower observation point
    const distToTower = this.playerPos.distanceTo(this.terrain.POIs.watchtower.pos);
    if (distToTower < 15) {
      this.missions.recordProgress('m5_tower', 1);
      this.notify('Reached High Lookout Tower Vantage');
      return;
    }

    // 5. Ruins
    const distToRuins = this.playerPos.distanceTo(this.terrain.POIs.ruins.pos);
    if (distToRuins < 30) {
      this.missions.recordProgress('m4_ruins', 1);
      this.notify('Entered Ancient Jungle Ruins');
      return;
    }

    // 6. Pet / Command Hunting Dog Companion
    const distToDog = this.playerPos.distanceTo(this.dogCompanion.position);
    if (distToDog < 3.0) {
      soundEngine.playDogWhine();
      this.notify(`Petted ${this.dogCompanion.name}! Loyal companion is alert.`);
      return;
    }
  }

  private snapWildlifePhoto() {
    soundEngine.playCameraShutter();

    // Check if an animal is in front of camera
    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    let capturedAnimal: any = null;

    for (const inst of this.wildlife.animals) {
      if (inst.data.state === 'dead') continue;
      const intersects = this._raycaster.intersectObjects(inst.group.children, true);
      if (intersects.length > 0 && intersects[0].distance < 75) {
        capturedAnimal = inst.data;
        break;
      }
    }

    if (capturedAnimal) {
      this.wildlifeRegistry.recordPhoto(capturedAnimal.type);
      this.missions.recordProgress('m1_observe', 1);
      this.missions.recordProgress('m1_harvest', 1);
      this.missions.recordProgress('m3_croc', capturedAnimal.type === 'crocodile' ? 1 : 0);
      this.missions.recordProgress('m5_species', 1);
      this.notify(`PHOTO TAKEN! Documented ${capturedAnimal.name} in Field Guide (+150 XP)`);
    } else {
      this.notify('Photo captured (no wildlife in frame)');
    }
  }

  public notify(msg: string) {
    this.onNotification?.(msg);
  }

  // Calculate real distance to object under crosshair
  private getTargetRange(): number | null {
    this._raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this._raycaster.intersectObjects(this.scene.children, true);
    for (const hit of intersects) {
      if (hit.object !== this.hunterRig.group && hit.object !== this.dogCompanion.group && hit.distance > 0.5) {
        return Math.round(hit.distance);
      }
    }
    return null;
  }

  private getInteractionPrompt(): string | null {
    if (this.gameMode === 'driving') {
      return '[E] Exit Vehicle  |  [F] Fire / [T] Headlights  |  [R] Reset Position';
    }
    const nearVehicle = this.vehicles.getNearestVehicle(this.playerPos);
    if (nearVehicle) {
      return `[E] Drive ${nearVehicle.state.type === 'truck' ? '4x4 Expedition Truck' : 'Motorbike'}`;
    }
    const nearClue = this.tracking.getNearestClue(this.playerPos);
    if (nearClue) {
      return `[E] Inspect ${nearClue.clue.type.toUpperCase()} Track`;
    }
    const waterDepth = this.terrain.getWaterDepth(this.playerPos.x, this.playerPos.z);
    if (waterDepth > 0.1 && waterDepth < 1.2) {
      return '[E] Drink & Refill Canteen';
    }
    const distToDog = this.playerPos.distanceTo(this.dogCompanion.position);
    if (distToDog < 3.0) {
      return `[E] Pet Rex (${this.dogCompanion.state.toUpperCase()})`;
    }
    return null;
  }

  // Main Loop
  private startLoop() {
    const tick = () => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.animFrameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.animFrameId = window.setTimeout(cb, 40);
      }
    };
    this.animFrameId = window.setTimeout(poll, 5);
  }

  private update(delta: number) {
    // 1. Vehicle Driving or Hunter Walking
    if (this.gameMode === 'driving') {
      this.vehicles.update(delta, this.keys);
      if (this.vehicles.activeVehicle) {
        const vPos = this.vehicles.activeVehicle.mesh.position;
        this.playerPos.copy(vPos);

        // Chase camera behind vehicle
        const camDistance = 7.0;
        const camHeight = 3.2;
        const camOffset = new THREE.Vector3(0, camHeight, -camDistance).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          this.vehicles.activeVehicle.mesh.rotation.y
        );
        this.camera.position.copy(vPos).add(camOffset);
        this.camera.lookAt(vPos.x, vPos.y + 1.2, vPos.z);
      }
    } else {
      this.updateHunterMovement(delta);
      this.updateHunterCamera(delta);
    }

    // 2. Hunting & Weapons update
    this.hunting.update(delta, this.gameMode === 'aiming', this.vitals.holdingBreath);

    // 3. Wildlife AI Simulation
    let playerNoise = 0.5; // Walking
    if (this.vitals.isCrouching) playerNoise = 0.1;
    if (this.vitals.isSprinting) playerNoise = 1.0;
    if (this.gameMode === 'driving') playerNoise = 2.5;

    this.wildlife.update(delta, this.playerPos, playerNoise, (damage) => {
      // Player attacked by predator!
      this.vitals.health = Math.max(0, this.vitals.health - damage);
      soundEngine.playPlayerHurt();
      this.notify(`PREDATOR ATTACK! Took ${damage} damage.`);
      if (this.vitals.health <= 0) {
        this.notify('HUNTER INCAPACITATED! Respawning at Base Camp...');
        this.respawnAtCamp();
      }
    });

    // 4. Environment (sun/shadows/weather)
    this.environment.update(delta, this.playerPos);

    // 5. Update Flashlight orientation
    if (this.vitals.flashlightOn) {
      this.playerSpotlight.position.copy(this.camera.position);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      this.playerSpotlight.target.position.copy(this.camera.position).add(forward.multiplyScalar(20));
      this.playerSpotlight.target.updateMatrixWorld();
    }

    // 6. Hunting Dog Companion Autonomous Behavior & Animation
    this.dogCompanion.update(
      delta,
      this.playerPos,
      this.playerYaw,
      this.wildlife,
      this.tracking,
      (msg) => this.notify(msg)
    );

    // 7. Base Camp Exploration objective check
    const distToCamp = this.playerPos.distanceTo(this.terrain.POIs.camp.pos);
    if (distToCamp < 40) {
      this.missions.recordProgress('m1_scout', 1);
      this.missions.recordProgress('m5_return', 1);
    }

    // 8. Push UI State update
    this.onStateUpdate?.({
      mode: this.gameMode,
      cameraView: this.cameraView,
      vitals: { ...this.vitals },
      interactionPrompt: this.getInteractionPrompt(),
      notification: null,
      targetRange: this.getTargetRange(),
      currentWeaponId: this.hunting.currentWeaponId,
      equippedTool: this.equippedTool,
      activeVehicleSpeed: this.vehicles.activeVehicle ? Math.round(this.vehicles.activeVehicle.state.speed * 3.6) : null,
      activeVehicleFuel: this.vehicles.activeVehicle ? Math.round(this.vehicles.activeVehicle.state.fuel) : null,
      playerPos: [this.playerPos.x, this.playerPos.y, this.playerPos.z],
      playerHeading: this.playerYaw,
      dogState: this.dogCompanion.state,
      dogTarget: this.dogCompanion.alertTarget,
    });
  }

  private updateHunterMovement(delta: number) {
    // Determine movement speeds
    let speed = 3.8; // normal walk
    this.vitals.isSprinting = false;

    if (this.keys.sprint && this.vitals.stamina > 5 && !this.keys.crouch && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right)) {
      speed = 7.5; // sprint
      this.vitals.isSprinting = true;
      this.vitals.stamina = Math.max(0, this.vitals.stamina - delta * 14);
    } else {
      // Regenerate stamina
      this.vitals.stamina = Math.min(100, this.vitals.stamina + delta * 12);
    }

    if (this.keys.crouch) {
      speed = 1.9;
    }

    // Hydration depletion
    this.vitals.hydration = Math.max(0, this.vitals.hydration - delta * 0.12);

    // Compute direction vector relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw));
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));

    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();

      // Terrain water slowing
      const waterDepth = this.terrain.getWaterDepth(this.playerPos.x, this.playerPos.z);
      if (waterDepth > 0.2) {
        speed *= Math.max(0.35, 1 - waterDepth * 0.45);
      }

      this.playerPos.addScaledVector(moveDir, speed * delta);

      // Footstep sound system
      this.stepDistanceAccumulator += speed * delta;
      const stepInterval = this.vitals.isSprinting ? 2.2 : 1.4;
      if (this.stepDistanceAccumulator >= stepInterval) {
        this.stepDistanceAccumulator = 0;
        const surf = this.terrain.getSurfaceType(this.playerPos.x, this.playerPos.z);
        soundEngine.playFootstep(surf);
      }

      // Animate character model limbs
      const t = Date.now() * 0.008 * (this.vitals.isSprinting ? 1.6 : 1.0);
      const swing = Math.sin(t) * 0.55;
      this.hunterRig.leftLeg.rotation.x = swing;
      this.hunterRig.rightLeg.rotation.x = -swing;
      this.hunterRig.leftArm.rotation.x = -swing * 0.6;
    } else {
      // Idle pose
      this.hunterRig.leftLeg.rotation.x = THREE.MathUtils.damp(this.hunterRig.leftLeg.rotation.x, 0, 8, delta);
      this.hunterRig.rightLeg.rotation.x = THREE.MathUtils.damp(this.hunterRig.rightLeg.rotation.x, 0, 8, delta);
      this.hunterRig.leftArm.rotation.x = THREE.MathUtils.damp(this.hunterRig.leftArm.rotation.x, 0, 8, delta);
    }

    // Terrain height clamping
    const groundHeight = this.terrain.getHeight(this.playerPos.x, this.playerPos.z);
    this.playerPos.y = groundHeight;

    // Orient hunter mesh
    this.hunterRig.group.position.copy(this.playerPos);
    this.hunterRig.group.rotation.y = this.playerYaw;
  }

  private updateHunterCamera(delta: number) {
    const isFirstPerson = this.cameraView === 'first_person' || this.gameMode === 'aiming' || this.gameMode === 'binoculars';

    // FOV adjustment for scope/binoculars
    let targetFov = 65;
    if (this.gameMode === 'aiming') {
      targetFov = 65 / this.hunting.currentWeapon.zoomLevel;
    } else if (this.gameMode === 'binoculars') {
      targetFov = 14;
    }
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 10, delta);
    this.camera.updateProjectionMatrix();

    if (isFirstPerson) {
      const eyeHeight = this.keys.crouch ? 1.1 : 1.68;
      this.camera.position.set(this.playerPos.x, this.playerPos.y + eyeHeight, this.playerPos.z);

      // Apply weapon sway and recoil offsets to camera rotation
      const yaw = this.playerYaw + this.hunting.swayOffset.x + this.hunting.recoilOffset.x;
      const pitch = this.playerPitch + this.hunting.swayOffset.y + this.hunting.recoilOffset.y;

      const rot = new THREE.Euler(pitch, yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(rot);
    } else {
      // Third Person over-the-shoulder trailing camera
      const shoulderOffset = 0.55;
      const camDist = 2.8;
      const camHeight = 1.75;

      const rot = new THREE.Euler(this.playerPitch, this.playerYaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(rot);

      const offset = new THREE.Vector3(shoulderOffset, camHeight, camDist).applyEuler(new THREE.Euler(0, this.playerYaw, 0));
      this.camera.position.copy(this.playerPos).add(offset);
    }
  }

  public respawnAtCamp() {
    this.playerPos.set(0, this.terrain.getHeight(0, 8), 8);
    this.vitals.health = 100;
    this.vitals.hydration = 80;
    this.gameMode = 'walking';
    soundEngine.playInteract();
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.animFrameId);
    soundEngine.stopAll();

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('wheel', this.handleMouseWheel);
    window.removeEventListener('resize', this.handleResize);

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
