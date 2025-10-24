import { ArrowUp, ArrowDown, Monitor, Smartphone, TrendingUp } from 'lucide-react';
import React from 'react';
import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';

// --- UTILITY FUNCTIONS ---

const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
};

// --- CardMetric COMPONENT ---

interface CardMetricProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    color: string;
}

const CardMetric: React.FC<CardMetricProps> = ({ title, value, icon: Icon, description, color }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 flex flex-col justify-between h-full hover:bg-gray-700 transition-colors">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
            </div>
            <div className={`p-2 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-20`}>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">{description}</p>
    </div>
);

// --- BarChart COMPONENT ---

interface BarChartProps {
    data: Array<Record<string, number | string>>;
    keys?: string[];
    formatValue?: (value: number | undefined, metricKey: string) => string;
    height?: number;
    width?: string;
}

const BarChart: React.FC<BarChartProps> = ({ 
    data, 
    keys, 
    formatValue = (value, metricKey) => (value ?? 0).toLocaleString(), 
    height = 300, 
    width = 'w-full' 
}) => {
    if (!data || data.length === 0) {
        return <div className="text-center p-8 text-gray-500">No data available for the chart.</div>;
    }

    const chartKeys = keys || Object.keys(data[0]).filter(k => k !== 'metric');
    
    const maxValue = data.reduce((max, item) => 
        Math.max(max, ...chartKeys.map(key => Number(item[key] || 0))), 0);

    const keyColors = {
        Mobile: 'bg-blue-500',
        Desktop: 'bg-purple-500',
        Revenue: 'bg-green-500',
        Conversions: 'bg-yellow-500',
        'Total Spend': 'bg-red-500',
    };

    return (
        <div className={`space-y-4 p-4 ${width}`} style={{ height: height }}>
            <div className="flex justify-center space-x-4 mb-4">
                {chartKeys.map(key => (
                    <div key={key} className="flex items-center space-x-1">
                        <span className={`w-3 h-3 rounded-full ${keyColors[key as keyof typeof keyColors] || 'bg-gray-500'}`}></span>
                        <span className="text-sm text-gray-400">{key}</span>
                    </div>
                ))}
            </div>
            {data.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium text-gray-300 truncate">{item.metric}</div>
                    <div className="flex-1 space-y-1">
                        {chartKeys.map(key => {
                            const value = item[key] as (number | string | undefined);
                            const barValue = Number(value ?? 0);
                            const barWidth = maxValue > 0 ? (barValue / maxValue) * 100 : 0;
                            const colorClass = keyColors[key as keyof typeof keyColors] || 'bg-gray-500';
                            const formattedValue = typeof value === 'number' ? value : (value ? Number(value) : undefined);

                            return (
                                <div key={key} className="relative h-6 bg-gray-700 rounded-sm">
                                    <div 
                                        className={`absolute h-full rounded-sm transition-all duration-500 ${colorClass}`} 
                                        style={{ width: `${barWidth}%` }}
                                    ></div>
                                    <span className="absolute right-2 top-0.5 text-xs text-white font-bold pointer-events-none">
                                        {formatValue(formattedValue, item.metric as string)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- DATA STRUCTURES & AGGREGATION LOGIC ---

interface DevicePerformance {
    device: string; 
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    conversion_rate: number;
}

interface Campaign {
    id: number;
    name: string;
    device_performance: DevicePerformance[];
    weekly_performance: any[]; 
    regional_performance: any[]; 
}

type RawApiResponse = Campaign[]; 

interface AggregatedDeviceData {
    device: 'Mobile' | 'Desktop'; 
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_spend: number;
    total_revenue: number;
    average_ctr: number;
    average_conversion_rate: number;
}

function restructureDevicePerformance(campaigns: RawApiResponse): AggregatedDeviceData[] {
    if (!Array.isArray(campaigns) || campaigns.length === 0) {
        return [];
    }
    
    const aggregatedDataMap = new Map<'Mobile' | 'Desktop', {
        impressions: number;
        clicks: number;
        conversions: number;
        spend: number;
        revenue: number;
    }>([
        ['Mobile', { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }],
        ['Desktop', { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }],
    ]);

    for (const campaign of campaigns) {
        if (!campaign.device_performance) continue;
        
        for (const stat of campaign.device_performance) {
            const deviceKey = stat.device ? stat.device.trim() : '';

            if (deviceKey === 'Mobile' || deviceKey === 'Desktop') {
                const current = aggregatedDataMap.get(deviceKey as 'Mobile' | 'Desktop')!;
                
                current.impressions += stat.impressions;
                current.clicks += stat.clicks;
                current.conversions += stat.conversions;
                current.spend += stat.spend;
                current.revenue += stat.revenue;
            }
        }
    }

    const results: AggregatedDeviceData[] = [];

    for (const [device, data] of aggregatedDataMap.entries()) {
        if (data.impressions > 0 || data.clicks > 0 || data.conversions > 0) {
             const average_ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
             const average_conversion_rate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
            
             results.push({
                 device: device,
                 total_impressions: data.impressions,
                 total_clicks: data.clicks,
                 total_conversions: data.conversions,
                 total_spend: parseFloat(data.spend.toFixed(2)),
                 total_revenue: parseFloat(data.revenue.toFixed(2)),
                 average_ctr: parseFloat(average_ctr.toFixed(2)),
                 average_conversion_rate: parseFloat(average_conversion_rate.toFixed(2)),
             });
        }
    }

    return results;
}

// --- DATA FETCHING ---

async function fetchRawDataFromExistingApi(): Promise<RawApiResponse> {
  const API_ENDPOINT = `https://www.amanabootcamp.org/api/fs-classwork-data/amana-marketing`;
  
  const res = await fetch(API_ENDPOINT, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Fetch Failed:", errorText);
    throw new Error(`Failed to fetch raw campaign data (Status: ${res.status}, Message: ${errorText.substring(0, 100)})`);
  }
  
  const data = await res.json();
  
  if (Array.isArray(data)) return data as RawApiResponse;
  if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data.data)) return data.data as RawApiResponse;
      if (Array.isArray(data.campaigns)) return data.campaigns as RawApiResponse;
  }

  console.warn("API response was not a direct array and no common wrapper key ('data' or 'campaigns') was found.");
  return [];
}

// --- DEVICE VIEW PAGE ---

export default async function DeviceViewPage() {
    let rawData: RawApiResponse;
    let error: string | null = null;
    
    try {
        rawData = await fetchRawDataFromExistingApi();
    } catch (err) {
        rawData = []; 
        error = err instanceof Error ? err.message : 'Unknown API error';
    }
    
    const deviceData = restructureDevicePerformance(rawData);

    const mobileData = deviceData.find(d => d.device === 'Mobile');
    const desktopData = deviceData.find(d => d.device === 'Desktop');
    
    let summaryMetrics: CardMetricProps[] = [];
    let chartData: Array<Record<string, number | string>> = [];
    let contentMessage: React.ReactNode | null = null;

    if (error) {
         contentMessage = (
            <div className="text-red-300 bg-red-900 border border-red-700 rounded-lg p-6 max-w-4xl mx-auto mt-10">
                <h2 className="font-bold text-xl mb-2">Data Fetch Error</h2>
                <p>Failed to load data from the API endpoint.</p>
                <p className="mt-2 text-sm">Error: {error}</p>
            </div>
        );
    } else if (!mobileData || !desktopData) {
        const availableDevices = deviceData.map(d => d.device).join(', ');
        contentMessage = (
            <div className="text-yellow-300 bg-yellow-900 border border-yellow-700 rounded-lg p-6 max-w-4xl mx-auto mt-10">
                <h2 className="font-bold text-xl mb-2">Data Warning: Missing Key Device</h2>
                <p>Could not find both 'Mobile' and 'Desktop' data points after processing {rawData.length} campaigns.</p>
                <p className="mt-2 text-sm">Devices successfully processed: [{availableDevices || 'None'}]</p>
            </div>
        );
    } else {
        const revenueComparison = mobileData.total_revenue - desktopData.total_revenue;
        const totalRevenue = mobileData.total_revenue + desktopData.total_revenue;
        const mobileRevenuePercent = (totalRevenue > 0) ? (mobileData.total_revenue / totalRevenue) * 100 : 0;
        
        const deltaBaseRevenue = desktopData.total_revenue === 0 ? 1 : desktopData.total_revenue; 
        const deltaPercent = (Math.abs(revenueComparison) / deltaBaseRevenue) * 100;
        
        const isMobileLeader = mobileData.total_revenue > desktopData.total_revenue;

        summaryMetrics = [
            {
                title: "Mobile Revenue Share",
                value: `${mobileRevenuePercent.toFixed(1)}%`,
                icon: Smartphone,
                description: `${formatCurrency(mobileData.total_revenue, 'USD')} of combined total revenue`,
                color: 'text-blue-500',
            },
            {
                title: "Desktop Conversions",
                value: formatNumber(desktopData.total_conversions),
                icon: Monitor,
                description: `Mobile: ${formatNumber(mobileData.total_conversions)} conversions`,
                color: 'text-purple-500',
            },
            {
                title: isMobileLeader ? "Mobile Revenue Lead" : "Desktop Revenue Lead",
                value: formatCurrency(Math.abs(revenueComparison), 'USD'),
                icon: revenueComparison >= 0 ? ArrowUp : ArrowDown,
                description: isMobileLeader
                    ? `Mobile leads by ${deltaPercent.toFixed(1)}%`
                    : `Desktop leads by ${deltaPercent.toFixed(1)}%`,
                color: revenueComparison >= 0 ? 'text-green-500' : 'text-red-500',
            },
            {
                title: "Avg. Conversion Rate",
                value: `${mobileData.average_conversion_rate}% / ${desktopData.average_conversion_rate}%`,
                icon: TrendingUp,
                description: `CR is ${mobileData.average_conversion_rate > desktopData.average_conversion_rate ? 'higher' : 'lower'} on Mobile`,
                color: 'text-yellow-500',
            },
        ];
        
        chartData = [
            { metric: 'Revenue', Mobile: mobileData.total_revenue, Desktop: desktopData.total_revenue },
            { metric: 'Conversions', Mobile: mobileData.total_conversions, Desktop: desktopData.total_conversions },
            { metric: 'Total Spend', Mobile: mobileData.total_spend, Desktop: desktopData.total_spend },
        ];
    }
    
    const customChartFormatter = (value: number | undefined, metricKey: string): string => {
        if (value === undefined || value === null) return 'N/A';
        
        switch (metricKey) {
            case 'Revenue':
            case 'Total Spend':
                return formatCurrency(value, 'USD'); 
            case 'Conversions':
                return formatNumber(value); 
            default:
                return value.toLocaleString();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
            <Navbar /> {/* <-- UI Navbar */}

            <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
                
                <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12 flex-shrink-0">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                                Device Performance Breakdown
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">
                                A cross-campaign analysis of Mobile vs. Desktop engagement and financial results.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
                    
                    {contentMessage || (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {summaryMetrics.map((metric, index) => (
                                    <CardMetric
                                        key={index}
                                        title={metric.title}
                                        value={metric.value}
                                        icon={metric.icon}
                                        description={metric.description}
                                        color={metric.color}
                                    />
                                ))}
                            </div>

                            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700">
                                <h2 className="text-xl font-semibold text-white mb-4">Metric Comparison (Mobile vs. Desktop)</h2>
                                <div className="h-96"> 
                                    <BarChart data={chartData} formatValue={customChartFormatter} /> 
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <Footer /> {/* <-- UI Footer */}
            </div>
        </div>
    );
}
