'use client'

import { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import { ThemeProvider } from './contexts/ThemeContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { Toaster } from 'sonner'
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