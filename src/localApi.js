// Local API replacement - uses raw data instead of external APIs
import { rawData, getNextId, generatePin } from './data/rawData.js';
import { STORAGE_KEYS } from './constants';

let localData = JSON.parse(JSON.stringify(rawData));
const delay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

export const loginCheck = async (username, password) => {
  await delay();
  const user = localData.authUsers.find(u => u.email === username && u.password === password);
  if (!user) return false;

  // Get user's companies and default to first one for initial login
  const userCompanies = localData.userCompanies.filter(uc => uc.user_email === username);
  if (userCompanies.length === 0) return false;

  // Use saved company or default to first company
  const savedCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  const userCompany = userCompanies.find(uc => uc.cid === savedCompanyId) || userCompanies[0];
  const company = localData.companies.find(c => c.CID === userCompany.cid);
  
  if (!company) return false;

  const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
  const properCaseAdminType = adminTypeMap[userCompany.admin_type] || userCompany.admin_type;

  localStorage.setItem(STORAGE_KEYS.COMPANY_ID, company.CID);
  localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, company.CName);
  localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, company.CLogo);
  localStorage.setItem(STORAGE_KEYS.USER_NAME, user.email);
  localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, properCaseAdminType);
  return true;
};

export const googleSignInCheck = async (email, authMethod = 'google') => {
  await delay();
  const user = localData.authUsers.find(u => u.email === email);
  if (!user) return { success: false, error: 'User not found' };
  
  if (authMethod === 'google' && user.admin_type === 'owner') {
    return { success: false, error: 'Owners do not have access to Google login. Please use email and password to sign in.' };
  }

  // Get user's companies and default to first one for initial login
  const userCompanies = localData.userCompanies.filter(uc => uc.user_email === email);
  if (userCompanies.length === 0) {
    return { success: false, error: 'No companies associated with this user' };
  }

  // Use saved company or default to first company
  const savedCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  const userCompany = userCompanies.find(uc => uc.cid === savedCompanyId) || userCompanies[0];
  const company = localData.companies.find(c => c.CID === userCompany.cid);
  
  if (!company) {
    return { success: false, error: 'Company not found' };
  }

  const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
  const properCaseAdminType = adminTypeMap[userCompany.admin_type] || userCompany.admin_type;
  
  const storeData = {
    [STORAGE_KEYS.COMPANY_ID]: company.CID,
    [STORAGE_KEYS.COMPANY_NAME]: company.CName,
    [STORAGE_KEYS.COMPANY_LOGO]: company.CLogo,
    [STORAGE_KEYS.REPORT_TYPE]: company.ReportType,
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
    [STORAGE_KEYS.NO_OF_DEVICES]: company.device_count?.toString() || '0',
    [STORAGE_KEYS.NO_OF_EMPLOYEES]: company.employee_count?.toString() || '0',
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

  return { success: true, companyID: company.CID };
};

export const fetchEmployeeData = async () => {
  await delay();
  const company_id = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
  const employees = localData.employees.filter(emp => emp.c_id === company_id);
  localStorage.setItem(STORAGE_KEYS.ALL_ADMIN_DETAILS, JSON.stringify(employees));
  return employees;
};

export const createEmployeeWithData = async (employeeData) => {
  await delay();
  const existing = localData.employees.find(emp => 
    emp.email === employeeData.email || emp.phone_number === employeeData.phone_number
  );
  if (existing) throw new Error('Employee already exists');

  const newEmployee = { ...employeeData, emp_id: getNextId(localData.employees) };
  localData.employees.push(newEmployee);
  return newEmployee;
};

export const createBulkEmployees = async (employeesData) => {
  await delay();
  const results = {
    successful: [],
    failed: []
  };
  
  for (const employeeData of employeesData) {
    try {
      const existing = localData.employees.find(emp => 
        emp.email === employeeData.email || emp.phone_number === employeeData.phone_number
      );
      if (existing) {
        results.failed.push({ data: employeeData, error: 'Employee already exists' });
        continue;
      }

      const newEmployee = { ...employeeData, emp_id: getNextId(localData.employees) };
      localData.employees.push(newEmployee);
      results.successful.push(newEmployee);
    } catch (error) {
      results.failed.push({ data: employeeData, error: error.message });
    }
  }
  
  return results;
};

export const updateEmployeeWithData = async (empId, employeeData) => {
  await delay();
  const index = localData.employees.findIndex(emp => emp.emp_id === empId);
  if (index === -1) throw new Error('Employee not found');
  
  localData.employees[index] = { ...localData.employees[index], ...employeeData };
  return localData.employees[index];
};

export const deleteEmployeeById = async (empId) => {
  await delay();
  const index = localData.employees.findIndex(emp => emp.emp_id === empId);
  if (index === -1) throw new Error('Employee not found');
  
  localData.employees.splice(index, 1);
  return { success: true };
};

export const getTimeZone = async (cid) => {
  await delay();
  localStorage.setItem(STORAGE_KEYS.TIME_ZONE, 'PST');
  return 'PST';
};

export const fetchDevices = async (companyId) => {
  await delay();
  return localData.devices.filter(d => d.c_id === companyId).map(d => ({
    id: d.device_id,
    name: d.device_name,
    DeviceID: d.device_id
  }));
};

export const getAllDevices = async (companyId) => {
  await delay();
  return localData.devices.filter(d => d.c_id === companyId);
};

export const createDevice = async (deviceData) => {
  await delay();
  const newDevice = {
    ...deviceData,
    device_id: deviceData.device_id || `DEV${String(getNextId(localData.devices)).padStart(3, '0')}`,
    created_date: new Date().toISOString().split('T')[0]
  };
  localData.devices.push(newDevice);
  return newDevice;
};

export const deleteDevice = async (accessKey, companyId) => {
  await delay();
  const index = localData.devices.findIndex(d => 
    d.access_key === accessKey && d.c_id === companyId
  );
  if (index === -1) throw new Error('Device not found');
  
  localData.devices.splice(index, 1);
  return { success: true };
};

export const fetchDailyReport = async (companyId, date) => {
  await delay();
  return localData.dailyReports.filter(r => r.c_id === companyId && r.date === date)
    .map(r => ({
      Pin: r.pin,
      Name: r.name,
      EmpID: r.emp_id,
      CheckInTime: r.check_in_time,
      CheckOutTime: r.check_out_time,
      TimeWorked: r.time_worked
    }));
};

export const submitContactForm = async (userData) => {
  await delay();
  localData.contactSubmissions.push({ ...userData, id: getNextId(localData.contactSubmissions) });
  return { success: true };
};

export const supabaseSignIn = async (email, password) => {
  await delay();
  const user = localData.authUsers.find(u => u.email === email && u.password === password);
  if (!user) return { success: false, error: 'Invalid credentials' };

  const mockUser = { id: user.id, email: user.email };
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
  return { success: true, user: mockUser, session: { user: mockUser } };
};

export const supabaseSignOut = async () => {
  await delay();
  localStorage.clear();
  return { success: true };
};

export const logout = () => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

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
  if (index === -1) throw new Error('Report email not found');
  
  localData.reportEmails[index] = { ...localData.reportEmails[index], ...reportData };
  return localData.reportEmails[index];
};

