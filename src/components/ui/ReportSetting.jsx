import React, { useState, useEffect } from "react";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer2";
import {
  getAllReportEmails,
  createReportEmail,
  updateReportEmail,
  deleteReportEmail,
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
  const [viewFrequencies, setViewFrequencies] = useState([]);
  const [showViewFrequencyDropdown, setShowViewFrequencyDropdown] = useState(false);
  const [maxViewSelections] = useState(2);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const loadReportSettings = async () => {
    setIsLoading(true);
    if (typeof window === "undefined") return;
    const company_id = localStorage.getItem("companyID") || "";

    try {
      const data = await getAllReportEmails(company_id);
      setAllEmailSettings(data);
      setEmailSettings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load report settings:", error);
      setAllEmailSettings([]);
      setEmailSettings([]);
    } finally {
      setIsLoading(false);
    }
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

    const deviceId = "";
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
    const deviceId = "";
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
      LastModifiedBy: localStorage.getItem("UserEmail") || localStorage.getItem("userName") || "unknown",
    };

    setIsLoading(true);
    try {
      const response = await fetch(`https://postgresql-holy-firefly-3725.fly.dev/admin-report-type/update/${company_id}`, {
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
    const freqMap = {
      IsDailyReportActive: "Daily",
      IsWeeklyReportActive: "Weekly", 
      IsBiWeeklyReportActive: "Biweekly",
      IsMonthlyReportActive: "Monthly",
      IsBiMonthlyReportActive: "Bimonthly"
    };
    return Object.entries(freqMap).filter(([key]) => setting[key]).map(([, value]) => value).join(", ");
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

  const Modal = ({ show, onClose, title, children, maxWidth = "max-w-sm" }) => show ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <div className={`bg-white rounded-lg w-full ${maxWidth} mx-4 shadow-xl`}>
        <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2" onClick={onClose}>×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  ) : null;

  const FrequencyDropdown = ({ frequencies, setFrequencies, showDropdown, setShowDropdown, error, placeholder = "Select Frequency", options = ["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"] }) => (
    <div className="mb-6">
      <div className="relative">
        <div className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg cursor-pointer flex justify-between items-center" onClick={() => setShowDropdown(!showDropdown)}>
          <span className={frequencies.length === 0 ? "text-gray-500" : "text-[#02066F] text-base"}>
            {frequencies.length === 0 ? placeholder : frequencies.join(", ")}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        {showDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
            {options.map((freq) => (
              <div key={freq} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center" onClick={() => {
                if (frequencies.includes(freq)) {
                  setFrequencies(frequencies.filter((f) => f !== freq));
                } else if (frequencies.length < 2) {
                  setFrequencies([...frequencies, freq]);
                  if (error) setFrequencyError("");
                }
              }}>
                <span className="text-[#02066F] text-base">{freq}</span>
                {frequencies.includes(freq) && <span className="text-xl font-bold text-[#02066F]">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const EmailInput = ({ value, onChange, error, placeholder = "Email" }) => (
    <div className="mb-4">
      <input
        type="email"
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg focus:outline-none font-bold"
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );

  const ActionButton = ({ onClick, disabled, children }) => (
    <div className="flex justify-center">
      <button onClick={onClick} className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/80 transition-colors cursor-pointer" disabled={disabled}>
        {children}
      </button>
    </div>
  );

  const TableSection = ({ title, headers, children, showAddButton = false, onAddClick }) => (
    <>
      <div className="flex flex-row md:flex-row md:items-center items-center justify-between md:justify-between mb-6">
        <h2 className="text-xl md:text-2xl xl:text-3xl font-bold mb-4 md:mb-0 text-gray-800">{title}</h2>
        {showAddButton && (
          <button onClick={onAddClick} className="px-4 py-2 text-[#02066F] border-1 border-[#02066F] cursor-pointer rounded-lg transition-colors duration-200 bg-white">
            Add Setting
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-6 py-3 text-center text-base font-bold tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {children}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  useEffect(() => {
    const initializeComponent = async () => {
      const savedReportType = localStorage.getItem("reportType");
      if (savedReportType && savedReportType.toLowerCase().includes("basic")) {
        localStorage.removeItem("reportType");
      } else if (savedReportType) {
        setViewSetting(savedReportType);
      }

      await loadReportSettings();
      loadViewSetting();
    };

    initializeComponent();
  }, []);



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
          <TableSection title="Report Settings" headers={["Email", "Frequency", "Action"]} showAddButton onAddClick={openAddModal}>
            {emailSettings.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  {isLoading ? "Loading..." : "No report settings found"}
                </td>
              </tr>
            ) : (
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
                      <button onClick={() => openEditModal(setting.CompanyReporterEmail, formatFrequencies(setting).split(", "))} className="text-[#02066F]">
                        <i className="fas fa-pencil-alt cursor-pointer"></i>
                      </button>
                      <button onClick={() => openDeleteModal(setting.CompanyReporterEmail)} className="text-[#02066F]">
                        <i className="fas fa-trash cursor-pointer"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableSection>

          <TableSection title="Report View Settings" headers={["Frequency", "Action"]}>
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
          </TableSection>
        </div>

        <Modal show={showAddModal} onClose={closeAddModal} title="Report Details">
          <EmailInput value={newEmail} onChange={(e) => setNewEmail(e.target.value)} error={emailError} />
          <FrequencyDropdown 
            frequencies={newFrequencies} 
            setFrequencies={setNewFrequencies} 
            showDropdown={showFrequencyDropdown} 
            setShowDropdown={setShowFrequencyDropdown} 
            error={frequencyError} 
          />
          <ActionButton onClick={saveReportSettings} disabled={!newEmail || newFrequencies.length === 0}>
            Save
          </ActionButton>
        </Modal>

        <Modal show={showViewEditModal} onClose={() => setShowViewEditModal(false)} title="Report View Settings">
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
          <ActionButton onClick={updateViewSetting} disabled={viewFrequencies.length === 0}>
            Update
          </ActionButton>
        </Modal>

        <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Report Details">
          <EmailInput value={currentEmail} onChange={(e) => setCurrentEmail(e.target.value)} error={emailError} />
          <FrequencyDropdown 
            frequencies={currentFrequencies} 
            setFrequencies={setCurrentFrequencies} 
            showDropdown={showDropdown} 
            setShowDropdown={setShowDropdown} 
            error={frequencyError} 
          />
          <ActionButton onClick={updateReportSettings} disabled={!currentEmail || currentFrequencies.length === 0}>
            Update
          </ActionButton>
        </Modal>

        <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete" maxWidth="max-w-md">
          <div className="p-0">
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
        </Modal>
      </div>
      <Footer2 />
    </>
  );
};

export default ReportSetting;