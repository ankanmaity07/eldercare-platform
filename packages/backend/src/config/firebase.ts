import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env.js';

let app: admin.app.App | null = null;
let isMock = false;

// In-memory data store for fallback/resilience when Firebase credentials are invalid or not configured
const inMemoryStore = new Map<string, Map<string, Record<string, unknown>>>();

function getCollectionMap(name: string): Map<string, Record<string, unknown>> {
  if (!inMemoryStore.has(name)) {
    inMemoryStore.set(name, new Map());
  }
  return inMemoryStore.get(name)!;
}

// In-memory Firestore compatible mock implementation
function createMockFirestore(): admin.firestore.Firestore {
  return {
    settings: () => {},
    collection: (colName: string) => {
      const col = getCollectionMap(colName);

      const createQuery = (filters: Array<{ field: string; op: string; val: unknown }> = [], limitCount?: number) => {
        return {
          where: (field: string, op: string, val: unknown) => {
            return createQuery([...filters, { field, op, val }], limitCount);
          },
          orderBy: () => createQuery(filters, limitCount),
          limit: (n: number) => createQuery(filters, n),
          get: async () => {
            let items = Array.from(col.entries()).map(([id, data]) => ({ id, ...data }));
            for (const f of filters) {
              if (f.op === '==') {
                items = items.filter((item) => (item as Record<string, unknown>)[f.field] === f.val);
              } else if (f.op === '>=') {
                items = items.filter((item) => {
                  const val = (item as Record<string, string | number | Date>)[f.field];
                  return val !== undefined && val >= (f.val as string | number | Date);
                });
              } else if (f.op === '<=') {
                items = items.filter((item) => {
                  const val = (item as Record<string, string | number | Date>)[f.field];
                  return val !== undefined && val <= (f.val as string | number | Date);
                });
              }
            }
            if (limitCount && limitCount > 0) {
              items = items.slice(0, limitCount);
            }
            return {
              empty: items.length === 0,
              size: items.length,
              docs: items.map((data) => ({
                id: (data as { id: string }).id,
                data: () => data,
                ref: {
                  update: async (updates: Record<string, unknown>) => {
                    const existing = col.get((data as { id: string }).id) ?? {};
                    col.set((data as { id: string }).id, { ...existing, ...updates });
                  },
                },
              })),
            };
          },
        };
      };

      return {
        doc: (docId?: string) => {
          const id = docId ?? `doc_${Math.random().toString(36).substring(2, 11)}`;
          return {
            id,
            set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
              if (opts?.merge) {
                const existing = col.get(id) ?? {};
                col.set(id, { ...existing, ...data });
              } else {
                col.set(id, data);
              }
            },
            get: async () => {
              const data = col.get(id);
              return {
                exists: Boolean(data),
                id,
                data: () => data,
              };
            },
            update: async (updates: Record<string, unknown>) => {
              const existing = col.get(id);
              if (existing) {
                col.set(id, { ...existing, ...updates });
              }
            },
            delete: async () => {
              col.delete(id);
            },
          };
        },
        where: (field: string, op: string, val: unknown) => createQuery().where(field, op, val),
        orderBy: () => createQuery().orderBy(),
        limit: (n: number) => createQuery().limit(n),
        get: async () => createQuery().get(),
      };
    },
  } as unknown as admin.firestore.Firestore;
}

/** Initialize Firebase Admin SDK with graceful fallback */
export function initFirebase(): admin.app.App | null {
  if (app) return app;
  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  try {
    let rawKey = env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.trim() : '';
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1);
    }
    const privateKey = rawKey.includes('PRIVATE KEY')
      ? rawKey.replace(/\\n/g, '\n')
      : null;

    if (!privateKey || env.FIREBASE_PROJECT_ID.includes('dev-project')) {
      console.info('[Firebase] Using resilient in-memory database store (development/demo mode).');
      isMock = true;
      return null;
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: env.FIREBASE_DATABASE_URL,
    });
    console.info('[Firebase] Connected to Firebase Admin successfully.');
    return app;
  } catch (err) {
    console.warn('[Firebase] Initialization error with configured credentials:', err);
    console.info('[Firebase] Falling back to resilient in-memory store.');
    isMock = true;
    return null;
  }
}

// Attempt initialization
initFirebase();

export const db: admin.firestore.Firestore = isMock || !app ? createMockFirestore() : getFirestore();
export const auth: admin.auth.Auth = isMock || !app ? ({} as admin.auth.Auth) : getAuth();

if (!isMock && db.settings) {
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore settings if already applied
  }
}
