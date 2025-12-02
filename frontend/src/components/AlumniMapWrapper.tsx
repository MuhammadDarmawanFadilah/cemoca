"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface AlumniLocation {
  biografiId: number;
  namaLengkap: string;
  alumniTahun: string;
  jurusan: string;
  latitude: number;
  longitude: number;
  fotoProfil?: string;
  foto?: string;
  kota: string;
  provinsi: string;
  kecamatan: string;
  kelurahan: string;
  kodePos: string;
  alamat: string;
}

interface AlumniMapProps {
  locations: AlumniLocation[];
  center: [number, number];
  zoom: number;
  onAlumniClick: (biografiId: number) => void;
}

// Dynamically import the map component to avoid SSR issues
const DynamicAlumniMap = dynamic(() => import('./AlumniMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full">
      <Skeleton className="h-full w-full rounded-b-lg" />
    </div>
  ),
});

export default function AlumniMap(props: AlumniMapProps) {
  return <DynamicAlumniMap {...props} />;
}
