import { ApiClient } from './apiClient';
import { config } from '@/lib/config';

export interface FileUploadResponse {
  filename: string;
  url: string;
  message: string;
  success?: boolean;
}

export class FileUploadService {
  static async uploadImage(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return ApiClient.postFormData<FileUploadResponse>('/api/images/upload', formData);
  }

  static async uploadDocument(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return ApiClient.postFormData<FileUploadResponse>('/api/document-files/upload', formData);
  }

  static getImageUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || config.baseUrl;
    const imageEndpoint = process.env.NEXT_PUBLIC_IMAGE_SERVE_ENDPOINT || '/api/images';
    
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    return `${baseUrl}${imageEndpoint}/${filename}`;
  }

  static getDocumentUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || config.baseUrl;
    const documentEndpoint =
      process.env.NEXT_PUBLIC_DOCUMENT_SERVE_ENDPOINT ||
      process.env.NEXT_PUBLIC_DOCUMENT_DOWNLOAD_ENDPOINT ||
      '/api/document-files';
    
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    
    return `${baseUrl}${documentEndpoint}/${filename}`;
  }

  static validateFileSize(file: File, maxSize?: number): boolean {
    const defaultMaxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '104857600'); // 100MB
    const limit = maxSize || defaultMaxSize;
    return file.size <= limit;
  }

  static validateImageSize(file: File): boolean {
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '10485760'); // 10MB
    return this.validateFileSize(file, maxSize);
  }

  static validateFileType(file: File): boolean {
    const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 
      'image/jpeg,image/png,image/gif,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    return allowedTypes.split(',').includes(file.type);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}