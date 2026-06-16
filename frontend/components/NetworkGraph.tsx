"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { getLayoutedElements } from "@/utils/dagre-layout";

const nodeStyle = {
  background: "#0B1117",
  color: "#fff",
  border: "1px solid #1F2937",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "11px",
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

const rawNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "ROTTERDAM PORT (ORIGIN)" }, style: nodeStyle },
  { id: "2", position: { x: 0, y: 0 }, data: { label: "SINGAPORE HUB (DEST)" }, style: nodeStyle },
  { id: "3", position: { x: 0, y: 0 }, data: { label: "HAMBURG PORT (ORIGIN)" }, style: nodeStyle },
  { id: "4", position: { x: 0, y: 0 }, data: { label: "NEW YORK CUSTOMS (DEST)" }, style: nodeStyle },
  { id: "6", position: { x: 0, y: 0 }, data: { label: "SHANGHAI PORT (ORIGIN)" }, style: nodeStyle },
  { id: "7", position: { x: 0, y: 0 }, data: { label: "DUBAI FREEZONE (DEST)" }, style: nodeStyle },
  { id: "5", position: { x: 0, y: 0 }, data: { label: "GLOBAL COMPLIANCE CHECKPOINT" }, style: checkpointStyle },
];

const rawEdges = [
  {
    id: "e1-5", source: "1", target: "5", animated: true,
    style: { stroke: "#FBBF24", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#FBBF24" },
  },
  {
    id: "e5-2", source: "5", target: "2", animated: true, label: "SKU-9921-A (CUSTOMS HOLD)",
    style: { stroke: "#FBBF24", strokeWidth: 2, strokeDasharray: "5 5" },
    labelStyle: { fill: "#FBBF24", fontWeight: 700, fontFamily: "monospace", fontSize: 10 },
    labelBgStyle: { fill: "#030712", fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#FBBF24" },
  },
  {
    id: "e3-5", source: "3", target: "5", animated: true,
    style: { stroke: "#38BDF8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
  },
  {
    id: "e5-4", source: "5", target: "4", animated: true, label: "SKU-4412-B (CLEARED)",
    style: { stroke: "#38BDF8", strokeWidth: 2 },
    labelStyle: { fill: "#38BDF8", fontWeight: 700, fontFamily: "monospace", fontSize: 10 },
    labelBgStyle: { fill: "#030712", fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38BDF8" },
  },
  {
    id: "e6-5", source: "6", target: "5", animated: true, label: "SKU-7734-C (IN TRANSIT)",
    style: { stroke: "#818CF8", strokeWidth: 2 },
    labelStyle: { fill: "#818CF8", fontWeight: 700, fontFamily: "monospace", fontSize: 10 },
    labelBgStyle: { fill: "#030712", fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#818CF8" },
  },
  {
    id: "e5-7", source: "5", target: "7", animated: true, label: "OFAC REVIEW",
    style: { stroke: "#EF4444", strokeWidth: 2, strokeDasharray: "5 5" },
    labelStyle: { fill: "#EF4444", fontWeight: 700, fontFamily: "monospace", fontSize: 10 },
    labelBgStyle: { fill: "#030712", fillOpacity: 0.8 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
  },
];

// Apply dagre auto-layout (LR = left-to-right flow)
const { nodes: layoutedNodes } = getLayoutedElements(rawNodes, rawEdges, "LR");

export default function NetworkGraph({ statusFilter }: { statusFilter: string }) {
  const filteredEdges = useMemo(() => {
    return rawEdges.filter((edge) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "CUSTOMS_HOLD" && (edge.id === "e1-5" || edge.id === "e5-2")) return true;
      if (statusFilter === "CLEARED" && (edge.id === "e3-5" || edge.id === "e5-4")) return true;
      if (statusFilter === "IN_TRANSIT" && (edge.id === "e6-5")) return true;
      if (statusFilter === "OFAC_FLAGGED" && (edge.id === "e5-7")) return true;
      return false;
    });
  }, [statusFilter]);

  return (
    <div className="w-full h-full bg-[#030712]">
      <ReactFlow
        nodes={layoutedNodes}
        edges={filteredEdges}
        fitView
        className="dark"
        attributionPosition="bottom-left"
      >
        <Background color="#1F2937" gap={16} />
        <Controls style={{ backgroundColor: "#111827", border: "1px solid #1F2937", fill: "#fff" }} />
      </ReactFlow>
    </div>
  );
}
