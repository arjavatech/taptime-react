import React, { useState, useEffect, useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer";
import { fetchEmployeeData, fetchDevices, fetchDailyReport, fetchDateRangeReport } from "../../utils/apiUtils";

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
  const companyId = localStorage.getItem("companyID");

  // Today's report specific
  const [tableData, setTableData] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

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
      viewCurrentDateReport();
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

  const viewCurrentDateReport = async () => {
    try {
      const arr = await fetchDailyReport(companyId, currentDate);

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

      if (adminType !== "Owner") {
        processedData = processedData.filter(item => item.DeviceID === deviceID);
      } else if (selectedDevice && selectedDevice.DeviceID) {
        processedData = processedData.filter(item => item.DeviceID === selectedDevice.DeviceID);
      }

      setTableData(processedData);
    } catch (err) {
      console.error(err);
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

      // Apply device filtering only if needed
      if (adminType !== "Owner" && deviceID) {
        processedData = processedData.filter(item => item.DeviceID === deviceID);
      } else if (adminType === "Owner" && selectedDevice && selectedDevice.deviceId) {
        processedData = processedData.filter(item => item.DeviceID === selectedDevice.deviceId);
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

      const today = new Date().toISOString().split("T")[0];
      setCurrentDate(today);
      setSelectedDate(today);

      await loadDevices();
      
      // Load initial daywise report for today
      if (activeTab === "daywise") {
        await viewDatewiseReport(today);
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
                    {row.CheckOutTime ? formatToAmPm(new Date(row.CheckOutTime)) : ""}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed" disabled>
                      Check-out
                    </button>
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
      <Header2 />
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
                      viewCurrentDateReport();
                    }}
                    className={`px-4 py-2 font-semibold rounded-full ${
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
                    className={`px-4 py-2 font-semibold rounded-full ${
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
                      className={`px-4 py-2 font-semibold rounded-full ${
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
      </div>
      <Footer2 />
    </div>
  );
};

export default Reports;