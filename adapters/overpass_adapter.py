import requests
import json
import os
import random

CACHE_FILE = "ports_cache.json"

_PORTS_CACHE = []

def fetch_live_ports() -> list[dict]:
    try:
        response = requests.get("https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json")
        response.raise_for_status()
        data = response.json()
        
        # Take an evenly spaced slice of 800 cities to ensure global distribution
        step = max(1, len(data) // 800)
        selected_cities = data[::step][:800]
        
        ports = []
        for i, city in enumerate(selected_cities):
            name = city.get("name", "Unnamed")
            if not name: continue
                
            ports.append({
                "osm_node_id": 1000000 + i,
                "name": f"Port of {name}",
                "country": city.get("country", "INT"),
                "lat": float(city.get("lat", 0.0)),
                "lng": float(city.get("lng", 0.0)),
                "port_type": "container_terminal",
                "risk_level": random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.8, 0.15, 0.05])[0],
                "active_shipments": 0,
            })
            if len(ports) >= 800:
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
