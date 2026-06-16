import requests
import json
import os
import random

CACHE_FILE = "ports_cache.json"

_PORTS_CACHE = []

def fetch_live_ports() -> list[dict]:
    query = """
    [out:json][timeout:25];
    node["seamark:type"="harbour"];
    out body 200;
    """
    try:
        response = requests.post("https://overpass-api.de/api/interpreter", data=query)
        response.raise_for_status()
        data = response.json()
        
        ports = []
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            name = tags.get("name") or tags.get("seamark:name") or "Unnamed Port"
            if "Unnamed" in name:
                continue
                
            ports.append({
                "osm_node_id": element["id"],
                "name": name,
                "country": tags.get("is_in:country", "Unknown"),
                "lat": element["lat"],
                "lng": element["lon"],
                "port_type": "container_terminal",
                "risk_level": random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.7, 0.2, 0.1])[0],
                "active_shipments": 0, # Will be aggregated dynamically
            })
            if len(ports) >= 150:
                break
        
        # Always ensure we have a Global Checkpoint
        ports.append({
            "osm_node_id": 999999999,
            "name": "GLOBAL COMPLIANCE CHECKPOINT",
            "country": "INT",
            "lat": 0.0,
            "lng": 0.0,
            "port_type": "checkpoint",
            "risk_level": "HIGH",
            "active_shipments": 0,
        })
        
        return ports
    except Exception as e:
        print(f"Failed to fetch live ports: {e}")
        # Fallback to synthetic if live fails
        from . import overpass_adapter_backup
        return overpass_adapter_backup._SYNTHETIC_PORTS

def get_port_locations() -> list[dict]:
    global _PORTS_CACHE
    if not _PORTS_CACHE:
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r") as f:
                _PORTS_CACHE = json.load(f)
        else:
            _PORTS_CACHE = fetch_live_ports()
            with open(CACHE_FILE, "w") as f:
                json.dump(_PORTS_CACHE, f)
    return _PORTS_CACHE
