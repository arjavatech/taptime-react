// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev/';
const REPORT_API_BASE_URL = import.meta.env.VITE_REPORT_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev/';

// API Endpoints
export const API_ENDPOINTS = {
  // Employee endpoints
  EMPLOYEE: {
    BASE: `${API_BASE_URL}/employee`,
    BY_COMPANY: (companyId) => `${API_BASE_URL}/employee/by-company/${companyId}`,
    CREATE: `${API_BASE_URL}/employee/create`,
    UPDATE: (empId) => `${API_BASE_URL}/employee/update/${empId}`,
    DELETE: (empId) => `${API_BASE_URL}/employee/delete/${empId}/Admin`,
    GET: (empId) => `${API_BASE_URL}/employee/get/${empId}`,
    LOGIN_CHECK: (email) => `${API_BASE_URL}/employee/login_check/${email}`
  },

  // Company endpoints
  COMPANY: {
    BASE: `${API_BASE_URL}/company`,
    GET_USER: (username) => `${API_BASE_URL}/company/getuser/${username}`,
    UPDATE: (cid) => `${API_BASE_URL}/company/update/${cid}`,
    GET: (cid) => `${API_BASE_URL}/company/get/${cid}`
  },

  // Customer endpoints
  CUSTOMER: {
    BASE: `${API_BASE_URL}/customer`,
    GET_BY_CID: (cid) => `${API_BASE_URL}/customer/getUsingCID/${cid}`,
    UPDATE: (customerId) => `${API_BASE_URL}/customer/update/${customerId}`
  },

  // Device endpoints
  DEVICE: {
    BASE: `${API_BASE_URL}/device`,
    GET_ALL: (cid) => `${API_BASE_URL}/device/get_all/${cid}`
  },

  // Auth endpoints
  AUTH: {
    SIGN_UP: `${API_BASE_URL}/auth/sign_up`
  },

  // Report endpoints
  REPORT: {
    DAILY_CREATE: `${REPORT_API_BASE_URL}/dailyreport/create`,
    DAILY_GET: (companyId, date) => `${REPORT_API_BASE_URL}/dailyreport/getdatebasedata/${companyId}/${date}`,
    DAILY_UPDATE: (empId, cid, checkinTime) => `${REPORT_API_BASE_URL}/dailyreport/update/${empId}/${cid}/${encodeURIComponent(checkinTime)}`,
    DATE_RANGE: (companyId, startDate, endDate) => `${REPORT_API_BASE_URL}/report/dateRangeReportGet/${companyId}/${startDate}/${endDate}`,
    
    // Report settings
    SETTINGS: {
      GET_ALL_EMAILS: (companyId) => `${REPORT_API_BASE_URL}/company-report-type/get_all_report_email/${companyId}`,
      CREATE: `${REPORT_API_BASE_URL}/company-report-type/create`,
      UPDATE: (email, companyId) => `${REPORT_API_BASE_URL}/company-report-type/update/${email}/${companyId}`,
      DELETE: (email, companyId) => `${REPORT_API_BASE_URL}/company-report-type/delete/${email}/${companyId}/Admin`,
      GET: (email, companyId) => `${REPORT_API_BASE_URL}/company-report-type/get/${email}/${companyId}`
    }
  },

  // Contact endpoints
  CONTACT: {
    CREATE: `${API_BASE_URL}/web_contact_us/create`
  }
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// Request timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000;