"use client";

import {
  LogOut,
  Moon,
  Sun,
  User,
  LogIn,
  Key,
  Home,
  FileText,
  Users,
  Stethoscope,
  MessageCircle,
  Download,
  Globe,
  Check,
  Bell,
  Clock,
  Newspaper,
  History,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePWAInstall } from "@/hooks/usePWA";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { imageAPI } from "@/lib/api";
import { SupportedLocale } from "@/lib/i18n";

const Navbar = () => {
  const { setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { locale, setLocale, t, localeNames, localeFlags, supportedLocales } =
    useLanguage();
  const { isInstallable, install } = usePWAInstall();
  const pathname = usePathname() || "";

  const hideSidebarTrigger = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/register",
  ].some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ─── Page title resolver ────────────────────────────
  const getPageInfo = (): { title: string; icon: React.ElementType } => {
    const routes: { match: string; title: string; icon: React.ElementType }[] = [
      { match: "/sehat/dashboard", title: "Dashboard", icon: Home },
      { match: "/sehat/administrasi-profil", title: "Manajemen Pengguna", icon: Users },
      { match: "/sehat/histori-minum-obat", title: "Histori Minum Obat", icon: History },
      { match: "/sehat/konsultasi", title: "Konsultasi", icon: MessageCircle },
      { match: "/sehat/berita", title: "Informasi Berita", icon: Newspaper },
      { match: "/sehat/eso", title: "Informasi ESO", icon: FileText },
      { match: "/sehat/histori-pengingat", title: "Histori Pengingat", icon: Clock },
      { match: "/sehat/pengingat-minum-obat", title: "Pengingat Minum Obat", icon: Bell },
      { match: "/sehat/profil-pasien", title: "Profil Pasien", icon: Stethoscope },
      { match: "/reset-password", title: "Ubah Password", icon: Key },
      { match: "/login", title: "Masuk", icon: LogIn },
    ];
    const found = routes.find((r) => pathname.startsWith(r.match));
    if (found) return { title: found.title, icon: found.icon };

    // Fallback: extract from path
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      const title = segments[segments.length - 1]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return { title, icon: FileText };
    }
    return { title: "Dashboard", icon: Home };
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <nav className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 border-b px-3 py-2.5 md:px-4 md:py-3">
      {/* LEFT */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {!hideSidebarTrigger && <SidebarTrigger className="shrink-0" />}
        <div className="flex items-center gap-2 text-sm font-medium truncate">
          <PageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{pageInfo.title}</span>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Language */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Globe className="h-4 w-4" />
                <span className="sr-only">{t("settings.language")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {supportedLocales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc as SupportedLocale)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{localeFlags[loc as SupportedLocale]}</span>
                    <span>{localeNames[loc as SupportedLocale]}</span>
                  </span>
                  {locale === loc && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* PWA Install - only show when installable */}
        {isInstallable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => install?.()}
            title="Install App"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}

        {/* Theme */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">{t("nav.toggleTheme")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                {t("nav.light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                {t("nav.dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                {t("nav.system")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User menu */}
        {isAuthenticated && mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={(user?.photoPath || user?.avatarUrl) ? imageAPI.getImageUrl(user?.photoPath || user?.avatarUrl || '') : undefined}
                    alt={user?.fullName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={8} align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.role?.roleName || "USER"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/reset-password">
                  <Key className="mr-2 h-4 w-4" />
                  {t("nav.changePassword")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">{t("nav.login")}</span>
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
