import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header2 from "./Navbar/Header2";
import Footer2 from "./Footer/Footer2";

const SalariedReport = () => {
  const [startDateHeader, setStartDateHeader] = useState("");
  const [endDateHeader, setEndDateHeader] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportTypeHeading, setReportTypeHeading] = useState("");
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isShowYearMonth, setIsShowYearMonth] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [adminType, setAdminType] = useState("");
  const [deviceID, setDeviceID] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [availableFrequencies, setAvailableFrequencies] = useState([]);
  const [currentReportType, setCurrentReportType] = useState("");
  const [reportData, setReportData] = useState([]);
  const [dateRanges, setDateRanges] = useState([]);
  const [showDownloadButtons, setShowDownloadButtons] = useState(false);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const [showHalfSelector, setShowHalfSelector] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [week, setWeek] = useState(1);
  const [half, setHalf] = useState("first");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const apiUrlBase =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/report/dateRangeReportGet";
  const deviceApiUrl =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/device";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const loadFrequenciesSync = () => {
    if (typeof window === "undefined") return [];
    const savedFrequencies = localStorage.getItem("reportType");
    if (savedFrequencies) {
      return savedFrequencies.split(",").filter((f) => f.trim() !== "");
    }
    return [];
  };

  const filteredEmployees = employees
    .filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.pin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.hoursWorked.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const fetchDevices = async () => {
    try {
      if (typeof window === "undefined") return;
      const cid = localStorage.getItem("companyID");
      const response = await fetch(`${deviceApiUrl}/getAll/${cid}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();
      const allDevices = Array.isArray(data) ? data : [data];
      const filteredDevices = allDevices.filter(
        (device) =>
          device.DeviceName &&
          device.DeviceName !== "Not Registered" &&
          device.DeviceName.trim() !== ""
      );

      setDevices(filteredDevices);
      if (filteredDevices.length > 0) {
        setSelectedDevice(filteredDevices[0]);
        console.log("Default selected device:", filteredDevices[0]);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
    console.log("Selected device for salaried reports:", device);

    if (dateRanges.length > 0 && selectedRangeIndex < dateRanges.length) {
      const currentRange = dateRanges[selectedRangeIndex];
      console.log(
        `Refreshing report for device ${device.DeviceName}, range: ${currentRange.startRange} to ${currentRange.endRange}`
      );
      loadReportTable(currentRange.startRange, currentRange.endRange);
    } else if (dateRanges.length > 0) {
      console.log(
        `Using first range for device ${device.DeviceName}, range: ${dateRanges[0].startRange} to ${dateRanges[0].endRange}`
      );
      setSelectedRangeIndex(0);
      loadReportTable(dateRanges[0].startRange, dateRanges[0].endRange);
    }
  };

  const switchFrequency = (frequency) => {
    setSelectedFrequency(frequency);
    setReportName(`${frequency} Report`);
    setReportTypeHeading(`${frequency} Report`);
    setCurrentReportType(frequency);

    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setWeek(1);
    setHalf("first");
    setSelectedRangeIndex(0);

    const newDateRanges = generateDateRanges();
    setDateRanges(newDateRanges);
    if (newDateRanges.length > 0) {
      loadReportTable(newDateRanges[0].startRange, newDateRanges[0].endRange);
    }

    toggleSelectors();
    updateDates();
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateTotalTimeWorked = (data) => {
    const employeeTimes = {};

    data.forEach((entry) => {
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

    for (const [pin, details] of Object.entries(employeeTimes)) {
      details.totalHoursWorked = minutesToTime(details.totalMinutes);
    }

    return employeeTimes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const downloadPDF = () => {
    if (filteredEmployees.length === 0) {
      alert("No data to download");
      return;
    }

    const doc = new jsPDF();
    const formattedDateRange = `${startDateHeader} to ${endDateHeader}`;

    doc.setFontSize(14);
    doc.text(`${reportTypeHeading} (${formattedDateRange})`, 14, 10);

    const tableColumn = ["Name", "Pin", "Time Worked Hours (HH:MM)"];
    const tableRows = filteredEmployees.map((emp) => [
      emp.name || "--",
      emp.pin || "--",
      emp.hoursWorked || "--",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      headStyles: {
        fillColor: [2, 6, 111],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
      theme: "grid",
    });

    const fileName = `${reportTypeHeading
      .toLowerCase()
      .replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  const downloadCSV = () => {
    if (filteredEmployees.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee ID",
      "Total Worked Hours (HH:MM)",
    ];
    const csvData = filteredEmployees.map((employee) => [
      employee.name,
      employee.pin,
      employee.hoursWorked,
    ]);

    let csvContent = headers.join(",") + "\n";
    csvData.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportName
      .toLowerCase()
      .replace(" ", "_")}_${startDateHeader}_to_${endDateHeader}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSelectors = () => {
    if (typeof window === "undefined") return;
    const reportType = localStorage.getItem("reportType");
    setShowWeekSelector(reportType === "Weekly");
    setShowHalfSelector(reportType === "Bimonthly");
  };

  const pad = (n) => {
    return n.toString().padStart(2, "0");
  };

  const formatShortDate = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${day} ${monthNames[date.getMonth()]}`;
  };

  const generateDateRanges = () => {
    const ranges = [];
    const reportType =
      currentReportType ||
      (typeof window !== "undefined" ? localStorage.getItem("reportType") : "");

    if (reportType === "Weekly" || selectedFrequency === "Weekly") {
      const monthWeekRanges = {
        1: [
          { start: 6, end: 12 },
          { start: 13, end: 19 },
          { start: 20, end: 26 },
        ],
        2: [
          { start: 3, end: 9 },
          { start: 10, end: 16 },
          { start: 17, end: 23 },
        ],
        3: [
          { start: 3, end: 9 },
          { start: 10, end: 16 },
          { start: 17, end: 23 },
          { start: 24, end: 30 },
        ],
        4: [
          { start: 7, end: 13 },
          { start: 14, end: 20 },
          { start: 21, end: 27 },
        ],
        5: [
          { start: 5, end: 11 },
          { start: 12, end: 18 },
          { start: 19, end: 25 },
        ],
        6: [
          { start: 2, end: 8 },
          { start: 9, end: 15 },
          { start: 16, end: 22 },
          { start: 23, end: 29 },
        ],
        7: [
          { start: 7, end: 13 },
          { start: 14, end: 20 },
          { start: 21, end: 27 },
        ],
        8: [
          { start: 4, end: 10 },
          { start: 11, end: 17 },
          { start: 18, end: 24 },
          { start: 25, end: 31 },
        ],
        9: [
          { start: 1, end: 7 },
          { start: 8, end: 14 },
          { start: 15, end: 21 },
          { start: 22, end: 28 },
        ],
        10: [
          { start: 6, end: 12 },
          { start: 13, end: 19 },
          { start: 20, end: 26 },
        ],
        11: [
          { start: 3, end: 9 },
          { start: 10, end: 16 },
          { start: 17, end: 23 },
          { start: 24, end: 30 },
        ],
        12: [
          { start: 1, end: 7 },
          { start: 8, end: 14 },
          { start: 15, end: 21 },
          { start: 22, end: 28 },
        ],
      };

      const daysInMonth = new Date(year, month, 0).getDate();
      const monthRanges = monthWeekRanges[month] || [];

      for (let i = 0; i < monthRanges.length; i++) {
        const { start, end } = monthRanges[i];
        const startDate = new Date(
          year,
          month - 1,
          Math.min(start, daysInMonth)
        );
        const endDate = new Date(year, month - 1, Math.min(end, daysInMonth));

        ranges.push({
          startRange: formatDate(startDate),
          endRange: formatDate(endDate),
          label: `${formatShortDate(startDate)} to ${formatShortDate(endDate)}`,
        });
      }
    }

    if (reportType === "Bimonthly" || selectedFrequency === "Bimonthly") {
      setIsShowYearMonth(true);
      const daysInMonth = new Date(year, month, 0).getDate();
      const mid = Math.ceil(daysInMonth / 2);

      ranges.push({
        startRange: `${year}-${pad(month)}-01`,
        endRange: `${year}-${pad(month)}-${pad(mid)}`,
        label: `Report 1: ${year}-${pad(month)}-01 - ${year}-${pad(
          month
        )}-${pad(mid)}`,
      });

      ranges.push({
        startRange: `${year}-${pad(month)}-${pad(mid + 1)}`,
        endRange: `${year}-${pad(month)}-${pad(daysInMonth)}`,
        label: `Report 2: ${year}-${pad(month)}-${pad(mid + 1)} - ${year}-${pad(
          month
        )}-${pad(daysInMonth)}`,
      });
    } else if (reportType === "Monthly" || selectedFrequency === "Monthly") {
      setIsShowYearMonth(true);
      const daysInMonth = new Date(year, month, 0).getDate();
      ranges.push({
        startRange: `${year}-${pad(month)}-01`,
        endRange: `${year}-${pad(month)}-${pad(daysInMonth)}`,
        label: "Full Month",
      });
    } else if (reportType === "Biweekly" || selectedFrequency === "Biweekly") {
      setIsShowYearMonth(false);
      const today = new Date();
      const dayOfWeek = today.getDay();

      const lastSunday = new Date(today);
      lastSunday.setDate(today.getDate() - dayOfWeek - 7);

      const currentDate = new Date();

      ranges.push({
        startRange: formatDate(lastSunday),
        endRange: formatDate(currentDate),
        label: `Last Sunday to Today: ${formatDate(lastSunday)} - ${formatDate(
          currentDate
        )}`,
      });
    }

    return ranges;
  };

  const loadReportTable = async (startVal, endVal) => {
    setIsLoading(true); 
    setStartDateHeader(startVal);
    setEndDateHeader(endVal);

    if (typeof window === "undefined") return;
    const cid = localStorage.getItem("companyID");
    const deviceId = selectedDevice ? selectedDevice.DeviceID : "all";

    console.log(
      `Making fresh API call for ${startVal} to ${endVal}, device: ${deviceId}`
    );

    try {
      const response = await fetch(
        `${apiUrlBase}/${cid}/${startVal}/${endVal}`
      );
      console.log(cid);
      const data = await response.json();

      if (Array.isArray(data)) {
        let filteredData = data;

        if (adminType !== "Owner") {
          filteredData = data.filter((item) => {
            console.log(
              `Record DeviceID: ${item.DeviceID}, matches: ${
                item.DeviceID === deviceID
              }`
            );
            return item.DeviceID === deviceID;
          });
        } else if (selectedDevice && selectedDevice.DeviceID) {
          filteredData = data.filter((item) => {
            console.log(
              `Record DeviceID: ${item.DeviceID}, matches: ${
                item.DeviceID === selectedDevice.DeviceID
              }`
            );
            return item.DeviceID === selectedDevice.DeviceID;
          });
        } else {
          console.log(`No device selected, showing all records:`, data.length);
        }

        setReportData(filteredData);
        console.log(
          `API call completed for ${startVal} to ${endVal}, device: ${deviceId}:`,
          filteredData.length,
          "records"
        );

        const employeeData = Object.entries(
          calculateTotalTimeWorked(filteredData)
        ).map(([pin, empData]) => {
          const { name, totalHoursWorked } = empData;
          return {
            pin,
            name,
            hoursWorked: totalHoursWorked || "0:00",
          };
        });

        setEmployees(employeeData);
        setShowDownloadButtons(filteredData.length > 0);
      } else {
        setReportData([]);
        setEmployees([]);
        setShowDownloadButtons(false);
      }
    } catch (error) {
      console.error("Error fetching report data", error);
      setReportData([]);
      setEmployees([]);
      setShowDownloadButtons(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDates = () => {
    if (typeof window === "undefined") return;
    const reportType = localStorage.getItem("reportType");
    const selectedRange = dateRanges[selectedRangeIndex];

    if (selectedRange) {
      setStartDateHeader(selectedRange.startRange);
      setEndDateHeader(selectedRange.endRange);
    } else if (reportType === "Monthly") {
      const daysInMonth = new Date(year, month, 0).getDate();
      setStartDateHeader(`${year}-${pad(month)}-01`);
      setEndDateHeader(`${year}-${pad(month)}-${pad(daysInMonth)}`);
    } else if (reportType === "Biweekly") {
      const today = new Date();
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(end.getDate() - 13);
      setStartDateHeader(formatDate(start));
      setEndDateHeader(formatDate(end));
    }
  };

  const viewDateRangewiseReport = () => {
    const newDateRanges = generateDateRanges();
    setDateRanges(newDateRanges);

    if (newDateRanges.length > 0) {
      loadReportTable(newDateRanges[0].startRange, newDateRanges[0].endRange);
    }
    updateDates();
  };

  const selectDateRange = (index) => {
    setSelectedRangeIndex(index);
    loadReportTable(dateRanges[index].startRange, dateRanges[index].endRange);
    updateDates();
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event) => {
    const dropdown = document.getElementById("device-dropdown-summary");
    const button = document.getElementById("device-menu-button-summary");

    if (
      dropdown &&
      !dropdown.contains(event.target) &&
      button &&
      !button.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  };

  const selectDevice = (device) => {
    handleDeviceSelection(device);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const initializeComponent = () => {
      const adminTypeValue = localStorage.getItem("adminType") || "";
      const deviceIDValue = localStorage.getItem("DeviceID") || "";
      const frequencies = loadFrequenciesSync();

      setAdminType(adminTypeValue);
      setDeviceID(deviceIDValue);
      setAvailableFrequencies(frequencies);

      const selectedValue = localStorage.getItem("reportType") ?? "";
      const exactSelectedValue = localStorage.getItem("selectedFrequency");
      setCurrentReportType(selectedValue);
      setReportName(`${selectedValue} Report`);
      setReportTypeHeading(`${exactSelectedValue} Report`);

      const selectedFreq = localStorage.getItem("selectedFrequency");
      const savedFrequencies = localStorage.getItem("reportType");

      if (savedFrequencies) {
        const freqArray = savedFrequencies.split(",");
        setAvailableFrequencies(freqArray);

        if (selectedFreq && freqArray.includes(selectedFreq)) {
          setSelectedFrequency(selectedFreq);
        } else {
          setSelectedFrequency(freqArray[0]);
        }

        const newDateRanges = generateDateRanges();
        setDateRanges(newDateRanges);
        if (newDateRanges.length > 0) {
          loadReportTable(
            newDateRanges[0].startRange,
            newDateRanges[0].endRange
          );
        }
      }

      toggleSelectors();
      viewDateRangewiseReport();
      fetchDevices();
    };

    initializeComponent();

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const newDateRanges = generateDateRanges();
    setDateRanges(newDateRanges);
  }, [year, month, week, half, selectedFrequency, currentReportType]);

  return (
    <>
    <Header2/>

      <div className="bg-gray-100">
        <div className="pt-16 md:pt-18 sm:pt-2">
          {isLoading && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
            </div>
          )}

          <nav className="bg-white shadow">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 py-4 md:py-0 justify-end">
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 text-center w-auto md:w-auto">
                  <a
                    href="/reportsummary"
                    className="px-4 py-2 text-[#02066F] font-semibold rounded-full"
                  >
                    Today's Report
                  </a>
                  <a
                    href="/daywisereport"
                    className="px-4 py-2 text-[#02066F] font-semibold rounded-full"
                  >
                    Day Wise Report
                  </a>

                  {availableFrequencies.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableFrequencies.map((frequency) => (
                        <a
                          key={frequency}
                          href="/salariedreport"
                          onClick={(e) => {
                            e.preventDefault();
                            switchFrequency(frequency);
                          }}
                          className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                            selectedFrequency === frequency
                              ? "bg-[#02066F] text-white"
                              : "bg-white text-[#02066F]"
                          } text-sm sm:text-base`}
                        >
                          {frequency} Report
                        </a>
                      ))}
                    </div>
                  ) : (
                    <a
                      href="/salariedreport"
                      className="px-4 py-2 bg-[#02066F] text-white font-semibold rounded-full"
                    >
                      {reportTypeHeading}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-5xl mx-auto mt-4 px-4">
            <div className="flex justify-center">
              <div className="relative inline-block text-left w-64">
                {adminType === "Owner" && (
                  <button
                    id="device-menu-button-summary"
                    type="button"
                    className="inline-flex w-full justify-between items-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#02066F] border border-[#02066F] shadow-sm hover:bg-[#02066F] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02066F] transition"
                    onClick={toggleDropdown}
                  >
                    <span>
                      {selectedDevice
                        ? selectedDevice.DeviceName
                        : "Select Device Name"}
                    </span>
                    <svg
                      className="h-5 w-5 text-gray-400 group-hover:text-white transition"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}

                {dropdownOpen && (
                  <div
                    id="device-dropdown-summary"
                    className="absolute right-0 z-20 mt-2 w-full origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn"
                  >
                    <div className="py-1">
                      {devices.length > 0 ? (
                        devices.map((device) => (
                          <button
                            key={device.DeviceID}
                            type="button"
                            className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-[#02066F] hover:text-white transition"
                            onClick={() => selectDevice(device)}
                          >
                            {device.DeviceName}
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-500 block px-4 py-2 text-sm">
                          No devices available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <main className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-center mb-8">
              {reportTypeHeading}
            </h1>

            <div className="flex flex-wrap justify-center gap-4 mb-3">
              {isShowYearMonth && (
                <>
                  <div className="flex items-center">
                    <label
                      htmlFor="yearInput"
                      className="mr-2 text-base font-semibold text-gray-800"
                    >
                      Year:
                    </label>
                    <select
                      id="yearInput"
                      value={year}
                      onChange={(e) => {
                        setYear(Number(e.target.value));
                        toggleSelectors();
                        if (showWeekSelector) setWeek(1);
                        viewDateRangewiseReport();
                        updateDates();
                      }}
                      className="bg-white border border-[#02066F] rounded px-3 py-1 text-[#02066F] font-medium focus:outline-none"
                    >
                      {Array.from({ length: 1 }, (_, i) => 2025 + i).map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label
                      htmlFor="monthInput"
                      className="mr-2 text-base font-semibold text-gray-800"
                    >
                      Month:
                    </label>
                    <select
                      id="monthInput"
                      value={month}
                      onChange={(e) => {
                        setMonth(Number(e.target.value));
                        toggleSelectors();
                        setWeek(1);
                        setSelectedRangeIndex(0);
                        viewDateRangewiseReport();
                        updateDates();
                      }}
                      className="bg-white border border-[#02066F] rounded px-3 py-1 text-[#02066F] font-medium focus:outline-none"
                    >
                      {months.map((monthName, index) => (
                        <option key={index} value={index + 1}>
                          {monthName}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {(showWeekSelector || selectedFrequency === "Weekly") && (
                <div className="flex items-center">
                  <label
                    htmlFor="weekInput"
                    className="mr-2 text-base font-semibold text-gray-800"
                  >
                    Week:
                  </label>
                  <select
                    id="weekInput"
                    value={week}
                    onChange={(e) => {
                      const newWeek = Number(e.target.value);
                      setWeek(newWeek);
                      setSelectedRangeIndex(newWeek - 1);
                      loadReportTable(
                        dateRanges[newWeek - 1].startRange,
                        dateRanges[newWeek - 1].endRange
                      );
                    }}
                    className="bg-white border border-[#02066F] rounded px-3 py-1 text-[#02066F] font-medium focus:outline-none"
                  >
                    {dateRanges.map((range, index) => (
                      <option key={index} value={index + 1}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(showHalfSelector || selectedFrequency === "Bimonthly") && (
                <div className="flex items-center">
                  <label
                    htmlFor="halfInput"
                    className="mr-2 text-base font-semibold text-gray-800"
                  >
                    Half:
                  </label>
                  <select
                    id="halfInput"
                    value={half}
                    onChange={(e) => {
                      const newHalf = e.target.value;
                      setHalf(newHalf);
                      const newIndex = newHalf === "first" ? 0 : 1;
                      setSelectedRangeIndex(newIndex);
                      if (dateRanges.length > newIndex) {
                        loadReportTable(
                          dateRanges[newIndex].startRange,
                          dateRanges[newIndex].endRange
                        );
                      }
                      updateDates();
                    }}
                    className="bg-white border border-[#02066F] rounded px-3 py-1 text-[#02066F] font-medium focus:outline-none"
                  >
                    <option value="first">First Half</option>
                    <option value="second">Second Half</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col max-w-5xl mx-auto md:flex-row justify-between mb-6 p-4 rounded-lg">
              <div className="mb-2 md:mb-0">
                <span className="text-md md:text-lg font-semibold text-gray-800">
                  Start Date:{" "}
                </span>
                <span className="text-md md:text-lg font-semibold text-gray-800">
                  {startDateHeader}
                </span>
              </div>
              <div>
                <span className="text-md md:text-lg font-semibold text-gray-800">
                  End Date:{" "}
                </span>
                <span className="text-md md:text-lg font-semibold text-gray-800">
                  {endDateHeader}
                </span>
              </div>
            </div>

            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden mb-8 border-1 border-gray-300">
              <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="flex flex-col gap-2 sm:flex-row justify-evenly items-center mb-6">
                  <button
                    onClick={downloadPDF}
                    className="text-[#02066F] hover:text-black px-4 py-2 rounded-lg transition-colors cursor-pointer border-1 border-[#02066F]"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="text-[#02066F] hover:text-black px-4 py-2 rounded-lg transition-colors cursor-pointer border-1 border-[#02066F]"
                  >
                    Download CSV
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="entries"
                      className="text-base font-semibold text-gray-700"
                    >
                      Show:
                    </label>
                    <select
                      id="entries"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border border-gray-400 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-base font-semibold text-gray-700">
                      entries
                    </span>
                  </div>

                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                    <label
                      htmlFor="search"
                      className="text-base font-semibold text-gray-800"
                    >
                      Search:
                    </label>
                    <input
                      id="search"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder=""
                      className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                    />
                  </div>
                </div>

                <div className="overflow-hidden">
                  <div className="overflow-x-auto w-full max-w-full sm:rounded-lg">
                    <table className="min-w-[600px] sm:min-w-full border border-gray-300 text-sm">
                      <thead className="bg-[#02066F] text-white">
                        <tr>
                          <th
                            className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer border-r"
                            onClick={() => requestSort("name")}
                          >
                            <div className="flex items-center justify-center">
                              Name
                              {sortConfig.key === "name" ? (
                                <span className="ml-6 text-lg">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              ) : (
                                <span className="ml-6 text-lg">↑↓</span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer border-r"
                            onClick={() => requestSort("pin")}
                          >
                            <div className="flex items-center justify-center">
                              Pin
                              {sortConfig.key === "pin" ? (
                                <span className="ml-1 text-lg">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              ) : (
                                <span className="ml-6 text-lg">↑↓</span>
                              )}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer border-r"
                            onClick={() => requestSort("hoursWorked")}
                          >
                            <div className="flex items-center justify-center">
                              Total Worked Hours (HH:MM)
                              {sortConfig.key === "hoursWorked" ? (
                                <span className="ml-1 text-lg">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              ) : (
                                <span className="ml-6 text-lg">↑↓</span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-4 py-4 text-center text-gray-500"
                            >
                              No matching records found
                            </td>
                          </tr>
                        ) : (
                          paginatedEmployees.map((employee, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 text-center"
                            >
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border-gray-300 border-r">
                                {employee.name}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border-gray-300 border-r">
                                {employee.pin}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border-gray-300 border-r">
                                {employee.hoursWorked}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-base font-semibold text-gray-700 mb-2 sm:mb-0">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredEmployees.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredEmployees.length}
                      </span>{" "}
                      results
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      {Array(totalPages)
                        .fill(0)
                        .map((_, i) => {
                          if (
                            i + 1 === currentPage ||
                            i + 1 === currentPage - 1 ||
                            i + 1 === currentPage + 1 ||
                            i === 0 ||
                            i === totalPages - 1
                          ) {
                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 border text-sm font-medium ${
                                  currentPage === i + 1
                                    ? "bg-gray-200 border-[#02066F] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                } rounded-sm`}
                              >
                                {i + 1}
                              </button>
                            );
                          } else if (
                            i + 1 === currentPage - 2 ||
                            i + 1 === currentPage + 2
                          ) {
                            return (
                              <span key={i} className="px-3 py-1 text-gray-700">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    
    <Footer2/>
    </>
  );
};

export default SalariedReport;
