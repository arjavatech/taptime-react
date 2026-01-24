# Frontend Implementation Guide - Stripe Subscriptions

This document covers all frontend implementation work for Stripe subscription integration in the React app.

**Prerequisites**:
- Read `1-overview-and-plan.md` first
- Backend implementation should be in progress or completed

---

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [API Client Functions](#api-client-functions)
3. [Subscription Management Component](#subscription-management-component)
4. [Subscription Check Hook](#subscription-check-hook)
5. [Profile Page Updates](#profile-page-updates)
6. [Trial Expiration UI](#trial-expiration-ui)
7. [Testing](#testing)
8. [Common Issues](#common-issues)

---

## Environment Setup

### Install Stripe.js

The `@stripe/stripe-js` package is already installed (confirmed in package.json).

If needed:
```bash
npm install @stripe/stripe-js
```

### Add Environment Variable

**File**: `.env`

Add your Stripe publishable key (get from Stripe Dashboard):

```bash
# Stripe Publishable Key (safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# For production:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: Publishable keys (starting with `pk_`) are safe to expose in frontend code. Secret keys (`sk_`) must NEVER be in frontend.

---

## API Client Functions

**File**: `src/api.js`

Add these functions to your existing `api.js` file:

```javascript
// ==========================================
// SUBSCRIPTION API FUNCTIONS
// ==========================================

/**
 * Create Stripe Checkout session for subscription
 * @param {string} companyId - Company UUID
 * @param {string} successUrl - Redirect URL on success
 * @param {string} cancelUrl - Redirect URL on cancel
 * @returns {Promise<{session_id, url, customer_id, employee_count}>}
 */
export const createCheckoutSession = async (companyId, successUrl, cancelUrl) => {
  try {
    const data = await api.post(`${API_BASE}/subscription/create-checkout-session`, {
      c_id: companyId,
      success_url: successUrl,
      cancel_url: cancelUrl
    });
    return data;
  } catch (error) {
    console.error('Create checkout session error:', error);
    throw error;
  }
};

/**
 * Get all available subscription plans
 * @returns {Promise<Array>} List of subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    return await api.get(`${API_BASE}/subscription/plans`);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return [];
  }
};

/**
 * Get subscription status for a company
 * @param {string} companyId - Company UUID
 * @returns {Promise<{subscription_status, trial_end_date, employee_count, monthly_estimate, ...}>}
 */
export const getSubscriptionStatus = async (companyId) => {
  try {
    return await api.get(`${API_BASE}/subscription/status/${companyId}`);
  } catch (error) {
    console.error('Get subscription status error:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {string} companyId - Company UUID
 * @param {boolean} immediate - If true, cancel immediately; if false, cancel at period end
 * @returns {Promise<{message, data}>}
 */
export const cancelSubscription = async (companyId, immediate = false) => {
  try {
    return await api.post(`${API_BASE}/subscription/cancel/${companyId}`, { immediate });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};

/**
 * Update subscription quantity (employee count sync)
 * Called automatically when employees are added/removed
 * @param {string} companyId - Company UUID
 * @returns {Promise<{message, data}>}
 */
export const updateSubscriptionQuantity = async (companyId) => {
  try {
    return await api.post(`${API_BASE}/subscription/update-quantity/${companyId}`, {});
  } catch (error) {
    console.error('Update subscription quantity error:', error);
    throw error;
  }
};

/**
 * Create Stripe Customer Portal session
 * Allows customers to manage billing, invoices, payment methods
 * @param {string} companyId - Company UUID
 * @param {string} returnUrl - URL to return to after portal session
 * @returns {Promise<{url}>} Portal URL
 */
export const createCustomerPortalSession = async (companyId, returnUrl) => {
  try {
    const data = await api.post(`${API_BASE}/subscription/customer-portal/${companyId}`, {
      return_url: returnUrl
    });
    return data;
  } catch (error) {
    console.error('Create customer portal session error:', error);
    throw error;
  }
};
```

**Why these functions?**
- `createCheckoutSession`: Starts subscription payment flow
- `getSubscriptionStatus`: Shows trial countdown, billing estimate, subscription state
- `createCustomerPortalSession`: Self-service billing management
- `updateSubscriptionQuantity`: Syncs employee count to Stripe (called after employee add/delete)

---

## Subscription Management Component

**File**: `src/components/SubscriptionManagement.jsx` (NEW FILE)

Create this new component for the subscription UI:

```jsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  getSubscriptionPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  createCustomerPortalSession,
} from '../api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  CreditCard,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Monitor,
  CheckCircle,
  Info,
} from 'lucide-react';
import { STORAGE_KEYS } from '../constants';

// Initialize Stripe (only once)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [error, setError] = useState('');

  const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load plans and current subscription status in parallel
      const [plansData, statusData] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionStatus(companyId)
      ]);

      setPlans(plansData);
      setCurrentSubscription(statusData);
    } catch (err) {
      setError('Failed to load subscription data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setProcessingCheckout(true);
      setError('');

      // Build success/cancel URLs
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/profile?tab=subscription&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/profile?tab=subscription`;

      // Create checkout session
      const { url } = await createCheckoutSession(
        companyId,
        successUrl,
        cancelUrl
      );

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      setError('Failed to start checkout process. Please try again.');
      console.error(err);
      setProcessingCheckout(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setProcessingPortal(true);
      setError('');

      const returnUrl = `${window.location.origin}/profile?tab=subscription`;
      const { url } = await createCustomerPortalSession(companyId, returnUrl);

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err) {
      setError('Failed to open billing portal. Please try again.');
      console.error(err);
      setProcessingPortal(false);
    }
  };

  const getTrialDaysRemaining = () => {
    if (!currentSubscription?.trial_end_date) return null;

    const trialEnd = new Date(currentSubscription.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

    return daysRemaining > 0 ? daysRemaining : 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Check subscription status
  const isTrialActive = currentSubscription?.subscription_status === 'trialing';
  const hasActiveSubscription = currentSubscription?.subscription_status === 'active';
  const hasPaymentIssue = currentSubscription?.subscription_status === 'past_due';
  const trialDaysRemaining = getTrialDaysRemaining();
  const trialExpired = currentSubscription?.trial_expired;

  const employeeCount = currentSubscription?.employee_count || 0;
  const deviceCount = currentSubscription?.device_count || 0;
  const unitPrice = currentSubscription?.unit_price || 1.0;
  const monthlyEstimate = currentSubscription?.monthly_estimate || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      {isTrialActive && (
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Free Trial Active
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {trialDaysRemaining} days remaining in your 14-day trial.
                  {!currentSubscription?.stripe_customer_id && (
                    <> Add a payment method below to ensure uninterrupted access after your trial ends.</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired Warning */}
      {trialExpired && !hasActiveSubscription && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-100">
                  Trial Expired
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your 14-day trial has ended. Add a payment method below to continue using TapTime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Issue Warning */}
      {hasPaymentIssue && (
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-900 dark:text-orange-100">
                  Payment Issue
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your last payment failed. Please update your payment method to avoid service interruption.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleManageBilling}
                  disabled={processingPortal}
                >
                  Update Payment Method
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your team size and device count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employees */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Employees</h3>
              </div>
              <p className="text-3xl font-bold text-primary">
                {employeeCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(unitPrice)} per employee/month
              </p>
            </div>

            {/* Devices */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Devices</h3>
              </div>
              <p className="text-3xl font-bold text-primary">
                {deviceCount}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tracked for reference
              </p>
            </div>
          </div>

          {/* Monthly Estimate */}
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isTrialActive ? 'After trial ends:' : 'Monthly billing:'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(monthlyEstimate)}/month
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {employeeCount} employees × {formatCurrency(unitPrice)}
                </p>
              </div>
              {hasActiveSubscription && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Simple Pricing
          </CardTitle>
          <CardDescription>
            Pay only for what you use - $1 per employee per month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Unlimited Employees</p>
                <p className="text-sm text-muted-foreground">
                  Add as many employees as you need. Billed monthly at $1 per employee.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Unlimited Devices</p>
                <p className="text-sm text-muted-foreground">
                  Track time across any number of devices at no extra cost.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">All Features Included</p>
                <p className="text-sm text-muted-foreground">
                  Time tracking, reporting, employee management, and email support.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Prorated Billing</p>
                <p className="text-sm text-muted-foreground">
                  When you add or remove employees mid-month, you're only charged for the actual days used.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!currentSubscription?.stripe_customer_id ? (
            // No payment method added yet
            <div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddPaymentMethod}
                disabled={processingCheckout}
              >
                {processingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isTrialActive ? 'Add Payment Method' : 'Subscribe Now'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {isTrialActive
                  ? "You won't be charged until your trial ends"
                  : "Start with a 14-day free trial"}
              </p>
            </div>
          ) : (
            // Has payment method/subscription
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageBilling}
                disabled={processingPortal}
              >
                {processingPortal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening billing portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Update payment method, view invoices, or cancel subscription
              </p>
            </div>
          )}

          {/* Subscription Info */}
          {hasActiveSubscription && currentSubscription?.current_period_end && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Next billing date:{' '}
                {new Date(currentSubscription.current_period_end).toLocaleDateString()}
              </p>
              {currentSubscription?.cancel_at_period_end && (
                <p className="text-sm text-orange-600 text-center mt-1">
                  Subscription will cancel at the end of the current period
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagement;
```

**Key Features**:
- Shows trial countdown
- Displays current employee/device count
- Calculates monthly billing estimate
- Handles payment method addition
- Opens Stripe Customer Portal
- Shows error states and loading states
- Responsive design

---

## Subscription Check Hook

**File**: `src/hooks/useSubscriptionCheck.js` (NEW FILE)

Create this custom hook to check trial/subscription status:

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionStatus } from '../api';
import { STORAGE_KEYS } from '../constants';

/**
 * Hook to check subscription status and redirect if trial expired
 * Use in protected pages that require active subscription
 */
export const useSubscriptionCheck = () => {
  const [subscriptionValid, setSubscriptionValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
        const userType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);

        // Only check for Owner role (other roles don't need subscription checks)
        if (userType !== 'Owner') {
          setSubscriptionValid(true);
          setLoading(false);
          return;
        }

        if (!companyId) {
          setSubscriptionValid(false);
          setLoading(false);
          return;
        }

        const status = await getSubscriptionStatus(companyId);
        setSubscriptionData(status);

        // Check if trial expired and no active subscription
        const isValid =
          !status.trial_expired ||
          status.subscription_status === 'active' ||
          status.subscription_status === 'trialing';

        setSubscriptionValid(isValid);

        // Redirect to subscription page if invalid
        if (!isValid) {
          navigate('/profile?tab=subscription', {
            state: { message: 'Your trial has expired. Please subscribe to continue.' }
          });
        }
      } catch (error) {
        console.error('Subscription check failed:', error);
        // On error, allow access (fail open to prevent blocking users on network issues)
        setSubscriptionValid(true);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();

    // Re-check every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return { subscriptionValid, loading, subscriptionData };
};
```

**Usage in components**:

```jsx
import { useSubscriptionCheck } from '../hooks/useSubscriptionCheck';

const EmployeeList = () => {
  const { subscriptionValid, loading } = useSubscriptionCheck();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!subscriptionValid) {
    return null; // Will redirect to subscription page
  }

  // ... rest of component
};
```

---

## Profile Page Updates

**File**: `src/pages/Profile.jsx`

**Modify existing subscription tab** (replace lines 1440-1499):

```jsx
import SubscriptionManagement from '../components/SubscriptionManagement';

// ... existing imports and code ...

// Inside the Profile component, replace the subscription tab content:

{activeTab === "subscription" && userType === "Owner" && (
  <Card>
    <CardHeader>
      <div>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription & Billing
        </CardTitle>
        <CardDescription>
          Manage your TapTime subscription and billing details
        </CardDescription>
      </div>
    </CardHeader>

    <CardContent>
      <SubscriptionManagement />
    </CardContent>
  </Card>
)}
```

**That's it!** The existing tab structure and access control (Owner-only) already works perfectly.

---

## Trial Expiration UI

### Option 1: Full-Page Modal (Recommended)

**File**: `src/components/TrialExpiredModal.jsx` (NEW FILE - Optional)

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { AlertCircle } from 'lucide-react';

const TrialExpiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    navigate('/profile?tab=subscription');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle>Trial Expired</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your 14-day free trial has ended. Subscribe now to continue using TapTime.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">What you'll get:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✓ Unlimited employees ($1/employee/month)</li>
              <li>✓ Unlimited devices</li>
              <li>✓ All time tracking features</li>
              <li>✓ Advanced reporting</li>
              <li>✓ Email support</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handleSubscribe}>
            Subscribe Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
```

### Option 2: Banner Notification

Add to Header component to show persistent trial warning:

```jsx
// In Header.jsx
const [subscriptionStatus, setSubscriptionStatus] = useState(null);

useEffect(() => {
  const checkStatus = async () => {
    const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
    const userType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);

    if (userType === 'Owner' && companyId) {
      const status = await getSubscriptionStatus(companyId);
      setSubscriptionStatus(status);
    }
  };

  checkStatus();
}, []);

// Add banner above main content:
{subscriptionStatus?.trial_expired && !subscriptionStatus?.stripe_customer_id && (
  <div className="bg-red-600 text-white px-4 py-2 text-center">
    <p className="text-sm">
      Your trial has expired.{' '}
      <Link to="/profile?tab=subscription" className="underline font-medium">
        Subscribe now
      </Link>
      {' '}to continue using TapTime.
    </p>
  </div>
)}
```

---

## Testing

### 1. Environment Variable Check

```bash
# Start dev server
npm run dev

# Open browser console
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
# Should show: pk_test_xxxxx or pk_live_xxxxx
```

### 2. Component Testing

**Test Subscription Management Component**:

1. Navigate to `/profile?tab=subscription`
2. Should see:
   - Employee count
   - Device count
   - Monthly estimate
   - "Add Payment Method" button (if no subscription)
   - OR "Manage Billing" button (if has subscription)

**Test Checkout Flow**:

1. Click "Add Payment Method"
2. Should redirect to `checkout.stripe.com`
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date
5. Any 3-digit CVC
6. Complete checkout
7. Should redirect back to app
8. Check database: subscription should be active

**Test Customer Portal**:

1. Click "Manage Billing" (after subscription created)
2. Should redirect to `billing.stripe.com`
3. Should see:
   - Current subscription
   - Payment method
   - Invoice history
   - Cancel subscription option

### 3. Trial Countdown Test

```jsx
// Temporarily modify SubscriptionManagement.jsx for testing

// Add this to see trial date:
console.log('Trial end date:', currentSubscription?.trial_end_date);
console.log('Days remaining:', trialDaysRemaining);

// Should show correct countdown
```

### 4. Edge Cases

**Test Scenarios**:

| Scenario | Expected Behavior |
|----------|------------------|
| Fresh account | Shows 14 days remaining |
| Trial day 10 | Shows 4 days remaining |
| Trial expired, no payment | Shows "Trial Expired" banner |
| Trial expired, payment added | Shows active subscription |
| Payment failed | Shows "Payment Issue" warning |
| Subscription canceled | Shows "Canceled at period end" |

---

## Common Issues

### Issue: "Stripe publishable key not found"

**Cause**: Environment variable not set

**Fix**:
1. Check `.env` file has `VITE_STRIPE_PUBLISHABLE_KEY`
2. Restart dev server (`npm run dev`)
3. Clear browser cache

---

### Issue: Checkout button does nothing

**Cause**: Missing or invalid publishable key

**Fix**:
```javascript
// Add console log in SubscriptionManagement.jsx
console.log('Stripe key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Should show: pk_test_xxxxx or pk_live_xxxxx
// If shows 'undefined', check .env file
```

---

### Issue: "Invalid redirect URL" in Stripe

**Cause**: Success/cancel URLs must match Stripe Dashboard settings

**Fix**:
1. Go to Stripe Dashboard → Settings → Checkout
2. Add your domains to "Allowed redirect URLs":
   - `http://localhost:5173/*` (development)
   - `https://yourdomain.com/*` (production)

---

### Issue: Monthly estimate shows $0

**Cause**: Employee count not loading or API error

**Fix**:
```javascript
// Debug in SubscriptionManagement.jsx
console.log('Subscription data:', currentSubscription);
console.log('Employee count:', employeeCount);
console.log('Unit price:', unitPrice);
console.log('Estimate:', monthlyEstimate);

// Check if getSubscriptionStatus() is returning data
```

---

### Issue: "Manage Billing" button doesn't work

**Cause**: No Stripe customer ID or backend error

**Fix**:
1. Check backend logs for errors
2. Verify company has `stripe_customer_id` in database:
   ```sql
   SELECT stripe_customer_id FROM company WHERE cid = 'your-company-id';
   ```
3. If null, run checkout flow first to create customer

---

## Integration Checklist

Before deploying to production:

- [ ] Environment variable set: `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Checkout flow tested with test card
- [ ] Customer Portal opens correctly
- [ ] Employee count displays accurately
- [ ] Monthly estimate calculates correctly
- [ ] Trial countdown shows correct days
- [ ] Trial expired banner shows when appropriate
- [ ] Error states display properly
- [ ] Loading states work correctly
- [ ] Responsive design tested on mobile
- [ ] Dark mode support (if applicable)
- [ ] Success/cancel redirect URLs added to Stripe Dashboard

---

## Optional Enhancements

### 1. Add Success Toast After Checkout

```jsx
// In SubscriptionManagement.jsx, add this useEffect:

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  if (sessionId) {
    // Show success message
    toast.success('Payment method added successfully!');

    // Reload subscription data
    loadSubscriptionData();

    // Clean up URL
    window.history.replaceState({}, '', '/profile?tab=subscription');
  }
}, []);
```

### 2. Add Confirmation Dialog for Cancellation

```jsx
// Show confirmation before opening Customer Portal with cancel option
const handleCancelSubscription = async () => {
  if (confirm('Are you sure you want to cancel your subscription?')) {
    await handleManageBilling();
  }
};
```

### 3. Show Invoice History

```jsx
// Add invoices endpoint in api.js
export const getInvoices = async (companyId) => {
  return await api.get(`${API_BASE}/subscription/invoices/${companyId}`);
};

// Display in SubscriptionManagement.jsx
const [invoices, setInvoices] = useState([]);

useEffect(() => {
  loadInvoices();
}, []);

const loadInvoices = async () => {
  const data = await getInvoices(companyId);
  setInvoices(data);
};

// Show invoice list with download links
```

---

## Next Steps

✅ Frontend implementation complete
✅ Components created
✅ API client functions added
⏭️ Configure Stripe Dashboard (see `4-stripe-configuration.md`)
⏭️ Test end-to-end integration
⏭️ Deploy to production

---

**Estimated Implementation Time**: 1 day (4-6 hours)
