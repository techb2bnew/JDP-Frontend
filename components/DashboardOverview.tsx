'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
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
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  Eye,
  Plus,
  ArrowRight,
  Target,
  Zap,
  Star,
  MapPin,
  Phone,
  Mail,
  Bell,
  FileText,
  BarChart3,
  Home,
  Settings,
  UserCheck,
  HardHat,
  Truck,
  Wrench,
  ChevronRight,
  Timer,
  AlertCircle,
  Award,
  Building,
  CreditCard
} from 'lucide-react'

// Mock Data
const kpiData = [
  {
    title: 'Total Revenue',
    value: '$847,256',
    change: '+12.5%',
    trend: 'up',
    period: 'vs last month',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    chartData: [
      { month: 'Jan', value: 65000 },
      { month: 'Feb', value: 72000 },
      { month: 'Mar', value: 68000 },
      { month: 'Apr', value: 79000 },
      { month: 'May', value: 85000 },
      { month: 'Jun', value: 84725 }
    ]
  },
  {
    title: 'Active Jobs',
    value: '142',
    change: '+8.2%',
    trend: 'up',
    period: 'vs last week',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    chartData: [
      { month: 'Jan', value: 98 },
      { month: 'Feb', value: 105 },
      { month: 'Mar', value: 118 },
      { month: 'Apr', value: 135 },
      { month: 'May', value: 140 },
      { month: 'Jun', value: 142 }
    ]
  },
  {
    title: 'Team Members',
    value: '89',
    change: '+3.1%',
    trend: 'up',
    period: 'new hires',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    chartData: [
      { month: 'Jan', value: 78 },
      { month: 'Feb', value: 82 },
      { month: 'Mar', value: 85 },
      { month: 'Apr', value: 87 },
      { month: 'May', value: 89 },
      { month: 'Jun', value: 89 }
    ]
  },
  {
    title: 'Customer Satisfaction',
    value: '4.8/5.0',
    change: '+0.3',
    trend: 'up',
    period: 'rating',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    chartData: [
      { month: 'Jan', value: 4.2 },
      { month: 'Feb', value: 4.4 },
      { month: 'Mar', value: 4.5 },
      { month: 'Apr', value: 4.6 },
      { month: 'May', value: 4.7 },
      { month: 'Jun', value: 4.8 }
    ]
  }
]

const revenueData = [
  { month: 'Jan', revenue: 65000, expenses: 45000, profit: 20000 },
  { month: 'Feb', revenue: 72000, expenses: 48000, profit: 24000 },
  { month: 'Mar', revenue: 68000, expenses: 47000, profit: 21000 },
  { month: 'Apr', revenue: 79000, expenses: 52000, profit: 27000 },
  { month: 'May', revenue: 85000, expenses: 55000, profit: 30000 },
  { month: 'Jun', revenue: 84725, expenses: 54000, profit: 30725 }
]

const projectStatusData = [
  { name: 'In Progress', value: 45, color: '#00A1FF' },
  { name: 'Completed', value: 35, color: '#00CEB6' },
  { name: 'Pending', value: 15, color: '#FFB800' },
  { name: 'On Hold', value: 5, color: '#FF6692' }
]

const teamPerformanceData = [
  { name: 'David Wilson', role: 'Lead Electrician', completedJobs: 23, rating: 4.9, status: 'active' },
  { name: 'Mike Rodriguez', role: 'Electrician', completedJobs: 18, rating: 4.7, status: 'active' },
  { name: 'Sarah Chen', role: 'Project Manager', completedJobs: 31, rating: 4.8, status: 'active' },
  { name: 'John Smith', role: 'Lead Plumber', completedJobs: 19, rating: 4.6, status: 'on-job' }
]

