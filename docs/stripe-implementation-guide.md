# Stripe Recurring Subscription Implementation - Main Index

## 📚 Documentation Structure

This implementation is divided into **4 comprehensive guides**. Read them in order:

### 1. [Overview & Plan](./1-overview-and-plan.md)
**Start here!** High-level architecture, pricing model, timeline, and success metrics.

**Contents**:
- Executive summary
- Pricing model ($1/employee/month)
- Architecture overview
- Implementation phases
- Testing strategy
- Migration plan for existing users

**Read time**: 15-20 minutes

---

### 2. [Backend Implementation](./2-backend-implementation.md)
Complete backend implementation guide for Python FastAPI.

**Contents**:
- Database migrations (4 migration files)
- Stripe service layer
- Subscription DAO enhancements
- API endpoints and webhooks
- Trial enforcement middleware
- Employee count sync logic
- Utility scripts

**Implementation time**: 1-2 days

---

### 3. [Frontend Implementation](./3-frontend-implementation.md)
Complete frontend implementation guide for React.

**Contents**:
- Environment setup
- API client functions
- Subscription Management component
- Subscription check hook
- Profile page updates
- Trial expiration UI
- Testing procedures

**Implementation time**: 1 day (4-6 hours)

---

### 4. [Stripe Configuration](./4-stripe-configuration.md)
Stripe Dashboard setup and configuration.

**Contents**:
- Account setup
- Create products & prices
- Configure webhooks
- Set up Customer Portal
- Get API keys
- Test mode vs Live mode
- Local testing with Stripe CLI
- Production checklist

**Setup time**: 1-2 hours

---

## Quick Start Guide

### Prerequisites
- ✅ Stripe account created
- ✅ Backend repo: `../tap-time-backend/`
- ✅ Frontend repo: This directory
- ✅ PostgreSQL database running

### Implementation Order

```
Step 1: Read Overview (15 min)
   ↓
Step 2: Configure Stripe Dashboard (1 hour)
   → Create product/price
   → Set up webhooks
   → Get API keys
   ↓
Step 3: Backend Implementation (1-2 days)
   → Run database migrations
   → Create Stripe service
   → Build API endpoints
   → Implement webhooks
   ↓
Step 4: Frontend Implementation (1 day)
   → Add API functions
   → Build UI components
   → Update Profile page
   ↓
Step 5: Testing & Deployment (4-6 hours)
   → Test with Stripe test cards
   → Verify webhooks
   → Deploy to production
   → Migrate existing users
```

---

## Your Pricing Model

✓ **$1 per employee per month** (usage-based pricing)
✓ **14-day free trial** (unlimited employees during trial)
✓ **Device tracking** (tracked for info, not charged)
✓ **Monthly billing** = (Active Employee Count × $1)
✓ **Post-trial**: Require payment or block access
✓ **Stripe Checkout** for payment collection (hosted, PCI compliant)

**Examples**:
- 10 employees = $10/month
- 25 employees = $25/month
- 100 employees = $100/month

---

## Architecture Summary

**Backend:** Python FastAPI (already exists at `../tap-time-backend/`)
**Frontend:** React 19 + Vite with @stripe/stripe-js
**Payment Flow:** TapTime → Stripe Checkout (with quantity) → Webhook → Update Database
**Billing Logic:** Count employees at billing date → Charge $1 × employee_count
**Trial:** 14 days automatic, unlimited usage, tracked in database, enforced on backend

---

## Implementation Steps

### Phase 1: Database Setup (Backend)

Create 4 migration files to add subscription infrastructure:

**1. Add Stripe fields to company table** (`migrations/001_add_stripe_fields_to_company.sql`)
- `stripe_customer_id` - Links to Stripe Customer
- `stripe_subscription_id` - Links to active Stripe Subscription
- `subscription_status` - 'trialing', 'active', 'past_due', 'canceled', etc.
- `trial_end_date` - When 14-day trial expires
- `current_period_end` - Billing cycle end date
- `cancel_at_period_end` - Graceful cancellation flag

