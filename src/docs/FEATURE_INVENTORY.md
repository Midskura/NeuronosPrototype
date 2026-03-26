# Neuron OS Feature Inventory

This document explains what the codebase actually does in plain English.

It is based on the current repository state as of 2026-03-24, including the current worktree changes.

## How to Read This

Status labels:
- `[Live]` Available in routes and/or normal app navigation.
- `[WIP]` Already present in code, but still being actively built or refined.
- `[Internal]` Hidden, admin-only, debug-only, or mainly for developers/ops.
- `[Backend]` A data or schema capability that clearly supports product behavior.
- `[Planned]` Described in docs or blueprints, but not clearly finished in product code.
- `[Legacy]` Older or transitional behavior still present in the repo.

What counts as a feature here:
- A page.
- A workflow.
- A meaningful capability inside a page.
- A hidden/internal tool if it affects how the system operates.

## System at a Glance

Neuron OS is trying to cover the full freight-forwarding business flow:
- Win work in Business Development.
- Price and structure quotations in Pricing.
- Convert winning work into Projects and Contracts.
- Execute shipments in Operations.
- Track billings, invoices, collections, expenses, and reports in Accounting.
- Manage employees and payroll in HR.
- Handle internal communication and handoffs through Inbox and Ticketing.

In other words, this is not one module. It is a small ERP-style operating system for a logistics company.

## 1. Core App and Access Control

### What this area is for

This is the app shell: login, roles, routing, navigation, and the rules that decide what each user can see.

### Main features

- `[Live]` Users can sign in with email and password through Supabase auth.
- `[Live]` Users can create accounts through a signup flow.
- `[Live]` Signup captures department and role.
- `[Live]` Operations signups also capture service type and operations role.
- `[Live]` The app handles email-confirmation style signup outcomes.
- `[Live]` Logged-in users get their profile loaded from the `users` table.
- `[Live]` Sessions persist across reloads.
- `[Live]` Users can log out cleanly.
- `[Live]` Routes are protected by department.
- `[Live]` Some routes are protected by minimum role, such as manager-only and director-only pages.
- `[Live]` The sidebar changes based on department.
- `[Live]` The sidebar changes based on accounting mode.
- `[Live]` The sidebar can collapse and remembers its state.
- `[Live]` The sidebar remembers whether BD, Pricing, Operations, and Accounting menus were expanded.
- `[Live]` The sidebar shows an unread badge for Inbox.
- `[Live]` The app supports query-param deep links into projects, contracts, bookings, and prefilled ticket flows.
- `[Live]` The app uses lazy-loaded route modules to keep the shell lighter.
- `[Live]` There is a shared layout shell with sidebar plus main content area.
- `[Live]` Global toast notifications are used across the app.

### Power-user and dev features

- `[Live]` There is a dev role override system so someone can impersonate another department/role for testing.
- `[Live]` Accounting has two app modes: Essentials and Full Suite.
- `[Live]` Cached data fetching is built into the client through `useNeuronCache`.

### Hidden/internal routes

- `[Internal]` Diagnostics page.
- `[Internal]` Supabase debug page.
- `[Live]` Design system guide.
- `[Live]` Profile page.
- `[Live]` Calendar page currently exists as a placeholder.

## 2. Executive Dashboard

### What this area is for

This is the top-level management dashboard. It is less about record editing and more about business health.

### Main features

- `[Live]` Executive dashboard homepage.
- `[Live]` Timeframe selector.
- `[Live]` Cash-flow alert banner.
- `[Live]` KPI cards for receivables, gross margin, active shipments, and payment speed.
- `[Live]` Cash-flow chart showing receivables, payables, and net position.
- `[Live]` Payment-aging breakdown.
- `[Live]` Margin-by-service analysis.
- `[Live]` Booking-volume and on-time-rate trend chart.
- `[Live]` Top-clients-by-profitability table.
- `[Live]` Reliable-subcontractors section.
- `[Live]` Key risk indicators for overdue payments, shipment delays, and document compliance.

## 3. Business Development

### What this area is for

This is the sales and relationship-management side of the system. It tracks contacts, customers, inquiries, tasks, activities, and budget requests.

### Main screens

