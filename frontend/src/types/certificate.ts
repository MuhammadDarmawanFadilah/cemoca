export interface CertificateTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description?: string;
  imageUrl?: string;
  variableCount: number;
  
  variable1Name?: string;
  variable1X?: number;
  variable1Y?: number;
  variable1FontSize?: number;
  variable1Color?: string;
  
  variable2Name?: string;
  variable2X?: number;
  variable2Y?: number;
  variable2FontSize?: number;
  variable2Color?: string;
  
  variable3Name?: string;
  variable3X?: number;
  variable3Y?: number;
  variable3FontSize?: number;
  variable3Color?: string;
  
  variable4Name?: string;
  variable4X?: number;
  variable4Y?: number;
  variable4FontSize?: number;
  variable4Color?: string;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateTemplateRequest {
  templateCode: string;
  templateName: string;
  description?: string;
  imageUrl?: string;
  variableCount: number;
  
  variable1Name?: string;
  variable1X?: number;
  variable1Y?: number;
  variable1FontSize?: number;
  variable1Color?: string;
  
  variable2Name?: string;
  variable2X?: number;
  variable2Y?: number;
  variable2FontSize?: number;
  variable2Color?: string;
  
  variable3Name?: string;
  variable3X?: number;
  variable3Y?: number;
  variable3FontSize?: number;
  variable3Color?: string;
  
  variable4Name?: string;
  variable4X?: number;
  variable4Y?: number;
  variable4FontSize?: number;
  variable4Color?: string;
  
  isActive?: boolean;
}

export interface TemplateVariable {
  name: string;
  value: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
