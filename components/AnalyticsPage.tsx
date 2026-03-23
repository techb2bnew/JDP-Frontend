'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  RadialBarChart,
  RadialBar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  ReferenceLine
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Target,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Building,
  Truck,
  Timer,
  UserCheck,
  Calculator,
  Globe,
  Layers,
  TrendingUpIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { apiClient } from '../utils/api'

// Mock Data
const revenueAnalytics = {
  current: 847256,
  previous: 754820,
  change: 12.2,
  target: 900000,
  monthly: [
    { month: 'Jan', revenue: 650000, profit: 195000, expenses: 455000, jobs: 45 },
    { month: 'Feb', revenue: 720000, profit: 216000, expenses: 504000, jobs: 52 },
    { month: 'Mar', revenue: 680000, profit: 204000, expenses: 476000, jobs: 48 },
    { month: 'Apr', revenue: 790000, profit: 237000, expenses: 553000, jobs: 58 },
    { month: 'May', revenue: 850000, profit: 255000, expenses: 595000, jobs: 62 },
    { month: 'Jun', revenue: 847256, profit: 254177, expenses: 593079, jobs: 65 }
  ]
}

const performanceMetrics = [
  {
    category: 'Revenue Growth',
    current: 847256,
    target: 900000,
    percentage: 94.1,
    trend: 'up',
    change: '+12.2%',
    color: '#00A1FF'
  },
  {
    category: 'Job Completion Rate',
    current: 92,
    target: 95,
    percentage: 96.8,
    trend: 'up',
    change: '+3.2%',
    color: '#00CEB6'
  },
  {
    category: 'Customer Satisfaction',
    current: 4.8,
    target: 5.0,
    percentage: 96.0,
    trend: 'up',
    change: '+0.3',
    color: '#FFB800'
  },
  {
    category: 'Cost Efficiency',
    current: 68,
    target: 70,
    percentage: 97.1,
    trend: 'down',
    change: '-2.1%',
    color: '#FF6692'
  }
]

type JobTypeAnalyticsItem = {
  name: string
  value: number
  count: number
  color: string
}

const defaultJobTypeAnalytics: JobTypeAnalyticsItem[] = [
  { name: 'Service Based', value: 8, count: 8, color: '#00A1FF' },
  { name: 'Contract Based', value: 4, count: 4, color: '#00CEB6' }
]

const jobTypeLabelMap: Record<string, string> = {
  service_based: 'Service-Based',
  contract_based: 'Contract-Based'
}

const jobTypeColorPalette = ['#00A1FF', '#00CEB6', '#FFB800', '#FF6692', '#8B5CF6']

