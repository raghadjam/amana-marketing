// src/components/ui/bubble-map.tsx

"use client";
import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import { Globe } from 'lucide-react';

export interface BubbleMapDataPoint {
  region: string;
  country: string;
  value: number; // Metric driving bubble size
  color: string;
  latitude: number;  // NEW: Real latitude
  longitude: number; // NEW: Real longitude
}

export interface BubbleMapProps {
  title: string;
  data: BubbleMapDataPoint[];
  formatValue: (value: number) => string;
  className?: string;
}

export function BubbleMap({ 
  title, 
  data, 
  formatValue, 
  className = "" 
}: BubbleMapProps) {
  
  if (!data || data.length === 0) {
    // ... (Loading state/No data message remains the same)
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-96 text-gray-400">
          <Globe className="w-5 h-5 mr-2"/> No regional data available to plot.
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  const getRadius = (value: number) => {
    const minRadius = 5;
    const maxRadius = 25;
    return minRadius + (value / maxValue) * (maxRadius - minRadius); 
  };
  
  const initialCenter: [number, number] = [30, 0];
  const initialZoom = 2; 

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5" />
        {title}
      </h3>
      
      <div className="w-full rounded-md overflow-hidden" style={{ height: '400px' }}>
        <MapContainer 
          center={initialCenter} 
          zoom={initialZoom} 
          scrollWheelZoom={true}
          className="h-full z-0" 
        >
          {/* TileLayer is essential for the map visuals and must be inside MapContainer */}
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />

          {/* Plotting Data Points as Circle Markers */}
          {data.map((point) => (
            <CircleMarker
              key={point.region}
              center={[point.latitude, point.longitude]}
              radius={getRadius(point.value)}
              pathOptions={{ 
                color: point.color, 
                fillColor: point.color, 
                fillOpacity: 0.6, 
                weight: 1.5 
              }}
            >
              <Popup>
                <div className="text-sm font-semibold">
                  {point.region}, {point.country}
                </div>
                <div className="text-xs mt-1">
                  Value: <span className="font-bold">{formatValue(point.value)}</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Bubble size corresponds to the relative metric value. Map is zoomable and draggable.
      </p>
    </div>
  );
}