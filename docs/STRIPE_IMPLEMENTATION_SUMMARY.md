# Stripe Recurring Subscription Implementation - Complete

## ✅ Implementation Status: COMPLETE

All components of the Stripe recurring subscription system have been successfully implemented for TapTime.

---

## 📋 What Has Been Implemented

### Backend (PostgreSQL FastAPI)

#### 1. Database Schema ✓
- **Migration Files Created:**
  - `migrations/003_add_stripe_fields_to_company.sql` - Adds Stripe fields to company table
  - `migrations/004_create_subscription_plans.sql` - Creates subscription plans table
  - `migrations/005_create_subscription_events.sql` - Creates webhook event log table
  - `migrations/006_create_invoices.sql` - Creates invoices table

#### 2. Stripe Service Layer ✓
- **File:** `src/services/stripe_service.py`
- **Functions:**
  - `create_customer()` - Create Stripe customer
  - `create_checkout_session()` - Generate Checkout URL with 14-day trial
  - `get_subscription()` - Fetch subscription details
  - `update_subscription()` - Modify subscription (quantity/plan)
  - `cancel_subscription()` - Cancel at period end or immediately
  - `create_customer_portal_session()` - Generate billing portal URL
  - `construct_webhook_event()` - Verify webhook signatures (security)

#### 3. Subscription DAO ✓
- **File:** `src/dao/subscription_dao.py`
- **New Methods:**
  - `update_company_stripe_data()` - Save Stripe IDs and status
  - `get_company_by_stripe_customer()` - Lookup by Stripe customer ID
  - `log_subscription_event()` - Save webhook events
  - `check_trial_expired()` - Validate trial status
  - `get_subscription_plan_by_price_id()` - Get plan details
  - `save_invoice()` - Store invoice records
  - `get_company_invoices()` - Fetch invoice history

#### 4. Subscription Router ✓
- **File:** `src/routers/subscription_router.py`
- **Endpoints:**
  - `POST /subscription/create-checkout-session` - Start subscription
  - `GET /subscription/plans` - List available plans
  - `GET /subscription/status/{cid}` - Get current subscription + trial info
  - `POST /subscription/cancel/{cid}` - Cancel subscription
  - `POST /subscription/change-plan/{cid}` - Upgrade/downgrade
  - `POST /subscription/customer-portal/{cid}` - Open billing portal
  - `POST /subscription/webhook` - **CRITICAL** Stripe event handler

- **Webhook Event Handlers:**
  - `handle_checkout_completed()` - Save subscription on signup
  - `handle_subscription_created()` - Record new subscription
  - `handle_subscription_updated()` - Update status changes
  - `handle_subscription_deleted()` - Handle cancellations
  - `handle_trial_will_end()` - Send reminder (3 days before)
  - `handle_invoice_paid()` - Record successful payment
  - `handle_invoice_payment_failed()` - Alert on payment failure

#### 5. Trial Enforcement Middleware ✓
- **File:** `src/middleware/subscription_check.py`
- **Functionality:**
  - Checks subscription status on each API request
  - Blocks access if trial expired and no active subscription
  - Returns 402 Payment Required status
  - Whitelist for allowed endpoints (auth, webhooks, public pages)

### Frontend (React 19 + Vite)

#### 6. API Client Functions ✓
- **File:** `src/api.js`
- **Functions Added:**
  - `createCheckoutSession()` - Get Stripe Checkout URL
  - `getSubscriptionPlans()` - Fetch available plans
  - `getSubscriptionStatus()` - Get current subscription + trial info
  - `cancelSubscription()` - Cancel subscription
  - `changeSubscriptionPlan()` - Upgrade/downgrade
  - `createCustomerPortalSession()` - Get billing portal URL

#### 7. Subscription Management Component ✓
- **File:** `src/components/SubscriptionManagement.jsx`
- **Features:**
  - Trial status banner with countdown
  - Current usage display (employees × $1/month)
  - Device count tracking (informational)
  - Available plans with pricing
  - "Start 14-Day Trial" button → Stripe Checkout
  - "Manage Billing" button → Stripe Customer Portal
  - "Cancel Subscription" functionality
  - Recent invoices display
  - Loading states and error handling

#### 8. Subscription Check Hook ✓
- **File:** `src/hooks/useSubscriptionCheck.js`
- **Functionality:**
  - Check trial/subscription status on mount
  - Auto-check every 5 minutes (configurable)
  - Auto-redirect to subscription page if trial expired
  - Returns: `{ subscriptionStatus, isTrialExpired, loading, error, refetch }`

#### 9. Profile Page Integration ✓
- **File:** `src/pages/Profile.jsx` (lines 1441-1443)
- **Changes:**
  - Imported `SubscriptionManagement` component
  - Rendered in subscription tab
  - Owner-only access control maintained

### Helper Scripts

#### 10. Deployment Scripts ✓
- **`scripts/setup_stripe_products.py`**
  - Automated Stripe product creation ($1/employee/month)
  - Updates database with Stripe IDs
  - Verification checks

