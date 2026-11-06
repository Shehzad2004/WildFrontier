import * as THREE from 'three';
import { createHuntingDogModel, HuntingDogRig } from '../world/ProceduralMeshes';
import { TerrainGenerator } from '../world/TerrainGenerator';
import { WildlifeManager } from './WildlifeManager';
import { TrackingManager } from './TrackingManager';
import { soundEngine } from '../audio/SoundEngine';

export type DogBehavior = 'following' | 'sniffing' | 'pointing' | 'alert_barking';

export class DogCompanion {
  public name = 'Rex';
  public breed = 'Golden Field Pointer';
  public rig: HuntingDogRig;
  public group: THREE.Group;
  public state: DogBehavior = 'following';
  public position = new THREE.Vector3(2, 0, 6);
  public rotation = 0;
  public alertTarget: string | null = null;

  private scene: THREE.Scene;
  private terrain: TerrainGenerator;
  private animTime = 0;
  private lastBarkTime = 0;
  private currentSpeed = 0;

  constructor(scene: THREE.Scene, terrain: TerrainGenerator, initialPos: THREE.Vector3) {
    this.scene = scene;
    this.terrain = terrain;

    this.rig = createHuntingDogModel();
    this.group = this.rig.group;

    const spawnPos = initialPos.clone().add(new THREE.Vector3(1.8, 0, 1.8));
    spawnPos.y = this.terrain.getHeight(spawnPos.x, spawnPos.z);
    this.position.copy(spawnPos);
    this.group.position.copy(spawnPos);

    this.scene.add(this.group);
  }

  public update(
    delta: number,
    hunterPos: THREE.Vector3,
    hunterHeading: number,
    wildlife: WildlifeManager,
    tracking: TrackingManager,
    onDogStatus?: (status: string) => void
  ) {
    this.animTime += delta;
    const now = Date.now();

    // 1. Check for Nearby Dangerous Predators (Tigers, Crocodiles) -> Alert Barking
    let dangerousPredator: any = null;
    let closestPredatorDist = 45;

    for (const inst of wildlife.animals) {
      if (inst.data.state === 'dead') continue;
      if (inst.data.isHostile || inst.data.type === 'tiger' || inst.data.type === 'crocodile') {
        const d = this.position.distanceTo(inst.group.position);
        if (d < closestPredatorDist) {
          closestPredatorDist = d;
          dangerousPredator = inst;
        }
      }
    }

    // 2. Check for Nearby Game Animals (Deer, Boar) -> Pointer Stance
    let gameTarget: any = null;
    let closestGameDist = 38;

    for (const inst of wildlife.animals) {
      if (inst.data.state === 'dead') continue;
      if (inst.data.type === 'deer' || inst.data.type === 'boar') {
        const d = this.position.distanceTo(inst.group.position);
        if (d < closestGameDist) {
          closestGameDist = d;
          gameTarget = inst;
        }
      }
    }

    // 3. Check for Nearby Spoor / Tracks -> Sniffing
    const nearClue = tracking.getNearestClue(this.position, 7.0);

    // ==========================================
    // State Priority Machine
    // ==========================================
    if (dangerousPredator) {
      // PREDATOR ALERT: Stand between hunter and danger, bark warning
      this.state = 'alert_barking';
      this.alertTarget = dangerousPredator.data.name;

      // Face the predator
      const predPos = dangerousPredator.group.position;
      const toPred = new THREE.Vector3().subVectors(predPos, this.position).setY(0).normalize();
      this.rotation = Math.atan2(toPred.x, toPred.z);

      // Bark every 2.5 seconds
      if (now - this.lastBarkTime > 2400) {
        soundEngine.playDogBark();
        this.lastBarkTime = now;
        onDogStatus?.(`${this.name} barks aggressively at ${dangerousPredator.data.name}!`);
      }

      // Stiff alerted posture
      this.rig.head.position.y = 0.72; // Raised alert head
      this.rig.head.rotation.x = -0.15;
      this.rig.tail.rotation.x = -0.3; // High erect tail
      this.rig.tail.rotation.y = Math.sin(this.animTime * 14) * 0.2; // Rapid nervous wag
      this.currentSpeed = 0;
    } else if (nearClue && !nearClue.clue.inspected) {
      // SNIFFING SIGHTING: Run over to track clue, sniff ground
      this.state = 'sniffing';
      this.alertTarget = `Spoor: ${nearClue.clue.type}`;

      const cluePos = new THREE.Vector3(nearClue.clue.position[0], 0, nearClue.clue.position[2]);
      const toClue = new THREE.Vector3().subVectors(cluePos, this.position).setY(0);
      const distToClue = toClue.length();

      if (distToClue > 1.2) {
        toClue.normalize();
        this.rotation = Math.atan2(toClue.x, toClue.z);
        this.position.addScaledVector(toClue, 4.2 * delta);
        this.currentSpeed = 4.2;
      } else {
        this.currentSpeed = 0;
      }

      // Sniff ground animation (head low)
      this.rig.head.position.y = 0.42;
      this.rig.head.rotation.x = 0.55; // Nose to dirt
      this.rig.tail.rotation.y = Math.sin(this.animTime * 10) * 0.4;
      this.rig.tail.rotation.x = -0.7;
    } else if (gameTarget) {
      // POINTING STANCE: Traditional hunting pointer pose pointing at game
      this.state = 'pointing';
      this.alertTarget = gameTarget.data.name;

      const targetPos = gameTarget.group.position;
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.position).setY(0).normalize();
      this.rotation = Math.atan2(toTarget.x, toTarget.z);

      // Classic pointer freeze: Front right paw lifted, head extended, tail horizontal
      this.rig.head.position.y = 0.65;
      this.rig.head.rotation.x = 0.05; // Head leveled forward
      this.rig.tail.rotation.x = -1.55; // Tail held straight back
      this.rig.tail.rotation.y = 0;
      this.rig.legFR.rotation.x = 0.85; // Front paw held up in point!
      this.rig.legFL.rotation.x = 0;
      this.rig.legBL.rotation.x = 0;
      this.rig.legBR.rotation.x = 0;

      this.currentSpeed = 0;
    } else {
      // FOLLOWING HUNTER: Loyal heel position (1.8m to the right/rear of hunter)
      this.state = 'following';
      this.alertTarget = null;

      const followOffset = new THREE.Vector3(1.6, 0, 1.2).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        hunterHeading
      );
      const targetPos = hunterPos.clone().add(followOffset);
      const toTarget = new THREE.Vector3().subVectors(targetPos, this.position).setY(0);
      const dist = toTarget.length();

