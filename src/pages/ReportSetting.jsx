import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getAllReportEmails,
  createReportEmail,
  updateReportEmail,
  deleteReportEmail,
  createReportObject
} from "../api.js";
import {
  Settings,
  Mail,
  Plus,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check
} from "lucide-react";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";
import { GridIcon } from "../components/icons/GridIcon";
import { useModalClose } from "../hooks/useModalClose";

const ReportSetting = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [emailSettings, setEmailSettings] = useState([]);
  const [allEmailSettings, setAllEmailSettings] = useState([]);
  const [viewSettings, setViewSettings] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewEditModal, setShowViewEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentFrequencies, setCurrentFrequencies] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newFrequencies, setNewFrequencies] = useState([]);
  const [editFrequencies, setEditFrequencies] = useState([]);
  const [tempViewSettings, setTempViewSettings] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [frequencyError, setFrequencyError] = useState("");
  const [viewFrequencies, setViewFrequencies] = useState([]);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const frequencies = ["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"];
  
  // Modal close events disabled - modals only close via buttons

  const showToast = (message, type = "success") => {
    // Toast notifications removed
  };

  const loadReportSettings = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getAllReportEmails(company_id);
      console.log('Raw API data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Handle different response formats
      let processedData = [];
      if (Array.isArray(data)) {
        processedData = data;
      } else if (data && typeof data === 'object') {
        // If it's an object, check if it has a data property or wrap it in an array
        if (data.data && Array.isArray(data.data)) {
          processedData = data.data;
        } else if (data.email || data.company_reporter_email) {
          processedData = [data];
        }
      }
      
      console.log('Processed data:', processedData);
      console.log('Processed data length:', processedData.length);
      
      setAllEmailSettings(processedData);
      setEmailSettings(processedData);
    } catch (error) {
      console.error("Failed to load report settings:", error);
      setAllEmailSettings([]);
      setEmailSettings([]);
    } finally {
      if (showLoading) setIsLoading(false);
      if (isInitialLoad) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  };



  const getFilteredAndSortedSettings = () => {
    console.log('getFilteredAndSortedSettings called');
    console.log('emailSettings:', emailSettings);
    console.log('emailSettings length:', emailSettings.length);
    
    let filtered = emailSettings;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(setting => {
        const email = (setting.email || setting.company_reporter_email || "").trim().toLowerCase();
        const frequencies = formatFrequencies(setting).join(', ').toLowerCase();
        return email.includes(query) || frequencies.includes(query);
      });
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === "email") {
        aValue = (a.email || a.company_reporter_email || "").trim().toLowerCase();
        bValue = (b.email || b.company_reporter_email || "").trim().toLowerCase();
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "frequency") {
        aValue = formatFrequencies(a).join(', ').toLowerCase();
        bValue = formatFrequencies(b).join(', ').toLowerCase();
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
    
    console.log('filtered result:', filtered);
    console.log('filtered length:', filtered.length);
    return filtered;
  };

  const loadViewSetting = () => {
    if (typeof window === "undefined") return;
    const savedSetting = localStorage.getItem("reportType");

    if (savedSetting) {
      const frequencies = savedSetting
        .split(",")
        .filter((f) => f.trim() !== "" && f.trim().toLowerCase() !== "basic")
        .filter((f) => ["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"].includes(f.trim()));

      setViewFrequencies(frequencies);
      setViewSettings(frequencies);

      if (frequencies.length === 0 && savedSetting.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      }
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateFrequencies = (freqs) => {
    if (freqs.length === 0) {
      setFrequencyError("Please select at least one frequency");
      return false;
    }
    if (freqs.length > 2) {
      setFrequencyError("Maximum 2 frequencies allowed");
      return false;
    }
    setFrequencyError("");
    return true;
  };

  const openAddModal = () => {
    setNewEmail("");
    setNewFrequencies([]);
    setEmailError("");
    setFrequencyError("");
    setModalError("");
    setModalSuccess("");
    setShowAddModal(true);
  };

  const openEditModal = (setting) => {
    setCurrentSetting(setting);
    const email = (setting.email || setting.company_reporter_email || "").trim();
    setCurrentEmail(email);
    setNewEmail(email);
    const frequencies = [];
    if (setting.is_daily_report_active) frequencies.push("Daily");
    if (setting.is_weekly_report_active) frequencies.push("Weekly");
    if (setting.is_bi_weekly_report_active) frequencies.push("Biweekly");
    if (setting.is_monthly_report_active) frequencies.push("Monthly");
    if (setting.is_bi_monthly_report_active) frequencies.push("Bimonthly");
    setEditFrequencies([...frequencies]);
    setCurrentFrequencies([...frequencies]);
    setEmailError("");
    setFrequencyError("");
    setModalError("");
    setModalSuccess("");
    setShowEditModal(true);
  };

  const openViewEditModal = () => {
    setTempViewSettings([...viewSettings]);
    setShowViewEditModal(true);
  };

  const openDeleteModal = (setting) => {
    console.log("Opening delete modal for setting:", setting);
    setCurrentSetting(setting);
    setCurrentEmail((setting.email || setting.company_reporter_email || "").trim());
    setModalError("");
    setModalSuccess("");
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewEditModal(false);
    setShowDeleteModal(false);
    setCurrentSetting(null);
    setNewEmail("");
    setNewFrequencies([]);
    setEditFrequencies([]);
    setTempViewSettings([]);
    setEmailError("");
    setFrequencyError("");
  };

  const toggleFrequency = (freq, isEdit = false) => {
    const currentFreqs = isEdit ? editFrequencies : newFrequencies;
    const setFreqs = isEdit ? setEditFrequencies : setNewFrequencies;
    
    if (currentFreqs.includes(freq)) {
      setFreqs(currentFreqs.filter(f => f !== freq));
    } else if (currentFreqs.length < 2) {
      setFreqs([...currentFreqs, freq]);
    }
    setFrequencyError("");
  };

  const toggleViewFrequency = (freq) => {
    if (tempViewSettings.includes(freq)) {
      setTempViewSettings([]);
    } else {
      setTempViewSettings([freq]);
    }
  };

  const saveReportSettings = async () => {
    if (!validateEmail(newEmail) || !validateFrequencies(newFrequencies)) return;

    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    if (!company_id) {
      setModalError("Missing company ID");
      return;
    }

    const deviceId = "";
    const reportData = createReportObject(newEmail.trim(), company_id, deviceId, newFrequencies);

    setModalError("");
    setIsSubmitting(true);
    try {
      await createReportEmail(reportData);
      setModalSuccess("Email setting added successfully!");
      
      // Refresh table data immediately
      await loadReportSettings(false);

      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
      console.error("Error saving report settings:", error);
      setModalError(error.message || "Failed to save email setting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReportSettings = async () => {
    if (!validateEmail(newEmail) || !validateFrequencies(editFrequencies)) return;

    const company_id = localStorage.getItem("companyID") || "";
    const deviceId = "";
    const reportData = createReportObject(newEmail.trim(), company_id, deviceId, editFrequencies);

    setModalError("");
    setIsSubmitting(true);
    try {
      await updateReportEmail(currentEmail, company_id, reportData);
      setModalSuccess("Email setting updated successfully!");
      
      // Refresh table data immediately
      await loadReportSettings(false);

      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
      console.error("Error updating report settings:", error);
      setModalError(error.message || "Failed to update email setting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReportSettings = async () => {
    const company_id = localStorage.getItem("companyID") || "";

    setModalError("");
    setIsSubmitting(true);
    try {
      await deleteReportEmail(currentEmail, company_id);
      setModalSuccess("Email setting deleted successfully!");
      
      // Refresh table data immediately
      await loadReportSettings(false);

      setTimeout(() => {
        setShowDeleteModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
      console.error("Error deleting report settings:", error);
      setModalError(error.message || "Failed to delete email setting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateViewSettings = async () => {
    if (tempViewSettings.length === 0) {
      showToast("Please select one frequency", "error");
      return;
    }

    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    const setting = {
      c_id: company_id,
      report_type: tempViewSettings.join(","),
      last_modified_date_time: new Date().toISOString(),
      last_modified_by: localStorage.getItem("UserEmail") || localStorage.getItem("userName") || "unknown",
    };

    setIsLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
      const response = await fetch(`${API_BASE}/admin-report-type/update/${company_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      localStorage.setItem("reportType", tempViewSettings.join(","));
      setViewSettings([...tempViewSettings]);
      setViewFrequencies([...tempViewSettings]);
      showToast("View settings updated successfully!");
      closeModals();
    } catch (error) {
      console.error("Failed to update view setting:", error);
      showToast("Failed to update view settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFrequencies = (setting) => {
    const frequencies = [];
    if (setting.is_daily_report_active) frequencies.push("Daily");
    if (setting.is_weekly_report_active) frequencies.push("Weekly");
    if (setting.is_bi_weekly_report_active) frequencies.push("Biweekly");
    if (setting.is_monthly_report_active) frequencies.push("Monthly");
    if (setting.is_bi_monthly_report_active) frequencies.push("Bimonthly");
    return frequencies;
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const savedReportType = localStorage.getItem("reportType");
      if (savedReportType && savedReportType.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      }

      await loadReportSettings(true);
      loadViewSetting();
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode("grid");
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('sort-dropdown');
      const button = event.target.closest('button');
      if (dropdown && !dropdown.contains(event.target) && !button?.closest('[data-sort-button]')) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />



      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                  Report Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure email notifications and report frequencies
                </p>
              </div>
              <Button onClick={openAddModal} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Setting</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Search and Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search email settings..."
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="px-3 py-2 h-auto text-sm flex items-center gap-2 min-w-[140px] justify-between"
                    onClick={() => document.getElementById('sort-dropdown').classList.toggle('hidden')}
                    data-sort-button
                  >
                    <div className="flex items-center gap-2">
                      {sortConfig.direction === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-blue-600" />
                      )}
                      <span>
                        {sortConfig.key ? (
                          sortConfig.key === 'email' ? 'Sort By Email' :
                          sortConfig.key === 'frequency' ? 'Sort By Frequency' : 'Sort'
                        ) : 'Sort'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <div
                    id="sort-dropdown"
                    className="absolute top-full left-0 mt-1 w-48 bg-background border border-input rounded-md shadow-lg z-10 hidden"
                  >
                    {[
                      { key: 'email', direction: 'asc', label: 'Sort By Email', icon: ArrowUp },
                      { key: 'email', direction: 'desc', label: 'Sort By Email', icon: ArrowDown },
                      { key: 'frequency', direction: 'asc', label: 'Sort By Frequency', icon: ArrowUp },
                      { key: 'frequency', direction: 'desc', label: 'Sort By Frequency', icon: ArrowDown }
                    ].map(({ key, direction, label, icon: Icon }) => (
                      <button
                        key={`${key}-${direction}`}
                        onClick={() => {
                          setSortConfig({ key, direction });
                          document.getElementById('sort-dropdown').classList.add('hidden');
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors ${
                          sortConfig.key === key && sortConfig.direction === direction
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${
                            direction === 'asc' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                          {label}
                        </div>
                        {sortConfig.key === key && sortConfig.direction === direction && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 w-8 p-0"
                  >
                    <HamburgerIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Report Settings
              </CardTitle>
              <CardDescription>
                Configure email addresses and their report frequencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredAndSortedSettings().length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Mail className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No email settings found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-4">
                    {searchQuery ? "Try adjusting your search criteria." : "Get started by adding your first email setting."}
                  </p>
                  {!searchQuery && (
                    <div className="flex justify-center">
                      <Button onClick={openAddModal} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                        <Plus className="w-4 h-4" />
                        Add Email Setting
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {getFilteredAndSortedSettings().map((setting, index) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">{(setting.email || setting.company_reporter_email || "").trim()}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Email Setting</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(setting)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(setting)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Frequencies</span>
                            <div className="flex gap-1 flex-wrap">
                              {formatFrequencies(setting).map((freq) => (
                                <span key={freq} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {freq}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead className="bg-[#02066F] text-white">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Email Address</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Frequency</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getFilteredAndSortedSettings().map((setting, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-xs sm:text-sm">{(setting.email || setting.company_reporter_email || "").trim()}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                                {formatFrequencies(setting).map((freq) => (
                                  <span key={freq} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {freq}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              <div className="flex gap-1 sm:gap-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(setting)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(setting)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* View Settings */}
          {viewSettings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Email Consolidated Report Settings
                </CardTitle>
                <CardDescription>
                  (Only owner can view this report frequency)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg">
                    <thead className="bg-[#02066F] text-white">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Current Frequencies</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                            {viewSettings.map((freq) => (
                              <span key={freq} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {freq}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={openViewEditModal}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-add-modal" className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Configure email notifications for reports
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`text-sm ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Frequency * (Max 2)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.map((freq) => (
                    <Button
                      key={freq}
                      variant={newFrequencies.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFrequency(freq)}
                      disabled={!newFrequencies.includes(freq) && newFrequencies.length >= 2}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
                {frequencyError && <p className="text-sm text-red-600">{frequencyError}</p>}
              </div>

              {/* Success message */}
              {modalSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{modalSuccess}</p>
                </div>
              )}

              {/* Error message */}
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isSubmitting || modalSuccess}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveReportSettings}
                  disabled={isSubmitting || modalSuccess}
                  className="flex-1 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Setting"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-edit-modal" className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Update email notification settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`text-sm ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Frequency * (Max 2)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.map((freq) => (
                    <Button
                      key={freq}
                      variant={editFrequencies.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFrequency(freq, true)}
                      disabled={!editFrequencies.includes(freq) && editFrequencies.length >= 2}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
                {frequencyError && <p className="text-sm text-red-600">{frequencyError}</p>}
              </div>

              {modalSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{modalSuccess}</p>
                </div>
              )}
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateReportSettings}
                  disabled={isSubmitting || modalSuccess}
                  className="flex-1 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Setting"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Edit Modal */}
      {showViewEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-view-edit-modal" className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Edit View Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Configure default report viewing frequencies
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select One Frequency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.filter(f => f !== "Daily").map((freq) => (
                    <Button
                      key={freq}
                      variant={tempViewSettings.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleViewFrequency(freq)}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateViewSettings}
                  disabled={isLoading}
                  className="flex-1 order-1 sm:order-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Settings"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-delete-modal" className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#01005a' }}>
                <AlertCircle className="w-5 h-5" />
                Delete Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete the email setting for "{currentEmail}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {modalSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{modalSuccess}</p>
                </div>
              )}
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={deleteReportSettings}
                  disabled={isSubmitting || modalSuccess}
                  className="flex-1 order-1 sm:order-2 bg-[#01005a] hover:bg-[#01005a]/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Setting"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReportSetting;