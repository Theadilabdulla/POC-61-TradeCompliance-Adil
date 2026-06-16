"""
Comtrade Data Adapter — UN Comtrade HS Commodity Code Data
==========================================================

In production this module calls the UN Comtrade API:
    https://comtradeapi.un.org/

Real API response schema (v1 /get endpoint):
    {
      "elapsedTime": "...",
      "count": N,
      "data": [
        {
          "reporterCode": 842,
          "partnerCode": 528,
          "cmdCode": "854430",   # ← 6-digit HS code
          "cmdDescE": "...",
          "primaryValue": 123456.78,
          "refYear": 2024,
          ...
        }
      ]
    }

HS codes used here follow the WCO Harmonized System (2022 edition).

For this POC all data is **synthetic** and clearly labelled as such.
"""

from __future__ import annotations


# ── Synthetic Shipment Records ──────────────────────────────────────────

_SYNTHETIC_SHIPMENTS: list[dict] = [
    {
        "sku_id": "SKU-9921-A",
        "hs_code": "854430",
        "description": "Insulated winding wire for EV motor stators",
        "origin_port": "Shanghai",
        "origin_country": "CN",
        "destination_port": "Rotterdam",
        "destination_country": "NL",
        "status": "CLEARED",
        "value_usd": 245_800.00,
        "carrier": "Maersk Line",
        "departure_date": "2026-05-22",
        "eta": "2026-06-18",
    },
    {
        "sku_id": "SKU-3347-B",
        "hs_code": "870380",
        "description": "Battery-electric passenger vehicle (CBU)",
        "origin_port": "Hamburg",
        "origin_country": "DE",
        "destination_port": "New York",
        "destination_country": "US",
        "status": "IN_TRANSIT",
        "value_usd": 1_120_000.00,
        "carrier": "MSC",
        "departure_date": "2026-06-01",
        "eta": "2026-06-25",
    },
    {
        "sku_id": "SKU-5510-C",
        "hs_code": "850440",
        "description": "Static converter (DC-DC) for EV charging",
        "origin_port": "Singapore",
        "origin_country": "SG",
        "destination_port": "Dubai",
        "destination_country": "AE",
        "status": "CUSTOMS_HOLD",
        "value_usd": 87_400.00,
        "carrier": "CMA CGM",
        "departure_date": "2026-05-28",
        "eta": "2026-06-15",
    },
    {
        "sku_id": "SKU-7782-D",
        "hs_code": "854430",
        "description": "Lithium-ion battery management PCB assemblies",
        "origin_port": "Shanghai",
        "origin_country": "CN",
        "destination_port": "Hamburg",
        "destination_country": "DE",
        "status": "OFAC_FLAGGED",
        "value_usd": 312_600.00,
        "carrier": "COSCO Shipping",
        "departure_date": "2026-06-04",
        "eta": "2026-07-01",
    },
    {
        "sku_id": "SKU-1190-E",
        "hs_code": "870380",
        "description": "Hybrid-electric SUV (CKD kit)",
        "origin_port": "Rotterdam",
        "origin_country": "NL",
        "destination_port": "Singapore",
        "destination_country": "SG",
        "status": "CLEARED",
        "value_usd": 780_000.00,
        "carrier": "Hapag-Lloyd",
        "departure_date": "2026-05-10",
        "eta": "2026-06-08",
    },
    {
        "sku_id": "SKU-6643-F",
        "hs_code": "850440",
        "description": "On-board charger module 22 kW",
        "origin_port": "New York",
        "origin_country": "US",
        "destination_port": "Rotterdam",
        "destination_country": "NL",
        "status": "IN_TRANSIT",
        "value_usd": 134_200.00,
        "carrier": "Maersk Line",
        "departure_date": "2026-06-10",
        "eta": "2026-06-28",
    },
    {
        "sku_id": "SKU-2204-G",
        "hs_code": "853710",
        "description": "Numerical control panel for assembly robots",
        "origin_port": "Hamburg",
        "origin_country": "DE",
        "destination_port": "Shanghai",
        "destination_country": "CN",
        "status": "CUSTOMS_HOLD",
        "value_usd": 56_300.00,
        "carrier": "Evergreen Marine",
        "departure_date": "2026-06-02",
        "eta": "2026-07-05",
    },
    {
        "sku_id": "SKU-8899-H",
        "hs_code": "870380",
        "description": "Battery-electric light commercial van (CBU)",
        "origin_port": "Dubai",
        "origin_country": "AE",
        "destination_port": "New York",
        "destination_country": "US",
        "status": "OFAC_FLAGGED",
        "value_usd": 425_000.00,
        "carrier": "MSC",
        "departure_date": "2026-06-07",
        "eta": "2026-07-10",
    },
    {
        "sku_id": "SKU-4456-I",
        "hs_code": "854430",
        "description": "High-voltage cable harness for EV drivetrain",
        "origin_port": "Shanghai",
        "origin_country": "CN",
        "destination_port": "New York",
        "destination_country": "US",
        "status": "CLEARED",
        "value_usd": 198_500.00,
        "carrier": "CMA CGM",
        "departure_date": "2026-05-15",
        "eta": "2026-06-12",
    },
    {
        "sku_id": "SKU-3301-J",
        "hs_code": "850440",
        "description": "Bidirectional inverter for V2G systems",
        "origin_port": "Singapore",
        "origin_country": "SG",
        "destination_port": "Hamburg",
        "destination_country": "DE",
        "status": "IN_TRANSIT",
        "value_usd": 267_900.00,
        "carrier": "Hapag-Lloyd",
        "departure_date": "2026-06-12",
        "eta": "2026-07-08",
    },
]


