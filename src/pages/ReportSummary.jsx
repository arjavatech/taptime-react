import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { fetchEmployeeData, fetchDevices, fetchDailyReport, fetchDateRangeReport, createDailyReportEntry, updateDailyReportEntry, correctDailyReportEntry, deleteDailyReportEntry, processPendingCheckout, fetchReportHistory } from "../api.js";
import { getLocalDateString } from "../utils";
import {
  Calendar,
  Download,
  FileText,
  Clock,
  Users,
  Search,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  Upload,
  Plus,
  X,
  Pencil,
  Trash2,
  History
} from "lucide-react";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";
import { GridIcon } from "../components/icons/GridIcon";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { bulkUploadReportData } from "../api.js";

const Reports = () => {
  // Utility function to capitalize first letter of each word
  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [paginatedData, setPaginatedData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('reportSortConfig');
      return saved ? JSON.parse(saved) : { key: null, direction: "asc" };
    } catch {
      return { key: null, direction: "asc" };
    }
  });
  const [viewMode, setViewMode] = useState("table");
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);

  // Bulk upload state
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState("");


  // Common state
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    EmployeeID: "",
    Type: "",
    Date: "",
    CheckInTime: "",
    CheckOutTime: ""
  });
  const [employeeList, setEmployeeList] = useState([]);
  const [checkinDisabled, setCheckinDisabled] = useState(true);
  const [checkoutDisabled, setCheckoutDisabled] = useState(true);
  const [addButtonDisabled, setAddButtonDisabled] = useState(true);
  const [formErrors, setFormErrors] = useState({
    employee: "",
    type: "",
    date: "",
    checkinTime: "",
    checkoutTime: ""
  });
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [editReport, setEditReport] = useState({ date: "", checkInTime: "", checkOutTime: "", type: "" });
  const [reportActionError, setReportActionError] = useState("");
  const [isReportActionSubmitting, setIsReportActionSubmitting] = useState(false);
  const companyId = localStorage.getItem("companyID");
  const canManageReports = ["Owner", "Admin", "SuperAdmin"].includes(localStorage.getItem("adminType"));

  // Today's report specific
  const [tableData, setTableData] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [checkoutTimes, setCheckoutTimes] = useState({});
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkoutLoadingStates, setCheckoutLoadingStates] = useState({});
  const [pendingCheckoutData, setPendingCheckoutData] = useState([]);

  // Day wise report specific
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Salaried report specific
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employees, setEmployees] = useState([]);
  const [dateRangeReportLoaded, setDateRangeReportLoaded] = useState(false);

  // Weekly report specific
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);

  // Salaried report specific
  const [selectedReportType, setSelectedReportType] = useState('Weekly');
  const [selectedHalf, setSelectedHalf] = useState('first');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [salariedReportData, setSalariedReportData] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [salariedPageSize, setSalariedPageSize] = useState(10);
  const [salariedCurrentPage, setSalariedCurrentPage] = useState(1);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    presentEmployees: 0,
    totalRecords: 0,
    totalHours: "0.0"
  });

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Modal close events disabled - modals only close via buttons



  // Helper function to get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function for pagination
  const getItemsPerPage = () => {
    return pageSize;
  };

  // Helper function for pending checkout pagination
  const getPendingItemsPerPage = () => {
    return pendingPageSize;
  };
  const pendingPaginationStartIndex = (pendingCurrentPage - 1) * getPendingItemsPerPage();
  const pendingPaginationEndIndex = pendingPaginationStartIndex + getPendingItemsPerPage();
  const pendingTotalPages = Math.ceil(pendingCheckoutData.length / getPendingItemsPerPage());
  const paginatedPendingCheckoutData = pendingCheckoutData.slice(pendingPaginationStartIndex, pendingPaginationEndIndex);

  // Helper function for salaried report pagination
  const getSalariedItemsPerPage = () => {
    return salariedPageSize;
  };
  const salariedPaginationStartIndex = (salariedCurrentPage - 1) * getSalariedItemsPerPage();
  const salariedPaginationEndIndex = salariedPaginationStartIndex + getSalariedItemsPerPage();
  const salariedTotalPages = Math.ceil(filteredData.length / getSalariedItemsPerPage());
  const paginatedSalariedData = filteredData.slice(salariedPaginationStartIndex, salariedPaginationEndIndex);



  const loadDevices = useCallback(async () => {
    try {
      const filteredDevices = await fetchDevices(companyId);
      setDevices(filteredDevices);
      if (filteredDevices.length > 0) {
        setSelectedDevice(filteredDevices[0]);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  }, [companyId]);


  // Today's Report Functions
  const formatToAmPm = (date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return "--";
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const toLocalDateAndTime = (value) => {
    const timestamp = new Date(value);
    const date = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, "0")}-${String(timestamp.getDate()).padStart(2, "0")}`;
    const time = `${String(timestamp.getHours()).padStart(2, "0")}:${String(timestamp.getMinutes()).padStart(2, "0")}`;
    return { date, time };
  };

  const openEditReport = (record) => {
    const checkIn = toLocalDateAndTime(record.CheckInTime);
    const checkOut = record.CheckOutTime ? toLocalDateAndTime(record.CheckOutTime) : null;
    setEditingReport(record);
    setEditReport({ date: checkIn.date, checkInTime: checkIn.time, checkOutTime: checkOut?.time || "", type: record.Type || "" });
    setReportActionError("");
  };

  const refreshActiveReport = async () => {
    if (activeTab === "today") return viewCurrentDateReport(currentDate, false);
    if (activeTab === "daywise") return viewDatewiseReport(selectedDate, false);
    if (activeTab === "pending") setPendingCheckoutData(await processPendingCheckout(companyId));
  };

  const handleReportCorrection = async () => {
    if (!editingReport || !editReport.date || !editReport.checkInTime || !editReport.type) {
      setReportActionError("Date, check-in time, and employment type are required.");
      return;
    }
    const checkInTime = `${editReport.date}T${editReport.checkInTime}:00`;
    const checkOutTime = editReport.checkOutTime ? `${editReport.date}T${editReport.checkOutTime}:00` : null;
    if (checkOutTime && new Date(checkOutTime) <= new Date(checkInTime)) {
      setReportActionError("Check-out time must be later than check-in time.");
      return;
    }
    setIsReportActionSubmitting(true);
    setReportActionError("");
    try {
      await correctDailyReportEntry(editingReport.EmpID, companyId, editingReport.CheckInTime, {
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        type_id: editReport.type,
      });
      await refreshActiveReport();
      setEditingReport(null);
    } catch (error) {
      setReportActionError(error.message || "Unable to update this report.");
    } finally {
      setIsReportActionSubmitting(false);
    }
  };

  const handleReportDelete = async () => {
    if (!reportToDelete) return;
    setIsReportActionSubmitting(true);
    setReportActionError("");
    try {
      await deleteDailyReportEntry(reportToDelete.EmpID, companyId, reportToDelete.CheckInTime);
      await refreshActiveReport();
      setReportToDelete(null);
    } catch (error) {
      setReportActionError(error.message || "Unable to delete this report.");
    } finally {
      setIsReportActionSubmitting(false);
    }
  };

  const viewCurrentDateReport = async (dateToUse = currentDate, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const arr = await fetchDailyReport(companyId, dateToUse);

      if (!arr.length) {
        setTableData([]);
        setFilteredData([]);
        return;
      }

      let processedData = arr.map(row => ({
        ...row,
        checkInTimeFormatted: formatToAmPm(new Date(row.CheckInTime)),
        needsCheckout: !row.CheckOutTime,
        checkoutTime: "",
      }));

      // Only filter by device if explicitly selected (skip if it's the default first device or filter would remove all data)
      if (selectedDevice && selectedDevice.DeviceID && devices.length > 1) {
        const filteredByDevice = processedData.filter(item => item.DeviceID === selectedDevice.DeviceID);
        // Only apply filter if it returns results, otherwise show all data
        if (filteredByDevice.length > 0) {
          processedData = filteredByDevice;
        }
      }
      setTableData(processedData);
      setFilteredData([...processedData]);
      updateSummaryStats(processedData);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const updateSummaryStats = (data) => {
    const presentEmployees = data.filter(r => r.CheckInTime).length;
    const totalHours = data.reduce((sum, r) => {
      if (r.TimeWorked && r.TimeWorked !== "0:00") {
        const [hours, minutes] = r.TimeWorked.split(':').map(Number);
        return sum + hours + (minutes / 60);
      }
      return sum;
    }, 0).toFixed(1);

    setSummaryStats({
      presentEmployees,
      totalRecords: data.length,
      totalHours
    });
  };

  // Checkout functionality
  const handleCheckoutTimeChange = (rowKey, value, checkInTime) => {
    setCheckoutTimes(prev => ({
      ...prev,
      [rowKey]: value
    }));

    // Real-time validation
    if (value) {
      const checkinDate = new Date(checkInTime);
      const checkInDateString = getLocalDateString(checkinDate);
      const checkoutDateTime = new Date(`${checkInDateString}T${value}:00`);

      if (checkoutDateTime <= checkinDate) {
        setCheckoutErrors(prev => ({
          ...prev,
          [rowKey]: "Checkout time must be greater than check-in time"
        }));
      } else {
        // Clear error if valid
        setCheckoutErrors(prev => {
          const updated = { ...prev };
          delete updated[rowKey];
          return updated;
        });
      }
    } else {
      // Clear error if time is cleared
      setCheckoutErrors(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });
    }
  };

  const handleCheckout = async (row) => {
    const rowKey = `${row.Pin}-${row.CheckInTime}`;
    const checkoutTime = checkoutTimes[rowKey];

    if (!checkoutTime) {
      return;
    }

    // Set loading state immediately
    setCheckoutLoadingStates(prev => ({
      ...prev,
      [rowKey]: true
    }));

    const checkinDateObj = new Date(row.CheckInTime);
    const checkInDateString = getLocalDateString(checkinDateObj);

    // Process pending checkout and store data
    const pendingData = await processPendingCheckout(companyId);
    setPendingCheckoutData(pendingData);
    const checkoutDateTime = `${checkInDateString}T${checkoutTime}:00`;
    const checkinDateTime = row.CheckInTime;

    const checkinDate = new Date(checkinDateTime);
    const checkoutDate = new Date(checkoutDateTime);

    if (checkoutDate <= checkinDate) {
      setCheckoutLoadingStates(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });
      return;
    }

    const timeWorked = calculateTimeWorked(checkinDateTime, checkoutDateTime);

    try {
      // Prepare payload in snake_case format for backend
      const updateData = {
        type_id: row.Type || row.TypeID,
        check_out_time: checkoutDateTime,
        time_worked: timeWorked,
        check_in_snap: row.CheckInSnap || null,
        check_out_snap: null,
        date: checkInDateString,
        last_modified_by: localStorage.getItem("userName") || "Admin"
      };

      await updateDailyReportEntry(row.EmpID, companyId, row.CheckInTime, updateData);

      // Update the checked-out row in tableData
      setTableData(prev => prev.map(record => {
        if (record.Pin === row.Pin && record.CheckInTime === row.CheckInTime) {
          return {
            ...record,
            CheckOutTime: checkoutDateTime,
            TimeWorked: timeWorked,
            needsCheckout: false,
            checkInTimeFormatted: formatToAmPm(new Date(record.CheckInTime))
          }; 
        }
        return record;
      }));

      // Update the checked-out row in filteredData
      setFilteredData(prev => prev.map(record => {
        if (record.Pin === row.Pin && record.CheckInTime === row.CheckInTime) {
          return {
            ...record,
            CheckOutTime: checkoutDateTime,
            TimeWorked: timeWorked,
            needsCheckout: false,
            checkInTimeFormatted: formatToAmPm(new Date(record.CheckInTime))
          };
        }
        return record;
      }));

      // Recalculate summary stats with updated data
      setTableData(prev => {
        updateSummaryStats(prev);
        return prev;
      });

      // Clear checkout time input
      setCheckoutTimes(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });

      // Clear loading state
      setCheckoutLoadingStates(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });

    } catch (error) {
      console.error("Error updating checkout:", error);
      // Clear loading state on error
      setCheckoutLoadingStates(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });
    }
  };

  // Day Wise Report Functions
  const convertToAmPm = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const calculateTimeWorked = (checkIn, checkOut) => {
    const inTime = new Date(checkIn);
    const outTime = new Date(checkOut);
    const diff = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const viewDatewiseReport = async (dateValue, showLoading = false) => {
    if (!dateValue || !companyId) {
      setReportData([]);
      setFilteredData([]);
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const data = await fetchDailyReport(companyId, dateValue);
      const records = Array.isArray(data) ? data : [];
      console.log('Day-wise report raw data:', records.length, 'records');
      let processedData = records.map(item => ({
        ...item,
        formattedCheckIn: item.CheckInTime ? convertToAmPm(item.CheckInTime) : "--",
        formattedCheckOut: item.CheckOutTime ? convertToAmPm(item.CheckOutTime) : "--",
        TimeWorked: item.TimeWorked || (item.CheckInTime && item.CheckOutTime
          ? calculateTimeWorked(item.CheckInTime, item.CheckOutTime) : "--"),
      }));

      // Only filter by device if explicitly selected (skip if it's the default first device or filter would remove all data)
      if (selectedDevice && selectedDevice.DeviceID && devices.length > 1) {
        const filteredByDevice = processedData.filter(item => item.DeviceID === selectedDevice.DeviceID);
        // Only apply filter if it returns results, otherwise show all data
        if (filteredByDevice.length > 0) {
          processedData = filteredByDevice;
        }
      }

      console.log('Day-wise report processed:', processedData.length, 'records');

      setReportData(processedData);
      setFilteredData([...processedData]);
      updateSummaryStats(processedData);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
      setFilteredData([]);

    } finally {
      if (showLoading) setLoading(false);
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const calculateTotalTimeWorked = (data) => {
    const employeeTimes = {};

    data.forEach(entry => {
      const { Name, Pin, CheckInTime, CheckOutTime } = entry;
      if (!Name || !Pin || !CheckInTime) return;

      const checkInDate = new Date(CheckInTime);
      const checkOutDate = CheckOutTime ? new Date(CheckOutTime) : new Date();
      const timeDifferenceInMinutes = Math.floor(
        (Number(checkOutDate) - Number(checkInDate)) / 1000 / 60
      );

      if (!employeeTimes[Pin]) {
        employeeTimes[Pin] = { name: Name, totalMinutes: 0 };
      }
      employeeTimes[Pin].totalMinutes += timeDifferenceInMinutes;
    });

    // Convert to hours:minutes format
    for (const [pin, details] of Object.entries(employeeTimes)) {
      const hours = Math.floor(details.totalMinutes / 60);
      const mins = details.totalMinutes % 60;
      details.totalHoursWorked = `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return employeeTimes;
  };



  const loadSummaryReport = async (showLoading = true) => {
    if (!startDate || !endDate) {
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      return;
    }

    // Clear previous results before loading new data
    setReportData([]);
    setFilteredData([]);
    setEmployees([]);
    setDateRangeReportLoaded(false);

    if (showLoading) setLoading(true);
    try {
      const data = await fetchDateRangeReport(companyId, startDate, endDate);

      let filteredData = Array.isArray(data) ? data : [];
      console.log('Date Range Report raw data:', filteredData.length, 'records');

      // Apply device filter if selected (with smart fallback like day-wise report)
      if (selectedDevice && selectedDevice.DeviceID && devices.length > 1) {
        const filteredByDevice = filteredData.filter(item => item.DeviceID === selectedDevice.DeviceID);
        // Only apply filter if it returns results, otherwise show all data
        if (filteredByDevice.length > 0) {
          filteredData = filteredByDevice;
          console.log('Filtered by device:', filteredData.length, 'records');
        } else {
          console.log('Device filter would remove all data, showing all records');
        }
      }

      // Calculate total hours per employee
      const employeeData = Object.entries(
        calculateTotalTimeWorked(filteredData)
      ).map(([pin, empData]) => ({
        Pin: pin,
        Name: empData.name,
        TimeWorked: empData.totalHoursWorked || "0:00",
        hoursWorked: empData.totalHoursWorked || "0:00" // For backward compatibility
      }));

      console.log('Date Range Report processed data:', employeeData.length, 'employees');
      setEmployees(employeeData);
      setReportData(employeeData);
      setFilteredData(employeeData);
      setDateRangeReportLoaded(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading summary report:", error);
      setEmployees([]);
      setReportData([]);
      setFilteredData([]);
    } finally {
      if (showLoading) setLoading(false);
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  // Helper function to calculate weeks in a month (Monday-based)
  const calculateWeeksInMonth = (year, month) => {
    const weeks = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Find first Monday of the month
    let current = new Date(firstDay);
    while (current.getDay() !== 1 && current <= lastDay) {
      current.setDate(current.getDate() + 1);
    }

    // If no Monday found in this month, return empty
    if (current > lastDay) return [];

    // Create week blocks (Monday to Sunday)
    let weekNum = 1;
    while (current <= lastDay) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Don't go past the month end
      const actualEnd = weekEnd > lastDay ? lastDay : weekEnd;

      weeks.push({
        number: weekNum,
        label: `Week ${weekNum}: ${weekStart.getDate()} ${weekStart.toLocaleString('default', { month: 'short' })} - ${actualEnd.getDate()} ${actualEnd.toLocaleString('default', { month: 'short' })}`,
        start: `${year}-${String(month).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`,
        end: `${year}-${String(actualEnd.getMonth() + 1).padStart(2, '0')}-${String(actualEnd.getDate()).padStart(2, '0')}`
      });

      current.setDate(current.getDate() + 7);
      weekNum++;
    }

    return weeks;
  };

  // Helper function to get date range based on report type
  const getDateRangeForReportType = (reportType, year, month, weekIndex, half) => {
    const today = new Date();

    switch (reportType) {
      case 'Weekly': {
        if (availableWeeks.length === 0 || weekIndex === null) return null;
        const selectedWeekData = availableWeeks[weekIndex];
        return { start: selectedWeekData.start, end: selectedWeekData.end };
      }

      case 'Biweekly': {
        // Last 14 days from today
        const endDate = getTodayDate();
        const startDateObj = new Date(today);
        startDateObj.setDate(startDateObj.getDate() - 13);
        const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')}`;
        return { start: startDate, end: endDate };
      }

      case 'Monthly': {
        // Full month: 1st to last day
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { start: startDate, end: endDate };
      }

      case 'Bimonthly': {
        if (half === 'first') {
          // 1st to 15th
          const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
          const endDate = `${year}-${String(month).padStart(2, '0')}-15`;
          return { start: startDate, end: endDate };
        } else {
          // 16th to end of month
          const lastDay = new Date(year, month, 0).getDate();
          const startDate = `${year}-${String(month).padStart(2, '0')}-16`;
          const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          return { start: startDate, end: endDate };
        }
      }

      default:
        return null;
    }
  };

  // Load salaried report data
  const loadSalariedReport = async (showLoading = true) => {
    const dateRange = getDateRangeForReportType(selectedReportType, selectedYear, selectedMonth, selectedWeek, selectedHalf);

    if (!dateRange) {
      return;
    }

    if (showLoading) setLoading(true);
    try {
      const data = await fetchDateRangeReport(companyId, dateRange.start, dateRange.end);
      let filteredData = Array.isArray(data) ? data : [];
      console.log('Salaried Report raw data:', filteredData.length, 'records');

      // Apply device filter if selected (with smart fallback like day-wise report)
      if (selectedDevice && selectedDevice.DeviceID && devices.length > 1) {
        const filteredByDevice = filteredData.filter(item => item.DeviceID === selectedDevice.DeviceID);
        // Only apply filter if it returns results, otherwise show all data
        if (filteredByDevice.length > 0) {
          filteredData = filteredByDevice;
          console.log('Filtered by device:', filteredData.length, 'records');
        } else {
          console.log('Device filter would remove all data, showing all records');
        }
      }

      // Calculate total hours per employee
      const employeeData = Object.entries(
        calculateTotalTimeWorked(filteredData)
      ).map(([pin, empData]) => ({
        Pin: pin,
        Name: empData.name,
        TimeWorked: empData.totalHoursWorked || "0:00",
        hoursWorked: empData.totalHoursWorked || "0:00"
      }));

      console.log('Salaried Report processed data:', employeeData.length, 'employees');
      setSalariedReportData(employeeData);
      setReportData(employeeData);
      setFilteredData(employeeData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading salaried report:", error);
      setSalariedReportData([]);
      setReportData([]);
      setFilteredData([]);
    } finally {
      if (showLoading) setLoading(false);
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const filterData = () => {
    let filtered = activeTab === "today" ? tableData : activeTab === "pending" ? pendingCheckoutData : reportData;
    console.log('filterData called - activeTab:', activeTab, 'source data length:', filtered.length);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.Name?.toLowerCase().includes(query) ||
        record.Pin?.toLowerCase().includes(query) ||
        record.EmpID?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === "name") {
        aValue = a.Name?.toLowerCase() || "";
        bValue = b.Name?.toLowerCase() || "";
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "pin") {
        aValue = a.Pin || "";
        bValue = b.Pin || "";
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "time") {
        // Convert time format "HH:MM" to minutes for proper numerical sorting
        const timeToMinutes = (timeStr) => {
          if (!timeStr || timeStr === "--" || timeStr === "0:00") return 0;
          const [hours, minutes] = timeStr.split(':').map(Number);
          return (hours || 0) * 60 + (minutes || 0);
        };
        aValue = timeToMinutes(a.TimeWorked || "0:00");
        bValue = timeToMinutes(b.TimeWorked || "0:00");
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      } else if (sortConfig.key === "checkin") {
        // Convert check-in time to Date objects for proper chronological sorting
        aValue = a.CheckInTime ? new Date(a.CheckInTime).getTime() : 0;
        bValue = b.CheckInTime ? new Date(b.CheckInTime).getTime() : 0;
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    console.log('filterData result:', filtered.length, 'records');
    setFilteredData(filtered);
  };

  const downloadCSV = () => {
    if (filteredData.length === 0) {
      return;
    }

    let csvContent, filename;

    if (activeTab === "summary" || activeTab === "salaried") {
      // Summary and Salaried reports: Employee ID, Name, Total Hours
      csvContent = "Employee ID,Name,Total Hours Worked\n";
      csvContent += filteredData.map(record => [
        record.Pin || "",
        record.Name || "",
        record.TimeWorked || record.hoursWorked || "0:00"
      ].join(",")).join("\n");

      if (activeTab === "summary") {
        filename = `summary_report_${startDate}_to_${endDate}.csv`;
      } else {
        filename = `salaried_report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`;
      }
    } else {
      // Today, Daywise, Pending: Full details with check-in/out times
      csvContent = "Employee ID,Name,Check-in Time,Check-out Time,Time Worked,Type\n";
      csvContent += filteredData.map(record => [
        record.Pin || "",
        record.Name || "",
        record.CheckInTime ? formatTime(record.CheckInTime) : "",
        record.CheckOutTime ? formatTime(record.CheckOutTime) : "",
        record.TimeWorked || "",
        record.Type || ""
      ].join(",")).join("\n");

      if (activeTab === "today") {
        filename = `today_report_${new Date().toISOString().split('T')[0]}.csv`;
      } else if (activeTab === "daywise") {
        filename = `daywise_report_${selectedDate}.csv`;
      } else if (activeTab === "pending") {
        filename = `pending_checkout_${new Date().toISOString().split('T')[0]}.csv`;
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const downloadPDF = () => {
    if (filteredData.length === 0) {
      return;
    }

    try {
      const doc = new jsPDF();
      const companyName = localStorage.getItem("companyName") || "Company";

      // Title
      doc.setFontSize(18);
      let reportTitle = "";
      if (activeTab === "today") {
        reportTitle = "Today's Report";
      } else if (activeTab === "daywise") {
        reportTitle = "Day-wise Report";
      } else if (activeTab === "summary") {
        reportTitle = "Date Range Report";
      } else if (activeTab === "salaried") {
        reportTitle = `${selectedReportType} Report`;
      } else if (activeTab === "pending") {
        reportTitle = "Pending Checkout Report";
      }
      doc.text(`${companyName} - ${reportTitle}`, 14, 20);

      // Date information
      doc.setFontSize(11);
      let dateText = "";
      if (activeTab === "today") {
        dateText = `Date: ${new Date().toLocaleDateString()}`;
      } else if (activeTab === "daywise") {
        dateText = `Date: ${selectedDate || new Date().toISOString().split('T')[0]}`;
      } else if (activeTab === "summary") {
        dateText = `Period: ${startDate || "N/A"} to ${endDate || "N/A"}`;
      } else if (activeTab === "salaried") {
        const dateRange = getDateRangeForReportType(selectedReportType, selectedYear, selectedMonth, selectedWeek, selectedHalf);
        dateText = dateRange ? `Period: ${dateRange.start} to ${dateRange.end}` : "Period: N/A";
      } else if (activeTab === "pending") {
        dateText = `Date: ${new Date().toLocaleDateString()}`;
      }
      doc.text(dateText, 14, 30);

      // Prepare table data based on active tab
      let tableData, headers;

      if (activeTab === "summary" || activeTab === "salaried") {
        // Summary and Salaried reports show employee, pin, and total hours
        headers = [['Employee ID', 'Name', 'Total Hours Worked']];
        tableData = filteredData.map(record => [
          record.Pin || "",
          record.Name || "",
          record.TimeWorked || record.hoursWorked || "0:00"
        ]);
      } else {
        // Today, daywise, and pending reports show detailed check-in/out info
        headers = [['Employee ID', 'Name', 'Check-in', 'Check-out', 'Time Worked', 'Type']];
        tableData = filteredData.map(record => [
          record.Pin || "",
          record.Name || "",
          record.formattedCheckIn || (record.CheckInTime ? convertToAmPm(record.CheckInTime) : "--"),
          record.formattedCheckOut || (record.CheckOutTime ? convertToAmPm(record.CheckOutTime) : "--"),
          record.TimeWorked || record.timeWorked || "--",
          record.Type || ""
        ]);
      }

      // Generate table
      autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 35,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [2, 6, 111] }
      });

      // Generate filename
      let filename;
      if (activeTab === "today") {
        filename = `today_report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (activeTab === "daywise") {
        filename = `daywise_report_${selectedDate}.pdf`;
      } else if (activeTab === "summary") {
        filename = `summary_report_${startDate}_to_${endDate}.pdf`;
      } else if (activeTab === "salaried") {
        filename = `salaried_report_${selectedReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (activeTab === "pending") {
        filename = `pending_checkout_${new Date().toISOString().split('T')[0]}.pdf`;
      }

      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const getStatusBadge = (record) => {
    if (record.CheckOutTime) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>;
    } else {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">In Progress</span>;
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalSuccess("");
    setModalError("");
    setNewEntry({
      EmployeeID: "",
      Type: "",
      Date: "",
      CheckInTime: "",
      CheckOutTime: ""
    });
    setFormErrors({
      employee: "",
      type: "",
      date: "",
      checkinTime: "",
      checkoutTime: ""
    });
    setCheckinDisabled(true);
    setCheckoutDisabled(true);
    setAddButtonDisabled(true);
  };

  const handleDateChange = (value) => {
    setNewEntry({ ...newEntry, Date: value });
    if (value) {
      setCheckinDisabled(false);
      // If check-in time already exists, enable checkout
      if (newEntry.CheckInTime) {
        setCheckoutDisabled(false);
      }
    } else {
      setCheckinDisabled(true);
      setCheckoutDisabled(true);
      setAddButtonDisabled(true);
    }
  };

  const handleCheckinTimeChange = (value) => {
    setNewEntry({ ...newEntry, CheckInTime: value });
    if (value && newEntry.Date && newEntry.EmployeeID && newEntry.Type) {
      setCheckoutDisabled(false);
      setAddButtonDisabled(false);
    } else {
      setCheckoutDisabled(true);
      setAddButtonDisabled(true);
    }
  };

  const handleModalCheckoutTimeChange = (value) => {
    setNewEntry({ ...newEntry, CheckOutTime: value });

    // Validate if both times are present
    if (value && newEntry.CheckInTime && newEntry.Date) {
      const checkinDateTime = new Date(`${newEntry.Date}T${newEntry.CheckInTime}:00`);
      const checkoutDateTime = new Date(`${newEntry.Date}T${value}:00`);

      if (checkoutDateTime <= checkinDateTime) {
        setFormErrors({
          ...formErrors,
          checkoutTime: "Checkout time must be greater than check-in time"
        });
      } else {
        setFormErrors({
          ...formErrors,
          checkoutTime: ""
        });
      }
    }
  };

  const loadEmployeeList = useCallback(async () => {
    try {
      const data = await fetchEmployeeData(companyId);
      setEmployeeList(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }, [companyId]);

  const handleSaveEntry = async () => {
    // Validation
    if (!newEntry.EmployeeID || !newEntry.Type || !newEntry.Date || !newEntry.CheckInTime) {
      setModalError("Please fill in all required fields");
      setTimeout(() => setModalError(""), 1000);
      return;
    }

    // If checkout time is provided, validate it's greater than check-in
    if (newEntry.CheckOutTime) {
      const checkinDateTime = new Date(`${newEntry.Date}T${newEntry.CheckInTime}:00`);
      const checkoutDateTime = new Date(`${newEntry.Date}T${newEntry.CheckOutTime}:00`);

      if (checkoutDateTime <= checkinDateTime) {
        setModalError("Checkout time must be greater than check-in time");
        setTimeout(() => setModalError(""), 1000);
        return;
      }
    }

    const selectedEmployee = employeeList.find(emp => emp.pin === newEntry.EmployeeID);
    if (!selectedEmployee) {
      setModalError("Selected employee not found");
      setTimeout(() => setModalError(""), 1000);
      return;
    }

    setModalSuccess("");
    setModalError("");
    setIsSubmitting(true);

    try {
      // Calculate time worked: if no checkout time, set to "0:00"
      const timeWorked = newEntry.CheckOutTime
        ? calculateTimeWorked(
          `${newEntry.Date}T${newEntry.CheckInTime}:00`,
          `${newEntry.Date}T${newEntry.CheckOutTime}:00`
        )
        : "0:00";

      // Prepare entry data for backend
      const entryData = {
        CID: companyId,
        EmpID: selectedEmployee.EmpID || selectedEmployee.emp_id,
        TypeID: newEntry.Type,
        CheckInSnap: null,
        CheckInTime: `${newEntry.Date}T${newEntry.CheckInTime}:00`,
        CheckOutSnap: null,
        CheckOutTime: newEntry.CheckOutTime ? `${newEntry.Date}T${newEntry.CheckOutTime}:00` : null,
        TimeWorked: timeWorked,
        Date: newEntry.Date,
        LastModifiedBy: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "Admin"
      };

      // Save to backend
      const response = await createDailyReportEntry(entryData);

      // Build new entry object for state
      const newEntryRecord = {
        ...response,
        Pin: selectedEmployee.pin,
        Name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        EmpID: selectedEmployee.EmpID || selectedEmployee.emp_id,
        Type: newEntry.Type,
        CheckInTime: entryData.CheckInTime,
        CheckOutTime: entryData.CheckOutTime,
        TimeWorked: timeWorked,
        checkInTimeFormatted: formatToAmPm(new Date(entryData.CheckInTime)),
        needsCheckout: !entryData.CheckOutTime,
        checkoutTime: "",
        formattedCheckIn: convertToAmPm(entryData.CheckInTime),
        formattedCheckOut: entryData.CheckOutTime ? convertToAmPm(entryData.CheckOutTime) : "--"
      };

      // Add to current view state
      if (activeTab === "today" && currentDate === newEntry.Date) {
        setTableData(prev => [newEntryRecord, ...prev]);
        setFilteredData(prev => [newEntryRecord, ...prev]);
        updateSummaryStats([newEntryRecord, ...tableData]);
      } else if (activeTab === "daywise" && selectedDate === newEntry.Date) {
        setReportData(prev => [newEntryRecord, ...prev]);
        setFilteredData(prev => [newEntryRecord, ...prev]);
        updateSummaryStats([newEntryRecord, ...reportData]);
      }

      setModalSuccess("Entry added successfully!");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (error) {
      console.error("Error saving entry:", error);
      setModalError(error.message || "Failed to save entry. Please try again.");
      setTimeout(() => {
        setModalError("");
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk upload handlers
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setBulkUploadError('');
    setBulkUploadResults(null);
    setBulkUploadSuccess('');

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setBulkUploadError('File size too large. Please select a file smaller than 10MB.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const allowedExtensions = /\.(csv|xlsx|xls)$/i;

    if (!allowedTypes.includes(file.type) && !allowedExtensions.test(file.name)) {
      setBulkUploadError('Invalid file format. Please select a CSV (.csv) or Excel (.xlsx, .xls) file.');
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      setBulkUploadError('Please select a file to upload.');
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadError('');
    setBulkUploadResults(null);
    setBulkUploadSuccess('');

    try {
      const result = await bulkUploadReportData(companyId, selectedFile);
      console.log('Upload result:', result); // Debug log

      setBulkUploadResults(result);

      if (result.successful && result.successful.length > 0) {
        const successMsg = result.failed?.length > 0
          ? `Successfully uploaded ${result.successful.length} record${result.successful.length > 1 ? 's' : ''}. ${result.failed.length} record${result.failed.length > 1 ? 's' : ''} failed.`
          : `Successfully uploaded ${result.successful.length} record${result.successful.length > 1 ? 's' : ''}.`;

        setBulkUploadSuccess(successMsg);

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (result.message || result.success) {
        setBulkUploadSuccess(result.message || 'Upload completed successfully!');
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setBulkUploadError('Upload failed. All records had errors. Please review the results below.');
      }
    } catch (error) {
      setBulkUploadError(`Upload failed: ${error.message || 'An unexpected error occurred. Please try again.'}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadDevices();
      loadEmployeeList();
      setCurrentDate(getTodayDate());

      // Load employment types from localStorage
      const storedEmploymentTypes = localStorage.getItem("employmentType");
      if (storedEmploymentTypes) {
        setEmploymentTypes(storedEmploymentTypes.split(",").map(t => t.trim()).filter(t => t));
      }
    }
  }, [companyId, loadDevices, loadEmployeeList]);

  useEffect(() => {
    // Clear selected dates when switching tabs
    if (activeTab === "summary") {
      setReportData([]);
      setFilteredData([]);
      // Don't clear dates or loaded flag - preserve data when switching back to summary tab
      // User can manually clear by changing dates if needed
    } else if (activeTab === "salaried") {
      // For Salaried Report, clear everything and wait for user to click Load Report
      setReportData([]);
      setFilteredData([]);
      setSalariedReportData([]);
    } else if (activeTab === "pending") {
      // Load pending checkout data
      const loadPendingData = async () => {
        setLoading(true);
        try {
          const pendingData = await processPendingCheckout(companyId);
          setPendingCheckoutData(pendingData);
        } catch (error) {
          console.error("Error loading pending checkout data:", error);
        } finally {
          setLoading(false);
          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }
      };
      loadPendingData();
    } else if (activeTab === "today") {
      // For Today's Report, clear and load data
      setReportData([]);
      setFilteredData([]);
      setEmployees([]);
      setSalariedReportData([]);
      if (currentDate) {
        viewCurrentDateReport(currentDate, true);
      }
    } else if (activeTab === "daywise") {
      // For daywise, let the separate useEffect handle loading
      // Just clear other report data
      setEmployees([]);
      setSalariedReportData([]);
    }
  }, [activeTab]); // Only depend on activeTab to prevent clearing when dates change

  // Separate effect for handling date changes in daywise tab
  useEffect(() => {
    if (activeTab === "daywise" && selectedDate) {
      viewDatewiseReport(selectedDate, true);
    }
  }, [activeTab, selectedDate]); // Run when either activeTab or selectedDate changes

  // Separate effect for handling current date changes in today tab
  useEffect(() => {
    if (activeTab === "today" && currentDate) {
      viewCurrentDateReport(currentDate, true);
    }
  }, [currentDate]); // Only run when currentDate changes

  // Separate effect for handling date changes in summary tab
  useEffect(() => {
    if (activeTab === "summary" && startDate && endDate && dateRangeReportLoaded) {
      // Auto-reload when dates change after initial load
      loadSummaryReport(false);
    }
  }, [startDate, endDate]); // Run when dates change

  useEffect(() => {
    // Auto-calculate weeks when year/month changes for Weekly report
    if (selectedReportType === 'Weekly' && selectedYear && selectedMonth) {
      const weeks = calculateWeeksInMonth(selectedYear, selectedMonth);
      setAvailableWeeks(weeks);
      setSelectedWeek(weeks.length > 0 ? 0 : null);
    }
  }, [selectedYear, selectedMonth, selectedReportType]);

  useEffect(() => {
    filterData();
  }, [reportData, tableData, pendingCheckoutData, searchQuery, sortConfig, activeTab]);

  // Pagination effect
  useEffect(() => {
    const itemsPerPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    if (window.innerWidth < 650) {
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

  const openHistory = async (record) => {
    if (!record?.RecordID) return;
    setHistoryRecord(record);
    setHistoryItems([]);
    setHistoryError("");
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const data = await fetchReportHistory(record.RecordID);
      setHistoryItems(data.items || []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Unable to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />



      {/* Loading Overlay */}
      {loading && (
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
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports & Analytics</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and analyze employee time tracking data
                </p>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadCSV}
                  disabled={!filteredData || filteredData.length === 0}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  disabled={!filteredData || filteredData.length === 0}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {activeTab === "today" && (
              <>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Checked-in Employees</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.presentEmployees}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Currently Working</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.filter(r => r.CheckInTime && !r.CheckOutTime).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {(activeTab === "daywise" || activeTab === "summary" || activeTab === "salaried") && (
              <>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Employees</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{new Set(filteredData.map(r => r.EmployeeId)).size}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Records</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "pending" && (
              <>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Checkouts</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                      <div className="ml-3 sm:ml-4">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">Affected Employees</p>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{new Set(filteredData.map(r => r.EmployeeId)).size}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { key: "today", label: "Today Report", icon: Calendar },
                { key: "daywise", label: "Day-wise Report", icon: Calendar },
                { key: "summary", label: "Date Range Report", icon: BarChart3 },
                { key: "pending", label: "Pending Checkout", icon: Clock }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">
                    {key === "today" ? "Today" : key === "daywise" ? "Daily" : key === "summary" ? "Date Range" : key === "salaried" ? "Salary" : "Pending"}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Date Controls Row */}
            {activeTab === "daywise" && (
              <div className="space-y-2">
                <Label htmlFor="selectedDate">Select Date</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}

            {/* Date Range Controls for Date Range Report */}
            {activeTab === "summary" && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={loadSummaryReport}
                    disabled={loading || !startDate || !endDate}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load Report"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Search and Controls Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
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
                          sortConfig.key === 'name' ? 'Sort By Name' :
                            sortConfig.key === 'pin' ? 'Sort By PIN' :
                              sortConfig.key === 'checkin' ? 'Sort By Check-in' :
                                sortConfig.key === 'time' ? 'Time' : 'Sort'
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
                      { key: 'name', direction: 'asc', label: 'Sort By Name', icon: ArrowUp },
                      { key: 'name', direction: 'desc', label: 'Sort By Name', icon: ArrowDown },
                      { key: 'pin', direction: 'asc', label: 'Sort By PIN', icon: ArrowUp },
                      { key: 'pin', direction: 'desc', label: 'Sort By PIN', icon: ArrowDown },

                    ].map(({ key, direction, label, icon: Icon }) => (
                      <button
                        key={`${key}-${direction}`}
                        onClick={() => {
                          const newSortConfig = { key, direction };
                          setSortConfig(newSortConfig);
                          // Persist sort config to localStorage
                          localStorage.setItem('reportSortConfig', JSON.stringify(newSortConfig));
                          document.getElementById('sort-dropdown').classList.add('hidden');
                          // Refresh the page after 100ms to allow state update
                          setTimeout(() => {
                            window.location.reload();
                          }, 100);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors ${sortConfig.key === key && sortConfig.direction === direction
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${direction === 'asc' ? 'text-green-600' : 'text-blue-600'
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
        </div>

        {/* Today's Report Section */}
        {activeTab === "today" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Today's Report - {new Date().toLocaleDateString()}</span>
                      <span className="sm:hidden">Today's Report</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Current day employee check-in and check-out summary
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-[#02066F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#030974] transition-colors w-full sm:w-auto text-sm sm:text-base"
                    >
                      Add Entry
                    </button>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="page-size-today" className="text-xs sm:text-sm whitespace-nowrap">
                        Records per page:
                      </Label>
                      <select
                        id="page-size-today"
                        value={pageSize.toString()}
                        onChange={(e) => {
                          setPageSize(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-8 px-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >                     
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Records Found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                      No entries found for today. Click "Add Entry" to get started.
                    </p>
                  </div>
                ) : (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedData.map((record, index) => {
                        const rowKey = `${record.Pin}-${record.CheckInTime}`;
                        const hasCheckout = record.CheckOutTime;
                        const selectedTime = checkoutTimes[rowKey];
                        const checkoutError = checkoutErrors[rowKey];
                        const checkInTime = new Date(record.CheckInTime);
                        const minTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes() + 1).padStart(2, '0')}`;

                        return (
                          <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{record.Name}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">PIN: {record.Pin}</CardDescription>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 pt-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{record.Type}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">In: {formatTime(record.CheckInTime)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">Out: {formatTime(record.CheckOutTime)}</span>
                              </div>
                              {!hasCheckout && (
                                <div className="space-y-2">
                                  <input
                                    type="time"
                                    value={selectedTime || ''}
                                    onChange={(e) => handleCheckoutTimeChange(rowKey, e.target.value, record.CheckInTime)}
                                    min={minTime}
                                    className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Select checkout time"
                                  />
                                  {checkoutError && (
                                    <span className="text-red-500 text-xs">{checkoutError}</span>
                                  )}
                                </div>
                              )}
                              <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                  <span>Time Worked</span>
                                  <span className="font-medium text-foreground">{record.TimeWorked}</span>
                                </div>
                                {!hasCheckout && (
                                  <Button
                                    onClick={() => handleCheckout(record)}
                                    disabled={!selectedTime || checkoutError || checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]}
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                  >
                                    {checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Check Out"
                                    )}
                                  </Button>
                                )}
                                {canManageReports && <div className="mt-2 flex gap-1.5"><Button variant="outline" size="sm" onClick={() => openEditReport(record)} className="h-10 w-10 p-0 flex items-center justify-center"><Pencil className="h-4 w-4" title="Edit" /></Button><Button variant="outline" size="sm" onClick={() => openHistory(record)} className="h-10 w-10 p-0 flex items-center justify-center"><History className="h-4 w-4" title="History" /></Button><Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="h-10 w-10 p-0 flex items-center justify-center text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" title="Delete" /></Button></div>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      </div>
                    ) : (
                      <Card>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead style={{ backgroundColor: '#01005a' }}>
                              <tr className="border-b">
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Employee ID</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Name</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Check-in Time</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Check-out Time</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Type</th>
                                <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[220px]">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedData.map((record, index) => {
                              const rowKey = `${record.Pin}-${record.CheckInTime}`;
                              const hasCheckout = record.CheckOutTime;
                              const selectedTime = checkoutTimes[rowKey];
                              const checkoutError = checkoutErrors[rowKey];

                              // Get minimum time (check-in time) for time picker
                              const checkInTime = new Date(record.CheckInTime);
                              const minTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes() + 1).padStart(2, '0')}`;

                              return (
                                <tr key={index} className="border-b hover:bg-muted/50">
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{record.Pin}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">{record.Name}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatTime(record.CheckInTime)}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">
                                    {hasCheckout ? (
                                      formatTime(record.CheckOutTime)
                                    ) : (
                                      <div className="flex flex-col">
                                        <input
                                          type="time"
                                          value={selectedTime || ''}
                                          onChange={(e) => handleCheckoutTimeChange(rowKey, e.target.value, record.CheckInTime)}
                                          min={minTime}
                                          className={`border rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${checkoutError
                                              ? 'border-red-500 focus:ring-red-500'
                                              : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        />
                                        {checkoutError && (
                                          <span className="text-red-500 text-xs mt-1">{checkoutError}</span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 sm:p-4">
                                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {record.Type}
                                    </span>
                                  </td>
                                  <td className="p-2 sm:p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      {canManageReports && <><Button variant="outline" size="sm" onClick={() => openEditReport(record)} className="h-10 w-10 p-0 flex items-center justify-center"><Pencil className="h-3.5 w-3.5" title="Edit" /></Button><Button variant="outline" size="sm" onClick={() => openHistory(record)} className="h-10 w-10 p-0 flex items-center justify-center"><History className="h-3.5 w-3.5" title="History" /></Button><Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="h-10 w-10 p-0 flex items-center justify-center text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" title="Delete" /></Button></>}
                                      <Button
                                        onClick={() => handleCheckout(record)}
                                        disabled={hasCheckout || !selectedTime || checkoutError || checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]}
                                        size="sm"
                                        className={`w-36 text-xs ${
                                          hasCheckout
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]
                                            ? 'bg-green-600 opacity-75 cursor-not-allowed'
                                            : !selectedTime || checkoutError
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                      >
                                        {checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`] ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : hasCheckout ? (
                                          'Checked Out'
                                        ) : (
                                          'Check Out'
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                        {/* Pagination */}
                        {(() => {
                          const itemsPerPage = getItemsPerPage();
                          const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                          const paginationEndIndex = paginationStartIndex + itemsPerPage;
                          const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                          return filteredData.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200">
                              <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                                Showing {paginationStartIndex + 1}-{Math.min(paginationEndIndex, filteredData.length)} of {filteredData.length}
                              </div>
                              {totalPages > 1 && (
                                <div className="flex items-center gap-3 order-1 sm:order-2">
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                      currentPage === 1
                                        ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                        : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                    }`}
                                  >
                                    Prev
                                  </button>
                                  <span className="text-sm font-medium text-gray-900 px-2">
                                    {currentPage} / {totalPages}
                                  </span>
                                  <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                      currentPage === totalPages
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
                    {/* Pagination for Grid View */}
                    {(() => {
                      const itemsPerPage = getItemsPerPage();
                      const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                      const paginationEndIndex = paginationStartIndex + itemsPerPage;
                      const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                      return viewMode === "grid" && filteredData.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-4">
                          <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                            Showing {paginationStartIndex + 1}-{Math.min(paginationEndIndex, filteredData.length)} of {filteredData.length}
                          </div>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-3 order-1 sm:order-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  currentPage === 1
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                Prev
                              </button>
                              <span className="text-sm font-medium text-gray-900 px-2">
                                {currentPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  currentPage === totalPages
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
          </div>
        )}

        {/* Day-wise Report Section */}
        {activeTab === "daywise" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Day-wise Report - {selectedDate}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Employee check-in and check-out times for the selected date
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size-daywise" className="text-xs sm:text-sm whitespace-nowrap">
                      Records per page:
                    </Label>
                    <select
                      id="page-size-daywise"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setCurrentPage(1);
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
              </CardHeader>

              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No data found</h3>
                    <p className="text-sm text-muted-foreground">
                      No records found for the selected date.
                    </p>
                  </div>
                ) : (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {paginatedData.map((record, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base sm:text-lg truncate">{record.Name}</CardTitle>
                                  <CardDescription className="text-xs sm:text-sm">PIN: {record.Pin}</CardDescription>
                                </div>
                              </div>
                              {getStatusBadge(record)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4 pt-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{record.Type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">In: {formatTime(record.CheckInTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">Out: {formatTime(record.CheckOutTime)}</span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Time Worked</span>
                                <span className="font-medium text-foreground">{record.TimeWorked}</span>
                              </div>
                              {canManageReports && (
                                <div className="mt-3 flex gap-1.5">
                                  <Button variant="outline" size="sm" onClick={() => openEditReport(record)} className="flex-1 h-10 flex items-center justify-center"><Pencil className="h-4 w-4" /><span className="hidden sm:inline ml-1">Edit</span></Button>
                                  <Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="flex-1 h-10 flex items-center justify-center text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline ml-1">Delete</span></Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead style={{ backgroundColor: '#01005a' }}>
                            <tr className="border-b">
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Employee</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">PIN</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Check In</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Check Out</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Type</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Status</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Time Worked</th>
                              {canManageReports && <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[160px]">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedData.map((record, index) => (
                              <tr key={index} className="border-b hover:bg-muted/50">
                                <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{record.Name}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">{record.Pin}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatTime(record.CheckInTime)}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatTime(record.CheckOutTime)}</td>
                                <td className="p-2 sm:p-4">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {record.Type}
                                  </span>
                                </td>
                                <td className="p-2 sm:p-4">{getStatusBadge(record)}</td>
                                <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{record.TimeWorked}</td>
                                {canManageReports && <td className="p-2 sm:p-4"><div className="flex items-center justify-center gap-2"><Button variant="outline" size="sm" onClick={() => openEditReport(record)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" onClick={() => openHistory(record)}><History className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button></div></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )
                )}
                {/* Pagination - Shared by both Card and Table View */}
                {(() => {
                  const itemsPerPage = getItemsPerPage();
                  const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                  const paginationEndIndex = paginationStartIndex + itemsPerPage;
                  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                  return filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-4">
                      <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                        Showing {paginationStartIndex + 1}-{Math.min(paginationEndIndex, filteredData.length)} of {filteredData.length}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-3 order-1 sm:order-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              currentPage === 1
                                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            Prev
                          </button>
                          <span className="text-sm font-medium text-gray-900 px-2">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              currentPage === totalPages
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Range Report Section */}
        {activeTab === "summary" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Date Range Report</span>
                      <span className="sm:hidden">Range Report</span>
                    </CardTitle>
                    {startDate && endDate && (
                      <CardDescription className="text-sm mt-1">
                        Showing consolidated data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size-summary" className="text-xs sm:text-sm whitespace-nowrap">
                      Records per page:
                    </Label>
                    <select
                      id="page-size-summary"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value));
                        setCurrentPage(1);
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
              </CardHeader>
              <CardContent>
                {!dateRangeReportLoaded ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">Select dates above and click "Load Report" to view data.</p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">No records found for the selected date range.</p>
                  </div>
                ) : (
                  <>
                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {(() => {
                          const itemsPerPage = getItemsPerPage();
                          const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                          const paginationEndIndex = paginationStartIndex + itemsPerPage;
                          return filteredData.slice(paginationStartIndex, paginationEndIndex).map((employee, index) => (
                            <Card key={index} className="hover:shadow-lg transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{employee.Name}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">PIN: {employee.Pin}</CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-xs sm:text-sm text-muted-foreground">Total Hours</span>
                                  <span className="font-semibold text-blue-600 text-sm sm:text-base">
                                    {employee.TimeWorked || employee.hoursWorked || "0:00"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ));
                        })()}
                      </div>
                    ) : (
                      <Card>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead style={{ backgroundColor: '#01005a' }}>
                              <tr className="border-b">
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Employee</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">PIN</th>
                                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Total Time Worked</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const itemsPerPage = getItemsPerPage();
                                const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                                const paginationEndIndex = paginationStartIndex + itemsPerPage;
                                return filteredData.slice(paginationStartIndex, paginationEndIndex).map((employee, index) => (
                                  <tr key={index} className="border-b hover:bg-muted/50">
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-900">{employee.Name}</td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">{employee.Pin}</td>
                                    <td className="p-2 sm:p-4 text-xs sm:text-sm font-semibold text-blue-600">
                                      {employee.TimeWorked || employee.hoursWorked || "0:00"}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                    {/* Pagination - Shared by both Card and Table View */}
                    {(() => {
                      const itemsPerPage = getItemsPerPage();
                      const paginationStartIndex = (currentPage - 1) * itemsPerPage;
                      const paginationEndIndex = paginationStartIndex + itemsPerPage;
                      const totalPages = Math.ceil(filteredData.length / itemsPerPage);
                      return filteredData.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-4">
                          <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                            Showing {paginationStartIndex + 1}-{Math.min(paginationEndIndex, filteredData.length)} of {filteredData.length}
                          </div>
                          {totalPages > 1 && (
                            <div className="flex items-center gap-3 order-1 sm:order-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  currentPage === 1
                                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                }`}
                              >
                                Prev
                              </button>
                              <span className="text-sm font-medium text-gray-900 px-2">
                                {currentPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  currentPage === totalPages
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
          </div>
        )}

        {/* Pending Checkout Section */}
        {activeTab === "pending" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pending Checkout
                    </CardTitle>
                    <CardDescription>
                      Employees who have checked in but not checked out
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="page-size-pending" className="text-xs sm:text-sm whitespace-nowrap">
                      Records per page:
                    </Label>
                    <select
                      id="page-size-pending"
                      value={pendingPageSize}
                      onChange={(e) => {
                        setPendingPageSize(parseInt(e.target.value));
                        setPendingCurrentPage(1);
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
              </CardHeader>

              <CardContent>
                {pendingCheckoutData.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Pending Checkouts</h3>
                    <p className="text-sm text-muted-foreground">
                      All employees have completed their checkout for today.
                    </p>
                  </div>
                ) : (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {paginatedPendingCheckoutData.map((record, index) => {
                        const rowKey = `${record.Pin}-${record.CheckInTime}`;
                        const selectedTime = checkoutTimes[rowKey];
                        const checkoutError = checkoutErrors[rowKey];
                        const checkInTime = new Date(record.CheckInTime);
                        const minTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes() + 1).padStart(2, '0')}`;

                        return (
                          <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{record.Name}</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">PIN: {record.Pin}</CardDescription>
                                  </div>
                                </div>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 pt-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{record.Type}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-muted-foreground">Date Filed</span>
                                <span className="text-xs sm:text-sm font-medium">{record.CheckInTime ? new Date(record.CheckInTime).toLocaleDateString() : '--'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">In: {formatTime(record.CheckInTime)}</span>
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="time"
                                  value={selectedTime || ''}
                                  onChange={(e) => handleCheckoutTimeChange(rowKey, e.target.value, record.CheckInTime)}
                                  min={minTime}
                                  className="w-full border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Select checkout time"
                                />
                                {checkoutError && (
                                  <span className="text-red-500 text-xs">{checkoutError}</span>
                                )}
                              </div>
                              <div className="pt-2 border-t">
                                <Button
                                  onClick={() => handleCheckout(record)}
                                  disabled={!selectedTime || checkoutError || checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]}
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                  {checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Check Out"
                                  )}
                                </Button>
                                {canManageReports && <div className="mt-2 flex gap-1.5"><Button variant="outline" size="sm" onClick={() => openEditReport(record)} className="h-10 w-10 p-0 flex items-center justify-center"><Pencil className="h-4 w-4" title="Edit" /></Button><Button variant="outline" size="sm" onClick={() => openHistory(record)} className="h-10 w-10 p-0 flex items-center justify-center"><History className="h-4 w-4" title="History" /></Button><Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="h-10 w-10 p-0 flex items-center justify-center text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" title="Delete" /></Button></div>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead style={{ backgroundColor: '#01005a' }}>
                            <tr className="border-b">
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Employee ID</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Name</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[100px]">Date Filed</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Check-in Time</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[120px]">Check-out Time</th>
                              <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[80px]">Type</th>
                              <th className="text-center p-2 sm:p-4 font-medium text-xs sm:text-sm text-white min-w-[220px]">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPendingCheckoutData.map((record, index) => {
                              const rowKey = `${record.Pin}-${record.CheckInTime}`;
                              const selectedTime = checkoutTimes[rowKey];
                              const checkoutError = checkoutErrors[rowKey];
                              const checkInTime = new Date(record.CheckInTime);
                              const minTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes() + 1).padStart(2, '0')}`;

                              return (
                                <tr key={index} className="border-b hover:bg-muted/50">
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">{record.Pin}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">{record.Name}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">{record.CheckInTime ? new Date(record.CheckInTime).toLocaleDateString() : '--'}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">{formatTime(record.CheckInTime)}</td>
                                  <td className="p-2 sm:p-4 text-xs sm:text-sm">
                                    <div className="flex flex-col">
                                      <input
                                        type="time"
                                        value={selectedTime || ''}
                                        onChange={(e) => handleCheckoutTimeChange(rowKey, e.target.value, record.CheckInTime)}
                                        min={minTime}
                                        className={`border rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 ${checkoutError
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                          }`}
                                      />
                                      {checkoutError && (
                                        <span className="text-red-500 text-xs mt-1">{checkoutError}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 sm:p-4">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {record.Type}
                                    </span>
                                  </td>
                                  <td className="p-2 sm:p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      {canManageReports && <><Button variant="outline" size="sm" onClick={() => openEditReport(record)} className="w-12"><Pencil className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" onClick={() => openHistory(record)} className="w-12"><History className="h-3.5 w-3.5" /></Button><Button variant="outline" size="sm" onClick={() => setReportToDelete(record)} className="w-12 text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></Button></>}
                                      <Button
                                        onClick={() => handleCheckout(record)}
                                        disabled={!selectedTime || checkoutError || checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]}
                                        size="sm"
                                        className={`w-36 text-xs ${
                                          checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`]
                                            ? 'bg-green-600 opacity-75 cursor-not-allowed'
                                            : !selectedTime || checkoutError
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                      >
                                        {checkoutLoadingStates[`${record.Pin}-${record.CheckInTime}`] ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          "Check Out"
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )
                )}
                {/* Pagination - Shared by both Card and Table View */}
                {(() => {
                  return pendingCheckoutData.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 mt-4">
                      <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                        Showing {pendingPaginationStartIndex + 1}-{Math.min(pendingPaginationEndIndex, pendingCheckoutData.length)} of {pendingCheckoutData.length}
                      </div>
                      {pendingTotalPages > 1 && (
                        <div className="flex items-center gap-3 order-1 sm:order-2">
                          <button
                            onClick={() => setPendingCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={pendingCurrentPage === 1}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              pendingCurrentPage === 1
                                ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            Prev
                          </button>
                          <span className="text-sm font-medium text-gray-900 px-2">
                            {pendingCurrentPage} / {pendingTotalPages}
                          </span>
                          <button
                            onClick={() => setPendingCurrentPage(prev => Math.min(prev + 1, pendingTotalPages))}
                            disabled={pendingCurrentPage === pendingTotalPages}
                            className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                              pendingCurrentPage === pendingTotalPages
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salaried Report Section removed - use SalaryReport page instead */}
      </div>

      {editingReport && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-edit-modal" className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4"><CardTitle className="text-lg sm:text-xl flex items-center gap-2"><Pencil className="w-5 h-5" />Edit Report</CardTitle><CardDescription className="text-sm">Worked time is recalculated automatically.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="edit-report-type">Employment Type</Label><select id="edit-report-type" value={editReport.type} onChange={(event) => setEditReport({ ...editReport, type: event.target.value })} className="w-full h-10 border border-input bg-background rounded-md px-3 text-sm"><option value="">Select Employment Type</option>{Array.from(new Set([...employmentTypes, editReport.type].filter(Boolean))).map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="edit-report-date">Date</Label><Input id="edit-report-date" type="date" value={editReport.date} max={getTodayDate()} onChange={(event) => setEditReport({ ...editReport, date: event.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="edit-report-checkin">Check-in Time</Label><Input id="edit-report-checkin" type="time" value={editReport.checkInTime} onChange={(event) => setEditReport({ ...editReport, checkInTime: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="edit-report-checkout">Check-out Time</Label><Input id="edit-report-checkout" type="time" value={editReport.checkOutTime} min={editReport.checkInTime || undefined} onChange={(event) => setEditReport({ ...editReport, checkOutTime: event.target.value })} /></div></div>
              {reportActionError && <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-600">{reportActionError}</p></div>}
              <div className="flex flex-col sm:flex-row gap-3"><Button variant="outline" className="flex-1 order-2 sm:order-1" disabled={isReportActionSubmitting} onClick={() => { setEditingReport(null); setReportActionError(""); }}>Cancel</Button><Button className="flex-1 order-1 sm:order-2 bg-[#01005a] hover:bg-[#01005a]/90 text-white" disabled={isReportActionSubmitting} onClick={handleReportCorrection}>{isReportActionSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}</Button></div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="report-delete-modal" className="w-full max-w-md mx-4"><CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#01005a' }}><AlertCircle className="w-5 h-5" />Delete Report</CardTitle><CardDescription className="text-sm">Are you sure you want to delete this report?</CardDescription></CardHeader><CardContent className="space-y-4">{reportActionError && <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-600">{reportActionError}</p></div>}<div className="flex flex-col sm:flex-row gap-3"><Button variant="outline" className="flex-1 order-2 sm:order-1" disabled={isReportActionSubmitting} onClick={() => { setReportToDelete(null); setReportActionError(""); }}>Cancel</Button><Button className="flex-1 order-1 sm:order-2 bg-[#01005a] hover:bg-[#01005a]/90 text-white" disabled={isReportActionSubmitting} onClick={handleReportDelete}>{isReportActionSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : "Delete Report"}</Button></div></CardContent></Card>
        </div>
      )}

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="add-entry-modal" className="w-full max-w-md max-h-[90vh] mx-4 overflow-hidden relative">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Add Entry
              </CardTitle>
              <CardDescription className="text-sm">
                Add a new time tracking entry
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-sm font-medium">Employee</Label>
                <select
                  id="employee"
                  value={newEntry.EmployeeID}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewEntry({ ...newEntry, EmployeeID: value });
                    if (value && newEntry.Type && newEntry.Date && newEntry.CheckInTime) {
                      setAddButtonDisabled(false);
                    } else {
                      setAddButtonDisabled(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select Employee</option>
                  {(employeeList || []).map((employee) => (
                    <option key={employee.pin} value={employee.pin}>
                      {capitalizeFirst(employee.first_name)} {capitalizeFirst(employee.last_name)}
                    </option>
                  ))}
                </select>
                {formErrors.employee && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.employee}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Employment Type</Label>
                <select
                  id="type"
                  value={newEntry.Type}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewEntry({ ...newEntry, Type: value });
                    if (value && newEntry.EmployeeID && newEntry.Date && newEntry.CheckInTime) {
                      setAddButtonDisabled(false);
                    } else {
                      setAddButtonDisabled(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  style={{ maxWidth: '100%' }}
                >
                  <option value="">Select Employment Type</option>
                  {employmentTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.Date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={getTodayDate()}
                  className="text-sm"
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkinTime" className="text-sm font-medium">Check-in Time *</Label>
                  <Input
                    id="checkinTime"
                    type="time"
                    value={newEntry.CheckInTime}
                    onChange={(e) => handleCheckinTimeChange(e.target.value)}
                    disabled={checkinDisabled}
                    className="text-sm disabled:bg-muted"
                  />
                  {formErrors.checkinTime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.checkinTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkoutTime" className="text-sm font-medium">Check-out Time</Label>
                  <Input
                    id="checkoutTime"
                    type="time"
                    value={newEntry.CheckOutTime}
                    onChange={(e) => handleModalCheckoutTimeChange(e.target.value)}
                    disabled={checkoutDisabled}
                    min={newEntry.CheckInTime || undefined}
                    className="text-sm disabled:bg-muted"
                  />
                  {formErrors.checkoutTime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.checkoutTime}</p>
                  )}
                </div>
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
                  onClick={closeModal}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEntry}
                  disabled={addButtonDisabled || isSubmitting || modalSuccess}
                  className="flex-1 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Entry"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Bulk Upload Report Data
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Upload multiple report entries using CSV or Excel files
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    // Clear all bulk upload state when modal is closed
                    setSelectedFile(null);
                    setBulkUploadResults(null);
                    setBulkUploadError('');
                    setBulkUploadSuccess('');
                    // Reset file input
                    const fileInput = document.getElementById('bulk-upload-file');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Select File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bulk-upload-file"
                  />
                  <label htmlFor="bulk-upload-file" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Click to select or drag and drop your file
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports CSV and Excel files only
                    </p>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setBulkUploadError('');
                        setBulkUploadResults(null);
                        setBulkUploadSuccess('');
                        // Reset file input
                        const fileInput = document.getElementById('bulk-upload-file');
                        if (fileInput) fileInput.value = '';
                      }}
                      className="h-6 w-6 p-0 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Required Fields Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Required Columns:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• <strong>employee_id</strong> - Employee PIN/ID</div>
                  <div>• <strong>name</strong> - Employee name</div>
                  <div>• <strong>date</strong> - Date (YYYY-MM-DD format)</div>
                  <div>• <strong>check_in_time</strong> - Check-in time (HH:MM format)</div>
                  <div>• <strong>check_out_time</strong> - Check-out time (HH:MM format, optional)</div>
                  <div>• <strong>type</strong> - Employment type</div>
                </div>
              </div>

              {/* Error Display */}
              {bulkUploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-1">Upload Error</h4>
                      <p className="text-sm text-red-600">{bulkUploadError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Display */}
              {bulkUploadSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{bulkUploadSuccess}</p>
                </div>
              )}

              {/* Results Display */}
              {bulkUploadResults && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Upload Results:</h4>

                  {bulkUploadResults.successful?.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="text-sm font-medium text-green-800 mb-2">
                        Successfully Added ({bulkUploadResults.successful.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadResults.successful.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-xs text-green-700">
                            {item.name} - {item.date}
                          </div>
                        ))}
                        {bulkUploadResults.successful.length > 10 && (
                          <div className="text-xs text-green-700 font-medium">
                            ... and {bulkUploadResults.successful.length - 10} more records added successfully
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bulkUploadResults.failed?.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <h5 className="text-sm font-medium text-red-800 mb-2">
                        Failed ({bulkUploadResults.failed.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadResults.failed.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-xs text-red-700">
                            {item.name}: {item.error}
                          </div>
                        ))}
                        {bulkUploadResults.failed.length > 10 && (
                          <div className="text-xs text-red-700 font-medium">
                            ... and {bulkUploadResults.failed.length - 10} more failed records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    // Clear all bulk upload state when modal is closed
                    setSelectedFile(null);
                    setBulkUploadResults(null);
                    setBulkUploadError('');
                    setBulkUploadSuccess('');
                    // Reset file input
                    const fileInput = document.getElementById('bulk-upload-file');
                    if (fileInput) fileInput.value = '';
                  }}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isBulkUploading}
                >
                  {bulkUploadResults ? 'Close' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  className="flex-1 order-1 sm:order-2"
                  disabled={!selectedFile || isBulkUploading}
                  style={{ display: bulkUploadResults ? 'none' : 'block' }}
                >
                  {isBulkUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Upload Report Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                {historyRecord?.Name || 'Employee'} — {historyRecord?.date || ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {historyLoading && (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">Loading history…</p>
                </div>
              )}

              {historyError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {historyError}
                </div>
              )}

              {!historyLoading && !historyError && historyItems.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-sm">
                  No history recorded yet.
                </div>
              )}

              {!historyLoading && historyItems.length > 0 && (
                <ol className="space-y-4 pt-4">
                  {historyItems.map((item, idx) => {
                    const opColor = {
                      CREATE: 'bg-emerald-50 text-emerald-700',
                      UPDATE: 'bg-blue-50 text-blue-700',
                      CORRECT: 'bg-amber-50 text-amber-700',
                      DELETE: 'bg-red-50 text-red-700',
                    };
                    return (
                      <li key={item.history_id} className="relative flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                            {item.sequence_num}
                          </span>
                          {idx < historyItems.length - 1 && (
                            <div className="w-px flex-1 bg-slate-200 mt-1" style={{height: '40px'}} />
                          )}
                        </div>

                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${opColor[item.operation] || 'bg-slate-100 text-slate-600'}`}>
                              {item.operation}
                            </span>
                            <span className="text-xs text-slate-500">
                              by <strong className="text-slate-700">{item.modified_by}</strong>
                              {' '}on {new Date(item.modified_at).toLocaleString()}
                            </span>
                          </div>

                          {Object.keys(item.changes).length > 0 ? (
                            <table className="w-full text-xs border border-slate-200 rounded">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                  <th className="text-left p-2 font-semibold text-slate-600">Field</th>
                                  <th className="text-left p-2 font-semibold text-slate-600">Before</th>
                                  <th className="text-left p-2 font-semibold text-slate-600">After</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(item.changes).map(([field, diff]) => (
                                  <tr key={field} className="border-b border-slate-200 last:border-0">
                                    <td className="p-2 font-medium text-slate-600 capitalize">
                                      {field.replace(/_/g, ' ')}
                                    </td>
                                    <td className="p-2 text-red-600 line-through opacity-60">
                                      {String(diff.before ?? '—')}
                                    </td>
                                    <td className="p-2 text-emerald-700 font-medium">
                                      {String(diff.after ?? '—')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-slate-400">
                              No business fields changed.
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
            <div className="border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Reports;
