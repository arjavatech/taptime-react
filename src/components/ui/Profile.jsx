import React, { useState, useEffect } from "react";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer";
import { updateCompany, updateCustomer, updateCompanyAndCustomer, fetchEmployeeData } from "../../utils/apiUtils";

const Profile = () => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [companyEditMode, setCompanyEditMode] = useState(false);
  const [customerEditMode, setCustomerEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeSection, setActiveSection] = useState("company");
  const [userType, setUserType] = useState("");



  // Form data structure
  const [formData, setFormData] = useState({
    companyName: "",
    companyStreet: "",
    companyStreet2: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    firstName: "",
    lastName: "",
    EName: "",
    customerStreet: "",
    customerStreet2: "",
    customerCity: "",
    customerState: "",
    customerZip: "",
    email: "",
    phone: "",
    logo: "",
    adminPin: "",
    decryptedPassword: "",
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
  const [fileInput, setFileInput] = useState(null);

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

      // If loggedAdmin doesn't exist and user is Admin/SuperAdmin, fetch it
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

      // Read directly from separate localStorage fields (new structure)
      const newFormData = {
        // Company info
        companyName: localStorage.getItem("companyName") || "",
        companyStreet: localStorage.getItem("companyStreet") || "",
        companyStreet2: localStorage.getItem("companyStreet2") || "",
        companyCity: localStorage.getItem("companyCity") || "",
        companyState: localStorage.getItem("companyState") || "",
        companyZip: localStorage.getItem("companyZip") || "",
        logo: localStorage.getItem("companyLogo") || "",

        // Customer/Admin personal info
        firstName: localStorage.getItem("firstName") || "",
        lastName: localStorage.getItem("lastName") || "",
        email: localStorage.getItem("adminMail") || "",
        phone: localStorage.getItem("phone") || localStorage.getItem("phoneNumber") || "",

        // Customer address info (separate fields)
        customerStreet: localStorage.getItem("customerStreet") || "",
        customerStreet2: localStorage.getItem("customerStreet2") || "",
        customerCity: localStorage.getItem("customerCity") || "",
        customerState: localStorage.getItem("customerState") || "",
        customerZip: localStorage.getItem("customerZip") || "",

        // Admin fields (populated later if admin)
        EName: "",
        adminPin: "",
        decryptedPassword: "",
      };

      if (adminDetails) {
        newFormData.EName = `${adminDetails.FName || ""} ${
          adminDetails.LName || ""
        }`.trim();
        newFormData.adminPin = adminDetails.Pin || "";
        newFormData.email = adminDetails.Email || "";
        newFormData.phone = adminDetails.PhoneNumber || "";
      }

      setFormData(newFormData);
      setIsLoading(false);
    };

    initializeProfile();
  }, []);

  // Company validation
  const validateCompanyFields = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Reset company errors
    newErrors.companyName = "";
    newErrors.companyStreet = "";
    newErrors.companyCity = "";
    newErrors.companyState = "";
    newErrors.companyZip = "";

    // Validate each field
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Please fill out this field";
      isValid = false;
    }

    if (!formData.companyStreet.trim()) {
      newErrors.companyStreet = "Please fill out this field";
      isValid = false;
    }

    if (!formData.companyCity.trim()) {
      newErrors.companyCity = "Please fill out this field";
      isValid = false;
    }

    if (!formData.companyState.trim()) {
      newErrors.companyState = "Please fill out this field";
      isValid = false;
    }

    if (!formData.companyZip.trim()) {
      newErrors.companyZip = "Please fill out this field";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Customer validation
  const validateCustomerFields = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Reset customer errors
    newErrors.firstName = "";
    newErrors.lastName = "";
    newErrors.customerStreet = "";
    newErrors.customerCity = "";
    newErrors.customerState = "";
    newErrors.customerZip = "";
    newErrors.email = "";
    newErrors.phone = "";

    // Validate each field
    if (!formData.firstName.trim()) {
      newErrors.firstName = "Please fill out this field";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Please fill out this field";
      isValid = false;
    }

    if (!formData.customerStreet.trim()) {
      newErrors.customerStreet = "Please fill out this field";
      isValid = false;
    }

    if (!formData.customerCity.trim()) {
      newErrors.customerCity = "Please fill out this field";
      isValid = false;
    }

    if (!formData.customerState.trim()) {
      newErrors.customerState = "Please fill out this field";
      isValid = false;
    }

    if (!formData.customerZip.trim()) {
      newErrors.customerZip = "Please fill out this field";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please fill out this field";
      isValid = false;
    }

    if (
      formData.phone &&
      !/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/.test(formData.phone)
    ) {
      newErrors.phone = "Please use format: (123) 456-7890";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Combined validation for Owner admin type
  const validateAllFields = () => {
    const companyValid = validateCompanyFields();
    const customerValid = validateCustomerFields();
    return companyValid && customerValid;
  };

  // API functions
  const callCompanyAPI = async () => {
    console.log("=== callCompanyAPI entered ===");
    console.log("companyId:", companyId);

    if (!companyId) {
      console.error("❌ Exiting early: No companyId found");
      return;
    }

    const companyData = {
      CID: companyId,
      UserName: localStorage.getItem("username"),
      CName: formData.companyName,
      CAddress: `${formData.companyStreet}--${formData.companyStreet2 || ""}--${formData.companyCity}--${formData.companyState}--${formData.companyZip}`,
      CLogo: formData.logo || localStorage.getItem("companyLogo"),
      Password: localStorage.getItem("password"),
      ReportType: "Weekly",
      LastModifiedBy: "Admin",
    };

    console.log("Company data to send:", companyData);

    try {
      console.log("🚀 Calling updateCompany API...");
      await updateCompany(companyId, companyData);
      console.log("✅ updateCompany API call completed successfully");

      // Update localStorage with new values
      localStorage.setItem("companyName", formData.companyName);
      localStorage.setItem("companyStreet", formData.companyStreet);
      localStorage.setItem("companyStreet2", formData.companyStreet2 || "");
      localStorage.setItem("companyCity", formData.companyCity);
      localStorage.setItem("companyState", formData.companyState);
      localStorage.setItem("companyZip", formData.companyZip);
      if (formData.logo) {
        localStorage.setItem("companyLogo", formData.logo);
      }

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("❌ Company API Error:", error);
    }
  };

  const callCustomerAPI = async () => {
    console.log("=== callCustomerAPI entered ===");
    console.log("companyId:", companyId, "customerId:", customerId);

    if (!companyId || !customerId) {
      console.error("❌ Exiting early: Missing IDs - companyId:", companyId, "customerId:", customerId);
      return;
    }

    const customerData = {
      CustomerID: customerId,
      CID: companyId,
      FName: formData.firstName,
      LName: formData.lastName,
      Address: `${formData.customerStreet}--${formData.customerStreet2 || ""}--${formData.customerCity}--${formData.customerState}--${formData.customerZip}`,
      PhoneNumber: formData.phone,
      Email: formData.email,
      IsActive: true,
      LastModifiedBy: "Admin",
    };

    console.log("Customer data to send:", customerData);

    try {
      console.log("🚀 Calling updateCustomer API...");
      await updateCustomer(customerId, customerData);
      console.log("✅ updateCustomer API call completed successfully");

      // Update localStorage with new values
      localStorage.setItem("firstName", formData.firstName);
      localStorage.setItem("lastName", formData.lastName);
      localStorage.setItem("userName", `${formData.firstName} ${formData.lastName}`.trim());
      localStorage.setItem("adminMail", formData.email);
      localStorage.setItem("phone", formData.phone);
      localStorage.setItem("phoneNumber", formData.phone);
      localStorage.setItem("customerStreet", formData.customerStreet);
      localStorage.setItem("customerStreet2", formData.customerStreet2 || "");
      localStorage.setItem("customerCity", formData.customerCity);
      localStorage.setItem("customerState", formData.customerState);
      localStorage.setItem("customerZip", formData.customerZip);

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("❌ Customer API Error:", error);
    }
  };

  // Combined API call for Owner admin type - updates both company and customer in one call
  const callCombinedOwnerAPI = async () => {
    console.log("=== callCombinedOwnerAPI entered ===");
    console.log("companyId:", companyId);

    if (!companyId) {
      console.error("❌ Exiting early: No companyId found");
      return;
    }

    const combinedData = {
      // Company fields (snake_case)
      company_name: formData.companyName,
      company_logo: formData.logo || localStorage.getItem("companyLogo") || "",
      report_type: localStorage.getItem("reportType") || "Weekly",
      company_address_line1: formData.companyStreet,
      company_address_line2: formData.companyStreet2 || "",
      company_city: formData.companyCity,
      company_state: formData.companyState,
      company_zip_code: formData.companyZip,

      // Customer fields (snake_case)
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone_number: formData.phone,
      customer_address_line1: formData.customerStreet,
      customer_address_line2: formData.customerStreet2 || "",
      customer_city: formData.customerCity,
      customer_state: formData.customerState,
      customer_zip_code: formData.customerZip,

      // Additional metadata
      is_verified: localStorage.getItem("isVerified") === "true" || true,
      device_count: parseInt(localStorage.getItem("NoOfDevices") || "1"),
      employee_count: parseInt(localStorage.getItem("NoOfEmployees") || "30"),
      last_modified_by: localStorage.getItem("adminMail") || "Admin"
    };

    console.log("Combined data to send:", combinedData);

    try {
      console.log("🚀 Calling updateCompanyAndCustomer API...");
      await updateCompanyAndCustomer(companyId, combinedData);
      console.log("✅ updateCompanyAndCustomer API call completed successfully");

      // Update ALL localStorage values (company + customer)
      localStorage.setItem("companyName", formData.companyName);
      localStorage.setItem("companyStreet", formData.companyStreet);
      localStorage.setItem("companyStreet2", formData.companyStreet2 || "");
      localStorage.setItem("companyCity", formData.companyCity);
      localStorage.setItem("companyState", formData.companyState);
      localStorage.setItem("companyZip", formData.companyZip);
      if (formData.logo) {
        localStorage.setItem("companyLogo", formData.logo);
      }

      localStorage.setItem("firstName", formData.firstName);
      localStorage.setItem("lastName", formData.lastName);
      localStorage.setItem("userName", `${formData.firstName} ${formData.lastName}`.trim());
      localStorage.setItem("adminMail", formData.email);
      localStorage.setItem("phone", formData.phone);
      localStorage.setItem("phoneNumber", formData.phone);
      localStorage.setItem("customerStreet", formData.customerStreet);
      localStorage.setItem("customerStreet2", formData.customerStreet2 || "");
      localStorage.setItem("customerCity", formData.customerCity);
      localStorage.setItem("customerState", formData.customerState);
      localStorage.setItem("customerZip", formData.customerZip);

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("❌ Combined Owner API Error:", error);
    }
  };



  const formatPhoneNumberInput = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 3 && value.length <= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
        6,
        10
      )}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }

    setFormData({ ...formData, phone: value });
  };



  // Logo upload
  const handleLogoUpload = (event) => {
    const input = event.target;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newLogo = e.target.result;
        setFormData({ ...formData, logo: newLogo });
        localStorage.setItem("companyLogo", newLogo);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  const triggerFileUpload = () => {
    if (companyEditMode && fileInput) {
      fileInput.click();
    }
  };

  const toggleCompanyEditMode = () => {
    console.log("toggleCompanyEditMode called, userType:", userType, "companyEditMode:", companyEditMode);

    if (companyEditMode) {
      // Save mode - user clicked "Save"
      if (userType === "Owner") {
        console.log("Owner: Validating all fields and calling combined API");
        const isValid = validateAllFields();
        console.log("Validation result (validateAllFields):", isValid);
        if (isValid) {
          console.log("✅ Validation passed - calling callCombinedOwnerAPI");
          callCombinedOwnerAPI();
          setCompanyEditMode(false);
        } else {
          console.log("❌ Validation failed - API will not be called");
        }
      } else {
        // Admin or SuperAdmin
        console.log("Admin/SuperAdmin: Validating company fields and calling company API");
        const isValid = validateCompanyFields();
        console.log("Validation result (validateCompanyFields):", isValid);
        if (isValid) {
          console.log("✅ Validation passed - calling callCompanyAPI");
          callCompanyAPI();
          setCompanyEditMode(false);
        } else {
          console.log("❌ Validation failed - API will not be called");
        }
      }
    } else {
      // Edit mode - user clicked "Edit"
      console.log("Entering edit mode");
      setCompanyEditMode(true);
      setCustomerEditMode(false);
    }
  };

  const toggleCustomerEditMode = () => {
    if (customerEditMode) {
      if (userType === "Owner") {
        if (validateAllFields()) {
          callCombinedOwnerAPI();
          setCustomerEditMode(false);
        }
      } else {
        if (validateCustomerFields()) {
          callCustomerAPI();
          setCustomerEditMode(false);
        }
      }
    } else {
      setCustomerEditMode(true);
      setCompanyEditMode(false);
    }
  };

  // Validation
  const validateRequiredFields = (section) => {
    const companyFields = [
      "companyName",
      "username",
      "companyStreet",
      "companyCity",
      "companyState",
      "companyZip",
    ];
    const customerFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "customerStreet",
      "customerCity",
      "customerState",
      "customerZip",
    ];
    const fieldsToCheck =
      section === "company" ? companyFields : customerFields;

    return fieldsToCheck.every((field) => !!formData[field]);
  };

  // Switch sections
  const showSection = (section) => {
    setActiveSection(section);
    setCompanyEditMode(false);
    setCustomerEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Clear error when field is updated
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleBlur = (field) => {
    if (companyEditMode && !formData[field]?.trim()) {
      setErrors({ ...errors, [field]: "Please fill out this field" });
    } else {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
    <Header2/>
      
      <div className="flex-grow bg-gray-100">
        {/* Loading Overlay */}
        {isLoading && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-[#02066F] text-white p-4 rounded-t-lg">
                <h5 className="text-lg font-bold text-center">Success!</h5>
              </div>
              <div className="p-10">
                <p className="text-center font-semibold mb-4">
                  Your details have been updated successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl w-full mx-auto px-4 py-8 pt-28">
          {/* Section Toggle Buttons */}
          <div className="text-center mb-6 space-y-2">
            <button
              className={`px-6 py-3 rounded-xl mr-2 cursor-pointer ${
                activeSection === "company"
                  ? "bg-[#02066F] text-white"
                  : "bg-white text-[#02066F] border border-[#02066F]"
              }`}
              onClick={() => showSection("company")}
            >
              Company Details
            </button>
            <button
              className={`px-6 py-3 rounded-xl cursor-pointer ${
                activeSection === "customer"
                  ? "bg-[#02066F] text-white"
                  : "bg-white text-[#02066F] border border-[#02066F]"
              }`}
              onClick={() => showSection("customer")}
            >
              {userType === "Owner"
                ? "Customer Details"
                : userType === "Admin"
                ? "Admin Details"
                : "Super Admin Details"}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Profile
          </h1>

          {/* Company Section */}
          {activeSection === "company" && (
            <>
              {/* Logo Section */}
              <div className="flex justify-center mb-8">
                <div
                  className={`relative w-24 h-24 rounded-full border-2 border-[#02066F] overflow-hidden 
                  ${
                    companyEditMode
                      ? "cursor-pointer bg-white"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                  onClick={() => companyEditMode && triggerFileUpload()}
                >
                  {typeof formData.logo === "string" && formData.logo === "" ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <i className="fas fa-building text-3xl text-gray-500"></i>
                    </div>
                  ) : (
                    <img
                      src={formData.logo}
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                    />
                  )}

                  <input
                    ref={setFileInput}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 pb-10 mb-8">
                {/* Company Form */}
                <form id="companyForm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-1">
                        Company Name:
                      </label>
                      <input
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        type="text"
                        placeholder="Company Name"
                        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          !companyEditMode ? "bg-gray-200 text-gray-500" : ""
                        }`}
                        disabled={!companyEditMode}
                        required
                        onBlur={() => handleBlur("companyName")}
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-1">
                        Company Address Line 1:
                      </label>
                      <input
                        value={formData.companyStreet}
                        onChange={(e) =>
                          handleInputChange("companyStreet", e.target.value)
                        }
                        type="text"
                        placeholder="Company Address Line 1"
                        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          !companyEditMode ? "bg-gray-200 text-gray-500" : ""
                        }`}
                        disabled={!companyEditMode}
                        required
                        onBlur={() => handleBlur("companyStreet")}
                      />
                      {errors.companyStreet && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyStreet}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-1">
                        Company State:
                      </label>
                      <input
                        value={formData.companyState}
                        onChange={(e) =>
                          handleInputChange("companyState", e.target.value)
                        }
                        type="text"
                        placeholder="Company State"
                        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          !companyEditMode ? "bg-gray-200 text-gray-500" : ""
                        }`}
                        disabled={!companyEditMode}
                        required
                        onBlur={() => handleBlur("companyState")}
                      />
                      {errors.companyState && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyState}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-1">
                        Company City:
                      </label>
                      <input
                        value={formData.companyCity}
                        onChange={(e) =>
                          handleInputChange("companyCity", e.target.value)
                        }
                        type="text"
                        placeholder="Company City"
                        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          !companyEditMode ? "bg-gray-200 text-gray-500" : ""
                        }`}
                        disabled={!companyEditMode}
                        required
                        onBlur={() => handleBlur("companyCity")}
                      />
                      {errors.companyCity && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyCity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-base font-bold text-gray-900 mb-1">
                        Company Zip Code:
                      </label>
                      <input
                        value={formData.companyZip}
                        onChange={(e) =>
                          handleInputChange("companyZip", e.target.value)
                        }
                        type="text"
                        placeholder="Company Zip"
                        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                          !companyEditMode ? "bg-gray-200 text-gray-500" : ""
                        }`}
                        disabled={!companyEditMode}
                        required
                        onBlur={() => handleBlur("companyZip")}
                      />
                      {errors.companyZip && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyZip}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Form Actions */}
              <div className="flex justify-center mt-10 pb-16">
                <button
                  onClick={toggleCompanyEditMode}
                  className="w-full px-8 py-3 bg-[#02066F] cursor-pointer text-white rounded-lg text-lg font-bold"
                >
                  {companyEditMode ? "Save" : "Edit"}
                </button>
              </div>
            </>
          )}

          {/* Customer Section */}
          {activeSection === "customer" && (
            <>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8">
                {userType !== "Admin" && userType !== "SuperAdmin" ? (
                  <form id="customerForm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          First Name:
                        </label>
                        <input
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                          type="text"
                          placeholder="First Name"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("firstName")}
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Last Name:
                        </label>
                        <input
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                          type="text"
                          placeholder="Last Name"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("lastName")}
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Email:
                        </label>
                        <input
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          type="email"
                          placeholder="Email"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("email")}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Phone Number:
                        </label>
                        <input
                          value={formData.phone}
                          onChange={formatPhoneNumberInput}
                          type="tel"
                          placeholder="Phone Number"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("phone")}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Customer Address Line 1:
                        </label>
                        <input
                          value={formData.customerStreet}
                          onChange={(e) =>
                            handleInputChange("customerStreet", e.target.value)
                          }
                          type="text"
                          placeholder="Customer Address Line 1"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("customerStreet")}
                        />
                        {errors.customerStreet && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.customerStreet}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Customer State:
                        </label>
                        <input
                          value={formData.customerState}
                          onChange={(e) =>
                            handleInputChange("customerState", e.target.value)
                          }
                          type="text"
                          placeholder="Customer State"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("customerState")}
                        />
                        {errors.customerState && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.customerState}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Customer City:
                        </label>
                        <input
                          value={formData.customerCity}
                          onChange={(e) =>
                            handleInputChange("customerCity", e.target.value)
                          }
                          type="text"
                          placeholder="Customer City"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("customerCity")}
                        />
                        {errors.customerCity && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.customerCity}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Customer Zip Code:
                        </label>
                        <input
                          value={formData.customerZip}
                          onChange={(e) =>
                            handleInputChange("customerZip", e.target.value)
                          }
                          type="text"
                          placeholder="Customer Zip"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("customerZip")}
                        />
                        {errors.customerZip && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.customerZip}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                ) : (
                  <form id="adminForm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pin */}
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Pin:
                        </label>
                        <input
                          value={formData.adminPin}
                          onChange={(e) =>
                            handleInputChange("adminPin", e.target.value)
                          }
                          type="number"
                          placeholder="Pin"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("adminPin")}
                        />
                        {errors.adminPin && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.adminPin}
                          </p>
                        )}
                      </div>

                      {/* Employee Name */}
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Employee Name:
                        </label>
                        <input
                          value={formData.EName}
                          onChange={(e) =>
                            handleInputChange("EName", e.target.value)
                          }
                          type="text"
                          placeholder="Employee Name"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("EName")}
                        />
                        {errors.EName && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.EName}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Email:
                        </label>
                        <input
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          type="email"
                          placeholder="Email"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("email")}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-base font-bold text-gray-900 mb-1">
                          Phone Number:
                        </label>
                        <input
                          value={formData.phone}
                          onChange={formatPhoneNumberInput}
                          type="tel"
                          placeholder="Phone Number"
                          className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${
                            !customerEditMode ? "bg-gray-200 text-gray-500" : ""
                          }`}
                          disabled={!customerEditMode}
                          required
                          onBlur={() => handleBlur("phone")}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-center mt-10 pb-16">
                <button
                  onClick={toggleCustomerEditMode}
                  className="w-full px-8 py-3 bg-[#02066F] cursor-pointer text-white rounded-lg text-lg font-bold"
                >
                  {customerEditMode ? "Save" : "Edit"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    <Footer2/>      
    </div>
  );
};

export default Profile;
