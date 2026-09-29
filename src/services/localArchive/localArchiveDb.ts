import type {
  LocalAppState,
  LocalSave,
  LocalUser,
  SaveSlot,
} from '@/types/localArchive'
import { toRaw } from 'vue'

const DB_NAME = 'ablauf-local-archives'
const DB_VERSION = 1

const STORE_APP_STATE = 'appState'
const STORE_USERS = 'users'
const STORE_SAVE_META = 'saveMeta'
const STORE_SAVES = 'saves'
const STORE_SETTINGS = 'settings'
type StoreName =
  | typeof STORE_APP_STATE
  | typeof STORE_USERS
  | typeof STORE_SAVE_META
  | typeof STORE_SAVES
  | typeof STORE_SETTINGS

let databasePromise: Promise<IDBDatabase> | null = null

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

function cloneForStorage<T>(value: T): T {
  const rawValue = toRaw(value) as T
  if (typeof structuredClone === 'function') {
    return structuredClone(rawValue)
  }
  return JSON.parse(JSON.stringify(rawValue)) as T
}

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_APP_STATE)) {
        db.createObjectStore(STORE_APP_STATE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SAVE_META)) {
        const store = db.createObjectStore(STORE_SAVE_META, { keyPath: 'id' })
        store.createIndex('byUserId', 'userId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_SAVES)) {
        const store = db.createObjectStore(STORE_SAVES, { keyPath: 'meta.id' })
        store.createIndex('byUserId', 'meta.userId', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
  })

  return databasePromise
}

async function getByKey<T>(storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase()
  const transaction = db.transaction(storeName, 'readonly')
  const value = await requestToPromise(transaction.objectStore(storeName).get(key))
  await transactionToPromise(transaction)
  return value as T | undefined
}

async function getAllValues<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDatabase()
  const transaction = db.transaction(storeName, 'readonly')
  const values = await requestToPromise(transaction.objectStore(storeName).getAll())
  await transactionToPromise(transaction)
  return values as T[]
}

async function putValue<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(cloneForStorage(value))
  await transactionToPromise(transaction)
}

async function deleteValue(storeName: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).delete(key)
  await transactionToPromise(transaction)
}

export async function loadLocalUsers(): Promise<LocalUser[]> {
  return getAllValues<LocalUser>(STORE_USERS)
}

export async function putLocalUser(user: LocalUser): Promise<void> {
  return putValue(STORE_USERS, user)
}

export async function deleteLocalUser(userId: string): Promise<void> {
  const db = await openDatabase()
  const saveMetas = await loadSaveMetas(userId)
  const transaction = db.transaction([STORE_USERS, STORE_SAVE_META, STORE_SAVES], 'readwrite')
  transaction.objectStore(STORE_USERS).delete(userId)

  const saveMetaStore = transaction.objectStore(STORE_SAVE_META)
  const saveStore = transaction.objectStore(STORE_SAVES)
  for (const saveMeta of saveMetas) {
    saveMetaStore.delete(saveMeta.id)
    saveStore.delete(saveMeta.id)
  }

  await transactionToPromise(transaction)
}

export async function loadSaveMetas(userId: string): Promise<SaveSlot[]> {
  const db = await openDatabase()
  const transaction = db.transaction(STORE_SAVE_META, 'readonly')
  const values = await requestToPromise(
    transaction.objectStore(STORE_SAVE_META).index('byUserId').getAll(userId),
  )
  await transactionToPromise(transaction)
  return (values as SaveSlot[]).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function putSave(save: LocalSave): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction([STORE_SAVES, STORE_SAVE_META], 'readwrite')
  transaction.objectStore(STORE_SAVES).put(save)
  transaction.objectStore(STORE_SAVE_META).put(save.meta)
  await transactionToPromise(transaction)
}

export async function getSave(saveId: string): Promise<LocalSave | undefined> {
  return getByKey<LocalSave>(STORE_SAVES, saveId)
}

export async function deleteSave(saveId: string): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction([STORE_SAVES, STORE_SAVE_META], 'readwrite')
  transaction.objectStore(STORE_SAVES).delete(saveId)
  transaction.objectStore(STORE_SAVE_META).delete(saveId)
  await transactionToPromise(transaction)
}

export async function loadAppState(): Promise<LocalAppState | undefined> {
  return getByKey<LocalAppState>(STORE_APP_STATE, 'singleton')
}

export async function putAppState(state: LocalAppState): Promise<void> {
  return putValue(STORE_APP_STATE, state)
}