- `[Live]` Contacts.
- `[Live]` Customers.
- `[Live]` Inquiries.
- `[Live]` Tasks.
- `[Live]` Activities.
- `[Live]` Budget Requests.
- `[Live]` Reports.
- `[Live]` Shared Projects module.
- `[Live]` Shared Contracts module.

### What users can do here

- `[Live]` View and drill into contacts.
- `[Live]` View and drill into customers.
- `[Live]` Create an inquiry from a contact.
- `[Live]` Create an inquiry from a customer.
- `[Live]` Build a new inquiry in a BD-specific inquiry builder.
- `[Live]` Edit an existing inquiry.
- `[Live]` Duplicate an inquiry.
- `[Live]` Delete an inquiry.
- `[Live]` Refresh inquiry lists from backend data.
- `[Live]` Convert an inquiry into a project.
- `[Live]` Convert an inquiry into a contract.
- `[Live]` Create a ticket from inquiry context.
- `[Live]` Open project details from customer context.
- `[Live]` Manage tasks with list and detail views.
- `[Live]` Manage activities with list and detail views.
- `[Live]` Work with budget request lists and detail panels.

### Customer and inquiry detail capabilities

- `[Live]` Customer detail includes inquiry-related views.
- `[Live]` Customer detail includes project-related views.
- `[Live]` Customer detail includes financial views.
- `[Live]` Customer and inquiry flows include consignee-related components.
- `[Live]` Inquiry flows include service specifications.
- `[Live]` Inquiry flows include pricing breakdown views.

### Reporting capabilities

- `[Live]` BD reporting shell.
- `[Live]` Custom report builder components.
- `[Live]` Saved reports components.
- `[Live]` Report templates and report-results components.

### Still rough or in-progress

- `[WIP]` The repo includes separate create panels for contacts, customers, inquiries, tasks, activities, and budget requests, but not all of them are clearly wired as polished end-user flows.

### Transitional note

- `[Legacy]` `CreateProjectModal` still exists in code, but project docs say it has already been replaced by a newer direct flow.

## 4. Shared CRM Layer

### What this area is for

This is the shared customer/contact layer used by both BD and Pricing.

### Main features

- `[Live]` Backend-powered contacts module.
- `[Live]` Filterable customers list.
- `[Live]` Contact detail components.
- `[Live]` Customer autocomplete.
- `[Live]` Contact-person autocomplete.
- `[Live]` Company autocomplete.
- `[Live]` Shared use of customer/contact data across BD and Pricing.

## 5. Pricing and Quotations

### What this area is for

This is where quotes are built, priced, structured, and in some cases turned into contracts.

### Main screens

- `[Live]` Pricing Contacts.
- `[Live]` Pricing Customers.
- `[Live]` Pricing Quotations.
- `[Live]` Pricing Vendors.
- `[Live]` Pricing Reports.
- `[Live]` Shared Projects module.
- `[Live]` Shared Contracts module.

### What users can do here

- `[Live]` View pricing-specific contact details.
- `[Live]` View pricing-specific customer details.
- `[Live]` Create a quotation from a customer.
- `[Live]` Browse quotations with filters.
- `[Live]` Open quotation details.
- `[Live]` Create a quotation.
- `[Live]` Edit a quotation.
- `[Live]` Duplicate a quotation.
- `[Live]` Delete a quotation.
- `[Live]` Create a ticket from quotation context.
- `[Live]` Convert accepted work into contracts.

### Quotation-builder capabilities

- `[Live]` QuotationBuilderV3 is the main pricing builder.
- `[Live]` There are service-specific forms for Forwarding.
- `[Live]` There are service-specific forms for Brokerage.
- `[Live]` There are service-specific forms for Trucking.
- `[Live]` There are service-specific forms for Marine Insurance.
- `[Live]` There are service-specific forms for Others.
- `[Live]` The builder supports charge categories.
- `[Live]` The builder supports category presets.
- `[Live]` The builder supports adding categories and line items.
- `[Live]` The builder supports charge-type selection helpers.
- `[Live]` The builder separates buying-price and selling-price sections.
- `[Live]` The builder includes financial summary panels.
- `[Live]` The builder includes rate and quantity breakdown displays.
- `[Live]` Trucking quotations support multi-destination destination blocks.
- `[Live]` Terms and conditions can be edited through bullet-list tooling.
- `[Live]` Vendor-related sections exist in quotation flows.
- `[Live]` Team assignment tooling exists in pricing flows.

