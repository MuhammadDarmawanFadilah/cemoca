// Migration utility to handle old plain ID URLs and redirect to encoded ones
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { encodeId, isEncodedId } from "./crypto-utils";

export function useMigrateToEncodedIds() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    
    // Check if current path uses old format (plain number ID)
    const alumniCardMatch = pathname.match(/^\/alumni-card\/(\d+)$/);
    const publicBiografiMatch = pathname.match(/^\/public-biografi\/(\d+)$/);

    if (alumniCardMatch) {
      const plainId = alumniCardMatch[1];
      if (!isEncodedId(plainId)) {
        const encodedId = encodeId(parseInt(plainId));
        router.replace(`/alumni-card/${encodedId}`);
      }
    } else if (publicBiografiMatch) {
      const plainId = publicBiografiMatch[1];
      if (!isEncodedId(plainId)) {
        const encodedId = encodeId(parseInt(plainId));
        router.replace(`/public-biografi/${encodedId}`);
      }
    }
  }, [pathname, router]);
}

// Higher-order component to wrap pages that need ID migration
export function withIdMigration<T extends object>(Component: React.ComponentType<T>) {
  return function MigratedComponent(props: T) {
    useMigrateToEncodedIds();
    return <Component {...props} />;
  };
}
