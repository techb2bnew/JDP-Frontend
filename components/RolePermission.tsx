'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import {
  Edit,
  Trash2,
  Eye,
  Shield,
  Plus,
  Users,
  Circle,
  FileText,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { updateUserPermissions } from '../utils/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { CheckCircle2, X } from 'lucide-react'

interface Permission {
  module: string;
  action: string;
  allowed: boolean;
}

interface Role {
  id: string;
  roleName: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export default function RolePermission() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    roleName: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    roleName: ''
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  // State to track permissions for new roles
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);
  
  // Stats state
  const [roleStats, setRoleStats] = useState({
    totalRoles: 0,
    systemRoles: 0,
    customRoles: 0,
    totalUsers: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // View modal state
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [isLoadingViewRole, setIsLoadingViewRole] = useState(false);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/permissions/roles-with-permissions`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();

        // Transform API response to match component's expected format
        if (responseData.success && responseData.data) {
          const transformedRoles = responseData.data.map((apiRole: any) => ({
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            description: apiRole.description || '',
            permissions: apiRole.permissions || [],
            createdAt: apiRole.created_at ? apiRole.created_at.split('T')[0] : '',
            updatedAt: apiRole.updated_at ? apiRole.updated_at.split('T')[0] : ''
          }));
          setRoles(transformedRoles);
        } else {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
    } catch (error) {
      setRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [apiBaseUrl]);

  // Fetch role stats
  const fetchRoleStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Calculate stats from roles data
      const totalRoles = roles.length;
      const systemRoles = roles.filter(role => {
        // System roles are typically predefined (STAFF, LEAD_LABOUR, LABOUR, ADMIN, etc.)
        const systemRoleNames = ['STAFF', 'LEAD_LABOUR', 'LABOUR', 'ADMIN', 'SUPER_ADMIN'];
        return systemRoleNames.includes(role.roleName.toUpperCase());
      }).length;
      const customRoles = totalRoles - systemRoles;
      
      // Fetch total users count (you may need to adjust this API endpoint)
      try {
        const usersResponse = await fetch(`${apiBaseUrl}/staff/getStaff`, {
          method: 'GET',
          headers
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const totalUsers = usersData.data?.pagination?.total || usersData.data?.staff?.length || 0;
          setRoleStats({
            totalRoles,
            systemRoles,
            customRoles,
            totalUsers
          });
        } else {
          setRoleStats({
            totalRoles,
            systemRoles,
            customRoles,
            totalUsers: 0
          });
        }
      } catch (error) {
        setRoleStats({
          totalRoles,
          systemRoles,
          customRoles,
          totalUsers: 0
        });
      }
    } catch (error) {
      console.error('Error fetching role stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [roles, apiBaseUrl]);

  // Fetch roles from API when component mounts
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Update stats when roles change
  useEffect(() => {
    if (roles.length > 0) {
      fetchRoleStats();
    }
  }, [roles, fetchRoleStats]);

  // Pagination logic
  const paginatedRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  const fetchRoleById = async (roleId: string, forView: boolean = false): Promise<Role | null> => {
    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/permissions/roles/${roleId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const responseData = await response.json();

        if (responseData.success && responseData.data) {
          const apiRole = responseData.data.role; // Role data is nested in data.role
          const apiPermissions = responseData.data.permissions || []; // Permissions are in data.permissions

          // Transform API permissions to component format dynamically
          const transformedPermissions: Permission[] = [];

          // Create all possible permissions first (all unchecked)
          modules.forEach(modName => {
            getActionsForModule(modName).forEach(act => {
              transformedPermissions.push({
                module: modName,
                action: act,
                allowed: false // Default to false
              });
            });
          });

          // Now update permissions based on API response
          apiPermissions.forEach((apiPerm: any) => {
            // Extract module and action from the permission object
            const modName = apiPerm.permission?.module;
            const act = apiPerm.permission?.action;

            if (modName && act) {
              // Find and update the corresponding permission
              const existingPermission = transformedPermissions.find(p =>
                p.module === modName && p.action === act
              );
              if (existingPermission) {
                existingPermission.allowed = apiPerm.allowed;
              }
            }
          });

          // Transform API response to match component's expected format
          const transformedRole: Role = {
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            description: apiRole.description || '',
            permissions: transformedPermissions, // Use transformed permissions
            createdAt: apiRole.created_at ? apiRole.created_at.split('T')[0] : '',
            updatedAt: apiRole.updated_at ? apiRole.updated_at.split('T')[0] : ''
          };

          if (forView) {
            setViewingRole(transformedRole);
          } else {
            setEditingRole(transformedRole);
            setFormData({
              roleName: transformedRole.roleName,
              description: transformedRole.description
            });
          }
          
          return transformedRole;
        } else {
          toast.error('Failed to fetch role details');
          return null;
        }
      } else {
        toast.error('Failed to fetch role details');
        return null;
      }
    } catch (error) {
      console.error('RolePermission: Error fetching role details:', error);
      toast.error('Error fetching role details');
      return null;
    }
  };

  const modules = [
    'dashboard',
    'jobs',
    'products',
    'orders',
    'invoices',
    'customers',
    'contractors',
    'suppliers',
    'reports',
    'staff',
    'staff_timeline',
    'labour',
    'lead_labour',
    'notification',
    'inventory_price',
    'bluesheet',
    'role_permission',
    'configuration'
  ];

  const actions = ['view', 'create', 'edit', 'delete'];

  // Special actions for specific modules
  const specialActionsMap: { [key: string]: string[] } = {
    'dashboard': ['view'],
    'jobs': ['view', 'create', 'edit', 'delete', 'assign'],
    'products': ['view', 'create', 'edit', 'delete', 'upload'],
    'orders': ['view', 'create', 'edit', 'delete'],
    'invoices': ['view', 'create', 'edit', 'delete', 'export'],
    'reports': ['view', 'create', 'edit', 'delete'],
    'inventory_price': ['view', 'create', 'edit', 'delete'],
    'bluesheet': ['view', 'create', 'edit', 'delete'],
    'staff_timeline': ['view', 'create', 'edit', 'delete'],
    'role_permission': ['view', 'create', 'edit', 'delete']
  };

  const getActionsForModule = (modName: string): string[] => {
    return specialActionsMap[modName] || actions;
  };

  const getPermissionValue = (modName: string, act: string, perms: Permission[]): boolean => {
    if (!perms || perms.length === 0) return false;
    const permission = perms.find(p => p.module === modName && p.action === act);
    return permission ? permission.allowed : false;
    };

  const handleAddRole = () => {
    setShowAddForm(true);
    setEditingRole(null);
    setFormData({ roleName: '', description: '' });

    // Initialize permissions for new role
    const initialPermissions: Permission[] = [];
    modules.forEach(modName => {
      getActionsForModule(modName).forEach(act => {
        initialPermissions.push({ module: modName, action: act, allowed: false });
      });
    });
    setNewRolePermissions(initialPermissions);
  };

  const isAdminRoleName = (roleName: string) =>
    roleName.trim().toLowerCase() === 'admin';

  const handleEditRole = (role: Role) => {
    if (isAdminRoleName(role.roleName)) return;
    setShowAddForm(true);
    // Fetch fresh role data from API
    fetchRoleById(role.id);
    setNewRolePermissions([]); // Clear new role permissions when editing
  };

  const handleViewRole = async (role: Role) => {
    setIsLoadingViewRole(true);
    setShowViewModal(true);
    try {
      // Fetch fresh role data from API for view
      const roleData = await fetchRoleById(role.id, true);
      if (!roleData) {
        // If fetch failed, use the role from the list
        setViewingRole(role);
      }
    } catch (error) {
      console.error('Error fetching role for view:', error);
      // Use the role from the list as fallback
      setViewingRole(role);
    } finally {
      setIsLoadingViewRole(false);
    }
  };
  
  // Helper to group permissions by module
  const groupPermissionsByModule = (permissions: Permission[]) => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(perm => {
      if (perm.allowed) {
        if (!grouped[perm.module]) {
          grouped[perm.module] = [];
        }
        grouped[perm.module].push(perm);
      }
    });
    return grouped;
  };
  
  // Helper to format module name for display
  const formatModuleName = (module: string): string => {
    return module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Helper to format action name for display
  const formatActionName = (action: string): string => {
    const actionMap: { [key: string]: string } = {
      'view': 'View',
      'create': 'Create',
      'edit': 'Edit',
      'delete': 'Delete',
      'assign': 'Assign',
      'upload': 'Upload',
      'export': 'Export'
    };
    return actionMap[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  const handleDeleteRole = (role: Role) => {
    if (isAdminRoleName(role.roleName)) return;
    setRoleToDelete(role);
    setShowDeleteAlert(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('jdp_auth')
        ? JSON.parse(localStorage.getItem('jdp_auth')!).token
        : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${apiBaseUrl}/permissions/roles/${roleToDelete.id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        toast.success('Role deleted successfully!');
        await fetchRoles(); // Refresh roles list
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error deleting role. Please try again.');
    } finally {
      setShowDeleteAlert(false);
      setRoleToDelete(null);
    }
  };

  const handlePermissionChange = (modName: string, act: string, allowed: boolean) => {
    if (editingRole) {
      // Update existing role permissions
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            // Check if permission already exists
            const existingPermission = role.permissions.find(p =>
              p.module === modName && p.action === act
            );

            let updatedPermissions: Permission[];
            if (existingPermission) {
              // Update existing permission
              updatedPermissions = role.permissions.map(p =>
                p.module === modName && p.action === act
                  ? { ...p, allowed }
                  : p
              );
            } else {
              // Add new permission
              updatedPermissions = [...role.permissions, { module: modName, action: act, allowed }];
            }

            return { ...role, permissions: updatedPermissions };
          }
          return role;
        });
      });

      // Also update the editingRole state to reflect changes immediately
      setEditingRole(prev => {
        if (!prev) return prev;

        const existingPermission = prev.permissions.find(p =>
          p.module === modName && p.action === act
        );

        let updatedPermissions: Permission[];
        if (existingPermission) {
          updatedPermissions = prev.permissions.map(p =>
            p.module === modName && p.action === act
              ? { ...p, allowed }
              : p
          );
        } else {
          updatedPermissions = [...prev.permissions, { module: modName, action: act, allowed }];
        }

        return { ...prev, permissions: updatedPermissions };
      });
    } else {
      // Update new role permissions
      setNewRolePermissions(prev => {
        const existing = prev.find(p => p.module === modName && p.action === act);
        if (existing) {
          return prev.map(p =>
            p.module === modName && p.action === act
              ? { ...p, allowed }
              : p
          );
        } else {
          return [...prev, { module: modName, action: act, allowed }];
        }
      });
    }
  };

  // Handle selecting all checkboxes for a specific action
  const handleSelectAll = (act: string, checked: boolean) => {
    if (editingRole) {
      // Update existing role permissions
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            let updatedPermissions = [...role.permissions];

            // Update existing permissions for this action
            updatedPermissions = updatedPermissions.map(p =>
              p.action === act ? { ...p, allowed: checked } : p
            );

            // Add missing permissions for this action if they don't exist
            modules.forEach(modName => {
              const moduleActs = getActionsForModule(modName);
              if (moduleActs.includes(act)) {
                const existingPermission = updatedPermissions.find(p =>
                  p.module === modName && p.action === act
                );
                if (!existingPermission) {
                  updatedPermissions.push({ module: modName, action: act, allowed: checked });
                }
              }
            });

            return { ...role, permissions: updatedPermissions };
          }
          return role;
        });
      });

      // Also update the editingRole state
      setEditingRole(prev => {
        if (!prev) return prev;
        let updatedPermissions = [...prev.permissions];

        // Update existing permissions for this action
        updatedPermissions = updatedPermissions.map(p =>
          p.action === act ? { ...p, allowed: checked } : p
        );

        // Add missing permissions for this action if they don't exist
        modules.forEach(modName => {
          const moduleActs = getActionsForModule(modName);
          if (moduleActs.includes(act)) {
            const existingPermission = updatedPermissions.find(p =>
              p.module === modName && p.action === act
            );
            if (!existingPermission) {
              updatedPermissions.push({ module: modName, action: act, allowed: checked });
            }
          }
        });

        return { ...prev, permissions: updatedPermissions };
      });
    } else {
      // Update new role permissions
      setNewRolePermissions(prev => {
        let updated = [...prev];

        // Update existing permissions for this action
        updated = updated.map(p =>
          p.action === act ? { ...p, allowed: checked } : p
        );

        // Add missing permissions for this action if they don't exist
        modules.forEach(modName => {
          const moduleActs = getActionsForModule(modName);
          if (moduleActs.includes(act)) {
            const existingPermission = updated.find(p =>
              p.module === modName && p.action === act
            );
            if (!existingPermission) {
              updated.push({ module: modName, action: act, allowed: checked });
            }
          }
        });

        return updated;
      });
    }
  };

  // Handle selecting all special action checkboxes
  const handleSelectAllSpecial = (checked: boolean) => {
    if (editingRole) {
      // Update existing role permissions for special actions
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            let updatedPermissions = [...role.permissions];

            // Update existing special action permissions
            updatedPermissions = updatedPermissions.map(p => {
              const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
              return isSpecialAction ? { ...p, allowed: checked } : p;
            });

            // Add missing special action permissions if they don't exist
            modules.forEach(modName => {
              const moduleActs = getActionsForModule(modName);
              const specialActs = moduleActs.filter(a =>
                !['view', 'create', 'edit', 'delete'].includes(a)
              );

              specialActs.forEach(a => {
                const existingPermission = updatedPermissions.find(p =>
                  p.module === modName && p.action === a
                );
                if (!existingPermission) {
                  updatedPermissions.push({ module: modName, action: a, allowed: checked });
                }
              });
            });

            return { ...role, permissions: updatedPermissions };
          }
          return role;
        });
      });

      // Also update the editingRole state
      setEditingRole(prev => {
        if (!prev) return prev;
        let updatedPermissions = [...prev.permissions];

        // Update existing special action permissions
        updatedPermissions = updatedPermissions.map(p => {
          const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
          return isSpecialAction ? { ...p, allowed: checked } : p;
        });

        // Add missing special action permissions if they don't exist
        modules.forEach(modName => {
          const moduleActs = getActionsForModule(modName);
          const specialActs = moduleActs.filter(a =>
            !['view', 'create', 'edit', 'delete'].includes(a)
          );

          specialActs.forEach(a => {
            const existingPermission = updatedPermissions.find(p =>
              p.module === modName && p.action === a
            );
            if (!existingPermission) {
              updatedPermissions.push({ module: modName, action: a, allowed: checked });
            }
          });
        });

        return { ...prev, permissions: updatedPermissions };
      });
    } else {
      // Update new role permissions for special actions
      setNewRolePermissions(prev => {
        let updated = [...prev];

        // Update existing special action permissions
        updated = updated.map(p => {
          const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
          return isSpecialAction ? { ...p, allowed: checked } : p;
        });

        // Add missing special action permissions if they don't exist
        modules.forEach(modName => {
          const moduleActs = getActionsForModule(modName);
          const specialActs = moduleActs.filter(a =>
            !['view', 'create', 'edit', 'delete'].includes(a)
          );

          specialActs.forEach(a => {
            const existingPermission = updated.find(p =>
              p.module === modName && p.action === a
            );
            if (!existingPermission) {
              updated.push({ module: modName, action: a, allowed: checked });
            }
          });
        });

        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({ roleName: '' });

    // Validate required fields
    let hasErrors = false;
    const newErrors = { roleName: '' };

    if (!formData.roleName.trim()) {
      newErrors.roleName = 'Role name is required';
      hasErrors = true;
    }
 
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    const token = localStorage.getItem('jdp_auth')
      ? JSON.parse(localStorage.getItem('jdp_auth')!).token
      : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const compiledPermissions: Permission[] = [];
    modules.forEach(modName => {
      getActionsForModule(modName).forEach(act => {
        const allowed = editingRole
          ? getPermissionValue(modName, act, editingRole.permissions)
          : getPermissionValue(modName, act, newRolePermissions);
        compiledPermissions.push({ module: modName, action: act, allowed });
      });
    });

    const baseRoleData = {
      roleName: formData.roleName,
      description: formData.description,
      permissions: compiledPermissions.map((perm, index) => ({
        id: index + 1, // Add unique ID for each permission
        ...perm
      }))
    };

    try {
      setIsSubmitting(true);
      if (editingRole) {
        // Update existing role - only send roleId and permissions
        const updateData = {
          roleId: parseInt(editingRole.id),
          roleName: formData.roleName,
          permissions: compiledPermissions.map(perm => ({
            module: perm.module,
            action: perm.action,
            allowed: perm.allowed
          }))
        };

        // Show a more detailed loading message
        const loadingToastId = toast.loading('Updating role permissions... This may take a moment.');

        const response = await fetch(`${apiBaseUrl}/permissions/roles/update-permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(updateData)
        });

        // Dismiss loading toast
        toast.dismiss(loadingToastId);

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success) {
            // toast.success('Role updated successfully!');

            // Check if this is the current user's role being updated
            const currentUser = JSON.parse(localStorage.getItem('jdp_auth') || '{}').user;
            if (currentUser && currentUser.role === formData.roleName) {
              // Update current user's permissions in localStorage
              const updatedPermissions = compiledPermissions
                .filter(p => p.allowed)
                .map(p => ({
                  id: Math.random(), // Generate temporary ID
                  action: p.action,
                  module: p.module,
                  description: `${p.action} ${p.module}`,
                  display_name: `${p.action.charAt(0).toUpperCase() + p.action.slice(1)} ${p.module.charAt(0).toUpperCase() + p.module.slice(1)}`
                }));

              updateUserPermissions(updatedPermissions);
              toast.success('Your permissions have been updated!');
            }

            // Refresh roles from API in background (non-blocking)
            fetchRoles();
          } else {
            toast.error(`Failed to update role: ${responseData.message || 'Unknown error'}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(`Failed to update role: ${errorData.message || 'Unknown error'}`);
        }
      } else {
        // Create new role

        // Show a more detailed loading message
        const loadingToastId = toast.loading('Creating new role... This may take a moment.');

        const response = await fetch(`${apiBaseUrl}/permissions/roles`, {
          method: 'POST',
          headers,
          body: JSON.stringify(baseRoleData)
        });

        // Dismiss loading toast
        toast.dismiss(loadingToastId);

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success) {
            toast.success('Role created successfully!');
            // Refresh roles from API in background (non-blocking)
            fetchRoles();
          } else {
            toast.error(`Failed to create role: ${responseData.message || 'Unknown error'}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(`Failed to create role: ${errorData.message || 'Unknown error'}`);
        }
      }

      setShowAddForm(false);
      setEditingRole(null);
      setFormData({ roleName: '', description: '' });
      setNewRolePermissions([]);
    } catch (error) {
      console.error('RolePermission: Error saving role:', error);
      // Dismiss any loading toast that might still be showing
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(`Error saving role: ${error.message}`);
      } else {
        toast.error('Error saving role. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRole(null);
    setFormData({ roleName: '', description: '' });
    setNewRolePermissions([]);
    setErrors({ roleName: '' });
  };

  // Helper function to check if role is system role
  const isSystemRole = (roleName: string): boolean => {
    const systemRoleNames = ['STAFF', 'LEAD_LABOUR', 'LABOUR', 'ADMIN', 'SUPER_ADMIN'];
    return systemRoleNames.includes(roleName.toUpperCase());
  };

  // Helper function to get permission count
  const getPermissionCount = (role: Role): number => {
    return role.permissions?.filter(p => p.allowed).length || 0;
  };

  // Helper function to get user count for a role (mock for now, you'll need to fetch from API)
  const getUserCountForRole = (roleName: string): number => {
    // This should be fetched from API, for now returning mock data
    const mockUserCounts: { [key: string]: number } = {
      'STAFF': 3,
      'LEAD_LABOUR': 5,
      'LABOUR': 12
    };
    return mockUserCounts[roleName.toUpperCase()] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Create and manage custom roles with specific permissions. Assign roles to users for automatic permission configuration.
            </p>
          </div>
          {!showAddForm && (
            <Button
              onClick={handleAddRole}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        {/* {!showAddForm && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? '...' : roleStats.totalRoles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">System Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? '...' : roleStats.systemRoles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Custom Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? '...' : roleStats.customRoles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoadingStats ? '...' : roleStats.totalUsers}</div>
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* Role Listing */}
        {!showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">All Roles</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage role definitions and permissions. Users will inherit permissions based on their assigned role.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingRoles ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2 text-gray-500">Loading roles...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRoles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="text-lg font-medium mb-2">No data available</div>
                            <div className="text-sm">No roles found. Create your first role.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRoles.map((role) => {
                        const permissionCount = getPermissionCount(role);
                        const userCount = getUserCountForRole(role.roleName);
                        const isSystem = isSystemRole(role.roleName);
                        const isAdminRole = isAdminRoleName(role.roleName);
                        
                        return (
                          <tr key={role.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Circle className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">{role.roleName}</span>
                              </div>
                            </td>
                            {/* <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{role.description || 'No description'}</span>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={permissionCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                              >
                                {permissionCount} permissions
                              </Badge>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">{userCount} users</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                {isSystem ? 'System' : 'Custom'}
                              </Badge>
                            </td> */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleViewRole(role)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!isAdminRole && (
                                  <>
                                    <Button
                                      onClick={() => handleEditRole(role)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteRole(role)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, roles.length)} of {roles.length} roles
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-primary text-white hover:bg-[#0090e6]" : ""}
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How Role-Based Permissions Work Section */}
        {!showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">How Role-Based Permissions Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Create Roles</h3>
                    <p className="text-sm text-gray-600">
                      Define roles with specific permission sets. For example: &quot;Warehouse Manager&quot;, &quot;Sales Representative&quot;, &quot;Accountant&quot;
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-green-50 border-green-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Assign Permissions</h3>
                    <p className="text-sm text-gray-600">
                      Select the permissions each role should have. Permissions are organized by category for easy management.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Assign to Users</h3>
                    <p className="text-sm text-gray-600">
                      In Staff Management, simply select a role when creating a user. All permissions are automatically assigned!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Role Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRole ? 'Edit Role' : 'Create Role'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formData.roleName}
                    onChange={(e) => {
                      setFormData({ ...formData, roleName: e.target.value });
                      if (errors.roleName) setErrors({ ...errors, roleName: '' });
                    }}
                    placeholder="Role Name"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${errors.roleName ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.roleName && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Role description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900   bg-primary text-white p-3 rounded-t-lg">
                  Permissions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-4 py-3 text-left text-sm font-medium border border-gray-300">
                          Module
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium border border-gray-300">
                          <div className="flex flex-col items-center space-y-2">
                            <span>View</span>
                            <input
                              type="checkbox"
                              onChange={(e) => handleSelectAll('view', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium border border-gray-300">
                          <div className="flex flex-col items-center space-y-2">
                            <span>Create</span>
                            <input
                              type="checkbox"
                              onChange={(e) => handleSelectAll('create', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium border border-gray-300">
                          <div className="flex flex-col items-center space-y-2">
                            <span>Edit</span>
                            <input
                              type="checkbox"
                              onChange={(e) => handleSelectAll('edit', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium border border-gray-300">
                          <div className="flex flex-col items-center space-y-2">
                            <span>Delete</span>
                            <input
                              type="checkbox"
                              onChange={(e) => handleSelectAll('delete', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium border border-gray-300">
                          <div className="flex flex-col items-center space-y-2">
                            <span>Special Actions</span>
                            <input
                              type="checkbox"
                              onChange={(e) => handleSelectAllSpecial(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((modName) => {
                        const moduleActs = getActionsForModule(modName);
                        const hasSpecialActions = moduleActs.length > 4;
                        const isDashboard = modName === 'dashboard';

                        return (
                          <tr key={modName} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300 capitalize">
                              {modName.replace('_', ' ')}
                            </td>

                            {/* View Checkbox - Always show */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              <input
                                type="checkbox"
                                checked={editingRole ? getPermissionValue(modName, 'view', editingRole.permissions) : getPermissionValue(modName, 'view', newRolePermissions)}
                                onChange={(e) => handlePermissionChange(modName, 'view', e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </td>

                            {/* Create Checkbox - Hide for dashboard */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard ? (
                                <input
                                  type="checkbox"
                                  checked={editingRole ? getPermissionValue(modName, 'create', editingRole.permissions) : getPermissionValue(modName, 'create', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(modName, 'create', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Edit Checkbox - Hide for dashboard */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard ? (
                                <input
                                  type="checkbox"
                                  checked={editingRole ? getPermissionValue(modName, 'edit', editingRole.permissions) : getPermissionValue(modName, 'edit', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(modName, 'edit', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Delete Checkbox - Hide for dashboard */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard ? (
                                <input
                                  type="checkbox"
                                  checked={editingRole ? getPermissionValue(modName, 'delete', editingRole.permissions) : getPermissionValue(modName, 'delete', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(modName, 'delete', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Special Actions - Hide for dashboard */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard && hasSpecialActions ? (
                                <div className="space-y-2">
                                  {moduleActs
                                    .filter(a => !['view', 'create', 'edit', 'delete'].includes(a))
                                    .map((a) => (
                                      <div key={a} className="flex items-center justify-center">
                                        <input
                                          type="checkbox"
                                          checked={editingRole ? getPermissionValue(modName, a, editingRole.permissions) : getPermissionValue(modName, a, newRolePermissions)}
                                          onChange={(e) => handlePermissionChange(modName, a, e.target.checked)}
                                          className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <span className="text-xs ml-1 capitalize">{a}</span>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingRole ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingRole ? 'Update Role' : 'Create Role'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* View Role Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <DialogTitle className="text-2xl font-bold uppercase">
                  {viewingRole?.roleName || 'Role Details'}
                </DialogTitle>
              </div> 
            </div>
            <DialogDescription className="text-base mt-2">
              {viewingRole?.description || 'Role View Details'}
            </DialogDescription>
          </DialogHeader>

          {isLoadingViewRole ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-gray-500">Loading role details...</span>
            </div>
          ) : viewingRole ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {viewingRole.permissions?.filter(p => p.allowed).length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Assigned Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {getUserCountForRole(viewingRole.roleName)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permissions List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions List</h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {(() => {
                      const groupedPermissions = groupPermissionsByModule(viewingRole.permissions || []);
                      const moduleOrder = modules.filter(mod => groupedPermissions[mod]);
                      
                      return moduleOrder.length > 0 ? (
                        moduleOrder.map((module) => {
                          const modulePermissions = groupedPermissions[module];
                          const moduleName = formatModuleName(module);
                          
                          return (
                            <div key={module} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{moduleName}</h4>
                                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                  {modulePermissions.length}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                {modulePermissions.map((perm, idx) => (
                                  <div key={`${perm.module}-${perm.action}-${idx}`} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="text-gray-700">
                                      {formatActionName(perm.action)} {moduleName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No permissions assigned to this role.
                        </div>
                      );
                    })()}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role &quot;{roleToDelete?.roleName}&quot; from your system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} className="bg-red-600 text-white hover:bg-red-700">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
