'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button'
import {
  Edit,
  Trash2,
  Eye,
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

interface Permission {
  module: string;
  action: string;
  allowed: boolean;
}

interface Role {
  id: string;
  roleName: string;
  roleType: string;
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
    roleType: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    roleName: '',
    roleType: ''
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  // State to track permissions for new roles
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

  // Fetch roles from API when component mounts
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
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
            roleType: apiRole.role_type || '',
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
  };

  // Pagination logic
  const paginatedRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  const fetchRoleById = async (roleId: string) => {
    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
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
          modules.forEach(module => {
            getActionsForModule(module).forEach(action => {
              transformedPermissions.push({
                module,
                action,
                allowed: false // Default to false
              });
            });
          });

          // Now update permissions based on API response
          apiPermissions.forEach((apiPerm: any) => {
            // Extract module and action from the permission object
            const module = apiPerm.permission?.module;
            const action = apiPerm.permission?.action;

            if (module && action) {
              // Find and update the corresponding permission
              const existingPermission = transformedPermissions.find(p =>
                p.module === module && p.action === action
              );
              if (existingPermission) {
                existingPermission.allowed = apiPerm.allowed;
              }
            }
          });

          // Transform API response to match component's expected format
          const transformedRole = {
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            roleType: apiRole.role_type || '',
            description: apiRole.description || '',
            permissions: transformedPermissions, // Use transformed permissions
            createdAt: apiRole.created_at ? apiRole.created_at.split('T')[0] : '',
            updatedAt: apiRole.updated_at ? apiRole.updated_at.split('T')[0] : ''
          };

          console.log('Transformed role:', transformedRole);
          console.log('Transformed permissions:', transformedPermissions);

          setEditingRole(transformedRole);
          setFormData({
            roleName: transformedRole.roleName,
            roleType: transformedRole.roleType,
            description: transformedRole.description
          });
        } else {
          toast.error('Failed to fetch role details');
        }
      } else {
        toast.error('Failed to fetch role details');
      }
    } catch (error) {
      console.error('RolePermission: Error fetching role details:', error);
      toast.error('Error fetching role details');
    }
  };

  const modules = [
    'dashboard',
    'jobs',
    'products',
    'orders',
    'invoices',
    'customers',
    'suppliers',
    'reports',
    'staff',
    'labour',
    'lead_labour',
    'notification',
    'settings'
  ];

  const actions = ['view', 'create', 'edit', 'delete'];

  // Special actions for specific modules
  const specialActions: { [key: string]: string[] } = {
    'dashboard': ['view'],
    'jobs': ['view', 'create', 'edit', 'delete', 'assign'],
    'products': ['view', 'create', 'edit', 'delete', 'upload'],
    'orders': ['view', 'create', 'edit', 'delete'],
    'invoices': ['view', 'create', 'edit', 'delete', 'export'],
    'reports': ['view', 'create', 'edit', 'delete'],
    'settings': ['view', 'create', 'edit', 'delete']
  };

  const getActionsForModule = (module: string): string[] => {
    return specialActions[module] || actions;
  };

  const getPermissionValue = (module: string, action: string, permissions: Permission[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    const permission = permissions.find(p => p.module === module && p.action === action);
    return permission ? permission.allowed : false;
  };

  const handleAddRole = () => {
    setShowAddForm(true);
    setEditingRole(null);
    setFormData({ roleName: '', roleType: '', description: '' });

    // Initialize permissions for new role
    const initialPermissions: Permission[] = [];
    modules.forEach(module => {
      getActionsForModule(module).forEach(action => {
        initialPermissions.push({ module, action, allowed: false });
      });
    });
    setNewRolePermissions(initialPermissions);
  };

  const handleEditRole = (role: Role) => {
    setShowAddForm(true);
    // Fetch fresh role data from API
    fetchRoleById(role.id);
    setNewRolePermissions([]); // Clear new role permissions when editing
  };

  const handleViewRole = (role: Role) => {
    // For now, just show role details in console
    console.log('Viewing role:', role);
    // You can implement a view modal or redirect to a detail page here
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteAlert(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
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
        toast.error(`Failed to delete role: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error deleting role. Please try again.');
    } finally {
      setShowDeleteAlert(false);
      setRoleToDelete(null);
    }
  };

  const handlePermissionChange = (module: string, action: string, allowed: boolean) => {
    if (editingRole) {
      // Update existing role permissions
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            // Check if permission already exists
            const existingPermission = role.permissions.find(p =>
              p.module === module && p.action === action
            );

            let updatedPermissions;
            if (existingPermission) {
              // Update existing permission
              updatedPermissions = role.permissions.map(p =>
                p.module === module && p.action === action
                  ? { ...p, allowed }
                  : p
              );
            } else {
              // Add new permission
              updatedPermissions = [...role.permissions, { module, action, allowed }];
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
          p.module === module && p.action === action
        );

        let updatedPermissions;
        if (existingPermission) {
          updatedPermissions = prev.permissions.map(p =>
            p.module === module && p.action === action
              ? { ...p, allowed }
              : p
          );
        } else {
          updatedPermissions = [...prev.permissions, { module, action, allowed }];
        }

        return { ...prev, permissions: updatedPermissions };
      });
    } else {
      // Update new role permissions
      setNewRolePermissions(prev => {
        const existing = prev.find(p => p.module === module && p.action === action);
        if (existing) {
          return prev.map(p =>
            p.module === module && p.action === action
              ? { ...p, allowed }
              : p
          );
        } else {
          return [...prev, { module, action, allowed }];
        }
      });
    }
  };

  // Handle selecting all checkboxes for a specific action
  const handleSelectAll = (action: string, checked: boolean) => {
    if (editingRole) {
      // Update existing role permissions
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            let updatedPermissions = [...role.permissions];

            // Update existing permissions for this action
            updatedPermissions = updatedPermissions.map(p =>
              p.action === action ? { ...p, allowed: checked } : p
            );

            // Add missing permissions for this action if they don't exist
            modules.forEach(module => {
              const moduleActions = getActionsForModule(module);
              if (moduleActions.includes(action)) {
                const existingPermission = updatedPermissions.find(p =>
                  p.module === module && p.action === action
                );
                if (!existingPermission) {
                  updatedPermissions.push({ module, action, allowed: checked });
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
          p.action === action ? { ...p, allowed: checked } : p
        );

        // Add missing permissions for this action if they don't exist
        modules.forEach(module => {
          const moduleActions = getActionsForModule(module);
          if (moduleActions.includes(action)) {
            const existingPermission = updatedPermissions.find(p =>
              p.module === module && p.action === action
            );
            if (!existingPermission) {
              updatedPermissions.push({ module, action, allowed: checked });
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
          p.action === action ? { ...p, allowed: checked } : p
        );

        // Add missing permissions for this action if they don't exist
        modules.forEach(module => {
          const moduleActions = getActionsForModule(module);
          if (moduleActions.includes(action)) {
            const existingPermission = updated.find(p =>
              p.module === module && p.action === action
            );
            if (!existingPermission) {
              updated.push({ module, action, allowed: checked });
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
            modules.forEach(module => {
              const moduleActions = getActionsForModule(module);
              const specialActions = moduleActions.filter(action =>
                !['view', 'create', 'edit', 'delete'].includes(action)
              );

              specialActions.forEach(action => {
                const existingPermission = updatedPermissions.find(p =>
                  p.module === module && p.action === action
                );
                if (!existingPermission) {
                  updatedPermissions.push({ module, action, allowed: checked });
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
        modules.forEach(module => {
          const moduleActions = getActionsForModule(module);
          const specialActions = moduleActions.filter(action =>
            !['view', 'create', 'edit', 'delete'].includes(action)
          );

          specialActions.forEach(action => {
            const existingPermission = updatedPermissions.find(p =>
              p.module === module && p.action === action
            );
            if (!existingPermission) {
              updatedPermissions.push({ module, action, allowed: checked });
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
        modules.forEach(module => {
          const moduleActions = getActionsForModule(module);
          const specialActions = moduleActions.filter(action =>
            !['view', 'create', 'edit', 'delete'].includes(action)
          );

          specialActions.forEach(action => {
            const existingPermission = updated.find(p =>
              p.module === module && p.action === action
            );
            if (!existingPermission) {
              updated.push({ module, action, allowed: checked });
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
    setErrors({ roleName: '', roleType: '' });

    // Validate required fields
    let hasErrors = false;
    const newErrors = { roleName: '', roleType: '' };

    if (!formData.roleName.trim()) {
      newErrors.roleName = 'Role name is required';
      hasErrors = true;
    }

    if (!formData.roleType) {
      newErrors.roleType = 'Role type is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const permissions: Permission[] = [];
    modules.forEach(module => {
      getActionsForModule(module).forEach(action => {
        const allowed = editingRole
          ? getPermissionValue(module, action, editingRole.permissions)
          : getPermissionValue(module, action, newRolePermissions);
        permissions.push({ module, action, allowed });
      });
    });

    const baseRoleData = {
      roleName: formData.roleName,
      roleType: formData.roleType,
      description: formData.description,
      permissions: permissions.map((permission, index) => ({
        id: index + 1, // Add unique ID for each permission
        ...permission
      }))
    };

    try {
      setIsSubmitting(true);
      if (editingRole) {
        // Update existing role - only send roleId and permissions
        const updateData = {
          roleId: parseInt(editingRole.id),
          roleName: formData.roleName,
          permissions: permissions.map(permission => ({
            module: permission.module,
            action: permission.action,
            allowed: permission.allowed
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
            toast.success('Role updated successfully!');

            // Check if this is the current user's role being updated
            const currentUser = JSON.parse(localStorage.getItem('jdp_auth') || '{}').user;
            if (currentUser && currentUser.role === formData.roleName) {
              // Update current user's permissions in localStorage
              const updatedPermissions = permissions
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
      setFormData({ roleName: '', roleType: '', description: '' });
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
    setFormData({ roleName: '', roleType: '', description: '' });
    setNewRolePermissions([]);
    setErrors({ roleName: '', roleType: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          {!showAddForm && (
            <Button
              onClick={handleAddRole}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Role
            </Button>
          )}
        </div>

        {/* Role Listing */}
        {!showAddForm && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">All Roles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
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
                    paginatedRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.roleName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.roleType}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{role.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.updatedAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {/* <Button
                                onClick={() => handleViewRole(role)}
                                variant="ghost"
                                size="sm"
                              >
                                <Eye className="h-3 w-3" />
                              </Button> */}
                            <Button
                              onClick={() => handleEditRole(role)}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteRole(role)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
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
          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    Role Type *
                  </label>
                  <select
                    value={formData.roleType}
                    onChange={(e) => {
                      setFormData({ ...formData, roleType: e.target.value });
                      if (errors.roleType) setErrors({ ...errors, roleType: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${errors.roleType ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Role type</option>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                    {/* <option value="System">System</option>
                     <option value="Custom">Custom</option> */}
                  </select>
                  {errors.roleType && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleType}</p>
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
                      {modules.map((module) => {
                        const moduleActions = getActionsForModule(module);
                        const hasSpecialActions = moduleActions.length > 4;
                        const isDashboard = module === 'dashboard';

                        return (
                          <tr key={module} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300 capitalize">
                              {module.replace('_', ' ')}
                            </td>

                            {/* View Checkbox - Always show */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              <input
                                type="checkbox"
                                checked={editingRole ? getPermissionValue(module, 'view', editingRole.permissions) : getPermissionValue(module, 'view', newRolePermissions)}
                                onChange={(e) => handlePermissionChange(module, 'view', e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </td>

                            {/* Create Checkbox - Hide for dashboard */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard ? (
                                <input
                                  type="checkbox"
                                  checked={editingRole ? getPermissionValue(module, 'create', editingRole.permissions) : getPermissionValue(module, 'create', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(module, 'create', e.target.checked)}
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
                                  checked={editingRole ? getPermissionValue(module, 'edit', editingRole.permissions) : getPermissionValue(module, 'edit', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(module, 'edit', e.target.checked)}
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
                                  checked={editingRole ? getPermissionValue(module, 'delete', editingRole.permissions) : getPermissionValue(module, 'delete', newRolePermissions)}
                                  onChange={(e) => handlePermissionChange(module, 'delete', e.target.checked)}
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
                                  {moduleActions.filter(action => !['view', 'create', 'edit', 'delete'].includes(action)).map((action) => (
                                    <div key={action} className="flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={editingRole ? getPermissionValue(module, action, editingRole.permissions) : getPermissionValue(module, action, newRolePermissions)}
                                        onChange={(e) => handlePermissionChange(module, action, e.target.checked)}
                                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                      />
                                      <span className="text-xs ml-1 capitalize">{action}</span>
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role "{roleToDelete?.roleName}" from your system.
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
};
