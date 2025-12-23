import { ApiClient } from "./apiClient";

export type LearningScheduleType =
  | "TRAINING_14_DAY_MICRO_LEARNING"
  | "TRAINING_28_DAY_MICRO_LEARNING"
  | "WELCOME_NEW_JOINNER"
  | "HAPPY_BIRTHDAY_NOTIFICATION"
  | "CONGRATULATION"
  | "PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO"
  | string;


export type LearningScheduleConfig = {
  id: number;
  companyCode: string;
  schedulerType: LearningScheduleType;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  hourOfDay: number | null;
  mediaType: "VIDEO" | "IMAGE" | "PDF" | "PPT" | string;
  learningCode: string | null;
  videoLearningCode1?: string | null;
  videoLearningCode2?: string | null;
  videoLearningCode3?: string | null;
  videoLearningCode4?: string | null;
  videoTextTemplate: string | null;
  videoTextTemplate1?: string | null;
  videoTextTemplate2?: string | null;
  videoTextTemplate3?: string | null;
  videoTextTemplate4?: string | null;
  materials?: Array<{
    id: number | null;
    startDate: string;
    endDate: string;
    learningCode: string;
    videoTextTemplate?: string | null;
    videoLearningCode1?: string | null;
    videoLearningCode2?: string | null;
    videoLearningCode3?: string | null;
    videoLearningCode4?: string | null;
    videoTextTemplate1?: string | null;
    videoTextTemplate2?: string | null;
    videoTextTemplate3?: string | null;
    videoTextTemplate4?: string | null;
  }>;
  waMessageTemplate: string | null;
  didPresenterId: string | null;
  didPresenterName: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningScheduleConfigRequest = {
  schedulerType: LearningScheduleType;
  active?: boolean;
  startDate: string;
  endDate: string;
  hourOfDay: number;
  mediaType: "VIDEO" | "IMAGE" | "PDF" | "PPT" | string;
  learningCode: string;
  videoLearningCode1?: string | null;
  videoLearningCode2?: string | null;
  videoLearningCode3?: string | null;
  videoLearningCode4?: string | null;
  videoTextTemplate?: string | null;
  videoTextTemplate1?: string | null;
  videoTextTemplate2?: string | null;
  videoTextTemplate3?: string | null;
  videoTextTemplate4?: string | null;
  materials?: Array<{
    startDate: string;
    endDate: string;
    learningCode: string;
    videoTextTemplate?: string | null;
    videoLearningCode1?: string | null;
    videoLearningCode2?: string | null;
    videoLearningCode3?: string | null;
    videoLearningCode4?: string | null;
    videoTextTemplate1?: string | null;
    videoTextTemplate2?: string | null;
    videoTextTemplate3?: string | null;
    videoTextTemplate4?: string | null;
  }>;
  waMessageTemplate: string;
  didPresenterId?: string | null;
  didPresenterName?: string | null;
};

export type LearningScheduleHistory = {
  id: number;
  configId: number | null;
  companyCode: string;
  schedulerType: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  totalTargets: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  errorMessage: string | null;
};

export type LearningScheduleQueuedResponse = {
  configId: number | null;
  companyCode: string;
  schedulerType: string;
  startedAt: string;
  status: string;
};

export type LearningScheduleHistoryItem = {
  id: number;
  historyId: number | null;
  agentCode: string | null;
  fullName: string | null;
  phoneNo: string | null;
  policyLastDate: string | null;
  mediaType: string | null;
  learningCode: string | null;
  waStatus: string | null;
  waMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type LearningSchedulePrerequisiteResponse = {
  agencyListExists: boolean;
  policySalesExists: boolean;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export class LearningScheduleService {
  static async listTypes(): Promise<string[]> {
    return ApiClient.get<string[]>(`/api/admin/learning-schedule/types`);
  }

  static async checkPrerequisites(companyCode: string): Promise<LearningSchedulePrerequisiteResponse> {
    return ApiClient.get<LearningSchedulePrerequisiteResponse>(
      `/api/admin/learning-schedule/prerequisites?companyCode=${encodeURIComponent(companyCode)}`
    );
  }

  static async listConfigs(companyCode: string): Promise<LearningScheduleConfig[]> {
    return ApiClient.get<LearningScheduleConfig[]>(
      `/api/admin/learning-schedule/configs?companyCode=${encodeURIComponent(companyCode)}`
    );
  }

  static async createConfig(companyCode: string, payload: LearningScheduleConfigRequest): Promise<LearningScheduleConfig> {
    return ApiClient.post<LearningScheduleConfig>(
      `/api/admin/learning-schedule/configs?companyCode=${encodeURIComponent(companyCode)}`,
      payload
    );
  }

  static async updateConfig(companyCode: string, id: number, payload: LearningScheduleConfigRequest): Promise<LearningScheduleConfig> {
    return ApiClient.put<LearningScheduleConfig>(
      `/api/admin/learning-schedule/configs/${id}?companyCode=${encodeURIComponent(companyCode)}`,
      payload
    );
  }

  static async activate(companyCode: string, id: number): Promise<LearningScheduleConfig> {
    return ApiClient.post<LearningScheduleConfig>(
      `/api/admin/learning-schedule/configs/${id}/activate?companyCode=${encodeURIComponent(companyCode)}`,
      {}
    );
  }

  static async deactivate(companyCode: string, id: number): Promise<LearningScheduleConfig> {
    return ApiClient.post<LearningScheduleConfig>(
      `/api/admin/learning-schedule/configs/${id}/deactivate?companyCode=${encodeURIComponent(companyCode)}`,
      {}
    );
  }

  static async runNow(companyCode: string, id: number): Promise<LearningScheduleHistory> {
    return ApiClient.post<LearningScheduleHistory>(
      `/api/admin/learning-schedule/configs/${id}/run?companyCode=${encodeURIComponent(companyCode)}`,
      {}
    );
  }

  static async sendNow(companyCode: string, id: number): Promise<LearningScheduleQueuedResponse> {
    return ApiClient.post<LearningScheduleQueuedResponse>(
      `/api/admin/learning-schedule/configs/${id}/send-now?companyCode=${encodeURIComponent(companyCode)}`,
      {}
    );
  }

  static async listHistory(companyCode: string, page = 0, size = 25): Promise<PageResponse<LearningScheduleHistory>> {
    return ApiClient.get<PageResponse<LearningScheduleHistory>>(
      `/api/admin/learning-schedule/history?companyCode=${encodeURIComponent(companyCode)}&page=${page}&size=${size}`
    );
  }

  static async listHistoryItems(companyCode: string, historyId: number, page = 0, size = 50): Promise<PageResponse<LearningScheduleHistoryItem>> {
    return ApiClient.get<PageResponse<LearningScheduleHistoryItem>>(
      `/api/admin/learning-schedule/history/${historyId}/items?companyCode=${encodeURIComponent(companyCode)}&page=${page}&size=${size}`
    );
  }
}
