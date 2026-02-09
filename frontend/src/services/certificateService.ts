import { ApiClient } from './apiClient';
import { 
  CertificateTemplate, 
  CertificateTemplateRequest, 
  PageResponse 
} from '@/types/certificate';

export class CertificateTemplateService {
  private static readonly BASE_URL = '/api/certification/certificate-templates';

  static async getAll(
    search?: string,
    isActive?: boolean,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<CertificateTemplate>> {
    let url = `${this.BASE_URL}?page=${page}&size=${size}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (isActive !== undefined) {
      url += `&isActive=${isActive}`;
    }
    
    return ApiClient.get<PageResponse<CertificateTemplate>>(url);
  }

  static async getAllActive(): Promise<CertificateTemplate[]> {
    return ApiClient.get<CertificateTemplate[]>(`${this.BASE_URL}/active`);
  }

  static async generateCode(prefix: string = 'AC'): Promise<{ templateCode: string }> {
    return ApiClient.get<{ templateCode: string }>(`${this.BASE_URL}/generate-code?prefix=${prefix}`);
  }

  static async getById(id: number): Promise<CertificateTemplate> {
    return ApiClient.get<CertificateTemplate>(`${this.BASE_URL}/${id}`);
  }

  static async getByCode(templateCode: string): Promise<CertificateTemplate> {
    return ApiClient.get<CertificateTemplate>(`${this.BASE_URL}/by-code/${templateCode}`);
  }

  static async create(request: CertificateTemplateRequest): Promise<CertificateTemplate> {
    return ApiClient.post<CertificateTemplate>(this.BASE_URL, request);
  }

  static async update(id: number, request: CertificateTemplateRequest): Promise<CertificateTemplate> {
    return ApiClient.put<CertificateTemplate>(`${this.BASE_URL}/${id}`, request);
  }

  static async delete(id: number): Promise<void> {
    return ApiClient.delete(`${this.BASE_URL}/${id}`);
  }

  static async toggleActive(id: number): Promise<CertificateTemplate> {
    return ApiClient.patch<CertificateTemplate>(`${this.BASE_URL}/${id}/toggle-active`, {});
  }
}
