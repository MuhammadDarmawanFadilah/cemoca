"use client";

import { usePathname } from "next/navigation";
import ClientSidebarWrapper from "@/components/ClientSidebarWrapper";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAProvider } from "@/components/pwa/PWAComponents";
import NetworkInitializer from "@/components/NetworkInitializer";

interface ConditionalAppLayoutProps {
  children: React.ReactNode;
  defaultOpen: boolean;
}

// Routes that should have NO app UI (navbar, sidebar)
const publicVideoRoutes = ["/v", "/p"];

// Routes that should keep header but hide sidebar
const noSidebarRoutes = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/register",
  "/register/invitation",
  "/register/public",
];

export default function ConditionalAppLayout({ 
  children, 
  defaultOpen 
}: ConditionalAppLayoutProps) {
  const pathname = usePathname();
  
  // Check if current route should bypass the app layout
  const isPublicVideoRoute = pathname === "/v" || pathname?.startsWith("/v/");
  const isPublicPdfRoute = pathname === "/p" || pathname?.startsWith("/p/");

  // For public video routes, render children without any app UI (black bg)
  if (isPublicVideoRoute) {
    return (
      <div className="min-h-screen bg-black">
        {children}
      </div>
    );
  }

  // For public PDF routes, render children without any app UI (white bg, no wrapper)
  if (isPublicPdfRoute) {
    return <>{children}</>;
  }

  const shouldHideSidebar = !!pathname && noSidebarRoutes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // For all other routes, render the full app layout
  return (
    <AuthProvider>
      <PWAProvider>
        <NetworkInitializer />
        <SidebarProvider defaultOpen={defaultOpen}>
          {!shouldHideSidebar && <ClientSidebarWrapper />}
          <main className="flex-1 min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="w-full">{children}</div>
          </main>
        </SidebarProvider>
      </PWAProvider>
    </AuthProvider>
  );
}
