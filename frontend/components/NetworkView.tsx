"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";

interface NetworkViewProps {
  statusFilter: string;
}

const ALL_NODES = [
  { id: 1, label: "ROTTERDAM\nPORT", group: "origin", title: "Origin Port · Netherlands · Risk: LOW" },
  { id: 2, label: "SINGAPORE\nHUB", group: "destination", title: "Destination Hub · Singapore · Risk: MEDIUM" },
  { id: 3, label: "HAMBURG\nPORT", group: "origin", title: "Origin Port · Germany · Risk: LOW" },
  { id: 4, label: "NEW YORK\nCUSTOMS", group: "destination", title: "Destination · USA · Risk: LOW" },
  { id: 5, label: "COMPLIANCE\nCHECKPOINT", group: "checkpoint", title: "Global Compliance Checkpoint · Risk: HIGH" },
  { id: 6, label: "SHANGHAI\nPORT", group: "origin", title: "Origin Port · China · Risk: MEDIUM" },
  { id: 7, label: "DUBAI\nFREEZONE", group: "destination", title: "Free Trade Zone · UAE · Risk: HIGH" },
];

const ALL_EDGES = [
  { id: "e1", from: 1, to: 5, label: "SKU-9921-A", color: { color: "#FBBF24", highlight: "#FBBF24" }, dashes: true, group: "CUSTOMS_HOLD" },
  { id: "e2", from: 5, to: 2, label: "CUSTOMS HOLD", color: { color: "#FBBF24", highlight: "#FBBF24" }, dashes: true, group: "CUSTOMS_HOLD" },
  { id: "e3", from: 3, to: 5, label: "SKU-4412-B", color: { color: "#38BDF8", highlight: "#38BDF8" }, group: "CLEARED" },
  { id: "e4", from: 5, to: 4, label: "CLEARED", color: { color: "#38BDF8", highlight: "#38BDF8" }, group: "CLEARED" },
  { id: "e5", from: 6, to: 5, label: "SKU-7734-C", color: { color: "#818CF8", highlight: "#818CF8" }, group: "IN_TRANSIT" },
  { id: "e6", from: 5, to: 7, label: "OFAC REVIEW", color: { color: "#EF4444", highlight: "#EF4444" }, dashes: [5, 5], group: "OFAC_FLAGGED" },
];

export default function NetworkView({ statusFilter }: NetworkViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const filteredEdges = ALL_EDGES.filter(
      (e) => statusFilter === "ALL" || e.group === statusFilter
    );

    const nodes = new DataSet(ALL_NODES);
    const edges = new DataSet(filteredEdges);

    const options = {
      nodes: {
        shape: "box",
        font: {
          face: "monospace",
          size: 10,
          color: "#F1F5F9",
          multi: true,
        },
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
        width: 2,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        font: { face: "monospace", size: 8, color: "#6B7280", strokeWidth: 0 },
        smooth: { enabled: true, type: "curvedCW", roundness: 0.15 },
      },
      groups: {
        origin: { color: { background: "#0B1117", border: "#38BDF8" } },
        destination: { color: { background: "#0B1117", border: "#818CF8" } },
        checkpoint: { color: { background: "#111827", border: "#38BDF8" }, borderWidth: 1, shapeProperties: { borderDashes: [4, 4] } },
      },
      physics: {
        solver: "forceAtlas2Based",
        forceAtlas2Based: { gravitationalConstant: -60, springLength: 150, damping: 0.5 },
        stabilization: { iterations: 100 },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
      },
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
  }, [statusFilter]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full bg-[#030712]" />
      <div className="absolute bottom-3 left-3 bg-[#0B1117]/80 backdrop-blur-md border border-[#1F2937] px-3 py-1.5 rounded-md">
        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">
          vis-network · physics simulation
        </span>
      </div>
    </div>
  );
}
