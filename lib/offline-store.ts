/**
 * IndexedDB wrapper for offline data persistence (client-side only)
 */

const DB_NAME = 'gifthub-offline';
const DB_VERSION = 1;
const VOUCHER_STORE = 'vouchers';
const REDEMPTION_QUEUE_STORE = 'redemption-queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(VOUCHER_STORE)) {
        db.createObjectStore(VOUCHER_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(REDEMPTION_QUEUE_STORE)) {
        db.createObjectStore(REDEMPTION_QUEUE_STORE, { keyPath: 'queueId', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface OfflineVoucher {
  id: string;
  name?: string;
  code?: string;
  type?: string;
  value?: number;
  currency?: string;
  displayValue?: string;
  merchantName?: string;
  validTo?: string;
  [key: string]: unknown;
}

export interface QueuedRedemption {
  queueId?: number;
  voucherId: string;
  code: string;
  merchantId: string;
  timestamp: string;
  [key: string]: unknown;
}

/** Store a voucher for offline access */
export async function saveVoucherOffline(voucher: OfflineVoucher): Promise<void> {
  const db = await openDB();
  await txPromise(db, VOUCHER_STORE, 'readwrite', (store) => store.put(voucher));
}

/** Retrieve all cached vouchers */
export async function getOfflineVouchers(): Promise<OfflineVoucher[]> {
  const db = await openDB();
  return txPromise(db, VOUCHER_STORE, 'readonly', (store) => store.getAll());
}

/** Queue a redemption for sync when online */
export async function saveRedemptionQueue(redemption: Omit<QueuedRedemption, 'queueId'>): Promise<void> {
  const db = await openDB();
  await txPromise(db, REDEMPTION_QUEUE_STORE, 'readwrite', (store) =>
    store.add({ ...redemption, timestamp: redemption.timestamp || new Date().toISOString() }),
  );
}

/** POST all queued redemptions and clear the queue on success */
export async function syncPendingRedemptions(): Promise<{ synced: number; failed: number }> {
  const db = await openDB();
  const items: QueuedRedemption[] = await txPromise(db, REDEMPTION_QUEUE_STORE, 'readonly', (store) =>
    store.getAll(),
  );

  if (items.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: item.voucherId,
          code: item.code,
          merchantId: item.merchantId,
        }),
      });
      if (res.ok) {
        // Remove from queue
        await txPromise(db, REDEMPTION_QUEUE_STORE, 'readwrite', (store) =>
          store.delete(item.queueId!),
        );
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
