import { rawData, getNextId, generatePin } from './rawData.js';
import { STORAGE_KEYS } from '../constants';

// Local storage for runtime data modifications
let localData = JSON.parse(JSON.stringify(rawData));

// Simulate async operations
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication functions
export const loginCheck = async (username, password) => {
  await delay();
  
  const user = localData.authUsers.find(u => u.email === username);
  if (!user || user.password !== password) {
    return false;
  }

  // Store user data in localStorage
  localStorage.setItem(STORAGE_KEYS.COMPANY_ID, user.cid);
  localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, user.company_name);
  localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, user.company_logo);
  localStorage.setItem(STORAGE_KEYS.COMPANY_ADDRESS, user.company_address_line1);
  localStorage.setItem(STORAGE_KEYS.USER_NAME, user.email);
  localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, user.report_type);
  localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, 'customer');
  localStorage.setItem('passwordDecryptedValue', password);

  return true;
};

export const googleSignInCheck = async (email, authMethod = 'google') => {
  await delay();
  
  const user = localData.authUsers.find(u => u.email === email);
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Check admin type restrictions for Google login
  if (authMethod === 'google' && user.admin_type === 'owner') {
    return { success: false, error: 'Owners do not have access to Google login. Please use email and password to sign in.' };
  }

  const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
  const properCaseAdminType = adminTypeMap[user.admin_type] || user.admin_type;

  // Store user data
  const storeData = {
    [STORAGE_KEYS.COMPANY_ID]: user.cid,
    [STORAGE_KEYS.COMPANY_NAME]: user.company_name,
    [STORAGE_KEYS.COMPANY_LOGO]: user.company_logo,
    [STORAGE_KEYS.REPORT_TYPE]: user.report_type,
    [STORAGE_KEYS.ADMIN_MAIL]: user.email,
    [STORAGE_KEYS.ADMIN_TYPE]: properCaseAdminType,
    authId: user.auth_id,
    firstName: user.first_name,
    lastName: user.last_name,
    [STORAGE_KEYS.USER_NAME]: `${user.first_name} ${user.last_name}`.trim(),
    phone: user.phone_number,
    phoneNumber: user.phone_number,
    isVerified: user.is_verified,
    createdDate: user.created_date,
    [STORAGE_KEYS.NO_OF_DEVICES]: user.device_count,
    [STORAGE_KEYS.NO_OF_EMPLOYEES]: user.employee_count,
    [STORAGE_KEYS.COMPANY_ADDRESS1]: user.company_address_line1,
    [STORAGE_KEYS.COMPANY_ADDRESS2]: user.company_address_line2,
    [STORAGE_KEYS.COMPANY_CITY]: user.company_city,
    [STORAGE_KEYS.COMPANY_STATE]: user.company_state,
    [STORAGE_KEYS.COMPANY_ZIP]: user.company_zip_code,
    [STORAGE_KEYS.CUSTOMER_ZIP_CODE]: user.customer_zip_code,
    [STORAGE_KEYS.CUSTOMER_ADDRESS1]: user.customer_address_line1,
    [STORAGE_KEYS.CUSTOMER_ADDRESS2]: user.customer_address_line2,
    [STORAGE_KEYS.CUSTOMER_CITY]: user.customer_city,
    [STORAGE_KEYS.CUSTOMER_STATE]: user.customer_state,
    [STORAGE_KEYS.COMPANY_ZIP_CODE]: user.company_zip_code,
    employmentType: user.employment_type,
    last_modified_by: user.last_modified_by
  };

  Object.entries(storeData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, value);
    }
  });

  return { success: true, companyID: user.cid };
};

export const registerUser = async (signupData, companyLogoFile = null) => {
  await delay();
  
  // Simulate registration success
  const newUser = {
    id: `auth_${getNextId(localData.authUsers)}`,
    email: signupData.email,
    password: signupData.password,
    first_name: signupData.firstName,
    last_name: signupData.lastName,
    phone_number: signupData.phoneNumber,
    admin_type: "owner",
    company_name: signupData.companyName,
    company_logo: companyLogoFile ? "/assets/images/uploaded_logo.png" : "/assets/images/logo.png",
    report_type: "daily",
    is_verified: true,
    created_date: new Date().toISOString().split('T')[0],
    cid: getNextId(localData.companies).toString(),
    auth_id: `auth_${getNextId(localData.authUsers)}`,
    device_count: 0,
    employee_count: 0,
    company_address_line1: signupData.address1 || "",
    company_address_line2: signupData.address2 || "",
    company_city: signupData.city || "",
    company_state: signupData.state || "",
    company_zip_code: signupData.zipCode || "",
    customer_zip_code: signupData.zipCode || "",
    customer_address_line1: signupData.address1 || "",
    customer_address_line2: signupData.address2 || "",
    customer_city: signupData.city || "",
    customer_state: signupData.state || "",
    employment_type: "full-time",
    last_modified_by: "System"
  };

  localData.authUsers.push(newUser);
  return { success: true, data: newUser };
};

