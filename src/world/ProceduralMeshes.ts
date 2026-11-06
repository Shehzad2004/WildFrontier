import * as THREE from 'three';

/**
 * Procedural 3D Models for Wild Frontier
 * Follows Three.js skill directives:
 * - 3–12 distinct parts per composite model (THREE.Group)
 * - Three silhouette scales: Primary silhouette, Secondary read, Accent details
 * - Varied roughness (>= 0.25) & metalness between adjacent components
 * - Bottom-center pivot grounding
 * - Zero external assets (100% procedural)
 */

// Shared reusable materials
export const Materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xd29b76, roughness: 0.7, metalness: 0.05 }),
  hunterVest: new THREE.MeshStandardMaterial({ color: 0x4a5d3c, roughness: 0.85, metalness: 0.1 }), // Olive drab canvas
  hunterPants: new THREE.MeshStandardMaterial({ color: 0x61543f, roughness: 0.9, metalness: 0.05 }), // Khaki
  boots: new THREE.MeshStandardMaterial({ color: 0x221a15, roughness: 0.6, metalness: 0.2 }),
  boonieHat: new THREE.MeshStandardMaterial({ color: 0x3d4b31, roughness: 0.9, metalness: 0.05 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0x7c6946, roughness: 0.8, metalness: 0.1 }),

  // Vehicles
  truckBody: new THREE.MeshStandardMaterial({ color: 0xbf8532, roughness: 0.35, metalness: 0.85 }), // Safari expedition orange/tan
  truckChassis: new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.5, metalness: 0.9 }),
  truckTire: new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.95, metalness: 0.05 }),
  truckRim: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.95 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x203540, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 }),
  headlight: new THREE.MeshStandardMaterial({ color: 0xfff6cf, roughness: 0.1, metalness: 0.9, emissive: 0xffe888, emissiveIntensity: 1.5 }),

  bikeFrame: new THREE.MeshStandardMaterial({ color: 0xd93829, roughness: 0.35, metalness: 0.75 }), // Racing red
  bikeSeat: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85, metalness: 0.05 }),

  // Wildlife
  deerCoat: new THREE.MeshStandardMaterial({ color: 0x8a5530, roughness: 0.95, metalness: 0.02 }),
  deerBelly: new THREE.MeshStandardMaterial({ color: 0xd9c2a7, roughness: 0.95, metalness: 0.02 }),
  antler: new THREE.MeshStandardMaterial({ color: 0xc9beaa, roughness: 0.7, metalness: 0.1 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9 }),

  tigerFur: new THREE.MeshStandardMaterial({ color: 0xd96818, roughness: 0.9, metalness: 0.02 }),
  tigerStripe: new THREE.MeshStandardMaterial({ color: 0x1c130c, roughness: 0.9, metalness: 0.02 }),
  tigerUnderbelly: new THREE.MeshStandardMaterial({ color: 0xede0cf, roughness: 0.95, metalness: 0.02 }),

  boarHide: new THREE.MeshStandardMaterial({ color: 0x362c24, roughness: 0.95, metalness: 0.05 }),
  boarTusk: new THREE.MeshStandardMaterial({ color: 0xded8c8, roughness: 0.5, metalness: 0.1 }),

  crocScales: new THREE.MeshStandardMaterial({ color: 0x304229, roughness: 0.8, metalness: 0.2 }),
  crocBelly: new THREE.MeshStandardMaterial({ color: 0x6e7855, roughness: 0.85, metalness: 0.15 }),

  birdFeather: new THREE.MeshStandardMaterial({ color: 0x1d70b8, roughness: 0.8, metalness: 0.2 }),
  birdBeak: new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.5, metalness: 0.1 }),

  // Foliage & Structures
  woodLog: new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9, metalness: 0.05 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0x664d37, roughness: 0.85, metalness: 0.05 }),
  roofCorrugated: new THREE.MeshStandardMaterial({ color: 0x5a6369, roughness: 0.45, metalness: 0.7 }),
  leafDark: new THREE.MeshStandardMaterial({ color: 0x1e4f20, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide }),
  leafBright: new THREE.MeshStandardMaterial({ color: 0x3d7b2a, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide }),
  palmFrond: new THREE.MeshStandardMaterial({ color: 0x2e6b23, roughness: 0.65, metalness: 0.05, side: THREE.DoubleSide }),
  rock: new THREE.MeshStandardMaterial({ color: 0x585854, roughness: 0.9, metalness: 0.1 }),

  // Detailed Hunter Outfit & Gear
  hunterCamoVest: new THREE.MeshStandardMaterial({ color: 0x3d4a34, roughness: 0.85, metalness: 0.1 }),
  hunterShirt: new THREE.MeshStandardMaterial({ color: 0x5a634e, roughness: 0.9, metalness: 0.05 }),
  hunterCargoPants: new THREE.MeshStandardMaterial({ color: 0x483f32, roughness: 0.9, metalness: 0.05 }),
  hunterKneePads: new THREE.MeshStandardMaterial({ color: 0x24201a, roughness: 0.6, metalness: 0.2 }),
  leatherGear: new THREE.MeshStandardMaterial({ color: 0x422a18, roughness: 0.55, metalness: 0.2 }),
  brassHardware: new THREE.MeshStandardMaterial({ color: 0xc89b3c, roughness: 0.3, metalness: 0.9 }),
  steelGun: new THREE.MeshStandardMaterial({ color: 0x1f2224, roughness: 0.35, metalness: 0.85 }),
  gunWoodStock: new THREE.MeshStandardMaterial({ color: 0x54321b, roughness: 0.6, metalness: 0.1 }),
  sunglassesLens: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 }),
  gloves: new THREE.MeshStandardMaterial({ color: 0x2d3028, roughness: 0.7, metalness: 0.1 }),

  // Hunting Dog
  dogCoat: new THREE.MeshStandardMaterial({ color: 0xc48c48, roughness: 0.88, metalness: 0.03 }), // Golden/Tan
  dogBelly: new THREE.MeshStandardMaterial({ color: 0xdfb47e, roughness: 0.9, metalness: 0.02 }),
  dogNose: new THREE.MeshStandardMaterial({ color: 0x151210, roughness: 0.3, metalness: 0.1 }),
  dogCollar: new THREE.MeshStandardMaterial({ color: 0xaa2211, roughness: 0.6, metalness: 0.1 }), // Red tactical collar
  dogCollarTag: new THREE.MeshStandardMaterial({ color: 0xe5b838, roughness: 0.2, metalness: 0.95 }),
};

