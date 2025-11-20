import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Mail, Lock } from "lucide-react";
import tabTimeLogo from "../assets/images/tap-time-logo.png";

const Login = () => {
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
      const isOAuthFlow = sessionStorage.getItem('pending_oauth_callback') === 'true';

      if (isOAuthFlow && !authLoading && session && user && !isProcessingOAuth && !localStorage.getItem('companyID')) {
        setIsProcessingOAuth(true);
        setLoading(true);

        try {
          const userEmail = user.email;
          const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
          const userPicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

          const result = await fetchBackendUserData(userEmail, userName, userPicture);

          if (result.success) {
            sessionStorage.removeItem('pending_oauth_callback');
            showToast('Login successful! Welcome back.', 'success');
            setTimeout(() => navigate('/employee-management'), 1500);
          } else {
            sessionStorage.removeItem('pending_oauth_callback');
            await signOut();
            showToast(result.error || 'Failed to validate user. Please contact your administrator.', 'error');
            setLoading(false);
          }
        } catch (error) {
          sessionStorage.removeItem('pending_oauth_callback');
          await signOut();
          showToast('Failed to complete authentication', 'error');
          setLoading(false);
        }
      } else if (user && localStorage.getItem('companyID')) {
        navigate('/employee-management');
      }
    };

    handleOAuthCallback();
  }, [session, user, authLoading, navigate, isProcessingOAuth, fetchBackendUserData, signOut]);

  const handleEmailLogin = async (e) => {
    e?.preventDefault();

    if (!email || !password) {
      showToast("Please enter both email and password", 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address", 'error');
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
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


        const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
        const userPicture = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '';

        const result = await fetchBackendUserData(data.user.email, userName, userPicture);

        if (!result.success) {
          await signOut();
          showToast(result.error || 'Failed to validate user. Please contact your administrator.', 'error');
          setLoading(false);
          return;
        }

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

    sessionStorage.setItem('pending_oauth_callback', 'true');

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        sessionStorage.removeItem('pending_oauth_callback');
        showToast(error.message || "Google Sign-In failed", 'error');
        setLoading(false);
      }
    } catch (err) {
      sessionStorage.removeItem('pending_oauth_callback');
      showToast("Google Sign-In failed. Please try again.", 'error');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header Navigation */}
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-2">
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

      <div className="min-h-screen flex flex-col md:flex-row pt-20 md:pt-0">
        {/* Left side - Brand section (hidden on mobile) */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-12 md:pt-32">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
            {/* Brand Logo */}
            <img
              src={tabTimeLogo}
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
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center py-12 px-6 mt-15 sm:px-8 md:px-12 lg:px-20">
          <div className="w-full max-w-md">
            {/* Logo (visible on mobile only) */}
            <div className="text-center mb-8 md:hidden">
              <img src={tabTimeLogo} alt="TabTime Logo" className="mx-auto h-20 w-auto sm:h-25" />
            </div>

            <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
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
              
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full bg-[#01005a] hover:bg-[#01005a]/90" size="lg" disabled={loading}>
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

            <div className="text-center mt-8">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;