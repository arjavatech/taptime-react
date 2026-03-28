import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { supabase } from '../config/supabase';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8, valid: false },
    { label: 'Uppercase letter', test: (pwd) => /[A-Z]/.test(pwd), valid: false },
    { label: 'Lowercase letter', test: (pwd) => /[a-z]/.test(pwd), valid: false },
    { label: 'Number', test: (pwd) => /\d/.test(pwd), valid: false },
    { label: 'Passwords match', test: (pwd, confirm) => pwd === confirm && pwd.length > 0, valid: false }
  ]);

  // ✅ CORRECT SESSION HANDLING
  useEffect(() => {
    // 1. Listen for auth state change
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
      }
    );

    // 2. Also check existing session (fallback)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSessionReady(true);
      }
    };

    checkSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Password validation
  useEffect(() => {
    const updated = requirements.map(req => ({
      ...req,
      valid: req.test(password, confirmPassword)
    }));
    setRequirements(updated);
  }, [password, confirmPassword]);

  const allRequirementsMet = requirements.every(req => req.valid);

  // ✅ SUBMIT PASSWORD
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRequirementsMet) {
      setError('Please meet all password requirements.');
      return;
    }

    if (!sessionReady) {
      setError('Authentication not ready. Please wait.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);

      // Optional: logout after reset
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password.');
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
          <h2 className="text-xl font-bold mb-2">Password Updated</h2>
          <p>Redirecting to login...</p>
        </Card>
      </div>
    );
  }

  // ✅ LOADING STATE
  if (!sessionReady && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md p-4">
        <CardHeader>
          <CardTitle>Set Password</CardTitle>
          <CardDescription>Create a new secure password</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="text-red-600 mb-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
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
  );
};

export default SetPassword;