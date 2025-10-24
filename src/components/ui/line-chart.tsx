// src/components/ui/line-chart.tsx

"use client";
import React from 'react';

// Define the structure for a single line chart data point
export interface LineChartDataPoint {
  label: string; // The x-axis label (e.g., "Week 1", "2024-10-07")
  value: number; // The y-axis value (e.g., revenue or spend amount)
  tooltipLabel?: string; // Optional label for tooltips (e.g., actual date range)
}

export interface LineChartProps {
  title: string;
  data: LineChartDataPoint[];
  dataKey: keyof LineChartDataPoint; // The key to plot (always 'value' in our case)
  labelKey: keyof LineChartDataPoint; // The key for the x-axis label (always 'label' in our case)
  color: string;
  formatValue: (value: number) => string; // Function to format y-axis/tooltip value
  className?: string;
}

// NOTE: This is a simplified representation. In a real app, you would
// import actual chart components (LineChart, XAxis, YAxis, Tooltip, etc.) 
// from a library like Recharts or Nivo.

export function LineChart({ 
  title, 
  data, 
  color, 
  formatValue, 
  className = "" 
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No time series data available.
        </div>
      </div>
    );
  }

  // Find max value for scaling the simple visualization
  const maxValue = Math.max(...data.map(d => d.value)) || 1;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-64 relative">
        {/* Simple Y-Axis Label */}
        <div className="absolute top-0 left-0 text-xs text-gray-400">
          {formatValue(maxValue)}
        </div>
        <div className="absolute bottom-0 left-0 text-xs text-gray-400">
          {formatValue(0)}
        </div>

        {/* Placeholder for the chart area */}
        <div className="h-full w-full flex items-end justify-between px-6 pb-4">
          {data.map((point, index) => (
            <div 
              key={point.label} 
              className="flex flex-col items-center justify-end h-full relative"
              style={{ width: `${100 / data.length}%` }}
            >
              {/* Simple Data Point Visualization (like a mini bar chart) */}
              <div 
                className="w-1/2 rounded-t-sm transition-all duration-500 hover:opacity-100 opacity-80"
                style={{ 
                  height: `${(point.value / maxValue) * 90}%`, // 90% to leave room for labels
                  backgroundColor: color 
                }}
                title={`${point.tooltipLabel || point.label}: ${formatValue(point.value)}`}
              />
              
              {/* X-Axis Label */}
              <span className="absolute -bottom-4 text-[10px] text-gray-400 rotate-45 transform origin-top-left">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}