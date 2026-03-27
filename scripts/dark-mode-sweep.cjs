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
