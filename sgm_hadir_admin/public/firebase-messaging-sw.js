importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || "SGM Hadir";
  const notificationBody = payload.notification?.body || payload.data?.body || "";
  const notificationOptions = {
    body: notificationBody,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = new URL("/", self.location.origin);
  event.waitUntil(clients.openWindow(urlToOpen.toString()));
});
