// Essential constants only
export const ENCRYPTION_KEY = new Uint8Array([
  16, 147, 220, 113, 166, 142, 22, 93, 241, 91, 13, 252, 112, 122, 119, 95
]);

export const STORAGE_KEYS = {
  COMPANY_ID: 'companyID',
  COMPANY_NAME: 'companyName',
  COMPANY_LOGO: 'companyLogo',
  COMPANY_ADDRESS: 'companyAddress',
  ADMIN_MAIL: 'adminMail',
  ADMIN_TYPE: 'adminType',
  USER_NAME: 'userName',
  PASSWORD: 'password',
  REPORT_TYPE: 'reportType',
  TIME_ZONE: 'TimeZone',
  NO_OF_EMPLOYEES: 'NoOfEmployees',
  NO_OF_DEVICES: 'NoOfDevices',
  ALL_ADMIN_DETAILS: 'allAdminDetails',
  USER_EMAIL: 'userEmail',
  USER_ID: 'userId',
  AUTH_METHOD: 'authMethod'
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/,
  NAME: /^[a-zA-Z\s]+$/
};