# Dark Mode Token Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded Tailwind color classes and hex values in 173+ component files with CSS variable references so components automatically respond to the `.dark` class already defined in `globals.css`.

**Architecture:** A single Node.js transform script holds a complete color→token mapping table and rewrites every `.tsx` file under `src/components/` (excluding `src/components/ui/` which already uses `dark:` prefixes). The script uses regex with class-boundary guards so it only matches whole Tailwind class tokens, not substrings. After the script runs, a verification grep confirms residual counts, and any contextually-specific stragglers (status badge hues, intentional accent colors) are fixed by hand.

**Tech Stack:** Node.js (built-in `fs`/`path`), Tailwind CSS v4 CSS variable pattern (`bg-[var(--theme-*)]`), existing `--theme-*` tokens in `src/styles/globals.css`.

---

## Color → Token Mapping Reference

| Hardcoded class | Replacement | Token value (light → dark) |
|---|---|---|
| `bg-white` | `bg-[var(--theme-bg-surface)]` | `#FFF` → `#181A1F` |
| `bg-[#F9FAFB]` | `bg-[var(--theme-bg-page)]` | `#F7FAF8` → `#111216` |
| `bg-gray-50` | `bg-[var(--theme-bg-surface-subtle)]` | `#F1F6F4` → `#1E2128` |
| `bg-gray-100` | `bg-[var(--theme-bg-surface-subtle)]` | same |
| `bg-gray-200` | `bg-[var(--theme-bg-surface-tint)]` | `#E8F2EE` → `#1B1E24` |
| `bg-gray-300` | `bg-[var(--theme-bg-surface-tint)]` | same |
| `bg-[#F3F4F6]` | `bg-[var(--theme-bg-surface-subtle)]` | same |
| `bg-[#E8F2EE]` | `bg-[var(--theme-bg-surface-tint)]` | same |
| `bg-[#F0FDF9]` | `bg-[var(--theme-bg-surface-tint)]` | same |
| `bg-[#0F766E]` | `bg-[var(--theme-action-primary-bg)]` | `#237F66` → `#27846B` |
| `bg-[#0D6560]` | `bg-[var(--theme-action-primary-border)]` | `#1E6D59` → `#3E8F7B` |
| `text-[#12332B]` | `text-[var(--theme-text-primary)]` | `#12332B` → `#F7F8FB` |
| `text-[#0A1D4D]` | `text-[var(--theme-text-primary)]` | same |
| `text-[#101828]` | `text-[var(--theme-text-primary)]` | same |
| `text-[#000000]` | `text-[var(--theme-text-primary)]` | same |
| `text-[#374151]` | `text-[var(--theme-text-secondary)]` | `#2E5147` → `#C8CDD8` |
| `text-[#344054]` | `text-[var(--theme-text-secondary)]` | same |
| `text-[#667085]` | `text-[var(--theme-text-muted)]` | `#6B7A76` → `#9097A7` |
| `text-[#6B7280]` | `text-[var(--theme-text-muted)]` | same |
| `text-[#6B7A76]` | `text-[var(--theme-text-muted)]` | same |
| `text-[#9CA3AF]` | `text-[var(--theme-text-muted)]` | same |
| `text-[#98A2B3]` | `text-[var(--theme-text-muted)]` | same |
| `text-gray-400` | `text-[var(--theme-text-muted)]` | same |
| `text-gray-500` | `text-[var(--theme-text-muted)]` | same |
| `text-gray-300` | `text-[var(--theme-text-muted)]` | same |
| `text-gray-600` | `text-[var(--theme-text-secondary)]` | same |
| `text-gray-700` | `text-[var(--theme-text-secondary)]` | same |
| `text-gray-800` | `text-[var(--theme-text-primary)]` | same |
| `text-gray-900` | `text-[var(--theme-text-primary)]` | same |
| `text-[#0F766E]` | `text-[var(--theme-action-primary-bg)]` | `#237F66` → `#27846B` |
| `border-[#E5E7EB]` | `border-[var(--theme-border-default)]` | `#E5ECE9` → `#2A2D35` |
| `border-[#E5E9F0]` | `border-[var(--theme-border-default)]` | same |
| `border-[#E5ECE9]` | `border-[var(--theme-border-default)]` | same |
| `border-[#D1D5DB]` | `border-[var(--theme-border-default)]` | same |
| `border-[#D9D9D9]` | `border-[var(--theme-border-default)]` | same |
| `border-[#D0D5DD]` | `border-[var(--theme-border-default)]` | same |
| `border-gray-100` | `border-[var(--theme-border-subtle)]` | `#EEF3F1` → `#22252D` |
| `border-gray-200` | `border-[var(--theme-border-default)]` | same |
| `border-gray-300` | `border-[var(--theme-border-default)]` | same |
| `border-gray-400` | `border-[var(--theme-border-default)]` | same |
| `border-[#0F766E]` | `border-[var(--theme-action-primary-bg)]` | `#237F66` → `#27846B` |
| `border-[#12332B]` | `border-[var(--theme-text-primary)]` | `#12332B` → `#F7F8FB` |

