import React, { useState, useEffect, useCallback } from "react";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { updateProfile, updateEmployeeWithData } from "../api.js";
import { initializeUserSession, loadProfileData, logoutUser } from "./ProfilePageLogic.js";
import Footer from "@/components/layout/Footer";
import {
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Users,
  Monitor,
  ArrowUpCircle
} from "lucide-react";
import { useZipLookup } from "../hooks";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const Profile = () => {
  // Utility function to capitalize first letter of each word
  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState({ personal: false, company: false, admin: false });
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    street2: "",
    customerCity: "",
    customerState: "",
    zipCode: "",
    pin: "",
  });

  const [adminData, setAdminData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    pin: ""
  });

  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    street2: "",
    city: "",
    state: "",
    companyZip: "",
    logo: "",
    employmentType: ""
  });

  const [logoFile, setLogoFile] = useState(null);

  // Employment type tag input states
  const [employmentTypes, setEmploymentTypes] = useState([' ']);
  const [employmentTypeInput, setEmploymentTypeInput] = useState('');

  const [errors, setErrors] = useState({
    companyName: "",
    companyStreet: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    firstName: "",
    lastName: "",
    customerStreet: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    email: "",
    phone: "",
    pin: "",
  });

  const [companyId, setCompanyId] = useState("");

  // Check if user can edit company details - only Owner is allowed
  const canEditCompany = userType === "Owner";

  // ZIP code auto-fill callbacks
  const handleCompanyZipResult = useCallback((result) => {
    if (isEditing.company) {
      setCompanyData(prev => ({
        ...prev,
        city: result.city,
        state: result.state
      }));
      setErrors(prev => ({
        ...prev,
        companyCity: '',
        companyState: ''
      }));
    }
  }, [isEditing.company]);

  const handlePersonalZipResult = useCallback((result) => {
    if (isEditing.personal) {
      setPersonalData(prev => ({
        ...prev,
        customerCity: result.city,
        customerState: result.state
      }));
      setErrors(prev => ({
        ...prev,
        customerCity: '',
        customerState: ''
      }));
    }
  }, [isEditing.personal]);

  // ZIP code lookup hooks (only active when editing)
  const { isLoading: companyZipLoading } = useZipLookup(
    isEditing.company ? companyData.companyZip : '',
    handleCompanyZipResult
  );
  const { isLoading: personalZipLoading } = useZipLookup(
    isEditing.personal ? personalData.zipCode : '',
    handlePersonalZipResult
  );



  const handlePersonalInputChange = (field, value) => {

    // Restrict zipCode to 5 digits only
    if (field === "zipCode" && value && !/^\d{0,5}$/.test(value)) {
      return;
    }

    const fieldMap = {
      "city": "customerCity",
      "address": "address",
      "state": "customerState"
    };

    const actualField = fieldMap[field] || field;

    setPersonalData(prev => ({ ...prev, [actualField]: value }));

    const errorField = field === "address" ? "customerStreet" :
      field === "city" ? "customerCity" :
        field === "state" ? "customerState" :
          field === "zipCode" ? "customerZip" : field;

    if (errors[errorField]) {
      setErrors(prev => ({ ...prev, [errorField]: "" }));
    }
  };

  const handleAdminInputChange = (field, value) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCompanyInputChange = (field, value) => {
    // Restrict zipCode to 5 digits only
    if (field === "zipCode" && value && !/^\d{0,5}$/.test(value)) {
      return;
    }
    setCompanyData(prev => ({ ...prev, [field]: value }));
    const errorField = field === "name" ? "companyName" :
      field === "address" ? "companyStreet" :
        field === "city" ? "companyCity" :
          field === "state" ? "companyState" :
            field === "zipCode" ? "companyZip" : field;
    if (errors[errorField]) {
      setErrors(prev => ({ ...prev, [errorField]: "" }));
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      // Error handled silently
      event.target.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      // Error handled silently
      event.target.value = '';
      return;
    }

    // Store the file for upload
    setLogoFile(file);

    // Create preview for display
    const reader = new FileReader();
    reader.onload = (e) => {
      setCompanyData(prev => ({ ...prev, logo: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEmploymentTypeKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const value = employmentTypeInput.trim();
      if (value && !employmentTypes.includes(value)) {
        const newTypes = [...employmentTypes, value];
        setEmploymentTypes(newTypes);
        setCompanyData(prev => ({
          ...prev,
          employmentType: newTypes.join(',')
        }));
      }
      setEmploymentTypeInput('');
    }
  };

  const handleRemoveEmploymentType = (typeToRemove) => {
    if (employmentTypes.length === 1) return;
    const newTypes = employmentTypes.filter(type => type !== typeToRemove);
    setEmploymentTypes(newTypes);
    setCompanyData(prev => ({
      ...prev,
      employmentType: newTypes.join(',')
    }));
  };

  useEffect(() => {
    const initializeProfile = async () => {
      const companyIdCheck = localStorage.getItem("companyID");

      if (!companyIdCheck) {
        logoutUser();
        window.location.href = "/login";
        return;
      }

      const { companyId, userType, adminDetails } = await initializeUserSession();

      setCompanyId(companyId);
      setUserType(userType);

      // Set default tab based on user type
      if (userType === "Admin" || userType === "SuperAdmin") {
        setActiveTab("admin");
      } else if (userType === "Owner") {
        setActiveTab("personal");
      }

      const formData = loadProfileData(adminDetails);

      setPersonalData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.customerStreet,
        street2: formData.customerStreet2,
        customerCity: formData.customerCity,
        customerState: formData.customerState,
        zipCode: formData.customerZip,
        pin: formData.adminPin,
        decryptedPassword: formData.decryptedPassword,
      });


      setAdminData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
        email: formData.email,
        pin: formData.adminPin
      });

      // Load employment type from localStorage
      const storedEmploymentType = localStorage.getItem("employmentType") || "";

      setCompanyData({
        name: formData.companyName,
        address: formData.companyStreet,
        street2: formData.companyStreet2,
        city: formData.companyCity,
        state: formData.companyState,
        companyZip: formData.companyZip,
        logo: formData.logo,
        employmentType: storedEmploymentType.split(',').filter(t => t.trim()).join(','),
      });

      // Initialize employmentTypes array from stored CSV
      setEmploymentTypes(storedEmploymentType.split(',').filter(t => t.trim()));

      setIsLoading(false);
    };

    initializeProfile();
  }, []);

  const validatePersonalForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    newErrors.firstName = "";
    newErrors.lastName = "";
    newErrors.customerStreet = "";
    newErrors.customerCity = "";
    newErrors.customerState = "";
    newErrors.customerZip = "";
    newErrors.email = "";
    newErrors.phone = "";

    if (!personalData.firstName || !personalData.firstName.trim()) {
      newErrors.firstName = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.lastName || !personalData.lastName.trim()) {
      newErrors.lastName = "Please fill out this field";
      isValid = false;
    }



    if (!personalData.email || !personalData.email.trim()) {
      newErrors.email = "Please fill out this field";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    if (personalData.phone) {
      const digits = personalData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone = "Invalid phone number format";
        isValid = false;
      }
    }

    if (personalData.zipCode && personalData.zipCode.length !== 5) {
      newErrors.customerZip = "Zip code must be exactly 5 digits";
      isValid = false;
    }

    if (userType === "Admin" || userType === "SuperAdmin") {
      if (!personalData.pin || !personalData.pin.trim()) {
        newErrors.pin = "Admin PIN is required";
        isValid = false;
      } else if (!/^\d{4,6}$/.test(personalData.pin)) {
        newErrors.pin = "PIN must be 4-6 digits";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateCompanyForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    newErrors.companyName = "";
    newErrors.companyStreet = "";
    newErrors.companyCity = "";
    newErrors.companyState = "";
    newErrors.companyZip = "";

    if (!companyData.name.trim()) {
      newErrors.companyName = "Please fill out this field";
      isValid = false;
    }

    if (!companyData.address.trim()) {
      newErrors.companyStreet = "Please fill out this field";
      isValid = false;
    }

    if (!companyData.city.trim()) {
      newErrors.companyCity = "Please fill out this field";
      isValid = false;
    }

    if (!companyData.state.trim()) {
      newErrors.companyState = "Please fill out this field";
      isValid = false;
    }

    if (!companyData.companyZip.trim()) {
      newErrors.companyZip = "Please fill out this field";
      isValid = false;
    } else if (companyData.companyZip.length !== 5) {
      newErrors.companyZip = "Zip code must be exactly 5 digits";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSavePersonal = async () => {
    if (!validatePersonalForm()) {
      return;
    }

    if (!companyId) {
      return;
    }

    setSaveSuccess("");
    setSaveError("");
    setIsSaving(true);

    try {
      const companyDataPayload = {
        company_name: companyData.name || "",
        report_type: localStorage.getItem("reportType"),
        company_address_line1: companyData.address || "",
        company_address_line2: companyData.street2 || "",
        company_city: companyData.city || "",
        company_state: companyData.state || "",
        company_zip_code: companyData.companyZip || "",
        first_name: personalData.firstName || "",
        last_name: personalData.lastName || "",
        email: personalData.email || "",
        phone_number: personalData.phone ? personalData.phone.replace(/\D/g, '') : "",
        customer_address_line1: personalData.address || "",
        customer_address_line2: personalData.street2 || "",
        customer_city: personalData.customerCity || "",
        customer_state: personalData.customerState || "",
        customer_zip_code: personalData.zipCode || "",
        is_verified: localStorage.getItem("isVerified") === "true",
        device_count: parseInt(localStorage.getItem("NoOfDevices")),
        employee_count: parseInt(localStorage.getItem("NoOfEmployees")),
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system",
        employment_type: employmentTypes.join(',')
      };

      const formData = new FormData();
      formData.append('company_data', JSON.stringify(companyDataPayload));

      // Only add logo file if it has been changed
      if (logoFile) {
        formData.append('company_logo', logoFile);
      }


      const result = await updateProfile(companyId, formData);



      // Reset logoFile after successful save
      // setLogoFile(null);

      // Update localStorage after successful API call
      if (userType === "Owner") {
        localStorage.setItem("companyName", companyData.name);
        localStorage.setItem("companyStreet", companyData.address);
        localStorage.setItem("companyStreet2", companyData.street2 || "");
        localStorage.setItem("companyCity", companyData.city);
        localStorage.setItem("companyState", companyData.state);
        localStorage.setItem("companyZip", companyData.zipCode);
        if (companyData.logo) {
          localStorage.setItem("companyLogo", companyData.logo);
        }
      }

      localStorage.setItem("firstName", personalData.firstName);
      localStorage.setItem("lastName", personalData.lastName);
      localStorage.setItem("userName", `${personalData.firstName} ${personalData.lastName}`.trim());
      localStorage.setItem("adminMail", personalData.email);
      localStorage.setItem("phone", personalData.phone);
      localStorage.setItem("phone_number", personalData.phone);
      localStorage.setItem("customerStreet", personalData.address);
      localStorage.setItem("customerStreet2", personalData.street2 || "");
      localStorage.setItem("customerCity", personalData.customerCity);
      localStorage.setItem("customerState", personalData.customerState);
      localStorage.setItem("customerZip", personalData.customerZip);

      setSaveSuccess("Personal information updated successfully!");
      setTimeout(() => {
        setSaveSuccess("");
        setIsEditing(prev => ({ ...prev, personal: false }));
      }, 1000);
    } catch (error) {

      setSaveError(error.message || "Failed to update personal information");
      setTimeout(() => {
        setSaveError("");
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdmin = async () => {

    if (!companyId) {
      return;
    }

    setSaveSuccess("");
    setSaveError("");
    setIsSaving(true);

    try {
      // Get the logged admin data to find the employee ID
      const loggedAdmin = JSON.parse(localStorage.getItem("loggedAdmin") || "{}");
      const empId = loggedAdmin.emp_id;

      if (!empId) {
        throw new Error("Employee ID not found");
      }

      // Use updateEmployeeWithData for super admin and admin updates
      const employeeUpdateData = {
        first_name: adminData.firstName || "",
        last_name: adminData.lastName || "",
        email: adminData.email || "",
        phone_number: adminData.phone ? adminData.phone.replace(/\D/g, '') : "",
        pin: adminData.pin || "",
        is_admin: loggedAdmin.is_admin || 1,
        is_active: true,
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system",
        c_id: companyId
      };

      const result = await updateEmployeeWithData(empId, employeeUpdateData);

      localStorage.setItem("firstName", adminData.firstName);
      localStorage.setItem("lastName", adminData.lastName);
      localStorage.setItem("userName", `${adminData.firstName} ${adminData.lastName}`.trim());
      localStorage.setItem("adminMail", adminData.email);
      localStorage.setItem("phone", adminData.phone);
      localStorage.setItem("phone_number", adminData.phone);

      setSaveSuccess("Admin information updated successfully!");
      setTimeout(() => {
        setSaveSuccess("");
        setIsEditing(prev => ({ ...prev, admin: false }));
      }, 1000);
    } catch (error) {

      setSaveError(error.message || "Failed to update admin information");
      setTimeout(() => {
        setSaveError("");
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    // Check authorization - only Owner can edit company data
    if (!canEditCompany) {
      setSaveError("Only Owners are authorized to edit company details.");
      setTimeout(() => setSaveError(""), 3000);
      return;
    }

    if (!validateCompanyForm()) {
      return;
    }

    if (!companyId) {
      return;
    }

    setSaveSuccess("");
    setSaveError("");
    setIsSaving(true);

    try {
      const companyDataPayload = {
        company_name: companyData.name || "",
        report_type: localStorage.getItem("reportType") || "string",
        company_address_line1: companyData.address || "",
        company_address_line2: companyData.street2 || "",
        company_city: companyData.city || "",
        company_state: companyData.state || "",
        company_zip_code: companyData.companyZip || "",
        first_name: personalData.firstName || "",
        last_name: personalData.lastName || "",
        email: personalData.email || "",
        phone_number: personalData.phone ? personalData.phone.replace(/\D/g, '') : "",
        customer_address_line1: personalData.address || "",
        customer_address_line2: personalData.street2 || "",
        customer_city: personalData.customerCity || "",
        customer_state: personalData.customerState || "",
        customer_zip_code: personalData.zipCode || "",
        is_verified: true,
        device_count: parseInt(localStorage.getItem("NoOfDevices")),
        employee_count: parseInt(localStorage.getItem("NoOfEmployees")),
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system",
        employment_type: employmentTypes.join(',')
      };

      console.log(companyDataPayload);


      const formData = new FormData();
      formData.append('company_data', JSON.stringify(companyDataPayload));


      // Only add logo file if it has been changed
      if (logoFile) {
        formData.append('company_logo', logoFile);


      }


      const result = await updateProfile(companyId, formData);

      // Reset logoFile after successful save
      // setLogoFile(null);

      // Update localStorage after successful API call
      localStorage.setItem("companyName", companyData.name);
      localStorage.setItem("companyStreet", companyData.address);
      localStorage.setItem("companyStreet2", companyData.street2 || "");
      localStorage.setItem("companyCity", companyData.city);
      localStorage.setItem("companyState", companyData.state);
      localStorage.setItem("companyZip", companyData.zipCode);
      localStorage.setItem("employmentType", companyData.employmentType);
      if (companyData.logo) {
        localStorage.setItem("companyLogo", companyData.logo);
      }

      setSaveSuccess("Company information updated successfully!");
      setTimeout(() => {
        setSaveSuccess("");
        setIsEditing(prev => ({ ...prev, company: false }));
      }, 1000);
    } catch (error) {

      setSaveError(error.message || "Failed to update company information");
      setTimeout(() => {
        setSaveError("");
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (type) => {
    // Reload original data from localStorage
    const formData = loadProfileData(null);

    if (type === "personal") {
      setPersonalData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.customerStreet,
        street2: formData.customerStreet2,
        customerCity: formData.customerCity,
        customerState: formData.customerState,
        zipCode: formData.customerZip,
        pin: formData.adminPin,
        decryptedPassword: formData.decryptedPassword,
      });

      setAdminData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
        email: formData.email,
        pin: formData.adminPin
      });
    } else if (type === "company") {
      setCompanyData({
        name: formData.companyName,
        address: formData.companyStreet,
        street2: formData.companyStreet2,
        city: formData.companyCity,
        state: formData.companyState,
        zipCode: formData.companyZip,
        logo: formData.logo
      });
    } else if (type === "admin") {
      setAdminData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
        email: formData.email,
        pin: formData.adminPin
      });
    }

    // Reset errors
    setErrors({
      companyName: "",
      companyStreet: "",
      companyCity: "",
      companyState: "",
      companyZip: "",
      firstName: "",
      lastName: "",
      customerStreet: "",
      customerCity: "",
      customerState: "",
      customerZip: "",
      email: "",
      phone: "",
      pin: "",
    });

    // Exit edit mode
    setIsEditing(prev => ({ ...prev, [type]: false }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div id="profile-loading-modal" className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <div className="pt-20 pb-8 bg-gradient-to-br from-slate-50 to-blue-50 flex-1">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account and company information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                ...(userType !== "Admin" && userType !== "SuperAdmin" ? [{ key: "personal", label: "Personal Information", icon: User }] : []),
                { key: "company", label: "Company Information", icon: Building },
                ...(userType === "Admin" || userType === "SuperAdmin" ? [{ key: "admin", label: userType === "SuperAdmin" ? "Super Admin Information" : "Admin Information", icon: User }] : []),
                ...(userType === "Owner" ? [{ key: "subscription", label: "Subscription", icon: CreditCard }] : [])
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key === "personal" ? "Personal" : key === "company" ? "Company" : key === "admin" && userType === "SuperAdmin" ? "Super Admin" : key === "subscription" ? "Plan" : "Admin"}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {activeTab === "personal" && userType !== "Admin" && userType !== "SuperAdmin" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and account settings
                    </CardDescription>
                  </div>
                  {!isEditing.personal && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, personal: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="firstName"
                        value={personalData.firstName}
                        onChange={(e) => handlePersonalInputChange("firstName", capitalizeFirst(e.target.value))}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="lastName"
                        value={personalData.lastName}
                        onChange={(e) => handlePersonalInputChange("lastName", capitalizeFirst(e.target.value))}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) => handlePersonalInputChange("email", e.target.value)}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <PhoneInput
                      defaultCountry="us"
                      value={personalData.phone}
                      onChange={(phone) => handlePersonalInputChange("phone", phone)}
                      disabled={!isEditing.personal}
                      forceDialCode={true}
                      className={errors.phone ? 'phone-input-error' : ''}
                      inputClassName="w-full"
                      style={{
                        '--react-international-phone-border-radius': '0.375rem',
                        '--react-international-phone-border-color': errors.phone ? '#ef4444' : '#e5e7eb',
                        '--react-international-phone-text-color': '#000000',
                        '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                        '--react-international-phone-height': '2.5rem'
                      }}
                    />
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                  </div>



                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="address"
                        value={personalData.address}
                        onChange={(e) => handlePersonalInputChange("address", e.target.value)}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.customerStreet ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.customerStreet && <p className="text-sm text-red-600">{errors.customerStreet}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={personalData.customerCity}
                      onChange={(e) => handlePersonalInputChange("city", capitalizeFirst(e.target.value))}
                      disabled={!isEditing.personal}
                      className={errors.customerCity ? "border-red-500" : ""}
                    />
                    {errors.customerCity && <p className="text-sm text-red-600">{errors.customerCity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={personalData.customerState}
                      onChange={(e) => handlePersonalInputChange("state", capitalizeFirst(e.target.value))}
                      disabled={!isEditing.personal}
                      className={errors.customerState ? "border-red-500" : ""}
                    />
                    {errors.customerState && <p className="text-sm text-red-600">{errors.customerState}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <div className="relative">
                      <Input
                        id="zipCode"
                        value={personalData.zipCode}
                        onChange={(e) => handlePersonalInputChange("zipCode", e.target.value)}
                        disabled={!isEditing.personal}
                        className={errors.customerZip ? "border-red-500" : ""}
                        maxLength={5}
                      />
                      {personalZipLoading && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {errors.customerZip && <p className="text-sm text-red-600">{errors.customerZip}</p>}
                  </div>
                </div>

                {isEditing.personal && (
                  <>
                    {saveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-600">{saveSuccess}</p>
                      </div>
                    )}
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{saveError}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleCancel("personal")}
                        className="flex-1 order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSavePersonal}
                        disabled={isSaving || saveSuccess}
                        className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Information
                    </CardTitle>
                    <CardDescription>
                      Manage your company details and branding
                    </CardDescription>
                  </div>
                  {!isEditing.company && canEditCompany && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, company: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {!canEditCompany && (
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                      Only Owners can edit company details
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Company Logo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {companyData.logo ? (
                        <img src={companyData.logo} alt="Company Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    {isEditing.company && (
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                        <Camera className="w-4 h-4 text-primary-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Company Logo</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a logo for your company. Recommended size: 200x200px
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="companyName"
                        value={companyData.name}
                        onChange={(e) => handleCompanyInputChange("name", capitalizeFirst(e.target.value))}
                        disabled={!isEditing.company}
                        className={`pl-10 ${errors.companyName ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.companyName && <p className="text-sm text-red-600">{errors.companyName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Street Address Line 1</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="companyAddress"
                        value={companyData.address}
                        onChange={(e) => handleCompanyInputChange("address", e.target.value)}
                        disabled={!isEditing.company}
                        className={`pl-10 ${errors.companyStreet ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.companyStreet && <p className="text-sm text-red-600">{errors.companyStreet}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyStreet2">Street Address Line 2</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="companyStreet2"
                        value={companyData.street2}
                        onChange={(e) => handleCompanyInputChange("street2", e.target.value)}
                        disabled={!isEditing.company}
                        className="pl-10"
                        placeholder="Suite, floor, etc. (optional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCity">City</Label>
                    <Input
                      id="companyCity"
                      value={companyData.city}
                      onChange={(e) => handleCompanyInputChange("city", capitalizeFirst(e.target.value))}
                      disabled={!isEditing.company}
                      className={errors.companyCity ? "border-red-500" : ""}
                    />
                    {errors.companyCity && <p className="text-sm text-red-600">{errors.companyCity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyState">State</Label>
                    <Input
                      id="companyState"
                      value={companyData.state}
                      onChange={(e) => handleCompanyInputChange("state", capitalizeFirst(e.target.value))}
                      disabled={!isEditing.company}
                      className={errors.companyState ? "border-red-500" : ""}
                    />
                    {errors.companyState && <p className="text-sm text-red-600">{errors.companyState}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyZipCode">Zip Code</Label>
                    <div className="relative">
                      <Input
                        id="companyZipCode"
                        value={companyData.companyZip}
                        onChange={(e) => handleCompanyInputChange("companyZip", e.target.value)}
                        disabled={!isEditing.company}
                        className={errors.companyZip ? "border-red-500" : ""}
                        maxLength={5}
                      />
                      {companyZipLoading && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {errors.companyZip && <p className="text-sm text-red-600">{errors.companyZip}</p>}
                  </div>



                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="employmentType">Employment Types</Label>
                    <div className={`flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-0 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[42px] flex-wrap gap-2 items-center ${!isEditing.company ? 'opacity-50' : ''}`}>
                      {employmentTypes.map((type, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                        >
                          {type}
                          {isEditing.company && employmentTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEmploymentType(type)}
                              className="hover:text-red-500 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditing.company && (
                        <Input
                          type="text"
                          id="employmentType"
                          value={employmentTypeInput}
                          onChange={(e) => setEmploymentTypeInput(capitalizeFirst(e.target.value))}
                          onKeyDown={handleEmploymentTypeKeyDown}
                          placeholder="Add more..."
                          className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
                        />
                      )}
                    </div>
                    {isEditing.company && (
                      <p className="text-xs text-muted-foreground">Type employment type and press comma to add</p>
                    )}
                  </div>
                </div>

                {isEditing.company && (
                  <>
                    {saveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-600">{saveSuccess}</p>
                      </div>
                    )}
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{saveError}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleCancel("company")}
                        className="flex-1 order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveCompany}
                        disabled={isSaving || saveSuccess}
                        className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "admin" && (userType === "Admin" || userType === "SuperAdmin") && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {userType === "SuperAdmin" ? "Super Admin Information" : "Admin Information"}
                    </CardTitle>
                    <CardDescription>
                      Manage admin and super admin details
                    </CardDescription>
                  </div>
                  {!isEditing.admin && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, admin: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="adminFirstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="adminFirstName"
                        value={adminData.firstName}
                        onChange={(e) => handleAdminInputChange("firstName", capitalizeFirst(e.target.value))}
                        disabled={!isEditing.admin}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminLastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="adminLastName"
                        value={adminData.lastName}
                        onChange={(e) => handleAdminInputChange("lastName", capitalizeFirst(e.target.value))}
                        disabled={!isEditing.admin}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <PhoneInput
                      defaultCountry="us"
                      value={adminData.phone}
                      onChange={(phone) => handleAdminInputChange("phone", phone)}
                      disabled={!isEditing.admin}
                      forceDialCode={true}
                      inputClassName="w-full"
                      style={{
                        '--react-international-phone-border-radius': '0.375rem',
                        '--react-international-phone-border-color': '#e5e7eb',
                        '--react-international-phone-text-color': '#000000',
                        '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                        '--react-international-phone-height': '2.5rem'
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminemail">email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="adminemail"
                        type="email"
                        value={adminData.email}
                        onChange={(e) => handleAdminInputChange("email", e.target.value)}
                        disabled={!isEditing.admin}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      value={adminData.pin}
                      onChange={(e) => handleAdminInputChange("pin", e.target.value)}
                      disabled={true}
                      className={errors.pin ? "border-red-500" : ""}
                      maxLength={6}
                      placeholder="4-6 digits"
                    />
                    {errors.pin && <p className="text-sm text-red-600">{errors.pin}</p>}
                  </div>
                </div>

                {isEditing.admin && (
                  <>
                    {saveSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-600">{saveSuccess}</p>
                      </div>
                    )}
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{saveError}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleCancel("admin")}
                        className="flex-1 order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveAdmin}
                        disabled={isSaving || saveSuccess}
                        className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "subscription" && userType === "Owner" && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Overview
                  </CardTitle>
                  <CardDescription>
                    View your current plan details and upgrade options
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Monitor className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">Total Devices</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {localStorage.getItem("NoOfDevices")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Active devices in your system
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">Total Employees</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {localStorage.getItem("NoOfEmployees")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registered employees
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-muted rounded-lg border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Upgrade Your Plan</h3>
                      <p className="text-muted-foreground">
                        Need more devices or employees? Upgrade your subscription to unlock additional capacity and features.
                      </p>
                    </div>
                    <Button className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4" />
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;