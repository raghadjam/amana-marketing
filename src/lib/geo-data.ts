// src/lib/geo-data.ts

export interface GeoPosition {
    lat: number;
    lon: number;
    color: string;
}

export const REGION_COORDINATES: Record<string, GeoPosition> = {
    // === GCC REGIONS (Primary Focus) ===
    'Abu Dhabi': { lat: 24.466667, lon: 54.366669, color: '#f87171' }, // UAE
    'Dubai': { lat: 25.276987, lon: 55.296249, color: '#f87171' },     // UAE
    'Sharjah': { lat: 25.357125, lon: 55.405167, color: '#f87171' },   // UAE
    'Riyadh': { lat: 24.713552, lon: 46.675296, color: '#f87171' },    // Saudi Arabia
    'Doha': { lat: 25.2854, lon: 51.5310, color: '#f87171' },          // Qatar
    'Kuwait City': { lat: 29.3759, lon: 47.9774, color: '#f87171' },   // Kuwait
    'Manama': { lat: 26.2285, lon: 50.5860, color: '#f87171' },        // Bahrain
    
    // === Other Regions (Kept for completeness/future data) ===
    'New York': { lat: 40.712776, lon: -74.005974, color: '#4ade80' },   
    'California': { lat: 36.778259, lon: -119.417931, color: '#4ade80' }, 
    'Toronto': { lat: 43.6532, lon: -79.3832, color: '#4ade80' },
    'London': { lat: 51.507351, lon: -0.127758, color: '#fbbf24' },     
    'Paris': { lat: 48.856613, lon: 2.352222, color: '#fbbf24' },      
    'Berlin': { lat: 52.520008, lon: 13.404954, color: '#fbbf24' },
    'Singapore': { lat: 1.352083, lon: 103.819836, color: '#60a5fa' },  
    'Tokyo': { lat: 35.689487, lon: 139.691711, color: '#60a5fa' },
    'Cairo': { lat: 30.033333, lon: 31.233334, color: '#a78bfa' },
};

export function getCoordinates(region: string): GeoPosition {
    // Return a default position [0, 0] and a fallback color for regions not found
    return REGION_COORDINATES[region] || { lat: 0, lon: 0, color: '#94a3b8' };
}