export const deleteReportEmail = async (email, companyId) => {
  await delay();
  const index = localData.reportEmails.findIndex(report => 
    report.company_reporter_email === email && report.c_id === companyId
  );
  if (index === -1) throw new Error('Report email not found');
  
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
  if (index === -1) throw new Error('Report entry not found');

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

export const updateProfile = async (cid, data) => {
  await delay();
  const companyIndex = localData.companies.findIndex(c => c.CID === cid);
  if (companyIndex === -1) throw new Error('Company not found');
  
  localData.companies[companyIndex] = { ...localData.companies[companyIndex], ...data };
  return localData.companies[companyIndex];
};

// Get user's companies
export const getUserCompanies = async (userEmail) => {
  await delay();
  return localData.userCompanies
    .filter(uc => uc.user_email === userEmail)
    .map(uc => {
      const company = localData.companies.find(c => c.CID === uc.cid);
      return {
        ...company,
        admin_type: uc.admin_type
      };
    })
    .filter(Boolean);
};

// Switch to a different company
export const switchCompany = async (companyId, userEmail) => {
  await delay();
  
  const userCompany = localData.userCompanies.find(uc => 
    uc.user_email === userEmail && uc.cid === companyId
  );
  
  if (!userCompany) {
    throw new Error('User does not have access to this company');
  }
  
  const company = localData.companies.find(c => c.CID === companyId);
  if (!company) {
    throw new Error('Company not found');
  }
  
  const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
  const properCaseAdminType = adminTypeMap[userCompany.admin_type] || userCompany.admin_type;
  
  // Update localStorage with new company data
  const storeData = {
    [STORAGE_KEYS.COMPANY_ID]: company.CID,
    [STORAGE_KEYS.COMPANY_NAME]: company.CName,
    [STORAGE_KEYS.COMPANY_LOGO]: company.CLogo,
    [STORAGE_KEYS.REPORT_TYPE]: company.ReportType,
    [STORAGE_KEYS.ADMIN_TYPE]: properCaseAdminType,
    [STORAGE_KEYS.NO_OF_DEVICES]: company.device_count?.toString() || '0',
    [STORAGE_KEYS.NO_OF_EMPLOYEES]: company.employee_count?.toString() || '0'
  };
  
  Object.entries(storeData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, value);
    }
  });
  
  return { success: true, company, admin_type: userCompany.admin_type };
};

