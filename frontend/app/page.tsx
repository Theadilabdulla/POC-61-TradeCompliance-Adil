"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";

function Topbar({ stationCount, isLoading }: any) {
  return (
    <header className="w-full h-16 border-b border-[#1F2937] flex items-center justify-between px-6 bg-[#0B1117] z-40 relative shadow-md">
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

const NetworkGraph = dynamic(() => import("@/components/NetworkGraph"), { ssr: false });

export default function Page() {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API}/api/metrics?status=${statusFilter}`);
        if (res.ok) {
          const data = await res.json();
          setBackendMetrics(data);
        }
      } catch (e) {
        console.error("Metrics failed to load, using fallbacks.", e);
      }
    };
    fetchMetrics();
  }, [API, statusFilter]);

  return (
    <div className="w-screen h-screen bg-[#030712] text-[#F1F5F9] flex flex-col overflow-hidden">
      <Topbar stationCount={backendMetrics?.total_shipments || 800} isLoading={!backendMetrics} />
      
      <div className="flex flex-1 w-full h-[calc(100vh-4rem)] relative">
        <div className="flex-1 h-full z-10 bg-black">
          <NetworkGraph statusFilter={statusFilter} />
        </div>

        <div className="w-96 h-full z-20 relative bg-[#0B1117]">
          <Sidebar 
            metrics={backendMetrics} 
            isOpen={true} 
            statusFilter={statusFilter} 
            setStatusFilter={setStatusFilter} 
          />
        </div>
      </div>
    </div>
  );
}
