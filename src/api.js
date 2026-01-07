// Consolidated API module
import { da } from 'intl-tel-input/i18n';
import { supabase } from './config/supabase';
import { ENCRYPTION_KEY, STORAGE_KEYS } from './constants';


const accessToken = localStorage.getItem("access_token");
console.log("Access Token in api.js:", accessToken);



const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
export const API_URLS = {
  employee: `${API_BASE}/employee`,
  company: `${API_BASE}/company`,
  customer: `${API_BASE}/customer`,
  device: `${API_BASE}/device`,
  loginCheck: `${API_BASE}/employee/login_check`,
  signUp: `${API_BASE}/auth/sign_up`
};

// HTTP client with request deduplication
const pendingRequests = new Map();

const api = {
  async request(url, options = {}) {
    // Create a unique key for this request
    const requestKey = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`;
    
    // If this exact request is already pending, return the existing promise
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    
    const requestPromise = (async () => {
      try {
        const authToken = localStorage.getItem("access_token");
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(url, {
          headers: {
            ...headers,
            ...(options.headers || {})
          },
          ...options
        });
        
        if (!response.ok) {
          // Try to get error details from response
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.detail || errorData.error || `HTTP ${response.status}`;
          
          // Handle specific HTTP status codes that might indicate account deletion
          if (response.status === 404 || errorMsg.toLowerCase().includes('not found')) {
            throw new Error('Account not found - may have been deleted');
          }
          if (response.status === 403) {
            throw new Error('Access denied - account may be inactive or deleted');
          }
          
          throw new Error(errorMsg);
        }
        return await response.json();
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      } finally {
        // Remove from pending requests when done
        pendingRequests.delete(requestKey);
      }
    })();
    
    // Store the promise to prevent duplicate requests
    pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  },
  get: (url) => api.request(url),
  post: (url, data) => api.request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => api.request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => api.request(url, { method: 'DELETE' })
};

// Encryption utilities
export const generateRandomBytes = (length) => {
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return randomValues;
};

export const encrypt = async (data, key) => {
  const dataBuffer = new TextEncoder().encode(data);
  const algorithm = { name: 'AES-GCM', iv: generateRandomBytes(12) };
  const importedKey = await window.crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
  const encryptedData = await window.crypto.subtle.encrypt(algorithm, importedKey, dataBuffer);
  const iv = algorithm.iv;
  const encryptedDataWithIV = new Uint8Array(iv.byteLength + encryptedData.byteLength);
  encryptedDataWithIV.set(iv);
  encryptedDataWithIV.set(new Uint8Array(encryptedData), iv.byteLength);
  return btoa(String.fromCharCode(...new Uint8Array(encryptedDataWithIV)));
};

export const decrypt = async (encryptedDataWithIV, key) => {
  const buffer = new Uint8Array(atob(encryptedDataWithIV).split('').map(char => char.charCodeAt(0)));
  const iv = buffer.slice(0, 12);
  const encryptedData = buffer.slice(12);
  const algorithm = { name: 'AES-GCM', iv: iv };
  const importedKey = await window.crypto.subtle.importKey('raw', key, algorithm, false, ['decrypt']);
  const decryptedData = await window.crypto.subtle.decrypt(algorithm, importedKey, encryptedData);
  return new TextDecoder().decode(decryptedData);
};

// Auth functions
export const loginCheck = async (username, password) => {
  try {
    const data = await api.get(`${API_BASE}/company/getuser/${username}`);
    const decryptPassword = await decrypt(data.Password, ENCRYPTION_KEY);
    const companyID = data.CID;

    localStorage.setItem(STORAGE_KEYS.COMPANY_ID, companyID);
    localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, data.company_name);
    localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, data.company_logo);
    localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS1, data.company_address_line1);
    localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, data.report_type);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, data.admin_type);
    localStorage.setItem('passwordDecryptedValue', decryptPassword);

    return data.UserName === username && decryptPassword === password;
  } catch (error) {
    console.error('Login check error:', error);
    return false;
  }
};

export const googleSignInCheck = async (email, authMethod = 'google') => {
  try {
    const response = await fetch(`${API_BASE}/employee/login_check/${email}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    // Check if response contains error details (even with 200 status)
    if (data.detail || data.error) {
      const errorMsg = data.detail || data.error || '';
      // Check if error indicates account deletion/not found
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('not found') || 
          errorMsg.toLowerCase().includes('deleted') ||
          errorMsg.toLowerCase().includes('inactive'))) {
        return { success: false, error: errorMsg, deleted: true };
      }
      return { success: false, error: errorMsg };
    }
    
    // If no error, proceed with normal validation
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const adminTypeValue = data.admin_type?.toString().toLowerCase();
    
    // CRITICAL: For Google OAuth, ONLY allow admin and superadmin - NEVER allow owner
    if (authMethod === 'google') {
      // Explicitly block owners from Google login
      if (adminTypeValue === 'owner') {
        return { success: false, error: 'Owners do not have access to Google login. Please use email and password to sign in.' };
      }
      
      const allowedTypes = ['admin', 'superadmin'];
      if (!allowedTypes.includes(adminTypeValue)) {
        return { success: false, error: `Access denied. Google login not available for admin type: "${data.admin_type}"` };
      }
    }
    // For email/password login, allow all types including owner
    else if (authMethod === 'email') {
      const allowedTypes = ['owner', 'admin', 'superadmin'];
      if (!allowedTypes.includes(adminTypeValue)) {
        return { success: false, error: `Access denied. Invalid admin type: "${data.admin_type}"` };
      }
    }
    // For any other auth method, validate admin type exists
    else {
      if (!adminTypeValue || !['owner', 'admin', 'superadmin'].includes(adminTypeValue)) {
        return { success: false, error: `Access denied. Invalid admin type: "${data.admin_type}"` };
      }
    }

    // Handle Owner login data differently
    if (adminTypeValue === 'owner') {
      storeOwnerData(data);
      const companyID = data.companies?.[0]?.cid;
      return { success: true, companyID };
    }

    const companyID = data.cid;
    const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
    const properCaseAdminType = adminTypeMap[adminTypeValue] || adminTypeValue;

    const storeData = {
      [STORAGE_KEYS.COMPANY_ID]: companyID,
      [STORAGE_KEYS.COMPANY_NAME]: data.company_name,
      [STORAGE_KEYS.COMPANY_LOGO]: data.company_logo,
      [STORAGE_KEYS.REPORT_TYPE]: data.report_type,
      [STORAGE_KEYS.ADMIN_MAIL]: data.email,
      [STORAGE_KEYS.ADMIN_TYPE]: properCaseAdminType,
      authId: data.auth_id,
      firstName: data.first_name,
      lastName: data.last_name,
      [STORAGE_KEYS.USER_NAME]: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      phone: data.phone_number,
      phoneNumber: data.phone_number,
      isVerified: data.is_verified,
      createdDate: data.created_date,
      [STORAGE_KEYS.NO_OF_DEVICES]: data.device_count,
      [STORAGE_KEYS.NO_OF_EMPLOYEES]: data.employee_count,
      [STORAGE_KEYS.COMPANY_ADDRESS1]: data.company_address_line1,
      [STORAGE_KEYS.COMPANY_ADDRESS2]: data.company_address_line2,
      [STORAGE_KEYS.COMPANY_CITY]: data.company_city,
      [STORAGE_KEYS.COMPANY_STATE]: data.company_state,
      [STORAGE_KEYS.COMPANY_ZIP]: data.company_zip_code,
      [STORAGE_KEYS.CUSTOMER_ZIP_CODE]: data.customer_zip_code,
      [STORAGE_KEYS.CUSTOMER_ADDRESS1]: data.customer_address_line1,
      [STORAGE_KEYS.CUSTOMER_ADDRESS2]: data.customer_address_line2,
      [STORAGE_KEYS.CUSTOMER_CITY]: data.customer_city,
      [STORAGE_KEYS.CUSTOMER_STATE]: data.customer_state,
      [STORAGE_KEYS.COMPANY_ZIP_CODE]: data.company_zip_code,
      employmentType: data.employment_type,
      last_modified_by: data.last_modified_by,

   };

    Object.entries(storeData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        console.log(`Storing in localStorage: ${key} = ${value}`);
        localStorage.setItem(key, value);
        console.log(`Stored ${key} successfully.`);
      }
    });

    return { success: true, companyID };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return { success: false, error: error.message };
  }
};



