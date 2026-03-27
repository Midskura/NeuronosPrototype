# Workspace Theme Tokens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add workspace-wide customizable color seeds that generate light and dark semantic token maps, apply cached CSS variables before React mounts, and let each user choose only `light | dark | system`.

**Architecture:** Reuse the existing `settings` KV table for a `workspace-theme-v1` document instead of adding a new table. Add a small theme domain in `src/theme/` that defines the seed contract, generates semantic tokens for light/dark, caches the resolved theme locally, and applies CSS variables during startup before `App` renders.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Supabase JS, CSS custom properties in `src/styles/globals.css`

---

### Task 0: Inventory Hardcoded Colors and Define the Replacement Map

**Files:**
- Create: `docs/plans/2026-03-27-theme-color-migration-map.md`
- Reference: `src/styles/globals.css`
- Reference: `src/components/inbox/ticketingTheme.ts`

**Step 1: Audit the current hardcoded color usage**

Run ripgrep across `src/` for:
- hex colors
- `rgb(...)` / `rgba(...)`
- inline color objects in local theme maps

Group findings into:
- repeated brand colors
- repeated semantic colors
- local component theme maps
- one-off literals

**Step 2: Build the replacement map**

Create `docs/plans/2026-03-27-theme-color-migration-map.md` with:
- top repeated literals
- proposed semantic token replacement
- whether each should be collapsed, preserved, or deleted
- first migration slices in priority order

**Step 3: Verify the map is implementation-ready**

The document is done only if:
- each repeated literal has a target semantic token
- first migration slices are listed by surface
- status colors remain system-controlled, not admin-editable

**Step 4: Commit**

```bash
git add docs/plans/2026-03-27-theme-color-migration-map.md
git commit -m "docs: map hardcoded colors to workspace theme tokens"
```

### Task 1: Define the Workspace Theme Contract and Token Generator

**Files:**
- Create: `src/theme/workspaceTheme.ts`
- Create: `src/theme/workspaceTheme.test.ts`
- Modify: `src/styles/globals.css`

**Step 1: Write the failing test**

Create `src/theme/workspaceTheme.test.ts` with tests that prove:
- `generateWorkspaceTheme()` accepts exactly four editable seeds: `primary`, `accent`, `surfaceTint`, `neutralBase`
- it returns both `light` and `dark` maps
- required semantic keys exist in both modes
- status colors are not user-editable inputs

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/theme/workspaceTheme.test.ts`
Expected: FAIL because `src/theme/workspaceTheme.ts` does not exist yet

**Step 3: Write minimal implementation**

Create `src/theme/workspaceTheme.ts` with:
- `WorkspaceThemeSeeds`
- `WorkspaceThemeMode = "light" | "dark"`
- `ResolvedWorkspaceTheme`
- `DEFAULT_WORKSPACE_THEME_SEEDS`
- `generateWorkspaceTheme(seeds)`
- `THEME_STORAGE_KEYS` constants for cache + mode preference

Generate the first semantic set for the keys the app already uses most:
- page/background
- card/surface
- text primary/muted/inverse
- border default/subtle/strong
- primary action bg/text/border
- accent bg/text/border
- selected/hover/focus/ring

Map the generated semantic keys to CSS variables already present in `globals.css` where possible, and add any missing theme-specific custom properties in one place near the existing Neuron tokens.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/theme/workspaceTheme.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/workspaceTheme.ts src/theme/workspaceTheme.test.ts src/styles/globals.css
git commit -m "feat: add workspace theme token generator"
```

### Task 2: Add Theme Persistence API on Top of Existing `settings` KV Storage

**Files:**
- Create: `src/theme/themeSettings.ts`
- Create: `src/theme/themeSettings.test.ts`
- Reference: `src/utils/accounting-api.ts`

**Step 1: Write the failing test**

Create `src/theme/themeSettings.test.ts` covering:
- fetch returns default seeds when `workspace-theme-v1` is absent
- save upserts the `settings` row with the correct key
- returned payload shape is `{ version, seeds, updatedAt? }`

