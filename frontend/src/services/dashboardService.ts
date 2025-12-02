import { ApiClient } from './apiClient';

// Interfaces for Koperasi Dashboard
interface KoperasiStats {
  totalKaryawan: number;
  totalBarang: number;
  totalKategori: number;
  totalMember: number;
  totalPesanan: number;
  pesananHariIni: number;
  pendapatanHariIni: number;
  pendapatanBulanIni: number;
  barangTersedia: number;
  barangHabis: number;
  stockKritis: number;
  pesananPending: number;
  pesananProcessing: number;
  pesananCompleted: number;
  pesananCancelled: number;
}

interface KoperasiCharts {
  monthlyRevenue: MonthlyRevenueData[];
  topCategories: CategoryData[];
  ordersTrend: OrderTrendData[];
  stockDistribution: StockDistributionData;
}

interface MonthlyRevenueData {
  month: string;
  monthShort: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  items: number;
  percentage: number;
}

interface OrderTrendData {
  date: string;
  dateShort: string;
  orders: number;
  revenue: number;
}

interface StockDistributionData {
  tersedia: number;
  habis: number;
  kritis: number;
}

export class DashboardService {
  static async getDashboardStats(): Promise<KoperasiStats> {
    try {
      const response = await ApiClient.get<{data: KoperasiStats}>('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      return {
        totalKaryawan: 0,
        totalBarang: 0,
        totalKategori: 0,
        totalMember: 0,
        totalPesanan: 0,
        pesananHariIni: 0,
        pendapatanHariIni: 0,
        pendapatanBulanIni: 0,
        barangTersedia: 0,
        barangHabis: 0,
        stockKritis: 0,
        pesananPending: 0,
        pesananProcessing: 0,
        pesananCompleted: 0,
        pesananCancelled: 0
      };
    }
  }

  static async getDashboardCharts(): Promise<KoperasiCharts> {
    try {
      const response = await ApiClient.get<{data: KoperasiCharts}>('/api/dashboard/charts');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard charts:', error);
      
      return {
        monthlyRevenue: [],
        topCategories: [],
        ordersTrend: [],
        stockDistribution: {
          tersedia: 0,
          habis: 0,
          kritis: 0
        }
      };
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      await ApiClient.get<string>('/api/dashboard/health');
      return true;
    } catch (error) {
      console.error('Error checking dashboard health:', error);
      return false;
    }
  }
}

export type { KoperasiStats, KoperasiCharts, MonthlyRevenueData, CategoryData, OrderTrendData, StockDistributionData };