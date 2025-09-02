'use client';

import React, { useState } from 'react';
import { Button } from './ui/button'
import { 
  Edit,
  Trash2,
  Eye, 
} from 'lucide-react'
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

const RolePermission: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      roleName: 'Admin',
      roleType: 'Internal',
      description: 'Full system administrator with all permissions',
      permissions: [
        { module: 'dashboard', action: 'view', allowed: true },
        { module: 'jobs', action: 'view', allowed: true },
        { module: 'jobs', action: 'create', allowed: true },
        { module: 'jobs', action: 'edit', allowed: true },
        { module: 'jobs', action: 'delete', allowed: true },
        { module: 'jobs', action: 'assign', allowed: true },
        { module: 'products', action: 'view', allowed: true },
        { module: 'products', action: 'create', allowed: true },
        { module: 'products', action: 'edit', allowed: true },
        { module: 'products', action: 'delete', allowed: true },
        { module: 'products', action: 'upload', allowed: true },
        { module: 'invoices', action: 'view', allowed: true },
        { module: 'invoices', action: 'create', allowed: true },
        { module: 'invoices', action: 'edit', allowed: true },
        { module: 'invoices', action: 'delete', allowed: true },
        { module: 'invoices', action: 'export', allowed: true },
        { module: 'customers', action: 'view', allowed: true },
        { module: 'customers', action: 'create', allowed: true },
        { module: 'customers', action: 'edit', allowed: true },
        { module: 'customers', action: 'delete', allowed: true },
        { module: 'suppliers', action: 'view', allowed: true },
        { module: 'suppliers', action: 'create', allowed: true },
        { module: 'suppliers', action: 'edit', allowed: true },
        { module: 'suppliers', action: 'delete', allowed: true },
        { module: 'reports', action: 'view', allowed: true },
        { module: 'reports', action: 'create', allowed: false },
        { module: 'reports', action: 'edit', allowed: false },
        { module: 'reports', action: 'delete', allowed: false },
        { module: 'settings', action: 'view', allowed: true },
        { module: 'settings', action: 'edit', allowed: true },
        { module: 'settings', action: 'manage_users', allowed: true },
        { module: 'settings', action: 'manage_roles', allowed: true },
        { module: 'labour', action: 'view', allowed: true },
        { module: 'labour', action: 'create', allowed: true },
        { module: 'labour', action: 'edit', allowed: true },
        { module: 'labour', action: 'delete', allowed: true },
        { module: 'lead_labour', action: 'view', allowed: true },
        { module: 'lead_labour', action: 'create', allowed: true },
        { module: 'lead_labour', action: 'edit', allowed: true },
        { module: 'lead_labour', action: 'delete', allowed: true },
        { module: 'notification', action: 'view', allowed: true },
        { module: 'notification', action: 'create', allowed: true },
        { module: 'notification', action: 'edit', allowed: true },
        { module: 'notification', action: 'delete', allowed: true },
        { module: 'staff', action: 'view', allowed: true },
        { module: 'staff', action: 'create', allowed: true },
        { module: 'staff', action: 'edit', allowed: true },
        { module: 'staff', action: 'delete', allowed: true },
        { module: 'orders', action: 'view', allowed: true },
        { module: 'orders', action: 'create', allowed: true },
        { module: 'orders', action: 'edit', allowed: true },
        { module: 'orders', action: 'delete', allowed: true },
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: '2',
      roleName: 'Staff',
      roleType: 'Internal',
      description: 'Staff member with limited permissions',
      permissions: [
        { module: 'dashboard', action: 'view', allowed: true },
        { module: 'jobs', action: 'view', allowed: true },
        { module: 'jobs', action: 'create', allowed: true },
        { module: 'jobs', action: 'edit', allowed: true },
        { module: 'jobs', action: 'delete', allowed: false },
        { module: 'jobs', action: 'assign', allowed: true },
        { module: 'products', action: 'view', allowed: true },
        { module: 'products', action: 'create', allowed: true },
        { module: 'products', action: 'edit', allowed: true },
        { module: 'products', action: 'delete', allowed: false },
        { module: 'products', action: 'upload', allowed: true },
        { module: 'invoices', action: 'view', allowed: true },
        { module: 'invoices', action: 'create', allowed: true },
        { module: 'invoices', action: 'edit', allowed: true },
        { module: 'invoices', action: 'delete', allowed: false },
        { module: 'invoices', action: 'export', allowed: true },
        { module: 'customers', action: 'view', allowed: true },
        { module: 'customers', action: 'create', allowed: true },
        { module: 'customers', action: 'edit', allowed: true },
        { module: 'customers', action: 'delete', allowed: false },
        { module: 'suppliers', action: 'view', allowed: true },
        { module: 'suppliers', action: 'create', allowed: false },
        { module: 'suppliers', action: 'edit', allowed: false },
        { module: 'suppliers', action: 'delete', allowed: false },
        { module: 'reports', action: 'view', allowed: true },
        { module: 'reports', action: 'create', allowed: false },
        { module: 'reports', action: 'edit', allowed: false },
        { module: 'reports', action: 'delete', allowed: false },
        { module: 'settings', action: 'view', allowed: true },
        { module: 'settings', action: 'edit', allowed: false },
        { module: 'settings', action: 'manage_users', allowed: false },
        { module: 'settings', action: 'manage_roles', allowed: false },
        { module: 'labour', action: 'view', allowed: true },
        { module: 'labour', action: 'create', allowed: true },
        { module: 'labour', action: 'edit', allowed: true },
        { module: 'labour', action: 'delete', allowed: false },
        { module: 'lead_labour', action: 'view', allowed: true },
        { module: 'lead_labour', action: 'create', allowed: false },
        { module: 'lead_labour', action: 'edit', allowed: false },
        { module: 'lead_labour', action: 'delete', allowed: false },
        { module: 'notification', action: 'view', allowed: true },
        { module: 'notification', action: 'create', allowed: true },
        { module: 'notification', action: 'edit', allowed: false },
        { module: 'notification', action: 'delete', allowed: false },
        { module: 'staff', action: 'view', allowed: true },
        { module: 'staff', action: 'create', allowed: false },
        { module: 'staff', action: 'edit', allowed: false },
        { module: 'staff', action: 'delete', allowed: false },
        { module: 'orders', action: 'view', allowed: true },
        { module: 'orders', action: 'create', allowed: true },
        { module: 'orders', action: 'edit', allowed: true },
        { module: 'orders', action: 'delete', allowed: false },
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    roleName: '',
    roleType: '',
    description: ''
  });

  const [errors, setErrors] = useState({
    roleName: '',
    roleType: ''
  });

  // State to track permissions for new roles
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

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
    setEditingRole(role);
    setShowAddForm(true);
    setFormData({
      roleName: role.roleName,
      roleType: role.roleType,
      description: role.description
    });
    setNewRolePermissions([]); // Clear new role permissions when editing
  };

  const handleDeleteRole = (roleId: string) => {
    // Find the role to get its name for the confirmation message
    const roleToDelete = roles.find(role => role.id === roleId);
    const roleName = roleToDelete?.roleName || 'this role';
    
    // Create custom confirmation popup
    const confirmDelete = () => {
      // Remove the popup
      const popup = document.getElementById('delete-confirmation-popup');
      if (popup) {
        popup.remove();
      }
      
      // Delete the role
      setRoles(roles.filter(role => role.id !== roleId));
    };
    
    const cancelDelete = () => {
      // Remove the popup
      const popup = document.getElementById('delete-confirmation-popup');
      if (popup) {
        popup.remove();
      }
    };
    
    // Create and show the popup
    const popup = document.createElement('div');
    popup.id = 'delete-confirmation-popup';
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    popup.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div class="flex items-center mb-4">
          <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Delete Role</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <span class="font-semibold text-gray-900">${roleName}</span>? 
            This action cannot be undone.
          </p>
          <div class="flex space-x-3 justify-center">
            <button 
              id="cancel-delete-btn"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              No, Cancel
            </button>
            <button 
              id="confirm-delete-btn"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    document.body.appendChild(popup);
    
    // Add event listeners after the element is in the DOM
    setTimeout(() => {
      const confirmBtn = document.getElementById('confirm-delete-btn');
      const cancelBtn = document.getElementById('cancel-delete-btn');
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmDelete);
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelDelete);
      }
      
      // Close popup when clicking outside
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          cancelDelete();
        }
      });
    }, 0);
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

    const permissions: Permission[] = [];
    modules.forEach(module => {
      getActionsForModule(module).forEach(action => {
        const allowed = editingRole
          ? getPermissionValue(module, action, editingRole.permissions)
          : getPermissionValue(module, action, newRolePermissions);
        permissions.push({ module, action, allowed });
      });
    });

    const roleData = {
      roleName: formData.roleName,
      roleType: formData.roleType,
      description: formData.description,
      permissions
    };

    try {
      if (editingRole) {
        // Update existing role
        const response = await fetch(`/api/permissions/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleData)
        });

        if (response.ok) {
          const updatedRole = await response.json();
          setRoles(roles.map(role =>
            role.id === editingRole.id
              ? { ...updatedRole, updatedAt: new Date().toISOString().split('T')[0] }
              : role
          ));
        }
      } else {
        // Create new role
        const response = await fetch('/api/permissions/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleData)
        });

        if (response.ok) {
          const newRole = await response.json();
          setRoles([...roles, {
            ...newRole,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          }]);
        }
      }

      setShowAddForm(false);
      setEditingRole(null);
      setFormData({ roleName: '', roleType: '', description: '' });
      setNewRolePermissions([]);
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role. Please try again.');
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
            <button
              onClick={handleAddRole}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Add Role
            </button>
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
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.roleName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.roleType}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{role.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.updatedAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>

                         
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                     placeholder="Role Name *"
                     className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                       errors.roleName ? 'border-red-500' : 'border-gray-300'
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
                     className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                       errors.roleType ? 'border-red-500' : 'border-gray-300'
                     }`}
                   >
                     <option value="">Role type*</option>
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
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermission;
