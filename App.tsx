'use client'

import { useState, useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import { ThemeProvider } from './contexts/ThemeContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { Toaster, toast } from 'sonner'
import { initFirebaseMessaging, onForegroundMessage } from './lib/firebase'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { AuthFlow } from './components/AuthFlow'
import { DashboardOverview } from './components/DashboardOverview'
import { AnalyticsPage } from './components/AnalyticsPage'
import { ConfigurationPage } from './components/ConfigurationPage'
import { ContractorListingPage } from './components/ContractorListingPage'
import { CustomersPage } from './components/CustomersPage'
import { InvoicesPage } from './components/InvoicesPage'
import { JobManagementPage } from './components/JobManagementPage'
import { LiveTrackingPage } from './components/LiveTrackingPage'
import { NotificationsPage } from './components/NotificationsPage'
import { OrdersPage } from './components/OrdersPage'
import { ProfilePage } from './components/ProfilePage'
import { ProfilesPage } from './components/ProfilesPage'
import { StaffManagementPage } from './components/StaffManagementPage'
import { StaffProfilePage } from './components/profiles/StaffProfilePage'
import { LeadLabourProfilePage } from './components/profiles/LeadLabourProfilePage'
import { LabourProfilePage } from './components/profiles/LabourProfilePage'
import { TimesheetsPage } from './components/TimesheetsPage'
import { ActionButtonsDemo } from './components/ActionButtonsDemo'
import { useAppDispatch } from './redux/hooks'
import { logout } from './redux/slices/authSlice'
import { clearAuthData } from './utils/auth'

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<string>('dashboard')
  const [selectedLeadLabourId, setSelectedLeadLabourId] = useState<string | null>(null)
  const [showLeadLabourDetails, setShowLeadLabourDetails] = useState<boolean>(false)
  const dispatch = useAppDispatch()

  // Set up Firebase Cloud Messaging listener for global notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let unsubscribe: (() => void) | null = null;
    
    const setupFirebaseMessaging = async () => {
      try {
        // Request notification permission first
        if ('Notification' in window && Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
          } catch (err) {
            console.warn('Failed to request notification permission:', err);
          }
        }
        
        // Initialize Firebase messaging
        const messaging = initFirebaseMessaging();
        
        if (!messaging) {
          console.warn('Firebase messaging initialization failed');
          return;
        }
        
        console.log('Firebase messaging initialized successfully');
        
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered for FCM:', registration.scope);
          } catch (err) {
            console.warn('SW registration failed:', err);
          }
        }
 
        unsubscribe = onForegroundMessage((payload: any) => {
 
          const title = payload.notification?.title || payload.data?.title || payload.data?.notification_title || 'New Notification';
          const body = payload.notification?.body || payload.data?.message || payload.data?.body || '';
          
 
          
          // Show native browser notification
          if ('Notification' in window) {
            console.log('Notification API is available');
            
            if (Notification.permission === 'granted') {
              console.log('Permission is granted, creating notification...');
              try {
                const notification = new Notification(title, {
                  body: body,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: payload.messageId || Date.now().toString(),
                  requireInteraction: false,
                  data: payload.data || {}
                }); 
                
                // Auto close after 10 seconds (increased for visibility)
                setTimeout(() => {
                  notification.close();
                  console.log('Notification auto-closed');
                }, 10000);
                
                // Handle notification click
                notification.onclick = () => {
                  console.log('Notification clicked');
                  window.focus();
                  notification.close();
                };
                
                notification.onerror = (error) => {
                  console.error('Notification error:', error);
                };
                
                notification.onshow = () => {
                  console.log('Notification shown');
                };
                
                notification.onclose = () => {
                  console.log('Notification closed');
                };
              } catch (error) {
                console.error('Error creating notification:', error);
              }
            } else if (Notification.permission === 'denied') {
              console.warn('Notification permission is denied');
            } else {
              console.log('Requesting notification permission...');
              // Request permission if not already denied
              Notification.requestPermission().then((permission) => {
                console.log('Permission result:', permission);
                if (permission === 'granted') {
                  try {
                    const notification = new Notification(title, {
                      body: body,
                      icon: '/favicon.ico',
                      badge: '/favicon.ico',
                      tag: payload.messageId || Date.now().toString(),
                      requireInteraction: false,
                      data: payload.data || {}
                    });
                    
                    console.log('Notification created after permission grant:', notification);
                    
                    setTimeout(() => {
                      notification.close();
                    }, 10000);
                    
                    notification.onclick = () => {
                      window.focus();
                      notification.close();
                    };
                  } catch (error) {
                    console.error('Error creating notification after permission grant:', error);
                  }
                }
              });
            }
          } else {
            console.warn('Notification API is not available in this browser');
          }
          
          // Also show toast notification as fallback
          toast.success(title, {
            description: body,
            duration: 5000,
          });
        });
        
        if (unsubscribe) {
          console.log('✅ Firebase foreground message listener set up successfully');
          console.log('Unsubscribe function:', typeof unsubscribe);
        } else {
          console.error('❌ Failed to set up foreground message listener - unsubscribe is null');
        }
      } catch (error) {
        console.error('❌ Error setting up Firebase messaging:', error);
      }
    };

    console.log('🚀 Starting Firebase messaging setup...');
    setupFirebaseMessaging();

    return () => {
      try {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
          console.log('Firebase listener unsubscribed');
        }
      } catch (e) {
        console.warn('Error unsubscribing from FCM:', e);
      }
    };
  }, []);

  const handleLeadLabourView = (id: string) => {
    setSelectedLeadLabourId(id)
    setShowLeadLabourDetails(true)
  }

  const handleBackToLeadLabour = () => {
    setShowLeadLabourDetails(false)
    setSelectedLeadLabourId(null)
  }

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard')
  }

  const handleNotificationViewAll = () => {
    setCurrentPage('notifications')
  }

  const handleProfileClick = () => {
    setCurrentPage('profile')
  }

  const renderPage = () => {
    if (showLeadLabourDetails && selectedLeadLabourId) {
      return (
        <StaffManagementPage
          onViewLeadLabourDetails={handleLeadLabourView}
          onBackToLeadLabour={handleBackToLeadLabour}
          selectedLeadLabourId={selectedLeadLabourId}
          showLeadLabourDetails={showLeadLabourDetails}
        />
      )
    }

    switch (currentPage) {
      case "analytics":
        return <AnalyticsPage />;
      case "configuration":
        return <ConfigurationPage />;
      case "contractor-listing":
        return <ContractorListingPage />;
      case "customers":
        return <CustomersPage />;
      case "orders":
        return <OrdersPage />;
      case "invoices":
        return <InvoicesPage />;
      case "job-management":
        return <JobManagementPage />;
      case "live-tracking":
        return <LiveTrackingPage />;
      case "timesheets":
        return <TimesheetsPage />;
      case "staff-management":
        return (
          <StaffManagementPage
            onViewLeadLabourDetails={handleLeadLabourView}
            onBackToLeadLabour={handleBackToLeadLabour}
            selectedLeadLabourId={selectedLeadLabourId}
            showLeadLabourDetails={showLeadLabourDetails}
          />
        );
      case "notifications":
        return <NotificationsPage />;
      case "profile":
        return <ProfilePage onBack={handleBackToDashboard} />;
      case "profiles":
        return <ProfilesPage onBack={handleBackToDashboard} />;
      case "staff-profile":
        return <StaffProfilePage />;
      case "lead-labour-profile":
        return <LeadLabourProfilePage />;
      case "labour-profile":
        return <LabourProfilePage />;
      case "demo":
        return <ActionButtonsDemo />;
      default:
        return <DashboardOverview />;
    }
  };

  const handleLogout = async (): Promise<void> => {
    // Clear all authentication data
    await clearAuthData()
    
    // Dispatch logout action to clear Redux state
    dispatch(logout())
    
    // Update local state
    setIsAuthenticated(false)
    setCurrentPage("dashboard")
  }

  // Don't show authentication if already authenticated
  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in">
        <AuthFlow
          onAuthSuccess={() => setIsAuthenticated(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        <Header
          currentPage={currentPage}
          onLogout={handleLogout}
          onNotificationViewAll={handleNotificationViewAll}
          onProfileClick={handleProfileClick}
        />
        <main className="flex-1 overflow-auto">
          <div
            className={
              currentPage === "contractor-listing" || currentPage === "live-tracking" ? "" : "p-6"
            }
          >
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <PermissionProvider>
          <AppContent />
          <Toaster />
        </PermissionProvider>
      </ThemeProvider>
    </Provider>
  );
}