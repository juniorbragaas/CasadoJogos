import { BKS_DECK_SIZE, sortUploadedCardFiles } from './bksDeckEngine';

const DB_NAME = 'brinque_bks_deck_db';
const DB_VERSION = 1;
const STORE_NAME = 'bks_images';

interface StoredImageRecord {
  key: string;
  dataUrl: string;
  fileName: string;
  updatedAt: number;
}

export interface BksCustomDeckStorage {
  customBack: string | null;
  customBackName: string | null;
  customFronts: Record<number, string>;
  customFrontCount: number;
}

export const EMPTY_BKS_STORAGE: BksCustomDeckStorage = {
  customBack: null,
  customBackName: null,
  customFronts: {},
  customFrontCount: 0,
};

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openBksDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Erro ao abrir banco IndexedDB.'));
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`Falha ao ler o arquivo ${file.name}.`));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error(`Falha ao ler o arquivo ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export async function loadBksCustomImages(): Promise<BksCustomDeckStorage> {
  if (!isIndexedDbAvailable()) return { ...EMPTY_BKS_STORAGE, customFronts: {} };

  try {
    const db = await openBksDb();
    return await new Promise<BksCustomDeckStorage>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result ?? []) as StoredImageRecord[];
        let customBack: string | null = null;
        let customBackName: string | null = null;
        const customFronts: Record<number, string> = {};

        for (const rec of records) {
          if (rec.key === 'back' && typeof rec.dataUrl === 'string') {
            customBack = rec.dataUrl;
            customBackName = rec.fileName ?? null;
          } else if (rec.key.startsWith('card-')) {
            const id = Number.parseInt(rec.key.slice('card-'.length), 10);
            if (id >= 1 && id <= BKS_DECK_SIZE && typeof rec.dataUrl === 'string') {
              customFronts[id] = rec.dataUrl;
            }
          }
        }

        resolve({
          customBack,
          customBackName,
          customFronts,
          customFrontCount: Object.keys(customFronts).length,
        });
      };

      req.onerror = () =>
        reject(req.error ?? new Error('Erro ao ler imagens salvas.'));
      tx.oncomplete = () => db.close();
    });
  } catch {
    return { ...EMPTY_BKS_STORAGE, customFronts: {} };
  }
}

export async function saveBksBackImage(
  file: File
): Promise<{ dataUrl: string; fileName: string }> {
  const dataUrl = await fileToDataUrl(file);
  const record: StoredImageRecord = {
    key: 'back',
    dataUrl,
    fileName: file.name,
    updatedAt: Date.now(),
  };

  if (isIndexedDbAvailable()) {
    const db = await openBksDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Erro ao salvar imagem de verso.'));
      };
    });
  }

  return { dataUrl, fileName: file.name };
}

export async function saveBksFrontImages(
  files: File[]
): Promise<Record<number, string>> {
  const sorted = sortUploadedCardFiles(files).slice(0, BKS_DECK_SIZE);
  const dataUrls = await Promise.all(sorted.map((file) => fileToDataUrl(file)));

  const now = Date.now();
  const records: StoredImageRecord[] = sorted.map((file, idx) => ({
    key: `card-${idx + 1}`,
    dataUrl: dataUrls[idx],
    fileName: file.name,
    updatedAt: now,
  }));

  const frontMap: Record<number, string> = {};
  records.forEach((rec, idx) => {
    frontMap[idx + 1] = rec.dataUrl;
  });

  if (isIndexedDbAvailable()) {
    const db = await openBksDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // Clear previous custom fronts before storing the new batch so partial uploads stay clean
      for (let i = 1; i <= BKS_DECK_SIZE; i++) {
        store.delete(`card-${i}`);
      }
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Erro ao salvar imagens das cartas.'));
      };
    });
  }

  return frontMap;
}

export async function clearBksCustomImages(): Promise<void> {
  if (!isIndexedDbAvailable()) return;

  const db = await openBksDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Erro ao limpar imagens salvas.'));
    };
  });
}