// ==========================================
// 1. HUNTER CHARACTER (Top-Tier Realistic Hunting Outfit & Slung Gun on Back)
// ==========================================
export interface HunterRig {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  head: THREE.Group;
  rifleMount: THREE.Group;
  backRifle: THREE.Group;
}

export function createHunterModel(): HunterRig {
  const root = new THREE.Group();
  root.name = 'Hunter';

  // 1. Pelvis & Tactical Combat Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.24), Materials.hunterCargoPants);
  pelvis.position.y = 0.92;
  pelvis.castShadow = true;
  root.add(pelvis);

  // Heavy duty belt with brass buckle & ammo pouches
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.28), Materials.leatherGear);
  belt.position.y = 1.01;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.03), Materials.brassHardware);
  buckle.position.set(0, 1.01, 0.15);
  // Sidearm holster on right hip
  const holster = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.12), Materials.leatherGear);
  holster.position.set(0.24, 0.92, 0.02);
  // Knife sheath on left hip
  const knifeSheath = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.06), Materials.leatherGear);
  knifeSheath.position.set(-0.23, 0.94, 0.04);
  root.add(belt, buckle, holster, knifeSheath);

  // 2. Torso: Layered Hunting Vest over Tactical Shirt
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.26), Materials.hunterShirt);
  shirt.position.y = 1.25;
  shirt.castShadow = true;

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.3), Materials.hunterCamoVest);
  vest.position.y = 1.25;
  vest.castShadow = true;

  // Vest chest pockets (left & right)
  const pocketL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04), Materials.hunterCamoVest);
  pocketL.position.set(-0.13, 1.32, 0.16);
  const pocketR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.04), Materials.hunterCamoVest);
  pocketR.position.set(0.13, 1.32, 0.16);

  // Ammo Bandolier across chest
  const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.32), Materials.leatherGear);
  bandolier.rotation.z = 0.55;
  bandolier.position.set(0, 1.26, 0.02);

  // Brass bullet shells on bandolier
  for (let b = -2; b <= 2; b++) {
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.07, 6), Materials.brassHardware);
    bullet.rotation.z = Math.PI / 2;
    bullet.position.set(b * 0.06, 1.26 - b * 0.08, 0.17);
    root.add(bullet);
  }

  root.add(shirt, vest, pocketL, pocketR, bandolier);

  // 3. Tactical Expedition Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.19), Materials.backpack);
  pack.position.set(0, 1.25, -0.22);
  pack.castShadow = true;
  // Bedroll rolled on top of backpack
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.42, 10), Materials.hunterVest);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 1.54, -0.22);
  root.add(pack, bedroll);

  // ========================================================
  // 4. GUN SLUNG DIAGONALLY ON HIS BACK (User Request: "guns should be on his back")
  // ========================================================
  const backRifle = new THREE.Group();
  backRifle.name = 'BackMountedRifle';
  backRifle.position.set(0.06, 1.32, -0.34);
  backRifle.rotation.z = -0.65; // Diagonal sling across back
  backRifle.rotation.y = 0.15;

  // Rifle Wooden Stock
  const rifleStock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.14), Materials.gunWoodStock);
  rifleStock.position.y = -0.22;
  rifleStock.castShadow = true;

  // Steel Receiver & Bolt
  const rifleReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.09), Materials.steelGun);
  rifleReceiver.position.y = 0.12;
  rifleReceiver.castShadow = true;

  // Steel Barrel
  const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.65, 8), Materials.steelGun);
  rifleBarrel.position.y = 0.55;
  rifleBarrel.castShadow = true;

  // Optical Scope mounted on rifle
  const rifleScope = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.28, 8), Materials.steelGun);
  rifleScope.position.set(0, 0.18, 0.07);

  // Leather Sling Strap wrapping across shoulder
  const slingStrap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, 0.02), Materials.leatherGear);
  slingStrap.position.set(-0.04, 0.05, -0.04);

  backRifle.add(rifleStock, rifleReceiver, rifleBarrel, rifleScope, slingStrap);
  root.add(backRifle);

  // 5. Head Group: Detailed Face, Boonie Safari Hat & Aviator Sunglasses
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  // Head mesh with neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.15, 8), Materials.skin);
  neck.position.y = 0.02;
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), Materials.skin);
  headMesh.position.y = 0.16;
  headMesh.castShadow = true;
  headGroup.add(neck, headMesh);

  // Boonie Safari Hat with wide brim
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.13, 12), Materials.boonieHat);
  hatCrown.position.y = 0.31;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 14), Materials.boonieHat);
  hatBrim.position.y = 0.25;
  // Leather hat band with brass eyelets
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.162, 0.162, 0.035, 12), Materials.leatherGear);
  hatBand.position.y = 0.27;

  // Aviator sunglasses resting on the hat brim
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.03), Materials.sunglassesLens);
  glasses.position.set(0, 0.26, 0.16);

  headGroup.add(hatCrown, hatBrim, hatBand, glasses);
  root.add(headGroup);

  // 6. Left Leg with Combat Cargo Pants & Reinforced Knee Pad
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.88, 0);
  const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.48, 0.17), Materials.hunterCargoPants);
  leftUpper.position.y = -0.24;
  leftUpper.castShadow = true;
  // Knee pad
  const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), Materials.hunterKneePads);
  leftPad.position.set(0, -0.42, 0.09);
  // Combat hiking boot with tread
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.26), Materials.boots);
  leftBoot.position.set(0, -0.66, 0.04);
  leftBoot.castShadow = true;
  leftLeg.add(leftUpper, leftPad, leftBoot);
  root.add(leftLeg);

  // 7. Right Leg with Combat Cargo Pants & Reinforced Knee Pad
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.88, 0);
  const rightUpper = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.48, 0.17), Materials.hunterCargoPants);
  rightUpper.position.y = -0.24;
  rightUpper.castShadow = true;
  // Knee pad
  const rightPad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), Materials.hunterKneePads);
  rightPad.position.set(0, -0.42, 0.09);
  // Combat hiking boot
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.26), Materials.boots);
  rightBoot.position.set(0, -0.66, 0.04);
  rightBoot.castShadow = true;
  rightLeg.add(rightUpper, rightPad, rightBoot);
  root.add(rightLeg);

  // 8. Left Arm (Tactical Sleeve, Tactical Watch, Glove)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.31, 1.45, 0);
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), Materials.hunterCamoVest);
  leftSleeve.position.y = -0.22;
  leftSleeve.castShadow = true;
  // Tactical compass watch
  const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 8), Materials.steelGun);
  watch.position.set(0, -0.46, 0);
  // Gloved hand
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), Materials.gloves);
  leftHand.position.y = -0.56;
  leftArm.add(leftSleeve, watch, leftHand);
  root.add(leftArm);

  // 9. Right Arm (Tactical Sleeve, Glove & Active In-Hand Rifle Mount)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.31, 1.45, 0);
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), Materials.hunterCamoVest);
  rightSleeve.position.y = -0.22;
  rightSleeve.castShadow = true;
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), Materials.gloves);
  rightHand.position.y = -0.56;
  rightArm.add(rightSleeve, rightHand);

  const rifleMount = new THREE.Group();
  rifleMount.position.set(0, -0.52, 0.15);
  rightArm.add(rifleMount);
  root.add(rightArm);

  return { group: root, leftLeg, rightLeg, leftArm, rightArm, head: headGroup, rifleMount, backRifle };
}

