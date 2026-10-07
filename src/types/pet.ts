export type EmotionType =
  | 'feliz'
  | 'molesto'
  | 'risa'
  | 'curioso'
  | 'sorpresa'
  | 'durmiendo'
  | 'comiendo'
  | 'saluda'
  | 'pensando';

export interface EmotionCoordinate {
  row: number; // 0, 1, 2
  col: number; // 0, 1, 2
  index: number; // 0 to 8 (mathematical index)
  label: string;
  emoji: string;
}

export type PetSpeciesKey =
  | 'fox'
  | 'turtle'
  | 'raccoon'
  | 'red_panda'
  | 'squirrel'
  | 'monkey'
  | 'penguin'
  | 'panda'
  | 'fish'
  | 'dragon'
  | 'cat'
  | 'koala';

export interface PetPersonalityConfig {
  key: string;
  title: string;
  badge: string;
  description: string;
  traits: string[];
  actionPrefixes: {
    joke: string;
    fact: string;
    learn: string;
    game: string;
  };
  sampleResponses: {
    greeting: string;
    tired: string;
    eating: string;
    unknown: string;
    chuckle: string;
  };
}

export interface PetSpeciesDefinition {
  type: PetSpeciesKey;
  displayName: string;
  speciesEmoji: string;
  defaultName: string;
  personality: string; // Key of personality
  description: string;
  backgroundTheme: string; // Habitat theme id
  themeColor: {
    primary: string;
    accent: string;
    badgeBg: string;
    bubbleBg: string;
    bgGradient: string;
  };
  favoriteFood: string;
  foodEmoji: string;
  spriteSheet: string; // Required: every selectable species has a real supplied sheet
}

export interface PetModel {
  petId: string;
  ownerId: string;
  type: PetSpeciesKey;
  name: string;
  personality: string;
  level: number;
  experience: number;
  hunger: number; // 0 - 100
  happiness: number; // 0 - 100
  energy: number; // 0 - 100
  boredom?: number; // 0 - 100
  health: number; // 0 - 100
  age: number; // in days
  coins: number;
  evolution: 'bebe' | 'joven' | 'companero';
  status: 'active' | 'adopted' | 'resting';
  createdAt: string;
  lastPlayed: string;
  lastFed: string;
  lastSlept: string;
  eventDay: number;
}

export interface PlayerModel {
  id: string; // normalized username/nickname
  nickname: string;
  secretHash: string;
  createdAt: string;
  lastLogin: string;
}

export interface AiChatResponse {
  message: string;
  emotion: EmotionType;
  source: 'local_math' | 'local_care' | 'local_joke' | 'local_fact' | 'local_rule' | 'gemini';
  retryable?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'pet';
  text: string;
  emotion?: EmotionType;
  timestamp: number;
  /** Original user question that produced this pet reply, used only during the current session. */
  question?: string;
  retryable?: boolean;
}
