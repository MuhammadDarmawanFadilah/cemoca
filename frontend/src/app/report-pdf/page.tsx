"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportPdfPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/report-pdf/personal-letter");
  }, [router]);

  return null;
}
