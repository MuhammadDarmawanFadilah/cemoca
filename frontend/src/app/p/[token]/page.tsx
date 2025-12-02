"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pdfReportAPI } from "@/lib/api";

interface PdfData {
  name: string;
  pdfUrl: string;
  pdfFilename: string;
  error?: string;
}

export default function PdfViewPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pdfReportAPI.getPdfByToken(token);
      
      if (data.error) {
        setError(data.error);
        setPdfData(null);
      } else {
        setPdfData(data);
      }
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Gagal memuat PDF. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPdf();
    }
  }, [token]);

  // Loading state - minimal fullscreen
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Memuat dokumen...</p>
        </div>
      </div>
    );
  }

  // Error state - minimal
  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-lg font-medium mb-1 text-gray-800">Dokumen Tidak Tersedia</h1>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button 
            onClick={loadPdf}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // PDF ready - 100% fullscreen iframe tanpa header
  if (pdfData?.pdfUrl) {
    return (
      <iframe
        src={pdfData.pdfUrl}
        className="fixed inset-0 w-full h-full border-0"
        title={`PDF - ${pdfData.name}`}
        style={{ margin: 0, padding: 0 }}
      />
    );
  }

  // Fallback - dokumen belum tersedia
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 className="text-lg font-medium mb-1 text-gray-800">Dokumen Belum Tersedia</h1>
        <p className="text-sm text-gray-500 mb-4">Dokumen sedang diproses. Silakan coba lagi.</p>
        <button 
          onClick={loadPdf}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
