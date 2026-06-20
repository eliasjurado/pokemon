export class StorageService {
  getItem(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Failed to save ${key} to localStorage`);
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`Failed to remove ${key} from localStorage`);
    }
  }
}
