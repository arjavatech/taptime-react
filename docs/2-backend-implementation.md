# Backend Implementation Guide - Stripe Subscriptions

This document covers all backend implementation work for Stripe subscription integration.

**Prerequisites**: Read `1-overview-and-plan.md` first

---

## Table of Contents
1. [Database Migrations](#database-migrations)
2. [Stripe Service Layer](#stripe-service-layer)
3. [Subscription DAO](#subscription-dao)
4. [Subscription Router & API Endpoints](#subscription-router--api-endpoints)
5. [Webhook Event Handlers](#webhook-event-handlers)
6. [Trial Enforcement Middleware](#trial-enforcement-middleware)
7. [Employee Count Sync](#employee-count-sync)
8. [Utility Scripts](#utility-scripts)
9. [Environment Configuration](#environment-configuration)
10. [Testing & Verification](#testing--verification)

---

## Database Migrations

### Migration 1: Add Stripe Fields to Company Table

**File**: `../tap-time-backend/postgresql/migrations/001_add_stripe_fields_to_company.sql`

```sql
-- Add Stripe integration fields to company table
ALTER TABLE company ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE company ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE company ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing';
ALTER TABLE company ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;
ALTER TABLE company ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMP;
ALTER TABLE company ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE company ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN company.stripe_customer_id IS 'Stripe Customer ID (starts with cus_)';
COMMENT ON COLUMN company.stripe_subscription_id IS 'Stripe Subscription ID (starts with sub_)';
COMMENT ON COLUMN company.subscription_status IS 'Subscription status: trialing, active, past_due, canceled, unpaid, incomplete';
COMMENT ON COLUMN company.trial_end_date IS 'When the 14-day trial expires';
COMMENT ON COLUMN company.current_period_end IS 'When the current billing period ends';
COMMENT ON COLUMN company.cancel_at_period_end IS 'If true, subscription cancels at period end';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_stripe_customer ON company(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_company_subscription_status ON company(subscription_status);
CREATE INDEX IF NOT EXISTS idx_company_trial_end ON company(trial_end_date);

-- Set trial for existing companies (14 days from migration)
UPDATE company
SET
    subscription_status = 'trialing',
    trial_end_date = NOW() + INTERVAL '14 days'
WHERE is_active = TRUE
  AND stripe_customer_id IS NULL;
```

**Why these fields?**
- `stripe_customer_id`: Links TapTime company to Stripe Customer object
- `stripe_subscription_id`: Links to active Stripe Subscription
- `subscription_status`: Tracks lifecycle (trialing → active → past_due → canceled)
- `trial_end_date`: Enforces 14-day trial expiration
- `current_period_end`: Needed for prorated billing and cancellation logic

---

### Migration 2: Create Subscription Plans Table

**File**: `../tap-time-backend/postgresql/migrations/002_create_subscription_plans.sql`

```sql
-- Create subscription_plans table to store pricing information
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stripe IDs
    stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_product_id VARCHAR(255) NOT NULL,

    -- Plan details
    plan_name VARCHAR(255) NOT NULL,
    plan_description TEXT,

    -- Pricing (for per-employee model)
    unit_price DECIMAL(10, 2) NOT NULL, -- Price per employee (e.g., 1.00)
    currency VARCHAR(3) DEFAULT 'usd',
    billing_interval VARCHAR(20) DEFAULT 'month', -- 'month' or 'year'

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB, -- Store plan features as JSON array

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) DEFAULT 'system'
);

-- Indexes
CREATE INDEX idx_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_plans_stripe_price ON subscription_plans(stripe_price_id);

-- Comments
COMMENT ON TABLE subscription_plans IS 'Subscription plan configurations linked to Stripe prices';
COMMENT ON COLUMN subscription_plans.unit_price IS 'Price per employee per billing period';
COMMENT ON COLUMN subscription_plans.stripe_price_id IS 'Stripe Price ID from dashboard';

-- Seed initial plan (update stripe IDs after creating in Stripe Dashboard)
INSERT INTO subscription_plans (
    plan_name,
    plan_description,
    stripe_price_id,
    stripe_product_id,
    unit_price,
    features
) VALUES (
    'TapTime Per-Employee',
    'Pay $1 per employee per month. Add unlimited employees, billed monthly.',
    'price_PLACEHOLDER', -- REPLACE with actual Stripe Price ID
    'prod_PLACEHOLDER',  -- REPLACE with actual Stripe Product ID
    1.00,
    '["Unlimited employees", "Unlimited devices", "Time tracking", "Reports", "Email support"]'::jsonb
) ON CONFLICT (stripe_price_id) DO NOTHING;
```

**Important**: After creating Stripe product/price (see `4-stripe-configuration.md`), update the PLACEHOLDER values with actual IDs.

---

### Migration 3: Create Subscription Events Table

**File**: `../tap-time-backend/postgresql/migrations/003_create_subscription_events.sql`

```sql
-- Create subscription_events table for webhook event logging
CREATE TABLE IF NOT EXISTS subscription_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    c_id CHAR(36) NOT NULL,

    -- Stripe event data
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,

    -- Processing status
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (c_id) REFERENCES company(cid) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_events_company ON subscription_events(c_id);
CREATE INDEX idx_events_processed ON subscription_events(processed, created_at);
CREATE INDEX idx_events_type ON subscription_events(event_type);
CREATE INDEX idx_events_stripe_id ON subscription_events(stripe_event_id);

-- Comments
COMMENT ON TABLE subscription_events IS 'Audit log of all Stripe webhook events';
COMMENT ON COLUMN subscription_events.stripe_event_id IS 'Unique Stripe event ID (idempotency key)';
COMMENT ON COLUMN subscription_events.event_type IS 'Stripe event type (e.g., customer.subscription.created)';
```

**Purpose**: Logs all webhook events for debugging, replay, and audit trails.

---

### Migration 4: Create Invoices Table

**File**: `../tap-time-backend/postgresql/migrations/004_create_invoices.sql`

```sql
-- Create invoices table to store billing history
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    c_id CHAR(36) NOT NULL,

    -- Stripe data
    stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,

    -- Invoice details
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

    -- Billing period
    period_start TIMESTAMP,
    period_end TIMESTAMP,

    -- Dates
    invoice_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,

    -- Links
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Metadata
    employee_count INTEGER, -- Number of employees billed

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (c_id) REFERENCES company(cid) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_invoices_company ON invoices(c_id, invoice_date DESC);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(invoice_date, due_date);

-- Comments
COMMENT ON TABLE invoices IS 'Invoice history for customer portal';
COMMENT ON COLUMN invoices.employee_count IS 'Number of employees billed (quantity)';
```

---

## Stripe Service Layer

**File**: `../tap-time-backend/postgresql/src/services/stripe_service.py`

```python
"""
Stripe Service - Centralized Stripe API integration
Handles all Stripe operations for subscriptions
"""
import stripe
from typing import Optional, Dict, Any, List
from uuid import UUID
from config.settings import settings
from exceptions.custom_exceptions import TapTimeException

# Initialize Stripe with API key
stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    """Service for Stripe operations"""

    @staticmethod
    def create_customer(
        email: str,
        company_name: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> stripe.Customer:
        """
        Create a Stripe customer

        Args:
            email: Customer email
            company_name: Company name
            metadata: Additional metadata (e.g., company_id)

        Returns:
            Stripe Customer object
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=company_name,
                metadata=metadata or {},
                description=f"TapTime customer: {company_name}"
            )
            return customer
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to create Stripe customer: {str(e)}")

    @staticmethod
    def create_checkout_session(
        customer_id: str,
        price_id: str,
        quantity: int,
        success_url: str,
        cancel_url: str,
        trial_days: int = 14,
        metadata: Optional[Dict[str, Any]] = None
    ) -> stripe.checkout.Session:
        """
        Create Stripe Checkout session for subscription

        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            quantity: Number of employees (subscription quantity)
            success_url: Redirect URL on success
            cancel_url: Redirect URL on cancel
            trial_days: Trial period in days (default 14)
            metadata: Additional metadata

        Returns:
            Stripe Checkout Session object
        """
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': quantity,  # Number of employees
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                subscription_data={
                    'trial_period_days': trial_days,
                    'metadata': metadata or {},
                },
                allow_promotion_codes=True,  # Enable promo codes
                billing_address_collection='auto',
            )
            return session
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to create checkout session: {str(e)}")

    @staticmethod
    def get_subscription(subscription_id: str) -> stripe.Subscription:
        """Retrieve a subscription from Stripe"""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to retrieve subscription: {str(e)}")

    @staticmethod
    def update_subscription_quantity(
        subscription_id: str,
        new_quantity: int,
        proration_behavior: str = 'create_prorations'
    ) -> stripe.Subscription:
        """
        Update subscription quantity (employee count)

        Args:
            subscription_id: Stripe subscription ID
            new_quantity: New employee count
            proration_behavior: 'create_prorations', 'none', or 'always_invoice'

        Returns:
            Updated Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)

            # Update the subscription item quantity
            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'quantity': new_quantity,
                }],
                proration_behavior=proration_behavior,
            )
            return updated_subscription
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to update subscription quantity: {str(e)}")

    @staticmethod
    def cancel_subscription(
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """
        Cancel a subscription

        Args:
            subscription_id: Stripe subscription ID
            at_period_end: If True, cancel at end of period; if False, cancel immediately

        Returns:
            Canceled/modified Stripe Subscription object
        """
        try:
            if at_period_end:
                # Cancel at end of billing period (user keeps access)
                return stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                # Cancel immediately (user loses access now)
                return stripe.Subscription.delete(subscription_id)
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to cancel subscription: {str(e)}")

    @staticmethod
    def create_customer_portal_session(
        customer_id: str,
        return_url: str
    ) -> stripe.billing_portal.Session:
        """
        Create Stripe Customer Portal session
        Allows customers to manage their subscription, payment methods, invoices

        Args:
            customer_id: Stripe customer ID
            return_url: URL to return to after portal session

        Returns:
            Stripe BillingPortal Session object with URL
        """
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session
        except stripe.error.StripeError as e:
            raise TapTimeException(f"Failed to create portal session: {str(e)}")

    @staticmethod
    def construct_webhook_event(
        payload: bytes,
        signature: str,
        webhook_secret: str
    ) -> stripe.Event:
        """
        Construct and verify webhook event

        Args:
            payload: Raw request body
            signature: Stripe-Signature header
            webhook_secret: Webhook signing secret from Stripe

        Returns:
            Verified Stripe Event object

        Raises:
            TapTimeException: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, webhook_secret
            )
            return event
        except stripe.error.SignatureVerificationError as e:
            raise TapTimeException(f"Webhook signature verification failed: {str(e)}")

    @staticmethod
    def get_upcoming_invoice(customer_id: str) -> Optional[stripe.Invoice]:
        """
        Get upcoming invoice preview for a customer

        Args:
            customer_id: Stripe customer ID

        Returns:
            Stripe Invoice object or None
        """
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.StripeError:
            return None
```

**Key Methods**:
- `create_customer()`: Create Stripe customer when company signs up
- `create_checkout_session()`: Generate payment page URL with employee quantity
- `update_subscription_quantity()`: Sync employee count changes to Stripe
- `cancel_subscription()`: Handle cancellations
- `construct_webhook_event()`: Verify webhook signatures (security!)

---

## Subscription DAO

**File**: `../tap-time-backend/postgresql/src/dao/subscription_dao.py`

Add these methods to the existing SubscriptionDAO class:

```python
import psycopg
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import json
from utils.date_utils import get_current_datetime
from exceptions.custom_exceptions import QueryExecutionError

class SubscriptionDAO:
    """Data Access Object for subscription operations"""

    # ... existing methods ...

    @staticmethod
    def update_company_stripe_data(
        conn: psycopg.Connection,
        cid: UUID,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        subscription_status: Optional[str] = None,
        trial_end_date: Optional[datetime] = None,
        current_period_end: Optional[datetime] = None,
        cancel_at_period_end: Optional[bool] = None
    ) -> None:
        """
        Update company Stripe-related fields

        Args:
            conn: Database connection
            cid: Company ID
            **kwargs: Fields to update
        """
        try:
            updates = []
            params = []

            if stripe_customer_id is not None:
                updates.append("stripe_customer_id = %s")
                params.append(stripe_customer_id)

            if stripe_subscription_id is not None:
                updates.append("stripe_subscription_id = %s")
                params.append(stripe_subscription_id)

            if subscription_status is not None:
                updates.append("subscription_status = %s")
                params.append(subscription_status)

            if trial_end_date is not None:
                updates.append("trial_end_date = %s")
                params.append(trial_end_date)

            if current_period_end is not None:
                updates.append("current_period_end = %s")
                params.append(current_period_end)

            if cancel_at_period_end is not None:
                updates.append("cancel_at_period_end = %s")
                params.append(cancel_at_period_end)

            if not updates:
                return

            updates.append("last_modified_date_time = %s")
            params.append(get_current_datetime())

            params.append(str(cid))

            sql = f"UPDATE company SET {', '.join(updates)} WHERE cid = %s"

            with conn.cursor() as cursor:
                cursor.execute(sql, tuple(params))
                conn.commit()
        except psycopg.Error as e:
            conn.rollback()
            raise QueryExecutionError(f"Failed to update company Stripe data: {str(e)}")

    @staticmethod
    def get_company_by_stripe_customer(
        conn: psycopg.Connection,
        stripe_customer_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get company by Stripe customer ID"""
        try:
            sql = "SELECT * FROM company WHERE stripe_customer_id = %s AND is_active = TRUE"
            with conn.cursor() as cursor:
                cursor.execute(sql, (stripe_customer_id,))
                return cursor.fetchone()
        except psycopg.Error as e:
            raise QueryExecutionError(f"Failed to get company by Stripe customer: {str(e)}")

    @staticmethod
    def log_subscription_event(
        conn: psycopg.Connection,
        cid: UUID,
        stripe_event_id: str,
        event_type: str,
        event_data: dict
    ) -> None:
        """
        Log a subscription event from Stripe webhook
        Uses ON CONFLICT to ensure idempotency (same event won't be logged twice)
        """
        try:
            sql = """
                INSERT INTO subscription_events
                (c_id, stripe_event_id, event_type, event_data)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (stripe_event_id) DO NOTHING
            """

            with conn.cursor() as cursor:
                cursor.execute(sql, (
                    str(cid),
                    stripe_event_id,
                    event_type,
                    json.dumps(event_data)
                ))
                conn.commit()
        except psycopg.Error as e:
            conn.rollback()
            raise QueryExecutionError(f"Failed to log subscription event: {str(e)}")

    @staticmethod
    def check_trial_expired(conn: psycopg.Connection, cid: UUID) -> bool:
        """
        Check if company trial has expired

        Returns:
            True if trial expired and no active subscription, False otherwise
        """
        try:
            sql = """
                SELECT trial_end_date, subscription_status
                FROM company
                WHERE cid = %s AND is_active = TRUE
            """

            with conn.cursor() as cursor:
                cursor.execute(sql, (str(cid),))
                result = cursor.fetchone()

                if not result:
                    return True  # Company not found, consider expired

                trial_end = result.get('trial_end_date')
                status = result.get('subscription_status')

                # If no trial end date set, assume still in trial
                if not trial_end:
                    return False

                # Check if trial ended and no active subscription
                now = datetime.now(timezone.utc)
                if now > trial_end and status not in ['active', 'trialing']:
                    return True

                return False
        except psycopg.Error as e:
            raise QueryExecutionError(f"Failed to check trial status: {str(e)}")

    @staticmethod
    def get_subscription_plan_by_price_id(
        conn: psycopg.Connection,
        price_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get subscription plan by Stripe price ID"""
        try:
            sql = """
                SELECT * FROM subscription_plans
                WHERE stripe_price_id = %s AND is_active = TRUE
            """
            with conn.cursor() as cursor:
                cursor.execute(sql, (price_id,))
                return cursor.fetchone()
        except psycopg.Error as e:
            raise QueryExecutionError(f"Failed to get plan by price ID: {str(e)}")

    @staticmethod
    def get_active_employee_count(conn: psycopg.Connection, cid: UUID) -> int:
        """
        Get count of active employees for a company
        This is used to determine subscription quantity
        """
        try:
            sql = """
                SELECT COUNT(*) as count
                FROM employee
                WHERE c_id = %s AND is_active = TRUE
            """
            with conn.cursor() as cursor:
                cursor.execute(sql, (str(cid),))
                result = cursor.fetchone()
                return result.get('count', 0) if result else 0
        except psycopg.Error as e:
            raise QueryExecutionError(f"Failed to get employee count: {str(e)}")
```

---

## Subscription Router & API Endpoints

**File**: `../tap-time-backend/postgresql/src/routers/subscription_router.py`

Replace the existing basic subscription router:

```python
"""
Subscription Router - Stripe integration
Handles all subscription-related API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from typing import Optional
from uuid import UUID
import psycopg
from datetime import datetime

from config.database import get_db_dependency
from config.settings import settings
from services.stripe_service import StripeService
from dao.subscription_dao import SubscriptionDAO
from models.common import SuccessResponse
from exceptions.custom_exceptions import TapTimeException

router = APIRouter(prefix="/subscription", tags=["Subscription"])

# Webhook secret from environment
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

@router.post("/create-checkout-session", response_model=dict)
def create_checkout_session(
    request_data: dict,
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Create Stripe Checkout session for subscription

    Request body:
    {
        "c_id": "company-uuid",
        "success_url": "https://app.taptime.com/profile?tab=subscription&session_id={CHECKOUT_SESSION_ID}",
        "cancel_url": "https://app.taptime.com/profile?tab=subscription"
    }

    Returns:
    {
        "session_id": "cs_test_...",
        "url": "https://checkout.stripe.com/pay/cs_test_...",
        "customer_id": "cus_..."
    }
    """
    try:
        c_id = UUID(request_data['c_id'])
        success_url = request_data['success_url']
        cancel_url = request_data['cancel_url']

        # Get company data
        sql = "SELECT * FROM company WHERE cid = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Get employee count (subscription quantity)
        employee_count = SubscriptionDAO.get_active_employee_count(db, c_id)
        if employee_count == 0:
            employee_count = 1  # Minimum 1 employee

        # Get active plan
        sql_plan = "SELECT * FROM subscription_plans WHERE is_active = TRUE LIMIT 1"
        with db.cursor() as cursor:
            cursor.execute(sql_plan)
            plan = cursor.fetchone()

        if not plan:
            raise HTTPException(status_code=500, detail="No active subscription plan found")

        price_id = plan['stripe_price_id']

        # Create or get Stripe customer
        stripe_customer_id = company.get('stripe_customer_id')

        if not stripe_customer_id:
            # Create new Stripe customer
            customer = StripeService.create_customer(
                email=company.get('email', company.get('adminmail', '')),
                company_name=company['companyname'],
                metadata={'company_id': str(c_id)}
            )
            stripe_customer_id = customer.id

            # Save customer ID to database
            SubscriptionDAO.update_company_stripe_data(
                db, c_id, stripe_customer_id=stripe_customer_id
            )

        # Create checkout session with employee count as quantity
        session = StripeService.create_checkout_session(
            customer_id=stripe_customer_id,
            price_id=price_id,
            quantity=employee_count,
            success_url=success_url,
            cancel_url=cancel_url,
            trial_days=14,  # 14-day trial
            metadata={'company_id': str(c_id), 'employee_count': employee_count}
        )

        return {
            "session_id": session.id,
            "url": session.url,
            "customer_id": stripe_customer_id,
            "employee_count": employee_count
        }

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(e)}")
    except TapTimeException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans", response_model=list)
def get_available_plans(db: psycopg.Connection = Depends(get_db_dependency)):
    """Get all available subscription plans"""
    try:
        sql = """
            SELECT * FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY unit_price
        """

        with db.cursor() as cursor:
            cursor.execute(sql)
            plans = cursor.fetchall()

        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{c_id}", response_model=dict)
def get_subscription_status(
    c_id: UUID,
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Get current subscription status for a company

    Returns subscription details, trial info, employee count, billing estimate
    """
    try:
        sql = "SELECT * FROM company WHERE cid = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Check if trial expired
        trial_expired = SubscriptionDAO.check_trial_expired(db, c_id)

        # Get employee count
        employee_count = SubscriptionDAO.get_active_employee_count(db, c_id)

        # Get device count (for display only)
        sql_devices = "SELECT COUNT(*) as count FROM device WHERE c_id = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql_devices, (str(c_id),))
            device_result = cursor.fetchone()
            device_count = device_result.get('count', 0) if device_result else 0

        # Get plan info
        sql_plan = "SELECT * FROM subscription_plans WHERE is_active = TRUE LIMIT 1"
        with db.cursor() as cursor:
            cursor.execute(sql_plan)
            plan = cursor.fetchone()

        unit_price = plan['unit_price'] if plan else 1.00
        monthly_estimate = float(employee_count) * float(unit_price)

        response = {
            "company_id": str(c_id),
            "subscription_status": company.get('subscription_status'),
            "stripe_customer_id": company.get('stripe_customer_id'),
            "stripe_subscription_id": company.get('stripe_subscription_id'),
            "trial_end_date": company.get('trial_end_date'),
            "current_period_end": company.get('current_period_end'),
            "cancel_at_period_end": company.get('cancel_at_period_end', False),
            "trial_expired": trial_expired,
            "employee_count": employee_count,
            "device_count": device_count,
            "unit_price": float(unit_price),
            "monthly_estimate": monthly_estimate,
        }

        # If has active subscription, fetch from Stripe for real-time data
        if company.get('stripe_subscription_id'):
            try:
                subscription = StripeService.get_subscription(company['stripe_subscription_id'])
                response['stripe_subscription_data'] = {
                    'status': subscription.status,
                    'current_period_end': subscription.current_period_end,
                    'cancel_at_period_end': subscription.cancel_at_period_end,
                    'trial_end': subscription.trial_end,
                    'quantity': subscription['items']['data'][0].quantity,
                }
            except:
                pass  # Fallback to DB data if Stripe fetch fails

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel/{c_id}", response_model=SuccessResponse)
def cancel_subscription(
    c_id: UUID,
    cancel_data: dict,
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Cancel a subscription

    Request body:
    {
        "immediate": false  # If true, cancel immediately; if false, cancel at period end
    }
    """
    try:
        sql = "SELECT * FROM company WHERE cid = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company or not company.get('stripe_subscription_id'):
            raise HTTPException(status_code=404, detail="No active subscription found")

        immediate = cancel_data.get('immediate', False)

        # Cancel in Stripe
        canceled_subscription = StripeService.cancel_subscription(
            company['stripe_subscription_id'],
            at_period_end=not immediate
        )

        # Update database
        if immediate:
            SubscriptionDAO.update_company_stripe_data(
                db, c_id,
                subscription_status='canceled',
                stripe_subscription_id=None
            )
        else:
            SubscriptionDAO.update_company_stripe_data(
                db, c_id,
                cancel_at_period_end=True
            )

        return SuccessResponse(
            message="Subscription canceled successfully",
            data={"canceled_at_period_end": not immediate}
        )
    except TapTimeException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-quantity/{c_id}", response_model=SuccessResponse)
def update_subscription_quantity(
    c_id: UUID,
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Sync employee count to Stripe subscription quantity
    Called when employees are added/removed
    """
    try:
        sql = "SELECT * FROM company WHERE cid = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company or not company.get('stripe_subscription_id'):
            # No subscription yet, skip update
            return SuccessResponse(message="No active subscription to update")

        # Get current employee count
        employee_count = SubscriptionDAO.get_active_employee_count(db, c_id)
        if employee_count == 0:
            employee_count = 1  # Minimum 1

        # Update Stripe subscription quantity
        updated_subscription = StripeService.update_subscription_quantity(
            company['stripe_subscription_id'],
            employee_count,
            proration_behavior='create_prorations'  # Prorate charges
        )

        return SuccessResponse(
            message="Subscription quantity updated",
            data={"employee_count": employee_count}
        )
    except TapTimeException as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer-portal/{c_id}", response_model=dict)
def create_customer_portal_session(
    c_id: UUID,
    portal_data: dict,
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Create Stripe Customer Portal session

    Request body:
    {
        "return_url": "https://app.taptime.com/profile?tab=subscription"
    }

    Returns:
    {
        "url": "https://billing.stripe.com/session/..."
    }
    """
    try:
        sql = "SELECT * FROM company WHERE cid = %s AND is_active = TRUE"
        with db.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company or not company.get('stripe_customer_id'):
            raise HTTPException(status_code=404, detail="Customer not found")

        return_url = portal_data['return_url']

        # Create portal session
        session = StripeService.create_customer_portal_session(
            company['stripe_customer_id'],
            return_url
        )

        return {"url": session.url}
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(e)}")
    except TapTimeException as e:
        raise HTTPException(status_code=500, detail=str(e))
```

*(Webhook endpoint continues in next section due to length)*

---

## Webhook Event Handlers

Add webhook endpoint to `subscription_router.py`:

```python
# ... (continuation of subscription_router.py)

@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: psycopg.Connection = Depends(get_db_dependency)
):
    """
    Stripe webhook endpoint
    Handles subscription lifecycle events from Stripe

    CRITICAL: This endpoint MUST verify webhook signatures for security
    """
    try:
        # Get raw body (needed for signature verification)
        payload = await request.body()

        # Verify webhook signature (SECURITY!)
        event = StripeService.construct_webhook_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )

        # Extract event data
        event_type = event['type']
        event_data = event['data']['object']

        print(f"Received webhook: {event_type}")

        # Handle different event types
        if event_type == 'customer.subscription.created':
            await handle_subscription_created(db, event_data)

        elif event_type == 'customer.subscription.updated':
            await handle_subscription_updated(db, event_data)

        elif event_type == 'customer.subscription.deleted':
            await handle_subscription_deleted(db, event_data)

        elif event_type == 'customer.subscription.trial_will_end':
            await handle_trial_will_end(db, event_data)

        elif event_type == 'invoice.paid':
            await handle_invoice_paid(db, event_data)

        elif event_type == 'invoice.payment_failed':
            await handle_invoice_payment_failed(db, event_data)

        elif event_type == 'checkout.session.completed':
            await handle_checkout_completed(db, event_data)

        return {"status": "success"}

    except TapTimeException:
        # Signature verification failed
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        # Log error but return 200 to prevent Stripe retries
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


# --- Webhook Event Handlers ---

async def handle_subscription_created(db: psycopg.Connection, subscription: dict):
    """Handle subscription.created event"""
    customer_id = subscription['customer']
    subscription_id = subscription['id']

    # Find company by Stripe customer ID
    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        print(f"Company not found for customer {customer_id}")
        return

    c_id = UUID(company['cid'])

    # Update company with subscription data
    SubscriptionDAO.update_company_stripe_data(
        db, c_id,
        stripe_subscription_id=subscription_id,
        subscription_status=subscription['status'],
        trial_end_date=datetime.fromtimestamp(subscription['trial_end']) if subscription.get('trial_end') else None,
        current_period_end=datetime.fromtimestamp(subscription['current_period_end']),
        cancel_at_period_end=subscription.get('cancel_at_period_end', False)
    )

    # Log event
    SubscriptionDAO.log_subscription_event(
        db, c_id, subscription['id'], 'subscription.created', subscription
    )

    print(f"Subscription created for company {c_id}")

async def handle_subscription_updated(db: psycopg.Connection, subscription: dict):
    """Handle subscription.updated event"""
    customer_id = subscription['customer']

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    # Update subscription status
    SubscriptionDAO.update_company_stripe_data(
        db, c_id,
        subscription_status=subscription['status'],
        current_period_end=datetime.fromtimestamp(subscription['current_period_end']),
        cancel_at_period_end=subscription.get('cancel_at_period_end', False)
    )

    SubscriptionDAO.log_subscription_event(
        db, c_id, subscription['id'], 'subscription.updated', subscription
    )

    print(f"Subscription updated for company {c_id}: status={subscription['status']}")

async def handle_subscription_deleted(db: psycopg.Connection, subscription: dict):
    """Handle subscription.deleted event (cancellation)"""
    customer_id = subscription['customer']

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    # Mark subscription as canceled
    SubscriptionDAO.update_company_stripe_data(
        db, c_id,
        subscription_status='canceled',
        stripe_subscription_id=None
    )

    SubscriptionDAO.log_subscription_event(
        db, c_id, subscription['id'], 'subscription.deleted', subscription
    )

    print(f"Subscription canceled for company {c_id}")

    # TODO: Send cancellation confirmation email

async def handle_trial_will_end(db: psycopg.Connection, subscription: dict):
    """Handle trial ending soon (Stripe sends 3 days before expiry)"""
    customer_id = subscription['customer']

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    SubscriptionDAO.log_subscription_event(
        db, c_id, subscription['id'], 'trial.will_end', subscription
    )

    print(f"Trial ending soon for company {c_id}")

    # TODO: Send email notification about trial ending

async def handle_invoice_paid(db: psycopg.Connection, invoice: dict):
    """Handle invoice.paid event"""
    customer_id = invoice['customer']

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    # Store invoice record
    sql = """
        INSERT INTO invoices
        (c_id, stripe_invoice_id, stripe_customer_id, amount_due, amount_paid,
         currency, status, invoice_date, paid_at, invoice_pdf_url, hosted_invoice_url,
         period_start, period_end, employee_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (stripe_invoice_id) DO UPDATE SET
        status = EXCLUDED.status,
        paid_at = EXCLUDED.paid_at,
        amount_paid = EXCLUDED.amount_paid
    """

    # Extract quantity (employee count) from invoice line items
    quantity = 0
    if invoice.get('lines') and invoice['lines'].get('data'):
        quantity = invoice['lines']['data'][0].get('quantity', 0)

    with db.cursor() as cursor:
        cursor.execute(sql, (
            str(c_id),
            invoice['id'],
            customer_id,
            invoice['amount_due'] / 100,  # Convert cents to dollars
            invoice['amount_paid'] / 100,
            invoice['currency'],
            invoice['status'],
            datetime.fromtimestamp(invoice['created']),
            datetime.fromtimestamp(invoice['status_transitions']['paid_at']) if invoice['status_transitions'].get('paid_at') else None,
            invoice.get('invoice_pdf'),
            invoice.get('hosted_invoice_url'),
            datetime.fromtimestamp(invoice['period_start']) if invoice.get('period_start') else None,
            datetime.fromtimestamp(invoice['period_end']) if invoice.get('period_end') else None,
            quantity
        ))
        db.commit()

    SubscriptionDAO.log_subscription_event(
        db, c_id, invoice['id'], 'invoice.paid', invoice
    )

    print(f"Invoice paid for company {c_id}: ${invoice['amount_paid']/100}")

async def handle_invoice_payment_failed(db: psycopg.Connection, invoice: dict):
    """Handle invoice.payment_failed event"""
    customer_id = invoice['customer']

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    # Update subscription status to past_due
    SubscriptionDAO.update_company_stripe_data(
        db, c_id,
        subscription_status='past_due'
    )

    SubscriptionDAO.log_subscription_event(
        db, c_id, invoice['id'], 'invoice.payment_failed', invoice
    )

    print(f"Payment failed for company {c_id}")

    # TODO: Send payment failed notification email

async def handle_checkout_completed(db: psycopg.Connection, session: dict):
    """Handle checkout.session.completed event"""
    customer_id = session['customer']
    subscription_id = session.get('subscription')

    company = SubscriptionDAO.get_company_by_stripe_customer(db, customer_id)
    if not company:
        return

    c_id = UUID(company['cid'])

    # Update company with subscription
    if subscription_id:
        SubscriptionDAO.update_company_stripe_data(
            db, c_id,
            stripe_subscription_id=subscription_id,
            subscription_status='trialing'  # Will be updated by subscription.created event
        )

    SubscriptionDAO.log_subscription_event(
        db, c_id, session['id'], 'checkout.completed', session
    )

    print(f"Checkout completed for company {c_id}")
```

**Security Note**: The `construct_webhook_event()` call verifies the Stripe signature. Never skip this verification!

---

## Trial Enforcement Middleware

**File**: `../tap-time-backend/postgresql/src/middleware/subscription_check.py`

```python
"""
Subscription Check Middleware
Enforces trial expiration and subscription requirements
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from dao.subscription_dao import SubscriptionDAO
from uuid import UUID

class SubscriptionCheckMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check subscription status on each request
    Blocks access if trial expired and no active subscription
    """

    # Routes that should be accessible even without subscription
    EXEMPT_ROUTES = [
        '/subscription',
        '/auth',
        '/health',
        '/docs',
        '/openapi.json',
        '/redoc',
    ]

    async def dispatch(self, request: Request, call_next):
        # Skip check for exempt routes
        path = request.url.path
        if any(path.startswith(route) for route in self.EXEMPT_ROUTES):
            response = await call_next(request)
            return response

        # Get company ID from request headers (set by auth middleware)
        company_id = request.headers.get('X-Company-ID')

        if company_id:
            try:
                c_id = UUID(company_id)
                db = request.app.state.db  # Database connection from app state

                # Check if trial expired
                trial_expired = SubscriptionDAO.check_trial_expired(db, c_id)

                if trial_expired:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail={
                            "error": "subscription_required",
                            "message": "Your trial has expired. Please subscribe to continue using TapTime.",
                            "action_url": "/subscription/create-checkout-session"
                        }
                    )
            except ValueError:
                pass  # Invalid UUID, skip check

        response = await call_next(request)
        return response
```

**To enable**: Add to `main.py`:
```python
from middleware.subscription_check import SubscriptionCheckMiddleware

# Add after CORS middleware
app.add_middleware(SubscriptionCheckMiddleware)
```

---

## Employee Count Sync

**File**: `../tap-time-backend/postgresql/src/controllers/employee_controller.py`

Add this logic after employee create/delete operations:

```python
from services.stripe_service import StripeService
from dao.subscription_dao import SubscriptionDAO

def sync_employee_count_to_stripe(conn: psycopg.Connection, c_id: UUID):
    """
    Sync employee count to Stripe subscription quantity
    Call this after adding or removing employees
    """
    try:
        # Get company
        sql = "SELECT stripe_subscription_id FROM company WHERE cid = %s"
        with conn.cursor() as cursor:
            cursor.execute(sql, (str(c_id),))
            company = cursor.fetchone()

        if not company or not company.get('stripe_subscription_id'):
            # No subscription yet, skip
            return

        # Get current employee count
        employee_count = SubscriptionDAO.get_active_employee_count(conn, c_id)
        if employee_count == 0:
            employee_count = 1  # Minimum 1

        # Update Stripe subscription quantity
        StripeService.update_subscription_quantity(
            company['stripe_subscription_id'],
            employee_count,
            proration_behavior='create_prorations'
        )

        print(f"Synced employee count to Stripe: {employee_count}")
    except Exception as e:
        print(f"Failed to sync employee count: {str(e)}")
        # Don't fail employee creation if Stripe sync fails
        pass

# Call this in employee create/delete endpoints:
# After successful employee creation:
sync_employee_count_to_stripe(db, company_id)
```

---

## Utility Scripts

### Script 1: Setup Stripe Products

**File**: `../tap-time-backend/postgresql/scripts/setup_stripe_products.py`

```python
"""
Setup Stripe products and prices via API
Run this once to create Stripe products programmatically
"""
import stripe
import os
import sys
from pathlib import Path

# Add parent directory to path to import settings
sys.path.append(str(Path(__file__).parent.parent))
from config.settings import settings

stripe.api_key = settings.STRIPE_API_KEY

def setup_stripe_products():
    """Create Stripe product and price for per-employee billing"""

    print("Creating Stripe product...")

    # Create product
    product = stripe.Product.create(
        name='TapTime - Per Employee',
        description='Monthly subscription: $1 per employee',
        metadata={
            'billing_model': 'per_employee',
        }
    )

    print(f"✓ Product created: {product.id}")

    # Create price (quantity-based)
    price = stripe.Price.create(
        product=product.id,
        unit_amount=100,  # $1.00 in cents
        currency='usd',
        recurring={'interval': 'month'},
    )

    print(f"✓ Price created: {price.id}")
    print()
    print("SUCCESS! Copy these IDs to your subscription_plans table:")
    print(f"  stripe_product_id: {product.id}")
    print(f"  stripe_price_id: {price.id}")
    print()
    print("SQL to update database:")
    print(f"""
    UPDATE subscription_plans
    SET
        stripe_product_id = '{product.id}',
        stripe_price_id = '{price.id}'
    WHERE plan_name = 'TapTime Per-Employee';
    """)

if __name__ == '__main__':
    setup_stripe_products()
```

**Run**: `python scripts/setup_stripe_products.py`

---

### Script 2: Grandfather Existing Users

**File**: `../tap-time-backend/postgresql/scripts/grandfather_existing_users.py`

```python
"""
Grant 14-day trial to all existing users
Run once during deployment
"""
import psycopg
from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config.database import get_db_connection

def grandfather_existing_users():
    """Grant trial to all active companies without subscription"""
    db = get_db_connection()

    try:
        trial_end = datetime.now(timezone.utc) + timedelta(days=14)

        sql = """
            UPDATE company
            SET
                subscription_status = 'trialing',
                trial_end_date = %s,
                last_modified_date_time = %s,
                last_modified_by = 'migration_script'
            WHERE is_active = TRUE
            AND stripe_customer_id IS NULL
            AND trial_end_date IS NULL
        """

        with db.cursor() as cursor:
            cursor.execute(sql, (trial_end, datetime.now(timezone.utc)))
            affected_rows = cursor.rowcount
            db.commit()

        print(f"✓ Granted 14-day trial to {affected_rows} existing companies")
        print(f"  Trial end date: {trial_end}")

        # TODO: Send notification emails to affected companies

    finally:
        db.close()

if __name__ == '__main__':
    grandfather_existing_users()
```

---

### Script 3: Daily Trial Expiration Check

**File**: `../tap-time-backend/postgresql/scripts/check_expired_trials.py`

```python
"""
Daily cron job to check for expired trials and send notifications
Schedule: 0 9 * * * (daily at 9 AM)
"""
import psycopg
from datetime import datetime, timezone
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config.database import get_db_connection
# from utils.email_service import send_trial_expired_email  # TODO: implement

def check_expired_trials():
    """Find and notify companies with expired trials"""
    db = get_db_connection()

    try:
        # Find companies with expired trials and no active subscription
        sql = """
            SELECT cid, companyname, email, trial_end_date
            FROM company
            WHERE trial_end_date IS NOT NULL
            AND trial_end_date < %s
            AND (subscription_status IS NULL OR subscription_status NOT IN ('active', 'trialing'))
            AND is_active = TRUE
        """

        with db.cursor() as cursor:
            cursor.execute(sql, (datetime.now(timezone.utc),))
            expired_companies = cursor.fetchall()

        for company in expired_companies:
            # TODO: Send trial expired email
            # send_trial_expired_email(
            #     to=company['email'],
            #     company_name=company['companyname'],
            #     trial_end_date=company['trial_end_date']
            # )

            print(f"Trial expired: {company['companyname']} ({company['email']})")

        print(f"Checked {len(expired_companies)} expired trials")

    finally:
        db.close()

if __name__ == '__main__':
    check_expired_trials()
```

**Crontab**:
```bash
0 9 * * * cd /path/to/backend && python scripts/check_expired_trials.py >> /var/log/trial_checks.log 2>&1
```

---

## Environment Configuration

**File**: `../tap-time-backend/postgresql/.env`

Add these variables:

```bash
# Stripe API Keys (from Stripe Dashboard)
STRIPE_API_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# For production:
# STRIPE_API_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**File**: `../tap-time-backend/postgresql/src/config/settings.py`

Add to settings class:

```python
from decouple import config

class Settings:
    # ... existing settings ...

    # Stripe configuration
    STRIPE_API_KEY: str = config('STRIPE_API_KEY')
    STRIPE_WEBHOOK_SECRET: str = config('STRIPE_WEBHOOK_SECRET')

settings = Settings()
```

---

## Testing & Verification

### 1. Database Verification

```bash
# Check tables created
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND table_name LIKE '%subscription%' OR table_name LIKE '%invoice%';
"

# Should see: subscription_plans, subscription_events, invoices
```

### 2. API Endpoint Testing

```bash
# Test plans endpoint
curl http://localhost:8000/subscription/plans

# Test webhook endpoint (should return 400 - invalid signature)
curl -X POST http://localhost:8000/subscription/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### 3. Stripe Integration Testing

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/subscription/webhook

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

### 4. End-to-End Test

1. Run backend locally: `uvicorn main:app --reload`
2. Create checkout session via API
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Check database for subscription data
5. Verify webhook events logged

---

## Common Issues & Fixes

### "No module named 'stripe'"
```bash
pip install stripe
```

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` in `.env`
- Ensure using correct secret (different for test vs live mode)
- Copy exact value from Stripe Dashboard → Webhooks → Endpoint → Signing secret

### Webhook not receiving events
- Ensure endpoint is publicly accessible (use ngrok for local testing)
- Check Stripe Dashboard → Webhooks → Event delivery
- Verify webhook URL is correct

### Employee count not syncing
- Check `sync_employee_count_to_stripe()` is called in employee create/delete
- Verify company has active subscription
- Check Stripe Dashboard → Subscriptions → Quantity field

---

## Next Steps

✅ Database migrations complete
✅ Stripe service layer implemented
✅ API endpoints created
✅ Webhook handlers configured
⏭️ Configure Stripe Dashboard (see `4-stripe-configuration.md`)
⏭️ Implement frontend (see `3-frontend-implementation.md`)

---

**Total Implementation Time**: 1-2 days for backend work
