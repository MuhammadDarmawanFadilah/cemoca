import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Video | CAMOCA",
  description: "Generate AI video dengan HeyGen untuk personal notification",
};

export default function ReportVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
