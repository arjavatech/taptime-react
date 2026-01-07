import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Footer from "../components/layout/Footer";
import { useAuth } from "../contexts/AuthContext";
import { STORAGE_KEYS } from "../constants/index.js";

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
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  Upload,
  FileText,
  X
} from "lucide-react";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";
import { GridIcon } from "../components/icons/GridIcon";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const EmployeeList = () => {
  const { checkAccountDeletion } = useAuth();
  // Utility function to capitalize first letter of each word
  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Data state
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [getEmail, setGetEmail] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState("employees");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [adminCount, setAdminCount] = useState(0);
  const [superAdminCount, setSuperAdminCount] = useState(0);
  const [viewMode, setViewMode] = useState("table");
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [centerLoading, setCenterLoading] = useState({ show: false, message: "" });
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState("");

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
    return (viewMode === "grid" || window.innerWidth < 1024) ? 6 : 10;
  };

  // Get values from localStorage
  const limitEmployees = localStorage.getItem("NoOfEmployees") || "";
  const maxEmployees = parseInt(limitEmployees);
  const adminType = localStorage.getItem("adminType");
  const companyId = localStorage.getItem("companyID");
  const loggedAdminEmail = localStorage.getItem("adminMail") || "";

  // Initialize component
  useEffect(() => {
    const email = localStorage.getItem("adminMail") || "";
    setGetEmail(email);
    loadEmployeeData();
  }, []); // Empty dependency array - only run once on mount

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
      setGlobalLoading(true);
      const data = await fetchEmployeeData();
      if (data) {
        const employeesArray = Array.isArray(data) ? data : [];
        setEmployees(employeesArray);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setGlobalLoading(false);
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

  // Center loading helper
  const showCenterLoading = (message) => {
    setCenterLoading({ show: true, message });
  };

  const hideCenterLoading = () => {
    setCenterLoading({ show: false, message: "" });
  };

  // Parse duplicate error from backend
  const parseDuplicateError = (errorDetail) => {
    if (!errorDetail) return null;

    const detail = errorDetail.toLowerCase();

    if (detail.includes('pin') || detail.includes('employee_c_id_pin_unique')) {
      return { field: 'pin', message: 'PIN already exists. Please use a different phone number.' };
    }
    if (detail.includes('email')) {
      return { field: 'email', message: 'Email already exists. Please use a different email address.' };
    }
    if (detail.includes('phone')) {
      return { field: 'phone_number', message: 'Phone number already exists. Please use a different phone number.' };
    }

    return { field: 'general', message: errorDetail };
  };

  // Generate alternative PIN by changing first digit
  const generateAlternativePin = (currentPin, existingPins) => {
    for (let i = 0; i <= 9; i++) {
      const newPin = i.toString() + currentPin.slice(1);
      if (!existingPins.includes(newPin) && newPin !== currentPin) {
        return newPin;
      }
    }
    return null;
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
    // Check employee limit before opening modal
    if (!editingEmployee && maxEmployees && employees.length >= maxEmployees) {
      setModalError(`Employee limit reached. Maximum ${maxEmployees} employees allowed.`);
      return;
    }
    
    setEditingEmployee(null);
    setErrors({ first_name: "", last_name: "", phone_number: "", email: "" });
    setModalError("");
    setModalSuccess("");
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
    // Prevent super admin from editing their own account
    if (adminType === "SuperAdmin" && employee.is_admin === 2 && 
        employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()) {
      return;
    }
    
    setEditingEmployee(employee);
    setErrors({ first_name: "", last_name: "", phone_number: "", email: "" });
    setModalError("");
    setModalSuccess("");
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
    // Prevent super admin from deleting their own account
    if (adminType === "SuperAdmin" && employee.is_admin === 2 && 
        employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()) {
      return;
    }
    
    setEmployeeToDelete(employee);
    setDeleteError("");
    setDeleteSuccess("");
    setShowDeleteModal(true);
  };

  // Format phone number display with country code
  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return "";
    
    const digits = phone.replace(/\D/g, "");
    
    if (digits.length > 10 || (digits.length === 11 && digits.startsWith('1'))) {
      const countryCode = digits.slice(0, -10);
      const areaCode = digits.slice(-10, -7);
      const firstPart = digits.slice(-7, -4);
      const lastPart = digits.slice(-4);
      return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
    }
    
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    return phone;
  }, []);

  // Handle phone input with auto-formatting
  const handlePhoneInput = useCallback((phone) => {
    setFormData((prev) => ({ ...prev, phone_number: phone }));

    // Auto-generate PIN from last 4 digits
    const digits = phone.replace(/\D/g, '').replace(/^1/, '');
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
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
      isValid = false;
    } else {
      const digits = formData.phone_number.replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone_number = "Invalid phone number format";
        isValid = false;
      }
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
      return;
    }

    // Check employee limit for new employees
    if (!editingEmployee && maxEmployees && employees.length >= maxEmployees) {
      setModalError(`Employee limit reached. Maximum ${maxEmployees} employees allowed.`);
      return;
    }

    // Check for duplicate email when editing or creating admin/superadmin
    if (formData.is_admin > 0 && formData.email) {
      // Prevent using Owner's email
      if (adminType === "Owner" && formData.email.toLowerCase() === loggedAdminEmail.toLowerCase()) {
        setModalError("Owner email addresses cannot be used for this action.");
        setIsSubmitting(false);
        return;
      }
      
      const emailExists = employees.some(emp => 
        (!editingEmployee || emp.emp_id !== editingEmployee.emp_id) && 
        emp.email && 
        emp.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (emailExists) {
        setModalError("Email already exists. Please use a different email address.");
        setIsSubmitting(false);
        return;
      }
    }

    setModalError("");
    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        await updateEmployeeWithData(editingEmployee.emp_id, formData);
        setModalSuccess("Employee updated successfully!");
        setIsSubmitting(false);

        setTimeout(() => {
          setShowAddModal(false);
          setEditingEmployee(null);
          setModalSuccess("");
          loadEmployeeData();
        }, 3000);
        return;
      } else {
        await createEmployeeWithData(formData);
      }

      // Success - close modal and refresh
      setShowAddModal(false);
      setEditingEmployee(null);
      loadEmployeeData();
    } catch (error) {
      const duplicateError = parseDuplicateError(error.detail || error.message);

      if (duplicateError?.field === 'pin' && !editingEmployee) {
        // Try auto-generating alternative PIN
        const existingPins = employees.map(e => e.pin);
        const newPin = generateAlternativePin(formData.pin, existingPins);

        if (newPin) {
          // Retry with new PIN
          try {
            const newFormData = { ...formData, pin: newPin };
            await createEmployeeWithData(newFormData);

            // Show success message with original and new PIN
            setModalSuccess(`PIN ${formData.pin} was already taken. Created with PIN: ${newPin}`);
            setIsSubmitting(false);

            // Close modal after 5 seconds for reading
            setTimeout(() => {
              setShowAddModal(false);
              setEditingEmployee(null);
              setModalSuccess("");
              loadEmployeeData();
            }, 5000);
            return;
          } catch (retryError) {
            setModalError(parseDuplicateError(retryError.detail || retryError.message)?.message || 'Failed to create employee');
          }
        } else {
          setModalError('PIN already exists and no alternative PIN available. Please use a different phone number.');
        }
      } else if (duplicateError) {
        setModalError(duplicateError.message);
      } else {
        setModalError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setDeleteError("");
    setIsDeleting(true);

    try {
      await deleteEmployeeById(employeeToDelete.emp_id);
      
      // Check if the deleted employee is the current logged-in user
      const currentUserEmail = localStorage.getItem('adminMail');
      if (currentUserEmail && employeeToDelete.email && 
          currentUserEmail.toLowerCase() === employeeToDelete.email.toLowerCase()) {
        // Trigger immediate account deletion check for current user
        await checkAccountDeletion(currentUserEmail);
        return; // Don't show success message as user will be logged out
      }
      
      setDeleteSuccess("Employee deleted successfully!");

      setTimeout(() => {
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
        setDeleteSuccess("");
        loadEmployeeData();
      }, 1000);
    } catch (error) {
      setDeleteError(error.message || "Failed to delete employee");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk upload handlers
  const openBulkUploadModal = (adminLevel = 0) => {
    setSelectedFile(null);
    setBulkUploadResults(null);
    setBulkUploadError("");
    setBulkUploadSuccess("");
    setFormData(prev => ({ ...prev, is_admin: adminLevel }));
    setShowBulkUploadModal(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setBulkUploadError('Only CSV and Excel files are allowed.');
      return;
    }

    setBulkUploadError('');
    setSelectedFile(file);
  };

  const parseFileData = (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error('CSV parsing error: ' + results.errors[0].message));
            } else {
              resolve(results.data);
            }
          },
          error: (error) => reject(error)
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Excel parsing error: ' + error.message));
          }
        };
        reader.onerror = () => reject(new Error('File reading error'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  const validateBulkData = (data) => {
    const errors = [];
    const validRows = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors = [];
      
      // Required fields validation
      if (!row.first_name || !row.first_name.toString().trim()) {
        rowErrors.push('First name is required');
      }
      if (!row.last_name || !row.last_name.toString().trim()) {
        rowErrors.push('Last name is required');
      }
      if (!row.phone_number || !row.phone_number.toString().trim()) {
        rowErrors.push('Phone number is required');
      }
      
      // Email validation for admins/superadmins
      if (formData.is_admin > 0) {
        if (!row.email || !row.email.toString().trim()) {
          rowErrors.push(`Email is required for ${formData.is_admin === 2 ? 'Super Admin' : 'Admin'} roles`);
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row.email.toString().trim())) {
            rowErrors.push('Invalid email format');
          }
        }
      }
      
      // Phone number format validation
      if (row.phone_number) {
        const digits = row.phone_number.toString().replace(/\D/g, '');
        if (digits.length < 10) {
          rowErrors.push('Invalid phone number format (minimum 10 digits required)');
        }
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: rowNumber, errors: rowErrors });
      } else {
        // Generate PIN from phone number
        const digits = row.phone_number.toString().replace(/\D/g, '').replace(/^1/, '');
        const pin = digits.slice(-4);
        
        validRows.push({
          first_name: row.first_name.toString().trim(),
          last_name: row.last_name.toString().trim(),
          phone_number: row.phone_number.toString().trim(),
          email: row.email ? row.email.toString().trim() : '',
          pin: pin,
          is_admin: formData.is_admin,
          is_active: true,
          last_modified_by: 'Admin',
          c_id: companyId || ''
        });
      }
    });
    
    return { errors, validRows };
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      setBulkUploadError('Please select a file to upload.');
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadError('');
    setBulkUploadResults(null);

    try {
      // Parse file data
      const fileData = await parseFileData(selectedFile);
      
      if (!fileData || fileData.length === 0) {
        setBulkUploadError('The file is empty or contains no valid data.');
        return;
      }

      // Validate data
      const { errors, validRows } = validateBulkData(fileData);
      
      if (validRows.length === 0) {
        setBulkUploadError('No valid rows found in the file.');
        setBulkUploadResults({ errors, successful: [], failed: [], duplicates: { emails: [], phones: [], pins: [] } });
        return;
      }

      // Check employee limit
      if (maxEmployees && (employees.length + validRows.length) > maxEmployees) {
        setBulkUploadError(`Adding ${validRows.length} employees would exceed the limit of ${maxEmployees} employees.`);
        return;
      }

      // Pre-check for duplicates in bulk
      const duplicates = { emails: [], phones: [], pins: [] };
      const existingEmails = employees.map(e => e.email?.toLowerCase()).filter(Boolean);
      const existingPhones = employees.map(e => e.phone_number);
      const existingPins = employees.map(e => e.pin);
      
      validRows.forEach((row, index) => {
        if (row.email && existingEmails.includes(row.email.toLowerCase())) {
          duplicates.emails.push({ row: index + 1, email: row.email, name: `${row.first_name} ${row.last_name}` });
        }
        if (existingPhones.includes(row.phone_number)) {
          duplicates.phones.push({ row: index + 1, phone: row.phone_number, name: `${row.first_name} ${row.last_name}` });
        }
        if (existingPins.includes(row.pin)) {
          duplicates.pins.push({ row: index + 1, pin: row.pin, name: `${row.first_name} ${row.last_name}` });
        }
      });


      if (duplicates.emails.length > 0) {
        setBulkUploadError(`Found ${duplicates.emails.length} duplicate record(s). Please review and fix duplicates before uploading.`);
        setBulkUploadResults({ errors, successful: [], failed: [], duplicates });
        return;
      }

      // Process valid rows
      const successful = [];
      const failed = [];
      const processedPins = [...existingPins];
      
      for (const rowData of validRows) {
        try {
          // Handle PIN conflicts with auto-generation
          let finalPin = rowData.pin;
          if (processedPins.includes(finalPin)) {
            const newPin = generateAlternativePin(finalPin, processedPins);
            if (newPin) {
              finalPin = newPin;
              processedPins.push(finalPin);
            } else {
              failed.push({ data: rowData, error: 'PIN conflict and no alternative available' });
              continue;
            }
          } else {
            processedPins.push(finalPin);
          }
          
          const finalData = { ...rowData, pin: finalPin };
          await createEmployeeWithData(finalData);
          successful.push({ data: finalData, originalPin: rowData.pin !== finalPin ? rowData.pin : null });
        } catch (error) {
          failed.push({ data: rowData, error: error.message });
        }
      }
      
      setBulkUploadResults({ errors, successful, failed, duplicates: { emails: [], phones: [], pins: [] } });
      
      if (successful.length > 0) {
        setBulkUploadSuccess(`Successfully uploaded ${successful.length} employee(s).`);
        loadEmployeeData();
      }
      
    } catch (error) {
      setBulkUploadError('Error processing file: ' + error.message);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = formData.is_admin > 0 
      ? ['first_name', 'last_name', 'phone_number', 'email']
      : ['first_name', 'last_name', 'phone_number'];
    
    let csvContent = headers.join(',') + '\n';
    
    // Add sample data based on role
    if (formData.is_admin > 0) {
      csvContent += 'John,Doe,+1234567890,john.doe@company.com\n';
      csvContent += 'Jane,Smith,+1987654321,jane.smith@company.com\n';
    } else {
      csvContent += 'John,Doe,+1234567890\n';
      csvContent += 'Jane,Smith,+1987654321\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <CenterLoadingOverlay show={centerLoading.show} message={centerLoading.message} />

      <div className="pt-20 pb-8 flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Employee Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage employees, admins, and super admins
                  {maxEmployees && ` (${employees.length}/${maxEmployees} employees)`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                  disabled={(activeTab === "superadmins" && adminType !== "Owner") || (maxEmployees && employees.length >= maxEmployees)}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span className="truncate">Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}</span>
                </Button>
                <Button
                  onClick={() => openBulkUploadModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                  disabled={(activeTab === "superadmins" && adminType !== "Owner") || (maxEmployees && employees.length >= maxEmployees)}
                  variant="outline"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span className="truncate">Bulk Upload</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Employee Limit Notice */}
           {maxEmployees && employees.length >= maxEmployees && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-900">Employee Limit Reached</h3>
                    <p className="text-sm text-amber-700">You have reached the maximum of {maxEmployees} employees for your plan.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab("employees")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Total Employees
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{employees.filter(emp => emp.is_admin === 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {adminType !== "Admin" && (
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("admins")}
              >
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
            )}

            {adminType !== "Admin" && (
              <Card
                className="sm:col-span-2 md:col-span-1 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("superadmins")}
              >
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
            )}
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
                    { key: 'name', direction: 'asc', label: 'Sort By Name', icon: ArrowUp },
                    { key: 'name', direction: 'desc', label: 'Sort By Name', icon: ArrowDown },
                    { key: 'pin', direction: 'asc', label: 'Sort By PIN', icon: ArrowUp },
                    { key: 'pin', direction: 'desc', label: 'Sort By PIN', icon: ArrowDown },
                    { key: 'contact', direction: 'asc', label: 'Sort By Contact', icon: ArrowUp },
                    { key: 'contact', direction: 'desc', label: 'Sort By Contact', icon: ArrowDown }
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
                  <HamburgerIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <GridIcon className="w-4 h-4" />
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
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                      disabled={(activeTab === "superadmins" && adminType !== "Owner") || (maxEmployees && employees.length >= maxEmployees)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}
                    </Button>
                    <Button
                      onClick={() => openBulkUploadModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                      disabled={(activeTab === "superadmins" && adminType !== "Owner") || (maxEmployees && employees.length >= maxEmployees)}
                      variant="outline"
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Upload
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
                            disabled={adminType === "SuperAdmin" && employee.is_admin === 2 && 
                                     employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(employee)}
                            disabled={adminType === "SuperAdmin" && employee.is_admin === 2 && 
                                     employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()}
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
                          <span className="font-mono">{formatPhoneNumber(employee.phone_number)}</span>
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
                              {employee.phone_number && <div className="text-muted-foreground font-mono">{formatPhoneNumber(employee.phone_number)}</div>}
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
                                disabled={adminType === "SuperAdmin" && employee.is_admin === 2 && 
                                         employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(employee)}
                                disabled={adminType === "SuperAdmin" && employee.is_admin === 2 && 
                                         employee.email && employee.email.toLowerCase() === loggedAdminEmail.toLowerCase()}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="employee-add-modal" className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: capitalizeFirst(e.target.value) }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: capitalizeFirst(e.target.value) }))}
                    className="text-sm"
                  />
                  {errors.last_name && <p className="text-xs text-red-600">{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <PhoneInput
                  defaultCountry="us"
                  value={formData.phone_number}
                  onChange={handlePhoneInput}
                  forceDialCode={true}
                  className={errors.phone_number ? 'phone-input-error' : ''}
                  inputClassName="w-full"
                  style={{
                    '--react-international-phone-border-radius': '0.375rem',
                    '--react-international-phone-border-color': errors.phone_number ? '#ef4444' : '#e5e7eb',
                    '--react-international-phone-background-color': '#ffffff',
                    '--react-international-phone-text-color': '#000000',
                    '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                    '--react-international-phone-height': '2.5rem'
                  }}
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



              {/* Success message for PIN change */}
              {modalSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{modalSuccess}</p>
                </div>
              )}

              {/* Error display */}
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEmployee}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingEmployee ? "Update" : "Add"} {
                    formData.is_admin === 2 ? "Super Admin" :
                    formData.is_admin === 1 ? "Admin" : "Employee"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="employee-delete-modal" className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#01005a' }}>
                <AlertCircle className="w-5 h-5" />
                Delete Employee
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete "{employeeToDelete.first_name} {employeeToDelete.last_name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Success message */}
              {deleteSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{deleteSuccess}</p>
                </div>
              )}

              {/* Error message */}
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{deleteError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isDeleting || deleteSuccess}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteEmployee}
                  className="flex-1 order-1 sm:order-2 bg-[#01005a] hover:bg-[#01005a]/90 text-white"
                  disabled={isDeleting || deleteSuccess}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Bulk Upload {formData.is_admin === 2 ? "Super Admins" : formData.is_admin === 1 ? "Admins" : "Employees"}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Upload multiple employees using CSV or Excel files
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkUploadModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Select File</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bulk-upload-file"
                  />
                  <label htmlFor="bulk-upload-file" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-1">
                      Click to select or drag and drop your file
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports CSV and Excel files only
                    </p>
                  </label>
                </div>
                
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-6 w-6 p-0 ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Required Fields Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Required Columns:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• <strong>first_name</strong> - Employee's first name</div>
                  <div>• <strong>last_name</strong> - Employee's last name</div>
                  <div>• <strong>phone_number</strong> - Phone number (PIN will be auto-generated)</div>
                  {formData.is_admin > 0 && (
                    <div>• <strong>email</strong> - Email address for {formData.is_admin === 2 ? "Super Admin" : "Admin"}</div>
                  )}
                </div>
                {formData.is_admin > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    <strong>Note:</strong> Email is mandatory for  Super Admin and Admin roles and will be used for login access.
                  </div>
                )}
              </div>

              {/* Error Display */}
              {bulkUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{bulkUploadError}</p>
                </div>
              )}

              {/* Success Display */}
              {bulkUploadSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600">{bulkUploadSuccess}</p>
                </div>
              )}

              {/* Results Display */}
              {bulkUploadResults && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Upload Results:</h4>
                  
                  {/* Duplicates Summary */}
                  {(bulkUploadResults.duplicates?.emails?.length > 0 ) && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <h5 className="text-sm font-medium text-orange-800 mb-2">
                        Duplicate Records Found ({(bulkUploadResults.duplicates.emails?.length || 0) })
                      </h5>
                      <div className="space-y-2 text-xs">
                        {bulkUploadResults.duplicates.emails?.length > 0 && (
                          <div>
                            <span className="font-medium text-orange-700">Duplicate Emails ({bulkUploadResults.duplicates.emails.length}):</span>
                            <div className="max-h-20 overflow-y-auto mt-1 space-y-1">
                              {bulkUploadResults.duplicates.emails.slice(0, 5).map((item, index) => (
                                <div key={index} className="text-orange-600">
                                  {item.email}
                                </div>
                              ))}
                              {bulkUploadResults.duplicates.emails.length > 5 && (
                                <div className="text-orange-600 font-medium">
                                  ... and {bulkUploadResults.duplicates.emails.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                       
                      </div>
                    </div>
                  )}
                  
                  {bulkUploadResults.successful.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <h5 className="text-sm font-medium text-green-800 mb-2">
                        Successfully Added ({bulkUploadResults.successful.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadResults.successful.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-xs text-green-700">
                            {item.data.first_name} {item.data.last_name}
                            {item.originalPin && (
                              <span className="text-orange-600"> (PIN changed from {item.originalPin} to {item.data.pin})</span>
                            )}
                          </div>
                        ))}
                        {bulkUploadResults.successful.length > 10 && (
                          <div className="text-xs text-green-700 font-medium">
                            ... and {bulkUploadResults.successful.length - 10} more employees added successfully
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {bulkUploadResults.failed.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <h5 className="text-sm font-medium text-red-800 mb-2">
                        Failed ({bulkUploadResults.failed.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadResults.failed.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-xs text-red-700">
                            {item.data.first_name} {item.data.last_name}: {item.error}
                          </div>
                        ))}
                        {bulkUploadResults.failed.length > 10 && (
                          <div className="text-xs text-red-700 font-medium">
                            ... and {bulkUploadResults.failed.length - 10} more failed records
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {bulkUploadResults.errors.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h5 className="text-sm font-medium text-yellow-800 mb-2">
                        Validation Errors ({bulkUploadResults.errors.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkUploadResults.errors.slice(0, 10).map((item, index) => (
                          <div key={index} className="text-xs text-yellow-700">
                            Row {item.row}: {item.errors.join(', ')}
                          </div>
                        ))}
                        {bulkUploadResults.errors.length > 10 && (
                          <div className="text-xs text-yellow-700 font-medium">
                            ... and {bulkUploadResults.errors.length - 10} more validation errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUploadModal(false)}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isBulkUploading}
                >
                  {bulkUploadResults ? 'Close' : 'Cancel'}
                </Button>
                {!bulkUploadResults && (
                  <Button
                    onClick={handleBulkUpload}
                    className="flex-1 order-1 sm:order-2"
                    disabled={!selectedFile || isBulkUploading}
                  >
                    {isBulkUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Upload {formData.is_admin === 2 ? "Super Admins" : formData.is_admin === 1 ? "Admins" : "Employees"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Footer/> 

    </div>
  );
};

export default EmployeeList;