# Stripe Recurring Subscription Implementation Guide

This document provides a complete guide for deploying the Stripe subscription system in TapTime.

## Overview

The implementation adds per-employee pricing ($1/employee/month) with 14-day free trials and automatic billing based on employee count.

## Files Created/Modified

### Backend Files (PostgreSQL)

#### Database Migrations (4 files)
- `migrations/003_add_stripe_fields_to_company.sql` - Adds Stripe fields to company table
- `migrations/004_create_subscription_plans.sql` - Creates subscription_plans table
- `migrations/005_create_subscription_events.sql` - Creates subscription_events table for webhook logging
- `migrations/006_create_invoices.sql` - Creates invoices table

#### Services (2 files)
- `src/services/__init__.py` - Services package initializer
- `src/services/stripe_service.py` - Stripe API integration layer

#### DAOs (1 file modified)
- `src/dao/subscription_dao.py` - Enhanced with Stripe methods

#### Routers (1 file replaced)
- `src/routers/subscription_router.py` - Complete Stripe subscription endpoints + webhooks

#### Middleware (2 files)
- `src/middleware/__init__.py` - Middleware package initializer
- `src/middleware/subscription_check.py` - Trial enforcement middleware

#### Scripts (3 files)
- `scripts/setup_stripe_products.py` - Automated Stripe product creation
- `scripts/grandfather_existing_users.py` - Migration script for existing users
- `scripts/check_expired_trials.py` - Daily cron job for trial expiration

#### Configuration (1 file modified)
- `.env.example` - Added STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET

### Frontend Files (React)

#### Components (1 file)
- `src/components/SubscriptionManagement.jsx` - Main subscription UI component

#### API (1 file modified)
- `src/api.js` - Added 6 subscription API functions

#### Pages (1 file modified)
- `src/pages/Profile.jsx` - Integrated SubscriptionManagement component

#### Hooks (2 files)
- `src/hooks/useSubscriptionCheck.js` - Subscription status check hook
- `src/hooks/index.js` - Exported new hook

#### Configuration (1 file modified)
- `.env.example` - Added VITE_STRIPE_PUBLISHABLE_KEY

---

## Deployment Steps

### Step 1: Backend Deployment

#### 1.1 Install Stripe Python SDK

```bash
cd ../tap-time-backend/postgresql
pip install stripe
pip freeze > requirements.txt  # Update requirements
```

#### 1.2 Run Database Migrations

**IMPORTANT: Always backup your database before running migrations!**

```bash
# Backup database first!
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations in order
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/003_add_stripe_fields_to_company.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/004_create_subscription_plans.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/005_create_subscription_events.sql
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/006_create_invoices.sql

# Verify migrations
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt subscription*"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d company" | grep stripe
```

#### 1.3 Configure Environment Variables

Update `.env` file with Stripe credentials:

```bash
# Get these from Stripe Dashboard → Developers → API keys
STRIPE_API_KEY=sk_test_xxxxx  # Use sk_test_ for testing, sk_live_ for production

# Get this after setting up webhook (Step 2.2)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 1.4 Deploy Backend Code

```bash
# Deploy updated code to your hosting platform (Fly.io, AWS, etc.)
# Example for Fly.io:
fly deploy
```

### Step 2: Stripe Dashboard Configuration

#### 2.1 Create Stripe Product and Price

**Option A: Manual Setup (Recommended for first time)**

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click "Add product"
3. Fill in:
   - **Name**: TapTime Per-Employee Plan
   - **Description**: Pay $1 per employee per month. Scale as you grow.
   - **Pricing model**: Standard pricing
   - **Price**: $1.00
   - **Billing period**: Monthly
   - **Usage type**: Licensed (for quantity-based pricing)
4. Click "Save product"
5. Copy the **Product ID** (starts with `prod_`)
6. Copy the **Price ID** (starts with `price_`)

**Option B: Automated Setup**

```bash
cd ../tap-time-backend/postgresql
python scripts/setup_stripe_products.py
```

#### 2.2 Update Database with Stripe IDs

```sql
UPDATE subscription_plans
SET stripe_product_id = 'prod_xxxxx',  -- Paste your Product ID
    stripe_price_id = 'price_xxxxx'    -- Paste your Price ID
