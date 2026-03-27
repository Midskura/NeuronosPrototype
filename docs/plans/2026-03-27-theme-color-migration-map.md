# Hardcoded Color Migration Map

**Date:** 2026-03-27  
**Scope:** Runtime application surfaces under `src/`  
**Audit exclusions:** `src/styles/globals.css`, `src/index.css`

## Audit Summary

- Runtime TS/TSX surfaces with hardcoded hex literals: `334` files
- The repeated runtime color debt is concentrated in a small number of families:
  - primary brand teal / green
  - text / ink neutrals
  - surface and border neutrals
  - system status palettes
  - local component tone maps such as `src/components/inbox/ticketingTheme.ts`
- Status colors must remain system-controlled. They are not part of the editable workspace seed contract.

## Seed Contract Alignment

The replacement map assumes the workspace theme exposes only four editable seeds:

- `primary`
- `accent`
- `surfaceTint`
- `neutralBase`

Everything else is derived into semantic tokens for `light` and `dark`.

## Proposed Semantic Token Surface

These are the semantic targets that repeated literals should collapse into:

| Semantic token | Purpose |
| --- | --- |
| `bg.page` | app page background |
| `bg.surface` | cards, panels, dialogs |
| `bg.surfaceSubtle` | muted sections and table headers |
| `bg.surfaceTint` | lightly tinted brand surfaces |
| `text.primary` | primary body text |
| `text.secondary` | secondary text and labels |
| `text.muted` | helper text, placeholders |
| `text.inverse` | text on dark or filled surfaces |
| `border.default` | standard borders |
| `border.subtle` | dividers, light chrome |
| `border.strong` | focused or emphasized borders |
| `action.primary.bg` | primary button background |
| `action.primary.text` | primary button text |
| `action.primary.border` | primary action border |
| `action.accent.bg` | accent fills |
| `action.accent.text` | accent text |
| `state.hover` | neutral hover fill |
| `state.selected` | selected row / chip fill |
| `state.focusRing` | focus outline / ring |
| `status.success.*` | success palette, system-controlled |
| `status.warning.*` | warning palette, system-controlled |
| `status.danger.*` | danger palette, system-controlled |

## Repeated Literal Replacement Map

### 1. Brand / Primary Family

These values should collapse into the derived primary scale and primary action tokens.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `#0F766E` | 1355 | `action.primary.bg` | collapse |
| `#0D6560` | 83 | `action.primary.border` | collapse |
| `#059669` | 58 | `status.success.fg` or derived primary-support scale | collapse |
| `#10b981` | 39 | `status.success.fg` or derived primary-support scale | collapse |
| `#237F66` | repeated local | derived `primary.600` | collapse |
| `#2f7f6f` | repeated local | `border.strong` or derived `primary.500` | collapse |
| `#6b9d94` | repeated local | derived `primary.400` | collapse |
| `#5a8a82` | repeated local | derived `primary.500` hover/darker step | collapse |

### 2. Accent Family

These should collapse into the derived accent scale. Accent remains editable by admins through the workspace theme seed.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `#C94F3D` | 73 | derived `accent.600` / `status.danger.fg` only where semantic danger is intended | collapse |
| `#C88A2B` | 57 | derived `accent.600` / `status.warning.fg` only where semantic warning is intended | collapse |
| `#D97706` | 69 | `status.warning.fg` | collapse |
| `#F59E0B` | 56 | `status.warning.fillStrong` | collapse |

### 3. Ink / Text Family

These values should collapse into semantic text tokens instead of preserving per-screen palettes.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `#12332B` | 1010 | `text.primary` | collapse |
| `#0a1d4d` | 172 | `text.primary` | collapse |
| `#2C3E38` | 39 | `text.primary` | collapse |
| `#344054` | 40 | `text.secondary` | collapse |
| `#374151` | 166 | `text.secondary` | collapse |
| `#667085` | 872 | `text.secondary` | collapse |
| `#6B7280` | 523 | `text.muted` | collapse |
| `#6B7A76` | 172 | `text.secondary` | collapse |
| `#9CA3AF` | 356 | `text.muted` | collapse |
| `#5F6E69` | repeated local | `text.secondary` | collapse |
| `#7A8782` | repeated local | `text.muted` | collapse |
| `#2E5147` | repeated local | `text.secondary` on tinted chips | collapse |
| `#7A6048` | repeated local | `text.secondary` on accent-tinted chips | collapse |
| `#8A5A44` | repeated local | `status.warning.fg` or `status.danger.fg` depending on usage | collapse |
| `#A05B45` | repeated local | `status.danger.fg` | collapse |

### 4. Surface / Border Family

