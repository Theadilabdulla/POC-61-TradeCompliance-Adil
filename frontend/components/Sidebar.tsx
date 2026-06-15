"use client";

type Props = {
  metrics: any;
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
};

export function Sidebar({ metrics, isOpen, onClose, statusFilter, setStatusFilter }: Props) {
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  return (
    <aside 
      className={`fixed top-20 right-4 h-[calc(100vh-100px)] w-[30%] min-w-[360px] glass rounded-2xl flex flex-col z-40 transform transition-all duration-300 ease-out shadow-2xl border border-[#1F2937] liquid-glow bg-[#0B1117]
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0 pointer-events-none"}
      `}
    >
      <div className="flex items-center justify-between px-5 pt-5 border-b border-[#1F2937] pb-3">
        <p className="text-[11px] tracking-widest text-[#38BDF8] font-bold uppercase">
          GOVERNANCE & TRUST RAIL
        </p>
        <button 
          onClick={onClose}
          className="w-6 h-6 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition flex items-center justify-center text-sm font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white mb-1">
            Trade Compliance Product Trace
          </h1>
          <p className="text-xs text-gray-400 mb-4">
            Cross-Border Logistics · Real-Time Screening
          </p>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Active Shipments" value={metrics?.total_shipments?.toLocaleString() || "0"} accent="cyan" />
            <MetricCard label="Flagged/Held" value={metrics?.flagged_shipments?.toLocaleString() || "0"} />
            <MetricCard label="Compliance Rate" value={`${metrics?.compliance_rate || 0}%`} />
            <MetricCard label="Value at Risk (USD)" value={`$${((metrics?.total_value_usd || 0) / 1000000).toFixed(1)}M`} />
          </div>
        </div>

        <div className="mb-6 border-t border-[#1F2937] pt-4">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">
            SECTION D — NETWORK FILTERS
          </p>
          <select 
            className="w-full bg-[#030712] border border-[#1F2937] text-white text-xs p-2 rounded focus:border-[#38BDF8] outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Network Traffic</option>
            <option value="Cleared">Cleared</option>
            <option value="In Transit">In Transit</option>
            <option value="Customs Hold">Customs Hold</option>
            <option value="OFAC Flagged">OFAC Flagged</option>
          </select>
        </div>

        <div className="mb-6 border-t border-[#1F2937] pt-4">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">
            SECTION B — WHY THIS MATTERS
          </p>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            Global trade operates on a delicate balance of speed and security. Tracking the exact geographic flow of SKUs while cross-referencing sanctions lists (like OFAC) in real-time ensures that trust rails keep pace with physical supply chains without causing multi-million dollar port bottlenecks.
          </p>
        </div>

        <div className="mb-6 border-t border-[#1F2937] pt-4">
          <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-3">
            SECTION C — WHO CONTROLS THE RAIL
          </p>
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            This rail is governed by a fragmented alliance of national customs agencies, international maritime organizations, and global intelligence databases that dictate border fluidity.
          </p>
        </div>

        <div className="border-t border-[#1F2937] pt-4 mt-auto">
          <a
            href={`${API}/api/shipments/csv`}
            target="_blank"
            className="block w-full font-mono text-[11px] bg-white/5 border border-[#1F2937] text-white px-3 py-3 rounded-lg text-center hover:bg-[#38BDF8]/20 hover:border-[#38BDF8] transition cursor-pointer"
          >
            DOWNLOAD SAMPLE DATA
          </a>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: "cyan" }) {
  return (
    <div className="bg-[#030712] border border-[#1F2937] rounded-xl p-3">
      <p className={`text-sm font-bold ${accent === "cyan" ? "text-[#38BDF8]" : "text-white"}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-1 uppercase">
        {label}
      </p>
    </div>
  );
}