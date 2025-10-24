"use client";
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic'; // ← dynamic import
import { fetchMarketingData } from '../../src/lib/api'; 
import { MarketingData, AggregatedRegionalPerformance } from '../../src/types/marketing'; 
import { getCoordinates } from '../../src/lib/geo-data';

// UI Components
import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BubbleMapDataPoint } from '../../src/components/ui/bubble-map'; 

// Icons
import { Globe } from 'lucide-react';

// Dynamically import BubbleMap so it only loads on the client
const BubbleMap = dynamic(() => import('../../src/components/ui/bubble-map').then(mod => mod.BubbleMap), {
  ssr: false,
});


// ----------------------------------------------------------------------
// LOCAL TYPES
// ----------------------------------------------------------------------

interface RegionViewResult {
  totalRevenue: number;
  totalSpend: number;
  averageRoas: number;
  topRegion: string;
  revenueMapData: BubbleMapDataPoint[];
  spendMapData: BubbleMapDataPoint[];
}

const initialRegionResult: RegionViewResult = {
  totalRevenue: 0,
  totalSpend: 0,
  averageRoas: 0,
  topRegion: 'N/A',
  revenueMapData: [],
  spendMapData: [],
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function RegionView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMarketingData(); 
        setMarketingData(data);
      } catch (err) {
        console.error('Error loading regional data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const aggregatedData = useMemo((): RegionViewResult => {
    const campaigns = marketingData?.campaigns || [];
    if (campaigns.length === 0) return initialRegionResult;

    const regionalMap: { [key: string]: AggregatedRegionalPerformance & {latitude: number, longitude: number} } = {};
    
    campaigns.forEach(campaign => {
      campaign.regional_performance.forEach(region => {
        const key = `${region.region}-${region.country}`;
        if (!regionalMap[key]) {
          const pos = getCoordinates(region.region);
          regionalMap[key] = {
            ...region,
            impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0,
            roas: 0, cpa: 0, cpc: 0, ctr: 0, conversionRate: 0,
            latitude: pos.lat,
            longitude: pos.lon,
          };
        }
        regionalMap[key].impressions += region.impressions;
        regionalMap[key].clicks += region.clicks;
        regionalMap[key].conversions += region.conversions;
        regionalMap[key].spend += region.spend;
        regionalMap[key].revenue += region.revenue;
      });
    });

    const finalRegionalList = Object.values(regionalMap).map(totals => {
      const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
      const conversionRate = totals.clicks > 0 ? totals.conversions / totals.clicks : 0;
      const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
      const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;
      const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
      return { ...totals, ctr, conversionRate, cpc, cpa, roas };
    }).filter(item => item.latitude !== 0 || item.longitude !== 0);

    const totalRevenue = finalRegionalList.reduce((sum, item) => sum + item.revenue, 0);
    const totalSpend = finalRegionalList.reduce((sum, item) => sum + item.spend, 0);
    const averageRoas = finalRegionalList.length > 0 ? finalRegionalList.reduce((sum, item) => sum + item.roas, 0) / finalRegionalList.length : 0;
    const topRegion = finalRegionalList.sort((a, b) => b.revenue - a.revenue)[0]?.region || 'N/A';

    const revenueMapData: BubbleMapDataPoint[] = finalRegionalList.map(item => ({
      region: item.region,
      country: item.country,
      value: item.revenue,
      color: getCoordinates(item.region).color || '#94a3b8', 
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    const spendMapData: BubbleMapDataPoint[] = finalRegionalList.map(item => ({
      region: item.region,
      country: item.country,
      value: item.spend,
      color: getCoordinates(item.region).color || '#94a3b8',
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    return { totalRevenue, totalSpend, averageRoas, topRegion, revenueMapData, spendMapData };
  }, [marketingData]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-center">Regional Performance Overview 🌍</h1>
          </div>
        </section>
        
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-full">
          <hr className="border-gray-700 my-8" />
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Geospatial Distribution</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BubbleMap
                title="Revenue by Region (Bubble Size = Revenue)"
                data={aggregatedData.revenueMapData}
                formatValue={(v) => `$${v.toFixed(0).toLocaleString()}`}
              />
              <BubbleMap
                title="Spend by Region (Bubble Size = Spend)"
                data={aggregatedData.spendMapData}
                formatValue={(v) => `$${v.toFixed(0).toLocaleString()}`}
              />
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}
