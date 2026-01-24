# Stripe Subscription API Reference

Quick reference for all Stripe subscription endpoints.

## Base URL
```
https://your-api-domain.com
```

---

## Endpoints

### 1. Create Checkout Session
Start a new subscription with 14-day trial.

**Endpoint**: `POST /subscription/create-checkout-session`

**Request Body**:
```json
{
  "cid": "company_id",
  "price_id": "price_xxxxx",
  "quantity": 10,
  "success_url": "https://your-app.com/profile?tab=subscription&success=true",
  "cancel_url": "https://your-app.com/profile?tab=subscription&canceled=true"
}
```

**Response**:
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_test_xxxxx"
}
```

**Usage**:
```javascript
import { createCheckoutSession } from './api';

const response = await createCheckoutSession(
  companyId,
  priceId,
  employeeCount,
  successUrl,
  cancelUrl
);

if (response.success) {
  window.location.href = response.data.checkout_url;
}
```

---

### 2. Get Subscription Plans
Fetch all available subscription plans.

**Endpoint**: `GET /subscription/plans`

**Response**:
```json
{
  "plans": [
    {
      "plan_id": "uuid",
      "plan_name": "TapTime Per-Employee Plan",
      "plan_description": "Pay $1 per employee per month...",
      "stripe_product_id": "prod_xxxxx",
      "stripe_price_id": "price_xxxxx",
      "price_per_employee": 1.00,
      "currency": "usd",
      "billing_interval": "month",
      "trial_period_days": 14,
      "is_active": true
    }
  ]
}
```

**Usage**:
```javascript
import { getSubscriptionPlans } from './api';

const response = await getSubscriptionPlans();
if (response.success) {
  console.log(response.plans);
}
```

---

### 3. Get Subscription Status
Get current subscription and trial status for a company.

**Endpoint**: `GET /subscription/status/{cid}`

**Response**:
```json
{
  "subscription_status": "trialing",
  "stripe_customer_id": "cus_xxxxx",
  "stripe_subscription_id": "sub_xxxxx",
  "trial_end_date": "2026-02-07T12:00:00",
  "trial_expired": false,
  "days_remaining": 14,
  "current_period_end": "2026-02-07T12:00:00",
  "cancel_at_period_end": false,
  "employee_count": 10,
  "device_count": 3,
  "recent_invoices": [
    {
      "invoice_id": "uuid",
      "stripe_invoice_id": "in_xxxxx",
      "amount_due": 10.00,
      "amount_paid": 10.00,
      "currency": "usd",
      "invoice_status": "paid",
      "employee_count": 10,
      "created_at": "2026-01-07T12:00:00",
      "paid_at": "2026-01-07T12:05:00"
    }
  ]
}
```

**Usage**:
```javascript
import { getSubscriptionStatus } from './api';

const response = await getSubscriptionStatus(companyId);
if (response.success) {
  const { trial_expired, days_remaining } = response.data;
  if (trial_expired) {
    // Redirect to subscription page
  }
}
```

---

### 4. Cancel Subscription
Cancel a subscription (at period end or immediately).

**Endpoint**: `POST /subscription/cancel/{cid}`

**Request Body**:
```json
{
  "at_period_end": true
}
```

**Response**:
```json
{
  "message": "Subscription canceled successfully",
  "data": {
    "cancel_at_period_end": true
  }
}
```

**Usage**:
```javascript
import { cancelSubscription } from './api';

// Cancel at end of billing period (graceful)
const response = await cancelSubscription(companyId, true);

// Cancel immediately
const response = await cancelSubscription(companyId, false);
```

---

### 5. Change Subscription Plan
Upgrade or downgrade subscription plan.

**Endpoint**: `POST /subscription/change-plan/{cid}`

**Request Body**:
```json
{
  "new_price_id": "price_xxxxx",
  "quantity": 15
}
```

**Response**:
```json
{
  "message": "Subscription plan updated successfully",
  "data": {
    "status": "active"
  }
}
```

**Usage**:
```javascript
import { changeSubscriptionPlan } from './api';

const response = await changeSubscriptionPlan(
  companyId,
  newPriceId,
  newEmployeeCount
);
```

---

### 6. Create Customer Portal Session
Open Stripe Customer Portal for self-service billing management.

**Endpoint**: `POST /subscription/customer-portal/{cid}`

**Request Body**:
```json
{
  "return_url": "https://your-app.com/profile?tab=subscription"
}
```

**Response**:
```json
{
  "portal_url": "https://billing.stripe.com/..."
}
```

**Usage**:
```javascript
import { createCustomerPortalSession } from './api';

const returnUrl = `${window.location.origin}/profile?tab=subscription`;
const response = await createCustomerPortalSession(companyId, returnUrl);

