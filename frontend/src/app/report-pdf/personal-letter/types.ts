import { PdfReportResponse, PdfExcelValidationResult } from "@/lib/api";

export type ViewMode = "history" | "generate";
export type Step = 1 | 2;

export interface PdfPersonalLetterState {
  viewMode: ViewMode;
  step: Step;
  loading: boolean;
  // History
  reportHistory: PdfReportResponse[];
  historyLoading: boolean;
  historyPage: number;
  historyTotalPages: number;
  // Step 1
  reportName: string;
  messageTemplate: string;
  waMessageTemplate: string;
  selectedFile: File | null;
  // Step 2
  validationResult: PdfExcelValidationResult | null;
  validating: boolean;
  previewPage: number;
  previewFilter: "all" | "valid" | "error";
  previewSearch: string;
  // Report
  currentReport: PdfReportResponse | null;
  generating: boolean;
  itemsPage: number;
  itemsFilter: "all" | "done" | "processing" | "failed";
  itemsSearch: string;
  // WA Blast
  waBlasting: boolean;
  waItemsPage: number;
  waItemsFilter: "all" | "sent" | "pending" | "failed";
  waItemsSearch: string;
}

export const PREVIEW_PER_PAGE = 50;
export const ITEMS_PER_PAGE = 50;
