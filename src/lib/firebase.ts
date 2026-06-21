import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from "firebase/auth";
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { DayLog, DailyTargets } from "../types";
import { UserProfile } from "../components/ProfileModal";
import { WeightLog } from "../components/WeightTracker";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Provider for Google Login
export const googleProvider = new GoogleAuthProvider();

// Error logger and compliance handler matching the custom format:
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Quick Google Login Trigger helper
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google authentication failed:", error);
    throw error;
  }
}

// Quick Logout Trigger helper
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Failed to sign out user:", error);
    throw error;
  }
}

// --- FIRESTORE PERSISTENCE HELPERS ---

/**
 * Saves User Profile and Targets to Firestore
 */
export async function saveFirestoreProfile(
  uid: string, 
  profile: UserProfile, 
  currentTargets: DailyTargets
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, "users", uid), {
      name: profile.name,
      email: profile.email,
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      targetWeight: profile.targetWeight,
      activityLevel: profile.activityLevel,
      currentTargets: currentTargets
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Gets User Profile and Targets from Firestore
 */
export async function getFirestoreProfile(
  uid: string
): Promise<{ profile: UserProfile; currentTargets: DailyTargets } | null> {
  const path = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile: UserProfile = {
        name: data.name || "",
        email: data.email || "",
        age: Number(data.age) || 30,
        gender: data.gender || "Erkek",
        height: Number(data.height) || 180,
        weight: Number(data.weight) || 78,
        targetWeight: Number(data.targetWeight) || 75,
        activityLevel: data.activityLevel || "Orta Aktif"
      };
      
      const currentTargets: DailyTargets = data.currentTargets || {
        calories: 2000,
        protein: 150,
        carbs: 225,
        fat: 55,
        water: 2500,
        fiber: 25,
        sodium: 2300,
        sugarLimit: 50
      };
      
      return { profile, currentTargets };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Saves a DayLog to Firestore
 */
export async function saveFirestoreDayLog(
  uid: string,
  date: string,
  log: DayLog
): Promise<void> {
  const path = `users/${uid}/logs/${date}`;
  try {
    await setDoc(doc(db, "users", uid, "logs", date), {
      date: log.date,
      meals: log.meals,
      waterConsumedMl: log.waterConsumedMl,
      dailyTargets: log.dailyTargets,
      summaryNote: log.summaryNote || "",
      steps: log.steps || 0
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches all DayLogs from Firestore
 */
export async function getFirestoreDayLogs(
  uid: string
): Promise<Record<string, DayLog>> {
  const path = `users/${uid}/logs`;
  try {
    const logsCol = collection(db, "users", uid, "logs");
    const snapshot = await getDocs(logsCol);
    const logsMap: Record<string, DayLog> = {};
    snapshot.forEach((d) => {
      const data = d.data();
      logsMap[d.id] = {
        date: data.date,
        meals: data.meals,
        waterConsumedMl: data.waterConsumedMl,
        dailyTargets: data.dailyTargets,
        summaryNote: data.summaryNote,
        steps: Number(data.steps) || 0
      };
    });
    return logsMap;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

/**
 * Saves a WeightLog to Firestore
 */
export async function saveFirestoreWeightLog(
  uid: string,
  date: string,
  weight: number
): Promise<void> {
  const path = `users/${uid}/weightLogs/${date}`;
  try {
    await setDoc(doc(db, "users", uid, "weightLogs", date), {
      date,
      weight
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a WeightLog from Firestore
 */
export async function deleteFirestoreWeightLog(
  uid: string,
  date: string
): Promise<void> {
  const path = `users/${uid}/weightLogs/${date}`;
  try {
    await deleteDoc(doc(db, "users", uid, "weightLogs", date));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches all WeightLogs from Firestore
 */
export async function getFirestoreWeightLogs(
  uid: string
): Promise<WeightLog[]> {
  const path = `users/${uid}/weightLogs`;
  try {
    const weightCol = collection(db, "users", uid, "weightLogs");
    const snapshot = await getDocs(weightCol);
    const weightLogs: WeightLog[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      weightLogs.push({
        date: data.date,
        weight: Number(data.weight)
      });
    });
    // Sort chronological: older to newer
    return weightLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

