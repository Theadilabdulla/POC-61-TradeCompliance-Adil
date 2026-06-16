# POC-61: Trade Compliance Product Trace

## Project Overview
A production-style intelligence dashboard built for the Real Rails Intelligence Library. This PoC bridges the gap between high-level governance rails and granular supply-chain SKU tracking.

## Architecture
- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Flow.
- **Backend:** Python FastAPI for ETL and metric calculation.
- **Data:** Synthetic SKU-level shipment data ingested via API-style adapters.

## Features
- Interactive topological network graph (React Flow).
- Real-time filtered network states.
- Governance & Trust sidebar with SKU checkpoint status.
- Downloadable sample data integration.

## Setup Instructions
1. `pip install fastapi uvicorn`
2. `uvicorn main:app --port 8000`
3. `npm install`
4. `npm run dev`