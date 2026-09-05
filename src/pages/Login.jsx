import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Eye, EyeOff, Mail, Lock, Crown, Shield, User, Check, AlertCircle } from "lucide-react";
import tabTimeLogo from "../assets/images/tap-time-logo.png";
import GoogleLoginRestrictionModal from "../components/ui/GoogleLoginRestrictionModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('owner');
  const [rememberMe, setRememberMe] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showGoogleRestrictionModal, setShowGoogleRestrictionModal] = useState(false);
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signOut, user, session, loading: authLoading, fetchBackendUserData } = useAuth();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const fetchBackendUserDataRef = useRef(fetchBackendUserData);

  // Update ref when fetchBackendUserData changes
  useEffect(() => {
    fetchBackendUserDataRef.current = fetchBackendUserData;
  }, [fetchBackendUserData]);

  // Clear companyID from localStorage when login page loads
  useEffect(() => {
    localStorage.removeItem('companyID');
  }, []);

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
          const userPicture = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          const result = await fetchBackendUserDataRef.current(userEmail, userName, userPicture, 'google');

          if (result.success) {
            sessionStorage.removeItem('pending_oauth_callback');
            navigate(result.userType === 'Employee' ? '/my-profile' : '/employee-management');
          } else {
            sessionStorage.removeItem('pending_oauth_callback');
            await signOut();
            setLoading(false);
          }
        } catch (error) {
          sessionStorage.removeItem('pending_oauth_callback');
          await signOut();
          setLoading(false);
        }
      } else if (user && localStorage.getItem('companyID')) {
        navigate(localStorage.getItem('adminType') === 'Employee' ? '/my-profile' : '/employee-management');
      }
    };

    handleOAuthCallback();
  }, [session, user, authLoading, navigate, isProcessingOAuth, signOut]); // Removed fetchBackendUserData from dependencies

  const handleEmailLogin = async (e) => {
    e?.preventDefault();

    // Clear previous errors
    setEmailError("");
    setLoginError("");

    let hasErrors = false;

    // Validate email
    if (!email) {
      setEmailError("Email is required");
      hasErrors = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address");
        hasErrors = true;
      }
    }

    // Validate password
    if (!password) {
      setLoginError("Password is required");
      hasErrors = true;
    }

    // Check remember me checkbox - remove forced requirement
    // if (!rememberMe) {
    //   setShowTooltip(true);
    //   setTimeout(() => setShowTooltip(false), 3000);
    //   return;
    // }

    // Return early if validation fails
    if (hasErrors) {
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signInWithEmail(email, password, rememberMe);

      if (error) {
        setLoginError("Invalid user name or password");
        return;
      }

      if (data?.user) {
        const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
        const userPicture = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;

        const result = await fetchBackendUserDataRef.current(data.user.email, userName, userPicture, 'email');

        if (!result.success) {
          await signOut();
          setLoginError("Invalid user name or password");
          setLoading(false);
          return;
        }

        navigate(result.userType === 'Employee' ? '/my-profile' : '/employee-management');
      }
    } catch (err) {
      setLoginError("Invalid user name or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");

    sessionStorage.setItem('pending_oauth_callback', 'true');

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        sessionStorage.removeItem('pending_oauth_callback');
        setLoginError("Google Sign-In failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      sessionStorage.removeItem('pending_oauth_callback');
      setLoginError("Google Sign-In failed. Please try again.");
      setLoading(false);
    }
  };

  // Check if OAuth callback is currently being processed
  const isProcessingOAuthCallback = sessionStorage.getItem('pending_oauth_callback') === 'true' && session && user;

  // If processing OAuth callback, show loading overlay instead of login form
  if (isProcessingOAuthCallback) {
    return (
      <>
        <Header />
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header Navigation */}
      <Header />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col lg:flex-row pt-14 sm:pt-16 md:pt-18 lg:pt-0">
        {/* Left side - Brand section (hidden on mobile and tablet) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-6 lg:p-8 xl:p-12 lg:pt-24 xl:pt-32">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 lg:space-y-8">
            {/* Brand Logo */}
            <img
              src={tabTimeLogo}
              alt="Tap-Time Logo"
              className="w-32 lg:w-40 xl:w-48 2xl:w-56 mx-auto"
            />
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed px-4">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6 xl:gap-8 text-gray-600 text-sm">
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
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center  py-4 sm:py-6 md:py-8 lg:py-25 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4.5rem)] lg:min-h-screen">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mt-8 sm:mt-10 md:mt-12 lg:mt-0">
            {/* Logo (visible on mobile and tablet only) */}
            {/* <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:hidden">
              <img src={tabTimeLogo} alt="TabTime Logo" className="mx-auto h-12 sm:h-16 md:h-20 w-auto" />
            </div> */}

            {/* Unified Login Section */}
            <Card className="border-0 shadow-md sm:shadow-lg md:shadow-2xl bg-gradient-to-br from-white via-gray-50/50 to-white backdrop-blur-sm">
              {/* Role selection */}
              <CardContent className="p-3 sm:p-4 md:p-6 lg:p-8">
                <div className="mb-5 text-center sm:mb-6">
                  {/* <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#01005a]">Secure sign in</p> */}
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Select your access</h2>
                  {/* <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-slate-500">Choose the option that best describes how you use TapTime.</p> */}
                </div>

                <div className="mb-6 grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Select your TapTime access">
                  <button type="button" role="radio" aria-checked={selectedRole === 'owner'} onClick={() => handleRoleSelect('owner')} className={`group relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#01005a] focus:ring-offset-2 sm:min-h-[116px] sm:gap-2 sm:rounded-xl sm:p-3 ${selectedRole === 'owner' ? 'border-[#01005a] bg-gradient-to-b from-[#01005a]/[0.09] to-transparent shadow-md shadow-[#01005a]/10' : 'border-slate-200 bg-white hover:border-[#01005a]/30 hover:bg-slate-50 hover:shadow-sm'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors sm:h-10 sm:w-10 sm:rounded-xl ${selectedRole === 'owner' ? 'bg-[#01005a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-[#01005a]/10 group-hover:text-[#01005a]'}`}><Crown className="h-4 w-4 sm:h-5 sm:w-5" /></span>
                    <span className="min-w-0"><span className="block text-xs font-semibold text-slate-900 sm:text-sm">Owner</span></span>
                    <span className={`absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full border transition-colors ${selectedRole === 'owner' ? 'border-[#01005a] bg-[#01005a] text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-[#01005a]/50'}`}><Check className="h-2.5 w-2.5" /></span>
                  </button>
                  <button type="button" role="radio" aria-checked={selectedRole === 'admin'} onClick={() => handleRoleSelect('admin')} className={`group relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#01005a] focus:ring-offset-2 sm:min-h-[116px] sm:gap-2 sm:rounded-xl sm:p-3 ${selectedRole === 'admin' ? 'border-[#01005a] bg-gradient-to-b from-[#01005a]/[0.09] to-transparent shadow-md shadow-[#01005a]/10' : 'border-slate-200 bg-white hover:border-[#01005a]/30 hover:bg-slate-50 hover:shadow-sm'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors sm:h-10 sm:w-10 sm:rounded-xl ${selectedRole === 'admin' ? 'bg-[#01005a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-[#01005a]/10 group-hover:text-[#01005a]'}`}><Shield className="h-4 w-4 sm:h-5 sm:w-5" /></span>
                    <span className="min-w-0"><span className="block text-xs font-semibold text-slate-900 sm:text-sm">Administrator</span></span>
                    <span className={`absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full border transition-colors ${selectedRole === 'admin' ? 'border-[#01005a] bg-[#01005a] text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-[#01005a]/50'}`}><Check className="h-2.5 w-2.5" /></span>
                  </button>
                  <button type="button" role="radio" aria-checked={selectedRole === 'employee'} onClick={() => handleRoleSelect('employee')} className={`group relative flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#01005a] focus:ring-offset-2 sm:min-h-[116px] sm:gap-2 sm:rounded-xl sm:p-3 ${selectedRole === 'employee' ? 'border-[#01005a] bg-gradient-to-b from-[#01005a]/[0.09] to-transparent shadow-md shadow-[#01005a]/10' : 'border-slate-200 bg-white hover:border-[#01005a]/30 hover:bg-slate-50 hover:shadow-sm'}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors sm:h-10 sm:w-10 sm:rounded-xl ${selectedRole === 'employee' ? 'bg-[#01005a] text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-[#01005a]/10 group-hover:text-[#01005a]'}`}><User className="h-4 w-4 sm:h-5 sm:w-5" /></span>
                    <span className="min-w-0"><span className="block text-xs font-semibold text-slate-900 sm:text-sm">Employee</span></span>
                    <span className={`absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full border transition-colors ${selectedRole === 'employee' ? 'border-[#01005a] bg-[#01005a] text-white' : 'border-slate-300 bg-white text-transparent group-hover:border-[#01005a]/50'}`}><Check className="h-2.5 w-2.5" /></span>
                  </button>
                </div>

                {/* Login Form - Shows Below Role Cards */}
                <div className="border-t border-gray-200 pt-3 sm:pt-4 md:pt-6">
                  <div className="text-center mb-3 sm:mb-4 md:mb-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-1 md:mb-2">Welcome back</h3>
                    <p className="text-sm sm:text-sm md:text-base text-gray-600 px-2">
                      {selectedRole === 'owner'
                        ? 'Sign in with Google or use your email and password'
                        : selectedRole === 'employee'
                          ? 'Sign in with the Google account matching your employee email'
                          : 'Sign in with your Google account to continue'
                      }
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4 md:space-y-5">


                    {selectedRole === 'owner' && (
                      <>

                        <form onSubmit={handleEmailLogin} className="space-y-2 sm:space-y-3 md:space-y-4">
                          <div className="space-y-1 sm:space-y-1 md:space-y-2">
                            <Label htmlFor="email" className="text-sm sm:text-base md:text-lg">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  setEmailError("");
                                  setLoginError("");
                                }}
                                className="pl-9 sm:pl-10 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg touch-manipulation"
                                disabled={loading}
                                required
                              />
                            </div>
                            {emailError && (
                              <p className="text-red-600 text-sm sm:text-sm md:text-base mt-1">{emailError}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:space-y-1 md:space-y-2">
                            <Label htmlFor="password" className="text-sm sm:text-base md:text-lg">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  setEmailError("");
                                  setLoginError("");
                                }}
                                onCopy={(e) => e.preventDefault()}
                                onPaste={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                onContextMenu={(e) => e.preventDefault()}
                                className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg touch-manipulation"
                                disabled={loading}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 touch-manipulation"
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Login Error Display */}
                          {loginError && (
                            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm sm:text-sm md:text-base text-red-600">{loginError}</p>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-0 mt-3 sm:mt-4">
                            <div className="flex items-center space-x-2 relative">
                              <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 touch-manipulation"
                              />
                              <Label
                                htmlFor="remember"
                                className="text-sm sm:text-sm md:text-base cursor-pointer touch-manipulation"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                              >
                                Remember me
                              </Label>
                              {showTooltip && (
                                <div className="absolute bottom-full left-0 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10 whitespace-nowrap max-w-48 sm:max-w-none">
                                  Check to stay logged in across browser sessions
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                </div>
                              )}
                            </div>
                            <Link
                              to="/forgot-password"
                              className="text-sm sm:text-sm md:text-base text-primary hover:underline touch-manipulation"
                            >
                              Forgot password?
                            </Link>
                          </div>

                          <Button type="submit" className="w-full bg-[#01005a] hover:bg-[#01005a]/90 active:bg-[#01005a]/95 mt-3 sm:mt-4 h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg touch-manipulation" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              "Sign in"
                            )}
                          </Button>
                        </form>
                        <div className="relative flex items-center my-2">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="mx-3 text-xs text-gray-400">or</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        <div className="space-y-2 sm:space-y-3 md:space-y-4 my-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg touch-manipulation active:scale-95"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                              </>
                            )}
                          </Button>
                        </div>

                      </>
                    )}

                    {selectedRole !== 'owner' && (
                      <div className="space-y-2 sm:space-y-3 md:space-y-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg touch-manipulation active:scale-95"
                          onClick={handleGoogleLogin}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              Sign in with Google
                            </>
                          )}
                        </Button>
                        {/* Login Error Display */}
                        {loginError && (
                          <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm sm:text-sm md:text-base text-red-600">{loginError}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-center text-sm sm:text-sm md:text-base pt-3">
                      <span className="text-muted-foreground">Don't have an account? </span>
                      <Link to="/register" className="text-primary hover:underline font-medium touch-manipulation">
                        Sign up
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Google Login Restriction Modal */}
      <GoogleLoginRestrictionModal
        isOpen={showGoogleRestrictionModal}
        onClose={() => setShowGoogleRestrictionModal(false)}
      />
    </>
  );
};

export default Login;