### Vendor and partner features

- `[Live]` Network partners module.
- `[Live]` Vendor detail page.
- `[Live]` Vendor management pages/components.

### Other related features

- `[Live]` Quotation file/document viewing.
- `[Live]` Quotation action menus.
- `[Live]` Pricing reports module.

### Still rough or in-progress

- `[WIP]` The repo includes a `CreateBookingsFromProjectModal` in pricing, which suggests ongoing project-to-booking handoff work.

## 6. Projects

### What this area is for

Projects are the hub that ties together winning commercial work, operational execution, attachments, and financial records.

### Main features

- `[Live]` Shared projects route.
- `[Live]` Projects list view.
- `[Live]` Project detail view.
- `[Live]` Deep-link directly into a project by ID or project number.
- `[Live]` Deep-link directly into a specific project tab.
- `[Live]` Deep-link directly into a highlighted financial record inside a project.

### Project detail structure

Project detail is organized into four top-level categories:
- `[Live]` Dashboard.
- `[Live]` Operations.
- `[Live]` Accounting.
- `[Live]` Collaboration.

### What users can do in a project

- `[Live]` View a financial overview dashboard for the project.
- `[Live]` View and edit quotation/overview details from project context.
- `[Live]` Open linked bookings.
- `[Live]` Review project expenses.
- `[Live]` Review billings.
- `[Live]` Review invoices.
- `[Live]` Review collections.
- `[Live]` Review attachments.
- `[Live]` Review and add comments.
- `[Live]` Change project status with optimistic updates.
- `[Live]` Create a ticket from project context.
- `[Live]` Jump from project overview into a selected booking.

### Operational and financial project workflows

- `[Live]` Create booking from project panel.
- `[Live]` Create booking from project modal.
- `[Live]` Read-only booking view from project context.
- `[Live]` Collection-creation panel.

### Document-generation features

- `[Live]` Invoice builder.
- `[Live]` Invoice document preview/print components.
- `[Live]` Invoice PDF screen controls.
- `[Live]` Quotation document preview/print components in project context.
- `[Live]` Quotation PDF screen controls.

### Management actions

- `[Live]` Project actions menu for BD-style users.
- `[Live]` Edit-project action hook.
- `[Live]` Duplicate-project action stub.
- `[Live]` Archive-project action stub.
- `[Live]` Delete-project action stub.

## 7. Contracts

### What this area is for

Contracts are long-lived commercial agreements built on top of quotations. This area handles contract lifecycle, contract execution, and contract-linked finance views.

### Main features

- `[Live]` Shared contracts route.
- `[Live]` Contracts list.
- `[Live]` Contract detail page.
- `[Live]` Deep-link directly into a contract by quote number or ID.
- `[Live]` Deep-link into specific contract tabs and highlighted rows.

### Contract detail structure

Contract detail mirrors the project-style layout:
- `[Live]` Dashboard.
- `[Live]` Operations.
- `[Live]` Accounting.
- `[Live]` Collaboration.

### What users can do in a contract

- `[Live]` View contract financial overview.
- `[Live]` View contract rate cards.
- `[Live]` View linked bookings.
- `[Live]` View rolled-up billings.
- `[Live]` View rolled-up invoices.
- `[Live]` View rolled-up collections.
- `[Live]` View rolled-up expenses.
- `[Live]` View attachments.
- `[Live]` View comments.
- `[Live]` View activity log entries.
- `[Live]` Change contract status.
- `[Live]` Activate a contract when a quotation is ready to become active.
- `[Live]` Open a contract actions menu.
- `[Live]` Trigger contract edit flow.
- `[Live]` Renew a contract by creating a renewed copy with new validity dates.

### Contract-to-operations workflows

- `[Live]` Create bookings from contract context.
- `[Live]` Choose the eligible service type when creating a booking from a contract.
- `[Live]` Fetch linked bookings from all booking tables.
- `[Live]` Drill into a linked booking from contract context.
- `[Live]` Generate billing for a specific linked booking from the contract screen.

### Contract pricing tools

