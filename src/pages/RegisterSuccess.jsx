import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import RegistrationSuccessModal from '../components/ui/RegistrationSuccessModal';
import Header from "../components/layout/Header";
import { Loader2, AlertCircle } from "lucide-react";

const RegisterSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper function to convert base64 back to File
  const base64ToFile = (base64, filename) => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        // 1. Get session_id from URL
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          setError('Invalid session. Please try registering again.');
          setLoading(false);
          return;
        }

        // 2. Retrieve registration data from localStorage
        const registrationData = localStorage.getItem('pendingRegistration');
        const logoData = localStorage.getItem('pendingRegistrationLogo');
        const logoName = localStorage.getItem('pendingRegistrationLogoName');

        if (!registrationData) {
          setError('Registration data not found. Please try registering again.');
          setLoading(false);
          return;
        }

        const submitData = JSON.parse(registrationData);

        // 3. Convert base64 back to File if logo exists
        let companyLogo = null;
        if (logoData && logoName) {
          companyLogo = base64ToFile(logoData, logoName);
        }

        // 4. Call sign_up API with Stripe session_id
        const response = await registerUser(submitData, companyLogo, sessionId);

        if (response.success) {
          // 5. Clear localStorage
          localStorage.removeItem('pendingRegistration');
          localStorage.removeItem('pendingRegistrationLogo');
          localStorage.removeItem('pendingRegistrationLogoName');

          // 6. Show success modal
          setLoading(false);
          setShowSuccessModal(true);
        } else {
          const errorMessage = response.error || response.message || 'Registration failed';
          setError(errorMessage);
          setLoading(false);
        }
      } catch (error) {
        console.error('Registration error:', error);
        setError('An unexpected error occurred. Please contact support.');
        setLoading(false);
      }
    };

    completeRegistration();
  }, [searchParams]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16 sm:pt-20 md:pt-24">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Processing your registration...</h2>
            <p className="text-sm sm:text-base text-gray-600">Please wait while we complete your setup.</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-16 sm:pt-20 md:pt-24 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center">Registration Error</h2>
            <p className="text-sm sm:text-base text-gray-600 text-center">{error}</p>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Go to Login
              </button>
            </div>
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
