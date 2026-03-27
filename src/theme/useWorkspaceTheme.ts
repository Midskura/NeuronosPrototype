import { useEffect } from "react";
import {
  applyResolvedTheme,
  readCachedTheme,
  readThemeModePreference,
  resolveThemeMode,
} from "./themeBootstrap";
import { getWorkspaceThemeSettings } from "./themeSettings";
import {
  ResolvedWorkspaceThemeCache,
  ThemeModePreference,
  THEME_STORAGE_KEYS,
  WorkspaceThemeSettings,
  WorkspaceThemeMode,
  createResolvedThemeCache,
} from "./workspaceTheme";

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return null;
}

function serializeCache(cache: ResolvedWorkspaceThemeCache): string {
  return JSON.stringify(cache);
}

function areThemeCachesEqual(
  currentCache: ResolvedWorkspaceThemeCache | null,
  nextCache: ResolvedWorkspaceThemeCache,
): boolean {
  return currentCache !== null && serializeCache(currentCache) === serializeCache(nextCache);
}

export interface WorkspaceThemeSyncResult {
  updated: boolean;
  cache: ResolvedWorkspaceThemeCache | null;
  error?: Error;
}

export async function syncWorkspaceTheme(options?: {
  cacheKey?: string;
  modeKey?: string;
  settingsKey?: string;
  fetchSettings?: () => Promise<WorkspaceThemeSettings>;
  readCached?: (storageKey?: string) => ResolvedWorkspaceThemeCache | null;
  readPreference?: (storageKey?: string) => ThemeModePreference;
  resolveMode?: (preference: ThemeModePreference) => WorkspaceThemeMode;
  applyTheme?: (cache: ResolvedWorkspaceThemeCache, mode: WorkspaceThemeMode) => void;
  storage?: Storage | null;
}): Promise<WorkspaceThemeSyncResult> {
  const cacheKey = options?.cacheKey ?? THEME_STORAGE_KEYS.resolvedCache;
  const modeKey = options?.modeKey ?? THEME_STORAGE_KEYS.modePreference;
  const settingsKey = options?.settingsKey ?? THEME_STORAGE_KEYS.settings;
  const fetchSettings = options?.fetchSettings ?? getWorkspaceThemeSettings;
  const readCached = options?.readCached ?? readCachedTheme;
  const readPreference = options?.readPreference ?? readThemeModePreference;
  const resolveMode = options?.resolveMode ?? resolveThemeMode;
  const applyTheme = options?.applyTheme ?? applyResolvedTheme;
  const storage = options?.storage ?? getLocalStorage();
  const currentCache = readCached(cacheKey);

  try {
    const settings = await fetchSettings();
    const nextCache = createResolvedThemeCache(settings.seeds, settings.updatedAt);

    if (areThemeCachesEqual(currentCache, nextCache)) {
      return {
        updated: false,
        cache: currentCache,
      };
    }

    if (storage) {
      storage.setItem(cacheKey, serializeCache(nextCache));
      storage.setItem(settingsKey, JSON.stringify(settings));
    }

    applyTheme(nextCache, resolveMode(readPreference(modeKey)));

    return {
      updated: true,
      cache: nextCache,
    };
  } catch (error) {
    return {
      updated: false,
      cache: currentCache,
      error: error instanceof Error ? error : new Error("Failed to sync workspace theme"),
    };
  }
}

export function useWorkspaceTheme(): void {
  useEffect(() => {
    void syncWorkspaceTheme();
  }, []);
}
