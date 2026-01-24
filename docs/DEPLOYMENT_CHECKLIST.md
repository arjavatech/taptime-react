# TapTime Stripe Subscription - Deployment Checklist

## Pre-Deployment

### 1. Database Migration
- [ ] **Backup production database!**
- [ ] Run migration 003: `psql ... -f migrations/003_add_stripe_fields_to_company.sql`
- [ ] Run migration 004: `psql ... -f migrations/004_create_subscription_plans.sql`
- [ ] Run migration 005: `psql ... -f migrations/005_create_subscription_events.sql`
- [ ] Run migration 006: `psql ... -f migrations/006_create_invoices.sql`
- [ ] Verify tables created:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('subscription_plans', 'subscription_events', 'invoices');
  ```

### 2. Stripe Product Setup
- [ ] Log into Stripe Dashboard (https://dashboard.stripe.com)
- [ ] Switch to **Test Mode** (toggle in top-left)
- [ ] Navigate to Products → Add product
- [ ] Create product:
  - Name: TapTime Per-Employee Plan
  - Price: $1.00 USD / month
  - Billing: Per unit (recurring)
- [ ] Copy **Product ID** (`prod_xxx`)
- [ ] Copy **Price ID** (`price_xxx`)
- [ ] Update database:
  ```sql
  UPDATE subscription_plans
  SET stripe_product_id = 'prod_YOUR_ID',
      stripe_price_id = 'price_YOUR_ID'
  WHERE plan_name = 'TapTime Per-Employee Plan';
  ```
- [ ] Verify update:
  ```sql
  SELECT plan_name, stripe_product_id, stripe_price_id
  FROM subscription_plans WHERE is_active = TRUE;
  ```

### 3. Stripe Webhook Configuration
- [ ] Go to https://dashboard.stripe.com/test/webhooks
- [ ] Click "Add endpoint" (blue button)
- [ ] Enter endpoint URL:
  - Local: `http://localhost:8000/subscription/webhook`
  - Prod: `https://your-api-domain.com/subscription/webhook`
- [ ] Select these events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `customer.subscription.trial_will_end`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
- [ ] Click "Add endpoint"
- [ ] Copy **Signing secret** (starts with `whsec_`)

### 4. Environment Variables

**Backend `.env`:**
- [ ] `STRIPE_API_KEY=sk_test_...` (from Stripe Dashboard → API keys)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (from webhook endpoint)
- [ ] Verify with: `cat .env | grep STRIPE`

**Frontend `.env`:**
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` (from Stripe Dashboard → API keys)
- [ ] Verify with: `cat .env | grep STRIPE`

### 5. Backend Dependencies
- [ ] Install Stripe: `pip install stripe`
- [ ] Verify: `pip list | grep stripe`

### 6. Stripe Customer Portal Settings
- [ ] Go to: https://dashboard.stripe.com/settings/billing/portal
- [ ] Enable:
  - [ ] Update payment method
  - [ ] View invoice history
  - [ ] Cancel subscription
  - [ ] Download invoices
- [ ] Save changes

---

## Deployment

### Backend Deployment
- [ ] Deploy backend with updated code
- [ ] Verify webhook endpoint is publicly accessible
- [ ] Test webhook:
  ```bash
  curl -X POST https://your-api.com/subscription/webhook
  # Should return 400 (missing signature) - this is expected
  ```

### Frontend Deployment
- [ ] Build frontend: `npm run build`
- [ ] Deploy frontend
- [ ] Verify environment variable loaded:
  - Open browser console
  - Run: `console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)`
  - Should show `pk_test_...`

---

## Post-Deployment

### 1. Grandfather Existing Users
- [ ] SSH into backend server
- [ ] Run: `python scripts/grandfather_existing_users.py`
- [ ] Review and confirm prompts
- [ ] Verify in database:
  ```sql
  SELECT cid, company_name, trial_end_date, subscription_status
  FROM company WHERE subscription_status = 'trialing';
  ```

### 2. Set Up Cron Job
- [ ] SSH into backend server
- [ ] Edit crontab: `crontab -e`
- [ ] Add line:
  ```
  0 9 * * * cd /path/to/backend && python scripts/check_expired_trials.py >> /var/log/trial_check.log 2>&1
  ```
- [ ] Verify: `crontab -l`

---

## Testing (Test Mode)

### Test Card: `4242 4242 4242 4242` (any future expiry, any CVC)

### 1. New User Trial Flow
- [ ] Log in as Owner (or create test company)
- [ ] Navigate to Profile → Subscription tab
- [ ] Should see "Free Trial Active" banner
- [ ] Should see trial countdown (14 days)
- [ ] Should see current usage (employees × $1)

### 2. Checkout Flow
- [ ] Click "Start 14-Day Free Trial"
- [ ] Redirects to Stripe Checkout (stripe.com domain)
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Enter any future expiry (e.g., 12/30)
- [ ] Enter any 3-digit CVC (e.g., 123)
- [ ] Complete checkout
- [ ] Redirects back to TapTime
- [ ] Should show success message

### 3. Verify Webhook Events
- [ ] Check Stripe Dashboard → Webhooks → [Your endpoint]
- [ ] Should see events delivered (green checkmarks)
- [ ] Check database:
  ```sql
  SELECT event_type, processing_status, created_at
  FROM subscription_events
  ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] All events should be `processing_status = 'processed'`

