import * as THREE from 'three';
import { VehicleState, VehicleType } from '../types/game';
import { TerrainGenerator } from '../world/TerrainGenerator';
import { createOffRoadTruckModel, createMotorbikeModel } from '../world/ProceduralMeshes';
import { soundEngine } from '../audio/SoundEngine';

export interface VehicleInstance {
  state: VehicleState;
  mesh: THREE.Group;
  headlightLight?: THREE.SpotLight;
}

export class VehicleManager {
  public vehicles: VehicleInstance[] = [];
  public activeVehicle: VehicleInstance | null = null;
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;

  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    this.spawnVehicles();
  }

  private spawnVehicles() {
    // 1. Off-Road 4x4 Truck at Base Camp
    const truckMesh = createOffRoadTruckModel();
    const truckX = 8;
    const truckZ = -10;
    const truckY = this.terrain.getHeight(truckX, truckZ);
    truckMesh.position.set(truckX, truckY, truckZ);
    truckMesh.rotation.y = 0.4;
    this.scene.add(truckMesh);

    // Truck Headlights Spotlight
    const truckLight = new THREE.SpotLight(0xfffae0, 2.5, 90, Math.PI / 4, 0.4);
    truckLight.position.set(0, 1.1, 2.6);
    truckLight.target.position.set(0, 0.5, 12);
    truckMesh.add(truckLight);
    truckMesh.add(truckLight.target);
    truckLight.visible = true;

    const truckState: VehicleState = {
      type: 'truck',
      position: [truckX, truckY, truckZ],
      rotation: 0.4,
      speed: 0,
      fuel: 95,
      health: 100,
      headlightsOn: true,
      inUse: false,
    };
    this.vehicles.push({ state: truckState, mesh: truckMesh, headlightLight: truckLight });

    // 2. Enduro Adventure Motorbike near Watchtower
    const bikeMesh = createMotorbikeModel();
    const bikeX = 35;
    const bikeZ = -38;
    const bikeY = this.terrain.getHeight(bikeX, bikeZ);
    bikeMesh.position.set(bikeX, bikeY, bikeZ);
    bikeMesh.rotation.y = -0.5;
    this.scene.add(bikeMesh);

    const bikeLight = new THREE.SpotLight(0xfffae0, 2.0, 70, Math.PI / 5, 0.3);
    bikeLight.position.set(0, 1.0, 1.1);
    bikeLight.target.position.set(0, 0.4, 9);
    bikeMesh.add(bikeLight);
    bikeMesh.add(bikeLight.target);
    bikeLight.visible = true;

    const bikeState: VehicleState = {
      type: 'bike',
      position: [bikeX, bikeY, bikeZ],
      rotation: -0.5,
      speed: 0,
      fuel: 85,
      health: 100,
      headlightsOn: true,
      inUse: false,
    };
    this.vehicles.push({ state: bikeState, mesh: bikeMesh, headlightLight: bikeLight });
  }

  public getNearestVehicle(playerPos: THREE.Vector3, maxDist = 4.2): VehicleInstance | null {
    let nearest: VehicleInstance | null = null;
    let minD = maxDist;
    for (const v of this.vehicles) {
      const d = playerPos.distanceTo(v.mesh.position);
      if (d < minD) {
        minD = d;
        nearest = v;
      }
    }
    return nearest;
  }

  public enterVehicle(vehicle: VehicleInstance): boolean {
    if (vehicle.state.fuel <= 0) return false;
    this.activeVehicle = vehicle;
    vehicle.state.inUse = true;
    soundEngine.playInteract();
    soundEngine.updateEngineSound(true, 0.1);
    return true;
  }

  public exitVehicle(): THREE.Vector3 {
    if (!this.activeVehicle) return new THREE.Vector3();
    const v = this.activeVehicle;
    v.state.inUse = false;
    v.state.speed = 0;
    this.activeVehicle = null;
    soundEngine.updateEngineSound(false, 0);

    // Player steps out on the driver side
    const exitOffset = new THREE.Vector3(-2.2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.mesh.rotation.y);
    const exitPos = v.mesh.position.clone().add(exitOffset);
    exitPos.y = this.terrain.getHeight(exitPos.x, exitPos.z);
    return exitPos;
  }

  public toggleHeadlights() {
    if (!this.activeVehicle) return;
    const v = this.activeVehicle;
    v.state.headlightsOn = !v.state.headlightsOn;
    if (v.headlightLight) {
      v.headlightLight.visible = v.state.headlightsOn;
    }
    soundEngine.playInteract();
  }

  public resetVehicle() {
    if (!this.activeVehicle) return;
    const v = this.activeVehicle;
    v.state.speed = 0;
    v.mesh.rotation.z = 0;
    v.mesh.rotation.x = 0;
    v.mesh.position.y = this.terrain.getHeight(v.mesh.position.x, v.mesh.position.z) + 0.5;
  }

  public update(
    delta: number,
    keys: { forward: boolean; backward: boolean; left: boolean; right: boolean }
  ) {
    if (!this.activeVehicle) return;

    const v = this.activeVehicle;
    const isTruck = v.state.type === 'truck';
    const maxSpeed = isTruck ? 22 : 28;
    const accel = isTruck ? 14 : 22;
    const brake = 20;
    const turnSpeed = isTruck ? 1.6 : 2.5;

    // Acceleration & Braking
    if (keys.forward && v.state.fuel > 0) {
      v.state.speed = Math.min(maxSpeed, v.state.speed + accel * delta);
      v.state.fuel = Math.max(0, v.state.fuel - delta * 0.4);
    } else if (keys.backward) {
      v.state.speed = Math.max(-8, v.state.speed - brake * delta);
    } else {
      // Rolling friction
      v.state.speed = THREE.MathUtils.damp(v.state.speed, 0, 2.5, delta);
    }

    // Steering (effective when moving)
    if (Math.abs(v.state.speed) > 0.1) {
      const dirFactor = v.state.speed > 0 ? 1 : -1;
      if (keys.left) {
        v.mesh.rotation.y += turnSpeed * delta * dirFactor;
      }
      if (keys.right) {
        v.mesh.rotation.y -= turnSpeed * delta * dirFactor;
      }
    }

    // Check terrain water slowing
    const waterDepth = this.terrain.getWaterDepth(v.mesh.position.x, v.mesh.position.z);
    if (waterDepth > 0.4) {
      v.state.speed *= Math.max(0.2, 1 - waterDepth * 0.4);
    }

    // Move forward along vehicle forward vector
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), v.mesh.rotation.y);
    v.mesh.position.addScaledVector(forward, v.state.speed * delta);

    // Align height and tilt to terrain slope
    const groundH = this.terrain.getHeight(v.mesh.position.x, v.mesh.position.z);
    v.mesh.position.y = THREE.MathUtils.damp(v.mesh.position.y, groundH, 12, delta);

    // Terrain normal tilt
    const norm = this.terrain.getNormal(v.mesh.position.x, v.mesh.position.z);
    const targetPitch = -Math.sin(v.mesh.rotation.y) * norm.z - Math.cos(v.mesh.rotation.y) * norm.x;
    v.mesh.rotation.x = THREE.MathUtils.damp(v.mesh.rotation.x, targetPitch * 0.4, 6, delta);

    // Update state
    v.state.position = [v.mesh.position.x, v.mesh.position.y, v.mesh.position.z];
    v.state.rotation = v.mesh.rotation.y;

    // Engine Audio
    const speedNorm = Math.abs(v.state.speed) / maxSpeed;
    soundEngine.updateEngineSound(true, speedNorm);
  }
}
