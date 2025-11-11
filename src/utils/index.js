// Consolidated utilities
import { VALIDATION_PATTERNS, STORAGE_KEYS } from '../constants';

// Validation
export const isValidEmail = (email) => VALIDATION_PATTERNS.EMAIL.test(email);
export const isValidPhone = (phone) => VALIDATION_PATTERNS.PHONE.test(phone);
export const isValidName = (name) => VALIDATION_PATTERNS.NAME.test(name);

// Phone formatting
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  let value = phone.replace(/\D/g, "");
  if (value.length > 6) {
    return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
  } else if (value.length > 3) {
    return `(${value.slice(0, 3)}) ${value.slice(3)}`;
  }
  return value.length > 0 ? `(${value}` : "";
};

// Storage helpers
export const getStorageValue = (key, defaultValue = null) => {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

// Date utilities
export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateTimeString = (date = new Date()) => {
  const dateStr = getLocalDateString(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}T${hours}:${minutes}:${seconds}`;
};

// Debounce
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate ID
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);