"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import { imageAPI } from "@/lib/api";
import { useMobileDetection } from "@/hooks/useMobileDetection";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface MemberLocation {
  id: number;
  nama: string;
  telepon: string;
  email: string;
  latitude: number;
  longitude: number;
  foto?: string;
  kota?: string;
  provinsi?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  alamat?: string;
  pekerjaan?: string;
  status?: 'AKTIF' | 'NONAKTIF';
  tingkatPrioritas?: 'TINGGI' | 'MENENGAH' | 'RENDAH';
  poin?: number;
  createdAt?: string;
}

interface MemberMapProps {
  locations: MemberLocation[];
  center: [number, number];
  zoom: number;
  onMemberClick: (memberId: number) => void;
}

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

// Custom marker component for members
function MemberMarker({ member, onMemberClick }: { member: MemberLocation; onMemberClick: (memberId: number) => void }) {
  const { theme } = useTheme();
  const { isMobile, isSmallMobile } = useMobileDetection();

  const createCustomIcon = (imageUrl?: string) => {
    // Responsive icon size based on screen size
    const iconSize = isSmallMobile ? 32 : isMobile ? 36 : 50;
    const borderWidth = isMobile ? 2 : 3;
    const fontSize = isSmallMobile ? 10 : isMobile ? 12 : 16;
    
    // Color based on member status
    const borderColor = member.status === 'AKTIF' ? '#10b981' : '#f59e0b';
    
    console.log('Creating icon for:', member.nama, 'with imageUrl:', imageUrl);
    
    const iconHtml = `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${borderColor};
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 ${isMobile ? 2 : 4}px ${isMobile ? 8 : 12}px rgba(0,0,0,0.4);
        overflow: hidden;
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
        touch-action: manipulation;
      " ontouchstart="this.style.transform='scale(1.1)'" ontouchend="this.style.transform='scale(1)'" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ${imageUrl && imageUrl !== '' ? `
          <img src="${imageUrl}" 
               style="
                 width: 100%; 
                 height: 100%; 
                 object-fit: cover; 
                 border-radius: 50%;
                 display: block;
               " 
               alt="${member.nama}"
               onload="console.log('Image loaded successfully:', '${imageUrl}')"
               onerror="console.log('Image failed to load:', '${imageUrl}'); this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-weight: bold;
            font-size: ${fontSize}px;
            border-radius: 50%;
          ">
            ${member.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        ` : `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-weight: bold;
            font-size: ${fontSize}px;
            border-radius: 50%;
          ">
            ${member.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        `}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-member-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2],
    });
  };

  const getProfileImage = () => {
    const photoFilename = member.foto;
    console.log('Member photo data:', { 
      id: member.id, 
      nama: member.nama,
      foto: member.foto,
      photoFilename,
      fullUrl: photoFilename ? imageAPI.getImageUrl(photoFilename) : 'No photo'
    });
    return photoFilename ? imageAPI.getImageUrl(photoFilename) : undefined;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'AKTIF':
        return { label: 'Aktif', color: 'text-green-600', bg: 'bg-green-100' };
      case 'NONAKTIF':
        return { label: 'Non Aktif', color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { label: 'N/A', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'TINGGI':
        return { label: 'Tinggi', color: 'text-red-600', bg: 'bg-red-100' };
      case 'MENENGAH':
        return { label: 'Menengah', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'RENDAH':
        return { label: 'Rendah', color: 'text-gray-600', bg: 'bg-gray-100' };
      default:
        return { label: 'N/A', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const statusBadge = getStatusBadge(member.status);
  const priorityBadge = getPriorityBadge(member.tingkatPrioritas);

  return (
    <Marker
      position={[member.latitude, member.longitude]}
      icon={createCustomIcon(getProfileImage())}
    >
      <Popup 
        className="custom-popup" 
        maxWidth={isSmallMobile ? 260 : isMobile ? 280 : 300}
        minWidth={isSmallMobile ? 230 : isMobile ? 250 : 300}
        closeOnEscapeKey={true}
        closeOnClick={false}
      >
        <Card className="border-0 shadow-none">
          <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
            <div className={`flex items-start space-x-${isMobile ? '2' : '3'}`}>
              <Avatar className={`${isSmallMobile ? 'h-8 w-8' : isMobile ? 'h-10 w-10' : 'h-12 w-12'} flex-shrink-0`}>
                <AvatarImage src={getProfileImage()} alt={member.nama} />
                <AvatarFallback className={`${isSmallMobile ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} bg-green-100 text-green-800`}>
                  {member.nama.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${isSmallMobile ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} truncate leading-tight`}>
                  {member.nama}
                </h4>
                <p className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground leading-tight`}>
                  Member Koperasi Desa
                </p>
                
                {/* Status and Priority Badges */}
                <div className={`flex gap-1 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                  <span className={`${statusBadge.bg} ${statusBadge.color} px-1 py-0.5 rounded text-xs font-medium`}>
                    {statusBadge.label}
                  </span>
                  <span className={`${priorityBadge.bg} ${priorityBadge.color} px-1 py-0.5 rounded text-xs font-medium`}>
                    {priorityBadge.label}
                  </span>
                </div>

                {member.pekerjaan && (
                  <div className={`flex items-center space-x-1 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                    <CreditCard className={`${isSmallMobile ? 'h-2 w-2' : isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-muted-foreground flex-shrink-0`} />
                    <span className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate leading-tight`}>
                      {member.pekerjaan}
                    </span>
                  </div>
                )}
                
                <div className={`flex items-center space-x-1 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                  <MapPin className={`${isSmallMobile ? 'h-2 w-2' : isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-muted-foreground flex-shrink-0`} />
                  <span className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate leading-tight`}>
                    {member.alamat || 
                     `${member.kelurahan || ''} ${member.kecamatan || ''} ${member.kota || ''} ${member.provinsi || ''}`.trim().replace(/\s+/g, ', ') ||
                     'Lokasi tidak tersedia'}
                  </span>
                </div>

                {/* Poin and Join Date */}
                <div className={`text-xs text-muted-foreground ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                  <span>Poin: {member.poin || 0}</span>
                  {member.createdAt && (
                    <span className="ml-2">Bergabung: {formatJoinDate(member.createdAt)}</span>
                  )}
                </div>
                
                <Button
                  size={isMobile ? "sm" : "sm"}
                  className={`${isSmallMobile ? 'mt-1 h-6 text-xs px-2' : isMobile ? 'mt-1.5 h-6 text-xs px-2' : 'mt-2 h-7 text-xs'} touch-manipulation bg-green-600 hover:bg-green-700`}
                  onClick={() => onMemberClick(member.id)}
                >
                  <User className={`${isSmallMobile ? 'h-2 w-2' : isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} mr-1`} />
                  {isSmallMobile ? 'Detail' : isMobile ? 'Detail' : 'Lihat Detail'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </Popup>
    </Marker>
  );
}

export default function MemberMap({ locations, center, zoom, onMemberClick }: MemberMapProps) {
  const { theme } = useTheme();
  const { isMobile, isSmallMobile, isLandscape } = useMobileDetection();

  // Choose tile layer based on theme
  const getTileLayer = () => {
    if (theme === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: ''
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: ''
    };
  };

  const tileLayer = getTileLayer();

  // Adjust map height based on device and orientation
  const getMapHeight = () => {
    if (isSmallMobile && isLandscape) return 'h-[300px]';
    if (isSmallMobile) return 'h-[350px]';
    if (isMobile && isLandscape) return 'h-[350px]';
    if (isMobile) return 'h-[400px]';
    return 'h-[600px]';
  };

  return (
    <div className={`relative ${getMapHeight()} w-full`}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-b-lg"
        zoomControl={!isMobile}
        touchZoom={true}
        dragging={true}
        scrollWheelZoom={!isMobile}
      >
        <TileLayer
          url={tileLayer.url}
          attribution={tileLayer.attribution}
        />
        
        <MapController center={center} zoom={zoom} />
        
        {locations.map((member) => (
          <MemberMarker
            key={member.id}
            member={member}
            onMemberClick={onMemberClick}
          />
        ))}
      </MapContainer>
      
      {/* Legend - Responsive positioning */}
      <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-[1000] ${isMobile ? 'max-w-[140px]' : ''}`}>
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className={isMobile ? 'p-2' : 'p-3'}>
            <div className={`flex items-center space-x-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-green-600 flex-shrink-0`}></div>
              <span className="text-muted-foreground truncate">
                {isMobile ? 'Member' : 'Lokasi Member'}
              </span>
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1 truncate`}>
              {locations.length} {isMobile ? 'data' : 'member ditemukan'}
            </div>
            <div className={`flex items-center gap-1 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <div className="w-2 h-2 rounded-full bg-green-500 border border-green-600"></div>
              <span className="text-muted-foreground">Aktif</span>
              <div className="w-2 h-2 rounded-full bg-orange-500 border border-orange-600 ml-1"></div>
              <span className="text-muted-foreground">Non Aktif</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .custom-member-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-member-marker:hover {
          z-index: 1000 !important;
        }
        
        .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        
        .leaflet-popup-tip {
          background: white;
        }
        
        .dark .leaflet-popup-tip {
          background: hsl(var(--background));
        }
        
        .leaflet-popup-close-button {
          color: hsl(var(--muted-foreground)) !important;
          right: 8px !important;
          top: 8px !important;
          width: 20px !important;
          height: 20px !important;
          font-size: 16px !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--accent)) !important;
        }
        
        /* Hide Leaflet attribution */
        .leaflet-control-attribution {
          display: none !important;
        }
        
        /* Mobile-specific improvements */
        @media (max-width: 768px) {
          .leaflet-popup-content-wrapper {
            max-width: 280px !important;
            min-width: 250px !important;
          }
          
          .leaflet-popup-close-button {
            right: 4px !important;
            top: 4px !important;
            width: 28px !important;
            height: 28px !important;
            font-size: 20px !important;
            line-height: 28px !important;
            background: rgba(0,0,0,0.1) !important;
            border-radius: 50% !important;
            touch-action: manipulation !important;
          }
          
          .leaflet-container {
            font-size: 12px;
          }
          
          .custom-member-marker {
            transform-origin: center center;
          }
          
          .leaflet-touch .leaflet-control-layers, 
          .leaflet-touch .leaflet-bar {
            border: 2px solid rgba(0,0,0,0.2);
            background-clip: padding-box;
          }
          
          .leaflet-touch .leaflet-control-zoom-in, 
          .leaflet-touch .leaflet-control-zoom-out {
            font-size: 18px !important;
            line-height: 30px !important;
            width: 32px !important;
            height: 32px !important;
          }
          
          .custom-member-marker {
            min-width: 36px !important;
            min-height: 36px !important;
          }
          
          .leaflet-popup {
            touch-action: manipulation;
          }
          
          .leaflet-popup-content {
            touch-action: manipulation;
          }
          
          .leaflet-popup-content * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          .leaflet-popup-content h4,
          .leaflet-popup-content p,
          .leaflet-popup-content span {
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
            user-select: text;
          }
        }
        
        /* Extra small mobile screens */
        @media (max-width: 480px) {
          .leaflet-popup-content-wrapper {
            max-width: 260px !important;
            min-width: 230px !important;
          }
          
          .custom-member-marker {
            min-width: 32px !important;
            min-height: 32px !important;
          }
          
          .leaflet-touch .leaflet-control-zoom-in, 
          .leaflet-touch .leaflet-control-zoom-out {
            width: 28px !important;
            height: 28px !important;
            font-size: 16px !important;
            line-height: 26px !important;
          }
          
          .leaflet-popup-close-button {
            width: 24px !important;
            height: 24px !important;
            font-size: 16px !important;
            line-height: 24px !important;
          }
        }
        
        /* Landscape orientation optimizations */
        @media (max-width: 768px) and (orientation: landscape) {
          .leaflet-popup-content-wrapper {
            max-width: 240px !important;
            min-width: 220px !important;
          }
          
          .custom-member-marker {
            min-width: 28px !important;
            min-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
