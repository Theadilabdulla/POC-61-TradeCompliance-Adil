from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import logging
import random
import io
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

# LOGGING
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("realrails-trade")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ SYNTHETIC DATA GENERATOR ------------------
# We simulate global trade hubs to draw trace flows between them.
PORTS = [
    {"name": "Shanghai, CN", "lat": 31.2304, "lng": 121.4737},
    {"name": "Los Angeles, US", "lat": 34.0522, "lng": -118.2437},
    {"name": "Rotterdam, NL", "lat": 51.9225, "lng": 4.4791},
    {"name": "Singapore, SG", "lat": 1.3521, "lng": 103.8198},
    {"name": "Dubai, AE", "lat": 25.2048, "lng": 55.2708},
    {"name": "Hamburg, DE", "lat": 53.5511, "lng": 9.9937},
    {"name": "New York, US", "lat": 40.7128, "lng": -74.0060},
    {"name": "Mumbai, IN", "lat": 18.9388, "lng": 72.8258},
]

STATUSES = ["Cleared", "In Transit", "Customs Hold", "OFAC Flagged"]
SKUS = ["Semiconductors (Tier 1)", "Lithium-Ion Cells", "Medical Devices", "Auto Parts (OEM)", "Raw Textiles"]

def generate_mock_trade_data(num_records=500):
    log.info(f"⚙️ Generating {num_records} synthetic trade shipments...")
    data = []
    
    for _ in range(num_records):
        origin = random.choice(PORTS)
        dest = random.choice([p for p in PORTS if p["name"] != origin["name"]])
        
        # Weighted random status (Mostly fine, some flagged)
        status = random.choices(STATUSES, weights=[0.5, 0.3, 0.1, 0.1])[0]
        
        shipment = {
            "shipment_id": f"TRC-{str(uuid.uuid4())[:8].upper()}",
            "sku": random.choice(SKUS),
            "origin_name": origin["name"],
            "origin_lat": origin["lat"] + random.uniform(-0.1, 0.1), # Slight variance for visual spread
            "origin_lng": origin["lng"] + random.uniform(-0.1, 0.1),
            "dest_name": dest["name"],
            "dest_lat": dest["lat"] + random.uniform(-0.1, 0.1),
            "dest_lng": dest["lng"] + random.uniform(-0.1, 0.1),
            "status": status,
            "value_usd": round(random.uniform(15000, 2500000), 2),
            "last_checkpoint": (datetime.now() - timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%d"),
            "documents_attached": random.choice(["Bill of Lading, Commercial Invoice", "Export License, Bill of Lading", "Missing Documentation"])
        }
        data.append(shipment)
        
    return pd.DataFrame(data)

# Initialize data in memory
STORE_DF = generate_mock_trade_data(800)

# ------------------ API ENDPOINTS ------------------

@app.get("/api/metrics")
def get_metrics():
    """Returns high-level insights for the sidebar."""
    total = len(STORE_DF)
    flagged = len(STORE_DF[STORE_DF["status"].isin(["Customs Hold", "OFAC Flagged"])])
    total_value = STORE_DF["value_usd"].sum()
    
    return {
        "total_shipments": total,
        "flagged_shipments": flagged,
        "compliance_rate": round(((total - flagged) / total) * 100, 1),
        "total_value_usd": float(total_value)
    }

@app.get("/api/shipments")
def get_shipments(status: Optional[str] = Query(None)):
    """Returns shipments formatted for MapLibre trace lines and points."""
    df = STORE_DF.copy()
    
    if status and status != "ALL":
        df = df[df["status"] == status]
        
    features = []
    
    for _, row in df.iterrows():
        # Feature 1: The Origin Point
        features.append({
            "type": "Feature",
            "properties": {
                "shipment_id": row["shipment_id"],
                "type": "origin",
                "sku": row["sku"],
                "status": row["status"],
                "location": row["origin_name"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [row["origin_lng"], row["origin_lat"]]
            }
        })
        
        # Feature 2: The Destination Point
        features.append({
            "type": "Feature",
            "properties": {
                "shipment_id": row["shipment_id"],
                "type": "destination",
                "status": row["status"],
                "location": row["dest_name"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [row["dest_lng"], row["dest_lat"]]
            }
        })
        
        # Feature 3: The Trace Line connecting them
        features.append({
            "type": "Feature",
            "properties": {
                "shipment_id": row["shipment_id"],
                "type": "trace_line",
                "status": row["status"],
                "value": row["value_usd"]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [row["origin_lng"], row["origin_lat"]],
                    [row["dest_lng"], row["dest_lat"]]
                ]
            }
        })

    return {"type": "FeatureCollection", "features": features, "total": len(df)}

@app.get("/api/filters/statuses")
def get_statuses():
    """Returns available status filters."""
    return [{"status_id": s, "status_name": s} for s in STATUSES]

@app.get("/api/shipments/csv")
def download_csv():
    """Download synthetic trace data."""
    csv_data = STORE_DF.to_csv(index=False)
    return StreamingResponse(io.StringIO(csv_data), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=trade_compliance_trace.csv"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)