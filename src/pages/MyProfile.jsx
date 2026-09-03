import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import CenterLoadingOverlay from '../components/ui/CenterLoadingOverlay';
import { fetchMyEmployeeProfile, updateMyEmployeePin } from '../api';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEmployeeProfile().then((data) => {
      setProfile(data);
      setPin(data.pin || '');
    }).catch(() => setStatus('Unable to load your profile.')).finally(() => setLoading(false));
  }, []);

  const savePin = async (event) => {
    event.preventDefault();
    if (!/^\d{4,10}$/.test(pin)) {
      setStatus('PIN must contain 4–10 digits.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const result = await updateMyEmployeePin(pin);
      setProfile(result.data);
      setStatus('PIN updated successfully.');
    } catch (error) {
      setStatus(error.message || 'Unable to update your PIN.');
    } finally {
      setSaving(false);
    }
  };

  return <><Header /><CenterLoadingOverlay show={loading || saving} /><main className="max-w-3xl mx-auto px-4 pt-28 pb-10">
    <Card><CardHeader><CardTitle>My Profile</CardTitle></CardHeader><CardContent className="space-y-6">
      {profile && <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Name</span><p>{profile.first_name} {profile.last_name}</p></div>
        <div><span className="text-muted-foreground">Email</span><p>{profile.email}</p></div>
        <div><span className="text-muted-foreground">Phone</span><p>{profile.phone_number || '—'}</p></div>
        <div><span className="text-muted-foreground">Role</span><p>Employee</p></div>
      </div>}
      {profile && <form onSubmit={savePin} className="border-t pt-6 max-w-sm space-y-3">
        <Label htmlFor="employee-pin">Employee PIN</Label>
        <Input id="employee-pin" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" />
        <Button type="submit" disabled={saving}>{saving ? 'Updating…' : 'Update PIN'}</Button>
        {status && <p className="text-sm">{status}</p>}
      </form>}
      {!loading && !profile && status && <p className="text-sm text-destructive">{status}</p>}
    </CardContent></Card>
  </main></>;
};

export default MyProfile;
