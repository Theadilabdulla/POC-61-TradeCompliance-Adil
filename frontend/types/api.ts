/**
 * TypeScript interfaces mirroring the FastAPI Pydantic models.
 * Source of truth: main.py
 */

// ── Metrics (existing from Phase 2) ─────────────────────────────────────

export interface NetworkMetrics {
  total_shipments: number;
  value_at_risk: number;
  active_nodes: number;
  status_filter: string;
}

export interface MetricsResponse {
  data: NetworkMetrics;
  timestamp: string;
  source: string;
}

// ── Shipments ───────────────────────────────────────────────────────────

export interface Shipment {
  sku_id: string;
  hs_code: string;
  description: string;
  origin_port: string;
  origin_country: string;
  destination_port: string;
  destination_country: string;
  status: string;
  value_usd: number;
  carrier: string;
  departure_date: string;
  eta: string;
}

export interface ShipmentsResponse {
  data: Shipment[];
  total: number;
  timestamp: string;
  source: string;
}

// ── Compliance Alerts ───────────────────────────────────────────────────

export interface ComplianceAlert {
  alert_id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  sku_id: string;
  message: string;
  timestamp: string;
  source: string;
}

export interface AlertsResponse {
  data: ComplianceAlert[];
  total: number;
  timestamp: string;
  source: string;
}

// ── Trade Documents ─────────────────────────────────────────────────────

export interface TradeDocument {
  doc_type: string;
  doc_name: string;
  status: "VERIFIED" | "PENDING" | "MISSING";
  reference_number: string | null;
  issued_by: string | null;
  issued_date: string | null;
}

export interface DocumentsResponse {
  sku_id: string;
  data: TradeDocument[];
  timestamp: string;
  source: string;
}

// ── Port / Location Data ────────────────────────────────────────────────

export interface PortLocation {
  osm_node_id: number;
  name: string;
  country: string;
  lat: number;
  lng: number;
  port_type: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  active_shipments: number;
}