// Employee functions
export const fetchEmployeeData = async () => {
  await delay();
  const company_id = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  const employees = localData.employees.filter(emp => emp.c_id === company_id);
  localStorage.setItem(STORAGE_KEYS.ALL_ADMIN_DETAILS, JSON.stringify(employees));
  return employees;
};

export const createEmployeeWithData = async (employeeData) => {
  await delay();
  
  // Check for duplicates
  const existingEmployee = localData.employees.find(emp => 
    emp.email === employeeData.email || 
    emp.phone_number === employeeData.phone_number ||
    emp.pin === employeeData.pin
  );
  
  if (existingEmployee) {
    if (existingEmployee.email === employeeData.email) {
      throw new Error('Email already exists');
    }
    if (existingEmployee.phone_number === employeeData.phone_number) {
      throw new Error('Phone number already exists');
    }
    if (existingEmployee.pin === employeeData.pin) {
      throw new Error('PIN already exists');
    }
  }

  const newEmployee = {
    ...employeeData,
    emp_id: getNextId(localData.employees),
    created_date: new Date().toISOString().split('T')[0]
  };

  localData.employees.push(newEmployee);
  return newEmployee;
};

export const updateEmployeeWithData = async (empId, employeeData) => {
  await delay();
  
  const index = localData.employees.findIndex(emp => emp.emp_id === empId);
  if (index === -1) {
    throw new Error('Employee not found');
  }

  localData.employees[index] = { ...localData.employees[index], ...employeeData };
  return localData.employees[index];
};

export const deleteEmployeeById = async (empId) => {
  await delay();
  
  const index = localData.employees.findIndex(emp => emp.emp_id === empId);
  if (index === -1) {
    throw new Error('Employee not found');
  }

  localData.employees.splice(index, 1);
  return { success: true };
};

// Device functions
export const getTimeZone = async (cid) => {
  await delay();
  
  const devices = localData.devices.filter(device => device.c_id === cid);
  const timeZone = devices.length > 0 ? devices[0].TimeZone : "PST";
  localStorage.setItem(STORAGE_KEYS.TIME_ZONE, timeZone);
  return timeZone;
};

export const fetchDevices = async (companyId) => {
  await delay();
  
  const devices = localData.devices.filter(device => device.c_id === companyId);
  return devices.map(device => ({
    id: device.device_id,
    name: device.device_name,
    DeviceID: device.device_id
  }));
};

// Report functions
export const fetchDailyReport = async (companyId, date) => {
  await delay();
  
  const reports = localData.dailyReports.filter(report => 
    report.c_id === companyId && report.date === date
  );
  
  return reports.map(record => ({
    Pin: record.pin,
    Name: record.name,
    Type: record.type,
    EmpID: record.emp_id,
    CheckInTime: record.check_in_time,
    CheckOutTime: record.check_out_time,
    TimeWorked: record.time_worked,
    DeviceID: record.device_id,
    CheckInSnap: record.check_in_snap,
    CheckOutSnap: record.check_out_snap
  }));
};

export const createDailyReportEntry = async (entryData) => {
  await delay();
  
  const newEntry = {
    id: getNextId(localData.dailyReports),
    pin: entryData.pin || "",
    name: entryData.name || "",
    type: entryData.type || "Employee",
    emp_id: entryData.EmpID,
    check_in_time: entryData.CheckInTime,
    check_out_time: entryData.CheckOutTime,
    time_worked: entryData.TimeWorked,
    device_id: entryData.device_id || "DEV001",
    check_in_snap: entryData.CheckInSnap,
    check_out_snap: entryData.CheckOutSnap,
    c_id: entryData.CID,
    date: entryData.Date || new Date().toISOString().split('T')[0]
  };

  localData.dailyReports.push(newEntry);
  return newEntry;
};

export const updateDailyReportEntry = async (empId, cid, checkinTime, updateData) => {
  await delay();
  
  const index = localData.dailyReports.findIndex(report => 
    report.emp_id === empId && 
    report.c_id === cid && 
    report.check_in_time === checkinTime
  );
  
  if (index === -1) {
    throw new Error('Report entry not found');
  }

  localData.dailyReports[index] = { ...localData.dailyReports[index], ...updateData };
  return localData.dailyReports[index];
};

