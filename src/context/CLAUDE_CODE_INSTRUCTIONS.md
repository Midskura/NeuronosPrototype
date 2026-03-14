# Instructions for Claude Code

## First Steps When Starting a Session

1. Read the context files in `/context/` to understand the project
2. If the user mentions a feature or blueprint, read the relevant file in `/docs/blueprints/` before doing anything
3. If the user asks you to modify a file listed in "Files That Require Re-Reading" (see `WORKING_CONVENTIONS.md`), **always read it first** — these files have been manually edited and may differ from what you expect

## Development Workflow

This project uses a **blueprint-driven** process:

1. **Discuss** the feature with the user
2. **Create or update** a blueprint in `/docs/blueprints/` with phased implementation plan
3. **Wait for "Go Ahead"** before writing any code
4. **Implement** one phase at a time
5. **Update the blueprint** after each phase with completion status and notes
6. **Summarize** what was done and suggest next steps

## Technical Environment

### This is a Figma Make project (Supabase Edge Functions)
- The backend runs as a single Supabase Edge Function (Hono/Deno)
- There is no traditional build system — React files are transpiled by the Figma Make environment
- Tailwind v4.0 is used (no `tailwind.config.js`)
- The KV store is the only database — no SQL tables, no migrations

### Key Import Patterns
```tsx
// Frontend API calls
import { projectId, publicAnonKey } from "./utils/supabase/info";
const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c142e950`;

// Toasts
import { toast } from "sonner@2.0.3";

// Routing (NOT react-router-dom)
import { BrowserRouter, Routes, Route, useNavigate } from "react-router";

// App mode
import { useAppMode } from "./config/appMode";

// User context
import { useUser } from "./hooks/useUser";
```

### Server Import Patterns
```tsx
// In /supabase/functions/server/ files:
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store_robust.tsx";
```

## Critical Patterns to Preserve

1. **CustomDropdown portal pattern** — uses `createPortal` to `document.body`, `position: fixed`, `zIndex: 9999`, scroll repositioning. Don't change this.

2. **Unified tab components** — `UnifiedBillingsTab`, `UnifiedExpensesTab`, `UnifiedInvoicesTab`, `UnifiedCollectionsTab` are shared across many views. Changes to these affect Projects, Contracts, Bookings, and Aggregate pages.

3. **Quotation/Contract duality** — quotations and contracts share the same data model and KV prefix. `quotation_type: "contract"` distinguishes them.

4. **Service type from booking prefix** — `ContractDetailView.tsx` has a fallback that infers service type from booking ID prefix (FWD-, BRK-, TRK-, MI-, OTH-) for backward compatibility.

5. **Aggregate pages reuse exact Unified components** — they don't recreate the UI. They fetch all data, construct the required props (`FinancialData`, etc.), and pass `readOnly={true}`.

## Things to Avoid

- Don't create new SQL tables or migration files — use the KV store
- Don't leak `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- Don't use `react-router-dom` — use `react-router`
- Don't use `react-resizable` — use `re-resizable`
- Don't modify protected files (`kv_store.tsx`, `ImageWithFallback.tsx`, `info.tsx`)
- Don't create mock data when real API endpoints exist
- Don't duplicate Unified tab component UI — always reuse them with props
- Don't add shadows where borders are expected (Neuron design system preference)
