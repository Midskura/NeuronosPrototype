import {
  applyResolvedTheme,
  readCachedTheme,
  readThemeModePreference,
  resolveThemeMode,
} from "./themeBootstrap";
import { THEME_STORAGE_KEYS, ThemeModePreference, WorkspaceThemeMode } from "./workspaceTheme";

function getRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  return document.documentElement;
}

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return null;
}

function applyModeClass(mode: WorkspaceThemeMode): void {
  const root = getRoot();
  if (!root) {
    return;
  }

  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function getThemeModePreference(storageKey: string = THEME_STORAGE_KEYS.modePreference): ThemeModePreference {
  return readThemeModePreference(storageKey);
}

export function setThemeModePreference(
  preference: ThemeModePreference,
  options?: {
    modeKey?: string;
    cacheKey?: string;
    storage?: Storage | null;
  },
): WorkspaceThemeMode {
  const modeKey = options?.modeKey ?? THEME_STORAGE_KEYS.modePreference;
  const cacheKey = options?.cacheKey ?? THEME_STORAGE_KEYS.resolvedCache;
  const storage = options?.storage ?? getLocalStorage();

  if (storage) {
    storage.setItem(modeKey, preference);
  }

  const mode = resolveThemeMode(preference);
  applyModeClass(mode);

  const cache = readCachedTheme(cacheKey);
  if (cache) {
    applyResolvedTheme(cache, mode);
  }

  return mode;
}