const formatJobTypeLabel = (key: string) => {
  if (jobTypeLabelMap[key]) return jobTypeLabelMap[key]
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const buildJobTypeAnalytics = (jobTypes: Record<string, unknown> | null | undefined): JobTypeAnalyticsItem[] => {
  if (!jobTypes) return []
  const { total, ...rest } = jobTypes as Record<string, unknown>
  const entries = Object.entries(rest).filter(([key]) => key !== 'total')
  if (entries.length === 0) return []

  return entries.map(([key, value], index) => {
    const numValue = typeof value === 'number' ? value : Number(value) || 0
    return {
      name: formatJobTypeLabel(key),
      value: numValue,
      count: numValue,
      color: jobTypeColorPalette[index % jobTypeColorPalette.length]
    }
  })
}

const geographicData = [
  { region: 'North', jobs: 85, revenue: 245000, growth: 15.2 },
  { region: 'South', jobs: 72, revenue: 198000, growth: 8.7 },
  { region: 'East', jobs: 94, revenue: 287000, growth: 22.1 },
  { region: 'West', jobs: 63, revenue: 174000, growth: 5.3 },
  { region: 'Central', jobs: 78, revenue: 221000, growth: 12.8 }
]

const topPerformers = [
  {
    name: 'David Wilson',
    role: 'Lead Electrician',
    jobsCompleted: 23,
    revenue: 89750,
    efficiency: 98.2,
    rating: 4.9,
    avatar: null
  },
  {
    name: 'Sarah Chen',
    role: 'Project Manager',
    jobsCompleted: 31,
    revenue: 125400,
    efficiency: 96.8,
    rating: 4.8,
    avatar: null
  },
  {
    name: 'Mike Rodriguez',
    role: 'HVAC Specialist',
    jobsCompleted: 18,
    revenue: 67200,
    efficiency: 95.5,
    rating: 4.7,
    avatar: null
  },
  {
    name: 'Jennifer Wilson',
    role: 'Lead Plumber',
    jobsCompleted: 19,
    revenue: 71250,
    efficiency: 94.2,
    rating: 4.6,
    avatar: null
  }
]

const predictiveAnalytics = [
  { month: 'Jul', predicted: 920000, lower: 890000, upper: 950000 },
  { month: 'Aug', predicted: 975000, lower: 940000, upper: 1010000 },
  { month: 'Sep', predicted: 1020000, lower: 980000, upper: 1060000 },
  { month: 'Oct', predicted: 1080000, lower: 1040000, upper: 1120000 }
]

type MetricChange = {
  difference: number
  yesterday_total: number
}

type AnalyticsMetric = {
  total: number
  change_today_vs_yesterday?: MetricChange
}

type OnlineStaffAnalyticsMetric = AnalyticsMetric & {
  breakdown?: {
    staff?: number
    labor?: number
    lead_labor?: number
  }
}

type AnalyticsOverviewData = {
  active_jobs?: AnalyticsMetric
  online_staff?: OnlineStaffAnalyticsMetric
  pending_approvals?: AnalyticsMetric
  todays_revenue?: AnalyticsMetric
}

type MetricDefinition<K extends keyof AnalyticsOverviewData = keyof AnalyticsOverviewData> = {
  key: K
  title: string
  icon: LucideIcon
  color: string
  bgColor: string
  unit?: 'currency'
}

const metricDefinitions: MetricDefinition[] = [
  {
    key: 'active_jobs',
    title: 'Active Jobs',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    key: 'online_staff',
    title: 'Online Staff',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    key: 'pending_approvals',
    title: 'Pending Approvals',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    key: 'todays_revenue',
    title: "Today's Revenue",
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    unit: 'currency'
  }
]

const timeSeriesComparison = [
  { period: 'Q1 2024', thisYear: 2180000, lastYear: 1940000 },
  { period: 'Q2 2024', thisYear: 2456000, lastYear: 2180000 },
  { period: 'Q3 2024', thisYear: 2890000, lastYear: 2420000 },
  { period: 'Q4 2024', thisYear: 3200000, lastYear: 2680000 }
]

const customerInsights = [
  { segment: 'Enterprise', customers: 45, revenue: 425000, avgJobValue: 9444 },
  { segment: 'SMB', customers: 123, revenue: 287000, avgJobValue: 2333 },
  { segment: 'Residential', customers: 89, revenue: 135256, avgJobValue: 1520 }
]

const heatmapData = [
  { day: 'Mon', hour: '6AM', value: 12 }, { day: 'Mon', hour: '8AM', value: 45 }, { day: 'Mon', hour: '10AM', value: 78 }, { day: 'Mon', hour: '12PM', value: 92 }, { day: 'Mon', hour: '2PM', value: 85 }, { day: 'Mon', hour: '4PM', value: 67 }, { day: 'Mon', hour: '6PM', value: 34 },
  { day: 'Tue', hour: '6AM', value: 18 }, { day: 'Tue', hour: '8AM', value: 52 }, { day: 'Tue', hour: '10AM', value: 85 }, { day: 'Tue', hour: '12PM', value: 96 }, { day: 'Tue', hour: '2PM', value: 89 }, { day: 'Tue', hour: '4PM', value: 72 }, { day: 'Tue', hour: '6PM', value: 41 },
  { day: 'Wed', hour: '6AM', value: 15 }, { day: 'Wed', hour: '8AM', value: 48 }, { day: 'Wed', hour: '10AM', value: 82 }, { day: 'Wed', hour: '12PM', value: 94 }, { day: 'Wed', hour: '2PM', value: 87 }, { day: 'Wed', hour: '4PM', value: 69 }, { day: 'Wed', hour: '6PM', value: 38 },
  { day: 'Thu', hour: '6AM', value: 22 }, { day: 'Thu', hour: '8AM', value: 58 }, { day: 'Thu', hour: '10AM', value: 88 }, { day: 'Thu', hour: '12PM', value: 98 }, { day: 'Thu', hour: '2PM', value: 91 }, { day: 'Thu', hour: '4PM', value: 75 }, { day: 'Thu', hour: '6PM', value: 43 },
  { day: 'Fri', hour: '6AM', value: 25 }, { day: 'Fri', hour: '8AM', value: 62 }, { day: 'Fri', hour: '10AM', value: 91 }, { day: 'Fri', hour: '12PM', value: 100 }, { day: 'Fri', hour: '2PM', value: 94 }, { day: 'Fri', hour: '4PM', value: 78 }, { day: 'Fri', hour: '6PM', value: 45 }
]

export function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [analyticsOverview, setAnalyticsOverview] = useState<AnalyticsOverviewData | null>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(false)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [jobTypeAnalytics, setJobTypeAnalytics] = useState<JobTypeAnalyticsItem[]>(defaultJobTypeAnalytics)
  const [efficiencyTrends, setEfficiencyTrends] = useState(
    revenueAnalytics.monthly.map(({ month, jobs }) => ({ month, jobs })),
  )
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchAnalyticsOverview = useCallback(async () => {
    if (!isMountedRef.current) return

    setIsLoadingOverview(true)
    setOverviewError(null)

    try {
      const data = await apiClient.getAnalyticsOverview()
      if (!isMountedRef.current) return
      setAnalyticsOverview(data ?? null)

      const jobTypeData = buildJobTypeAnalytics(data?.job_types)
      setJobTypeAnalytics(jobTypeData.length > 0 ? jobTypeData : [])
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      if (!isMountedRef.current) return
      setJobTypeAnalytics(defaultJobTypeAnalytics)
      setOverviewError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch analytics overview'
      )
    } finally {
      if (!isMountedRef.current) return
      setIsLoadingOverview(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalyticsOverview()
  }, [fetchAnalyticsOverview])

  useEffect(() => {
    if (!isMountedRef.current) return

    const fetchEfficiencyTrends = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiBaseUrl) return

        const token = localStorage.getItem('jdp_auth')
          ? JSON.parse(localStorage.getItem('jdp_auth')!).token
          : null

        const res = await fetch(`${apiBaseUrl}/analytics/efficiency-trends`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        const payload = await res.json()
        if (!payload?.success) return

        const jobsTrend = payload?.data?.jobs_trend
        if (!Array.isArray(jobsTrend)) return

        const normalized = jobsTrend.map((item: any) => {
          const month = item?.month ?? item?.month_key ?? ''
          return {
            month,
            jobs: typeof item?.jobs === 'number' ? item.jobs : Number(item?.jobs) || 0,
          }
        }).filter((x: any) => x.month)

        if (normalized.length > 0) setEfficiencyTrends(normalized)
      } catch (error) {
        console.error('Error fetching efficiency trends:', error)
      }
    }

    fetchEfficiencyTrends()
  }, [])

  const formatMetricValue = (value: number | null | undefined, unit?: 'currency') => {
    if (value === null || value === undefined) {
      return '--'
    }

    if (unit === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatChangeValue = (
    value: number | null | undefined,
    unit?: 'currency'
  ) => {
    if (value === null || value === undefined) {
      return null
    }

    if (value === 0) {
      return '0'
    }

    const formattedAbsolute = unit === 'currency'
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Math.abs(value))
      : new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2
        }).format(Math.abs(value))

    const prefix = value > 0 ? '+' : '-'
    return `${prefix}${formattedAbsolute}`
  }

  const buildChangeLabel = (
    difference: number | null | undefined,
    yesterday: number | null | undefined,
    unit?: 'currency'
  ) => {
    const formattedChange = formatChangeValue(difference, unit)

    if (formattedChange === null) {
      return 'No change data'
    }

    if (formattedChange === '0') {
      const yesterdayPart =
        yesterday === null || yesterday === undefined
          ? ''
          : unit === 'currency'
          ? ` (Yesterday: ${formatMetricValue(yesterday, unit)})`
          : ` (Yesterday: ${formatMetricValue(yesterday)})`

      return `No change vs yesterday${yesterdayPart}`
    }

    const yesterdayPart =
      yesterday === null || yesterday === undefined
        ? ''
        : unit === 'currency'
        ? ` (Yesterday: ${formatMetricValue(yesterday, unit)})`
        : ` (Yesterday: ${formatMetricValue(yesterday)})`

    return `${formattedChange} vs yesterday${yesterdayPart}`
  }

  const getChangeTrendClass = (difference: number | null | undefined) => {
    if (difference === null || difference === undefined || difference === 0) {
      return 'text-muted-foreground'
    }

    return difference > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getHeatmapColor = (value: number) => {
    if (value >= 90) return 'bg-[#00A1FF]'
    if (value >= 70) return 'bg-[#00A1FF]/80'
    if (value >= 50) return 'bg-[#00A1FF]/60'
    if (value >= 30) return 'bg-[#00A1FF]/40'
    return 'bg-[#00A1FF]/20'
  }

  const getComparisonIcon = (trend: string) => {
    return trend === 'up' ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Business Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights and performance metrics for data-driven decisions
          </p>
        </div>
        <div className="flex gap-3">
          {/* <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select> */}
          {/* <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button> */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsOverview}
            disabled={isLoadingOverview}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOverview ? 'animate-spin' : ''}`} />
            {isLoadingOverview ? 'Refreshing' : 'Refresh'}
          </Button>
        </div>
      </div>

      {overviewError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load analytics overview. {overviewError}
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricDefinitions.map((definition) => {
          const metricData = analyticsOverview?.[definition.key]
          const difference = metricData?.change_today_vs_yesterday?.difference ?? null
          const yesterdayTotal = metricData?.change_today_vs_yesterday?.yesterday_total ?? null
          const Icon = definition.icon
          const changeTrendClass = getChangeTrendClass(difference)
          const changeText = analyticsOverview
            ? buildChangeLabel(difference, yesterdayTotal, definition.unit)
            : isLoadingOverview
            ? 'Loading...'
            : 'Awaiting data'
          const displayValue = analyticsOverview
            ? formatMetricValue(metricData?.total, definition.unit)
            : isLoadingOverview
            ? '...'
            : '--'
          const breakdown = definition.key === 'online_staff'
            ? (metricData as OnlineStaffAnalyticsMetric | undefined)?.breakdown
            : undefined

          return (
            <Card key={definition.key} className="relative overflow-hidden border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{definition.title}</p>
                    <p className="text-2xl font-bold text-foreground">{displayValue}</p>
                    {/* <p className={`text-sm ${changeTrendClass}`}>
                      {changeText}
                    </p>  */}
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${definition.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${definition.color}`} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Analytics Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </TabsTrigger>
          {/* <TabsTrigger value="geographic" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Geographic
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <TrendingUpIcon className="h-4 w-4" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Insights
          </TabsTrigger> */}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => {
              const TrendIcon = getComparisonIcon(metric.trend)
              return (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-foreground">{metric.category}</h3>
                      <div className={`p-2 rounded-lg ${metric.trend === 'up' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <TrendIcon className={`h-4 w-4 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {typeof metric.current === 'number' && metric.current > 1000 
                            ? `$${(metric.current / 1000).toFixed(0)}k` 
                            : metric.current}
                        </span>
                        <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.change}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{metric.percentage}%</span>
                        </div>
                        <Progress value={metric.percentage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Revenue Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueAnalytics.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Bar dataKey="profit" fill="#00CEB6" radius={[2, 2, 0, 0]} />
                      <Line type="monotone" dataKey="revenue" stroke="#00A1FF" strokeWidth={3} />
                      <Area type="monotone" dataKey="revenue" fill="#00A1FF" fillOpacity={0.1} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Job Type Distribution */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Job Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingOverview ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    Loading job type data...
                  </div>
                ) : jobTypeAnalytics.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    No job type data available.
                  </div>
                ) : (
                  <>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={jobTypeAnalytics}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {jobTypeAnalytics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {jobTypeAnalytics.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.count} jobs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          {/* <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Job Activity Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-2 text-sm">
                  <div></div>
                  {['6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM'].map(hour => (
                    <div key={hour} className="text-center text-muted-foreground">{hour}</div>
                  ))}
                </div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                  <div key={day} className="grid grid-cols-8 gap-2">
                    <div className="text-sm text-muted-foreground text-right pr-2">{day}</div>
                    {heatmapData.filter(d => d.day === day).map((item, index) => (
                      <div
                        key={index}
                        className={`h-8 rounded ${getHeatmapColor(item.value)} flex items-center justify-center`}
                        title={`${item.day} ${item.hour}: ${item.value}% capacity`}
                      >
                        <span className="text-xs text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Summary Cards */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Total Revenue</h3>
                    <p className="text-sm text-muted-foreground">This period</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">
                    ${(revenueAnalytics.current / 1000).toFixed(0)}k
                  </p>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      +{revenueAnalytics.change}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last period</span>
                  </div>
                  <Progress value={(revenueAnalytics.current / revenueAnalytics.target) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {((revenueAnalytics.current / revenueAnalytics.target) * 100).toFixed(1)}% of ${(revenueAnalytics.target / 1000).toFixed(0)}k target
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Avg Job Value</h3>
                    <p className="text-sm text-muted-foreground">Per completed job</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">$13,035</p>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+8.3%</span>
                    <span className="text-sm text-muted-foreground">improvement</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Profit Margin</h3>
                    <p className="text-sm text-muted-foreground">Current period</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">30.1%</p>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">+2.1%</span>
                    <span className="text-sm text-muted-foreground">vs target</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Revenue Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue vs Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueAnalytics.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }} 
                    />
                    <Bar dataKey="revenue" fill="#00A1FF" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" fill="#00CEB6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="jobs" stroke="#FF6692" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {/* Top Performers */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performers This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-muted-foreground">{performer.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Jobs Completed</span>
                        <span className="font-medium">{performer.jobsCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Revenue</span>
                        <span className="font-medium">${(performer.revenue / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Efficiency</span>
                        <span className="font-medium">{performer.efficiency}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Rating</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{performer.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Efficiency Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={efficiencyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Area type="monotone" dataKey="jobs" stroke="#00A1FF" fill="#00A1FF" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Customer Satisfaction Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerInsights.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <h4 className="font-medium">{segment.segment}</h4>
                        <p className="text-sm text-muted-foreground">{segment.customers} customers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(segment.revenue / 1000).toFixed(0)}k</p>
                        <p className="text-sm text-muted-foreground">${segment.avgJobValue} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographic Tab */}
        {/* <TabsContent value="geographic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Regional Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geographicData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{region.region}</h4>
                          <p className="text-sm text-muted-foreground">{region.jobs} active jobs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(region.revenue / 1000).toFixed(0)}k</p>
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                          <span className="text-sm text-green-600">{region.growth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
 
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Market Share by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={geographicData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="region" type="category" stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#00A1FF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent> */}

        {/* Predictive Tab */}
        {/* <TabsContent value="predictive" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Revenue Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={[...revenueAnalytics.monthly, ...predictiveAnalytics]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#00A1FF" fill="#00A1FF" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="predicted" stroke="#FF6692" fill="#FF6692" fillOpacity={0.1} strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="upper" stroke="#FFB800" fill="none" strokeDasharray="2 2" />
                    <Area type="monotone" dataKey="lower" stroke="#FFB800" fill="none" strokeDasharray="2 2" />
                    <ReferenceLine x="Jun" stroke="#666" strokeDasharray="3 3" label="Current" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Insights Tab */}
        {/* <TabsContent value="insights" className="space-y-6"> 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">Growth Opportunity</h3>
                    <p className="text-sm text-blue-600">Eastern region shows 22% growth</p>
                  </div>
                </div>
                <p className="text-sm text-blue-800">
                  Consider expanding operations in the Eastern region to capitalize on the 22% growth rate.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Performance Insight</h3>
                    <p className="text-sm text-green-600">Customer satisfaction at 4.8/5.0</p>
                  </div>
                </div>
                <p className="text-sm text-green-800">
                  Excellent customer satisfaction scores indicate strong service quality and potential for referrals.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-orange-900">Action Required</h3>
                    <p className="text-sm text-orange-600">8 pending approvals need attention</p>
                  </div>
                </div>
                <p className="text-sm text-orange-800">
                  Review and process pending approvals to maintain operational efficiency and customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>
 
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Year-over-Year Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="thisYear" fill="#00A1FF" radius={[4, 4, 0, 0]} name="2024" />
                    <Bar dataKey="lastYear" fill="#00CEB6" radius={[4, 4, 0, 0]} name="2023" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}