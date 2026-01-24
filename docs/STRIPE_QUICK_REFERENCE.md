# Stripe Subscription - Quick Reference

## 🎯 Pricing Model

- **$1 per employee per month** (quantity-based)
- **14-day free trial** (unlimited employees)
- **Devices:** Tracked but not charged
- **Billing:** Monthly on employee count

---

## 📁 Key Files

### Backend
| File | Purpose |
|------|---------|
| `migrations/003_add_stripe_fields_to_company.sql` | Adds Stripe columns to company table |
| `migrations/004_create_subscription_plans.sql` | Creates subscription plans table |
| `migrations/005_create_subscription_events.sql` | Creates webhook event log |
| `migrations/006_create_invoices.sql` | Creates invoices table |
| `src/services/stripe_service.py` | Stripe API wrapper |
| `src/dao/subscription_dao.py` | Database operations |
| `src/routers/subscription_router.py` | API endpoints + webhooks |
| `src/middleware/subscription_check.py` | Trial enforcement |

### Frontend
| File | Purpose |
|------|---------|
| `src/api.js` | Subscription API functions (lines 630-731) |
| `src/components/SubscriptionManagement.jsx` | Main subscription UI |
| `src/hooks/useSubscriptionCheck.js` | Trial status checking hook |
| `src/pages/Profile.jsx` | Subscription tab (lines 1441-1443) |

### Scripts
| File | Purpose |
|------|---------|
| `scripts/setup_stripe_products.py` | Create Stripe products |
| `scripts/grandfather_existing_users.py` | Grant trials to existing users |
| `scripts/check_expired_trials.py` | Daily cron job |

---

## 🔌 API Endpoints

### Subscription Management

```bash
# Create checkout session (start trial)
POST /subscription/create-checkout-session
Body: { cid, price_id, quantity, success_url, cancel_url }
Returns: { checkout_url, session_id }

# Get available plans
GET /subscription/plans
Returns: { plans: [...] }

# Get subscription status
GET /subscription/status/{cid}
Returns: { subscription_status, trial_end_date, days_remaining, ... }

# Cancel subscription
POST /subscription/cancel/{cid}
Body: { at_period_end: true }
Returns: { success: true }

# Change plan (upgrade/downgrade)
POST /subscription/change-plan/{cid}
Body: { new_price_id, quantity }
Returns: { success: true }

# Open customer portal
POST /subscription/customer-portal/{cid}
Body: { return_url }
Returns: { portal_url }

# Webhook handler (Stripe calls this)
POST /subscription/webhook
Headers: { stripe-signature }
Body: Stripe event payload
```

---

## 🗄️ Database Schema

### Company Table (New Columns)
```sql
stripe_customer_id       VARCHAR(255)  -- Stripe customer ID
stripe_subscription_id   VARCHAR(255)  -- Active subscription ID
subscription_status      VARCHAR(50)   -- trialing, active, past_due, canceled, expired
trial_end_date          TIMESTAMP     -- When trial expires
current_period_end      TIMESTAMP     -- Billing cycle end
cancel_at_period_end    BOOLEAN       -- Graceful cancellation flag
```

### Subscription Plans Table
```sql
plan_id                 UUID          PRIMARY KEY
plan_name              VARCHAR(100)  -- "TapTime Per-Employee Plan"
stripe_product_id      VARCHAR(255)  -- prod_xxx (from Stripe)
stripe_price_id        VARCHAR(255)  -- price_xxx (from Stripe)
price_per_employee     DECIMAL(10,2) -- 1.00
trial_period_days      INTEGER       -- 14
is_active              BOOLEAN       -- true
```

### Subscription Events Table (Webhook Log)
```sql
event_id               UUID          PRIMARY KEY
stripe_event_id        VARCHAR(255)  -- evt_xxx
event_type            VARCHAR(100)  -- customer.subscription.created
event_data            JSONB         -- Full webhook payload
processing_status     VARCHAR(50)   -- pending, processed, failed
created_at            TIMESTAMP
```

### Invoices Table
```sql
invoice_id            UUID          PRIMARY KEY
cid                   CHAR(36)      FOREIGN KEY → company
stripe_invoice_id     VARCHAR(255)  -- in_xxx
amount_due            DECIMAL(10,2) -- Total amount
amount_paid           DECIMAL(10,2) -- Amount paid
employee_count        INTEGER       -- Employees billed for
invoice_pdf_url       TEXT          -- PDF download link
```

---

## 🔄 Subscription Lifecycle

```
1. Company Signs Up
   ↓
2. Click "Start 14-Day Trial" → Creates Checkout Session
   ↓
3. Redirects to Stripe Checkout (stripe.com)
   ↓
4. User Enters Payment Info
   ↓
5. Stripe Creates Customer & Subscription (with trial)
   ↓
6. Webhook: checkout.session.completed
   ↓
7. Webhook: customer.subscription.created
   → Database Updated: subscription_status = 'trialing', trial_end_date = NOW() + 14 days
   ↓
8. During Trial (14 days)
   → Full access, no charges
   ↓
9. Trial Ends
   → Stripe charges card: quantity × $1
   ↓
10. Webhook: invoice.paid
    → Database Updated: subscription_status = 'active'
    ↓
11. Monthly Billing
    → Stripe auto-charges on billing date
    → Quantity = employee_count
```

---

## 📊 Subscription Status Values