- `[Live]` Rate calculation sheet.
- `[Live]` Booking rate-card button.
- `[Live]` Rate-card generator popover.

## 8. Operations

### What this area is for

This is where the company executes shipment work after pricing and contract/project handoff.

### Main screens

- `[Live]` Operations landing page.
- `[Live]` Create-booking page.
- `[Live]` Booking detail route.
- `[Live]` Forwarding bookings.
- `[Live]` Brokerage bookings.
- `[Live]` Trucking bookings.
- `[Live]` Marine Insurance bookings.
- `[Live]` Others bookings.
- `[Live]` Operations reports.

### Service-line coverage

The codebase has dedicated list/detail components for all five service lines:
- `[Live]` Forwarding.
- `[Live]` Brokerage.
- `[Live]` Trucking.
- `[Live]` Marine Insurance.
- `[Live]` Others.

### What users can do here

- `[Live]` Browse bookings by service line.
- `[Live]` Open detailed booking views.
- `[Live]` Create bookings from a general create-booking route.
- `[Live]` Create bookings through service-specific creation panels.
- `[Live]` Use shared booking creation infrastructure.
- `[Live]` Use project autofill during booking creation/detail work.
- `[Live]` Detect relevant contracts while working on bookings.
- `[Live]` Manage booking expenses through an expenses tab.
- `[Live]` Create expenses from operations context.
- `[Live]` Use shared service-booking rows and service layouts.
- `[Live]` Use multi-select services and customer-option helpers in forms.
- `[Live]` Use movement-toggle controls where relevant.
- `[Live]` Access a universal booking full-view component that exists in the repo.

### Important caveat

- `[WIP]` The generic `Operations.tsx` shell still treats non-forwarding flows as placeholders, even though dedicated route-level components already exist for the other service lines. So the route-level experience is ahead of the generic wrapper.

## 9. Accounting

### What this area is for

Accounting is the financial backbone of the app. It tracks billings, invoices, collections, expenses, vouchers, ledgers, and reports.

### Main screens

- `[Live]` Transactions.
- `[Live]` E-Vouchers.
- `[Live]` Invoices.
- `[Live]` Billings.
- `[Live]` Collections.
- `[Live]` Expenses.
- `[Live]` Chart of Accounts.
- `[Live]` Ledger/Customers.
- `[Live]` Projects.
- `[Live]` Contracts.
- `[Live]` Customers.
- `[Live]` Bookings.
- `[Live]` Reports.
- `[Live]` Catalog.
- `[Live]` Financials.

### Accounting modes

- `[Live]` Essentials mode simplifies the accounting experience.
- `[Live]` Full Suite mode exposes the larger accounting toolset.
- `[Live]` Essentials mode routes core financial pages into the Financials super-module.

### Financials super-module

This is one of the biggest user-facing systems in the repo.

- `[Live]` Financial dashboard tab.
- `[Live]` System-wide billings tab.
- `[Live]` System-wide invoices tab.
- `[Live]` System-wide collections tab.
- `[Live]` System-wide expenses tab.
- `[Live]` Shared date-scope controls across tabs.
- `[Live]` KPI cards across aggregate tabs.
- `[Live]` Grouping toolbar across aggregate tabs.
- `[Live]` Search, filters, and grouping for billings.
- `[Live]` Search, filters, and grouping for invoices.
- `[Live]` Search, filters, and grouping for collections.
- `[Live]` Search, filters, and grouping for expenses.
- `[Live]` Aging analysis in invoice workflows.
- `[Live]` Export from grouped tables.
- `[Live]` Row drill-through into project, contract, or booking context.
- `[Live]` Shared financial lineage logic that decides where a row should drill into.

### Operational accounting views

- `[Live]` Accounting can open shared Projects.
- `[Live]` Accounting can open shared Contracts.
- `[Live]` Accounting can open a bookings shell with all five service lines.
- `[Live]` Accounting can deep-link into a specific booking based on booking-ID prefix.

### E-voucher and transaction-related features

