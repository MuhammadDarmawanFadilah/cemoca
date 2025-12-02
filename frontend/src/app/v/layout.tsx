import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video - CAMOCA",
  description: "Video personal dari CAMOCA",
};

export default function VideoViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally returns only children
  // The page itself handles full-screen black background
  return <>{children}</>;
}
