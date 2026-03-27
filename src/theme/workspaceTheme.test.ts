import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSPACE_THEME_SEEDS,
  SEMANTIC_TOKENS,
  THEME_STORAGE_KEYS,
  WORKSPACE_THEME_SETTINGS_KEY,
  buildCssVariableEntries,
  createResolvedThemeCache,
  generateWorkspaceTheme,
  isResolvedWorkspaceThemeCache,
  sanitizeSeeds,
} from "./workspaceTheme";

describe("workspaceTheme", () => {
  it("keeps the editable seed contract fixed at four colors", () => {
    expect(Object.keys(DEFAULT_WORKSPACE_THEME_SEEDS).sort()).toEqual([
      "accent",
      "neutralBase",
      "primary",
      "surfaceTint",
    ]);
  });

  it("generates every semantic token for light and dark modes", () => {
    const resolved = generateWorkspaceTheme();

    for (const mode of ["light", "dark"] as const) {
      for (const token of SEMANTIC_TOKENS) {
        expect(resolved[mode][token]).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("sanitizes invalid input back to defaults", () => {
    expect(
      sanitizeSeeds({
        primary: "zzz",
        accent: "#abc",
      }),
    ).toEqual({
      primary: DEFAULT_WORKSPACE_THEME_SEEDS.primary,
      accent: "#AABBCC",
      surfaceTint: DEFAULT_WORKSPACE_THEME_SEEDS.surfaceTint,
      neutralBase: DEFAULT_WORKSPACE_THEME_SEEDS.neutralBase,
    });
  });

  it("builds stable css variable entries for a resolved mode", () => {
    const entries = buildCssVariableEntries(generateWorkspaceTheme().light);

    expect(entries).toHaveLength(SEMANTIC_TOKENS.length);
    expect(entries[0]?.[0]).toBe("--theme-bg-page");
    expect(entries.every(([name, value]) => name.startsWith("--theme-") && /^#[0-9A-F]{6}$/.test(value))).toBe(true);
  });

  it("creates and validates cache payloads", () => {
    const cache = createResolvedThemeCache(DEFAULT_WORKSPACE_THEME_SEEDS, "2026-03-27T00:00:00.000Z");

    expect(cache.seeds).toEqual(DEFAULT_WORKSPACE_THEME_SEEDS);
    expect(isResolvedWorkspaceThemeCache(cache)).toBe(true);
    expect(isResolvedWorkspaceThemeCache({})).toBe(false);
  });

  it("keeps storage keys stable", () => {
    expect(WORKSPACE_THEME_SETTINGS_KEY).toBe("workspace-theme-v1");
    expect(THEME_STORAGE_KEYS).toEqual({
      settings: "workspace-theme-settings-v1",
      resolvedCache: "workspace-theme-cache-v1",
      modePreference: "workspace-theme-mode-v1",
    });
  });
});
