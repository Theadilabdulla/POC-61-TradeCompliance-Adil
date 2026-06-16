"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import ShipmentsTable from "@/components/ShipmentsTable";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Layers, Zap } from "lucide-react";
import type { MetricsResponse, Shipment, AlertsResponse } from "@/types/api";

// ── Typed inline Topbar (visual layout untouched) ──────────────────────

interface TopbarProps {
  stationCount: number;
  isLoading: boolean;
}

function Topbar({ stationCount, isLoading }: TopbarProps) {
  return (
    <header className="w-full h-16 border-b border-[#1F2937] flex items-center justify-between px-6 bg-[#0B1117] z-40 relative shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_10px_#38BDF8]" />
        <h1 className="text-white font-mono font-bold tracking-widest text-sm uppercase">
          TRADE COMPLIANCE PRODUCT TRACE
        </h1>
        <Badge variant="warning" className="ml-2">SYNTHETIC DATA</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
        <p>NETWORK: <span className="text-[#38BDF8]">SECURE</span></p>
        <p>NODES: <span className="text-white">{isLoading ? "SYNCING..." : stationCount}</span></p>
      </div>
    </header>
  );
}

// ── Dynamic imports (SSR disabled) ─────────────────────────────────────

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), { ssr: false });
const NetworkView = dynamic(() => import("@/components/NetworkView"), { ssr: false });

// ── Page Component ─────────────────────────────────────────────────────

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  // ── State ─────────────────────────────────────────────────────────────
  const [backendMetrics, setBackendMetrics] = useState<MetricsResponse | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSku, setSelectedSku] = useState("SKU-9921-A");
  const [isLoading, setIsLoading] = useState(true);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<"reactflow" | "visnetwork">("reactflow");
  const [showTable, setShowTable] = useState(false);

  // ── Fetch ports ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const res = await fetch(`${API}/api/ports`);
        if (res.ok) {
          const json = await res.json();
          setPorts(json.data);
        }
      } catch (e) {
        console.error("Ports fetch failed:", e);
      }
    };
    fetchPorts();
  }, [API]);

  // ── Fetch metrics ─────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        setError(null);
        const res = await fetch(`${API}/api/metrics?status=${statusFilter}`);
        if (!res.ok) throw new Error(`API responded with status ${res.status}`);
        const json: MetricsResponse = await res.json();
        if (isMounted) setBackendMetrics(json);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to connect to backend";
        if (isMounted) setError(message);
        console.error("Metrics fetch failed:", e);
      } finally {
        if (isMounted && showLoading) setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics(true);

    // Poll every 3 seconds for live jitter data
    const intervalId = setInterval(() => fetchMetrics(false), 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [API, statusFilter]);

  // ── Fetch shipments ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setShipmentsLoading(true);
        const res = await fetch(`${API}/api/shipments?status=${statusFilter}`);
        if (res.ok) {
          const json = await res.json();
          setShipments(json.data);
          if (json.data.length > 0 && selectedSku === "SKU-9921-A") {
            setSelectedSku(json.data[0].sku_id);
          }
        }
      } catch {
        console.error("Shipments fetch failed");
      } finally {
        setShipmentsLoading(false);
      }
    };
    fetchShipments();
  }, [API, statusFilter]);

  // ── Fetch alert count ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API}/api/alerts`);
        if (res.ok) {
          const json: AlertsResponse = await res.json();
          setAlertCount(json.total);
        }
      } catch {
        // Silently fail — alert count is non-critical
      }
    };
    fetchAlerts();
  }, [API]);

  // ── Derived values ────────────────────────────────────────────────────
  const metrics = backendMetrics?.data ?? null;
  const stationCount = metrics?.active_nodes ?? 0;

  return (
    <div className="w-screen h-screen bg-[#030712] text-[#F1F5F9] flex flex-col overflow-hidden">
      <Topbar stationCount={stationCount} isLoading={isLoading} />

      <div className="flex flex-1 w-full relative overflow-hidden">
        {/* ── Main Graph Area ── */}
        <div className="flex-1 h-full z-10 bg-black flex flex-col">
          {/* Graph toggle */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-[#0B1117]/80 backdrop-blur-md border border-[#1F2937] rounded-lg p-1">
            <button
              onClick={() => setGraphMode("reactflow")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                graphMode === "reactflow"
                  ? "bg-[#030712] text-[#38BDF8] border border-[#38BDF8]/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" />
              React Flow
            </button>
            <button
              onClick={() => setGraphMode("visnetwork")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                graphMode === "visnetwork"
                  ? "bg-[#030712] text-[#38BDF8] border border-[#38BDF8]/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Zap className="w-3 h-3" />
              vis-network
            </button>
          </div>

          {/* Graph view */}
          <div className="flex-1">
            {graphMode === "reactflow" ? (
              <NetworkGraph statusFilter={statusFilter} ports={ports} shipments={shipments} />
            ) : (
              <NetworkView statusFilter={statusFilter} ports={ports} shipments={shipments} />
            )}
          </div>

          {/* ── Collapsible Table Panel ── */}
          <div
            className={`border-t border-[#1F2937] bg-[#0B1117] transition-all duration-300 ${
              showTable ? "h-[280px]" : "h-10"
            }`}
          >
            <button
              onClick={() => setShowTable(!showTable)}
              className="w-full h-10 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors border-b border-[#1F2937]"
            >
              {showTable ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              Shipments Table ({shipments.length} records · UN Comtrade HS6)
            </button>
            {showTable && (
              <div className="p-4 h-[240px] overflow-auto">
                <ShipmentsTable shipments={shipments} isLoading={shipmentsLoading} />
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-96 h-full z-20 relative bg-[#0B1117] flex-shrink-0">
          <Sidebar
            metrics={metrics}
            isOpen={true}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedSku={selectedSku}
            setSelectedSku={setSelectedSku}
            apiBase={API}
            alertCount={alertCount}
          />
        </div>
      </div>
    </div>
  );
}
