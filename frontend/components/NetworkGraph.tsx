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
    const checkpoint = ports.find((p) => p.port_type === "checkpoint") || ports[0];
    
    // 1. Build map of ALL ports
    const portMap = new Map(ports.map(p => [p.name, p]));

    // 2. Filter active shipments
    const activeShipments = shipments.filter(
      (s) => statusFilter === "ALL" || s.status === statusFilter
    );

    // 3. Count traffic per port
    const originCounts = new Map<string, number>();
    const destCounts = new Map<string, number>();
    activeShipments.forEach(s => {
       if (portMap.has(s.origin_port)) {
         originCounts.set(s.origin_port, (originCounts.get(s.origin_port) || 0) + 1);
       }
       if (portMap.has(s.destination_port)) {
         destCounts.set(s.destination_port, (destCounts.get(s.destination_port) || 0) + 1);
       }
    });

    // 4. Select top 10 busiest origins and top 10 busiest destinations
    const topOrigins = Array.from(originCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);

    const topDests = Array.from(destCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(e => e[0]);
      
    const activeOrigins = new Set(topOrigins);
    const activeDests = new Set(topDests);

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
