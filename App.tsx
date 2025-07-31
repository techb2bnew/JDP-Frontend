'use client'

import { Provider } from 'react-redux'
import { store } from './redux/store'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { useState } from "react";
import { AuthFlow } from "./components/AuthFlow";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardOverview } from "./components/DashboardOverview";
import { ProductsPage } from "./components/ProductsPage";
import { OrdersPage } from "./components/OrdersPage";
import { CustomersPage } from "./components/CustomersPage";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { InvoicesPage } from "./components/InvoicesPage";
import { JobManagementPage } from "./components/JobManagementPage";
import { LiveTrackingPage } from "./components/LiveTrackingPage";
import { ContractorListingPage } from "./components/ContractorListingPage";
import { StaffManagementPage } from "./components/StaffManagementPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { ProfilePage } from "./components/ProfilePage";
import { ProfilesPage } from "./components/ProfilesPage";
import { StaffProfilePage } from "./components/profiles/StaffProfilePage";
import { LeadLabourProfilePage } from "./components/profiles/LeadLabourProfilePage";
import { LabourProfilePage } from "./components/profiles/LabourProfilePage";
import { ActionButtonsDemo } from "./components/ActionButtonsDemo";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [selectedLeadLabourId, setSelectedLeadLabourId] =
    useState<string | null>(null);
  const [showLeadLabourDetails, setShowLeadLabourDetails] =
    useState<boolean>(false);

  const handleLeadLabourView = (id: string): void => {
    setSelectedLeadLabourId(id);
    setShowLeadLabourDetails(true);
  };

  const handleBackToLeadLabour = (): void => {
    setSelectedLeadLabourId(null);
    setShowLeadLabourDetails(false);
  };

  const handleNotificationViewAll = (): void => {
    setCurrentPage("notifications");
  };

  const handleProfileClick = (): void => {
    setCurrentPage("profile");
  };

  const handleBackToDashboard = (): void => {
    setCurrentPage("dashboard");
  };

  const renderPage = (): React.ReactNode => {
    const pageContent = (() => {
      switch (currentPage) {
        case "dashboard":
          return <DashboardOverview />;
        case "analytics":
          return <AnalyticsPage />;
        case "products":
          return <ProductsPage />;
        case "orders":
          return <OrdersPage />;
        case "invoices":
          return <InvoicesPage />;
        case "customers":
          return <CustomersPage />;
        case "job-management":
          return <JobManagementPage />;
        case "live-tracking":
          return <LiveTrackingPage />;
        case "contractor-listing":
          return <ContractorListingPage />;
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
    })();

    return (
      <div className="animate-fade-in">
        {pageContent}
      </div>
    );
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    setCurrentPage("dashboard");
  };

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
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </Provider>
  );
}