# Project Detail Bug Fix Blueprint

## Objective
Fix data binding issues in the `ProjectProfitabilityDetail` component where project details (Name, Client, Route) are not displaying correctly due to property naming mismatches.

## Status Legend
- [ ] Pending
- [x] Completed

## Tasks
- [x] **Fix Project Name**: Update `project.project_name` to `project.quotation_name` (with fallback to `project.quotation_number` or `project.project_number`).
- [x] **Fix Client Name**: Update `project.client_name` to `project.customer_name`.
- [x] **Fix Route Display**: Implement logic to display `{project.pol_aol} → {project.pod_aod}` instead of placeholder.
- [x] **Fix Initials & Colors**: Ensure helper functions (`getProjectInitials`, `getProjectColor`) use the correct name property.

## Verification
- Header now correctly displays the project name (e.g., "Export - Cebu").
- Client field now correctly shows the customer name.
- Route field now shows the Origin -> Destination string.