// ==========================================
// 1.5. HUNTING COMPANION DOG (Golden/Pointer Hunting Hound)
// ==========================================
export interface HuntingDogRig {
  group: THREE.Group;
  head: THREE.Group;
  earL: THREE.Mesh;
  earR: THREE.Mesh;
  tail: THREE.Group;
  legFL: THREE.Group;
  legFR: THREE.Group;
  legBL: THREE.Group;
  legBR: THREE.Group;
}

export function createHuntingDogModel(): HuntingDogRig {
  const root = new THREE.Group();
  root.name = 'HuntingDog';

  // 1. Main Muscular Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.85), Materials.dogCoat);
  body.position.set(0, 0.52, 0);
  body.castShadow = true;
  root.add(body);

  // Chest / Underbelly contour
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.45), Materials.dogBelly);
  chest.position.set(0, 0.53, 0.18);
  root.add(chest);

  // 2. Head Group (Neck, Head, Snout, Floppy Ears, Red Collar with Brass Tag)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.65, 0.46);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.28), Materials.dogCoat);
  neck.rotation.x = 0.5;
  neck.position.set(0, 0.12, 0.08);
  neck.castShadow = true;

  // Red Tactical Collar with Brass Medallion
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.3), Materials.dogCollar);
  collar.rotation.x = 0.5;
  collar.position.set(0, 0.08, 0.06);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 8), Materials.dogCollarTag);
  tag.rotation.x = Math.PI / 2;
  tag.position.set(0, 0.02, 0.22);
  headGroup.add(collar, tag);

  // Cranium
  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.3), Materials.dogCoat);
  cranium.position.set(0, 0.28, 0.2);
  cranium.castShadow = true;

  // Muzzle / Snout
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.26), Materials.dogBelly);
  muzzle.position.set(0, 0.22, 0.42);

  // Black Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.08), Materials.dogNose);
  nose.position.set(0, 0.26, 0.55);

  // Dark Alert Eyes
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), Materials.eye);
  eyeL.position.set(-0.1, 0.33, 0.32);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), Materials.eye);
  eyeR.position.set(0.1, 0.33, 0.32);

  // Floppy Hunting Hound Ears
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.12), Materials.dogCoat);
  earL.rotation.z = -0.25;
  earL.position.set(-0.15, 0.26, 0.18);

  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.12), Materials.dogCoat);
  earR.rotation.z = 0.25;
  earR.position.set(0.15, 0.26, 0.18);

  headGroup.add(neck, cranium, muzzle, nose, eyeL, eyeR, earL, earR);
  root.add(headGroup);

  // 3. Tail (Articulated for Wagging)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.65, -0.42);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.48, 6), Materials.dogCoat);
  tail.rotation.x = -0.7;
  tail.position.set(0, 0.16, -0.16);
  tail.castShadow = true;
  tailGroup.add(tail);
  root.add(tailGroup);

  // 4. Four Articulated Legs & Paws
  const createLeg = (x: number, z: number) => {
    const legG = new THREE.Group();
    legG.position.set(x, 0.48, z);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.14), Materials.dogCoat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.1), Materials.dogBelly);
    lower.position.y = -0.34;
    lower.castShadow = true;
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.15), Materials.dogBelly);
    paw.position.set(0, -0.46, 0.03);
    legG.add(upper, lower, paw);
    return legG;
  };

  const legFL = createLeg(-0.15, 0.26);
  const legFR = createLeg(0.15, 0.26);
  const legBL = createLeg(-0.15, -0.28);
  const legBR = createLeg(0.15, -0.28);

  root.add(legFL, legFR, legBL, legBR);

  return { group: root, head: headGroup, earL, earR, tail: tailGroup, legFL, legFR, legBL, legBR };
}

