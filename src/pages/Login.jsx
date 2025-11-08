import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

const Login_new = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signOut, user, session, loading: authLoading, fetchBackendUserData } = useAuth();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // Handle OAuth callback - fetch backend data after Google login redirect
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if this is an OAuth callback using sessionStorage flag (not URL)
      // URL parameter 'code' gets cleaned by Supabase before we can check it
      const isOAuthFlow = sessionStorage.getItem('pending_oauth_callback') === 'true';

      // Debug: Log all condition values and full diagnostic info
      console.log('=== OAUTH CALLBACK DIAGNOSTIC ===');
      console.log('Full URL:', window.location.href);
      console.log('Search params:', window.location.search);
      console.log('Has code in URL:', window.location.search.includes('code'));
      console.log('OAuth flag in sessionStorage:', isOAuthFlow);
      console.log('Condition values:', {
        isOAuthFlow,
        authLoading,
        hasSession: !!session,
        hasUser: !!user,
        userEmail: user?.email,
        isProcessingOAuth,
        hasCompanyID: !!localStorage.getItem('companyID'),
        companyID: localStorage.getItem('companyID')
      });
      console.log('================================');

      // Check if we have a session and user, but haven't processed backend data yet
      // Wait for authLoading to complete before checking session/user
      if (isOAuthFlow && !authLoading && session && user && !isProcessingOAuth && !localStorage.getItem('companyID')) {
        console.log('✅ Google OAuth callback triggered - all conditions met!');
        console.log('Will call login_check API for:', user.email);
        setIsProcessingOAuth(true);
        setLoading(true);

        try {
          // Extract user data from Supabase session (after Google OAuth redirect)
          const userEmail = user.email;
          const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
          const userPicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

          console.log('Calling custom login_check API for Google user:', userEmail);

          // Validate email with backend and fetch company/timezone/customer data
          const result = await fetchBackendUserData(userEmail, userName, userPicture);

          console.log('Custom API response:', result.success ? 'Success' : 'Failed', result);

          if (result.success) {
            // Clear OAuth flag after successful processing
            sessionStorage.removeItem('pending_oauth_callback');
            console.log('✅ OAuth callback completed successfully, flag cleared');
            showToast('Login successful! Welcome back.', 'success');

            // Redirect to employee list after successful data fetch
            setTimeout(() => navigate('/employee-management'), 1500);
          } else {
            // If backend validation fails, sign out from Supabase and show error
            sessionStorage.removeItem('pending_oauth_callback');
            await signOut();
            showToast(result.error || 'Failed to validate user. Please contact your administrator.', 'error');
            setLoading(false);
          }
        } catch (error) {
          // Sign out on error and show error message
          sessionStorage.removeItem('pending_oauth_callback');
          await signOut();
          showToast('Failed to complete authentication', 'error');
          setLoading(false);
        }
      } else if (user && localStorage.getItem('companyID')) {
        // User already has data, redirect directly
        navigate('/employee-management');
      }
    };

    handleOAuthCallback();
  }, [session, user, authLoading, navigate, isProcessingOAuth, fetchBackendUserData, signOut]); // Added authLoading to re-run when loading completes

  const handleEmailLogin = async (e) => {
    e?.preventDefault();

    if (!email || !password) {
      showToast("Please enter both email and password", 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address", 'error');
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showToast("Invalid email or password", 'error');
        } else if (error.message.includes("Email not confirmed")) {
          showToast("Please verify your email before logging in", 'error');
        } else {
          showToast(error.message || "Authentication failed", 'error');
        }
        return;
      }

      if (data?.user) {
        // Step 2: Store Supabase user info
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userId", data.user.id);

        // Extract user metadata
        const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
        const userPicture = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '';

        // Step 3: Validate email with backend and fetch company/timezone/customer data
        const result = await fetchBackendUserData(data.user.email, userName, userPicture);

        if (!result.success) {
          // If backend validation fails, sign out from Supabase and show error
          await signOut();
          showToast(result.error || 'Failed to validate user. Please contact your administrator.', 'error');
          setLoading(false);
          return;
        }

        // Step 4: Navigate to employee list after successful backend validation
        showToast('Login successful! Welcome back.', 'success');
        setTimeout(() => navigate("/employee-management"), 1500);
      }
    } catch (err) {
      showToast("Authentication failed. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    // Set flag to track OAuth flow - this survives the redirect
    sessionStorage.setItem('pending_oauth_callback', 'true');
    console.log('Setting pending_oauth_callback flag before OAuth redirect');

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        // Clear flag on error
        sessionStorage.removeItem('pending_oauth_callback');
        showToast(error.message || "Google Sign-In failed", 'error');
        setLoading(false);
      }
      // Note: After successful Google login, the user will be redirected
      // by Supabase, so we don't need to navigate manually here
    } catch (err) {
      // Clear flag on error
      sessionStorage.removeItem('pending_oauth_callback');
      showToast("Google Sign-In failed. Please try again.", 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <Header isAuthenticated={false} />
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left side - Brand section */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-6 lg:p-8 xl:p-12">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 lg:space-y-8">
            {/* Brand Logo - displays directly on light blue background */}
            <img
              src="/images/tap-time-logo.png"
              alt="Tap-Time Logo"
              className="w-40 lg:w-48 xl:w-56 mx-auto"
            />
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex gap-4 lg:gap-8 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex justify-center items-center min-h-screen py-6 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20">
          <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 mt-20">
            <CardHeader className="space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
                Welcome back!
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Error Alert */}
              {errorMsg && (
                <Alert variant="destructive" className="border-red-200">
                  <AlertDescription className="text-sm">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-10 sm:h-11"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a
                      href="/forget-password"
                      className="text-sm text-[#02066F] hover:underline font-medium"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-10 sm:h-11 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-[#02066F] hover:bg-[#030974] text-white font-semibold text-sm sm:text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 sm:h-11 border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              {/* Sign up link */}
              <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="font-semibold text-[#02066F] hover:underline"
                >
                  Sign up
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Login_new;

