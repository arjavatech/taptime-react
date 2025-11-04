import { supabase } from '../config/supabase';

// API Base URLs
export const API_URLS = {
  employee: 'https://postgresql-restless-waterfall-2105.fly.dev/employee',
  company: 'https://postgresql-restless-waterfall-2105.fly.dev/company',
  customer: 'https://postgresql-restless-waterfall-2105.fly.dev/customer',
  device: 'https://postgresql-restless-waterfall-2105.fly.dev/device',
  loginCheck: 'https://postgresql-restless-waterfall-2105.fly.dev/employee/login_check',
  signUp: 'https://postgresql-restless-waterfall-2105.fly.dev/auth/sign_up'
};

// Encryption key
export const ENCRYPTION_KEY = new Uint8Array([
  16, 147, 220, 113, 166, 142, 22, 93, 241, 91, 13, 252, 112, 122, 119, 95
]);

// Encryption/Decryption functions
export const generateRandomBytes = (length) => {
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return randomValues;
};

export const encrypt = async (data, key) => {
  const dataBuffer = new TextEncoder().encode(data);
  const algorithm = { name: 'AES-GCM', iv: generateRandomBytes(12) };
  const importedKey = await window.crypto.subtle.importKey(
    'raw', key, { name: 'AES-GCM' }, false, ['encrypt']
  );

  const encryptedData = await window.crypto.subtle.encrypt(
    algorithm, importedKey, dataBuffer
  );

  const iv = algorithm.iv;
  const encryptedDataWithIV = new Uint8Array(iv.byteLength + encryptedData.byteLength);
  encryptedDataWithIV.set(iv);
  encryptedDataWithIV.set(new Uint8Array(encryptedData), iv.byteLength);

  return btoa(String.fromCharCode(...new Uint8Array(encryptedDataWithIV)));
};

export const decrypt = async (encryptedDataWithIV, key) => {
  const buffer = new Uint8Array(
    atob(encryptedDataWithIV).split('').map(char => char.charCodeAt(0))
  );
  const iv = buffer.slice(0, 12);
  const encryptedData = buffer.slice(12);

  const algorithm = { name: 'AES-GCM', iv: iv };
  const importedKey = await window.crypto.subtle.importKey(
    'raw', key, algorithm, false, ['decrypt']
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    algorithm, importedKey, encryptedData
  );

  return new TextDecoder().decode(decryptedData);
};

