// API Base URL and endpoints
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_URLS = {
  employee: `${BASE_URL}/employee`,
  company: `${BASE_URL}/company`,
  customer: `${BASE_URL}/customer`,
  device: `${BASE_URL}/device`,
  dailyReport: `${BASE_URL}/dailyreport`,
  report: `${BASE_URL}/report`,
  companyReportType: `${BASE_URL}/company-report-type`,
  adminReportType: `${BASE_URL}/admin-report-type`,
  contact: `${BASE_URL}/web_contact_us`,
  contactUs: `${BASE_URL}/contact-us`,
  payment: `${BASE_URL}/create-checkout-session`,
  loginCheck: `${BASE_URL}/employee/login_check`
};

// Encryption key from environment variables
export const ENCRYPTION_KEY = new Uint8Array(
  import.meta.env.VITE_ENCRYPTION_KEY.split(',').map(num => parseInt(num.trim()))
);

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
    
    localStorage.setItem(import.meta.env.VITE_COMPANY_ID_KEY, companyID);
    localStorage.setItem(import.meta.env.VITE_COMPANY_NAME_KEY, data["CName"]);
    localStorage.setItem(import.meta.env.VITE_COMPANY_LOGO_KEY, data["CLogo"]);
    localStorage.setItem(import.meta.env.VITE_COMPANY_ADDRESS_KEY, data["CAddress"]);
    localStorage.setItem(import.meta.env.VITE_USERNAME_KEY, data["UserName"]);
    localStorage.setItem(import.meta.env.VITE_PASSWORD_KEY, data["Password"]);
    localStorage.setItem(import.meta.env.VITE_REPORT_TYPE_KEY, data["ReportType"]);
    localStorage.setItem(import.meta.env.VITE_ADMIN_TYPE_KEY, "customer");
    localStorage.setItem("passwordDecryptedValue", decryptPassword);
    
    return data["UserName"] === username && decryptPassword === password;
  } catch (error) {
    console.error("Login check error:", error);
    return false;
  }
};

export const googleSignInCheck = async (email) => {
  try {
    const res = await fetch(`${API_URLS.loginCheck}/${email}`);
    if (!res.ok) throw new Error('Network response was not ok');
    
    const data = await res.json();
    
    if ("error" in data) {
      throw new Error("Invalid Gmail login");
    }

    if (["Admin", "SuperAdmin", "Owner"].includes(data["AdminType"])) {
      const companyID = data["CID"];
      const storeData = {
        companyID,
        companyName: data["CName"],
        companyLogo: data["CLogo"],
        companyAddress: data["CAddress"],
        NoOfDevices: data["NoOfDevices"],
        NoOfEmployees: data["NoOfEmployees"],
        reportType: data["ReportType"],
        adminMail: data["Email"],
        adminType: data["AdminType"]
      };

      Object.entries(storeData).forEach(([key, value]) => {
        if (value !== undefined) localStorage.setItem(key, value);
      });

      if (data["DeviceID"]) {
        localStorage.setItem("DeviceID", data["DeviceID"]);
      }

      return { success: true, companyID };
    }
    
    return { success: false, error: "Invalid admin type" };
  } catch (error) {
    console.error("Google Sign-In error:", error);
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
  const apiUrl = `${API_URLS.dailyReport}/getdatebasedata/${companyId}/${date}`;

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
  const apiUrl = `${API_URLS.dailyReport}/create`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  const apiUrl = `${API_URLS.dailyReport}/update/${empId}/${cid}/${encodeURIComponent(checkinTime)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
  const apiUrl = `${API_URLS.report}/dateRangeReportGet/${companyId}/${startDate}/${endDate}`;
  
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
const REPORT_TYPES = import.meta.env.VITE_AVAILABLE_REPORT_TYPES.split(',');

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
  const apiUrl = `${API_URLS.companyReportType}/getAllReportEmail/${companyId}`;
  
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
  const apiUrl = `${API_URLS.companyReportType}/create`;
  
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
  const apiUrl = `${API_URLS.companyReportType}/update/${email}/${companyId}`;
  
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
  const apiUrl = `${API_URLS.companyReportType}/delete/${email}/${companyId}/Admin`;
  
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
  const apiUrl = `${API_URLS.companyReportType}/get/${email}/${companyId}`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting report email:', error);
    throw error;
  }
};

export const submitContactForm = async (userData) => {
  const apiUrl = `${API_URLS.contact}/create`;
  
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

export const updateAdminReportType = async (companyId, reportData) => {
  const apiUrl = `${API_URLS.adminReportType}/update/${companyId}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating admin report type:', error);
    throw error;
  }
};

export const submitContactUsForm = async (contactData) => {
  const apiUrl = `${API_URLS.contactUs}/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error submitting contact-us form:', error);
    throw error;
  }
};

export const createCheckoutSession = async (paymentData) => {
  const apiUrl = `${API_URLS.payment}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createCompany = async (companyData) => {
  const apiUrl = `${API_URLS.company}/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  const apiUrl = `${API_URLS.customer}/create`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const logout = () => {
  const keysToRemove = [
    "username", "companyID", "customId", "password", "adminMail", 
    "adminType", "companyName", "companyLogo", "companyAddress",
    "customerID", "firstName", "lastName", "address", "phone", 
    "phoneNumber", "email", "TimeZone", "allAdminDetails"
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};