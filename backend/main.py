import os
import sys
import json
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

# Add the root directory to sys.path to allow importing from adapters
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adapters import comtrade_adapter

# ── Pydantic Response Models ────────────────────────────────────────────

class NetworkMetrics(BaseModel):
    total_shipments: int
    value_at_risk: float
    active_nodes: int
    status_filter: str

class MetricsResponse(BaseModel):
    data: NetworkMetrics
    timestamp: str
    source: str

class Shipment(BaseModel):
    sku_id: str
    hs_code: str
    description: str
    origin_port: str
    origin_country: str
    destination_port: str
    destination_country: str
    status: str
    value_usd: float
    carrier: str
    departure_date: str
    eta: str

class ShipmentsResponse(BaseModel):
    data: list[Shipment]
    total: int
    timestamp: str
    source: str

class ComplianceAlert(BaseModel):
    alert_id: str
    severity: str
    sku_id: str
    message: str
    timestamp: str
    source: str

class AlertsResponse(BaseModel):
    data: list[ComplianceAlert]
    total: int
    timestamp: str
    source: str

class TradeDocument(BaseModel):
    doc_type: str
    doc_name: str
    status: str
    reference_number: str | None = None
    issued_by: str | None = None
    issued_date: str | None = None

class DocumentsResponse(BaseModel):
    sku_id: str
    data: list[TradeDocument]
    timestamp: str
    source: str

class PortsResponse(BaseModel):
    data: list[dict]
    timestamp: str
    source: str

# ── FastAPI App ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Trade Compliance API",
    version="0.2.0",
    description="POC-61 metrics endpoint with Pydantic response models.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dynamically resolve the path to data.json relative to this file
DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "data.json")

def load_metrics_data():
    if not os.path.exists(DATA_FILE_PATH):
        return {}
    with open(DATA_FILE_PATH, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

@app.get("/api/ports", response_model=PortsResponse)
def get_ports() -> PortsResponse:
    from adapters.overpass_adapter import get_port_locations
    ports = get_port_locations()
    return PortsResponse(
        data=ports,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="Overpass API / OpenStreetMap",
    )

@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics(status: str = Query("ALL")) -> MetricsResponse:
    """Return validated network metrics dynamically loaded from data.json."""
    data = load_metrics_data()
    metrics_dict = data.get(status)
    
    if not metrics_dict:
        metrics_dict = {
            "total_shipments": 0,
            "value_at_risk": 0.0,
            "active_nodes": 0,
            "status_filter": status
        }
        
    source = "Mixed Sources"
    if status == "CLEARED":
        source = "UN Comtrade"
    elif status == "CUSTOMS_HOLD":
        source = "Overpass API / OpenStreetMap"
        
    return MetricsResponse(
        data=NetworkMetrics(**metrics_dict),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source=source,
    )

@app.get("/api/shipments", response_model=ShipmentsResponse)
def get_shipments(status: str = Query("ALL")) -> ShipmentsResponse:
    """Return shipment records, optionally filtered by status."""
    records = comtrade_adapter.get_shipments(status)
    return ShipmentsResponse(
        data=[Shipment(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade & Overpass API / OpenStreetMap",
    )

@app.get("/api/alerts", response_model=AlertsResponse)
def get_alerts() -> AlertsResponse:
    """Return all active compliance alerts sorted by severity."""
    records = comtrade_adapter.get_alerts()
    return AlertsResponse(
        data=[ComplianceAlert(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade",
    )

@app.get("/api/documents/{sku_id}", response_model=DocumentsResponse)
def get_documents(sku_id: str) -> DocumentsResponse:
    """Return the document checklist for a given SKU."""
    records = comtrade_adapter.get_documents(sku_id)
    return DocumentsResponse(
        sku_id=sku_id,
        data=[TradeDocument(**r) for r in records],
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="UN Comtrade",
    )
