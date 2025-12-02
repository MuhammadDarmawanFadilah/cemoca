'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
  Loader2
} from 'lucide-react';
import { getApiUrl } from '@/lib/config';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch users count
      const usersResponse = await fetch(getApiUrl('/api/users?page=0&size=1'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      // Fetch roles count  
      const rolesResponse = await fetch(getApiUrl('/api/roles?page=0&size=1'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      let totalUsers = 0;
      let totalRoles = 0;

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        totalUsers = usersData.totalElements || 0;
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        totalRoles = rolesData.totalElements || 0;
      }
      
      setStats({
        totalUsers,
        activeUsers: totalUsers,
        totalRoles
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('common.loading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.loadingData')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')} CAMOCA
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('dashboard.welcome')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="default"
            className="flex items-center space-x-1"
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{t('dashboard.online')}</span>
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalUsers || 0)}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats?.activeUsers || 0} {t('dashboard.active')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalRoles')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.totalRoles || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.rolesAvailable')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.systemStatus')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{t('dashboard.active')}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.allSystemsNormal')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/users">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">{t('dashboard.manageUsers')}</CardTitle>
              <CardDescription>{t('dashboard.manageUsersDesc')}</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/roles">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 group">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">{t('dashboard.manageRoles')}</CardTitle>
              <CardDescription>{t('dashboard.manageRolesDesc')}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