// Authentication functions
export const loginCheck = async (username, password) => {
  try {
    const response = await fetch(`${API_URLS.company}/getuser/${username}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const decryptPassword = await decrypt(data["Password"], ENCRYPTION_KEY);
    const companyID = data["CID"];
    
    localStorage.setItem("companyID", companyID);
    localStorage.setItem("companyName", data["CName"]);
    localStorage.setItem("companyLogo", data["CLogo"]);
    localStorage.setItem("companyAddress", data["CAddress"]);
    localStorage.setItem("username", data["UserName"]);
    localStorage.setItem("password", data["Password"]);
    localStorage.setItem("reportType", data["ReportType"]);
    localStorage.setItem("adminType", "customer");
    localStorage.setItem("passwordDecryptedValue", decryptPassword);
    
    return data["UserName"] === username && decryptPassword === password;
  } catch (error) {
    console.error("Login check error:", error);
    return false;
  }
};

/**
 * Validate employee email and fetch company/admin data
 *
 * NOTE: Despite the name "googleSignInCheck", this function validates ANY email
 * against the backend employee database.
 *
 * Purpose:
 * - Validates that the email exists in the employee database
 * - Checks admin role requirements (Admin, SuperAdmin, or Owner only)
 * - Fetches and stores company, device, and employee data
 *
 * Used by:
 * - Supabase Google OAuth login (Login_new.jsx) - Required for fetching company data
 * - Legacy Google Sign-In (Login.jsx - old implementation)
 *
 * NOT used by:
 * - Supabase email/password login - Skips backend validation, uses only Supabase data
 *
 * @param {string} email - The authenticated user's email
 * @returns {Promise<Object>} - { success: boolean, companyID?: string, error?: string }
 */
export const googleSignInCheck = async (email) => {
  try {
    const res = await fetch(`${API_URLS.loginCheck}/${email}`);
    if (!res.ok) throw new Error('Network response was not ok');

    const data = await res.json();

    if ("error" in data) {
      throw new Error("Invalid Gmail login");
    }

    if (["Admin", "SuperAdmin", "Owner"].includes(data["admin_type"])) {
      const companyID = data["cid"];

      // Combine customer address fields for backward compatibility
      const customerAddress = [
        data["customer_address_line1"],
        data["customer_address_line2"],
        data["customer_city"],
        data["customer_state"],
        data["customer_zip_code"]
      ].filter(Boolean).join(", ");

      // Combine first and last name to create userName
      const userName = `${data["first_name"] || ""} ${data["last_name"] || ""}`.trim();

      const storeData = {
        // Core company data
        companyID,
        companyName: data["company_name"],
        companyLogo: data["company_logo"],
        reportType: data["report_type"],

        // Split company address fields
        companyStreet: data["company_address_line1"],
        companyCity: data["company_city"],
        companyState: data["company_state"],
        companyZip: data["company_zip_code"],

        // Admin data
        adminMail: data["email"],
        adminType: data["admin_type"],
        authId: data["auth_id"],

        // Customer/admin personal data
        firstName: data["first_name"],
        lastName: data["last_name"],
        userName: userName,
        phone: data["phone_number"],
        phoneNumber: data["phone_number"],
        address: customerAddress,

        // Additional metadata
        isVerified: data["is_verified"],
        createdDate: data["created_date"],

        // Default values for missing fields
        NoOfDevices: "1",
        NoOfEmployees: "50"
      };

      Object.entries(storeData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          localStorage.setItem(key, value);
        }
      });

      return { success: true, companyID };
    }

    return { success: false, error: "Invalid admin type" };
  } catch (error) {
    console.error("Google Sign-In error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Register a new user with company and customer information
 * This function calls the /auth/sign_up endpoint which creates both company and customer records
 *
 * @param {Object} registrationData - Registration data with flat structure
 * @returns {Promise<Object>} - { success: boolean, data?: object, error?: string }
 */
export const registerUser = async (registrationData) => {
  try {
    const response = await fetch(API_URLS.signUp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Registration failed with status ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Data fetching functions
export const getTimeZone = async (cid) => {
  try {
    const res = await fetch(`${API_URLS.device}/getAll/${cid}`);
    const data = await res.json();
    const timeZone = !data.length || data.error === "No devices found !" 
      ? "PST" 
      : data[0]?.TimeZone || "PST";
    
    localStorage.setItem("TimeZone", timeZone);
    return timeZone;
  } catch (err) {
    console.error("Error fetching timezone:", err);
    localStorage.setItem("TimeZone", "PST");
    return "PST";
  }
};

export const getCustomerData = async (cid) => {
  try {
    const response = await fetch(`${API_URLS.customer}/getUsingCID/${cid}`);
    const data = await response.json();

    const customerData = {
      customerID: data.CustomerID,
      firstName: data.FName,
      lastName: data.LName,
      address: data.Address,
      phone: data.PhoneNumber,
      phoneNumber: data.PhoneNumber,
      email: data.Email,
    };

    Object.entries(customerData).forEach(([key, value]) => {
      if (value !== undefined) localStorage.setItem(key, value);
    });
    
    return data;
  } catch (err) {
    console.error("Error fetching customer data:", err);
    return null;
  }
};

export const fetchEmployeeData = async () => {
  const company_id = localStorage.getItem('companyID');
  const apiUrl = `${API_URLS.employee}/by-company/${company_id}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const data = await response.json();
    localStorage.setItem("allAdminDetails", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
};

// Employee management functions
export const createEmployee = async (employeeData) => {
  const apiUrl = `${API_URLS.employee}/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Create employee error:", error);
    throw error;
  }
};

export const updateEmployee = async (empId, employeeData) => {
  const apiUrl = `${API_URLS.employee}/update/${empId}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update employee error:", error);
    throw error;
  }
};

export const deleteEmployee = async (empId) => {
  const apiUrl = `${API_URLS.employee}/delete/${empId}/Admin`;
  
  try {
    const response = await fetch(apiUrl, { method: 'PUT' });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Delete employee error:", error);
    throw error;
  }
};

export const getEmployee = async (empId) => {
  const apiUrl = `${API_URLS.employee}/get/${empId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Get employee error:", error);
    throw error;
  }
};

// Profile management functions
export const updateCompany = async (cid, companyData) => {
  const apiUrl = `${API_URLS.company}/update/${cid}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update company error:", error);
    throw error;
  }
};

export const updateCustomer = async (customerId, customerData) => {
  const apiUrl = `${API_URLS.customer}/update/${customerId}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update customer error:", error);
    throw error;
  }
};

export const getCompanyProfile = async (cid) => {
  const apiUrl = `${API_URLS.company}/get/${cid}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Get company profile error:", error);
    throw error;
  }
};

// Report API functions
export const fetchDevices = async (companyId) => {
  const apiUrl = `${API_URLS.device}/getAll/${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    const allDevices = Array.isArray(data) ? data : [data];
    return allDevices.filter(
      device => device.DeviceName && device.DeviceName !== "Not Registered" && device.DeviceName.trim() !== ""
    ).map(device => ({
      id: device.DeviceID,
      name: device.DeviceName,
      deviceId: device.DeviceID
    }));
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
};

export const fetchDailyReport = async (companyId, date) => {
  const BASE = "https://postgresql-restless-waterfall-2105.fly.dev";
  const apiUrl = `${BASE}/dailyreport/getdatebasedata/${companyId}/${date}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return [];
  }
};

export const createDailyReportEntry = async (entryData) => {
  const BASE = "https://postgresql-restless-waterfall-2105.fly.dev";
  const apiUrl = `${BASE}/dailyreport/create`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating daily report entry:", error);
    throw error;
  }
};

