import { useCallback, useState } from "react";

// Personal, device-local "hide this model from my view" preference — not a
// server concept, just something to declutter the Leaderboard/Submissions
// tables. Shared across both pages via one localStorage key, so hiding a
// model in one place hides it everywhere, and the "show hidden" toggle on
// either page reveals the same set.
const STORAGE_KEY = "hiddenModelIds";

function loadHiddenIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveHiddenIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — hiding
    // still works for the current session, it just won't persist.
  }
}

const useHiddenModels = () => {
  const [hiddenIds, setHiddenIds] = useState(loadHiddenIds);

  const hideModel = useCallback((id) => {
    setHiddenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const unhideModel = useCallback((id) => {
    setHiddenIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveHiddenIds(next);
      return next;
    });
  }, []);

  return { hiddenIds, hideModel, unhideModel };
};

export default useHiddenModels;
