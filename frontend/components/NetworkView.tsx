"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import type { PortLocation, Shipment } from "@/types/api";

interface NetworkViewProps {
  statusFilter: string;
  ports: PortLocation[];
  shipments: Shipment[];
}

const STATUS_COLORS: Record<string, string> = {
  CLEARED: "#38BDF8",
  IN_TRANSIT: "#818CF8",
  CUSTOMS_HOLD: "#FBBF24",
  OFAC_FLAGGED: "#EF4444",
};

export default function NetworkView({ statusFilter, ports, shipments }: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current || ports.length === 0) return;

    // Cap to 20 ports + checkpoint
    const checkpoint = ports.find((p) => p.port_type === "checkpoint") || ports[0];
    const normalPorts = ports.filter((p) => p.port_type !== "checkpoint").slice(0, 20);
    const visiblePorts = [...normalPorts];
    if (checkpoint && !visiblePorts.find(p => p.osm_node_id === checkpoint.osm_node_id)) {
      visiblePorts.push(checkpoint);
    }
    
    const portNames = new Set(visiblePorts.map(p => p.name));

    const rawNodes = visiblePorts.map((p) => ({
      id: p.osm_node_id,
      label: p.name.split(" ").slice(0, 2).join("\\n").toUpperCase(), // Shorten name
      group: p.port_type === "checkpoint" ? "checkpoint" : "port",
      title: `${p.name} · ${p.country} · Risk: ${p.risk_level}`,
    }));

    const rawEdges: any[] = [];
    const edgeKeySet = new Set<string>();

    const activeShipments = shipments.filter(
      (s) => statusFilter === "ALL" || s.status === statusFilter
    );

    activeShipments.forEach((s) => {
      if (!portNames.has(s.origin_port) || !portNames.has(s.destination_port)) return;

      const origin = visiblePorts.find(p => p.name === s.origin_port)!;
      const dest = visiblePorts.find(p => p.name === s.destination_port)!;
      const color = STATUS_COLORS[s.status] || "#6B7280";

      // Origin -> Checkpoint
      const edge1Key = `${origin.osm_node_id}-${checkpoint.osm_node_id}-${s.status}`;
      if (!edgeKeySet.has(edge1Key)) {
        edgeKeySet.add(edge1Key);
        rawEdges.push({
          id: edge1Key,
          from: origin.osm_node_id,
          to: checkpoint.osm_node_id,
          color: { color, highlight: color },
          group: s.status,
        });
      }

      // Checkpoint -> Destination
      const edge2Key = `${checkpoint.osm_node_id}-${dest.osm_node_id}-${s.status}`;
      if (!edgeKeySet.has(edge2Key)) {
        edgeKeySet.add(edge2Key);
        rawEdges.push({
          id: edge2Key,
          from: checkpoint.osm_node_id,
          to: dest.osm_node_id,
          label: s.status === "OFAC_FLAGGED" || s.status === "CUSTOMS_HOLD" ? s.status : undefined,
          color: { color, highlight: color },
          dashes: s.status === "OFAC_FLAGGED" ? [5, 5] : false,
          group: s.status,
        });
      }
    });

    const nodes = new DataSet(rawNodes);
    const edges = new DataSet(rawEdges);

    const options = {
      nodes: {
        shape: "box",
        font: { face: "monospace", size: 10, color: "#F1F5F9", multi: true },
        color: {
          background: "#0B1117",
          border: "#1F2937",
          highlight: { background: "#111827", border: "#38BDF8" },
          hover: { background: "#111827", border: "#38BDF8" },
        },
        borderWidth: 1,
        borderWidthSelected: 2,
        margin: { top: 10, bottom: 10, left: 12, right: 12 },
      },
      edges: {
        width: 1.5,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        font: { face: "monospace", size: 8, color: "#6B7280", strokeWidth: 0 },
        smooth: { enabled: true, type: "curvedCW", roundness: 0.15 },
      },
      groups: {
        port: { color: { background: "#0B1117", border: "#1F2937" } },
        checkpoint: { color: { background: "#111827", border: "#38BDF8" }, borderWidth: 1, shapeProperties: { borderDashes: [4, 4] } },
      },
      physics: {
        solver: "forceAtlas2Based",
        forceAtlas2Based: { gravitationalConstant: -40, springLength: 200, damping: 0.8 },
        stabilization: { iterations: 150 },
      },
      interaction: { hover: true, tooltipDelay: 100 },
      layout: { improvedLayout: true },
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, [statusFilter, ports, shipments]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full bg-[#030712]" />
      <div className="absolute bottom-3 left-3 bg-[#0B1117]/80 backdrop-blur-md border border-[#1F2937] px-3 py-1.5 rounded-md">
        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">
          vis-network · physics simulation ({ports.length > 20 ? 20 : ports.length} nodes)
        </span>
      </div>
    </div>
  );
}
