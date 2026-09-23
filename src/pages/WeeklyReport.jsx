import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarDays, Download, Loader2, Users, Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Printer, X, ChevronDown } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { getWeeklyReportCurrent, getWeeklyReportHistory, getWeeklyReportPeriod } from "../api";
import { GridIcon } from "../components/icons/GridIcon";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";

const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
const periodLabel = (period) => `${formatDate(period.start_date)} – ${formatDate(period.end_date)}`;
const formatTimeValue = (value) => (value === "00:00" || !value) ? "—" : value;
const getCompletedDaysCount = (items) => {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  let daysWithWork = new Set();

  items.forEach(item => {
    days.forEach(day => {
      if (item[day] && item[day] !== "00:00") {
        daysWithWork.add(day);
      }
    });
  });

  return daysWithWork.size;
};

export default function WeeklyReport() {
  const location = useLocation();
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState("");
  const [downloadingPeriod, setDownloadingPeriod] = useState(null);
  const [downloadingPrintPeriod, setDownloadingPrintPeriod] = useState(null);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewMode, setViewMode] = useState("list");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const HISTORY_PAGE_SIZE = 12;
  const report = selected || current;

  const filteredAndSortedItems = useMemo(() => {
    if (!report) return [];

    let items = [...report.items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.pin && item.pin.toLowerCase().includes(query))
      );
    }

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
          const aNum = parseInt(aValue, 10) || 0;
          const bNum = parseInt(bValue, 10) || 0;
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        } else if (sortConfig.key === "total_hours") {
          aValue = parseFloat(a.total_hours) || 0;
          bValue = parseFloat(b.total_hours) || 0;
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return items;
  }, [report, searchQuery, sortConfig]);

  const getCurrentPeriodItemsPerPage = () => currentPeriodPageSize;
  const currentPeriodPaginationStartIndex = (currentPeriodCurrentPage - 1) * getCurrentPeriodItemsPerPage();
  const currentPeriodPaginationEndIndex = currentPeriodPaginationStartIndex + getCurrentPeriodItemsPerPage();
  const currentPeriodTotalPages = Math.ceil(filteredAndSortedItems.length / getCurrentPeriodItemsPerPage());
  const paginatedCurrentPeriodItems = filteredAndSortedItems.slice(currentPeriodPaginationStartIndex, currentPeriodPaginationEndIndex);

  const filteredAndSortedHistoryData = useMemo(() => {
    let items = [...history];

    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      items = items.filter(item =>
        (formatDate(item.start_date) && formatDate(item.start_date).toLowerCase().includes(query)) ||
        (formatDate(item.end_date) && formatDate(item.end_date).toLowerCase().includes(query))
      );
    }

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
        getWeeklyReportCurrent(companyId),
        getWeeklyReportHistory(companyId),
      ]);
      setCurrent(currentResponse.data);
      setSelected(currentResponse.data);
      setHistory(historyResponse.data.periods || []);
    } catch (err) {
      setError(err.message || "Unable to load weekly reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId, location.pathname]);

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
      const response = await getWeeklyReportPeriod(companyId, period.start_date, period.end_date);
      setSelected(response.data);
      setActiveTab("current");
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
    doc.text(`${companyName} Weekly Time Report`, 14, 18);
    doc.setFontSize(11);
    doc.text(`Week: ${periodLabel(reportData.period)}`, 14, 27);
    doc.text(
      `Total time: ${reportData.totals.total_hours}   Overtime: ${reportData.totals.overtime_hours}   Employees: ${reportData.totals.employees}`,
      14,
      34
    );
    autoTable(doc, {
      startY: 40,
      head: [["Employee", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total", "Overtime"]],
      body: reportData.items.map((item) => [
        item.name || "—",
        formatTimeValue(item.mon),
        formatTimeValue(item.tue),
        formatTimeValue(item.wed),
        formatTimeValue(item.thu),
        formatTimeValue(item.fri),
        formatTimeValue(item.sat),
        formatTimeValue(item.sun),
        formatTimeValue(item.total_hours),
        formatTimeValue(item.overtime_hours),
      ]),
      headStyles: { fillColor: [2, 6, 111] },
      willDrawCell: (data) => {
        if (data.column.index === 9 && data.row.section === 'body') {
          const cellValue = data.cell.text;
          if (cellValue && cellValue !== "00:00" && cellValue !== "—") {
            data.cell.styles.fillColor = [255, 229, 100];
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
      },
    });
    doc.save(`weekly-report-${reportData.period.start_date}-to-${reportData.period.end_date}.pdf`);
  };

  const downloadPdf = () => {
    generatePdf(selected || current);
  };

  const handlePrint = () => {
    const reportData = selected || current;
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Weekly Time Report", 14, 14);
    doc.setFontSize(11);
    doc.text(`${periodLabel(reportData.period)}`, 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [["Employee", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total", "Overtime"]],
      body: reportData.items.map((item) => [
        item.name || "—",
        formatTimeValue(item.mon),
        formatTimeValue(item.tue),
        formatTimeValue(item.wed),
        formatTimeValue(item.thu),
        formatTimeValue(item.fri),
        formatTimeValue(item.sat),
        formatTimeValue(item.sun),
        formatTimeValue(item.total_hours),
        formatTimeValue(item.overtime_hours),
      ]),
      headStyles: { fillColor: [2, 6, 111] },
      willDrawCell: (data) => {
        if (data.column.index === 9 && data.row.section === 'body') {
          const cellValue = data.cell.text;
          if (cellValue && cellValue !== "00:00" && cellValue !== "—") {
            data.cell.styles.fillColor = [255, 229, 100];
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
      },
    });
    const pdfUrl = URL.createObjectURL(doc.output("blob"));
    const printWindow = window.open(pdfUrl);
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  };

  const downloadPeriodPdf = async (period) => {
    setDownloadingPeriod(period);
    try {
      const response = await getWeeklyReportPeriod(companyId, period.start_date, period.end_date);
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
      const response = await getWeeklyReportPeriod(companyId, period.start_date, period.end_date);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const labelFont = 10;
      const contentFont = 9;
      const lineSpacing = 6;
      let yPosition = margin;
      doc.setFontSize(16);
      doc.text("Weekly Time Report", margin, yPosition);
      yPosition += 8;
      doc.setFontSize(labelFont);
      doc.text(`${periodLabel(response.data.period)}`, margin, yPosition);
      yPosition += lineSpacing + 2;
      doc.setDrawColor(0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;
      doc.setFontSize(contentFont);
      const summaryData = [
        ["Total Employees", response.data.totals?.employees || "0"],
        ["Total Hours", response.data.totals?.hours || "0:00"],
        ["Overtime Hours", response.data.totals?.overtime || "0:00"],
      ];
      summaryData.forEach((row) => {
        doc.text(row[0] + ":", margin, yPosition);
        doc.text(row[1], pageWidth - margin - 40, yPosition);
        yPosition += lineSpacing;
      });
      yPosition += 4;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
      autoTable(doc, {
        startY: yPosition,
        head: [["Employee Name", "PIN", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Total Hours", "Overtime"]],
        body: (response.data.items || []).map((item) => [
          item.name,
          item.pin,
          item.days?.monday || "—",
          item.days?.tuesday || "—",
          item.days?.wednesday || "—",
          item.days?.thursday || "—",
          item.days?.friday || "—",
          item.days?.saturday || "—",
          item.days?.sunday || "—",
          item.total_hours || "—",
          item.overtime || "—",
        ]),
        margin: margin,
        didDrawPage: () => {},
        willDrawCell: (data) => {
          if (data.column.index === 10 && data.row.section === 'body') {
            const cellValue = data.cell.text;
            if (cellValue && cellValue !== "00:00" && cellValue !== "—") {
              data.cell.styles.fillColor = [255, 229, 100];
              data.cell.styles.textColor = [0, 0, 0];
            }
          }
        },
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

  return (
    <div className="min-h-screen bg-slate-50">
      <CenterLoadingOverlay show={selecting} message="Loading report…" />
      <CenterLoadingOverlay show={downloadingPeriod !== null} message="Generating PDF…" />
      <CenterLoadingOverlay show={downloadingPrintPeriod !== null} message="Generating PDF…" />
      <Header />
      <main className="pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#01005a]">Weekly Time Report</h1>
            <p className="text-sm text-muted-foreground">
              Employee hours tracked by day for each week.
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
                  Current Week
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
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
                              <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-2">{current.totals.total_hours}</p>
                            </div>
                            <div className="text-green-300 text-4xl">⏱️</div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 sm:p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-orange-600 font-medium">Overtime Hours</p>
                              <p className="text-2xl sm:text-3xl font-bold text-orange-900 mt-2">{current.totals.overtime_hours}</p>
                            </div>
                            <div className="text-orange-300 text-4xl">⚡</div>
                          </div>
                        </div>
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
                      {/* Week Summary Card */}
                      {report && (
                        <div className="mb-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4 sm:p-6">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-indigo-900">Current Week</p>
                            <p className="text-xs text-indigo-700">{periodLabel(report.period)}</p>
                            <div className="pt-2 border-t border-indigo-200">
                              <p className="text-sm text-indigo-700 font-medium">{getCompletedDaysCount(report.items)} of 5 days complete · Expected hours: {getCompletedDaysCount(report.items) * 8}:00</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Toolbar */}
                      <div className="mb-6 space-y-3 sm:space-y-0">
                        {/* Search */}
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-sm h-10 rounded-lg border border-input bg-white w-full"
                          />
                        </div>

                        {/* Controls row */}
                        <div className="flex flex-wrap gap-3 items-center">
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
                                  { key: 'total_hours', direction: 'asc', label: 'Sort By Total Hours', icon: ArrowUp, iconColor: 'text-green-600' },
                                  { key: 'total_hours', direction: 'desc', label: 'Sort By Total Hours', icon: ArrowDown, iconColor: 'text-blue-600' },
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
                                setCurrentPeriodPageSize(parseInt(e.target.value, 10));
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
                      {viewMode === "list" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-y border-gray-300">
                              <tr>
                                <th className="px-3 py-2 text-left">Employee</th>
                                <th className="px-3 py-2 text-center">Mon</th>
                                <th className="px-3 py-2 text-center">Tue</th>
                                <th className="px-3 py-2 text-center">Wed</th>
                                <th className="px-3 py-2 text-center">Thu</th>
                                <th className="px-3 py-2 text-center">Fri</th>
                                <th className="px-3 py-2 text-center">Sat</th>
                                <th className="px-3 py-2 text-center">Sun</th>
                                <th className="px-3 py-2 text-center">Total</th>
                                <th className="px-3 py-2 text-center">Overtime</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedCurrentPeriodItems.map((item, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="px-3 py-2">{item.name || "—"}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.mon)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.tue)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.wed)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.thu)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.fri)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.sat)}</td>
                                  <td className="px-3 py-2 text-center">{formatTimeValue(item.sun)}</td>
                                  <td className="px-3 py-2 text-center font-semibold">{formatTimeValue(item.total_hours)}</td>
                                  <td className={`px-3 py-2 text-center font-semibold ${
                                    item.overtime_hours && item.overtime_hours !== "00:00"
                                      ? "bg-yellow-200 text-gray-900 rounded"
                                      : "text-orange-600"
                                  }`}>
                                    {formatTimeValue(item.overtime_hours)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Grid View */}
                      {viewMode === "grid" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {paginatedCurrentPeriodItems.map((item, idx) => (
                            <Card key={idx} className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Name</p>
                                  <p className="font-semibold">{item.name || "—"}</p>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {[["Mon", item.mon], ["Tue", item.tue], ["Wed", item.wed], ["Thu", item.thu], ["Fri", item.fri], ["Sat", item.sat], ["Sun", item.sun]].map(([day, val]) => (
                                    <div key={day}>
                                      <p className="text-xs text-muted-foreground">{day}</p>
                                      <p className="text-sm font-medium">{formatTimeValue(val)}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                  <div className="flex justify-between">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Total</p>
                                      <p className="font-semibold">{formatTimeValue(item.total_hours)}</p>
                                    </div>
                                    <div className={`p-2 rounded ${
                                      item.overtime_hours && item.overtime_hours !== "00:00"
                                        ? "bg-yellow-200"
                                        : ""
                                    }`}>
                                      <p className="text-xs text-muted-foreground">Overtime</p>
                                      <p className={`font-semibold ${
                                        item.overtime_hours && item.overtime_hours !== "00:00"
                                          ? "text-gray-900"
                                          : "text-orange-600"
                                      }`}>
                                        {formatTimeValue(item.overtime_hours)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Pagination */}
                      <div className="mt-6 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Page {currentPeriodCurrentPage} of {currentPeriodTotalPages}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setCurrentPeriodCurrentPage(Math.max(1, currentPeriodCurrentPage - 1))}
                            disabled={currentPeriodCurrentPage === 1}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setCurrentPeriodCurrentPage(Math.min(currentPeriodTotalPages, currentPeriodCurrentPage + 1))}
                            disabled={currentPeriodCurrentPage === currentPeriodTotalPages}
                            variant="outline"
                            size="sm"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <>
                <Card>
                  <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle>History</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Toolbar */}
                    <div className="mb-6 space-y-3 sm:space-y-0">
                      {/* Search */}
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search periods..."
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          className="pl-10 text-sm h-10 rounded-lg border border-input bg-white w-full"
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                        <div className="flex gap-2 sm:gap-3">
                          {/* Sort Dropdown */}
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
                                  { key: 'startDate', direction: 'asc', label: 'Start Date (Ascending)', icon: ArrowUp, iconColor: 'text-green-600' },
                                  { key: 'startDate', direction: 'desc', label: 'Start Date (Descending)', icon: ArrowDown, iconColor: 'text-blue-600' },
                                  { key: 'endDate', direction: 'asc', label: 'End Date (Ascending)', icon: ArrowUp, iconColor: 'text-green-600' },
                                  { key: 'endDate', direction: 'desc', label: 'End Date (Descending)', icon: ArrowDown, iconColor: 'text-blue-600' },
                                ].map(({ key, direction, label, icon: Icon, iconColor }) => (
                                  <button
                                    key={`${key}-${direction}`}
                                    onClick={() => {
                                      setHistorySortConfig({ key, direction });
                                      setShowHistorySortDropdown(false);
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
                              onClick={() => setHistoryViewMode('list')}
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
                              onClick={() => setHistoryViewMode('grid')}
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
                                setHistoryPageSize(parseInt(e.target.value, 10));
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
                    </div>

                    {/* List View */}
                    {historyViewMode === "list" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-y border-gray-300">
                            <tr>
                              <th className="px-3 py-2 text-left">Week</th>
                              <th className="px-3 py-2 text-center">Employees</th>
                              <th className="px-3 py-2 text-center">Total Hours</th>
                              <th className="px-3 py-2 text-center">Overtime Hours</th>
                              <th className="px-3 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedHistoryData.map((period, idx) => (
                              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-3 py-2">{periodLabel(period)}</td>
                                <td className="px-3 py-2 text-center">—</td>
                                <td className="px-3 py-2 text-center">—</td>
                                <td className="px-3 py-2 text-center">—</td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      onClick={() => selectPeriod(period)}
                                      disabled={selecting}
                                      variant="outline"
                                      size="sm"
                                    >
                                      View
                                    </Button>
                                    <Button
                                      onClick={() => downloadPeriodPdf(period)}
                                      disabled={downloadingPeriod?.start_date === period.start_date}
                                      size="sm"
                                      className="h-9 px-3 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center gap-1"
                                    >
                                      {downloadingPeriod?.start_date === period.start_date ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Download className="w-4 h-4" />
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => printPeriodPdf(period)}
                                      disabled={downloadingPrintPeriod?.start_date === period.start_date}
                                      size="sm"
                                      className="h-9 px-3 bg-[#01005a] hover:bg-[#020680] text-white flex items-center justify-center gap-1"
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Grid View */}
                    {historyViewMode === "grid" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedHistoryData.map((period, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Week</p>
                                <p className="font-semibold">{periodLabel(period)}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => selectPeriod(period)}
                                  disabled={selecting}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  View
                                </Button>
                                <Button
                                  onClick={() => downloadPeriodPdf(period)}
                                  disabled={downloadingPeriod?.start_date === period.start_date}
                                  size="sm"
                                  className="h-9 px-3 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center gap-1"
                                >
                                  {downloadingPeriod?.start_date === period.start_date ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  onClick={() => printPeriodPdf(period)}
                                  disabled={downloadingPrintPeriod?.start_date === period.start_date}
                                  size="sm"
                                  className="h-9 px-3 bg-[#01005a] hover:bg-[#020680] text-white flex items-center justify-center gap-1"
                                >
                                  {downloadingPrintPeriod?.start_date === period.start_date ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Printer className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Page {historyCurrentPage} of {totalHistoryPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setHistoryCurrentPage(Math.max(1, historyCurrentPage - 1))}
                          disabled={historyCurrentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setHistoryCurrentPage(Math.min(totalHistoryPages, historyCurrentPage + 1))}
                          disabled={historyCurrentPage === totalHistoryPages}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
