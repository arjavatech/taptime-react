import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { fetchMyDailyReport, fetchMyDateRangeReport } from '../api';

const today = () => new Date().toISOString().slice(0, 10);
const ReportTable = ({ records }) => <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Date</th><th className="p-2">Check in</th><th className="p-2">Check out</th><th className="p-2">Worked</th></tr></thead><tbody>{records.map((record, index) => <tr className="border-b" key={`${record.CheckInTime}-${index}`}><td className="p-2">{record.date || record.Date || '—'}</td><td className="p-2">{record.CheckInTime || '—'}</td><td className="p-2">{record.CheckOutTime || 'Pending'}</td><td className="p-2">{record.TimeWorked || '—'}</td></tr>)}</tbody></table></div>;

const MyReports = () => {
  const [date, setDate] = useState(today());
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('');

  const loadDate = async () => {
    setStatus('Loading…');
    try { setRecords(await fetchMyDailyReport(date)); setStatus(''); } catch (error) { setStatus(error.message || 'Unable to load reports.'); }
  };
  const loadRange = async () => {
    if (startDate > endDate) return setStatus('Start date must not be after end date.');
    setStatus('Loading…');
    try { setRecords(await fetchMyDateRangeReport(startDate, endDate)); setStatus(''); } catch (error) { setStatus(error.message || 'Unable to load reports.'); }
  };
  useEffect(() => { loadDate(); }, []);

  return <><Header /><main className="max-w-5xl mx-auto px-4 pt-28 pb-10"><Card><CardHeader><CardTitle>My Reports</CardTitle></CardHeader><CardContent className="space-y-6">
    <div className="flex flex-wrap items-end gap-3"><label className="text-sm">Date<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><Button onClick={loadDate}>View date</Button></div>
    <div className="flex flex-wrap items-end gap-3 border-t pt-5"><label className="text-sm">Start date<Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label><label className="text-sm">End date<Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label><Button variant="outline" onClick={loadRange}>View range</Button></div>
    {status ? <p className="text-sm">{status}</p> : records.length ? <ReportTable records={records} /> : <p className="text-sm text-muted-foreground">No reports found for this selection.</p>}
  </CardContent></Card></main></>;
};

export default MyReports;
