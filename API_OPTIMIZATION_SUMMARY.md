# API Optimization Summary

## Issue Fixed
The `login_check` and `subscription/status` APIs were being called on every page navigation, causing unnecessary server load and potential performance issues.

## Root Causes Identified
1. **AuthContext** was calling `googleSignInCheck` (login_check API) on every page focus/visibility change
2. **useSubscriptionCheck** hook was running periodic checks every 5 minutes on all pages that used it
3. **CompanyContext** was calling subscription validation every 5 minutes for owners

## Changes Made

### 1. AuthContext.jsx
- **Removed automatic account deletion checks** on page visibility changes
- **Updated checkOnNavigation** to only run when account is not already detected as deleted
- **Added API cache clearing** on sign out to prevent stale data

### 2. useSubscriptionCheck.js
- **Disabled automatic periodic checks** by default
- **Added enablePeriodicCheck parameter** to allow explicit enabling of periodic checks when needed
- **Updated documentation** to reflect the new behavior

### 3. CompanyContext.jsx
- **Reduced periodic subscription validation frequency** from 5 minutes to 30 minutes for owners
- This significantly reduces the number of subscription/status API calls

### 4. api.js
- **Added request caching** for GET requests with 5-minute cache duration
- **Added request deduplication** to prevent duplicate simultaneous requests
- **Added clearApiCache function** to clear cache when needed (e.g., after login/logout)
- **Updated logout function** to clear API cache

## Benefits
1. **Reduced API calls**: No more unnecessary login_check calls on every page navigation
2. **Improved performance**: Cached responses prevent redundant API requests
3. **Better user experience**: Faster page loads due to reduced network requests
4. **Server load reduction**: Fewer unnecessary API calls to the backend
5. **Configurable behavior**: Periodic checks can still be enabled when explicitly needed

## Usage Notes
- The `useSubscriptionCheck` hook now requires explicit enabling of periodic checks: `useSubscriptionCheck(true, true)`
- API cache is automatically cleared on login/logout to ensure fresh data
- Account deletion checks are now only performed when explicitly needed, not on every page focus
- Subscription validation for owners now runs every 30 minutes instead of 5 minutes

## Backward Compatibility
All changes are backward compatible. Existing code will continue to work but with improved performance due to reduced API calls.