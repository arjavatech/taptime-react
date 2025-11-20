import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { fetchEmployeeData, fetchDevices, fetchDailyReport, fetchDateRangeReport, createDailyReportEntry, updateDailyReportEntry } from "../api.js";
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
  Grid3X3,
  Table,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check
} from "lucide-react";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewMode, setViewMode] = useState("table");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
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
  const [checkoutDisabled, setCheckoutDisabled] = useState(true);
  const [addButtonDisabled, setAddButtonDisabled] = useState(true);
  const [formErrors, setFormErrors] = useState({
    employee: "",
    type: "",
    date: "",
    checkinTime: "",
    checkoutTime: ""
  });
  const companyId = localStorage.getItem("companyID");

  // Today's report specific
  const [tableData, setTableData] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [checkoutTimes, setCheckoutTimes] = useState({});

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

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    presentEmployees: 0,
    totalRecords: 0,
    totalHours: "0.0"
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Helper function to get today's date in YYYY-MM-DD format (local timezone)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadFrequenciesSync = () => {
    const savedFrequencies = localStorage.getItem("reportType");
    return savedFrequencies ? savedFrequencies.split(",").filter(f => f.trim() !== "" && f.toLowerCase() !== "weekly") : [];
  };

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

  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
    if (activeTab === "today") {
      viewCurrentDateReport(currentDate);
    } else if (activeTab === "daywise" && selectedDate) {
      viewDatewiseReport(selectedDate);
    } else if (activeTab === "summary" && startDate && endDate && dateRangeReportLoaded) {
      loadSummaryReport();
    } else if (activeTab === "salaried" && salariedReportData.length > 0) {
      // Reload salaried report if data was previously loaded
      loadSalariedReport();
    }
  };

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

  const viewCurrentDateReport = async (dateToUse = currentDate) => {
    setLoading(true);
    try {
      const arr = await fetchDailyReport(companyId, dateToUse);
      console.log("Today's Report raw data:", arr.length, 'records');

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

      console.log("Today's Report processed data:", processedData.length, 'records');
      setTableData(processedData);
      setFilteredData([...processedData]);
      updateSummaryStats(processedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
  const handleCheckoutTimeChange = (rowKey, value) => {
    setCheckoutTimes(prev => ({
      ...prev,
      [rowKey]: value
    }));
  };

  const handleCheckout = async (row) => {
    const rowKey = `${row.Pin}-${row.CheckInTime}`;
    const checkoutTime = checkoutTimes[rowKey];

    if (!checkoutTime) {
      showToast("Please enter a checkout time", "error");
      return;
    }

    const checkinDateObj = new Date(row.CheckInTime);
    const checkInDateString = getLocalDateString(checkinDateObj);
    const checkoutDateTime = `${checkInDateString}T${checkoutTime}:00`;
    const checkinDateTime = row.CheckInTime;

    const checkinDate = new Date(checkinDateTime);
    const checkoutDate = new Date(checkoutDateTime);

    if (checkoutDate <= checkinDate) {
      showToast("Checkout time must be greater than check-in time", "error");
      return;
    }

    const timeWorked = calculateTimeWorked(checkinDateTime, checkoutDateTime);

    setLoading(true);
    try {
      // Prepare payload in snake_case format for backend
      const updateData = {
        type_id: row.Type || row.TypeID,
        check_out_time: checkoutDateTime,
        time_worked: timeWorked,
        check_in_snap: row.CheckInSnap || null,
        check_out_snap: null,
        date: checkInDateString,
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "Admin"
      };

      await updateDailyReportEntry(row.EmpID, companyId, row.CheckInTime, updateData);

      setCheckoutTimes(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });

      await viewCurrentDateReport(currentDate);
      showToast("Checkout time updated successfully!");
    } catch (error) {
      console.error("Error updating checkout:", error);
      showToast("Failed to update checkout time. Please try again.", "error");
    } finally {
      setLoading(false);
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

  const viewDatewiseReport = async (dateValue) => {
    if (!dateValue || !companyId) {
      setReportData([]);
      setFilteredData([]);
      return;
    }

    setLoading(true);
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

      // Consolidate multiple entries per employee into single rows
      const consolidatedData = consolidateDaywiseReport(processedData);
      console.log('Day-wise report consolidated:', consolidatedData.length, 'unique employees from', processedData.length, 'records');

      setReportData(consolidatedData);
      setFilteredData([...consolidatedData]);
      updateSummaryStats(processedData);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
      setFilteredData([]);
      showToast("Failed to load report data", "error");
    } finally {
      setLoading(false);
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

  const consolidateDaywiseReport = (data) => {
    const consolidated = {};

    data.forEach(entry => {
      const { Name, Pin, CheckInTime, CheckOutTime, TimeWorked, Type, EmpID, DeviceID } = entry;
      if (!Name || !Pin) return;

      if (!consolidated[Pin]) {
        // Initialize entry for this employee
        consolidated[Pin] = {
          Name,
          Pin,
          EmpID,
          DeviceID,
          earliestCheckIn: CheckInTime,
          latestCheckOut: CheckOutTime,
          totalMinutes: 0,
          types: new Set(),
          hasIncompleteEntry: false
        };
      }

      // Track all unique types
      if (Type) {
        consolidated[Pin].types.add(Type);
      }

      // Find earliest check-in
      if (CheckInTime) {
        const currentCheckIn = new Date(CheckInTime);
        const earliestCheckIn = new Date(consolidated[Pin].earliestCheckIn);
        if (currentCheckIn < earliestCheckIn) {
          consolidated[Pin].earliestCheckIn = CheckInTime;
        }
      }

      // Find latest check-out
      if (CheckOutTime) {
        if (!consolidated[Pin].latestCheckOut) {
          consolidated[Pin].latestCheckOut = CheckOutTime;
        } else {
          const currentCheckOut = new Date(CheckOutTime);
          const latestCheckOut = new Date(consolidated[Pin].latestCheckOut);
          if (currentCheckOut > latestCheckOut) {
            consolidated[Pin].latestCheckOut = CheckOutTime;
          }
        }
      } else {
        // Mark if any entry doesn't have checkout
        consolidated[Pin].hasIncompleteEntry = true;
      }

      // Calculate time worked for this entry
      if (CheckInTime && CheckOutTime) {
        const checkInDate = new Date(CheckInTime);
        const checkOutDate = new Date(CheckOutTime);
        const timeDifferenceInMinutes = Math.floor(
          (Number(checkOutDate) - Number(checkInDate)) / 1000 / 60
        );
        consolidated[Pin].totalMinutes += timeDifferenceInMinutes;
      }
    });

    // Convert to array format with proper formatting
    return Object.values(consolidated).map(employee => {
      const hours = Math.floor(employee.totalMinutes / 60);
      const mins = employee.totalMinutes % 60;
      const totalTimeWorked = `${hours}:${mins.toString().padStart(2, "0")}`;
      const typesArray = Array.from(employee.types);

      return {
        Name: employee.Name,
        Pin: employee.Pin,
        EmpID: employee.EmpID,
        DeviceID: employee.DeviceID,
        CheckInTime: employee.earliestCheckIn,
        CheckOutTime: employee.hasIncompleteEntry ? null : employee.latestCheckOut,
        formattedCheckIn: employee.earliestCheckIn ? convertToAmPm(employee.earliestCheckIn) : "--",
        formattedCheckOut: (employee.hasIncompleteEntry || !employee.latestCheckOut) ? "--" : convertToAmPm(employee.latestCheckOut),
        TimeWorked: totalTimeWorked,
        Type: typesArray.join(", "), // Comma-separated types
        Status: employee.hasIncompleteEntry ? "In Progress" : "Completed"
      };
    });
  };

  const loadSummaryReport = async () => {
    if (!startDate || !endDate) {
      showToast("Please select both start and end dates", "error");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast("Start date must be before end date", "error");
      return;
    }

    // Clear previous results before loading new data
    setReportData([]);
    setFilteredData([]);
    setEmployees([]);
    setDateRangeReportLoaded(false);

    setLoading(true);
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
      showToast(`Loaded ${employeeData.length} employee records`);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading summary report:", error);
      showToast("Failed to load summary report", "error");
      setEmployees([]);
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
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
  const loadSalariedReport = async () => {
    const dateRange = getDateRangeForReportType(selectedReportType, selectedYear, selectedMonth, selectedWeek, selectedHalf);

    if (!dateRange) {
      showToast("Please select all required options", "error");
      return;
    }

    setLoading(true);
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
      showToast(`Loaded ${employeeData.length} employee records`);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error loading salaried report:", error);
      showToast("Failed to load report", "error");
      setSalariedReportData([]);
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = activeTab === "today" ? tableData : reportData;
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
      showToast("No data to export", "error");
      return;
    }

    let csvContent = "Employee ID,Name,Check-in Time,Check-out Time,Time Worked,Type\n";
    csvContent += filteredData.map(record => [
      record.Pin || "",
      record.Name || "",
      record.CheckInTime ? formatTime(record.CheckInTime) : "",
      record.CheckOutTime ? formatTime(record.CheckOutTime) : "",
      record.TimeWorked || "",
      record.Type || ""
    ].join(",")).join("\n");

    const filename = activeTab === "today" 
      ? `today_report_${new Date().toISOString().split('T')[0]}.csv`
      : `daily_report_${selectedDate}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    showToast("Report exported successfully!");
  };

  const downloadPDF = () => {
    if (filteredData.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    try {
      const doc = new jsPDF();
      const companyName = localStorage.getItem("companyName") || "Company";

      // Title
      doc.setFontSize(18);
      doc.text(`${companyName} - Attendance Report`, 14, 20);

      // Date information
      doc.setFontSize(11);
      let dateText = "";
      if (activeTab === "today") {
        dateText = `Date: ${new Date().toLocaleDateString()}`;
      } else if (activeTab === "daywise") {
        dateText = `Date: ${selectedDate || new Date().toISOString().split('T')[0]}`;
      } else if (activeTab === "summary") {
        dateText = `Period: ${startDate || "N/A"} to ${endDate || "N/A"}`;
      }
      doc.text(dateText, 14, 30);

      // Prepare table data based on active tab
      let tableData, headers;

      if (activeTab === "summary") {
        // Summary report shows employee, pin, and total hours
        headers = [['Employee ID', 'Name', 'Total Hours Worked']];
        tableData = filteredData.map(record => [
          record.Pin || "",
          record.Name || "",
          record.TimeWorked || record.hoursWorked || "0:00"
        ]);
      } else {
        // Today and daywise reports show detailed check-in/out info
        headers = [['Employee ID', 'Name', 'Check-in', 'Check-out', 'Time Worked', 'Type']];
        tableData = filteredData.map(record => [
          record.Pin || "",
          record.Name || "",
          record.formattedCheckIn || convertToAmPm(record.CheckInTime) || "--",
          record.formattedCheckOut || convertToAmPm(record.CheckOutTime) || "--",
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
        filename = `report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (activeTab === "daywise") {
        filename = `report_${selectedDate}.pdf`;
      } else {
        filename = `report_${startDate}_to_${endDate}.pdf`;
      }

      doc.save(filename);
      showToast("PDF exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast("Failed to generate PDF", "error");
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
    setCheckoutDisabled(true);
    setAddButtonDisabled(true);
  };

  const handleCheckinTimeChange = (value) => {
    setNewEntry({ ...newEntry, CheckInTime: value });
    if (value) {
      setCheckoutDisabled(false);
      setAddButtonDisabled(false);
    } else {
      setCheckoutDisabled(true);
      setAddButtonDisabled(true);
    }
  };

  const loadEmployeeList = useCallback(async () => {
    try {
      const data = await fetchEmployeeData(companyId);
      setEmployeeList(data);
    } catch (error) {
      console.error("Error loading employees:", error);
      showToast("Failed to load employees", "error");
    }
  }, [companyId]);

  const handleSaveEntry = async () => {
    // Validation
    if (!newEntry.EmployeeID || !newEntry.Type || !newEntry.Date || !newEntry.CheckInTime) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const selectedEmployee = employeeList.find(emp => emp.pin === newEntry.EmployeeID);
    if (!selectedEmployee) {
      showToast("Selected employee not found", "error");
      return;
    }

    setLoading(true);
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
      await createDailyReportEntry(entryData);

      // Refresh the current view to show the new entry
      if (activeTab === "today" && currentDate) {
        await viewCurrentDateReport(currentDate);
      } else if (activeTab === "daywise" && selectedDate) {
        await viewDatewiseReport(selectedDate);
      }

      showToast("Entry saved successfully!");
      closeModal();
    } catch (error) {
      console.error("Error saving entry:", error);
      showToast("Failed to save entry. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadDevices();
      loadEmployeeList();
      setCurrentDate(getTodayDate());
    }
  }, [companyId, loadDevices, loadEmployeeList]);

  useEffect(() => {
    // Clear selected dates when switching tabs
    if (activeTab === "summary") {
      // Don't clear dates or loaded flag - preserve data when switching back to summary tab
      // User can manually clear by changing dates if needed
    } else if (activeTab === "salaried") {
      // For Salaried Report, clear everything and wait for user to click Load Report
      setReportData([]);
      setFilteredData([]);
      setSalariedReportData([]);
    } else if (activeTab === "today") {
      // For Today's Report, clear and load data
      setReportData([]);
      setFilteredData([]);
      setEmployees([]);
      setSalariedReportData([]);
      if (currentDate) {
        viewCurrentDateReport(currentDate);
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
      viewDatewiseReport(selectedDate);
    }
  }, [activeTab, selectedDate]); // Run when either activeTab or selectedDate changes

  // Separate effect for handling current date changes in today tab
  useEffect(() => {
    if (activeTab === "today" && currentDate) {
      viewCurrentDateReport(currentDate);
    }
  }, [currentDate]); // Only run when currentDate changes

  // Separate effect for handling date changes in summary tab
  useEffect(() => {
    if (activeTab === "summary" && startDate && endDate && dateRangeReportLoaded) {
      // Auto-reload when dates change after initial load
      loadSummaryReport();
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
  }, [reportData, tableData, searchQuery, sortConfig, activeTab]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:right-4 sm:left-auto z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button variant="outline" onClick={downloadCSV} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button variant="outline" onClick={downloadPDF} className="flex items-center justify-center gap-2 w-full sm:w-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Check-in employee</p>
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
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Currently working employee</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.filter(r => r.CheckInTime && !r.CheckOutTime).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                { key: "salaried", label: "Salaried Report", icon: TrendingUp }
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
                    {key === "today" ? "Today" : key === "daywise" ? "Daily" : "Summary"}
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
                      { key: 'name', direction: 'asc', label: 'Sort By Name A-Z', icon: ArrowUp },
                      { key: 'name', direction: 'desc', label: 'Sort By Name Z-A', icon: ArrowDown },
                      { key: 'pin', direction: 'asc', label: 'Sort By PIN A-Z', icon: ArrowUp },
                      { key: 'pin', direction: 'desc', label: 'Sort By PIN Z-A', icon: ArrowDown },
                     
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
                    <Table className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
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
                  <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#02066F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#030974] transition-colors w-full sm:w-auto text-sm sm:text-base"
                  >
                    Add Entry
                  </button>
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
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredData.map((record, index) => (
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
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Time Worked</span>
                                <span className="font-medium text-foreground">{record.TimeWorked}</span>
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
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Employee ID</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Name</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Check-in Time</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Check-out Time</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Type</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredData.map((record, index) => {
                            const rowKey = `${record.Pin}-${record.CheckInTime}`;
                            const hasCheckout = record.CheckOutTime;
                            const selectedTime = checkoutTimes[rowKey];

                            // Get minimum time (check-in time) for time picker
                            const checkInTime = new Date(record.CheckInTime);
                            const minTime = `${String(checkInTime.getHours()).padStart(2, '0')}:${String(checkInTime.getMinutes() + 1).padStart(2, '0')}`;

                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-xs sm:text-sm">{record.Pin}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">{record.Name}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">{formatTime(record.CheckInTime)}</td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                                  {hasCheckout ? (
                                    formatTime(record.CheckOutTime)
                                  ) : (
                                    <input
                                      type="time"
                                      value={selectedTime || ''}
                                      onChange={(e) => handleCheckoutTimeChange(rowKey, e.target.value)}
                                      min={minTime}
                                      className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  )}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {record.Type}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                  <Button
                                    onClick={() => handleCheckout(record)}
                                    disabled={hasCheckout || !selectedTime}
                                    size="sm"
                                    className={`text-xs ${hasCheckout || !selectedTime ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                  >
                                    {hasCheckout ? 'Checked Out' : 'Check Out'}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Day-wise Report Section */}
        {activeTab === "daywise" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Day-wise Report - {selectedDate}
                </CardTitle>
                <CardDescription>
                  Employee check-in and check-out times for the selected date
                </CardDescription>
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
                      {filteredData.map((record, index) => (
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
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Employee</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">PIN</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Check In</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Check Out</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Type</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Status</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm">Time Worked</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-center font-medium">{record.Name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{record.Pin}</td>
                              <td className="px-4 py-3 text-center">{formatTime(record.CheckInTime)}</td>
                              <td className="px-4 py-3 text-center">{formatTime(record.CheckOutTime)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {record.Type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(record)}</td>
                              <td className="px-4 py-3 text-center font-medium">{record.TimeWorked}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Date Range Report Section */}
        {activeTab === "summary" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Date Range Report</span>
                  <span className="sm:hidden">Range Report</span>
                </CardTitle>
                {startDate && endDate && (
                  <CardDescription className="text-sm">
                    Showing consolidated data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                  </CardDescription>
                )}
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead className="bg-[#02066F] text-white">
                        <tr>
                          <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Employee</th>
                          <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">PIN</th>
                          <th className="px-4 py-3 text-center font-semibold text-sm">Total Time Worked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.map((employee, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-center font-medium text-gray-900">{employee.Name}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{employee.Pin}</td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600">
                              {employee.TimeWorked || employee.hoursWorked || "0:00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salaried Report Section (Weekly/Biweekly/Monthly/Bimonthly) */}
        {activeTab === "salaried" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  {selectedReportType} Report
                </CardTitle>
                <CardDescription className="text-sm">
                  Select report type and view consolidated employee hours
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Report Type Selector Buttons */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Report Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Weekly', 'Biweekly', 'Monthly', 'Bimonthly'].map(type => (
                      <Button
                        key={type}
                        onClick={() => setSelectedReportType(type)}
                        variant={selectedReportType === type ? 'default' : 'outline'}
                        className={`${selectedReportType === type ? 'bg-[#02066F] hover:bg-[#030974] text-white' : 'bg-white hover:bg-gray-50'} text-sm`}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Conditional Date Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Year & Month - Hide for Biweekly */}
                  {selectedReportType !== 'Biweekly' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-sm font-medium">Year</Label>
                        <select
                          id="year"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className="w-full h-10 border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() - i;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="month" className="text-sm font-medium">Month</Label>
                        <select
                          id="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className="w-full h-10 border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December']
                            .map((month, idx) => (
                              <option key={idx} value={idx + 1}>{month}</option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Week Selector - Only for Weekly */}
                  {selectedReportType === 'Weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="week" className="text-sm font-medium">Week</Label>
                      <select
                        id="week"
                        value={selectedWeek !== null ? selectedWeek : ''}
                        onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                        className="w-full h-10 border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={availableWeeks.length === 0}
                      >
                        <option value="">Select Week</option>
                        {availableWeeks.map((week, idx) => (
                          <option key={idx} value={idx}>{week.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Half Selector - Only for Bimonthly */}
                  {selectedReportType === 'Bimonthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="half" className="text-sm font-medium">Period</Label>
                      <select
                        id="half"
                        value={selectedHalf}
                        onChange={(e) => setSelectedHalf(e.target.value)}
                        className="w-full h-10 border border-input bg-background text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="first">First Half (1-15)</option>
                        <option value="second">Second Half (16-End)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Load Report Button */}
                <Button
                  onClick={loadSalariedReport}
                  disabled={loading}
                  className="bg-[#02066F] hover:bg-[#030974] text-white"
                >
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {loading ? 'Loading...' : 'Load Report'}
                </Button>

                {/* Report Table */}
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">No records found.</p>
                    <p className="text-gray-400 text-xs mt-2">Select options above and click "Load Report" to view data.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead className="bg-[#02066F] text-white">
                        <tr>
                          <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Employee</th>
                          <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">PIN</th>
                          <th className="px-4 py-3 text-center font-semibold text-sm">Total Time Worked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.map((employee, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-center font-medium text-gray-900">{employee.Name}</td>
                            <td className="px-4 py-3 text-center text-gray-600">{employee.Pin}</td>
                            <td className="px-4 py-3 text-center font-semibold text-blue-600">
                              {employee.TimeWorked || employee.hoursWorked || "0:00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] mx-4">
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
                  onChange={(e) => setNewEntry({ ...newEntry, EmployeeID: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
                >
                  <option value="">Select Employee</option>
                  {(employeeList || []).map((employee) => (
                    <option key={employee.pin} value={employee.pin}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
                {formErrors.employee && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.employee}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                <select
                  id="type"
                  value={newEntry.Type}
                  onChange={(e) => setNewEntry({ ...newEntry, Type: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="Belt">Belt</option>
                  <option value="Path">Path</option>
                  <option value="Camp">Camp</option>
                  <option value="External">Off site</option>
                  <option value="Trial">Trial</option>
                  <option value="Reception">Reception</option>
                </select>
                {formErrors.type && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.Date}
                  onChange={(e) => setNewEntry({ ...newEntry, Date: e.target.value })}
                  max={getTodayDate()}
                  className="text-sm"
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkinTime" className="text-sm font-medium">Check-in Time</Label>
                  <Input
                    id="checkinTime"
                    type="time"
                    value={newEntry.CheckInTime}
                    onChange={(e) => handleCheckinTimeChange(e.target.value)}
                    className="text-sm"
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
                    onChange={(e) => setNewEntry({ ...newEntry, CheckOutTime: e.target.value })}
                    disabled={checkoutDisabled}
                    className="text-sm disabled:bg-muted"
                  />
                  {formErrors.checkoutTime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.checkoutTime}</p>
                  )}
                </div>
              </div>

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
                  disabled={addButtonDisabled || loading}
                  className="flex-1 order-1 sm:order-2"
                >
                  {loading ? (
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

      <Footer />
    </div>
  );
};

export default Reports;