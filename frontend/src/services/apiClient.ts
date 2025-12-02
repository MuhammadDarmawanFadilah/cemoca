import { getApiUrl } from '@/lib/config';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private static getAuthHeadersForFormData(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }

  static async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: this.getAuthHeadersForFormData(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error posting form data to ${endpoint}:`, error);
      throw error;
    }
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error putting to ${endpoint}:`, error);
      throw error;
    }
  }

  static async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'PUT',
        headers: this.getAuthHeadersForFormData(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error putting form data to ${endpoint}:`, error);
      throw error;
    }
  }

  static async delete<T>(endpoint: string): Promise<T | void> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle empty response for delete operations
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return;
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }

  static async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error patching ${endpoint}:`, error);
      throw error;
    }
  }
}