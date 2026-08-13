import { toastManager } from "./toast";

// Shared fetch + toast plumbing for the model action endpoints. Shows a
// green "success" toast when the request comes back ok, or a red "error"
// toast with the server's error message (or the fetch failure) otherwise.
// Returns true/false so callers only apply optimistic UI changes once the
// request has actually succeeded.
//
// The backend's error responses are JSON shaped like `{ error: string }`
// (most routes) or `{ message: string }` (the auth middleware), so we pull
// whichever is present for the toast instead of showing the raw response
// body. Server-side log lines are prefixed like "model/delete - ...", and
// if any of that ever leaks into a response, strip it back off too.
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

    // Prefer the backend's own descriptive message (e.g. "Test Coulomb
    // Counter: Visibility set to private") over the generic fallback title.
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

// Calls the real PATCH /api/model/update/:id route (see model.routes.ts /
// model.controller.ts). Used for both the privacy toggle and the edit form,
// since both are just "change some fields on this model" — `changes` should
// only contain whatever subset of { name, description, modelType, isPrivate }
// is actually changing; the id goes in the URL, not the body.
export function updateModel(id, changes, successTitle = "Submission updated") {
  return callEndpoint(
    `/api/model/update/${id}`,
    { method: "PATCH", body: changes },
    { successTitle, actionLabel: "Update" },
  );
}

// Calls the real, verified DELETE /api/model/delete/:id route (see
// model.routes.ts / model.controller.ts). Auth + ownership + the actual
// file/DB deletion are enforced server-side; this just wires the request up.
export function deleteModel(id) {
  return callEndpoint(
    `/api/model/delete/${id}`,
    { method: "DELETE" },
    { successTitle: "Submission deleted", actionLabel: "Delete" },
  );
}
