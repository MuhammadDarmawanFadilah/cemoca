import { VideoReportResponse, ExcelValidationResult, VideoAvatarOption } from "@/lib/api";

export type ViewMode = "history" | "generate";
export type Step = 1 | 2 | 3;

export interface LearningVideoState {
  viewMode: ViewMode;
  step: Step;
  loading: boolean;
  // History
  reportHistory: VideoReportResponse[];
  historyLoading: boolean;
  historyPage: number;
  historyTotalPages: number;
  // Step 1
  reportName: string;
  learningVideoCode: string;
  learningVideoLanguage: string;
  messageTemplate: string;
  waMessageTemplate: string;
  selectedFile: File | null;
  presenters: VideoAvatarOption[];
  loadingPresenters: boolean;
  avatarPage: number;
  avatarSearch: string;
  // Step 2
  validationResult: ExcelValidationResult | null;
  validating: boolean;
  previewPage: number;
  previewFilter: "all" | "valid" | "error";
  previewSearch: string;
  // Report
  currentReport: VideoReportResponse | null;
  generating: boolean;
  previewVideo: string | null;
  itemsPage: number;
  itemsFilter: "all" | "done" | "processing" | "failed";
  itemsSearch: string;
  // Step 3 - WA Blast
  waBlasting: boolean;
  waItemsPage: number;
  waItemsFilter: "all" | "sent" | "pending" | "failed";
  waItemsSearch: string;
  previewWaMessage: { phone: string; message: string; name: string } | null;
}

export const AVATARS_PER_PAGE = 12;
export const PREVIEW_PER_PAGE = 50;
export const ITEMS_PER_PAGE = 50;
