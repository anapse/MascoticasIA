import { PetSpeciesDefinition, PetSpeciesKey } from '../types/pet';

/**
 * Pet species configuration catalog.
 * Highly extensible architecture for virtual pets.
 */
export const PET_CATALOG: Record<string, PetSpeciesDefinition> = {
  fox: {
    type: 'fox',
    displayName: 'Zorro',
    speciesEmoji: '🦊',
    defaultName: 'Rocky',
    personality: 'molesto',
    description: 'Astuto, sarcástico y bromista, con pelaje anaranjado y cola esponjosa.',
    favoriteFood: 'Muslito de pollo crujiente',
    foodEmoji: '🍗',
    backgroundTheme: 'fox_forest',
    themeColor: {
      primary: '#ea580c',
      accent: '#fdba74',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      bubbleBg: 'bg-orange-50/90 border-orange-200',
      bgGradient: 'from-amber-100 via-orange-50 to-amber-200/80',
    },
    spriteSheet: '/sprites/fox.png',
  },
  turtle: {
    type: 'turtle',
    displayName: 'Tortuga',
    speciesEmoji: '🐢',
    defaultName: 'Donatello',
    personality: 'lenta',
    description: 'Pacífica, pensativa y paciente, con un caparazón protector y ojos brillantes.',
    favoriteFood: 'Hojas verdes frescas',
    foodEmoji: '🥬',
    backgroundTheme: 'turtle_zen',
    themeColor: {
      primary: '#16a34a',
      accent: '#86efac',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      bubbleBg: 'bg-emerald-50/90 border-emerald-200',
      bgGradient: 'from-emerald-100 via-teal-50 to-emerald-200/80',
    },
    spriteSheet: '/sprites/turtle.png',
  },
  raccoon: {
    type: 'raccoon',
    displayName: 'Mapachito',
    speciesEmoji: '🦝',
    defaultName: 'Bandit',
    personality: 'picaro',
    description: 'Pícaro investigador con antifaz natural y manos curiosas.',
    favoriteFood: 'Manzana jugosa',
    foodEmoji: '🍎',
    backgroundTheme: 'raccoon_night',
    themeColor: {
      primary: '#52525b',
      accent: '#a1a1aa',
      badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-200',
      bubbleBg: 'bg-neutral-50/90 border-neutral-200',
      bgGradient: 'from-indigo-100 via-slate-50 to-violet-200/80',
    },
    spriteSheet: '/sprites/raccoon.png',
  },
  red_panda: {
    type: 'red_panda',
    displayName: 'Panda Rojo',
    speciesEmoji: '🐾',
    defaultName: 'Rory',
    personality: 'tierno',
    description: 'Adorable bola de pelo rojizo con cola rayada y orejitas esponjosas.',
    favoriteFood: 'Bambú con bayas silvestres',
    foodEmoji: '🍓',
    backgroundTheme: 'redpanda_cherry',
    themeColor: {
      primary: '#c2410c',
      accent: '#fdba74',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      bubbleBg: 'bg-orange-50/90 border-orange-200',
      bgGradient: 'from-rose-100 via-orange-50 to-amber-200/80',
    },
    spriteSheet: '/sprites/red_panda.png',
  },
};

export const INITIAL_AVAILABLE_SPECIES: PetSpeciesKey[] = [
  'fox',
  'turtle',
  'raccoon',
  'red_panda',
];

const SPECIES_ALIASES: Record<string, PetSpeciesKey> = {
  fox: 'fox',
  zorro: 'fox',
  rocky: 'fox',
  turtle: 'turtle',
  tortuga: 'turtle',
  donatello: 'turtle',
  raccoon: 'raccoon',
  mapache: 'raccoon',
  mapachito: 'raccoon',
  bandit: 'raccoon',
  red_panda: 'red_panda',
  panda_rojo: 'red_panda',
  pandarojo: 'red_panda',
  rory: 'red_panda',
};

export function getPetSpecies(type: string | undefined | null): PetSpeciesDefinition {
  if (!type) return PET_CATALOG.fox;
  const normalizedKey = type.toLowerCase().trim();
  const canonicalKey = SPECIES_ALIASES[normalizedKey] || (normalizedKey as PetSpeciesKey);
  return PET_CATALOG[canonicalKey] || PET_CATALOG.fox;
}
