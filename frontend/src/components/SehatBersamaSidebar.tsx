"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
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
} from "lucide-react";

export default function SehatBersamaSidebar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const adminMenus = [
    { name: "Dashboard", path: "/sehat/dashboard", icon: Home },
    { name: "Pendaftaran", path: "/sehat/pendaftaran", icon: UserPlus },
    { name: "Histori Minum Obat", path: "/sehat/histori-minum-obat", icon: History },
    { name: "Konsultasi", path: "/sehat/konsultasi", icon: MessageCircle },
    { name: "Informasi Berita", path: "/sehat/berita", icon: Newspaper },
    { name: "Informasi ESO", path: "/sehat/eso", icon: FileText },
    { name: "Administrasi Profil", path: "/sehat/administrasi-profil", icon: Users },
    { name: "Histori Pengingat", path: "/sehat/histori-pengingat", icon: Clock },
  ];

  const userMenus = [
    { name: "Dashboard", path: "/sehat/dashboard", icon: Home },
    { name: "Pengingat Minum Obat", path: "/sehat/pengingat-minum-obat", icon: Bell },
    { name: "Konsultasi", path: "/sehat/konsultasi", icon: MessageCircle },
    { name: "Informasi Berita", path: "/sehat/berita", icon: Newspaper },
    { name: "Informasi ESO", path: "/sehat/eso", icon: FileText },
    { name: "Profil Pasien", path: "/sehat/profil-pasien", icon: User },
  ];

  const menus = isAdmin() ? adminMenus : userMenus;

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-primary">Sehat Bersama</h1>
        <p className="text-sm text-muted-foreground">
          {user?.fullName || user?.username}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menus.map((menu) => (
            <li key={menu.path}>
              <Link
                href={menu.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(menu.path)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <menu.icon className="h-4 w-4" />
                <span>{menu.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
