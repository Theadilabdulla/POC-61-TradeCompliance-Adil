import random
import time
import uuid
from datetime import datetime, timezone, timedelta
from adapters.overpass_adapter import get_port_locations

_GENERATED_SHIPMENTS = []
_GENERATED_ALERTS = []
_GENERATED_DOCUMENTS = {}

_LAST_UPDATE_TIME = 0.0
_TARGET_SHIPMENT_COUNT = 1000

CARRIERS = ["Maersk Line", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd", "Evergreen"]
HS_CODES = [
    ("854430", "Ignition wiring sets and other wiring sets"),
    ("870380", "Vehicles, with only electric motor for propulsion"),
    ("850440", "Static converters (e.g. rectifiers)"),
    ("853710", "Boards, panels, consoles, desks, cabinets"),
]

def _spawn_shipment(origins, destinations, checkpoint):
    origin = random.choice(origins)
    dest = random.choice(destinations)
    while dest["osm_node_id"] == origin["osm_node_id"]:
        dest = random.choice(destinations)
        
    status = "CLEARED"  # Will be overridden in init
    hs_code, desc = random.choice(HS_CODES)
    sku = f"SKU-{random.randint(1000, 9999)}-{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}"
    
    departure = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
    
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
        "carrier": random.choice(CARRIERS),
        "departure_date": departure.isoformat(),
        "eta": (departure + timedelta(days=random.randint(10, 30))).isoformat(),
        "_age": 0.0 # internal tracker
    }
    
    # Generate static docs
    _GENERATED_DOCUMENTS[sku] = [
        {
            "doc_type": "BILL_OF_LADING",
            "doc_name": "Bill of Lading",
            "status": "VERIFIED",
            "reference_number": f"BOL-{random.randint(100000, 999999)}",
            "issued_by": shipment["carrier"],
            "issued_date": shipment["departure_date"],
        },
        {
            "doc_type": "COMMERCIAL_INVOICE",
            "doc_name": "Commercial Invoice",
            "status": "VERIFIED",
            "reference_number": f"INV-{random.randint(10000, 99999)}",
            "issued_by": "Supplier",
            "issued_date": shipment["departure_date"],
        }
    ]
    return shipment

def _init_synthetic_data():
    global _GENERATED_SHIPMENTS, _GENERATED_ALERTS, _LAST_UPDATE_TIME
    if _LAST_UPDATE_TIME > 0:
        return
        
    ports = get_port_locations()
    checkpoint = next((p for p in ports if p["osm_node_id"] == 999999999), None)
    origins = [p for p in ports if p["osm_node_id"] != 999999999]
    destinations = [p for p in ports if p["osm_node_id"] != 999999999]
    
    if not checkpoint:
        checkpoint = {"osm_node_id": 999999999, "name": "GLOBAL COMPLIANCE CHECKPOINT", "country": "INT"}
        
    if not origins or not destinations:
        print("Warning: No valid origin/destination nodes found. Using fallback mock node.")
        mock_node = {"osm_node_id": 1, "name": "Mock Port", "country": "US"}
        origins = [mock_node]
        destinations = [mock_node]
        
    for i in range(_TARGET_SHIPMENT_COUNT):
        shipment = _spawn_shipment(origins, destinations, checkpoint)
        if i < 700:
            shipment["status"] = "CLEARED"
        else:
            shipment["status"] = "CUSTOMS_HOLD"
            _GENERATED_ALERTS.append({
                "alert_id": str(uuid.uuid4()),
                "severity": "WARNING",
                "sku_id": shipment["sku_id"],
                "message": f"Shipment held pending physical verification.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "Customs Authority",
            })
        _GENERATED_SHIPMENTS.append(shipment)
        
    _LAST_UPDATE_TIME = time.time()

def _progress_simulation():
    # Pass to maintain strict 70:30 ratio
    pass

def get_shipments(status_filter: str = 'ALL') -> list[dict]:
    _init_synthetic_data()
    _progress_simulation()
    
    # Filter and strip internal _age key for API
    results = []
    for s in _GENERATED_SHIPMENTS:
        if status_filter == 'ALL' or s["status"] == status_filter:
            out = dict(s)
            del out["_age"]
            results.append(out)
    return results

def get_alerts() -> list[dict]:
    _init_synthetic_data()
    _progress_simulation()
    order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    return sorted(_GENERATED_ALERTS, key=lambda a: order.get(a["severity"], 99))

def get_documents(sku_id: str) -> list[dict]:
    _init_synthetic_data()
    return _GENERATED_DOCUMENTS.get(sku_id, [])
