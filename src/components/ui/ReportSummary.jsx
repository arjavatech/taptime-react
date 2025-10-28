import React, { useState, useEffect, useRef, useCallback } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import DataTable from "datatables.net-dt";
import Header2 from "./Navbar/Header2";
import Footer2 from "./Footer/Footer2";

const ReportSummary = () => {
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [tableData, setTableData] = useState([]);
  const [dataTable, setDataTable] = useState(null);
  const tableRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [employeeList, setEmployeeList] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [availableFrequencies, setAvailableFrequencies] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [adminType, setAdminType] = useState("");
  const [deviceID, setDeviceID] = useState("");
  const [cid, setCid] = useState("");
  const [reportTypeHeading, setReportTypeHeading] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
   const companyId = localStorage.getItem("companyID");

  const [formData, setFormData] = useState({
    employee: "",
    type: "",
    date: "",
    checkinTime: "",
    checkoutTime: "",
  });

  const [errors, setErrors] = useState({
    employee: "",
    type: "",
    date: "",
    checkinTime: "",
    checkoutTime: "",
  });

  const BASE = "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod";
  const deviceApiUrl =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/device";

  const loadFrequenciesSync = () => {
    if (typeof window === "undefined") return [];
    const savedFrequencies = localStorage.getItem("reportType");
    if (savedFrequencies) {
      return savedFrequencies.split(",").filter((f) => f.trim() !== "");
    }
    return [];
  };

  const formatToAmPm = (date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const parseDateTime = (date, time) => {
    return `${date}T${time.padStart(2, "0")}:00`;
  };

   // Fetch device data
    const fetchDevices = useCallback(async () => {
      try {
        const response = await fetch(`${deviceApiUrl}/getAll/${companyId}`);

        console.log("fetching data...", companyId);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
  
        const data = await response.json();
        console.log("data:",data);
        
        // Filter out devices with "Not Registered" names
        const allDevices = Array.isArray(data) ? data : [data];
        const filteredDevices = allDevices.filter(
          (device) =>
            device.DeviceName &&
            device.DeviceName !== "Not Registered" &&
            device.DeviceName.trim() !== ""
        );
        setDevices(filteredDevices);
        console.log("Fetched devices (filtered):", filteredDevices);
  
        // Set first valid device as default selection
        if (filteredDevices.length > 0) {
          setSelectedDevice(filteredDevices[0]);
          console.log("Default selected device:", filteredDevices[0]);
          console.log("Default Device ID:", filteredDevices[0].DeviceID);
          // Filter employees after setting default device
          filterEmployees(employees, filteredDevices[0]);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
        setErrorMessage("Failed to load devices");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }, [cid]);

  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
    console.log("Selected device for reports:", device);
    viewCurrentDateReport();
  };

  const fetchEmployeeData = async () => {
    try {
      const res = await fetch(`${BASE}/employee/getall/${cid}`);
      if (!res.ok) throw new Error("Error fetching employees");
      const arr = await res.json();
      const details = {};
      arr.forEach((e) => {
        details[e.EmpID] = e;
      });
      setEmployeeDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  const viewCurrentDateReport = async () => {
    try {
      const res = await fetch(
        `${BASE}/dailyreport/getdatebasedata/${cid}/${formData.date}`
      );
      if (!res.ok) throw new Error("Error fetching report data");
      const arr = await res.json();
      console.log("arr", arr);

      if (!arr.length) {
        setTableData([]);
        return;
      }

      let processedData = arr.map((row) => ({
        ...row,
        checkInTimeFormatted: formatToAmPm(new Date(row.CheckInTime)),
        needsCheckout: !row.CheckOutTime,
        checkoutTime: "",
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
          `Filtered today's report by DeviceID ${selectedDevice.DeviceID}:`,
          processedData.length,
          "records"
        );
      }

      setTableData(processedData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async (row) => {
    if (!row.checkoutTime) return;
    const checkIn = row.CheckInTime;
    const checkOut = parseDateTime(row.Date, row.checkoutTime);
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diff <= 0) return alert("Checkout must be after checkin");

    const minutes = diff / 1000 / 60;
    const timeWorked = `${String(Math.floor(minutes / 60)).padStart(
      2,
      "0"
    )}:${String(minutes % 60).padStart(2, "0")}`;

    try {
      const res = await fetch(
        `${BASE}/dailyreport/update/${row.EmpID}/${cid}/${encodeURIComponent(
          checkIn
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            CID: cid,
            EmpID: row.EmpID,
            Date: row.Date,
            TypeID: row.TypeID,
            CheckInTime: checkIn,
            CheckOutTime: checkOut,
            TimeWorked: timeWorked,
            CheckInSnap: row.CheckInSnap,
            CheckOutSnap: row.CheckOutSnap,
            LastModifiedBy: "Admin",
          }),
        }
      );
      if (!res.ok) throw await res.text();
      await viewCurrentDateReport();
    } catch (e) {
      console.error("Checkout error:", e);
    }
  };

  const validateForm = () => {
    const newErrors = {
      employee: "",
      type: "",
      date: "",
      checkinTime: "",
      checkoutTime: "",
    };

    if (!formData.employee) newErrors.employee = "Select employee.";
    if (!formData.type) newErrors.type = "Select type.";
    if (!formData.checkinTime) newErrors.checkinTime = "Select check-in.";
    if (!formData.checkoutTime || formData.checkoutTime <= formData.checkinTime)
      newErrors.checkoutTime = "Checkout after checkin.";

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const submitForm = async () => {
    if (!validateForm()) return;
    const checkIn = parseDateTime(formData.date, formData.checkinTime);
    const checkOut = parseDateTime(formData.date, formData.checkoutTime);
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diff <= 0) return alert("Checkout must be after checkin");

    const minutes = diff / 1000 / 60;
    const timeWorked = `${String(Math.floor(minutes / 60)).padStart(
      2,
      "0"
    )}:${String(minutes % 60).padStart(2, "0")}`;

    try {
      const res = await fetch(`${BASE}/dailyreport/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CID: cid,
          EmpID: formData.employee,
          Date: formData.date,
          TypeID: formData.type,
          CheckInTime: checkIn,
          CheckOutTime: checkOut,
          TimeWorked: timeWorked,
          CheckInSnap: null,
          CheckOutSnap: null,
          LastModifiedBy: "Admin",
          DeviceID:
            adminType !== "Owner"
              ? deviceID
              : selectedDevice
              ? selectedDevice.DeviceID
              : null,
        }),
      });
      if (!res.ok) throw await res.text();

      setFormData({
        employee: "",
        type: "",
        date: currentDate,
        checkinTime: "",
        checkoutTime: "",
      });
      setShowModal(false);
      await viewCurrentDateReport();
    } catch (e) {
      console.error("Submit error:", e);
    }
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
      !button.contains(event.target)
    ) {
      setDropdownOpen(false);
    }
  };

  const updateCheckoutTime = (index, value) => {
    const newTableData = [...tableData];
    newTableData[index].checkoutTime = value;
    setTableData(newTableData);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setIsLoading(true);
      const frequencies = loadFrequenciesSync();
      setAvailableFrequencies(frequencies);
      setSelectedFrequency(frequencies[0] || "");

      const adminTypeValue = localStorage.getItem("adminType") || "";
      const deviceIDValue = localStorage.getItem("DeviceID") || "";
      const cidValue = localStorage.getItem("companyID") || "";

      
      
      setAdminType(adminTypeValue);
      setDeviceID(deviceIDValue);
      setCid(cidValue);
      

      if (!cidValue) {
        alert("Company ID missing. Please login again.");
        window.location.href = "/login";
        return;
      }

      const data = localStorage.getItem("employeeData");
      if (data) {
        setEmployeeList(JSON.parse(data));
      }

      const selectedValue = localStorage.getItem("reportType");
      setReportTypeHeading(
        selectedValue ? `${selectedValue} Report` : "Report"
      );

      console.log("available frequency", frequencies);
      const today = new Date().toISOString().substring(0, 10);
      setCurrentDate(today);
      setFormData((prev) => ({ ...prev, date: today }));

      flatpickr("#date-picker", {
        dateFormat: "Y-m-d",
        defaultDate: today,
        onChange: (dates) => {
          const newDate = dates[0].toISOString().substring(0, 10);
          setFormData((prev) => ({ ...prev, date: newDate }));
          viewCurrentDateReport();
        },
      });

    //   await Promise.all([
        fetchDevices(),
        fetchEmployeeData(),
        viewCurrentDateReport(),
    //   ]);

      setIsLoading(false);
    };

    initializeComponent();

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);
  console.log("cid value", cid);

//   useEffect(() => {
//     if (!dataTable && tableRef.current) {
//       // Initialize DataTable only once
//       const dt = new DataTable(tableRef.current, {
//         paging: false,
//         searching: false,
//         info: false,
//         ordering: false,
//       });
//       setDataTable(dt);
//     } else if (dataTable) {
//       // Update the rows with new tableData
//       dataTable.clear();
//       dataTable.rows.add(tableData);
//       dataTable.draw();
//     }
//   }, [tableData]);

  return (
    <>
    <Header2/>

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
                  className="px-4 py-2 bg-[#02066F] text-white font-semibold rounded-full"
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

        <main className="bg-gray-100 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto mb-8 px-4">
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

          <div>
            <div className="text-center mb-4 pt-6">
              <h2 className="text-base sm:text-md md:text-xl font-bold text-gray-800">
                Current Day Report
              </h2>
            </div>

            <div className="max-w-5xl mx-auto flex flex-row md:flex-row justify-between items-center mb-6 gap-4">
              <h3 className="text-base sm:text-lg font-semibold text-center md:text-left">
                Date: {currentDate}
              </h3>
              <button
                className="bg-white border border-blue-900 text-blue-900 px-2 md:px-6 py-2 rounded-md font-semibold cursor-pointer transition"
                onClick={() => setShowModal(true)}
              >
                Add Entry
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-300">
            <div className="p-4 sm:p-6 overflow-x-auto">
              <table
                ref={tableRef}
                className="min-w-full border border-gray-300 text-sm"
              >
                <thead className="bg-[#02066F] text-white">
                  <tr>
                    <th className="text-base px-4 sm:px-6 py-3 text-center font-bold border-r">
                      Employee ID
                    </th>
                    <th className="text-base px-4 sm:px-6 py-3 text-center font-bold border-r">
                      Name
                    </th>
                    <th className="text-base px-4 sm:px-6 py-3 text-center font-bold border-r">
                      Check-in Time
                    </th>
                    <th className="text-base px-4 sm:px-6 py-3 text-center font-bold border-r">
                      Check-out Time
                    </th>
                    <th className="text-base px-4 sm:px-6 py-3 text-center font-bold border-r">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        No Records Found
                      </td>
                    </tr>
                  ) : tableData[0]?.empty ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        {tableData[0].message}
                      </td>
                    </tr>
                  ) : (
                    tableData.map((row, index) => (
                      <tr key={row.Pin || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-center">{row.Pin}</td>
                        <td className="px-6 py-4 text-center">
                          {row.Name?.split(" ")[0]}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.checkInTimeFormatted}
                        </td>
                        {row.needsCheckout ? (
                          <>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="time"
                                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={row.checkoutTime}
                                onChange={(e) =>
                                  updateCheckoutTime(index, e.target.value)
                                }
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="bg-blue-900 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                                disabled={!row.checkoutTime}
                                onClick={() =>
                                  row.checkoutTime && handleCheckout(row)
                                }
                              >
                                Check-out
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-center">
                              {row.CheckOutTime
                                ? formatToAmPm(new Date(row.CheckOutTime))
                                : ""}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
                                disabled
                              >
                                Check-out
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs">
              <div className="bg-[#02066F] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                <h3 className="text-lg font-bold text-center">Add entry</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 text-4xl hover:text-white cursor-pointer"
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  <div className="mb-4">
                    <select
                      className="w-full border-2 text-[#02066F] border-[#02066F] rounded-lg px-4 py-2 font-bold focus:outline-none"
                      value={formData.employee}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          employee: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Employee</option>
                      {employeeList.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    {errors.employee && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.employee}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <select
                      className="w-full border-2 border-[#02066F] text-[#02066F] rounded-lg px-4 py-2 font-bold focus:outline-none"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Type</option>
                      <option value="Belt">Belt</option>
                      <option value="Path">Path</option>
                      <option value="Camp">Camp</option>
                      <option value="External">External</option>
                      <option value="Trial">Trial</option>
                      <option value="Reception">Reception</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.type}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <input
                      type="date"
                      className="w-full border-2 border-[#02066F] text-[#02066F] rounded-lg px-4 py-2 font-bold focus:outline-none"
                      value={formData.date}
                      max={currentDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                    {errors.date && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.date}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <input
                      type="time"
                      className="w-full border-2 border-[#02066F] text-[#02066F] rounded-lg px-4 py-2 font-bold focus:outline-none"
                      value={formData.checkinTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          checkinTime: e.target.value,
                          checkoutTime: "",
                        }))
                      }
                    />
                    {errors.checkinTime && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.checkinTime}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <input
                      type="time"
                      className="w-full border-2 border-[#02066F] text-[#02066F] rounded-lg px-4 py-2 font-bold focus:outline-none"
                      value={formData.checkoutTime}
                      disabled={!formData.checkinTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          checkoutTime: e.target.value,
                        }))
                      }
                    />
                    {errors.checkoutTime && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.checkoutTime}
                      </p>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      className="bg-[#02066F] text-white px-8 py-2 rounded-lg font-bold cursor-pointer transition"
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
    
    <Footer2/>
    </>
  );
};

export default ReportSummary;
