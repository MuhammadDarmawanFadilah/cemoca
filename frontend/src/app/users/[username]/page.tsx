"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { 
  BadgeCheck, 
  Candy, 
  Shield, 
  Loader2, 
  ArrowLeft, 
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Clock,
  Activity,
  BookOpen,
  Award
} from "lucide-react";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import EditUser from "@/components/EditUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { config, getApiUrl } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Role {
  roleId: number;
  roleName: string;
  description: string;
}

interface BiografiSummary {
  biografiId: number;
  namaLengkap: string;
  email: string;
  fotoProfil?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
  biografi?: BiografiSummary;
}

const SingleUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  useEffect(() => {
    fetchUser();
  }, [params.username]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch by ID if username is numeric, otherwise by username
      const isId = !isNaN(Number(params.username));
      const endpoint = isId 
        ? `/api/users/${params.username}`
        : `/api/users/username/${params.username}`;
      
      const response = await fetch(getApiUrl(endpoint), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 404) {
        setError("User tidak ditemukan");
      } else {
        const errorText = await response.text();
        setError(errorText || "Gagal memuat data user");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Terjadi kesalahan saat memuat data user");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    let completed = 0;
    const fields = [
      user.fullName,
      user.email,
      user.phoneNumber,
      user.avatarUrl || user.biografi?.fotoProfil,
      user.biografi?.namaLengkap
    ];
    
    fields.forEach(field => {
      if (field && field.trim()) completed++;
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg';
      case 'INACTIVE':
        return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-0 shadow-lg';
      case 'SUSPENDED':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg';
      case 'WAITING_APPROVAL':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0 shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0 shadow-lg';
    }
  };

  const getRoleBadges = (role: Role) => {
    const badges = [];
    
    // Always show role badge
    badges.push({
      icon: Shield,
      color: "bg-blue-500/30 border-blue-500/50",
      title: role.roleName,
      description: role.description || `User dengan role ${role.roleName}`,
    });

    // Add verification badge for active users
    if (user?.status === 'ACTIVE') {
      badges.push({
        icon: BadgeCheck,
        color: "bg-green-500/30 border-green-500/50",
        title: "Verified User",
        description: "User ini telah diverifikasi oleh admin.",
      });
    }

    // Add alumni badge if has biografi
    if (user?.biografi) {
      badges.push({
        icon: Candy,
        color: "bg-purple-500/30 border-purple-500/50",
        title: "Member",
        description: "User ini memiliki data biografi member yang terhubung.",
      });
    }

    return badges;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Memuat data user...</span>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error || "User tidak ditemukan"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            User yang Anda cari tidak dapat ditemukan atau terjadi kesalahan.
          </p>
        </div>
        <Button onClick={() => router.push("/users")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Karyawan
        </Button>
      </div>
    );
  }

  const roleBadges = getRoleBadges(user.role);
  const profileCompletion = calculateProfileCompletion();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/users" className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                  Karyawan
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-900 dark:text-slate-100 font-medium">{user.fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        <div className="flex flex-col xl:flex-row gap-8">
          {/* LEFT SIDEBAR */}
          <div className="w-full xl:w-1/3 space-y-6">
            {/* USER BADGES CONTAINER */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-blue-500/10 dark:shadow-slate-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  User Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {roleBadges.map((badge, index) => (
                    <HoverCard key={index}>
                      <HoverCardTrigger>
                        <div className="relative group cursor-pointer">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                          <badge.icon
                            size={40}
                            className={`rounded-full border-2 p-2 transition-all duration-300 group-hover:scale-110 ${badge.color} shadow-lg`}
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-0 shadow-xl">
                        <h1 className="font-bold mb-2 text-slate-800 dark:text-slate-100">{badge.title}</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {badge.description}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* USER ACTIVITIES CONTAINER */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-green-500/10 dark:shadow-slate-900/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">Account Created</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                      {Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                    </Badge>
                  </div>
                </div>
                
                {user.updatedAt !== user.createdAt && (
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">Profile Updated</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(user.updatedAt).toLocaleDateString('id-ID', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                        {Math.floor((new Date().getTime() - new Date(user.updatedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                      </Badge>
                    </div>
                  </div>
                )}
                
                {user.biografi && (
                  <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full shadow-lg">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">Alumni Profile Linked</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connected to biography data
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-lg">
                        Alumni
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 transition-all duration-300 hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full shadow-lg">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">Current Status</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Account is {user.status.toLowerCase().replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>          {/* RIGHT MAIN CONTENT */}
          <div className="w-full xl:w-2/3 space-y-6">
            {/* USER PROFILE HEADER */}
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-slate-500/10 dark:shadow-slate-900/50 overflow-hidden">
              <div className="relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
                
                <CardContent className="relative p-8">
                  <div className="flex flex-col lg:flex-row items-start gap-8">
                    {/* Avatar Section */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 transform scale-110"></div>
                      <Avatar className="relative size-32 border-4 border-white dark:border-slate-700 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage 
                          src={user.avatarUrl || user.biografi?.fotoProfil} 
                          alt={user.fullName}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    {/* User Info Section */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                          {user.fullName}
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">@{user.username}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <Badge className={`${getStatusColor(user.status)} px-3 py-1 text-sm font-medium shadow-lg`}>
                            {user.status}
                          </Badge>
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-3 py-1 text-sm font-medium shadow-lg">
                            {user.role.roleName}
                          </Badge>
                          {user.biografi && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 px-3 py-1 text-sm font-medium shadow-lg">
                              Alumni
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                          <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
                            <Mail className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 block">Email</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg">
                            <Phone className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 block">Phone</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{user.phoneNumber}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 block">Joined</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(user.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        
                        {user.biografi && (
                          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl backdrop-blur-sm">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-lg">
                              <BookOpen className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <span className="text-sm text-slate-600 dark:text-slate-400 block">Alumni</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.biografi.namaLengkap}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            Edit User
                          </Button>
                        </SheetTrigger>
                        <EditUser />
                      </Sheet>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => router.push("/users")}
                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Users
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>            {/* USER DETAILS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PROFILE INFORMATION */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-blue-500/10 dark:shadow-slate-900/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Full Name</label>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{user.fullName}</p>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Username</label>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">@{user.username}</p>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{user.email}</p>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Phone Number</label>
                      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{user.phoneNumber}</p>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Status</label>
                      <div className="mt-2">
                        <Badge className={`${getStatusColor(user.status)} shadow-lg`}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ROLE & PERMISSIONS */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-purple-500/10 dark:shadow-slate-900/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Role & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">User Role</label>
                      <div className="mt-2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                          {user.role.roleName}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Role Description</label>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {user.role.description || `User dengan role ${user.role.roleName}`}
                      </p>
                    </div>
                    
                    <div className="group p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/70 dark:hover:bg-slate-700/50 transition-all duration-300">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Profile Completion</label>
                      <div className="mt-3 space-y-3">
                        <div className="relative">
                          <Progress value={profileCompletion} className="h-3 bg-slate-200 dark:bg-slate-600">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500 ease-out" style={{width: `${profileCompletion}%`}}></div>
                          </Progress>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {profileCompletion}% Complete
                          </p>
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                            {profileCompletion >= 80 ? 'Excellent' : profileCompletion >= 60 ? 'Good' : 'Needs Work'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {user.biografi && (
                      <div className="group p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
                        <label className="text-sm font-medium text-purple-700 dark:text-purple-300">Alumni Status</label>
                        <div className="mt-2 space-y-2">
                          <Badge className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 shadow-lg">
                            Alumni Profile Linked
                          </Badge>
                          <p className="text-sm text-purple-600 dark:text-purple-300">
                            Connected to biography ID: #{user.biografi.biografiId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>            {/* BIOGRAPHY & TIMELINE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BIOGRAPHY INFORMATION */}
              {user.biografi && (
                <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-purple-500/10 dark:shadow-slate-900/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      Alumni Biography
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
                          <label className="text-sm font-medium text-purple-700 dark:text-purple-300">Alumni Name</label>
                          <p className="text-base font-semibold text-purple-800 dark:text-purple-100 mt-1">{user.biografi.namaLengkap}</p>
                        </div>
                        
                        <div className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-lg transition-all duration-300">
                          <label className="text-sm font-medium text-purple-700 dark:text-purple-300">Biography ID</label>
                          <p className="text-base font-semibold text-purple-800 dark:text-purple-100 mt-1">#{user.biografi.biografiId}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-lg mt-1">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Alumni Profile Connection</h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                              This user has a linked alumni biography profile. 
                              {user.biografi.namaLengkap !== user.fullName && 
                                ` The alumni is also known as "${user.biografi.namaLengkap}".`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ACCOUNT TIMELINE */}
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl shadow-orange-500/10 dark:shadow-slate-900/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    Account Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="relative flex items-start gap-4 group">
                      <div className="relative z-10">
                        <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg group-hover:scale-125 transition-transform duration-300"></div>
                        <div className="absolute top-4 left-1/2 w-0.5 h-12 bg-gradient-to-b from-green-500 to-blue-500 transform -translate-x-1/2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">Account Created</p>
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {new Date(user.createdAt).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          User account was created and activated in the system
                        </p>
                      </div>
                    </div>
                    
                    {user.updatedAt !== user.createdAt && (
                      <div className="relative flex items-start gap-4 group">
                        <div className="relative z-10">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg group-hover:scale-125 transition-transform duration-300"></div>
                          {user.biografi && (
                            <div className="absolute top-4 left-1/2 w-0.5 h-12 bg-gradient-to-b from-blue-500 to-purple-500 transform -translate-x-1/2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Profile Updated</p>
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {new Date(user.updatedAt).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            User profile information was last updated
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {user.biografi && (
                      <div className="relative flex items-start gap-4 group">
                        <div className="relative z-10">
                          <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full shadow-lg group-hover:scale-125 transition-transform duration-300"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">Alumni Profile Linked</p>
                            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                              ID: {user.biografi.biografiId}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            User account successfully linked to alumni biography data
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default SingleUserPage;
