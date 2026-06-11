import { useState, useEffect } from 'react';
import nprogress from 'nprogress';
import { User } from 'firebase/auth';
import { auth, db, doc, onSnapshot, handleFirestoreError, OperationType } from '../lib/firebase';
import { setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // sync user profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        nprogress.start();
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() });
          } else {
            // create user profile if not exists
            try {
              await setDoc(userRef, {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Unnamed User',
                role: 'admin',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, 'users');
            }
          }
          nprogress.done();
        }, (error) => {
           handleFirestoreError(error, OperationType.GET, 'users');
           nprogress.done();
        });
        setLoading(false);
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = undefined;
        }
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (unsubProfile) {
        unsubProfile();
      }
      unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
