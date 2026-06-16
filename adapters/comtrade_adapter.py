import random
import uuid
from datetime import datetime, timezone, timedelta
from adapters.overpass_adapter import get_port_locations

_GENERATED_SHIPMENTS = []
_GENERATED_ALERTS = []
_GENERATED_DOCUMENTS = {}

def _init_synthetic_data():
    global _GENERATED_SHIPMENTS, _GENERATED_ALERTS, _GENERATED_DOCUMENTS
    if _GENERATED_SHIPMENTS:
        return
        
    ports = get_port_locations()
    checkpoint = next((p for p in ports if p["osm_node_id"] == 999999999), None)
    origins = [p for p in ports if p["osm_node_id"] != 999999999]
    destinations = [p for p in ports if p["osm_node_id"] != 999999999]
    
    # Checkpoint fallback
    if not checkpoint:
        checkpoint = {
            "osm_node_id": 999999999,
            "name": "GLOBAL COMPLIANCE CHECKPOINT",
            "country": "INT",
        }
        
    statuses = ["CLEARED", "IN_TRANSIT", "CUSTOMS_HOLD", "OFAC_FLAGGED"]
    status_weights = [0.75, 0.20, 0.04, 0.01]
    carriers = ["Maersk Line", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd", "Evergreen"]
    hs_codes = [
        ("854430", "Ignition wiring sets and other wiring sets"),
        ("870380", "Vehicles, with only electric motor for propulsion"),
        ("850440", "Static converters (e.g. rectifiers)"),
        ("853710", "Boards, panels, consoles, desks, cabinets"),
    ]
    
    # Generate 5,000 shipments
    for _ in range(5000):
        origin = random.choice(origins)
        dest = random.choice(destinations)
        while dest["osm_node_id"] == origin["osm_node_id"]:
            dest = random.choice(destinations)
            
        status = random.choices(statuses, weights=status_weights)[0]
        hs_code, desc = random.choice(hs_codes)
        sku = f"SKU-{random.randint(1000, 9999)}-{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"
        
        # Route logic: everything goes through checkpoint
        
        shipment = {
            "sku_id": sku,
            "hs_code": hs_code,
            "description": desc,
            "origin_port": origin["name"],
            "origin_country": origin["country"],
            "destination_port": dest["name"],
            "destination_country": dest["country"],
            "status": status,
            "value_usd": round(random.uniform(5000, 500000), 2),
            "carrier": random.choice(carriers),
            "departure_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).isoformat(),
            "eta": (datetime.now(timezone.utc) + timedelta(days=random.randint(1, 30))).isoformat(),
        }
        _GENERATED_SHIPMENTS.append(shipment)
        
        # Generate documents
        _GENERATED_DOCUMENTS[sku] = [
            {
                "doc_type": "BILL_OF_LADING",
                "doc_name": "Bill of Lading",
                "status": "VERIFIED" if status in ["CLEARED", "IN_TRANSIT"] else random.choice(["VERIFIED", "PENDING", "MISSING"]),
                "reference_number": f"BOL-{random.randint(100000, 999999)}",
                "issued_by": shipment["carrier"],
                "issued_date": shipment["departure_date"],
            },
            {
                "doc_type": "COMMERCIAL_INVOICE",
                "doc_name": "Commercial Invoice",
                "status": "VERIFIED" if status == "CLEARED" else random.choice(["VERIFIED", "PENDING"]),
                "reference_number": f"INV-{random.randint(10000, 99999)}",
                "issued_by": "Supplier",
                "issued_date": shipment["departure_date"],
            },
            {
                "doc_type": "CERTIFICATE_OF_ORIGIN",
                "doc_name": "Certificate of Origin",
                "status": "MISSING" if status == "CUSTOMS_HOLD" else "VERIFIED",
                "reference_number": f"COO-{random.randint(1000, 9999)}",
                "issued_by": f"{origin['country']} Chamber of Commerce",
                "issued_date": shipment["departure_date"],
            },
            {
                "doc_type": "CUSTOMS_DECLARATION",
                "doc_name": "Customs Declaration",
                "status": "MISSING" if status == "OFAC_FLAGGED" else "VERIFIED",
                "reference_number": f"CUS-{random.randint(100000, 999999)}",
                "issued_by": "Customs Authority",
                "issued_date": None,
            }
        ]
        
        # Generate Alerts for non-cleared
        if status == "OFAC_FLAGGED":
            _GENERATED_ALERTS.append({
                "alert_id": str(uuid.uuid4()),
                "severity": "CRITICAL",
                "sku_id": sku,
                "message": f"Shipment blocked: Origin/Destination matches OFAC sanctions list criteria.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "OFAC Screening System",
            })
        elif status == "CUSTOMS_HOLD":
            _GENERATED_ALERTS.append({
                "alert_id": str(uuid.uuid4()),
                "severity": "WARNING",
                "sku_id": sku,
                "message": f"Shipment held pending physical x-ray scanning or document verification.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "Customs Authority",
            })

def get_shipments(status_filter: str = 'ALL') -> list[dict]:
    _init_synthetic_data()
    if status_filter == 'ALL':
        return _GENERATED_SHIPMENTS
    return [s for s in _GENERATED_SHIPMENTS if s["status"] == status_filter]

def get_alerts() -> list[dict]:
    _init_synthetic_data()
    order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    return sorted(_GENERATED_ALERTS, key=lambda a: order.get(a["severity"], 99))

def get_documents(sku_id: str) -> list[dict]:
    _init_synthetic_data()
    return _GENERATED_DOCUMENTS.get(sku_id, [])
