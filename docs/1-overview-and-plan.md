# Stripe Subscription Implementation - Overview & Plan

## Executive Summary

Implement Stripe-powered monthly recurring subscriptions with **per-employee pricing** ($1/employee/month), 14-day free trials, and automatic billing based on employee count.

---

## Your Pricing Model

✓ **$1 per employee per month** (usage-based pricing)
✓ **14-day free trial** (unlimited employees/devices during trial)
✓ **Device tracking** (displayed in UI for info, not charged separately)
✓ **Monthly billing** = (Active Employee Count × $1)
✓ **Post-trial enforcement**: Require payment or block access
✓ **Stripe Checkout** for payment collection (hosted, PCI compliant)

---

## Pricing Examples

| Employees | Monthly Cost |
|-----------|-------------|
| 5         | $5/month    |
| 10        | $10/month   |
| 25        | $25/month   |
| 50        | $50/month   |
| 100       | $100/month  |

---

## Architecture Summary

### Technology Stack
- **Backend**: Python FastAPI (already exists at `../tap-time-backend/`)
- **Frontend**: React 19 + Vite with @stripe/stripe-js
- **Database**: PostgreSQL (existing)
- **Payment**: Stripe Checkout + Webhooks

### Payment Flow
```
User signs up
    ↓
Automatic 14-day trial starts (unlimited employees/devices)
    ↓
User adds employees/devices (no restrictions during trial)
    ↓
Trial expires after 14 days
    ↓
User clicks "Add Payment Method"
    ↓
Redirected to Stripe Checkout (hosted page)
    ↓
User enters card info
    ↓
Stripe creates subscription with quantity = employee_count
    ↓
Stripe sends webhook to backend
    ↓
Backend updates company subscription_status = 'active'
    ↓
User redirected back to TapTime app
    ↓
Access restored
```

### Billing Logic
- **Quantity-based subscription** in Stripe
- **Quantity** = number of active employees at billing date
- **Charge** = $1 × employee_count
- When employees added/removed → Update Stripe subscription quantity
- Stripe automatically prorates charges/credits

---

## Key Features

### 1. Trial Management
- ✅ 14-day automatic trial for all new users
- ✅ No employee/device limits during trial
- ✅ Trial countdown displayed in subscription tab
- ✅ Email notification 3 days before trial ends
- ✅ Block access after trial expires if no payment

### 2. Subscription Management
- ✅ Single pricing plan: $1/employee/month
- ✅ Automatic employee count sync to Stripe
- ✅ Stripe Customer Portal for self-service
- ✅ Payment method management
- ✅ Invoice history and PDF downloads

### 3. Access Control
- ✅ Trial expiration enforcement (backend + frontend)
- ✅ Payment required modal after trial
- ✅ Real-time subscription status checking
- ✅ Graceful degradation on errors

### 4. Billing Features
- ✅ Monthly recurring billing
- ✅ Prorated charges when employees added mid-cycle
- ✅ Failed payment handling and retry logic
- ✅ Subscription cancellation (at period end or immediate)
- ✅ Invoice generation and email delivery

---

## Implementation Phases

### Phase 1: Database Setup (Backend)
- Add Stripe fields to company table
- Create subscription_plans table
- Create subscription_events table (audit log)
- Create invoices table

**Estimated Time**: 2-3 hours

### Phase 2: Stripe Configuration
- Create Stripe product and price
- Configure webhook endpoint
- Set up Customer Portal
- Test with Stripe CLI

**Estimated Time**: 1-2 hours

### Phase 3: Backend Implementation
- Create Stripe service layer
- Build subscription API endpoints
- Implement webhook handlers
- Add trial enforcement middleware
- Employee count sync logic

**Estimated Time**: 1-2 days

### Phase 4: Frontend Implementation
- Build SubscriptionManagement component
- Add API client functions
- Create subscription check hook
- Update Profile page
- Trial expiration UI

**Estimated Time**: 1 day

### Phase 5: Testing & Deployment
- Test with Stripe test cards
- Verify webhook events
- Test trial expiration
- Deploy to production
- Migrate existing users

**Estimated Time**: 4-6 hours

---

## Critical Files Summary

### Backend Files (12 new/modified)
1. `migrations/001_add_stripe_fields_to_company.sql` - NEW
2. `migrations/002_create_subscription_plans.sql` - NEW
3. `migrations/003_create_subscription_events.sql` - NEW
4. `migrations/004_create_invoices.sql` - NEW
5. `src/services/stripe_service.py` - NEW
6. `src/routers/subscription_router.py` - REPLACE
7. `src/dao/subscription_dao.py` - ENHANCE
8. `src/controllers/employee_controller.py` - ENHANCE
9. `src/middleware/subscription_check.py` - NEW
10. `scripts/setup_stripe_products.py` - NEW
11. `scripts/grandfather_existing_users.py` - NEW
12. `scripts/check_expired_trials.py` - NEW

### Frontend Files (4 new/modified)
1. `src/components/SubscriptionManagement.jsx` - NEW
2. `src/hooks/useSubscriptionCheck.js` - NEW
3. `src/api.js` - ENHANCE
4. `src/pages/Profile.jsx` - MODIFY

