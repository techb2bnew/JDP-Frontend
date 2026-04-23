'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  UserCheck,
  ChevronDown,
  Check,
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { cn } from './ui/utils'

interface Permission {
  module: string;
  action: string;
  allowed: boolean;
}

interface Role {
  id: string;
  roleName: string;
  description: string;
  allowedPermissions: number;
  roleType?: string; // 'Internal' (Portal) | 'Mobile' etc — from API
  platform?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

/** Preset labels for the role name dropdown — display includes platform suffix */
const PREDEFINED_ROLE_OPTIONS = [
  'super admin (Portal)',
  'admin (Portal)',
  'lead labour (Mobile)',
  'labour (Mobile)',
] as const;

/**
 * Strip the (Portal)/(Mobile) suffix to get the clean API role name.
 * e.g. "labour (Mobile)" -> "labour"
 *      "my custom role (Portal)" -> "my custom role"
 *      "some role" -> "some role"  (no suffix — unchanged)
 */
const stripPlatformSuffix = (displayName: string): string =>
  displayName.replace(/\s*\((Portal|Mobile)\)\s*$/i, '').trim();

/** Extract platform tag from display name: returns 'Mobile' | 'Portal' | null */
const getPlatformTag = (displayName: string): 'Mobile' | 'Portal' | null => {
  const m = displayName.match(/\((Portal|Mobile)\)\s*$/i);
  if (!m) return null;
  return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase() as 'Mobile' | 'Portal';
};

// Lead Labour role allowed modules (excludes labour/lead_labour self-modules)
const LABOUR_ROLE_ALLOWED_MODULES = [
  'jobs',
  'sub_jobs',
  'suppliers',
  'products',
  'orders',
  'bluesheet',
  'notification',
  'inventory_price',
  'activity_logs',
] as const;

// Labour role allowed modules (same as lead labour - both exclude self-role modules)
const ONLY_LABOUR_ROLE_ALLOWED_MODULES = [
  'jobs',
  'sub_jobs',
  'suppliers',
  'products',
  'orders',
  'bluesheet',
  'notification',
  'inventory_price',
  'activity_logs',
] as const;

// Per-module action restrictions for labour-scoped roles
// Key = module name, Value = allowed actions
// Modules not listed here get default labour actions (view, create, edit)
const LABOUR_MODULE_ACTION_OVERRIDES: Record<string, string[]> = {
  products: ['view'],
  orders: ['create'],
  notification: ['view'],
  bluesheet: ['view', 'create'],
  inventory_price: ['view'],
  suppliers: ['view'],
  jobs: ['view', 'create'],
  sub_jobs: ['view', 'create'],
  activity_logs: ['view'],
};


// Virtual modules for labour-scoped roles (only Special Actions column)
const ASSIGNED_LABOUR_MODULE = 'assigned_labour';
const ASSIGNED_LEAD_LABOUR_MODULE = 'assigned_lead_labour';

// When a permission is checked, these related permissions auto-check (one-way only).
// User can still manually uncheck any of them afterwards.
const PERMISSION_AUTO_DEPS: Record<string, Array<{ module: string; action: string }>> = {
  'jobs:create': [
    { module: 'jobs', action: 'view' },
    { module: 'jobs', action: 'edit' },
    { module: 'sub_jobs', action: 'create' },
    { module: 'sub_jobs', action: 'view' },
    { module: 'customers', action: 'view' },
    { module: 'contractors', action: 'view' },
    { module: ASSIGNED_LEAD_LABOUR_MODULE, action: 'assign' },
    { module: ASSIGNED_LABOUR_MODULE, action: 'assign' },
  ],
  'jobs:view': [
    { module: 'sub_jobs', action: 'view' },
    { module: 'customers', action: 'view' },
    { module: 'contractors', action: 'view' },
    { module: ASSIGNED_LEAD_LABOUR_MODULE, action: 'assign' },
    { module: ASSIGNED_LABOUR_MODULE, action: 'assign' },
  ],
  'products:view': [{ module: 'suppliers', action: 'view' }],
  'products:create': [{ module: 'suppliers', action: 'view' }],
};

// Resolves transitive deps so checking jobs:create also pulls in jobs:view's deps
const getTransitiveDeps = (
  modName: string,
  act: string,
): Array<{ module: string; action: string }> => {
  const visited = new Set<string>();
  const result: Array<{ module: string; action: string }> = [];
  const collect = (m: string, a: string) => {
    const key = `${m}:${a}`;
    if (visited.has(key)) return;
    visited.add(key);
    for (const dep of PERMISSION_AUTO_DEPS[key] ?? []) {
      if (!result.some((r) => r.module === dep.module && r.action === dep.action)) {
        result.push(dep);
      }
      collect(dep.module, dep.action);
    }
  };
  collect(modName, act);
  return result;
};

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
  /** User-added custom role names (shown in dropdown with presets) */
  const [customRoleOptions, setCustomRoleOptions] = useState<string[]>([]);
  const [roleComboOpen, setRoleComboOpen] = useState(false);
  const [roleComboSearch, setRoleComboSearch] = useState('');
  // Platform picker modal for custom roles
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [pendingCustomRoleName, setPendingCustomRoleName] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  // State to track permissions for new roles
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([]);

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

