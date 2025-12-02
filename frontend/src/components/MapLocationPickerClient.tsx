"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "next-themes";
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

interface MapLocationPickerClientProps {
  selectedLocation: {lat: number; lng: number} | null;
  currentLocation: {lat: number; lng: number} | null;
  onMapClick: (lat: number, lng: number) => void;
}

// Component to handle map clicks
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

// Component to update map view when location changes
function MapController({ location }: { location: {lat: number; lng: number} | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 15, {
        animate: true,
        duration: 1
      });
    }
  }, [map, location]);

  return null;
}

export default function MapLocationPickerClient({
  selectedLocation,
  currentLocation,
  onMapClick
}: MapLocationPickerClientProps) {
  const { theme } = useTheme();
  const { isMobile, isSmallMobile } = useMobileDetection();
  const mapRef = useRef<L.Map | null>(null);

  // Custom marker icons with mobile-responsive design
  const createCustomIcon = (color: string, isSelected: boolean = false) => {
    // Responsive sizing based on screen size
    const iconSize = isSmallMobile ? 28 : isMobile ? 32 : isSelected ? 30 : 22;
    const borderWidth = 2;
    const innerSize = iconSize - (borderWidth * 2) - 4;
    
    const iconHtml = `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${color};
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
        touch-action: manipulation;
      ">
        <div style="
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 50%;
          background: ${color};
        "></div>
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-location-marker',
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2],
    });
  };

  // Choose tile layer based on theme
  const getTileLayer = () => {
    if (theme === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      };
    }
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };
  };

  const tileLayer = getTileLayer();

  // Default center (Indonesia)
  const defaultCenter: [number, number] = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng]
    : currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : [-6.2088, 106.8456]; // Jakarta

  const defaultZoom = selectedLocation || currentLocation ? 15 : 10;

  // Get responsive map height
  const getMapHeight = () => {
    if (isSmallMobile) return '300px';
    if (isMobile) return '350px';
    return '400px';
  };

  return (
    <div className="relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: getMapHeight(), width: '100%' }}
        className="rounded-lg"
        ref={mapRef}
        zoomControl={!isMobile} // Hide zoom control on mobile, use pinch to zoom
        touchZoom={true}
        dragging={true}
        scrollWheelZoom={!isMobile} // Disable scroll wheel zoom on mobile
      >
        <TileLayer
          url={tileLayer.url}
          attribution=""
        />
        
        <MapClickHandler onMapClick={onMapClick} />
        <MapController location={selectedLocation || currentLocation} />
        
        {/* Current location marker (blue) */}
        {currentLocation && (
          <Marker
            position={[currentLocation.lat, currentLocation.lng]}
            icon={createCustomIcon('#3b82f6', false)}
          />
        )}
        
        {/* Selected location marker (red) */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('#ef4444', true)}
          />
        )}
      </MapContainer>
      
      <style jsx global>{`
        .custom-location-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-container {
          cursor: crosshair !important;
        }
        
        .leaflet-control-zoom a {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        
        .leaflet-control-zoom a:hover {
          background-color: hsl(var(--accent)) !important;
        }
        
        /* Hide Leaflet attribution */
        .leaflet-control-attribution {
          display: none !important;
        }

        /* Mobile-specific improvements for location markers */
        @media (max-width: 768px) {
          .custom-location-marker {
            transform-origin: center center;
            min-width: 32px !important;
            min-height: 32px !important;
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
        }
        
        /* Extra small mobile screens */
        @media (max-width: 480px) {
          .custom-location-marker {
            min-width: 28px !important;
            min-height: 28px !important;
          }
          
          .leaflet-touch .leaflet-control-zoom-in, 
          .leaflet-touch .leaflet-control-zoom-out {
            width: 28px !important;
            height: 28px !important;
            font-size: 16px !important;
            line-height: 26px !important;
          }
        }
      `}</style>
    </div>
  );
}
