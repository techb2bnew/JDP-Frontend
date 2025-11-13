# Global Token Revocation Handling

यह document बताता है कि कैसे global token revocation handling implement की गई है और कैसे इसे use करना है।

## Overview

जब server पर token revoked हो जाता है, तो API response में यह error आता है:
```json
{
  "success": false,
  "message": "Token has been revoked. Please login again.",
  "statusCode": 401
}
```

इस case में automatically user को logout करके login page पर redirect करना होता है।

## Implementation

### 1. Global API Handler (`utils/globalApiHandler.ts`)

यह file सभी API calls के लिए global token handling provide करती है:

```typescript
import { globalApiCall } from '../utils/globalApiHandler'

// Example usage
const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
  method: 'GET'
})
const data = await response.json()
```

### 2. Features

- ✅ **Automatic Token Detection**: Automatically adds Bearer token to headers
- ✅ **Token Revocation Detection**: Detects specific error messages
- ✅ **Auto Logout**: Clears localStorage and redirects to login
- ✅ **Toast Notification**: Shows user-friendly error message
- ✅ **Error Handling**: Handles both 401 status and specific error messages

### 3. Error Messages Detected

यह function इन error messages को detect करता है:
- "Token has been revoked"
- "Token expired" 
- "Invalid token"
- "Please login again"

## Usage Examples

### Before (Manual Token Handling)
```typescript
const fetchData = async () => {
  try {
    const token = localStorage.getItem('jdp_auth') ? JSON.parse(localStorage.getItem('jdp_auth')!).token : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Manual token handling
        localStorage.removeItem('jdp_auth');
        window.location.href = '/login';
        return;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### After (Global Token Handling)
```typescript
import { globalApiCall } from '../utils/globalApiHandler'

const fetchData = async () => {
  try {
    const response = await globalApiCall(`${apiBaseUrl}/suppliers/getAllSuppliers`, {
      method: 'GET'
    });
    
    return await response.json();
  } catch (error) {
    // Token revocation is automatically handled
    // Only handle other errors here
    if (!(error instanceof Error && error.message?.includes('Session expired'))) {
      console.error('Other error:', error);
    }
  }
}
```

## Migration Guide

### Step 1: Import Global Handler
```typescript
import { globalApiCall } from '../utils/globalApiHandler'
```

### Step 2: Replace Manual Fetch Calls
```typescript
// Replace this:
const response = await fetch(url, { method: 'GET', headers: { ... } })

// With this:
const response = await globalApiCall(url, { method: 'GET' })
```

### Step 3: Update Error Handling
```typescript
// Remove manual 401 handling
// if (response.status === 401) { ... }

// Keep only non-token related error handling
catch (error) {
  if (!(error instanceof Error && error.message?.includes('Session expired'))) {
    // Handle other errors
  }
}
```

## Components Updated

### ✅ SupplierPage.tsx
- `fetchSuppliersData` function updated to use `globalApiCall`
- Automatic token revocation handling implemented

### 🔄 Other Components (To Be Updated)
- StaffPage.tsx
- LeadLabourPage.tsx  
- RolePermission.tsx
- Header.tsx (logout function)
- All other components with manual fetch calls

## Benefits

1. **Consistent Behavior**: All API calls handle token revocation the same way
2. **Reduced Code Duplication**: No need to repeat token handling logic
3. **Better UX**: Automatic logout with user notification
4. **Maintainable**: Single place to update token handling logic
5. **Error Prevention**: Prevents manual token handling mistakes

## Testing

Token revocation को test करने के लिए:

1. Login करें
2. Browser DevTools में localStorage से token को manually remove करें
3. कोई भी API call करें
4. Automatic logout और redirect होना चाहिए

## Future Enhancements

- [ ] Add retry mechanism for network errors
- [ ] Add request/response interceptors
- [ ] Add loading states management
- [ ] Add offline detection
- [ ] Add request caching
