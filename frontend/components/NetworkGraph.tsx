"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { getLayoutedElements } from "@/utils/dagre-layout";
import type { PortLocation, Shipment } from "@/types/api";

const nodeStyle = {
  background: "#0B1117",
  color: "#fff",
  border: "1px solid #1F2937",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "10px",
  fontFamily: "monospace",
};

const checkpointStyle = {
  background: "#111827",
  color: "#38BDF8",
  border: "1px dashed #38BDF8",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "10px",
  fontFamily: "monospace",
};

interface NetworkGraphProps {
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

export default function NetworkGraph({ statusFilter, ports, shipments }: NetworkGraphProps) {
  const { layoutedNodes, filteredEdges } = useMemo(() => {
    // 1. Get Top 20 Ports + Checkpoint
    const checkpoint = ports.find((p) => p.port_type === "checkpoint") || ports[0];
    const normalPorts = ports.filter((p) => p.port_type !== "checkpoint").slice(0, 20);
    const visiblePorts = [...normalPorts];
    if (checkpoint && !visiblePorts.find(p => p.osm_node_id === checkpoint.osm_node_id)) {
      visiblePorts.push(checkpoint);
    }
    
    const portMap = new Map(visiblePorts.map(p => [p.name, p]));

    // 2. Filter shipments and collect active origins/dests
    const activeShipments = shipments.filter(
      (s) => statusFilter === "ALL" || s.status === statusFilter
    );

    const activeOrigins = new Set<string>();
    const activeDests = new Set<string>();
    
    activeShipments.forEach(s => {
      if (portMap.has(s.origin_port) && portMap.has(s.destination_port)) {
        activeOrigins.add(s.origin_port);
        activeDests.add(s.destination_port);
      }
    });

    // 3. Build Strict 3-Column Nodes (Origins -> Checkpoint -> Dests)
    const rawNodes: any[] = [];
    
    rawNodes.push({
      id: "checkpoint",
      position: { x: 0, y: 0 },
      data: { label: checkpoint.name.toUpperCase() },
      style: checkpointStyle,
    });

    activeOrigins.forEach(name => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `origin-${p.osm_node_id}`,
        position: { x: 0, y: 0 },
        data: { label: `${p.name.toUpperCase()} (ORIGIN)` },
        style: nodeStyle,
      });
    });

    activeDests.forEach(name => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `dest-${p.osm_node_id}`,
        position: { x: 0, y: 0 },
        data: { label: `${p.name.toUpperCase()} (DEST)` },
        style: nodeStyle,
      });
    });

    // 4. Build Edges
    const rawEdges: any[] = [];
    const edgeKeySet = new Set<string>();

    activeShipments.forEach((s) => {
      if (!portMap.has(s.origin_port) || !portMap.has(s.destination_port)) return;

      const origin = portMap.get(s.origin_port)!;
      const dest = portMap.get(s.destination_port)!;
      const color = STATUS_COLORS[s.status] || "#6B7280";

      // Origin -> Checkpoint
      const edge1Key = `origin-${origin.osm_node_id}-checkpoint-${s.status}`;
      if (!edgeKeySet.has(edge1Key)) {
        edgeKeySet.add(edge1Key);
        rawEdges.push({
          id: edge1Key,
          source: `origin-${origin.osm_node_id}`,
          target: "checkpoint",
          animated: true,
          style: { stroke: color, strokeWidth: 1.5, opacity: 0.6 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      }

      // Checkpoint -> Destination
      const edge2Key = `checkpoint-dest-${dest.osm_node_id}-${s.status}`;
      if (!edgeKeySet.has(edge2Key)) {
        edgeKeySet.add(edge2Key);
        rawEdges.push({
          id: edge2Key,
          source: "checkpoint",
          target: `dest-${dest.osm_node_id}`,
          animated: true,
          style: { stroke: color, strokeWidth: 1.5, opacity: 0.6, strokeDasharray: s.status === "OFAC_FLAGGED" ? "5 5" : "none" },
          label: s.status === "OFAC_FLAGGED" || s.status === "CUSTOMS_HOLD" ? s.status : undefined,
          labelStyle: { fill: color, fontWeight: 700, fontFamily: "monospace", fontSize: 9 },
          labelBgStyle: { fill: "#030712", fillOpacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      }
    });

    // Apply Dagre layout (Left-to-Right)
    const { nodes } = getLayoutedElements(rawNodes, rawEdges, "LR");
    return { layoutedNodes: nodes, filteredEdges: rawEdges };
  }, [statusFilter, ports, shipments]);

  return (
    <div className="w-full h-full bg-[#030712]">
      <ReactFlow
        nodes={layoutedNodes}
        edges={filteredEdges}
        fitView
        className="dark"
        attributionPosition="bottom-left"
        minZoom={0.2}
      >
        <Background color="#1F2937" gap={24} />
        <Controls style={{ backgroundColor: "#111827", border: "1px solid #1F2937", fill: "#fff" }} />
      </ReactFlow>
    </div>
  );
}