const recentActivities = [
  {
    id: 1,
    type: 'job_completed',
    title: 'Job JOB-2025-005 Completed',
    description: 'Electrical panel upgrade at ABC Corporation',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 2,
    type: 'new_order',
    title: 'New Order Received',
    description: 'Order #ORD-2025-187 from XYZ Office Complex',
    time: '4 hours ago',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 3,
    type: 'payment_received',
    title: 'Payment Received',
    description: '$15,200 payment for Invoice #INV-2025-003',
    time: '6 hours ago',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 4,
    type: 'overtime_request',
    title: 'Overtime Request',
    description: 'John Smith requested 4 hours overtime',
    time: '8 hours ago',
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 5,
    type: 'new_customer',
    title: 'New Customer Added',
    description: 'Metro Building Solutions joined as customer',
    time: '1 day ago',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
]

const upcomingTasks = [
  {
    id: 1,
    title: 'Review Quarterly Reports',
    dueDate: 'Today, 3:00 PM',
    priority: 'high',
    category: 'Analytics'
  },
  {
    id: 2,
    title: 'Approve Overtime Requests',
    dueDate: 'Tomorrow, 9:00 AM',
    priority: 'medium',
    category: 'HR'
  },
  {
    id: 3,
    title: 'Update Inventory Levels',
    dueDate: 'Jan 25, 2:00 PM',
    priority: 'low',
    category: 'Inventory'
  },
  {
    id: 4,
    title: 'Customer Follow-up Call',
    dueDate: 'Jan 26, 10:00 AM',
    priority: 'medium',
    category: 'Sales'
  }
]

const quickActions = [
  { title: 'Create New Job', icon: Plus, color: 'bg-blue-500', path: 'job-management' },
  { title: 'Add Customer', icon: Users, color: 'bg-green-500', path: 'customers' },
  { title: 'Generate Invoice', icon: FileText, color: 'bg-purple-500', path: 'invoices' },
  { title: 'View Analytics', icon: BarChart3, color: 'bg-orange-500', path: 'analytics' },
  { title: 'Manage Staff', icon: UserCheck, color: 'bg-red-500', path: 'staff-management' },
  { title: 'Track Orders', icon: Package, color: 'bg-indigo-500', path: 'orders' }
]

const moduleCards = [
  {
    title: 'Job Management',
    description: 'Manage projects and assignments',
    icon: Briefcase,
    stats: '142 Active Jobs',
    color: 'from-blue-500 to-blue-600',
    path: 'job-management'
  },
  {
    title: 'Staff Management',
    description: 'Team performance and scheduling',
    icon: UserCheck,
    stats: '89 Team Members',
    color: 'from-green-500 to-green-600',
    path: 'staff-management'
  },
  {
    title: 'Live Tracking',
    description: 'Real-time project monitoring',
    icon: Activity,
    stats: '23 Live Jobs',
    color: 'from-purple-500 to-purple-600',
    path: 'live-tracking'
  },
  {
    title: 'Analytics',
    description: 'Business insights and reports',
    icon: BarChart3,
    stats: '$847K Revenue',
    color: 'from-orange-500 to-orange-600',
    path: 'analytics'
  }
]

export function DashboardOverview() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#00A1FF] to-[#0090e6] rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Admin! 👋</h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your business today. You have{' '}
              <span className="font-semibold text-white">3 urgent tasks</span> pending.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">23°C</div>
              <div className="text-sm text-blue-100">Weather</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { day: 'numeric' })}</div>
              <div className="text-sm text-blue-100">{new Date().toLocaleDateString('en-US', { month: 'short' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                      <div className="text-sm text-muted-foreground">{kpi.title}</div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">{kpi.value}</div>
                    <div className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {kpi.change}
                      </div>
                      <span className="text-xs text-muted-foreground">{kpi.period}</span>
                    </div>
                  </div>
                  <div className="w-20 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={kpi.chartData}>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={kpi.color.includes('green') ? '#16a34a' : kpi.color.includes('blue') ? '#2563eb' : kpi.color.includes('purple') ? '#9333ea' : '#eab308'}
                          fill={kpi.color.includes('green') ? '#16a34a20' : kpi.color.includes('blue') ? '#2563eb20' : kpi.color.includes('purple') ? '#9333ea20' : '#eab30820'}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#00A1FF]" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:scale-105 transition-transform duration-200 border-dashed hover:bg-muted/50"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs text-center leading-tight">{action.title}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#00A1FF]" />
                Revenue Analytics
              </CardTitle>
              <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="7days">7D</TabsTrigger>
                  <TabsTrigger value="30days">30D</TabsTrigger>
                  <TabsTrigger value="90days">90D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
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
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#00A1FF"
                    fill="#00A1FF"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#00CEB6"
                    fill="#00CEB6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#00A1FF]" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {projectStatusData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#00A1FF]" />
                Recent Activities
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[#00A1FF]" />
                Upcoming Tasks
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.category} • {task.dueDate}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#00A1FF]" />
              Top Performers This Month
            </CardTitle>
            <Button variant="outline" size="sm">
              View Full Report <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamPerformanceData.map((member, index) => (
              <div key={index} className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#E6F6FF] text-[#00A1FF]">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-sm">{member.name}</h4>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Jobs</span>
                    <span className="font-medium">{member.completedJobs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{member.rating}</span>
                    </div>
                  </div>
                  <Badge className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                    {member.status === 'active' ? 'Available' : 'On Job'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Navigation Cards */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-[#00A1FF]" />
            Business Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleCards.map((module, index) => {
              const Icon = module.icon
              return (
                <div
                  key={index}
                  className={`relative p-6 rounded-xl bg-gradient-to-br ${module.color} text-white overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 group`}
                >
                  <div className="relative z-10">
                    <Icon className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">{module.title}</h3>
                    <p className="text-sm text-white/80 mb-3">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{module.stats}</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Monthly Revenue</p>
                <p className="text-2xl font-bold text-foreground">$84,725</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pending Invoices</p>
                <p className="text-2xl font-bold text-foreground">$23,450</p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                  <span className="text-sm text-orange-600">15 Overdue</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Profit Margin</p>
                <p className="text-2xl font-bold text-foreground">36.3%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}