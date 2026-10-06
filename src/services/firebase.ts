import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context: ', JSON.stringify(errInfo));
}

export async function initFirebaseIfAvailable(): Promise<boolean> {
  try {
    if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.trim() === '') {
      return false;
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    auth = getAuth(app);

    // Test connection
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch {
      // Connection checked
    }
    return true;
  } catch (err) {
    console.info('Firebase initialization status: running in local persistent mode.', err);
    return false;
  }
}
