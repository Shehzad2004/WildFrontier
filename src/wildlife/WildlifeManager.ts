import * as THREE from 'three';
import { AnimalData, AnimalState, AnimalType } from '../types/game';
import { TerrainGenerator } from '../world/TerrainGenerator';
import {
  createDeerModel,
  createTigerModel,
  createBoarModel,
  createCrocodileModel,
  createBirdModel,
  DeerRig,
  TigerRig,
} from '../world/ProceduralMeshes';
import { soundEngine } from '../audio/SoundEngine';

export interface AnimalInstance {
  data: AnimalData;
  group: THREE.Group;
  deerRig?: DeerRig;
  tigerRig?: TigerRig;
  lastGrowlTime?: number;
}

export class WildlifeManager {
  public animals: AnimalInstance[] = [];
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;

  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    this.spawnInitialWildlife();
  }

  private spawnInitialWildlife() {
    // 1. Deer Herds (Meadow & Riverbanks)
    const deerSpawns: [number, number][] = [
      [35, 40],
      [48, 52],
      [22, 60],
      [-80, 110],
      [-110, 130],
      [-95, 145],
      [140, -90],
      [160, -110],
    ];

    deerSpawns.forEach(([x, z], idx) => {
      this.spawnAnimal('deer', `Deer #${idx + 1}`, x, z);
    });

    // 2. Wild Boars (Muddy clearings)
    const boarSpawns: [number, number][] = [
      [-60, -80],
      [-75, -95],
      [90, 80],
      [110, 95],
    ];
    boarSpawns.forEach(([x, z], idx) => {
      this.spawnAnimal('boar', `Wild Boar #${idx + 1}`, x, z);
    });

    // 3. Bengal Tigers (Ruins & North Highlands)
    const tigerSpawns: [number, number][] = [
      [250, -210],
      [280, -240],
    ];
    tigerSpawns.forEach(([x, z], idx) => {
      this.spawnAnimal('tiger', `Bengal Tiger #${idx + 1}`, x, z);
    });

    // 4. Crocodiles (River & Shallows)
    const crocSpawns: [number, number][] = [
      [170, 230],
      [195, 250],
      [-135, 175],
    ];
    crocSpawns.forEach(([x, z], idx) => {
      this.spawnAnimal('crocodile', `Marsh Crocodile #${idx + 1}`, x, z);
    });

    // 5. Jungle Birds
    const birdSpawns: [number, number][] = [
      [15, -20],
      [-40, 30],
      [70, -60],
      [-120, -110],
    ];
    birdSpawns.forEach(([x, z], idx) => {
      this.spawnAnimal('bird', `Jungle Falcon #${idx + 1}`, x, z);
    });
  }

  public spawnAnimal(type: AnimalType, name: string, x: number, z: number): AnimalInstance {
    const y = this.terrain.getHeight(x, z);

    let group: THREE.Group;
    let deerRig: DeerRig | undefined;
    let tigerRig: TigerRig | undefined;

    let maxHealth = 100;
    let speed = 2.0;
    const isHostile = type === 'tiger' || type === 'crocodile';

    if (type === 'deer') {
      deerRig = createDeerModel();
      group = deerRig.group;
      maxHealth = 80;
      speed = 2.4;
    } else if (type === 'tiger') {
      tigerRig = createTigerModel();
      group = tigerRig.group;
      maxHealth = 160;
      speed = 3.2;
    } else if (type === 'boar') {
      group = createBoarModel();
      maxHealth = 120;
      speed = 2.2;
    } else if (type === 'crocodile') {
      group = createCrocodileModel();
      maxHealth = 140;
      speed = 1.6;
    } else {
      group = createBirdModel();
      maxHealth = 30;
      speed = 4.0;
    }

    group.position.set(x, y, z);
    this.scene.add(group);

    const data: AnimalData = {
      id: `animal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      name,
      position: [x, y, z],
      rotation: Math.random() * Math.PI * 2,
      state: 'graze',
      health: maxHealth,
      maxHealth,
      speed,
      alertness: 0,
      isHostile,
      scale: 1.0,
      animationTime: Math.random() * 10,
      homePosition: [x, y, z],
      attackCooldown: 0,
    };

    const inst: AnimalInstance = { data, group, deerRig, tigerRig };
    this.animals.push(inst);
    return inst;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    playerNoiseFactor: number, // 0 (crouch), 0.5 (walk), 1.0 (sprint), 3.0 (gunshot/vehicle)
    onPlayerAttacked: (damage: number) => void
  ) {
    const now = Date.now();

    for (let i = 0; i < this.animals.length; i++) {
      const inst = this.animals[i];
      const data = inst.data;
      if (data.state === 'dead') continue;

      data.animationTime += delta;
      if (data.attackCooldown && data.attackCooldown > 0) {
        data.attackCooldown -= delta;
      }

      const animalPos = inst.group.position;
      const distToPlayer = animalPos.distanceTo(playerPos);

      // Distance-based simulation throttling: skip heavy updates beyond 220m
      if (distToPlayer > 240) continue;

      // 1. Perception & Senses
      const detectionRadius = 35 + playerNoiseFactor * 30;
      const isPlayerDetected = distToPlayer < detectionRadius;

      // 2. State Machine Logic
      if (data.type === 'deer') {
        this.updateDeerBehavior(inst, delta, playerPos, distToPlayer, isPlayerDetected, playerNoiseFactor);
      } else if (data.type === 'tiger') {
        this.updateTigerBehavior(inst, delta, playerPos, distToPlayer, isPlayerDetected, now, onPlayerAttacked);
      } else if (data.type === 'boar') {
        this.updateBoarBehavior(inst, delta, playerPos, distToPlayer, isPlayerDetected, onPlayerAttacked);
      } else if (data.type === 'crocodile') {
        this.updateCrocodileBehavior(inst, delta, playerPos, distToPlayer, onPlayerAttacked);
      } else if (data.type === 'bird') {
        this.updateBirdBehavior(inst, delta, distToPlayer);
      }

      // Update terrain height & normal orientation
      const groundY = this.terrain.getHeight(animalPos.x, animalPos.z);
      animalPos.y = THREE.MathUtils.damp(animalPos.y, groundY, 8, delta);

      data.position = [animalPos.x, animalPos.y, animalPos.z];
      data.rotation = inst.group.rotation.y;
    }
  }

  private updateDeerBehavior(
    inst: AnimalInstance,
    delta: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    isDetected: boolean,
    noise: number
  ) {
    const data = inst.data;
    const group = inst.group;
    const rig = inst.deerRig;

    if (data.state === 'flee') {
      // Run directly away from player at sprint speed
      const fleeDir = new THREE.Vector3().subVectors(group.position, playerPos).setY(0).normalize();
      const runSpeed = 12.5;
      group.position.addScaledVector(fleeDir, runSpeed * delta);
      group.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);

      // Fast running leg animation
      if (rig) {
        const legSwing = Math.sin(data.animationTime * 14) * 0.7;
        rig.legFL.rotation.x = legSwing;
        rig.legFR.rotation.x = -legSwing;
        rig.legBL.rotation.x = -legSwing;
        rig.legBR.rotation.x = legSwing;
        rig.head.rotation.x = 0.2; // head high
      }

      if (distToPlayer > 85) {
        data.state = 'alert';
        data.alertness = 0.8;
      }
    } else if (isDetected && (distToPlayer < 20 || noise > 1.2)) {
      // Spooked!
      data.state = 'flee';
      soundEngine.playDeerAlarm();
    } else if (isDetected && distToPlayer < 40) {
      // Alert, looking at player
      data.state = 'alert';
      data.alertness = Math.min(1.0, data.alertness + delta * 0.5);
      const lookDir = new THREE.Vector3().subVectors(playerPos, group.position).setY(0).normalize();
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(lookDir.x, lookDir.z), 4, delta);
      if (rig) {
        rig.head.rotation.x = -0.15; // head up, ears pointed
      }
    } else {
      // Calm grazing / wandering
      data.alertness = Math.max(0, data.alertness - delta * 0.2);
      if (Math.sin(data.animationTime * 0.2) > 0.4) {
        data.state = 'graze';
        if (rig) rig.head.rotation.x = 0.55; // head down eating grass
      } else {
        data.state = 'wander';
        // slow stroll
        const walkDir = new THREE.Vector3(Math.sin(group.rotation.y), 0, Math.cos(group.rotation.y));
        group.position.addScaledVector(walkDir, 1.8 * delta);
        if (Math.random() < 0.01) group.rotation.y += (Math.random() - 0.5) * 1.5;

        if (rig) {
          const legSwing = Math.sin(data.animationTime * 5) * 0.35;
          rig.legFL.rotation.x = legSwing;
          rig.legFR.rotation.x = -legSwing;
          rig.legBL.rotation.x = -legSwing;
          rig.legBR.rotation.x = legSwing;
          rig.head.rotation.x = 0.1;
        }
      }
    }
  }

  private updateTigerBehavior(
    inst: AnimalInstance,
    delta: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    isDetected: boolean,
    now: number,
    onPlayerAttacked: (damage: number) => void
  ) {
    const data = inst.data;
    const group = inst.group;
    const rig = inst.tigerRig;

    if (data.state === 'charge' || (isDetected && distToPlayer < 22)) {
      // Aggressive pursuit
      data.state = 'charge';
      const toPlayer = new THREE.Vector3().subVectors(playerPos, group.position).setY(0).normalize();
      group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

      const chargeSpeed = 11.0;
      group.position.addScaledVector(toPlayer, chargeSpeed * delta);

      // Tail swish & fast gallop
      if (rig) {
        const legSwing = Math.sin(data.animationTime * 12) * 0.65;
        rig.legFL.rotation.x = legSwing;
        rig.legFR.rotation.x = -legSwing;
        rig.legBL.rotation.x = -legSwing;
        rig.legBR.rotation.x = legSwing;
        rig.tail.rotation.y = Math.sin(data.animationTime * 8) * 0.4;
      }

      // Attack contact damage
      if (distToPlayer < 2.8 && (!data.attackCooldown || data.attackCooldown <= 0)) {
        soundEngine.playTigerGrowl();
        onPlayerAttacked(35);
        data.attackCooldown = 1.4;
      }
    } else if (isDetected && distToPlayer < 45) {
      // Stalking with warning growls
      data.state = 'stalk';
      const toPlayer = new THREE.Vector3().subVectors(playerPos, group.position).setY(0).normalize();
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.atan2(toPlayer.x, toPlayer.z), 3, delta);

      // Slow stealth crawl
      group.position.addScaledVector(toPlayer, 2.0 * delta);

      if (!inst.lastGrowlTime || now - inst.lastGrowlTime > 4500) {
        soundEngine.playTigerGrowl();
        inst.lastGrowlTime = now;
      }

      if (rig) {
        const legSwing = Math.sin(data.animationTime * 4) * 0.3;
        rig.legFL.rotation.x = legSwing;
        rig.legFR.rotation.x = -legSwing;
        rig.head.position.y = 0.85; // low crouched head
      }
    } else {
      // Territory patrol
      data.state = 'wander';
      const wanderDir = new THREE.Vector3(Math.sin(group.rotation.y), 0, Math.cos(group.rotation.y));
      group.position.addScaledVector(wanderDir, 2.2 * delta);
      if (Math.random() < 0.015) group.rotation.y += (Math.random() - 0.5) * 1.8;

      if (rig) {
        const legSwing = Math.sin(data.animationTime * 4) * 0.3;
        rig.legFL.rotation.x = legSwing;
        rig.legFR.rotation.x = -legSwing;
      }
    }
  }

  private updateBoarBehavior(
    inst: AnimalInstance,
    delta: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    isDetected: boolean,
    onPlayerAttacked: (damage: number) => void
  ) {
    const data = inst.data;
    const group = inst.group;

    if (isDetected && distToPlayer < 14) {
      if (data.state !== 'charge') {
        data.state = 'charge';
        soundEngine.playBoarGrunt();
      }
      const dir = new THREE.Vector3().subVectors(playerPos, group.position).setY(0).normalize();
      group.position.addScaledVector(dir, 8.0 * delta);
      group.rotation.y = Math.atan2(dir.x, dir.z);

      if (distToPlayer < 2.4 && (!data.attackCooldown || data.attackCooldown <= 0)) {
        onPlayerAttacked(20);
        data.attackCooldown = 1.2;
      }
    } else {
      data.state = 'graze';
      if (Math.random() < 0.02) {
        group.rotation.y += (Math.random() - 0.5) * 1.2;
      }
    }
  }

  private updateCrocodileBehavior(
    inst: AnimalInstance,
    delta: number,
    playerPos: THREE.Vector3,
    distToPlayer: number,
    onPlayerAttacked: (damage: number) => void
  ) {
    const data = inst.data;
    const group = inst.group;

    if (distToPlayer < 10) {
      data.state = 'attack';
      const dir = new THREE.Vector3().subVectors(playerPos, group.position).setY(0).normalize();
      group.position.addScaledVector(dir, 4.5 * delta);
      group.rotation.y = Math.atan2(dir.x, dir.z);

      if (distToPlayer < 3.0 && (!data.attackCooldown || data.attackCooldown <= 0)) {
        soundEngine.playCrocodileHiss();
        onPlayerAttacked(40);
        data.attackCooldown = 1.6;
      }
    }
  }

  private updateBirdBehavior(inst: AnimalInstance, delta: number, distToPlayer: number) {
    const data = inst.data;
    const group = inst.group;

    if (distToPlayer < 24) {
      // Take flight!
      group.position.y += delta * 6;
      const flyDir = new THREE.Vector3(Math.sin(group.rotation.y), 0, Math.cos(group.rotation.y));
      group.position.addScaledVector(flyDir, 12 * delta);
    }
  }

  public spookNearbyAnimals(origin: THREE.Vector3, radius: number) {
    for (const inst of this.animals) {
      if (inst.data.state === 'dead') continue;
      const dist = inst.group.position.distanceTo(origin);
      if (dist < radius) {
        if (inst.data.type === 'deer' || inst.data.type === 'bird') {
          inst.data.state = 'flee';
          if (inst.data.type === 'deer') soundEngine.playDeerAlarm();
        } else if (inst.data.type === 'tiger') {
          inst.data.state = 'charge';
          soundEngine.playTigerGrowl();
        }
      }
    }
  }

  public applyDamage(animalId: string, damage: number): { dead: boolean; animal: AnimalData } | null {
    const inst = this.animals.find(a => a.data.id === animalId);
    if (!inst) return null;

    inst.data.health -= damage;
    soundEngine.playHitMarker();

    if (inst.data.health <= 0) {
      inst.data.health = 0;
      inst.data.state = 'dead';
      // Fall on side
      inst.group.rotation.z = Math.PI / 2;
      return { dead: true, animal: inst.data };
    } else {
      // Wounded reaction: tigers charge, deers flee
      if (inst.data.type === 'tiger') {
        inst.data.state = 'charge';
        soundEngine.playTigerGrowl();
      } else {
        inst.data.state = 'flee';
        soundEngine.playDeerAlarm();
      }
      return { dead: false, animal: inst.data };
    }
  }
}
