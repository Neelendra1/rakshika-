// Rakshika Offline Storage & Background Sync Queue Engine (IndexedDB)

const DB_NAME = "RakshikaOfflineDB";
const DB_VERSION = 1;
const QUEUE_STORE = "offline_actions";

export interface OfflineAction {
  id?: number;
  type: "CREATE_BOOKING" | "TRIGGER_SOS";
  payload: any;
  timestamp: string;
}

// Open or initialize IndexedDB connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Queue an action when device is offline
export const queueOfflineAction = async (type: "CREATE_BOOKING" | "TRIGGER_SOS", payload: any): Promise<number> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      const store = tx.objectStore(QUEUE_STORE);
      const action: OfflineAction = {
        type,
        payload,
        timestamp: new Date().toISOString()
      };
      const req = store.add(action);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to queue offline action in IndexedDB:", err);
    throw err;
  }
};

// Retrieve all pending offline actions
export const getOfflineQueue = async (): Promise<OfflineAction[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readonly");
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to fetch offline queue from IndexedDB:", err);
    return [];
  }
};

// Clear an action from the queue once successfully synced to server
export const removeOfflineAction = async (id: number): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      const store = tx.objectStore(QUEUE_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to delete queued item from IndexedDB:", err);
  }
};

// Auto-sync queued items when internet connection is restored
export const syncOfflineQueue = async (backendUrl: string): Promise<{ syncedCount: number }> => {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0 };

  console.log(`[Rakshika Sync] Network restored! Syncing ${queue.length} offline item(s)...`);
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.type === "CREATE_BOOKING") {
        const res = await fetch(`${backendUrl}/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(item.payload)
        });
        if (res.ok && item.id) {
          await removeOfflineAction(item.id);
          syncedCount++;
        }
      } else if (item.type === "TRIGGER_SOS") {
        const res = await fetch(`${backendUrl}/api/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        if (res.ok && item.id) {
          await removeOfflineAction(item.id);
          syncedCount++;
        }
      }
    } catch (err) {
      console.warn("Failed to sync item to backend, keeping in offline queue:", err);
    }
  }

  return { syncedCount };
};
