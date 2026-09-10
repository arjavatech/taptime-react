import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarDays, Download, History, Loader2, Users, Search, ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { getCurrentSalaryReport, getSalaryReportHistory, getSalaryReportPeriod } from "../api";
import { GridIcon } from "../components/icons/GridIcon";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const periodLabel = (period) => `${formatDate(period.start_date)} – ${formatDate(period.end_date)}`;

export default function SalaryReport() {
  const location = useLocation();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [downloadingPeriod, setDownloadingPeriod] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [currentPeriodPageSize, setCurrentPeriodPageSize] = useState(10);
  const [currentPeriodCurrentPage, setCurrentPeriodCurrentPage] = useState(1);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySortConfig, setHistorySortConfig] = useState({ key: null, direction: "asc" });
  const [historyViewMode, setHistoryViewMode] = useState("list");
  const [showHistorySortDropdown, setShowHistorySortDropdown] = useState(false);
  const companyId = localStorage.getItem("companyID");

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const HISTORY_PAGE_SIZE = 12;
  const report = selected || current;

  // Filter and sort report items based on search query and sort config
  const filteredAndSortedItems = useMemo(() => {
    if (!report) return [];

    let items = [...report.items];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.pin && item.pin.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      items.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === "name") {
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (sortConfig.key === "pin") {
          aValue = a.pin || "";
          bValue = b.pin || "";
          // Convert to numbers for numeric sorting
          const aNum = parseInt(aValue, 10) || 0;
          const bNum = parseInt(bValue, 10) || 0;
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }
        return 0;
      });
    }

    return items;
  }, [report, searchQuery, sortConfig]);

  // Pagination for current period
  const getCurrentPeriodItemsPerPage = () => currentPeriodPageSize;
  const currentPeriodPaginationStartIndex = (currentPeriodCurrentPage - 1) * getCurrentPeriodItemsPerPage();
  const currentPeriodPaginationEndIndex = currentPeriodPaginationStartIndex + getCurrentPeriodItemsPerPage();
  const currentPeriodTotalPages = Math.ceil(filteredAndSortedItems.length / getCurrentPeriodItemsPerPage());
  const paginatedCurrentPeriodItems = filteredAndSortedItems.slice(currentPeriodPaginationStartIndex, currentPeriodPaginationEndIndex);

  // Filter and sort history data
  const filteredAndSortedHistoryData = useMemo(() => {
    let items = [...history];

    // Apply search filter
    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      items = items.filter(item =>
        (formatDate(item.start_date) && formatDate(item.start_date).toLowerCase().includes(query)) ||
        (formatDate(item.end_date) && formatDate(item.end_date).toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (historySortConfig.key) {
      items.sort((a, b) => {
        let aValue, bValue;

        if (historySortConfig.key === "startDate") {
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          return historySortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        } else if (historySortConfig.key === "endDate") {
          aValue = new Date(a.end_date);
          bValue = new Date(b.end_date);
          return historySortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return items;
  }, [history, historySearchQuery, historySortConfig]);

  // Pagination for history
  const getHistoryItemsPerPage = () => historyPageSize;
  const paginatedHistoryStartIndex = (historyCurrentPage - 1) * getHistoryItemsPerPage();
  const paginatedHistoryEndIndex = paginatedHistoryStartIndex + getHistoryItemsPerPage();
  const totalHistoryPages = Math.ceil(filteredAndSortedHistoryData.length / getHistoryItemsPerPage());
  const paginatedHistoryData = filteredAndSortedHistoryData.slice(paginatedHistoryStartIndex, paginatedHistoryEndIndex);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        getCurrentSalaryReport(companyId),
        getSalaryReportHistory(companyId),
      ]);
      setCurrent(currentResponse.data);
      setSelected(currentResponse.data);
      setHistory(historyResponse.data.periods || []);
      setVisibleCount(HISTORY_PAGE_SIZE);
    } catch (err) {
      setError(err.message || "Unable to load salary reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId, location.pathname]);

  // Set grid view as default on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("grid");
      setHistoryViewMode("grid");
    }
  }, []);

  const selectPeriod = async (period) => {
    setSelecting(true);
    setError("");
    try {
      const response = await getSalaryReportPeriod(companyId, period.start_date, period.end_date);
      setSelected(response.data);
      setActiveTab("current"); // Switch to Current Period tab to show the report
    } catch (err) {
      setError(err.message || "Unable to load this report period");
    } finally {
      setSelecting(false);
    }
  };

  const generatePdf = (reportData) => {
    if (!reportData) return;
    const doc = new jsPDF();
    const companyName = localStorage.getItem("companyName") || "TapTime";
    doc.setFontSize(18);
    doc.text(`${companyName} Salary Report`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${reportData.frequency}: ${periodLabel(reportData.period)}`, 14, 27);
    doc.text(
      `Total time: ${reportData.totals.time_worked}   Employees: ${reportData.totals.employees}`,
      14,
      34
    );
    autoTable(doc, {
      startY: 40,
      head: [["Employee", "PIN", "Entries", "Time worked"]],
      body: reportData.items.map((item) => [
        item.name || "—",
        item.pin || "—",
        item.entries,
        item.time_worked,
      ]),
      headStyles: { fillColor: [2, 6, 111] },
    });
    doc.save(`salary-report-${reportData.period.start_date}-to-${reportData.period.end_date}.pdf`);
  };

  const downloadPdf = () => {
    generatePdf(selected || current);
  };

  const downloadPeriodPdf = async (period) => {
    setDownloadingPeriod(period);
    try {
      const response = await getSalaryReportPeriod(companyId, period.start_date, period.end_date);
      generatePdf(response.data);
    } catch (err) {
      setError(err.message || "Unable to download this report");
    } finally {
      setDownloadingPeriod(null);
    }
  };

  const visibleHistory = history.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-50">
      <CenterLoadingOverlay show={selecting} message="Loading report…" />
      <CenterLoadingOverlay show={downloadingPeriod !== null} message="Generating PDF…" />
      <Header />
      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#01005a]">Salary Report</h1>
            <p className="text-sm text-muted-foreground">
              Live attendance totals for each configured reporting period.
            </p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            {report && !report.period.is_current && (
              <Button onClick={() => setSelected(current)} variant="outline">
                <CalendarDays className="w-4 h-4 mr-2" />
                View Current
              </Button>
            )}
            <Button onClick={downloadPdf} disabled={!report || selecting}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#01005a]" />
          </div>
        ) : error && !report ? (
          <Card>
            <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
          </Card>
        ) : (
          <>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("current")}
                  className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                    activeTab === "current"
                      ? "text-[#01005a]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Current Period
                  {activeTab === "current" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#01005a]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
                    activeTab === "history"
                      ? "text-[#01005a]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  History
                  {activeTab === "history" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#01005a]"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Current Period Tab */}
            {activeTab === "current" && (
              <>
                {current && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-[#01005a]" />
                        {current.frequency}
                      </CardTitle>
                      <CardDescription>
                        {periodLabel(current.period)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Employees</p>
                        <p className="text-xl font-semibold">{current.totals.employees}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Attendance entries</p>
                        <p className="text-xl font-semibold">{current.totals.entries}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total time</p>
                        <p className="text-xl font-semibold">{current.totals.time_worked}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report && (
                  <Card>
                    <CardHeader className="pb-4 sm:pb-6">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#01005a]" />
                          Report Values: {formatDate(report.period.start_date)} – {formatDate(report.period.end_date)}
                          {selecting && <Loader2 className="w-4 h-4 animate-spin" />}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Toolbar */}
                      <div className="mb-6 space-y-3 sm:space-y-0">
                        {/* First row: Search */}
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-sm h-10 rounded-lg border border-input bg-white w-full"
                          />
                        </div>

                        {/* Second row: Controls */}
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Sort Control */}
                          <div className="relative">
                            <Button
                              variant="outline"
                              className="px-3 py-2 h-10 text-sm flex items-center gap-2 min-w-[100px] justify-between border border-input rounded-lg"
                              onClick={() => setShowSortDropdown(!showSortDropdown)}
                            >
                              <div className="flex items-center gap-2">
                                {sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="w-4 h-4 text-green-600" />
                                ) : sortConfig.direction === 'desc' ? (
                                  <ArrowDown className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ArrowUp className="w-4 h-4 text-green-600" />
                                )}
                                <span className="hidden sm:inline">Sort</span>
                              </div>
                              <ChevronDown className="w-4 h-4" />
                            </Button>

                            {showSortDropdown && (
                              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-input rounded-lg shadow-md z-10">
                                {[
                                  { key: 'name', direction: 'asc', label: 'Sort By Name', icon: ArrowUp, iconColor: 'text-green-600' },
                                  { key: 'name', direction: 'desc', label: 'Sort By Name', icon: ArrowDown, iconColor: 'text-blue-600' },
                                  { key: 'pin', direction: 'asc', label: 'Sort By PIN', icon: ArrowUp, iconColor: 'text-green-600' },
                                  { key: 'pin', direction: 'desc', label: 'Sort By PIN', icon: ArrowDown, iconColor: 'text-blue-600' },
                                ].map(({ key, direction, label, icon: Icon, iconColor }) => (
                                  <button
                                    key={`${key}-${direction}`}
                                    onClick={() => {
                                      setSortConfig({ key, direction });
                                      setShowSortDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                                  >
                                    <Icon className={`w-4 h-4 ${iconColor}`} />
                                    <span className="text-foreground font-medium">{label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* List/Grid Toggle */}
                          <div className="flex gap-2 border border-input rounded-xl p-1 bg-white">
                            <button
                              onClick={() => setViewMode('list')}
                              className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'list'
                                  ? 'bg-[#020670] text-white'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              title="List View"
                            >
                              <HamburgerIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'grid'
                                  ? 'bg-[#020670] text-white'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              title="Grid View"
                            >
                              <GridIcon className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Records per page */}
                          <div className="flex items-center gap-2 ml-auto">
                            <Label htmlFor="page-size-current" className="text-xs sm:text-sm whitespace-nowrap">
                              Per page:
                            </Label>
                            <select
                              id="page-size-current"
                              value={currentPeriodPageSize}
                              onChange={(e) => {
                                setCurrentPeriodPageSize(parseInt(e.target.value));
                                setCurrentPeriodCurrentPage(1);
                              }}
                              className="h-8 px-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* List View */}
                      {viewMode === 'list' && (
                        <Card>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                              <thead style={{ backgroundColor: '#01005a' }}>
                                <tr className="border-b">
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Employee ID</th>
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Name</th>
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Entries</th>
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Time Worked</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedCurrentPeriodItems.length ? (
                                  paginatedCurrentPeriodItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{item.pin || "—"}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.name || "—"}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.entries}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{item.time_worked}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="p-6 text-center text-muted-foreground">
                                      No attendance records found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          {/* Pagination */}
                          {(() => {
                            return filteredAndSortedItems.length > 0 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200">
                                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                                  Showing {currentPeriodPaginationStartIndex + 1}-{Math.min(currentPeriodPaginationEndIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length}
                                </div>
                                {currentPeriodTotalPages > 1 && (
                                  <div className="flex items-center gap-3 order-1 sm:order-2">
                                    <button
                                      onClick={() => setCurrentPeriodCurrentPage(prev => Math.max(prev - 1, 1))}
                                      disabled={currentPeriodCurrentPage === 1}
                                      className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                        currentPeriodCurrentPage === 1
                                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                      }`}
                                    >
                                      Prev
                                    </button>
                                    <span className="text-sm font-medium text-gray-900 px-2">
                                      {currentPeriodCurrentPage} / {currentPeriodTotalPages}
                                    </span>
                                    <button
                                      onClick={() => setCurrentPeriodCurrentPage(prev => Math.min(prev + 1, currentPeriodTotalPages))}
                                      disabled={currentPeriodCurrentPage === currentPeriodTotalPages}
                                      className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                        currentPeriodCurrentPage === currentPeriodTotalPages
                                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                      }`}
                                    >
                                      Next
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </Card>
                      )}

                      {/* Grid View */}
                      {viewMode === 'grid' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {paginatedCurrentPeriodItems.length ? (
                              paginatedCurrentPeriodItems.map((item) => (
                                <Card key={item.emp_id} className="hover:shadow-lg transition-shadow">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                          <Users className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <CardTitle className="text-base sm:text-lg truncate">{item.name || "—"}</CardTitle>
                                          <CardDescription className="text-xs sm:text-sm">PIN: {item.pin || "—"}</CardDescription>
                                        </div>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3 sm:space-y-4 pt-0">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                      <span className="text-muted-foreground">Entries</span>
                                      <span className="font-medium text-foreground">{item.entries}</span>
                                    </div>
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                      <span>Time Worked</span>
                                      <span className="font-medium text-foreground">{item.time_worked}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <div className="col-span-full py-8 text-center text-muted-foreground">
                              No attendance records found.
                            </div>
                          )}
                          </div>
                          {/* Pagination */}
                          {(() => {
                            return filteredAndSortedItems.length > 0 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-4">
                                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                                  Showing {currentPeriodPaginationStartIndex + 1}-{Math.min(currentPeriodPaginationEndIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length}
                                </div>
                                {currentPeriodTotalPages > 1 && (
                                  <div className="flex items-center gap-3 order-1 sm:order-2">
                                    <button
                                      onClick={() => setCurrentPeriodCurrentPage(prev => Math.max(prev - 1, 1))}
                                      disabled={currentPeriodCurrentPage === 1}
                                      className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                        currentPeriodCurrentPage === 1
                                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                      }`}
                                    >
                                      Prev
                                    </button>
                                    <span className="text-sm font-medium text-gray-900 px-2">
                                      {currentPeriodCurrentPage} / {currentPeriodTotalPages}
                                    </span>
                                    <button
                                      onClick={() => setCurrentPeriodCurrentPage(prev => Math.min(prev + 1, currentPeriodTotalPages))}
                                      disabled={currentPeriodCurrentPage === currentPeriodTotalPages}
                                      className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                        currentPeriodCurrentPage === currentPeriodTotalPages
                                          ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                      }`}
                                    >
                                      Next
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#01005a]" />
                    Report History
                  </CardTitle>
                  <CardDescription>
                    Select a period or download its report.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Toolbar */}
                  <div className="mb-6 space-y-3 sm:space-y-0">
                    {/* First row: Search */}
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search reports..."
                        value={historySearchQuery}
                        onChange={(e) => {
                          setHistorySearchQuery(e.target.value);
                          setHistoryCurrentPage(1);
                        }}
                        className="pl-10 text-sm h-10 rounded-lg border border-input bg-white w-full"
                      />
                    </div>

                    {/* Second row: Controls */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Sort Control */}
                      <div className="relative">
                        <Button
                          variant="outline"
                          className="px-3 py-2 h-10 text-sm flex items-center gap-2 min-w-[100px] justify-between border border-input rounded-lg"
                          onClick={() => setShowHistorySortDropdown(!showHistorySortDropdown)}
                        >
                          <div className="flex items-center gap-2">
                            {historySortConfig.direction === 'asc' ? (
                              <ArrowUp className="w-4 h-4 text-green-600" />
                            ) : historySortConfig.direction === 'desc' ? (
                              <ArrowDown className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-green-600" />
                            )}
                            <span className="hidden sm:inline">Sort</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </Button>

                        {showHistorySortDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-input rounded-lg shadow-md z-10">
                            {[
                              { key: 'startDate', direction: 'asc', label: 'Sort By Start Date', icon: ArrowUp, iconColor: 'text-green-600' },
                              { key: 'startDate', direction: 'desc', label: 'Sort By Start Date', icon: ArrowDown, iconColor: 'text-blue-600' },
                              { key: 'endDate', direction: 'asc', label: 'Sort By End Date', icon: ArrowUp, iconColor: 'text-green-600' },
                              { key: 'endDate', direction: 'desc', label: 'Sort By End Date', icon: ArrowDown, iconColor: 'text-blue-600' },
                            ].map(({ key, direction, label, icon: Icon, iconColor }) => (
                              <button
                                key={`${key}-${direction}`}
                                onClick={() => {
                                  setHistorySortConfig({ key, direction });
                                  setShowHistorySortDropdown(false);
                                  setHistoryCurrentPage(1);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors"
                              >
                                <Icon className={`w-4 h-4 ${iconColor}`} />
                                <span className="text-foreground font-medium">{label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* List/Grid Toggle */}
                      <div className="flex gap-2 border border-input rounded-xl p-1 bg-white">
                        <button
                          onClick={() => {
                            setHistoryViewMode('list');
                            setHistoryCurrentPage(1);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            historyViewMode === 'list'
                              ? 'bg-[#020670] text-white'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="List View"
                        >
                          <HamburgerIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setHistoryViewMode('grid');
                            setHistoryCurrentPage(1);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            historyViewMode === 'grid'
                              ? 'bg-[#020670] text-white'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Grid View"
                        >
                          <GridIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Records per page */}
                      <div className="flex items-center gap-2 ml-auto">
                        <Label htmlFor="page-size-history" className="text-xs sm:text-sm whitespace-nowrap">
                          Per page:
                        </Label>
                        <select
                          id="page-size-history"
                          value={historyPageSize}
                          onChange={(e) => {
                            setHistoryPageSize(parseInt(e.target.value));
                            setHistoryCurrentPage(1);
                          }}
                          className="h-8 px-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* List View */}
                  {historyViewMode === 'list' && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead style={{ backgroundColor: '#01005a' }}>
                          <tr className="border-b">
                            <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Start Date</th>
                            <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">End Date</th>
                            <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Report Type</th>
                            <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Period End</th>
                            <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">View</th>
                            <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Download PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedHistoryData.length ? (
                            paginatedHistoryData.map((period) => (
                              <tr
                                key={period.start_date}
                                className={`border-b hover:bg-muted/50 ${
                                  selected?.period.start_date === period.start_date &&
                                  selected?.period.end_date === period.end_date
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{formatDate(period.start_date)}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatDate(period.end_date)}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{current?.frequency || "—"}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatDate(period.end_date)}</td>
                                <td className="p-2 sm:p-4 text-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={selecting}
                                    onClick={() => selectPeriod(period)}
                                    className="h-9 px-6 text-sm font-medium text-navyblue-600 border border-black-300 rounded-lg hover:bg-gray-50 shadow-sm"
                                  >
                                    View
                                  </Button>
                                </td>
                                <td className="p-2 sm:p-4 text-center flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={downloadingPeriod?.start_date === period.start_date}
                                    onClick={() => downloadPeriodPdf(period)}
                                    className="h-9 w-9 p-0 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm flex items-center justify-center"
                                  >
                                    <Download className="w-5 h-5 text-gray-600" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-muted-foreground">
                                No report history found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Grid View */}
                  {historyViewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {paginatedHistoryData.length ? (
                        paginatedHistoryData.map((period) => (
                          <Card
                            key={period.start_date}
                            className={`hover:shadow-lg transition-shadow cursor-pointer ${
                              selected?.period.start_date === period.start_date &&
                              selected?.period.end_date === period.end_date
                                ? "bg-blue-50 border-blue-300"
                                : ""
                            }`}
                            onClick={() => selectPeriod(period)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base sm:text-lg">
                                {formatDate(period.start_date)} – {formatDate(period.end_date)}
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm">
                                {current?.frequency || "Report Period"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={selecting}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectPeriod(period);
                                  }}
                                  className="flex-1 h-9 text-xs sm:text-sm font-medium text-navyblue-600 border border-black-300 rounded-lg hover:bg-gray-50"
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={downloadingPeriod?.start_date === period.start_date}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadPeriodPdf(period);
                                  }}
                                  className="h-9 w-9 p-0 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                                >
                                  <Download className="w-4 h-4 text-gray-600" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                          No report history found.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {filteredAndSortedHistoryData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-6">
                      <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                        Showing {paginatedHistoryStartIndex + 1}-{Math.min(paginatedHistoryEndIndex, filteredAndSortedHistoryData.length)} of {filteredAndSortedHistoryData.length}
                      </div>
                      {totalHistoryPages > 1 && (
                        <div className="flex items-center gap-3 order-1 sm:order-2">
                          <button
                            onClick={() => setHistoryCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={historyCurrentPage === 1}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              historyCurrentPage === 1
                                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            Prev
                          </button>
                          <span className="text-sm font-medium text-gray-900 px-2">
                            {historyCurrentPage} / {totalHistoryPages}
                          </span>
                          <button
                            onClick={() => setHistoryCurrentPage(prev => Math.min(prev + 1, totalHistoryPages))}
                            disabled={historyCurrentPage === totalHistoryPages}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              historyCurrentPage === totalHistoryPages
                                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
