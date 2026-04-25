/* =============================================
   db.js — IndexedDB wrapper
   Store: activities
   ============================================= */

const DB_NAME    = 'igor-sport-tracker';
const DB_VERSION = 1;
const STORE      = 'activities';

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byDate',         'date',         { unique: false });
        store.createIndex('byActivityType', 'activityType', { unique: false });
        store.createIndex('byDeleted',      'deleted',      { unique: false });
        store.createIndex('byUpdatedAt',    'updatedAt',    { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function tx(mode = 'readonly') {
  return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
}

export async function saveActivity(activity) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(activity);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function getActivity(id) {
  const store = await tx();
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function getAllActivities({ includeDeleted = false } = {}) {
  const store = await tx();
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      let results = req.result;
      if (!includeDeleted) results = results.filter(a => !a.deleted);
      results.sort((a, b) => b.date.localeCompare(a.date));
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getActivitiesByDateRange(from, to, { includeDeleted = false } = {}) {
  const all = await getAllActivities({ includeDeleted });
  return all.filter(a => a.date >= from && a.date <= to);
}

export async function deleteActivity(id, soft = true) {
  if (soft) {
    const a = await getActivity(id);
    if (!a) return;
    a.deleted   = true;
    a.updatedAt = new Date().toISOString();
    return saveActivity(a);
  }
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function clearAllActivities() {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function importActivities(records) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    let done = 0;
    if (!records.length) return resolve(0);
    records.forEach(r => {
      const req = store.put(r);
      req.onsuccess = () => { done++; if (done === records.length) resolve(done); };
      req.onerror   = () => reject(req.error);
    });
  });
}

export async function exportAllActivities() {
  return getAllActivities({ includeDeleted: true });
}
