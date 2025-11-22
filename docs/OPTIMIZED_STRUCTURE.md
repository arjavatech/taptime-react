# Optimized TapTime Project Structure

## Overview
This is a streamlined, minimal project structure focused on maintainability and performance.

## Optimized Structure

```
src/
├── api.js                 # Single consolidated API file
├── constants/
│   └── index.js          # Essential constants only
├── components/
│   ├── layout/           # Header, Footer components
│   └── ui/               # shadcn/ui components
├── config/
│   └── supabase.js       # Supabase configuration
├── contexts/
│   └── AuthContext.jsx   # Authentication context
├── hooks/
│   └── index.js          # Single hook file
├── lib/
│   └── utils.js          # shadcn/ui utilities
├── pages/                # All page components
├── utils/
│   └── index.js          # Consolidated utilities
├── App.jsx
├── index.css
└── main.jsx
```

## Key Optimizations

### 1. **Single API File** (`src/api.js`)
- All API functions in one place
- Built-in HTTP client with error handling
- Environment variable support
- Reduced from 3 files to 1

### 2. **Consolidated Utilities** (`src/utils/index.js`)
- Essential utility functions only
- Validation, formatting, storage helpers
- Reduced from 3 files to 1

### 3. **Simplified Constants** (`src/constants/index.js`)
- Only essential constants
- Storage keys, validation patterns, encryption key
- Removed verbose error messages and unused constants

### 4. **Single Hook File** (`src/hooks/index.js`)
- One simple `useApi` hook
- Covers most use cases
- Reduced complexity

### 5. **Removed Unnecessary Files**
- Deleted example components
- Removed redundant API configuration files
- Eliminated unused utility functions

## Usage Examples

### API Calls
```javascript
import { fetchEmployeeData, createEmployeeWithData } from '../api.js';

// Simple usage
const employees = await fetchEmployeeData();
const result = await createEmployeeWithData(data);
```

### Utilities
```javascript
import { formatPhoneNumber, isValidEmail, getStorageValue } from '../utils';

const phone = formatPhoneNumber('1234567890');
const isValid = isValidEmail('test@example.com');
const companyId = getStorageValue(STORAGE_KEYS.COMPANY_ID);
```

### Hooks
```javascript
import { useApi } from '../hooks';
import { fetchEmployeeData } from '../api.js';

const { data, loading, error, execute } = useApi(fetchEmployeeData);
```

### Constants
```javascript
import { STORAGE_KEYS, VALIDATION_PATTERNS } from '../constants';

localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
VALIDATION_PATTERNS.EMAIL.test(email);
```

## Benefits

1. **Reduced Bundle Size**: Fewer files and imports
2. **Faster Development**: Less navigation between files
3. **Easier Maintenance**: Single source of truth for each concern
4. **Better Performance**: Reduced module resolution overhead
5. **Simplified Imports**: Clear, predictable import paths

## File Count Reduction

- **Before**: 15+ utility/API files
- **After**: 4 core files
- **Reduction**: ~70% fewer files

## Environment Variables

```env
# Required
VITE_API_BASE_URL=https://postgresql-restless-waterfall-2105.fly.dev/
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key

# Optional
VITE_APP_NAME=TapTime
VITE_APP_VERSION=1.0.0
```

## Migration from Previous Structure

1. **API Calls**: Change imports from `../api/index.js` to `../api.js`
2. **Utilities**: Change imports from `../utils/helpers.js` to `../utils`
3. **Hooks**: Change imports from `../hooks/useApi.js` to `../hooks`
4. **Constants**: Import from `../constants` (unchanged)

## Performance Impact

- **Faster builds**: Fewer files to process
- **Smaller bundles**: Eliminated unused code
- **Quicker imports**: Direct file imports vs folder resolution
- **Better tree-shaking**: Cleaner dependency graph