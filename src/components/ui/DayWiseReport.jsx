import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Header2 from "./Navbar/Header2";
import Footer2 from "./Footer/Footer2";

const DayWiseReport = () => {
  const [reportTypeHeading, setReportTypeHeading] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [adminType, setAdminType] = useState("");
  const [deviceID, setDeviceID] = useState("");
  const [availableFrequencies, setAvailableFrequencies] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const companyId = localStorage.getItem("companyID");

  const apiUrlBase =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/dailyreport/getdatebasedata";
  const deviceApiUrl =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/device";
  const [cid, setCid] = useState("");
  const [reportName, setReportName] = useState("Salaried");

  const loadFrequenciesSync = () => {
    if (typeof window === "undefined") return [];
    const savedFrequencies = localStorage.getItem("reportType");
    if (savedFrequencies) {
      return savedFrequencies.split(",").filter((f) => f.trim() !== "");
    }
    return [];
  };

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

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${deviceApiUrl}/getAll/${companyId}`);
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
    console.log("Selected device for reports:", device);
    if (selectedDate) {
      viewDatewiseReport(selectedDate);
    }
  };

  const viewDatewiseReport = async (dateValue) => {
    if (!dateValue || !cid) {
      setReportData([]);
      setFilteredData([]);
      return;
    }

    try {
      const res = await fetch(`${apiUrlBase}/${cid}/${dateValue}`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data.body)
        ? data.body
        : [];

      if (!Array.isArray(records)) throw new Error("Invalid API data");

      let processedData = records.map((item) => ({
        ...item,
        formattedCheckIn: item.CheckInTime
          ? convertToAmPm(item.CheckInTime)
          : "--",
        formattedCheckOut: item.CheckOutTime
          ? convertToAmPm(item.CheckOutTime)
          : "--",
        timeWorked:
          item.CheckInTime && item.CheckOutTime
            ? calculateTimeWorked(item.CheckInTime, item.CheckOutTime)
            : "--",
      }));

      if (adminType !== "Owner") {
        processedData = processedData.filter(
          (item) => item.DeviceID === deviceID
        );
        console.log(
          `Filtered today's report by DeviceID ${deviceID}:`,
          processedData.length,
          "records"
        );
      } else if (selectedDevice && selectedDevice.DeviceID) {
        processedData = processedData.filter(
          (item) => item.DeviceID === selectedDevice.DeviceID
        );
        console.log(
          `Filtered report by DeviceID ${selectedDevice.DeviceID}:`,
          processedData.length,
          "records"
        );
      }

      setReportData(processedData);
      setFilteredData([...processedData]);
      setCurrentPage(1);
      setSortConfig({ key: "", direction: "asc" });
    } catch (err) {
      console.error("Error fetching report:", err);
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!searchQuery) {
      setFilteredData([...reportData]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = reportData.filter(
        (item) =>
          item.Name?.toLowerCase().includes(query) ||
          item.Pin?.toLowerCase().includes(query)
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1);
  };

  const paginatedData = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  };

  const totalPages = () => Math.ceil(filteredData.length / itemsPerPage);

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.text(`Day-Wise Report - ${selectedDate}`, 14, 10);

    const tableColumn = [
      "Employee Name",
      "Employee ID",
      "Check-in Time",
      "Check-out Time",
      "Time Worked Hours(HH:MM)",
    ];
    const tableRows = reportData.map((item) => [
      item.Name?.split(" ")[0] || "",
      item.Pin || "--",
      item.formattedCheckIn || "--",
      item.formattedCheckOut || "--",
      item.timeWorked || "--",
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
      styles: {
        fontSize: 10,
      },
      theme: "grid",
    });

    doc.save(`DayWise_Report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const downloadCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Employee Name",
      "Employee ID",
      "Check-in Time",
      "Check-out Time",
      "Time Worked",
    ];
    const csvRows = filteredData.map((item) => [
      `"${item.Name?.split(" ")[0] ?? ""}"`,
      item.Pin ?? "",
      item.formattedCheckIn,
      item.formattedCheckOut,
      item.timeWorked,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `day_wise_report_${selectedDate || "report"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }

    setSortConfig({ key, direction });

    const sorted = [...filteredData].sort((a, b) => {
      const valA = a[key] ?? "";
      const valB = b[key] ?? "";

      if (key.toLowerCase().includes("time")) {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (!isNaN(Number(valA))) {
        return direction === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }

      return direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    setFilteredData(sorted);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectDevice = (device) => {
    handleDeviceSelection(device);
    setDropdownOpen(false);
  };

  const handleClickOutside = (event) => {
    const dropdown = document.getElementById("device-dropdown-summary");
    const button = document.getElementById("device-menu-button-summary");

    if (
      dropdown &&
      !dropdown.contains(event.target) &&
      !button?.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      const adminTypeValue = localStorage.getItem("adminType") || "";
      const deviceIDValue = localStorage.getItem("DeviceID") || "";
      const cidValue = localStorage.getItem("companyID");
      const frequencies = loadFrequenciesSync();

      setAdminType(adminTypeValue);
      setDeviceID(deviceIDValue);
      setCid(cidValue);
      setAvailableFrequencies(frequencies);
      setSelectedFrequency(frequencies[0] || "");

      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      setSelectedDate(formattedDate);

      await Promise.all([fetchDevices(), viewDatewiseReport(formattedDate)]);

      setLoading(false);

      const selectedValue = localStorage.getItem("reportType") || "Salaried";
      setReportName(`${selectedValue} Report`);
      setReportTypeHeading(`${selectedValue} Report`);
    };

    initializeComponent();

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, reportData]);

  return (
    <>
    <Header2/>

      <div className="bg-gray-100">
        {loading && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        <div className="pt-16 md:pt-18 sm:pt-2">
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
                    className="px-4 py-2 bg-[#02066F] text-white font-semibold rounded-full"
                  >
                    Day Wise Report
                  </a>

                  {availableFrequencies.length > 1 ? (
                    availableFrequencies.map((frequency) => (
                      <a
                        key={frequency}
                        href="/salariedreport"
                        className="px-4 py-2 text-[#02066F] font-semibold rounded-full"
                        onClick={() =>
                          localStorage.setItem("selectedFrequency", frequency)
                        }
                      >
                        {frequency} Report
                      </a>
                    ))
                  ) : availableFrequencies.length === 1 ? (
                    <a
                      href="/salariedreport"
                      className="px-4 py-2 text-[#02066F] font-semibold rounded-full"
                      onClick={() =>
                        localStorage.setItem(
                          "selectedFrequency",
                          availableFrequencies[0]
                        )
                      }
                    >
                      {availableFrequencies[0]} Report
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-5xl mx-auto mt-5 px-4">
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

          <div className="flex flex-col md:flex-row justify-center items-center my-8 gap-4 px-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                viewDatewiseReport(e.target.value);
              }}
              className="border bg-white border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 shadow"
            />
          </div>

          {selectedDate ? (
            <div className="border-gray-300 rounded-xl overflow-hidden mb-auto px-4">
              <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-300">
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
                        Show
                      </label>
                      <select
                        id="entries"
                        value={itemsPerPage}
                        onChange={(e) =>
                          setItemsPerPage(Number(e.target.value))
                        }
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder=""
                        className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                      />
                    </div>
                  </div>

                  <table className="min-w-full border border-gray-300 text-sm overflow-x-auto">
                    <thead className="bg-[#02066F] text-white">
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 text-center font-semibold border-r tracking-wider cursor-pointer"
                          onClick={() => requestSort("Name")}
                        >
                          <div className="flex items-center justify-center">
                            Employee Name
                            {sortConfig.key === "Name" ? (
                              <span className="ml-6 text-lg">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <span className="ml-6 text-lg">↑↓</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 text-center font-semibold border-r tracking-wider cursor-pointer"
                          onClick={() => requestSort("Pin")}
                        >
                          <div className="flex items-center justify-center">
                            Employee ID
                            {sortConfig.key === "Pin" ? (
                              <span className="ml-6 text-lg">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <span className="ml-6 text-lg">↑↓</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 text-center font-semibold border-r tracking-wider cursor-pointer"
                          onClick={() => requestSort("CheckInTime")}
                        >
                          <div className="flex items-center justify-center">
                            Check-in Time
                            {sortConfig.key === "CheckInTime" ? (
                              <span className="ml-6 text-lg">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <span className="ml-6 text-lg">↑↓</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 text-center font-semibold border-r tracking-wider cursor-pointer"
                          onClick={() => requestSort("CheckOutTime")}
                        >
                          <div className="flex items-center justify-center">
                            Check-out Time
                            {sortConfig.key === "CheckOutTime" ? (
                              <span className="ml-6 text-lg">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            ) : (
                              <span className="ml-6 text-lg">↑↓</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 text-center font-semibold border-r tracking-wider cursor-pointer"
                          onClick={() => requestSort("timeWorked")}
                        >
                          <div className="flex items-center justify-center">
                            Time Worked Hours (HH:MM)
                            {sortConfig.key === "timeWorked" ? (
                              <span className="ml-6 text-lg">
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
                      {filteredData.length === 0 ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="px-4 py-4 text-center text-gray-500"
                          >
                            {reportData.length === 0
                              ? "No records found for selected date"
                              : "No matching records found"}
                          </td>
                        </tr>
                      ) : (
                        paginatedData().map((item, index) => (
                          <tr
                            key={item.Pin + "-" + index}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-gray-900 text-sm border-gray-300 border-r">
                              {item.Name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-gray-900 text-sm border-gray-300 border-r">
                              {item.Pin}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-gray-900 text-sm border-gray-300 border-r">
                              {item.formattedCheckIn}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-gray-900 text-sm border-gray-300 border-r">
                              {item.formattedCheckOut}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-gray-900 text-sm border-gray-300 border-r">
                              {item.timeWorked}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-base font-semibold text-gray-700 mb-2 sm:mb-0">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to
                      <span className="font-medium">
                        {" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredData.length
                        )}
                      </span>{" "}
                      of
                      <span className="font-medium">
                        {" "}
                        {filteredData.length}
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

                      {Array(totalPages())
                        .fill(0)
                        .map((_, i) => {
                          if (
                            i + 1 === currentPage ||
                            i + 1 === currentPage - 1 ||
                            i + 1 === currentPage + 1 ||
                            i === 0 ||
                            i === totalPages() - 1
                          ) {
                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 border text-sm font-medium ${
                                  currentPage === i + 1
                                    ? "bg-gray-200 border-[#02066F]"
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
                          setCurrentPage(
                            Math.min(totalPages(), currentPage + 1)
                          )
                        }
                        disabled={currentPage === totalPages()}
                        className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-gray-300 rounded-xl overflow-hidden mb-auto">
              <p className="p-14 text-center text-gray-700">
                Please select a date to show report.
              </p>
            </div>
          )}
        </div>
      </div>
    
    <Footer2/>
    </>
  );
};

export default DayWiseReport;