if (response.success) {
  window.location.href = response.portalUrl;
}
```

---

### 7. Stripe Webhook Handler
Receives and processes Stripe webhook events.

**Endpoint**: `POST /subscription/webhook`

**IMPORTANT**: This endpoint is called by Stripe, not your frontend.

**Headers Required**:
```
stripe-signature: t=xxxxx,v1=xxxxx
```

**Request Body**: Raw Stripe event JSON

**Handled Events**:
- `checkout.session.completed` - Checkout success
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellation
- `customer.subscription.trial_will_end` - Trial reminder (3 days before)
- `invoice.paid` - Successful payment
- `invoice.payment_failed` - Failed payment

**Response**:
```json
{
  "status": "success"
}
```

**Configuration**:
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-api-domain.com/subscription/webhook`
3. Select events listed above
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET` env variable

---

## Error Responses

All endpoints may return these error formats:

### 400 Bad Request
```json
{
  "detail": "Missing required field: cid"
}
```

### 402 Payment Required
```json
{
  "detail": "Your trial has expired. Please subscribe to continue using TapTime.",
  "error_code": "TRIAL_EXPIRED",
  "action_required": "subscribe"
}
```

### 404 Not Found
```json
{
  "detail": "Company not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Stripe error: Invalid price ID"
}
```

---

## Frontend API Helper Functions

All API functions are in `src/api.js`:

```javascript
import {
  createCheckoutSession,
  getSubscriptionPlans,
  getSubscriptionStatus,
  cancelSubscription,
  changeSubscriptionPlan,
  createCustomerPortalSession
} from './api';
```

### Function Signatures

```typescript
createCheckoutSession(
  cid: string,
  priceId: string,
  quantity: number,
  successUrl: string,
  cancelUrl: string
): Promise<{ success: boolean, data?: any, error?: string }>

getSubscriptionPlans(): Promise<{
  success: boolean,
  plans?: Array<Plan>,
  error?: string
}>

getSubscriptionStatus(cid: string): Promise<{
  success: boolean,
  data?: SubscriptionStatus,
  error?: string
}>

cancelSubscription(
  cid: string,
  atPeriodEnd: boolean = true
): Promise<{ success: boolean, data?: any, error?: string }>

changeSubscriptionPlan(
  cid: string,
  newPriceId: string,
  quantity?: number
): Promise<{ success: boolean, data?: any, error?: string }>

createCustomerPortalSession(
  cid: string,
  returnUrl: string
): Promise<{ success: boolean, portalUrl?: string, error?: string }>
```

---

## React Hook: useSubscriptionCheck

Custom hook for checking subscription status in components.

**File**: `src/hooks/useSubscriptionCheck.js`

**Usage**:
```javascript
import { useSubscriptionCheck } from '../hooks';

function MyComponent() {
  const {
    subscriptionStatus,
    isTrialExpired,
    loading,
    error,
    refetch
  } = useSubscriptionCheck(
    true,          // shouldRedirect - auto-redirect if trial expired
    5 * 60 * 1000  // checkInterval - check every 5 minutes
  );

  if (loading) return <div>Loading...</div>;
  if (isTrialExpired) return <div>Trial expired!</div>;

  return <div>Welcome! {subscriptionStatus.days_remaining} days left</div>;
}
```

**Parameters**:
- `shouldRedirect` (boolean): If true, auto-redirect to subscription page when trial expired
- `checkInterval` (number): How often to check status in milliseconds (default: 5 minutes)

**Returns**:
- `subscriptionStatus`: Full subscription status object
- `isTrialExpired`: Boolean indicating if trial has expired
- `loading`: Boolean for loading state
- `error`: Error message if any
- `refetch`: Function to manually trigger a status check

---

## Database Queries

Useful SQL queries for debugging:

### Check company subscription status
```sql
SELECT
  cid,
  company_name,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  trial_end_date,
  current_period_end,
  cancel_at_period_end,
  employee_count
FROM company
WHERE cid = 'your-company-id';
```

### View recent webhook events
```sql
SELECT
  event_type,
  stripe_customer_id,
  processing_status,
  error_message,
  created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 10;
```

### View invoices for a company
```sql
SELECT
  stripe_invoice_id,
  amount_paid,
  currency,
  invoice_status,
  employee_count,
  billing_period_start,
  billing_period_end,
  created_at
FROM invoices
WHERE cid = 'your-company-id'
ORDER BY created_at DESC;
```

### Find expired trials
```sql
SELECT
  cid,
  company_name,
  email,
  trial_end_date,
  subscription_status
FROM company
WHERE subscription_status = 'trialing'
  AND trial_end_date < NOW()
  AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');
```

---

## Testing with Stripe Test Cards

### Successful Payment
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Payment Declined
```
Card: 4000 0000 0000 0002
```

### Requires Authentication (3D Secure)
```
Card: 4000 0027 6000 3184
```

More test cards: https://stripe.com/docs/testing

---

## Rate Limits

Stripe API rate limits:
- Test mode: 100 requests/second
- Live mode: 100 requests/second (may be higher for verified businesses)

If you hit rate limits, implement exponential backoff in your retry logic.

---

## Best Practices

1. **Error Handling**: Always handle API errors gracefully
   ```javascript
   const response = await getSubscriptionStatus(cid);
   if (!response.success) {
     console.error(response.error);
     showErrorToUser(response.error);
     return;
   }
   ```

2. **Loading States**: Show loading indicators during API calls
   ```javascript
   setLoading(true);
   const response = await createCheckoutSession(...);
   setLoading(false);
   ```

3. **Webhook Idempotency**: Webhooks may be sent multiple times. Handle duplicate events:
   - Database uses `UNIQUE` constraint on `stripe_event_id`
   - `ON CONFLICT DO NOTHING` prevents duplicate processing

4. **Security**: Never expose Stripe secret keys in frontend code
   - ✅ Use `VITE_STRIPE_PUBLISHABLE_KEY` (safe for client)
   - ❌ Never use `STRIPE_API_KEY` in frontend

5. **Subscription Updates**: Always fetch fresh status before displaying
   ```javascript
   useEffect(() => {
     loadSubscriptionStatus();
   }, []);
   ```
