import { beforeEach, describe, expect, it } from "vitest";

import { createResolvedThemeCache } from "./workspaceTheme";
import { applyResolvedTheme, bootstrapTheme, readCachedTheme, readThemeModePreference } from "./themeBootstrap";

function createRootStub() {
  const values = new Map<string, string>();
  const classes = new Set<string>();

  return {
    style: {
      setProperty: (name: string, value: string) => {
        values.set(name, value);
      },
      getPropertyValue: (name: string) => values.get(name) ?? "",
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      contains: (name: string) => classes.has(name),
    },
  };
}

function createStorageStub(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

describe("themeBootstrap", () => {
  beforeEach(() => {
    const root = createRootStub();
    const storage = createStorageStub();

    Object.defineProperty(globalThis, "document", {
      value: { documentElement: root },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: storage,
        matchMedia: (query: string) => ({
          media: query,
          matches: false,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      },
      configurable: true,
      writable: true,
    });
  });

  it("applies css variables and dark class for a resolved cache", () => {
    const cache = createResolvedThemeCache();

    applyResolvedTheme(cache, "dark");

    expect(document.documentElement.style.getPropertyValue("--theme-bg-page")).toMatch(/^#[0-9A-F]{6}$/);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads theme mode preference safely", () => {
    localStorage.setItem("workspace-theme-mode-v1", "dark");
    expect(readThemeModePreference()).toBe("dark");

    localStorage.setItem("workspace-theme-mode-v1", "invalid");
    expect(readThemeModePreference()).toBe("system");
  });

  it("returns null for malformed cached theme payloads", () => {
    localStorage.setItem("workspace-theme-cache-v1", "{bad json");
    expect(readCachedTheme()).toBeNull();

    localStorage.setItem("workspace-theme-cache-v1", JSON.stringify({ hello: "world" }));
    expect(readCachedTheme()).toBeNull();
  });

  it("bootstraps from cache using system preference", () => {
    const cache = createResolvedThemeCache();
    localStorage.setItem("workspace-theme-cache-v1", JSON.stringify(cache));
    localStorage.setItem("workspace-theme-mode-v1", "system");

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage,
        matchMedia: () => ({
          media: "(prefers-color-scheme: dark)",
          matches: true,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }),
      },
      configurable: true,
      writable: true,
    });

    expect(bootstrapTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--theme-action-primary-bg")).toBe(
      cache.resolved.dark["action.primary.bg"],
    );
  });
});
