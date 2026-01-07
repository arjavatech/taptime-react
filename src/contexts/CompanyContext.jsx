import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getUserCompanies } from '../api.js';
import { STORAGE_KEYS } from '../constants';

const CompanyContext = createContext({});

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's companies when email is available
  const loadUserCompanies = useCallback(async (userEmail) => {
    if (!userEmail) return;
    
    setLoading(true);
    try {
      const companies = await getUserCompanies(userEmail);
      setUserCompanies(companies);
      
      // Set current company from localStorage or default to first company
      const savedCompanyId = localStorage.getItem('lastSelectedCompany') || localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      const savedCompany = companies.find(c => c.CID === savedCompanyId);
      
      if (savedCompany) {
        setCurrentCompany(savedCompany);
      } else if (companies.length > 0) {
        // Default to first company if no saved company or saved company not found
        switchToCompany(companies[0]);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Switch to a different company
  const switchToCompany = useCallback((company) => {
    if (!company) return;

    setCurrentCompany(company);
    
    // Update localStorage with new company data
    const companyData = {
      [STORAGE_KEYS.COMPANY_ID]: company.CID,
      [STORAGE_KEYS.COMPANY_NAME]: company.CName,
      [STORAGE_KEYS.COMPANY_LOGO]: company.CLogo,
      [STORAGE_KEYS.ADMIN_TYPE]: company.admin_type,
      [STORAGE_KEYS.REPORT_TYPE]: company.ReportType,
      [STORAGE_KEYS.NO_OF_DEVICES]: company.device_count?.toString() || '0',
      [STORAGE_KEYS.NO_OF_EMPLOYEES]: company.employee_count?.toString() || '0',
      'lastSelectedCompany': company.CID // Remember user's preference
    };

    Object.entries(companyData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        localStorage.setItem(key, value);
      }
    });

    // Trigger a custom event to notify other components of company change
    window.dispatchEvent(new CustomEvent('companyChanged', { 
      detail: { company } 
    }));
  }, []);

  // Get current company's admin type for the user
  const getCurrentAdminType = useCallback(() => {
    return currentCompany?.admin_type || localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE) || '';
  }, [currentCompany]);

  // Check if user has access to multiple companies
  const hasMultipleCompanies = useCallback(() => {
    return userCompanies.length > 1;
  }, [userCompanies]);

  const value = {
    currentCompany,
    userCompanies,
    loading,
    loadUserCompanies,
    switchToCompany,
    getCurrentAdminType,
    hasMultipleCompanies
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};