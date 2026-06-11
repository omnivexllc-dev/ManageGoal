import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import toast from 'react-hot-toast';

const app = initializeApp({
  ...firebaseConfig,
  // Bypass 'unauthorized-domain' error in WebContainers by using the current domain
  // and proxying the /__/auth handler requests to Firebase (via server.ts proxy middleware).
  authDomain: typeof window !== 'undefined' ? window.location.hostname : firebaseConfig.authDomain
});
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth();

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    toast.success('Logged in successfully!');
  } catch (error: any) {
    toast.error(error.message);
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    toast.success('Logged in successfully!');
  } catch (error: any) {
    toast.error(error.message);
  }
};

export const signUpWithEmail = async (email: string, pass: string) => {
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    toast.success('Account created successfully!');
  } catch (error: any) {
    toast.error(error.message);
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset email sent!');
  } catch (error: any) {
    toast.error(error.message);
  }
};

export const signOut = async () => {
  try {
    await fbSignOut(auth);
    toast.success('Logged out successfully');
  } catch (error: any) {
    toast.error(error.message);
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error("Database operation failed: " + (error instanceof Error ? error.message : "Unknown error"));
  throw new Error(JSON.stringify(errInfo));
}

export { doc, getDocFromServer, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, orderBy, OperationType };
