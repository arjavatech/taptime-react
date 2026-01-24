# Stripe Registration Flow - Testing Guide

## Prerequisites

1. **Stripe Account Setup**
   - Have a Stripe test account ready
   - Configure webhook endpoint (see Configuration section)
   - Have test API keys in environment variables

2. **Environment Variables**

   **Backend (.env):**
   ```bash
   STRIPE_API_KEY=sk_test_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

   **Frontend (.env):**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

3. **Subscription Plan**
   - Ensure "TapTime Per-Employee Plan" exists in Stripe
   - Price ID should be in `subscription_plans` table
   - If not, run: `python scripts/setup_stripe_products.py`

## Testing Steps

### Test 1: Full Registration Flow with Stripe

1. Navigate to `/register`
2. Fill out Step 1 (Company Information):
   - Company Name: "Test Company"
   - Upload a logo (optional)
   - Address details
   - Number of Devices: 5
   - Number of Employees: 10
   - Click "Next"

3. Fill out Step 2 (Personal Information):
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "test@example.com"
   - Phone: valid phone number
   - Address details
   - Click "Create Account"

4. **Expected**: Redirect to Stripe Checkout page

5. On Stripe Checkout:
   - Should show subscription details
   - Should show "14-day free trial"
   - Should show quantity: 10 (employees)
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
   - Click "Subscribe"

6. **Expected**: Redirect to `/register/success`
   - Should show "Processing your registration..." loading message
   - Should complete account creation
   - Should show success modal
   - Click "Continue to Login"

7. Verify Login:
   - Login with email and password set via email
   - Navigate to Profile → Subscription tab
   - **Expected**:
     - Status: "Free Trial Active"
     - Trial ends: ~14 days from now
     - Employee count: 10
     - Monthly cost after trial: $10.00

### Test 2: Database Verification

```sql
-- Check company was created with Stripe data
SELECT
  cid,
  company_name,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  trial_end_date
FROM company
WHERE email = 'test@example.com';
```

**Expected Results:**
- `stripe_customer_id`: cus_xxxxx
- `stripe_subscription_id`: sub_xxxxx
- `subscription_status`: 'trialing'
- `trial_end_date`: ~14 days from now

### Test 3: Stripe Dashboard Verification

1. Go to: https://dashboard.stripe.com/test/customers
2. Search for customer by email: "test@example.com"
3. **Expected**:
   - Customer exists
   - Has active subscription (trialing)
   - Metadata contains:
     - `company_id`: [UUID]
     - `pending_registration`: "false"
   - Trial end date is set

4. Check Subscription:
   - Click on subscription
   - **Expected**:
     - Status: Trialing
     - Quantity: 10
     - Price: $1.00/month per employee
     - Trial ends: ~14 days from now

### Test 4: Webhook Verification

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find your webhook endpoint
3. Check recent events:
   - `checkout.session.completed` - should be successful
   - `customer.subscription.created` - should be successful
4. **Expected**: Green checkmarks (200 OK responses)

### Test 5: Cancel Flow

1. Start registration process
2. Fill form and submit
3. On Stripe Checkout page, click "Back" or close tab
4. **Expected**:
   - Redirected to `/register` (cancel_url)
   - Form is reset
   - localStorage is cleared

### Test 6: Error Handling - Invalid Session

1. Manually navigate to: `/register/success?session_id=invalid_session_id`
2. **Expected**:
   - Show error message
   - "Registration Error" heading
   - "Try Again" and "Go to Login" buttons

### Test 7: Error Handling - Missing LocalStorage

1. Start registration and redirect to Stripe
2. Clear browser localStorage manually
3. Complete Stripe checkout
4. **Expected**:
   - Show error: "Registration data not found"
   - Buttons to retry or go to login

### Test 8: Duplicate Email

1. Complete a successful registration
2. Try to register again with the same email
3. **Expected**:
   - Stripe session will be created
   - After Stripe redirect, backend should return error
   - Show error: "Email already registered"

## Stripe Test Cards

Use these test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Requires Authentication**: `4000 0025 0000 3155`

## Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**:
- Check webhook URL is correct
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:8000/subscription/webhook
  ```

### Issue: Checkout session creation fails
**Solution**:
- Verify STRIPE_API_KEY is set correctly
- Check that subscription plan exists in database
- Check backend logs for detailed error

### Issue: Registration completes but Stripe data not linked
**Solution**:
- Check backend logs for Stripe linking errors
- Verify session_id is being passed correctly
- Check that `get_checkout_session()` is working

### Issue: LocalStorage data lost
**Solution**:
- Check browser settings (localStorage must be enabled)
- Verify data is being saved before redirect
- Check browser console for errors

## Cleanup After Testing

```sql
-- Delete test company
DELETE FROM employee WHERE cid = '[test_company_cid]';
DELETE FROM company WHERE email = 'test@example.com';
```

**In Stripe Dashboard:**
1. Cancel test subscription
2. Delete test customer (optional)

## Next Steps After Testing

Once testing is successful:

1. Configure production Stripe keys
2. Set up production webhook endpoint
3. Test with real payment methods (in Stripe test mode first)
4. Monitor webhook events in production
5. Set up alerts for failed payments
6. Configure trial expiration notifications

## Production Considerations

Before going live:

- [ ] Switch to production Stripe API keys
- [ ] Configure production webhook endpoint
- [ ] Test webhook signature verification
- [ ] Set up monitoring for failed checkouts
- [ ] Configure email notifications for trial ending
- [ ] Test subscription cancellation flow
- [ ] Verify proration calculations
- [ ] Test edge cases (expired sessions, network failures)
- [ ] Load test registration flow
- [ ] Set up error tracking (Sentry, etc.)