Mock Supabase in the same style already used for utility tests in `src/utils/*.test.ts`.

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/theme/themeSettings.test.ts`
Expected: FAIL because `themeSettings.ts` does not exist yet

**Step 3: Write minimal implementation**

Create `src/theme/themeSettings.ts` with:
- `getWorkspaceThemeSettings()`
- `saveWorkspaceThemeSettings()`
- hardcoded row key: `workspace-theme-v1`

Follow the same Supabase `settings` access pattern used in `src/utils/accounting-api.ts`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/theme/themeSettings.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/themeSettings.ts src/theme/themeSettings.test.ts
git commit -m "feat: add workspace theme settings persistence"
```

### Task 3: Add Startup Bootstrap to Apply Cached Theme Before React Mount

**Files:**
- Create: `src/theme/themeBootstrap.ts`
- Create: `src/theme/themeBootstrap.test.ts`
- Modify: `src/main.tsx`

**Step 1: Write the failing test**

Create `src/theme/themeBootstrap.test.ts` covering:
- cached resolved theme is applied to `document.documentElement`
- mode preference applies `dark` class correctly for `light`, `dark`, and `system`
- bootstrap does not throw if cache is missing or malformed

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/theme/themeBootstrap.test.ts`
Expected: FAIL because bootstrap code does not exist yet

**Step 3: Write minimal implementation**

Create `src/theme/themeBootstrap.ts` with:
- `applyResolvedTheme(theme, mode)`
- `readCachedTheme()`
- `readThemeModePreference()`
- `bootstrapTheme()`

Modify `src/main.tsx` so `bootstrapTheme()` runs before `createRoot(...).render(...)`.

Important constraint:
- Do not wait on Supabase during bootstrap
- Use default CSS token values if there is no cache

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/theme/themeBootstrap.test.ts`
Expected: PASS

**Step 5: Manual verification**

Run: `npm run dev`
Expected:
- app paints with no obvious flash between default and cached theme
- forcing localStorage mode to `dark` adds dark appearance before React interaction

**Step 6: Commit**

```bash
git add src/theme/themeBootstrap.ts src/theme/themeBootstrap.test.ts src/main.tsx
git commit -m "feat: bootstrap workspace theme before app render"
```

### Task 4: Sync Latest Workspace Theme After App Loads

**Files:**
- Create: `src/theme/useWorkspaceTheme.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

Create a focused test for the hook or helper logic proving:
- app fetches latest `workspace-theme-v1`
- cache updates only when payload changes
- resolved theme reapplies without full reload

If a hook test becomes too expensive, test a pure helper that performs fetch/compare/cache/apply.

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/theme/useWorkspaceTheme.test.ts`
Expected: FAIL because sync layer does not exist yet

**Step 3: Write minimal implementation**

Create a hook or initializer that:
- fetches theme settings from Supabase after mount
- generates resolved light/dark maps from seeds
- writes cache to localStorage
- reapplies theme if values changed

Wire it near the top of `App.tsx` so it runs once per session.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/theme/useWorkspaceTheme.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme/useWorkspaceTheme.ts src/theme/useWorkspaceTheme.test.ts src/App.tsx
git commit -m "feat: sync workspace theme from supabase after startup"
```

### Task 5: Add Per-User Mode Preference Without Per-User Color Overrides

**Files:**
- Create: `src/theme/themeMode.ts`
- Create: `src/theme/themeMode.test.ts`
- Modify: `src/components/settings/Settings.tsx` or the eventual settings screen entry point

**Step 1: Write the failing test**

Create tests that prove:
- allowed values are only `light | dark | system`
- setter persists to localStorage
- applying mode toggles the root `dark` class correctly

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/theme/themeMode.test.ts`
Expected: FAIL because mode helper does not exist yet

**Step 3: Write minimal implementation**

