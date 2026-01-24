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
  const [debugInfo, setDebugInfo] = useState({
    sessionId: null,
    hasStorageData: false,
    apiCalled: false,
    apiError: null
  });

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
      console.log('=== RegisterSuccess: Component Mounted ===');

      // Set timeout protection (30 seconds)
      const timeout = setTimeout(() => {
        console.error('TIMEOUT: Registration taking too long');
        setError('Registration is taking too long. Please contact support if this persists.');
        setLoading(false);
      }, 30000);

      try {
        // 1. Get session_id from URL
        const sessionId = searchParams.get('session_id');
        console.log('1. Session ID from URL:', sessionId);
        setDebugInfo(prev => ({ ...prev, sessionId }));

        if (!sessionId) {
          console.error('FAILED: No session_id in URL');
          setError('Invalid session. Please try registering again.');
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        // 2. Retrieve registration data from sessionStorage
        const registrationData = sessionStorage.getItem('pendingRegistration');
        const logoData = sessionStorage.getItem('pendingRegistrationLogo');
        const logoName = sessionStorage.getItem('pendingRegistrationLogoName');

        console.log('2. Registration data exists:', !!registrationData);
        console.log('   Logo data exists:', !!logoData);
        setDebugInfo(prev => ({ ...prev, hasStorageData: !!registrationData }));

        if (!registrationData) {
          console.error('FAILED: No registration data in sessionStorage');
          console.log('Available sessionStorage keys:', Object.keys(sessionStorage));
          setError('Registration data lost. This can happen if you cleared your browser data or waited too long. Please try registering again.');
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        const submitData = JSON.parse(registrationData);
        console.log('3. Parsed registration data for email:', submitData.email);

        // 3. Convert base64 back to File if logo exists
        let companyLogo = null;
        if (logoData && logoName) {
          companyLogo = base64ToFile(logoData, logoName);
          console.log('4. Company logo converted:', logoName);
        }

        // 4. Call sign_up API with Stripe session_id
        console.log('5. Calling registerUser API...');
        setDebugInfo(prev => ({ ...prev, apiCalled: true }));
        const response = await registerUser(submitData, companyLogo, sessionId);
        console.log('6. API response received:', response.success ? 'SUCCESS' : 'FAILED');

        clearTimeout(timeout);

        if (response.success) {
          // 5. Clear sessionStorage
          sessionStorage.removeItem('pendingRegistration');
          sessionStorage.removeItem('pendingRegistrationLogo');
          sessionStorage.removeItem('pendingRegistrationLogoName');
          console.log('7. sessionStorage cleared, showing success modal');

          // 6. Show success modal
          setLoading(false);
          setShowSuccessModal(true);
        } else {
          const errorMessage = response.error || response.message || 'Registration failed';
          console.error('API Error:', errorMessage);
          setDebugInfo(prev => ({ ...prev, apiError: errorMessage }));
          setError(errorMessage);
          setLoading(false);
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error('=== RegisterSuccess ERROR ===', error);
        console.error('Error stack:', error.stack);
        setDebugInfo(prev => ({ ...prev, apiError: error.message }));
        setError(error.message || 'An unexpected error occurred. Please contact support.');
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

            {/* Debug info for troubleshooting */}
            <details className="bg-gray-50 p-3 rounded text-xs">
              <summary className="cursor-pointer font-semibold">Debug Information</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>

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
