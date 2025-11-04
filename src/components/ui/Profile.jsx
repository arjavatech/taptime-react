import React, { useState, useEffect } from "react";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer2";
import { updateCompany, updateCustomer } from "../../utils/apiUtils";

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
    companyCity: "",
    companyState: "",
    companyZip: "",
    firstName: "",
    lastName: "",
    EName: "",
    customerStreet: "",
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

      const companyAddress = localStorage.getItem("companyAddress") || "";
      const customerAddress = localStorage.getItem("address") || "";
      const [companyStreet, companyCity, companyState, companyZip] =
        companyAddress.split("--");
      const [customerStreet, customerCity, customerState, customerZip] =
        customerAddress.split("--");

      const newFormData = {
        companyName: localStorage.getItem("companyName") || "",
        companyStreet: companyStreet || "",
        companyCity: companyCity || "",
        companyState: companyState || "",
        companyZip: companyZip || "",
        logo: localStorage.getItem("companyLogo") || "",
        firstName: localStorage.getItem("firstName") || "",
        lastName: localStorage.getItem("lastName") || "",
        customerStreet: customerStreet || "",
        customerCity: customerCity || "",
        customerState: customerState || "",
        customerZip: customerZip || "",
        email: localStorage.getItem("email") || "",
        phone: localStorage.getItem("phone") || "",
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

  // Unified validation
  const validateFields = (fieldsToValidate) => {
    let isValid = true;
    const newErrors = { ...errors };

    // Reset errors for fields being validated
    fieldsToValidate.forEach(field => {
      newErrors[field] = "";
    });

    // Validate each field
    fieldsToValidate.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = "Please fill out this field";
        isValid = false;
      }
    });

    // Special phone validation
    if (fieldsToValidate.includes('phone') && formData.phone && !/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/.test(formData.phone)) {
      newErrors.phone = "Please use format: (123) 456-7890";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateCompanyFields = () => validateFields(['companyName', 'companyStreet', 'companyCity', 'companyState', 'companyZip']);
  const validateCustomerFields = () => validateFields(['firstName', 'lastName', 'customerStreet', 'customerCity', 'customerState', 'customerZip', 'email', 'phone']);

  // API functions
  const callCompanyAPI = async () => {
    if (!companyId) return;
    const companyData = {
      CID: companyId,
      UserName: localStorage.getItem("username"),
      CName: formData.companyName,
      CAddress: `${formData.companyStreet}--${formData.companyCity}--${formData.companyState}--${formData.companyZip}`,
      CLogo: formData.logo || localStorage.getItem("companyLogo"),
      Password: localStorage.getItem("password"),
      ReportType: "Weekly",
      LastModifiedBy: "Admin",
    };

    try {
      await updateCompany(companyId, companyData);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("Company API Error:", error);
    }
  };

  const callCustomerAPI = async () => {
    if (!companyId || !customerId) return;
    const customerData = {
      CustomerID: customerId,
      CID: companyId,
      FName: formData.firstName,
      LName: formData.lastName,
      Address: `${formData.customerStreet}--${formData.customerCity}--${formData.customerState}--${formData.customerZip}`,
      PhoneNumber: formData.phone,
      Email: formData.email,
      IsActive: true,
      LastModifiedBy: "Admin",
    };

    try {
      await updateCustomer(customerId, customerData);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("Customer API Error:", error);
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
    if (userType === "Owner" && companyEditMode) {
      if (validateCompanyFields()) {
        callCompanyAPI();
        setCompanyEditMode(false);
      }
    } else {
      setCompanyEditMode(true);
      setCustomerEditMode(false);
    }
  };

  const toggleCustomerEditMode = () => {
    if (customerEditMode) {
      if (validateCustomerFields()) {
        callCustomerAPI();
        setCustomerEditMode(false);
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
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleBlur = (field) => {
    const editMode = companyEditMode || customerEditMode;
    if (editMode && !formData[field]?.trim()) {
      setErrors({ ...errors, [field]: "Please fill out this field" });
    } else {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Reusable Components
  const FormField = ({ field, label, type = "text", placeholder, disabled, required = true, onChange }) => (
    <div>
      <label className="block text-base font-bold text-gray-900 mb-1">{label}:</label>
      <input
        value={formData[field]}
        onChange={onChange || ((e) => handleInputChange(field, e.target.value))}
        type={type}
        placeholder={placeholder || label}
        className={`w-full px-4 py-3 rounded-lg border border-[#02066F] text-[#02066F] font-bold focus:outline-none focus:ring-1 focus:ring-black ${disabled ? "bg-gray-200 text-gray-500" : ""}`}
        disabled={disabled}
        required={required}
        onBlur={() => handleBlur(field)}
      />
      {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  const Modal = ({ show, title, children }) => show ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-[#02066F] text-white p-4 rounded-t-lg">
          <h5 className="text-lg font-bold text-center">{title}</h5>
        </div>
        <div className="p-10">{children}</div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col">
    <Header2/>
      
      <div className="flex-grow bg-gray-100">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}

        <Modal show={showSuccessModal} title="Success!">
          <p className="text-center font-semibold mb-4">Your details have been updated successfully!</p>
        </Modal>

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
                    <FormField field="companyName" label="Company Name" disabled={!companyEditMode} />
                    <FormField field="companyStreet" label="Company Address Line 1" disabled={!companyEditMode} />
                    <FormField field="companyState" label="Company State" disabled={!companyEditMode} />
                    <FormField field="companyCity" label="Company City" disabled={!companyEditMode} />
                    <FormField field="companyZip" label="Company Zip Code" placeholder="Company Zip" disabled={!companyEditMode} />
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
                      <FormField field="firstName" label="First Name" disabled={!customerEditMode} />
                      <FormField field="lastName" label="Last Name" disabled={!customerEditMode} />
                      <FormField field="email" label="Email" type="email" disabled={!customerEditMode} />
                      <FormField field="phone" label="Phone Number" type="tel" disabled={!customerEditMode} onChange={formatPhoneNumberInput} />
                      <FormField field="customerStreet" label="Customer Address Line 1" disabled={!customerEditMode} />
                      <FormField field="customerState" label="Customer State" disabled={!customerEditMode} />
                      <FormField field="customerCity" label="Customer City" disabled={!customerEditMode} />
                      <FormField field="customerZip" label="Customer Zip Code" placeholder="Customer Zip" disabled={!customerEditMode} />
                    </div>
                  </form>
                ) : (
                  <form id="adminForm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField field="adminPin" label="Pin" type="number" disabled={!customerEditMode} />
                      <FormField field="EName" label="Employee Name" disabled={!customerEditMode} />
                      <FormField field="email" label="Email" type="email" disabled={!customerEditMode} />
                      <FormField field="phone" label="Phone Number" type="tel" disabled={!customerEditMode} onChange={formatPhoneNumberInput} />
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
