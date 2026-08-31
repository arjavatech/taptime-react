import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import CenterLoadingOverlay from '../components/ui/CenterLoadingOverlay';
import { fetchMyEmployeeProfile, updateMyEmployeePin } from '../api';
import {
  BadgeCheck,
  Building2,
  Clock3,
  Crown,
  Hash,
  Mail,
  Phone,
  Shield,
  Timer,
  User,
} from 'lucide-react';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState(false);

  useEffect(() => {
    fetchMyEmployeeProfile()
      .then((data) => {
        setProfile(data);
        setPin(data.pin || '');
      })
      .catch(() => setStatus('Unable to load your profile.'))
      .finally(() => setLoading(false));
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
      setEditingPin(false);
    } catch (error) {
      setStatus(error.message || 'Unable to update your PIN.');
    } finally {
      setSaving(false);
    }
  };

  const getRole = () => {
    if (!profile) return { label: 'Employee', icon: User };
    if (profile.is_admin === 2) return { label: 'Super Admin', icon: Crown };
    if (profile.is_admin === 1) return { label: 'Administrator', icon: Shield };
    return { label: 'Employee', icon: User };
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Not provided';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 11) {
      const countryCode = digits.slice(0, -10);
      return `+${countryCode} ${digits.slice(-10, -5)} ${digits.slice(-5)}`;
    }
    return phone;
  };

  if (loading) return <><Header /><CenterLoadingOverlay show /></>;
  if (!profile) return (
    <><Header />
      <main className="flex-1 pt-24 pb-8">
        <div className="mx-auto max-w-5xl px-4 text-sm text-red-600">{status}</div>
      </main>
    </>
  );

  const { label: roleLabel, icon: RoleIcon } = getRole();
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  const companyId = profile.c_id || localStorage.getItem('companyID') || '—';
  const employeeCode = profile.emp_id || '—';
  const firstName = profile.first_name || 'Employee';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <CenterLoadingOverlay show={saving} />

      <main className="flex-1 pt-20 pb-8 sm:pt-24 sm:pb-12 lg:pb-14">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">Here's a quick view of your TapTime account.</p>
            </div>
            <div className="inline-flex max-w-full items-center gap-2 self-start break-all rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:self-auto">
              <Building2 className="h-3.5 w-3.5 text-[#01005a]" />
              Company ID: {companyId}
            </div>
          </div>

          {/* Profile Header Card */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
            <div className="h-24 bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#2b5bb6] sm:h-28" />
            <div className="px-4 pb-5 sm:px-8 sm:pb-8">
              <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-2xl font-bold text-[#01005a] shadow-md sm:h-32 sm:w-32 sm:text-3xl">
                    {initials || <User className="h-10 w-10" />}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">My profile</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        {profile.first_name} {profile.last_name}
                      </h2>
                      {profile.is_active && <BadgeCheck className="h-5 w-5 text-blue-600" aria-label="Verified active employee" />}
                    </div>
                    <p className="pt-3 text-sm font-medium text-slate-500">
                      Employee ID <span className="font-mono text-slate-700">{employeeCode}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                        <RoleIcon className="h-3.5 w-3.5" /> {roleLabel}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${profile.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${profile.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {profile.is_active ? 'Active account' : 'Inactive account'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dashboard Cards */}
          <section className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <DashboardCard
              icon={Timer}
              label="Today's status"
              value="Ready to check in"
              detail="No active time entry"
              accent="text-emerald-600 bg-emerald-50"
            />
            <DashboardCard
              icon={Clock3}
              label="Scheduled shift"
              value="09:00 AM – 06:00 PM"
              detail="Standard work schedule"
              accent="text-blue-600 bg-blue-50"
            />
            <DashboardCard
              icon={BadgeCheck}
              label="Account status"
              value={profile.is_active ? 'Active' : 'Inactive'}
              detail={profile.is_active ? 'Your access is enabled' : 'Please contact your administrator'}
              accent={profile.is_active ? 'text-violet-600 bg-violet-50' : 'text-red-600 bg-red-50'}
              className="sm:col-span-2 lg:col-span-1"
            />
          </section>

          {/* Info Sections */}
          <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Contact information</h3>
              <p className="mt-1 text-sm text-slate-500">The contact details associated with your account.</p>
              <div className="mt-5 space-y-4">
                <DetailRow icon={Mail} label="Email address" value={profile.email || 'Not provided'} />
                <DetailRow icon={Phone} label="Phone number" value={formatPhone(profile.phone_number)} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">Account information</h3>
              <p className="mt-1 text-sm text-slate-500">Your access and employee record details.</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#01005a]">
                    <Hash className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Employee PIN</p>
                    {editingPin ? (
                      <form onSubmit={savePin} className="mt-1 flex items-center gap-2">
                        <input
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          inputMode="numeric"
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#01005a]"
                        />
                        <button type="submit" disabled={saving} className="rounded-lg bg-[#01005a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#15157c] disabled:opacity-60">
                          Save
                        </button>
                        <button type="button" onClick={() => { setEditingPin(false); setStatus(''); }} className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="font-mono text-sm font-medium tracking-wide text-slate-800">••••</p>
                        <button onClick={() => setEditingPin(true)} className="text-xs font-medium text-[#01005a] hover:underline">
                          Change
                        </button>
                      </div>
                    )}
                    {status && <p className={`mt-1 text-xs ${status.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>{status}</p>}
                  </div>
                </div>
                <DetailRow icon={Building2} label="Company ID" value={companyId} mono />
              </div>
            </section>
          </div>
        </div>
      </main>

      <ProfileFooter />
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#01005a]">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 break-all text-sm font-medium text-slate-800 ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</p>
    </div>
  </div>
);

const DashboardCard = ({ icon: Icon, label, value, detail, accent, className = '' }) => (
  <article className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{detail}</p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </article>
);

const ProfileFooter = () => (
  <footer className="mt-4 bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#123b80] text-white sm:mt-6">
    <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold tracking-tight">TapTime Employee Portal</p>
          <p className="mt-1 text-sm leading-6 text-blue-100">A simpler way to stay connected with your workday.</p>
        </div>
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-200">Need assistance?</p>
          <a href="mailto:contact@tap-time.com" className="mt-1 inline-block text-sm font-semibold text-white transition-colors hover:text-blue-200">
            Contact TapTime Support →
          </a>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-2 border-t border-white/15 pt-4 text-xs text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TapTime by Arjava Technologies. All rights reserved.</p>
        <p>Employee access portal</p>
      </div>
    </div>
  </footer>
);

export default MyProfile;