export interface CompanyInfo {
  name: string;
  founded: string;
  headquarters: string;
  industry: string;
  description: string;
}

export interface MarketingStats {
  total_campaigns: number;
  active_campaigns: number;
  total_spend: number;
  total_revenue: number;
  total_conversions: number;
  average_roas: number;
  top_performing_medium: string;
  top_performing_region: string;
  total_impressions: number;
  total_clicks: number;
  average_ctr: number;
  average_conversion_rate: number;
}

export interface TargetDemographics {
  age_groups: string[];
  genders: string[];
  primary_device: string;
}

export interface DemographicPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
}

export interface DemographicBreakdown {
  age_group: string;
  gender: string;
  percentage_of_audience: number;
  performance: DemographicPerformance;
}

export interface DevicePerformance {
  device: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  percentage_of_traffic: number;
}

export interface WeeklyPerformance {
  week_start: string;
  week_end: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface RegionalPerformance {
  region: string;
  country: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface Creative {
  id: number;
  name: string;
  format: string;
  url: string;
  performance_score: number;
  is_primary: boolean;
  impressions: number;
  clicks: number;
  ctr: number;
  a_b_test_variant: string;
}

export interface Timeline {
  start_date: string;
  created_date: string;
  last_updated: string;
}

export interface Targeting {
  regions: string[];
  interests: string[];
  behaviors: string[];
  custom_audiences: string[];
}

export interface Campaign {
  id: number;
  name: string;
  status: string;
  objective: string;
  medium: string;
  format: string;
  product_category: string;
  budget: number;
  spend: number;
  budget_utilization: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  average_order_value: number;
  ctr: number;
  conversion_rate: number;
  cpc: number;
  cpa: number;
  roas: number;
  target_demographics: TargetDemographics;
  demographic_breakdown: DemographicBreakdown[];
  device_performance: DevicePerformance[];
  weekly_performance: WeeklyPerformance[];
  regional_performance: RegionalPerformance[];
  creatives: Creative[];
  timeline: Timeline;
  targeting: Targeting;
}

export interface MarketInsights {
  last_updated: string;
  peak_performance_day: string;
  peak_performance_time: string;
  top_converting_product: string;
  fastest_growing_region: string;
}

export interface Filters {
  available_statuses: string[];
  available_objectives: string[];
  available_mediums: string[];
  available_formats: string[];
  available_product_categories: string[];
  available_regions: string[];
  applied: Record<string, any>;
}

export interface MarketingData {
  message: string;
  company_info: CompanyInfo;
  marketing_stats: MarketingStats;
  campaigns: Campaign[];
  market_insights: MarketInsights;
  filters: Filters;
}

export interface ApiResponse {
  error?: string;
  message?: string;
  data?: MarketingData;
}

export interface AggregatedDemographicGroup {
  ageGroup: string;
  gender: 'Male' | 'Female' | string; 
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
}

export interface AggregatedWeeklyPerformance {
  weekStart: string;
  weekEnd: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  // Derived metrics
  ctr: number;
  conversionRate: number;
}

export interface AggregatedRegionalPerformance {
    region: string;
    country: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    roas: number;
    cpa: number;
    cpc: number;
    
    latitude: number; 
    longitude: number; 
}