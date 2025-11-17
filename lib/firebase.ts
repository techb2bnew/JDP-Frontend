import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, onMessage, Messaging, getToken } from 'firebase/messaging'
import { getAnalytics, Analytics } from 'firebase/analytics'

let messaging: Messaging | null = null;
let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtsfN75ZpwNqGT016kywyWAtqGWvgu5uQ",
  authDomain: "jdp-electric.firebaseapp.com",
  projectId: "jdp-electric",
  storageBucket: "jdp-electric.firebasestorage.app",
  messagingSenderId: "55007327977",
  appId: "1:55007327977:web:81775767a3f464b6622278",
  measurementId: "G-YDZH8B90E9"
};

export function initFirebase() {
  try {
    if (typeof window === 'undefined') return null;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (err) {
    console.warn('initFirebase error', err);
    return null;
  }
}

export function initFirebaseMessaging() {
  try {
    if (typeof window === 'undefined') return null;
    
    // Initialize Firebase app first
    if (!app) {
      initFirebase();
    }
    
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    }
    
    messaging = getMessaging(app!);
    return messaging;
  } catch (err) {
    console.warn('initFirebaseMessaging error', err);
    return null;
  }
}

export async function getFCMToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    
    // Initialize messaging if not already done
    if (!messaging) {
      initFirebaseMessaging();
    }
    
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    // Using default VAPID key - you may need to configure this in Firebase Console
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined
    });
    
    return token || null;
  } catch (err) {
    console.error('Error getting FCM token:', err);
    return null;
  }
}

export function onForegroundMessage(handler: (payload: any) => void) {
  if (!messaging) {
    initFirebaseMessaging();
  }
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