// ==========================================
// 2. OFF-ROAD EXPEDITION TRUCK (4x4)
// ==========================================
export function createOffRoadTruckModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'OffRoadTruck';

  // 1. Heavy Chassis frame
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 4.2), Materials.truckChassis);
  chassis.position.y = 0.65;
  chassis.castShadow = true;
  root.add(chassis);

  // 2. Cabin
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 2.2), Materials.truckBody);
  cab.position.set(0, 1.35, 0.2);
  cab.castShadow = true;
  root.add(cab);

  // 3. Hood / Engine Bay
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.6, 1.3), Materials.truckBody);
  hood.position.set(0, 1.1, 1.9);
  hood.castShadow = true;
  root.add(hood);

  // 4. Truck Bed
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.55, 1.5), Materials.truckBody);
  bed.position.set(0, 1.05, -1.5);
  bed.castShadow = true;
  root.add(bed);

  // 5. Roll Cage Bars over Bed
  const barMat = Materials.truckChassis;
  const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), barMat);
  bar1.position.set(-0.9, 1.45, -0.9);
  const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1), barMat);
  bar2.position.set(0.9, 1.45, -0.9);
  const barTop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), barMat);
  barTop.rotation.z = Math.PI / 2;
  barTop.position.set(0, 1.95, -0.9);
  root.add(bar1, bar2, barTop);

  // 6. Windshield & Windows
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.05), Materials.glass);
  windshield.rotation.x = 0.35;
  windshield.position.set(0, 1.5, 1.25);
  root.add(windshield);

  // 7. Bullbar with front Winch
  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.45, 0.2), barMat);
  bullbar.position.set(0, 0.8, 2.6);
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), Materials.truckRim);
  winch.rotation.z = Math.PI / 2;
  winch.position.set(0, 0.75, 2.7);
  root.add(bullbar, winch);

  // 8. Headlights (Functional Visual Meshes)
  const hlLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), Materials.headlight);
  hlLeft.rotation.x = Math.PI / 2;
  hlLeft.position.set(-0.75, 1.0, 2.56);
  const hlRight = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12), Materials.headlight);
  hlRight.rotation.x = Math.PI / 2;
  hlRight.position.set(0.75, 1.0, 2.56);
  root.add(hlLeft, hlRight);

  // 9. Four Large Off-Road Wheels
  const wheelPositions = [
    [-1.05, 0.52, 1.35],
    [1.05, 0.52, 1.35],
    [-1.05, 0.52, -1.35],
    [1.05, 0.52, -1.35],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.38, 16), Materials.truckTire);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), Materials.truckRim);
    rim.rotation.z = Math.PI / 2;

    wheelGroup.add(tire, rim);
    root.add(wheelGroup);
  });

  // 10. Spare Tire on Tailgate
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 14), Materials.truckTire);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(0, 1.15, -2.35);
  root.add(spare);

  return root;
}

