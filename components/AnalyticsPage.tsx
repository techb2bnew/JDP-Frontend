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
  // {
  //   key: 'todays_revenue',
  //   title: "Today's Revenue",
  //   icon: DollarSign,
  //   color: 'text-purple-600',
  //   bgColor: 'bg-purple-50',
  //   unit: 'currency'
  // }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        {/* Overview Tab */}
        <div className="space-y-6">
        

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
                    {/* <ComposedChart data={revenueAnalytics.monthly}>
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
                    </ComposedChart> */}
                    <AreaChart data={efficiencyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="jobs"
                          stroke="#00A1FF"
                          fill="#00A1FF"
                          fillOpacity={0.3}
                        />
                    </AreaChart>
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
          </div>
   



      </Tabs>
    </div>
  )
}