- `[Live]` E-vouchers content module.
- `[Live]` Create e-voucher form.
- `[Live]` E-voucher detail view.
- `[Live]` E-voucher workflow panel.
- `[Live]` Liquidation panel.
- `[Live]` E-voucher history timeline.
- `[Live]` E-voucher status badges.
- `[Live]` Unified e-voucher table.
- `[Live]` Transactions module.
- `[Live]` Bank accounts carousel/cards.
- `[Live]` Transactions table.
- `[Live]` Add/edit transaction modal.
- `[Live]` Add-account form.
- `[Live]` Manage-accounts modal.

### Core finance record management

- `[Live]` Billing list/table flows.
- `[Live]` Billing details sheet.
- `[Live]` Collections list/table flows.
- `[Live]` Collection details sheet.
- `[Live]` Expenses list/table flows.
- `[Live]` Expense details sheet.
- `[Live]` Aggregate invoices page.
- `[Live]` Create invoice modal.
- `[Live]` Chart of Accounts management.
- `[Live]` Account ledger and account side panel components.
- `[Live]` Customer/ledger views in accounting.

### Reporting

- `[Live]` Reports hub.
- `[Live]` Sales report.
- `[Live]` Booking cash-flow report.
- `[Live]` Receivables aging report.
- `[Live]` Collections report.
- `[Live]` Unbilled revenue report.
- `[Live]` Print action inside reports hub.
- `[Live]` Refresh action inside reports hub.
- `[Live]` Financial Health page for Essentials mode.

### Catalog and controls

- `[Live]` Catalog management for reusable expense and charge items.
- `[Live]` Categories page.
- `[Live]` Charge-expense matrix.
- `[Live]` Auditing module.
- `[Live]` Auditing summary views.

### Internal or secondary accounting tools present in code

- `[Internal]` Accounts page.
- `[Internal]` Add Request for Payment panel.
- `[Internal]` Approvals page.
- `[Internal]` Entries pages.
- `[Internal]` Import/export page.
- `[Internal]` Post-to-ledger panel.
- `[Internal]` Company switcher and command bars.
- `[Internal]` Financial dashboard subcomponents for trends, top customers, profitability, attention panels, and vital signs.

### Transitional note

- `[Legacy]` Older accounting pages still exist beside newer replacement pages with `New` suffixes.

## 10. HR

### What this area is for

This area handles employees, timekeeping, and payroll.

### Main sections

- `[Live]` Profile.
- `[Live]` Timekeeping.
- `[Live]` Payroll.

### What users can do here

- `[Live]` Filter by company and status.
- `[Live]` Browse employees.
- `[Live]` Open employee records in a file modal.
- `[Live]` Open an employee profile modal.
- `[Live]` Use a weekly timekeeping board.
- `[Live]` Edit timekeeping cells.
- `[Live]` Move between weeks in the timekeeping board.
- `[Live]` Export timekeeping data.
- `[Live]` Review payroll runs.
- `[Live]` Create payroll runs.
- `[Live]` Open payroll details.
- `[Live]` Open payroll payslips / print-slip flow.

### Internal/secondary features

- `[Internal]` Employee roster Excel component exists in code.

## 11. Inbox and Ticketing

This area currently has two overlapping systems:
- A newer thread-based Inbox/Messaging system.
- An older ticket-centric workflow that still exists and is still used in parts of the app.

### 11A. Newer Inbox / Threaded Messaging

#### What this area is for

This is becoming the internal communication layer for cross-department work. Think internal email or conversation threads attached to business records.

#### Main features already in code

- `[WIP]` Inbox route now points to a thread-based inbox.
- `[WIP]` Thread list panel.
- `[WIP]` Thread detail panel.
- `[WIP]` Compose panel.
- `[WIP]` Reply compose box.
- `[WIP]` Thread list items with unread treatment and attachment counts.
- `[WIP]` Message bubble rendering.
- `[WIP]` System-event rows.
- `[WIP]` Entity picker for linking records.
- `[WIP]` Record browser for linked entities.
- `[WIP]` Entity context card.
- `[WIP]` File cabinet / attachment browsing UI.
- `[WIP]` Assignment modal.

#### Thread-management capabilities

- `[WIP]` Inbox tab for personal/direct threads.
- `[WIP]` Queue tab for manager queue views.
- `[WIP]` Sent tab.
- `[WIP]` Drafts tab.
- `[WIP]` Draft count.
- `[WIP]` Unread count.
- `[WIP]` Queue count for managers.
- `[WIP]` Read-receipt based unread handling.
- `[WIP]` Mark thread as read on open.
- `[WIP]` Keyboard shortcuts for compose, open, escape, and arrow-key navigation.