// ==========================================
// 3. WILDERNESS ENDURO MOTORBIKE
// ==========================================
export function createMotorbikeModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Motorbike';

  // Frame & Engine block
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.55, 1.4), Materials.truckChassis);
  frame.position.set(0, 0.65, 0);
  frame.castShadow = true;
  root.add(frame);

  // Gas tank (accent red)
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.65), Materials.bikeFrame);
  tank.position.set(0, 0.95, 0.2);
  root.add(tank);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.75), Materials.bikeSeat);
  seat.position.set(0, 0.96, -0.4);
  root.add(seat);

  // Front fork & Handlebars
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9), Materials.truckRim);
  fork.rotation.x = -0.3;
  fork.position.set(0, 0.8, 0.85);
  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75), Materials.truckChassis);
  bars.rotation.z = Math.PI / 2;
  bars.position.set(0, 1.18, 0.75);
  root.add(fork, bars);

  // Front & Rear Wheels
  const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 16), Materials.truckTire);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.42, 1.1);
  frontWheel.castShadow = true;

  const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16), Materials.truckTire);
  rearWheel.rotation.z = Math.PI / 2;
  rearWheel.position.set(0, 0.42, -0.9);
  rearWheel.castShadow = true;

  root.add(frontWheel, rearWheel);
  return root;
}

