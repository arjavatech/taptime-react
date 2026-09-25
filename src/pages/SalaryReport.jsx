import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarDays, Download, History, Loader2, Users, Search, ArrowUp, ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Printer, X } from "lucide-react";
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
const formatTimeValue = (value) => (value === "00:00" || !value) ? "—" : value;

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
  const [historySelectedReport, setHistorySelectedReport] = useState(null);
  const [historyViewPageSize, setHistoryViewPageSize] = useState(10);
  const [historyViewCurrentPage, setHistoryViewCurrentPage] = useState(1);
  const [historyViewSearchQuery, setHistoryViewSearchQuery] = useState("");
  const [showHistoryViewSortDropdown, setShowHistoryViewSortDropdown] = useState(false);
  const [historyReportTableMode, setHistoryReportTableMode] = useState("table");
  const [historyReportSortConfig, setHistoryReportSortConfig] = useState({ key: null, direction: "asc" });
  const [downloadingPrintPeriod, setDownloadingPrintPeriod] = useState(null);
  const [printingInlineReport, setPrintingInlineReport] = useState(false);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const HISTORY_PAGE_SIZE = 12;
  const report = selected || current;

  // Refs for pagination scroll-to-top behavior
  const currentPeriodTableRef = useRef(null);
  const historyTableRef = useRef(null);
  const historyViewTableRef = useRef(null);

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
      setHistoryReportTableMode("grid");
    }
  }, []);

  // Scroll to top of paginated table when current period page changes
  useEffect(() => {
    const scrollTimer = requestAnimationFrame(() => {
      if (currentPeriodTableRef.current) {
        currentPeriodTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => cancelAnimationFrame(scrollTimer);
  }, [currentPeriodCurrentPage]);

  // Scroll to top of history table when history page changes
  useEffect(() => {
    const scrollTimer = requestAnimationFrame(() => {
      if (historyTableRef.current) {
        historyTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => cancelAnimationFrame(scrollTimer);
  }, [historyCurrentPage]);

  // Scroll to top of history view table when history view page changes
  useEffect(() => {
    const scrollTimer = requestAnimationFrame(() => {
      if (historyViewTableRef.current) {
        const top =
          historyViewTableRef.current.getBoundingClientRect().top +
          window.scrollY -
          20;

        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    });
    return () => cancelAnimationFrame(scrollTimer);
  }, [historyViewCurrentPage]);

  const selectPeriod = async (period) => {
    setSelecting(true);
    setError("");
    try {
      const response = await getSalaryReportPeriod(companyId, period.start_date, period.end_date);
      setHistorySelectedReport(response.data);
      setHistoryViewCurrentPage(1);
      setHistoryViewSearchQuery("");
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
      head: [["Employee", "PIN", "Days", "Time worked"]],
      body: reportData.items.map((item) => [
        item.name || "—",
        item.pin || "—",
        item.days,
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

  const printPeriodPdf = async (period) => {
    setDownloadingPrintPeriod(period);
    try {
      const response = await getSalaryReportPeriod(companyId, period.start_date, period.end_date);
      const doc = new jsPDF();
      const companyName = localStorage.getItem("companyName") || "TapTime";
      doc.setFontSize(18);
      doc.text(`${companyName} Salary Report`, 14, 18);
      doc.setFontSize(11);
      doc.text(`${response.data.frequency}: ${periodLabel(response.data.period)}`, 14, 27);
      doc.text(
        `Total time: ${response.data.totals.time_worked}   Employees: ${response.data.totals.employees}`,
        14,
        34
      );
      autoTable(doc, {
        startY: 40,
        head: [["Employee", "PIN", "Days", "Time worked"]],
        body: response.data.items.map((item) => [
          item.name || "—",
          item.pin || "—",
          item.days,
          item.time_worked,
        ]),
        headStyles: { fillColor: [2, 6, 111] },
      });
      const pdfUrl = URL.createObjectURL(doc.output("blob"));
      const win = window.open(pdfUrl);
      win.addEventListener("load", () => {
        win.print();
      });
    } catch (err) {
      setError(err.message || "Unable to print this report");
    } finally {
      setDownloadingPrintPeriod(null);
    }
  };


  const handlePrint = () => {
    if (!report) return;
    const doc = new jsPDF();
    const companyName = localStorage.getItem("companyName") || "TapTime";
    doc.setFontSize(18);
    doc.text(`${companyName} Salary Report`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${report.frequency}: ${periodLabel(report.period)}`, 14, 27);
    doc.text(
      `Total time: ${report.totals.time_worked}   Employees: ${report.totals.employees}`,
      14,
      34
    );
    autoTable(doc, {
      startY: 40,
      head: [["Employee", "PIN", "Days", "Time worked"]],
      body: report.items.map((item) => [
        item.name || "—",
        item.pin || "—",
        item.days,
        item.time_worked,
      ]),
      headStyles: { fillColor: [2, 6, 111] },
    });
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl);
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
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
            <Button onClick={handlePrint} disabled={!report || selecting} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
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
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Employees</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">{current.totals.employees}</p>
                          </div>
                          <div className="text-blue-300 text-4xl">👥</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-green-600 font-medium">Total Hours</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">{current.totals.time_worked}</p>
                          </div>
                          <div className="text-green-300 text-4xl">⏱️</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report && (
                  <Card ref={currentPeriodTableRef}>
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
                      <div className="mb-6 space-y-3">
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
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Days</th>
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Time Worked</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedCurrentPeriodItems.length ? (
                                  paginatedCurrentPeriodItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{item.pin || "—"}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.name || "—"}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatTimeValue(item.days) || item.days}</td>
                                      <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{formatTimeValue(item.time_worked)}</td>
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
                                      <span className="text-muted-foreground">Days</span>
                                      <span className="font-medium text-foreground">{formatTimeValue(item.days) || item.days}</span>
                                    </div>
                                  <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                      <span>Time Worked</span>
                                      <span className="font-medium text-foreground">{formatTimeValue(item.time_worked)}</span>
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
                  <div className="mb-6 space-y-3">
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
                    <div className="overflow-x-auto" ref={historyTableRef}>
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
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      disabled={downloadingPeriod?.start_date === period.start_date}
                                      onClick={() => downloadPeriodPdf(period)}
                                      className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1"
                                    >
                                      {downloadingPeriod?.start_date === period.start_date ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      disabled={downloadingPrintPeriod?.start_date === period.start_date}
                                      onClick={() => printPeriodPdf(period)}
                                      variant="outline"
                                      className="h-9 px-3 flex items-center justify-center gap-1"
                                    >
                                      {downloadingPrintPeriod?.start_date === period.start_date ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Printer className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" ref={historyTableRef}>
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
                                  disabled={downloadingPeriod?.start_date === period.start_date}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadPeriodPdf(period);
                                  }}
                                  className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1"
                                >
                                  {downloadingPeriod?.start_date === period.start_date ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span className="text-xs">Generating PDF...</span>
                                    </>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={downloadingPrintPeriod?.start_date === period.start_date}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    printPeriodPdf(period);
                                  }}
                                  variant="outline"
                                  className="h-9 px-3 flex items-center justify-center gap-1"
                                >
                                  {downloadingPrintPeriod?.start_date === period.start_date ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span className="text-xs">Printing...</span>
                                    </>
                                  ) : (
                                    <Printer className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
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
            {/* Inline History Report View */}
            {historySelectedReport && (
              <Card className="mt-6 overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <CardTitle className="text-base sm:text-lg break-words">Report: {periodLabel(historySelectedReport.period)}</CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button onClick={() => printPeriodPdf(historySelectedReport.period)} disabled={!historySelectedReport} size="sm" variant="outline" className="h-8 text-xs sm:text-sm">
                        <Printer className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Print</span>
                      </Button>
                      <Button onClick={() => setHistorySelectedReport(null)} variant="outline" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:border-red-300 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">


                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-blue-600 font-medium">Total Employees</p>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-2">{historySelectedReport.totals.employees}</p>
                        </div>
                        <div className="text-blue-300 text-4xl">👥</div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-green-600 font-medium">Total Hours</p>
                          <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">{historySelectedReport.totals.time_worked}</p>
                        </div>
                        <div className="text-green-300 text-4xl">⏱️</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-3">
                    {/* First row: Search */}
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search by name or PIN..."
                        value={historyViewSearchQuery}
                        onChange={(e) => {
                          setHistoryViewSearchQuery(e.target.value);
                          setHistoryViewCurrentPage(1);
                        }}
                        className="pl-10 text-sm h-10 rounded-lg border border-input bg-white w-full"
                      />
                    </div>

                    {/* Second row: Controls */}
                    <div className="flex flex-wrap gap-2 items-center w-full">
                      {/* Sort Control */}
                      <div className="relative">
                        <Button
                          variant="outline"
                          className="px-3 py-2 h-10 text-xs sm:text-sm flex items-center gap-2 min-w-max sm:min-w-[100px] justify-between border border-input rounded-lg"
                          onClick={() => setShowHistoryViewSortDropdown(!showHistoryViewSortDropdown)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline">Sort</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </Button>

                        {showHistoryViewSortDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-input rounded-lg shadow-md z-10">
                            {[
                              { key: 'name', direction: 'asc', label: 'Sort By Name (A-Z)', icon: ArrowUp, iconColor: 'text-green-600' },
                              { key: 'name', direction: 'desc', label: 'Sort By Name (Z-A)', icon: ArrowDown, iconColor: 'text-blue-600' },
                              { key: 'pin', direction: 'asc', label: 'Sort By PIN (Low-High)', icon: ArrowUp, iconColor: 'text-green-600' },
                              { key: 'pin', direction: 'desc', label: 'Sort By PIN (High-Low)', icon: ArrowDown, iconColor: 'text-blue-600' },
                            ].map(({ key, direction, label, icon: Icon, iconColor }) => (
                              <button
                                key={`${key}-${direction}`}
                                onClick={() => {
                                  setHistoryReportSortConfig({ key, direction });
                                  setShowHistoryViewSortDropdown(false);
                                  setHistoryViewCurrentPage(1);
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
                          onClick={() => setHistoryReportTableMode('table')}
                          className={`p-2 rounded-lg transition-colors ${
                            historyReportTableMode === 'table'
                              ? 'bg-[#020670] text-white'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="List View"
                        >
                          <HamburgerIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setHistoryReportTableMode('grid')}
                          className={`p-2 rounded-lg transition-colors ${
                            historyReportTableMode === 'grid'
                              ? 'bg-[#020670] text-white'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          title="Grid View"
                        >
                          <GridIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Records per page */}
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Label htmlFor="page-size-history-view" className="text-xs sm:text-sm whitespace-nowrap">
                          Per page:
                        </Label>
                        <select
                          id="page-size-history-view"
                          value={historyViewPageSize}
                          onChange={(e) => {
                            setHistoryViewPageSize(parseInt(e.target.value));
                            setHistoryViewCurrentPage(1);
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

                  {/* Employee Table */}
                  <div ref={historyViewTableRef}>
                  {(() => {
                    let filtered = historySelectedReport.items.filter(item =>
                      (item.name && item.name.toLowerCase().includes(historyViewSearchQuery.toLowerCase())) ||
                      (item.pin && item.pin.toLowerCase().includes(historyViewSearchQuery.toLowerCase()))
                    );

                    // Apply sorting
                    if (historyReportSortConfig.key) {
                      filtered.sort((a, b) => {
                        let aValue, bValue;

                        if (historyReportSortConfig.key === "name") {
                          aValue = (a.name || "").toLowerCase();
                          bValue = (b.name || "").toLowerCase();
                          return historyReportSortConfig.direction === "asc"
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                        } else if (historyReportSortConfig.key === "pin") {
                          aValue = a.pin || "";
                          bValue = b.pin || "";
                          // Convert to numbers for numeric sorting
                          const aNum = parseInt(aValue, 10) || 0;
                          const bNum = parseInt(bValue, 10) || 0;
                          return historyReportSortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
                        }
                        return 0;
                      });
                    }

                    const startIdx = (historyViewCurrentPage - 1) * historyViewPageSize;
                    const endIdx = startIdx + historyViewPageSize;
                    const paginated = filtered.slice(startIdx, endIdx);
                    const totalPages = Math.ceil(filtered.length / historyViewPageSize);

                    return (
                      <>
                        {historyReportTableMode === 'table' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead style={{ backgroundColor: '#01005a' }}>
                                <tr className="border-b">
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white">Name</th>
                                  <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white">PIN</th>
                                  <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white">Days</th>
                                  <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white">Time Worked</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginated.map((item, idx) => (
                                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.name || "—"}</td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{item.pin || "—"}</td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-center">{formatTimeValue(item.days) || item.days}</td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-center font-semibold">{formatTimeValue(item.time_worked)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {historyReportTableMode === 'grid' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {paginated.length ? (
                              paginated.map((item, idx) => (
                                <Card key={idx} className="hover:shadow-lg transition-shadow">
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
                                      <span className="text-muted-foreground">Days</span>
                                      <span className="font-medium text-foreground">{formatTimeValue(item.days) || item.days}</span>
                                    </div>
                                    <div className="pt-2 border-t">
                                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                        <span>Time Worked</span>
                                        <span className="font-medium text-foreground">{formatTimeValue(item.time_worked)}</span>
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
                        )}

                        {/* Pagination 2 */}
                        {filtered.length > 0 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Showing {startIdx + 1}-{Math.min(endIdx, filtered.length)} of {filtered.length}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setHistoryViewCurrentPage(Math.max(1, historyViewCurrentPage - 1))}
                                disabled={historyViewCurrentPage === 1}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  historyViewCurrentPage === 1
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                Prev
                              </button>

                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {historyViewCurrentPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setHistoryViewCurrentPage(Math.min(totalPages, historyViewCurrentPage + 1))}
                                disabled={historyViewCurrentPage === totalPages}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  historyViewCurrentPage === totalPages
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                Next
                              </button>
                              </div>
                            </div>
                        )}
                      </>
                    );
                  })()}
                  </div>
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