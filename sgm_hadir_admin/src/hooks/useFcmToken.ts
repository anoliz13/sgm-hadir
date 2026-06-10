import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingInstance } from "../lib/firebase";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || "YOUR_VAPID_KEY";

export function useFcmToken() {
  const registered = useRef(false);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;

    const init = async () => {
      if (!("Notification" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      if (!navigator.serviceWorker) return;

      try {
        await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      } catch {
        return;
      }

      const messaging = await getMessagingInstance();
      if (!messaging) return;

      try {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          api.put("/profile/fcm-token", { fcm_token: token }).catch(() => {});
        }
      } catch {
        // FCM token registration failed (likely no Firebase config)
      }

      onMessage(messaging, (payload) => {
        const title = payload.notification?.title || payload.data?.title || "SGM Hadir";
        const body = payload.notification?.body || payload.data?.body || "";
        if (title && body) {
          toast(body, { icon: "🔔", duration: 5000 });
        }
      });
    };

    init();
  }, []);
}
