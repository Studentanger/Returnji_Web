'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localAdmin = typeof window !== 'undefined' ? localStorage.getItem('ghostqr_admin') : null;
    
    if (localAdmin) {
      const parsedAdmin = JSON.parse(localAdmin);
      setUser(parsedAdmin);
      setUserData(parsedAdmin);
      setLoading(false);
      // We still need to handle Firebase auth state if there's any, but for mock admin we can just return or proceed
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch Firestore user doc for role + ghostCoins
        const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (name, email, password, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newUserData = {
      uid: cred.user.uid,
      name,
      email,
      phone,
      ghostCoins: 0,
      role: 'user',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newUserData);
    setUserData(newUserData);
    return newUserData;
  };

  const login = async (email, password, rememberMe = false) => {
    // 1. Set Persistence
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    if (email === 'admin@ghostqr.in' && password === 'ghost@atharvarishita.1289') {
      const mockAdmin = { uid: 'admin-hardcoded-123', name: 'Super Admin', email, role: 'admin' };
      setUser(mockAdmin);
      setUserData(mockAdmin);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ghostqr_admin', JSON.stringify(mockAdmin));
      }
      return mockAdmin;
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
    const data = docSnap.exists() ? docSnap.data() : null;
    if (data) setUserData(data);
    return data;
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ghostqr_admin');
    }
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userRef = doc(db, 'users', cred.user.uid);
    const docSnap = await getDoc(userRef);
    
    let currentuserData = null;
    if (docSnap.exists()) {
      currentuserData = docSnap.data();
      if (cred.user.photoURL && currentuserData.photoURL !== cred.user.photoURL) {
        await setDoc(userRef, { photoURL: cred.user.photoURL }, { merge: true });
        currentuserData.photoURL = cred.user.photoURL;
      }
    } else {
      currentuserData = {
        uid: cred.user.uid,
        name: cred.user.displayName || 'Google User',
        email: cred.user.email,
        phone: cred.user.phoneNumber || '',
        photoURL: cred.user.photoURL || '',
        ghostCoins: 0,
        role: 'user',
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, currentuserData);
    }
    setUserData(currentuserData);
    return currentuserData;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, register, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
