# NEURON System Overview

**NEURON** (formerly "JJB OS") is a desktop web application for asset-light freight forwarding SMEs operating as logistics coordinators/brokers. Built as a frontend-only React application with mock data, it manages bookings, clients, accounting (billings, collections, expenses), HR (payroll, timekeeping), and financial reporting—all without physical truck fleets or drivers. The target users are Filipino logistics coordinators focused on margins, client retention, and subcontractor network management.

**In one sentence:** NEURON is a mock freight forwarding operations management system with comprehensive modules for booking coordination, financial tracking, HR management, and business intelligence—designed for Filipino logistics brokers and built entirely as a client-side React prototype.

---

## High-Level Architecture

### Architecture Type
**Frontend-Only Monolith** - Single-page React application with no backend, no database, and no persistent storage. All data is mock/hardcoded within React components using in-memory state management.

### Main Components

1. **Frontend Application** (`/`)
   - **Technology:** React 18+ with TypeScript, Tailwind CSS v4.0
   - **Entry Point:** `/App.tsx`
   - **Routing:** Client-side navigation using React state (no router library)
   - **State Management:** React hooks (useState, useEffect, useMemo)
   - **UI Library:** shadcn/ui components (MIT licensed) built on Radix UI primitives
   - **Styling:** Tailwind CSS v4.0 using CSS custom properties, no config file

