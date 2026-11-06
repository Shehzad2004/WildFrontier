import { WildlifeProfile, AnimalType } from '../types/game';

export class WildlifeRegistry {
  public profiles: Record<AnimalType, WildlifeProfile> = {
    deer: {
      type: 'deer',
      commonName: 'Axis Spotted Deer',
      scientificName: 'Axis axis',
      dangerRating: 1,
      habitat: 'Lush river meadows, open clearings, and forest edges',
      behavior: 'Herbivorous grazer. Highly attuned hearing and smell; flees immediately upon perceiving threat.',
      tracksDescription: 'Two cloven heart-shaped hoof prints, 6-8cm length, spaced 40-70cm apart.',
      discovered: true,
      harvestsCount: 0,
      photosCount: 0,
    },
    boar: {
      type: 'boar',
      commonName: 'Wild Boar',
      scientificName: 'Sus scrofa',
      dangerRating: 3,
      habitat: 'Muddy wallows, bamboo groves, and dense undergrowth',
      behavior: 'Aggressive omnivore. Roots for tubers and fungi. Charges with sharp tusks if cornered.',
      tracksDescription: 'Broad cloven hooves with distinct dewclaw impressions on mud banks.',
      discovered: false,
      harvestsCount: 0,
      photosCount: 0,
    },
    tiger: {
      type: 'tiger',
      commonName: 'Bengal Tiger',
      scientificName: 'Panthera tigris',
      dangerRating: 5,
      habitat: 'Overgrown ancient ruins, rocky highlands, and northern bamboo jungle',
      behavior: 'Apex solitary predator. Uses tall vegetation for ambush. Emits a low resonant warning roar.',
      tracksDescription: 'Large four-toed pad print, 12-16cm diameter, retractable claws leave no claw marks.',
      discovered: false,
      harvestsCount: 0,
      photosCount: 0,
    },
    crocodile: {
      type: 'crocodile',
      commonName: 'Marsh Crocodile (Mugger)',
      scientificName: 'Crocodylus palustris',
      dangerRating: 4,
      habitat: 'Murky riverbanks, mangrove shallows, and deep river bends',
      behavior: 'Semi-aquatic ambush predator. Submerges motionless, bursts forward with bone-crushing bite.',
      tracksDescription: 'Broad belly slide drag flanked by 5-claw webbed footprints in silt.',
      discovered: false,
      harvestsCount: 0,
      photosCount: 0,
    },
    bird: {
      type: 'bird',
      commonName: 'Jungle Crested Falcon',
      scientificName: 'Spizaetus cirrhatus',
      dangerRating: 1,
      habitat: 'High rainforest canopy, cliff edges, and lookout branches',
      behavior: 'Daytime raptor. Perches on high vantage branches, emits piercing territorial calls.',
      tracksDescription: 'Three forward slender talons with sharp puncture marks on soft bark.',
      discovered: false,
      harvestsCount: 0,
      photosCount: 0,
    },
  };

  public recordSighting(type: AnimalType) {
    if (this.profiles[type]) {
      this.profiles[type].discovered = true;
    }
  }

  public recordHarvest(type: AnimalType) {
    if (this.profiles[type]) {
      this.profiles[type].discovered = true;
      this.profiles[type].harvestsCount++;
    }
  }

  public recordPhoto(type: AnimalType) {
    if (this.profiles[type]) {
      this.profiles[type].discovered = true;
      this.profiles[type].photosCount++;
    }
  }
}
