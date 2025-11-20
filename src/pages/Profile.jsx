import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { updateProfile } from "../api.js";
import { initializeUserSession, loadProfileData, logoutUser } from "./ProfilePageLogic.js";
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
  Loader2
} from "lucide-react";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [isEditing, setIsEditing] = useState({ personal: false, company: false, admin: false });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userType, setUserType] = useState("");

  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    street2: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
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
    logo: ""
  });

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

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatphone_number = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    return formatted;
  };

  const handlePersonalInputChange = (field, value) => {
    console.log(`Personal input change - Field: ${field}, Value: ${value}`);
    console.log('Current activeTab:', activeTab);
    console.log('Current isEditing.personal:', isEditing.personal);
    
    if (field === "phone") {
      value = formatphone_number(value);
    }

    const fieldMap = {
      "city": "customerCity",
      "state": "customerState",
      "zipCode": "customerZip",
      "address": "address"
    };

    const actualField = fieldMap[field] || field;
    console.log(`Mapping ${field} to ${actualField} with value: ${value}`);
    
    setPersonalData(prev => {
      const newData = { ...prev, [actualField]: value };
      console.log('Updated personalData:', newData);
      return newData;
    });

    const errorField = field === "address" ? "customerStreet" :
      field === "city" ? "customerCity" :
        field === "state" ? "customerState" :
          field === "zipCode" ? "customerZip" : field;

    if (errors[errorField]) {
      setErrors(prev => ({ ...prev, [errorField]: "" }));
    }
  };

  const handleAdminInputChange = (field, value) => {
    console.log(`Admin input change - Field: ${field}, Value: ${value}`);
    if (field === "phone") {
      value = formatphone_number(value);
    }
    setAdminData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('Updated adminData:', newData);
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCompanyInputChange = (field, value) => {
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
      showToast("Please upload a valid image file (JPEG, PNG, GIF, or WebP)", "error");
      event.target.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Image size must be less than 2MB", "error");
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setCompanyData(prev => ({ ...prev, logo: e.target.result }));
    };
    reader.readAsDataURL(file);
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

      const formData = loadProfileData(adminDetails);
      console.log("Loaded form data:", formData);

      setPersonalData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.customerStreet,
        street2: formData.customerStreet2,
        customerCity: formData.customerCity,
        state: formData.customerState,
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

      setCompanyData({
        name: formData.companyName,
        address: formData.companyStreet,
        street2: formData.companyStreet2,
        city: formData.companyCity,
        state: formData.companyState,
        zipCode: formData.companyZip,
        logo: formData.logo
      });
      setIsLoading(false);
    };

    initializeProfile();
  }, []);

  const validatePersonalForm = () => {
    console.log("Validating personal form with data:", personalData);
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
      console.log("firstName validation failed:", personalData.firstName);
      newErrors.firstName = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.lastName || !personalData.lastName.trim()) {
      console.log("lastName validation failed:", personalData.lastName);
      newErrors.lastName = "Please fill out this field";
      isValid = false;
    }



    if (!personalData.email || !personalData.email.trim()) {
      console.log("email validation failed:", personalData.email);
      newErrors.email = "Please fill out this field";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      console.log("email format validation failed:", personalData.email);
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    if (personalData.phone && !/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/.test(personalData.phone)) {
      console.log("phone format validation failed:", personalData.phone);
      newErrors.phone = "Please use format: (123) 456-7890";
      isValid = false;
    }

    if (userType === "Admin" || userType === "SuperAdmin") {
      if (!personalData.pin || !personalData.pin.trim()) {
        console.log("pin validation failed:", personalData.pin);
        newErrors.pin = "Admin PIN is required";
        isValid = false;
      } else if (!/^\d{4,6}$/.test(personalData.pin)) {
        console.log("pin format validation failed:", personalData.pin);
        newErrors.pin = "PIN must be 4-6 digits";
        isValid = false;
      }
    }

    console.log("Validation result:", isValid, "Errors:", newErrors);
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

    if (!companyData.zipCode.trim()) {
      newErrors.companyZip = "Please fill out this field";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSavePersonal = async () => {
    console.log("handleSavePersonal called");
    if (!validatePersonalForm()) {
      console.log("Validation failed");
      return;
    }

    if (!companyId) {
      showToast("Company ID not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        company_name: companyData.name || "",
        company_logo: companyData.logo || "",
        report_type: localStorage.getItem("reportType"),
        company_address_line1: companyData.address || "",
        company_address_line2: companyData.street2 || "",
        company_city: companyData.city || "",
        company_state: companyData.state || "",
        company_zip_code: companyData.zipCode || "",
        first_name: personalData.firstName || "",
        last_name: personalData.lastName || "",
        email: personalData.email || "",
        phone_number: personalData.phone ? personalData.phone.replace(/\D/g, '') : "",
        customer_address_line1: personalData.address || "",
        customer_address_line2: personalData.street2 || "",
        customer_city: personalData.customerCity || "",
        customer_state: personalData.customerState || "",
        customer_zip_code: personalData.customerZip || "",
        is_verified: localStorage.getItem("isVerified") === "true",
        device_count: parseInt(localStorage.getItem("noOfDevices") || "1"),
        employee_count: parseInt(localStorage.getItem("noOfEmployees") || "30"),
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system"
      };

      console.log("Current personalData state:", personalData);
      console.log("Update data being sent:", updateData);

      console.log("Updating personal profile:", { companyId, userType, timestamp: new Date().toISOString() });
      const result = await updateProfile(companyId, updateData);
      console.log("Personal profile update successful:", result);

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



      setIsEditing(prev => ({ ...prev, personal: false }));
      showToast("Personal information updated successfully!");
    } catch (error) {
      console.error("Save Personal Error:", error);
      showToast("Failed to update personal information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAdmin = async () => {
    console.log("handleSaveAdmin called");
    console.log("Current adminData state:", adminData);
    
    if (!companyId) {
      showToast("Company ID not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        company_name: companyData.name || "",
        company_logo: companyData.logo || "",
        report_type: localStorage.getItem("reportType"),
        company_address_line1: companyData.address || "",
        company_address_line2: companyData.street2 || "",
        company_city: companyData.city || "",
        company_state: companyData.state || "",
        company_zip_code: companyData.zipCode || "",
        first_name: adminData.firstName || "",
        last_name: adminData.lastName || "",
        email: adminData.email || "",
        phone_number: adminData.phone ? adminData.phone.replace(/\D/g, '') : "",
        customer_address_line1: personalData.address || "",
        customer_address_line2:personalData.street2 || "",
        customer_city: personalData.customerCity,
        customer_state: personalData.customerState || "",
        customer_zip_code: personalData.customerZip || "",
        is_verified: localStorage.getItem("isVerified") === "true",
        device_count: parseInt(localStorage.getItem("noOfDevices") || "1"),
        employee_count: parseInt(localStorage.getItem("noOfEmployees") || "30"),
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system"
      };

      console.log("Admin update data being sent:", updateData);
      const result = await updateProfile(companyId, updateData);
      console.log("Admin profile update successful:", result);

      localStorage.setItem("firstName", adminData.firstName);
      localStorage.setItem("lastName", adminData.lastName);
      localStorage.setItem("userName", `${adminData.firstName} ${adminData.lastName}`.trim());
      localStorage.setItem("adminMail", adminData.email);
      localStorage.setItem("phone", adminData.phone);
      localStorage.setItem("phone_number", adminData.phone);

      setIsEditing(prev => ({ ...prev, admin: false }));
      showToast("Admin information updated successfully!");
    } catch (error) {
      console.error("Save Admin Error:", error);
      showToast("Failed to update admin information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    console.log("handleSaveCompany called");
    if (!validateCompanyForm()) {
      console.log("Validation failed");
      return;
    }

    if (!companyId) {
      showToast("Company ID not found", "error");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        company_name: companyData.name || "",
        company_logo: companyData.logo || "",
        report_type: localStorage.getItem("reportType") || "string",
        company_address_line1: companyData.address || "",
        company_address_line2: companyData.street2 || "",
        company_city: companyData.city || "",
        company_state: companyData.state || "",
        company_zip_code: companyData.zipCode || "",
        first_name: personalData.firstName || "",
        last_name: personalData.lastName || "",
        email: personalData.email || "",
        phone_number: personalData.phone ? personalData.phone.replace(/\D/g, '') : "",
        customer_address_line1: personalData.address || "",
        customer_address_line2: personalData.street2 || "",
        customer_city: personalData.customerCity || "",
        customer_state: personalData.customerState || "",
        customer_zip_code: personalData.customerZip || "",
        is_verified: false,
        device_count: parseInt(localStorage.getItem("noOfDevices") || "1"),
        employee_count: parseInt(localStorage.getItem("noOfEmployees") || "30"),
        last_modified_by: localStorage.getItem("adminMail") || localStorage.getItem("userName") || "system"
      };

      console.log("Calling updateProfile API with:", { companyId, updateData });
      const result = await updateProfile(companyId, updateData);
      console.log("API Response:", result);

      // Update localStorage after successful API call
      localStorage.setItem("companyName", companyData.name);
      localStorage.setItem("companyStreet", companyData.address);
      localStorage.setItem("companyStreet2", companyData.street2 || "");
      localStorage.setItem("companyCity", companyData.city);
      localStorage.setItem("companyState", companyData.state);
      localStorage.setItem("companyZip", companyData.zipCode);
      if (companyData.logo) {
        localStorage.setItem("companyLogo", companyData.logo);
      }
      

      setIsEditing(prev => ({ ...prev, company: false }));
      showToast("Company information updated successfully!");
    } catch (error) {
      console.error("Company Save Error:", error);
      showToast("Failed to update company information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (type) => {
    setIsEditing(prev => ({ ...prev, [type]: false }));

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
        state: formData.customerState,
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
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
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
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl">
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
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              {[
                ...(userType !== "Admin" && userType !== "SuperAdmin" ? [{ key: "personal", label: "Personal Information", icon: User }] : []),
                { key: "company", label: "Company Information", icon: Building },
                ...(userType === "Admin" || userType === "SuperAdmin" ? [{ key: "admin", label: userType === "SuperAdmin" ? "Super Admin Information" : "Admin Information", icon: User }] : [])
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key === "personal" ? "Personal" : "Company"}</span>
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
                        onChange={(e) => handlePersonalInputChange("firstName", e.target.value)}
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
                        onChange={(e) => handlePersonalInputChange("lastName", e.target.value)}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
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
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="phone"
                        value={personalData.phone}
                        onChange={(e) => handlePersonalInputChange("phone", e.target.value)}
                        disabled={!isEditing.personal}
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        placeholder="(123) 456-7890"
                      />
                    </div>
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
                      onChange={(e) => handlePersonalInputChange("city", e.target.value)}
                      disabled={!isEditing.personal}
                      className={errors.customerCity ? "border-red-500" : ""}
                    />
                    {errors.customerCity && <p className="text-sm text-red-600">{errors.customerCity}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={personalData.state}
                      onChange={(e) => handlePersonalInputChange("state", e.target.value)}
                      disabled={!isEditing.personal}
                      className={errors.customerState ? "border-red-500" : ""}
                    />
                    {errors.customerState && <p className="text-sm text-red-600">{errors.customerState}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={personalData.zipCode}
                      onChange={(e) => handlePersonalInputChange("zipCode", e.target.value)}
                      disabled={!isEditing.personal}
                      className={errors.customerZip ? "border-red-500" : ""}
                    />
                    {errors.customerZip && <p className="text-sm text-red-600">{errors.customerZip}</p>}
                  </div>
                </div>

                {isEditing.personal && (
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
                      className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
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
                  {!isEditing.company && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, company: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
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
                        onChange={(e) => handleCompanyInputChange("name", e.target.value)}
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
                      onChange={(e) => handleCompanyInputChange("city", e.target.value)}
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
                      onChange={(e) => handleCompanyInputChange("state", e.target.value)}
                      disabled={!isEditing.company}
                      className={errors.companyState ? "border-red-500" : ""}
                    />
                    {errors.companyState && <p className="text-sm text-red-600">{errors.companyState}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyZipCode">Zip Code</Label>
                    <Input
                      id="companyZipCode"
                      value={companyData.zipCode}
                      onChange={(e) => handleCompanyInputChange("zipCode", e.target.value)}
                      disabled={!isEditing.company}
                      className={errors.companyZip ? "border-red-500" : ""}
                    />
                    {errors.companyZip && <p className="text-sm text-red-600">{errors.companyZip}</p>}
                  </div>
                </div>

                {isEditing.company && (
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
                      className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
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
                        onChange={(e) => handleAdminInputChange("firstName", e.target.value)}
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
                        onChange={(e) => handleAdminInputChange("lastName", e.target.value)}
                        disabled={!isEditing.admin}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="adminPhone"
                        value={adminData.phone}
                        onChange={(e) => handleAdminInputChange("phone", e.target.value)}
                        disabled={!isEditing.admin}
                        className="pl-10"
                        placeholder="(123) 456-7890"
                      />
                    </div>
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
                      className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
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