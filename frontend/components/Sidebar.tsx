"use client";

import { AlertTriangle, ShieldCheck, Download, FileText, Globe, Bell } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import DocumentPanel from "@/components/DocumentPanel";
import AlertsFeed from "@/components/AlertsFeed";
import RiskChart from "@/components/RiskChart";
import type { NetworkMetrics } from "@/types/api";

interface SidebarProps {
  metrics: NetworkMetrics | null;
  isOpen: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedSku: string;
  setSelectedSku: (sku: string) => void;
  apiBase: string;
  alertCount: number;
}

export function Sidebar({
  metrics,
  isOpen,
  statusFilter,
  setStatusFilter,
  selectedSku,
  setSelectedSku,
  apiBase,
  alertCount,
}: SidebarProps) {
  const downloadSampleData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(metrics || {}, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "trade_compliance_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  /** Format numeric value-at-risk as display string, e.g. 18.4 → "$18.4M" */
  const formatVAR = (val: number): string => `$${val.toFixed(1)}M`;

  return (
    <TooltipProvider>
      <aside className="w-full h-full bg-[#0B1117] p-6 overflow-y-auto font-mono flex flex-col justify-between text-xs border-l border-[#1F2937] z-30 shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="text-white font-bold tracking-wider uppercase text-sm">
                GOVERNANCE RAIL
              </h2>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl mb-6">
            <label className="text-gray-400 block mb-2 uppercase tracking-tight text-[10px]">
              Filter Network State:
            </label>
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

          {/* TABBED CONTENT */}
          <Tabs defaultValue="metrics" className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="metrics" className="flex-1">Metrics</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">
                <FileText className="w-3 h-3 mr-1" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1 relative">
                <Bell className="w-3 h-3 mr-1" />
                Alerts
                {alertCount > 0 && (
                  <span className="ml-1 bg-[#EF4444] text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                    {alertCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Metrics Tab ── */}
            <TabsContent value="metrics">
              {/* D3 Risk Chart */}
              <div className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl mb-4">
                <RiskChart metrics={metrics} />
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl cursor-help">
                      <p className="text-gray-400 text-[10px] uppercase">Active Traces</p>
                      <p className="text-lg font-bold text-white mt-1">
                        {metrics ? metrics.total_shipments.toLocaleString() : "..."}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total active shipment traces in the filtered network</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl cursor-help">
                      <p className="text-gray-400 text-[10px] uppercase">Value At Risk</p>
                      <p className="text-lg font-bold text-[#F43F5E] mt-1">
                        {metrics ? formatVAR(metrics.value_at_risk) : "..."}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Aggregate USD value of shipments currently at risk in this filter</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* SKU CARDS */}
              <div className="mb-4">
                <h3 className="text-gray-400 font-bold mb-3 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#38BDF8]" /> SKU Checkpoints
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedSku("SKU-9921-A")}
                    className={`w-full text-left bg-[#1F2937]/40 border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                      selectedSku === "SKU-9921-A" ? "border-[#FBBF24]/50" : "border-[#1F2937] hover:border-[#1F2937]/80"
                    }`}
                  >
                    <div className="flex justify-between text-white font-bold text-[11px]">
                      <span>SKU-9921-A</span>
                      <span className="text-[#FBBF24]">CUSTOMS HOLD</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">Origin: Rotterdam | Dest: Singapore</p>
                  </button>
                  <button
                    onClick={() => setSelectedSku("SKU-4412-B")}
                    className={`w-full text-left bg-[#1F2937]/40 border p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                      selectedSku === "SKU-4412-B" ? "border-[#38BDF8]/50" : "border-[#1F2937] hover:border-[#1F2937]/80"
                    }`}
                  >
                    <div className="flex justify-between text-white font-bold text-[11px]">
                      <span>SKU-4412-B</span>
                      <span className="text-[#38BDF8]">CLEARED</span>
                    </div>
                    <p className="text-gray-400 text-[10px]">Origin: Hamburg | Dest: New York</p>
                  </button>
                </div>
              </div>

              {/* CONTEXT PANELS */}
              <div className="space-y-4 border-t border-[#1F2937] pt-4">
                <div>
                  <h3 className="text-[#38BDF8] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Why This Matters
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Global customs evasion accounts for billions in lost revenue. Mapping
                    cross-border flows against active parameters enables instantaneous
                    node-level validation.
                  </p>
                </div>
                <div>
                  <h3 className="text-[#38BDF8] uppercase tracking-wider text-[10px] mb-1 font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Who Controls the Rail
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Governed by inter-governmental customs alliances and sovereign port
                    authorities processing international trade manifests.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ── Documents Tab ── */}
            <TabsContent value="documents">
              <DocumentPanel selectedSku={selectedSku} apiBase={apiBase} />
            </TabsContent>

            {/* ── Alerts Tab ── */}
            <TabsContent value="alerts">
              <AlertsFeed apiBase={apiBase} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="pt-4 mt-4 border-t border-[#1F2937]">
          <button
            onClick={downloadSampleData}
            className="w-full bg-[#111827] border border-[#38BDF8]/40 hover:border-[#38BDF8] text-[#38BDF8] py-2 rounded-xl flex items-center justify-center gap-2 transition-all font-bold tracking-wider text-[11px]"
          >
            <Download className="w-3 h-3" /> DOWNLOAD DATA
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
