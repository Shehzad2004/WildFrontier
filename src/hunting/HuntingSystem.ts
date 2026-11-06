import * as THREE from 'three';
import { WeaponConfig, WeaponId, AnimalData } from '../types/game';
import { WildlifeManager } from '../wildlife/WildlifeManager';
import { soundEngine } from '../audio/SoundEngine';

export class HuntingSystem {
  public weapons: Record<WeaponId, WeaponConfig> = {
    rifle: {
      id: 'rifle',
      name: 'Scout .308 Bolt Rifle',
      category: 'Rifle',
      damage: 100,
      zoomLevel: 6, // Scope zoom
      maxAmmo: 5,
      currentAmmo: 5,
      reserveAmmo: 25,
      reloadTime: 2.2,
      fireRate: 1.2,
      swayFactor: 1.0,
      soundLoudness: 160,
      bulletDrop: 0.1,
      unlocked: true,
      description: 'Precision bolt-action rifle equipped with a 4x-12x duplex optic reticle.',
    },
    bow: {
      id: 'bow',
      name: 'Apex Compound Bow',
      category: 'Archery',
      damage: 85,
      zoomLevel: 1.8,
      maxAmmo: 1,
      currentAmmo: 1,
      reserveAmmo: 18,
      reloadTime: 1.4,
      fireRate: 1.5,
      swayFactor: 1.4,
      soundLoudness: 15,
      bulletDrop: 0.35,
      unlocked: true,
      description: 'Deadly silent high-tensile compound bow. Ideal for stealth hunting without alarming herds.',
    },
    dart_gun: {
      id: 'dart_gun',
      name: 'Vanguard Dart Rifle',
      category: 'Non-Lethal',
      damage: 40,
      zoomLevel: 3,
      maxAmmo: 3,
      currentAmmo: 3,
      reserveAmmo: 12,
      reloadTime: 1.8,
      fireRate: 1.0,
      swayFactor: 0.9,
      soundLoudness: 25,
      bulletDrop: 0.2,
      unlocked: true,
      description: 'Pneumatic tranquilizer rifle used by wildlife researchers to tag and monitor animals safely.',
    },
    revolver: {
      id: 'revolver',
      name: 'Frontier .44 Magnum',
      category: 'Sidearm',
      damage: 120,
      zoomLevel: 1.2,
      maxAmmo: 6,
      currentAmmo: 6,
      reserveAmmo: 30,
      reloadTime: 2.5,
      fireRate: 0.6,
      swayFactor: 1.6,
      soundLoudness: 140,
      bulletDrop: 0.15,
      unlocked: false,
      description: 'High-stopping-power defensive sidearm. Indispensable against sudden predator charges.',
    },
  };

  public currentWeaponId: WeaponId = 'rifle';
  public isReloading = false;
  public reloadTimer = 0;
  public lastFireTime = 0;

  // Aiming sway & recoil
  public recoilOffset = new THREE.Vector2(0, 0);
  public swayOffset = new THREE.Vector2(0, 0);

  constructor() {}

  public get currentWeapon(): WeaponConfig {
    return this.weapons[this.currentWeaponId];
  }

  public selectWeapon(id: WeaponId) {
    if (this.weapons[id] && this.weapons[id].unlocked) {
      this.currentWeaponId = id;
      this.isReloading = false;
      soundEngine.playInteract();
    }
  }

  public update(delta: number, isAiming: boolean, holdingBreath: boolean) {
    // Reload timer
    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.completeReload();
      }
    }

    // Sway calculations (smooth Lissajous figure)
    const time = Date.now() * 0.0015;
    const swayStrength = (isAiming ? 0.003 : 0.009) * (holdingBreath ? 0.2 : 1.0) * this.currentWeapon.swayFactor;
    this.swayOffset.set(
      Math.sin(time * 1.5) * swayStrength,
      Math.cos(time * 3.0) * swayStrength * 0.6
    );

    // Recoil recovery
    this.recoilOffset.x = THREE.MathUtils.damp(this.recoilOffset.x, 0, 10, delta);
    this.recoilOffset.y = THREE.MathUtils.damp(this.recoilOffset.y, 0, 10, delta);
  }

  public canFire(): boolean {
    const now = Date.now();
    return (
      !this.isReloading &&
      this.currentWeapon.currentAmmo > 0 &&
      now - this.lastFireTime >= this.currentWeapon.fireRate * 1000
    );
  }

  public fire(
    camera: THREE.Camera,
    wildlife: WildlifeManager,
    playerPos: THREE.Vector3
  ): { hit: boolean; animal?: AnimalData; fatal?: boolean; message?: string } {
    if (!this.canFire()) {
      if (this.currentWeapon.currentAmmo === 0) {
        this.reload();
      }
      return { hit: false };
    }

    this.lastFireTime = Date.now();
    this.currentWeapon.currentAmmo--;

    // Sound effect
    soundEngine.playGunshot(this.currentWeapon.id);

    // Apply recoil kick
    this.recoilOffset.y += 0.06;
    this.recoilOffset.x += (Math.random() - 0.5) * 0.02;

    // Spook nearby wildlife within weapon sound radius!
    wildlife.spookNearbyAnimals(playerPos, this.currentWeapon.soundLoudness);

    // Raycast hit detection from crosshair
    const raycaster = new THREE.Raycaster();
    const center = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(center, camera);

    // Check intersection with all animal groups
    let closestHit: { inst: any; dist: number } | null = null;

    for (const inst of wildlife.animals) {
      if (inst.data.state === 'dead') continue;
      const intersects = raycaster.intersectObjects(inst.group.children, true);
      if (intersects.length > 0) {
        const dist = intersects[0].distance;
        if (!closestHit || dist < closestHit.dist) {
          closestHit = { inst, dist };
        }
      }
    }

    if (closestHit) {
      const res = wildlife.applyDamage(closestHit.inst.data.id, this.currentWeapon.damage);
      if (res) {
        return {
          hit: true,
          animal: res.animal,
          fatal: res.dead,
          message: res.dead
            ? `Harvested ${res.animal.name} (${Math.round(closestHit.dist)}m)`
            : `Hit ${res.animal.name} (-${this.currentWeapon.damage} HP)`,
        };
      }
    }

    return { hit: false, message: 'Missed' };
  }

  public reload() {
    if (this.isReloading) return;
    const w = this.currentWeapon;
    if (w.currentAmmo >= w.maxAmmo || w.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadTimer = w.reloadTime;
    soundEngine.playReload();
  }

  private completeReload() {
    this.isReloading = false;
    const w = this.currentWeapon;
    const needed = w.maxAmmo - w.currentAmmo;
    const added = Math.min(needed, w.reserveAmmo);
    w.currentAmmo += added;
    w.reserveAmmo -= added;
  }
}
