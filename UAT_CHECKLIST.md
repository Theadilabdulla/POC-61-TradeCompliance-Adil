# User Acceptance Testing (UAT) Checklist
**Project:** POC-61: Trade Compliance Product Trace

## 1. Filters & Controls
- [ ] **Network State Filter:** Select "ALL TRAFFIC". Verify that all network flows, metrics, and D3 segments are visible.
- [ ] **State Isolation:** Select "OFAC FLAGGED". Verify that the graph filters down to ONLY red flows, the D3 chart updates to show 100% OFAC, and the Value at Risk recalculates to only reflect flagged cargo.
- [ ] **Graph Toggle:** Toggle between "React Flow" and "vis-network". Verify that the visual engine swaps seamlessly without dropping the active filter context.

## 2. Tooltips & Micro-interactions
- [ ] **Metric Tooltips:** Hover over the "Active Traces" and "Value At Risk" sidebar cards. Verify that a dark-mode tooltip appears with explanatory text.
- [ ] **Data Grid Tooltips:** Hover over truncated descriptions in the collapsible Shipments Table. Verify full descriptions appear on hover.

## 3. Loading & Async States
- [ ] **Initial Boot:** Restart the Next.js server. Verify the Topbar displays "NODES: SYNCING..." before the initial payload resolves.
- [ ] **Graph Physics Setup:** Verify that upon initial render, vis-network stabilizes its physics layout within 2-3 seconds without crashing the browser thread.
- [ ] **API Latency Handling:** If the Python server is artificially slowed down, verify the Shipments Table displays a localized loading skeleton rather than freezing the entire React tree.

## 4. Navigation & Layout
- [ ] **Sidebar Tabs:** Click between "Metrics", "Docs", and "Alerts". Verify instantaneous tab switching.
- [ ] **SKU Deep Dive:** Click on "SKU-9921-A" in the Metrics sidebar. Verify the Documents tab updates to show the Bill of Lading specific to that SKU.
- [ ] **Table Collapse:** Click the "Shipments Table" drawer at the bottom. Verify it smoothly expands to 280px and collapses to 40px.

## 5. Responsiveness
- [ ] **Window Resize:** Resize the browser window width from 1920px down to 1024px. Verify the Sidebar maintains its fixed 384px width while the network graph canvas flexibly shrinks.
- [ ] **Flex Overflow:** Verify the Alerts Feed inside the Sidebar successfully scrolls internally when alert volume exceeds vertical height, without pushing the "Download Data" button off the screen.

## 6. Edge Cases & Resilience
- [ ] **Backend Failure:** Shut down the Python FastAPI server while the frontend is running. Verify the frontend logs a connection error gracefully rather than throwing a catastrophic React boundary error.
- [ ] **Zero Data State:** Verify the behavior when no shipments meet a filter criteria. Ensure the D3 chart clears gracefully rather than rendering a broken NaN SVG slice.

## 7. Data Correctness & Output
- [ ] **D3 Accuracy:** Verify that the total number displayed in the center of the D3 donut chart perfectly matches the total rows in the Shipments Table.
- [ ] **CSV Export:** Click "DOWNLOAD DATA". Open the resulting `trade_compliance_shipments.csv`. Verify it contains the headers (e.g., `sku_id`, `hs_code`, `status`) and exactly matches the live 3-second data snapshot on screen.
- [ ] **Synthetic Plausibility:** Inspect the generated Alerts. Verify that OFAC sanctions warnings explicitly reference the "OFAC Sanctions List Data Schema".