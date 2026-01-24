import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationSuccessModal from '../components/ui/RegistrationSuccessModal';
import Header from "../components/layout/Header";
import { Loader2 } from "lucide-react";

/**
 * RegisterSuccess - NEW WEBHOOK-BASED FLOW
 *
 * After Stripe payment completes, the webhook automatically:
 * 1. Retrieves pending registration data
 * 2. Creates Supabase auth account
 * 3. Uploads company logo
 * 4. Links Stripe subscription
 * 5. Sends password setup email
 *
 * This page just shows success message - no API calls needed!
 */
const RegisterSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    console.log('✅ Payment successful - Webhook is creating your account');

    // Show loading spinner briefly for better UX
    const timer = setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);

      // Auto-redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16 sm:pt-20 md:pt-24">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Payment Successful!</h2>
            <p className="text-sm sm:text-base text-gray-600">Setting up your account...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      {showSuccessModal && (
        <RegistrationSuccessModal isOpen={showSuccessModal} />
      )}
    </>
  );
};

export default RegisterSuccess;
