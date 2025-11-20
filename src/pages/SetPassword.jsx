import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { supabase } from '../config/supabase';
import tabTimeLogo from '../assets/images/tap-time-logo.png';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([
    { label: 'At least 8 characters long', test: (pwd) => pwd.length >= 8, valid: false },
    { label: 'At least one uppercase letter', test: (pwd) => /[A-Z]/.test(pwd), valid: false },
    { label: 'At least one lowercase letter', test: (pwd) => /[a-z]/.test(pwd), valid: false },
    { label: 'At least one number', test: (pwd) => /\d/.test(pwd), valid: false },
    { label: 'Passwords match', test: (pwd, confirm) => pwd === confirm && pwd.length > 0, valid: false }
  ]);

  useEffect(() => {
    const initializeSession = async () => {
      if (!supabase) {
        setError('Supabase client is not configured');
        return;
      }

      // Check for access token in URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken) {
        setError('Invalid or missing authentication token. Please check your email and click the invitation link again.');
        return;
      }

      try {
        // Set the session using the tokens from URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (sessionError) {
          throw sessionError;
        }

        setSessionReady(true);
      } catch (err) {
        console.error('Error setting session:', err);
        setError('Failed to authenticate. Please try clicking the link in your email again.');
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    // Validate password requirements
    const updatedRequirements = requirements.map(req => ({
      ...req,
      valid: req.test(password, confirmPassword)
    }));
    setRequirements(updatedRequirements);
  }, [password, confirmPassword]);

  const allRequirementsMet = requirements.every(req => req.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client is not configured');
      }

      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Error setting password:', err);
      setError(err?.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Brand section */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-12">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
            <img
              src={tabTimeLogo}
              alt="Tap Time Logo"
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

        {/* Right side - Success message */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center py-12 px-6 sm:px-8 md:px-12 lg:px-20">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 md:hidden">
              <img src={tabTimeLogo} alt="Tap Time Logo" className="mx-auto h-20 w-auto sm:h-25" />
            </div>
            <Card className="border-0 shadow-2xl">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome to Tap Time! 🎉
                </h1>
                <p className="text-gray-600 mb-6">
                  Your password has been set successfully. You can now access your account to manage employee time tracking.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to login...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Brand section */}
      <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-12">
        <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
          <img
            src={tabTimeLogo}
            alt="Tap Time Logo"
            className="w-48 xl:w-56 md:w-40 mx-auto"
          />
          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl md:text-3xl font-bold text-gray-800">
              Set Your Password
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

      {/* Right side - Set Password form */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center py-12 px-6 sm:px-8 md:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:hidden">
            <img src={tabTimeLogo} alt="Tap Time Logo" className="mx-auto h-20 w-auto sm:h-25" />
          </div>

          <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
              <CardDescription>
                Create a secure password to complete your account setup
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}



              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      disabled={loading || !sessionReady}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      disabled={loading || !sessionReady}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Password Requirements:
                  </h4>
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.valid ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      {req.valid ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#01005a] hover:bg-[#01005a]/90"
                  size="lg"
                  disabled={!allRequirementsMet || loading || !sessionReady}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Setting Password...
                    </div>
                  ) : !sessionReady ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Authenticating...
                    </div>
                  ) : (
                    'Set Password'
                  )}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Need help? Contact your administrator</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;

