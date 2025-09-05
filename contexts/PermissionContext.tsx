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

  // Load permissions from localStorage on mount
  useEffect(() => {
    const loadPermissions = () => {
      const authData = localStorage.getItem('jdp_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
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

    // Listen for storage changes (when permissions are updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jdp_auth') {
        loadPermissions();
      }
    };

    // Listen for custom permission update events
    const handlePermissionUpdate = () => {
      loadPermissions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('permissionsUpdated', handlePermissionUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('permissionsUpdated', handlePermissionUpdate);
    };
  }, []);

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.some(
      permission => permission.module === module && permission.action === action
    );
  };

  const hasAnyPermission = (module: string, actions: string[]): boolean => {
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
        if (parsed.user?.permissions) {
          setPermissions(parsed.user.permissions);
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
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
