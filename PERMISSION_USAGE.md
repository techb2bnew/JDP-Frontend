# Permission-Based UI System

## Overview
This system automatically hides/shows UI elements based on user permissions. Permissions are loaded from the login response and stored in localStorage.

## How It Works

### 1. Permission Structure
```typescript
interface Permission {
  id: number;
  action: string;        // "view", "create", "edit", "delete", "export", etc.
  module: string;        // "jobs", "products", "invoices", "customers", etc.
  description: string;   // Human-readable description
  display_name?: string; // Optional display name
}
```

### 2. Available Permission Functions
```typescript
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

// Check single permission
hasPermission('jobs', 'create')        // Returns true/false

// Check if user has ANY of the specified permissions
hasAnyPermission('jobs', ['view', 'create'])  // Returns true if user can view OR create jobs

// Check if user has ALL of the specified permissions
hasAllPermissions('jobs', ['view', 'create', 'edit'])  // Returns true only if user can view AND create AND edit jobs
```

## Usage Examples

### 1. PermissionButton Component
```tsx
import { PermissionButton } from './ui/PermissionButton';

// Button only shows if user has 'jobs' 'create' permission
<PermissionButton
  module="jobs"
  action="create"
  onClick={handleCreateJob}
  className="bg-blue-600 text-white"
>
  Create Job
</PermissionButton>

// Button only shows if user has 'invoices' 'delete' permission
<PermissionButton
  module="invoices"
  action="delete"
  variant="destructive"
  onClick={handleDeleteInvoice}
>
  Delete Invoice
</PermissionButton>
```

### 2. Conditional Rendering with usePermissions Hook
```tsx
import { usePermissions } from '../contexts/PermissionContext';

function JobsPage() {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div>
      <h1>Jobs Management</h1>
      
      {/* Show create button only if user has permission */}
      {hasPermission('jobs', 'create') && (
        <button onClick={handleCreateJob}>Create New Job</button>
      )}
      
      {/* Show action buttons based on permissions */}
      <div className="actions">
        {hasPermission('jobs', 'view') && (
          <button onClick={handleViewJob}>View</button>
        )}
        
        {hasPermission('jobs', 'edit') && (
          <button onClick={handleEditJob}>Edit</button>
        )}
        
        {hasPermission('jobs', 'delete') && (
          <button onClick={handleDeleteJob}>Delete</button>
        )}
        
        {hasPermission('jobs', 'assign') && (
          <button onClick={handleAssignJob}>Assign</button>
        )}
      </div>
      
      {/* Show section only if user has any job permissions */}
      {hasAnyPermission('jobs', ['view', 'create', 'edit', 'delete']) && (
        <div className="jobs-section">
          {/* Jobs content */}
        </div>
      )}
    </div>
  );
}
```

### 3. Table Actions with Permissions
```tsx
function JobsTable({ jobs }) {
  const { hasPermission } = usePermissions();

  return (
    <table>
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map(job => (
          <tr key={job.id}>
            <td>{job.title}</td>
            <td>{job.status}</td>
            <td>
              <div className="flex space-x-2">
                {hasPermission('jobs', 'view') && (
                  <PermissionButton
                    module="jobs"
                    action="view"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewJob(job)}
                  >
                    <Eye className="h-4 w-4" />
                  </PermissionButton>
                )}
                
                {hasPermission('jobs', 'edit') && (
                  <PermissionButton
                    module="jobs"
                    action="edit"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditJob(job)}
                  >
                    <Edit className="h-4 w-4" />
                  </PermissionButton>
                )}
                
                {hasPermission('jobs', 'delete') && (
                  <PermissionButton
                    module="jobs"
                    action="delete"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteJob(job)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </PermissionButton>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Available Modules and Actions

### Core Modules:
- **dashboard**: `view`
- **jobs**: `view`, `create`, `edit`, `delete`, `assign`
- **products**: `view`, `create`, `edit`, `delete`, `upload`
- **orders**: `view`, `create`, `edit`, `delete`
- **invoices**: `view`, `create`, `edit`, `delete`, `export`
- **customers**: `view`, `create`, `edit`, `delete`
- **suppliers**: `view`, `create`, `edit`, `delete`
- **reports**: `view`, `create`, `edit`, `delete`, `export`, `import`
- **staff**: `view`, `create`, `edit`, `delete`
- **labour**: `view`, `create`, `edit`, `delete`
- **lead_labour**: `view`, `create`, `edit`, `delete`
- **notification**: `view`, `create`, `edit`, `delete`
- **settings**: `view`, `edit`, `manage_users`, `manage_roles`
- **roles**: `view`, `create`, `edit`, `delete`

## Best Practices

1. **Always use PermissionButton** for action buttons
2. **Check permissions before rendering** sensitive sections
3. **Use hasAnyPermission** for showing/hiding entire sections
4. **Use hasAllPermissions** for features that require multiple permissions
5. **Keep permission checks close** to the UI elements they control

## Setup

The PermissionProvider is already set up in `App.tsx` and will automatically load permissions from localStorage when the user logs in.

Permissions are loaded from the login API response and stored in the user object structure:
```typescript
{
  user: {
    id: 11,
    full_name: "Admin",
    email: "admin@yopmail.com",
    permissions: [
      { id: 1, action: "view", module: "dashboard", description: "..." },
      { id: 2, action: "view", module: "jobs", description: "..." },
      // ... more permissions
    ]
  },
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expires: 1234567890
}
```
