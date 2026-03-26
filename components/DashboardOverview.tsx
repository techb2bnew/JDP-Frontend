"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  RadialBar,
  ComposedChart,
  Legend
} from "recharts";
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
  CreditCard,
} from "lucide-react";
import { apiClient } from "../utils/api";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import {
  Calendar as MultiDateCalendar,
  DateObject,
} from "react-multi-date-picker";




const quickActions = [
  { title: "Jobs", icon: Plus, color: "bg-blue-500", path: "jobs" },
  { title: "Customer", icon: Users, color: "bg-green-500", path: "customers" },
  {
    title: "Generate Invoice",
    icon: FileText,
    color: "bg-purple-500",
    path: "invoices",
  },
  {
    title: "View Analytics",
    icon: BarChart3,
    color: "bg-orange-500",
    path: "analytics",
  },
  {
    title: "Manage Staff",
    icon: UserCheck,
    color: "bg-red-500",
    path: "staff",
  },
  { title: "Orders", icon: Package, color: "bg-indigo-500", path: "orders" },
];



export function DashboardOverview() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7days");
  const router = useRouter();
  const [isKpiLoading, setIsKpiLoading] = useState(true);
  const [summary, setSummary] = useState<{
    total_revenue: number;
    active_jobs: number;
    jobs_summary: {
      total: number;
      active: number;
      completed: number;
      draft: number;
      pending: number;
    };
    team_members: {
      total: number;
      staff: number;
      labor: number;
      lead_labor: number;
    };
  } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [projectStatusData, setProjectStatusData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([
    { name: "In Progress", value: 0, color: "#00A1FF" },
    { name: "Active", value: 0, color: "#4F46E5" },
    { name: "Completed", value: 0, color: "#00CEB6" },
  ]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activities, setActivities] = useState<
    Array<{
      id: number;
      type: string;
      title: string;
      description: string;
      timestamp: string;
    }>
  >([]);
  const [activitiesTotal, setActivitiesTotal] = useState(0);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const activitiesPageSize = 5;
  const [userName, setUserName] = useState("Admin");
  const [selectedRanges, setSelectedRanges] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [revenueChartData, setRevenueChartData] = useState<{
    month: string;
    tm_revenue: number;
    tm_profit: number;
    tm_jobs: number;
    est_revenue: number;
    est_profit: number;
    est_jobs: number;
  }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsKpiLoading(true);
        const data = await apiClient.getDashboardSummary();
        setSummary(data);
      } catch (e) {
        console.error("Failed to load dashboard summary", e);
      } finally {
        setIsKpiLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("jdp_auth");
        if (raw) {
          const parsed = JSON.parse(raw);
          const name =
            parsed?.user?.full_name ||
            parsed?.user?.name ||
            parsed?.user?.email;
          if (name) setUserName(name);
        }
      }
    } catch (e) {
      console.error("Failed to load user from localStorage", e);
    }
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        setStatusLoading(true);
        const data = await apiClient.getJobStatusDistribution();
        const percentages = data?.percentages || {};
        setProjectStatusData([
          {
            name: "In Progress",
            value: percentages.in_progress ?? 0,
            color: "#00A1FF",
          },
          {
            name: "Active",
            value: percentages.active ?? percentages.in_progress ?? 0,
            color: "#4F46E5",
          },
          {
            name: "Completed",
            value: percentages.completed ?? 0,
            color: "#00CEB6",
          },
        ]);
      } catch (e) {
        console.error("Failed to load job status distribution", e);
      } finally {
        setStatusLoading(false);
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true);
        const res = await apiClient.getRecentActivities(
          activitiesPage,
          activitiesPageSize,
        );
        setActivities(res.items || []);
        setActivitiesTotal(res.total_found || 0);
      } catch (e) {
        console.error("Failed to load recent activities", e);
        setActivities([]);
        setActivitiesTotal(0);
      } finally {
        setActivitiesLoading(false);
      }
    };
    loadActivities();
  }, [activitiesPage]);

  const formatActivityTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  const getActivityStyle = (type: string) => {
    switch (type) {
      case "job_completed":
        return {
          Icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
        };
      case "new_order":
        return { Icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" };
      case "payment_received":
        return { Icon: DollarSign, color: "text-green-600", bg: "bg-green-50" };
      case "overtime_request":
        return { Icon: Clock, color: "text-orange-600", bg: "bg-orange-50" };
      case "staff_created":
        return { Icon: Users, color: "text-purple-600", bg: "bg-purple-50" };
      case "labor_updated":
        return { Icon: HardHat, color: "text-amber-600", bg: "bg-amber-50" };
      default:
        return { Icon: Activity, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value:
        typeof summary?.total_revenue === "number"
          ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(summary.total_revenue)
          : "$0",
      change: "",
      trend: "up",
      period: "",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Jobs",
      value: String(summary?.active_jobs ?? 0),
      change: "",
      trend: "up",
      period: "",
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Team Members",
      value: String(summary?.team_members?.total ?? 0),
      change: "",
      trend: "up",
      period: "",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };




  const fetchRevenueAnalytics = async (from = "", to = "") => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("jdp_auth")
        ? JSON.parse(localStorage.getItem("jdp_auth")!).token
        : null;

      const params = new URLSearchParams();
      if (from) params.set("startDate", from);
      if (to) params.set("endDate", to);

      const res = await fetch(
        `${apiBaseUrl}/analytics/revenue-analytics?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await res.json();

      if (data?.success) {
        const tmJobs: any[] = data.data?.revenue_analytics_by_source?.time_material_job || [];
        const estJobs: any[] = data.data?.revenue_analytics_by_source?.estimate_job || [];

        const merged = tmJobs.map((tm: any, i: number) => {
          const est = estJobs[i] || {};
          return {
            month: tm.month,
            tm_revenue: tm.revenue || 0,
            tm_profit: tm.profit || 0,
            tm_jobs: tm.jobs || 0,
            est_revenue: est.revenue || 0,
            est_profit: est.profit || 0,
            est_jobs: est.jobs || 0,
          };
        });

        setRevenueChartData(merged);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRevenueAnalytics();
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchRevenueAnalytics(dateFrom, dateTo);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!dateFrom && !dateTo && selectedRanges.length === 0) {
      fetchRevenueAnalytics();
    }
  }, [dateFrom, dateTo, selectedRanges]);
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#00A1FF] to-[#0090e6] rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {/* <div className="text-center">
              <div className="text-2xl font-bold">23°C</div>
              <div className="text-sm text-blue-100">Weather</div>
            </div> */}
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Date().toLocaleDateString("en-US", { day: "numeric" })}
              </div>
              <div className="text-sm text-blue-100">
                {new Date().toLocaleDateString("en-US", { month: "short" })}
              </div>
            </div>
          </div>
        </div>
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
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => router.push(`/${action.path}`)}
                  className="h-20 flex flex-col gap-2 hover:scale-105 transition-transform duration-200 border-dashed hover:bg-muted/50"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs text-center leading-tight">
                    {action.title}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {kpi.title}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {isKpiLoading ? "…" : kpi.value}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>



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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[300px] justify-start text-left font-normal relative pr-10"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">
                      {selectedRanges.length > 0
                        ? (() => {
                          const allDates = selectedRanges
                            .flat()
                            .map((d) =>
                              d instanceof DateObject
                                ? d.toDate()
                                : new Date(d),
                            )
                            .filter((d) => !Number.isNaN(d.getTime()));

                          const sorted = [...allDates].sort(
                            (a, b) => a.getTime() - b.getTime(),
                          );
                          const from = sorted[0];
                          const to = sorted[sorted.length - 1];

                          if (!from) return "Pick dates";
                          if (sorted.length === 1)
                            return format(from, "LLL dd, y");

                          return `${format(from, "LLL dd, y")} - ${format(to, "LLL dd, y")}`;
                        })()
                        : "Pick dates range"}
                    </span>

                    {selectedRanges.length > 0 && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRanges([]);
                          setDateFrom("");
                          setDateTo("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-3">
                  <MultiDateCalendar
                    multiple
                    range
                    value={selectedRanges}
                    onChange={(value) => {
                      const values = Array.isArray(value)
                        ? value
                        : value
                          ? [value]
                          : [];
                      setSelectedRanges(values);

                      const allDates = values
                        .flat()
                        .map((d) =>
                          d instanceof DateObject ? d.toDate() : new Date(d),
                        )
                        .filter((d) => !Number.isNaN(d.getTime()));

                      if (allDates.length === 0) {
                        setDateFrom("");
                        setDateTo("");
                        return;
                      }

                      const sorted = [...allDates].sort(
                        (a, b) => a.getTime() - b.getTime(),
                      );

                      setDateFrom(format(sorted[0], "yyyy-MM-dd"));
                      setDateTo(
                        format(sorted[sorted.length - 1], "yyyy-MM-dd"),
                      );
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueChartData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div
                          style={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            padding: "12px 16px",
                            minWidth: "200px",
                          }}
                        >
                          <p style={{ fontWeight: 600, marginBottom: 8, color: "#1e293b" }}>
                            {label}
                          </p>

                          {/* Estimate Job Section */}
                          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Estimate Job
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, color: "#00CEB6" }}>● Revenue</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload.find(p => p.dataKey === "est_revenue")?.value ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: "#009E8E" }}>● Profit</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload.find(p => p.dataKey === "est_profit")?.value ?? 0).toLocaleString()}
                            </span>
                          </div>

                          {/* T&M Job Section */}
                          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Time &amp; Material Job
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, color: "#00A1FF" }}>● Revenue</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload.find(p => p.dataKey === "tm_revenue")?.value ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "#0070CC" }}>● Profit</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload.find(p => p.dataKey === "tm_profit")?.value ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: "16px" }}
                  />
 

                  {/* Time & Material Job */}
                  <Bar dataKey="tm_revenue" name="T&M Revenue" fill="#00A1FF" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="tm_profit" name="T&M Profit" fill="#0070CC" radius={[6, 6, 0, 0]} maxBarSize={40} />

                  {/* Estimate Job */}
                  <Bar dataKey="est_revenue" name="Estimate Revenue" fill="#00CEB6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="est_profit" name="Estimate Profit" fill="#009E8E" radius={[6, 6, 0, 0]} maxBarSize={40} />

                  {/* Hidden bars for tooltip data only */}
                  <Bar dataKey="tm_profit" name="T&M Profit" fill="#0070CC" hide />
                  <Bar dataKey="est_profit" name="Estimate Profit" fill="#009E8E" hide />
                </ComposedChart>

                {/* 🔥 ONLY PAID JOBS DATA */}
                <Bar dataKey="revenue" fill="#00A1FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#00CEB6" radius={[4, 4, 0, 0]} />

                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="#FF6692"
                  strokeWidth={3}
                />
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#00A1FF]" />
              Job Status
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
                  <span className="text-sm font-medium">
                    {statusLoading ? "…" : `${item.value}%`}
                  </span>
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading activities…
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No recent activities
                </div>
              ) : (
                activities.map((activity, index) => {
                  const { Icon, color, bg } = getActivityStyle(activity.type);
                  return (
                    <div
                      key={`activity-${activity.id}-${index}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatActivityTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivitiesPage((p) => Math.max(1, p - 1))}
              disabled={activitiesPage === 1 || activitiesLoading}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {activitiesPage} of{" "}
              {Math.max(1, Math.ceil(activitiesTotal / activitiesPageSize))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivitiesPage((p) => p + 1)}
              disabled={
                activitiesLoading ||
                activitiesPage >=
                Math.ceil(activitiesTotal / activitiesPageSize)
              }
            >
              Next
            </Button>
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[#00A1FF]" />
                Financial Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Monthly Revenue
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      $84,725
                    </p>
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
                    <p className="text-muted-foreground text-sm">
                      Pending Invoices
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      $23,450
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                      <span className="text-sm text-orange-600">
                        15 Overdue
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