export const updateDailyReportEntry = async (empId, cid, checkinTime, updateData) => {
  const BASE = "https://postgresql-restless-waterfall-2105.fly.dev";
  const apiUrl = `${BASE}/dailyreport/update/${empId}/${cid}/${encodeURIComponent(checkinTime)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error updating daily report entry:", error);
    throw error;
  }
};

export const fetchDateRangeReport = async (companyId, startDate, endDate) => {
  const BASE = "https://postgresql-restless-waterfall-2105.fly.dev";
  const apiUrl = `${BASE}/report/dateRangeReportGet/${companyId}/${startDate}/${endDate}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching date range report:", error);
    return [];
  }
};

// Report Settings API functions
const REPORT_API_BASE = 'https://postgresql-restless-waterfall-2105.fly.dev';
const REPORT_TYPES = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Bimonthly'];

export const createReportObject = (email, companyId, deviceId, selectedValues) => {
  const reportFlags = REPORT_TYPES.reduce((acc, type) => {
    acc[`Is${type}ReportActive`] = selectedValues.includes(type);
    return acc;
  }, {});
  
  return {
    CompanyReporterEmail: email,
    CID: companyId,
    DeviceID: deviceId,
    ...reportFlags,
    LastModifiedBy: 'Admin'
  };
};

export const getAllReportEmails = async (companyId) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/getAllReportEmail/${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching report emails:', error);
    return [];
  }
};

export const createReportEmail = async (reportData) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating report email:', error);
    throw error;
  }
};

export const updateReportEmail = async (email, companyId, reportData) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/update/${email}/${companyId}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating report email:', error);
    throw error;
  }
};

export const deleteReportEmail = async (email, companyId) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/delete/${email}/${companyId}/Admin`;
  
  try {
    const response = await fetch(apiUrl, { method: 'PUT' });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error deleting report email:', error);
    throw error;
  }
};

export const getReportEmail = async (email, companyId) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/get/${email}/${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting report email:', error);
    throw error;
  }
};



// Additional Employee API functions for EmployeeList component
export const createEmployeeWithData = async (employeeData) => {
  const apiUrl = `${API_URLS.employee}/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Create employee error:", error);
    throw error;
  }
};

export const updateEmployeeWithData = async (empId, employeeData) => {
  const apiUrl = `${API_URLS.employee}/update/${empId}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update employee error:", error);
    throw error;
  }
};

export const deleteEmployeeById = async (empId) => {
  const apiUrl = `${API_URLS.employee}/delete/${empId}/Admin`;
  
  try {
    const response = await fetch(apiUrl, { method: 'PUT' });
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Delete employee error:", error);
    throw error;
  }
};

// Contact form API function
export const submitContactForm = async (userData) => {
  const apiUrl = 'https://postgresql-restless-waterfall-2105.fly.dev/web_contact_us/create';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Contact form submission error:', error);
    throw error;
  }
};

// Logout function
export const logout = () => {
  const keysToRemove = [
    "username", "companyID", "customId", "password", "adminMail",
    "adminType", "companyName", "companyLogo", "companyAddress",
    "customerID", "firstName", "lastName", "address", "phone",
    "phoneNumber", "email", "TimeZone", "allAdminDetails"
  ];

  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// ============================================
// SUPABASE AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign in with email and password using Supabase
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Returns user data or error
 */
export const supabaseSignIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase sign in error:', error);
      return { success: false, error: error.message };
    }

    if (data?.user) {
      // Store user info in localStorage
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('authMethod', 'supabase');

      return { success: true, user: data.user, session: data.session };
    }

    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.error('Supabase sign in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign up with email and password using Supabase
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Optional user metadata
 * @returns {Promise<Object>} - Returns user data or error
 */
export const supabaseSignUp = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      console.error('Supabase sign up error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Supabase sign up error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign in with Google OAuth using Supabase
 * @returns {Promise<Object>} - Returns result or error
 */
export const supabaseGoogleSignIn = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/employeelist`,
      },
    });

    if (error) {
      console.error('Supabase Google sign in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Supabase Google sign in error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out from Supabase
 * @returns {Promise<Object>} - Returns success or error
 */
export const supabaseSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase sign out error:', error);
      return { success: false, error: error.message };
    }

    // Clear localStorage
    localStorage.clear();

    return { success: true };
  } catch (error) {
    console.error('Supabase sign out error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current Supabase session
 * @returns {Promise<Object>} - Returns session data or null
 */
export const getSupabaseSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

/**
 * Get current Supabase user
 * @returns {Promise<Object>} - Returns user data or null
 */
export const getSupabaseUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

/**
 * Reset password using Supabase
 * @param {string} email - User email
 * @returns {Promise<Object>} - Returns success or error
 */
export const supabaseResetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user password using Supabase
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Returns success or error
 */
export const supabaseUpdatePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Password update error:', error);
    return { success: false, error: error.message };
  }
};