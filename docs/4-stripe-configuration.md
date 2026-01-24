# Stripe Configuration Guide

This document covers all Stripe Dashboard configuration required for the subscription system.

**Prerequisites**:
- Stripe account created (https://dashboard.stripe.com/register)
- Access to Stripe Dashboard
- Backend and frontend code ready

---

## Table of Contents
1. [Account Setup](#account-setup)
2. [Create Product & Price](#create-product--price)
3. [Configure Webhooks](#configure-webhooks)
4. [Configure Customer Portal](#configure-customer-portal)
5. [Get API Keys](#get-api-keys)
6. [Test Mode vs Live Mode](#test-mode-vs-live-mode)
7. [Testing with Stripe CLI](#testing-with-stripe-cli)
8. [Production Checklist](#production-checklist)

---

## Account Setup

### 1. Create Stripe Account

1. Go to https://dashboard.stripe.com/register
2. Sign up with your business email
3. Complete business verification (required for live mode)
4. Activate your account

### 2. Set Business Profile

1. Go to **Settings** → **Business settings**
2. Fill in:
   - **Business name**: TapTime (or your company name)
   - **Support email**: support@yourdomain.com
   - **Business type**: Software/SaaS
3. Save changes

### 3. Enable Test Mode

**IMPORTANT**: Always start in test mode!

- Look for toggle switch in top-right: **"Test mode"**
- Ensure it's ON (should show orange/yellow indicator)
- All configuration steps below should be done in test mode first

---

## Create Product & Price

### Step 1: Create Product

1. Go to **Products** → https://dashboard.stripe.com/test/products
2. Click **+ Add product**
3. Fill in:
   - **Name**: `TapTime - Per Employee`
   - **Description**: `Monthly subscription: $1 per employee`
4. Click **Add product**

### Step 2: Create Price

After creating the product:

1. In the pricing section, click **Add pricing**
2. Configure:
   - **Pricing model**: "Standard pricing"
   - **Price**: `1.00`
   - **Billing period**: "Monthly"
   - **Currency**: "USD"
   - **Charge for metered usage**: NO (leave unchecked)
3. Click **Save pricing**

### Step 3: Copy IDs

After saving:

1. You'll see **Product ID** (starts with `prod_`)
   - Example: `prod_ABc123DEf456GHi789`
2. Click on the price you just created
3. Copy **Price ID** (starts with `price_`)
   - Example: `price_1ABCDEF2ghIJKLmn3`

**Save these IDs!** You'll need them for:
- Backend database (`subscription_plans` table)
- Backend environment variables (optional)

### Step 4: Update Database

Run this SQL in your database:

```sql
UPDATE subscription_plans
SET
    stripe_product_id = 'prod_YOUR_PRODUCT_ID_HERE',
    stripe_price_id = 'price_YOUR_PRICE_ID_HERE'
WHERE plan_name = 'TapTime Per-Employee';
```

Replace `prod_YOUR_PRODUCT_ID_HERE` and `price_YOUR_PRICE_ID_HERE` with actual IDs.

---

## Configure Webhooks

Webhooks are **critical** for keeping your database in sync with Stripe.

### Step 1: Add Webhook Endpoint

1. Go to **Developers** → **Webhooks** → https://dashboard.stripe.com/test/webhooks
2. Click **+ Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://api.yourdomain.com/subscription/webhook`
     - For local development: Use ngrok (see Testing section)
   - **Description**: `TapTime subscription webhooks`
4. Click **Select events**

### Step 2: Select Events

Select these events:

**Customer Events**:
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `customer.subscription.trial_will_end`

**Invoice Events**:
- [x] `invoice.paid`
- [x] `invoice.payment_failed`

**Checkout Events**:
- [x] `checkout.session.completed`

Click **Add events** → **Add endpoint**

### Step 3: Get Webhook Signing Secret

After creating the endpoint:

1. Click on the endpoint you just created
2. Scroll to **Signing secret**
3. Click **Reveal** or **Copy**
4. Copy the secret (starts with `whsec_`)
   - Example: `whsec_xxxxxxxxxxxxxxxxxxxxx`

**Save this secret!** Add to backend `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### Step 4: Test Webhook

1. In Stripe Dashboard, go to endpoint details
2. Click **Send test webhook**
3. Select event type: `customer.subscription.created`
4. Click **Send test webhook**
5. Check:
   - Response status should be `200 OK`
   - Your backend logs should show "Received webhook: customer.subscription.created"

**If webhook fails**:
- Ensure backend is running and accessible
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` is set
- Check backend logs for errors

---

## Configure Customer Portal

The Customer Portal allows customers to manage their subscriptions self-service.

### Step 1: Enable Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal** → https://dashboard.stripe.com/test/settings/billing/portal
2. Click **Activate test link** (or **Activate live link** for production)

### Step 2: Configure Features

Enable these features:

**Invoice history**:
- [x] Invoice list
- [x] Download invoices

**Payment methods**:
- [x] Update payment method
- [x] Add payment method

**Subscriptions**:
- [x] Cancel subscriptions
- [ ] Pause subscriptions (optional)
- [ ] Switch plans (optional - disable if you only have one plan)

**Configure cancellation behavior**:
- Cancellation mode: "At the end of the billing period"
- This allows users to keep access until their paid period ends

### Step 3: Customize Branding

1. Scroll to **Branding**
2. Upload:
   - **Logo**: Your company logo (max 500KB)
   - **Icon**: Favicon (max 500KB)
   - **Primary color**: Your brand color (hex code)
3. **Business name**: TapTime
4. **Support email**: support@yourdomain.com

### Step 4: Set Privacy & Terms URLs

1. Scroll to **Business information**
2. Fill in:
   - **Privacy policy URL**: https://yourdomain.com/privacy
   - **Terms of service URL**: https://yourdomain.com/terms
3. Save settings

---

## Get API Keys

### Get Publishable Key (Frontend)

1. Go to **Developers** → **API keys** → https://dashboard.stripe.com/test/apikeys
2. Find **Publishable key** section
3. Copy key (starts with `pk_test_` in test mode)
   - Example: `pk_test_51ABCDEFghijklmNOpqrSTUvwxYZ1234567890abCDef123456`

Add to **frontend** `.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### Get Secret Key (Backend)

1. In same **API keys** page
2. Find **Secret key** section
3. Click **Reveal test key**
4. Copy key (starts with `sk_test_` in test mode)
   - Example: `sk_test_51ABCDEFghijklmNOpqrSTUvwxYZ1234567890abCDef123456`

Add to **backend** `.env`:

```bash
STRIPE_API_KEY=sk_test_YOUR_KEY_HERE
```

**⚠️ SECURITY WARNING**: Never commit `.env` files to git! Never expose secret keys in frontend code!

---

## Test Mode vs Live Mode

Stripe has two separate environments:

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Purpose | Development & testing | Production |
| API Keys | `pk_test_...`, `sk_test_...` | `pk_live_...`, `sk_live_...` |
| Webhooks | Separate webhook endpoints | Separate webhook endpoints |
| Products | Test products | Live products |
| Real Money | No | Yes |
| Test Cards | Yes | No |
| Activation | Always active | Requires verification |

### Switching Modes

1. Use toggle in top-right of Dashboard
2. Switch to **Live mode** only when ready for production
3. **Repeat all configuration steps** for live mode:
   - Create products (live mode IDs will be different)
   - Set up webhooks (different signing secret)
   - Get live API keys
   - Update Customer Portal settings

**Best Practice**: Keep test mode for development, use live mode only in production.

---

## Testing with Stripe CLI

The Stripe CLI allows you to test webhooks locally.

### Install Stripe CLI

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Windows**:
```bash
scoop install stripe
```

**Linux**:
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Login to Stripe

```bash
stripe login
```

This will open browser for authentication.

### Forward Webhooks to Local Backend

```bash
stripe listen --forward-to localhost:8000/subscription/webhook
```

Output:
```
Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

**Copy the signing secret** and update backend `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

**Note**: This secret is temporary and changes each time you run `stripe listen`.

### Test Webhook Events

In a new terminal:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test invoice paid
stripe trigger invoice.paid

# Test payment failed
stripe trigger invoice.payment_failed
```

Check your backend logs - you should see "Received webhook: ..." messages.

### Listen to Live Events

To see real webhook events from Stripe Dashboard:

```bash
stripe listen --print-json
```

Then trigger events manually:
1. Complete a checkout in your app
2. CLI will show the webhook event JSON in real-time

---

## Production Checklist

Before going live:

### 1. Stripe Account Verification

- [ ] Business verification completed
- [ ] Bank account added for payouts
- [ ] Tax settings configured (if applicable)

### 2. Live Mode Setup

- [ ] Switch to **Live mode** in Dashboard
- [ ] Create product & price (get new live IDs)
- [ ] Update database with live product/price IDs
- [ ] Set up webhook endpoint (production URL)
- [ ] Get live webhook signing secret
- [ ] Enable Customer Portal (live mode)
- [ ] Get live API keys (publishable & secret)

### 3. Environment Variables

Update `.env` files with live keys:

**Backend**:
```bash
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Frontend**:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4. Stripe Dashboard Settings

- [ ] Business profile complete
- [ ] Support email set
- [ ] Branding configured (logo, colors)
- [ ] Privacy & terms URLs set
- [ ] Email receipts enabled
- [ ] Checkout success/cancel URLs whitelisted

### 5. Testing

- [ ] Test checkout with real card (charge yourself $1)
- [ ] Verify webhook events received
- [ ] Test Customer Portal access
- [ ] Test subscription cancellation
- [ ] Verify email receipts sent
- [ ] Check invoice PDF generation

### 6. Monitoring

Set up monitoring for:
- [ ] Failed payment alerts
- [ ] Webhook delivery failures
- [ ] Subscription churn rate
- [ ] Revenue tracking

---

## Stripe Dashboard Navigation

Quick reference for common tasks:

| Task | Location |
|------|----------|
| Create product | **Products** → Add product |
| View subscriptions | **Customers** → Subscriptions |
| Check payments | **Payments** |
| View invoices | **Billing** → Invoices |
| Webhooks | **Developers** → Webhooks |
| API keys | **Developers** → API keys |
| Logs | **Developers** → Logs |
| Customer Portal | **Settings** → Billing → Customer portal |
| Test cards | **Developers** → Testing |
| Reports | **Reports** → Overview |

---

## Useful Stripe Resources

### Documentation
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Testing](https://stripe.com/docs/testing)

### Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Decline |
| `4000 0027 6000 3184` | 3D Secure required |
| `4000 0000 0000 9995` | Insufficient funds |

**All test cards**:
- Any future expiry date (e.g., 12/30)
- Any 3-digit CVC (e.g., 123)
- Any billing ZIP code

### Support
- Stripe Support: https://support.stripe.com/
- Stripe Discord: https://discord.gg/stripe
- Stack Overflow: Tag `stripe-payments`

---

## Troubleshooting

### Webhook Events Not Received

**Symptoms**:
- Checkout completes but subscription not created in database
- Invoice paid but not recorded

**Fixes**:
1. Check webhook endpoint URL is correct and accessible
2. Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard
3. Check Stripe Dashboard → Webhooks → event delivery status
4. Look for failed deliveries and error messages
5. Ensure backend is running and `/subscription/webhook` route exists
6. Check backend logs for signature verification errors

### "No Such Price" Error

**Symptoms**:
- Checkout fails with "No such price" error

**Fixes**:
1. Verify price ID in database matches Stripe Dashboard
2. Check you're using correct mode (test vs live)
3. Ensure price is active in Stripe Dashboard
4. SQL check:
   ```sql
   SELECT stripe_price_id FROM subscription_plans WHERE is_active = TRUE;
   ```

### Customer Portal Not Working

**Symptoms**:
- "Manage Billing" button fails
- Error: "Invalid customer"

**Fixes**:
1. Verify Customer Portal is activated in Dashboard
2. Check company has `stripe_customer_id` in database
3. Ensure customer exists in Stripe (Dashboard → Customers)
4. Verify using correct API keys (test vs live)

### Test Cards Not Working

**Symptoms**:
- Test card declined when it should succeed

**Fixes**:
1. Verify you're in **Test mode** (check Dashboard toggle)
2. Use exact test card number: `4242 4242 4242 4242`
3. Use any future expiry date
4. Use any 3-digit CVC
5. Check Stripe Dashboard → Logs for detailed error

---

## Security Best Practices

### API Keys
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys if exposed
- ✅ Use separate keys for test/live
- ✅ Restrict API key permissions (if possible)

### Webhooks
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for webhook endpoint
- ✅ Log all webhook events
- ✅ Implement idempotency (don't process same event twice)

### Customer Data
- ✅ Never store card numbers
- ✅ Only store Stripe IDs (customer_id, subscription_id)
- ✅ Let Stripe handle PCI compliance
- ✅ Use HTTPS for all API calls

---

## Summary

After completing this guide, you should have:

✅ Stripe account created and verified
✅ Product created: "TapTime - Per Employee"
✅ Price created: $1.00/month
✅ Webhook endpoint configured
✅ Webhook signing secret obtained
✅ Customer Portal activated and customized
✅ API keys (publishable & secret) obtained
✅ Database updated with product/price IDs
✅ Environment variables set

**Next Steps**:
1. ✅ Verify backend can create checkout sessions
2. ✅ Test frontend checkout flow
3. ✅ Verify webhook events are received
4. ✅ Test Customer Portal
5. ✅ Test end-to-end subscription lifecycle

**Ready for Production**:
- Repeat all steps in **Live mode**
- Deploy backend and frontend with live keys
- Test with real card (small amount)
- Monitor for issues

---

**Estimated Setup Time**: 1-2 hours (test mode + live mode)