// ==========================================
// 4. DEER (Red Deer / Spotted Fawn)
// ==========================================
export interface DeerRig {
  group: THREE.Group;
  head: THREE.Group;
  legFL: THREE.Group;
  legFR: THREE.Group;
  legBL: THREE.Group;
  legBR: THREE.Group;
}

export function createDeerModel(): DeerRig {
  const root = new THREE.Group();
  root.name = 'Deer';

  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 1.3), Materials.deerCoat);
  body.position.set(0, 1.1, 0);
  body.castShadow = true;
  root.add(body);

  // Neck & Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.45, 0.65);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.65, 0.35), Materials.deerCoat);
  neck.rotation.x = 0.45;
  neck.position.set(0, 0.25, 0.15);
  neck.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.5), Materials.deerCoat);
  head.position.set(0, 0.6, 0.35);
  head.castShadow = true;

  // Snout
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), Materials.deerBelly);
  snout.position.set(0, 0.52, 0.65);

  // Antlers (Stag)
  const antlerL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.65), Materials.antler);
  antlerL.rotation.z = -0.35;
  antlerL.rotation.x = -0.3;
  antlerL.position.set(-0.16, 0.95, 0.25);

  const antlerR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.65), Materials.antler);
  antlerR.rotation.z = 0.35;
  antlerR.rotation.x = -0.3;
  antlerR.position.set(0.16, 0.95, 0.25);

  headGroup.add(neck, head, snout, antlerL, antlerR);
  root.add(headGroup);

  // Legs with articulated pivots
  const createLeg = (x: number, z: number) => {
    const legG = new THREE.Group();
    legG.position.set(x, 1.0, z);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.16), Materials.deerCoat);
    upper.position.y = -0.27;
    upper.castShadow = true;
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), Materials.boots);
    lower.position.y = -0.75;
    lower.castShadow = true;
    legG.add(upper, lower);
    return legG;
  };

  const legFL = createLeg(-0.2, 0.45);
  const legFR = createLeg(0.2, 0.45);
  const legBL = createLeg(-0.2, -0.45);
  const legBR = createLeg(0.2, -0.45);

  root.add(legFL, legFR, legBL, legBR);
  return { group: root, head: headGroup, legFL, legFR, legBL, legBR };
}

// ==========================================
// 5. BENGAL TIGER (Predator)
// ==========================================
export interface TigerRig {
  group: THREE.Group;
  head: THREE.Group;
  legFL: THREE.Group;
  legFR: THREE.Group;
  legBL: THREE.Group;
  legBR: THREE.Group;
  tail: THREE.Group;
}

