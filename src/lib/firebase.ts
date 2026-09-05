import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Scholarship,
  Application,
  FreezePeriod,
  InterviewSchedule,
  UserProfile,
} from '../types';
import {
  INITIAL_SCHOLARSHIPS,
  INITIAL_APPLICATIONS,
  INITIAL_INTERVIEWS,
  INITIAL_STAFF_USER,
  INITIAL_ADMIN_USER,
} from '../data/initialData';
import { verifyPassword, DEFAULT_STAFF_PASSWORD_HASH, DEFAULT_ADMIN_PASSWORD_HASH } from './crypto';

// Suppress internal Firestore gRPC stream idle timeout logs
setLogLevel('silent');

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// CRITICAL: Connect to configured Firestore database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Standardized Operation Types & Error Handler conforming to SKILL.md
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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;

  // Ignore benign transient gRPC stream idle timeouts and cancellations
  if (
    errCode === 'cancelled' ||
    errMsg.includes('Disconnecting idle stream') ||
    errMsg.includes('Timed out waiting for new targets') ||
    errMsg.includes('Code: 1')
  ) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  // Conform strictly to SKILL.md: Throw JSON error if permission denied
  if (
    errCode === 'permission-denied' ||
    errMsg.includes('insufficient permissions') ||
    errMsg.includes('Missing or insufficient permissions')
  ) {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

// Connection check on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Successfully connected to Cloud Firestore');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is offline or initializing.');
      return false;
    }
    // Connection test document not existing is standard behavior (not an error)
    return true;
  }
}

// Initial connection check
testConnection();

// Collection constants
export const COLLECTIONS = {
  SCHOLARSHIPS: 'scholarships',
  APPLICATIONS: 'applications',
  FREEZE_PERIODS: 'freeze_periods',
  INTERVIEWS: 'interviews',
  USERS: 'users',
};

