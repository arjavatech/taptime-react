import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { fetchEmployeeData, fetchDevices, fetchDailyReport, fetchDateRangeReport, createDailyReportEntry, updateDailyReportEntry } from "../api.js";
import { getLocalDateString, getLocalDateTimeString } from "../utils";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  
  // Common state
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [adminType, setAdminType] = useState("");
  const [deviceID, setDeviceID] = useState("");
  const [availableFrequencies, setAvailableFrequencies] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const [selectedDate, setSelectedDate] = useState("");

  // Salaried report specific
  const [startDateHeader, setStartDateHeader] = useState("");
  const [endDateHeader, setEndDateHeader] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [employees, setEmployees] = useState([]);

  const loadFrequenciesSync = () => {
    const savedFrequencies = localStorage.getItem("reportType");
    return savedFrequencies ? savedFrequencies.split(",").filter(f => f.trim() !== "") : [];
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

  const viewCurrentDateReport = async (dateToUse = currentDate) => {
    try {
      const arr = await fetchDailyReport(companyId, dateToUse);

      if (!arr.length) {
        setTableData([]);
        return;
      }

      let processedData = arr.map(row => ({
        ...row,
        checkInTimeFormatted: formatToAmPm(new Date(row.CheckInTime)),
        needsCheckout: !row.CheckOutTime,
        checkoutTime: "",
      }));

      // Only apply device filter if a device is explicitly selected
      if (selectedDevice && selectedDevice.DeviceID) {
        processedData = processedData.filter(item => item.DeviceID === selectedDevice.DeviceID);
      }

      setTableData(processedData);
    } catch (err) {
      console.error(err);
    }
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
      alert("Please enter a checkout time");
      return;
    }

    // Extract date from check-in time (use local time, not UTC)
    const checkinDateObj = new Date(row.CheckInTime);
    const checkInDateString = getLocalDateString(checkinDateObj);

    // Use check-in date with checkout time (time input already includes seconds)
    const checkoutDateTime = `${checkInDateString}T${checkoutTime}`;
    const checkinDateTime = row.CheckInTime;

    // Use check-in date for the Date field in updateData
    const today = checkInDateString;

    // Validate that checkout time is after checkin time
    const checkinDate = new Date(checkinDateTime);
    const checkoutDate = new Date(checkoutDateTime);

    if (checkoutDate <= checkinDate) {
      alert("Checkout time must be greater than check-in time");
      return;
    }

    // Calculate time worked
    const timeWorked = calculateTimeWorked(checkinDateTime, checkoutDateTime);

    setLoading(true);
    try {
      const updateData = {
        CID: companyId,
        EmpID: row.EmpID,
        Pin: row.Pin,
        Name: row.Name,
        Date: today,
        TypeID: row.Type || row.TypeID,
        CheckInSnap: row.CheckInSnap || null,
        CheckInTime: checkinDateTime,
        CheckOutSnap: row.CheckOutSnap || null,
        CheckOutTime: getLocalDateTimeString(checkoutDate),
        TimeWorked: timeWorked,
        LastModifiedBy: "Admin"
      };

      await updateDailyReportEntry(row.EmpID, companyId, row.CheckInTime, updateData);

      // Clear the checkout time for this row
      setCheckoutTimes(prev => {
        const updated = { ...prev };
        delete updated[rowKey];
        return updated;
      });

      // Refresh the data
      await viewCurrentDateReport(currentDate);
    } catch (error) {
      console.error("Error updating checkout:", error);
      alert("Failed to update checkout time. Please try again.");
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
      console.log(`Fetching daily report for date: ${dateValue}, companyId: ${companyId}`);
      const data = await fetchDailyReport(companyId, dateValue);
      console.log('API Response:', data);

      const records = Array.isArray(data) ? data : [];
      let processedData = records.map(item => ({
        ...item,
        formattedCheckIn: item.CheckInTime ? convertToAmPm(item.CheckInTime) : "--",
        formattedCheckOut: item.CheckOutTime ? convertToAmPm(item.CheckOutTime) : "--",
        timeWorked: item.TimeWorked || (item.CheckInTime && item.CheckOutTime
          ? calculateTimeWorked(item.CheckInTime, item.CheckOutTime) : "--"),
      }));

      // Only apply device filter if a device is explicitly selected
      if (selectedDevice && selectedDevice.DeviceID) {
        processedData = processedData.filter(item => item.DeviceID === selectedDevice.DeviceID);
      }

      console.log('Processed data:', processedData);
      setReportData(processedData);
      setFilteredData([...processedData]);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Salaried Report Functions
  const calculateTotalTimeWorked = (data) => {
    const employeeTimes = {};
    data.forEach(entry => {
      const { Name, Pin, CheckInTime, CheckOutTime } = entry;
      if (!Name || !Pin || !CheckInTime) return;

      const checkInDate = new Date(CheckInTime);
      const checkOutDate = CheckOutTime ? new Date(CheckOutTime) : new Date();
      const timeDifferenceInMinutes = Math.floor((Number(checkOutDate) - Number(checkInDate)) / 1000 / 60);

      if (!employeeTimes[Pin]) {
        employeeTimes[Pin] = { name: Name, totalMinutes: 0 };
      }
      employeeTimes[Pin].totalMinutes += timeDifferenceInMinutes;
    });

    for (const [pin, details] of Object.entries(employeeTimes)) {
      const hours = Math.floor(details.totalMinutes / 60);
      const mins = details.totalMinutes % 60;
      details.totalHoursWorked = `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return employeeTimes;
  };

  const loadReportTable = async (startVal, endVal) => {
    setLoading(true);
    setStartDateHeader(startVal);
    setEndDateHeader(endVal);

    try {
      const data = await fetchDateRangeReport(companyId, startVal, endVal);

      if (Array.isArray(data)) {
        let filteredData = data;
        if (adminType !== "Owner") {
          filteredData = data.filter(item => item.DeviceID === deviceID);
        } else if (selectedDevice && selectedDevice.DeviceID) {
          filteredData = data.filter(item => item.DeviceID === selectedDevice.DeviceID);
        }

        const employeeData = Object.entries(calculateTotalTimeWorked(filteredData)).map(([pin, empData]) => ({
          pin,
          name: empData.name,
          hoursWorked: empData.totalHoursWorked || "0:00",
        }));

        setEmployees(employeeData);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching report data", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Common Functions
  const filterData = () => {
    if (!searchQuery) {
      if (activeTab === "daywise") {
        setFilteredData([...reportData]);
      }
    } else {
      const query = searchQuery.toLowerCase();
      if (activeTab === "daywise") {
        const filtered = reportData.filter(item =>
          item.Name?.toLowerCase().includes(query) || item.Pin?.toLowerCase().includes(query)
        );
        setFilteredData(filtered);
      }
    }
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    if (activeTab === "daywise") {
      const sorted = [...filteredData].sort((a, b) => {
        const valA = a[key] ?? "";
        const valB = b[key] ?? "";
        if (!isNaN(Number(valA))) {
          return direction === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }
        return direction === "asc" 
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
      setFilteredData(sorted);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let tableColumn, tableRows, title;

    if (activeTab === "") {
      title = `Today's Report - ${currentDate}`;
      tableColumn = ["Employee ID", "Name", "Check-in Time", "Check-out Time"];
      tableRows = tableData.map(item => [
        item.Pin || "--",
        item.Name?.split(" ")[0] || "--",
        item.checkInTimeFormatted || "--",
        item.CheckOutTime ? formatToAmPm(new Date(item.CheckOutTime)) : "--"
      ]);
    } else if (activeTab === "daywise") {
      title = `Day-Wise Report - ${selectedDate}`;
      tableColumn = ["Employee Name", "Employee ID", "Check-in Time", "Check-out Time", "Time Worked Hours(HH:MM)"];
      tableRows = filteredData.map(item => [
        item.Name?.split(" ")[0] || "",
        item.Pin || "--",
        item.formattedCheckIn || "--",
        item.formattedCheckOut || "--",
        item.timeWorked || "--",
      ]);
    } else if (activeTab === "salaried") {
      title = `${selectedFrequency} Report (${startDateHeader} to ${endDateHeader})`;
      tableColumn = ["Name", "Pin", "Time Worked Hours (HH:MM)"];
      tableRows = employees.map(emp => [
        emp.name || "--",
        emp.pin || "--",
        emp.hoursWorked || "--",
      ]);
    }

    doc.text(title, 14, 10);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      headStyles: { fillColor: [2, 6, 111], textColor: 255, fontSize: 10, fontStyle: "bold" },
      styles: { fontSize: 10 },
      theme: "grid",
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
  };

  const paginatedData = () => {
    const start = (currentPage - 1) * itemsPerPage;
    if (activeTab === "daywise") {
      return filteredData.slice(start, start + itemsPerPage);
    } else if (activeTab === "salaried") {
      const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.pin.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return filteredEmployees.slice(start, start + itemsPerPage);
    }
    return [];
  };

  const totalPages = () => {
    if (activeTab === "daywise") {
      return Math.ceil(filteredData.length / itemsPerPage);
    } else if (activeTab === "salaried") {
      const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.pin.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return Math.ceil(filteredEmployees.length / itemsPerPage);
    }
    return 0;
  };

  // Modal Handlers
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

  const validateForm = () => {
    const errors = {
      employee: "",
      type: "",
      date: "",
      checkinTime: "",
      checkoutTime: ""
    };
    let isValid = true;

    if (!newEntry.EmployeeID) {
      errors.employee = "Employee selection is required";
      isValid = false;
    }
    if (!newEntry.Type) {
      errors.type = "Type selection is required";
      isValid = false;
    }
    if (!newEntry.Date) {
      errors.date = "Date is required";
      isValid = false;
    }
    if (!newEntry.CheckInTime) {
      errors.checkinTime = "Check-in time is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCheckinTimeChange = (value) => {
    setNewEntry({ ...newEntry, CheckInTime: value });
    // Enable checkout field and add button when check-in time is entered
    if (value) {
      setCheckoutDisabled(false);
      setAddButtonDisabled(false);
    } else {
      setCheckoutDisabled(true);
      setAddButtonDisabled(true);
    }
  };

  const loadEmployeeList = async () => {
    try {
      const employeeData = await fetchEmployeeData(companyId);
      setEmployeeList(employeeData || []);
    } catch (error) {
      console.error("Error loading employee list:", error);
      setEmployeeList([]);
    }
  };

  // Load employee list when modal opens
  useEffect(() => {
    if (showModal) {
      loadEmployeeList();
      // Set max date to today (use local time, not UTC)
      const today = getLocalDateString();
      document.getElementById('datePicker')?.setAttribute('max', today);
    }
  }, [showModal]);

  const handleSaveEntry = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Find selected employee
      const selectedEmployee = employeeList.find(emp => emp.Pin === newEntry.EmployeeID);

      // Combine date and time for check-in
      const checkinDateTime = `${newEntry.Date}T${newEntry.CheckInTime}`;
      const checkoutDateTime = newEntry.CheckOutTime ? `${newEntry.Date}T${newEntry.CheckOutTime}` : null;

      // Prepare API payload
      const entryData = {
        Pin: newEntry.EmployeeID,
        EmpID: selectedEmployee?.EmpID || "",
        Name: selectedEmployee ? `${selectedEmployee.FName} ${selectedEmployee.LName}` : "",
        TypeID: newEntry.Type,
        DeviceID: selectedDevice?.DeviceID || deviceID,
        CID: companyId,
        CheckInTime: getLocalDateTimeString(new Date(checkinDateTime)),
        CheckOutTime: checkoutDateTime ? getLocalDateTimeString(new Date(checkoutDateTime)) : null,
        TimeWorked: checkoutDateTime ? calculateTimeDifference(checkinDateTime, checkoutDateTime) : "0:00",
        LastModifiedBy: "Admin"
      };

      // Call API to create entry
      await createDailyReportEntry(entryData);

      // Refresh report data after successful creation
      if (activeTab === "today") {
        await viewCurrentDateReport();
      } else if (activeTab === "daywise" && selectedDate) {
        await viewDatewiseReport(selectedDate);
      }

      closeModal();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeDifference = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffInMinutes = Math.floor((end - start) / 1000 / 60);
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      const adminTypeValue = localStorage.getItem("adminType") || "";
      const deviceIDValue = localStorage.getItem("DeviceID") || "";
      const frequencies = loadFrequenciesSync();

      setAdminType(adminTypeValue);
      setDeviceID(deviceIDValue);
      setAvailableFrequencies(frequencies);
      setSelectedFrequency(frequencies[0] || "");

      const today = getLocalDateString();
      setCurrentDate(today);
      setSelectedDate(today);

      await loadDevices();

      // Load initial report data based on active tab
      if (activeTab === "daywise") {
        await viewDatewiseReport(today);
      } else if (activeTab === "today") {
        await viewCurrentDateReport(today);
      }

      setLoading(false);
    };

    initializeComponent();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "daywise") {
      filterData();
    }
  }, [searchQuery, reportData, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const renderTodayReport = () => (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-300">
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Current Day Report</h2>
          <div className="flex justify-between items-center mt-4">
            <h3 className="text-lg font-semibold">Date: {currentDate}</h3>
            <button
              className="bg-white border border-blue-900 text-blue-900 px-6 py-2 rounded-md font-semibold cursor-pointer"
              onClick={() => setShowModal(true)}
            >
              Add Entry
            </button>
          </div>
        </div>
        
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-[#02066F] text-white">
            <tr>
              <th className="px-6 py-3 text-center font-bold border-r">Employee ID</th>
              <th className="px-6 py-3 text-center font-bold border-r">Name</th>
              <th className="px-6 py-3 text-center font-bold border-r">Check-in Time</th>
              <th className="px-6 py-3 text-center font-bold border-r">Check-out Time</th>
              <th className="px-6 py-3 text-center font-bold border-r">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">No Records Found</td>
              </tr>
            ) : (
              tableData.map((row, index) => (
                <tr key={row.Pin || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-center">{row.Pin}</td>
                  <td className="px-6 py-4 text-center">{row.Name?.split(" ")[0]}</td>
                  <td className="px-6 py-4 text-center">{row.checkInTimeFormatted}</td>
                  <td className="px-6 py-4 text-center">
                    {row.CheckOutTime ? (
                      formatToAmPm(new Date(row.CheckOutTime))
                    ) : (
                      <div className="flex justify-center items-center">
                        <input
                          type="time"
                          step="1"
                          className="border border-[#02066F] rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#02066F]"
                          value={checkoutTimes[`${row.Pin}-${row.CheckInTime}`] || ""}
                          onChange={(e) => handleCheckoutTimeChange(`${row.Pin}-${row.CheckInTime}`, e.target.value)}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.CheckOutTime ? (
                      <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed" disabled>
                        Check-out
                      </button>
                    ) : (
                      <button
                        className={`px-4 py-2 rounded font-semibold ${
                          checkoutTimes[`${row.Pin}-${row.CheckInTime}`]
                            ? "bg-[#02066F] text-white cursor-pointer hover:bg-blue-800"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                        disabled={!checkoutTimes[`${row.Pin}-${row.CheckInTime}`]}
                        onClick={() => handleCheckout(row)}
                      >
                        Check-out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDayWiseReport = () => (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-300">
      <div className="p-4 sm:p-6 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value;
              console.log('Date selected:', newDate);
              setSelectedDate(newDate);
              if (newDate) {
                viewDatewiseReport(newDate);
              }
            }}
            className="border bg-white border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 shadow"
          />
          <button onClick={downloadPDF} className="text-[#02066F] hover:text-black px-4 py-2 rounded-lg transition-colors cursor-pointer border border-[#02066F]">
            Download PDF
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-base font-semibold text-gray-700">Show</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-400 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#02066F]"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-base font-semibold text-gray-700">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-base font-semibold text-gray-800">Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
            />
          </div>
        </div>

        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-[#02066F] text-white">
            <tr>
              <th className="px-6 py-3 text-center font-bold border-r cursor-pointer" onClick={() => requestSort("Name")}>
                Employee Name {sortConfig.key === "Name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑↓"}
              </th>
              <th className="px-6 py-3 text-center font-bold border-r cursor-pointer" onClick={() => requestSort("Pin")}>
                Employee ID {sortConfig.key === "Pin" ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↑↓"}
              </th>
              <th className="px-6 py-3 text-center font-bold border-r">Check-in Time</th>
              <th className="px-6 py-3 text-center font-bold border-r">Check-out Time</th>
              <th className="px-6 py-3 text-center font-bold border-r">Time Worked Hours (HH:MM)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                  {reportData.length === 0 ? "No records found for selected date" : "No matching records found"}
                </td>
              </tr>
            ) : (
              paginatedData().map((item, index) => (
                <tr key={item.Pin + "-" + index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 border-r">{item.Name}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 border-r">{item.Pin}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 border-r">{item.formattedCheckIn}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 border-r">{item.formattedCheckOut}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900 border-r">{item.timeWorked}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-base font-semibold text-gray-700">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages(), currentPage + 1))}
              disabled={currentPage === totalPages()}
              className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalariedReport = () => {
    const filteredEmployees = employees.filter(emp =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.pin.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-300">
        <div className="p-4 sm:p-6 overflow-x-auto">
          <h1 className="text-2xl font-bold text-center mb-8">{selectedFrequency} Report</h1>
          
          <div className="flex justify-between mb-6 p-4 rounded-lg">
            <div>
              <span className="text-lg font-semibold text-gray-800">Start Date: </span>
              <span className="text-lg font-semibold text-gray-800">{startDateHeader}</span>
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-800">End Date: </span>
              <span className="text-lg font-semibold text-gray-800">{endDateHeader}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row justify-evenly items-center mb-6">
            <button onClick={downloadPDF} className="text-[#02066F] hover:text-black px-4 py-2 rounded-lg transition-colors cursor-pointer border-1 border-[#02066F]">
              Download PDF
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-base font-semibold text-gray-700">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-400 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#02066F]"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-base font-semibold text-gray-700">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-base font-semibold text-gray-800">Search:</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
              />
            </div>
          </div>

          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-[#02066F] text-white">
              <tr>
                <th className="px-6 py-3 text-center font-bold border-r">Name</th>
                <th className="px-6 py-3 text-center font-bold border-r">Pin</th>
                <th className="px-6 py-3 text-center font-bold border-r">Total Worked Hours (HH:MM)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-gray-500">No matching records found</td>
                </tr>
              ) : (
                paginatedData().map((employee, index) => (
                  <tr key={index} className="hover:bg-gray-50 text-center">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 border-r">{employee.name}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 border-r">{employee.pin}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900 border-r">{employee.hoursWorked}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-base font-semibold text-gray-700">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} results
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages(), currentPage + 1))}
                disabled={currentPage === totalPages()}
                className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      <div className="bg-gray-100 flex-1">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        <div className="pt-16">
          {/* Navigation Tabs */}
          <nav className="bg-white shadow">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-end items-center h-auto md:h-16 py-4 md:py-0">
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 text-center">
                  <button
                    onClick={() => {
                      setActiveTab("today");
                      const today = new Date().toISOString().split("T")[0];
                      setCurrentDate(today);
                      viewCurrentDateReport(today);
                    }}
                    className={`px-4 py-2 font-semibold rounded-full cursor-pointer ${
                      activeTab === "today" ? "bg-[#02066F] text-white" : "text-[#02066F]"
                    }`}
                  >
                    Today's Report
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("daywise");
                      const dateToUse = selectedDate || new Date().toISOString().split("T")[0];
                      setSelectedDate(dateToUse);
                      viewDatewiseReport(dateToUse);
                    }}
                    className={`px-4 py-2 font-semibold rounded-full cursor-pointer ${
                      activeTab === "daywise" ? "bg-[#02066F] text-white" : "text-[#02066F]"
                    }`}
                  >
                    Day Wise Report
                  </button>
                  {availableFrequencies.map((frequency) => (
                    <button
                      key={frequency}
                      onClick={() => {
                        setActiveTab("salaried");
                        setSelectedFrequency(frequency);
                        // Initialize salaried report data
                      }}
                      className={`px-4 py-2 font-semibold rounded-full cursor-pointer ${
                        activeTab === "salaried" && selectedFrequency === frequency ? "bg-[#02066F] text-white" : "text-[#02066F]"
                      }`}
                    >
                      {frequency} Report
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Device Dropdown */}
          {adminType === "Owner" && (
            <div className="max-w-5xl mx-auto mt-5 px-4">
              <div className="flex justify-center">
                <div className="relative inline-block text-left w-64">
                  <button
                    type="button"
                    className="inline-flex w-full justify-between items-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#02066F] border border-[#02066F] shadow-sm hover:bg-[#02066F] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02066F] transition"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span>{selectedDevice ? selectedDevice.DeviceName : "Select Device Name"}</span>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-white transition" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-full origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {devices.length > 0 ? (
                          devices.map((device) => (
                            <button
                              key={device.DeviceID}
                              type="button"
                              className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-[#02066F] hover:text-white transition"
                              onClick={() => {
                                handleDeviceSelection(device);
                                setDropdownOpen(false);
                              }}
                            >
                              {device.DeviceName}
                            </button>
                          ))
                        ) : (
                          <div className="text-gray-500 block px-4 py-2 text-sm">No devices available</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Report Content */}
          <div className="py-8">
            {activeTab === "today" && renderTodayReport()}
            {activeTab === "daywise" && renderDayWiseReport()}
            {activeTab === "salaried" && renderSalariedReport()}
          </div>
        </div>

        {/* Add Entry Modal */}
        {showModal && (
          <div style={{ zIndex: 4000 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              {/* Modal Header */}
              <div className="bg-[#02066F] text-white p-4 flex justify-between items-center rounded-t-lg">
                <h5 className="text-xl font-semibold w-full text-center">Add entry</h5>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2 leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4">
                <form id="entryForm">
                  {/* Employee Dropdown */}
                  <select
                    id="dynamicDropdown"
                    value={newEntry.EmployeeID}
                    onChange={(e) => setNewEntry({ ...newEntry, EmployeeID: e.target.value })}
                    className="w-full p-2 mb-3 border border-[#02066F] rounded-lg text-[#02066F] font-bold focus:outline-none focus:ring-2 focus:ring-[#02066F]"
                  >
                    <option value="">Select Employee</option>
                    {employeeList.map((employee) => (
                      <option key={employee.Pin} value={employee.Pin}>
                        {employee.FName} {employee.LName}
                      </option>
                    ))}
                  </select>
                  {formErrors.employee && (
                    <div className="text-red-500 text-sm text-center mb-3">{formErrors.employee}</div>
                  )}

                  {/* Type Dropdown */}
                  <select
                    id="type"
                    value={newEntry.Type}
                    onChange={(e) => setNewEntry({ ...newEntry, Type: e.target.value })}
                    className="w-full p-2 mb-3 border border-[#02066F] rounded-lg text-[#02066F] font-bold focus:outline-none focus:ring-2 focus:ring-[#02066F]"
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
                    <div className="text-red-500 text-sm text-center mb-3">{formErrors.type}</div>
                  )}

                  {/* Date Picker */}
                  <input
                    type="date"
                    id="datePicker"
                    value={newEntry.Date}
                    onChange={(e) => setNewEntry({ ...newEntry, Date: e.target.value })}
                    placeholder="Check-in Date (yyyy-mm-dd):"
                    max=""
                    className="w-full p-2 mb-3 border border-[#02066F] rounded-lg text-[#02066F] font-bold focus:outline-none focus:ring-2 focus:ring-[#02066F]"
                    required
                  />
                  {formErrors.date && (
                    <div className="text-red-500 text-sm text-center mb-3">{formErrors.date}</div>
                  )}

                  {/* Check-in Time */}
                  <div className="relative mb-3">
                    <input
                      type="time"
                      id="checkinTime"
                      value={newEntry.CheckInTime}
                      onChange={(e) => handleCheckinTimeChange(e.target.value)}
                      className="w-full p-2 border border-[#02066F] rounded-lg text-[#02066F] font-bold focus:outline-none focus:ring-2 focus:ring-[#02066F]"
                      placeholder="Check-in Time:"
                      required
                    />
                    {formErrors.checkinTime && (
                      <div className="text-red-500 text-sm text-center mt-1">{formErrors.checkinTime}</div>
                    )}
                  </div>

                  {/* Check-out Time */}
                  <div className="relative mb-3">
                    <input
                      type="time"
                      id="checkoutTime"
                      value={newEntry.CheckOutTime}
                      onChange={(e) => setNewEntry({ ...newEntry, CheckOutTime: e.target.value })}
                      disabled={checkoutDisabled}
                      className="w-full p-2 border border-[#02066F] rounded-lg text-[#02066F] font-bold focus:outline-none focus:ring-2 focus:ring-[#02066F] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Check-out Time:"
                      required
                    />
                    {formErrors.checkoutTime && (
                      <div className="text-red-500 text-sm text-center mt-1">{formErrors.checkoutTime}</div>
                    )}
                  </div>

                  {/* Add Button */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSaveEntry}
                      disabled={addButtonDisabled}
                      className="bg-[#02066F] text-white px-6 py-2 rounded-md font-semibold mt-2 hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      id="AddEmployee"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer variant="authenticated" />
    </div>
  );
};

export default Reports;

