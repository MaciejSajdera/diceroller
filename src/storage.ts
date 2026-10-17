import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'kosci:v1:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** useState zapisywany w localStorage (z odpornością na brak/uszkodzenie danych). */
export function usePersistentState<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* brak miejsca / tryb prywatny — ignorujemy */
    }
  }, [key, value]);
  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), []);
  return [value, set];
}