Create `src/theme/themeMode.ts` with:
- `getThemeModePreference()`
- `setThemeModePreference()`
- `resolveEffectiveMode()`

Then add a simple mode switch UI in Settings:
- three options only
- no seed editing here yet unless an admin appearance panel already exists

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/theme/themeMode.test.ts`
Expected: PASS

**Step 5: Manual verification**

Run: `npm run dev`
Expected:
- switching mode updates appearance immediately
- reloading preserves the chosen mode
- workspace colors remain unchanged across users

**Step 6: Commit**

```bash
git add src/theme/themeMode.ts src/theme/themeMode.test.ts src/components/settings/Settings.tsx
git commit -m "feat: add per-user light dark system theme mode"
```

### Task 6: Migrate the First Hardcoded-Color Slice and Add Guardrails

**Files:**
- Reference: `docs/plans/2026-03-27-theme-guardrails.md`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/inbox/ticketingTheme.ts`
- Create: `scripts/check-no-hardcoded-colors.mjs`
- Modify: `package.json`

**Precondition**

Do not start Task 6 until `docs/plans/2026-03-27-theme-guardrails.md` exists and its rollout stages, allowlists, and policy are accepted as the enforcement source of truth.

**Step 1: Write the failing check**

Create `scripts/check-no-hardcoded-colors.mjs` to fail when raw hex values appear in:
- `src/components/**/*.tsx`
- `src/components/**/*.ts`

Allowlist:
- `src/styles/globals.css`
- explicit token generator files in `src/theme/`

**Step 2: Run check to verify it fails**

Run: `node scripts/check-no-hardcoded-colors.mjs`
Expected: FAIL because the repo still has many hardcoded colors

**Step 3: Write minimal implementation**

Do not clean the whole repo in one pass. Convert only the first slice from the migration map:
- shared startup and shell surfaces
- `src/main.tsx` fallback UI colors
- `src/App.tsx` obvious startup-level hardcoded colors
- forms and table-adjacent controls that are touched while implementing appearance
- `src/components/inbox/ticketingTheme.ts` from literal color maps to component token references or generated semantic mappings

Add a package script:
- `"check:colors": "node scripts/check-no-hardcoded-colors.mjs"`

Initially scope the checker to a narrow allowlist or targeted folders if the full repo is too noisy. Expand enforcement in stages:
- stage 1: `src/main.tsx`, `src/App.tsx`, `src/components/inbox/`
- stage 2: shared form primitives and table primitives
- stage 3: broader `src/components/`

**Step 4: Run verification**

Run:
- `node scripts/check-no-hardcoded-colors.mjs`
- `npm run test`
- `npm run typecheck`

Expected:
- color check passes for the scoped slice
- tests pass
- TypeScript passes

**Step 5: Commit**

```bash
git add src/main.tsx src/App.tsx src/components/inbox/ticketingTheme.ts scripts/check-no-hardcoded-colors.mjs package.json
git commit -m "refactor: move first hardcoded color slice to theme tokens"
```

## Done When

- [ ] Workspace seeds are stored in Supabase `settings` under `workspace-theme-v1`
- [ ] Full light/dark semantic token maps are generated from four workspace seeds
- [ ] Cached CSS variables apply before React renders
- [ ] Users can choose `light | dark | system` without changing workspace colors
- [ ] Hardcoded colors have an explicit migration map, not ad-hoc cleanup
- [ ] First hardcoded-color slice is migrated off raw literals
- [ ] New raw color usage is blocked in the scoped enforcement path
- [ ] `npm run test` and `npm run typecheck` pass

## Notes

- Keep the first version simple: no admin theme editor UI until bootstrap + persistence + mode switching are stable.
- Reuse the existing `settings` KV table now; move to a dedicated table only if workspace scoping or audit history becomes a real requirement.
- Do not block startup on Supabase. Default CSS tokens + cached resolved theme must carry first paint.
- The hardcoded-color problem is handled as a phased migration program, not a repo-wide search-and-replace.
