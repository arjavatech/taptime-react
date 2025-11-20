import { fetchEmployeeData } from "../api.js";

// Login and authentication logic
export const initializeUserSession = async () => {
  const companyId = localStorage.getItem("companyID") || "";
  const customerId = localStorage.getItem("customerID") || "";
  const userType = localStorage.getItem("adminType") || "";

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
          (emp.Email?.toLowerCase() === adminMail || emp.email?.toLowerCase() === adminMail)
      );

      if (matchedAdmin) {
        console.log('Admin matched successfully:', { email: adminMail, type: userType });

        adminDetails = matchedAdmin;


      }
    } catch (error) {
      console.error("Failed to fetch admin details:", {
        message: error.message,
        userType,
        adminMail,
        timestamp: new Date().toISOString()
      });
      adminDetails = null;
    }
  } else if (storedAdmin) {
    adminDetails = JSON.parse(storedAdmin);
    console.log('Using stored admin details:', adminDetails);
    console.log('Company fields in stored admin:', {
      company_name: adminDetails.company_name,
      company_address_line1: adminDetails.company_address_line1,
      company_address_line2: adminDetails.company_address_line2,
      company_city: adminDetails.company_city,
      company_state: adminDetails.company_state,
      company_zip_code: adminDetails.company_zip_code
    });


  }

  return {
    companyId,
    customerId,
    userType,
    adminDetails
  };
};

// Load user profile data from localStorage (matching Profile.jsx structure)
export const loadProfileData = (adminDetails) => {
  // Debug all localStorage company-related values
  
  let formData = {
    // Company info
    companyName: localStorage.getItem("companyName") || "",
    companyStreet: localStorage.getItem("companyAddress1") || "",
    companyStreet2: localStorage.getItem("companyAddress2") || "",
    companyCity: localStorage.getItem("companyCity") || "",
    companyState: localStorage.getItem("companyState") || "",
    companyZip: localStorage.getItem("companyZipCode") || "",
    logo: localStorage.getItem("companyLogo") || "",

    // Customer/Admin personal info
    firstName: localStorage.getItem("firstName") || "",
    lastName: localStorage.getItem("lastName") || "",
    email: localStorage.getItem("adminMail") || "",
    phone: localStorage.getItem("phone") || localStorage.getItem("phoneNumber") || localStorage.getItem("phone_number") || "",

    // Customer address info (separate fields)
    customerStreet: localStorage.getItem("customerAddress1") || "",
    customerStreet2: localStorage.getItem("customerAddress2") || "",
    customerCity: localStorage.getItem("customerCity") || "",
    customerState: localStorage.getItem("customerState") || "",
    customerZip: localStorage.getItem("customerZipCode") || "",
    

    // Admin fields
    adminPin: "",
  };


  if (adminDetails) {
    console.log('AdminDetails received:', adminDetails);
    console.log(localStorage.getItem("reportType"))

    // Personal info from adminDetails - use actual data or fallbacks
    formData.firstName = adminDetails.first_name || adminDetails.FName || formData.firstName
    formData.lastName = adminDetails.last_name || adminDetails.LName || formData.lastName;
    formData.email = adminDetails.email || formData.email
    formData.phone = adminDetails.phone_number || formData.phone

    // Admin specific fields
    formData.adminPin = adminDetails.pin || adminDetails.Pin || "";

    // Company data from adminDetails
    formData.companyName = adminDetails.company_name || formData.companyName
    formData.companyStreet = adminDetails.company_address_line1 || formData.companyStreet || "";
    formData.companyStreet2 = adminDetails.company_address_line2 || formData.companyStreet2 || "";
    formData.companyCity = adminDetails.company_city || formData.companyCity || "";
    formData.companyState = adminDetails.company_state || formData.companyState || "";
    formData.companyZip = adminDetails.company_zip_code || formData.companyZip || "";

    // Customer address from API data
    formData.customerStreet = adminDetails.customer_address_line1 || formData.customerStreet || "";
    formData.customerStreet2 = adminDetails.customer_address_line2 || formData.customerStreet2 || "";
    formData.customerCity = adminDetails.customer_city || formData.customerCity || "";
    formData.customerState = adminDetails.customer_state || formData.customerState || "";
    formData.customerZip = adminDetails.customer_zip_code || formData.customerZip || "";

    // Company logo
    if (adminDetails.company_logo) {
      formData.logo = adminDetails.company_logo;
    }

    // Batch localStorage updates
    const updates = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      adminMail: formData.email,
      phone_number: formData.phone,
      phone: formData.phone,
      userName: `${formData.firstName} ${formData.lastName}`.trim(),
      companyName: formData.companyName,
      companyStreet: formData.companyStreet,
      companyStreet2: formData.companyStreet2,
      companyCity: formData.companyCity,
      companyState: formData.companyState,
      companyZipCode: formData.companyZip,
      customerStreet: formData.customerStreet,
      customerStreet2: formData.customerStreet2,
      customerCity: formData.customerCity,
      customerState: formData.customerState,
      customerZip: formData.customerZip
    };
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
    
    if (formData.logo) {
      localStorage.setItem("companyLogo", formData.logo);
    }
  }


  return formData;
};

// Authentication check (matching Profile.jsx requirements)
export const isUserAuthenticated = () => {
  const companyId = localStorage.getItem("companyID");
  const userType = localStorage.getItem("adminType");

  // Basic check - must have companyId and userType
  if (!companyId || !userType) {
    return false;
  }

  // For Admin/SuperAdmin, check if we have adminMail
  if (userType === "Admin" || userType === "SuperAdmin") {
    const adminMail = localStorage.getItem("adminMail");
    return !!adminMail;
  }

  // For other users, check customerId
  const customerId = localStorage.getItem("customerID");
  return !!customerId;
};

// Logout function
export const logoutUser = () => {
  localStorage.removeItem("companyID");
  localStorage.removeItem("customerID");
  localStorage.removeItem("adminType");

  localStorage.removeItem("adminMail");
  localStorage.removeItem("username");
  localStorage.removeItem("password");
};