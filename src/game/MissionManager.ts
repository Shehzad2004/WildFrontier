import { Mission, AnimalType } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

export class MissionManager {
  public missions: Mission[] = [
    {
      id: 1,
      title: 'Level 1: First Expedition',
      subtitle: 'Wilderness Orientation & Fundamentals',
      briefing:
        'Welcome to the Wild Frontier Reserve, Hunter. Equip your binoculars or rifle, survey the perimeter around base camp, and spot the grazing deer herd.',
      objectives: [
        { id: 'm1_scout', description: 'Explore near Base Camp & Cabin', current: 0, target: 1, completed: false },
        { id: 'm1_observe', description: 'Observe Deer with Binoculars or Scope', current: 0, target: 1, completed: false },
        { id: 'm1_harvest', description: 'Photograph or Harvest a Deer', current: 0, target: 1, completed: false },
      ],
      rewardXP: 250,
      rewardUnlock: 'Compound Hunting Bow & Extra Ammo',
      completed: false,
      unlocked: true,
    },
    {
      id: 2,
      title: 'Level 2: Trail Tracker',
      subtitle: 'Reading Environmental Signs',
      briefing:
        'Animals leave distinct signs in the forest floor. Inspect animal tracks and droppings to track down the elusive wild boar herd in the mud clearing.',
      objectives: [
        { id: 'm2_clues', description: 'Inspect 2 animal tracks or clues', current: 0, target: 2, completed: false },
        { id: 'm2_boar', description: 'Encounter or tag a Wild Boar', current: 0, target: 1, completed: false },
      ],
      rewardXP: 500,
      rewardUnlock: 'Vanguard Tranquilizer Dart Rifle',
      completed: false,
      unlocked: false,
    },
    {
      id: 3,
      title: 'Level 3: Into the Wild',
      subtitle: 'River Valley & Aquatic Fauna',
      briefing:
        'Take the 4x4 Expedition Rig to the Southern Riverbed. Navigate the shallow ford, watch for territorial marsh crocodiles, and hydrate at the stream.',
      objectives: [
        { id: 'm3_drive', description: 'Drive the 4x4 Truck across River Ford', current: 0, target: 1, completed: false },
        { id: 'm3_hydrate', description: 'Drink from Canteen to reach 90%+ hydration', current: 0, target: 1, completed: false },
        { id: 'm3_croc', description: 'Observe or encounter a Marsh Crocodile', current: 0, target: 1, completed: false },
      ],
      rewardXP: 800,
      rewardUnlock: 'High-Capacity Canteen & Medkit Supply',
      completed: false,
      unlocked: false,
    },
    {
      id: 4,
      title: 'Level 4: Predator Country',
      subtitle: 'Ancient Ruins & Apex Hunter',
      briefing:
        'The overgrown stone ruins to the northeast harbor a territorial Bengal Tiger. Proceed cautiously with sidearm ready. Listen for warning growls.',
      objectives: [
        { id: 'm4_ruins', description: 'Reach the Overgrown Stone Ruins', current: 0, target: 1, completed: false },
        { id: 'm4_tiger', description: 'Survive a Tiger encounter or subdue it', current: 0, target: 1, completed: false },
      ],
      rewardXP: 1200,
      rewardUnlock: 'Frontier .44 Magnum Heavy Revolver',
      completed: false,
      unlocked: false,
    },
    {
      id: 5,
      title: 'Level 5: Master of the Frontier',
      subtitle: 'The Grand Wilderness Expedition',
      briefing:
        'Complete the ultimate trial: Ascend the High Lookout Tower, document 3 distinct wildlife species in your Field Guide, and return safely to camp.',
      objectives: [
        { id: 'm5_tower', description: 'Ascend the High Lookout Tower', current: 0, target: 1, completed: false },
        { id: 'm5_species', description: 'Document or photograph 3 distinct species', current: 0, target: 3, completed: false },
        { id: 'm5_return', description: 'Return safely to Base Camp campfire', current: 0, target: 1, completed: false },
      ],
      rewardXP: 2000,
      rewardUnlock: 'Master Frontier Ranger Trophy & Gold Rifle Camo',
      completed: false,
      unlocked: false,
    },
  ];

  public currentMissionIndex = 0;
  public totalXP = 0;
  public level = 1;
  public onMissionStatusChange?: (msg: string) => void;

  constructor() {}

  public get currentMission(): Mission {
    return this.missions[this.currentMissionIndex];
  }

  public recordProgress(objectiveId: string, amount = 1): boolean {
    const mission = this.currentMission;
    if (mission.completed) return false;

    let updated = false;
    for (const obj of mission.objectives) {
      if (obj.id === objectiveId && !obj.completed) {
        obj.current = Math.min(obj.target, obj.current + amount);
        if (obj.current >= obj.target) {
          obj.completed = true;
          this.onMissionStatusChange?.(`Objective Complete: ${obj.description}`);
        }
        updated = true;
      }
    }

    if (updated) {
      this.checkMissionCompletion();
    }
    return updated;
  }

  private checkMissionCompletion() {
    const mission = this.currentMission;
    const allDone = mission.objectives.every(o => o.completed);
    if (allDone && !mission.completed) {
      mission.completed = true;
      this.totalXP += mission.rewardXP;
      this.level = Math.min(5, Math.floor(this.totalXP / 750) + 1);

      soundEngine.playMissionComplete();
      this.onMissionStatusChange?.(`MISSION COMPLETE! +${mission.rewardXP} XP Earned. Unlocked: ${mission.rewardUnlock || 'New Rank'}`);

      // Unlock next mission
      if (this.currentMissionIndex + 1 < this.missions.length) {
        this.missions[this.currentMissionIndex + 1].unlocked = true;
        this.currentMissionIndex++;
      }
    }
  }

  public selectMission(missionId: number) {
    const idx = this.missions.findIndex(m => m.id === missionId);
    if (idx !== -1 && this.missions[idx].unlocked) {
      this.currentMissionIndex = idx;
      soundEngine.playInteract();
    }
  }
}