| Status | Meaning |
|--------|---------|
| `trialing` | In 14-day free trial |
| `active` | Paying customer, access granted |
| `past_due` | Payment failed, subscription at risk |
| `canceled` | Subscription canceled, no renewal |
| `expired` | Trial expired, no subscription |
| `incomplete` | Payment method not confirmed |
| `incomplete_expired` | Payment method never confirmed, trial ended |
| `unpaid` | Payment failed multiple times |

---

## 🎣 Webhook Events Handled

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handle_checkout_completed()` | Save subscription ID |
| `customer.subscription.created` | `handle_subscription_created()` | Save trial end date, status |
| `customer.subscription.updated` | `handle_subscription_updated()` | Update status, period end |
| `customer.subscription.deleted` | `handle_subscription_deleted()` | Mark as canceled |
| `customer.subscription.trial_will_end` | `handle_trial_will_end()` | Send reminder email (3 days before) |
| `invoice.paid` | `handle_invoice_paid()` | Save invoice, mark payment success |
| `invoice.payment_failed` | `handle_invoice_payment_failed()` | Update to past_due, send alert |

---

## 🔐 Environment Variables

### Backend (.env)
```bash
# Stripe
STRIPE_API_KEY=sk_test_51...              # Secret key (NEVER commit!)
STRIPE_WEBHOOK_SECRET=whsec_...           # Webhook signing secret

# Database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=taptimeprod
```

### Frontend (.env)
```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Publishable key (safe for frontend)

# API
VITE_API_BASE_URL=https://your-api.com
```

**Where to get these:**
- **STRIPE_API_KEY:** Stripe Dashboard → Developers → API keys → Secret key
- **STRIPE_WEBHOOK_SECRET:** Stripe Dashboard → Developers → Webhooks → [Endpoint] → Signing secret
- **VITE_STRIPE_PUBLISHABLE_KEY:** Stripe Dashboard → Developers → API keys → Publishable key

---

## 🧪 Test Cards

### Success
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/30)
CVC: Any 3 digits (e.g., 123)
```

### Decline
```
Card: 4000 0000 0000 0002
```

### 3D Secure
```
Card: 4000 0027 6000 3184
```

---

## 🔍 Useful SQL Queries

### Check Active Trials
```sql
SELECT cid, company_name, trial_end_date,
       EXTRACT(DAY FROM (trial_end_date - NOW())) as days_remaining
FROM company
WHERE subscription_status = 'trialing'
ORDER BY trial_end_date ASC;
```

### Check Active Subscriptions
```sql
SELECT cid, company_name, subscription_status,
       stripe_subscription_id, employee_count
FROM company
WHERE stripe_subscription_id IS NOT NULL
ORDER BY subscription_status;
```

### Check Webhook Events
```sql
SELECT event_type, processing_status,
       created_at, error_message
FROM subscription_events
ORDER BY created_at DESC
LIMIT 20;
```

### Check Failed Webhooks
```sql
SELECT stripe_event_id, event_type, error_message, created_at
FROM subscription_events
WHERE processing_status = 'failed'
ORDER BY created_at DESC;
```

### Monthly Revenue (MRR)
```sql
SELECT
  COUNT(*) as active_subscriptions,
  SUM(employee_count) as total_employees,
  SUM(employee_count * 1.00) as mrr
FROM company
WHERE subscription_status = 'active';
```

### Trial Conversion Rate
```sql
SELECT
  COUNT(*) FILTER (WHERE subscription_status = 'trialing') as current_trials,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as converted,
  ROUND(
    COUNT(*) FILTER (WHERE subscription_status = 'active')::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE subscription_status IN ('trialing', 'active', 'expired')), 0) * 100,
    2
  ) as conversion_rate_pct
FROM company;
```

---

## 🐛 Debugging

### Check if Stripe is configured
```python
from src.services.stripe_service import get_stripe_service
stripe_service = get_stripe_service()
print(stripe_service.list_prices())
```

### Test webhook endpoint locally
```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:8000/subscription/webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### Check webhook delivery
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your endpoint
3. Check "Events" tab for delivery status
4. Green checkmark = success
5. Red X = failure (click to see error)

### Check logs
```bash
# Backend logs
tail -f /var/log/taptime/app.log | grep -i stripe

# Cron job logs
tail -f /var/log/trial_check.log
```

---

## 🚨 Common Issues

### Issue: Webhook signature verification failed
**Solution:** Check `STRIPE_WEBHOOK_SECRET` matches the signing secret in Stripe Dashboard

### Issue: "No module named 'stripe'"
**Solution:** `pip install stripe`

### Issue: Checkout button does nothing
**Solution:** Check `VITE_STRIPE_PUBLISHABLE_KEY` in frontend .env

### Issue: Trial expired immediately
**Solution:** Check `trial_end_date` in database, should be 14 days in future

### Issue: Webhooks not received
**Solution:**
1. Check endpoint is publicly accessible
2. Check URL configured in Stripe matches actual URL
3. For local dev, use Stripe CLI: `stripe listen --forward-to localhost:8000/subscription/webhook`

---

## 📞 Support

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com/
- **Stripe Status:** https://status.stripe.com/

---

## ✅ Quick Test Checklist

- [ ] Database migrations ran successfully
- [ ] Stripe products created and IDs in database
- [ ] Webhook endpoint added in Stripe Dashboard
- [ ] Environment variables set (backend + frontend)
- [ ] Can create checkout session and redirect to Stripe
- [ ] Can complete checkout with test card
- [ ] Webhook events received (check Stripe Dashboard)
- [ ] Trial countdown shows in UI
- [ ] Can open customer portal
- [ ] Trial expiration blocks access

---

**Last Updated:** 2026-01-24
