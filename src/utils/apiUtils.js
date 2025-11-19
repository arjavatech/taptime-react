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
    console.log(`Making API call to: ${API_URLS.loginCheck}/${email}`);
    const res = await fetch(`${API_URLS.loginCheck}/${email}`);
    console.log('API response status:', res.status, res.statusText);
    if (!res.ok) throw new Error('Network response was not ok');

    const data = await res.json();

    if ("error" in data) {
      console.error("Backend API returned error:", data);
      console.error("API endpoint:", `${API_URLS.loginCheck}/${email}`);
      throw new Error(data.error || "Invalid Gmail login");
    }

    // Case-insensitive admin type validation
    const adminTypeValue = data["admin_type"];
    console.log("Raw admin_type from API:", adminTypeValue);
    console.log("Type of admin_type:", typeof adminTypeValue);

    const normalizedAdminType = adminTypeValue?.toString().toLowerCase();
    console.log("Normalized admin_type:", normalizedAdminType);

    const allowedTypes = ['admin', 'superadmin', 'owner'];
    const isValid = allowedTypes.includes(normalizedAdminType);
    console.log("Is admin_type valid?", isValid);

    if (isValid) {
      const companyID = data["cid"];

      // Normalize admin_type to proper case for consistency
      const adminTypeMap = {
        'admin': 'Admin',
        'superadmin': 'SuperAdmin',
        'owner': 'Owner'
      };
      const properCaseAdminType = adminTypeMap[normalizedAdminType];

      // Combine first and last name to create userName
      const userName = `${data["first_name"] || ""} ${data["last_name"] || ""}`.trim();

      const storeData = {
        // Core company data
        companyID,
        companyName: data["company_name"],
        companyLogo: data["company_logo"],
        reportType: data["report_type"],

        // Company address fields (separate, not combined)
        companyStreet: data["company_address_line1"],
        companyStreet2: data["company_address_line2"],
        companyCity: data["company_city"],
        companyState: data["company_state"],
        companyZip: data["company_zip_code"],

        // Customer address fields (separate, not combined)
        customerStreet: data["customer_address_line1"],
        customerStreet2: data["customer_address_line2"],
        customerCity: data["customer_city"],
        customerState: data["customer_state"],
        customerZip: data["customer_zip_code"],

        // Admin data
        adminMail: data["email"],
        adminType: properCaseAdminType,  // Use normalized proper case
        authId: data["auth_id"],

        // Customer/admin personal data
        firstName: data["first_name"],
        lastName: data["last_name"],
        userName: userName,
        phone: data["phone_number"],
        phoneNumber: data["phone_number"],

        // Additional metadata
        isVerified: data["is_verified"],
        createdDate: data["created_date"],

        // Actual counts from API (not hardcoded)
        NoOfDevices: data["device_count"]?.toString() || "1",
        NoOfEmployees: data["employee_count"]?.toString() || "30"
      };

      Object.entries(storeData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          localStorage.setItem(key, value);
        }
      });

      return { success: true, companyID };
    }

    // Login blocked - log detailed error information
    console.error("Login blocked: Invalid admin type");
    console.error("Received admin_type:", adminTypeValue);
    console.error("Expected values: Admin, SuperAdmin, or Owner (case-insensitive)");
    console.error("Full API response:", data);

    return {
      success: false,
      error: `Access denied. Invalid admin type: "${adminTypeValue}". Expected: Admin, SuperAdmin, or Owner.`
    };
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
    const res = await fetch(`${API_URLS.device}/get_all/${cid}`);
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
export const updateProfile = async (cid, data) => {
  const apiUrl = `${API_URLS.company}/update/${cid}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update company error:", error);
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
  const apiUrl = `${API_URLS.device}/get_all/${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    const allDevices = Array.isArray(data) ? data : [data];
    return allDevices.filter(
      device => device.device_name && device.device_name !== "Not Registered" && device.device_name.trim() !== ""
    ).map(device => ({
      id: device.device_id,
      name: device.device_name,
      deviceId: device.device_id

    }));
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
};

export const fetchDailyReport = async (companyId, date) => {
  const BASE = "http://0.0.0.0:8000";
  const apiUrl = `${BASE}/dailyreport/get_date_base_data/${companyId}/${date}`;

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
  const BASE = "http://0.0.0.0:8000";
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
  const BASE = "http://0.0.0.0:8000";
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
  const BASE = "http://0.0.0.0:8000";
  const apiUrl = `${BASE}/dailyreport/date_range_report_get/${companyId}/${startDate}/${endDate}`;
  
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
const REPORT_API_BASE = 'http://0.0.0.0:8000';
const REPORT_TYPES = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Bimonthly'];

export const createReportObject = (email, companyId, deviceId, selectedValues) => {
  // Create report flags with snake_case naming and proper bi-weekly/bi-monthly formatting
  const reportFlags = {
    is_daily_report_active: selectedValues.includes('Daily'),
    is_weekly_report_active: selectedValues.includes('Weekly'),
    is_bi_weekly_report_active: selectedValues.includes('Biweekly'),
    is_monthly_report_active: selectedValues.includes('Monthly'),
    is_bi_monthly_report_active: selectedValues.includes('Bimonthly')
  };

  // Get last modified by from localStorage (adminMail is set during login)
  const lastModifiedBy = localStorage.getItem("adminMail") ||
                         localStorage.getItem("userName") ||
                         "unknown";

  return {
    company_reporter_email: email,
    c_id: companyId,
    ...reportFlags,
    is_active: true,  // Default to true for new report settings
    last_modified_by: lastModifiedBy
  };
};

export const getAllReportEmails = async (companyId) => {
  const apiUrl = `${REPORT_API_BASE}/company-report-type/get_all_report_email/${companyId}`;
  
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
    const response = await fetch(apiUrl, { method: 'DELETE' });
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