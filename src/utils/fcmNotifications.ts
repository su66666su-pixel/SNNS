// fcmNotifications.ts - إدارة إشعارات المتصفح وربطها بـ Firebase Cloud Messaging (FCM)
import { app } from "./firebase";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Check if browser native Notifications are supported
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

// Check current notification permission status
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

// Request permission from the user for notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn("Notifications are not supported in this browser.");
    return "denied";
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return "default";
  }
}

// Display a native web browser push notification
export function triggerBrowserNotification(title: string, body: string, iconUrl?: string) {
  if (!isNotificationSupported()) return false;
  
  if (Notification.permission === "granted") {
    try {
      const options: any = {
        body: body,
        icon: iconUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop",
        dir: "rtl",
        vibrate: [200, 100, 200],
        tag: "sentry-extreme-risk",
        requireInteraction: true // Keep it showing until the admin interacts
      };
      
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch (err) {
      console.warn("Could not fire native notification (e.g. sandboxed iframe restrictions):", err);
      return false;
    }
  } else {
    console.warn("Notification permission is not granted. Current state:", Notification.permission);
    return false;
  }
}

// Setup type definitions for subscription listeners
type NotificationListener = (payload: { title: string; body: string; data?: any }) => void;
const listeners: Set<NotificationListener> = new Set();

export function subscribeToPushNotifications(callback: NotificationListener) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function broadcastPushNotification(title: string, body: string, data?: any) {
  listeners.forEach(cb => {
    try {
      cb({ title, body, data });
    } catch (err) {
      console.error("Error invoking push notification listener:", err);
    }
  });
}

// State for FCM
interface FCMSetupState {
  isFCMSupported: boolean;
  token: string | null;
  error: string | null;
  isSimulated: boolean;
}

// Initialize FCM messaging securely
export async function setupFCM(): Promise<FCMSetupState> {
  const state: FCMSetupState = {
    isFCMSupported: false,
    token: null,
    error: null,
    isSimulated: false
  };

  if (typeof window === "undefined") {
    state.error = "Window environment is not available.";
    return state;
  }

  try {
    // 1. Check if FCM is supported in this browser version/environment
    const supported = await isSupported();
    state.isFCMSupported = supported;

    if (!supported) {
      state.error = "FCM is not supported in this browser/sandbox (e.g. inside an insecure iframe)";
      // Generate a simulated secure preview token so that the app stays operational
      state.token = "fcm_simulated_token_KSA_SENTRY_" + Math.random().toString(36).substring(2, 15).toUpperCase();
      state.isSimulated = true;
      return state;
    }

    // 2. Initialize real Firebase Cloud Messaging
    const messaging = getMessaging(app);

    // 3. Request FCM token
    // Using a standard public VAPID key template or default empty sender-id link
    try {
      const token = await getToken(messaging);
      if (token) {
        state.token = token;
        console.log("✓ Real FCM Token generated successfully:", token);
      } else {
        // Fallback simulation token
        state.token = "fcm_token_sentry_node_" + Math.random().toString(36).substring(2, 10);
        state.isSimulated = true;
        state.error = "No registration token available. Standard simulation token assigned.";
      }
    } catch (tokenErr: any) {
      console.warn("FCM registration token retrieval failed inside sandboxed environment: ", tokenErr);
      state.error = `Could not register service worker / getToken: ${tokenErr?.message || tokenErr}`;
      state.token = "fcm_token_fallback_" + Math.random().toString(36).substring(2, 10);
      state.isSimulated = true;
    }

    // 4. Foreground Message Handler
    onMessage(messaging, (payload) => {
      console.log("Received foreground FCM Push notification payload: ", payload);
      const title = payload.notification?.title || "تنبيه أمني جديد";
      const body = payload.notification?.body || "تم رصد تهديد خطير في المنصة";
      
      // Trigger native browser notification
      triggerBrowserNotification(title, body);
      
      // Dispatch locally to listeners
      broadcastPushNotification(title, body, payload.data);
    });

  } catch (err: any) {
    console.error("General error initializing Firebase Cloud Messaging:", err);
    state.error = err?.message || String(err);
    state.token = "fcm_token_error_sim_" + Math.random().toString(36).substring(2, 10);
    state.isSimulated = true;
  }

  return state;
}
