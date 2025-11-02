// Common utility functions
export const generateRandomId = (prefix = 'eid_') => {
  return prefix + Math.random().toString(36).substr(2, 12);
};

// JWT token decoding
export const decodeJwtResponse = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
};

// File handling utilities
export const dataURLToBlob = (dataURL) => {
  const parts = dataURL.split(',');
  const mimeType = parts[0].match(/:(.*?);/)[1];
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  return new Blob([uint8Array], { type: mimeType });
};

export const loadFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Date and time utilities
// Get local date as YYYY-MM-DD (not UTC)
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get local datetime as YYYY-MM-DDTHH:mm:ss (not UTC)
export const getLocalDateTimeString = (date = new Date()) => {
  const dateStr = getLocalDateString(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}T${hours}:${minutes}:${seconds}`;
};

export const getCurrentDate = () => {
  return getLocalDateString();
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const getCurrentTime = () => {
  return new Date().toTimeString().slice(0, 5);
};

// Address formatting
export const formatAddress = (street, city, state, zip) => {
  return `${street}--${city}--${state}--${zip}`;
};

export const parseAddress = (addressString) => {
  const parts = (addressString || '').split('--');
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2] || '',
    zip: parts[3] || ''
  };
};

// Local storage utilities
export const setLocalStorageData = (data) => {
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(key, value);
    }
  });
};

export const getLocalStorageData = (keys) => {
  const data = {};
  keys.forEach(key => {
    data[key] = localStorage.getItem(key);
  });
  return data;
};

export const clearLocalStorageKeys = (keys) => {
  keys.forEach(key => localStorage.removeItem(key));
};

// Modal utilities
export const showModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal && window.bootstrap) {
    const modalInstance = new window.bootstrap.Modal(modal);
    modalInstance.show();
    return modalInstance;
  }
};

export const hideModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal && window.bootstrap) {
    const modalInstance = window.bootstrap.Modal.getInstance(modal);
    if (modalInstance) modalInstance.hide();
  }
};

// Loading overlay utilities
export const showLoading = (overlayId = 'overlay') => {
  const overlay = document.getElementById(overlayId);
  if (overlay) overlay.style.display = 'flex';
};

export const hideLoading = (overlayId = 'overlay') => {
  const overlay = document.getElementById(overlayId);
  if (overlay) overlay.style.display = 'none';
};

// Success/Error message utilities
export const showMessage = (message, type = 'success', duration = 3000) => {
  // Create toast notification or use existing message system
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // You can implement toast notifications here
  if (type === 'error') {
    console.error(message);
  }
};

// Form utilities
export const resetForm = (formId) => {
  const form = document.getElementById(formId);
  if (form) form.reset();
};

export const clearFormErrors = (formId) => {
  const form = document.getElementById(formId);
  if (form) {
    const errors = form.querySelectorAll('.error, .text-danger');
    errors.forEach(error => error.textContent = '');
  }
};

// Navigation utilities
export const redirectTo = (url, delay = 0) => {
  setTimeout(() => {
    window.location.href = url;
  }, delay);
};

export const openInNewTab = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Search and filter utilities
export const filterTableRows = (searchValue, tableBodyId, columnIndex = 1) => {
  const rows = document.querySelectorAll(`#${tableBodyId} tr`);
  const searchTerm = searchValue.toLowerCase();
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells[columnIndex]) {
      const cellText = cells[columnIndex].textContent.toLowerCase();
      row.style.display = cellText.includes(searchTerm) ? '' : 'none';
    }
  });
};

// Employee data utilities
export const createEmployeeObject = (formData, isAdmin = 0) => {
  return {
    EmpID: formData.empId || generateRandomId(),
    CID: formData.companyId || localStorage.getItem('companyID'),
    FName: formData.firstName,
    LName: formData.lastName,
    IsActive: formData.isActive !== undefined ? formData.isActive : true,
    PhoneNumber: formData.phoneNumber,
    Email: formData.email || null,
    Pin: formData.pin,
    IsAdmin: isAdmin,
    LastModifiedBy: formData.lastModifiedBy || 'Admin'
  };
};

// Company data utilities
export const createCompanyObject = (formData) => {
  return {
    CID: formData.companyId || localStorage.getItem('companyID'),
    UserName: formData.username || localStorage.getItem('username'),
    CName: formData.companyName,
    CAddress: formData.companyAddress,
    CLogo: formData.companyLogo || localStorage.getItem('imageFile'),
    Password: formData.password || localStorage.getItem('password'),
    ReportType: formData.reportType || 'Weekly',
    LastModifiedBy: formData.lastModifiedBy || 'Admin'
  };
};

// Customer data utilities
export const createCustomerObject = (formData) => {
  return {
    CustomerID: formData.customerId,
    CID: formData.companyId || localStorage.getItem('companyID'),
    FName: formData.firstName,
    LName: formData.lastName,
    Address: formData.address,
    PhoneNumber: formData.phoneNumber,
    Email: formData.email,
    IsActive: formData.isActive !== undefined ? formData.isActive : true,
    LastModifiedBy: formData.lastModifiedBy || 'Admin'
  };
};