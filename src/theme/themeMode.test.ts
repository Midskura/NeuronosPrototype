import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyResolvedThemeMock,
  readCachedThemeMock,
  readThemeModePreferenceMock,
  resolveThemeModeMock,
} = vi.hoisted(() => ({
  applyResolvedThemeMock: vi.fn(),
  readCachedThemeMock: vi.fn(),
  readThemeModePreferenceMock: vi.fn(),
  resolveThemeModeMock: vi.fn(),
}));

vi.mock("./themeBootstrap", () => ({
  applyResolvedTheme: applyResolvedThemeMock,
  readCachedTheme: readCachedThemeMock,
  readThemeModePreference: readThemeModePreferenceMock,
  resolveThemeMode: resolveThemeModeMock,
}));

import { getThemeModePreference, setThemeModePreference } from "./themeMode";
import { THEME_STORAGE_KEYS, createResolvedThemeCache } from "./workspaceTheme";

function createRootStub() {
  const classes = new Set<string>();

  return {
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name),
    },
  };
}

function createStorageStub(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => {
      values.clear();
    },
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe("themeMode", () => {
  beforeEach(() => {
    applyResolvedThemeMock.mockReset();
    readCachedThemeMock.mockReset();
    readThemeModePreferenceMock.mockReset();
    resolveThemeModeMock.mockReset();

    Object.defineProperty(globalThis, "document", {
      value: { documentElement: createRootStub() },
      configurable: true,
      writable: true,
    });
  });

  it("reads the stored preference through the bootstrap reader", () => {
    readThemeModePreferenceMock.mockReturnValue("dark");

    expect(getThemeModePreference()).toBe("dark");
    expect(readThemeModePreferenceMock).toHaveBeenCalledWith(THEME_STORAGE_KEYS.modePreference);
  });

  it("persists and applies an explicit preference", () => {
    const storage = createStorageStub();
    const cache = createResolvedThemeCache();
    readCachedThemeMock.mockReturnValue(cache);
    resolveThemeModeMock.mockReturnValue("dark");

    const mode = setThemeModePreference("dark", { storage });

    expect(mode).toBe("dark");
    expect(storage.getItem(THEME_STORAGE_KEYS.modePreference)).toBe("dark");
    expect(resolveThemeModeMock).toHaveBeenCalledWith("dark");
    expect(readCachedThemeMock).toHaveBeenCalledWith(THEME_STORAGE_KEYS.resolvedCache);
    expect(applyResolvedThemeMock).toHaveBeenCalledWith(cache, "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("resolves and applies system mode without a cached theme", () => {
    const storage = createStorageStub();
    readCachedThemeMock.mockReturnValue(null);
    resolveThemeModeMock.mockReturnValue("light");

    const mode = setThemeModePreference("system", { storage });

    expect(mode).toBe("light");
    expect(storage.getItem(THEME_STORAGE_KEYS.modePreference)).toBe("system");
    expect(resolveThemeModeMock).toHaveBeenCalledWith("system");
    expect(applyResolvedThemeMock).not.toHaveBeenCalled();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
