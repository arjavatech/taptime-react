import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header1 from "./Navbar/Header1";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Alert, AlertDescription } from "./alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Loader2 } from "lucide-react";

const Login_new = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signOut, user, session, fetchBackendUserData } = useAuth();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  // Handle OAuth callback - fetch backend data after Google login redirect
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Only run if this is a redirect from Google OAuth (has code in URL)
      const isOAuthRedirect = window.location.search.includes('code');

      // Check if we have a session and user, but haven't processed backend data yet
      if (isOAuthRedirect && session && user && !isProcessingOAuth && !localStorage.getItem('companyID')) {
        setIsProcessingOAuth(true);
        setLoading(true);

        try {
          // Extract user data from Supabase session (after Google OAuth redirect)
          const userEmail = user.email;
          const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
          const userPicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

          // Validate email with backend and fetch company/timezone/customer data
          const result = await fetchBackendUserData(userEmail, userName, userPicture);

          if (result.success) {
            // Redirect to employee list after successful data fetch
            navigate('/employee-management');
          } else {
            // If backend validation fails, sign out from Supabase and show error
            await signOut();
            setErrorMsg(result.error || 'Failed to validate user. Please contact your administrator.');
            setLoading(false);
          }
        } catch (error) {
          // Sign out on error and show error message
          await signOut();
          setErrorMsg('Failed to complete authentication');
          setLoading(false);
        }
      } else if (user && localStorage.getItem('companyID')) {
        // User already has data, redirect directly
        navigate('/employee-management');
      }
    };

    handleOAuthCallback();
  }, [session, user, navigate, isProcessingOAuth]); // Removed fetchBackendUserData (now memoized)

  const handleEmailLogin = async (e) => {
    e?.preventDefault();

    if (!email || !password) {
      setErrorMsg("Please enter both email and password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg("Invalid email or password");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMsg("Please verify your email before logging in");
        } else {
          setErrorMsg(error.message || "Authentication failed");
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
          setErrorMsg(result.error || 'Failed to validate user. Please contact your administrator.');
          setLoading(false);
          return;
        }

        // Step 4: Navigate to employee list after successful backend validation
        navigate("/employee-management");
      }
    } catch (err) {
      setErrorMsg("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setErrorMsg(error.message || "Google Sign-In failed");
        setLoading(false);
      }
      // Note: After successful Google login, the user will be redirected
      // by Supabase, so we don't need to navigate manually here
    } catch (err) {
      setErrorMsg("Google Sign-In failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header1 />
      <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left side - Brand section */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-12">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
            {/* Brand Logo - displays directly on light blue background */}
            <img
              src="/images/tap-time-logo.png"
              alt="Tap-Time Logo"
              className="w-48 xl:w-56 md:w-40 mx-auto"
            />
            <div className="space-y-4">
              <h1 className="text-3xl xl:text-4xl md:text-3xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex gap-8 text-gray-600 text-sm">
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
        <div className="w-full md:w-1/2 flex justify-center items-center py-12 px-6 sm:px-8 md:px-12 lg:px-20">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-3xl font-bold text-center">
                Welcome back!
              </CardTitle>
              <CardDescription className="text-center text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
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
                    className="h-11"
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
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11"
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#02066F] hover:bg-[#030974] text-white font-semibold"
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
                className="w-full h-11 border-gray-300 hover:bg-gray-50"
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
              <p className="text-center text-sm text-muted-foreground pt-2">
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
