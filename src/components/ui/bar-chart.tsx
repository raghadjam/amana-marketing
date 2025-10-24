export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  data: BarChartDataPoint[];
  className?: string;
  height?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export function BarChart({ 
  title, 
  data, 
  className = "", 
  height = 300,
  showValues = true,
  formatValue = (value) => value.toLocaleString()
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="flex items-end justify-between h-full gap-2">
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 60) : 0;
            const color = item.color || colors[index % colors.length];
            
            return (
              <div key={item.label} className="flex flex-col items-center flex-1 min-w-0">
                {/* Value label on top */}
                {showValues && (
                  <div className="text-xs text-gray-300 mb-2 text-center">
                    {formatValue(item.value)}
                  </div>
                )}
                
                {/* Bar */}
                <div className="relative w-full flex justify-center">
                  <div
                    className="w-full max-w-16 rounded-t transition-all duration-300 hover:opacity-80"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: color,
                      minHeight: item.value > 0 ? '4px' : '0px'
                    }}
                  />
                </div>
                
                {/* Label */}
                <div className="text-xs text-gray-400 mt-2 text-center break-words">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y-axis reference lines */}
        <div className="absolute inset-0 pointer-events-none">
          {[0.25, 0.5, 0.75].map((ratio) => (
            <div
              key={ratio}
              className="absolute w-full border-t border-gray-700 opacity-30"
              style={{ bottom: `${60 + ratio * (height - 60)}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