### 4. Verify Subscription Created
- [ ] Check database:
  ```sql
  SELECT cid, company_name, subscription_status,
         stripe_customer_id, stripe_subscription_id, trial_end_date
  FROM company WHERE stripe_customer_id IS NOT NULL;
  ```
- [ ] Should see:
  - `subscription_status = 'trialing'`
  - `stripe_customer_id` populated
  - `stripe_subscription_id` populated
  - `trial_end_date` set to 14 days from now

### 5. Customer Portal
- [ ] Click "Manage Billing" button
- [ ] Opens Stripe Customer Portal (billing.stripe.com)
- [ ] Test viewing subscription details
- [ ] Test viewing invoice history
- [ ] Test updating payment method (use another test card)

### 6. Trial Expiration (Simulated)
- [ ] Manually set trial to expired:
  ```sql
  UPDATE company
  SET trial_end_date = NOW() - INTERVAL '1 day'
  WHERE cid = 'test_company_id';
  ```
- [ ] Try to access protected page (e.g., Employees)
- [ ] Should see 402 Payment Required error
- [ ] Or auto-redirected to subscription page

### 7. Cancel Subscription
- [ ] In subscription tab, click "Cancel Subscription"
- [ ] Confirm cancellation
- [ ] Should see: "Subscription will be canceled on [date]"
- [ ] Verify in database:
  ```sql
  SELECT cancel_at_period_end FROM company WHERE cid = 'test_company_id';
  ```
- [ ] Should be `TRUE`

### 8. Payment Failure (Simulated)
- [ ] In Customer Portal, update payment to decline card: `4000 0000 0000 0002`
- [ ] Wait for next invoice (or trigger via Stripe CLI: `stripe trigger invoice.payment_failed`)
- [ ] Check webhook received
- [ ] Verify subscription status updated to `past_due`

---

## Monitoring (Ongoing)

### Daily Checks
- [ ] Check webhook delivery success rate in Stripe Dashboard
- [ ] Check failed events:
  ```sql
  SELECT * FROM subscription_events
  WHERE processing_status = 'failed'
  ORDER BY created_at DESC;
  ```

### Weekly Checks
- [ ] Review active subscriptions:
  ```sql
  SELECT subscription_status, COUNT(*) as count
  FROM company GROUP BY subscription_status;
  ```
- [ ] Review trial conversions:
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE subscription_status = 'trialing') as trials,
    COUNT(*) FILTER (WHERE subscription_status = 'active') as active
  FROM company;
  ```

### Monthly Checks
- [ ] Review Monthly Recurring Revenue (MRR) in Stripe Dashboard
- [ ] Review churn rate
- [ ] Review failed payments
- [ ] Verify cron job ran successfully: `tail -n 50 /var/log/trial_check.log`

---

## Going Live (Production)

### When ready to switch from Test Mode to Live Mode:

1. **Create Live Mode Products**
   - [ ] Switch to Live Mode in Stripe Dashboard
   - [ ] Create products again (same as test mode)
   - [ ] Copy new **live** Product ID and Price ID
   - [ ] Update production database with live IDs

2. **Update Environment Variables**
   - [ ] Backend: `STRIPE_API_KEY=sk_live_...`
   - [ ] Backend: `STRIPE_WEBHOOK_SECRET=whsec_...` (from live webhook)
   - [ ] Frontend: `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`

3. **Create Live Webhook**
   - [ ] In Live Mode, go to Webhooks
   - [ ] Add endpoint with production URL
   - [ ] Select same events
   - [ ] Copy new signing secret

4. **Enable Live Customer Portal**
   - [ ] Configure portal settings in Live Mode
   - [ ] Same settings as Test Mode

5. **Test with Real Card**
   - [ ] Use a real test card (not a real customer!)
   - [ ] Complete full checkout flow
   - [ ] Verify webhook delivery
   - [ ] Cancel test subscription

6. **Monitor First Real Customers**
   - [ ] Watch webhook delivery closely
   - [ ] Monitor database updates
   - [ ] Check for any errors in logs

---

## Rollback Plan

If something goes wrong:

1. **Database Rollback**
   ```sql
   -- Restore from backup
   psql ... < backup_before_stripe_migration.sql
   ```

2. **Disable Webhooks**
   - [ ] Go to Stripe Dashboard → Webhooks
   - [ ] Click endpoint → Disable

3. **Revert Code**
   ```bash
   git revert <commit-hash>
   git push
   ```

4. **Notify Users**
   - [ ] If subscriptions were created, refund via Stripe Dashboard

---

## Success Criteria

✅ Database migrations completed without errors
✅ Stripe products created and IDs updated in database
✅ Webhook endpoint receiving events (green checkmarks in Stripe)
✅ Test checkout completes successfully
✅ Trial countdown displays correctly
✅ Customer portal accessible
✅ Trial expiration blocks access
✅ Subscription data syncs between Stripe and database
✅ Invoices recorded in database
✅ Cron job scheduled and running

---

## Support Contacts

- **Stripe Support:** https://support.stripe.com/
- **Stripe Status:** https://status.stripe.com/
- **Emergency:** Contact Stripe via Dashboard → Help

---

## Notes

- **Test thoroughly in Test Mode before going live!**
- **Never commit .env files with actual keys**
- **Keep webhook secrets secure**
- **Monitor webhook delivery in first 24 hours**
- **Have rollback plan ready**

---

**Last Updated:** 2026-01-24
**Implementation Status:** ✅ COMPLETE
