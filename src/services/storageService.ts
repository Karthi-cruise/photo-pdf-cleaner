import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PhotoItem, BinItem, PDFDocumentItem } from '../types';

interface PhotoVaultDB extends DBSchema {
  photos: {
    key: string;
    value: PhotoItem;
    indexes: { 'by-createdAt': number };
  };
  bin: {
    key: string;
    value: BinItem;
    indexes: { 'by-expiresAt': number; 'by-deletedAt': number };
  };
  pdfs: {
    key: string;
    value: PDFDocumentItem;
    indexes: { 'by-createdAt': number };
  };
}

const DB_NAME = 'PhotoVaultDocScanDB';
const DB_VERSION = 1;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase<PhotoVaultDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<PhotoVaultDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('bin')) {
          const binStore = db.createObjectStore('bin', { keyPath: 'id' });
          binStore.createIndex('by-expiresAt', 'expiresAt');
          binStore.createIndex('by-deletedAt', 'deletedAt');
        }
        if (!db.objectStoreNames.contains('pdfs')) {
          const pdfStore = db.createObjectStore('pdfs', { keyPath: 'id' });
          pdfStore.createIndex('by-createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export const StorageService = {
  // PHOTOS
  async getAllPhotos(): Promise<PhotoItem[]> {
    const db = await getDB();
    const photos = await db.getAllFromIndex('photos', 'by-createdAt');
    return photos.reverse(); // newest first
  },

  async savePhoto(photo: PhotoItem): Promise<void> {
    const db = await getDB();
    await db.put('photos', photo);
  },

  async savePhotos(photos: PhotoItem[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('photos', 'readwrite');
    for (const photo of photos) {
      await tx.store.put(photo);
    }
    await tx.done;
  },

  // BIN & TRASH (30-day retention)
  async moveToBin(photo: PhotoItem): Promise<BinItem> {
    const db = await getDB();
    const now = Date.now();
    const binItem: BinItem = {
      id: 'bin_' + photo.id + '_' + now,
      originalId: photo.id,
      photo,
      deletedAt: now,
      expiresAt: now + THIRTY_DAYS_MS,
    };

    const tx = db.transaction(['photos', 'bin'], 'readwrite');
    await tx.objectStore('photos').delete(photo.id);
    await tx.objectStore('bin').put(binItem);
    await tx.done;

    return binItem;
  },

  async batchMoveToBin(photos: PhotoItem[]): Promise<BinItem[]> {
    const db = await getDB();
    const now = Date.now();
    const binItems: BinItem[] = [];

    const tx = db.transaction(['photos', 'bin'], 'readwrite');
    for (const photo of photos) {
      const binItem: BinItem = {
        id: 'bin_' + photo.id + '_' + now + '_' + Math.random().toString(36).substring(2, 6),
        originalId: photo.id,
        photo,
        deletedAt: now,
        expiresAt: now + THIRTY_DAYS_MS,
      };
      await tx.objectStore('photos').delete(photo.id);
      await tx.objectStore('bin').put(binItem);
      binItems.push(binItem);
    }
    await tx.done;
    return binItems;
  },

  async getAllBinItems(): Promise<BinItem[]> {
    const db = await getDB();
    // Auto prune items older than 30 days
    const now = Date.now();
    const all = await db.getAllFromIndex('bin', 'by-deletedAt');
    
    const expiredIds: string[] = [];
    const valid: BinItem[] = [];

    for (const item of all) {
      if (item.expiresAt <= now) {
        expiredIds.push(item.id);
      } else {
        valid.push(item);
      }
    }

    if (expiredIds.length > 0) {
      const tx = db.transaction('bin', 'readwrite');
      for (const id of expiredIds) {
        await tx.store.delete(id);
      }
      await tx.done;
    }

    return valid.reverse();
  },

  async restoreFromBin(binItem: BinItem): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['photos', 'bin'], 'readwrite');
    await tx.objectStore('photos').put(binItem.photo);
    await tx.objectStore('bin').delete(binItem.id);
    await tx.done;
  },

  async restoreMultipleFromBin(binItems: BinItem[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['photos', 'bin'], 'readwrite');
    for (const item of binItems) {
      await tx.objectStore('photos').put(item.photo);
      await tx.objectStore('bin').delete(item.id);
    }
    await tx.done;
  },

  async deletePermanently(binItemId: string): Promise<void> {
    const db = await getDB();
    await db.delete('bin', binItemId);
  },

  async emptyBin(): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('bin', 'readwrite');
    const count = await tx.store.count();
    await tx.store.clear();
    await tx.done;
    return count;
  },

  // PDF DOCUMENTS
  async getAllPDFs(): Promise<PDFDocumentItem[]> {
    const db = await getDB();
    const pdfs = await db.getAllFromIndex('pdfs', 'by-createdAt');
    return pdfs.reverse();
  },

  async savePDF(pdf: PDFDocumentItem): Promise<void> {
    const db = await getDB();
    await db.put('pdfs', pdf);
  },

  async deletePDF(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('pdfs', id);
  },
};
