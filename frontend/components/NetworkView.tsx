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

    const rawNodes: any[] = [];
    
    rawNodes.push({
      id: "checkpoint",
      label: checkpoint.name.split(" ").slice(0, 2).join("\\n").toUpperCase(),
      group: "checkpoint",
      title: "GLOBAL COMPLIANCE CHECKPOINT",
      level: 1, // Middle column
    });

    activeOrigins.forEach(name => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `origin-${p.osm_node_id}`,
        label: `${p.name.split(" ").slice(0, 2).join("\\n").toUpperCase()}\\n(ORIGIN)`,
        group: "port",
        title: `${p.name} · ${p.country} · Origin`,
        level: 0, // Left column
      });
    });

    activeDests.forEach(name => {
      const p = portMap.get(name)!;
      rawNodes.push({
        id: `dest-${p.osm_node_id}`,
        label: `${p.name.split(" ").slice(0, 2).join("\\n").toUpperCase()}\\n(DEST)`,
        group: "port",
        title: `${p.name} · ${p.country} · Destination`,
        level: 2, // Right column
      });
    });

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
          from: `origin-${origin.osm_node_id}`,
          to: "checkpoint",
          color: { color, highlight: color },
          group: s.status,
        });
      }

      // Checkpoint -> Destination
      const edge2Key = `checkpoint-dest-${dest.osm_node_id}-${s.status}`;
      if (!edgeKeySet.has(edge2Key)) {
        edgeKeySet.add(edge2Key);
        rawEdges.push({
          id: edge2Key,
          from: "checkpoint",
          to: `dest-${dest.osm_node_id}`,
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
        font: { face: "monospace", size: 8, color: "#6B7280", strokeWidth: 0, align: "middle" },
        smooth: { enabled: true, type: "cubicBezier", roundness: 0.5 },
      },
      groups: {
        port: { color: { background: "#0B1117", border: "#1F2937" } },
        checkpoint: { color: { background: "#111827", border: "#38BDF8" }, borderWidth: 1, shapeProperties: { borderDashes: [4, 4] } },
      },
      layout: {
        hierarchical: {
          enabled: true,
          direction: "LR",
          sortMethod: "directed",
          levelSeparation: 350,
          nodeSpacing: 100,
        },
      },
      physics: {
        enabled: false, // Hierarchical layout disables dynamic physics to maintain pristine structure
      },
      interaction: { hover: true, tooltipDelay: 100, dragNodes: true },
    };

    if (networkRef.current) {
      networkRef.current.setData({ nodes, edges });
    } else {
      networkRef.current = new Network(containerRef.current, { nodes, edges }, options);
    }

    return () => {
      // Don't destroy on every re-render, only on full unmount. 
      // The dependency array might cause this to run. 
      // Actually, if we return a cleanup that destroys it, it will destroy it on every re-render!
    };
  }, [statusFilter, ports, shipments]);

  // Clean up only on unmount
  useEffect(() => {
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, []);

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