2. **Design System** (`/styles/globals.css`, `/components/Neuron*.tsx`)
   - Custom "Neuron" design system with CSS variables
   - Deep green (#12332B, #0F766E) and white color scheme
   - Stroke borders instead of shadows or layering
   - Typography: Inter font family with SF Pro Display-like negative tracking
   - Component library: NeuronButton, NeuronCard, NeuronStatusPill, NeuronSidebar, NeuronPageHeader

3. **Component Library** (`/components/ui/`)
   - shadcn/ui components: Button, Input, Select, Dialog, Table, Tabs, etc.
   - Source: [shadcn/ui](https://ui.shadcn.com/) (MIT license)
   - Customized with Neuron design tokens

4. **Mock Data**
   - Hardcoded within each module component
   - No persistent storage—refreshing the page resets all data
   - TypeScript interfaces provide type safety

5. **Icons and Assets**
   - **Icons:** Lucide React (20px standard, 16px for small UI, 24px for headers)
   - **Images:** Imported via `figma:asset/...` paths (Figma Make asset handling)
   - **SVGs:** Custom SVG components in `/imports/`

6. **No Backend/Database/API**
   - No server-side code
   - No database (PostgreSQL, MySQL, MongoDB, etc.)
   - No REST or GraphQL API
   - No authentication service (mock login only)
   - No external integrations (OCR, email, SMS, payment gateways, etc.)

### Architecture Diagram
No architecture diagram file exists in the repository.

---

## Key Modules and Features

### Dashboard (Executive Dashboard)

**What it does:** Displays high-level KPIs, charts, and business intelligence for executives and managers. Shows revenue, profit, bookings, client metrics, trends, and recent activity.

**Who uses it:** Managers, executives, admin staff.

**Main screens/routes:**
- **Component:** `/components/ExecutiveDashboard.tsx`
- **Route:** `currentPage = "dashboard"` (default page after login)
- **Key Features:**
  - Hero metrics with trend indicators (revenue, profit, bookings, clients)
  - Line charts (revenue/profit over time using Recharts)
  - Bar charts (bookings by type, monthly comparison)
  - Pie charts (expense breakdown, client distribution)
  - Top clients table
  - Recent activity feed
  - Financial health scorecard
  - Cash flow visualization
  - Overdue receivables alerts

**Backend endpoints/services:** None—all data is mock arrays within the component.

**Database tables/models:** None—mock data only.

---

### Bookings Module

**What it does:** Manages shipment bookings (imports, exports, domestic, trucking) including tracking numbers, status updates, client assignment, pickup/dropoff locations, delivery dates, and profit tracking.

**Who uses it:** Logistics coordinators, operations staff, managers.

**Main screens/routes:**
- **Bookings List:** `/components/Bookings.tsx` (`currentPage = "bookings"`)
  - Displays all bookings in a table with filters
  - Status pills: Created, For Delivery, In Transit, Delivered, Cancelled, Closed
  - KPI cards: Total bookings, in transit, completed, cancelled
  - Search, pagination, export functionality (mock)
  
- **Create Booking:** `/components/CreateBooking.tsx` (triggered by "Create Booking" button)
  - Smart form with shipment type selector (IMPS, EXPS, DOM, TRK)
  - Transport mode (AIR, SEA, TRK, DOM)
  - Load type (FCL, LCL)
  - Auto-generated tracking numbers
  - Client picker with search
  - Route builder (pickup/dropoff)
  - Document upload placeholders
  
- **Booking Full View:** `/components/BookingFullView.tsx` (triggered by clicking a booking row)
  - Booking details, status timeline, documents, expenses, payments
  - Expense entry modal
  - Payment recording
  - Document management
  - Status update controls (with delivery date/time)

**Backend endpoints/services:** None—all CRUD operations are mock.

**Database tables/models:** None. Mock `Booking` interface:
```typescript
interface Booking {
  id: string;
  trackingNo: string;
  client: string;
  pickup: string;
  dropoff: string;
  status: "Created" | "For Delivery" | "In Transit" | "Delivered" | "Cancelled" | "Closed";
  deliveryType?: "Import" | "Export" | "Domestic";
  deliveryDate: string;
  delivered_at?: string;
  profit: number;
  driver?: string;
  vehicle?: string;
  notes?: string;
}
```

**Location in code:**
- `/components/Bookings.tsx` (list view)
- `/components/CreateBooking.tsx` (create form)
- `/components/BookingFullView.tsx` (detail view)
- `/components/BookingDetail.tsx` (alternative detail view, less used)
- `/components/CreateBookingModal.tsx` (modal variant)
- `/components/BookingSheetRight.tsx` (side sheet variant)
- `/components/ShipmentTypeSelector.tsx` (shipment type picker)
- `/components/DeliveryStatusControl.tsx` (status update widget)

---

### Clients Module

**What it does:** Manages client/customer master data including contact information, default routes, service types (import/export/domestic), payment terms, active bookings, and revenue tracking.

**Who uses it:** Sales, operations staff, account managers.

**Main screens/routes:**
- **Clients List:** `/components/Clients.tsx` (`currentPage = "clients"`)
  - Client table with search
  - KPI cards: Total clients, active bookings, total revenue
  - Add Client modal (form with contact info, services, notes)
  
- **Client Full View:** `/components/ClientFullView.tsx` (triggered by clicking a client)
  - Client profile details
  - Active and completed bookings for that client
  - Revenue history
  - Contact information
  - Quick "Create Booking" for this client

**Backend endpoints/services:** None—mock data.

**Database tables/models:** None. Mock `Client` interface:
```typescript
interface Client {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  defaultOrigin: string;
  defaultDestination: string;
  services: Array<"Import" | "Export" | "Domestic">;
  notes: string;
  activeBookings: number;
  totalRevenue: number;
  paymentTerms: string;
}
```

**Location in code:**
- `/components/Clients.tsx` (list and add modal)
- `/components/ClientFullView.tsx` (detail view)

---

### Accounting Module

**What it does:** Manages financial transactions across multiple companies (CCE, JLCS, CPTC, ZNICF): Billings (invoices), Collections (receipts/payments), and Expenses. Tracks billing status (Draft, Posted, Paid), collection application, expense categories, and payment channels. All amounts displayed in Philippine Peso (₱).

**Who uses it:** Accountants, finance staff, bookkeepers, managers.

**Main screens/routes:**
- **Accounting V8 (Current):** `/components/AccountingV8.tsx` (`currentPage = "accounting"`)
  - Three-tab layout: Billings, Collections, Expenses
  - Company filter (All Companies, JLCS, CCE, CPTC, ZNICF)
  - Status filters per tab
  - Month navigation (chevron controls)
  - File view modals for each entry type
  - Inline editing, status updates (Draft ↔ Posted ↔ Paid)
  - Export to Excel (mock)
  
- **Accounting V6 Components:** `/components/accounting-v6/`
  - `BillingFileView.tsx` - Billing detail modal with line items
  - `CollectionFileView.tsx` - Collection detail with application to invoices
  - `ExpenseFileView.tsx` - Expense detail with category breakdown
  - `NewBillingModal.tsx` - Create/edit billing form
  - `NewCollectionModal.tsx` - Create/edit collection form
  - `NewExpenseModal.tsx` - Create/edit expense form with numeric keypad
  - `ExpenseCategoriesDrawer.tsx` - Expense category management
  
- **Accounting V3 (Alternative Version):** `/components/AccountingV3.tsx` and `/components/accounting-v3/`
  - MyMoney-style lean entry manager
  - Month navigator, count pills, date-grouped list
  - Numeric keypad for entry input
  - Three tabs: Entries, Accounts, Categories
  - Minimalist UI without KPIs or charts
  - Documentation: `/components/accounting-v3/README.md`

**Backend endpoints/services:** None—all transactions stored in component state.

**Database tables/models:** None. Mock interfaces:
```typescript
interface Billing {
  id: string;
  invoiceDate: string;
  invoiceNo: string;
  bookingNo: string;
  client: string;
  company: string;
  particulars: string;
  amount: number;
  collected: number;
  balance: number;
  status: "Draft" | "Posted" | "Paid" | "Partial";
}

interface Collection {
  id: string;
  collectionDate: string;
  receiptNo: string;
  client: string;
  company: string;
  paymentMethod: string;
  refNo: string;
  appliedTo: string[];
  amountReceived: number;
  status: "Fully Applied" | "Partially Applied" | "Unapplied";
}

interface Expense {
  id: string;
  expenseDate: string;
  expenseNo: string;
  category: string;
  bookingNo: string;
  company: string;
  payee: string;
  expenseType: "Operations" | "Admin" | "Commission" | "Itemized Cost";
  paymentChannel: string;
  amount: number;
  status: "Unpaid" | "Paid" | "Draft";
}
```

**Location in code:**
- `/components/AccountingV8.tsx` (current main version)
- `/components/AccountingV7.tsx`, `V6.tsx`, `V5.tsx`, etc. (previous versions)
- `/components/accounting-v6/` (V6 subcomponents)
- `/components/accounting-v3/` (V3 lean version)
- `/components/accounting/` (earlier experimental version with full ERP-style layout)

---

### Reports Module

**What it does:** Generates financial reports including Sales Profit (period comparison), Company P&L, Per Booking Profitability, Client Profitability, and Receivables Aging. Supports month selection, custom date ranges, company filters, and export/print (mock).

**Who uses it:** Managers, executives, finance staff, operations managers.

**Main screens/routes:**
- **Reports Module:** `/components/ReportsModuleUpdated.tsx` (`currentPage = "reports"`)
  - Report type selector (dropdown): Sales Profit, Company P&L, Per Booking Profitability, Client Profitability, Receivables
  - Period controls: Month picker or custom date range
  - Company filter (All, CCE, ZNICF, JLCS)
  - "Generate Report" button (recalculates filtered data)
  - Export (Excel, PDF mock) and Print buttons
  
- **Report Components:** `/components/reports/`
  - `SalesProfitReport.tsx` - Summary cards, revenue/expense/profit table
  - `CompanyPnLReport.tsx` - P&L statement by company
  - `BookingProfitabilityReport.tsx` - Per-booking profit breakdown with sorting
  - `ClientProfitabilityReport.tsx` - Per-client revenue and profit analysis
  - `ReceivablesReport.tsx` - Aging report (current, 30, 60, 90+ days)
  - `MonthPicker.tsx` - Month/year selection widget
  - `DateRangePicker.tsx` - Custom date range picker
  - `BookingPickerModal.tsx` - Multi-select booking picker for drill-down
  
- **Mock Financials Builder:** `/components/reports/mockFinancials.ts`
  - Generates mock financial records from booking data
  - Random revenue/expense allocation for demo purposes

**Backend endpoints/services:** None—all calculations done client-side from mock booking/expense data.

**Database tables/models:** None—data derived from mock Booking, Expense, Payment arrays.

**Location in code:**
- `/components/ReportsModuleUpdated.tsx` (main module)
- `/components/ReportsModule.tsx`, `/components/ReportsModuleNew.tsx` (earlier versions)
- `/components/reports/` (report components)
- `/components/reporting/` (alternative reporting page with different design)
- `/components/SalesProfitReport.tsx` (standalone report component)

---

### HR Module

**What it does:** Manages employee data across multiple companies (CCE, ZEUJ, JUAN, ZN INT.). Handles employee profiles (personal info, employment details, salary), timekeeping (attendance tracking, late/undertime), and payroll (period-based, with deductions, allowances, payslips). All salary/payroll amounts in Philippine Peso (₱).

**Who uses it:** HR staff, payroll administrators, managers.

**Main screens/routes:**
- **HR Module:** `/components/HR.tsx` (`currentPage = "hr"`)
  - Three-section tabs: Profile, Timekeeping, Payroll
  - Company filter
  - Search bar
  
- **Profile Section:**
  - Employee roster table: ID, Name, Company, Position, Status, Date Hired, Last Payroll
  - "Add Employee" button
  - Employee row click opens full profile modal
  
- **Timekeeping Section:**
  - Excel-style editable grid (employee rows × date columns)
  - Status cells: Present, Absent, Leave (with late/undertime badges)
  - Inline editing with dropdown picker
  - Daily totals and employee totals
  - Month navigation
  
- **Payroll Section:**
  - Payroll run list (period, employees count, gross/net, status)
  - "Create Payroll" button
  - Payroll detail modal (employee breakdown, deductions, net pay)
  - "Generate Payslips" modal (individual payslip preview/print)

**HR Subcomponents:** `/components/hr/`
- `EmployeesList.tsx` - Employee roster table
- `EmployeeProfileModal.tsx` - Full employee profile view/edit
- `EmployeeFileModal.tsx` - Alternative full-view modal with tabs
- `EditableTimekeepingCell.tsx` - Excel-like cell editor
- `EmployeeRosterExcel.tsx` - Excel-style grid layout
- `CreatePayrollModal.tsx` - Payroll run creation wizard
- `PayrollDetailsModal.tsx` - Payroll run breakdown
- `PayrollPayslipsModal.tsx` - Payslip preview and print

**Backend endpoints/services:** None—all HR data is mock.

**Database tables/models:** None. Mock `Employee` interface:
```typescript
interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  company: string;
  position: string;
  status: "Active" | "Separated";
  dateHired: string;
  lastPayroll: string;
  // Full profile includes: salary, contact, emergency contact, employment dates, etc.
}
```

**Location in code:**
- `/components/HR.tsx` (main module)
- `/components/hr/` (subcomponents)

---

### Admin / Settings Module

**What it does:** System administration and configuration including user management (add/edit/delete users, assign roles), expense type definitions, document type templates, and tracking number format configuration.

**Who uses it:** System administrators, IT staff, managers with admin privileges.

**Main screens/routes:**
- **Admin/Settings:** `/components/Admin.tsx` (`currentPage = "admin"`)
  - Four-tab layout: Users, Expense Types, Document Types, System Settings
  
- **Users Tab:**
  - User table: Name, Email, Role (President/Employee), Status (Active/Inactive)
  - Add User button (opens dialog with form)
  - Delete user action
  
- **Expense Types Tab:**
  - List of expense categories (Fuel, Toll, Maintenance, Other)
  - Add/delete expense types
  
- **Document Types Tab:**
  - List of document templates (Booking Details, Expense Entries, Invoice, Receipt)
  - Add/delete document types
  
- **System Settings Tab:**
  - Tracking number format configuration (e.g., `ND-{YYYY}-{####}`)

**Backend endpoints/services:** None—all settings stored in component state.

**Database tables/models:** None. Mock `User` interface:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: "Employee" | "President";
  status: "Active" | "Inactive";
}
```

**Location in code:**
- `/components/Admin.tsx`

---

## Data Model and Persistence

### Database Technology
**None.** NEURON has no database. All data is stored in-memory as React state and is lost on page refresh.

### Main Entities/Tables (Mock Interfaces)

#### Booking
**What it represents:** A shipment booking record (import, export, domestic, or trucking).

**Main fields:**
- `id` (string) - Unique identifier
- `trackingNo` (string) - Human-readable tracking number (e.g., "FCL-IMPS-00012-SEA")
- `client` (string) - Client name
- `pickup`, `dropoff` (string) - Origin and destination
- `status` (enum) - Created, For Delivery, In Transit, Delivered, Cancelled, Closed
- `deliveryType` (enum) - Import, Export, Domestic
- `deliveryDate` (string) - Expected/actual delivery date
- `profit` (number) - Profit in Philippine Peso
- `driver`, `vehicle` (string, optional) - Subcontractor details
- `notes` (string, optional)

**Where defined:** Inline in `/App.tsx` (lines 131-283), `/components/Bookings.tsx`, `/components/BookingFullView.tsx`, etc.

#### Client
**What it represents:** A customer/client master record.

**Main fields:**
- `id` (string)
- `name` (string)
- `contactPerson`, `phone`, `email` (string) - Contact details
- `defaultOrigin`, `defaultDestination` (string) - Preferred routes
- `services` (array) - Service types offered (Import, Export, Domestic)
- `activeBookings` (number)
- `totalRevenue` (number) - Lifetime revenue in ₱
- `paymentTerms` (string)

**Where defined:** `/components/Clients.tsx`, `/components/ClientFullView.tsx`

#### Billing (Invoice)
**What it represents:** An invoice issued to a client for a booking.

**Main fields:**
- `id` (string)
- `invoiceNo`, `invoiceDate` (string)
- `bookingNo` (string) - Linked booking tracking number
- `client`, `company` (string)
- `particulars` (string) - Invoice line description
- `amount`, `collected`, `balance` (number) - Amounts in ₱
- `status` (enum) - Draft, Posted, Paid, Partial

**Where defined:** `/components/AccountingV8.tsx`, `/components/accounting-v6/BillingFileView.tsx`

#### Collection (Receipt)
**What it represents:** A payment received from a client, applied to one or more invoices.

**Main fields:**
- `id`, `receiptNo`, `collectionDate` (string)
- `client`, `company` (string)
- `paymentMethod` (string) - Bank Transfer, Check, Cash, etc.
- `refNo` (string) - External payment reference
- `appliedTo` (array of invoice numbers)
- `amountReceived` (number) - Amount in ₱
- `status` (enum) - Fully Applied, Partially Applied, Unapplied

**Where defined:** `/components/AccountingV8.tsx`, `/components/accounting-v6/CollectionFileView.tsx`

#### Expense
**What it represents:** An expense entry (operational cost, admin expense, commission, itemized cost).

**Main fields:**
- `id`, `expenseNo`, `expenseDate` (string)
- `category` (string) - Expense category (e.g., Trucking, Customs, Documentation)
- `bookingNo` (string, optional) - Linked booking
- `company` (string)
- `payee` (string) - Vendor/recipient
- `expenseType` (enum) - Operations, Admin, Commission, Itemized Cost
- `paymentChannel` (string) - Cash, Bank Transfer, etc.
- `amount` (number) - Amount in ₱
- `status` (enum) - Unpaid, Paid, Draft

**Where defined:** `/components/AccountingV8.tsx`, `/components/accounting-v6/ExpenseFileView.tsx`, `/App.tsx` (lines 285-341)

#### Payment
**What it represents:** A payment transaction for a booking (used in reports module).

**Main fields:**
- `id`, `bookingId`, `bookingNo` (string)
- `amount` (number) - Amount in ₱
- `date`, `method`, `reference` (string)
- `status` (enum) - Pending, Approved, Rejected

**Where defined:** `/App.tsx` (lines 343-394), `/components/ReportsModuleUpdated.tsx`

#### Employee
**What it represents:** An employee record with personal info, employment details, and payroll data.

**Main fields:**
- `id`, `employeeId` (string)
- `fullName`, `company`, `position` (string)
- `status` (enum) - Active, Separated
- `dateHired`, `lastPayroll` (string)
- Additional fields in full profile: salary, contact info, emergency contact, TIN, SSS, PhilHealth, Pag-IBIG numbers

**Where defined:** `/components/HR.tsx`, `/components/hr/EmployeesList.tsx`, `/components/hr/EmployeeProfileModal.tsx`

#### User
**What it represents:** A system user account for login and role-based access.

**Main fields:**
- `id`, `name`, `email` (string)
- `role` (enum) - Employee, President
- `status` (enum) - Active, Inactive

**Where defined:** `/components/Admin.tsx`, `/components/Login.tsx`, `/App.tsx`

### Relationships
**No foreign keys or database relationships.** Since all data is mock and in-memory, relationships are simulated by matching string fields (e.g., `Billing.bookingNo` matches `Booking.trackingNo`, `Expense.bookingId` matches `Booking.id`). The application code manually filters and joins data as needed.

---

## Frontend Application

### Tech Stack
- **Framework:** React 18+ (functional components with hooks)
- **Language:** TypeScript (`.tsx` files)
- **Styling:** Tailwind CSS v4.0 (CSS custom properties, no `tailwind.config.js`)
- **UI Library:** shadcn/ui (MIT licensed, built on Radix UI)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Handling:** date-fns
- **Utilities:** class-variance-authority (cva), clsx, tailwind-merge

### Folder Structure
```
/
├── App.tsx                          # Main entry point, routing, auth
├── styles/
│   └── globals.css                  # Tailwind, design tokens, typography
├── components/
│   ├── Layout.tsx                   # Layout wrapper with sidebar
│   ├── NeuronSidebar.tsx           # Left navigation sidebar
│   ├── ExecutiveDashboard.tsx      # Dashboard module
│   ├── Bookings.tsx                 # Bookings list
│   ├── CreateBooking.tsx            # Booking creation form
│   ├── BookingFullView.tsx          # Booking detail view
│   ├── Clients.tsx                  # Clients list
│   ├── ClientFullView.tsx           # Client detail view
│   ├── AccountingV8.tsx             # Accounting module (current)
│   ├── ReportsModuleUpdated.tsx     # Reports module
│   ├── HR.tsx                       # HR module
│   ├── Admin.tsx                    # Settings/admin module
│   ├── Login.tsx                    # Login page (mock)
│   ├── Neuron*.tsx                  # Neuron design system components
│   ├── ui/                          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── accounting-v6/              # Accounting V6 subcomponents
│   ├── accounting-v3/              # Accounting V3 subcomponents
│   ├── accounting/                 # Accounting experimental
│   ├── hr/                         # HR subcomponents
│   ├── reports/                    # Report components
│   ├── reporting/                  # Alternative reporting page
│   └── figma/
│       └── ImageWithFallback.tsx   # Protected image component
├── imports/                         # SVG imports
│   ├── Vector.tsx                   # Philippine Peso icon
│   └── svg-*.ts                     # Other SVGs
├── guidelines/                      # Documentation
│   ├── Guidelines.md
│   └── ComponentLibrary.md
└── docs/                            # System documentation
    └── NEURON_SYSTEM_OVERVIEW.md    # This file
```

### Routing
**No router library.** Navigation is handled by React state in `/App.tsx`:
- `currentPage` state variable (type `Page = "dashboard" | "bookings" | "clients" | "accounting" | "reports" | "hr" | "admin"`)
- `handleNavigate(page: Page)` function updates state
- `renderPage()` switch statement renders the appropriate component
- Sidebar navigation calls `onNavigate(page)` prop

### Layout Components
- **`/components/Layout.tsx`** - Main layout wrapper with NeuronSidebar and content area
  - Fixed 272px left sidebar (collapsible to 72px)
  - Flex-1 content area with vertical scroll
  - Background: `--neuron-bg-page` (#F7FAF8)
  
- **`/components/NeuronSidebar.tsx`** - Left navigation sidebar
  - Logo, search input, navigation items with icons
  - Active state with green left indicator
  - Collapsible (chevron button)
  - User profile in footer
  - Hover states with smooth transitions

### Shared Components
**Design System Components** (`/components/Neuron*.tsx`):
- `NeuronButton.tsx` - Three variants (primary, secondary, ghost), three sizes
- `NeuronCard.tsx` - Card container with elevation levels
- `NeuronStatusPill.tsx` - Status badges (success, warning, danger, neutral, info)
- `NeuronPageHeader.tsx` - Page header with title, subtitle, actions
- `NeuronSidebar.tsx` - Navigation sidebar

**shadcn/ui Components** (`/components/ui/`):
- `button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `select.tsx`
- `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`
- `table.tsx`, `tabs.tsx`, `card.tsx`, `badge.tsx`, `avatar.tsx`
- `calendar.tsx`, `command.tsx` (command palette)
- `toast-utils.tsx` (toast notifications using Sonner)
- `utils.ts` - cn() utility (clsx + tailwind-merge)

### State Management
**No global state library.** All state is local to components using React hooks:
- `useState` - Component-level state (form inputs, modals, filters, etc.)
- `useEffect` - Side effects (data loading, subscriptions, etc.)
- `useMemo` - Memoized computations (filtered data, sorted lists, etc.)
- Props drilling for parent-child communication
- Callback props for child-to-parent events (e.g., `onNavigate`, `onViewBooking`, etc.)

### Design Tokens and Themes
**Location:** `/styles/globals.css` (lines 5-94)

**Neuron Design Tokens:**
- **Backgrounds:** `--neuron-bg-page`, `--neuron-bg-elevated`
- **Ink (Text):** `--neuron-ink-primary`, `--neuron-ink-secondary`, `--neuron-ink-muted`
- **Brand:** `--neuron-brand-green`, `--neuron-brand-green-600`, `--neuron-brand-green-100`
- **Accent:** `--neuron-accent-terracotta`
- **UI:** `--neuron-ui-border`, `--neuron-ui-divider`
- **States:** `--neuron-state-hover`, `--neuron-state-selected`
- **Semantic:** `--neuron-semantic-success`, `--neuron-semantic-warn`, `--neuron-semantic-danger`
- **Elevation:** `--elevation-1`, `--elevation-2` (box shadows)
- **Radius:** `--neuron-radius-s`, `--neuron-radius-m`, `--neuron-radius-l`

**Typography System:**
- **Display/32:** 32px/40px/Semibold/-1.5% tracking
- **H1/24:** 24px/32px/Semibold/-1.0% tracking
- **H2/20:** 20px/28px/Semibold/-0.5% tracking
- **Body/16:** 16px/24px/Regular/0% tracking
- **Body/14:** 14px/20px/Regular/0% tracking
- **UI/12:** 12px/16px/Medium/+0.2% tracking

**Usage:**
- Typography styles are defined in `:root` and automatically applied to HTML elements (`h1`, `h2`, `h3`, `p`, etc.)
- **Important:** Do not use Tailwind font size/weight classes (e.g., `text-2xl`, `font-bold`) unless user requests—use the default HTML element styles or inline styles with CSS variables

**Reusable Patterns:**
- Consistent padding: `32px 48px` for page containers
- Card borders: `1px solid #E5E9F0`
- Hover states: `--neuron-state-hover`
- Focus rings: `2px outline at 40% opacity`
- Stroke borders instead of shadows (except for cards/modals)

---

## Backend / API Layer

**There is no backend or API layer in NEURON.** The application is a frontend-only prototype with no server-side code, no database, and no persistent storage.

### What This Means:
- No Express, NestJS, Laravel, Django, FastAPI, etc.
- No REST API, GraphQL API, or RPC endpoints
- No controllers, services, repositories, or business logic layers
- No database queries, ORM models, or SQL/NoSQL operations
- No authentication/authorization backend (login is mock)
- No file upload handling, email sending, or external API calls

### How CRUD Operations Work:
All Create, Read, Update, Delete operations are simulated in the React components using `useState`:
- **Create:** Push new item to state array
- **Read:** Render state array
- **Update:** Find item in array by ID, update fields
- **Delete:** Filter item out of array by ID

**Example:** Adding a new booking in `CreateBooking.tsx` calls `onSubmit(bookingData)`, which passes the data to `App.tsx`, which logs it to console. No persistence occurs.

### Mock Login:
`/App.tsx` (lines 17-121) contains a `LoginPage` component:
- Accepts any email and password
- No validation or authentication
- On submit, extracts name from email (before `@`) and sets `currentUser` state
- No JWT, session, OAuth, or backend auth service

---

## Authentication, Authorization, and Users

### Authentication Mechanism
**Mock authentication only.** No real auth backend.

**How it works:**
1. User enters email and password in `LoginPage` (`/App.tsx`, lines 17-121)
2. Form submit calls `handleLogin(email)` which sets `isAuthenticated = true` and `currentUser = { name, email }`
3. No password validation, no API call, no token generation
4. Logout clears `isAuthenticated` and `currentUser` state

### User Roles
**Two roles defined** (from `/components/Admin.tsx`):
- **"Employee"** - Standard user
- **"President"** - Admin/manager user

**No role-based access control implemented.** All modules are accessible to all logged-in users regardless of role. The role field is only displayed in the Admin module user table.

### Permissions
**No permission system.** There are no granular permissions, role checks, or access control lists. Any logged-in user can access all modules and perform all actions.

### Key Auth Files
- `/App.tsx` (lines 17-121) - LoginPage component
- `/App.tsx` (lines 123-483) - Main App with `isAuthenticated` state
- `/components/Login.tsx` - Standalone login component (not used in current flow)
- `/components/Admin.tsx` - User management UI (lines 13-44)

---

## Integrations and External Services

**None.** NEURON has no external integrations, third-party services, or API connections.

### Expected Integrations (Not Implemented):
- **OCR for Document Parsing:** Not implemented
- **Email/SMTP:** Not implemented (no email sending)
- **SMS/Notifications:** Not implemented
- **Cloud Storage (AWS S3, Azure Blob, GCS):** Not implemented (file uploads are mock)
- **Payment Gateways:** Not implemented
- **Accounting Software Integration (QuickBooks, Xero):** Not implemented
- **Customs/Government API Integration:** Not implemented
- **Tracking API (shipment tracking):** Not implemented
- **Google Maps/Geocoding API:** Not implemented

### Why No Integrations:
NEURON is a **frontend prototype** designed to demonstrate UI/UX and business logic flow. All data is mock and all external actions (email, file upload, export, print) are simulated with toast notifications or console logs.

---

## Configuration, Environments, and Secrets

### Environment Variables
**None visible in the codebase.** There is no `.env` file, no environment variable loading (e.g., `process.env.REACT_APP_*`), and no configuration files for different environments.

### Configuration Files
**None.** The application has no configuration loading mechanism. All settings are hardcoded in components.

### Environments
**No environment separation.** There is no dev/staging/production configuration. The application runs the same way regardless of deployment environment.

### Secrets Management
**No secrets.** Since there are no API keys, database connection strings, or external service credentials, there is no secrets management.

---

## Deployment and Hosting

### Deployment Configuration
**No explicit deployment configuration found.** The repository does not contain:
- `Dockerfile` or `docker-compose.yml`
- CI/CD pipeline config (GitHub Actions, GitLab CI, CircleCI, etc.)
- Deployment scripts (e.g., `deploy.sh`)
- Server config files (Nginx, Apache, etc.)
- Cloud provider config (AWS, GCP, Azure, Vercel, Netlify, etc.)

### Expected Deployment (Based on Stack):
Since NEURON is a React + Tailwind application built with **Figma Make**, it is likely:
1. **Built by Figma Make's build system** (bundler/compiler not visible in repo)
2. **Hosted on Figma Make's platform** or exported as static HTML/CSS/JS
3. **Served as a static site** (no server-side rendering, no backend)

### Local Development Build (Hypothetical):
If this were a standard React project, you would:
```bash
npm install
npm run dev    # Start development server
npm run build  # Build production bundle
```

However, since this is a Figma Make project, the build/run commands are abstracted by the Figma Make platform.

---

## Logging, Monitoring, and Error Handling

### Frontend Error Handling
**Minimal error handling.** Most components use:
- `console.log()` for debugging
- `toast()` notifications (via Sonner library) for user-facing success/error messages
- No global error boundary component
- No structured logging

**Example:**
```typescript
// From /components/Admin.tsx
const handleAddUser = () => {
  onAddUser?.(newUser);
  // No try/catch, no error handling
};
```

### Logging
**Console logging only.** No logging library (e.g., Winston, Pino, log4js) or logging service (e.g., Sentry, Datadog, LogRocket).

**Where logs appear:**
- Browser console (`console.log`, `console.error`, `console.warn`)
- Toast notifications for user actions (e.g., "Booking created successfully")

### Monitoring and Error Tracking
**None.** No monitoring tools configured:
- No Sentry
- No Application Performance Monitoring (APM)
- No Real User Monitoring (RUM)
- No error tracking dashboards

### What Happens on Error:
- JavaScript errors show in browser console
- React errors may crash the component tree (no error boundary)
- Network errors don't occur (no API calls)
- User sees no error message unless explicitly handled with `toast.error()`

---

## Testing

### Test Files
**No test files found in the repository.** There are no files matching common test patterns:
- No `*.test.tsx`, `*.test.ts`, `*.spec.tsx`, `*.spec.ts` files
- No `/tests/` or `/__tests__/` directories
- No test configuration files (`jest.config.js`, `vitest.config.ts`, `cypress.config.ts`, etc.)

### Testing Frameworks
**None configured.** Expected testing libraries for a React project would include:
- **Unit testing:** Jest, Vitest
- **Component testing:** React Testing Library, Enzyme
- **End-to-end testing:** Cypress, Playwright, Puppeteer

None of these are present.

### Running Tests
**Not applicable.** There are no tests to run.

### Test Coverage
**0%** - No tests exist.

---

## Local Development Setup

### Prerequisites
Since NEURON is built with **Figma Make**, it is not a standard Node.js project. However, if this were exported as a standard React application, the prerequisites would be:

- **Node.js:** v18+ recommended
- **Package Manager:** npm, yarn, or pnpm
- **Browser:** Modern browser (Chrome, Firefox, Safari, Edge)

### Installation Steps (Hypothetical)
If this were a standalone React project:

```bash
# Clone the repository
git clone <repository-url>
cd neuron

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# Navigate to http://localhost:3000 (or port shown in terminal)
```

### Figma Make Workflow (Actual)
Since this is a Figma Make project:
1. **Open in Figma Make** - Edit the project directly in Figma Make's web interface
2. **Preview** - Use Figma Make's built-in preview/dev server
3. **No local setup required** - All editing and testing happens in Figma Make

### Running the Application
**In Figma Make:**
- Edit components in the Figma Make editor
- Preview updates in real-time
- No separate build/run commands needed

**If Exported:**
- Build output would be static HTML/CSS/JS files
- Serve with any static file server (e.g., `npx serve build`)

### Sample Data / Seeding
**No seed scripts.** All mock data is hardcoded in components:
- Mock bookings in `/App.tsx` (lines 131-283)
- Mock clients in `/components/Clients.tsx`
- Mock employees in `/components/HR.tsx`
- Mock billings/collections/expenses in `/components/AccountingV8.tsx`

To add more sample data, directly edit the mock arrays in the component files.

---

## Known Limitations and TODOs

### Known Limitations

- **No Backend:** All data is mock and in-memory. Refreshing the page loses all changes.
- **No Authentication:** Login is mock with no real validation or security.
- **No Persistence:** No database, no local storage, no session storage.
- **No File Uploads:** Document upload buttons are placeholders.
- **No External Integrations:** No email, SMS, payment gateways, cloud storage, etc.
- **No Responsive Mobile Design:** Desktop-focused UI. Mobile experience not optimized.
- **No Role-Based Access Control:** All users see all modules regardless of role.
- **No Real Calculations:** Reports use mock data generation, not real accounting math.
- **No Search Functionality:** Search bars are UI placeholders with no actual search logic.
- **No Export/Print:** Export to Excel/PDF and Print buttons show toast notifications but don't generate files.
- **No Error Boundaries:** JavaScript errors can crash the entire app with no fallback UI.
- **No Internationalization (i18n):** Hardcoded English text only.
- **No Accessibility (a11y) Testing:** No ARIA labels, keyboard navigation, or screen reader testing.
- **No Tests:** 0% test coverage.
- **Inconsistent Data Model:** Some fields present in one module, missing in others (e.g., booking profit vs. revenue/expenses breakdown).
- **No Audit Trail:** No tracking of who created/modified records or when.
- **No Bulk Operations:** No multi-select, bulk edit, bulk delete, etc.
- **No Advanced Filters:** Filter UI is limited; no complex queries or saved filters.
- **Currency Hardcoded:** Philippine Peso (₱) is hardcoded; no multi-currency support.
- **Date Format Inconsistency:** Some dates are "Oct 15", others "2025-10-15", no centralized formatting.
- **No Pagination:** Large datasets would cause performance issues (all data rendered at once).
- **No Lazy Loading:** All components load on mount; no code splitting.
- **No Service Workers / PWA:** Not a Progressive Web App; no offline support.
- **Tailwind CSS v4.0:** Using bleeding-edge version; may have undocumented breaking changes.

### TODOs (Based on Code Comments and Docs)

**From `/NEURON-DESIGN-SYSTEM.md`:**
- [ ] Anonymize branding (remove "JJB" references, replace client names)
- [ ] Update Bookings module with Neuron components
- [ ] Update Clients module with Neuron design
- [ ] Update Accounting module colors (navy/orange → green/terracotta)
- [ ] Update Reports module with Neuron styling
- [ ] Update HR module with Neuron design
- [ ] Create NeuronTable component with standardized table styles
- [ ] Verify all transitions use 120ms ease-out
- [ ] Add focus rings for accessibility
- [ ] Ensure responsive behavior (sidebar fixed, content scrolls)
- [ ] Update component library docs
- [ ] Create Storybook/demo page
- [ ] Accessibility audit

**From Component Files:**
- `/components/Bookings.tsx` - "Could show a success toast here" (line 431 in App.tsx)
- `/components/BookingFullView.tsx` - Expense and payment modals have placeholder logic
- `/components/AccountingV8.tsx` - Export to Excel is mock (shows toast, no actual export)
- `/components/ReportsModuleUpdated.tsx` - Print and PDF export are mock
- `/components/HR.tsx` - Payslip print is mock (shows alert)

**From Documentation:**
- Complete all modules migration to Neuron design system
- Remove legacy code and unused components
- Final QA pass before "launch"
- User feedback loop for UX refinements

### Open Questions

1. **Backend Implementation:** What backend technology should be used if this moves to production? Node.js? PHP? Python?
2. **Database Choice:** Which database is appropriate? PostgreSQL? MySQL? MongoDB?
3. **Authentication Provider:** Should this use a service like Auth0, Firebase Auth, or a custom auth system?
4. **File Storage:** Where should documents be stored? AWS S3? Azure Blob? Cloudinary?
5. **Hosting Plan:** Should this be self-hosted or use a managed service (Vercel, Netlify, AWS Amplify)?
6. **Deployment Strategy:** Docker containers? Serverless? Traditional VPS?
7. **Mobile Strategy:** Should there be a native mobile app? Responsive web only? React Native?
8. **Offline Support:** Is offline functionality required for field workers?
9. **Multi-Tenancy:** Should the system support multiple companies with data isolation?
10. **Localization:** Beyond English, what languages are needed? Tagalog?
11. **Performance at Scale:** How many concurrent users? How many bookings/transactions per month?
12. **Compliance Requirements:** Are there GDPR, SOC 2, ISO 27001, or other compliance needs?
13. **Integration Priorities:** Which external integrations are most critical? Email? Customs API? Accounting software?
14. **Reporting Engine:** Should reports be generated server-side or client-side? Use a reporting library (e.g., Jasper, Crystal Reports)?
15. **Real-Time Updates:** Is real-time collaboration or live data sync needed (e.g., WebSockets)?

---

## Glossary of NEURON Terms

- **Booking** - A shipment record; a single logistics job from pickup to delivery. Also called "Shipment".
- **Tracking Number** - Unique identifier for a booking (e.g., "FCL-IMPS-00012-SEA").
- **Client** - A customer who uses NEURON's logistics services.
- **Subcontractor** - Third-party driver or carrier who performs the actual transportation (not managed in NEURON currently).
- **Billing** - An invoice issued to a client for a completed booking.
- **Collection** - A payment received from a client, applied to one or more billings.
- **Expense** - A cost incurred for operations, admin, commission, or itemized costs.
- **RFP (Request for Payment)** - Alternative term for Expense in some accounting contexts.
- **Company** - One of the business entities under the NEURON umbrella (CCE, JLCS, CPTC, ZNICF, ZEUJ, etc.).
- **FCL (Full Container Load)** - A shipment that fills an entire shipping container.
- **LCL (Less than Container Load)** - A shipment that shares container space with other shipments.
- **IMPS (Import Shipment)** - Cargo arriving into the Philippines from abroad.
- **EXPS (Export Shipment)** - Cargo leaving the Philippines for abroad.
- **DOM (Domestic Shipment)** - Cargo moving within the Philippines.
- **TRK (Trucking)** - Land transportation via truck.
- **AIR** - Air freight shipment.
- **SEA** - Ocean freight shipment.
- **Posted** - A billing that has been finalized and sent to the client.
- **Draft** - A billing or expense that is still being edited.
- **Partial Payment** - A billing that has been partially paid (balance remaining).
- **Fully Applied** - A collection that has been fully allocated to billings.
- **Unapplied** - A collection that has not yet been allocated to any billing.
- **Payroll Run** - A payroll period calculation for a group of employees.
- **Payslip** - An employee's pay statement for a specific payroll period.
- **Timekeeping** - Attendance tracking (present, absent, leave, late, undertime).
- **Neuron Design System** - The custom UI design language used throughout NEURON (deep green, stroke borders, Inter font).
- **KPI (Key Performance Indicator)** - A metric card showing business performance (e.g., total revenue, profit margin).
- **₱ (Philippine Peso)** - Currency symbol used throughout the application.
- **President** - Admin/manager user role in the system.
- **Employee** - Standard user role in the system.
- **Settings** - The Admin module for system configuration.

---

## References and Resources

### Internal Documentation
- `/NEURON-DESIGN-SYSTEM.md` - Design system migration guide
- `/components/accounting-v3/README.md` - Accounting V3 module docs
- `/components/accounting/README.md` - Accounting experimental module docs
- `/components/reporting/README.md` - Reporting page docs
- `/components/hr/EMPLOYEE-ROSTER-EXCEL-VIEW.md` - HR timekeeping grid docs
- `/components/hr/PAYSLIP-PRINT-FEATURE.md` - Payslip printing feature notes
- `/components/BILLING-MODAL-REFACTOR.md` - Billing modal refactor notes
- `/guidelines/Guidelines.md` - General development guidelines
- `/guidelines/ComponentLibrary.md` - Component library guidelines

### External Dependencies
- **shadcn/ui:** [https://ui.shadcn.com/](https://ui.shadcn.com/) (MIT license)
- **Radix UI:** [https://www.radix-ui.com/](https://www.radix-ui.com/) (MIT license)
- **Tailwind CSS:** [https://tailwindcss.com/](https://tailwindcss.com/)
- **Lucide Icons:** [https://lucide.dev/](https://lucide.dev/)
- **Recharts:** [https://recharts.org/](https://recharts.org/)
- **date-fns:** [https://date-fns.org/](https://date-fns.org/)
- **Sonner (Toast):** [https://sonner.emilkowal.ski/](https://sonner.emilkowal.ski/)

### Attributions
- `/Attributions.md` - Lists shadcn/ui (MIT) and Unsplash (used for stock photos)

---

## Appendix: File Inventory

### Top-Level Files
- `App.tsx` - Main application entry point (483 lines)
- `Attributions.md` - Dependency attributions

### Styles
- `styles/globals.css` - Global styles and Neuron design tokens

### Components (Root Level)
- `Layout.tsx` - Main layout wrapper
- `NeuronSidebar.tsx` - Navigation sidebar
- `NeuronButton.tsx`, `NeuronCard.tsx`, `NeuronStatusPill.tsx`, `NeuronPageHeader.tsx` - Neuron design system components
- `ExecutiveDashboard.tsx` - Dashboard module
- `Bookings.tsx`, `CreateBooking.tsx`, `BookingFullView.tsx`, `BookingDetail.tsx`, `BookingSheetRight.tsx`, `CreateBookingModal.tsx` - Bookings module
- `Clients.tsx`, `ClientFullView.tsx` - Clients module
- `AccountingV8.tsx`, `AccountingV7.tsx`, `AccountingV6.tsx`, `AccountingV5.tsx`, `AccountingV4.tsx`, `AccountingV3.tsx`, `AccountingV2.tsx`, `Accounting.tsx` - Accounting module versions
- `ReportsModuleUpdated.tsx`, `ReportsModule.tsx`, `ReportsModuleNew.tsx`, `Reports.tsx`, `SalesProfitReport.tsx` - Reports module
- `HR.tsx` - HR module
- `Admin.tsx` - Settings/admin module
- `Login.tsx` - Login page component
- `Dashboard.tsx`, `DashboardAnalytics.tsx` - Alternative dashboard versions
- `ShipmentTypeSelector.tsx`, `DeliveryStatusControl.tsx`, `ShipmentMonitoringForm.tsx` - Booking-related utilities
- `ExpenseModal.tsx`, `AccountingExpenseModal.tsx`, `AccountingRevenueModal.tsx`, `AccountingEntryModal.tsx`, `EntryFileView.tsx`, `ExpenseFileView.tsx` - Accounting-related modals
- `BillingWorkspace.tsx` - Billing workspace (alternative UI)
- `TopNav.tsx`, `TopBarMinimal.tsx`, `PageHeader.tsx`, `SafeAreaTop.tsx` - Navigation and header components

### Components (Subdirectories)
- `components/ui/` - shadcn/ui components (40+ files)
- `components/accounting-v6/` - Accounting V6 subcomponents (7 files)
- `components/accounting-v3/` - Accounting V3 subcomponents (12 files)
- `components/accounting/` - Accounting experimental (20+ files)
- `components/hr/` - HR subcomponents (8 files)
- `components/reports/` - Report components (9 files)
- `components/reporting/` - Alternative reporting page (9 files)
- `components/figma/` - Protected Figma Make components
  - `ImageWithFallback.tsx` - Protected image component

### Imports
- `imports/Vector.tsx` - Philippine Peso icon
- `imports/PhilippinePeso.tsx` - Alternative Peso icon
- `imports/svg-*.ts` - SVG path data (3 files)

### Guidelines and Documentation
- `guidelines/Guidelines.md`, `guidelines/ComponentLibrary.md`
- `NEURON-DESIGN-SYSTEM.md` - Design system migration guide
- `DASHBOARD-FINAL-POLISH.md`, `DASHBOARD-MODULE-REFACTOR.md`, `DASHBOARD-POLISH-SUMMARY.md`, `DASHBOARD-SPACING-OVERFLOW-FIX.md` - Dashboard refactor notes
- `DESIGN-SYSTEM-ALIGNMENT.md` - Design system alignment notes
- `HR-PROFILE-REFACTOR-SUMMARY.md`, `HR-ROLE-ROUTING-FIX.md` - HR module notes
- `NAVBAR-SAFE-AREA-UPDATE.md` - Navbar update notes
- Component-level README.md files in various subdirectories

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-28  
**Maintained By:** Development Team  
**Status:** Living Document - Update as system evolves
