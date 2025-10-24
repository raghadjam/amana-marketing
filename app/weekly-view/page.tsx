// app/weekly-view/page.tsx

"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchMarketingData } from '../../src/lib/api'; 
import { MarketingData, AggregatedWeeklyPerformance } from '../../src/types/marketing'; 

// UI Components
import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { CardMetric } from '../../src/components/ui/card-metric';
import { LineChart, LineChartDataPoint } from '../../src/components/ui/line-chart'; 

// Icons
import { Clock, TrendingUp, DollarSign } from 'lucide-react';

// ----------------------------------------------------------------------
// LOCAL TYPES for useMemo Result
// ----------------------------------------------------------------------

interface WeeklyViewResult {
  totalRevenue: number;
  totalSpend: number;
  avgConversionRate: number;
  revenueChartData: LineChartDataPoint[];
  spendChartData: LineChartDataPoint[];
}

const initialWeeklyResult: WeeklyViewResult = {
  totalRevenue: 0,
  totalSpend: 0,
  avgConversionRate: 0,
  revenueChartData: [],
  spendChartData: [],
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function WeeklyView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMarketingData(); 
        setMarketingData(data);
      } catch (err) {
        console.error('Error loading weekly data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Data Aggregation Logic ---
  const aggregatedData = useMemo((): WeeklyViewResult => {
    const campaigns = marketingData?.campaigns || [];
    if (campaigns.length === 0) return initialWeeklyResult;

    // Map to accumulate totals by week_start date
    const weeklyMap: { [key: string]: { 
      weekStart: string, 
      weekEnd: string, 
      impressions: number, 
      clicks: number, 
      conversions: number, 
      spend: number, 
      revenue: number 
    }} = {};
    
    // 1. Accumulate totals across all campaigns
    campaigns.forEach(campaign => {
      campaign.weekly_performance.forEach(week => {
        const key = week.week_start;
        if (!weeklyMap[key]) {
          weeklyMap[key] = {
            weekStart: week.week_start,
            weekEnd: week.week_end,
            impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0
          };
        }
        weeklyMap[key].impressions += week.impressions;
        weeklyMap[key].clicks += week.clicks;
        weeklyMap[key].conversions += week.conversions;
        weeklyMap[key].spend += week.spend;
        weeklyMap[key].revenue += week.revenue;
      });
    });

    // 2. Finalize list and calculate metrics
    const finalWeeklyList: AggregatedWeeklyPerformance[] = Object.values(weeklyMap).map(totals => {
      const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
      const conversionRate = totals.clicks > 0 ? totals.conversions / totals.clicks : 0;
      return { ...totals, ctr, conversionRate };
    });

    // Sort by week start date
    finalWeeklyList.sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime());

    // 3. Calculate Global Metrics
    const totalRevenue = finalWeeklyList.reduce((sum, item) => sum + item.revenue, 0);
    const totalSpend = finalWeeklyList.reduce((sum, item) => sum + item.spend, 0);
    const totalConversions = finalWeeklyList.reduce((sum, item) => sum + item.conversions, 0);
    const totalClicks = finalWeeklyList.reduce((sum, item) => sum + item.clicks, 0);
    const avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

    // 4. Format Chart Data
    const revenueChartData: LineChartDataPoint[] = finalWeeklyList.map(item => ({
      label: item.weekStart.slice(5), // Use MM-DD for label
      value: item.revenue,
      tooltipLabel: `Revenue (${item.weekStart} to ${item.weekEnd})`
    }));

    const spendChartData: LineChartDataPoint[] = finalWeeklyList.map(item => ({
      label: item.weekStart.slice(5), // Use MM-DD for label
      value: item.spend,
      tooltipLabel: `Spend (${item.weekStart} to ${item.weekEnd})`
    }));
    
    return {
      totalRevenue,
      totalSpend,
      avgConversionRate,
      revenueChartData,
      spendChartData,
    };
  }, [marketingData]);
  // --- END Data Aggregation ---

  const { totalRevenue, totalSpend, avgConversionRate, revenueChartData, spendChartData } = aggregatedData;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900"><Navbar /><div className="flex-1 flex items-center justify-center text-white">Loading Weekly Data...</div></div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-center">Weekly Performance Timeline 🗓️</h1>
          </div>
        </section>
        
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-full">
          {/* Metrics Cards */}
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardMetric 
                title="Total Revenue"
                value={`$${totalRevenue.toFixed(2).toLocaleString()}`}
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              />
              <CardMetric 
                title="Total Spend"
                value={`$${totalSpend.toFixed(2).toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5 text-red-400" />}
              />
              <CardMetric 
                title="Avg Conversion Rate"
                value={`${(avgConversionRate * 100).toFixed(2)}%`}
                icon={<Clock className="w-5 h-5 text-blue-400" />}
              />
            </div>
          </section>

          <hr className="border-gray-700 my-8" />
          
          {/* Line Charts */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Time Series Analysis</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <LineChart
                title="Revenue by Week"
                data={revenueChartData}
                dataKey="value"
                labelKey="label"
                color="#4ade80" // Green
                formatValue={(v) => `$${v.toFixed(2).toLocaleString()}`}
              />
              <LineChart
                title="Spend by Week"
                data={spendChartData}
                dataKey="value"
                labelKey="label"
                color="#f87171" // Red
                formatValue={(v) => `$${v.toFixed(2).toLocaleString()}`}
              />
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </div>
  );
}