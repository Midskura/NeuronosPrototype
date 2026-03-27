import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyResolvedThemeMock,
  readCachedThemeMock,
  readThemeModePreferenceMock,
  resolveThemeModeMock,
  getWorkspaceThemeSettingsMock,
} = vi.hoisted(() => ({
  applyResolvedThemeMock: vi.fn(),
  readCachedThemeMock: vi.fn(),
  readThemeModePreferenceMock: vi.fn(),
  resolveThemeModeMock: vi.fn(),
  getWorkspaceThemeSettingsMock: vi.fn(),
}));

vi.mock("./themeBootstrap", () => ({
  applyResolvedTheme: applyResolvedThemeMock,
  readCachedTheme: readCachedThemeMock,
  readThemeModePreference: readThemeModePreferenceMock,
  resolveThemeMode: resolveThemeModeMock,
}));

vi.mock("./themeSettings", () => ({
  getWorkspaceThemeSettings: getWorkspaceThemeSettingsMock,
}));

import { syncWorkspaceTheme } from "./useWorkspaceTheme";
import { THEME_STORAGE_KEYS, createResolvedThemeCache } from "./workspaceTheme";

function createStorageMock() {
  const values = new Map<string, string>();
  const setItem = vi.fn((key: string, value: string) => {
    values.set(key, value);
  });

  return {
    values,
    storage: {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem,
      removeItem: vi.fn((key: string) => {
        values.delete(key);
      }),
      clear: vi.fn(() => values.clear()),
      key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
      get length() {
        return values.size;
      },
    } satisfies Storage,
    setItem,
  };
}

describe("syncWorkspaceTheme", () => {
  beforeEach(() => {
    applyResolvedThemeMock.mockReset();
    readCachedThemeMock.mockReset();
    readThemeModePreferenceMock.mockReset();
    resolveThemeModeMock.mockReset();
    getWorkspaceThemeSettingsMock.mockReset();
  });

  it("writes a refreshed cache and reapplies the resolved theme when settings change", async () => {
    const { storage, values, setItem } = createStorageMock();
    const fetchedSettings = {
      version: 1,
      seeds: {
        primary: "#335577",
        accent: "#884422",
        surfaceTint: "#DDEEFF",
        neutralBase: "#667788",
      },
      updatedAt: "2026-03-27T03:00:00.000Z",
    };
    const expectedCache = createResolvedThemeCache(fetchedSettings.seeds, fetchedSettings.updatedAt);

    readCachedThemeMock.mockReturnValue(null);
    readThemeModePreferenceMock.mockReturnValue("system");
    resolveThemeModeMock.mockReturnValue("dark");
    getWorkspaceThemeSettingsMock.mockResolvedValue(fetchedSettings);

    const result = await syncWorkspaceTheme({ storage });

    expect(result).toEqual({
      updated: true,
      cache: expectedCache,
    });
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEYS.resolvedCache, JSON.stringify(expectedCache));
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEYS.settings, JSON.stringify(fetchedSettings));
    expect(values.get(THEME_STORAGE_KEYS.resolvedCache)).toBe(JSON.stringify(expectedCache));
    expect(applyResolvedThemeMock).toHaveBeenCalledWith(expectedCache, "dark");
  });

  it("skips cache writes and reapply when the fetched payload matches the cached theme", async () => {
    const { storage, setItem } = createStorageMock();
    const cachedTheme = createResolvedThemeCache(
      {
        primary: "#335577",
        accent: "#884422",
        surfaceTint: "#DDEEFF",
        neutralBase: "#667788",
      },
      "2026-03-27T03:00:00.000Z",
    );

    readCachedThemeMock.mockReturnValue(cachedTheme);
    getWorkspaceThemeSettingsMock.mockResolvedValue({
      version: 1,
      seeds: cachedTheme.seeds,
      updatedAt: cachedTheme.updatedAt,
    });

    const result = await syncWorkspaceTheme({ storage });

    expect(result).toEqual({
      updated: false,
      cache: cachedTheme,
    });
    expect(setItem).not.toHaveBeenCalled();
    expect(applyResolvedThemeMock).not.toHaveBeenCalled();
  });

  it("does not overwrite the cache when fetching latest settings fails", async () => {
    const { storage, setItem } = createStorageMock();
    const cachedTheme = createResolvedThemeCache(
      {
        primary: "#445566",
        accent: "#775544",
        surfaceTint: "#E6EEF2",
        neutralBase: "#6A7570",
      },
      "2026-03-27T02:00:00.000Z",
    );

    readCachedThemeMock.mockReturnValue(cachedTheme);
    getWorkspaceThemeSettingsMock.mockRejectedValue(new Error("network down"));

    const result = await syncWorkspaceTheme({ storage });

    expect(result.updated).toBe(false);
    expect(result.cache).toEqual(cachedTheme);
    expect(result.error?.message).toBe("network down");
    expect(setItem).not.toHaveBeenCalled();
    expect(applyResolvedThemeMock).not.toHaveBeenCalled();
  });
});
