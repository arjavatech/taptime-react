import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  CalendarRange,
  Clock,
  AlertCircle,
  FileText,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/layout/Header';
import CenterLoadingOverlay from '../components/ui/CenterLoadingOverlay';
import { fetchMyDailyReport, fetchMyDateRangeReport, fetchMyPendingCheckouts } from '../api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { key: 'daywise', label: 'Day-wise', icon: Calendar },
  { key: 'range',   label: 'Date Range', icon: CalendarRange },
  { key: 'pending', label: 'Pending Check-Out', icon: Clock },
];

const PAGE_SIZE = 10;

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Single stat card shown above the table */
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <article className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm`}>
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  </article>
);

/** Empty-state illustration */
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <FileText className="h-8 w-8" />
    </div>
    <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    <p className="mt-1 text-xs text-slate-400">Try adjusting your selection above.</p>
  </div>
);

/** Error message banner */
const ErrorBanner = ({ message }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <AlertCircle className="h-4 w-4 shrink-0" />
    {message}
  </div>
);

/** Status badge for check-out column */
const StatusBadge = ({ value }) => {
  if (!value || value === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }
  return <span className="text-slate-800">{value}</span>;
};

/** Pagination controls */
const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
    <p className="text-xs text-slate-500">
      Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
      <span className="font-semibold text-slate-700">{totalPages}</span>
    </p>
    <div className="flex items-center gap-1">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/** Data table */
const ReportTable = ({ records }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Reset page when records change
  useEffect(() => { setPage(1); setSearch(''); }, [records]);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (r.date || r.Date || '').toLowerCase().includes(q) ||
      (r.CheckInTime || '').toLowerCase().includes(q) ||
      (r.CheckOutTime || '').toLowerCase().includes(q) ||
      (r.TimeWorked || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search records…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#01005a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#01005a]/20 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Check In</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Check Out</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time Worked</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No matching records found.
                </td>
              </tr>
            ) : (
              slice.map((record, index) => (
                <tr
                  key={`${record.CheckInTime}-${index}`}
                  className="border-b border-slate-100 transition hover:bg-slate-50/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {record.date || record.Date || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {record.CheckInTime || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={record.CheckOutTime} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {record.TimeWorked || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      )}
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const MyReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') === 'pending' ? 'pending' : searchParams.get('tab') === 'range' ? 'range' : 'daywise';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [date, setDate]           = useState(today());
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate]     = useState(today());
  const [records, setRecords]     = useState([]);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadDate = async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await fetchMyDailyReport(date));
    } catch (e) {
      setError(e.message || 'Unable to load reports.');
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  const loadRange = async () => {
    if (startDate > endDate) {
      setError('Start date must not be after end date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setRecords(await fetchMyDateRangeReport(startDate, endDate));
    } catch (e) {
      setError(e.message || 'Unable to load reports.');
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  const loadPending = async () => {
    setLoading(true);
    setError('');
    try {
      setRecords(await fetchMyPendingCheckouts());
    } catch (e) {
      setError(e.message || 'Unable to load pending check-outs.');
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  // ── Tab switching ──────────────────────────────────────────────────────────

  const selectTab = (tab) => {
    setActiveTab(tab);
    setRecords([]);
    setError('');
    setHasLoaded(false);
    setSearchParams(tab === 'pending' ? { tab: 'pending' } : tab === 'range' ? { tab: 'range' } : {});
  };

  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);

  useEffect(() => {
    if (activeTab === 'pending') loadPending();
    else if (activeTab === 'daywise') loadDate();
    // range tab: user triggers manually
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const pendingCount = records.filter((r) => !r.CheckOutTime || r.CheckOutTime === 'Pending').length;
  const totalRecords = records.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <CenterLoadingOverlay show={loading} />

      <main className="flex-1 pt-20 pb-10 sm:pt-24 sm:pb-14">
        <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 lg:px-8">

          {/* ── Page heading ── */}
          <div className="mb-5 sm:mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Employee Portal</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              My Reports
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View your attendance history, time logs, and pending check-outs.
            </p>
          </div>

          {/* ── Main card ── */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

            {/* Gradient header bar */}
            {/* <div className="h-1.5 bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#2b5bb6]" /> */}

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">

              {/* ── Tab bar ── */}
              <nav
                className="flex gap-1 border-b border-slate-100 overflow-x-auto pb-0 -mx-1 px-1"
                role="tablist"
                aria-label="Report type"
              >
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={activeTab === key}
                    onClick={() => selectTab(key)}
                    className={`
                      flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium
                      border-b-2 transition-colors duration-150
                      ${activeTab === key
                        ? 'border-[#01005a] text-[#01005a] bg-[#01005a]/5'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>

              {/* ── Controls ── */}
              {activeTab === 'daywise' && (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="date-picker" className="text-xs font-medium text-slate-600">
                      Select date
                    </label>
                    <input
                      id="date-picker"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-[#01005a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#01005a]/20 transition"
                    />
                  </div>
                  <button
                    onClick={loadDate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#01005a] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#15157c] focus:outline-none focus:ring-2 focus:ring-[#01005a]/40 disabled:opacity-60 transition"
                  >
                    <Search className="h-4 w-4" />
                    View Report
                  </button>
                </div>
              )}

              {activeTab === 'range' && (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="start-date" className="text-xs font-medium text-slate-600">
                      Start date
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-[#01005a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#01005a]/20 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="end-date" className="text-xs font-medium text-slate-600">
                      End date
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-[#01005a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#01005a]/20 transition"
                    />
                  </div>
                  <button
                    onClick={loadRange}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#01005a] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#15157c] focus:outline-none focus:ring-2 focus:ring-[#01005a]/40 disabled:opacity-60 transition"
                  >
                    <Search className="h-4 w-4" />
                    View Range
                  </button>
                </div>
              )}

              {activeTab === 'pending' && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-700">
                    Entries with no check-out time are listed here.
                    Check-out must be completed using the{' '}
                    <span className="font-semibold">Tap Time mobile app</span>.
                  </p>
                </div>
              )}

              {/* ── Stats strip ── */}
              {hasLoaded && !loading && !error && records.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatCard
                    icon={FileText}
                    label="Total records"
                    value={totalRecords}
                    accent="bg-blue-50 text-blue-600"
                  />
                  {activeTab !== 'pending' && (
                    <StatCard
                      icon={Clock}
                      label="Pending check-outs"
                      value={pendingCount}
                      accent={pendingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}
                    />
                  )}
                  {activeTab === 'range' && (
                    <StatCard
                      icon={CalendarRange}
                      label="Date range"
                      value={`${startDate} → ${endDate}`}
                      accent="bg-violet-50 text-violet-600"
                    />
                  )}
                </div>
              )}

              {/* ── Results area ── */}
              {!loading && hasLoaded && (
                error
                  ? <ErrorBanner message={error} />
                  : records.length
                    ? <ReportTable records={records} />
                    : <EmptyState
                        message={
                          activeTab === 'pending'
                            ? 'You have no pending check-outs. Great job!'
                            : 'No records found for the selected period.'
                        }
                      />
              )}

              {/* Initial prompt before first load (range tab only) */}
              {!hasLoaded && !loading && activeTab === 'range' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <CalendarRange className="h-7 w-7" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Select a start and end date, then click <span className="font-semibold text-[#01005a]">View Range</span>.
                  </p>
                </div>
              )}

            </div>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gradient-to-r from-[#01005a] via-[#15157c] to-[#123b80] text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold tracking-tight">TapTime Employee Portal</p>
              <p className="mt-1 text-sm leading-6 text-blue-100">
                A simpler way to stay connected with your workday.
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-200">Need assistance?</p>
              <a
                href="mailto:contact@tap-time.com"
                className="mt-1 inline-block text-sm font-semibold text-white transition-colors hover:text-blue-200"
              >
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
    </div>
  );
};

export default MyReports;
