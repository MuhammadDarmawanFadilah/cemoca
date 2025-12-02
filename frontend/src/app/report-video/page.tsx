"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportVideoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/report-video/personal-sales");
  }, [router]);

  return null;
}