WHERE plan_name = 'TapTime Per-Employee Plan';
```

Verify:
```sql
SELECT * FROM subscription_plans WHERE is_active = TRUE;
```

#### 2.3 Configure Stripe Webhooks

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-api-domain.com/subscription/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update backend `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
8. Redeploy backend to apply webhook secret

#### 2.4 Configure Customer Portal

1. Go to [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable:
   - ✓ Update payment method
   - ✓ View invoice history
   - ✓ Cancel subscription
   - ✓ Download invoices
3. Save settings

### Step 3: Frontend Deployment

#### 3.1 Update Environment Variables

Update `.env` file:

```bash
# Get from Stripe Dashboard → Developers → API keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use pk_test_ for testing
```

#### 3.2 Install Stripe.js (if needed)

```bash
cd taptime-react
npm install @stripe/stripe-js
```

#### 3.3 Build and Deploy

```bash
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

### Step 4: Migrate Existing Users

Grant 14-day trial to all existing companies:

```bash
cd ../tap-time-backend/postgresql
python scripts/grandfather_existing_users.py
```

This will:
- Find all companies without Stripe subscription
- Grant them a 14-day trial
- Set trial_end_date = NOW() + 14 days

### Step 5: Set Up Cron Job for Trial Checks

Add to your server's crontab:

```bash
# Daily at 9 AM - check for expired trials
0 9 * * * cd /path/to/tap-time-backend/postgresql && python scripts/check_expired_trials.py
```

Or use a task scheduler (AWS EventBridge, Heroku Scheduler, etc.)

---

## Testing

### Test Mode Setup

1. Ensure you're using **test mode** API keys (sk_test_, pk_test_)
2. Test cards: https://stripe.com/docs/testing

### Test Scenarios

#### 1. New User Trial Signup
```
1. Create a new company account
2. Go to Profile → Subscription tab
3. Click "Start 14-Day Free Trial"
4. Use test card: 4242 4242 4242 4242
5. Complete checkout
6. Verify:
   - Database shows trial_end_date = NOW() + 14 days
   - subscription_status = 'trialing'
   - Webhook events logged in subscription_events table
```

#### 2. Trial to Paid Conversion
```
1. During trial period, checkout completes successfully
2. After 14 days, trial ends
3. First payment is automatically processed
4. Verify subscription_status changes to 'active'
```

#### 3. Trial Expiration Enforcement
```
1. Manually update trial_end_date to past date:
   UPDATE company SET trial_end_date = NOW() - INTERVAL '1 day' WHERE cid = 'xxx';
2. Try to access the app
3. Should see trial expired message
4. Should be redirected to subscription page
```

#### 4. Payment Failure
```
1. Use decline test card: 4000 0000 0000 0002
2. Try to checkout
3. Verify:
   - Payment fails
   - subscription_status becomes 'past_due'
   - Webhook event logged
```

#### 5. Customer Portal
```
1. Click "Manage Billing & Invoices"
2. Should redirect to Stripe Customer Portal
3. Verify can:
   - Update payment method
   - View invoice history
   - Cancel subscription
```

#### 6. Webhook Testing (Local Development)

Install Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:8000/subscription/webhook
```

Trigger test events:
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

Check webhook events in database:
```sql
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
```

---

## Verification Checklist

### Backend
- [ ] All 4 migration files executed successfully
- [ ] subscription_plans table has data with real Stripe IDs
- [ ] STRIPE_API_KEY set in environment
- [ ] STRIPE_WEBHOOK_SECRET set in environment
- [ ] Stripe package installed (`pip list | grep stripe`)
- [ ] Webhook endpoint accessible (test with `curl -X POST https://your-api/subscription/webhook`)

### Frontend
- [ ] VITE_STRIPE_PUBLISHABLE_KEY set in environment
- [ ] SubscriptionManagement component renders on Profile page
- [ ] Can navigate to Profile → Subscription tab
- [ ] Plans are loading and displaying

### Stripe Dashboard
- [ ] Product created with $1/month pricing
- [ ] Webhook endpoint configured and working (check webhook logs)
- [ ] Customer Portal settings enabled

### Database
- [ ] Company table has new stripe_* columns
- [ ] subscription_plans table has data
- [ ] Existing users have trial_end_date set (if migration ran)

### End-to-End
- [ ] Can complete checkout with test card
- [ ] Webhook events are being logged
- [ ] Subscription status updates in database
- [ ] Trial countdown shows correctly
- [ ] Customer Portal redirect works

---

## Troubleshooting

### Issue: "Webhook signature verification failed"
**Solution**:
- Check STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
- Ensure webhook endpoint is receiving raw request body
- Verify Stripe-Signature header is being passed

### Issue: "No module named 'stripe'"
**Solution**:
```bash
pip install stripe
```

### Issue: Checkout button does nothing
**Solution**:
- Check browser console for errors
- Verify VITE_STRIPE_PUBLISHABLE_KEY is set
- Check API endpoint is responding:
  ```bash
  curl -X POST https://your-api/subscription/create-checkout-session \
    -H "Content-Type: application/json" \
    -d '{"cid":"test","price_id":"price_xxx","quantity":1,"success_url":"http://localhost","cancel_url":"http://localhost"}'
  ```

### Issue: Webhooks not being received
**Solution**:
- Verify endpoint URL is correct in Stripe Dashboard
- Check endpoint is publicly accessible (not localhost)
- For local testing, use Stripe CLI: `stripe listen --forward-to localhost:8000/subscription/webhook`
- Check webhook logs in Stripe Dashboard → Developers → Webhooks → [Your endpoint]

### Issue: Trial expired but user can still access
**Solution**:
- Ensure subscription check middleware is enabled in main.py
- Check trial_end_date is correct in database
- Verify subscription_status is not 'active'

---

## Production Deployment

### Switch to Live Mode

1. **Stripe Dashboard**: Toggle from Test mode to Live mode
2. **Backend .env**:
   ```bash
   STRIPE_API_KEY=sk_live_xxxxx  # Live secret key
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Live webhook secret (different from test!)
   ```
3. **Frontend .env**:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Live publishable key
   ```
4. **Recreate webhook endpoint** in Live mode (URL will be the same, but secret will be different)
5. **Update database** with live Product ID and Price ID
6. **Deploy** backend and frontend with new environment variables

### Security Checklist
- [ ] All Stripe keys are in environment variables (not hardcoded)
- [ ] Webhook signature verification enabled
- [ ] HTTPS enabled on all endpoints
- [ ] Database backups configured
- [ ] Error logging and monitoring set up

---

## Support & Resources

### Stripe Documentation
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

### Monitoring
- Stripe Dashboard → Developers → Logs (see all API requests)
- Database: `SELECT * FROM subscription_events ORDER BY created_at DESC;`
- Backend logs: Check application logs for errors

### Getting Help
- Stripe Support: https://support.stripe.com/
- Stripe Discord: https://discord.gg/stripe

---

## Summary

This implementation provides:
- ✅ $1 per employee per month pricing
- ✅ 14-day free trial with unlimited employees/devices
- ✅ Automatic billing based on employee count
- ✅ Stripe Checkout for secure payment collection
- ✅ Trial expiration enforcement
- ✅ Webhook-driven subscription lifecycle management
- ✅ Customer Portal for self-service billing
- ✅ Migration strategy for existing users
- ✅ Comprehensive testing and security

**Next Steps After Deployment:**
1. Monitor webhook delivery in Stripe Dashboard
2. Test with real customers in Test mode
3. Set up email notifications for trial reminders
4. Configure subscription metrics tracking
5. Plan marketing for subscription launch