**Do NOT replace** (intentional accent/status hues — leave as-is):
- `bg-[#F25C05]` — orange accent
- `border-[#000000]` / `text-[#000000]` in SVG/icon contexts (check visually)

---

## Files Modified

- **Create:** `scripts/dark-mode-sweep.cjs` — transform script
- **Modify:** All `src/components/**/*.tsx` except `src/components/ui/**` and `src/components/figma/**`

---

## Task 1: Write the transform script

**Files:**
- Create: `scripts/dark-mode-sweep.cjs`

- [ ] **Step 1: Create the scripts directory and write the script**

Create `scripts/dark-mode-sweep.cjs` with this exact content:

```js
#!/usr/bin/env node
// scripts/dark-mode-sweep.cjs
// Replaces hardcoded Tailwind color classes with CSS variable references
// across all .tsx files in src/components/ (excluding ui/ and figma/).

const fs = require("fs");
const path = require("path");

// Order matters: longer/more-specific patterns first to avoid partial matches.
const REPLACEMENTS = [
  // --- Backgrounds ---
  ["bg-\\[#F9FAFB\\]", "bg-[var(--theme-bg-page)]"],
  ["bg-\\[#F3F4F6\\]", "bg-[var(--theme-bg-surface-subtle)]"],
  ["bg-\\[#E8F2EE\\]", "bg-[var(--theme-bg-surface-tint)]"],
  ["bg-\\[#F0FDF9\\]", "bg-[var(--theme-bg-surface-tint)]"],
  ["bg-\\[#0D6560\\]", "bg-[var(--theme-action-primary-border)]"],
  ["bg-\\[#0F766E\\]", "bg-[var(--theme-action-primary-bg)]"],
  ["bg-white(?=[\\s\"'`{]|$)", "bg-[var(--theme-bg-surface)]"],
  ["bg-gray-50(?=[\\s\"'`{]|$)", "bg-[var(--theme-bg-surface-subtle)]"],
  ["bg-gray-100(?=[\\s\"'`{]|$)", "bg-[var(--theme-bg-surface-subtle)]"],
  ["bg-gray-200(?=[\\s\"'`{]|$)", "bg-[var(--theme-bg-surface-tint)]"],
  ["bg-gray-300(?=[\\s\"'`{]|$)", "bg-[var(--theme-bg-surface-tint)]"],
  // --- Text ---
  ["text-\\[#12332B\\]", "text-[var(--theme-text-primary)]"],
  ["text-\\[#0A1D4D\\]", "text-[var(--theme-text-primary)]"],
  ["text-\\[#101828\\]", "text-[var(--theme-text-primary)]"],
  ["text-\\[#000000\\]", "text-[var(--theme-text-primary)]"],
  ["text-\\[#374151\\]", "text-[var(--theme-text-secondary)]"],
  ["text-\\[#344054\\]", "text-[var(--theme-text-secondary)]"],
  ["text-\\[#667085\\]", "text-[var(--theme-text-muted)]"],
  ["text-\\[#6B7280\\]", "text-[var(--theme-text-muted)]"],
  ["text-\\[#6B7A76\\]", "text-[var(--theme-text-muted)]"],
  ["text-\\[#9CA3AF\\]", "text-[var(--theme-text-muted)]"],
  ["text-\\[#98A2B3\\]", "text-[var(--theme-text-muted)]"],
  ["text-\\[#0F766E\\]", "text-[var(--theme-action-primary-bg)]"],
  ["text-gray-300(?=[\\s\"'`{]|$)", "text-[var(--theme-text-muted)]"],
  ["text-gray-400(?=[\\s\"'`{]|$)", "text-[var(--theme-text-muted)]"],
  ["text-gray-500(?=[\\s\"'`{]|$)", "text-[var(--theme-text-muted)]"],
  ["text-gray-600(?=[\\s\"'`{]|$)", "text-[var(--theme-text-secondary)]"],
  ["text-gray-700(?=[\\s\"'`{]|$)", "text-[var(--theme-text-secondary)]"],
  ["text-gray-800(?=[\\s\"'`{]|$)", "text-[var(--theme-text-primary)]"],
  ["text-gray-900(?=[\\s\"'`{]|$)", "text-[var(--theme-text-primary)]"],
  // --- Borders ---
  ["border-\\[#E5E7EB\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#E5E9F0\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#E5ECE9\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#D1D5DB\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#D9D9D9\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#D0D5DD\\]", "border-[var(--theme-border-default)]"],
  ["border-\\[#0F766E\\]", "border-[var(--theme-action-primary-bg)]"],
  ["border-\\[#12332B\\]", "border-[var(--theme-text-primary)]"],
  ["border-gray-100(?=[\\s\"'`{]|$)", "border-[var(--theme-border-subtle)]"],
  ["border-gray-200(?=[\\s\"'`{]|$)", "border-[var(--theme-border-default)]"],
  ["border-gray-300(?=[\\s\"'`{]|$)", "border-[var(--theme-border-default)]"],
  ["border-gray-400(?=[\\s\"'`{]|$)", "border-[var(--theme-border-default)]"],
];