# ── Synthetic Compliance Alerts ─────────────────────────────────────────

_SYNTHETIC_ALERTS: list[dict] = [
    {
        "alert_id": "ALT-001",
        "severity": "CRITICAL",
        "sku_id": "SKU-7782-D",
        "message": (
            "OFAC SDN match: consignee 'Huaxin Industrial Co.' appears on "
            "the Specially Designated Nationals list (SDN-12447). "
            "Shipment frozen pending manual review."
        ),
        "timestamp": "2026-06-15T08:12:44Z",
        "source": "OFAC Screening System",
    },
    {
        "alert_id": "ALT-002",
        "severity": "CRITICAL",
        "sku_id": "SKU-8899-H",
        "message": (
            "End-use certificate missing for dual-use goods (EAR Category 3). "
            "Export license determination required before release."
        ),
        "timestamp": "2026-06-14T22:05:19Z",
        "source": "OFAC Screening System",
    },
    {
        "alert_id": "ALT-003",
        "severity": "WARNING",
        "sku_id": "SKU-5510-C",
        "message": (
            "Customs hold at Jebel Ali: commercial invoice value "
            "discrepancy — declared USD 87,400 vs. assessed USD 94,100. "
            "Supporting valuation documents requested."
        ),
        "timestamp": "2026-06-15T11:30:00Z",
        "source": "Customs Authority",
    },
    {
        "alert_id": "ALT-004",
        "severity": "WARNING",
        "sku_id": "SKU-2204-G",
        "message": (
            "HS code 853710 reclassification review triggered — "
            "potential anti-dumping duty applies under EU Regulation 2025/1887."
        ),
        "timestamp": "2026-06-14T16:45:32Z",
        "source": "Customs Authority",
    },
    {
        "alert_id": "ALT-005",
        "severity": "INFO",
        "sku_id": "SKU-9921-A",
        "message": (
            "Certificate of Origin (Form A) verified by Rotterdam customs. "
            "Preferential tariff rate 0% applied under EU-China FTA."
        ),
        "timestamp": "2026-06-13T09:20:11Z",
        "source": "Port Security",
    },
    {
        "alert_id": "ALT-006",
        "severity": "INFO",
        "sku_id": "SKU-1190-E",
        "message": (
            "Container MSCU-7294610 cleared X-ray scan at Singapore PSA "
            "terminal. No anomalies detected."
        ),
        "timestamp": "2026-06-12T14:55:07Z",
        "source": "Port Security",
    },
    {
        "alert_id": "ALT-007",
        "severity": "WARNING",
        "sku_id": "SKU-4456-I",
        "message": (
            "Section 301 tariff surcharge (25%) may apply — "
            "origin country CN, HS heading 8544. "
            "Verify tariff classification with broker."
        ),
        "timestamp": "2026-06-16T07:10:45Z",
        "source": "Customs Authority",
    },
]


# ── Synthetic Document Checklists ───────────────────────────────────────

