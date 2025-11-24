import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Mail, Lock, Crown, Shield, ArrowLeft, Check } from "lucide-react";
import tabTimeLogo from "../assets/images/tap-time-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [selectedRole, setSelectedRole] = useState('owner');
  const [showForm, setShowForm] = useState(true);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
  };

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

    // Clear previous errors
    setEmailError("");
    setPasswordError("");

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
      setPasswordError("Password is required");
      hasErrors = true;
    }

    // Return early if validation fails
    if (hasErrors) {
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setPasswordError("Invalid password");
        } else if (error.message.includes("Email not confirmed")) {
          setPasswordError("Please verify your email before logging in");
        } else {
          setPasswordError(error.message || "Authentication failed");
        }
        return;
      }

      if (data?.user) {


        const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];
        const userPicture = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '';

        const result = await fetchBackendUserData(data.user.email, userName, userPicture);

        if (!result.success) {
          await signOut();
          setPasswordError(result.error || 'Failed to validate user. Please contact your administrator.');
          setLoading(false);
          return;
        }

        showToast('Login successful! Welcome back.', 'success');
        setTimeout(() => navigate("/employee-management"), 1500);
      }
    } catch (err) {
      setPasswordError("Authentication failed. Please try again.");
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
          <div className="w-full max-w-sm">
            {/* Logo (visible on mobile only) */}
            <div className="text-center mb-8 md:hidden">
              <img src={tabTimeLogo} alt="TabTime Logo" className="mx-auto h-20 w-auto sm:h-25" />
            </div>

            {/* Unified Login Section */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-gray-50/50 to-white backdrop-blur-sm">
              {/* Role Selection Cards - Always Visible */}
              <CardContent className="p-4">
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Select Your Access</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div 
                    className={`relative cursor-pointer transition-all duration-300 ease-out p-3 rounded-lg border-2 text-center group h-20 flex flex-col justify-center ${
                      selectedRole === 'owner' 
                        ? 'border-[#01005a] bg-gradient-to-br from-[#01005a]/8 via-[#01005a]/4 to-transparent shadow-xl shadow-[#01005a]/20' 
                        : 'border-gray-200 hover:border-[#01005a]/40 hover:shadow-lg hover:shadow-[#01005a]/10 hover:bg-gradient-to-br hover:from-[#01005a]/3 hover:to-transparent'
                    }`}
                    onClick={() => handleRoleSelect('owner')}
                  >
                    {selectedRole === 'owner' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#01005a] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className={`mx-auto w-8 h-8 bg-gradient-to-br from-[#01005a] to-[#01005a]/80 rounded-lg flex items-center justify-center mb-1 transition-all duration-300 ${
                      selectedRole === 'owner' ? 'scale-105 shadow-lg' : 'group-hover:scale-105 group-hover:shadow-md'
                    }`}>
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <h3 className={`text-xs font-medium transition-colors ${
                      selectedRole === 'owner' ? 'text-[#01005a]' : 'text-gray-900 group-hover:text-[#01005a]'
                    }`}>Owner</h3>
                  </div>
                  
                  <div 
                    className={`relative cursor-pointer transition-all duration-300 ease-out p-3 rounded-lg border-2 text-center group h-20 flex flex-col justify-center ${
                      selectedRole === 'admin' 
                        ? 'border-[#01005a] bg-gradient-to-br from-[#01005a]/8 via-[#01005a]/4 to-transparent shadow-xl shadow-[#01005a]/20' 
                        : 'border-gray-200 hover:border-[#01005a]/40 hover:shadow-lg hover:shadow-[#01005a]/10 hover:bg-gradient-to-br hover:from-[#01005a]/3 hover:to-transparent'
                    }`}
                    onClick={() => handleRoleSelect('admin')}
                  >
                    {selectedRole === 'admin' && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-[#01005a] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className={`mx-auto w-8 h-8 bg-gradient-to-br from-[#01005a] to-[#01005a]/80 rounded-lg flex items-center justify-center mb-1 transition-all duration-300 ${
                      selectedRole === 'admin' ? 'scale-105 shadow-lg' : 'group-hover:scale-105 group-hover:shadow-md'
                    }`}>
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h3 className={`text-xs font-medium transition-colors leading-tight ${
                      selectedRole === 'admin' ? 'text-[#01005a]' : 'text-gray-900 group-hover:text-[#01005a]'
                    }`}>Admin / Super Admin</h3>
                  </div>
                </div>

                {/* Login Form - Shows Below Role Cards */}
                {showForm && (
                  <div className="border-t border-gray-200 pt-3">
                    {/* Back Button Header */}
                    

                    <div className="text-center mb-3">
                      <h3 className="text-base font-bold text-gray-900 mb-1">Welcome back</h3>
                      <p className="text-xs text-gray-600">
                        {selectedRole === 'owner' 
                          ? 'Enter your credentials to access your account'
                          : 'Sign in with your Google account to continue'
                        }
                      </p>
                    </div>

                    <div className="space-y-3">

              
                      {selectedRole === 'owner' && (
                        <form onSubmit={handleEmailLogin} className="space-y-2">
                          <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  setEmailError("");
                                  setPasswordError("");
                                }}
                                className={`pl-7 h-8 text-xs ${
                                  emailError ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                                disabled={loading}
                                required
                              />
                            </div>
                            {emailError && (
                              <p className="text-red-600 text-sm mt-1">{emailError}</p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="password" className="text-xs">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  setEmailError("");
                                  setPasswordError("");
                                }}
                                onCopy={(e) => e.preventDefault()}
                                onPaste={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                onContextMenu={(e) => e.preventDefault()}
                                className={`pl-7 pr-7 h-8 text-xs ${
                                  passwordError ? 'border-red-500 focus:border-red-500' : ''
                                }`}
                                disabled={loading}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                            {passwordError && (
                              <p className="text-red-600 text-xs mt-1">{passwordError}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-1">
                              <input
                                id="remember"
                                type="checkbox"
                                className="w-3 h-3 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                              />
                              <Label htmlFor="remember" className="text-xs">
                                Remember me
                              </Label>
                            </div>
                            <Link
                              to="/forgot-password"
                              className="text-xs text-primary hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>

                          <Button type="submit" className="w-full bg-[#01005a] hover:bg-[#01005a]/90 h-8 text-xs mt-4" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              "Sign in"
                            )}
                          </Button>
                        </form>
                      )}

                      {selectedRole === 'admin' && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-8 text-xs"
                          onClick={handleGoogleLogin}
                          disabled={loading}
                        >
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Sign in with Google
                        </Button>
                      )}

                      <div className="text-center text-xs">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link to="/register" className="text-primary hover:underline font-medium">
                          Sign up
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>



          </div>
        </div>
      </div>
    </>
  );
};

export default Login;