export function createTigerModel(): TigerRig {
  const root = new THREE.Group();
  root.name = 'Tiger';

  // Powerful muscular body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 1.6), Materials.tigerFur);
  body.position.set(0, 0.85, 0);
  body.castShadow = true;
  root.add(body);

  // Tiger Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.95, 0.85);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.55), Materials.tigerFur);
  head.castShadow = true;

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.35), Materials.tigerUnderbelly);
  snout.position.set(0, -0.08, 0.36);

  // Ears
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), Materials.tigerStripe);
  earL.position.set(-0.2, 0.28, -0.05);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 6), Materials.tigerStripe);
  earR.position.set(0.2, 0.28, -0.05);

  headGroup.add(head, snout, earL, earR);
  root.add(headGroup);

  // Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.95, -0.8);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9, 8), Materials.tigerFur);
  tail.rotation.x = -0.8;
  tail.position.set(0, 0.15, -0.4);
  tailGroup.add(tail);
  root.add(tailGroup);

  // 4 Muscular Legs
  const createLeg = (x: number, z: number) => {
    const legG = new THREE.Group();
    legG.position.set(x, 0.75, z);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.24), Materials.tigerFur);
    upper.position.y = -0.22;
    upper.castShadow = true;
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.2), Materials.tigerFur);
    lower.position.y = -0.58;
    lower.castShadow = true;
    legG.add(upper, lower);
    return legG;
  };

  const legFL = createLeg(-0.26, 0.55);
  const legFR = createLeg(0.26, 0.55);
  const legBL = createLeg(-0.26, -0.55);
  const legBR = createLeg(0.26, -0.55);

  root.add(legFL, legFR, legBL, legBR);
  return { group: root, head: headGroup, legFL, legFR, legBL, legBR, tail: tailGroup };
}

// ==========================================
// 6. WILD BOAR
// ==========================================
export function createBoarModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'WildBoar';

  // Chunky body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 1.2), Materials.boarHide);
  body.position.set(0, 0.65, 0);
  body.castShadow = true;
  root.add(body);

  // Sloping wedge head
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 6), Materials.boarHide);
  head.rotation.x = Math.PI / 2;
  head.position.set(0, 0.6, 0.8);
  head.castShadow = true;

  // Snout disc
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), Materials.skin);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.6, 1.15);

  // White Tusks
  const tuskL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), Materials.boarTusk);
  tuskL.position.set(-0.16, 0.64, 1.05);
  tuskL.rotation.z = -0.6;
  const tuskR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), Materials.boarTusk);
  tuskR.position.set(0.16, 0.64, 1.05);
  tuskR.rotation.z = 0.6;

  root.add(head, snout, tuskL, tuskR);

  // 4 Short sturdy legs
  [
    [-0.22, 0.22],
    [0.22, 0.22],
    [-0.22, -0.4],
    [0.22, -0.4],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), Materials.boarHide);
    leg.position.set(lx, 0.19, lz);
    leg.castShadow = true;
    root.add(leg);
  });

  return root;
}

// ==========================================
// 7. CROCODILE
// ==========================================
export function createCrocodileModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Crocodile';

  // Low elongated body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 2.2), Materials.crocScales);
  body.position.set(0, 0.2, 0);
  body.castShadow = true;
  root.add(body);

  // Long flat snout
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 1.1), Materials.crocScales);
  head.position.set(0, 0.2, 1.55);
  head.castShadow = true;

  // Eyes protruding on top
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), Materials.eye);
  eyeL.position.set(-0.18, 0.34, 1.3);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), Materials.eye);
  eyeR.position.set(0.18, 0.34, 1.3);

  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), Materials.crocScales);
  tail.rotation.x = -Math.PI / 2;
  tail.position.set(0, 0.18, -1.9);
  tail.castShadow = true;

  root.add(head, eyeL, eyeR, tail);

  // 4 Splayed legs
  [
    [-0.52, 0.12, 0.65],
    [0.52, 0.12, 0.65],
    [-0.52, 0.12, -0.65],
    [0.52, 0.12, -0.65],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.22), Materials.crocScales);
    leg.position.set(lx, ly, lz);
    root.add(leg);
  });

  return root;
}

