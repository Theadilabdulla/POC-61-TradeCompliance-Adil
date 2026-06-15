# User Acceptance Testing (UAT) - Phase 1

**Tester:** Adil Abdulla
**Status:** ✅ ALL TESTS PASSED

## Minimum Coverage Checklist:

### Filters & Data Correctness
- [x] Select "ALL" - Map displays all 800 global nodes.
- [x] Select "OFAC Flagged" - Map visually filters to show only high-risk (Red) routes.
- [x] Metric Cards accurately reflect the global "Active Shipments" and "Value at Risk" pulled from the FastAPI backend.

### Interactions & Navigation
- [x] Click the "✕" button on the Governance sidebar - Sidebar collapses smoothly off-screen.
- [x] Click the "INTELLIGENCE PANEL ▲" button - Sidebar slides back onto the screen.
- [x] 3D Map Navigation: Click and drag to pan across the globe.
- [x] 3D Map Navigation: Right-click and drag to change the camera pitch/angle.
- [x] 3D Map Navigation: Scroll wheel correctly zooms in and out of port locations.

### Loading States & Edge Cases
- [x] Topbar displays "SYNCING..." dynamically while waiting for backend payload.
- [x] Topbar updates to actual node count once the FastAPI connection is established.
- [x] UI does not crash if the backend metrics payload is briefly null.
