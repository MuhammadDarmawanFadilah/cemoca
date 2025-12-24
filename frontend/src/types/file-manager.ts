// File Manager & Scheduler Types

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: string;
}

export interface FolderInfo {
  name: string;
  path: string;
  fileCount: number;
  files: FileInfo[];
}

export interface FileManagerFolderResponse {
  companyCode: string;
  basePath: string;
  folders: FolderInfo[];
}

export interface SchedulerLogResponse {
  id: number;
  companyCode: string | null;
  importType: string | null;
  fileName: string | null;
  filePath: string | null;
  status: string | null;
  createdCount: number | null;
  updatedCount: number | null;
  errorCount: number | null;
  errorMessage: string | null;
  processedBy: string | null;
  processedAt: string;
}

export interface SchedulerConfigResponse {
  basePath: string;
  enabled: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}