// ==========================================
// 8. TROPICAL BIRD
// ==========================================
export function createBirdModel(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'JungleBird';

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 6), Materials.birdFeather);
  body.rotation.x = -Math.PI / 2;
  body.position.set(0, 0, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), Materials.birdFeather);
  head.position.set(0, 0.08, 0.32);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), Materials.birdBeak);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.05, 0.46);

  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.3), Materials.birdFeather);
  wingL.position.set(-0.35, 0.05, 0);

  const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 0.3), Materials.birdFeather);
  wingR.position.set(0.35, 0.05, 0);

  root.add(body, head, beak, wingL, wingR);
  return root;
}

// ==========================================
// 9. VEGETATION & ENVIRONMENT STRUCTURES
// ==========================================

export function createMahoganyTree(): THREE.Group {
  const group = new THREE.Group();

  // Fluted trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.3, 14, 8), Materials.woodLog);
  trunk.position.y = 7;
  trunk.castShadow = true;
  group.add(trunk);

  // 3 Large foliage clusters at different heights
  const foliageLevels = [
    { y: 12, r: 4.8, mat: Materials.leafDark },
    { y: 15, r: 5.6, mat: Materials.leafBright },
    { y: 17.5, r: 3.8, mat: Materials.leafDark },
  ];

  foliageLevels.forEach(({ y, r, mat }) => {
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    canopy.position.y = y;
    canopy.castShadow = true;
    group.add(canopy);
  });

  return group;
}

export function createPalmTree(): THREE.Group {
  const group = new THREE.Group();

  // Curved slender trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 9, 8), Materials.woodLog);
  trunk.rotation.z = 0.08;
  trunk.position.set(0.3, 4.5, 0);
  trunk.castShadow = true;
  group.add(trunk);

  // 8 Radiating drooping fronds
  const numFronds = 8;
  for (let i = 0; i < numFronds; i++) {
    const angle = (i / numFronds) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 3.8), Materials.palmFrond);
    frond.position.set(
      0.3 + Math.sin(angle) * 1.6,
      8.8,
      Math.cos(angle) * 1.6
    );
    frond.rotation.y = angle;
    frond.rotation.x = 0.45;
    frond.castShadow = true;
    group.add(frond);
  }

  return group;
}

export function createHunterCabin(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'HunterCabin';

  // Log cabin walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 9), Materials.woodPlank);
  walls.position.y = 2.25;
  walls.castShadow = true;
  group.add(walls);

  // Peaked corrugated metal roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 3.2, 4), Materials.roofCorrugated);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 5.8;
  roof.castShadow = true;
  group.add(roof);

  // Porch & Pillars
  const porch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 3), Materials.woodPlank);
  porch.position.set(0, 0.15, 5.5);
  group.add(porch);

  // Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.5, 0.9), Materials.rock);
  chimney.position.set(-2.8, 5.5, -2);
  group.add(chimney);

  return group;
}

export function createWatchtower(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Watchtower';

  // 4 Main Timber Legs
  const legMat = Materials.woodLog;
  const legHeight = 16;
  const positions = [
    [-2.5, -2.5],
    [2.5, -2.5],
    [-2.5, 2.5],
    [2.5, 2.5],
  ];

  positions.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, legHeight, 6), legMat);
    leg.position.set(lx, legHeight / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Observation Platform with railing
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 6.5), Materials.woodPlank);
  deck.position.y = legHeight;
  deck.castShadow = true;
  group.add(deck);

  // Peaked Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4), Materials.roofCorrugated);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = legHeight + 3.8;
  roof.castShadow = true;
  group.add(roof);

  return group;
}

export function createCampfire(): THREE.Group {
  const group = new THREE.Group();

  // Stone ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24), Materials.rock);
    stone.position.set(Math.cos(a) * 0.9, 0.12, Math.sin(a) * 0.9);
    group.add(stone);
  }

  // Cross logs
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 6), Materials.woodLog);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i / 3) * Math.PI;
    log.position.y = 0.15;
    group.add(log);
  }

  // Embers glow
  const embers = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff3300,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    })
  );
  embers.position.y = 0.18;
  group.add(embers);

  return group;
}
