import React, { useState, useEffect } from 'react';
import {
  getSubscriptionPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  cancelSubscription,
  createCustomerPortalSession
} from '../api';
import { STORAGE_KEYS } from '../constants';

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load plans and subscription status in parallel
      const [plansResponse, statusResponse] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionStatus(companyId)
      ]);

      if (plansResponse.success) {
        setPlans(plansResponse.plans);
      } else {
        setError(plansResponse.error);
      }

      if (statusResponse.success) {
        setSubscriptionStatus(statusResponse.data);
      } else {
        setError(statusResponse.error);
      }
    } catch (err) {
      setError('Failed to load subscription data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (planPriceId) => {
    setActionLoading(true);
    setError(null);

    try {
      const employeeCount = subscriptionStatus?.employee_count || 1;
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/profile?tab=subscription&success=true`;
      const cancelUrl = `${currentUrl}/profile?tab=subscription&canceled=true`;

      const response = await createCheckoutSession(
        companyId,
        planPriceId,
        employeeCount,
        successUrl,
        cancelUrl
      );

      if (response.success && response.data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        setError(response.error || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('Failed to start subscription');
      console.error('Start trial error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/profile?tab=subscription`;
      const response = await createCustomerPortalSession(companyId, returnUrl);

      if (response.success && response.portalUrl) {
        // Redirect to Stripe Customer Portal
        window.location.href = response.portalUrl;
      } else {
        setError(response.error || 'Failed to open billing portal');
      }
    } catch (err) {
      setError('Failed to open billing portal');
      console.error('Manage billing error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await cancelSubscription(companyId, true);

      if (response.success) {
        alert('Subscription will be canceled at the end of the billing period.');
        loadData(); // Reload data to show updated status
      } else {
        setError(response.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Cancel subscription error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const renderTrialStatus = () => {
    if (!subscriptionStatus) return null;

    const { subscription_status, trial_expired, days_remaining, trial_end_date } = subscriptionStatus;

    if (subscription_status === 'active') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-green-800 font-semibold mb-1">Active Subscription</h3>
          <p className="text-green-700 text-sm">
            Your subscription is active and in good standing.
          </p>
        </div>
      );
    }

    if (subscription_status === 'trialing') {
      return (
        <div className={`${trial_expired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-6`}>
          <h3 className={`${trial_expired ? 'text-red-800' : 'text-blue-800'} font-semibold mb-1`}>
            {trial_expired ? 'Trial Expired' : 'Free Trial Active'}
          </h3>
          <p className={`${trial_expired ? 'text-red-700' : 'text-blue-700'} text-sm`}>
            {trial_expired ? (
              'Your trial has expired. Subscribe now to continue using TapTime.'
            ) : (
              `You have ${days_remaining} day${days_remaining !== 1 ? 's' : ''} remaining in your free trial.`
            )}
          </p>
          {trial_end_date && (
            <p className={`${trial_expired ? 'text-red-600' : 'text-blue-600'} text-xs mt-1`}>
              Trial {trial_expired ? 'ended' : 'ends'} on {new Date(trial_end_date).toLocaleDateString()}
            </p>
          )}
        </div>
      );
    }

    if (subscription_status === 'past_due') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-800 font-semibold mb-1">Payment Issue</h3>
          <p className="text-yellow-700 text-sm">
            Your last payment failed. Please update your payment method to avoid service interruption.
          </p>
        </div>
      );
    }

    return null;
  };

  const renderCurrentUsage = () => {
    if (!subscriptionStatus) return null;

    const { employee_count, device_count } = subscriptionStatus;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-gray-800 font-semibold mb-3">Current Usage</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Employees</p>
            <p className="text-2xl font-bold text-gray-900">{employee_count}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Devices</p>
            <p className="text-2xl font-bold text-gray-900">{device_count}</p>
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Monthly billing: ${employee_count} (${employee_count} × $1/employee)
        </p>
      </div>
    );
  };

  const renderPlanCard = (plan) => {
    const isCurrentPlan = subscriptionStatus?.stripe_subscription_id !== null;
    const showStartButton = !isCurrentPlan && (!subscriptionStatus?.trial_expired || subscriptionStatus?.subscription_status !== 'active');

    return (
      <div key={plan.plan_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.plan_description}</p>

        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">${plan.price_per_employee}</span>
            <span className="text-gray-600 ml-2">/employee/month</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">Includes:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ {plan.trial_period_days}-day free trial</li>
            <li>✓ Unlimited devices</li>
            <li>✓ All features included</li>
            <li>✓ Pay only for active employees</li>
          </ul>
        </div>

        {showStartButton && (
          <button
            onClick={() => handleStartTrial(plan.stripe_price_id)}
            disabled={actionLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Loading...' : `Start ${plan.trial_period_days}-Day Free Trial`}
          </button>
        )}

        {isCurrentPlan && (
          <div className="bg-blue-50 text-blue-700 text-center py-2 px-4 rounded-md font-medium">
            Current Plan
          </div>
        )}
      </div>
    );
  };

  const renderSubscriptionActions = () => {
    if (!subscriptionStatus?.stripe_customer_id) return null;

    const hasActiveSubscription = subscriptionStatus?.subscription_status === 'active' ||
                                   subscriptionStatus?.subscription_status === 'trialing';

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Subscription</h3>

        <div className="space-y-3">
          <button
            onClick={handleManageBilling}
            disabled={actionLoading}
            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {actionLoading ? 'Loading...' : 'Manage Billing & Invoices'}
          </button>

          {hasActiveSubscription && !subscriptionStatus.cancel_at_period_end && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Cancel Subscription'}
            </button>
          )}

          {subscriptionStatus.cancel_at_period_end && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                Subscription will be canceled on {new Date(subscriptionStatus.current_period_end).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInvoices = () => {
    if (!subscriptionStatus?.recent_invoices || subscriptionStatus.recent_invoices.length === 0) {
      return null;
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
        <div className="space-y-2">
          {subscriptionStatus.recent_invoices.map((invoice) => (
            <div key={invoice.invoice_id} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600">
                  {invoice.employee_count} employees
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  ${invoice.amount_paid.toFixed(2)}
                </p>
                <p className={`text-xs ${invoice.invoice_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {invoice.invoice_status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {renderTrialStatus()}
      {renderCurrentUsage()}
      {renderSubscriptionActions()}
      {renderInvoices()}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {plans.map(renderPlanCard)}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-gray-600">
          Need help? Contact us at <a href="mailto:support@taptime.com" className="text-blue-600 hover:underline">support@taptime.com</a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
