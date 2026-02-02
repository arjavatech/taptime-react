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

  const handleDownloadPDF = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#01005a]" />
            <span className="text-lg font-medium">Loading invoices...</span>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="h-8 w-8 text-[#01005a]" />
                Invoices
              </h1>
              <p className="text-gray-600 mt-1">View and download your billing history</p>
            </div>

            {/* Month Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{getSelectedMonthLabel()}</span>
                <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showMonthDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {monthOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleMonthSelect(option.value)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedMonths === option.value ? 'bg-blue-50 text-[#01005a] font-medium' : 'text-gray-700'
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Invoices Found</h3>
              <p className="text-gray-500 text-center">
                There are no invoices for the selected time period.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Desktop Table View */}
        {!loading && !error && invoices.length > 0 && (
          <>
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#01005a] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Invoice ID</th>
                    <th className="px-6 py-4 text-left font-semibold">Amount</th>
                    <th className="px-6 py-4 text-left font-semibold">Employees</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                    <th className="px-6 py-4 text-center font-semibold">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{formatDate(invoice.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-700">
                          {invoice.stripe_invoice_id?.substring(0, 20) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{invoice.employee_count || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(invoice.invoice_status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button
                          onClick={() => handleDownloadPDF(invoice.invoice_pdf_url)}
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.invoice_id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#01005a]" />
                        <div>
                          <CardTitle className="text-base">
                            {formatDate(invoice.created_at)}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono mt-1">
                            {invoice.stripe_invoice_id?.substring(0, 20) || 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(invoice.invoice_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employees:</span>
                        <span className="text-gray-900">{invoice.employee_count || 'N/A'}</span>
                      </div>
                      <Button
                        onClick={() => handleDownloadPDF(invoice.invoice_pdf_url)}
                        disabled={!invoice.invoice_pdf_url}
                        className="w-full bg-[#01005a] hover:bg-[#01005a]/90 text-white"
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
      </main>

      <Footer />
    </div>
  );
};

export default Invoices;
