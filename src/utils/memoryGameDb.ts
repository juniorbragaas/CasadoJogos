import {
  createDefaultParticipants,
  MemoryFigure,
  MemoryParticipant,
  sanitizeParticipantName,
} from './memoryGameEngine';

const PARTICIPANTS_STORAGE_KEY = 'brinque_memory_participants_v1';
const INCLUDE_BUILTINS_KEY = 'brinque_memory_include_builtins_v1';

const DB_NAME = 'brinque_memory_figures_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_figures';

interface StoredMemoryFigureRecord {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: number;
}

export function loadMemoryParticipants(): MemoryParticipant[] {
  if (typeof window === 'undefined') return createDefaultParticipants();
  try {
    const raw = window.localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (!raw) return createDefaultParticipants();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createDefaultParticipants();
    }
    const valid = parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({
        id: item.id as string,
        name: sanitizeParticipantName(item.name as string) || 'Jogador',
        score: 0,
      }));
    return valid.length > 0 ? valid : createDefaultParticipants();
  } catch {
    return createDefaultParticipants();
  }
}

export function saveMemoryParticipants(
  participants: readonly MemoryParticipant[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = participants.map(({ id, name }) => ({ id, name }));
    window.localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadIncludeBuiltinsPref(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(INCLUDE_BUILTINS_KEY);
    if (raw === null) return true;
    return raw !== 'false';
  } catch {
    return true;
  }
}

export function saveIncludeBuiltinsPref(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INCLUDE_BUILTINS_KEY, value ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openMemoryFiguresDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Erro ao abrir IndexedDB de figuras.'));
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`Falha ao ler ${file.name}.`));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error(`Falha ao ler ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function cleanFileTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const spaced = withoutExt.replace(/[_-]+/g, ' ').trim();
  return spaced.slice(0, 32) || 'Figura';
}

export async function loadCustomMemoryFigures(): Promise<MemoryFigure[]> {
  if (!isIndexedDbAvailable()) return [];
  try {
    const db = await openMemoryFiguresDb();
    return await new Promise<MemoryFigure[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const records = ((req.result ?? []) as StoredMemoryFigureRecord[]).sort(
          (a, b) => a.createdAt - b.createdAt
        );
        resolve(
          records.map((rec) => ({
            id: rec.id,
            name: rec.name,
            kind: 'custom' as const,
            imageUrl: rec.imageUrl,
          }))
        );
      };
      req.onerror = () =>
        reject(req.error ?? new Error('Erro ao carregar figuras salvas.'));
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function addCustomMemoryFigures(
  files: File[]
): Promise<MemoryFigure[]> {
  const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
  const now = Date.now();

  const newRecords: StoredMemoryFigureRecord[] = files.map((file, idx) => ({
    id: `custom-${now}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanFileTitle(file.name),
    imageUrl: dataUrls[idx],
    createdAt: now + idx,
  }));

  if (isIndexedDbAvailable()) {
    const db = await openMemoryFiguresDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of newRecords) {
        store.put(rec);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error('Erro ao salvar novas figuras.'));
      };
    });
  }

  return newRecords.map((rec) => ({
    id: rec.id,
    name: rec.name,
    kind: 'custom' as const,
    imageUrl: rec.imageUrl,
  }));
}

export async function deleteCustomMemoryFigure(figureId: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openMemoryFiguresDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(figureId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Erro ao excluir figura.'));
    };
  });
}

export async function clearCustomMemoryFigures(): Promise<void> {
  if (!isIndexedDbAvailable()) return;
  const db = await openMemoryFiguresDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Erro ao limpar figuras.'));
    };
  });
}
