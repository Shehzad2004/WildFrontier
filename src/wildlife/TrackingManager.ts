import * as THREE from 'three';
import { TrackClue, AnimalType } from '../types/game';
import { TerrainGenerator } from '../world/TerrainGenerator';
import { soundEngine } from '../audio/SoundEngine';

export class TrackingManager {
  public clues: TrackClue[] = [];
  public clueMeshes: THREE.Group[] = [];
  private scene: THREE.Scene;
  private terrain: TerrainGenerator;

  constructor(scene: THREE.Scene, terrain: TerrainGenerator) {
    this.scene = scene;
    this.terrain = terrain;
    this.generateClues();
  }

  private generateClues() {
    const rawClues: {
      type: AnimalType;
      x: number;
      z: number;
      angle: number;
      kind: 'footprint' | 'droppings' | 'vegetation' | 'drinking_spot';
      freshness: number;
    }[] = [
      // Deer trail near Camp
      { type: 'deer', x: 18, z: 22, angle: 0.8, kind: 'footprint', freshness: 0.95 },
      { type: 'deer', x: 28, z: 34, angle: 0.9, kind: 'vegetation', freshness: 0.9 },
      { type: 'deer', x: 38, z: 46, angle: 1.1, kind: 'drinking_spot', freshness: 0.85 },

      // Wild Boar mud tracks
      { type: 'boar', x: -45, z: -55, angle: 2.2, kind: 'footprint', freshness: 0.88 },
      { type: 'boar', x: -62, z: -72, angle: 2.4, kind: 'droppings', freshness: 0.8 },

      // Tiger predatory trail leading toward ruins
      { type: 'tiger', x: 180, z: -140, angle: -0.8, kind: 'footprint', freshness: 0.92 },
      { type: 'tiger', x: 215, z: -175, angle: -0.75, kind: 'vegetation', freshness: 0.85 },
      { type: 'tiger', x: 245, z: -200, angle: -0.7, kind: 'footprint', freshness: 0.78 },

      // Crocodile tracks at riverbank
      { type: 'crocodile', x: 145, z: 205, angle: 0.4, kind: 'footprint', freshness: 0.9 },
      { type: 'crocodile', x: 165, z: 220, angle: 0.5, kind: 'drinking_spot', freshness: 0.86 },
    ];

    rawClues.forEach((c, idx) => {
      const y = this.terrain.getHeight(c.x, c.z) + 0.05;
      const clue: TrackClue = {
        id: `clue_${idx}`,
        type: c.type,
        position: [c.x, y, c.z],
        directionAngle: c.angle,
        kind: c.kind,
        freshness: c.freshness,
        inspected: false,
      };
      this.clues.push(clue);

      // Create subtle ground visual marker
      const group = new THREE.Group();
      group.position.set(c.x, y, c.z);

      // Decal disc
      const discGeom = new THREE.CircleGeometry(0.55, 12);
      discGeom.rotateX(-Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({
        color: c.type === 'tiger' ? 0xd9534f : 0x5bc0de,
        roughness: 0.9,
        metalness: 0.1,
        transparent: true,
        opacity: 0.45,
      });
      const disc = new THREE.Mesh(discGeom, discMat);

      // Arrow pointing direction
      const arrowGeom = new THREE.ConeGeometry(0.15, 0.45, 4);
      arrowGeom.rotateX(Math.PI / 2);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const arrow = new THREE.Mesh(arrowGeom, arrowMat);
      arrow.rotation.y = c.angle;
      arrow.position.y = 0.04;

      group.add(disc, arrow);
      this.scene.add(group);
      this.clueMeshes.push(group);
    });
  }

  public getNearestClue(playerPos: THREE.Vector3, maxDist = 3.8): { clue: TrackClue; dist: number } | null {
    let nearest: { clue: TrackClue; dist: number } | null = null;
    for (const clue of this.clues) {
      const cPos = new THREE.Vector3(clue.position[0], clue.position[1], clue.position[2]);
      const dist = playerPos.distanceTo(cPos);
      if (dist < maxDist) {
        if (!nearest || dist < nearest.dist) {
          nearest = { clue, dist };
        }
      }
    }
    return nearest;
  }

  public inspectClue(clueId: string): TrackClue | null {
    const clue = this.clues.find(c => c.id === clueId);
    if (!clue) return null;
    clue.inspected = true;
    soundEngine.playInteract();

    // Visual feedback: brighten mesh
    const idx = this.clues.indexOf(clue);
    if (this.clueMeshes[idx]) {
      const disc = this.clueMeshes[idx].children[0] as THREE.Mesh;
      if (disc && disc.material) {
        (disc.material as THREE.MeshStandardMaterial).opacity = 0.8;
      }
    }
    return clue;
  }
}