// -------------------------------------------------------------
// Seeding & Initialization
// -------------------------------------------------------------
export async function seedFirestoreIfEmpty(): Promise<void> {
  const path = COLLECTIONS.SCHOLARSHIPS;
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      console.log('Seeding initial records into Cloud Firestore database...');
      const batch = writeBatch(db);

      // Seed default scholarships
      for (const sch of INITIAL_SCHOLARSHIPS) {
        batch.set(doc(db, COLLECTIONS.SCHOLARSHIPS, sch.id), sch);
      }

      // Seed initial applications
      for (const appItem of INITIAL_APPLICATIONS) {
        batch.set(doc(db, COLLECTIONS.APPLICATIONS, appItem.id), appItem);
      }

      // Seed initial interviews
      for (const interview of INITIAL_INTERVIEWS) {
        batch.set(doc(db, COLLECTIONS.INTERVIEWS, interview.id), interview);
      }

      // Seed staff & admin accounts (passwords are SHA-256 hashes, never plaintext)
      batch.set(doc(db, COLLECTIONS.USERS, INITIAL_STAFF_USER.id), INITIAL_STAFF_USER);
      batch.set(doc(db, COLLECTIONS.USERS, INITIAL_ADMIN_USER.id), INITIAL_ADMIN_USER);

      await batch.commit();
      console.log('Initial records seeded into Cloud Firestore successfully.');
    } else {
      // Check if users collection specifically needs seeding
      const usersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
      if (usersSnap.empty) {
        const batch = writeBatch(db);
        batch.set(doc(db, COLLECTIONS.USERS, INITIAL_STAFF_USER.id), INITIAL_STAFF_USER);
        batch.set(doc(db, COLLECTIONS.USERS, INITIAL_ADMIN_USER.id), INITIAL_ADMIN_USER);
        await batch.commit();
        console.log('Initial faculty & admin accounts seeded into Cloud Firestore.');
      }
      // NOTE: No longer re-writing passwords on every startup.
      // Passwords are SHA-256 hashed and managed through the Admin user management UI.
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetFirestoreScholarships(): Promise<Scholarship[]> {
  const path = COLLECTIONS.SCHOLARSHIPS;
  try {
    const batch = writeBatch(db);
    for (const sch of INITIAL_SCHOLARSHIPS) {
      batch.set(doc(db, COLLECTIONS.SCHOLARSHIPS, sch.id), sch);
    }
    await batch.commit();
    return INITIAL_SCHOLARSHIPS;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return INITIAL_SCHOLARSHIPS;
  }
}

// -------------------------------------------------------------
// Real-time Subscriptions & CRUD
// -------------------------------------------------------------

// SCHOLARSHIPS
export function subscribeScholarships(
  onData: (scholarships: Scholarship[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = COLLECTIONS.SCHOLARSHIPS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Scholarship[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Scholarship);
      });
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveScholarshipToFirestore(scholarship: Scholarship): Promise<void> {
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${scholarship.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.SCHOLARSHIPS, scholarship.id), scholarship, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteScholarshipFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.SCHOLARSHIPS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.SCHOLARSHIPS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// APPLICATIONS
export function subscribeApplications(
  onData: (applications: Application[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = COLLECTIONS.APPLICATIONS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Application[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Application);
      });
      // Sort applications descending by creation timestamp
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createApplicationInFirestore(application: Application): Promise<void> {
  const path = `${COLLECTIONS.APPLICATIONS}/${application.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.APPLICATIONS, application.id), application);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateApplicationInFirestore(application: Application): Promise<void> {
  const path = `${COLLECTIONS.APPLICATIONS}/${application.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.APPLICATIONS, application.id), application, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteApplicationFromFirestore(id: string): Promise<void> {
  const path = `${COLLECTIONS.APPLICATIONS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.APPLICATIONS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// FREEZE PERIODS
export function subscribeFreezePeriods(
  onData: (periods: FreezePeriod[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = COLLECTIONS.FREEZE_PERIODS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: FreezePeriod[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as FreezePeriod);
      });
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveFreezePeriodToFirestore(period: FreezePeriod): Promise<void> {
  const path = `${COLLECTIONS.FREEZE_PERIODS}/${period.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.FREEZE_PERIODS, period.id), period);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// INTERVIEWS
export function subscribeInterviews(
  onData: (interviews: InterviewSchedule[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = COLLECTIONS.INTERVIEWS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: InterviewSchedule[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as InterviewSchedule);
      });
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveInterviewToFirestore(interview: InterviewSchedule): Promise<void> {
  const path = `${COLLECTIONS.INTERVIEWS}/${interview.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.INTERVIEWS, interview.id), interview, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// USER PROFILES (Professors, Staff, and Administrators)
export function subscribeUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = COLLECTIONS.USERS;
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as UserProfile);
      });
      onData(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  const path = COLLECTIONS.USERS;
  try {
    const snap = await getDocs(collection(db, path));
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as UserProfile);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function getUserFromFirestore(userId: string): Promise<UserProfile | null> {
  const path = `${COLLECTIONS.USERS}/${userId}`;
  try {
    const docSnap = await getDocFromServer(doc(db, COLLECTIONS.USERS, userId));
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.id}`;
  try {
    const updatedUser = {
      ...user,
      updated_at: new Date().toISOString(),
    };
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), updatedUser, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${userId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function authenticateUserWithFirestore(
  email: string,
  pass: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const path = COLLECTIONS.USERS;

  try {
    // Query users directly from Cloud Firestore to ensure live database check
    const users = await fetchUsersFromFirestore();

    // Find user by exact email match
    let matchedUser = users.find(
      (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
    );

    // Fallback: If entered role name (e.g., 'staff' or 'admin'), find corresponding role account
    if (!matchedUser) {
      if (cleanEmail === 'staff' || cleanEmail === 'staff@scholarflow.edu') {
        matchedUser = users.find((u) => u.role === 'staff');
      } else if (cleanEmail === 'admin' || cleanEmail === 'admin@scholarflow.edu') {
        matchedUser = users.find((u) => u.role === 'admin');
      }
    }

    if (!matchedUser) {
      return {
        user: null,
        error: `No account found with email "${cleanEmail}". Please check your email or contact the administrator.`,
      };
    }

    // Determine expected stored credential (hashed or legacy plaintext during migration)
    const storedCredential =
      matchedUser.password ||
      (matchedUser.role === 'admin' ? DEFAULT_ADMIN_PASSWORD_HASH : DEFAULT_STAFF_PASSWORD_HASH);

    // Support both SHA-256 hashed passwords (64-char hex) and legacy plaintext (for migration)
    let passwordMatches = false;
    if (storedCredential.length === 64 && /^[0-9a-f]+$/.test(storedCredential)) {
      // Stored credential is a SHA-256 hash — compare securely
      passwordMatches = await verifyPassword(pass, storedCredential);
    } else {
      // Legacy plaintext comparison — will be replaced on next password update
      passwordMatches = pass === storedCredential;
    }

    if (!passwordMatches) {
      return {
        user: null,
        error: 'Incorrect password. Please enter the correct password.',
      };
    }

    return { user: matchedUser, error: null };
  } catch (error) {
    console.error('Firestore authentication error:', error);
    return {
      user: null,
      error: 'Could not connect to the database to verify account credentials.',
    };
  }
}
