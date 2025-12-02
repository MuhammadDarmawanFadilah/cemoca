import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Video | CAMOCA",
  description: "Generate AI video dengan D-ID untuk personal notification",
};

export default function ReportVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
