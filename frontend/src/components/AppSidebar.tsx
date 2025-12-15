"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  ChevronUp,
  ChevronDown,
  Users,
  UserCircle,
  Building,
  Shield,
  LogOut,
  LogIn,
  Key,
  Video,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Mail,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMobile } from "@/hooks/useMobile";
import { imageAPI } from "@/lib/api";

const AppSidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const isMobile = useMobile();
  const { setOpenMobile } = useSidebar();
  // State untuk mengatur open/close status setiap section
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(!isMobile);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(!isMobile);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(!isMobile);
  const [isReportVideoMenuOpen, setIsReportVideoMenuOpen] = useState(!isMobile);
  const [isReportPdfMenuOpen, setIsReportPdfMenuOpen] = useState(!isMobile);
  const [isLearningModuleMenuOpen, setIsLearningModuleMenuOpen] = useState(!isMobile);
  const [isMasterDataMenuOpen, setIsMasterDataMenuOpen] = useState(!isMobile);
  
  // Update state ketika device berubah dari desktop ke mobile atau sebaliknya
  useEffect(() => {
    if (isMobile) {
      setIsMainMenuOpen(false);
      setIsAdminMenuOpen(false);
      setIsProfileMenuOpen(false);
      setIsReportVideoMenuOpen(false);
      setIsReportPdfMenuOpen(false);
      setIsLearningModuleMenuOpen(false);
      setIsMasterDataMenuOpen(false);
    } else {
      setIsMainMenuOpen(true);
      setIsAdminMenuOpen(true);
      setIsProfileMenuOpen(true);
      setIsReportVideoMenuOpen(true);
      setIsReportPdfMenuOpen(true);
      setIsLearningModuleMenuOpen(true);
      setIsMasterDataMenuOpen(true);
    }
  }, [isMobile]);

  // Helper function untuk menutup sidebar pada mobile ketika menu diklik
  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Main items (accessible when logged in) - Simple menu for CAMOCA
  const mainItems = [
    {
      title: t('nav.dashboard'),
      url: "/dashboard",
      icon: Home,
    },
  ];

  // Admin items (accessible to admin/moderator)
  const adminItems = [
    {
      title: t('nav.users'),
      url: "/users",
      icon: Users,
    },
    {
      title: t('nav.roles'),
      url: "/roles",
      icon: Shield,
    },
  ];

  const masterDataItems = [
    {
      title: t('nav.agencyList'),
      url: "/master-data/agency-list",
      icon: Users,
    },
    {
      title: t('nav.policySales'),
      url: "/master-data/policy-sales",
      icon: FileText,
    },
  ];

  // Report Video items
  const reportVideoItems = [
    {
      title: t('nav.personalSales'),
      url: "/report-video/personal-sales",
      icon: FileVideo,
    },
  ];

  // Report PDF items
  const reportPdfItems = [
    {
      title: t('nav.personalLetter'),
      url: "/report-pdf/personal-letter",
      icon: Mail,
    },
  ];

  // Learning Module items
  const learningModuleItems = [
    {
      title: t('nav.learningModuleVideos'),
      url: "/learning-module/videos",
      icon: FileVideo,
    },
    {
      title: t('nav.learningModuleImages'),
      url: "/learning-module/images",
      icon: ImageIcon,
    },
    {
      title: t('nav.learningModulePowerPoints'),
      url: "/learning-module/power-points",
      icon: FileText,
    },
    {
      title: t('nav.learningModulePdfs'),
      url: "/learning-module/pdfs",
      icon: FileText,
    },
  ];

  const isAdmin = user?.role?.roleName === 'ADMIN' || user?.role?.roleName === 'MODERATOR';

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r bg-sidebar data-[state=collapsed]:w-14 md:data-[state=collapsed]:w-16 sidebar-mobile-optimized"
    >
      <SidebarHeader className="py-3 md:py-4 px-2 md:px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md">
              <Link href="/" onClick={handleMenuClick} className="flex items-center gap-2 md:gap-3">
                <Image src="/logo.svg" alt="logo" width={24} height={24} className="md:w-8 md:h-8 flex-shrink-0" />
                <span className="font-semibold text-sm md:text-base group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">CAMOCA</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      
      <SidebarContent>
        {/* MAIN MENU SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isMainMenuOpen} onOpenChange={setIsMainMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.mainMenu')}</span>
                    <span className="md:hidden">{t('nav.mainMenu')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {mainItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link 
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* ADMIN SECTION - Only visible for admin/moderator */}
        {isAuthenticated && isAdmin && (
          <Collapsible open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.administration')}</span>
                    <span className="md:hidden">{t('nav.administration')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {adminItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link 
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* MASTER DATA SECTION - Visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isMasterDataMenuOpen} onOpenChange={setIsMasterDataMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.masterData')}</span>
                    <span className="md:hidden">{t('nav.masterData')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {masterDataItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* REPORT VIDEO SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isReportVideoMenuOpen} onOpenChange={setIsReportVideoMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.reportVideo')}</span>
                    <span className="md:hidden">{t('nav.reportVideo')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {reportVideoItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link 
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* REPORT PDF SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isReportPdfMenuOpen} onOpenChange={setIsReportPdfMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.reportPdf')}</span>
                    <span className="md:hidden">{t('nav.reportPdf')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {reportPdfItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link 
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* LEARNING MODULE SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isLearningModuleMenuOpen} onOpenChange={setIsLearningModuleMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.learningModule')}</span>
                    <span className="md:hidden">{t('nav.learningModule')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {learningModuleItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="w-full">
                          <Link
                            href={item.url}
                            onClick={handleMenuClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden md:inline truncate">{item.title}</span>
                            <span className="md:hidden text-xs truncate max-w-[80px]">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* USER PROFILE SECTION - Only visible when authenticated */}
        {isAuthenticated && (
          <Collapsible open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1.5 text-sm font-medium transition-colors rounded-md">
                  <span className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="hidden md:inline">{t('nav.myProfile')}</span>
                    <span className="md:hidden">{t('nav.profile')}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href="/profile"
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <Building className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">{t('profile.companyProfile')}</span>
                          <span className="md:hidden text-xs truncate">{t('profile.companyProfile')}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild className="w-full">
                        <Link 
                          href="/reset-password" 
                          target="_blank"
                          onClick={handleMenuClick}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group"
                        >
                          <Key className="h-4 w-4 flex-shrink-0" />
                          <span className="hidden md:inline truncate">{t('profile.changePassword')}</span>
                          <span className="md:hidden text-xs truncate">{t('profile.changePassword')}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>      <SidebarFooter className="p-2 md:p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <div className="flex items-center space-x-2 min-w-0">                      <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                        <AvatarImage 
                          src={user?.avatarUrl || 
                               (user?.biografi?.foto ? imageAPI.getImageUrl(user.biografi.foto) : 
                                user?.biografi?.fotoProfil ? imageAPI.getImageUrl(user.biografi.fotoProfil) : undefined)} 
                          alt={user?.fullName}
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-xs md:text-sm">
                          {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0 hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                        <div className="font-medium text-xs md:text-sm truncate">{user?.fullName}</div>
                        <div className="text-xs text-muted-foreground hidden md:block">{user?.role?.roleName || 'USER'}</div>
                      </div>
                    </div>
                    <ChevronUp className="ml-auto h-3 w-3 md:h-4 md:w-4 hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>                <DropdownMenuContent align="end" className="w-48 md:w-56">
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (              <SidebarMenuButton asChild className="p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <Link href="/login" onClick={handleMenuClick} className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">{t('auth.login')}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