        if (responseData.success && responseData.data) {
          const transformedRoles = responseData.data.map((apiRole: any) => ({
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            description: apiRole.description || '',
            allowedPermissions: apiRole.allowedPermissions ?? apiRole.allowed_permissions ?? 0,
            roleType: apiRole.role_type || '',
            platform: apiRole.platform || '',
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



  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);



  // Pagination logic
  const paginatedRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(roles.length / itemsPerPage);

  const fetchRoleById = async (roleId: string, forView: boolean = false, displayRoleName?: string): Promise<Role | null> => {
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
          const apiRole = responseData.data.role;
          const apiPermissions = responseData.data.permissions || [];

          const transformedPermissions: Permission[] = [];
          // Use displayRoleName (with platform suffix like "(Mobile)") if provided
          // so that isCustomMobileRole / isCustomPortalRole checks work correctly
          const roleNameForPermissions = displayRoleName || apiRole.role_name || '';
          getActiveModulesForRole(roleNameForPermissions, apiRole.platform).forEach(modName => {
            getActionsForModule(modName, roleNameForPermissions, apiRole.platform).forEach(act => {
              transformedPermissions.push({ module: modName, action: act, allowed: false });
            });
          });

          apiPermissions.forEach((apiPerm: any) => {
            const modName = apiPerm.permission?.module;
            const act = apiPerm.permission?.action;
            if (modName && act) {
              const existingPermission = transformedPermissions.find(p =>
                p.module === modName && p.action === act
              );
              if (existingPermission) {
                existingPermission.allowed = apiPerm.allowed;
              }
            }
          });

          const transformedRole: Role = {
            id: apiRole.id.toString(),
            roleName: apiRole.role_name || '',
            description: apiRole.description || '',
            allowedPermissions: apiRole.allowed_permissions || 0,
            roleType: apiRole.role_type || '',
            platform: apiRole.platform || '',
            permissions: transformedPermissions,
            createdAt: apiRole.created_at ? apiRole.created_at.split('T')[0] : '',
            updatedAt: apiRole.updated_at ? apiRole.updated_at.split('T')[0] : ''
          };

          if (forView) {
            setViewingRole(transformedRole);
          } else {
            setEditingRole(transformedRole);
            // Use displayRoleName (with suffix) in the form so platform badge shows correctly
            const formRoleName = displayRoleName || transformedRole.roleName;
            setFormData({
              roleName: formRoleName,
              description: transformedRole.description
            });
            const rn = formRoleName.trim();
            if (
              rn &&
              !PREDEFINED_ROLE_OPTIONS.some(
                (p) => p.toLowerCase() === rn.toLowerCase()
              )
            ) {
              setCustomRoleOptions((prev) =>
                prev.some((x) => x.toLowerCase() === rn.toLowerCase())
                  ? prev
                  : [...prev, rn]
              );
            }
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
    'sub_jobs',
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
    'configuration',
    'activity_logs'
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
    'sub_jobs': ['view', 'create', 'edit', 'delete'],
    'staff_timeline': ['view', 'create', 'edit', 'delete'],
    'role_permission': ['view', 'create', 'edit', 'delete'],
    // NEW virtual modules — only special actions
    [ASSIGNED_LABOUR_MODULE]: ['assign'],
    [ASSIGNED_LEAD_LABOUR_MODULE]: ['assign'],
  };

const LABOUR_HIDDEN_PERMISSIONS: Record<string, string[]> = {
  jobs:            ['create'],
  sub_jobs:        ['create'],
  products:        ['view'],
  orders:          ['create'],
  inventory_price: ['view'],
  [ASSIGNED_LABOUR_MODULE]: ['assign'],
  [ASSIGNED_LEAD_LABOUR_MODULE]: ['assign'],
};
  const isPermissionHidden = (modName: string, act: string, roleName: string): boolean => {
  if (!isLabourOnlyRole(roleName)) return false;
  return (LABOUR_HIDDEN_PERMISSIONS[modName] || []).includes(act);
};
  const normalizeRoleName = (roleName: string) =>
    stripPlatformSuffix(roleName)
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const isLeadLabourRole = (roleName: string) => {
    const normalized = normalizeRoleName(roleName);
    return normalized === 'lead labor' || normalized === 'lead labour';
  };

  const isLabourOnlyRole = (roleName: string) => {
    const normalized = normalizeRoleName(roleName);
    return normalized === 'labor' || normalized === 'labour';
  };

  /** True if the role is a "Portal" role (admin, super admin, or custom Portal role) */
  const isPortalRole = (roleName: string): boolean => {
    const tag = getPlatformTag(roleName);
    if (tag === 'Portal') return true;
    if (tag === 'Mobile') return false;
    // Fallback: predefined admin names without suffix
    const n = normalizeRoleName(roleName);
    return n === 'admin' || n === 'super admin';
  };

  /** True if a custom portal role (not admin/super admin) */
  const isCustomPortalRole = (roleName: string): boolean => {
    const tag = getPlatformTag(roleName);
    if (tag !== 'Portal') return false;
    const clean = stripPlatformSuffix(roleName).trim().toLowerCase();
    return clean !== 'admin' && clean !== 'super admin';
  };

  /** True if a custom mobile role (not labour/lead labour) */
  const isCustomMobileRole = (roleName: string): boolean => {
    const tag = getPlatformTag(roleName);
    if (tag !== 'Mobile') return false;
    const n = normalizeRoleName(roleName);
    return n !== 'labour' && n !== 'labor' && n !== 'lead labour' && n !== 'lead labor';
  };

  const isLabourScopedRole = (roleName: string) => {
    return isLabourOnlyRole(roleName) || isLeadLabourRole(roleName);
  };

  const isMobilePlatform = (roleName: string, platform?: string) => {
    if ((platform || '').toLowerCase() === 'mobile') return true;
    return getPlatformTag(roleName) === 'Mobile';
  };

  const isPortalPlatform = (roleName: string, platform?: string) => {
    if ((platform || '').toLowerCase() === 'portal') return true;
    return getPlatformTag(roleName) === 'Portal';
  };

  const getActiveModulesForRole = (roleName: string, platform?: string): string[] => {
    if (isPortalPlatform(roleName, platform)) {
      return [...modules, ASSIGNED_LABOUR_MODULE, ASSIGNED_LEAD_LABOUR_MODULE];
    }

    if (isMobilePlatform(roleName, platform)) {
      const baseModules = modules.filter((m) =>
        ONLY_LABOUR_ROLE_ALLOWED_MODULES.includes(
          m as typeof ONLY_LABOUR_ROLE_ALLOWED_MODULES[number],
        ),
      );
      return [...baseModules, ASSIGNED_LABOUR_MODULE, ASSIGNED_LEAD_LABOUR_MODULE];
    }

    if (isCustomPortalRole(roleName)) {
      return [...modules, ASSIGNED_LABOUR_MODULE, ASSIGNED_LEAD_LABOUR_MODULE];
    }

    if (isCustomMobileRole(roleName)) {
      const baseModules = modules.filter((m) =>
        ONLY_LABOUR_ROLE_ALLOWED_MODULES.includes(
          m as typeof ONLY_LABOUR_ROLE_ALLOWED_MODULES[number],
        ),
      );
      return [...baseModules, ASSIGNED_LABOUR_MODULE, ASSIGNED_LEAD_LABOUR_MODULE];
    }

    if (!isLabourScopedRole(roleName)) return modules;

    const baseModules = modules.filter((m) =>
      ONLY_LABOUR_ROLE_ALLOWED_MODULES.includes(
        m as typeof ONLY_LABOUR_ROLE_ALLOWED_MODULES[number],
      ),
    );

    if (isLabourOnlyRole(roleName)) {
      return [...baseModules, ASSIGNED_LABOUR_MODULE];
    }

    return [...baseModules, ASSIGNED_LABOUR_MODULE, ASSIGNED_LEAD_LABOUR_MODULE];
  };

  /**
   * Returns the list of actions to show for a given module + role.
   *
   * Priority:
   *  1. Virtual assigned_* modules → always just special actions
   *  2. Custom Portal role → all normal actions (no restrictions)
   *  3. Labour-scoped role + module has override → use override
   *  4. Labour-scoped role (no override) → ['view', 'create', 'edit']
   *  5. Normal role → specialActionsMap[module] ?? default actions
   */
  const getActionsForModule = (modName: string, roleName?: string, platform?: string): string[] => {
    const role = roleName ?? formData.roleName;

    if (modName === ASSIGNED_LABOUR_MODULE || modName === ASSIGNED_LEAD_LABOUR_MODULE) {
      return specialActionsMap[modName] || [];
    }

    if (isPortalPlatform(role, platform)) {
      return specialActionsMap[modName] || actions;
    }

    if (isMobilePlatform(role, platform)) {
      if (LABOUR_MODULE_ACTION_OVERRIDES[modName]) {
        return LABOUR_MODULE_ACTION_OVERRIDES[modName];
      }
      return ['view', 'create', 'edit'];
    }

    if (isCustomPortalRole(role)) {
      return specialActionsMap[modName] || actions;
    }

    if (isCustomMobileRole(role)) {
      if (LABOUR_MODULE_ACTION_OVERRIDES[modName]) {
        return LABOUR_MODULE_ACTION_OVERRIDES[modName];
      }
      return ['view', 'create', 'edit'];
    }

    if (isLabourScopedRole(role)) {
      if (LABOUR_MODULE_ACTION_OVERRIDES[modName]) {
        return LABOUR_MODULE_ACTION_OVERRIDES[modName];
      }
      return ['view', 'create', 'edit'];
    }

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
    setRoleComboSearch('');

    const initialPermissions: Permission[] = [];
    getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
      getActionsForModule(modName, formData.roleName, currentRolePlatform).forEach(act => {
        initialPermissions.push({ module: modName, action: act, allowed: false });
      });
    });
    setNewRolePermissions(initialPermissions);
  };

  const isProtectedRoleName = (roleName: string) => {
    const normalized = roleName.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'admin' || normalized === 'super admin';
  };

  const handleEditRole = (role: Role) => {
    if (isProtectedRoleName(role.roleName)) return;
    setShowAddForm(true);

    // 1. Check if user already added this role with a platform suffix in this session
    const fromSession = customRoleOptions.find(
      (opt) => stripPlatformSuffix(opt).toLowerCase() === role.roleName.toLowerCase()
    );

    let displayName = fromSession || role.roleName;

    // 2. If no session entry, infer suffix from platform returned by API
    if (!fromSession && !getPlatformTag(displayName)) {
      const platform = (role.platform || '').toLowerCase();
      const cleanName = role.roleName.toLowerCase();
      const isPredefined = ['admin', 'super admin', 'labour', 'labor', 'lead labour', 'lead labor'].includes(cleanName);

      if (!isPredefined) {
        const inferredPlatform = platform === 'mobile' ? 'Mobile' : 'Portal';
        displayName = `${role.roleName} (${inferredPlatform})`;

        setCustomRoleOptions((prev) =>
          prev.some((x) => x.toLowerCase() === displayName.toLowerCase())
            ? prev
            : [...prev, displayName]
        );
      }
    }

    fetchRoleById(role.id, false, displayName);
    setNewRolePermissions([]);
  };

  const handleViewRole = async (role: Role) => {
    setIsLoadingViewRole(true);
    setShowViewModal(true);
    try {
      const roleData = await fetchRoleById(role.id, true);
      if (!roleData) {
        setViewingRole(role);
      }
    } catch (error) {
      console.error('Error fetching role for view:', error);
      setViewingRole(role);
    } finally {
      setIsLoadingViewRole(false);
    }
  };

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

  const formatModuleName = (module: string): string => {
    // Handle virtual modules display name
    if (module === ASSIGNED_LABOUR_MODULE) return 'Assigned Labour';
    if (module === ASSIGNED_LEAD_LABOUR_MODULE) return 'Assigned Lead Labour';
    return module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
    if (isProtectedRoleName(role.roleName)) return;
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
        await fetchRoles();
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
    // Applies the direct change + cascades related permissions on check (not on uncheck)
    const applyChange = (perms: Permission[]): Permission[] => {
      let updated = perms.find((p) => p.module === modName && p.action === act)
        ? perms.map((p) => (p.module === modName && p.action === act ? { ...p, allowed } : p))
        : [...perms, { module: modName, action: act, allowed }];

      if (!allowed) return updated;

      const activeModules = getActiveModulesForRole(formData.roleName, currentRolePlatform);
      for (const dep of getTransitiveDeps(modName, act)) {
        if (!activeModules.includes(dep.module)) continue;
        if (!getActionsForModule(dep.module, formData.roleName, currentRolePlatform).includes(dep.action)) continue;
        if (isPermissionHidden(dep.module, dep.action, formData.roleName)) continue;

        const existing = updated.find((p) => p.module === dep.module && p.action === dep.action);
        if (existing) {
          if (!existing.allowed) {
            updated = updated.map((p) =>
              p.module === dep.module && p.action === dep.action ? { ...p, allowed: true } : p
            );
          }
        } else {
          updated = [...updated, { module: dep.module, action: dep.action, allowed: true }];
        }
      }
      return updated;
    };

    if (editingRole) {
      setRoles((prevRoles) =>
        prevRoles.map((role) =>
          role.id === editingRole.id ? { ...role, permissions: applyChange(role.permissions) } : role
        )
      );
      setEditingRole((prev) => (prev ? { ...prev, permissions: applyChange(prev.permissions) } : prev));
    } else {
      setNewRolePermissions((prev) => applyChange(prev));
    }
  };

  const handleSelectAll = (act: string, checked: boolean) => {
    if (editingRole) {
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            let updatedPermissions = [...role.permissions];
            updatedPermissions = updatedPermissions.map(p =>
              p.action === act ? { ...p, allowed: checked } : p
            );
            getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
              const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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

      setEditingRole(prev => {
        if (!prev) return prev;
        let updatedPermissions = [...prev.permissions];
        updatedPermissions = updatedPermissions.map(p =>
          p.action === act ? { ...p, allowed: checked } : p
        );
        getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
          const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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
      setNewRolePermissions(prev => {
        let updated = [...prev];
        updated = updated.map(p =>
          p.action === act ? { ...p, allowed: checked } : p
        );
        getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
          const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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

  const handleSelectAllSpecial = (checked: boolean) => {
    if (editingRole) {
      setRoles(prevRoles => {
        return prevRoles.map(role => {
          if (role.id === editingRole.id) {
            let updatedPermissions = [...role.permissions];
            updatedPermissions = updatedPermissions.map(p => {
              const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
              return isSpecialAction ? { ...p, allowed: checked } : p;
            });
            getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
              const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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

      setEditingRole(prev => {
        if (!prev) return prev;
        let updatedPermissions = [...prev.permissions];
        updatedPermissions = updatedPermissions.map(p => {
          const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
          return isSpecialAction ? { ...p, allowed: checked } : p;
        });
        getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
          const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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
      setNewRolePermissions(prev => {
        let updated = [...prev];
        updated = updated.map(p => {
          const isSpecialAction = !['view', 'create', 'edit', 'delete'].includes(p.action);
          return isSpecialAction ? { ...p, allowed: checked } : p;
        });
        getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
          const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
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

    setErrors({ roleName: '' });

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
    getActiveModulesForRole(formData.roleName, currentRolePlatform).forEach(modName => {
      getActionsForModule(modName, formData.roleName, currentRolePlatform).forEach(act => {
        const allowed = editingRole
          ? getPermissionValue(modName, act, editingRole.permissions)
          : getPermissionValue(modName, act, newRolePermissions);
        compiledPermissions.push({ module: modName, action: act, allowed });
      });
    });

    // Strip (Portal)/(Mobile) suffix — API receives clean role name
    const apiRoleName = stripPlatformSuffix(formData.roleName);

    // Determine platform from the display role name suffix
    const platformValue = getPlatformTag(formData.roleName) || 'Portal';

    const baseRoleData = {
      roleName: apiRoleName,
      description: formData.description,
      platform: platformValue,
      permissions: compiledPermissions.map((perm, index) => ({
        id: index + 1,
        ...perm
      }))
    };

    try {
      setIsSubmitting(true);
      if (editingRole) {
        const updateData = {
          roleId: parseInt(editingRole.id),
          roleName: apiRoleName,
          platform: platformValue,
          permissions: compiledPermissions.map(perm => ({
            module: perm.module,
            action: perm.action,
            allowed: perm.allowed
          }))
        };

        const loadingToastId = toast.loading('Updating role permissions... This may take a moment.');

        const response = await fetch(`${apiBaseUrl}/permissions/roles/update-permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(updateData)
        });

        toast.dismiss(loadingToastId);

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success) {
            const currentUser = JSON.parse(localStorage.getItem('jdp_auth') || '{}').user;
            if (currentUser && currentUser.role === formData.roleName) {
              const updatedPermissions = compiledPermissions
                .filter(p => p.allowed)
                .map(p => ({
                  id: Math.random(),
                  action: p.action,
                  module: p.module,
                  description: `${p.action} ${p.module}`,
                  display_name: `${p.action.charAt(0).toUpperCase() + p.action.slice(1)} ${p.module.charAt(0).toUpperCase() + p.module.slice(1)}`
                }));
              updateUserPermissions(updatedPermissions);
              toast.success('Your permissions have been updated!');
            }
            fetchRoles();
          } else {
            toast.error(`Failed to update role: ${responseData.message || 'Unknown error'}`);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(`Failed to update role: ${errorData.message || 'Unknown error'}`);
        }
      } else {
        const loadingToastId = toast.loading('Creating new role... This may take a moment.');

        const response = await fetch(`${apiBaseUrl}/permissions/roles`, {
          method: 'POST',
          headers,
          body: JSON.stringify(baseRoleData)
        });

        toast.dismiss(loadingToastId);

        if (response.ok) {
          const responseData = await response.json();
          if (responseData.success) {
            toast.success('Role created successfully!');
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
      setRoleComboSearch('');
    } catch (error) {
      console.error('RolePermission: Error saving role:', error);
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
    setRoleComboSearch('');
    setRoleComboOpen(false);
    setShowPlatformModal(false);
    setPendingCustomRoleName('');
  };

  const roleDropdownOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    [...PREDEFINED_ROLE_OPTIONS, ...customRoleOptions].forEach((r) => {
      const t = (r || '').trim();
      if (!t) return;
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    });
    const current = (formData.roleName || '').trim();
    if (current && !seen.has(current.toLowerCase())) {
      out.push(current);
    }
    return out;
  }, [customRoleOptions, formData.roleName]);

  const filteredRoleComboOptions = useMemo(() => {
    const q = roleComboSearch.trim().toLowerCase();
    if (!q) return roleDropdownOptions;
    return roleDropdownOptions.filter((o) => o.toLowerCase().includes(q));
  }, [roleComboSearch, roleDropdownOptions]);

  const canAddNewRoleInCombo = useMemo(() => {
    const t = roleComboSearch.trim();
    if (!t) return false;
    const exact = roleDropdownOptions.some((o) => o.toLowerCase() === t.toLowerCase());
    if (exact) return false;
    return filteredRoleComboOptions.length === 0;
  }, [roleComboSearch, roleDropdownOptions, filteredRoleComboOptions]);

  /** Called when user clicks "Add '…'" in the combo — shows platform picker */
  const handleAddCustomRole = (explicit?: string) => {
    const t = (explicit ?? roleComboSearch).trim();
    if (!t) return;
    // Close combo, open platform selection modal
    setRoleComboOpen(false);
    setRoleComboSearch('');
    setPendingCustomRoleName(t);
    setShowPlatformModal(true);
  };

  /** Called when user picks Mobile or Portal in the platform modal */
  const confirmCustomRoleWithPlatform = (platform: 'Mobile' | 'Portal') => {
    const displayName = `${pendingCustomRoleName} (${platform})`;
    const allKnown = [...PREDEFINED_ROLE_OPTIONS, ...customRoleOptions];
    const exists = allKnown.some((x) => x.toLowerCase() === displayName.toLowerCase());
    if (!exists) {
      setCustomRoleOptions((prev) => [...prev, displayName]);
    }
    setFormData((prev) => ({ ...prev, roleName: displayName }));
    setErrors((prev) => ({ ...prev, roleName: '' }));
    setShowPlatformModal(false);
    setPendingCustomRoleName('');
  };

  const isSystemRole = (roleName: string): boolean => {
    const systemRoleNames = ['STAFF', 'LEAD_LABOUR', 'LABOUR', 'ADMIN', 'SUPER_ADMIN'];
    return systemRoleNames.includes(roleName.toUpperCase());
  };

  const getPermissionCount = (role: Role): number => {
    return role.permissions?.filter(p => p.allowed).length || 0;
  };

  const getUserCountForRole = (roleName: string): number => {
    const mockUserCounts: { [key: string]: number } = {
      'STAFF': 3,
      'LEAD_LABOUR': 5,
      'LABOUR': 12
    };
    return mockUserCounts[roleName.toUpperCase()] || 0;
  };

  const currentRolePlatform =
    editingRole?.platform ||
    (getPlatformTag(formData.roleName) ?? '');

  const isLabourRoleSelected = isMobilePlatform(formData.roleName, currentRolePlatform);
  const permissionModulesToRender = getActiveModulesForRole(formData.roleName, currentRolePlatform);

  // ─── Helper: for a module, which of the "standard" columns are visible? ───────
  /**
   * Returns which standard columns (view/create/edit/delete) should render
   * a real checkbox (true) vs a dash (false) for the given module + role context.
   */
  const getStandardColumnVisibility = (
    modName: string,
    roleName: string,
    platform?: string,
  ): { view: boolean; create: boolean; edit: boolean; delete: boolean } => {
    const acts = getActionsForModule(modName, roleName, platform);
    return {
      view: acts.includes('view'),
      create: acts.includes('create'),
      edit: acts.includes('edit'),
      delete: acts.includes('delete'),
    };
  };

  /** True if the module has any special (non-standard) actions for this role */
  const moduleHasSpecialActions = (modName: string, roleName: string, platform?: string): boolean => {
    const acts = getActionsForModule(modName, roleName, platform);
    return acts.some(a => !['view', 'create', 'edit', 'delete'].includes(a));
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingRoles ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2 text-gray-500">Loading roles...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRoles.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="text-lg font-medium mb-2">No data available</div>
                            <div className="text-sm">No roles found. Create your first role.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRoles.map((role) => {
                        const permissionCount = getPermissionCount(role);
                        const isProtectedRole = isProtectedRoleName(role.roleName);

                        return (
                          <tr key={role.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Circle className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-900">{role.roleName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={permissionCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                {permissionCount} permissions
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button onClick={() => handleViewRole(role)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!isProtectedRole && (
                                  <>
                                    <Button onClick={() => handleEditRole(role)} variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                    <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
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
                    <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
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
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">1</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Create Roles</h3>
                    <p className="text-sm text-gray-600">Define roles with specific permission sets. For example: &quot;Warehouse Manager&quot;, &quot;Sales Representative&quot;, &quot;Accountant&quot;</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-green-50 border-green-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">2</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Assign Permissions</h3>
                    <p className="text-sm text-gray-600">Select the permissions each role should have. Permissions are organized by category for easy management.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 rounded-lg border-2 bg-purple-50 border-purple-200">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center font-bold text-lg text-gray-700">3</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Assign to Users</h3>
                    <p className="text-sm text-gray-600">In Staff Management, simply select a role when creating a user. All permissions are automatically assigned!</p>
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
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
                  <Popover
                    open={roleComboOpen}
                    onOpenChange={(open) => {
                      setRoleComboOpen(open);
                      if (open) setRoleComboSearch('');
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={roleComboOpen}
                        className={cn(
                          'w-full justify-between font-normal h-10 px-3 py-2',
                          errors.roleName ? 'border-red-500 text-red-900' : 'border-gray-300 bg-gray-50',
                        )}
                      >
                        <span className={cn('truncate', !formData.roleName.trim() && 'text-muted-foreground')}>
                          {formData.roleName.trim() ? formData.roleName : 'Select role…'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 bg-white w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,24rem)]" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search or type new role name…"
                          value={roleComboSearch}
                          onValueChange={setRoleComboSearch}
                        />
                        <CommandList>
                          {filteredRoleComboOptions.length === 0 && !canAddNewRoleInCombo ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">No matching role.</div>
                          ) : null}
                          <CommandGroup heading="Roles">
                            {filteredRoleComboOptions.map((opt) => (
                              <CommandItem
                                key={opt}
                                value={opt}
                                onSelect={() => {
                                  setFormData((prev) => ({ ...prev, roleName: opt }));
                                  setRoleComboOpen(false);
                                  setRoleComboSearch('');
                                  setErrors((prev) => ({ ...prev, roleName: '' }));
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', formData.roleName.trim().toLowerCase() === opt.toLowerCase() ? 'opacity-100' : 'opacity-0')} />
                                {opt}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {canAddNewRoleInCombo ? (
                            <CommandGroup heading="Add new">
                              <CommandItem
                                value={`__add__${roleComboSearch.trim()}`}
                                className="text-primary font-medium"
                                onSelect={() => handleAddCustomRole(roleComboSearch.trim())}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add &quot;{roleComboSearch.trim()}&quot;
                              </CommandItem>
                            </CommandGroup>
                          ) : null}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="mt-1 text-xs text-gray-500">
                    Open the list, type to search — if the name is new, use <strong>Add &quot;…&quot;</strong> in the list.
                  </p>
                  {errors.roleName && <p className="mt-1 text-sm text-red-600">{errors.roleName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
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
                <h3 className="text-lg font-semibold bg-primary text-white p-3 rounded-t-lg flex items-center gap-3">
                  <span>Permissions</span>
                  {formData.roleName && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${getPlatformTag(formData.roleName) === 'Mobile'
                        ? 'bg-green-500 text-white'
                        : getPlatformTag(formData.roleName) === 'Portal'
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}>
                      {getPlatformTag(formData.roleName) === 'Mobile' ? '📱' : getPlatformTag(formData.roleName) === 'Portal' ? '🌐' : ''}
                      {getPlatformTag(formData.roleName) ? ` ${getPlatformTag(formData.roleName)}` : ''}
                    </span>
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="px-4 py-3 text-left text-sm font-medium border border-gray-300">
                          Module
                        </th>
                        {/* View column — always shown */}
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
                        {/* Create column — always shown */}
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
                        {/* Edit column — hide for labour-scoped roles that have overrides */}
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
                        {/* Delete column — hidden for labour-scoped roles */}
                        {!isLabourRoleSelected && (
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
                        )}
                        {/* Special Actions column — always shown */}
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
                      {permissionModulesToRender.map((modName) => {
                        const moduleActs = getActionsForModule(modName, formData.roleName, currentRolePlatform);
                        const isDashboard = modName === 'dashboard';
                        // Virtual "Assigned" modules — only special actions column is relevant
                        const isAssignedModule =
                          modName === ASSIGNED_LABOUR_MODULE || modName === ASSIGNED_LEAD_LABOUR_MODULE;
                        const colVis = getStandardColumnVisibility(modName, formData.roleName, currentRolePlatform);
                        const hasSpecial = moduleHasSpecialActions(modName, formData.roleName, currentRolePlatform);

                        // Current permission source
                        const permSource = editingRole ? editingRole.permissions : newRolePermissions;

                        return (
                          <tr key={modName} className={`hover:bg-gray-50 ${isAssignedModule ? 'bg-white' : ''}`}>
                            {/* Module name */}
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300 capitalize">
                              {formatModuleName(modName)}

                            </td>

                            {/* View */} 
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isAssignedModule && colVis.view && !isPermissionHidden(modName, 'view', formData.roleName) ? (
                                <input
                                  type="checkbox"
                                  checked={getPermissionValue(modName, 'view', permSource)}
                                  onChange={(e) => handlePermissionChange(modName, 'view', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Create */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard && !isAssignedModule && colVis.create && !isPermissionHidden(modName, 'create', formData.roleName) ? (
                                <input
                                  type="checkbox"
                                  checked={getPermissionValue(modName, 'create', permSource)}
                                  onChange={(e) => handlePermissionChange(modName, 'create', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Edit */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {!isDashboard && !isAssignedModule && colVis.edit && !isPermissionHidden(modName, 'edit', formData.roleName) ? (
                                <input
                                  type="checkbox"
                                  checked={getPermissionValue(modName, 'edit', permSource)}
                                  onChange={(e) => handlePermissionChange(modName, 'edit', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Delete — column hidden for labour-scoped */}
                            {!isLabourRoleSelected && (
                              <td className="px-4 py-3 text-center border border-gray-300">
                                {!isDashboard && !isAssignedModule && colVis.delete && !isPermissionHidden(modName, 'delete', formData.roleName) ? (
                                  <input
                                    type="checkbox"
                                    checked={getPermissionValue(modName, 'delete', permSource)}
                                    onChange={(e) => handlePermissionChange(modName, 'delete', e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                  />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Special Actions — always shown */}
                            <td className="px-4 py-3 text-center border border-gray-300">
                              {hasSpecial ? (
                                <div className="space-y-2">
                                  {moduleActs
                                    .filter(a => !['view', 'create', 'edit', 'delete'].includes(a))
                                    .filter(a => !isPermissionHidden(modName, a, formData.roleName))  // ← ADD THIS LINE
                                    .map((a) => (
                                      <div key={a} className="flex items-center justify-center">
                                        <input
                                          type="checkbox"
                                          checked={getPermissionValue(modName, a, permSource)}
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
                    <div className="text-3xl font-bold">{getUserCountForRole(viewingRole.roleName)}</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions List</h3>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {(() => {
                      const groupedPermissions = groupPermissionsByModule(viewingRole.permissions || []);
                      const allModulesForView = [
                        ...modules,
                        ASSIGNED_LABOUR_MODULE,
                        ASSIGNED_LEAD_LABOUR_MODULE,
                      ];
                      const moduleOrder = allModulesForView.filter(mod => groupedPermissions[mod]);

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
            <Button onClick={() => setShowViewModal(false)} variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Picker Modal — shown when adding a custom role */}
      <Dialog open={showPlatformModal} onOpenChange={(open) => { if (!open) { setShowPlatformModal(false); setPendingCustomRoleName(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Select Platform</DialogTitle>
            <DialogDescription>
              Is the role <strong>&quot;{pendingCustomRoleName}&quot;</strong> for Mobile or Portal?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              type="button"
              onClick={() => confirmCustomRoleWithPlatform('Mobile')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <span className="text-4xl">📱</span>
              <span className="font-semibold text-gray-700 group-hover:text-green-700">Mobile</span>
              <span className="text-xs text-gray-400 text-center">Labour / Lead Labour permissions</span>
            </button>
            <button
              type="button"
              onClick={() => confirmCustomRoleWithPlatform('Portal')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <span className="text-4xl">🌐</span>
              <span className="font-semibold text-gray-700 group-hover:text-purple-700">Portal</span>
              <span className="text-xs text-gray-400 text-center">All permissions with assigned modules</span>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPlatformModal(false); setPendingCustomRoleName(''); }}>
              Cancel
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
