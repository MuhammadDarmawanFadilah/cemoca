import { apiCall } from "@/lib/api";

export type LearningModulePowerPointDuration = "D1" | "D2" | "D3";

export type LearningModulePowerPointShareScope = "GENERAL" | "COMPANY_ONLY";

export type LearningModuleAudience =
  | "GENERAL"
  | "TOP_LEADER"
  | "LEADER"
  | "TOP_AGENT"
  | "AGENT"
  | "NEW_LEADER"
  | "NEW_AGENT";

export type LearningModuleContentType =
  | "GENERAL"
  | "LEADERSHIP"
  | "MOTIVATION_COACH"
  | "PERSONAL_SALES"
  | "RECRUITMENT"
  | "PRODUCT"
  | "LEGAL_COMPLIANCE"
  | "OPERATION";

export interface LearningModulePowerPointRequest {
  title: string;
  duration: LearningModulePowerPointDuration;
  shareScope: LearningModulePowerPointShareScope;
  intendedAudience: LearningModuleAudience[];
  contentTypes: LearningModuleContentType[];
  powerPointFilename?: string | null;
  powerPointUrl?: string | null;
  createdByCompanyName?: string | null;
}

export interface LearningModulePowerPointResponse {
  id: number;
  code: string;
  title: string;
  duration: LearningModulePowerPointDuration;
  shareScope?: LearningModulePowerPointShareScope | null;
  createdByCompanyName?: string | null;
  createdBy?: string | null;
  canEdit?: boolean | null;
  intendedAudience: LearningModuleAudience[];
  contentTypes: LearningModuleContentType[];
  powerPointFilename?: string | null;
  powerPointUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const BASE = "/learning-module/power-points";

export const learningModulePowerPointApi = {
  list: (params: {
    page: number;
    size: number;
    sortBy?: string;
    direction?: "asc" | "desc";
    companyName?: string;
    title?: string;
    duration?: string;
    creator?: string;
    audience?: string[];
    contentType?: string[];
  }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
      sortBy: params.sortBy ?? "createdAt",
      direction: params.direction ?? "desc",
    });
    if (params.companyName) qs.set("companyName", params.companyName);
    if (params.title) qs.set("title", params.title);
    if (params.duration) qs.set("duration", params.duration);
    if (params.creator) qs.set("creator", params.creator);
    if (params.audience && params.audience.length > 0) qs.set("audience", params.audience.join(","));
    if (params.contentType && params.contentType.length > 0) qs.set("contentType", params.contentType.join(","));
    return apiCall<PageResponse<LearningModulePowerPointResponse>>(`${BASE}?${qs.toString()}`);
  },

  getById: (id: number, params?: { companyName?: string }) => {
    const qs = new URLSearchParams();
    if (params?.companyName) qs.set("companyName", params.companyName);
    const url = qs.toString() ? `${BASE}/${id}?${qs.toString()}` : `${BASE}/${id}`;
    return apiCall<LearningModulePowerPointResponse>(url);
  },

  create: (payload: LearningModulePowerPointRequest) =>
    apiCall<LearningModulePowerPointResponse>(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: LearningModulePowerPointRequest, params?: { companyName?: string }) => {
    const qs = new URLSearchParams();
    if (params?.companyName) qs.set("companyName", params.companyName);
    const url = qs.toString() ? `${BASE}/${id}?${qs.toString()}` : `${BASE}/${id}`;
    return apiCall<LearningModulePowerPointResponse>(url, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  remove: (id: number, params?: { companyName?: string }) => {
    const qs = new URLSearchParams();
    if (params?.companyName) qs.set("companyName", params.companyName);
    const url = qs.toString() ? `${BASE}/${id}?${qs.toString()}` : `${BASE}/${id}`;
    return apiCall<void>(url, {
      method: "DELETE",
    });
  },
};
