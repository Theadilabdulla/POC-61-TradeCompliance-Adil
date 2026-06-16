"use client";

import { AlertTriangle, ShieldCheck, Download, FileText, Globe } from "lucide-react";

export function Sidebar({ metrics, isOpen, statusFilter, setStatusFilter }: any) {
  
  const downloadSampleData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics || {}, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "trade_compliance_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full h-full bg-[#0B1117] p-6 overflow-y-auto font-mono flex flex-col justify-between text-xs border-l border-[#1F2937] z-30 shadow-2xl">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-white font-bold tracking-wider uppercase text-sm">GOVERNANCE RAIL</h2>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl mb-6">
          <label className="text-gray-400 block mb-2 uppercase tracking-tight text-[10px]">Filter Network State:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#030712] border border-[#1F2937] text-white p-2 rounded-md outline-none focus:border-[#38BDF8] transition-colors cursor-pointer"
          >
            <option value="ALL">ALL TRAFFIC</option>
            <option value="IN_TRANSIT">IN TRANSIT</option>
            <option value="CUSTOMS_HOLD">CUSTOMS HOLD</option>
            <option value="OFAC_FLAGGED">OFAC FLAGGED / HIGH RISK</option>
            <option value="CLEARED">CLEARED TRAFFIC</option>
          </select>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl">
            <p className="text-gray-400 text-[10px] uppercase">Active Traces</p>
            <p className="text-lg font-bold text-white mt-1">{metrics?.total_shipments || "..."}</p>
          </div>
          <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl">
            <p className="text-gray-400 text-[10px] uppercase">Value At Risk</p>
            <p className="text-lg font-bold text-[#F43F5E] mt-1">{metrics?.value_at_risk || "..."}</p>
          </div>
        </div>

        {/* SKU CARDS */}
        <div className="mb-6">
          <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <FileText className="w-3 h-3 text-[#38BDF8]" /> SKU Checkpoints
          </h3>
          <div className="space-y-2">
            <div className="bg-[#1F2937]/40 border border-[#1F2937] p-3 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between text-white font-bold text-[11px]">
                <span>SKU-9921-A</span>
                <span className="text-[#FBBF24]">CUSTOMS HOLD</span>
              </div>
              <p className="text-gray-400 text-[10px]">Origin: Rotterdam | Dest: Singapore</p>
            </div>
            <div className="bg-[#1F2937]/40 border border-[#1F2937] p-3 rounded-lg flex flex-col gap-1">
              <div className="flex justify-between text-white font-bold text-[11px]">
                <span>SKU-4412-B</span>
                <span className="text-[#38BDF8]">CLEARED</span>
              </div>
              <p className="text-gray-400 text-[10px]">Origin: Hamburg | Dest: New York</p>
            </div>
          </div>
        </div>

        {/* CONTEXT PANELS */}
        <div className="space-y-4 border-t border-[#1F2937] pt-4">
          <div>
            <h3 className="text-[#38BDF8] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Why This Matters
            </h3>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Global customs evasion accounts for billions in lost revenue. Mapping cross-border flows against active parameters enables instantaneous node-level validation.
            </p>
          </div>
          <div>
            <h3 className="text-[#38BDF8] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
              <Globe className="w-3 h-3" /> Who Controls the Rail
            </h3>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Governed by inter-governmental customs alliances and sovereign port authorities processing international trade manifests.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-[#1F2937]">
        <button onClick={downloadSampleData} className="w-full bg-[#111827] border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[#38BDF8] py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-bold tracking-wider text-[11px]">
          <Download className="w-3 h-3" /> DOWNLOAD DATA
        </button>
      </div>
    </aside>
  );
}