#### Backend support already present

- `[Backend]` Ticket/thread container tables.
- `[Backend]` Ticket participants for user and department recipients.
- `[Backend]` Ticket messages table.
- `[Backend]` Ticket attachments table.
- `[Backend]` Ticket assignments.
- `[Backend]` Ticket read receipts.
- `[Backend]` Inbox messaging migration `010_inbox_messaging.sql`.

### 11B. Legacy / Transitional Ticketing

#### What this area is for

This is the older request/ticket workflow that still exists alongside the newer inbox system.

#### Main features

- `[Live]` Ticket queue route for managers and directors.
- `[Live]` "All Active" ticket view.
- `[Live]` "My Tickets" view.
- `[Live]` Ticket queue stats for active, unassigned, urgent, and assigned-to-me.
- `[Live]` Executive department filter inside ticket queue.
- `[Live]` New ticket panel from queue page.
- `[Live]` Ticket management table with search and filters.
- `[Live]` Ticket detail modal.
- `[Live]` Manager permissions for assignment and bulk editing.

#### Ticket testing dashboard

- `[Live]` Ticket-type catalog viewer.
- `[Live]` Ticket creation testing flow.
- `[Live]` Prefilled ticket creation from linked-entity query params.
- `[Live]` Entity picker modal in testing flow.
- `[Live]` Ticket list with filters.
- `[Live]` Ticket detail testing view.
- `[Live]` Status-change testing.
- `[Live]` Assignment testing.
- `[Live]` Comment testing.
- `[Live]` Linked-entity navigation from ticket details back into the main app.

#### Cross-module ticket entry points

- `[Live]` Inquiries can create tickets.
- `[Live]` Quotations can create tickets.
- `[Live]` Projects can create tickets.
- `[Live]` Contracts can create tickets.
- `[WIP]` Current worktree adds `LinkedTicketBadge` and `RequestBillingButton` for tighter workflow-ticket integration.

### Transitional note

- `[Legacy]` The repo currently contains both the old ticket workflow and the new thread-based inbox direction.

## 12. Activity Log and Personal Tools

### What this area is for

This is the manager/executive oversight layer for system activity and personal account-level navigation.

### Main features

- `[Live]` Activity Log route.
- `[Live]` Activity Log access control for managers and directors.
- `[Live]` Executive exception handling.
- `[Live]` Auto-refresh polling.
- `[Live]` Detection of newly arrived activities.
- `[Live]` Filters by entity type, action type, department, and user.
- `[Live]` Search by entity ID, name, or user.
- `[Live]` CSV export.
- `[Live]` Relative-time display.
- `[Live]` Navigate from an activity row back to its entity.
- `[Live]` Profile page.
- `[Live]` Sidebar profile summary card.
- `[Live]` Calendar page placeholder.

## 13. Admin, Settings, and Diagnostics

### What this area is for

This is the internal control room: user management, system maintenance, data cleanup, seeding helpers, and debug tooling.

### Admin / Settings page

- `[Internal]` Director-only settings route.
- `[Internal]` User-management tab.
- `[Internal]` Add-user dialog.
- `[Internal]` User fields include department, role, status, and Operations-specific assignments.
- `[Internal]` Settings for expense types.
- `[Internal]` Settings for document types.
- `[Internal]` Tracking-format setting.
- `[Internal]` System-info tab.
- `[Internal]` Backup-now control stub.
- `[Internal]` System-status display.

### Maintenance and migration helpers

- `[Internal]` Duplicate-cleanup tool.
- `[Internal]` Quotation-status migration helper.
- `[Internal]` Services-metadata migration helper.
- `[Internal]` Comprehensive seed-data helper.
- `[Internal]` Clear-seed-data helper.
- `[Internal]` Contact-name migration helper.
- `[Internal]` User-seeding helper.
- `[Internal]` Balance-sheet COA seeding helper.
- `[Internal]` Income-statement COA seeding helper.

### Developer shortcuts