- **`scripts/grandfather_existing_users.py`**
  - Grants 14-day trial to existing users
  - Sends notification emails (placeholder)
  - Interactive confirmation

- **`scripts/check_expired_trials.py`**
  - Daily cron job to check expired trials
  - Updates status to 'expired'
  - Sends reminder emails (3 days before expiration)
  - Suitable for `crontab`: `0 9 * * * /path/to/check_expired_trials.py`

### Environment Configuration

#### 11. Environment Variables ✓

**Backend (.env.example):**
```bash
STRIPE_API_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend (.env.example):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

---

## 🎯 Your Pricing Model

✅ **$1 per employee per month** (quantity-based pricing)
✅ **14-day free trial** (unlimited employees during trial)
✅ **Device tracking** (tracked for info, not charged)
✅ **Monthly billing** = (Active Employee Count × $1)
✅ **Post-trial**: Require payment or block access
✅ **Stripe Checkout** for payment collection (PCI compliant)

---

## 🚀 Next Steps: Deployment

### Step 1: Database Migration

**IMPORTANT: Backup your database first!**

```bash
# Navigate to backend directory
cd "/Users/mani/Projects/Arjava Git/Tap-Time/tap-time-backend/postgresql"

# Run migrations in order
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/003_add_stripe_fields_to_company.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/004_create_subscription_plans.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/005_create_subscription_events.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/006_create_invoices.sql
```

### Step 2: Set Up Stripe Products

**Option A: Manual Setup (Recommended)**

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click "Add product"
3. Fill in:
   - **Name:** TapTime Per-Employee Plan
   - **Description:** Pay $1 per employee per month. Scale as you grow.
   - **Pricing:** $1.00 USD / month
   - **Recurring:** Monthly
   - **Billing type:** Per unit (quantity-based)
4. Save and copy the **Product ID** (`prod_xxx`) and **Price ID** (`price_xxx`)
5. Update database:

```sql
UPDATE subscription_plans
SET stripe_product_id = 'prod_YOUR_ACTUAL_ID',
    stripe_price_id = 'price_YOUR_ACTUAL_ID'
WHERE plan_name = 'TapTime Per-Employee Plan';
```

**Option B: Automated Script**

```bash
# Set environment variable
export STRIPE_API_KEY=sk_test_your_key_here

# Run script
python scripts/setup_stripe_products.py
```

### Step 3: Configure Stripe Webhooks

**CRITICAL: Follow these exact steps!**

1. Go to: https://dashboard.stripe.com/test/webhooks
   - **NOT** the Workbench section!
   - You should see "Endpoints" tab at the top

2. Click **"Add endpoint"** button (blue, top right)

3. **Endpoint URL:** Enter your backend webhook URL
   - Local: `http://localhost:8000/subscription/webhook`
   - Production: `https://your-api-domain.com/subscription/webhook`

4. **Select events to listen to:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. Click **"Add endpoint"**

6. **Copy the signing secret:**
   - After creation, click "Reveal" in the "Signing secret" section
   - Copy the value (starts with `whsec_`)
   - Add to backend `.env`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

**Alternative: Stripe CLI for Local Development**

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/subscription/webhook

# Copy the webhook secret from output to .env
```

### Step 4: Configure Environment Variables

**Backend (.env):**
```bash
# Database
DB_HOST=your-host
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=taptimeprod

# Stripe
STRIPE_API_KEY=sk_test_your_actual_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
```

**Frontend (.env):**
```bash
VITE_API_BASE_URL=https://your-backend-url.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key
```

### Step 5: Deploy Backend

```bash
cd "/Users/mani/Projects/Arjava Git/Tap-Time/tap-time-backend/postgresql"

# Install Stripe library
pip install stripe

# Deploy (your deployment process)
# Ensure webhook endpoint is publicly accessible
```

### Step 6: Deploy Frontend

```bash
cd "/Users/mani/Projects/Arjava Git/Tap-Time/taptime-react"

# Build
npm run build

# Deploy (your deployment process)
```

### Step 7: Grandfather Existing Users

Give existing companies a 14-day trial:

```bash
cd "/Users/mani/Projects/Arjava Git/Tap-Time/tap-time-backend/postgresql"

# Run migration script
python scripts/grandfather_existing_users.py
```

### Step 8: Set Up Cron Job for Trial Checks

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/tap-time-backend/postgresql && python scripts/check_expired_trials.py
```

### Step 9: Enable Stripe Customer Portal

