# Neuron OS — Project Overview

## What Is This?

**Neuron OS** is a desktop web application for **asset-light freight forwarding SMEs in the Philippines**. The target users are logistics brokers/coordinators who don't own trucks or ships — they coordinate shipments through subcontractor networks and earn margins on the spread between selling prices and vendor costs.

The app manages the full business lifecycle: sales inquiries, quotation building, contract management, operations bookings, accounting (billings, expenses, invoices, collections), HR, and executive reporting.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18+ with TypeScript |
| **Styling** | Tailwind CSS v4.0 (no `tailwind.config.js` — uses CSS custom properties in `/styles/globals.css`) |
| **UI Library** | shadcn/ui components (Radix UI primitives) in `/components/ui/` |
| **Icons** | `lucide-react` (20px standard, 16px small, 24px headers) |
| **Routing** | `react-router` (BrowserRouter with `<Routes>` / `<Route>`) — NOT `react-router-dom` |
| **State** | React hooks (useState, useEffect, useMemo, useCallback) — no Redux/Zustand |
| **Backend** | Supabase Edge Function running a **Hono** web server (Deno runtime) |
| **Database** | Supabase KV store (`kv_store.tsx`) — all data stored as key-value pairs with prefix-based querying |
| **Storage** | Supabase Storage (private buckets for attachments) |
| **Auth** | Mock login (localStorage-based user persistence, dev role override) |
| **Charts** | Recharts |
| **Toasts** | Sonner (`sonner@2.0.3`) |
| **Animations** | Motion (`motion/react`) |

## Design System — "Neuron Style"

Defined in `/styles/globals.css` and `/docs/NEURON_DESIGN_SYSTEM.md`:

- **Primary colors:** Deep green `#12332B` (ink), Teal `#0F766E` (actions/accents)
- **Backgrounds:** White `#FFFFFF` (elevated), Off-white `#F7FAF8` (page)
- **Borders:** Stroke-based (`#E5E9F0`, `#E5ECE9`) — prefer borders over shadows
- **Typography:** Inter font, negative tracking on headings, 13px body text
- **Components:** `NeuronSidebar`, `NeuronCard`, `NeuronStatusPill`, `PageHeader`, `DataTable`
- **Tables:** Use `/components/common/DataTable.tsx` — generic typed table with column definitions, loading states, selection, and footer summaries
- **Dropdowns:** `/components/bd/CustomDropdown.tsx` uses `createPortal` to `document.body` with `position: fixed`, `zIndex: 9999`, scroll-repositioning (not scroll-closing), `width: "max-content"` with `minWidth`

## Entry Point

`/App.tsx` is the main entry. Structure:
```
App (default export)
  └─ UserProvider
      └─ NeuronCacheProvider
          └─ AppModeProvider
              └─ BrowserRouter
                  └─ AppContent (Routes)
```

- `LoginPage` shown when not authenticated
- `AppContent` renders all `<Route>` elements inside `<Layout>` wrappers
- Layout = NeuronSidebar (left, 272px fixed) + main content area

## Key Directories

```
/App.tsx                          — Entry point, routing, login page
/components/
  NeuronSidebar.tsx               — Left sidebar navigation (department-aware, mode-aware)
  Layout.tsx                      — Sidebar + main content shell
  accounting/                     — Accounting module pages and components
  bd/                             — Business Development components
  contracts/                      — Contracts module
  operations/                     — Operations bookings (5 service types)
  pricing/                        — Pricing/Quotations module
  projects/                       — Projects module
  shared/                         — Shared components (billings, invoices, collections tabs)
  common/                         — Generic reusable components (DataTable, SidePanel, DatePicker)
  ui/                             — shadcn/ui primitives
  reports/                        — Report components
  ticketing/                      — Internal ticket system
  transactions/                   — Bank transactions module
/config/
  appMode.tsx                     — Essentials vs Full Suite mode context
/hooks/                           — Custom React hooks
/types/                           — TypeScript interfaces (pricing, operations, accounting, etc.)
/utils/                           — Business logic utilities (rate engines, calculations, adapters)
/constants/                       — Static data (quotation charge presets)
/supabase/functions/server/       — Backend (Hono server + handlers)
/docs/                            — Documentation and specs
/docs/blueprints/                 — Implementation blueprints (phased plans)
/docs/designs/                    — Parked design concepts
/styles/globals.css               — Tailwind v4 + Neuron design tokens
```

## Authentication & User System

- Mock auth: users are created via localStorage, no real Supabase auth
- `useUser()` hook from `/hooks/useUser.tsx` provides `user`, `isAuthenticated`, `effectiveDepartment`, `effectiveRole`
- Dev role override: stored in `localStorage('neuron_dev_role_override')`, lets you switch departments for testing
- Departments: `Business Development`, `Pricing`, `Operations`, `Accounting`, `Executive`
- Roles: `rep`, `manager`, `director`
- Executive department sees all modules

## App Mode System

`/config/appMode.tsx` provides `useAppMode()`:
- **Essentials mode:** Simplified Accounting sidebar (Billings, Expenses, Invoices, Collections, Reports). Aggregate pages use Unified tab components with `readOnly={true}`. Reports shows Financial Health page.
- **Full Suite mode:** Full Accounting sidebar with all sub-modules (E-Vouchers, COA, Auditing, Transactions, etc.). Reports shows traditional Financial Reports.
- Stored in `localStorage('neuron_app_mode')`, toggled on login page
- Default: `"essentials"`
