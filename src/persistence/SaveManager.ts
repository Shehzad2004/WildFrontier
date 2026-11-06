import { SaveGameData, GraphicSettings, AudioSettings } from '../types/game';

const SAVE_KEY = 'wild_frontier_save_v1';

export class SaveManager {
  public static defaultGraphics: GraphicSettings = {
    quality: 'medium',
    shadows: true,
    foliageDensity: 0.8,
    renderDistance: 350,
    bloom: false,
    sensitivity: 1.0,
  };

  public static defaultAudio: AudioSettings = {
    masterVolume: 0.8,
    ambientVolume: 0.6,
    effectsVolume: 0.8,
    wildlifeVolume: 0.7,
    muted: false,
  };

  public static load(): SaveGameData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) {
        return parsed as SaveGameData;
      }
    } catch (err) {
      console.warn('Failed to parse save game from storage:', err);
    }
    return null;
  }

  public static save(data: Partial<SaveGameData>) {
    try {
      const current = this.load() || {
        version: 1,
        level: 1,
        xp: 0,
        currentMissionId: 1,
        missions: [],
        unlockedWeapons: ['rifle', 'bow', 'dart_gun'],
        playerVitals: { health: 100, hydration: 95 },
        discoveredSpecies: ['deer'],
        discoveredLocations: ['camp'],
        graphics: this.defaultGraphics,
        audio: this.defaultAudio,
      };

      const updated = { ...current, ...data };
      localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  public static clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (err) {
      console.warn('Failed to clear save data:', err);
    }
  }
}
