import { toastManager } from "./toast";

// Same shape as modelActions.js's callEndpoint — kept as its own copy since
// these hit a different set of endpoints, not because the logic differs.
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

async function callEndpoint(url, { method = "POST", body } = {}, { successTitle, actionLabel }) {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(extractErrorMessage(text, response.status));
    }

    let title = successTitle;
    try {
      title = JSON.parse(text).message ?? successTitle;
    } catch {
      // Response wasn't JSON — fall back to the caller-provided title.
    }

    toastManager.add({ type: "success", title });
    return true;
  } catch (error) {
    toastManager.add({
      type: "error",
      title: `${actionLabel} failed`,
      description: error.message,
    });
    return false;
  }
}

// Server does the sorting/pagination (see admin.controller.ts's listUsers) —
// this never fetches the whole users table just to slice/sort it in the
// browser, so the page stays fast regardless of how many users there are.
export async function fetchUsers({ limit, offset, sortBy, order, search }) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sortBy,
    order,
  });
  if (search) params.set("search", search);
  const response = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
  const text = await response.text();
  if (!response.ok) throw new Error(extractErrorMessage(text, response.status));
  const { users, total } = JSON.parse(text);
  return { users, total };
}

export function banUser(id, reason) {
  return callEndpoint(
    `/api/admin/users/${id}/ban`,
    { method: "POST", body: { reason } },
    { successTitle: "User banned", actionLabel: "Ban" },
  );
}

export function unbanUser(id) {
  return callEndpoint(
    `/api/admin/users/${id}/unban`,
    { method: "POST" },
    { successTitle: "User unbanned", actionLabel: "Unban" },
  );
}
