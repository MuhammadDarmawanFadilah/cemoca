import { apiCall } from "@/lib/api";

export type LearningVideoLanguage = {
  code: string;
  name: string;
};

export type GeminiReviewResponse = {
  clarity: string;
  motivationalImpact: string;
  recommendationForAgency: string;
  suggestions: string;
  model: string;
  raw: string;
};

export type LearningVideoBundle = {
  id: number;
  code: string;
  sourceLanguageCode: string;
  sourceText: string;
  review?: GeminiReviewResponse | null;
  translations: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type LearningVideoListResponse = {
  content: LearningVideoBundle[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type LearningVideoEditHistory = {
  id: number;
  learningVideoId: number;
  editedBy?: string | null;
  editedByPhone?: string | null;
  editType: string;
  changes: string;
  editedAt: string;
};

export const learningVideoApi = {
  review: async (payload: { text: string; inputLanguageCode?: string; inputLanguageName?: string }) => {
    return apiCall<GeminiReviewResponse>("/learning-videos/review", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  translateAll: async (payload: {
    text: string;
    sourceLanguageCode?: string;
    targets: LearningVideoLanguage[];
  }) => {
    return apiCall<{ translations: Record<string, string> }>("/learning-videos/translate-all", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  create: async (payload: {
    sourceLanguageCode: string;
    sourceText: string;
    translations: Record<string, string>;
    review?: GeminiReviewResponse | null;
  }) => {
    return apiCall<{ id: number; code: string }>("/learning-videos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getByCode: async (code: string) => {
    return apiCall<LearningVideoBundle>(`/learning-videos/${encodeURIComponent(code)}`);
  },

  startPreview: async (payload: { code: string; languageCode: string }) => {
    return apiCall<{ success: boolean; videoId: string | null; status: string | null; error: string | null }>(
      "/learning-videos/preview",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  getPreviewStatus: async (videoId: string) => {
    return apiCall<{ success: boolean; videoId: string; status: string | null; videoUrl: string | null; error: string | null }>(
      `/learning-videos/preview/${encodeURIComponent(videoId)}`
    );
  },

  list: async (params?: { page?: number; size?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());
    if (params?.search) queryParams.append("search", params.search);
    
    const query = queryParams.toString();
    return apiCall<LearningVideoListResponse>(`/learning-videos${query ? `?${query}` : ""}`);
  },

  getById: async (id: number) => {
    return apiCall<LearningVideoBundle>(`/learning-videos/id/${id}`);
  },

  update: async (id: number, payload: {
    sourceLanguageCode: string;
    sourceText: string;
    translations: Record<string, string>;
    review?: GeminiReviewResponse | null;
  }) => {
    return apiCall<{ success: boolean }>(`/learning-videos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: number) => {
    return apiCall<{ success: boolean }>(`/learning-videos/${id}`, {
      method: "DELETE",
    });
  },
  
  requestEdit: async (id: number, payload: { phoneNumber: string; languageCodes: string[] }) => {
    return apiCall<{ success: boolean; token: string | null; message: string }>(`/learning-videos/${id}/request-edit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  
  getByToken: async (token: string) => {
    return apiCall<{ video: LearningVideoBundle; allowedLanguages: string[] }>(`/learning-videos/edit/${encodeURIComponent(token)}`);
  },
  
  updateByToken: async (token: string, payload: { translations: Record<string, string> }) => {
    return apiCall<{ success: boolean; message: string }>(`/learning-videos/edit/${encodeURIComponent(token)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  
  getHistory: async (id: number) => {
    return apiCall<LearningVideoEditHistory[]>(`/learning-videos/${id}/history`);
  },
};
