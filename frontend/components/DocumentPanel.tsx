"use client";

import { useEffect, useState } from "react";
import { FileText, FileCheck, FileClock, FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TradeDocument, DocumentsResponse } from "@/types/api";

interface DocumentPanelProps {
  selectedSku: string;
  apiBase: string;
}

const DOC_ICONS: Record<string, React.ElementType> = {
  VERIFIED: FileCheck,
  PENDING: FileClock,
  MISSING: FileX,
};

const STATUS_VARIANT: Record<string, "verified" | "pending" | "missing"> = {
  VERIFIED: "verified",
  PENDING: "pending",
  MISSING: "missing",
};

export default function DocumentPanel({ selectedSku, apiBase }: DocumentPanelProps) {
  const [documents, setDocuments] = useState<TradeDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSku) return;
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/documents/${selectedSku}`);
        if (res.ok) {
          const json: DocumentsResponse = await res.json();
          setDocuments(json.data);
        }
      } catch {
        console.error("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [selectedSku, apiBase]);

  if (!selectedSku) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-[11px] font-mono">
        <FileText className="w-6 h-6 mb-2 opacity-40" />
        <p>Select a SKU to view documents</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 text-[11px] font-mono">
        <div className="w-3 h-3 rounded-full bg-[#38BDF8] animate-pulse mr-2" />
        Loading documents...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-3">
        Documents for <span className="text-white font-bold">{selectedSku}</span>
      </p>
      {documents.map((doc) => {
        const Icon = DOC_ICONS[doc.status] || FileText;
        return (
          <div
            key={doc.doc_type}
            className="bg-[#1F2937]/40 border border-[#1F2937] p-3 rounded-lg flex items-start gap-3 hover:border-[#38BDF8]/30 transition-colors"
          >
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              doc.status === "VERIFIED" ? "text-[#38BDF8]" :
              doc.status === "PENDING" ? "text-[#FBBF24]" :
              "text-[#EF4444]"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-bold text-[11px] truncate">{doc.doc_name}</span>
                <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
              </div>
              {doc.reference_number && (
                <p className="text-gray-400 text-[10px] mt-1 font-mono">Ref: {doc.reference_number}</p>
              )}
              {doc.issued_by && (
                <p className="text-gray-500 text-[10px] mt-0.5">Issued by: {doc.issued_by}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
