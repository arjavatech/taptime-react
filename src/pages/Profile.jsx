import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { updateCompany, updateCustomer, fetchEmployeeData } from "../api.js";
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
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState({ personal: false, company: false });
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userType, setUserType] = useState("");

  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    EName: "",
    adminPin: "",
    decryptedPassword: "",
  });

  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
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
    adminPin: "",
    EName: "",
  });

  const [companyId, setCompanyId] = useState("");
  const [customerId, setCustomerId] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const formatPhoneNumber = (value) => {
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
    if (field === "phone") {
      value = formatPhoneNumber(value);
    }
    setPersonalData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCompanyInputChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyData(prev => ({ ...prev, logo: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      const companyId = localStorage.getItem("companyID") || "";
      const customerId = localStorage.getItem("customerID") || "";
      const userType = localStorage.getItem("adminType") || "";

      setCompanyId(companyId);
      setCustomerId(customerId);
      setUserType(userType);

      let adminDetails = null;
      const storedAdmin = localStorage.getItem("loggedAdmin");

      if (!storedAdmin && (userType === "Admin" || userType === "SuperAdmin")) {
        try {
          const employeeData = await fetchEmployeeData();
          const allEmployees = Array.isArray(employeeData) ? employeeData : [];
          const adminLevel = userType === "Admin" ? 1 : 2;
          const adminMail = localStorage.getItem("adminMail")?.toLowerCase();

          const matchedAdmin = allEmployees.find(
            emp => emp.IsAdmin === adminLevel &&
                   emp.Email?.toLowerCase() === adminMail
          );

          if (matchedAdmin) {
            localStorage.setItem("loggedAdmin", JSON.stringify(matchedAdmin));
            adminDetails = matchedAdmin;
          }
        } catch (error) {
          console.error("Error fetching admin details:", error);
        }
      } else if (storedAdmin) {
        adminDetails = JSON.parse(storedAdmin);
      }

      const companyAddress = localStorage.getItem("companyAddress") || "";
      const customerAddress = localStorage.getItem("address") || "";
      const [companyStreet, companyCity, companyState, companyZip] = companyAddress.split("--");
      const [customerStreet, customerCity, customerState, customerZip] = customerAddress.split("--");

      setPersonalData({
        firstName: localStorage.getItem("firstName") || "",
        lastName: localStorage.getItem("lastName") || "",
        email: localStorage.getItem("email") || "",
        phone: localStorage.getItem("phone") || "",
        address: customerStreet || "",
        city: customerCity || "",
        state: customerState || "",
        zipCode: customerZip || "",
        EName: adminDetails ? `${adminDetails.FName || ""} ${adminDetails.LName || ""}`.trim() : "",
        adminPin: adminDetails?.Pin || "",
        decryptedPassword: "",
      });

      setCompanyData({
        name: localStorage.getItem("companyName") || "",
        address: companyStreet || "",
        city: companyCity || "",
        state: companyState || "",
        zipCode: companyZip || "",
        logo: localStorage.getItem("companyLogo") || ""
      });

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

    if (!personalData.firstName.trim()) {
      newErrors.firstName = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.lastName.trim()) {
      newErrors.lastName = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.address.trim()) {
      newErrors.customerStreet = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.city.trim()) {
      newErrors.customerCity = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.state.trim()) {
      newErrors.customerState = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.zipCode.trim()) {
      newErrors.customerZip = "Please fill out this field";
      isValid = false;
    }

    if (!personalData.email.trim()) {
      newErrors.email = "Please fill out this field";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      newErrors.email = "Valid email is required";
      isValid = false;
    }

    if (personalData.phone && !/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/.test(personalData.phone)) {
      newErrors.phone = "Please use format: (123) 456-7890";
      isValid = false;
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

    if (!companyData.zipCode.trim()) {
      newErrors.companyZip = "Please fill out this field";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSavePersonal = async () => {
    if (!validatePersonalForm()) return;

    if (!companyId || !customerId) return;
    
    setIsLoading(true);
    try {
      const customerData = {
        CustomerID: customerId,
        CID: companyId,
        FName: personalData.firstName,
        LName: personalData.lastName,
        Address: `${personalData.address}--${personalData.city}--${personalData.state}--${personalData.zipCode}`,
        PhoneNumber: personalData.phone,
        Email: personalData.email,
        IsActive: true,
        LastModifiedBy: "Admin",
      };

      await updateCustomer(customerId, customerData);
      
      // Update localStorage
      localStorage.setItem("firstName", personalData.firstName);
      localStorage.setItem("lastName", personalData.lastName);
      localStorage.setItem("email", personalData.email);
      localStorage.setItem("phone", personalData.phone);
      localStorage.setItem("address", `${personalData.address}--${personalData.city}--${personalData.state}--${personalData.zipCode}`);
      
      setIsEditing(prev => ({ ...prev, personal: false }));
      showToast("Personal information updated successfully!");
    } catch (error) {
      console.error("Customer API Error:", error);
      showToast("Failed to update personal information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!validateCompanyForm()) return;

    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const companyDataPayload = {
        CID: companyId,
        UserName: localStorage.getItem("username"),
        CName: companyData.name,
        CAddress: `${companyData.address}--${companyData.city}--${companyData.state}--${companyData.zipCode}`,
        CLogo: companyData.logo || localStorage.getItem("companyLogo"),
        Password: localStorage.getItem("password"),
        ReportType: "Weekly",
        LastModifiedBy: "Admin",
      };

      await updateCompany(companyId, companyDataPayload);
      
      // Update localStorage
      localStorage.setItem("companyName", companyData.name);
      localStorage.setItem("companyAddress", `${companyData.address}--${companyData.city}--${companyData.state}--${companyData.zipCode}`);
      if (companyData.logo) {
        localStorage.setItem("companyLogo", companyData.logo);
      }
      
      setIsEditing(prev => ({ ...prev, company: false }));
      showToast("Company information updated successfully!");
    } catch (error) {
      console.error("Company API Error:", error);
      showToast("Failed to update company information", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (type) => {
    setIsEditing(prev => ({ ...prev, [type]: false }));
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
      adminPin: "",
      EName: "",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
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

      <div className="pt-20 pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
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
                { key: "personal", label: "Personal Information", icon: User },
                { key: "company", label: "Company Information", icon: Building }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === key
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
          {activeTab === "personal" && (
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
                    <Label htmlFor="email">Email Address</Label>
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
                      value={personalData.city}
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
                    <Label htmlFor="companyAddress">Street Address</Label>
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
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;