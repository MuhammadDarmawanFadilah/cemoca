import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifikasi Member - Koperasi Desa',
  description: 'Halaman verifikasi keanggotaan resmi Koperasi Desa',
};

export default function VerifyMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}