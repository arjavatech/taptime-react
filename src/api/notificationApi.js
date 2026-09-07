/**
 * Notification Settings API Functions
 * Handles employee notification preferences, CC recipients, and company-level settings
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');

// Helper function to get current access token
const getAuthToken = async () => {
  try {
    const token = localStorage.getItem("access_token");
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function for API requests
const apiRequest = async (url, options = {}) => {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// ============================================
// NOTIFICATION SETTINGS (Admin Endpoints)
// ============================================

/**
 * Enable weekly reports for an employee
 */
export const enableWeeklyReport = async (empId, companyId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/enable-weekly-report/${empId}/${companyId}`,
      { method: 'POST' }
    );
    return result;
  } catch (error) {
    console.error('Error enabling weekly report:', error);
    throw error;
  }
};

/**
 * Disable weekly reports for an employee
 */
export const disableWeeklyReport = async (empId, companyId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/disable-weekly-report/${empId}/${companyId}`,
      { method: 'POST' }
    );
    return result;
  } catch (error) {
    console.error('Error disabling weekly report:', error);
    throw error;
  }
};

/**
 * Get notification settings for an employee
 */
export const getNotificationSettings = async (empId, companyId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/${empId}/${companyId}`,
      { method: 'GET' }
    );
    return result;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
};

/**
 * Add CC recipient to employee's notification settings
 */
export const addCCRecipient = async (notificationSettingId, ccEmail) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/${notificationSettingId}/add-cc`,
      {
        method: 'POST',
        body: JSON.stringify({ cc_email: ccEmail }),
      }
    );
    return result;
  } catch (error) {
    console.error('Error adding CC recipient:', error);
    throw error;
  }
};

/**
 * Remove CC recipient from notification settings
 */
export const removeCCRecipient = async (ccId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/cc-recipient/${ccId}`,
      { method: 'DELETE' }
    );
    return result;
  } catch (error) {
    console.error('Error removing CC recipient:', error);
    throw error;
  }
};

/**
 * Get all CC recipients for notification settings
 */
export const getCCRecipients = async (notificationSettingId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/notification-settings/cc-recipients/${notificationSettingId}`,
      { method: 'GET' }
    );
    return result;
  } catch (error) {
    console.error('Error fetching CC recipients:', error);
    throw error;
  }
};

// ============================================
// EMPLOYEE SELF-SERVICE ENDPOINTS
// ============================================

/**
 * Employee enables their own weekly reports
 */
export const employeeEnableWeeklyReport = async (empId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/enable-weekly-report`,
      { method: 'POST' }
    );
    return result;
  } catch (error) {
    console.error('Error enabling weekly reports:', error);
    throw error;
  }
};

/**
 * Employee disables their own weekly reports
 */
export const employeeDisableWeeklyReport = async (empId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/disable-weekly-report`,
      { method: 'POST' }
    );
    return result;
  } catch (error) {
    console.error('Error disabling weekly reports:', error);
    throw error;
  }
};

/**
 * Employee gets their notification configuration
 */
export const employeeGetNotificationConfig = async (empId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/notification-config`,
      { method: 'GET' }
    );
    return result;
  } catch (error) {
    console.error('Error fetching notification config:', error);
    throw error;
  }
};

/**
 * Employee adds CC recipient to their notifications
 */
export const employeeAddCCRecipient = async (empId, ccEmail) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/cc-recipients`,
      {
        method: 'POST',
        body: JSON.stringify({ cc_email: ccEmail }),
      }
    );
    return result;
  } catch (error) {
    console.error('Error adding CC recipient:', error);
    throw error;
  }
};

/**
 * Employee removes CC recipient from their notifications
 */
export const employeeRemoveCCRecipient = async (empId, ccId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/cc-recipients/${ccId}`,
      { method: 'DELETE' }
    );
    return result;
  } catch (error) {
    console.error('Error removing CC recipient:', error);
    throw error;
  }
};

/**
 * Employee gets their CC recipients
 */
export const employeeGetCCRecipients = async (empId) => {
  try {
    const result = await apiRequest(
      `${API_BASE}/employees/${empId}/cc-recipients`,
      { method: 'GET' }
    );
    return result;
  } catch (error) {
    console.error('Error fetching CC recipients:', error);
    throw error;
  }
};
