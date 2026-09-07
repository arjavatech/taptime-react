import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CalendarDays, Download, History, Loader2, Users } from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { getCurrentSalaryReport, getSalaryReportHistory, getSalaryReportPeriod } from "../api";

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
  const companyId = localStorage.getItem("companyID");

  const HISTORY_PAGE_SIZE = 12;

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

  const selectPeriod = async (period) => {
    setSelecting(true);
    setError("");
    try {
      const response = await getSalaryReportPeriod(companyId, period.start_date, period.end_date);
      setSelected(response.data);
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

  const report = selected || current;
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

            {current && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#01005a]" />
                    Current Report Period
                  </CardTitle>
                  <CardDescription>
                    {current.frequency} · {periodLabel(current.period)}
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#01005a]" />
                    {report.period.is_current
                      ? "Current Report Values"
                      : `Report Values: ${periodLabel(report.period)}`}
                    {selecting && <Loader2 className="w-4 h-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b text-left text-muted-foreground">
                        <tr>
                          <th className="p-3">Employee</th>
                          <th className="p-3">PIN</th>
                          <th className="p-3">Entries</th>
                          <th className="p-3">Time worked</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.items.length ? (
                          report.items.map((item) => (
                            <tr key={item.emp_id} className="border-b">
                              <td className="p-3">{item.name || "—"}</td>
                              <td className="p-3">{item.pin || "—"}</td>
                              <td className="p-3">{item.entries}</td>
                              <td className="p-3 font-medium">{item.time_worked}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="p-6 text-center text-muted-foreground">
                              No attendance records in this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report History Table */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#01005a]" />
                  Report History
                </CardTitle>
                <CardDescription>
                  Select a period or download its report. Showing {visibleHistory.length} of{" "}
                  {history.length} records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b text-left text-muted-foreground">
                      <tr>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">End Date</th>
                        <th className="p-3">Report Type</th>
                        <th className="p-3">Period End</th>
                        <th className="p-3 text-center">View Report</th>
                        <th className="p-3 text-center">Download PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleHistory.map((period) => (
                        <tr
                          key={period.start_date}
                          className={`border-b ${
                            selected?.period.start_date === period.start_date &&
                            selected?.period.end_date === period.end_date
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <td className="p-3">{formatDate(period.start_date)}</td>
                          <td className="p-3">{formatDate(period.end_date)}</td>
                          <td className="p-3">{current?.frequency || "—"}</td>
                          <td className="p-3">{formatDate(period.end_date)}</td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selecting}
                              onClick={() => selectPeriod(period)}
                            >
                              View
                            </Button>
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={downloadingPeriod?.start_date === period.start_date}
                              onClick={() => downloadPeriodPdf(period)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Load More Button */}
                {visibleCount < history.length && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((c) => c + HISTORY_PAGE_SIZE)}
                    >
                      Load More ({history.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
