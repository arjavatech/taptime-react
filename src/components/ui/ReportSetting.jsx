import React, { useState, useEffect } from "react";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer";
import {
  fetchDevices,
  getAllReportEmails,
  createReportEmail,
  updateReportEmail,
  deleteReportEmail,
  getReportEmail,
  createReportObject
} from "../../utils/apiUtils";

const ReportSetting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSettings, setEmailSettings] = useState([]);
  const [allEmailSettings, setAllEmailSettings] = useState([]);
  const [viewSetting, setViewSetting] = useState("Weekly");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewEditModal, setShowViewEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentFrequencies, setCurrentFrequencies] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newFrequencies, setNewFrequencies] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [frequencyError, setFrequencyError] = useState("");
  const [viewFrequencyError, setViewFrequencyError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [storedDeviceID, setStoredDeviceID] = useState(null);
  const [adminType, setAdminType] = useState("");
  const [viewFrequencies, setViewFrequencies] = useState([]);
  const [showViewFrequencyDropdown, setShowViewFrequencyDropdown] = useState(false);
  const [maxViewSelections] = useState(2);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [frequencies] = useState(["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"]);
  const [selectedFrequencies, setSelectedFrequencies] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayValue = selectedFrequencies.join(", ") || [...currentFrequencies];

  const loadReportSettings = async () => {
    setIsLoading(true);
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getAllReportEmails(company_id);
      setAllEmailSettings(data);
      filterReportSettings();
    } catch (error) {
      console.error("Failed to load report settings:", error);
      setAllEmailSettings([]);
      setEmailSettings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      if (typeof window === "undefined") return;
      const companyId = localStorage.getItem("companyID");
      const filteredDevices = await fetchDevices(companyId);

      setDevices(filteredDevices);

      if (storedDeviceID) {
        const storedDevice = filteredDevices.find(
          (device) => device.deviceId === storedDeviceID
        );
        if (storedDevice) {
          setSelectedDevice(storedDevice);
          console.log("Using stored DeviceID:", storedDeviceID);
        }
      } else if (filteredDevices.length > 0) {
        setSelectedDevice(filteredDevices[0]);
      }

      filterReportSettings();
    } catch (error) {
      console.error("Error fetching devices:", error);
      setDevices([]);
    }
  };

  const filterReportSettings = () => {
    // Since the API data doesn't have DeviceID field, show all data
    setEmailSettings(Array.isArray(allEmailSettings) ? allEmailSettings : []);
    console.log('Report settings loaded:', allEmailSettings.length);
  };

  const handleDeviceSelection = (device) => {
    setSelectedDevice(device);
    console.log("Selected device:", device);
    console.log("Device ID to pass:", device.deviceId);
    filterReportSettings();
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

      if (frequencies.length > 0) {
        setViewSetting(frequencies[0]);
      }

      if (frequencies.length === 0 && savedSetting.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      }
    }
  };

  const toggleViewFrequency = (frequency) => {
    if (viewFrequencies.includes(frequency)) {
      setViewFrequencies(viewFrequencies.filter((f) => f !== frequency));
    } else {
      if (viewFrequencies.length < maxViewSelections) {
        setViewFrequencies([...viewFrequencies, frequency]);
        setViewFrequencyError("");
      } else {
        setViewFrequencyError("Maximum 2 selections allowed");
      }
    }

    if (viewFrequencies.length > 0) {
      setViewSetting(viewFrequencies[0]);
    }
  };

  const openAddModal = () => {
    if (!storedDeviceID && !selectedDevice) {
      alert("Please select a device first");
      return;
    }
    setNewEmail("");
    setNewFrequencies([]);
    setEmailError("");
    setFrequencyError("");
    setShowFrequencyDropdown(false);
    setShowAddModal(true);
  };

  const openEditModal = (email, frequencies) => {
    setCurrentEmail(email);
    setCurrentFrequencies([...frequencies]);
    setEmailError("");
    setFrequencyError("");
    setShowEditModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewEmail("");
    setNewFrequencies([]);
    setEmailError("");
    setFrequencyError("");
    setShowFrequencyDropdown(false);
  };

  const openViewEditModal = () => {
    setShowViewEditModal(true);
  };

  const openDeleteModal = (email) => {
    console.log('Opening delete modal for email:', email);
    setCurrentEmail(email);
    setShowDeleteModal(true);
    console.log('showDeleteModal state set to:', true);
  };

  const validateEmail = (email) => {
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    } else if (!isEmail.test(email)) {
      setEmailError("Email pattern is invalid");
      return false;
    }

    setEmailError("");
    return true;
  };

  const validateFrequencies = (frequencies) => {
    if (frequencies.length === 0) {
      setFrequencyError("Please select at least one option");
      return false;
    } else if (frequencies.length > 2) {
      setFrequencyError("Please select maximum two options");
      return false;
    }

    setFrequencyError("");
    return true;
  };

  const saveReportSettings = async () => {
    if (!validateEmail(newEmail)) return;
    if (!validateFrequencies(newFrequencies)) return;

    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    if (!company_id) {
      console.error("Missing company ID in localStorage");
      return;
    }

    const deviceId = storedDeviceID || selectedDevice?.deviceId || "";
    const reportData = createReportObject(newEmail, company_id, deviceId, newFrequencies);

    try {
      await createReportEmail(reportData);
      closeAddModal();
      loadReportSettings();
    } catch (error) {
      console.error("Error saving report settings:", error);
    }
  };

  const updateReportSettings = async () => {
    if (!validateEmail(currentEmail)) return;
    if (!validateFrequencies(currentFrequencies)) return;

    const company_id = localStorage.getItem("companyID") || "";
    const deviceId = storedDeviceID || selectedDevice?.deviceId || "";
    const reportData = createReportObject(currentEmail, company_id, deviceId, currentFrequencies);

    try {
      await updateReportEmail(currentEmail, company_id, reportData);
      setShowEditModal(false);
      loadReportSettings();
    } catch (error) {
      console.error("Error updating report settings:", error);
    }
  };

  const deleteReportSettings = async () => {
    const company_id = localStorage.getItem("companyID") || "";

    try {
      await deleteReportEmail(currentEmail, company_id);
      setShowDeleteModal(false);
      loadReportSettings();
    } catch (error) {
      console.error("Error deleting report settings:", error);
    }
  };

  const loadReportEmailForEdit = async (email) => {
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getReportEmail(email, company_id);
      const frequencies = [];
      if (data.IsDailyReportActive) frequencies.push('Daily');
      if (data.IsWeeklyReportActive) frequencies.push('Weekly');
      if (data.IsBiWeeklyReportActive) frequencies.push('Biweekly');
      if (data.IsMonthlyReportActive) frequencies.push('Monthly');
      if (data.IsBiMonthlyReportActive) frequencies.push('Bimonthly');
      
      setCurrentFrequencies(frequencies);
    } catch (error) {
      console.error("Error loading report email for edit:", error);
    }
  };

  const updateViewSetting = async () => {
    if (viewFrequencies.length === 0) {
      setViewFrequencyError("Please select at least one frequency");
      return;
    }

    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";
    const setting = {
      CID: company_id,
      ReportType: viewFrequencies.join(","),
    };

    setIsLoading(true);
    try {
      const response = await fetch(`https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/admin-report-type/update/${company_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      localStorage.setItem("reportType", viewFrequencies.join(","));
      setShowViewEditModal(false);
    } catch (error) {
      console.error("Failed to update view setting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFrequencies = (setting) => {
    const frequencies = [];
    if (setting.IsDailyReportActive) frequencies.push("Daily");
    if (setting.IsWeeklyReportActive) frequencies.push("Weekly");
    if (setting.IsBiWeeklyReportActive) frequencies.push("Biweekly");
    if (setting.IsMonthlyReportActive) frequencies.push("Monthly");
    if (setting.IsBiMonthlyReportActive) frequencies.push("Bimonthly");
    return frequencies.join(", ");
  };

  const selectFrequency = (freq) => {
    if (newFrequencies.includes(freq)) {
      setNewFrequencies(newFrequencies.filter((f) => f !== freq));
    } else {
      if (newFrequencies.length < 2) {
        setNewFrequencies([...newFrequencies, freq]);
      }
    }
    setFrequencyError("");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleFrequency = (freq) => {
    if (selectedFrequencies.includes(freq)) {
      setSelectedFrequencies(selectedFrequencies.filter((f) => f !== freq));
    } else if (selectedFrequencies.length < 2) {
      setSelectedFrequencies([...selectedFrequencies, freq]);
      setFrequencyError("");
    } else {
      setFrequencyError("You can select up to 2 frequencies only.");
    }
  };

  const deviceToggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event) => {
    const dropdown = document.getElementById("device-dropdown-summary");
    const button = document.getElementById("device-menu-button-summary");

    if (dropdown && !dropdown.contains(event.target) && button && !button.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  const selectDevice = (device) => {
    handleDeviceSelection(device);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const deviceID = localStorage.getItem("DeviceID");
      const adminTypeValue = localStorage.getItem("adminType") || "";

      setStoredDeviceID(deviceID);
      setAdminType(adminTypeValue);

      const savedReportType = localStorage.getItem("reportType");
      if (savedReportType && savedReportType.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      } else if (savedReportType) {
        setViewSetting(savedReportType);
      }

      await loadReportSettings();
      await loadDevices();
      loadViewSetting();
    };

    initializeComponent();

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    filterReportSettings();
  }, [allEmailSettings, selectedDevice, storedDeviceID]);

  useEffect(() => {
    console.log('showDeleteModal state changed:', showDeleteModal);
  }, [showDeleteModal]);

  return (
    <>
      <Header2 />
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        <div className="max-w-5xl mx-auto pt-25">
          {!storedDeviceID && adminType !== "Admin" && adminType !== "SuperAdmin" && (
            <div className="max-w-5xl mx-auto mb-8 px-4">
              <div className="flex justify-center">
                <div className="relative inline-block text-left w-64">
                  {adminType === "Owner" && (
                    <button
                      id="device-menu-button-summary"
                      type="button"
                      className="inline-flex w-full justify-between items-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-[#02066F] border border-[#02066F] shadow-sm hover:bg-[#02066F] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02066F] transition"
                      onClick={deviceToggleDropdown}
                    >
                      <span>
                        {selectedDevice ? selectedDevice.name : "Select Device Name"}
                      </span>
                      <svg className="h-5 w-5 text-gray-400 group-hover:text-white transition" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}

                  {dropdownOpen && (
                    <div id="device-dropdown-summary" className="absolute right-0 z-20 mt-2 w-full origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
                      <div className="py-1">
                        {devices.length > 0 ? (
                          devices.map((device) => (
                            <button
                              key={device.id}
                              type="button"
                              className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-[#02066F] hover:text-white transition"
                              onClick={() => selectDevice(device)}
                            >
                              {device.name}
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

          <div className="flex flex-row md:flex-row md:items-center items-center justify-between md:justify-between mb-6">
            <h2 className="text-xl md:text-2xl xl:text-3xl font-bold mb-4 md:mb-0 text-gray-800">Report Settings</h2>
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-[#02066F] border-1 border-[#02066F] cursor-pointer rounded-lg transition-colors duration-200 bg-white"
              disabled={!storedDeviceID && !selectedDevice}
            >
              Add Entry
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-center text-base font-bold tracking-wider">Email</th>
                    <th className="px-6 py-3 text-center text-base font-bold tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-center text-base font-bold tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailSettings.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        {isLoading ? "Loading..." : "No report settings found"}
                      </td>
                    </tr>
                  ) : (
                    Array.isArray(emailSettings) &&
                    emailSettings.map((setting, index) => (
                      <tr key={index} className="text-center">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {setting.CompanyReporterEmail}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatFrequencies(setting)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          <div className="flex justify-center space-x-6">
                            <button
                              onClick={() => openEditModal(setting.CompanyReporterEmail, formatFrequencies(setting).split(", "))}
                              className="text-[#02066F]"
                            >
                              <i className="fas fa-pencil-alt cursor-pointer"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(setting.CompanyReporterEmail)}
                              className="text-[#02066F]"
                            >
                              <i className="fas fa-trash cursor-pointer"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between md:justify-between mb-6">
            <h2 className="text-xl md:text-2xl xl:text-3xl font-bold mb-4 md:mb-0 text-gray-800">Report View Settings</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-0">
            <div className="overflow-x-auto items-center justify-center">
              <table className="w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-center text-base font-bold tracking-wider">Frequency</th>
                    <th className="px-6 py-3 text-center text-base font-bold tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="text-center">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {viewFrequencies.length > 0 ? viewFrequencies.join(", ") : viewSetting || "No frequency selected"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      <button onClick={openViewEditModal} className="text-[#02066F] hover:text-[#02066F]">
                        <i className="fas fa-pencil-alt cursor-pointer"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 shadow-xl">
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-white">Report Details</h3>
                <button className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2" onClick={closeAddModal}>×</button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg focus:outline-none font-bold"
                    placeholder="Email"
                  />
                  {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                </div>
                <div className="mb-6">
                  <div className="relative">
                    <div className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg cursor-pointer flex justify-between items-center" onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}>
                      <span className={newFrequencies.length === 0 ? "text-gray-500" : "text-[#02066F] text-base"}>
                        {newFrequencies.length === 0 ? "Select Frequency" : newFrequencies.join(", ")}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {showFrequencyDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
                        {["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"].map((freq) => (
                          <div key={freq} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => selectFrequency(freq)}>
                            <span className="text-[#02066F] text-base">{freq}</span>
                            {newFrequencies.includes(freq) && <span className="text-xl font-bold text-[#02066F]">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {frequencyError && <p className="mt-1 text-sm text-red-600">{frequencyError}</p>}
                </div>
                <div className="flex justify-center">
                  <button onClick={saveReportSettings} className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/80 transition-colors cursor-pointer" disabled={!newEmail || newFrequencies.length === 0}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showViewEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 shadow-xl">
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-2xl font-semibold p-2 text-white">Report View Settings</h3>
                <button className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2" onClick={() => setShowViewEditModal(false)}>×</button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="relative">
                    <div className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg cursor-pointer flex justify-between items-center" onClick={() => setShowViewFrequencyDropdown(!showViewFrequencyDropdown)}>
                      <span className={viewFrequencies.length === 0 ? "text-gray-500" : "text-[#02066F] text-base"}>
                        {viewFrequencies.length === 0 ? "Select frequencies" : viewFrequencies.join(", ")}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {showViewFrequencyDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
                        {["Weekly", "Biweekly", "Monthly", "Bimonthly"].map((freq) => (
                          <div key={freq} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center" onClick={() => toggleViewFrequency(freq)}>
                            <span className="text-[#02066F] text-base">{freq}</span>
                            {viewFrequencies.includes(freq) && <span className="text-xl font-bold text-[#02066F] ml-2">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {viewFrequencyError && <p className="mt-1 text-sm text-red-600">{viewFrequencyError}</p>}
                </div>
                <div className="flex justify-center">
                  <button onClick={updateViewSetting} className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/80 transition-colors cursor-pointer" disabled={viewFrequencies.length === 0}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 shadow-xl">
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-white">Edit Report Details</h3>
                <button className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2" onClick={() => setShowEditModal(false)}>×</button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <input
                    type="email"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg focus:outline-none font-bold"
                    placeholder="Email"
                  />
                  {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                </div>
                <div className="mb-6">
                  <div className="relative">
                    <div className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg cursor-pointer flex justify-between items-center" onClick={() => setShowDropdown(!showDropdown)}>
                      <span className={currentFrequencies.length === 0 ? "text-gray-500" : "text-[#02066F] text-base"}>
                        {currentFrequencies.length === 0 ? "Select Frequency" : currentFrequencies.join(", ")}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {showDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
                        {["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"].map((freq) => (
                          <div key={freq} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => {
                            if (currentFrequencies.includes(freq)) {
                              setCurrentFrequencies(currentFrequencies.filter((f) => f !== freq));
                            } else if (currentFrequencies.length < 2) {
                              setCurrentFrequencies([...currentFrequencies, freq]);
                              setFrequencyError("");
                            }
                          }}>
                            <span className="text-[#02066F] text-base">{freq}</span>
                            {currentFrequencies.includes(freq) && <span className="text-xl font-bold text-[#02066F]">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {frequencyError && <p className="mt-1 text-sm text-red-600">{frequencyError}</p>}
                </div>
                <div className="flex justify-center">
                  <button onClick={updateReportSettings} className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/80 transition-colors cursor-pointer" disabled={!currentEmail || currentFrequencies.length === 0}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl border border-gray-300">
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-center text-white p-2 justify-center">Delete</h3>
                <button className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              <div className="p-4">
                <p className="text-center text-gray-800 font-bold text-lg mb-6">Are you sure, you want to remove the employee?</p>
                <div className="flex justify-center space-x-4">
                  <button onClick={deleteReportSettings} className="px-6 py-2 bg-[#02066F] opacity-80 hover:opacity-60 text-white rounded-md cursor-pointer" disabled={isLoading}>
                    Yes
                  </button>
                  <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2 border border-[#02066F] text-[#02066F] rounded-md cursor-pointer">
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer2 />
    </>
  );
};

export default ReportSetting;