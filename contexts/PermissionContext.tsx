'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Permission {
  id: number;
  action: string;
  module: string;
  description: string;
  display_name?: string;
}

interface PermissionContextType {
  permissions: Permission[];
  isLoading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (module: string, actions: string[]) => boolean;
  hasAllPermissions: (module: string, actions: string[]) => boolean;
  setPermissions: (permissions: Permission[]) => void;
  refreshPermissions: () => void;
  forceRefreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdminRole, setIsSuperAdminRole] = useState(false);

  const checkIsSuperAdmin = (parsed: any): boolean => {
    const role = (parsed.user?.role ?? parsed.user?.role_type ?? '').toLowerCase().trim();
    return role === 'super admin';
  };

  // Load permissions from localStorage on mount
  useEffect(() => {
    const loadPermissions = () => {
      const authData = localStorage.getItem('jdp_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          setIsSuperAdminRole(checkIsSuperAdmin(parsed));
          if (parsed.user?.permissions) {
            setPermissions(parsed.user.permissions);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error parsing permissions:', error);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    // Load permissions initially
    loadPermissions();

    // Only listen for storage changes from other tabs/windows (not same tab)
    // This prevents updating permissions when admin modifies staff permissions
    const handleStorageChange = (e: StorageEvent) => {
      // Only update if the change came from another tab/window
      if (e.key === 'jdp_auth' && e.storageArea === localStorage && e.newValue !== e.oldValue) {
        // Check if this is a login event (new token) vs permission modification
        try {
          const newData = e.newValue ? JSON.parse(e.newValue) : null;
          const oldData = e.oldValue ? JSON.parse(e.oldValue) : null;
          
          // Only update if it's a different user logging in (different user ID)
          // This prevents admin permission changes from affecting current user's permissions
          if (newData?.user?.id !== oldData?.user?.id) {
            loadPermissions();
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    // Listen for custom login events (when user actually logs in)
    const handleLoginEvent = () => {
      loadPermissions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userLoggedIn', handleLoginEvent);
    // Note: We intentionally do NOT listen for 'permissionsUpdated' events
    // to prevent admin permission changes from affecting current user

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
    };
  }, []);

  const hasPermission = (module: string, action: string): boolean => {
    if (isSuperAdminRole) return true;
    return permissions.some(
      permission => permission.module === module && permission.action === action
    );
  };

  const hasAnyPermission = (module: string, actions: string[]): boolean => {
    // console.log("modulemodulemodule",module,actions);
    
    return actions.some(action => hasPermission(module, action));
  };

  const hasAllPermissions = (module: string, actions: string[]): boolean => {
    return actions.every(action => hasPermission(module, action));
  };

  const refreshPermissions = () => {
    const authData = localStorage.getItem('jdp_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setIsSuperAdminRole(checkIsSuperAdmin(parsed));
        if (parsed.user?.permissions) {
          setPermissions(parsed.user.permissions);
        }
      } catch (error) {
        console.error('Error parsing permissions:', error);
      }
    }
  };

  // Function to manually refresh permissions (call this after login)
  const forceRefreshPermissions = () => {
    const authData = localStorage.getItem('jdp_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setIsSuperAdminRole(checkIsSuperAdmin(parsed));
        if (parsed.user?.permissions) {
          setPermissions(parsed.user.permissions);
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('userLoggedIn'));
        }
      } catch (error) {
        console.error('Error parsing permissions:', error);
      }
    }
  };

  const value: PermissionContextType = {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setPermissions,
    refreshPermissions,
    forceRefreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