### Configuration Files (2)
1. Backend `.env` - Add `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
2. Frontend `.env` - Add `VITE_STRIPE_PUBLISHABLE_KEY`

---

## Security Considerations

### Critical Security Measures
✓ **Webhook signature verification** (prevents event spoofing)
✓ **Environment variables** for all API keys (never hardcoded)
✓ **Stripe Publishable Key** safe for frontend
✓ **Secret Key** only on backend, never exposed
✓ **Payment data** never touches our database (PCI compliant via Stripe)
✓ **Trial enforcement** on backend (can't bypass from frontend)
✓ **HTTPS required** for webhook endpoint

### Data Privacy
- Card numbers never stored in TapTime database
- Stripe handles all PCI compliance
- Only store Stripe IDs (customer_id, subscription_id)
- Invoice PDFs hosted by Stripe, not stored locally

---

## Migration Strategy for Existing Users

### Recommended Approach: 14-Day Trial for All

**Script**: `scripts/grandfather_existing_users.py`

**Steps**:
1. Identify all active companies without `stripe_customer_id`
2. Set `subscription_status = 'trialing'`
3. Set `trial_end_date = NOW() + 14 days`
4. Send notification email explaining new subscription plans
5. Provide link to add payment method

**Email Template**:
```
Subject: Important: TapTime Subscription Updates

Hi [Company Name],

We're excited to introduce subscription plans to TapTime!

You've been granted a 14-day free trial to continue using all features.
After the trial, pricing is simple: $1 per employee per month.

Current usage:
- Employees: X
- Estimated monthly cost: $X/month

Add your payment method: [Link to subscription page]

Questions? Reply to this email.

Thanks,
TapTime Team
```

---

## Testing Strategy

### Test Environments
- **Development**: Stripe test mode, local webhook testing with Stripe CLI
- **Staging**: Stripe test mode, deployed webhook endpoint
- **Production**: Stripe live mode, real payments

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- **Insufficient funds**: `4000 0000 0000 9995`

Any future expiry date, any 3-digit CVC

### Critical Test Scenarios
1. ✅ New user gets 14-day trial automatically
2. ✅ Trial countdown displays correctly
3. ✅ Employee count syncs to Stripe
4. ✅ Trial expiration blocks access
5. ✅ Payment method adds restores access
6. ✅ Employee additions update Stripe quantity
7. ✅ Failed payment shows error and blocks access
8. ✅ Webhook events process correctly

---

## Success Metrics

### Key Performance Indicators (KPIs)
- **Trial Conversion Rate**: % of trials that convert to paid
- **Average Revenue Per User (ARPU)**: Average monthly revenue
- **Monthly Recurring Revenue (MRR)**: Total monthly subscription revenue
- **Churn Rate**: % of customers canceling per month
- **Payment Success Rate**: % of successful payment attempts
- **Trial Completion Rate**: % of users completing full 14-day trial

### Monitoring Dashboards
- Stripe Dashboard → Analytics (revenue, subscriptions, churn)
- Webhook delivery success rate
- Trial expiration emails sent
- Failed payment retry attempts

---

## Support Resources

### Stripe Documentation
- [Checkout Integration](https://stripe.com/docs/payments/checkout)
- [Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

### Stripe Dashboard (Test Mode)
- Products: https://dashboard.stripe.com/test/products
- Customers: https://dashboard.stripe.com/test/customers
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Logs: https://dashboard.stripe.com/test/logs

### Getting Help
- Stripe Support: https://support.stripe.com/
- Stripe Discord: https://discord.gg/stripe
- Stack Overflow: `stripe-payments` tag

---

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Database migrations | 2-3 hours |
| 2 | Stripe product setup | 1-2 hours |
| 3 | Backend implementation | 1-2 days |
| 4 | Frontend implementation | 1 day |
| 5 | Testing & deployment | 4-6 hours |
| **Total** | | **2-3 days** |

*Assuming developer familiar with codebase and Stripe basics*

---

## Next Steps

1. ✅ Read this overview document
2. ⏭️ Review `2-backend-implementation.md` for backend work
3. ⏭️ Review `3-frontend-implementation.md` for frontend work
4. ⏭️ Review `4-stripe-configuration.md` for Stripe setup
5. ⏭️ Start implementation following the order above

---

## Questions & Clarifications

### Q: What if we need to change pricing later?
**A**: Update the price in Stripe Dashboard, update `subscription_plans` table. Existing subscriptions can be grandfathered or migrated.

### Q: Can we add additional features/limits per plan later?
**A**: Yes! Add columns to `subscription_plans` table and create additional Stripe prices. The architecture supports multiple plans.

### Q: How do we handle annual billing in the future?
**A**: Create new Stripe price with `interval: 'year'`, add to subscription_plans table, show toggle in frontend UI.

### Q: What about taxes?
**A**: Stripe Tax can be enabled in Dashboard → Settings → Tax. Automatic tax calculation and collection.

### Q: Can we offer discounts/coupons?
**A**: Yes! Stripe supports coupons and promotion codes. Already enabled in Checkout Session creation.