      if (dist > 1.8) {
        toTarget.normalize();
        const followSpeed = dist > 6.0 ? 8.5 : dist > 3.0 ? 5.2 : 3.0;
        this.position.addScaledVector(toTarget, followSpeed * delta);
        this.rotation = THREE.MathUtils.damp(this.rotation, Math.atan2(toTarget.x, toTarget.z), 8, delta);
        this.currentSpeed = followSpeed;
      } else {
        this.currentSpeed = 0;
        this.rotation = THREE.MathUtils.damp(this.rotation, hunterHeading, 4, delta);
      }

      // Normal head & happy tail wag
      this.rig.head.position.y = 0.65;
      this.rig.head.rotation.x = 0.15;
      this.rig.tail.rotation.x = -0.7;
      this.rig.tail.rotation.y = Math.sin(this.animTime * 7) * 0.45; // Friendly wag
    }

    // Walking / Running leg cycle
    if (this.currentSpeed > 0.2 && this.state !== 'pointing') {
      const legFreq = this.currentSpeed * 2.2;
      const legSwing = Math.sin(this.animTime * legFreq) * 0.55;
      this.rig.legFL.rotation.x = legSwing;
      this.rig.legFR.rotation.x = -legSwing;
      this.rig.legBL.rotation.x = -legSwing;
      this.rig.legBR.rotation.x = legSwing;

      // Floppy ear bounce
      const earSwing = Math.abs(Math.sin(this.animTime * legFreq * 2)) * 0.2;
      this.rig.earL.rotation.z = -0.25 - earSwing;
      this.rig.earR.rotation.z = 0.25 + earSwing;
    } else if (this.state !== 'pointing') {
      // Idle standing
      this.rig.legFL.rotation.x = THREE.MathUtils.damp(this.rig.legFL.rotation.x, 0, 8, delta);
      this.rig.legFR.rotation.x = THREE.MathUtils.damp(this.rig.legFR.rotation.x, 0, 8, delta);
      this.rig.legBL.rotation.x = THREE.MathUtils.damp(this.rig.legBL.rotation.x, 0, 8, delta);
      this.rig.legBR.rotation.x = THREE.MathUtils.damp(this.rig.legBR.rotation.x, 0, 8, delta);
      this.rig.earL.rotation.z = -0.25;
      this.rig.earR.rotation.z = 0.25;
    }

    // Ground clamping & mesh position
    const groundY = this.terrain.getHeight(this.position.x, this.position.z);
    this.position.y = groundY;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;
  }
}