export const registerUser = async (signupData, companyLogoFile = null) => {
  try {
    const formData = new FormData();

    // Add signup_data as JSON string
    formData.append('signup_data', JSON.stringify(signupData));

    // Add company_logo file if provided
    if (companyLogoFile) {
      formData.append('company_logo', companyLogoFile);
    }

    const response = await fetch(`${API_URLS.signUp}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem("access_token")}` },
      body: formData
      // Note: Don't set Content-Type header - browser will set it automatically with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Employee functions
export const fetchEmployeeData = async () => {
  const company_id = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  try {
    const data = await api.get(`${API_BASE}/employee/by-company/${company_id}`);
    localStorage.setItem(STORAGE_KEYS.ALL_ADMIN_DETAILS, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};

export const createEmployeeWithData = async (employeeData) => {
  try {
    const authToken = localStorage.getItem("access_token");
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${API_BASE}/employee/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || `HTTP ${response.status}`);
      error.detail = errorData.detail;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Create employee error:', error);
    throw error;
  }
};


export const deleteEmployeeById = async (empId) => {
  try {
    return await api.delete(`${API_BASE}/employee/delete/${empId}/Admin`);
  } catch (error) {
    console.error('Delete employee error:', error);
    throw error;
  }
};

// Device functions
export const getTimeZone = async (cid) => {
  try {
    const data = await api.get(`${API_BASE}/device/get_all/${cid}`);
    const timeZone = !data.length || data.error === "No devices found !" ? "PST" : data[0]?.TimeZone || "PST";
    localStorage.setItem(STORAGE_KEYS.TIME_ZONE, timeZone);
    return timeZone;
  } catch (err) {
    console.error('Error fetching timezone:', err);
    localStorage.setItem(STORAGE_KEYS.TIME_ZONE, 'PST');
    return 'PST';
  }
};

export const fetchDevices = async (companyId) => {
  try {
    const data = await api.get(`${API_BASE}/device/get_all/${companyId}`);
    const allDevices = Array.isArray(data) ? data : [data];
    return allDevices.filter(
      device => device.device_name && device.device_name !== "Not Registered" && device.device_name.trim() !== ""
    ).map(device => ({
      id: device.device_id,
      name: device.device_name,
      DeviceID: device.device_id
    }));
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

// Helper function to transform API response from snake_case to PascalCase
const transformReportRecord = (record) => {
  if (!record) return record;

  return {
    Pin: record.pin,
    Name: record.name,
    Type: record.type,
    EmpID: record.emp_id,
    CheckInTime: record.check_in_time,
    CheckOutTime: record.check_out_time,
    TimeWorked: record.time_worked,
    DeviceID: record.device_id,
    CheckInSnap: record.check_in_snap,
    CheckOutSnap: record.check_out_snap,
    // Keep any other fields as-is
    ...Object.keys(record).reduce((acc, key) => {
      if (!['pin', 'name', 'type', 'emp_id', 'check_in_time', 'check_out_time', 'time_worked', 'device_id', 'check_in_snap', 'check_out_snap'].includes(key)) {
        acc[key] = record[key];
      }
      return acc;
    }, {})
  };
};

// Report functions
export const fetchDailyReport = async (companyId, date) => {
  try {
    const data = await api.get(`${API_BASE}/dailyreport/get_date_base_data/${companyId}/${date}`);
    const records = Array.isArray(data) ? data : [];
    return records.map(transformReportRecord);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return [];
  }
};

// Helper function to transform payload to backend's snake_case format
const transformDailyReportPayload = (entryData) => {
  return {
    c_id: entryData.CID,
    emp_id: entryData.EmpID,
    type_id: entryData.TypeID,
    check_in_snap: entryData.CheckInSnap || null,
    check_in_time: entryData.CheckInTime,
    check_out_snap: entryData.CheckOutSnap || null,
    check_out_time: entryData.CheckOutTime || null,
    time_worked: entryData.TimeWorked,
    date: entryData.Date || null,
    last_modified_by: entryData.LastModifiedBy
  };
};

export const createDailyReportEntry = async (entryData) => {
  try {
    const transformedPayload = transformDailyReportPayload(entryData);
    return await api.post(`${API_BASE}/dailyreport/create`, transformedPayload);
  } catch (error) {
    console.error('Error creating daily report entry:', error);
    throw error;
  }
};

export const updateDailyReportEntry = async (empId, cid, checkinTime, updateData) => {
  try {
    return await api.put(`${API_BASE}/dailyreport/update/${empId}/${cid}/${encodeURIComponent(checkinTime)}`, updateData);
  } catch (error) {
    console.error('Error updating daily report entry:', error);
    throw error;
  }
};

export const processPendingCheckout = async (cid) => {
  try {
    const data = await api.get(`${API_BASE}/dailyreport/pending_checkout/${cid}`);
    const records = Array.isArray(data) ? data : [];
    return records.map(transformReportRecord);
  } catch (error) {
    console.error('Error processing pending checkout:', error);
    throw error;
  }
};

export const fetchDateRangeReport = async (companyId, startDate, endDate) => {
  try {
    const data = await api.get(`${API_BASE}/dailyreport/date_range_report_get/${companyId}/${startDate}/${endDate}`);
    const records = Array.isArray(data) ? data : [];
    return records.map(transformReportRecord);
  } catch (error) {
    console.error('Error fetching date range report:', error);
    return [];
  }
};

export const fetchPendingCheckouts = async (companyId) => {
  try {
    const data = await api.get(`${API_BASE}/dailyreport/pending_checkout/${companyId}`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching pending checkouts:', error);
    return [];
  }
};

// Report settings functions
export const getAllReportEmails = async (companyId) => {
  try {
    return await api.get(`${API_BASE}/company-report-type/get_all_report_email/${companyId}`);
  } catch (error) {
    console.error('Error fetching report emails:', error);
    return [];
  }
};

export const createReportEmail = async (reportData) => {
  try {
    return await api.post(`${API_BASE}/company-report-type/create`, reportData);
  } catch (error) {
    console.error('Error creating report email:', error);
    throw error;
  }
};

export const updateReportEmail = async (email, companyId, reportData) => {
  try {
    return await api.put(`${API_BASE}/company-report-type/update/${email}/${companyId}`, reportData);
  } catch (error) {
    console.error('Error updating report email:', error);
    throw error;
  }
};

export const deleteReportEmail = async (email, companyId) => {
  try {
    return await api.put(`${API_BASE}/company-report-type/delete/${email}/${companyId}/Admin`);
  } catch (error) {
    console.error('Error deleting report email:', error);
    throw error;
  }
};

export const createReportObject = (email, companyId, deviceId, selectedValues) => {
  const reportFlags = {
    is_daily_report_active: selectedValues.includes('Daily'),
    is_weekly_report_active: selectedValues.includes('Weekly'),
    is_bi_weekly_report_active: selectedValues.includes('Biweekly'),
    is_monthly_report_active: selectedValues.includes('Monthly'),
    is_bi_monthly_report_active: selectedValues.includes('Bimonthly')
  };
  const lastModifiedBy = localStorage.getItem(STORAGE_KEYS.ADMIN_MAIL) || localStorage.getItem(STORAGE_KEYS.USER_NAME) || "unknown";
  return {
    company_reporter_email: email,
    c_id: companyId,
    ...reportFlags,
    is_active: true,
    last_modified_by: lastModifiedBy
  };
};

// Customer functions
export const getCustomerData = async (cid) => {
  try {
    const data = await api.get(`${API_BASE}/customer/getUsingCID/${cid}`);
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
    console.error('Error fetching customer data:', err);
    return null;
  }
};


// Company functions
export const getUserCompanies = async (userEmail) => {
  try {
    return await api.get(`${API_BASE}/company/user/${userEmail}`);
  } catch (error) {
    console.error('Error fetching user companies:', error);
    
    // Handle account deletion scenarios
    if (error.message && error.message.includes('Account not found - may have been deleted')) {
      return { success: false, error: error.message, deleted: true };
    }
    
    throw error;
  }
};

export const addNewCompany = async (companyData, logoFile = null) => {
  try {
    const formData = new FormData();
    
    // Add company_data as JSON string
    formData.append('company_data', JSON.stringify(companyData));
    
    // Add company_logo file if provided
    if (logoFile) {
      formData.append('company_logo', logoFile);
    }
    
    const response = await fetch(`${API_BASE}/company/create`, {
      method: 'POST',
      body: formData
      // Note: Don't set Content-Type header - browser will set it automatically with boundary
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding new company:', error);
    throw error;
  }
};

export const switchCompany = async (companyId, userId) => {
  try {
    return await api.post(`${API_BASE}/company/switch`, { companyId, userId });
  } catch (error) {
    console.error('Error switching company:', error);
    throw error;
  }
};

export const updateProfile = async (cid, data) => {
  const apiUrl = `${API_URLS.company}/update/${cid}`;

  try {
    // Check if data is FormData (for company update with file)
    const isFormData = data instanceof FormData;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      // Don't set Content-Type for FormData - browser sets it with boundary
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Update company error:", error);
    throw error;
  }
};

export const updateEmployeeWithData = async (cid, data) => {
  const apiUrl = `${API_URLS.employee}/update/${cid}`;
  
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





// Contact form
export const submitContactForm = async (userData) => {
  try {
    return await api.post(`${API_BASE}/web_contact_us/create`, userData);
  } catch (error) {
    console.error('Contact form submission error:', error);
    throw error;
  }
};

// Store Owner login data
export const storeOwnerData = (ownerData) => {
  try {
    // Store admin type
    localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, ownerData.admin_type);
    
    // Store all companies data
    localStorage.setItem(STORAGE_KEYS.USER_COMPANIES, JSON.stringify(ownerData.companies));
    localStorage.setItem('companies', JSON.stringify(ownerData.companies)); // Legacy support
    
    // Store user-level data (not company-specific)
    if (ownerData.companies && ownerData.companies.length > 0) {
      const firstCompany = ownerData.companies[0];
      localStorage.setItem('auth_id', firstCompany.auth_id);
      localStorage.setItem('first_name', firstCompany.first_name);
      localStorage.setItem('last_name', firstCompany.last_name);
      localStorage.setItem('firstName', firstCompany.first_name);
      localStorage.setItem('lastName', firstCompany.last_name);
      localStorage.setItem('phone_number', firstCompany.phone_number);
      localStorage.setItem('phone', firstCompany.phone_number);
      localStorage.setItem('phoneNumber', firstCompany.phone_number);
      localStorage.setItem('is_verified', String(firstCompany.is_verified));
      localStorage.setItem('employment_type', firstCompany.employment_type);
      localStorage.setItem('employmentType', firstCompany.employment_type);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, `${firstCompany.first_name || ''} ${firstCompany.last_name || ''}`.trim());
      
      // Set first company as active by default
      const lastSelected = localStorage.getItem('lastSelectedCompany');
      const activeCompany = ownerData.companies.find(c => c.cid === lastSelected) || firstCompany;
      setActiveCompany(activeCompany);
    }
    console.log('=== OWNER DATA STORED ===');
    console.log('Companies:', ownerData.companies?.length || 0);
    console.log('Admin Type:', ownerData.admin_type);
  } catch (error) {
    console.error('Error storing owner data:', error);
  }
};

// Set active company data in localStorage
export const setActiveCompany = (company) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY_ID, company.cid);
    localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, company.company_name);
    localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, company.report_type);
    localStorage.setItem(STORAGE_KEYS.ADMIN_MAIL, company.email);
    localStorage.setItem(STORAGE_KEYS.NO_OF_DEVICES, String(company.device_count));
    localStorage.setItem(STORAGE_KEYS.NO_OF_EMPLOYEES, String(company.employee_count));
    localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS1, company.company_address_line1 || '');
    localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS2, company.company_address_line2 || '');
    localStorage.setItem(STORAGE_KEYS.COMPANY_CITY, company.company_city || '');
    localStorage.setItem(STORAGE_KEYS.COMPANY_STATE, company.company_state || '');
    localStorage.setItem(STORAGE_KEYS.COMPANY_ZIP, company.company_zip_code || '');
    localStorage.setItem('companyZipCode', company.company_zip_code || '');
    localStorage.setItem('companyZip', company.company_zip_code || '');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ADDRESS1, company.customer_address_line1 || '');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ADDRESS2, company.customer_address_line2 || '');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_CITY, company.customer_city || '');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_STATE, company.customer_state || '');
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_ZIP_CODE, company.customer_zip_code || '');
    localStorage.setItem('lastSelectedCompany', company.cid);
  } catch (error) {
    console.error('Error setting active company:', error);
  }
};

