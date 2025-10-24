"use client";
import { useState, useEffect, useMemo } from 'react';

// Assuming these paths are correct
import { fetchMarketingData } from '../../src/lib/api'; 
import { MarketingData, AggregatedDemographicGroup } from '../../src/types/marketing'; 
import { TableColumn } from '../../src/components/ui/table'; 

// UI Components (Ensure these are correctly built)
import { Navbar } from '../../src/components/ui/navbar';
import { Footer } from '../../src/components/ui/footer';
import { CardMetric } from '../../src/components/ui/card-metric';
import { BarChart } from '../../src/components/ui/bar-chart';
import { Table } from '../../src/components/ui/table';

// Icons
import { DollarSign, TrendingUp, MousePointerClick } from 'lucide-react';


interface GenderMetrics {
  totalClicks: number;
  totalSpend: number;
  totalRevenue: number;
}

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface TableRow extends Record<string, any> {
  ageGroup: string;
  impressions: string;
  clicks: string;
  conversions: string;
  ctr: string;
  conversionRate: string;
  _sort_impressions: number;
  _sort_clicks: number;
  _sort_conversions: number;
  _sort_ctr: number;
  _sort_conversionRate: number;
}

interface AggregatedDataResult {
  maleMetrics: GenderMetrics;
  femaleMetrics: GenderMetrics;
  spendChart: ChartDataPoint[];
  revenueChart: ChartDataPoint[];
  maleTableData: TableRow[];
  femaleTableData: TableRow[];
}

