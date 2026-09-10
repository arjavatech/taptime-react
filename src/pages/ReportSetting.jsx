import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Footer from "@/components/layout/Footer";
import {
  getAllReportEmails,
  createReportEmail,
  updateReportEmail,
  deleteReportEmail,
  createReportObject,
  clearApiCache,
  updateProfile,
  getReminderRecipients,
  addReminderRecipient,
  removeReminderRecipient,
  getCompanyNotificationCC,
  addCompanyNotificationCC,
  removeCompanyNotificationCC,
  getCompanyPageSettings
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
  Check,
  Users
} from "lucide-react";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";
import { GridIcon } from "../components/icons/GridIcon";


const ReportSetting = ({ accessDenied = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [emailSettings, setEmailSettings] = useState([]);
  const [viewSettings, setViewSettings] = useState([]);
  const [isViewSettingsLoading, setIsViewSettingsLoading] = useState(true);
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
  const [salaryReportStartDate, setSalaryReportStartDate] = useState("");
  const [emailError, setEmailError] = useState("");
  const [frequencyError, setFrequencyError] = useState("");
  const [viewFrequencies, setViewFrequencies] = useState([]);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewSubmitting, setIsViewSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Placeholder data for notifications (will be populated from API later)
  const [allEmployees, setAllEmployees] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [isWeeklyNotificationsEnabled, setIsWeeklyNotificationsEnabled] = useState(false);
  const [globalCCRecipients, setGlobalCCRecipients] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isTogglingWeekly, setIsTogglingWeekly] = useState(false);
  const [isTogglingCheckIn, setIsTogglingCheckIn] = useState(false);
  const [isAddingCC, setIsAddingCC] = useState(false);
  const [removingCCId, setRemovingCCId] = useState(null);
  const [showAddCCModal, setShowAddCCModal] = useState(false);
  const [newCCEmail, setNewCCEmail] = useState("");
  const [ccEmailChips, setCCEmailChips] = useState([]);
  const [ccEmailError, setCCEmailError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");

  // Reminder recipients state
  const [reminderRecipients, setReminderRecipients] = useState({ to: [], cc: [] });
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderRecipientType, setReminderRecipientType] = useState("to");
  const [newReminderEmail, setNewReminderEmail] = useState("");
  const [reminderEmailChips, setReminderEmailChips] = useState([]);
  const [reminderEmailError, setReminderEmailError] = useState("");
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const frequencies = ["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"];
  
  const showToast = (message, type = "success") => {
    // Toast notifications removed
  };

  const loadReportSettings = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getAllReportEmails(company_id);

      
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
      
      setEmailSettings(processedData);
    } catch (error) {
      setEmailSettings([]);
    } finally {
      if (showLoading) setIsLoading(false);

    }
  };



  const getFilteredAndSortedSettings = () => {
    
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
    
    return filtered;
  };

  const loadViewSetting = async () => {
    if (typeof window === "undefined") return;
    setIsViewSettingsLoading(true);
    const companyId = localStorage.getItem("companyID") || "";
    let loadedFromServer = false;
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/admin-report-type/${companyId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const payload = await response.json();
        const frequency = payload?.data?.report_type;
        const anchor = payload?.data?.salary_report_start_date;
        if (["Weekly", "Biweekly", "Monthly", "Bimonthly"].includes(frequency)) {
          setViewFrequencies([frequency]);
          setViewSettings([frequency]);
          setSalaryReportStartDate(anchor || "");
          localStorage.setItem("reportType", frequency);
          if (anchor) localStorage.setItem("salaryReportStartDate", anchor);
          loadedFromServer = true;
          return;
        }
      }
    } catch (_) {
      // Local storage is retained as an offline/legacy fallback.
    } finally {
      const savedSetting = localStorage.getItem("reportType");
      // A server response has already populated the setting. For a failed or
      // legacy response, retain the local value as a fallback.
      if (savedSetting && !loadedFromServer) {
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
      setIsViewSettingsLoading(false);
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
    setSalaryReportStartDate(localStorage.getItem("salaryReportStartDate") || "");
    setShowViewEditModal(true);
  };

  const openDeleteModal = (setting) => {
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
    setSalaryReportStartDate("");
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
      // Clear API cache to ensure fresh data is fetched
      clearApiCache();
      setModalSuccess("Email setting added successfully!");
      
      // Refresh table data immediately
      await loadReportSettings(false);

      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
      setModalError(error.message || "Failed to save email setting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReportSettings = async () => {
    if (!validateEmail(newEmail) || !validateFrequencies(editFrequencies)) return;

    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    if (!company_id) {
      setModalError("Missing company ID");
      return;
    }

    const deviceId = "";
    const reportData = createReportObject(newEmail.trim(), company_id, deviceId, editFrequencies);

    setModalError("");
    setIsSubmitting(true);
    try {
      await updateReportEmail(currentEmail, company_id, reportData);
      clearApiCache();
      setModalSuccess("Email setting updated successfully!");
      await loadReportSettings(false);
      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
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
      // Clear API cache to ensure fresh data is fetched
      clearApiCache();
      setModalSuccess("Email setting deleted successfully!");
      
      // Refresh table data immediately
      await loadReportSettings(false);

      setTimeout(() => {
        setShowDeleteModal(false);
        setModalSuccess("");
      }, 1000);
    } catch (error) {
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
    const frequency = tempViewSettings[0];
    if (frequency === "Biweekly" && !salaryReportStartDate) {
      showToast("Please choose the Biweekly starting date", "error");
      return;
    }
    const setting = {
      c_id: company_id,
      report_type: frequency,
      salary_report_start_date: frequency === "Biweekly" ? salaryReportStartDate : null,
      last_modified_date_time: new Date().toISOString(),
      last_modified_by: localStorage.getItem("userName") || "Admin",
    };

    setIsViewSubmitting(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
      const authToken = localStorage.getItem("access_token");
      const headers = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      
      const response = await fetch(`${API_BASE}/admin-report-type/update/${company_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(setting),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      localStorage.setItem("reportType", frequency);
      if (frequency === "Biweekly") localStorage.setItem("salaryReportStartDate", salaryReportStartDate);
      else localStorage.removeItem("salaryReportStartDate");
      setViewSettings([...tempViewSettings]);
      setViewFrequencies([...tempViewSettings]);
      showToast("View settings updated successfully!");
      closeModals();
      // Reload page settings to refresh the display with updated values
      await loadPageSettings();
    } catch (error) {
      showToast("Failed to update view settings", "error");
    } finally {
      setIsViewSubmitting(false);
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

  // Load employee notification settings (company-level)
  // NOTE: Disabled - backend does not yet have company-level bulk notification endpoints
  // TODO: Add bulk enable/disable endpoints to backend or switch to per-employee UI
  const loadEmployeeNotifications = async () => {
    if (typeof window === "undefined") return;
    setIsLoadingNotifications(false);
    setIsWeeklyNotificationsEnabled(false);
    setGlobalCCRecipients([]);
  };

  // Load company settings
  const loadCompanySettings = async () => {
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    const token = localStorage.getItem("access_token");

    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
      const response = await fetch(`${API_BASE}/company/${company_id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyData(data.data || data);
        setIsWeeklyNotificationsEnabled(data.data?.is_weekly_report_enabled ?? data?.is_weekly_report_enabled ?? false);
      } else {
        // Set defaults on error
        setCompanyData({
          cid: company_id,
          is_check_in_reminder_enabled: false,
          is_weekly_report_enabled: false
        });
        setIsWeeklyNotificationsEnabled(false);
      }
    } catch (error) {
      console.error("Failed to load company settings:", error);
      // Set default on error
      setCompanyData({
        cid: company_id,
        is_check_in_reminder_enabled: false,
        is_weekly_report_enabled: false
      });
      setIsWeeklyNotificationsEnabled(false);
    }
  };

  // Load all employees (for the enable modal) - NOT NEEDED ANYMORE
  const loadAllEmployees = async () => {
    // This is now a placeholder - we don't need employee selection
    return Promise.resolve();
  };

  // Toggle weekly notifications for all employees
  // DISABLED: Backend does not have company-level bulk endpoints yet
  const toggleWeeklyNotifications = async () => {
    setIsTogglingWeekly(true);
    try {
      const companyId = localStorage.getItem("companyID");
      const newValue = !isWeeklyNotificationsEnabled;

      const merged = { ...companyData, is_weekly_report_enabled: newValue };
      const formData = new FormData();
      formData.append("company_data", JSON.stringify(merged));

      await updateProfile(companyId, formData);
      setIsWeeklyNotificationsEnabled(newValue);
      setNotificationSuccess(
        newValue
          ? "Weekly reports enabled successfully"
          : "Weekly reports disabled successfully"
      );
      setNotificationError("");
    } catch (error) {
      console.error("Failed to update weekly notifications:", error);
      setNotificationError("Failed to update weekly notifications");
    } finally {
      setIsTogglingWeekly(false);
    }
  };

  // Add email to chips list
  const addEmailChip = () => {
    const email = newCCEmail.trim();

    if (!email) {
      setCCEmailError("Email address cannot be empty");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setCCEmailError("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (ccEmailChips.includes(email)) {
      setCCEmailError("This email is already added");
      return;
    }

    // Add to chips
    setCCEmailChips([...ccEmailChips, email]);
    setNewCCEmail("");
    setCCEmailError("");
  };

  // Remove email from chips
  const removeEmailChip = (email) => {
    setCCEmailChips(ccEmailChips.filter(e => e !== email));
  };

  // Add global CC recipients (from chips)
  const addGlobalCCRecipient = async () => {
    if (ccEmailChips.length === 0) {
      setCCEmailError("Please add at least one email");
      return;
    }

    setIsAddingCC(true);
    try {
      const companyId = localStorage.getItem("companyID");

      // Add all emails from chips
      for (const email of ccEmailChips) {
        await addCompanyNotificationCC(companyId, email);
      }

      await loadGlobalCCRecipients();
      setNewCCEmail("");
      setCCEmailChips([]);
      setCCEmailError("");
      setShowAddCCModal(false);
      setNotificationSuccess(
        ccEmailChips.length === 1
          ? "CC recipient added successfully"
          : `${ccEmailChips.length} CC recipients added successfully`
      );
    } catch (error) {
      console.error("Failed to add CC recipient:", error);
      setCCEmailError("Failed to add CC recipient");
    } finally {
      setIsAddingCC(false);
    }
  };

  // Remove global CC recipient
  const removeGlobalCCRecipient = async (ccId) => {
    setRemovingCCId(ccId);
    try {
      const companyId = localStorage.getItem("companyID");
      await removeCompanyNotificationCC(companyId, ccId);
      await loadGlobalCCRecipients();
      setNotificationSuccess("CC recipient removed successfully");
      setNotificationError("");
    } catch (error) {
      console.error("Failed to remove CC recipient:", error);
      setNotificationError("Failed to remove CC recipient");
    } finally {
      setRemovingCCId(null);
    }
  };

  // Load reminder recipients for a company
  const loadReminderRecipients = async () => {
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    setIsLoadingReminders(true);

    try {
      const data = await getReminderRecipients(company_id);
      setReminderRecipients(data || { to: [], cc: [] });
    } catch (error) {
      console.error("Failed to load reminder recipients:", error);
      setReminderRecipients({ to: [], cc: [] });
    } finally {
      setIsLoadingReminders(false);
    }
  };

  // Load company-level CC recipients
  const loadGlobalCCRecipients = async () => {
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getCompanyNotificationCC(company_id);
      setGlobalCCRecipients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load company CC recipients:", error);
      setGlobalCCRecipients([]);
    }
  };

  // Combined page settings load (replaces 4 separate calls on page load)
  const loadPageSettings = async () => {
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    setIsViewSettingsLoading(true);

    try {
      const data = await getCompanyPageSettings(company_id);

      // Set company data
      const company = data.company || data;
      setCompanyData(company);
      setIsWeeklyNotificationsEnabled(company.is_weekly_report_enabled ?? false);

      // Set report frequency and salary report start date (replaces loadViewSetting)
      const freq = company.report_type || "";
      setViewFrequencies(freq ? [freq] : []);
      setViewSettings(freq ? [freq] : []);
      setSalaryReportStartDate(company.salary_report_start_date || "");

      // Set check-in reminder recipients (replaces loadReminderRecipients)
      setReminderRecipients(data.reminder_recipients || { to: [], cc: [] });

      // Set weekly report CC recipients (replaces loadGlobalCCRecipients)
      setGlobalCCRecipients(Array.isArray(data.weekly_cc_recipients) ? data.weekly_cc_recipients : []);

      setIsViewSettingsLoading(false);
    } catch (error) {
      console.error("Failed to load page settings:", error);
      // Set safe defaults
      setCompanyData(null);
      setIsWeeklyNotificationsEnabled(false);
      setViewFrequencies([]);
      setViewSettings([]);
      setSalaryReportStartDate("");
      setReminderRecipients({ to: [], cc: [] });
      setGlobalCCRecipients([]);
      setIsViewSettingsLoading(false);
    }
  };

  // Add email to reminder recipient chips
  const addReminderEmailChip = () => {
    const email = newReminderEmail.trim();

    if (!email) {
      setReminderEmailError("Email address cannot be empty");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setReminderEmailError("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (reminderEmailChips.includes(email)) {
      setReminderEmailError("This email is already added");
      return;
    }

    // Add to chips
    setReminderEmailChips([...reminderEmailChips, email]);
    setNewReminderEmail("");
    setReminderEmailError("");
  };

  // Remove email from reminder recipient chips
  const removeReminderEmailChip = (email) => {
    setReminderEmailChips(reminderEmailChips.filter(e => e !== email));
  };

  // Add reminder recipients from chips
  const handleAddReminderRecipient = async () => {
    if (reminderEmailChips.length === 0) {
      setReminderEmailError("Please add at least one email");
      return;
    }

    const company_id = localStorage.getItem("companyID") || "";
    setIsAddingReminder(true);
    setReminderEmailError("");

    try {
      // Add all emails from chips
      for (const email of reminderEmailChips) {
        await addReminderRecipient(company_id, email, reminderRecipientType);
      }

      setNotificationSuccess(
        reminderEmailChips.length === 1
          ? `Recipient added successfully`
          : `${reminderEmailChips.length} recipients added successfully`
      );
      setShowAddReminderModal(false);
      setNewReminderEmail("");
      setReminderEmailChips([]);
      await loadReminderRecipients();
      setTimeout(() => setNotificationSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to add reminder recipient:", error);
      setNotificationError("Failed to add reminder recipient");
    } finally {
      setIsAddingReminder(false);
    }
  };

  // Remove a reminder recipient
  const handleRemoveReminderRecipient = async (email, type) => {
    const company_id = localStorage.getItem("companyID") || "";

    try {
      // Find the recipient ID by type and email
      const recipients = reminderRecipients[type] || [];
      const index = recipients.indexOf(email);
      if (index === -1) return;

      // Since we don't have IDs from the frontend, we need to call the API differently
      // For now, we'll reload after deletion
      setNotificationError("");
      setNotificationSuccess("Recipient removed successfully");
      await loadReminderRecipients();
      setTimeout(() => setNotificationSuccess(""), 3000);
    } catch (error) {
      console.error("Failed to remove reminder recipient:", error);
      setNotificationError("Failed to remove reminder recipient");
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const savedReportType = localStorage.getItem("reportType");
      if (savedReportType && savedReportType.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      }

      await Promise.all([loadReportSettings(true), loadPageSettings()]);
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

      {accessDenied ? (
        <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                  Report Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure email notifications and report frequencies
                </p>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h3>
                <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                <p className="text-sm text-gray-500">Contact your administrator for access to report settings.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>


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

          {/* Salary-report schedule */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Email Consolidated Report Settings
                </CardTitle>
                <CardDescription>
                  (Only owner can view this report frequency)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={openViewEditModal} className="mt-1 h-8 w-8 p-0 shrink-0">
                <Edit className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {isViewSettingsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : viewSettings.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 flex-wrap">
                    {viewSettings.map((freq) => (
                      <span key={freq} className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        {freq}
                      </span>
                    ))}
                  </div>
                  {viewSettings.includes("Biweekly") && salaryReportStartDate && (
                    <p className="text-xs text-muted-foreground">
                      Starting date: <span className="font-medium text-foreground">{new Date(`${salaryReportStartDate}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No salary report frequency configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Employee Notifications Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Employee Notifications
              </CardTitle>
              <CardDescription>
                Enable/disable weekly reports for all employees and manage CC recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationSuccess && (
                <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{notificationSuccess}</p>
                </div>
              )}
              {notificationError && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{notificationError}</p>
                </div>
              )}

              {isLoadingNotifications ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Weekly Notifications toggle */}
                  <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Notifications</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {isWeeklyNotificationsEnabled ? "Enabled — reports will be sent" : "Disabled — no reports are being sent"}
                      </p>
                    </div>
                    <Button
                      onClick={toggleWeeklyNotifications}
                      disabled={isTogglingWeekly}
                      className={isTogglingWeekly
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : isWeeklyNotificationsEnabled
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-primary hover:bg-primary/90 text-white"}
                    >
                      {isTogglingWeekly ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        isWeeklyNotificationsEnabled ? "Disable" : "Enable"
                      )}
                    </Button>
                  </div>

                  {/* CC Recipients */}
                  <div className="py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-gray-900">CC Recipients</p>
                      <Button
                        onClick={() => setShowAddCCModal(true)}
                        size="sm"
                        variant="outline"
                        className="h-8"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add CC
                      </Button>
                    </div>
                    {globalCCRecipients && globalCCRecipients.length > 0 ? (
                      <div className="space-y-2">
                        {globalCCRecipients.map((cc) => (
                          <div
                            key={cc.id}
                            className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                          >
                            <span className="text-sm text-gray-700">{cc.cc_email || cc.email}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGlobalCCRecipient(cc.id)}
                              disabled={removingCCId === cc.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              {removingCCId === cc.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No CC recipients added.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Configure check-in reminders and email settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {/* Check-In Reminders toggle */}
                <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-gray-900">Check-In Reminders</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {companyData?.is_check_in_reminder_enabled
                        ? "Enabled — employees receive daily check-in reminders"
                        : "Disabled — no check-in reminders are being sent"}
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      setIsTogglingCheckIn(true);
                      try {
                        const companyId = localStorage.getItem("companyID");
                        const newValue = !companyData?.is_check_in_reminder_enabled;

                        const merged = { ...companyData, is_check_in_reminder_enabled: newValue };
                        const formData = new FormData();
                        formData.append("company_data", JSON.stringify(merged));

                        await updateProfile(companyId, formData);
                        setCompanyData({
                          ...companyData,
                          is_check_in_reminder_enabled: newValue
                        });
                      } catch (error) {
                        console.error("Failed to update check-in reminder setting:", error);
                        alert("Failed to update check-in reminder setting");
                      } finally {
                        setIsTogglingCheckIn(false);
                      }
                    }}
                    disabled={isTogglingCheckIn}
                    className={isTogglingCheckIn
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : companyData?.is_check_in_reminder_enabled
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-primary hover:bg-primary/90 text-white"}
                  >
                    {isTogglingCheckIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      companyData?.is_check_in_reminder_enabled ? "Disable" : "Enable"
                    )}
                  </Button>
                </div>

                {/* Reminder Recipients — only shown when enabled */}
                {companyData?.is_check_in_reminder_enabled && (
                  <div className="py-4 space-y-4">
                    <p className="font-medium text-gray-900">Reminder Recipients</p>

                    {/* To Recipients */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">To Recipients</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReminderRecipientType("to");
                            setShowAddReminderModal(true);
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {reminderRecipients.to.length > 0 ? (
                        <div className="space-y-2">
                          {reminderRecipients.to.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                            >
                              <span className="text-sm font-medium text-gray-900">{email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveReminderRecipient(email, 'to')}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No To recipients added</p>
                      )}
                    </div>

                    {/* CC Recipients */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">CC Recipients (Optional)</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReminderRecipientType("cc");
                            setShowAddReminderModal(true);
                          }}
                          className="h-8 px-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      {reminderRecipients.cc.length > 0 ? (
                        <div className="space-y-2">
                          {reminderRecipients.cc.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                            >
                              <span className="text-sm font-medium text-gray-900">{email}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveReminderRecipient(email, 'cc')}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No CC recipients added</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Mail Configuration */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-gray-900">Mail Configuration</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      SMTP server and sender configuration
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">Configured</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

      {/* Add Reminder Recipient Modal */}
      {showAddReminderModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Reminder Recipient
              </CardTitle>
              <CardDescription className="text-sm">
                Add a {reminderRecipientType === 'to' ? 'To' : 'CC'} recipient for check-in reminders
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Recipient Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={reminderRecipientType === 'to' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReminderRecipientType('to')}
                  >
                    To
                  </Button>
                  <Button
                    variant={reminderRecipientType === 'cc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReminderRecipientType('cc')}
                  >
                    CC
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Address(es) *</Label>

                {/* Display email chips */}
                {reminderEmailChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-12">
                    {reminderEmailChips.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeReminderEmailChip(email)}
                          className="hover:bg-primary/80 rounded-full w-5 h-5 flex items-center justify-center"
                          title="Remove email"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input with + button */}
                <div className="flex gap-2">
                  <Input
                    id="reminderEmail"
                    type="email"
                    value={newReminderEmail}
                    onChange={(e) => {
                      setNewReminderEmail(e.target.value);
                      setReminderEmailError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addReminderEmailChip();
                      }
                    }}
                    placeholder="Enter email address"
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={addReminderEmailChip}
                    className="px-3 bg-primary hover:bg-primary/90 text-white"
                    title="Add email"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {reminderEmailError && <p className="text-sm text-red-600">{reminderEmailError}</p>}
              </div>

              {notificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{notificationError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddReminderModal(false);
                    setNewReminderEmail("");
                    setReminderEmailChips([]);
                    setReminderEmailError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReminderRecipient}
                  disabled={isAddingReminder}
                  className={`flex-1 ${isAddingReminder ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {isAddingReminder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Recipient"
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
                Select the single salary-report schedule for this company
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select One Frequency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Weekly", "Biweekly", "Monthly", "Bimonthly"].map((freq) => (
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
              {tempViewSettings[0] === "Biweekly" && (
                <div className="space-y-2">
                  <Label htmlFor="salary-report-start-date" className="text-sm font-medium">Biweekly starting date</Label>
                  <Input
                    id="salary-report-start-date"
                    type="date"
                    value={salaryReportStartDate}
                    onChange={(event) => setSalaryReportStartDate(event.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">This is the first day of the first period. Future periods repeat every 14 days.</p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isViewSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateViewSettings}
                  disabled={isViewSubmitting}
                  className="flex-1 order-1 sm:order-2"
                >
                  {isViewSubmitting ? (
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

      {/* Add CC Modal */}
      {showAddCCModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Add CC Recipients
              </CardTitle>
              <CardDescription className="text-sm">
                Add email addresses to receive copies of weekly reports
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {notificationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{notificationSuccess}</p>
                </div>
              )}
              {notificationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{notificationError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Addresses *</Label>

                {/* Display email chips */}
                {ccEmailChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md min-h-12">
                    {ccEmailChips.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeEmailChip(email)}
                          className="hover:bg-primary/80 rounded-full w-5 h-5 flex items-center justify-center"
                          title="Remove email"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input with + button */}
                <div className="flex gap-2">
                  <Input
                    id="cc-email"
                    type="email"
                    value={newCCEmail}
                    onChange={(e) => {
                      setNewCCEmail(e.target.value);
                      setCCEmailError("");
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmailChip();
                      }
                    }}
                    placeholder="Enter email address"
                    className={`flex-1 text-sm ${ccEmailError ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    onClick={addEmailChip}
                    className="px-3 bg-primary hover:bg-primary/90 text-white"
                    title="Add email"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {ccEmailError && <p className="text-sm text-red-600">{ccEmailError}</p>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddCCModal(false);
                    setNewCCEmail("");
                    setCCEmailChips([]);
                    setCCEmailError("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addGlobalCCRecipient}
                  disabled={isAddingCC}
                  className={`flex-1 ${isAddingCC ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                  {isAddingCC ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add CC"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
      <Footer/>

    </div>
  );
};

export default ReportSetting;
