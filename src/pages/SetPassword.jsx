import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, EyeOff, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { supabase } from '../config/supabase';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const navigate = useNavigate();

  const requirements = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Number', test: (pwd) => /\d/.test(pwd) },
    { label: 'Passwords match', test: (pwd, confirm) => pwd === confirm && pwd.length > 0 },
  ].map(req => ({ ...req, valid: req.test(password, confirmPassword) }));

  const allRequirementsMet = requirements.every(req => req.valid);

  // Wait for Supabase to auto-exchange the ?code= (detectSessionInUrl: true handles it)
  // Do NOT call exchangeCodeForSession manually — codes are one-time use and the client
  // already consumes them automatically, so a second call always returns "invalid/expired".
  useEffect(() => {
    let settled = false;

    // onAuthStateChange fires PASSWORD_RECOVERY after detectSessionInUrl finishes the exchange.
    // INITIAL_SESSION fires immediately and carries the session if exchange already completed.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'INITIAL_SESSION' && session)) {
        settled = true;
        setSessionReady(true);
      }
    });

    // Fallback: if exchange completed before the listener was registered
    supabase.auth.getSession().then(({ data }) => {
      if (!settled && data?.session) {
        settled = true;
        setSessionReady(true);
      }
    });

    // Timeout: genuinely invalid or already-used link
    const timer = setTimeout(() => {
      if (!settled) {
        setAuthError('This link is invalid or has expired. Please request a new password reset.');
      }
    }, 8000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all password requirements.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccess(true);
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <Card className="w-full max-w-sm border-0 shadow-lg text-center p-8">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h2>
          <p className="text-gray-600 text-sm">Redirecting you to login...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </Card>
      </div>
    );
  }

  // Auth error state (invalid/expired link)
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <Card className="w-full max-w-sm border-0 shadow-lg text-center p-8">
          <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 text-sm mb-6">{authError}</p>
          <Button
            className="w-full bg-[#01005a] hover:bg-[#01005a]/90"
            onClick={() => navigate('/forgot-password', { replace: true })}
          >
            Request New Link
          </Button>
        </Card>
      </div>
    );
  }

  // Authenticating state
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <Card className="w-full max-w-sm border-0 shadow-lg text-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-[#01005a] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Verifying link...</h2>
          <p className="text-gray-500 text-sm">Please wait a moment.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50/50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-gray-900">Set New Password</CardTitle>
            <CardDescription>Create a secure password for your account</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password requirements */}
              <div className="space-y-1.5 p-3 bg-gray-50 rounded-md">
                {requirements.map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${req.valid ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className={`w-3.5 h-3.5 flex-shrink-0 ${req.valid ? 'text-green-500' : 'text-gray-300'}`} />
                    {req.label}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!allRequirementsMet || loading}
                className="w-full bg-[#01005a] hover:bg-[#01005a]/90 h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Set Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;
