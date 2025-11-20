// Consolidated API module
import { da } from 'intl-tel-input/i18n';
import { supabase } from './config/supabase';
import { ENCRYPTION_KEY, STORAGE_KEYS } from './constants';



const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
export const API_URLS = {
  employee: 'https://postgresql-restless-waterfall-2105.fly.dev/employee',
  company: 'https://postgresql-restless-waterfall-2105.fly.dev/company',
  customer: 'https://postgresql-restless-waterfall-2105.fly.dev/customer',
  device: 'https://postgresql-restless-waterfall-2105.fly.dev/device',
  loginCheck: 'https://postgresql-restless-waterfall-2105.fly.dev/employee/login_check',
  signUp: 'https://postgresql-restless-waterfall-2105.fly.dev/auth/sign_up'
};

// HTTP client
const api = {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
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
    localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, data.CName);
    localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, data.CLogo);
    localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS, data.CAddress);
    localStorage.setItem(STORAGE_KEYS.USER_NAME, data.UserName);
    localStorage.setItem(STORAGE_KEYS.PASSWORD, data.Password);
    localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, data.ReportType);
    localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, 'customer');
    localStorage.setItem('passwordDecryptedValue', decryptPassword);

    return data.UserName === username && decryptPassword === password;
  } catch (error) {
    console.error('Login check error:', error);
    return false;
  }
};

export const googleSignInCheck = async (email) => {
  try {
    const data = await api.get(`${API_BASE}/employee/login_check/${email}`);

    if (data.error) throw new Error(data.error);

    const adminTypeValue = data.admin_type?.toString().toLowerCase();
    const allowedTypes = ['admin', 'superadmin', 'owner'];

    if (!allowedTypes.includes(adminTypeValue)) {
      return { success: false, error: `Access denied. Invalid admin type: "${data.admin_type}"` };
    }

    const companyID = data.cid;
    const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
    const properCaseAdminType = adminTypeMap[adminTypeValue];

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
      last_modified_by: data.last_modified_by
      

    };




    Object.entries(storeData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        console.log(`Storing in localStorage: ${key} = ${value}`);
        localStorage.setItem(key, value);
        
      }
    });

    return { success: true, companyID };
  } catch (error) {
    console.error('Google Sign-In error:', error);
    return { success: false, error: error.message };
  }
};



export const registerUser = async (registrationData) => {
  try {
    const data = await api.post(`${API_URLS.signUp}`, registrationData);
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
    return await api.post(`${API_BASE}/employee/create`, employeeData);
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

// Logout
export const logout = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  const legacyKeys = ['customId', 'customerID', 'firstName', 'lastName', 'address', 'phone', 'email', 'passwordDecryptedValue'];
  legacyKeys.forEach(key => localStorage.removeItem(key));
};

// Supabase functions
export const supabaseSignIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    if (data?.user) {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, data.user.email);
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.user.id);
      localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'supabase');
      return { success: true, user: data.user, session: data.session };
    }
    return { success: false, error: 'No user data returned' };
  } catch (error) {
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