# Contract Rate Automation Blueprint

> **Living Document** -- Updated after every implementation phase.
> Last Updated: 2026-02-23
> Current Phase: **Phase 1-2 COMPLETE, Phase 3-4 REFACTORED** | Department Boundary Correction Applied | **Derived Quantities Refactor COMPLETE**

### Derived Quantities Refactor (2026-02-23)

The original "Booking Quantities Blueprint" added manual numeric counter inputs to booking
creation forms and detail views. This was **rolled back** and replaced by the
**Derived Quantities** approach (see `DERIVED_QUANTITIES_BLUEPRINT.md`):

- `deriveQuantitiesFromBooking()` in `utils/contractQuantityExtractor.ts` now parses
  existing operational text fields (`containerNumbers`, `mblMawb`, `vehicleReferenceNumber`)
  to auto-compute quantities — no manual counter inputs needed.
- `ContractDetailView.tsx` passes derived quantities into `ContractRatePreviewModal`
  instead of reading a stored `shipment_quantities` field.
- All manual counter UI was removed from creation panels and detail views.

**Cross-references:**
- `docs/blueprints/DERIVED_QUANTITIES_BLUEPRINT.md` — the authoritative blueprint
- `docs/blueprints/BOOKING_QUANTITIES_BLUEPRINT.md` — superseded (kept for history)