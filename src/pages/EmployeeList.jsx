import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  fetchEmployeeData,
  createEmployeeWithData,
  updateEmployeeWithData,
  deleteEmployeeById
} from "../api.js";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  Crown,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Grid3X3,
  Table,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check
} from "lucide-react";

const EmployeeList = () => {
  // Data state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  const [searchTerms, setSearchTerms] = useState({ employee: "", admin: "", superAdmin: "" });
  const [getEmail, setGetEmail] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [adminCount, setAdminCount] = useState(0);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [viewMode, setViewMode] = useState("table");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting and pagination state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedEmployees, setPaginatedEmployees] = useState([]);

  const getItemsPerPage = () => {
    if (window.innerWidth < 640) return 5;
    return (viewMode === "grid" || window.innerWidth < 1024) ? 6 : 10;
  };

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

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, activeTab, sortConfig, currentPage, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, sortConfig]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === "table") {
        setViewMode("grid");
      }
    };

    if (window.innerWidth < 1024) {
      setViewMode("grid");
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

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

  // Fetch all employee data using centralized API
  const loadEmployeeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployeeData();
      if (data) {
        const employeesArray = Array.isArray(data) ? data : [];
        setEmployees(employeesArray);
      }
    } catch (error) {
      showToast("Failed to load employee data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter employees by type and search
  const filterEmployees = useCallback(() => {
    const allEmployees = Array.isArray(employees) ? employees : [];
    let filtered = allEmployees;

    // Filter by type
    if (activeTab === "employees") {
      filtered = filtered.filter(emp => emp.is_admin === 0);
    } else if (activeTab === "admins") {
      filtered = filtered.filter(emp => emp.is_admin === 1);
    } else if (activeTab === "superadmins") {
      filtered = filtered.filter(emp => emp.is_admin === 2);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.first_name.toLowerCase().includes(query) ||
        emp.last_name.toLowerCase().includes(query) ||
        (emp.email && emp.email.toLowerCase().includes(query)) ||
        emp.pin.includes(query) ||
        emp.phone_number.includes(query)
      );
    }

    // Sort employees
    filtered.sort((a, b) => {
      let aValue, bValue;
      if (sortConfig.key === "pin") {
        aValue = a.pin;
        bValue = b.pin;
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "name") {
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "contact") {
        aValue = (a.email || a.phone_number || "").toLowerCase();
        bValue = (b.email || b.phone_number || "").toLowerCase();
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else if (sortConfig.key === "role") {
        return sortConfig.direction === "asc" ? a.is_admin - b.is_admin : b.is_admin - a.is_admin;
      } else if (sortConfig.key === "status") {
        return sortConfig.direction === "asc" ? a.is_active - b.is_active : b.is_active - a.is_active;
      }
      return 0;
    });

    setFilteredEmployees(filtered);

    // Update counts
    const adminList = allEmployees.filter((emp) => emp.is_admin === 1);
    const superAdminList = allEmployees.filter((emp) => emp.is_admin === 2);
    setAdmins(adminList);
    setSuperAdmins(superAdminList);
    setAdminCount(adminList.length);
    setSuperAdminCount(superAdminList.length);

    // Paginate results
    const itemsPerPage = getItemsPerPage();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedEmployees(filtered.slice(startIndex, endIndex));

    // Store matched admin for profile
    const cleanEmail = getEmail.trim().toLowerCase();
    const targetList = adminType === "Admin" ? adminList : adminType === "SuperAdmin" ? superAdminList : [];
    const matchedEmployee = targetList.find(emp => (emp.email || "").trim().toLowerCase() === cleanEmail);

    if (matchedEmployee) {
      localStorage.setItem("loggedAdmin", JSON.stringify(matchedEmployee));
    }
  }, [employees, searchQuery, activeTab, sortConfig, currentPage, viewMode, getEmail, adminType]);

  // Toast notification helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Employee type helpers
  const getEmployeeTypeIcon = (isAdmin) => {
    if (isAdmin === 2) return <Crown className="w-4 h-4 text-yellow-600" />;
    if (isAdmin === 1) return <Shield className="w-4 h-4 text-blue-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getEmployeeTypeBadge = (isAdmin) => {
    if (isAdmin === 2) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Super Admin</span>;
    if (isAdmin === 1) return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Employee</span>;
  };

  // Modal handlers
  const openAddModal = (adminLevel = 0) => {
    setEditingEmployee(null);
    setErrors({ first_name: "", last_name: "", phone_number: "", email: "" });
    setFormData({
      pin: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      email: "",
      is_admin: adminLevel,
      is_active: true,
      last_modified_by: "Admin",
      c_id: companyId || "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setErrors({ first_name: "", last_name: "", phone_number: "", email: "" });
    setFormData({
      pin: employee.pin,
      first_name: employee.first_name,
      last_name: employee.last_name,
      phone_number: employee.phone_number,
      email: employee.email || "",
      is_admin: employee.is_admin,
      is_active: employee.is_active,
      last_modified_by: "Admin",
      c_id: employee.c_id,
    });
    setShowAddModal(true);
  };

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

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
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 4) {
      setFormData((prev) => ({ ...prev, pin: digits.slice(-4) }));
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

  // Handle add/edit employee
  const handleAddEmployee = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before submitting", "error");
      return;
    }

    setIsAddLoading(true);
    try {
      if (editingEmployee) {
        await updateEmployeeWithData(editingEmployee.emp_id, formData);
        showToast("Employee updated successfully!");
      } else {
        await createEmployeeWithData(formData);
        showToast("Employee added successfully!");
      }

      setShowAddModal(false);
      setEditingEmployee(null);
      loadEmployeeData();
    } catch (error) {
      let errorMessage;

      // Check for 409 conflict (duplicate email/phone)
      if (error.response?.status === 409) {
        errorMessage = `Email ${formData.email} already exists`;
      } else {
        errorMessage = `Email ${formData.email} already exists` ||
          (editingEmployee ? "Failed to update employee" : "Failed to add employee");
      }

      setShowAddModal(false);
      setEditingEmployee(null);
      showToast(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage), "error");
    } finally {
      setIsAddLoading(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setIsDeleteLoading(true);
    try {
      await deleteEmployeeById(employeeToDelete.emp_id);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      showToast("Employee deleted successfully!");
      loadEmployeeData();
    } catch (error) {
      showToast("Failed to delete employee", "error");
    } finally {
      setIsDeleteLoading(false);
    }
  };

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

      <div className="pt-20 pb-8 flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Employee Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage employees, admins, and super admins
                </p>
              </div>
              {(adminType !== "Admin") && (
                <Button
                  onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                  disabled={activeTab === "superadmins" && adminType !== "Owner"}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span className="truncate">Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}</span>
                </Button>
              )}
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
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Employees</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{employees.filter(emp => emp.is_admin === 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Admins</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{adminCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Super Admins</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{superAdminCount}</p>
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
                { key: "employees", label: "Employees", icon: Users },
                ...(adminType !== "Admin" ? [{ key: "admins", label: "Admins", icon: Shield }] : []),
                ...(adminType !== "Admin" ? [{ key: "superadmins", label: "Super Admins", icon: Crown }] : [])
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
                  <span className="sm:hidden">{key === "superadmins" ? "Super" : label}</span>
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    {employees.filter(emp =>
                      key === "employees" ? emp.is_admin === 0 :
                        key === "admins" ? emp.is_admin === 1 :
                          emp.is_admin === 2
                    ).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
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
                            sortConfig.key === 'contact' ? 'Sort By Contact' : 'Sort'
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
                    { key: 'contact', direction: 'asc', label: 'Sort By Contact A-Z', icon: ArrowUp },
                    { key: 'contact', direction: 'desc', label: 'Sort By Contact Z-A', icon: ArrowDown }
                  ].map(({ key, direction, label, icon: Icon }) => (
                    <button
                      key={`${key}-${direction}`}
                      onClick={() => {
                        setSortConfig({ key, direction });
                        document.getElementById('sort-dropdown').classList.add('hidden');
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors ${sortConfig.key === key && sortConfig.direction === direction
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${direction === 'asc' ? 'text-green-600' : 'text-blue-600'
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

        {/* Employee List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {filteredEmployees.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  No {activeTab === "admins" ? "admins" : activeTab === "superadmins" ? "super admins" : "employees"} found
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery ? "Try adjusting your search criteria." : "Get started by adding your first employee."}
                </p>
                {!searchQuery && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                      disabled={activeTab === "superadmins" && adminType !== "Owner"}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedEmployees.map((employee) => (
                  <Card key={employee.emp_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            {getEmployeeTypeIcon(employee.is_admin)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {`${employee.first_name} ${employee.last_name}`}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              PIN: {employee.pin}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(employee)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(employee)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Role</span>
                        {getEmployeeTypeBadge(employee.is_admin)}
                      </div>

                      {employee.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}

                      {employee.phone_number && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span>{formatPhoneNumber(employee.phone_number)}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#01005a' }}>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-sm text-white">Employee</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Role</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Contact</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Status</th>
                        <th className="text-right p-4 font-medium text-sm text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((employee) => (
                        <tr key={employee.emp_id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                {getEmployeeTypeIcon(employee.is_admin)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {`${employee.first_name} ${employee.last_name}`}
                                </div>
                                <div className="text-xs text-muted-foreground">PIN: {employee.pin}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {getEmployeeTypeBadge(employee.is_admin)}
                          </td>
                          <td className="p-4">
                            <div className="text-sm space-y-1">
                              {employee.email && <div>{employee.email}</div>}
                              {employee.phone_number && <div className="text-muted-foreground">{formatPhoneNumber(employee.phone_number)}</div>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(employee)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(employee)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          )}

          {/* Pagination */}
          {(() => {
            const itemsPerPage = getItemsPerPage();
            return filteredEmployees.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                  <span className="hidden sm:inline">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees</span>
                  <span className="sm:hidden">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}</span>
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium px-2 sm:px-3">
                    {currentPage} of {Math.ceil(filteredEmployees.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEmployees.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredEmployees.length / itemsPerPage)}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                {editingEmployee ? "Edit" : "Add"} {
                  formData.is_admin === 2 ? "Super Admin" :
                    formData.is_admin === 1 ? "Admin" :
                      "Employee"
                }
              </CardTitle>
              <CardDescription className="text-sm">
                {editingEmployee ? "Update employee information" : "Add a new team member"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="text-sm"
                  />
                  {errors.first_name && <p className="text-xs text-red-600">{errors.first_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="text-sm"
                  />
                  {errors.last_name && <p className="text-xs text-red-600">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="(123) 456-7890"
                  value={formData.phone_number}
                  onChange={handlePhoneInput}
                  className="text-sm"
                />
                {errors.phone_number && <p className="text-xs text-red-600">{errors.phone_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">PIN</Label>
                <Input
                  id="pin"
                  placeholder="Auto-generated from phone"
                  value={formData.pin}
                  disabled
                  className="bg-muted text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  PIN is automatically generated from the last 4 digits of phone number
                </p>
              </div>

              {formData.is_admin > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="text-sm"
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEmployee}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isAddLoading}
                >
                  {isAddLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      {editingEmployee ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{editingEmployee ? "Update" : "Add"} Employee</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                <AlertCircle className="w-5 h-5" />
                Delete Employee
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete "{employeeToDelete.first_name} {employeeToDelete.last_name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEmployee}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Employee"
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

export default EmployeeList;