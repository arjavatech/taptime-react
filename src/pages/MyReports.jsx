import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import CenterLoadingOverlay from '../components/ui/CenterLoadingOverlay';
import { HamburgerIcon } from '../components/icons/HamburgerIcon';
import { GridIcon } from '../components/icons/GridIcon';
import { ArrowUp, ArrowDown, ChevronDown, Check, FileText } from 'lucide-react';
import { fetchMyDailyReport, fetchMyDateRangeReport, fetchMyPendingCheckouts } from '../api';

const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d) => {
  if (!d) return '—';
  try { return String(d).slice(0, 10); } catch { return d; }
};
const fmtTime = (ts) => {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return ts; }
};

const MyReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') === 'pending' ? 'pending' : 'daywise';
  const [activeTab, setActiveTab] = useState(tabParam);
  const [date, setDate] = useState(todayStr());
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [records, setRecords] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [viewMode, setViewMode] = useState('table');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadDate = async () => {
    setLoading(true); setStatusMsg('');
    try { setRecords(await fetchMyDailyReport(date)); }
    catch (e) { setStatusMsg(e.message || 'Unable to load reports.'); }
    finally { setHasLoaded(true); setLoading(false); }
  };
  const loadRange = async () => {
    if (startDate > endDate) return setStatusMsg('Start date must not be after end date.');
    setLoading(true); setStatusMsg('');
    try { setRecords(await fetchMyDateRangeReport(startDate, endDate)); }
    catch (e) { setStatusMsg(e.message || 'Unable to load reports.'); }
    finally { setHasLoaded(true); setLoading(false); }
  };
  const loadPending = async () => {
    setLoading(true); setStatusMsg('');
    try { setRecords(await fetchMyPendingCheckouts()); }
    catch (e) { setStatusMsg(e.message || 'Unable to load pending check-outs.'); }
    finally { setHasLoaded(true); setLoading(false); }
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setRecords([]);
    setStatusMsg('');
    setHasLoaded(false);
    setPage(1);
    setSearchParams(tab === 'pending' ? { tab: 'pending' } : {});
  };

  useEffect(() => { setActiveTab(tabParam); }, [tabParam]);
  useEffect(() => {
    if (activeTab === 'pending') loadPending();
    else if (activeTab === 'daywise') loadDate();
  }, [activeTab]);

  useEffect(() => { setPage(1); }, [sortDir, records]);

  const sorted = [...records].sort((a, b) => {
    const at = a.CheckInTime || a.date || '';
    const bt = b.CheckInTime || b.date || '';
    return sortDir === 'asc' ? at.localeCompare(bt) : bt.localeCompare(at);
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = sorted.slice(start, start + pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <CenterLoadingOverlay show={loading} />

      <div className="pb-8 flex-grow">
        {/* Page Header */}
        <div className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Reports</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">View your check-in and check-out history</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Tabs */}
          <div className="flex gap-5 border-b mb-6 overflow-x-auto">
            {[['daywise', 'Day-wise Report'], ['range', 'Date Range Report'], ['pending', 'Pending Check-Out']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => selectTab(key)}
                className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date Controls */}
          {activeTab === 'daywise' && (
            <div className="flex flex-wrap items-end gap-3 mb-6">
              <label className="text-sm font-medium">
                Date
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              </label>
              <Button onClick={loadDate}>View date</Button>
            </div>
          )}
          {activeTab === 'range' && (
            <div className="flex flex-wrap items-end gap-3 mb-6">
              <label className="text-sm font-medium">
                Start date
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </label>
              <label className="text-sm font-medium">
                End date
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </label>
              <Button onClick={loadRange}>View range</Button>
            </div>
          )}
          {activeTab === 'pending' && (
            <p className="text-sm text-muted-foreground mb-6">Check-out must be completed using the Tap Time mobile app.</p>
          )}

          {statusMsg && <p className="text-sm text-destructive mb-4">{statusMsg}</p>}

          {/* Unloaded prompt — only for range tab before first search */}
          {!loading && !hasLoaded && activeTab === 'range' && (
            <div className="text-center py-20 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Select a start and end date, then click <span className="font-medium text-foreground">View range</span> to load reports.</p>
            </div>
          )}

          {/* Empty state after load */}
          {!loading && hasLoaded && !statusMsg && records.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">{activeTab === 'pending' ? 'You have no pending check-outs.' : 'No reports found for this selection.'}</p>
            </div>
          )}

          {/* Toolbar + Table/Grid */}
          {hasLoaded && !statusMsg && records.length > 0 && (
            <>
              {/* Sort + view toggle */}
              <div className="mb-4 flex items-center gap-2 justify-end flex-wrap">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="px-3 py-2 h-auto text-sm flex items-center gap-2 min-w-[150px] justify-between"
                    onClick={() => document.getElementById('rep-sort-dd').classList.toggle('hidden')}
                  >
                    <div className="flex items-center gap-2">
                      {sortDir === 'asc'
                        ? <ArrowUp className="w-4 h-4 text-green-600" />
                        : <ArrowDown className="w-4 h-4 text-blue-600" />}
                      <span>{sortDir === 'asc' ? 'Oldest First' : 'Newest First'}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <div
                    id="rep-sort-dd"
                    className="absolute top-full right-0 mt-1 w-48 bg-background border border-input rounded-md shadow-lg z-10 hidden"
                  >
                    {[
                      { dir: 'desc', label: 'Newest First', Icon: ArrowDown },
                      { dir: 'asc', label: 'Oldest First', Icon: ArrowUp },
                    ].map(({ dir, label, Icon }) => (
                      <button
                        key={dir}
                        onClick={() => {
                          setSortDir(dir);
                          document.getElementById('rep-sort-dd').classList.add('hidden');
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors ${sortDir === dir ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${dir === 'asc' ? 'text-green-600' : 'text-blue-600'}`} />
                          {label}
                        </div>
                        {sortDir === dir && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0"
                    title="Table View"
                  >
                    <HamburgerIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                    title="Grid View"
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader className={`py-3 px-4 flex-row items-center justify-end gap-2 ${viewMode === 'table' ? 'border-b' : ''}`}>
                  <Label htmlFor="rep-page-size" className="text-sm whitespace-nowrap">Records per page:</Label>
                  <select
                    id="rep-page-size"
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                    className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </CardHeader>

                <CardContent className="p-0">
                  {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-primary">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white">Check In</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white">Check Out</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-white">Worked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginated.map((record, i) => (
                            <tr className="border-b hover:bg-muted/30" key={`${record.CheckInTime}-${i}`}>
                              <td className="py-3 px-4 text-sm">{fmtDate(record.date || record.Date) || '—'}</td>
                              <td className="py-3 px-4 text-sm">{fmtTime(record.CheckInTime) || '—'}</td>
                              <td className="py-3 px-4 text-sm">
                                {record.CheckOutTime
                                  ? fmtTime(record.CheckOutTime)
                                  : <span className="text-amber-600 text-xs font-medium">Pending</span>}
                              </td>
                              <td className="py-3 px-4 text-sm">{record.TimeWorked || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginated.map((record, i) => (
                          <Card key={`${record.CheckInTime}-${i}`} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <CardTitle className="text-sm font-semibold">{fmtDate(record.date || record.Date) || '—'}</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Check In</p>
                                  <p className="font-medium">{fmtTime(record.CheckInTime) || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Check Out</p>
                                  <p className="font-medium">
                                    {record.CheckOutTime
                                      ? fmtTime(record.CheckOutTime)
                                      : <span className="text-amber-600 text-xs font-medium">Pending</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground mb-0.5">Time Worked</p>
                                <p className="text-sm font-semibold">{record.TimeWorked || '—'}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pagination */}
                  {sorted.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200">
                      <div className="text-sm text-muted-foreground order-2 sm:order-1">
                        Showing {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-3 order-1 sm:order-2">
                          <button
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${page === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
                          >
                            Prev
                          </button>
                          <span className="text-sm font-medium text-gray-900 px-2">{page} / {totalPages}</span>
                          <button
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${page === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;