// Consistent initial state for safety
const initialMetrics: GenderMetrics = {
  totalClicks: 0,
  totalSpend: 0,
  totalRevenue: 0,
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function DemographicView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMarketingData(); 
        setMarketingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demographic data');
        console.error('Error loading demographic data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Data Aggregation Logic ---
  const aggregatedData = useMemo(
    (): AggregatedDataResult => {
    const campaigns = marketingData?.campaigns || [];
    
    // Safety check: return initial state if no campaigns are present
    if (campaigns.length === 0) {
      return {
        maleMetrics: initialMetrics,
        femaleMetrics: initialMetrics,
        spendChart: [],
        revenueChart: [],
        maleTableData: [],
        femaleTableData: []
      };
    }

    // Map to accumulate totals by unique key (e.g., "Male-18-24")
    const demographicMap: { [key: string]: { 
      impressions: number, 
      clicks: number, 
      conversions: number, 
      spend: number, 
      revenue: number 
    }} = {};

    campaigns.forEach(campaign => {
      // Calculate the sum of audience percentages for the current campaign
      const totalCampaignAudiencePercentage = campaign.demographic_breakdown.reduce(
        (sum, item) => sum + item.percentage_of_audience, 0
      );
      
      campaign.demographic_breakdown.forEach(breakdown => {
        const key = `${breakdown.gender}-${breakdown.age_group}`;
        // Calculate ratio, defaulting to 0 if the total percentage is 0
        const ratio = totalCampaignAudiencePercentage > 0 ? (breakdown.percentage_of_audience / totalCampaignAudiencePercentage) : 0;
        
        // Distribute financial metrics based on audience ratio
        const distributedSpend = campaign.spend * ratio;
        const distributedRevenue = campaign.revenue * ratio;

        if (!demographicMap[key]) {
          demographicMap[key] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
        }

        // Sum up core performance metrics (from the API directly)
        demographicMap[key].impressions += breakdown.performance.impressions;
        demographicMap[key].clicks += breakdown.performance.clicks;
        demographicMap[key].conversions += breakdown.performance.conversions;
        
        // Sum up the distributed financial metrics
        demographicMap[key].spend += distributedSpend;
        demographicMap[key].revenue += distributedRevenue;
      });
    });

    // --- Finalize Aggregated List and Calculate Rates ---
    const aggregatedList: AggregatedDemographicGroup[] = Object.entries(demographicMap).map(([key, totals]) => {
      const [gender, ageGroup] = key.split('-');
      
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) : 0;
      const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) : 0;

      return {
        ageGroup,
        gender: gender as 'Male' | 'Female',
        ...totals,
        ctr,
        conversionRate,
      };
    });


    // --- 1. Card Metrics Aggregation (Total Clicks, Spend, Revenue by Gender) ---
    const maleData = aggregatedList.filter(row => row.gender === 'Male');
    const femaleData = aggregatedList.filter(row => row.gender === 'Female');

    const calculateMetrics = (data: AggregatedDemographicGroup[]): GenderMetrics => ({
      totalClicks: data.reduce((sum, row) => sum + row.clicks, 0),
      totalSpend: data.reduce((sum, row) => sum + row.spend, 0),
      totalRevenue: data.reduce((sum, row) => sum + row.revenue, 0),
    });

    const maleMetrics = calculateMetrics(maleData);
    const femaleMetrics = calculateMetrics(femaleData);

    // --- 2. Bar Chart Data Aggregation (Total Spend/Revenue by Age Group) ---
    const ageDataMap: { [key: string]: { spend: number, revenue: number } } = {};

    aggregatedList.forEach(row => {
        if (!ageDataMap[row.ageGroup]) {
            ageDataMap[row.ageGroup] = { spend: 0, revenue: 0 };
        }
        ageDataMap[row.ageGroup].spend += row.spend;
        ageDataMap[row.ageGroup].revenue += row.revenue;
    });

    // Sort age groups numerically
    const ageGroups = Object.keys(ageDataMap).sort((a, b) => {
        const numA = parseInt(a.split('-')[0]);
        const numB = parseInt(b.split('-')[0]);
        return numA - numB;
    });

    const spendChart: ChartDataPoint[] = ageGroups.map(group => ({
        label: group,
        value: ageDataMap[group].spend,
        color: '#f87171', // Red-400
    }));

    const revenueChart: ChartDataPoint[] = ageGroups.map(group => ({
        label: group,
        value: ageDataMap[group].revenue,
        color: '#4ade80', // Green-400
    }));


    // --- 3. Table Data Formatting ---
    const formatTableData = (data: AggregatedDemographicGroup[]): TableRow[] => data.map(row => ({
        ageGroup: row.ageGroup,
        impressions: row.impressions.toLocaleString(),
        clicks: row.clicks.toLocaleString(),
        conversions: row.conversions.toLocaleString(),
        ctr: `${(row.ctr * 100).toFixed(2)}%`,
        conversionRate: `${(row.conversionRate * 100).toFixed(2)}%`,
        // Numeric sort keys
        _sort_impressions: row.impressions,
        _sort_clicks: row.clicks,
        _sort_conversions: row.conversions,
        _sort_ctr: row.ctr,
        _sort_conversionRate: row.conversionRate,
    }));

    // Final result matching AggregatedDataResult interface
    return {
      maleMetrics,
      femaleMetrics,
      spendChart,
      revenueChart,
      maleTableData: formatTableData(maleData),
      femaleTableData: formatTableData(femaleData),
    };
  }, 
  [marketingData]
);
  // --- END Data Aggregation ---

  const { maleMetrics, femaleMetrics, spendChart, revenueChart, maleTableData, femaleTableData } = aggregatedData;

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading Demographic Data...</div>
        </div>
      </div>
    );
  }

  // Define table columns
  const tableColumns: TableColumn[] = [
    { key: 'ageGroup', header: 'Age Group', width: '15%', sortable: true, sortType: 'string' },
    { key: 'impressions', header: 'Impressions', width: '15%', align: 'right', sortable: true, sortType: 'number', sortKey: '_sort_impressions' },
    { key: 'clicks', header: 'Clicks', width: '15%', align: 'right', sortable: true, sortType: 'number', sortKey: '_sort_clicks' },
    { key: 'conversions', header: 'Conversions', width: '15%', align: 'right', sortable: true, sortType: 'number', sortKey: '_sort_conversions' },
    { key: 'ctr', header: 'CTR', width: '20%', align: 'right', sortable: true, sortType: 'number', sortKey: '_sort_ctr' },
    { key: 'conversionRate', header: 'Conv. Rate', width: '20%', align: 'right', sortable: true, sortType: 'number', sortKey: '_sort_conversionRate' },
  ];


  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {error ? (
                <div className="bg-red-900 border border-red-700 text-red-200 px-3 sm:px-4 py-3 rounded mb-4 max-w-2xl mx-auto text-sm sm:text-base">
                  Error loading data: {error}
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  Demographic Performance 🧑‍🤝‍🧑
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          {marketingData && (
            <>
              {/* 1. Card Components: Gender-Specific Metrics */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Gender Performance Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  
                  {/* Total Clicks by Males */}
                  <CardMetric 
                    title="Clicks (Male)"
                    value={maleMetrics.totalClicks.toLocaleString()} // No need for '?' now
                    icon={<MousePointerClick className="w-5 h-5 text-blue-400" />}
                  />
                  {/* Total Spend by Males */}
                  <CardMetric 
                    title="Spend (Male)"
                    value={`$${maleMetrics.totalSpend.toFixed(2).toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5 text-blue-400" />}
                  />
                  {/* Total Revenue by Males */}
                  <CardMetric 
                    title="Revenue (Male)"
                    value={`$${maleMetrics.totalRevenue.toFixed(2).toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
                  />
                  
                  {/* Total Clicks by Females */}
                  <CardMetric 
                    title="Clicks (Female)"
                    value={femaleMetrics.totalClicks.toLocaleString()}
                    icon={<MousePointerClick className="w-5 h-5 text-pink-400" />}
                  />
                  {/* Total Spend by Females */}
                  <CardMetric 
                    title="Spend (Female)"
                    value={`$${femaleMetrics.totalSpend.toFixed(2).toLocaleString()}`}
                    icon={<DollarSign className="w-5 h-5 text-pink-400" />}
                  />
                  {/* Total Revenue by Females */}
                  <CardMetric 
                    title="Revenue (Female)"
                    value={`$${femaleMetrics.totalRevenue.toFixed(2).toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5 text-pink-400" />}
                  />
                </div>
              </section>

              <hr className="border-gray-700 my-8" />
              
              {/* 2. Bar Graph Components: Spend & Revenue by Age Group */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Financial Metrics by Age Group</h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Total Spend by Age Group */}
                  <BarChart 
                    title="Total Spend by Age Group"
                    data={spendChart}
                    formatValue={(value) => `$${value.toFixed(2).toLocaleString()}`}
                  />
                  
                  {/* Total Revenue by Age Group */}
                  <BarChart 
                    title="Total Revenue by Age Group"
                    data={revenueChart}
                    formatValue={(value) => `$${value.toFixed(2).toLocaleString()}`}
                  />
                </div>
              </section>
              
              <hr className="border-gray-700 my-8" />

              {/* 3. Table Components: Campaign Performance by Age/Gender */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Detailed Performance by Age & Gender</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* Campaign Performance by Male Age Groups */}
                  <Table
                    title="Campaign Performance (Male Age Groups)"
                    columns={tableColumns}
                    data={maleTableData}
                    defaultSort={{ key: '_sort_conversionRate', direction: 'desc' }} 
                    emptyMessage="No male demographic data available."
                  />
                  
                  {/* Campaign Performance by Female Age Groups */}
                  <Table
                    title="Campaign Performance (Female Age Groups)"
                    columns={tableColumns}
                    data={femaleTableData}
                    defaultSort={{ key: '_sort_conversionRate', direction: 'desc' }} 
                    emptyMessage="No female demographic data available."
                  />
                </div>
              </section>
            </>
          )}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}