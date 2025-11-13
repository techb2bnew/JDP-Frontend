
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onMessage, Messaging } from 'firebase/messaging'

let messaging: Messaging | null = null;

export function initFirebaseMessaging() {
  try {
    if (typeof window === 'undefined') return null;
    if (getApps().length === 0) {
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      });
    }
    messaging = getMessaging();
    return messaging;
  } catch (err) {
    console.warn('initFirebaseMessaging error', err);
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