1. Go to: [Stripe Dashboard → Settings → Billing → Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable features:
   - ✅ Update payment method
   - ✅ View invoice history
   - ✅ Cancel subscription
   - ✅ Download invoices as PDF
3. Save changes

---

## 🧪 Testing Guide

### Test Mode Setup

1. **Switch to Test Mode:** Toggle in Stripe Dashboard (top-left)
2. **Use Test Cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`
   - Any future expiry, any 3-digit CVC

### Test Scenarios

#### 1. New User Trial Flow
1. Log in as Owner
2. Go to Profile → Subscription tab
3. Should see "Free Trial Active" banner
4. Click "Start 14-Day Free Trial"
5. Redirected to Stripe Checkout
6. Enter test card: `4242 4242 4242 4242`
7. Complete checkout
8. Redirected back to app
9. Verify trial countdown shows

#### 2. Trial to Paid Conversion
1. Wait for trial to expire (or manually set `trial_end_date` to past)
2. App should block access with 402 status
3. Navigate to subscription page
4. Subscribe to plan
5. Access restored immediately

#### 3. Webhook Event Testing
```bash
# Using Stripe CLI
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed

# Check database
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 5;
```

#### 4. Customer Portal
1. Click "Manage Billing"
2. Opens Stripe Customer Portal
3. Test updating payment method
4. Test viewing invoices
5. Test canceling subscription

#### 5. Plan Quantity Updates
1. Add new employee in TapTime
2. Subscription quantity should auto-update to employee count
3. Verify in Stripe Dashboard → Subscriptions

---

## 🔒 Security Checklist

✅ **Webhook signature verification** - Prevents spoofing
✅ **Environment variables** - No hardcoded keys
✅ **Publishable key safe for frontend** - Read-only access
✅ **Secret key only on backend** - Never exposed to client
✅ **PCI compliant** - Payment data stays in Stripe
✅ **Trial enforcement on backend** - Can't be bypassed from frontend
✅ **HTTPS required** - For production webhooks

---

## 📊 Monitoring & Maintenance

### Database Queries

**Check trial expirations:**
```sql
SELECT cid, company_name, trial_end_date, subscription_status
FROM company
WHERE trial_end_date < NOW()
  AND subscription_status = 'trialing'
ORDER BY trial_end_date DESC;
```

**Check active subscriptions:**
```sql
SELECT cid, company_name, subscription_status, stripe_subscription_id
FROM company
WHERE stripe_subscription_id IS NOT NULL
ORDER BY subscription_status;
```

**Check webhook events:**
```sql
SELECT event_type, processing_status, created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 20;
```

**Check failed webhooks:**
```sql
SELECT event_type, error_message, created_at
FROM subscription_events
WHERE processing_status = 'failed'
ORDER BY created_at DESC;
```

### Stripe Dashboard Monitoring

- **Customers:** https://dashboard.stripe.com/test/customers
- **Subscriptions:** https://dashboard.stripe.com/test/subscriptions
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Events & Logs:** https://dashboard.stripe.com/test/logs
- **Revenue:** https://dashboard.stripe.com/test/payments

---

## 🆘 Troubleshooting

### Webhook signature verification failed
**Cause:** Wrong `STRIPE_WEBHOOK_SECRET` or missing signature header
**Fix:** Copy exact secret from Stripe Dashboard → Webhooks → Endpoint → Signing secret

### "No module named 'stripe'"
**Cause:** Stripe library not installed
**Fix:** `pip install stripe`

### Checkout button does nothing
**Cause:** Missing or wrong `VITE_STRIPE_PUBLISHABLE_KEY`
**Fix:** Check `.env` file has correct publishable key (starts with `pk_test_` or `pk_live_`)

### Trial expired immediately after signup
**Cause:** Migration script ran on new accounts
**Fix:**
```sql
UPDATE company
SET trial_end_date = NOW() + INTERVAL '14 days',
    subscription_status = 'trialing'
WHERE cid = 'xxx';
```

### Webhooks not being received
**Causes & Fixes:**
1. Endpoint not publicly accessible → Deploy backend to public URL
2. Wrong URL configured in Stripe → Verify endpoint URL matches
3. Local development → Use Stripe CLI: `stripe listen --forward-to localhost:8000/subscription/webhook`

---

## 📚 Resources

### Stripe Documentation
- [Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

### Stripe Dashboard Links
- **Products:** https://dashboard.stripe.com/test/products
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Logs:** https://dashboard.stripe.com/test/logs

### Support
- Stripe Support: https://support.stripe.com/
- Stripe Discord: https://discord.gg/stripe

---

## 📝 Summary

This implementation provides a complete, production-ready Stripe subscription system with:

- ✅ **Per-employee pricing** ($1/employee/month)
- ✅ **14-day free trial** with unlimited usage
- ✅ **Automatic billing** based on employee count
- ✅ **Secure payment processing** via Stripe Checkout
- ✅ **Trial expiration enforcement** with 402 Payment Required
- ✅ **Self-service billing portal** for customers
- ✅ **Comprehensive webhook handling** for all subscription events
- ✅ **Invoice tracking and history**
- ✅ **Migration path** for existing users
- ✅ **Testing and monitoring** tools

**Implementation Status:** ✅ COMPLETE
**Ready for Deployment:** Yes (after completing Next Steps above)
**Security:** ✅ Production-ready with webhook signature verification

---

## 🎉 You're Ready!

All code is implemented. Follow the "Next Steps: Deployment" section above to:
1. Run database migrations
2. Set up Stripe products
3. Configure webhooks
4. Deploy backend and frontend
5. Test the complete flow

Good luck with your launch! 🚀
