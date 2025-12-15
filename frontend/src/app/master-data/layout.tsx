"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function MasterDataLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR", "USER"]}>
      {children}
    </ProtectedRoute>
  );
}