// Add new company for existing owner
export const addNewCompany = async (companyData) => {
  await delay();
  
  const userEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_MAIL);
  const currentAdminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
  
  // Only owners can add new companies
  if (currentAdminType !== 'Owner') {
    throw new Error('Only owners can add new companies');
  }
  
  const companyId = getNextId(localData.companies).toString();
  
  // Create new company
  const newCompany = {
    CID: companyId,
    CName: companyData.companyName,
    CLogo: companyData.companyLogo || "/assets/images/logo.png",
    CAddress: companyData.companyAddress || "",
    UserName: userEmail,
    Password: "encrypted_password_hash",
    ReportType: companyData.reportType || "daily",
    device_count: companyData.device_count || 0,
    employee_count: companyData.employee_count || 0
  };
  
  // Create user-company association
  const userCompany = {
    user_email: userEmail,
    cid: companyId,
    admin_type: "owner"
  };
  
  // Add to data
  localData.companies.push(newCompany);
  localData.userCompanies.push(userCompany);
  
  return { success: true, company: newCompany, companyId };
};

export const registerUser = async (signupData, companyLogoFile = null) => {
  await delay();
  
  const companyId = getNextId(localData.companies).toString();
  
  // Create new company
  const newCompany = {
    CID: companyId,
    CName: signupData.companyName || signupData.company_name,
    CLogo: companyLogoFile ? "/assets/images/uploaded_logo.png" : "/assets/images/logo.png",
    CAddress: "",
    UserName: signupData.email,
    Password: "encrypted_password_hash",
    ReportType: "daily",
    device_count: signupData.device_count || 0,
    employee_count: signupData.employee_count || 0
  };
  
  // Create new user
  const newUser = {
    id: `auth_${getNextId(localData.authUsers)}`,
    email: signupData.email,
    password: signupData.password || 'demo123',
    first_name: signupData.firstName || signupData.first_name,
    last_name: signupData.lastName || signupData.last_name,
    phone_number: signupData.phoneNumber || signupData.phone_number,
    admin_type: "owner",
    company_name: signupData.companyName || signupData.company_name,
    company_logo: companyLogoFile ? "/assets/images/uploaded_logo.png" : "/assets/images/logo.png",
    report_type: "daily",
    is_verified: true,
    created_date: new Date().toISOString().split('T')[0],
    cid: companyId,
    auth_id: `auth_${getNextId(localData.authUsers)}`,
    device_count: signupData.device_count || 0,
    employee_count: signupData.employee_count || 0
  };
  
  // Create user-company association
  const userCompany = {
    user_email: signupData.email,
    cid: companyId,
    admin_type: "owner"
  };
  
  // Add to data
  localData.companies.push(newCompany);
  localData.authUsers.push(newUser);
  localData.userCompanies.push(userCompany);
  
  // Apply proper case mapping for localStorage
  const adminTypeMap = { admin: 'Admin', superadmin: 'SuperAdmin', owner: 'Owner' };
  const properCaseAdminType = adminTypeMap[userCompany.admin_type] || userCompany.admin_type;
  
  // Set localStorage for immediate login
  localStorage.setItem(STORAGE_KEYS.COMPANY_ID, companyId);
  localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, newCompany.CName);
  localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, newCompany.CLogo);
  localStorage.setItem(STORAGE_KEYS.ADMIN_MAIL, newUser.email);
  localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, properCaseAdminType);
  localStorage.setItem(STORAGE_KEYS.USER_NAME, `${newUser.first_name} ${newUser.last_name}`.trim());
  
  return { success: true, data: newUser, companyId };
};