from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone

from adapters import comtrade_adapter


# ── Pydantic Response Models ────────────────────────────────────────────

class NetworkMetrics(BaseModel):
    """Core metric payload for a given network filter state."""
    total_shipments: int
    value_at_risk: float  # USD in millions
    active_nodes: int
    status_filter: str


class MetricsResponse(BaseModel):
    """Envelope wrapping NetworkMetrics with metadata."""
    data: NetworkMetrics
    timestamp: str
    source: str


class Shipment(BaseModel):
    """A single trade-compliance shipment record."""
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
    """Paginated envelope for shipment records."""
    data: list[Shipment]
    total: int
    timestamp: str
    source: str


class ComplianceAlert(BaseModel):
    """A compliance alert raised by screening or customs systems."""
    alert_id: str
    severity: str
    sku_id: str
    message: str
    timestamp: str
    source: str


class AlertsResponse(BaseModel):
    """Envelope for compliance alerts."""
    data: list[ComplianceAlert]
    total: int
    timestamp: str
    source: str


class TradeDocument(BaseModel):
    """A single document in a shipment's compliance checklist."""
    doc_type: str
    doc_name: str
    status: str
    reference_number: str | None = None
    issued_by: str | None = None
    issued_date: str | None = None


class DocumentsResponse(BaseModel):
    """Envelope for a SKU's document checklist."""
    sku_id: str
    data: list[TradeDocument]
    timestamp: str
    source: str


# ── Structured Mock Data ────────────────────────────────────────────────

MOCK_DATA: dict[str, NetworkMetrics] = {
    "ALL": NetworkMetrics(
        total_shipments=800,
        value_at_risk=1033.6,
        active_nodes=800,
        status_filter="ALL",
    ),
    "CUSTOMS_HOLD": NetworkMetrics(
        total_shipments=14,
        value_at_risk=18.4,
        active_nodes=14,
        status_filter="CUSTOMS_HOLD",
    ),
    "CLEARED": NetworkMetrics(
        total_shipments=786,
        value_at_risk=1015.2,
        active_nodes=786,
        status_filter="CLEARED",
    ),
    "OFAC_FLAGGED": NetworkMetrics(
        total_shipments=3,
        value_at_risk=8.1,
        active_nodes=3,
        status_filter="OFAC_FLAGGED",
    ),
    "IN_TRANSIT": NetworkMetrics(
        total_shipments=420,
        value_at_risk=540.0,
        active_nodes=420,
        status_filter="IN_TRANSIT",
    ),
}


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


import random

@app.get("/api/metrics", response_model=MetricsResponse)
def get_metrics(status: str = Query("ALL")) -> MetricsResponse:
    """Return validated network metrics for the given status filter with simulated real-time jitter."""
    base_metrics = MOCK_DATA.get(status, MOCK_DATA["ALL"])
    
    # Simulate real-time fluctuations
    jitter_percent = random.uniform(-0.02, 0.02) # +/- 2%
    live_var = round(base_metrics.value_at_risk * (1 + jitter_percent), 2)
    
    # Shipments change slowly
    live_shipments = base_metrics.total_shipments + random.randint(-5, 5)
    
    live_metrics = NetworkMetrics(
        total_shipments=max(0, live_shipments),
        value_at_risk=max(0, live_var),
        active_nodes=max(0, live_shipments),
        status_filter=base_metrics.status_filter
    )
    
    return MetricsResponse(
        data=live_metrics,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="synthetic_live_v1",
    )


@app.get("/api/shipments", response_model=ShipmentsResponse)
def get_shipments(status: str = Query("ALL")) -> ShipmentsResponse:
    """Return shipment records, optionally filtered by status."""
    records = comtrade_adapter.get_shipments(status)
    return ShipmentsResponse(
        data=[Shipment(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="synthetic_v1",
    )


@app.get("/api/alerts", response_model=AlertsResponse)
def get_alerts() -> AlertsResponse:
    """Return all active compliance alerts sorted by severity."""
    records = comtrade_adapter.get_alerts()
    return AlertsResponse(
        data=[ComplianceAlert(**r) for r in records],
        total=len(records),
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="synthetic_v1",
    )


@app.get("/api/documents/{sku_id}", response_model=DocumentsResponse)
def get_documents(sku_id: str) -> DocumentsResponse:
    """Return the document checklist for a given SKU."""
    records = comtrade_adapter.get_documents(sku_id)
    return DocumentsResponse(
        sku_id=sku_id,
        data=[TradeDocument(**r) for r in records],
        timestamp=datetime.now(timezone.utc).isoformat(),
        source="synthetic_v1",
    )
