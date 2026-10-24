import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  LostItem,
  FoundItem,
  AIMatch,
  Claim,
  Message,
  Notification,
} from '../types/index.js';

// 1. Initialize Firebase
export const app = initializeApp(firebaseConfig);

// CRITICAL: Specify firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// 2. Validate Connection to Firestore
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore test connection notice:', error);
    return false;
  }
}
testConnection();

// 3. Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function logFirestoreNotice(error: unknown, op: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.warn(`Firestore notice on ${op} at ${path}:`, errMsg);
}

// 4. Firestore Database Collections Operations

// --- Users ---
export async function saveUserDoc(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
  } catch (err) {
    logFirestoreNotice(err, OperationType.WRITE, path);
  }
}

export async function getUserDoc(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return snap.data() as User;
  } catch (err) {
    logFirestoreNotice(err, OperationType.GET, path);
    return null;
  }
}

// --- Lost Items ---
export async function getLostItemsFirestore(): Promise<LostItem[]> {
  const path = 'lost_items';
  try {
    const snap = await getDocs(collection(db, 'lost_items'));
    const items: LostItem[] = [];
    snap.forEach((d) => items.push(d.data() as LostItem));
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function createLostItemFirestore(item: LostItem): Promise<void> {
  const path = `lost_items/${item.id}`;
  try {
    await setDoc(doc(db, 'lost_items', item.id), item);
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

// --- Found Items ---
export async function getFoundItemsFirestore(): Promise<FoundItem[]> {
  const path = 'found_items';
  try {
    const snap = await getDocs(collection(db, 'found_items'));
    const items: FoundItem[] = [];
    snap.forEach((d) => items.push(d.data() as FoundItem));
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function createFoundItemFirestore(item: FoundItem): Promise<void> {
  const path = `found_items/${item.id}`;
  try {
    await setDoc(doc(db, 'found_items', item.id), item);
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

// --- Matches ---
export async function getMatchesFirestore(): Promise<AIMatch[]> {
  const path = 'matches';
  try {
    const snap = await getDocs(collection(db, 'matches'));
    const list: AIMatch[] = [];
    snap.forEach((d) => list.push(d.data() as AIMatch));
    return list.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function createMatchFirestore(match: AIMatch): Promise<void> {
  const path = `matches/${match.id}`;
  try {
    await setDoc(doc(db, 'matches', match.id), match);
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

// --- Claims ---
export async function getClaimsFirestore(): Promise<Claim[]> {
  const path = 'claims';
  try {
    const snap = await getDocs(collection(db, 'claims'));
    const list: Claim[] = [];
    snap.forEach((d) => list.push(d.data() as Claim));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function createClaimFirestore(claim: Claim): Promise<void> {
  const path = `claims/${claim.id}`;
  try {
    await setDoc(doc(db, 'claims', claim.id), claim);
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

export async function updateClaimFirestore(claimId: string, partial: Partial<Claim>): Promise<void> {
  const path = `claims/${claimId}`;
  try {
    await updateDoc(doc(db, 'claims', claimId), partial as any);
  } catch (err) {
    logFirestoreNotice(err, OperationType.UPDATE, path);
  }
}

// --- Messages & Conversations ---
export async function getMessagesFirestore(convId: string): Promise<Message[]> {
  const path = `conversations/${convId}/messages`;
  try {
    const snap = await getDocs(collection(db, 'conversations', convId, 'messages'));
    const list: Message[] = [];
    snap.forEach((d) => list.push(d.data() as Message));
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function sendMessageFirestore(convId: string, message: Message): Promise<void> {
  const path = `conversations/${convId}/messages/${message.id}`;
  try {
    await setDoc(doc(db, 'conversations', convId, 'messages', message.id), message);
    await setDoc(
      doc(db, 'conversations', convId),
      {
        id: convId,
        lastMessage: message.content,
        updatedAt: message.createdAt,
      },
      { merge: true }
    );
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

// --- Notifications ---
export async function getNotificationsFirestore(userId: string): Promise<Notification[]> {
  const path = 'notifications';
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    const list: Notification[] = [];
    snap.forEach((d) => {
      const data = d.data() as Notification;
      if (data.userId === userId) {
        list.push(data);
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    logFirestoreNotice(err, OperationType.LIST, path);
    return [];
  }
}

export async function createNotificationFirestore(notif: Notification): Promise<void> {
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (err) {
    logFirestoreNotice(err, OperationType.CREATE, path);
  }
}

export async function markNotificationReadFirestore(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
  } catch (err) {
    logFirestoreNotice(err, OperationType.UPDATE, path);
  }
}
