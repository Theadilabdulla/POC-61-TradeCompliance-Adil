"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Shipment } from "@/types/api";

interface StatusChartProps {
  shipments: Shipment[];
}

const STATUS_COLORS: Record<string, string> = {
  CLEARED: "#38BDF8",
  IN_TRANSIT: "#818CF8",
  CUSTOMS_HOLD: "#FBBF24",
  OFAC_FLAGGED: "#EF4444",
};

export default function StatusChart({ shipments }: StatusChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || shipments.length === 0) return;

    // Aggregate counts
    const counts = {
      CLEARED: 0,
      IN_TRANSIT: 0,
      CUSTOMS_HOLD: 0,
      OFAC_FLAGGED: 0,
    };
    shipments.forEach((s) => {
      if (counts[s.status as keyof typeof counts] !== undefined) {
        counts[s.status as keyof typeof counts]++;
      }
    });

    const data = Object.entries(counts).map(([status, count]) => ({ status, count }));

    // Dimensions
    const width = 240;
    const height = 120;
    const radius = Math.min(width, height) / 2;

    // Clear old chart
    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<{ status: string; count: number }>()
      .value((d) => d.count)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ status: string; count: number }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.9);

    const arcs = svg.selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => STATUS_COLORS[d.data.status])
      .attr("stroke", "#0B1117")
      .style("stroke-width", "2px")
      .style("opacity", 0.9);

    // Hover effect
    arcs.on("mouseover", function() {
      d3.select(this).style("opacity", 1).style("stroke", "#fff");
    })
    .on("mouseout", function() {
      d3.select(this).style("opacity", 0.9).style("stroke", "#0B1117");
    });

    // Center text
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "#F1F5F9")
      .style("font-size", "12px")
      .style("font-family", "monospace")
      .style("font-weight", "bold")
      .text(shipments.length);

  }, [shipments]);

  return (
    <div className="w-full flex items-center justify-center p-2">
      <div ref={chartRef} />
    </div>
  );
}