const COMPILED = REPLACEMENTS.map(([pattern, replacement]) => [
  new RegExp(pattern, "g"),
  replacement,
]);

function collectFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip ui/ (shadcn already has dark: variants) and figma/ (protected)
      if (entry.name === "ui" || entry.name === "figma") continue;
      collectFiles(fullPath, results);
    } else if (entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

function transformFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;
  for (const [regex, replacement] of COMPILED) {
    const next = content.replace(regex, replacement);
    if (next !== content) {
      changed = true;
      content = next;
    }
  }
  if (changed && !dryRun) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  return changed;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const targetDir = path.resolve(__dirname, "../src/components");

const files = collectFiles(targetDir);
let modifiedCount = 0;

for (const file of files) {
  const changed = transformFile(file, dryRun);
  if (changed) {
    modifiedCount++;
    console.log(`${dryRun ? "[dry]" : "[mod]"} ${path.relative(process.cwd(), file)}`);
  }
}

console.log(
  `\nDone. ${modifiedCount}/${files.length} files ${dryRun ? "would be" : "were"} modified.`
);
```

- [ ] **Step 2: Dry-run the script against a single file to verify it works**

```bash
node scripts/dark-mode-sweep.cjs --dry-run 2>&1 | head -30
```

Expected: a list of file paths printed with `[dry]` prefix, no errors. If you see a Node.js syntax error, fix the script before continuing.

---

## Task 2: Run the transform across all files

**Files:**
- Modify: all `src/components/**/*.tsx` (except `ui/`, `figma/`)

- [ ] **Step 1: Verify the dry run count looks right**

```bash
node scripts/dark-mode-sweep.cjs --dry-run 2>&1 | tail -5
```

Expected output similar to:
```
Done. 165/XXX files would be modified.
```

If the modified count is 0, the script path is wrong — check that `targetDir` resolves to `src/components/`.

- [ ] **Step 2: Run the actual transform**

```bash
node scripts/dark-mode-sweep.cjs
```

Expected: files listed with `[mod]` prefix, final line like `Done. 165/XXX files were modified.`

- [ ] **Step 3: Verify the build still compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: build exits successfully (no TypeScript errors — the changes are string replacements of CSS class names only and do not affect types).

If the build fails, run `git diff src/components/` to find which file was corrupted and revert just that file with `git checkout -- <file>`.

---

## Task 3: Verify and clean up stragglers

- [ ] **Step 1: Check remaining hardcoded color counts**

```bash
grep -roh "bg-white\|bg-gray-[0-9]*\|text-gray-[0-9]*\|border-gray-[0-9]*\|bg-\[#[A-Fa-f0-9]*\]\|text-\[#[A-Fa-f0-9]*\]\|border-\[#[A-Fa-f0-9]*\]" src/components --include="*.tsx" | grep -v "ui/" | sort | uniq -c | sort -rn | head -30
```

Expected: the high-frequency patterns from before (e.g. `bg-white 299`, `text-[#6B7280] 282`) should now be at or near 0. Remaining entries are either:
- Intentional accent colors (e.g. `bg-[#F25C05]`) — leave them
- Patterns missed by the script — add them to `REPLACEMENTS` and re-run

- [ ] **Step 2: Add any missed patterns and re-run (if needed)**

If Step 1 reveals new high-frequency patterns not in the mapping table, open `scripts/dark-mode-sweep.cjs`, add entries to `REPLACEMENTS` following the same format, then re-run:

```bash
node scripts/dark-mode-sweep.cjs
```

- [ ] **Step 3: Check for inline style stragglers**

```bash
grep -rn "color:.*#[A-Fa-f0-9]\{6\}\|backgroundColor:.*#[A-Fa-f0-9]\{6\}" src/components --include="*.tsx" | grep -v "ui/" | grep -v "figma/" | head -30
```

Review the output. Inline styles using raw hex that correspond to theme tokens should be updated to `var(--theme-*)` equivalents. For each file shown, replace inline hex strings with the matching var:

| Hex | Var |
|---|---|
| `#12332B` | `var(--theme-text-primary)` |
| `#F7FAF8` | `var(--theme-bg-page)` |
| `#FFFFFF` | `var(--theme-bg-surface)` |
| `#6B7A76` or `#667085` | `var(--theme-text-muted)` |
| `#E5ECE9` or `#E5E7EB` | `var(--theme-border-default)` |
| `#237F66` or `#0F766E` | `var(--theme-action-primary-bg)` |

If the list is long (>20 files), extend the script to handle inline style replacements too using a similar pattern.

---

## Task 4: Spot-check in the browser and commit

- [ ] **Step 1: Start the dev server and toggle dark mode**

```bash
npm run dev
```

Open the app, navigate to Settings → Appearance, toggle dark mode on. Visually check:
- Sidebar background turns dark
- Page backgrounds turn dark
- Table rows and cards turn dark
- Text becomes light
- Borders become visible (not invisible against dark bg)

Check at minimum: Inquiries list, a booking module (e.g. Forwarding), Accounting Expenses, HR Employees, and the Settings page itself.

- [ ] **Step 2: Fix any visual regressions**

If a module still looks broken (white panels on dark bg), grep that specific file for remaining hardcoded colors:

```bash
grep -n "bg-white\|bg-\[#\|text-\[#\|border-\[#" src/components/path/to/file.tsx
```

Manually replace the offending classes using the mapping table at the top of this plan.

- [ ] **Step 3: Commit**

```bash
git add src/components/ scripts/dark-mode-sweep.cjs
git commit -m "feat: sweep hardcoded colors to CSS variable tokens for dark mode"
```
