import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Header2 from "./Navbar/Header2";
import Footer2 from "./Footer/Footer2";


const EmployeeList = () => {
  // Data state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  const [searchSuperAdminTerm, setSearchSuperAdminTerm] = useState("");
  const [getEmail, setGetEmail] = useState("");
  const [employeesCount, setEmployeesCount] = useState(0);

  // UI state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const [superAdminCount, setSuperAdminCount] = useState(0);

  // API config
  const apiUrlBase =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/employee";
  const deviceApiUrl =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/device";

  // Form data
  const [formData, setFormData] = useState({
    EmpID: "",
    Pin: "",
    FName: "",
    LName: "",
    PhoneNumber: "",
    Email: "",
    IsAdmin: 0,
    IsActive: true,
    LastModifiedBy: "Admin",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    FName: "",
    LName: "",
    PhoneNumber: "",
    Email: "",
  });

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState({
    key: "Pin",
    direction: "asc",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100];
  const [paginatedEmployees, setPaginatedEmployees] = useState([]);
  const [userType, setUserType] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get values from localStorage
  const limitEmployees = localStorage.getItem("NoOfEmployees") || "";
  const maxEmployees = parseInt(limitEmployees);
  const adminType = localStorage.getItem("adminType");
  const deviceID = localStorage.getItem("DeviceID");
  const companyId = localStorage.getItem("companyID");

  // Initialize component
  useEffect(() => {
    const email = localStorage.getItem("adminMail") || "";
    setGetEmail(email);
    fetchEmployeeData();
    fetchDevices();

    const userType = localStorage.getItem("adminType") || "";
    setUserType(userType);
  }, []);

  // Fetch all employee data
  const fetchEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching employees for companyId:", companyId);
      const response = await fetch(`${apiUrlBase}/getall/${companyId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw API response:", data);
      const employeesArray = Array.isArray(data) ? data : [];
      setEmployees(employeesArray);
      console.log("Processed employees array:", employeesArray);
      setEmployeesCount(employeesArray.length);
      filterEmployees(employeesArray);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setErrorMessage("Failed to load employee data");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Fetch device data
  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${deviceApiUrl}/getAll/${companyId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
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
  }, [companyId, employees]);

  // Handle device selection
  const handleDeviceSelection = useCallback(
    (device) => {
      setSelectedDevice(device);
      console.log("Selected device:", device);
      console.log("Device ID to pass:", device.DeviceID);
      // Filter employees by selected device
      filterEmployees(employees, device);
    },
    [employees]
  );

  // Filter employees by type and device
  const filterEmployees = useCallback(
    (employeesList = employees, device = selectedDevice) => {
      setLoading(true);

      // Base filter for device selection
      let deviceFilteredEmployees = Array.isArray(employeesList)
        ? employeesList
        : [];

      if (device && device.DeviceID) {
        console.log(
          "All employees before filtering:",
          employeesList.map((emp) => ({
            EmpID: emp.EmpID,
            DeviceID: emp.DeviceID,
            FName: emp.FName,
            IsAdmin: emp.IsAdmin,
          }))
        );
        console.log("Filtering by DeviceID:", device.DeviceID);
        deviceFilteredEmployees = deviceFilteredEmployees.filter(
          (emp) => emp.DeviceID === device.DeviceID
        );
        console.log(
          `Filtered employees by DeviceID ${device.DeviceID}:`,
          deviceFilteredEmployees.length
        );
        console.log(
          "Filtered employees:",
          deviceFilteredEmployees.map((emp) => ({
            EmpID: emp.EmpID,
            DeviceID: emp.DeviceID,
            FName: emp.FName,
            IsAdmin: emp.IsAdmin,
          }))
        );
      }

      // Filter by employee type from device-filtered employees
      const filtered = deviceFilteredEmployees.filter(
        (emp) => emp.IsAdmin === 0
      );
      setFilteredEmployees(filtered);
      console.log("employee data", filtered);

      const adminList = deviceFilteredEmployees.filter(
        (emp) => emp.IsAdmin === 1
      );
      setAdmins(adminList);

      const superAdminList = deviceFilteredEmployees.filter(
        (emp) => emp.IsAdmin === 2
      );
      setSuperAdmins(superAdminList);

      console.log(
        `Filtered employees: ${filtered.length}, Admins: ${adminList.length}, SuperAdmins: ${superAdminList.length}`
      );
      setAdminCount(adminList.length);
      setSuperAdminCount(superAdminList.length);

      // Force update pagination to reflect new data
      setCurrentPage(1); // Reset to first page
      updatePagination(filtered);
      setLoading(false);

      // Profile page Admin and Super Admin details storing
      let matchedEmployee = null;
      const cleanEmail = getEmail.trim().toLowerCase();

      if (adminType === "Admin") {
        for (const emp of adminList) {
          const empEmail = (emp.Email || "").trim().toLowerCase();
          console.log(`Comparing Admin Email: ${empEmail} === ${cleanEmail}`);
          if (empEmail === cleanEmail) {
            matchedEmployee = emp;
            break;
          }
        }
      } else if (adminType === "SuperAdmin") {
        for (const emp of superAdminList) {
          const empEmail = (emp.Email || "").trim().toLowerCase();
          console.log(
            `Comparing SuperAdmin Email: ${empEmail} === ${cleanEmail}`
          );
          if (empEmail === cleanEmail) {
            matchedEmployee = emp;
            break;
          }
        }
      }

      console.log("Matched Employee:", matchedEmployee);

      if (matchedEmployee) {
        localStorage.setItem("loggedAdmin", JSON.stringify(matchedEmployee));
      } else {
        console.log("No matching employee found.");
      }
    },
    [employees, selectedDevice, getEmail, adminType]
  );

  // Search functions
  const searchEmployees = useCallback(() => {
    if (!searchTerms) {
      filterEmployees();
      return;
    }

    // Base filter for device selection
    let deviceFilteredEmployees = Array.isArray(employees) ? employees : [];
    if (selectedDevice && selectedDevice.DeviceID) {
      deviceFilteredEmployees = employees.filter(
        (emp) =>
          emp.DeviceID ===
          (deviceID != undefined || deviceID == null
            ? selectedDevice.DeviceID
            : deviceID)
      );
    }

    const term = searchTerms.toLowerCase();
    const filtered = deviceFilteredEmployees.filter(
      (emp) =>
        emp.IsAdmin === 0 &&
        (emp.FName.toLowerCase().includes(term) ||
          emp.LName.toLowerCase().includes(term) ||
          emp.Pin.includes(searchTerms) ||
          emp.PhoneNumber.includes(searchTerms))
    );
    setFilteredEmployees(filtered);
    updatePagination(filtered);
  }, [searchTerms, employees, selectedDevice, deviceID, filterEmployees]);

  const searchAdmins = useCallback(() => {
    if (!searchTerm) {
      filterEmployees();
      return;
    }

    // Base filter for device selection
    let deviceFilteredEmployees = employees;
    if (selectedDevice && selectedDevice.DeviceID) {
      deviceFilteredEmployees = employees.filter(
        (emp) =>
          emp.DeviceID ===
          (deviceID != undefined || deviceID == null
            ? selectedDevice.DeviceID
            : deviceID)
      );
    }

    const term = searchTerm.toLowerCase();
    const adminList = deviceFilteredEmployees.filter(
      (emp) =>
        emp.IsAdmin === 1 &&
        (emp.FName.toLowerCase().includes(term) ||
          emp.LName.toLowerCase().includes(term) ||
          emp.Pin.includes(searchTerm) ||
          emp.PhoneNumber.includes(searchTerm))
    );
    setAdmins(adminList);
  }, [searchTerm, employees, selectedDevice, deviceID, filterEmployees]);

  const searchSuperAdmins = useCallback(() => {
    if (!searchSuperAdminTerm) {
      filterEmployees();
      return;
    }

    // Base filter for device selection
    let deviceFilteredEmployees = employees;
    if (selectedDevice && selectedDevice.DeviceID) {
      deviceFilteredEmployees = employees.filter(
        (emp) =>
          emp.DeviceID ===
          (deviceID != undefined || deviceID == null
            ? selectedDevice.DeviceID
            : deviceID)
      );
    }

    const term = searchSuperAdminTerm.toLowerCase();
    const superAdminList = deviceFilteredEmployees.filter(
      (emp) =>
        emp.IsAdmin === 2 &&
        (emp.FName.toLowerCase().includes(term) ||
          emp.LName.toLowerCase().includes(term) ||
          emp.Pin.includes(searchSuperAdminTerm) ||
          emp.PhoneNumber.includes(searchSuperAdminTerm))
    );
    setSuperAdmins(superAdminList);
  }, [
    searchSuperAdminTerm,
    employees,
    selectedDevice,
    deviceID,
    filterEmployees,
  ]);

  // Sorting function
  const requestSort = useCallback(
    (key) => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      setSortConfig({ key, direction });

      const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      });
      setFilteredEmployees(sortedEmployees);
      updatePagination(sortedEmployees);
    },
    [sortConfig, filteredEmployees]
  );

  // Pagination functions
  const updatePagination = useCallback(
    (employeesList = filteredEmployees) => {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const paginated = employeesList.slice(start, end);
      setPaginatedEmployees(paginated);
      const employeeData = paginated.map((emp) => ({
        id: emp.EmpID,
        name: `${emp.FName} ${emp.LName}`,
      }));

      localStorage.setItem("employeeData", JSON.stringify(employeeData));
    },
    [currentPage, pageSize, filteredEmployees]
  );

  const handlePageSizeChange = useCallback(
    (newSize) => {
      setPageSize(newSize);
      setCurrentPage(1);
      updatePagination();
    },
    [updatePagination]
  );

  // Format phone number display
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return "";
    let value = phone.replace(/\D/g, "");
    if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
        6,
        10
      )}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else {
      value = `(${value}`;
    }
    return value;
  }, []);

  // Handle phone input with auto-formatting
  const handlePhoneInput = useCallback((e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);

    if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }

    setFormData((prev) => ({ ...prev, PhoneNumber: value }));

    // Auto-generate PIN from last 4 digits
    if (value.length >= 4) {
      setFormData((prev) => ({ ...prev, Pin: value.slice(-4) }));
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors = { FName: "", LName: "", PhoneNumber: "", Email: "" };

    // First name validation
    if (!formData.FName.trim()) {
      newErrors.FName = "First name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.FName)) {
      newErrors.FName = "Only letters allowed";
      isValid = false;
    }

    // Last name validation
    if (!formData.LName.trim()) {
      newErrors.LName = "Last name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.LName)) {
      newErrors.LName = "Only letters allowed";
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
    if (!formData.PhoneNumber) {
      newErrors.PhoneNumber = "Phone number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.PhoneNumber)) {
      newErrors.PhoneNumber = "Invalid phone number format";
      isValid = false;
    }

    // Email validation for admins/superadmins
    if (formData.IsAdmin > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.Email) {
        newErrors.Email = "Email is required for admin";
        isValid = false;
      } else if (!emailRegex.test(formData.Email)) {
        newErrors.Email = "Invalid email format";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  // Modal open functions
  const openAddEmployee = useCallback(() => {
    console.log("openAddEmployee called");
    setFormData({
      EmpID: "",
      Pin: "",
      FName: "",
      LName: "",
      PhoneNumber: "",
      Email: "",
      IsAdmin: 0,
      IsActive: true,
      LastModifiedBy: "Admin",
    });
    setErrors({ FName: "", LName: "", PhoneNumber: "", Email: "" });
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(false);
    setShowEmployeeModal(true);
    console.log("Employee modal opened, IsAdmin set to:", 0);
    console.log("isEditing:", false);
    console.log("showEmployeeModal:", true);
    console.log("showAdminModal:", false);
    console.log("showSuperAdminModal:", false);
  }, []);

  const openAddAdmin = useCallback(() => {
    console.log("openAddAdmin called, adminCount:", adminCount);
    if (adminCount >= 3) {
      setErrorMessage("Maximum 3 admins allowed");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setFormData({
      EmpID: "",
      Pin: "",
      FName: "",
      LName: "",
      PhoneNumber: "",
      Email: "",
      IsAdmin: 1,
      IsActive: true,
      LastModifiedBy: "Admin",
    });
    setErrors({ FName: "", LName: "", PhoneNumber: "", Email: "" });
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(false);
    setShowAdminModal(true);
    console.log("Admin modal opened, isEditing:", false);
  }, [adminCount]);

  const openAddSuperAdmin = useCallback(() => {
    console.log("openAddSuperAdmin called");
    setFormData({
      EmpID: "",
      Pin: "",
      FName: "",
      LName: "",
      PhoneNumber: "",
      Email: "",
      IsAdmin: 2,
      IsActive: true,
      LastModifiedBy: "Admin",
    });
    setErrors({ FName: "", LName: "", PhoneNumber: "", Email: "" });
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(false);
    setShowSuperAdminModal(true);
    console.log("SuperAdmin modal opened, isEditing:", false);
  }, []);

  const openEditEmployee = useCallback((employee) => {
    setCurrentEmployee(employee);
    setFormData({
      EmpID: employee.EmpID,
      Pin: employee.Pin,
      FName: employee.FName,
      LName: employee.LName,
      PhoneNumber: employee.PhoneNumber,
      Email: employee.Email || "",
      IsAdmin: employee.IsAdmin,
      IsActive: employee.IsActive,
      LastModifiedBy: "Admin",
    });
    setIsEditing(true);

    if (employee.IsAdmin === 0) {
      setShowEmployeeModal(true);
    } else if (employee.IsAdmin === 1) {
      setShowAdminModal(true);
    } else {
      setShowSuperAdminModal(true);
    }
  }, []);

  const openDeleteModal = useCallback((employee) => {
    setCurrentEmployee(employee);
    setShowDeleteModal(true);
  }, []);

  // Form submission
  const submitForm = useCallback(async () => {
    console.log("submitForm called, formData.IsAdmin:", formData.IsAdmin);

    if (!validateForm()) return;

    // Validate device selection
    if (!selectedDevice) {
      setErrorMessage("Please select a device before adding employee");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Before creating employeeData, formData.IsAdmin:",
        formData.IsAdmin
      );

      const employeeData = {
        ...formData,
        CID: companyId,
        DeviceID:
          adminType != "Owner"
            ? deviceID
            : selectedDevice
            ? selectedDevice.DeviceID
            : null,
      };

      console.log(
        "After creating employeeData, employeeData.IsAdmin:",
        employeeData.IsAdmin
      );

      // Generate UUID for new employee creation
      if (!isEditing) {
        employeeData.EmpID = uuidv4();
        console.log("Generated EmpID for new employee:", employeeData.EmpID);
      }

      // Convert empty email string to null for both create and update
      if (employeeData.Email === "" || employeeData.Email === undefined) {
        employeeData.Email = "";
      }

      console.log("Submitting employee data:", employeeData);
      console.log("IsAdmin value being sent:", employeeData.IsAdmin);
      console.log("Form data IsAdmin:", formData.IsAdmin);
      console.log("adminType:", adminType);
      console.log("deviceID from localStorage:", deviceID);
      console.log("selectedDevice:", selectedDevice);
      console.log("Final DeviceID being sent:", employeeData.DeviceID);

      const apiUrl = isEditing
        ? `${apiUrlBase}/update/${formData.EmpID}`
        : `${apiUrlBase}/create`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setSuccessMessage(
          isEditing
            ? "Employee updated successfully"
            : "Employee added successfully"
        );
        console.log("Success! Refreshing employee data...");
        // Add delay to ensure database is updated
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await fetchEmployeeData();
        // If still no data, try one more time after additional delay
        if (employees.length === 0) {
          console.log(
            "No employees found, trying again after additional delay..."
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await fetchEmployeeData();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage("An error occurred while saving the data");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);

      if (!errorMessage) {
        setShowEmployeeModal(false);
        setShowAdminModal(false);
        setShowSuperAdminModal(false);
        // Reset form data
        setFormData({
          EmpID: "",
          Pin: "",
          FName: "",
          LName: "",
          PhoneNumber: "",
          Email: "",
          IsAdmin: 0,
          IsActive: true,
          LastModifiedBy: "Admin",
        });
      }
    }
  }, [
    validateForm,
    selectedDevice,
    formData,
    companyId,
    adminType,
    deviceID,
    isEditing,
    errorMessage,
    fetchEmployeeData,
    employees.length,
  ]);

  // Delete employee
  const deleteEmployee = useCallback(async () => {
    if (!currentEmployee) return;

    try {
      setLoading(true);
      // Regular delete for employees
      const response = await fetch(
        `${apiUrlBase}/delete/${currentEmployee.EmpID}/Admin`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setSuccessMessage("Employee deleted successfully");
        fetchEmployeeData();
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      setErrorMessage("An error occurred while deleting the employee");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
      setShowDeleteModal(false);
    }
  }, [currentEmployee, fetchEmployeeData]);

  // DROPDOWN DEVICE CLICK BODY ACTION
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
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

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const selectDevice = useCallback(
    (device) => {
      handleDeviceSelection(device);
      setDropdownOpen(false);
    },
    [handleDeviceSelection]
  );

  // Update pagination when dependencies change
  useEffect(() => {
    updatePagination();
  }, [currentPage, pageSize, filteredEmployees, updatePagination]);

  // Search effects
  useEffect(() => {
    searchEmployees();
  }, [searchTerms, searchEmployees]);

  useEffect(() => {
    searchAdmins();
  }, [searchTerm, searchAdmins]);

  useEffect(() => {
    searchSuperAdmins();
  }, [searchSuperAdminTerm, searchSuperAdmins]);

  return (
    <>
    <Header2/>
     
      <div className="overflow-x-hidden min-h-screen bg-gray-100 pt-30 pb-10 px-4 sm:px-6">
        {/* Loading Overlay */}
        {loading && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg">
            {errorMessage}
          </div>
        )}

        {/* Device Dropdown Section */}
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
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}

              {/* Dropdown */}
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
        {/* End Device Dropdown */}

        {/* Employee Section */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Employee Details
              </h2>

              {/* Wrap the button in a group container */}
              <div className="relative group w-fit">
                <button
                  className="px-2 py-1 md:px-2 md:py-1 w-24 h-10 md:w-26 text-center items-center bg-white text-base md:text-lg border border-[#02066F] text-[#02066F] rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={openAddEmployee}
                  disabled={employees.length >= maxEmployees || !selectedDevice}
                >
                  Add Entry
                </button>

                {employees.length >= maxEmployees && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded py-2 px-3 shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                    <p>
                      You have reached the Employee registration limit. If you
                      need to add more Employee, please
                      <a
                        href="/contact"
                        className="text-yellow-400 hover:underline"
                      >
                        contact!
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
              <div className="p-4 sm:p-6 overflow-x-auto">
                <div className="flex flex-col sm:flex-row justify-between items-star sm:items-center mb-4 gap-4">
                  <div className="flex items-center space-x-2 md:mt-[-16px] text-center justify-center">
                    <span className="text-base font-semibold text-gray-700">
                      Show
                    </span>
                    <select
                      className="border border-gray-400 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                      value={pageSize}
                      onChange={(e) => {
                        handlePageSizeChange(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      {pageSizeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="text-base font-semibold text-gray-700">
                      entries
                    </span>
                  </div>

                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                    <label className="text-base font-semibold text-gray-800">
                      Search:
                    </label>
                    <input
                      type="text"
                      value={searchTerms}
                      onChange={(e) => setSearchTerms(e.target.value)}
                      className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                      placeholder=""
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#02066F] text-white">
                      <tr>
                        <th
                          className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer"
                          onClick={() => requestSort("Pin")}
                        >
                          {/* <div className="flex items-center"> */}
                          Pin
                          {sortConfig.key === "Pin" ? (
                            <span className="ml-6 text-lg">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          ) : (
                            <span className="ml-6 text-lg">↑↓</span>
                          )}
                          {/* </div> */}
                        </th>
                        <th
                          className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer"
                          onClick={() => requestSort("FName")}
                        >
                          {/* <div className="flex items-center"> */}
                          Name
                          {sortConfig.key === "FName" ? (
                            <span className="ml-6 text-lg">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          ) : (
                            <span className="ml-6 text-lg">↑↓</span>
                          )}
                          {/* </div> */}
                        </th>
                        <th
                          className="px-6 py-3 text-center text-base font-bold tracking-wider cursor-pointer"
                          onClick={() => requestSort("PhoneNumber")}
                        >
                          {/* <div className="flex items-center"> */}
                          Phone Number
                          {sortConfig.key === "PhoneNumber" ? (
                            <span className="ml-6 text-lg">
                              {sortConfig.direction === "asc" ? "↑" : "↓"}
                            </span>
                          ) : (
                            <span className="ml-6 text-lg">↑↓</span>
                          )}
                          {/* </div> */}
                        </th>
                        <th className="px-6 py-3 text-center text-base font-bold tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((employee) => (
                          <tr key={employee.EmpID} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {employee.Pin}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {employee.FName} {employee.LName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {formatPhoneNumber(employee.PhoneNumber)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => openEditEmployee(employee)}
                                  className="text-[#02066F] p-1 cursor-pointer"
                                >
                                  <i className="fas fa-pencil-alt"></i>
                                </button>
                                <button
                                  onClick={() => openDeleteModal(employee)}
                                  className="text-[#02066F] p-1 cursor-pointer"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-4 text-center text-sm text-gray-500"
                          >
                            No employees found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4">
                  <div className="text-base font-semibold text-gray-700 mb-2 sm:mb-0">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      filteredEmployees.length
                    )}{" "}
                    to
                    {Math.min(
                      currentPage * pageSize,
                      filteredEmployees.length
                    )}{" "}
                    of
                    {filteredEmployees.length} entries
                  </div>
                  <div className="flex space-x-1">
                    <button
                      className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((prev) => prev - 1);
                      }}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-1 rounded-md text-base font-semibold text-gray-500 disabled:opacity-50"
                      disabled={
                        currentPage * pageSize >= filteredEmployees.length
                      }
                      onClick={() => {
                        setCurrentPage((prev) => prev + 1);
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Section (only for SuperAdmin) */}

          {adminType !== "Admin" && (
            <>
              {/* {adminType === 'SuperAdmin'} */}
              {adminType !== "Admin" && (
                <div className="mb-8 pt-4">
                  <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      Admin Details
                    </h2>

                    <div className="relative group w-fit">
                      <button
                        className="px-2 py-1 md:px-2 md:py-1 w-24 h-10 md:w-26 text-center items-center bg-white text-base md:text-lg border border-[#02066F] text-[#02066F] rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={openAddAdmin}
                        disabled={
                          employees.length >= maxEmployees ||
                          adminCount >= 3 ||
                          !selectedDevice
                        }
                      >
                        Add Entry
                      </button>

                      {(adminCount >= 3 ||
                        employees.length >= maxEmployees) && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded py-2 px-3 shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                          <p>
                            You have reached the Admin registration limit. If
                            you need to add more Admins, please
                            <a
                              href="/contact"
                              className="text-yellow-400 hover:underline"
                            >
                              contact!
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
                    <div className="p-4 sm:p-6 overflow-x-auto">
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                        <label className="text-base font-semibold text-gray-800">
                          Search:
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                          placeholder=""
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#02066F] text-white">
                            <tr>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Pin
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Phone Number
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {admins.length > 0 ? (
                              admins.map((admin) => (
                                <tr
                                  key={admin.EmpID}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {admin.Pin}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {admin.FName} {admin.LName}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {formatPhoneNumber(admin.PhoneNumber)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() => openEditEmployee(admin)}
                                        className="text-[#02066F] p-1 cursor-pointer"
                                      >
                                        <i className="fas fa-pencil-alt"></i>
                                      </button>
                                      <button
                                        onClick={() => openDeleteModal(admin)}
                                        className="text-[#02066F] p-1 cursor-pointer"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-4 text-center text-sm text-gray-500"
                                >
                                  No admins found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SuperAdmin Section */}

              {adminType === "Owner" && (
                <div className="mb-8 pt-4">
                  <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      SuperAdmin Details
                    </h2>

                    <div className="relative group w-fit">
                      <button
                        className="px-2 py-1 md:px-2 md:py-1 w-26 h-10 md:w-26 text-center items-center bg-white text-base md:text-lg border border-[#02066F] text-[#02066F] rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={openAddSuperAdmin}
                        disabled={
                          employees.length >= maxEmployees ||
                          superAdminCount >= 1 ||
                          !selectedDevice
                        }
                      >
                        Add Entry
                      </button>

                      {(superAdminCount >= 1 ||
                        employees.length >= maxEmployees) && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded py-2 px-3 shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-800 z-20 pointer-events-none">
                          <p>
                            You have reached the SuperAdmin registration limit.
                            Please
                            <a
                              href="/contact"
                              className="text-yellow-400 hover:underline"
                            >
                              contact!
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
                    <div className="p-4 sm:p-6 overflow-x-auto">
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                        <label className="text-base font-semibold text-gray-800">
                          Search:
                        </label>
                        <input
                          type="text"
                          value={searchSuperAdminTerm}
                          onChange={(e) =>
                            setSearchSuperAdminTerm(e.target.value)
                          }
                          className="w-full sm:w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                          placeholder=""
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#02066F] text-white">
                            <tr>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Pin
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Phone Number
                              </th>
                              <th className="px-4 py-3 text-base font-bold tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {superAdmins.length > 0 ? (
                              superAdmins.map((superAdmin) => (
                                <tr
                                  key={superAdmin.EmpID}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {superAdmin.Pin}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {superAdmin.FName} {superAdmin.LName}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {formatPhoneNumber(superAdmin.PhoneNumber)}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    <div className="flex justify-center space-x-2">
                                      <button
                                        onClick={() =>
                                          openEditEmployee(superAdmin)
                                        }
                                        className="text-[#02066F] p-1 cursor-pointer"
                                      >
                                        <i className="fas fa-pencil-alt"></i>
                                      </button>
                                      <button
                                        onClick={() =>
                                          openDeleteModal(superAdmin)
                                        }
                                        className="text-[#02066F] p-1 cursor-pointer"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-4 text-center text-sm text-gray-500"
                                >
                                  No SuperAdmins found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Employee Modal */}
        {showEmployeeModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowEmployeeModal(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-xs mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full bg-[#02066F] justify-between p-3 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-white">
                  Employee Details
                </h3>
                <button
                  className="text-gray-400 hover:text-white cursor-pointer text-5xl"
                  onClick={() => setShowEmployeeModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                {/* Device Info Display */}
                {selectedDevice && (
                  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Device:</strong>
                      {selectedDevice.DeviceName}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.FName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          FName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.FName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F]`}
                      placeholder="First Name"
                    />
                    {errors.FName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.FName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.LName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          LName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.LName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F]`}
                      placeholder="Last Name"
                    />
                    {errors.LName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.LName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.PhoneNumber}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 border-2 ${
                        errors.PhoneNumber
                          ? "border-red-500"
                          : "border-[#02066F]"
                      } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F] font-bold`}
                      placeholder="Phone Number"
                    />
                    {errors.PhoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.PhoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.Pin}
                      className="w-full px-3 py-2 border-2 border-[#02066F] rounded-lg bg-gray-300 font-bold focus:outline-none"
                      disabled
                      placeholder="Instructor Pin"
                      readOnly
                    />
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/80 transition-colors cursor-pointer"
                    >
                      {isEditing ? "Update" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Admin Modal */}
        {showAdminModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowAdminModal(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-xs mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full bg-[#02066F] justify-between p-3 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-white">Admin Details</h3>
                <button
                  className="text-gray-400 hover:text-white cursor-pointer text-5xl"
                  onClick={() => setShowAdminModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                {/* Device Info Display */}
                {selectedDevice && (
                  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Device:</strong>
                      {selectedDevice.DeviceName}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.FName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          FName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.FName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                      placeholder="First Name"
                    />
                    {errors.FName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.FName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.LName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          LName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.LName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                      placeholder="Last Name"
                    />
                    {errors.LName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.LName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.PhoneNumber}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.PhoneNumber
                          ? "border-red-500"
                          : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                      placeholder="Phone Number"
                    />
                    {errors.PhoneNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.PhoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.Pin}
                      className="w-full px-3 py-2 font-bold border-2 border-[#02066F] rounded-lg bg-gray-200 focus:outline-none"
                      disabled
                      placeholder="Pin"
                      readOnly
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="email"
                      value={formData.Email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          Email: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.Email ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                      placeholder="Email"
                    />
                    {errors.Email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.Email}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/90 transition-colors cursor-pointer"
                    >
                      {isEditing ? "Update" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* SuperAdmin Modal */}
        {showSuperAdminModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            onClick={() => setShowSuperAdminModal(false)}
          >
            <div
              className="bg-white rounded-lg w-full max-w-xs mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold p-2 text-white">
                  SuperAdmin Details
                </h3>
                <button
                  className="text-gray-400 hover:text-white cursor-pointer text-5xl"
                  onClick={() => setShowSuperAdminModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="p-6">
                {/* Device Info Display */}
                {selectedDevice && (
                  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Device:</strong>
                      {selectedDevice.DeviceName}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitForm();
                  }}
                >
                  <div className="mb-4">
                    <input
                      id="superAdminFirstName"
                      type="text"
                      placeholder="First Name"
                      value={formData.FName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          FName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.FName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                    />
                    {errors.FName && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.FName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminLastName"
                      type="text"
                      placeholder="Last Name"
                      value={formData.LName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          LName: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.LName ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                    />
                    {errors.LName && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.LName}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminPhone"
                      type="text"
                      value={formData.PhoneNumber}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.PhoneNumber
                          ? "border-red-500"
                          : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                      placeholder="Phone Number"
                    />
                    {errors.PhoneNumber && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.PhoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminPin"
                      type="text"
                      placeholder="Pin"
                      value={formData.Pin}
                      className="w-full px-3 py-2 font-bold border-2 border-[#02066F] rounded-lg bg-gray-200 focus:outline-none"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminEmail"
                      type="email"
                      placeholder="Email"
                      value={formData.Email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          Email: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${
                        errors.Email ? "border-red-500" : "border-[#02066F]"
                      } rounded-lg focus:outline-none`}
                    />
                    {errors.Email && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.Email}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#02066F] text-white rounded-md cursor-pointer hover:opacity-80"
                    >
                      {isEditing ? "Update" : "Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
            role="dialog"
            aria-modal="true"
            tabIndex="-1"
            onClick={() => setShowDeleteModal(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowDeleteModal(false);
            }}
          >
            <div
              className="bg-white rounded-lg w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center rounded-t-md text-center">
                <h3 className="text-xl font-bold text-center text-white p-2">
                  Delete
                </h3>
                <button
                  className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="py-6 px-0">
                {currentEmployee ? (
                  <p className="text-center text-gray-800 font-bold text-lg mb-6">
                    Are you sure, you want to remove the{" "}
                    {currentEmployee.IsAdmin === 0
                      ? "employee"
                      : currentEmployee.IsAdmin === 1
                      ? "Admin"
                      : "SuperAdmin"}
                    ?
                  </p>
                ) : (
                  <p className="text-center font-bold mb-6">
                    Are you sure, you want to remove the employee?
                  </p>
                )}
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={deleteEmployee}
                    className="px-6 py-2 bg-[#02066F] opacity-80 hover:opacity-60 text-white rounded-md cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-2 border border-[#02066F] text-[#02066F] rounded-md hover:bg-gray-100 cursor-pointer"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer2/>
    </>
  );
};

export default EmployeeList;
