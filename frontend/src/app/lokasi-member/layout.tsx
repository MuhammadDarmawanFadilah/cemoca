import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lokasi Member - Koperasi Desa',
  description: 'Peta sebaran lokasi member Koperasi Desa',
};

export default function LokasiMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
