import React, { useState } from 'react';
import { useAccountDeletionCheck } from '../hooks/useAccountDeletionCheck';
import { Button } from './ui/button';
import { googleSignInCheck } from '../api';

/**
 * Test component to manually trigger account deletion check
 * This can be used for testing or added to admin panels
 */
const AccountDeletionTest = () => {
  const { triggerCheck } = useAccountDeletionCheck();
  const [result, setResult] = useState('');

  const handleTestCheck = async () => {
    try {
      const isDeleted = await triggerCheck();
      if (!isDeleted) {
        setResult('Account is still active');
      } else {
        setResult('Account deletion detected!');
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const handleDirectAPITest = async () => {
    try {
      const email = localStorage.getItem('adminMail') || 'test@example.com';
      const result = await googleSignInCheck(email);
      setResult(`API Result: ${JSON.stringify(result)}`);
    } catch (error) {
      setResult(`API Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Account Status Check</h3>
      <div className="space-y-2 mb-4">
        <Button onClick={handleTestCheck} variant="outline">
          Check Account Status
        </Button>
        <Button onClick={handleDirectAPITest} variant="outline">
          Direct API Test
        </Button>
      </div>
      {result && (
        <div className="p-2 bg-gray-100 rounded text-sm">
          {result}
        </div>
      )}
    </div>
  );
};

export default AccountDeletionTest;