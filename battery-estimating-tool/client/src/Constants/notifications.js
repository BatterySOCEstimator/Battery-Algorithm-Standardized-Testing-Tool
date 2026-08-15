// Fetch helpers for the /api/notifications endpoints (see
// backend/src/controllers/notification.controller.ts). Kept self-contained
// (own error extraction) rather than sharing modelActions.js's private
// helper, matching this codebase's existing per-module convention.
function extractErrorMessage(text, status) {
  let message = text || `Server error ${status}`;
  try {
    const parsed = JSON.parse(text);
    message = parsed.error ?? parsed.message ?? message;
  } catch {
    // Response wasn't JSON — fall back to the raw text above.
  }
  return message.replace(/^[\w./-]+ - /, "");
}

export async function fetchNotifications() {
  const response = await fetch("/api/notifications", { credentials: "include" });
  const text = await response.text();
  if (!response.ok) throw new Error(extractErrorMessage(text, response.status));
  return JSON.parse(text).notifications;
}

export async function clearNotification(id) {
  const response = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractErrorMessage(text, response.status));
  }
}

export async function clearAllNotifications() {
  const response = await fetch("/api/notifications", {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractErrorMessage(text, response.status));
  }
}
