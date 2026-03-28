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

  // ✅ FIXED SESSION FLOW
  useEffect(() => {
    const initializeSession = async () => {
      if (!supabase) {
        setError('Supabase client is not configured');
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (!code) {
          throw new Error('Invalid or missing authentication link.');
        }

        // 🔥 NEW FLOW
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        if (!data.session) {
          throw new Error('Session creation failed.');
        }

        setSessionReady(true);

        // ✅ Clean URL (prevents reuse issues)
        window.history.replaceState({}, document.title, '/set-password');

      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message || 'Invalid or expired link. Please request again.');
      }
    };

    initializeSession();
  }, []);

  // Password validation
  useEffect(() => {
    const updatedRequirements = requirements.map(req => ({
      ...req,
      valid: req.test(password, confirmPassword)
    }));
    setRequirements(updatedRequirements);
  }, [password, confirmPassword]);

  const allRequirementsMet = requirements.every(req => req.valid);

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    if (!sessionReady) {
      setError('Session not ready. Please wait...');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Optional cleanup
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUCCESS UI
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Password Set Successfully</h2>
          <p>Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  // ✅ AUTH LOADING
  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left UI */}
      <div className="hidden md:flex w-1/2 bg-[#D9E9FB] items-center justify-center">
        <img src={tabTimeLogo} alt="Logo" className="w-48" />
      </div>

      {/* Right UI */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set Your Password</CardTitle>
            <CardDescription>Create a secure password</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="text-red-600 mb-3 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border p-2 rounded"
              />

              {/* Requirements */}
              <div className="text-sm">
                {requirements.map((req, i) => (
                  <div key={i} className={req.valid ? 'text-green-600' : 'text-gray-500'}>
                    {req.valid ? '✔' : '✖'} {req.label}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!allRequirementsMet || loading}
                className="w-full"
              >
                {loading ? 'Setting...' : 'Set Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;