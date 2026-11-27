const KEYS = {
  drafts: 'ammora-blueprint:drafts:v1',
  activity: 'ammora-blueprint:activity:v1',
};

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadDrafts = () => read(KEYS.drafts, []);
export const loadActivity = () => read(KEYS.activity, []);
export const persistDrafts = (items) => write(KEYS.drafts, items);
export const persistActivity = (items) => write(KEYS.activity, items);

export function upsertDraft(items, draft) {
  const exists = items.some((item) => item.id === draft.id);
  return exists
    ? items.map((item) => item.id === draft.id ? { ...draft, updatedAt: new Date().toISOString() } : item)
    : [{ ...draft, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...items];
}

export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? ('draft-' + Date.now() + '-' + Math.random().toString(16).slice(2));
}