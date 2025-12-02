"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";
import { imageAPI } from "@/lib/api";
import { useMobileDetection } from "@/hooks/useMobileDetection";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png', // Use local icons
  iconUrl: '/images/marker-icon.png', // Use local icons
  shadowUrl: '/images/marker-shadow.png', // Use local icons
});

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

// Component to handle map center changes
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

// Custom marker component for alumni
function AlumniMarker({ alumni, onAlumniClick }: { alumni: AlumniLocation; onAlumniClick: (biografiId: number) => void }) {
  const { theme } = useTheme();
  const { isMobile, isSmallMobile } = useMobileDetection();

  const createCustomIcon = (imageUrl?: string) => {
    // Responsive icon size based on screen size
    const iconSize = isSmallMobile ? 32 : isMobile ? 36 : 50;
    const borderWidth = isMobile ? 2 : 3;
    const fontSize = isSmallMobile ? 10 : isMobile ? 12 : 16;
    
    console.log('Creating icon for:', alumni.namaLengkap, 'with imageUrl:', imageUrl);
    
    const iconHtml = `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        border: ${borderWidth}px solid #3b82f6;
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
               alt="${alumni.namaLengkap}"
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: ${fontSize}px;
            border-radius: 50%;
          ">
            ${alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        ` : `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: bold;
            font-size: ${fontSize}px;
            border-radius: 50%;
          ">
            ${alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        `}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-alumni-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
      popupAnchor: [0, -iconSize / 2],
    });
  };  const getProfileImage = () => {
    const photoFilename = alumni.fotoProfil || alumni.foto;
    console.log('Alumni photo data:', { 
      biografiId: alumni.biografiId, 
      namaLengkap: alumni.namaLengkap,
      fotoProfil: alumni.fotoProfil, 
      foto: alumni.foto,
      photoFilename,
      fullUrl: photoFilename ? imageAPI.getImageUrl(photoFilename) : 'No photo'
    });
    return photoFilename ? imageAPI.getImageUrl(photoFilename) : undefined;
  };

  return (
    <Marker
      position={[alumni.latitude, alumni.longitude]}
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
                <AvatarImage src={getProfileImage()} alt={alumni.namaLengkap} />
                <AvatarFallback className={isSmallMobile ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'}>
                  {alumni.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${isSmallMobile ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} truncate leading-tight`}>
                  {alumni.namaLengkap}
                </h4>
                <p className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground leading-tight`}>
                  Alumni {alumni.alumniTahun}
                </p>
                
                {alumni.jurusan && (
                  <div className={`flex items-center space-x-1 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                    <GraduationCap className={`${isSmallMobile ? 'h-2 w-2' : isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-muted-foreground flex-shrink-0`} />
                    <span className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate leading-tight`}>
                      {alumni.jurusan}
                    </span>
                  </div>
                )}
                
                <div className={`flex items-center space-x-1 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                  <MapPin className={`${isSmallMobile ? 'h-2 w-2' : isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-muted-foreground flex-shrink-0`} />
                  <span className={`${isSmallMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate leading-tight`}>
                    {alumni.alamat || 
                     `${alumni.kelurahan || ''} ${alumni.kecamatan || ''} ${alumni.kota || ''} ${alumni.provinsi || ''}`.trim().replace(/\s+/g, ', ') ||
                     'Lokasi tidak tersedia'}
                  </span>
                </div>
                
                <Button
                  size={isMobile ? "sm" : "sm"}
                  className={`${isSmallMobile ? 'mt-1 h-6 text-xs px-2' : isMobile ? 'mt-1.5 h-6 text-xs px-2' : 'mt-2 h-7 text-xs'} touch-manipulation`}
                  onClick={() => onAlumniClick(alumni.biografiId)}
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

export default function AlumniMap({ locations, center, zoom, onAlumniClick }: AlumniMapProps) {
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
        zoomControl={!isMobile} // Hide zoom control on mobile, use pinch to zoom
        touchZoom={true}
        dragging={true}
        scrollWheelZoom={!isMobile} // Disable scroll wheel zoom on mobile
      >
        <TileLayer
          url={tileLayer.url}
          attribution={tileLayer.attribution}
        />
        
        <MapController center={center} zoom={zoom} />
        
        {locations.map((alumni) => (
          <AlumniMarker
            key={alumni.biografiId}
            alumni={alumni}
            onAlumniClick={onAlumniClick}
          />
        ))}
      </MapContainer>
      
      {/* Legend - Responsive positioning */}
      <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-[1000] ${isMobile ? 'max-w-[140px]' : ''}`}>
        <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className={isMobile ? 'p-2' : 'p-3'}>
            <div className={`flex items-center space-x-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-primary flex-shrink-0`}></div>
              <span className="text-muted-foreground truncate">
                {isMobile ? 'Member' : 'Lokasi Member'}
              </span>
            </div>
            <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1 truncate`}>
              {locations.length} {isMobile ? 'data' : 'member ditemukan'}
            </div>
          </CardContent>
        </Card>
      </div>
        <style jsx global>{`
        .custom-alumni-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-alumni-marker:hover {
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
          
          .custom-alumni-marker {
            transform-origin: center center;
          }
          
          /* Better touch targets for mobile */
          .leaflet-touch .leaflet-control-layers, 
          .leaflet-touch .leaflet-bar {
            border: 2px solid rgba(0,0,0,0.2);
            background-clip: padding-box;
          }
          
          /* Mobile-optimized zoom controls */
          .leaflet-touch .leaflet-control-zoom-in, 
          .leaflet-touch .leaflet-control-zoom-out {
            font-size: 18px !important;
            line-height: 30px !important;
            width: 32px !important;
            height: 32px !important;
          }
          
          /* Ensure markers are easily tappable */
          .custom-alumni-marker {
            min-width: 36px !important;
            min-height: 36px !important;
          }
          
          /* Touch-friendly popup interactions */
          .leaflet-popup {
            touch-action: manipulation;
          }
          
          .leaflet-popup-content {
            touch-action: manipulation;
          }
          
          /* Prevent text selection on touch */
          .leaflet-popup-content * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Allow text selection only in specific areas */
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
          
          .custom-alumni-marker {
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
          
          .custom-alumni-marker {
            min-width: 28px !important;
            min-height: 28px !important;
          }
        }
      `}</style>
    </div>
  );
}
