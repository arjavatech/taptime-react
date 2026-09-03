import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import CenterLoadingOverlay from '../components/ui/CenterLoadingOverlay';
import { fetchMyDailyReport, fetchMyDateRangeReport, fetchMyPendingCheckouts } from '../api';

const today = () => new Date().toISOString().slice(0, 10);
const ReportTable = ({ records }) => <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Date</th><th className="p-2">Check in</th><th className="p-2">Check out</th><th className="p-2">Worked</th></tr></thead><tbody>{records.map((record, index) => <tr className="border-b" key={`${record.CheckInTime}-${index}`}><td className="p-2">{record.date || record.Date || '—'}</td><td className="p-2">{record.CheckInTime || '—'}</td><td className="p-2">{record.CheckOutTime || 'Pending'}</td><td className="p-2">{record.TimeWorked || '—'}</td></tr>)}</tbody></table></div>;

const MyReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') === 'pending' ? 'pending' : 'daywise';
  const [activeTab, setActiveTab] = useState(tabParam);
  const [date, setDate] = useState(today());
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadDate = async () => {
    setLoading(true);
    setStatus('Loading…');
    try { setRecords(await fetchMyDailyReport(date)); setStatus(''); } catch (error) { setStatus(error.message || 'Unable to load reports.'); } finally { setHasLoaded(true); setLoading(false); }
  };
  const loadRange = async () => {
    if (startDate > endDate) return setStatus('Start date must not be after end date.');
    setLoading(true);
    setStatus('Loading…');
    try { setRecords(await fetchMyDateRangeReport(startDate, endDate)); setStatus(''); } catch (error) { setStatus(error.message || 'Unable to load reports.'); } finally { setHasLoaded(true); setLoading(false); }
  };
  const loadPending = async () => {
    setLoading(true);
    setStatus('Loading…');
    try { setRecords(await fetchMyPendingCheckouts()); setStatus(''); } catch (error) { setStatus(error.message || 'Unable to load pending check-outs.'); } finally { setHasLoaded(true); setLoading(false); }
  };
  const selectTab = (tab) => {
    setActiveTab(tab);
    setRecords([]);
    setStatus('');
    setHasLoaded(false);
    setSearchParams(tab === 'pending' ? { tab: 'pending' } : {});
  };
  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);
  useEffect(() => {
    if (activeTab === 'pending') loadPending();
    else if (activeTab === 'daywise') loadDate();
  }, [activeTab]);

  return <><Header /><CenterLoadingOverlay show={loading} /><main className="max-w-5xl mx-auto px-4 pt-28 pb-10"><Card><CardHeader><CardTitle>My Reports</CardTitle></CardHeader><CardContent className="space-y-6">
    <div className="flex gap-5 border-b overflow-x-auto">
      {[['daywise', 'Day-wise Report'], ['range', 'Date Range Report'], ['pending', 'Pending Check-Out']].map(([key, label]) => <button key={key} onClick={() => selectTab(key)} className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === key ? 'border-[#01005a] text-[#01005a]' : 'border-transparent text-muted-foreground'}`}>{label}</button>)}
    </div>
    {activeTab === 'daywise' && <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Date<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><Button onClick={loadDate}>View date</Button></div>}
    {activeTab === 'range' && <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Start date<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label className="text-sm">End date<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label><Button onClick={loadRange}>View range</Button></div>}
    {activeTab === 'pending' && <p className="text-sm text-muted-foreground">Check-out must be completed using the Tap Time mobile app.</p>}
    {!loading && hasLoaded && (status ? <p className="text-sm text-destructive">{status}</p> : records.length ? <ReportTable records={records} /> : <p className="text-sm text-muted-foreground">{activeTab === 'pending' ? 'You have no pending check-outs.' : 'No reports found for this selection.'}</p>)}
  </CardContent></Card></main></>;
};

export default MyReports;
