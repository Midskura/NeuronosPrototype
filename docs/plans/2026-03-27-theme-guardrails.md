# Workspace Theme Guardrails

**Date:** 2026-03-27  
**Status:** Approved design input for implementation  
**Related docs:**
- `docs/plans/2026-03-27-workspace-theme-tokens.md`
- `docs/plans/2026-03-27-theme-color-migration-map.md`

## Purpose

Define the enforcement rules that stop new color debt from entering the app while the workspace theme system is rolled out in phases.

This document exists to solve two problems at the same time:

- prevent additional raw color literals from being added
- avoid freezing the repo by trying to clean all existing color debt in one pass

## Scope

These guardrails apply to runtime application code and styling decisions in the product UI.

Included scope:

- `src/main.tsx`
- `src/App.tsx`
- `src/components/**/*.ts`
- `src/components/**/*.tsx`
- later, shared primitives and broader app surfaces

Out of scope for initial enforcement:

- `src/styles/globals.css`
- `src/theme/**`
- documentation files
- test fixtures and snapshots, unless they are later found to influence runtime styling

## Non-Goals

- This does not require the whole repo to become token-clean immediately.
- This does not ban all color usage everywhere in the codebase on day one.
- This does not make status colors admin-editable.
- This does not introduce a new visual design system beyond the semantic token layer already planned.

## Core Policy

### 1. No new raw color literals in guarded runtime surfaces

Once a path is under enforcement, do not add:

- hex colors such as `#0F766E` or `#fff`
- `rgb(...)`
- `rgba(...)`
- inline JS color objects that encode local palettes

### 2. Runtime UI colors must come from approved sources

Allowed runtime color sources:

- semantic CSS variables from `src/styles/globals.css`
- generated theme tokens from `src/theme/**`
- helper APIs that resolve to semantic tokens

Not allowed in guarded paths:

- screen-local palettes
- component-local mini theme systems
- copied legacy brand shades
- handwritten status palettes

### 3. Status colors are system-controlled

`success`, `warning`, and `danger` remain derived system tokens.

They may be used by components, but they may not be exposed as workspace-editable seed inputs in V1.

### 4. New visual needs must become semantics, not literals

If a component needs a color that is not covered by the existing token surface:

1. add or adjust a semantic token in the theme layer
2. wire it through the generator and CSS variables
3. consume that semantic token in the component

Do not solve missing semantics by adding another literal.

## Approved Exceptions

These files are allowed to contain literal colors because they are source-of-truth or infrastructure for the theme system:

- `src/styles/globals.css`
- `src/theme/**`

Future exceptions should be rare and explicit. If an exception is needed, it must be:

- documented in the checker allowlist
- justified in code with a short comment
- traceable to a concrete limitation, not preference

## Rollout Stages

### Stage 1: Immediate guardrails

Guard these paths first:

- `src/main.tsx`
- `src/App.tsx`
- `src/components/inbox/**`

Reason:

- they are either startup-critical or self-contained migration targets
- they give the theme work fast feedback without blocking the full repo

### Stage 2: Shared UI primitives

Expand enforcement to:

- shared form controls
- shared tables
- shared badges, pills, alerts, and chips

Reason:

- these primitives multiply color debt quickly across modules
- locking them down produces outsized payoff

### Stage 3: Broad component enforcement

Expand enforcement to broader `src/components/**` runtime surfaces after Stage 1 and Stage 2 are stable.

Reason:

- at this point the semantic token surface should be mature enough to support broader migration

## Checker Requirements

The color-debt checker should be simple and explicit.

### It must detect

- hex colors
- `rgb(...)`
- `rgba(...)`

### It must support

- path-based staged enforcement
- explicit allowlists
- machine-readable failure output that names offending files and literals

### It must not do

- auto-fix code
- silently rewrite colors
- attempt semantic inference on its own

The checker is a gate, not a migration tool.

## Recommended Script Shape

When implemented, the checker should expose one script with staged configuration rather than multiple unrelated tools.

Recommended package scripts:

- `theme:check-colors`
- optional later: `theme:check-colors:strict`

Recommended behavior:

- default command checks only the currently enforced stage paths
- strict mode can scan the wider repo for reporting without yet blocking all paths

## Developer Workflow

When changing UI in a guarded path:

1. use an existing semantic token if one fits
2. if none fits, extend the semantic token layer
3. only then update the component

Do not:

- paste a color from another file
- match an old shade by eye with a new literal
- create a one-off object map for statuses, priorities, or chip tones

## Migration Rules

### Rule 1: Collapse repeated literals aggressively

If several legacy shades communicate the same UI meaning, they should map to one semantic token rather than preserving every historical nuance.

### Rule 2: Prefer semantics over local naming

Use names like:

- `text.secondary`
- `bg.surfaceSubtle`
- `status.warning.bg`

Do not invent local names like:

- `approvalTan`
- `ticketMutedGray`
- `brandGreenSoft2`

### Rule 3: Delete local palette systems when touched

If a guarded file contains a local theme map and is being edited for theme work, replace the map rather than preserving it.

Primary target:

- `src/components/inbox/ticketingTheme.ts`

## Review Checklist

Any PR touching a guarded path should satisfy all of the following:

- no new raw color literals were introduced
- any removed literals were replaced with semantic tokens, not alternate literals
- status colors still come from system tokens
- if a new semantic token was added, it is defined in the generator and exposed through CSS variables

## Escalation Rule

If a component genuinely cannot be expressed with the current token surface, stop and extend the token system first.

Do not bypass the guardrail to keep momentum.

## Definition of Done for Guardrail Activation

Stage 1 is ready to implement when:

- the migration map exists
- the semantic token surface for startup and ticketing work is defined
- the checker has an explicit allowlist and explicit path scope

Stage 2 is ready when:

- shared primitives have semantic replacements available
- Stage 1 has no active exceptions beyond approved source-of-truth files

Stage 3 is ready when:

- most repeated runtime color families already map cleanly to semantic tokens
- broad enforcement would block only real debt, not missing infrastructure

## Decision Log

- Decision: use staged path-based enforcement instead of repo-wide blocking immediately.
  - Why: the repo already has large existing color debt; immediate global blocking would stall progress.
- Decision: allow literals only in `globals.css` and `src/theme/**`.
  - Why: these are the source-of-truth layers that define the theme system.
- Decision: keep status colors system-controlled.
  - Why: admins are editing brand seeds, not semantic safety/status meaning.
- Decision: require semantic extension before exceptions.
  - Why: otherwise the repo recreates the same color debt under new names.
