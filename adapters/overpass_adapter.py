"""
Overpass / OpenStreetMap Port Location Adapter
==============================================

In production this module queries the Overpass API:
    https://overpass-api.de/api/interpreter

Example Overpass QL query for port nodes::

    [out:json][timeout:30];
    (
      node["harbour:type"="container_terminal"](bbox);
      node["landuse"="port"](bbox);
    );
    out body;

Each result node contains ``lat``, ``lon``, ``tags.name``, and an
integer ``id`` (the OSM node ID).

For this POC all data is **synthetic** and clearly labelled as such.
"""

from __future__ import annotations


# ── Synthetic Port Locations ────────────────────────────────────────────

_SYNTHETIC_PORTS: list[dict] = [
    {
        "osm_node_id": 264_371_908,
        "name": "Port of Rotterdam — Europoort",
        "country": "NL",
        "lat": 51.9496,
        "lng": 4.1453,
        "port_type": "container_terminal",
        "risk_level": "LOW",
        "active_shipments": 142,
    },
    {
        "osm_node_id": 267_012_455,
        "name": "Port of Hamburg — Altenwerder",
        "country": "DE",
        "lat": 53.5069,
        "lng": 9.9350,
        "port_type": "container_terminal",
        "risk_level": "LOW",
        "active_shipments": 97,
    },
    {
        "osm_node_id": 305_894_112,
        "name": "PSA Singapore — Tanjong Pagar",
        "country": "SG",
        "lat": 1.2644,
        "lng": 103.8420,
        "port_type": "container_terminal",
        "risk_level": "MEDIUM",
        "active_shipments": 213,
    },
    {
        "osm_node_id": 158_236_740,
        "name": "Port of New York — Newark Elizabeth",
        "country": "US",
        "lat": 40.6724,
        "lng": -74.1502,
        "port_type": "customs_facility",
        "risk_level": "LOW",
        "active_shipments": 178,
    },
    {
        "osm_node_id": 412_558_903,
        "name": "Port of Shanghai — Yangshan Deep-Water",
        "country": "CN",
        "lat": 30.6300,
        "lng": 122.0700,
        "port_type": "container_terminal",
        "risk_level": "MEDIUM",
        "active_shipments": 304,
    },
    {
        "osm_node_id": 289_104_667,
        "name": "DP World — Jebel Ali, Dubai",
        "country": "AE",
        "lat": 25.0085,
        "lng": 55.0580,
        "port_type": "customs_facility",
        "risk_level": "HIGH",
        "active_shipments": 65,
    },
]


# ── Public Functions ────────────────────────────────────────────────────

def get_port_locations() -> list[dict]:
    """Return synthetic port location records.

    Returns
    -------
    list[dict]
        Each dict mirrors a simplified Overpass ``node`` element with
        added risk-scoring metadata.
    """
    return list(_SYNTHETIC_PORTS)
