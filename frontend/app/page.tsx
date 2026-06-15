"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";

function Topbar({ stationCount, dataSource, isLoading }: any) {
  return (
    <header className="absolute top-0 left-0 w-full h-16 glass border-b border-[#1F2937] flex items-center justify-between px-6 z-30 bg-[#0B1117]/90">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse shadow-[0_0_10px_#38BDF8]" />
        <h1 className="text-white font-mono font-bold tracking-widest text-sm uppercase">
          GLOBAL TRADE MONITOR
        </h1>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
        <p>NETWORK: <span className="text-[#38BDF8]">SECURE</span></p>
        <p>NODES: <span className="text-white">{isLoading ? "SYNCING..." : stationCount}</span></p>
      </div>
    </header>
  );
}

const MapStage = dynamic(() => import("@/components/MapStage"), { ssr: false });

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API}/api/metrics`);
        const data = await res.json();
        setBackendMetrics(data);
      } catch (e) {
        console.error("Metrics failed to load", e);
      }
    };
    fetchMetrics();
  }, [API]);

  return (
    <div className="w-screen h-screen bg-[#030712] text-[#F1F5F9] relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 w-full h-full z-0">
        <MapStage statusFilter={statusFilter} />
      </div>
      <Topbar stationCount={backendMetrics?.total_shipments || 0} dataSource="Synthetic / UN Comtrade" isLoading={!backendMetrics} />
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-20 right-4 glass px-4 py-2 rounded-xl text-xs font-mono text-[#38BDF8] border border-[#1F2937] hover:bg-[#1F2937] transition-all cursor-pointer z-30 tracking-widest font-bold bg-[#0B1117]">
          INTELLIGENCE PANEL ▲
        </button>
      )}
      <Sidebar metrics={backendMetrics} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
    </div>
  );
}