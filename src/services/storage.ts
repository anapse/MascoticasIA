import { PetModel, PetSpeciesKey, PlayerModel } from '../types/pet';
import { hashSecret, normalizePlayerId } from './crypto';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

export const MAX_PETS_PER_PLAYER = 3;
export const DAILY_AI_MESSAGE_LIMIT = 20;

const AUTH_DOMAIN = 'auth.mascoticasia.app';

type PersistedPet = {
  petId: string;
  name: string;
  ownerId: string;
  type: PetSpeciesKey;
};

function authEmail(playerId: string) {
  return `${playerId}@${AUTH_DOMAIN}`;
}

function hydratePet(data: PersistedPet): PetModel {
  const now = new Date().toISOString();
  return {
    ...data,
    personality: '',
    level: 1,
    experience: 0,
    hunger: 85,
    happiness: 90,
    energy: 80,
    boredom: 20,
    health: 100,
    age: 1,
    coins: 0,
    evolution: 'bebe',
    status: 'active',
    createdAt: now,
    lastPlayed: now,
    lastFed: now,
    lastSlept: now,
    eventDay: 1,
  };
}

function toPersistedPet(pet: PetModel): PersistedPet {
  return {
    petId: pet.petId,
    name: pet.name.trim(),
    ownerId: pet.ownerId,
    type: pet.type,
  };
}

export async function findPlayerByName(nickname: string): Promise<PlayerModel | null> {
  const playerId = normalizePlayerId(nickname);

  if (!db || !auth?.currentUser) return null;

  try {
    const playerDoc = await getDoc(doc(db, 'players', playerId));
    if (!playerDoc.exists()) return null;

    const data = playerDoc.data() as Omit<PlayerModel, 'id'>;
    return {
      id: playerDoc.id,
      nickname: data.nickname,
      secretHash: data.secretHash,
      createdAt: data.createdAt ?? '',
      lastLogin: data.lastLogin ?? '',
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `players/${playerId}`);
    return null;
  }
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

  if (!secretWord.trim()) {
    return { success: false, error: 'La palabra secreta no puede estar vacía' };
  }

  const secretHash = await hashSecret(secretWord);
  const now = new Date().toISOString();

  if (auth) {
    try {
      await createUserWithEmailAndPassword(auth, authEmail(playerId), secretWord.trim());
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        return { success: false, error: 'ALREADY_EXISTS' };
      }
      throw err;
    }
  }

  const player: PlayerModel = {
    id: playerId,
    nickname: cleanNick,
    secretHash,
    createdAt: now,
    lastLogin: now,
  };

  if (!db || !auth?.currentUser) {
    if (auth?.currentUser) {
      try { await signOut(auth); } catch {}
    }
    return { success: false, error: 'No se pudo conectar con Firebase' };
  }

  try {
    await setDoc(doc(db, 'players', playerId), {
      nickname: player.nickname,
      secretHash: player.secretHash,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `players/${playerId}`);
    if (auth?.currentUser) {
      try { await deleteUser(auth.currentUser); } catch {}
    }
    return { success: false, error: 'No se pudo guardar la cuenta en Firebase' };
  }

  return { success: true, player };
}

export async function loginPlayer(
  nickname: string,
  secretWord: string
): Promise<{ success: boolean; player?: PlayerModel; error?: 'WRONG_SECRET' | 'NOT_FOUND' | string }> {
  const cleanNick = nickname.trim();
  const playerId = normalizePlayerId(cleanNick);

  if (auth) {
    try {
      await signInWithEmailAndPassword(auth, authEmail(playerId), secretWord.trim());
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        return { success: false, error: 'NOT_FOUND' };
      }
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-password') {
        return { success: false, error: 'WRONG_SECRET' };
      }
      throw err;
    }
  }

  if (!db || !auth?.currentUser) {
    if (auth?.currentUser) {
      try { await signOut(auth); } catch {}
    }
    return { success: false, error: 'No se pudo conectar con Firebase' };
  }

  let player: PlayerModel | null = null;

  try {
    const snap = await getDoc(doc(db, 'players', playerId));
    if (snap.exists()) {
      const data = snap.data() as Omit<PlayerModel, 'id'>;
      player = {
        id: playerId,
        nickname: data.nickname,
        secretHash: data.secretHash,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `players/${playerId}`);
  }

  if (!player) {
    try { await signOut(auth); } catch {}
    return { success: false, error: 'NOT_FOUND' };
  }

  // createdAt/lastLogin are runtime metadata only; Firestore keeps only
  // the minimal player identity defined by the blueprint.
  player = { ...player, lastLogin: new Date().toISOString() };

  return { success: true, player };
}

export async function getPetsForOwner(ownerId: string): Promise<PetModel[]> {
  if (!db || !auth?.currentUser) return [];

  try {
    const q = query(collection(db, 'pets'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((snap) =>
      hydratePet({ petId: snap.id, ...(snap.data() as Omit<PersistedPet, 'petId'>) })
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'pets');
    return [];
  }
}

export async function createPet(
  ownerId: string,
  type: PetSpeciesKey,
  name: string,
  _personality: string
): Promise<{ success: boolean; pet?: PetModel; error?: 'MAX_PETS_REACHED' | string }> {
  const existingPets = await getPetsForOwner(ownerId);
  if (existingPets.length >= MAX_PETS_PER_PLAYER) {
    return { success: false, error: 'MAX_PETS_REACHED' };
  }

  const petId = `pet_${ownerId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const persistedPet: PersistedPet = {
    petId,
    ownerId,
    type,
    name: name.trim(),
  };

  if (!db || !auth?.currentUser) {
    return { success: false, error: 'No se pudo conectar con Firebase' };
  }

  try {
    await setDoc(doc(db, 'pets', petId), {
        name: persistedPet.name,
        ownerId: persistedPet.ownerId,
        type: persistedPet.type,
      });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `pets/${petId}`);
    return { success: false, error: 'No se pudo guardar la mascota en Firebase' };
  }

  return { success: true, pet: hydratePet(persistedPet) };
}

export async function updatePet(
  pet: PetModel,
  options: { persistIdentity?: boolean } = {},
): Promise<void> {
  // Runtime gameplay state is deliberately NOT persisted in Firestore.
  // Only the pet identity fields defined by the blueprint are written.
  if (!options.persistIdentity && options.persistIdentity !== undefined) return;
  if (!db || !auth?.currentUser) return;

  try {
    await setDoc(doc(db, 'pets', pet.petId), {
      name: pet.name.trim(),
      ownerId: pet.ownerId,
      type: pet.type,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `pets/${pet.petId}`);
  }
}

export async function adoptPet(petId: string): Promise<boolean> {
  if (!db || !auth?.currentUser) return false;

  try {
    await deleteDoc(doc(db, 'pets', petId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `pets/${petId}`);
    return false;
  }

  return true;
}

export async function recordVisit(userId: string, petId: string): Promise<void> {
  if (!db || !auth?.currentUser) return;

  const visitId = `${userId}_${petId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    await setDoc(doc(db, 'visits', visitId), {
      userId,
      petId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `visits/${visitId}`);
  }
}

export async function logoutFirebase(): Promise<void> {
  if (auth?.currentUser) {
    try { await signOut(auth); } catch {}
  }
}

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
  } catch {}
  return next;
}
