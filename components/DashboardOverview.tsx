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
  ComposedChart
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
import { normalizeSingleRangeSelection, sortedDatesFromPickerRange } from "@/utils/dateRangeSelection";




const quickActions = [
  { title: "Customer", icon: Users, color: "bg-green-500", path: "customers" },
  { title: "Contractor", icon: Briefcase, color: "bg-blue-500", path: "contractors" },
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
    /** @deprecated Prefer jobs_summary.total / total_jobs for display */
    active_jobs: number;
    /** When backend sends split counts (optional) */
    total_jobs?: number;
    customer_jobs_count?: number;
    contractor_jobs_count?: number;
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
  const formatDisplayName = (value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "Admin";
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const [selectedRanges, setSelectedRanges] = useState<DateObject[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [totalRevenue, settotalRevenue] = useState("");
  const [revenueChartData, setRevenueChartData] = useState<{
    month: string;
    tm_revenue: number;
    tm_profit: number;  
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
          if (name) setUserName(formatDisplayName(name));
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
        const counts = data?.counts || {};
        const totalJobs = Number(data?.total || 0);

        const inProgressCount = Number(counts.in_progress ?? 0);
        const pendingCount = Number(counts.pending ?? 0);
        const activeCount = Number(counts.active ?? 0);
        const completedCount = Number(counts.completed ?? 0);

        const inProgressCombinedPct =
          totalJobs > 0
            ? ((inProgressCount + pendingCount) / totalJobs) * 100
            : Number(percentages.in_progress ?? 0) + Number(percentages.pending ?? 0);

        const activePct =
          totalJobs > 0
            ? (activeCount / totalJobs) * 100
            : Number(percentages.active ?? 0);

        const completedPct =
          totalJobs > 0
            ? (completedCount / totalJobs) * 100
            : Number(percentages.completed ?? 0);

        setProjectStatusData([
          {
            name: "In Progress",
            value: inProgressCombinedPct,
            color: "#00A1FF",
          },
          {
            name: "Active",
            value: activePct,
            color: "#4F46E5",
          },
          {
            name: "Completed",
            value: completedPct,
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

  /** Total jobs = customer (service) + contractor jobs when API sends parts; else jobs_summary.total / total_jobs / active_jobs */
  const totalJobsCount = (() => {
    const s = summary as
      | (typeof summary & {
          total_jobs?: number;
          customer_jobs_count?: number;
          contractor_jobs_count?: number;
        })
      | null;
    if (!s) return 0;
    const c = s.customer_jobs_count;
    const ct = s.contractor_jobs_count;
    if (c != null && ct != null && !Number.isNaN(Number(c)) && !Number.isNaN(Number(ct))) {
      return Number(c) + Number(ct);
    }
    if (s.total_jobs != null && !Number.isNaN(Number(s.total_jobs))) {
      return Number(s.total_jobs);
    }
    if (s.jobs_summary?.total != null) {
      return Number(s.jobs_summary.total);
    }
    return Number(s.active_jobs ?? 0);
  })();

  const kpiCards = [
   
    {
      title: "Total Jobs",
      value: String(totalJobsCount),
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
        const tmJobs: any[] = data.data?.revenue_analytics || [];
        // const estJobs: any[] = data.data?.revenue_analytics?.estimate_job || [];
        const totalRev = data.data?.revenue_analytics_totals?.revenue
        const merged = tmJobs.map((tm: any, i: number) => { 
          return {
            month: tm.month,
            tm_revenue: tm.revenue || 0,
            tm_profit: tm.profit || 0, 
          };
        });

        setRevenueChartData(merged);
        settotalRevenue(totalRev)
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
      <Card className="border border-solid border-[rgb(229,231,235)] shadow-sm">
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
        <Card 
              className="relative overflow-hidden border border-solid border-[rgb(229,231,235)] shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center bg-green-50 justify-center`}
                      >
                        <DollarSign className={`h-5 w-5 text-green-600`} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Revenue
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      ${totalRevenue}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="relative overflow-hidden border border-solid border-[rgb(229,231,235)] shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
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
        <Card className="lg:col-span-2 border border-solid border-[rgb(229,231,235)] shadow-sm">
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

                <PopoverContent
                  align="end"
                  className="w-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)]"
                >
                  <MultiDateCalendar
                    range
                    value={selectedRanges}
                    onChange={(value) => {
                      const values = normalizeSingleRangeSelection(value);
                      setSelectedRanges(values);

                      const allDates = sortedDatesFromPickerRange(values);

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

                           

                          <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Total Revenue
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, color: "#00A1FF" }}>● Revenue</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload.find((p) => p.dataKey === "tm_revenue")?.value ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 13, color: "#0070CC" }}>● Profit</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                              ${(payload[0]?.payload?.tm_profit ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="tm_revenue"
                    name="Revenue"
                    fill="#00A1FF"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
  
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border border-solid border-[rgb(229,231,235)] shadow-sm">
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
                    paddingAngle={
                      projectStatusData.filter((item) => Number(item.value) > 0).length > 1
                        ? 5
                        : 0
                    }
                    dataKey="value"
                    stroke="none"
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
                    {statusLoading
                      ? "…"
                      : `${new Intl.NumberFormat("en-US", {
                          maximumFractionDigits: 2,
                        }).format(item.value)}%`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Activities */}
        <Card className="border border-solid border-[rgb(229,231,235)] shadow-lg">
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
        {/* <Card className="border border-solid border-[rgb(229,231,235)] shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[#00A1FF]" />
                Financial Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>

            <Card className="border border-solid border-[rgb(229,231,235)] shadow-sm">
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

            <Card className="border border-solid border-[rgb(229,231,235)] shadow-sm">
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
        </Card> */}
      </div>
    </div >
  );
}
