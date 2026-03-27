import { beforeEach, describe, expect, it, vi } from "vitest";

const { maybeSingleMock, eqMock, selectMock, upsertMock, fromMock } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn((table: string) => {
    if (table !== "settings") {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select,
      upsert,
    };
  });

  return {
    maybeSingleMock: maybeSingle,
    eqMock: eq,
    selectMock: select,
    upsertMock: upsert,
    fromMock: from,
  };
});

vi.mock("../utils/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

import { getWorkspaceThemeSettings, saveWorkspaceThemeSettings } from "./themeSettings";
import { DEFAULT_WORKSPACE_THEME_SEEDS, WORKSPACE_THEME_SETTINGS_KEY } from "./workspaceTheme";

describe("themeSettings", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
    eqMock.mockClear();
    selectMock.mockClear();
    upsertMock.mockReset();
    fromMock.mockClear();
  });

  it("returns default settings when no row exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    await expect(getWorkspaceThemeSettings()).resolves.toEqual({
      version: 1,
      seeds: DEFAULT_WORKSPACE_THEME_SEEDS,
      updatedAt: null,
    });

    expect(eqMock).toHaveBeenCalledWith("key", WORKSPACE_THEME_SETTINGS_KEY);
  });

  it("normalizes stored nested payloads", async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        value: {
          version: 1,
          seeds: {
            primary: "#335577",
            accent: "#884422",
            surfaceTint: "#DDEEFF",
            neutralBase: "#667788",
          },
        },
        updated_at: "2026-03-27T01:00:00.000Z",
      },
      error: null,
    });

    await expect(getWorkspaceThemeSettings()).resolves.toEqual({
      version: 1,
      seeds: {
        primary: "#335577",
        accent: "#884422",
        surfaceTint: "#DDEEFF",
        neutralBase: "#667788",
      },
      updatedAt: "2026-03-27T01:00:00.000Z",
    });
  });

  it("throws when the settings query fails", async () => {
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });

    await expect(getWorkspaceThemeSettings()).rejects.toThrow(
      "Failed to fetch workspace theme settings: database unavailable",
    );
  });

  it("upserts the workspace theme row with a versioned payload", async () => {
    upsertMock.mockResolvedValue({ error: null });

    const saved = await saveWorkspaceThemeSettings({
      primary: "#112233",
      accent: "#445566",
      surfaceTint: "#DDEEFF",
      neutralBase: "#778899",
    });

    expect(saved.version).toBe(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock.mock.calls[0]?.[0]).toMatchObject({
      key: WORKSPACE_THEME_SETTINGS_KEY,
      value: {
        version: 1,
        seeds: {
          primary: "#112233",
          accent: "#445566",
          surfaceTint: "#DDEEFF",
          neutralBase: "#778899",
        },
      },
    });
    expect(upsertMock.mock.calls[0]?.[1]).toEqual({ onConflict: "key" });
  });
});