export const processPendingCheckout = async (cid) => {
  await delay();
  
  const pendingReports = localData.dailyReports.filter(report => 
    report.c_id === cid && !report.check_out_time
  );
  
  return pendingReports.map(record => ({
    Pin: record.pin,
    Name: record.name,
    Type: record.type,
    EmpID: record.emp_id,
    CheckInTime: record.check_in_time,
    CheckOutTime: record.check_out_time,
    TimeWorked: record.time_worked,
    DeviceID: record.device_id,
    CheckInSnap: record.check_in_snap,
    CheckOutSnap: record.check_out_snap
  }));
};

export const fetchDateRangeReport = async (companyId, startDate, endDate) => {
  await delay();
  
  const reports = localData.dailyReports.filter(report => 
    report.c_id === companyId && 
    report.date >= startDate && 
    report.date <= endDate
  );
  
  return reports.map(record => ({
    Pin: record.pin,
    Name: record.name,
    Type: record.type,
    EmpID: record.emp_id,
    CheckInTime: record.check_in_time,
    CheckOutTime: record.check_out_time,
    TimeWorked: record.time_worked,
    DeviceID: record.device_id,
    CheckInSnap: record.check_in_snap,
    CheckOutSnap: record.check_out_snap
  }));
};

export const fetchPendingCheckouts = async (companyId) => {
  await delay();
  
  return localData.dailyReports.filter(report => 
    report.c_id === companyId && !report.check_out_time
  );
};

// Report settings functions
export const getAllReportEmails = async (companyId) => {
  await delay();
  
  return localData.reportEmails.filter(email => email.c_id === companyId);
};

export const createReportEmail = async (reportData) => {
  await delay();
  
  localData.reportEmails.push(reportData);
  return reportData;
};

export const updateReportEmail = async (email, companyId, reportData) => {
  await delay();
  
  const index = localData.reportEmails.findIndex(report => 
    report.company_reporter_email === email && report.c_id === companyId
  );
  
  if (index === -1) {
    throw new Error('Report email not found');
  }

  localData.reportEmails[index] = { ...localData.reportEmails[index], ...reportData };
  return localData.reportEmails[index];
};

export const deleteReportEmail = async (email, companyId) => {
  await delay();
  
  const index = localData.reportEmails.findIndex(report => 
    report.company_reporter_email === email && report.c_id === companyId
  );
  
  if (index === -1) {
    throw new Error('Report email not found');
  }

  localData.reportEmails.splice(index, 1);
  return { success: true };
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
  await delay();
  
  const customer = localData.customers.find(c => c.CID === cid);
  if (!customer) return null;

  const customerData = {
    customerID: customer.CustomerID,
    firstName: customer.FName,
    lastName: customer.LName,
    address: customer.Address,
    phone: customer.PhoneNumber,
    phoneNumber: customer.PhoneNumber,
    email: customer.Email,
  };

  Object.entries(customerData).forEach(([key, value]) => {
    if (value !== undefined) localStorage.setItem(key, value);
  });

  return customer;
};

// Company functions
export const updateProfile = async (cid, data) => {
  await delay();
  
  const companyIndex = localData.companies.findIndex(c => c.CID === cid);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  localData.companies[companyIndex] = { ...localData.companies[companyIndex], ...data };
  return localData.companies[companyIndex];
};

// Contact form
export const submitContactForm = async (userData) => {
  await delay();
  
  const submission = {
    id: getNextId(localData.contactSubmissions),
    ...userData,
    submitted_at: new Date().toISOString()
  };

  localData.contactSubmissions.push(submission);
  return submission;
};

// Logout
export const logout = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  const legacyKeys = ['customId', 'customerID', 'firstName', 'lastName', 'address', 'phone', 'email', 'passwordDecryptedValue'];
  legacyKeys.forEach(key => localStorage.removeItem(key));
};

// Mock Supabase functions
export const supabaseSignIn = async (email, password) => {
  await delay();
  
  const user = localData.authUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }

  const mockUser = {
    id: user.id,
    email: user.email,
    user_metadata: {
      full_name: `${user.first_name} ${user.last_name}`,
      name: `${user.first_name} ${user.last_name}`
    }
  };

  const mockSession = {
    user: mockUser,
    access_token: 'mock_token',
    expires_at: Math.floor(Date.now() / 1000) + 3600
  };

  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
  localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
  localStorage.setItem(STORAGE_KEYS.AUTH_METHOD, 'supabase');

  return { success: true, user: mockUser, session: mockSession };
};

export const supabaseSignOut = async () => {
  await delay();
  localStorage.clear();
  return { success: true };
};