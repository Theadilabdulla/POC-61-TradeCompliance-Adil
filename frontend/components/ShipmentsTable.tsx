"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Shipment } from "@/types/api";
import { ArrowUpDown, Search } from "lucide-react";

interface ShipmentsTableProps {
  shipments: Shipment[];
  isLoading: boolean;
}

const columnHelper = createColumnHelper<Shipment>();

const STATUS_VARIANT: Record<string, "cleared" | "in_transit" | "customs_hold" | "ofac_flagged"> = {
  CLEARED: "cleared",
  IN_TRANSIT: "in_transit",
  CUSTOMS_HOLD: "customs_hold",
  OFAC_FLAGGED: "ofac_flagged",
};

export default function ShipmentsTable({ shipments, isLoading }: ShipmentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      columnHelper.accessor("sku_id", {
        header: "SKU",
        cell: (info) => (
          <span className="text-white font-bold">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("hs_code", {
        header: "HS Code",
        cell: (info) => (
          <span className="text-gray-400 font-mono">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("origin_port", {
        header: "Origin",
        cell: (info) => (
          <span>
            {info.getValue()}{" "}
            <span className="text-gray-500">({info.row.original.origin_country})</span>
          </span>
        ),
      }),
      columnHelper.accessor("destination_port", {
        header: "Destination",
        cell: (info) => (
          <span>
            {info.getValue()}{" "}
            <span className="text-gray-500">({info.row.original.destination_country})</span>
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <Badge variant={STATUS_VARIANT[info.getValue()] || "default"}>
            {info.getValue().replace("_", " ")}
          </Badge>
        ),
      }),
      columnHelper.accessor("value_usd", {
        header: "Value (USD)",
        cell: (info) => (
          <span className="text-white font-mono">
            ${info.getValue().toLocaleString()}
          </span>
        ),
      }),
      columnHelper.accessor("carrier", {
        header: "Carrier",
      }),
    ],
    []
  );

  const table = useReactTable({
    data: shipments,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full font-mono text-xs">
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            placeholder="Search SKU, port, carrier..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full bg-[#030712] border border-[#1F2937] text-white pl-8 pr-3 py-2 rounded-md outline-none focus:border-[#38BDF8] transition-colors text-[11px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1F2937] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-[#111827] border-b border-[#1F2937]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="text-left text-[10px] uppercase tracking-wider text-gray-400 px-3 py-2.5 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse" />
                    Loading shipments...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No shipments found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.slice(0, 100).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/20 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-500 mt-2 text-right flex justify-between">
        <span>{table.getFilteredRowModel().rows.length > 100 ? "Showing top 100 visible traces (Truncated for performance)" : ""}</span>
        <span>
          {table.getFilteredRowModel().rows.length} shipment{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          {" · "}Schema: UN Comtrade HS6
        </span>
      </p>
    </div>
  );
}
