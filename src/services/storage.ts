import { PetModel, PetSpeciesKey, PlayerModel } from '../types/pet';
import { hashSecret, normalizePlayerId } from './crypto';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const STORAGE_PLAYERS_KEY = 'mascoticas_players_v1';
const STORAGE_PETS_KEY = 'mascoticas_pets_v1';
const CURRENT_SESSION_KEY = 'mascoticas_current_session_v1';

export const MAX_PETS_PER_PLAYER = 3;
export const DAILY_AI_MESSAGE_LIMIT = 20;

// Local store helpers
function getLocalPlayers(): Record<string, PlayerModel> {
  try {
    const raw = localStorage.getItem(STORAGE_PLAYERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPlayers(players: Record<string, PlayerModel>) {
  try {
    localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(players));
  } catch (err) {
    console.error('Failed to save players locally', err);
  }
}

function getLocalPets(): Record<string, PetModel> {
  try {
    const raw = localStorage.getItem(STORAGE_PETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPets(pets: Record<string, PetModel>) {
  try {
    localStorage.setItem(STORAGE_PETS_KEY, JSON.stringify(pets));
  } catch (err) {
    console.error('Failed to save pets locally', err);
  }
}

export async function findPlayerByName(nickname: string): Promise<PlayerModel | null> {
  const playerId = normalizePlayerId(nickname);

  // Check Firestore first if available
  if (db) {
    try {
      const playerDoc = await getDoc(doc(db, 'players', playerId));
      if (playerDoc.exists()) {
        return playerDoc.data() as PlayerModel;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `players/${playerId}`);
    }
  }

  // Fallback to local
  const localPlayers = getLocalPlayers();
  return localPlayers[playerId] || null;
}

export async function createPlayer(
  nickname: string,
  secretWord: string
): Promise<{ success: boolean; player?: PlayerModel; error?: 'ALREADY_EXISTS' | string }> {
  const cleanNick = nickname.trim();
  const playerId = normalizePlayerId(cleanNick);

  if (!cleanNick || cleanNick.length < 2) {
    return { success: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  const existing = await findPlayerByName(cleanNick);
  if (existing) {
    return { success: false, error: 'ALREADY_EXISTS' };
  }

  const secretHash = await hashSecret(secretWord);
  const now = new Date().toISOString();

  const player: PlayerModel = {
    id: playerId,
    nickname: cleanNick,
    secretHash,
    createdAt: now,
    lastLogin: now,
  };

  // Save to Firestore if available
  if (db) {
    try {
      await setDoc(doc(db, 'players', playerId), player);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `players/${playerId}`);
    }
  }

  // Save to local storage
  const localPlayers = getLocalPlayers();
  localPlayers[playerId] = player;
  saveLocalPlayers(localPlayers);

  saveCurrentSession(player);
  return { success: true, player };
}

export async function loginPlayer(
  nickname: string,
  secretWord: string
): Promise<{ success: boolean; player?: PlayerModel; error?: 'WRONG_SECRET' | 'NOT_FOUND' | string }> {
  const cleanNick = nickname.trim();
  const player = await findPlayerByName(cleanNick);

  if (!player) {
    return { success: false, error: 'NOT_FOUND' };
  }

  const secretHash = await hashSecret(secretWord);
  if (player.secretHash !== secretHash) {
    return { success: false, error: 'WRONG_SECRET' };
  }

  // Update last login
  const now = new Date().toISOString();
  player.lastLogin = now;

  if (db) {
    try {
      await updateDoc(doc(db, 'players', player.id), { lastLogin: now });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `players/${player.id}`);
    }
  }

  const localPlayers = getLocalPlayers();
  localPlayers[player.id] = player;
  saveLocalPlayers(localPlayers);

  saveCurrentSession(player);
  return { success: true, player };
}

export async function getPetsForOwner(ownerId: string): Promise<PetModel[]> {
  const allPets: PetModel[] = [];

  // Fetch from Firestore if available
  if (db) {
    try {
      const q = query(collection(db, 'pets'), where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const petData = docSnap.data() as PetModel;
        if (petData.status !== 'adopted') {
          allPets.push(petData);
        }
      });
      if (allPets.length > 0) {
        return allPets;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'pets');
    }
  }

  // Fallback to local
  const localPets = getLocalPets();
  return Object.values(localPets).filter(
    (pet) => pet.ownerId === ownerId && pet.status !== 'adopted'
  );
}

export async function createPet(
  ownerId: string,
  type: PetSpeciesKey,
  name: string,
  personality: string
): Promise<{ success: boolean; pet?: PetModel; error?: 'MAX_PETS_REACHED' | string }> {
  const existingPets = await getPetsForOwner(ownerId);
  if (existingPets.length >= MAX_PETS_PER_PLAYER) {
    return { success: false, error: 'MAX_PETS_REACHED' };
  }

  const petId = `pet_${ownerId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newPet: PetModel = {
    petId,
    ownerId,
    type,
    name: name.trim(),
    personality,
    level: 1,
    experience: 0,
    hunger: 85,
    happiness: 90,
    energy: 95,
    health: 100,
    age: 1,
    coins: 10,
    evolution: 'bebe',
    status: 'active',
    createdAt: now,
    lastPlayed: now,
    lastFed: now,
    lastSlept: now,
    eventDay: 1,
  };

  if (db) {
    try {
      await setDoc(doc(db, 'pets', petId), newPet);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `pets/${petId}`);
    }
  }

  const localPets = getLocalPets();
  localPets[petId] = newPet;
  saveLocalPets(localPets);

  return { success: true, pet: newPet };
}

export async function updatePet(pet: PetModel): Promise<void> {
  pet.lastPlayed = new Date().toISOString();

  if (db) {
    try {
      await setDoc(doc(db, 'pets', pet.petId), pet, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pets/${pet.petId}`);
    }
  }

  const localPets = getLocalPets();
  localPets[pet.petId] = pet;
  saveLocalPets(localPets);
}

export async function adoptPet(petId: string): Promise<boolean> {
  const localPets = getLocalPets();
  if (localPets[petId]) {
    localPets[petId].status = 'adopted';
    saveLocalPets(localPets);
  }

  if (db) {
    try {
      await updateDoc(doc(db, 'pets', petId), { status: 'adopted' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pets/${petId}`);
    }
  }

  return true;
}

export function saveCurrentSession(player: PlayerModel | null) {
  if (player) {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(player));
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export function getCurrentSession(): PlayerModel | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Daily AI Message Counter Helpers
export function getDailyAiMessageCount(playerId: string): number {
  const todayKey = `ai_msg_count_${playerId}_${new Date().toISOString().split('T')[0]}`;
  try {
    const raw = localStorage.getItem(todayKey);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function incrementDailyAiMessageCount(playerId: string): number {
  const todayKey = `ai_msg_count_${playerId}_${new Date().toISOString().split('T')[0]}`;
  const current = getDailyAiMessageCount(playerId);
  const next = current + 1;
  try {
    localStorage.setItem(todayKey, next.toString());
  } catch (err) {
    console.warn('Storage warning', err);
  }
  return next;
}
