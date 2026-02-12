"use client";

import { useCallback } from "react";
import {
  Home,
  ChevronUp,
  UserPlus,
  Bell,
  History,
  MessageCircle,
  Newspaper,
  FileText,
  User,
  Users,
  Clock,
  LogOut,
  LogIn,
<<<<<<< HEAD
  Key,
  Video,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Mail,
  CalendarClock,
  FolderOpen,
  Music,
  Award,
=======
>>>>>>> d4d22aa (Redesign histori-minum-obat with professional UI and fix patient query to show all medication patients)
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
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
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/hooks/useMobile";
import { imageAPI } from "@/lib/api";

<<<<<<< HEAD
type SectionId =
  | "main"
  | "admin"
  | "masterData"
  | "reportVideo"
  | "reportPdf"
  | "learningModule"
  | "learningSchedule"
  | "certification"
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

=======
>>>>>>> d4d22aa (Redesign histori-minum-obat with professional UI and fix patient query to show all medication patients)
const AppSidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useMobile();
  const { setOpenMobile } = useSidebar();

<<<<<<< HEAD
  const SECTION_IDS: SectionId[] = [
    "main",
    "admin",
    "masterData",
    "reportVideo",
    "reportPdf",
    "learningModule",
    "learningSchedule",
    "certification",
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

=======
>>>>>>> d4d22aa (Redesign histori-minum-obat with professional UI and fix patient query to show all medication patients)
  // Helper function untuk menutup sidebar pada mobile ketika menu diklik
  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Check if user is admin
  const isAdmin = () => user?.role?.roleName === 'ADMIN' || user?.role?.roleName === 'MODERATOR';

  // Admin menu items (8 items)
  const adminMenus = [
    { name: "Dashboard", path: "/sehat/dashboard", icon: Home },
    { name: "Manajemen Pengguna", path: "/sehat/administrasi-profil", icon: Users },
    { name: "Histori Minum Obat", path: "/sehat/histori-minum-obat", icon: History },
    { name: "Konsultasi", path: "/sehat/konsultasi", icon: MessageCircle },
    { name: "Informasi Berita", path: "/sehat/berita", icon: Newspaper },
    { name: "Informasi ESO", path: "/sehat/eso", icon: FileText },
    { name: "Histori Pengingat", path: "/sehat/histori-pengingat", icon: Clock },
  ];

  // User menu items (6 items)
  const userMenus = [
    { name: "Dashboard", path: "/sehat/dashboard", icon: Home },
    { name: "Pengingat Minum Obat", path: "/sehat/pengingat-minum-obat", icon: Bell },
    { name: "Konsultasi", path: "/sehat/konsultasi", icon: MessageCircle },
    { name: "Informasi Berita", path: "/sehat/berita", icon: Newspaper },
    { name: "Informasi ESO", path: "/sehat/eso", icon: FileText },
    { name: "Profil Pasien", path: "/sehat/profil-pasien", icon: User },
  ];

<<<<<<< HEAD
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
    {
      title: "Learning Video",
      url: "/report-video/learning-video",
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
      title: t('nav.learningVideo'),
      url: "/learning-module/learning-video",
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

  const certificationItems = [
    {
      title: "Certificate Template",
      url: "/certification/certificate-template",
      icon: Award,
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
      id: "certification",
      visible: isAuthenticated,
      label: "Certification",
      icon: Award,
      content: (
        <SidebarMenu className={menuListClass}>
          {certificationItems.map((item) => (
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
=======
  const menus = isAdmin() ? adminMenus : userMenus;
>>>>>>> d4d22aa (Redesign histori-minum-obat with professional UI and fix patient query to show all medication patients)

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r bg-sidebar"
    >
      <SidebarHeader className="py-3 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md h-10">
              <Link href="/" onClick={handleMenuClick} className="flex items-center gap-2.5">
                <Image src="/logo.svg" alt="logo" width={24} height={24} className="flex-shrink-0" />
                <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">Sehat Bersama</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      
      <SidebarContent className="px-2">
        {isAuthenticated && (
          <SidebarMenu className="space-y-0.5">
            {menus.map((menu) => (
              <SidebarMenuItem key={menu.path}>
                <SidebarMenuButton asChild>
                  <Link
                    href={menu.path}
                    onClick={handleMenuClick}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group-data-[collapsible=icon]:justify-center"
                  >
                    <menu.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{menu.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors h-auto">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage 
                          src={(user?.photoPath || user?.avatarUrl) ? imageAPI.getImageUrl(user?.photoPath || user?.avatarUrl || '') :
                               (user?.biografi?.foto ? imageAPI.getImageUrl(user.biografi.foto) : 
                                user?.biografi?.fotoProfil ? imageAPI.getImageUrl(user.biografi.fotoProfil) : undefined)} 
                          alt={user?.fullName}
                        />
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
                        <div className="font-medium text-xs truncate">{user?.fullName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{user?.role?.roleName || 'USER'}</div>
                      </div>
                    </div>
                    <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton asChild className="p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <Link href="/login" onClick={handleMenuClick} className="flex items-center gap-2.5">
                  <LogIn className="h-4 w-4 flex-shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Masuk</span>
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
