/**
 * Safe storage implementation with in-memory fallback.
 * Needed for Safari Private Mode, which blocks localStorage silently.
 */

const memoryStorage: Record<string, string> = {};

const safeStorage: Storage = {
  get length() {
    try {
      return localStorage.length;
    } catch {
      return Object.keys(memoryStorage).length;
    }
  },
  key(index: number): string | null {
    try {
      return localStorage.key(index);
    } catch {
      return Object.keys(memoryStorage)[index] ?? null;
    }
  },
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage[key] ?? null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStorage[key] = value;
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStorage[key];
    }
  },
  clear(): void {
    try {
      localStorage.clear();
    } catch {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    }
  },
};

export default safeStorage;
