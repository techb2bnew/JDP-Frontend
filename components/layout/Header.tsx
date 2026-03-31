"use client";

import { Bell, User, Search, Sun, Moon, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useEffect, useState, useRef } from "react";
import { NotificationPopup } from "../NotificationPopup";
import { useTheme } from "../../contexts/ThemeContext";
import { toast } from "sonner";
import { usePermissions } from "../../contexts/PermissionContext";
import { supabase } from "../../lib/supabase";
import { NewInvoiceDialog } from "../invoices/NewInvoiceDialog";
import { apiClient } from "../../utils/api";
import { Invoice } from "../../types/invoice";

import {
  Plus,
  Filter,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Users,
  Briefcase,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface HeaderProps {
  currentPath: string;
  onLogout: () => void;
  onNotificationViewAll: () => void;
  onProfileClick: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "order" | "payment" | "inventory" | "task";
  unread: boolean;
  onCreateEstimateClick: () => void;
}

export function Header({
  currentPath,
  onLogout,
  onNotificationViewAll,
  onProfileClick,
  onCreateEstimateClick,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme, isLoading } = useTheme();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const { hasPermission } = usePermissions();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const hasFetchedNotifications = useRef(false);
  const [realTimeUnreadCount, setRealTimeUnreadCount] = useState<number | null>(
    null,
  );
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [localJobs, setLocalJobs] = useState<any[]>([]);

  const getUserData = () => {
    try {
      const authData = localStorage.getItem("jdp_auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user || null;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    return null;
  };

  const userData = getUserData();

  const handleLogout = async () => {
    let loadingToastId: string | number | undefined;

    try {
      loadingToastId = toast.loading("Logging out...");

      const token = localStorage.getItem("jdp_auth")
        ? JSON.parse(localStorage.getItem("jdp_auth")!).token
        : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });

      toast.dismiss(loadingToastId);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          toast.success("Logged out successfully!");
          localStorage.removeItem("jdp_auth");
          onLogout();
        } else {
          toast.error(responseData.message || "Failed to logout");
          // Still call onLogout to clear local state
          onLogout();
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to logout");
        // Still call onLogout to clear local state
        onLogout();
      }
    } catch (error) {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      console.error("Error during logout:", error);
      toast.error("An error occurred during logout");
      // Still call onLogout to clear local state
      onLogout();
    }
  };

  const userId = userData?.id;

  const fetchNotifications = async () => {
    if (!userId) return;

    // Prevent duplicate calls if already loading
    if (loading) {
      return;
    }

    const authData = localStorage.getItem("jdp_auth");
    const token = authData ? JSON.parse(authData).token : null;
    if (!token) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${apiBaseUrl}/notifications/user/${userId}?page=1&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const json = await res.json();
      const normalized: Notification[] = (json.data.items || []).map(
        (item: any) => {
          // Use read_at if notification is read, otherwise use created_at
          const timeToUse =
            item.status === "read" && item.read_at
              ? item.read_at
              : item.notification?.created_at || item.delivered_at;

          return {
            id: item.notification?.id || item.notification_id,
            title: item.notification?.notification_title || "Notification",
            message: item.notification?.message || "",
            time: timeToUse || new Date().toISOString(),
            type: "task" as const,
            unread: item.status === "unread",
          };
        },
      );
      setNotifications(normalized);
      hasFetchedNotifications.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount (after login)
  useEffect(() => {
    if (userId && !hasFetchedNotifications.current) {
      fetchNotifications();
    }
  }, [userId]);

  // Set up Supabase real-time subscription for notification count
  useEffect(() => {
    if (!userId) {
      console.log("No userId, skipping Supabase subscription");
      return;
    }

    console.log("Setting up Supabase real-time subscription for user:", userId);

    // Initial count fetch
    const fetchUnreadCount = async () => {
      try {
        // First, test the connection with a simple query
        const { data: testData, error: testError } = await supabase
          .from("notification_recipients")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (testError) {
          console.error("❌ Supabase connection error:", testError);
          console.error("Error details:", {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code,
          });
          return;
        }

        // Now get the count
        const { count, error } = await supabase
          .from("notification_recipients")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "unread");

        console.log("Initial count result:", { count, error });

        if (error) {
          console.error("Error fetching unread count:", error);
          return;
        }

        if (count !== null) {
          console.log("✅ Setting initial unread count:", count);
          setRealTimeUnreadCount(count);
        } else {
          console.log("Count is null, setting to 0");
          setRealTimeUnreadCount(0);
        }
      } catch (err) {
        console.error("❌ Exception in fetchUnreadCount:", err);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription
    console.log("Creating Supabase channel for user:", userId);
    const channel = supabase
      .channel(`user-${userId}-notifications`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_recipients",
          filter: `user_id=eq.${userId}`,
        },
        async (payload: any) => {
          console.log("🔔 Real-time notification change received:", payload);
          console.log("Event type:", payload.eventType);
          console.log("New record:", payload.new);
          console.log("Old record:", payload.old);

          // Refetch count after any change
          try {
            const { count, error } = await supabase
              .from("notification_recipients")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("status", "unread");

            console.log("Updated count after change:", { count, error });

            if (error) {
              console.error("Error fetching updated count:", error);
              return;
            }

            if (count !== null) {
              console.log("Updating unread count to:", count);
              setRealTimeUnreadCount(count);
            }
          } catch (err) {
            console.error("Error in count update:", err);
          }

          // If notification was added, refresh the notifications list
          if (payload.eventType === "INSERT") {
            console.log("New notification inserted, refreshing list");
            fetchNotifications();
          }
        },
      )
      .subscribe((status) => {
        console.log("Supabase subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("✅ Successfully subscribed to real-time notifications");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Channel error in Supabase subscription");
        } else if (status === "TIMED_OUT") {
          console.error("❌ Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("Subscription closed");
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up Supabase subscription");
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Handle notification popup open/close
  const handleNotificationClick = () => {
    const newShowState = !showNotifications;
    setShowNotifications(newShowState);

    // Fetch notifications when opening the popup (always refresh on click)
    if (newShowState) {
      fetchNotifications();
    }
  };

  // Use real-time count if available, otherwise fallback to local notifications count
  // If realTimeUnreadCount is 0, it might be accurate, so check if it's been set
  const unreadCount =
    realTimeUnreadCount !== null && realTimeUnreadCount !== undefined
      ? realTimeUnreadCount
      : notifications.filter((n) => n.unread).length;

  // Fetch jobs for invoice dialog
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiClient.getJobs();
        setLocalJobs(res.data || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };

    fetchJobs();
  }, []);

  // Handle invoice save
  const handleSaveInvoice = (newInvoiceData: Partial<Invoice>) => {
    toast.success("Invoice created successfully!");
    setShowNewInvoiceDialog(false);
  };

  const getPageTitle = (path: string): string => {
    const titles: Record<string, string> = {
      "/dashboard": "Dashboard",
      "/analytics": "Analytics",
      "/products": "Products",
      "/orders": "Orders",
      "/invoices": "Invoices & Billing",
      "/customers": "Customers",
      "/jobs": "Job Management",
      "/tracking": "Live Tracking",
      "/contractors": "Contractor Listing",
      "/configuration": "Configuration",
      "/role": "Role & Permission",
      "/staff": "Staff Management",
      "/notifications": "Notifications",
      "/profile": "Profile",
      "/profiles": "Profiles",
      "/profiles/staff": "Staff Profile",
      "/profiles/lead-labour": "Lead Labour Profile",
      "/profiles/labour": "Labour Profile",
    };
    return titles[path] || "Dashboard";
  };

  // const notifications = [
  //   {
  //     id: "1",
  //     title: "New Order Received",
  //     message: "Order #12345 has been placed by John Doe",
  //     time: "2 minutes ago",
  //     type: "order" as const,
  //     unread: true
  //   },
  //   {
  //     id: "2",
  //     title: "Payment Confirmed",
  //     message: "Payment of $1,250 has been confirmed for Invoice #INV-001",
  //     time: "15 minutes ago",
  //     type: "payment" as const,
  //     unread: true
  //   },
  //   {
  //     id: "3",
  //     title: "Low Stock Alert",
  //     message: "Product 'Steel Beams' is running low in inventory",
  //     time: "1 hour ago",
  //     type: "inventory" as const,
  //     unread: false
  //   },
  //   {
  //     id: "4",
  //     title: "Task Completed",
  //     message: "John Smith has completed the installation task",
  //     time: "3 hours ago",
  //     type: "task" as const,
  //     unread: false
  //   }
  // ]

  // const unreadCount = notifications.filter(n => n.unread).length

  const router = useRouter()


  return (
    <TooltipProvider>
      <header className="bg-card border-b px-6 py-4 animate-fade-in shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 gap-3 w-[70%]">
            {/* <h1 className="text-2xl font-medium text-foreground w-[25%]">
              {getPageTitle(currentPath)}
            </h1> */}

            {/* Search */}
            {/* <div className="relative hidden md:block w-[35%]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className=" pl-9 transition-all duration-200 focus:w-80 bg-[#f8f8f8]"
              />
            </div> */}
          </div>

          <div className="flex items-center space-x-3">
            {hasPermission("jobs", "create") && (
              <Link
                href={"/jobs?create=true"}
                className="flex items-center w-[120px] p-2 justify-center border rounded gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Add Jobs
              </Link>
            )}
            {hasPermission("invoices", "create") && (
              <Button
                onClick={() => router.push("/invoices/create")}
                className="bg-primary text-white"
              >
                <Plus className="h-4 w-4" />
                Create New Estimate
              </Button>
            )}

            {/* Theme Toggle */}
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  disabled={isLoading}
                >
                  <div className="relative w-4 h-4">
                    {theme === 'light' ? (
                      <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
                    ) : (
                      <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
                    )}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Switch to {theme === 'light' ? 'dark' : 'light'} mode</p>
              </TooltipContent>
            </Tooltip> */}

            {/* Notifications */}
            {hasPermission("notification", "view") && (
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNotificationClick}
                      className="notification-button"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs notification-badge animate-bounce-in"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Notifications{" "}
                      {unreadCount > 0 && `(${unreadCount} unread)`}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {showNotifications && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <NotificationPopup
                        setNotifications={setNotifications}
                        notifications={notifications}
                        onClose={() => setShowNotifications(false)}
                        onViewAll={onNotificationViewAll}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="profile-button">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="/assets/images/avatars/admin-user.jpg"
                      alt="Admin"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 animate-scale-in"
                sideOffset={5}
              >
                <DropdownMenuLabel>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          userData?.photo_url ||
                          "/assets/images/avatars/admin-user.jpg"
                        }
                        alt={userData?.full_name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userData?.full_name ? (
                          userData.full_name.charAt(0).toUpperCase()
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {userData?.full_name || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userData?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onProfileClick}
                  className="cursor-pointer"
                >
                  <User className="  h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                {/* <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="logout-button cursor-pointer"
                >
                  <div className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
