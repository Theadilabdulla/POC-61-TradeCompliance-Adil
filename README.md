# POC-61: Trade Compliance Product Trace

![Trade Compliance App](https://via.placeholder.com/1200x600/0B1117/38BDF8?text=Trade+Compliance+Product+Trace)

## Project Overview
A production-style intelligence dashboard built for the Real Rails Intelligence Library. This Proof of Concept (PoC) bridges the gap between high-level governance frameworks and granular supply-chain SKU tracking.

It demonstrates how global supply chains can be traced, audited, and flagged using modern web architectures and real-time data pipelines. The system maps thousands of synthetic shipments across exactly 800 real-world geographical nodes to simulate a live compliance environment.

## Key Features

- **800-Node Geographic Engine:** Pulls and filters real-world city location data to map origins and destinations authentically.
- **Stateful Physics Simulator:** A Python backend continuously progresses 5,000 active shipments through customs lifecycles (In Transit → Customs Hold → Cleared / OFAC Flagged) in real time.
- **Dual Graph Rendering:** Users can instantly toggle the visualization core between **React Flow** (rigid, hierarchical diagrams) and **vis-network** (dynamic, physics-based clustering) to find the optimal data view.
- **D3.js Metric Visualization:** A custom-built D3 SVG donut chart natively renders live shipment distributions, instantly recalculating on 3-second polling intervals.
- **Live Governance Alerts:** Real-time alert feed explicitly validating shipments against the official OFAC Sanctions List Data Schema.
- **Data Export:** Complete CSV export functionality to allow analysts to extract the live state of the compliance rail at any exact moment.

## System Architecture

### Frontend (Next.js)
- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS (strict Dark Mode), shadcn/ui.
- **Visualization:** D3.js, React Flow, vis-network, Dagre (for layout).
- **Data Grids:** TanStack Table (v8) for collapsible, high-performance data rows.

### Backend (Python FastAPI)
- **Framework:** FastAPI, Uvicorn.
- **Data Processing:** Pandas.
- **Adapters Pattern:**
  - `overpass_adapter.py`: Ingests and processes 800 global cities.
  - `comtrade_adapter.py`: Operates as a persistent state-machine, generating UN Comtrade HS6 classifications and progressing shipment status asynchronously.

## Setup Instructions

### 1. Run the Backend API
The backend acts as the continuous simulation engine.
```bash
# Navigate to project root
cd POC-61-TradeCompliance-Adil

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Boot the FastAPI server
uvicorn main:app --port 8000
```
*The API will be available at `http://localhost:8000`.*

### 2. Run the Frontend Dashboard
```bash
# Navigate to the frontend directory
cd POC-61-TradeCompliance-Adil/frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```
*The UI will be available at `http://localhost:3000`.*

## Project Audits
This repository has passed strict UX and Functional validations:
- Read the **Visualization Audit Review** in `VAR_REPORT.md`
- Access the **User Acceptance Testing Protocol** in `UAT_CHECKLIST.md`