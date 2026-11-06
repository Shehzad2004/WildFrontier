export type GameMode = 'walking' | 'driving' | 'aiming' | 'binoculars' | 'camera';

export type CameraView = 'first_person' | 'third_person';

export type WeatherType = 'clear' | 'mist' | 'rain' | 'overcast';

export type TimeOfDay = 'dawn' | 'noon' | 'sunset' | 'night';

export type AnimalType = 'deer' | 'boar' | 'tiger' | 'crocodile' | 'bird';

export type AnimalState =
  | 'idle'
  | 'graze'
  | 'wander'
  | 'alert'
  | 'flee'
  | 'stalk'
  | 'charge'
  | 'attack'
  | 'drink'
  | 'dead';

export interface AnimalData {
  id: string;
  type: AnimalType;
  name: string;
  position: [number, number, number];
  rotation: number;
  state: AnimalState;
  health: number;
  maxHealth: number;
  speed: number;
  alertness: number; // 0 to 1
  isHostile: boolean;
  scale: number;
  animationTime: number;
  homePosition: [number, number, number];
  targetPosition?: [number, number, number];
  fleeTimer?: number;
  attackCooldown?: number;
  discoveryRecorded?: boolean;
}

export type WeaponId = 'rifle' | 'bow' | 'dart_gun' | 'revolver';

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: 'Rifle' | 'Archery' | 'Non-Lethal' | 'Sidearm';
  damage: number;
  zoomLevel: number; // 1 = none, 4-12 = scope
  maxAmmo: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number;
  fireRate: number; // seconds between shots
  swayFactor: number;
  soundLoudness: number; // meters for wildlife spook radius
  bulletDrop: number;
  unlocked: boolean;
  description: string;
}

export type EquipmentId =
  | 'binoculars'
  | 'camera'
  | 'compass'
  | 'gps'
  | 'flashlight'
  | 'canteen'
  | 'medkit'
  | 'repair_kit';

export interface EquipmentItem {
  id: EquipmentId;
  name: string;
  count: number;
  maxCount: number;
  description: string;
  icon: string;
}

export interface PlayerVitals {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  hydration: number;
  maxHydration: number;
  isSprinting: boolean;
  isCrouching: boolean;
  isAiming: boolean;
  holdingBreath: boolean;
  flashlightOn: boolean;
}

export interface TrackClue {
  id: string;
  type: AnimalType;
  position: [number, number, number];
  directionAngle: number;
  kind: 'footprint' | 'droppings' | 'vegetation' | 'drinking_spot';
  freshness: number; // 0 (old) to 1 (fresh)
  inspected: boolean;
}

export type VehicleType = 'truck' | 'bike';

export interface VehicleState {
  type: VehicleType;
  position: [number, number, number];
  rotation: number;
  speed: number;
  fuel: number;
  health: number;
  headlightsOn: boolean;
  inUse: boolean;
}

export interface MissionObjective {
  id: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface Mission {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;
  objectives: MissionObjective[];
  rewardXP: number;
  rewardUnlock?: string;
  completed: boolean;
  unlocked: boolean;
}

export interface WildlifeProfile {
  type: AnimalType;
  commonName: string;
  scientificName: string;
  dangerRating: number; // 1 to 5
  habitat: string;
  behavior: string;
  tracksDescription: string;
  discovered: boolean;
  harvestsCount: number;
  photosCount: number;
}

export interface GraphicSettings {
  quality: 'low' | 'medium' | 'high';
  shadows: boolean;
  foliageDensity: number; // 0.4, 0.7, 1.0
  renderDistance: number; // 200, 350, 500
  bloom: boolean;
  sensitivity: number;
}

export interface AudioSettings {
  masterVolume: number;
  ambientVolume: number;
  effectsVolume: number;
  wildlifeVolume: number;
  muted: boolean;
}

export interface SaveGameData {
  version: number;
  level: number;
  xp: number;
  currentMissionId: number;
  missions: Mission[];
  unlockedWeapons: WeaponId[];
  playerVitals: {
    health: number;
    hydration: number;
  };
  discoveredSpecies: AnimalType[];
  discoveredLocations: string[];
  graphics: GraphicSettings;
  audio: AudioSettings;
}