// Company-specific data cache management
const COMPANY_DATA_CACHE = {};

// Store company-specific data in memory cache
export const cacheCompanyData = (companyId, dataType, data) => {
  if (!COMPANY_DATA_CACHE[companyId]) {
    COMPANY_DATA_CACHE[companyId] = {};
  }
  COMPANY_DATA_CACHE[companyId][dataType] = data;
};

// Get cached company data
export const getCachedCompanyData = (companyId, dataType) => {
  return COMPANY_DATA_CACHE[companyId]?.[dataType] || null;
};

// Clear cache for a specific company
export const clearCompanyCache = (companyId) => {
  delete COMPANY_DATA_CACHE[companyId];
};

// Get company-specific data with caching
export const getCompanyData = async (companyId, dataType, fetchFunction) => {
  // Check cache first
  const cached = getCachedCompanyData(companyId, dataType);
  if (cached) return cached;
  
  // Fetch from API if not cached
  try {
    const data = await fetchFunction(companyId);
    cacheCompanyData(companyId, dataType, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${dataType} for company ${companyId}:`, error);
    return null;
  }
};

// Switch to a different company and load its data
// Switch to a different company and load its data
export const switchToCompany = async (companyId) => {
  try {
    const companiesStr = localStorage.getItem(STORAGE_KEYS.USER_COMPANIES);
    if (!companiesStr) throw new Error('No companies data found');
    
    const companies = JSON.parse(companiesStr);
    const selectedCompany = companies.find(c => c.cid === companyId);
    
    if (!selectedCompany) throw new Error('Company not found');
    
    // Set the active company data
    setActiveCompany(selectedCompany);
    
    // Pre-load essential company data
    await Promise.allSettled([
      getCompanyData(companyId, 'devices', getAllDevices),
      getCompanyData(companyId, 'employees', (cid) => api.get(`${API_BASE}/employee/get_all/${cid}`)),
      getCompanyData(companyId, 'reports', (cid) => getAllReportEmails(cid))
    ]);
    
    // Trigger a custom event to notify components of company change
    window.dispatchEvent(new CustomEvent('companyChanged', {
      detail: { company: selectedCompany, companyId }
    }));
    
    return selectedCompany;
  } catch (error) {
    console.error('Error switching company:', error);
    throw error;
  }
};

// Get all companies for the current user
export const getUserCompaniesFromStorage = () => {
  try {
    const companiesStr = localStorage.getItem(STORAGE_KEYS.USER_COMPANIES);
    return companiesStr ? JSON.parse(companiesStr) : [];
  } catch (error) {
    console.error('Error getting user companies from storage:', error);
    return [];
  }
};

// Get currently active company
export const getCurrentCompany = () => {
  try {
    const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
    if (!companyId) return null;
    
    const companies = getUserCompaniesFromStorage();
    return companies.find(c => c.cid === companyId) || null;
  } catch (error) {
    console.error('Error getting current company:', error);
    return null;
  }
};

// Logout
export const logout = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  const legacyKeys = ['customId', 'customerID', 'firstName', 'lastName', 'address', 'phone', 'email', 'passwordDecryptedValue'];
  legacyKeys.forEach(key => localStorage.removeItem(key));
  // Clear owner-specific data
  const ownerKeys = ['companies', 'auth_id', 'first_name', 'last_name', 'phone_number', 'is_verified', 'employment_type', 'lastSelectedCompany', 'companyZipCode', 'companyZip', 'employmentType'];
  ownerKeys.forEach(key => localStorage.removeItem(key));
};

// Retrieve stored owner data
export const getStoredOwnerData = () => {
  try {
    const adminType = localStorage.getItem('admin_type');
    const companiesStr = localStorage.getItem('companies');
    const companies = companiesStr ? JSON.parse(companiesStr) : null;
    
    return {
      admin_type: adminType,
      companies: companies
    };
  } catch (error) {
    console.error('Error retrieving owner data:', error);
    return null;
  }
};

// Supabase functions
export const supabaseSignIn = async (email, password) => {
  try {
    console.log('supabaseSignIn called with:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Supabase response:', { data, error });
    if (error) return { success: false, error: error.message };
    if (data?.user && data?.session) {
      console.log('Session data:', data.session);
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.user.email);
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
      localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'supabase');
      
      
      return { success: true, user: data.user, session: data.session };
    }
    console.log('No user or session data');
    return { success: false, error: 'No user data returned' };
  } catch (error) {
    console.log('supabaseSignIn error:', error);
    return { success: false, error: error.message };
  }
};

export const supabaseSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    localStorage.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};




export const getAllDevices = async (companyId) => {
  try {
    const data = await api.get(`${API_BASE}/device/get_all/${companyId}`);
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching all devices:', error);
    return [];
  }
};

export const createDevice = async (deviceData) => {
  try {
    return await api.post(`${API_BASE}/device/create`, deviceData);
  } catch (error) {
    console.error('Error creating device:', error);
    throw error;
  }
};

export const deleteDevice = async (accessKey, companyId) => {
  try {
    return await api.put(`${API_BASE}/device/delete/${accessKey}/${companyId}/Admin`);
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error;
  }
};