**2. Create subscription_plans table** (`migrations/002_create_subscription_plans.sql`)
- Stores plan details: name, Stripe price/product IDs, per-employee pricing
- Single plan configuration:
  - **TapTime Per-Employee Plan**: $1/employee/month
  - **Billing Type**: Quantity-based (quantity = employee count)
  - **Trial**: 14 days, unlimited employees/devices during trial
  - **Device tracking**: For informational purposes only (not charged)

**3. Create subscription_events table** (`migrations/003_create_subscription_events.sql`)
- Logs all Stripe webhook events for audit trail
- Tracks: event type, payload, processing status

**4. Create invoices table** (`migrations/004_create_invoices.sql`)
- Stores invoice history for customer portal
- Links to Stripe invoice IDs, PDF URLs

### Phase 2: Stripe Product Configuration

**Option A: Manual Setup (Recommended for beginners)**
1. Go to Stripe Dashboard → Products
2. Create product: **"TapTime - Per Employee"**
3. Add pricing model:
   - **Pricing model**: "Standard pricing"
   - **Price**: $1.00
   - **Billing period**: Monthly
   - **Usage is metered**: NO (we'll use quantity-based)
4. Copy Product ID (starts with `prod_`) and Price ID (starts with `price_`)
5. Update `subscription_plans` table with actual Stripe IDs

**Option B: Automated Script** (`scripts/setup_stripe_products.py`)
- Run Python script to create product/price via Stripe API
- Creates single per-employee pricing product
- Automatically populates database with IDs

**Important**: We'll use **quantity-based subscriptions** where quantity = number of employees. Stripe will automatically calculate: `$1 × employee_count = monthly_charge`

### Phase 3: Backend Implementation

**1. Stripe Service Layer** (`src/services/stripe_service.py`) - NEW FILE
- Centralizes all Stripe API calls
- Methods:
  - `create_customer()` - Create Stripe customer for company
  - `create_checkout_session()` - Generate Checkout URL with 14-day trial
  - `get_subscription()` - Fetch subscription status
  - `cancel_subscription()` - Cancel at period end or immediately
  - `update_subscription()` - Upgrade/downgrade plans
  - `create_customer_portal_session()` - Allow customers to manage billing
  - `construct_webhook_event()` - Verify webhook signatures (security!)

**2. Subscription DAO Enhancements** (`src/dao/subscription_dao.py`) - MODIFY EXISTING
- Add methods:
  - `update_company_stripe_data()` - Save Stripe IDs and status
  - `get_company_by_stripe_customer()` - Lookup by Stripe customer ID
  - `log_subscription_event()` - Save webhook events
  - `check_trial_expired()` - Validate trial status
  - `get_subscription_plan_by_price_id()` - Get plan limits

**3. Subscription Router** (`src/routers/subscription_router.py`) - REPLACE EXISTING
- Endpoints:
  - `POST /subscription/create-checkout-session` - Start subscription flow
  - `GET /subscription/plans` - List available plans
  - `GET /subscription/status/{c_id}` - Get current subscription + trial status
  - `POST /subscription/cancel/{c_id}` - Cancel subscription
  - `POST /subscription/change-plan/{c_id}` - Upgrade/downgrade
  - `POST /subscription/customer-portal/{c_id}` - Open Stripe portal
  - `POST /subscription/webhook` - **CRITICAL**: Stripe event handler

**4. Webhook Event Handlers** (in subscription_router.py)
- `handle_subscription_created()` - Save subscription on signup
- `handle_subscription_updated()` - Update status changes
- `handle_subscription_deleted()` - Handle cancellations
- `handle_trial_will_end()` - Send reminder email (3 days before)
- `handle_invoice_paid()` - Record successful payment
- `handle_invoice_payment_failed()` - Alert on payment failure
- `handle_checkout_completed()` - Confirm checkout success

**5. Trial Enforcement Middleware** (`src/middleware/subscription_check.py`) - NEW FILE
- Checks subscription status on each API request
- Blocks access if trial expired and no active subscription
- Returns 402 Payment Required status

**6. Environment Variables** (`.env`)
```bash
STRIPE_API_KEY=sk_test_xxxxx  # Secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Webhook signing secret
```

### Phase 4: Frontend Implementation

**1. API Client Functions** (`src/api.js`) - ADD TO EXISTING
- Export functions:
  - `createCheckoutSession()` - Get Stripe Checkout URL
  - `getSubscriptionPlans()` - Fetch available plans
  - `getSubscriptionStatus()` - Get current subscription + trial info
  - `cancelSubscription()` - Cancel subscription
  - `changeSubscriptionPlan()` - Upgrade/downgrade
  - `createCustomerPortalSession()` - Get billing portal URL

**2. Subscription Management Component** (`src/components/SubscriptionManagement.jsx`) - NEW FILE
- Displays:
  - Trial status banner (days remaining)
  - Current usage (employees count, devices count)
  - **Pricing explanation**: "$1 per employee per month"
  - **Current monthly estimate**: Shows `$X/month` based on current employee count
  - Example: "You have 15 employees × $1 = $15/month"
- Actions:
  - "Start 14-Day Trial" button → Redirects to Stripe Checkout (collects payment method)
  - "Add Payment Method" button (after trial) → Redirects to Stripe Checkout
  - "Manage Billing" button → Opens Stripe Customer Portal
  - Shows next billing date and amount
- Handles loading states, errors, and Stripe redirects

**3. Update Profile Page** (`src/pages/Profile.jsx`) - MODIFY EXISTING
- Replace subscription tab content (lines 1440-1499)
- Import and render `<SubscriptionManagement />` component
- Already has Owner-only access control ✓

**4. Subscription Check Hook** (`src/hooks/useSubscriptionCheck.js`) - NEW FILE
- Custom hook to check trial/subscription status
- Auto-redirects to subscription page if trial expired
- Runs on mount + every 5 minutes
- Use in protected pages: EmployeeList, Device, Reports

**5. Environment Variable** (`.env`)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Publishable key (safe for frontend)
```

### Phase 5: Trial Management

**1. Trial Setup**
- All new checkouts automatically get 14-day trial via Stripe Checkout API
- Trial end date saved to database on `subscription.created` webhook
- Frontend shows trial countdown in subscription tab

**2. Trial Expiration Handling**
- Daily cron job checks for expired trials (`scripts/check_expired_trials.py`)
- Sends "Trial Expired" emails with link to subscribe
- Backend middleware blocks API access if trial expired
- Frontend hook redirects to subscription page

**3. Employee Count Tracking**
- During trial: Unlimited employees/devices allowed
- After trial ends: Block access if no payment method added
- On active subscription: No hard limits, bill for all employees
- Device count: Tracked for informational purposes only (displayed in UI)
- Monthly billing automatically adjusts to employee count

### Phase 6: Stripe Configuration

**1. Webhook Setup** (Stripe Dashboard → Developers → Webhooks)
- Add endpoint: `https://api.taptime.com/subscription/webhook`
- Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `checkout.session.completed`
- Copy webhook signing secret to backend `.env`

**2. Customer Portal Settings** (Stripe Dashboard → Settings → Billing)
- Enable features:
  - Update payment method
  - View invoice history
  - Cancel subscription
  - Download invoices as PDF

### Phase 7: Migration for Existing Users

**Strategy: Grant 14-Day Trial to All Existing Users**

Run migration script (`scripts/grandfather_existing_users.py`):
1. Find all active companies without `stripe_customer_id`
2. Set `subscription_status = 'trialing'`
3. Set `trial_end_date = NOW() + 14 days`
4. Send notification email about new subscription plans

**Alternative:** Assign all existing users to a "Legacy Free" plan with current limits

---

## Critical Files for Implementation

### Backend (6 files)
1. **`src/services/stripe_service.py`** - Core Stripe integration (NEW)
2. **`src/routers/subscription_router.py`** - Subscription API endpoints (REPLACE)
3. **`src/dao/subscription_dao.py`** - Database operations (ENHANCE)
4. **`src/controllers/employee_controller.py`** - Add employee count sync logic (ENHANCE)
5. **`migrations/001_add_stripe_fields_to_company.sql`** - Schema changes (NEW)
6. **`src/middleware/subscription_check.py`** - Trial enforcement (NEW)

### Frontend (3 files)
1. **`src/components/SubscriptionManagement.jsx`** - Main subscription UI (NEW)
2. **`src/api.js`** - Add subscription API functions (ENHANCE)
3. **`src/pages/Profile.jsx`** - Update subscription tab (MODIFY, lines 1440-1499)

### Scripts (3 files)
1. **`scripts/setup_stripe_products.py`** - Create Stripe products (NEW, optional)
2. **`scripts/grandfather_existing_users.py`** - Migration script (NEW)
3. **`scripts/check_expired_trials.py`** - Daily cron job (NEW)

---

## Deployment Checklist

### Pre-Deployment
- [ ] Create Stripe products and prices (manual or script)
- [ ] Update `subscription_plans` table with Stripe IDs
- [ ] Set up webhook endpoint in Stripe Dashboard
- [ ] Add environment variables to production:
  - Backend: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Frontend: `VITE_STRIPE_PUBLISHABLE_KEY`

### Deployment
1. **Database Migration** (with backup!)
   ```bash
   # Run 4 migration SQL files in order
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_add_stripe_fields_to_company.sql
   psql ... -f migrations/002_create_subscription_plans.sql
   psql ... -f migrations/003_create_subscription_events.sql
   psql ... -f migrations/004_create_invoices.sql
   ```

2. **Backend Deploy**
   ```bash
   pip install stripe  # Add dependency
   # Deploy code
   # Verify webhook endpoint is accessible
   ```

3. **Frontend Deploy**
   ```bash
   npm run build
   # Deploy to hosting
   ```

4. **Grandfather Existing Users**
   ```bash
   python scripts/grandfather_existing_users.py
   ```

5. **Setup Cron Job**
   ```bash
   # Daily trial check at 9 AM
   0 9 * * * cd /path/to/backend && python scripts/check_expired_trials.py
   ```

### Post-Deployment
- [ ] Test checkout flow with Stripe test card: `4242 4242 4242 4242`
- [ ] Verify webhook events are being received (check Stripe Dashboard)
- [ ] Test trial expiration enforcement
- [ ] Test plan limit enforcement (employee/device)
- [ ] Test Customer Portal access
- [ ] Monitor subscription events log for errors

---

## Testing Guide

### Stripe Test Mode
Use test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Any future expiry date, any 3-digit CVC

### Test Scenarios
1. **New User Trial**
   - Sign up → Should get 14-day trial automatically
   - Check subscription tab → Shows trial countdown and "0 days remaining = Free"
   - Add 10 employees → Should allow unlimited during trial
   - Check subscription tab → Should show "After trial: $10/month (10 employees × $1)"

2. **Trial to Paid Conversion**
   - During trial, click "Add Payment Method"
   - Complete Stripe Checkout (enter test card: 4242 4242 4242 4242)
   - Verify status changes from 'trialing' to 'active'
   - Check webhook events logged in database
   - Verify subscription quantity = employee count

3. **Trial Expiration Without Payment**
   - Manually set `trial_end_date` to past date
   - Don't add payment method
   - Try to access app → Should block/redirect with "Trial expired, add payment"
   - Add payment → Should restore access immediately

4. **Employee Count Changes Billing**
   - Start subscription with 10 employees → $10/month
   - Add 5 more employees (total 15)
   - On next billing cycle, should charge $15
   - Remove 3 employees (total 12)
   - Next billing cycle should charge $12

5. **Payment Failure**
   - Use decline card in Stripe Checkout: 4000 0000 0000 0002
   - Verify subscription status becomes 'past_due'
   - Check email sent to user
   - Try to access app → Should show "Payment failed, update payment method"

6. **Subscription Update (Employee Count Sync)**
   - When employee added/removed in TapTime
   - System should update Stripe subscription quantity
   - Verify in Stripe Dashboard → Subscriptions → Quantity updated
   - Prorated charge/credit applied automatically

7. **Cancellation**
   - Click "Manage Billing" → Stripe Customer Portal
   - Cancel subscription
   - Verify `cancel_at_period_end` flag set
   - Access should continue until period end
   - After period end, block access

### Local Webhook Testing
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/subscription/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

---

## Security Checklist

✓ Webhook signature verification (prevents spoofing)
✓ Environment variables for API keys (not hardcoded)
✓ Stripe Publishable Key safe for frontend
✓ Secret Key only on backend
✓ Payment data never touches our database (PCI compliant via Stripe)
✓ Webhook endpoint only accepts Stripe signatures
✓ Trial enforcement on backend (can't be bypassed from frontend)

---

## Beginner's Guide to Stripe Concepts

### Key Terms
- **Product**: What you're selling (e.g., "TapTime - Per Employee")
- **Price**: Cost per unit (e.g., $1/employee/month)
- **Quantity**: Number of units being billed (e.g., 15 employees)
- **Customer**: Represents your company in Stripe
- **Subscription**: Ongoing recurring billing relationship
- **Quantity-Based Subscription**: Billing amount = price × quantity (in your case: $1 × employee_count)
- **Checkout Session**: Hosted payment page for collecting payment info
- **Customer Portal**: Self-service page for managing subscriptions
- **Webhook**: HTTP callback when events happen (e.g., payment succeeded, quantity updated)

### Payment Flow
```
User clicks "Subscribe"
    ↓
Backend creates Checkout Session
    ↓
User redirected to Stripe Checkout (hosted page)
    ↓
User enters card info on Stripe
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to your server
    ↓
Your webhook handler updates database
    ↓
User redirected back to your app
    ↓
Show success message
```

### Why Webhooks?
Webhooks ensure your database stays in sync with Stripe. Without webhooks:
- ❌ Wouldn't know when payment fails
- ❌ Wouldn't know when user cancels in Customer Portal
- ❌ Wouldn't know when trial ends
- ❌ Would have to manually check Stripe constantly

With webhooks:
- ✅ Stripe notifies you instantly when status changes
- ✅ Your database always reflects current state
- ✅ Can trigger emails, update limits, etc. automatically

### Test Mode vs Live Mode
- **Test Mode**: Use test API keys (`sk_test_`, `pk_test_`), test cards, no real money
- **Live Mode**: Real API keys (`sk_live_`, `pk_live_`), real cards, real charges

**Always develop in Test Mode!** Switch to Live Mode only after thorough testing.

---

## Verification Steps (Post-Implementation)

### Backend Verification
```bash
# Check database tables created
psql -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'subscription%';"

# Should see: subscription_plans, subscription_events

# Check Stripe service works
python -c "from src.services.stripe_service import StripeService; print(StripeService.list_prices())"

# Test webhook endpoint
curl -X POST http://localhost:8000/subscription/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"customer.subscription.created"}'
# Should return 400 (invalid signature) - this is expected, proves endpoint exists
```

### Frontend Verification
```bash
# Check environment variable loaded
npm run dev
# Open browser console: console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
# Should show pk_test_xxxxx

# Navigate to /profile?tab=subscription
# Should see subscription management UI
# Should see available plans
```

### End-to-End Test
1. Log in as Owner
2. Go to Profile → Subscription tab
3. Click "Start 14-Day Trial" on any plan
4. Should redirect to Stripe Checkout
5. Use test card: 4242 4242 4242 4242
6. Complete checkout
7. Should redirect back to app
8. Check database: `SELECT subscription_status, trial_end_date FROM company WHERE cid = 'your-company-id';`
9. Should show `trialing` status and future trial_end_date
10. Check Stripe Dashboard → Customers → Should see new customer
11. Check Stripe Dashboard → Webhooks → Should see events delivered

---

## Troubleshooting Common Issues

### "Webhook signature verification failed"
**Cause**: Wrong `STRIPE_WEBHOOK_SECRET` or signature header missing
**Fix**: Copy exact secret from Stripe Dashboard → Webhooks → Endpoint → Signing secret

### "No module named 'stripe'"
**Cause**: Stripe library not installed
**Fix**: `pip install stripe`

### Checkout button does nothing
**Cause**: Missing or wrong `VITE_STRIPE_PUBLISHABLE_KEY`
**Fix**: Check `.env` file has correct publishable key (starts with `pk_test_` or `pk_live_`)

### "Trial expired" but user just signed up
**Cause**: Migration script ran and set trial_end_date to past
**Fix**: Manually update trial_end_date: `UPDATE company SET trial_end_date = NOW() + INTERVAL '14 days' WHERE cid = 'xxx';`

### Webhooks not being received
**Cause**: Endpoint not publicly accessible or wrong URL configured
**Fix**:
1. Ensure backend deployed and accessible via public URL
2. Check Stripe Dashboard → Webhooks → Endpoint URL is correct
3. For local testing, use Stripe CLI: `stripe listen --forward-to localhost:8000/subscription/webhook`

### Plan limits not enforcing
**Cause**: Subscription check middleware not enabled
**Fix**: Verify middleware added in `main.py`: `app.add_middleware(SubscriptionCheckMiddleware)`

---

## Next Steps After Implementation

### Phase 8: Enhancements (Optional)
- Add usage-based metering (charge per employee over limit)
- Implement annual billing with discount
- Add promotional codes support (already enabled in checkout)
- Create admin dashboard to view all subscriptions
- Add analytics: MRR, churn rate, trial conversion rate
- Implement dunning emails (retry failed payments)
- Add subscription pause/resume feature
- Create referral program with Stripe credits

### Phase 9: Monitoring
- Set up alerts for failed payments
- Monitor webhook delivery success rate
- Track trial conversion metrics
- Monitor subscription churn
- Set up revenue dashboards

---

## Support Resources

### Stripe Documentation
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Subscriptions Overview](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

### Stripe Dashboard Links
- **Test Mode Toggle**: Top-left corner (switch between test/live)
- **Products**: https://dashboard.stripe.com/test/products
- **Customers**: https://dashboard.stripe.com/test/customers
- **Subscriptions**: https://dashboard.stripe.com/test/subscriptions
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **Logs**: https://dashboard.stripe.com/test/logs (see all API requests)

### Getting Help
- Stripe Support: https://support.stripe.com/
- Stripe Discord: https://discord.gg/stripe
- Stack Overflow: Tag questions with `stripe-payments`

---

## Summary

This plan implements a complete Stripe subscription system with **per-employee pricing**:
- ✅ **$1 per employee per month** (quantity-based billing)
- ✅ **14-day free trial** with unlimited employees/devices
- ✅ **Automatic billing** based on employee count at billing date
- ✅ **Stripe Checkout** for secure payment collection
- ✅ **Trial expiration enforcement** (block access after 14 days without payment)
- ✅ **Employee count sync** to Stripe (updates subscription quantity)
- ✅ **Device tracking** for informational display (not charged)
- ✅ **Webhook-driven** subscription lifecycle management
- ✅ **Customer Portal** for self-service billing
- ✅ **Migration strategy** for existing users (14-day trial)
- ✅ **Comprehensive testing** and security

**Pricing Example:**
- 10 employees = $10/month
- 25 employees = $25/month
- 100 employees = $100/month

**Estimated Implementation Time**: 2-3 days for core features (assuming familiarity with codebase)

**Total Files**: ~12 new files, 4 modified files, 4 migration scripts
