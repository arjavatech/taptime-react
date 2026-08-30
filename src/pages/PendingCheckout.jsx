import { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { fetchMyPendingCheckouts } from '../api';

const PendingCheckout = () => {
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState('Loading…');
  useEffect(() => { fetchMyPendingCheckouts().then((data) => { setRecords(data); setStatus(''); }).catch((error) => setStatus(error.message || 'Unable to load pending check-outs.')); }, []);
  return <><Header /><main className="max-w-5xl mx-auto px-4 pt-28 pb-10"><Card><CardHeader><CardTitle>Pending Check-Out</CardTitle></CardHeader><CardContent>
    <p className="text-sm text-muted-foreground mb-5">Check-out must be completed using the Tap Time mobile app.</p>
    {status ? <p className="text-sm">{status}</p> : records.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Date</th><th className="p-2">Check in</th><th className="p-2">Type</th></tr></thead><tbody>{records.map((record, index) => <tr key={`${record.CheckInTime}-${index}`} className="border-b"><td className="p-2">{record.date || record.Date || '—'}</td><td className="p-2">{record.CheckInTime || '—'}</td><td className="p-2">{record.Type || '—'}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">You have no pending check-outs.</p>}
  </CardContent></Card></main></>;
};

export default PendingCheckout;
