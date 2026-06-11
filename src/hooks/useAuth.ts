import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db, doc, onSnapshot, handleFirestoreError, OperationType } from '../lib/firebase';
import { setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // sync user profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() });
          } else {
            // create user profile if not exists
            try {
              setDoc(userRef, {
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'Unnamed User',
                role: 'admin',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, 'users');
            }
          }
        }, (error) => {
           handleFirestoreError(error, OperationType.GET, 'users');
        });
        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading };
}
