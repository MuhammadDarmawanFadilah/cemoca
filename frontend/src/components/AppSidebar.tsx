"use client";

import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from "react";
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
  CalendarClock,
  FolderOpen,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

type SectionId =
  | "main"
  | "admin"
  | "masterData"
  | "reportVideo"
  | "reportPdf"
  | "learningModule"
  | "learningSchedule"
  | "profile";

function getOrderStorageKey(userId?: number | string | null) {
  if (!userId) return null;
  return `sidebar-section-order:v1:${String(userId)}`;
}

function normalizeOrder(order: string[] | null | undefined, all: string[]) {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const id of order || []) {
    if (typeof id !== "string") continue;
    if (!all.includes(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    cleaned.push(id);
  }
  for (const id of all) {
    if (!seen.has(id)) cleaned.push(id);
  }
  return cleaned;
}

function SortableSection({
  id,
  children,
}: {
  id: string;
  children: (args: { dragAttributes: any; dragListeners: any }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const safeTransform = transform
    ? {
        ...transform,
        x: 0,
      }
    : null;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(safeTransform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragAttributes: attributes, dragListeners: listeners })}
    </div>
  );
}

const AppSidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const isMobile = useMobile();
  const { setOpenMobile } = useSidebar();

  const SECTION_IDS: SectionId[] = [
    "main",
    "admin",
    "masterData",
    "reportVideo",
    "reportPdf",
    "learningModule",
    "learningSchedule",
    "profile",
  ];

  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(SECTION_IDS);
  const [sectionOpen, setSectionOpen] = useState<Record<SectionId, boolean>>(() => {
    const init = {} as Record<SectionId, boolean>;
    for (const id of SECTION_IDS) init[id] = !isMobile;
    return init;
  });

  const [learningVideosOpen, setLearningVideosOpen] = useState<boolean>(() => !isMobile);
  
  // Update state ketika device berubah dari desktop ke mobile atau sebaliknya
  useEffect(() => {
    setSectionOpen((prev) => {
      const next = { ...prev };
      for (const id of SECTION_IDS) next[id] = !isMobile;
      return next;
    });

    setLearningVideosOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const key = getOrderStorageKey(user?.id);
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const normalized = normalizeOrder(Array.isArray(parsed) ? parsed : [], SECTION_IDS);
      setSectionOrder(normalized as SectionId[]);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    const key = getOrderStorageKey(user?.id);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(sectionOrder));
    } catch {
      // ignore
    }
  }, [sectionOrder, user?.id]);

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
      title: "Admin",
      url: "/admin",
      icon: Users,
    },
    {
      title: "Company",
      url: "/company",
      icon: Building,
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
    {
      title: "File Manager",
      url: "/admin/master-data/file-manager",
      icon: FolderOpen,
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

  const learningModuleVideoSubItems = [
    {
      title: "Video 1",
      url: "/learning-module/videos",
    },
    {
      title: "Video 2",
      url: "/learning-module/videos-2",
    },
    {
      title: "Video 3",
      url: "/learning-module/videos-3",
    },
    {
      title: "Video 4",
      url: "/learning-module/videos-4",
    },
  ];

  const learningModuleOtherItems = [
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

  const learningScheduleItems = [
    {
      title: t('nav.learningScheduleConfig'),
      url: "/learning-schedule/configuration",
      icon: CalendarClock,
    },
    {
      title: t('nav.learningScheduleHistory'),
      url: "/learning-schedule/history",
      icon: CalendarClock,
    },
  ];

  const isAdmin = user?.role?.roleName === 'ADMIN' || user?.role?.roleName === 'MODERATOR';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;
    setSectionOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as SectionId);
      const newIndex = prev.indexOf(over.id as SectionId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const sectionTriggerClass =
    "w-full flex items-center justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-2 py-1 text-[13px] font-medium transition-colors rounded-md";
  const menuListClass = "space-y-0.5";
  const menuLinkClass =
    "flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium leading-tight transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group";
  const menuIconClass = "h-4 w-4 flex-shrink-0";
  const menuTextDesktopClass = "hidden md:inline truncate";
  const menuTextMobileClass = "md:hidden text-[11px] truncate max-w-[92px]";

  const sections: Array<{
    id: SectionId;
    visible: boolean;
    label: string;
    icon: any;
    content: React.ReactNode;
  }> = [
    {
      id: "main",
      visible: isAuthenticated,
      label: t("nav.mainMenu"),
      icon: Home,
      content: (
        <SidebarMenu className={menuListClass}>
          {mainItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "admin",
      visible: isAuthenticated && isAdmin,
      label: t("nav.administration"),
      icon: Shield,
      content: (
        <SidebarMenu className={menuListClass}>
          {adminItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "masterData",
      visible: isAuthenticated,
      label: t("nav.masterData"),
      icon: Building,
      content: (
        <SidebarMenu className={menuListClass}>
          {masterDataItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "reportVideo",
      visible: isAuthenticated,
      label: t("nav.reportVideo"),
      icon: Video,
      content: (
        <SidebarMenu className={menuListClass}>
          {reportVideoItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "reportPdf",
      visible: isAuthenticated,
      label: t("nav.reportPdf"),
      icon: FileText,
      content: (
        <SidebarMenu className={menuListClass}>
          {reportPdfItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "learningModule",
      visible: isAuthenticated,
      label: t("nav.learningModule"),
      icon: Video,
      content: (
        <SidebarMenu className={menuListClass}>
          <Collapsible
            open={learningVideosOpen}
            onOpenChange={setLearningVideosOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className={menuLinkClass}>
                  <FileVideo className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{t('nav.learningModuleVideos')}</span>
                  <span className={menuTextMobileClass}>{t('nav.learningModuleVideos')}</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {learningModuleVideoSubItems.map((sub) => (
                    <SidebarMenuSubItem key={sub.url}>
                      <SidebarMenuSubButton asChild>
                        <Link href={sub.url} onClick={handleMenuClick}>
                          <span>{sub.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {learningModuleOtherItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link href={item.url} onClick={handleMenuClick} className={menuLinkClass}>
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "learningSchedule",
      visible: isAuthenticated,
      label: t("nav.learningSchedule"),
      icon: CalendarClock,
      content: (
        <SidebarMenu className={menuListClass}>
          {learningScheduleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className="w-full">
                <Link
                  href={item.url}
                  onClick={handleMenuClick}
                  className={menuLinkClass}
                >
                  <item.icon className={menuIconClass} />
                  <span className={menuTextDesktopClass}>{item.title}</span>
                  <span className={menuTextMobileClass}>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      ),
    },
    {
      id: "profile",
      visible: isAuthenticated,
      label: t("nav.myProfile"),
      icon: UserCircle,
      content: (
        <SidebarMenu className={menuListClass}>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <Link
                href="/profile"
                onClick={handleMenuClick}
                className={menuLinkClass}
              >
                <Building className={menuIconClass} />
                <span className={menuTextDesktopClass}>{t("profile.companyProfile")}</span>
                <span className={menuTextMobileClass}>{t("profile.companyProfile")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full">
              <Link
                href="/reset-password"
                target="_blank"
                onClick={handleMenuClick}
                className={menuLinkClass}
              >
                <Key className={menuIconClass} />
                <span className={menuTextDesktopClass}>{t("profile.changePassword")}</span>
                <span className={menuTextMobileClass}>{t("profile.changePassword")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      ),
    },
  ];

  const visibleSectionIds = sectionOrder.filter((id) => sections.find((s) => s.id === id)?.visible);

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
        {isAuthenticated && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext items={visibleSectionIds} strategy={verticalListSortingStrategy}>
              {visibleSectionIds.map((id) => {
                const sec = sections.find((s) => s.id === id);
                if (!sec || !sec.visible) return null;

                const Icon = sec.icon;
                return (
                  <SortableSection key={sec.id} id={sec.id}>
                    {({ dragAttributes, dragListeners }) => (
                      <Collapsible
                        open={sectionOpen[sec.id]}
                        onOpenChange={(open) => setSectionOpen((p) => ({ ...p, [sec.id]: open }))}
                        className="group/collapsible"
                      >
                        <SidebarGroup>
                          <SidebarGroupLabel asChild>
                            <CollapsibleTrigger
                              {...dragAttributes}
                              {...dragListeners}
                              className={sectionTriggerClass}
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="hidden md:inline">{sec.label}</span>
                                <span className="md:hidden">{sec.label}</span>
                              </span>
                              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                          </SidebarGroupLabel>
                          <CollapsibleContent>
                            <SidebarGroupContent>{sec.content}</SidebarGroupContent>
                          </CollapsibleContent>
                        </SidebarGroup>
                      </Collapsible>
                    )}
                  </SortableSection>
                );
              })}
            </SortableContext>
          </DndContext>
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
