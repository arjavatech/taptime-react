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

  return {
    companyId,
    customerId,
    userType,
    adminDetails
  };
};

// Load user profile data from localStorage (matching Profile.jsx structure)
export const loadProfileData = (adminDetails) => {
  const formData = {
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

    // Admin fields
    EName: "",
    adminPin: "",
    decryptedPassword: "",
  };

  if (adminDetails) {
    formData.EName = `${adminDetails.FName || ""} ${adminDetails.LName || ""}`.trim();
    formData.adminPin = adminDetails.Pin || "";
    formData.email = adminDetails.Email || "";
    formData.phone = adminDetails.PhoneNumber || "";
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
  localStorage.removeItem("loggedAdmin");
  localStorage.removeItem("adminMail");
  localStorage.removeItem("username");
  localStorage.removeItem("password");
};