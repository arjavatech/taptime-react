import React from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { Button } from './ui/button';

const SubscriptionSwitchTest = () => {
  const { validateCurrentCompanySubscription, currentCompany, userCompanies } = useCompany();

  const handleTestSwitch = async () => {
    console.log('Testing subscription validation and auto-switch...');
    const result = await validateCurrentCompanySubscription();
    console.log('Validation result:', result);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-2">Subscription Auto-Switch Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Current Company: {currentCompany?.company_name || currentCompany?.CName || 'None'}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Total Companies: {userCompanies.length}
      </p>
      <Button onClick={handleTestSwitch} variant="outline">
        Test Subscription Validation
      </Button>
    </div>
  );
};

export default SubscriptionSwitchTest;