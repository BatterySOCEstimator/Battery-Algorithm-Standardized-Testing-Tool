import { useCallback, useEffect, useRef, useState } from "react";
import { toastManager } from "#Constants/toast";
import { playNotificationSound } from "#Constants/notificationSound";
import {
  fetchNotifications,
  clearNotification as clearNotificationRequest,
  clearAllNotifications as clearAllNotificationsRequest,
} from "#Constants/notifications";

const POLL_INTERVAL_MS = 15000;

// Powers the notification bell: loads the user's current notifications on
// mount, then keeps them live two ways — a Server-Sent Events connection
// (backend's notification.controller.ts streamNotifications) pushes new
// ones the instant they're created, and a 15s poll re-syncs the full list
// as a safety net, so a model upload/evaluation finishing while this tab is
// open still shows up (with a toast + chime) even if a single SSE connection
// ever drops silently or misses a push during a reconnect. Notifications
// persist server-side, so logging out and back in still shows whatever
// wasn't explicitly cleared.
export default function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const knownIds = useRef(new Set());
  const bootstrapped = useRef(false);

  const announce = useCallback((notification) => {
    toastManager.add({
      type: notification.type === "error" ? "error" : "success",
      title: notification.title,
      description: notification.message,
    });
    playNotificationSound();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      knownIds.current = new Set();
      bootstrapped.current = false;
      return;
    }

    let cancelled = false;

    // Reconciles a full list from the server against what's already been
    // seen. Anything newly appeared gets announced — except on the very
    // first load, where the whole list is "new" but shouldn't all pop
    // toasts/chimes at once.
    const applyList = (data) => {
      if (cancelled) return;

      const previouslyKnown = knownIds.current;
      const newlyArrived = bootstrapped.current
        ? data.filter((n) => !previouslyKnown.has(n.id))
        : [];

      knownIds.current = new Set(data.map((n) => n.id));
      bootstrapped.current = true;
      setNotifications(data);

      // Oldest first, so a burst of missed notifications announces in the
      // order they actually happened.
      [...newlyArrived].reverse().forEach(announce);
    };

    const reload = () => {
      fetchNotifications().then(applyList).catch(() => {
        // Silent — the bell just keeps showing whatever it last had.
      });
    };

    reload();

    // A fresh connection (including a reconnect after a drop) can't tell
    // what it missed, so re-fetch the full list whenever one opens.
    const source = new EventSource("/api/notifications/stream", { withCredentials: true });
    source.onopen = reload;
    source.onerror = () => {
      // The browser retries this automatically; logged only to aid debugging.
      console.warn("Notification stream disconnected — reconnecting…");
    };

    source.onmessage = (event) => {
      if (cancelled) return;
      const notification = JSON.parse(event.data);
      if (knownIds.current.has(notification.id)) return;

      knownIds.current.add(notification.id);
      setNotifications((prev) => [notification, ...prev]);
      announce(notification);
    };

    const pollId = setInterval(reload, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      source.close();
      clearInterval(pollId);
    };
  }, [user, announce]);

  const clear = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    clearNotificationRequest(id).catch(() => {
      toastManager.add({ type: "error", title: "Failed to dismiss notification" });
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    clearAllNotificationsRequest().catch(() => {
      toastManager.add({ type: "error", title: "Failed to clear notifications" });
    });
  }, []);

  return { notifications, clear, clearAll };
}