def _build_docs(
    sku_id: str,
    bol_status: str = "VERIFIED",
    inv_status: str = "VERIFIED",
    coo_status: str = "PENDING",
    cus_status: str = "MISSING",
) -> list[dict]:
    """Return a four-document checklist for *sku_id* with given statuses."""
    return [
        {
            "doc_type": "BILL_OF_LADING",
            "doc_name": "Bill of Lading",
            "status": bol_status,
            "reference_number": f"BL-{sku_id[-5:]}-2026" if bol_status != "MISSING" else None,
            "issued_by": "Carrier" if bol_status != "MISSING" else None,
            "issued_date": "2026-05-20" if bol_status != "MISSING" else None,
        },
        {
            "doc_type": "COMMERCIAL_INVOICE",
            "doc_name": "Commercial Invoice",
            "status": inv_status,
            "reference_number": f"INV-{sku_id[-5:]}-2026" if inv_status != "MISSING" else None,
            "issued_by": "Shipper" if inv_status != "MISSING" else None,
            "issued_date": "2026-05-18" if inv_status != "MISSING" else None,
        },
        {
            "doc_type": "CERTIFICATE_OF_ORIGIN",
            "doc_name": "Certificate of Origin",
            "status": coo_status,
            "reference_number": f"CO-{sku_id[-5:]}-2026" if coo_status == "VERIFIED" else None,
            "issued_by": "Chamber of Commerce" if coo_status == "VERIFIED" else None,
            "issued_date": "2026-05-19" if coo_status == "VERIFIED" else None,
        },
        {
            "doc_type": "CUSTOMS_DECLARATION",
            "doc_name": "Customs Declaration",
            "status": cus_status,
            "reference_number": f"CD-{sku_id[-5:]}-2026" if cus_status == "VERIFIED" else None,
            "issued_by": "Customs Broker" if cus_status == "VERIFIED" else None,
            "issued_date": "2026-05-25" if cus_status == "VERIFIED" else None,
        },
    ]


_DOC_STATUS_MAP: dict[str, dict] = {
    "SKU-9921-A": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "VERIFIED", "cus_status": "VERIFIED"},
    "SKU-3347-B": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "PENDING", "cus_status": "MISSING"},
    "SKU-5510-C": {"bol_status": "VERIFIED", "inv_status": "PENDING", "coo_status": "MISSING", "cus_status": "MISSING"},
    "SKU-7782-D": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "MISSING", "cus_status": "MISSING"},
    "SKU-1190-E": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "VERIFIED", "cus_status": "VERIFIED"},
    "SKU-6643-F": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "PENDING", "cus_status": "PENDING"},
    "SKU-2204-G": {"bol_status": "VERIFIED", "inv_status": "PENDING", "coo_status": "PENDING", "cus_status": "MISSING"},
    "SKU-8899-H": {"bol_status": "PENDING", "inv_status": "MISSING", "coo_status": "MISSING", "cus_status": "MISSING"},
    "SKU-4456-I": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "VERIFIED", "cus_status": "PENDING"},
    "SKU-3301-J": {"bol_status": "VERIFIED", "inv_status": "VERIFIED", "coo_status": "PENDING", "cus_status": "MISSING"},
}


# ── Public Functions ────────────────────────────────────────────────────

def get_shipments(status_filter: str = "ALL") -> list[dict]:
    """Return synthetic shipment records, optionally filtered by *status_filter*.

    Parameters
    ----------
    status_filter:
        One of ``ALL``, ``CLEARED``, ``IN_TRANSIT``, ``CUSTOMS_HOLD``,
        ``OFAC_FLAGGED``.  Defaults to ``ALL`` (no filtering).

    Returns
    -------
    list[dict]
        Each dict follows the UN Comtrade record schema (simplified).
    """
    if status_filter == "ALL":
        return list(_SYNTHETIC_SHIPMENTS)
    return [s for s in _SYNTHETIC_SHIPMENTS if s["status"] == status_filter]


def get_alerts() -> list[dict]:
    """Return synthetic compliance alerts sorted by severity.

    Returns
    -------
    list[dict]
        Alert dicts with fields: alert_id, severity, sku_id, message,
        timestamp, source.
    """
    severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    return sorted(
        _SYNTHETIC_ALERTS,
        key=lambda a: severity_order.get(a["severity"], 99),
    )


def get_documents(sku_id: str) -> list[dict]:
    """Return the document checklist for a given SKU.

    Parameters
    ----------
    sku_id:
        The SKU identifier (e.g. ``'SKU-9921-A'``).

    Returns
    -------
    list[dict]
        Four-element list representing the standard trade-document
        checklist (BOL, invoice, CoO, customs declaration).
    """
    statuses = _DOC_STATUS_MAP.get(sku_id, {})
    return _build_docs(sku_id, **statuses)
