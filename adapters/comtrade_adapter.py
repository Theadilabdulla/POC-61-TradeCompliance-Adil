import random
import time
import uuid
from datetime import datetime, timezone, timedelta
from adapters.overpass_adapter import get_port_locations

_GENERATED_SHIPMENTS = []
_GENERATED_ALERTS = []
_GENERATED_DOCUMENTS = {}

_LAST_UPDATE_TIME = 0.0
_TARGET_SHIPMENT_COUNT = 5000

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
        
    status = random.choices(["IN_TRANSIT", "CLEARED"], weights=[0.9, 0.1])[0]
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
        
    for _ in range(_TARGET_SHIPMENT_COUNT):
        _GENERATED_SHIPMENTS.append(_spawn_shipment(origins, destinations, checkpoint))
        
    _LAST_UPDATE_TIME = time.time()

def _progress_simulation():
    global _GENERATED_SHIPMENTS, _GENERATED_ALERTS, _LAST_UPDATE_TIME
    now = time.time()
    dt = now - _LAST_UPDATE_TIME
    if dt < 1.0:
        return # Only progress if at least 1 second passed
    _LAST_UPDATE_TIME = now
    
    ports = get_port_locations()
    checkpoint = next((p for p in ports if p["osm_node_id"] == 999999999), None)
    origins = [p for p in ports if p["osm_node_id"] != 999999999]
    destinations = [p for p in ports if p["osm_node_id"] != 999999999]
    if not origins or not checkpoint:
        return

    new_shipments = []
    
    # Probabilities per second
    p_transit_to_cleared = 0.05 * dt
    p_transit_to_hold = 0.02 * dt
    p_hold_to_cleared = 0.10 * dt
    p_hold_to_ofac = 0.05 * dt
    
    for s in _GENERATED_SHIPMENTS:
        s["_age"] += dt
        
        # State transitions
        if s["status"] == "IN_TRANSIT":
            if random.random() < p_transit_to_cleared:
                s["status"] = "CLEARED"
            elif random.random() < p_transit_to_hold:
                s["status"] = "CUSTOMS_HOLD"
                _GENERATED_ALERTS.append({
                    "alert_id": str(uuid.uuid4()),
                    "severity": "WARNING",
                    "sku_id": s["sku_id"],
                    "message": f"Shipment held pending physical verification.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "Customs Authority",
                })
        elif s["status"] == "CUSTOMS_HOLD":
            if random.random() < p_hold_to_cleared:
                s["status"] = "CLEARED"
                # Clear related alerts
                _GENERATED_ALERTS = [a for a in _GENERATED_ALERTS if a["sku_id"] != s["sku_id"]]
            elif random.random() < p_hold_to_ofac:
                s["status"] = "OFAC_FLAGGED"
                _GENERATED_ALERTS = [a for a in _GENERATED_ALERTS if a["sku_id"] != s["sku_id"]]
                _GENERATED_ALERTS.append({
                    "alert_id": str(uuid.uuid4()),
                    "severity": "CRITICAL",
                    "sku_id": s["sku_id"],
                    "message": f"Sanctions hit: Beneficiary matches official OFAC Sanctions List Data Schema blocklist.",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "OFAC Screening System",
                })
                
        # Aging out logic
        if s["status"] in ["CLEARED", "OFAC_FLAGGED"]:
            if s["_age"] > 15.0: # Keep finished shipments visible for 15s before dropping
                if s["status"] == "OFAC_FLAGGED":
                    _GENERATED_ALERTS = [a for a in _GENERATED_ALERTS if a["sku_id"] != s["sku_id"]]
                continue # Do not append to new_shipments (drops it)
                
        new_shipments.append(s)

    # Spawn new shipments to maintain target count
    while len(new_shipments) < _TARGET_SHIPMENT_COUNT:
        new_shipments.append(_spawn_shipment(origins, destinations, checkpoint))
        
    _GENERATED_SHIPMENTS = new_shipments

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