These values should collapse into background and border semantics.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `#FFFFFF` | 698 | `bg.surface` or `text.inverse` depending on property | collapse |
| `#000000` | 147 | `text.primary` or overlay token depending on property | collapse |
| `#F9FAFB` | 426 | `bg.surfaceSubtle` | collapse |
| `#F3F4F6` | 286 | `bg.surfaceSubtle` | collapse |
| `#F8FBFB` | repeated local | `bg.surfaceSubtle` | collapse |
| `#FAFBFC` | repeated local | `bg.surfaceSubtle` | collapse |
| `#E5E7EB` | 473 | `border.default` | collapse |
| `#E5E9F0` | 311 | `border.subtle` | collapse |
| `#E0E6E4` | 57 | `border.subtle` | collapse |
| `#D1D5DB` | 171 | `border.default` | collapse |
| `#E2E8E5` | repeated local | `border.subtle` | collapse |
| `#D7E5E0` | repeated local | `border.default` on tinted chips | collapse |
| `#E6D9CC` | repeated local | `border.default` on accent-tinted chips | collapse |
| `#E7D1C7` | repeated local | `status.danger.border` | collapse |

### 5. Neutral Tinted Fill Family

These are not new semantic colors. They are manifestations of surface tint plus semantic status fills.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `#E8F5F3` | 118 | `bg.surfaceTint` | collapse |
| `#F0FDF9` | 50 | `status.success.bg` | collapse |
| `#D1FAE5` | 41 | `status.success.border` or success soft fill | collapse |
| `#FEF3C7` | 47 | `status.warning.bg` | collapse |
| `#FEF2F2` | 43 | `status.danger.bg` | collapse |
| `#FEE2E2` | 43 | `status.danger.border` | collapse |
| `#F4F6F5` | repeated local | `bg.surfaceSubtle` | collapse |
| `#EEF4F1` | repeated local | `bg.surfaceTint` | collapse |
| `#F6F2EC` | repeated local | `status.warning.bg` | collapse |
| `#FAF1EE` | repeated local | `status.danger.bg` | collapse |
| `#F7FAF8` | repeated local | `bg.surfaceTint` | collapse |
| `#FBF7F2` | repeated local | `status.warning.bg` | collapse |
| `#E8F2EE` | repeated local | `bg.surfaceTint` | collapse |
| `#F2F4F3` | repeated local | `bg.surfaceSubtle` | collapse |
| `#F3EEE8` | repeated local | `status.warning.bg` | collapse |

## Repeated Alpha / RGBA Map

These should stop being handwritten per component and instead come from semantic state or overlay helpers.

| Literal | Count | Target token | Decision |
| --- | ---: | --- | --- |
| `rgba(0, 0, 0, 0.1)` | 20 | overlay helper / shadow token | collapse |
| `rgba(16, 24, 40, 0.08)` | 16 | overlay helper / shadow token | collapse |
| `rgba(16, 24, 40, 0.03)` | 16 | overlay helper / shadow token | collapse |
| `rgba(15, 118, 110, 0.1)` | 13 | `state.selected` or `bg.surfaceTint` | collapse |
| `rgba(18, 51, 43, 0.15)` | 9 | `state.focusRing` / shadow helper | collapse |

## Local Theme Maps That Must Be Deleted

These files currently act as mini design systems and should be replaced with semantic token lookups.

| File | Current issue | Replacement |
| --- | --- | --- |
| `src/components/inbox/ticketingTheme.ts` | hardcoded chip palettes for type, priority, status, entity, avatar | generate chip styles from `status.*`, `bg.surfaceTint`, `text.secondary`, `border.*` |
| `src/main.tsx` | hardcoded fallback heading/body/button colors | use root semantic CSS vars in inline styles or a tiny fallback component class |
| `src/App.tsx` | login and signup screen are full of raw literals for tabs, inputs, buttons, cards, and success state | replace with semantic CSS vars and utility classes backed by generated tokens |
| `src/components/Admin.tsx` | repeated badge and panel colors | replace with semantic surface/status tokens |
| `src/components/ActivityLogPage.tsx` | repeated status pills and table chrome literals | replace with semantic surface/status tokens |

## First Migration Slices

Priority order for the first implementation wave:

1. `src/main.tsx`
   - smallest surface
   - immediately proves startup fallback can read semantic vars
2. `src/App.tsx`
   - highest-volume startup/auth color debt
   - verifies login/signup UX works with the new token surface
3. `src/components/inbox/ticketingTheme.ts`
   - removes a self-contained local palette system
   - validates status/system-control separation
4. `src/components/Admin.tsx`
   - high-frequency internal surface with repeated pill and panel colors
5. `src/components/ActivityLogPage.tsx`
   - repeated table/status chrome, good fit for semantic migration

## Guardrail Rollout

The hardcoded-color checker should be staged instead of blocking the whole repo at once.

### Stage 1

Block new raw hex and `rgb/rgba` literals in:

- `src/main.tsx`
- `src/App.tsx`
- `src/components/inbox/`

### Stage 2

Expand enforcement to shared primitives:

- form controls
- shared tables
- shared badges / pills

### Stage 3

Expand to broader component surfaces under `src/components/`.

## Implementation Notes for Task 1

- The generator must produce enough semantic outputs to absorb the families above.
- It is acceptable for multiple old literals to collapse into the same semantic token.
- It is not acceptable for status colors to be tied to editable admin seeds in V1.
- The first generator version should prioritize semantic clarity over one-to-one visual matching of every legacy shade.