- `[Internal]` Admin shortcut into the ticket testing dashboard.
- `[Internal]` Design system guide route.
- `[Internal]` Supabase debug route.

### Diagnostics page

- `[Internal]` Project database inspection page.
- `[Internal]` Refresh project data from the database.
- `[Internal]` Inspect linked bookings per project.
- `[Internal]` Raw JSON viewer for project records.
- `[Internal]` Browser-console logging for inspected data.

## 14. Shared Collaboration and Reusable Business Features

### What this area is for

These are features that do not belong to just one module, but show up in several places.

### Main features

- `[Live]` Shared comments tab.
- `[Live]` Shared attachments patterns for projects/contracts.
- `[Live]` Shared unified billings table.
- `[Live]` Shared unified invoices table.
- `[Live]` Shared unified collections table.
- `[Live]` Shared unified expenses table.
- `[Live]` Shared bookings table in contract flows.
- `[Live]` Shared financial drill-through logic.
- `[Live]` Shared contract-rate engine.
- `[Live]` Shared quotation calculation helpers.
- `[Live]` Shared contract autofill helpers.
- `[Live]` Shared project autofill helpers.
- `[WIP]` Shared workflow-ticket utilities in the current worktree.

## 15. Backend-Supported Business Capabilities

### Why this section exists

Some important product features are not obvious from the UI alone. They live in migrations, hooks, or utility layers and power core business behavior.

### Main backend capabilities

- `[Backend]` Full initial schema migration.
- `[Backend]` Schema-adjustment migration layer.
- `[Backend]` Supabase auth integration migration.
- `[Backend]` Role constraints migration.
- `[Backend]` RLS policy migration.
- `[Backend]` SQL seed scripts.
- `[Backend]` Auth-user creation helper script.
- `[Backend]` Financial v2 columns migration.
- `[Backend]` Catalog charge-type-code migration.
- `[Backend]` Billing catalog snapshot migration.
- `[Backend]` Catalog type backfill migration.
- `[Backend]` Financial seed script.
- `[Backend]` Contract lookup helpers.
- `[Backend]` Contract quantity extraction helpers.
- `[Backend]` Rate-card-to-billing conversion helpers.
- `[Backend]` Financial normalization and selector helpers.
- `[Backend]` Collection-resolution helpers.
- `[Backend]` Invoice-reversal helpers.
- `[Backend]` Booking-cancellation and booking-status helpers.
- `[Backend]` Permission utility layer.

## 16. Planned, Parked, or Not Clearly Finished Yet

### What this means

These are features the repo clearly intends to have, but they should not be described as fully shipped yet.

### Main planned areas

- `[Planned]` The inbox/threading system has a larger blueprint than what is currently wired in the UI.
- `[Planned]` Billings module restructure / queue-based workflow is parked in docs.
- `[Planned]` Booking-panel DRY refactor is planned in blueprints.
- `[Planned]` Additional accounting and expense refactors exist in docs.
- `[Planned]` Multi-currency architecture exists in specs docs.
- `[Planned]` Cash liquidation spec exists in specs docs.
- `[Planned]` Super-project and project-detail redesign work exists in docs.
- `[Planned]` Additional report and operations blueprint work exists in docs but is not clearly complete in code.

## 17. Legacy and Transitional Areas

### What this means

These are areas where the codebase is between generations of design or architecture.

### Main examples

- `[Legacy]` Older accounting pages still exist next to newer replacements.
- `[Legacy]` `FinancialReports.tsx` appears to be replaced by the newer accounting reports hub and report set.
- `[Legacy]` Ticket-centric flows still coexist with the newer inbox/threading direction.
- `[Legacy]` Some admin controls are UI wrappers for external SQL/dashboard actions rather than full in-app workflows.

## Quick Summary by Business Function

If you want the shortest plain-English version of this repo:

- Sales and relationship management lives in Business Development.
- Quote building and commercial structuring lives in Pricing.
- Winning work turns into Projects and Contracts.
- Shipment execution lives in Operations across five service lines.
- Company-wide money tracking lives in Accounting.
- Employee and payroll workflows live in HR.
- Internal communication is moving from old ticketing toward a newer inbox/thread system.
- Admin, diagnostics, seeding, and migrations live in hidden/internal tools.

