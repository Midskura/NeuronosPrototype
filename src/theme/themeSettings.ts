import { supabase } from "../utils/supabase/client";
import {
  DEFAULT_WORKSPACE_THEME_SEEDS,
  WORKSPACE_THEME_SETTINGS_KEY,
  WORKSPACE_THEME_VERSION,
  WorkspaceThemeSettings,
  WorkspaceThemeSeeds,
  sanitizeSeeds,
} from "./workspaceTheme";

type StoredThemeValue =
  | WorkspaceThemeSeeds
  | {
      version?: number;
      seeds?: Partial<WorkspaceThemeSeeds>;
    };

function hasSeedFields(value: object): boolean {
  return "primary" in value || "accent" in value || "surfaceTint" in value || "neutralBase" in value;
}

function normalizeStoredValue(value: StoredThemeValue | null | undefined): WorkspaceThemeSeeds {
  if (!value || typeof value !== "object") {
    return DEFAULT_WORKSPACE_THEME_SEEDS;
  }

  if ("seeds" in value) {
    return sanitizeSeeds(value.seeds ?? null);
  }

  return hasSeedFields(value) ? sanitizeSeeds(value as Partial<WorkspaceThemeSeeds>) : DEFAULT_WORKSPACE_THEME_SEEDS;
}

export async function getWorkspaceThemeSettings(): Promise<WorkspaceThemeSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("value, updated_at")
    .eq("key", WORKSPACE_THEME_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch workspace theme settings: ${error.message}`);
  }

  return {
    version: WORKSPACE_THEME_VERSION,
    seeds: normalizeStoredValue((data?.value as StoredThemeValue | undefined) ?? null),
    updatedAt: data?.updated_at ?? null,
  };
}

export async function saveWorkspaceThemeSettings(seeds: WorkspaceThemeSeeds): Promise<WorkspaceThemeSettings> {
  const sanitizedSeeds = sanitizeSeeds(seeds);
  const updatedAt = new Date().toISOString();

  const { error } = await supabase.from("settings").upsert(
    {
      key: WORKSPACE_THEME_SETTINGS_KEY,
      value: {
        version: WORKSPACE_THEME_VERSION,
        seeds: sanitizedSeeds,
      },
      updated_at: updatedAt,
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Failed to save workspace theme settings: ${error.message}`);
  }

  return {
    version: WORKSPACE_THEME_VERSION,
    seeds: sanitizedSeeds,
    updatedAt,
  };
}
