import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { getCompanyInvoices } from "../api.js";
import {
  Calendar,
  Download,
  FileText,
  AlertCircle,
  Loader2,
  Receipt,
  ChevronDown
} from "lucide-react";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [error, setError] = useState("");
  const companyId = localStorage.getItem("companyID");

  const monthOptions = [
    { value: 1, label: "Last Month" },
    { value: 3, label: "Last 3 Months" },
    { value: 6, label: "Last 6 Months" },
    { value: 12, label: "Last 12 Months" }
  ];

  // Load invoices on mount and when filter changes
  useEffect(() => {
    loadInvoices();
  }, [selectedMonths]);

  // Listen for company changes
  useEffect(() => {
    const handleCompanyChange = () => {
      loadInvoices();
    };
    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, [selectedMonths]);

  const loadInvoices = async () => {
    if (!companyId) {
      setLoading(false);
      setError("No company selected");
      return;
    }

    setLoading(true);
    setError("");

    const result = await getCompanyInvoices(companyId, selectedMonths);

    if (result.success) {
      setInvoices(result.data.invoices || []);
    } else {
      setError(result.error || "An unexpected error occurred");
      setInvoices([]);
    }

    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return "N/A";
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD"
    });
    return formatter.format(numAmount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
      open: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Open" },
      void: { bg: "bg-gray-100", text: "text-gray-800", label: "Void" },
      uncollectible: { bg: "bg-red-100", text: "text-red-800", label: "Uncollectible" }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.open;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleDownloadPDF = async (pdfUrl, invoiceId) => {
    if (!pdfUrl) return;

    setDownloadingPDF(true);
    try {
      const response = await fetch(pdfUrl, { mode: 'cors' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadingPDF(false);
      }, 500);
    } catch (error) {
      console.error('Download failed:', error);
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `invoice-${invoiceId}.pdf`;
      a.target = '_self';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        setDownloadingPDF(false);
      }, 1500)
    }
  };

  const handleMonthSelect = (months) => {
    setSelectedMonths(months);
    setShowMonthDropdown(false);
  };

  const getSelectedMonthLabel = () => {
    const option = monthOptions.find(opt => opt.value === selectedMonths);
    return option ? option.label : "Last 6 Months";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Loading Overlay for Page Load */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for PDF Download */}
      {downloadingPDF && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <div className="pt-20 pb-8 flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Invoices & Billing</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and download your billing history
                </p>
              </div>
              {/* Month Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm sm:text-base">{getSelectedMonthLabel()}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showMonthDropdown && (
                  <div className="absolute left-0 sm:right-0 mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {monthOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleMonthSelect(option.value)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${selectedMonths === option.value ? 'bg-blue-50 text-[#01005a] font-medium' : 'text-gray-700'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

          {/* Error State */}
          {error && !loading && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <CardTitle>Error Loading Invoices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && invoices.length === 0 && (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  No Invoices Found
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  There are no invoices for the selected time period.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Desktop Table View */}
          {!loading && !error && invoices.length > 0 && (
            <>
              <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-[#01005a] text-white">
                      <tr>
                        <th className="px-4 xl:px-6 py-4 text-left font-semibold text-sm">Date</th>
                        <th className="px-4 xl:px-6 py-4 text-left font-semibold text-sm">Invoice ID</th>
                        <th className="px-4 xl:px-6 py-4 text-left font-semibold text-sm">Amount</th>
                        <th className="px-4 xl:px-6 py-4 text-left font-semibold text-sm">Employees</th>
                        <th className="px-4 xl:px-6 py-4 text-left font-semibold text-sm">Status</th>
                        <th className="px-4 xl:px-6 py-4 text-center font-semibold text-sm">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 xl:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-900 text-sm">{formatDate(invoice.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <span className="font-mono text-xs text-gray-700">
                              {invoice.stripe_invoice_id?.substring(0, 20) || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            <span className="text-gray-700 text-sm">{invoice.employee_count || 'N/A'}</span>
                          </td>
                          <td className="px-4 xl:px-6 py-4">
                            {getStatusBadge(invoice.invoice_status)}
                          </td>
                          <td className="px-4 xl:px-6 py-4 text-center">
                            <Button
                              onClick={() => handleDownloadPDF(invoice.invoice_pdf_url, invoice.invoice_id)}
                              disabled={!invoice.invoice_pdf_url}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tablet Table View */}
              <div className="hidden md:block lg:hidden bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-[#01005a] text-white">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold text-sm">Date</th>
                        <th className="px-3 py-3 text-left font-semibold text-sm">Amount</th>
                        <th className="px-3 py-3 text-left font-semibold text-sm">Status</th>
                        <th className="px-3 py-3 text-center font-semibold text-sm">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-900 text-sm font-medium">{formatDate(invoice.created_at)}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {invoice.stripe_invoice_id?.substring(0, 15) || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {invoice.employee_count || 'N/A'} employees
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            {getStatusBadge(invoice.invoice_status)}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <Button
                              onClick={() => handleDownloadPDF(invoice.invoice_pdf_url, invoice.invoice_id)}
                              disabled={!invoice.invoice_pdf_url}
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-50"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                  <Card key={invoice.invoice_id} className="overflow-hidden shadow-sm">
                    <CardHeader className="bg-gray-50 pb-3 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-[#01005a] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm font-semibold text-gray-900">
                              {formatDate(invoice.created_at)}
                            </CardTitle>
                            <CardDescription className="text-xs font-mono mt-1 text-gray-500 truncate">
                              {invoice.stripe_invoice_id?.substring(0, 15) || 'N/A'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(invoice.invoice_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Employees:</span>
                          <span className="text-gray-900 text-sm">{invoice.employee_count || 'N/A'}</span>
                        </div>
                        <Button
                          onClick={() => handleDownloadPDF(invoice.invoice_pdf_url, invoice.invoice_id)}
                          disabled={!invoice.invoice_pdf_url}
                          className="w-full bg-[#01005a] hover:bg-[#01005a]/90 text-white mt-3 text-sm py-2"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Invoices;
