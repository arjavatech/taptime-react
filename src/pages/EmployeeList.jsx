import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { 
  fetchEmployeeData, 
  createEmployeeWithData, 
  updateEmployeeWithData, 
  deleteEmployeeById 
} from "../api.js";

const EmployeeList = () => {
  // Data state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  const [searchTerms, setSearchTerms] = useState({ employee: "", admin: "", superAdmin: "" });
  const [getEmail, setGetEmail] = useState("");

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

  // Form data
  const [formData, setFormData] = useState({
    emp_id: "",
    pin: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    is_admin: 0,
    is_active: true,
    last_modified_by: "Admin",
    c_id: "",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  });

  // Success/error messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState({
    key: "pin",
    direction: "asc",
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSizeOptions = [10, 25, 50, 100];
  const [paginatedEmployees, setPaginatedEmployees] = useState([]);

  // Get values from localStorage
  const limitEmployees = localStorage.getItem("NoOfEmployees") || "";
  const maxEmployees = parseInt(limitEmployees);
  const adminType = localStorage.getItem("adminType");
  const companyId = localStorage.getItem("companyID");

  // Initialize component
  useEffect(() => {
    const email = localStorage.getItem("adminMail") || "";
    setGetEmail(email);
    loadEmployeeData();
  }, []);

  // Fetch all employee data using centralized API
  const loadEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployeeData();
      if (data) {
        const employeesArray = Array.isArray(data) ? data : [];
        setEmployees(employeesArray);
        filterEmployees(employeesArray);
      }
    } catch (error) {
      setErrorMessage("Failed to load employee data");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter employees by type
  const filterEmployees = useCallback(
    (employeesList = employees) => {
      setLoading(true);
      const allEmployees = Array.isArray(employeesList) ? employeesList : [];

      const filtered = allEmployees.filter((emp) => emp.is_admin === 0);
      const adminList = allEmployees.filter((emp) => emp.is_admin === 1);
      const superAdminList = allEmployees.filter((emp) => emp.is_admin === 2);

      setFilteredEmployees(filtered);
      setAdmins(adminList);
      setSuperAdmins(superAdminList);
      setAdminCount(adminList.length);
      setSuperAdminCount(superAdminList.length);
      setCurrentPage(1);
      setLoading(false);

      // Store matched admin for profile
      const cleanEmail = getEmail.trim().toLowerCase();
      const targetList = adminType === "Admin" ? adminList : adminType === "SuperAdmin" ? superAdminList : [];
      const matchedEmployee = targetList.find(emp => (emp.email || "").trim().toLowerCase() === cleanEmail);

      if (matchedEmployee) {
        localStorage.setItem("loggedAdmin", JSON.stringify(matchedEmployee));
      }
    },
    [employees, getEmail, adminType]
  );

  // Unified search function
  const searchByType = useCallback((type, term) => {
    if (!term) {
      filterEmployees();
      return;
    }

    const lowerTerm = term.toLowerCase();
    const adminLevel = type === 'employee' ? 0 : type === 'admin' ? 1 : 2;
    const filtered = employees.filter(
      (emp) =>
        emp.is_admin === adminLevel &&
        (emp.first_name.toLowerCase().includes(lowerTerm) ||
          emp.last_name.toLowerCase().includes(lowerTerm) ||
          emp.pin.includes(term) ||
          emp.phone_number.includes(term))
    );

    if (type === 'employee') {
      setFilteredEmployees(filtered);
    } else if (type === 'admin') {
      setAdmins(filtered);
    } else {
      setSuperAdmins(filtered);
    }
  }, [employees, filterEmployees]);

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
        id: emp.emp_id,
        name: `${emp.first_name} ${emp.last_name}`,
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

    setFormData((prev) => ({ ...prev, phone_number: value }));

    // Auto-generate PIN from last 4 digits
    if (value.length >= 4) {
      setFormData((prev) => ({ ...prev, pin: value.slice(-4) }));
    }
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors = { first_name: "", last_name: "", phone_number: "", email: "" };

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.first_name)) {
      newErrors.first_name = "Only letters allowed";
      isValid = false;
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(formData.last_name)) {
      newErrors.last_name = "Only letters allowed";
      isValid = false;
    }

    // Phone validation
    const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number = "Invalid phone number format";
      isValid = false;
    }

    // Email validation for admins/superadmins
    if (formData.is_admin > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        newErrors.email = "Email is required for admin";
        isValid = false;
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  // Unified modal open function
  const openAddModal = useCallback((adminLevel) => {
    if (adminLevel === 1 && adminCount >= 3) {
      setErrorMessage("Maximum 3 admins allowed");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const resetForm = {
      emp_id: "", pin: "", first_name: "", last_name: "", phone_number: "", email: "",
      is_admin: adminLevel, is_active: true, last_modified_by: "Admin", c_id: ""
    };

    setFormData(resetForm);
    setErrors({ first_name: "", last_name: "", phone_number: "", email: "" });
    setSuccessMessage("");
    setErrorMessage("");
    setIsEditing(false);
    
    if (adminLevel === 0) setShowEmployeeModal(true);
    else if (adminLevel === 1) setShowAdminModal(true);
    else setShowSuperAdminModal(true);
  }, [adminCount]);

  const openEditEmployee = useCallback((employee) => {
    setCurrentEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      pin: employee.pin.trim(),
      first_name: employee.first_name,
      last_name: employee.last_name,
      phone_number: employee.phone_number,
      email: employee.email || "",
      is_admin: employee.is_admin,
      is_active: employee.is_active,
      last_modified_by: "Admin",
      c_id: employee.c_id,
    });
    setIsEditing(true);

    if (employee.is_admin === 0) {
      setShowEmployeeModal(true);
    } else if (employee.is_admin === 1) {
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
    if (!validateForm()) return;

    try {
      setLoading(true);
      // Strip phone number formatting for API
      const phoneDigits = formData.phone_number.replace(/\D/g, '');

      const employeeData = {
        ...formData,
        c_id: companyId,
        phone_number: phoneDigits  // Send unformatted phone
      };

      if (!isEditing) employeeData.emp_id = uuidv4();
      if (!employeeData.email) employeeData.email = "";

      const data = isEditing
        ? await updateEmployeeWithData(formData.emp_id, employeeData)
        : await createEmployeeWithData(employeeData);
        
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setSuccessMessage(isEditing ? "Employee updated successfully" : "Employee added successfully");
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadEmployeeData();
      }
    } catch (error) {
      setErrorMessage("An error occurred while saving the data");
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccessMessage(""); setErrorMessage(""); }, 3000);
      
      if (!errorMessage) {
        setShowEmployeeModal(false);
        setShowAdminModal(false);
        setShowSuperAdminModal(false);
      }
    }
  }, [validateForm, formData, companyId, isEditing, errorMessage, loadEmployeeData]);

  // Delete employee
  const deleteEmployee = useCallback(async () => {
    if (!currentEmployee) return;

    try {
      setLoading(true);
      const data = await deleteEmployeeById(currentEmployee.emp_id);

      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setSuccessMessage("Employee deleted successfully");
        loadEmployeeData();
      }
    } catch (error) {
      setErrorMessage("An error occurred while deleting the employee");
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccessMessage(""); setErrorMessage(""); }, 3000);
      setShowDeleteModal(false);
    }
  }, [currentEmployee]);



  // Update pagination when dependencies change
  useEffect(() => {
    updatePagination();
  }, [currentPage, pageSize, filteredEmployees, updatePagination]);

  // Search effects
  useEffect(() => {
    searchByType('employee', searchTerms.employee);
  }, [searchTerms.employee, searchByType]);

  useEffect(() => {
    searchByType('admin', searchTerms.admin);
  }, [searchTerms.admin, searchByType]);

  useEffect(() => {
    searchByType('superAdmin', searchTerms.superAdmin);
  }, [searchTerms.superAdmin, searchByType]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />

      <div className="overflow-x-hidden flex-grow bg-gray-100 pt-30 pb-10 px-4 sm:px-6">
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
                  onClick={() => openAddModal(0)}
                  disabled={employees.length >= maxEmployees}
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
                      value={searchTerms.employee}
                      onChange={(e) => setSearchTerms(prev => ({...prev, employee: e.target.value}))}
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
                          <tr key={employee.emp_id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {employee.pin}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {employee.first_name} {employee.last_name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                              {formatPhoneNumber(employee.phone_number)}
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
                        onClick={() => openAddModal(1)}
                        disabled={
                          employees.length >= maxEmployees ||
                          adminCount >= 3
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
                          value={searchTerms.admin}
                          onChange={(e) => setSearchTerms(prev => ({...prev, admin: e.target.value}))}
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
                                  key={admin.emp_id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {admin.pin}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {admin.first_name} {admin.last_name}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                                    {formatPhoneNumber(admin.phone_number)}
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
              {(adminType === "Owner" || adminType === "SuperAdmin" || adminType === "customer") && (
                <div className="mb-8 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">SuperAdmin Details</h2>
                    <div className="relative group">
                      <button
                        className="px-2 py-1 w-24 h-10 bg-white text-base border border-[#02066F] text-[#02066F] rounded-md cursor-pointer transition-colors disabled:opacity-50"
                        onClick={() => openAddModal(2)}
                        disabled={employees.length >= maxEmployees || superAdminCount >= 1}
                      >
                        Add Entry
                      </button>
                      {(superAdminCount >= 1 || employees.length >= maxEmployees) && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm rounded py-2 px-3 shadow-lg w-64 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          <p>You have reached the SuperAdmin registration limit. Please<a href="/contact" className="text-yellow-400 hover:underline pl-1">contact!</a></p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-300">
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 flex justify-end gap-2">
                        <label className="text-base font-semibold text-gray-800">Search:</label>
                        <input
                          type="text"
                          value={searchTerms.superAdmin}
                          onChange={(e) => setSearchTerms(prev => ({...prev, superAdmin: e.target.value}))}
                          className="w-64 px-2 py-1 border border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-[#02066F]"
                        />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-[#02066F] text-white">
                            <tr>
                              {["Pin", "Name", "Phone Number", "Action"].map(header => (
                                <th key={header} className="px-4 py-3 text-base font-bold">{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {superAdmins.length > 0 ? superAdmins.map((superAdmin) => (
                              <tr key={superAdmin.emp_id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-center">{superAdmin.pin}</td>
                                <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-center">{superAdmin.first_name} {superAdmin.last_name}</td>
                                <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-center">{formatPhoneNumber(superAdmin.phone_number)}</td>
                                <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-center">
                                  <div className="flex justify-center space-x-2">
                                    <button onClick={() => openEditEmployee(superAdmin)} className="text-[#02066F] p-1">
                                      <i className="fas fa-pencil-alt"></i>
                                    </button>
                                    <button onClick={() => openDeleteModal(superAdmin)} className="text-[#02066F] p-1">
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500">No SuperAdmins found</td>
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
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.first_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F]`}
                      placeholder="First Name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.last_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F]`}
                      placeholder="Last Name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 border-2 ${errors.phone_number
                          ? "border-red-500"
                          : "border-[#02066F]"
                        } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#02066F] font-bold`}
                      placeholder="Phone Number"
                    />
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.pin}
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
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.first_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                      placeholder="First Name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.last_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                      placeholder="Last Name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.phone_number}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.phone_number
                          ? "border-red-500"
                          : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                      placeholder="Phone Number"
                    />
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1"></label>
                    <input
                      type="text"
                      value={formData.pin}
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
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.email ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                      placeholder="Email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
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
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.first_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminLastName"
                      type="text"
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.last_name ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminPhone"
                      type="text"
                      value={formData.phone_number}
                      onChange={handlePhoneInput}
                      maxLength={14}
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.phone_number
                          ? "border-red-500"
                          : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                      placeholder="Phone Number"
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <input
                      id="superAdminPin"
                      type="text"
                      placeholder="Pin"
                      value={formData.pin}
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
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 font-bold border-2 ${errors.email ? "border-red-500" : "border-[#02066F]"
                        } rounded-lg focus:outline-none`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs italic mt-1">
                        {errors.email}
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

      <Footer variant="authenticated" />
    </div>
  );
};

export default EmployeeList;

