
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');


const firebaseConfig = {
  apiKey: "AIzaSyAtsfN75ZpwNqGT016kywyWAtqGWvgu5uQ",
  authDomain: "jdp-electric.firebaseapp.com",
  projectId: "jdp-electric",
  storageBucket: "jdp-electric.firebasestorage.app",
  messagingSenderId: "55007327977",
  appId: "1:55007327977:web:81775767a3f464b6622278",
  measurementId: "G-YDZH8B90E9"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const title = payload.notification?.title || payload.data?.title || 'Notification';
  const options = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: payload.notification?.icon || '/favicon.ico',
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});
