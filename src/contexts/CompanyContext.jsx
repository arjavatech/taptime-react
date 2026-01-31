import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { googleSignInCheck } from '../api.js';
import { STORAGE_KEYS } from '../constants';
import { validateAndSwitchCompany } from '../utils/subscriptionUtils.js';

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
  const [loadingPromise, setLoadingPromise] = useState(null);

  // Handle extension context errors
  useEffect(() => {
    const handleError = (event) => {
      if (event.error?.message?.includes('Extension context invalidated')) {
        event.preventDefault();
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Periodic subscription validation for owners - reduced frequency
  useEffect(() => {
    const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
    if (adminType !== 'Owner' && adminType !== 'owner') return;

    const checkSubscription = async () => {
      if (userCompanies.length > 0) {
        await validateAndSwitchCompany(userCompanies, switchToCompany);
      }
    };

    // Check every 30 minutes instead of 5 minutes to reduce API calls
    const interval = setInterval(checkSubscription, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userCompanies]); // Remove switchToCompany from dependencies

  // Load user's companies when email is available
  const loadUserCompanies = useCallback(async (userEmail) => {  
    if (!userEmail) return;
    
    // If already loading for this email, return the existing promise
    if (loadingPromise) {
      return loadingPromise;
    }
    
    setLoading(true);
    const promise = (async () => {
      try {
        // Check if user is an owner - owners should not use Google login
        const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
        if (adminType === 'owner') {
          // For owners, get companies from localStorage instead of Google login
          const storedCompanies = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COMPANIES) || '[]');
          setUserCompanies(storedCompanies);
          
          // Validate subscription and auto-switch if needed
          await validateAndSwitchCompany(storedCompanies, switchToCompany);
          return;
        }
        
        const result = await googleSignInCheck(userEmail);
        
        // Handle error responses from API
        if (result && result.success === false) {
          console.error('Failed to load companies:', result.error);
          setUserCompanies([]);
          return;
        }
        
        // Ensure companies is an array
        const companies = Array.isArray(result) ? result : [];
        setUserCompanies(companies);
        
        // Set current company from localStorage or default to first company
        const savedCompanyId = localStorage.getItem('lastSelectedCompany') || localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
        const savedCompany = companies.find(c => c.CID === savedCompanyId);
        
        if (savedCompany) {
          setCurrentCompany(savedCompany);
        } else if (companies.length > 0) {
          // Default to first company if no saved company or saved company not found
          await switchToCompany(companies[0]);
        }
      } catch (error) {
        console.error('Error loading user companies:', error);
        setUserCompanies([]);
      } finally {
        setLoading(false);
        setLoadingPromise(null);
      }
    })();
    
    setLoadingPromise(promise);
    return promise;
  }, [loadingPromise]); // Remove switchToCompany from dependencies

  // Switch to a different company
  const switchToCompany = useCallback(async (company) => {
    if (!company) return;

    // Check subscription status before switching (for owners)
    const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
    if (adminType === 'Owner') {
      try {
        const { getSubscriptionStatus } = await import('../api.js');
        const subscriptionStatus = await getSubscriptionStatus(company.cid || company.CID);
        
        if (subscriptionStatus.success && subscriptionStatus.data) {
          const { is_subscription_valid, subscription_message } = subscriptionStatus.data;
          
          // If subscription is invalid and expired, try to find another valid company
          if (is_subscription_valid === false && 
              subscription_message && 
              (subscription_message.toLowerCase().includes('expired') || 
               subscription_message.includes('Your subscription has expired. Please renew to continue.'))) {
            
            console.log(`Company ${company.company_name || company.CName} subscription expired, searching for alternative...`);
            
            // Find a company with valid subscription
            for (const altCompany of userCompanies) {
              if ((altCompany.cid || altCompany.CID) === (company.cid || company.CID)) continue;
              
              const altSubscription = await getSubscriptionStatus(altCompany.cid || altCompany.CID);
              if (altSubscription.success && 
                  altSubscription.data && 
                  altSubscription.data.is_subscription_valid !== false) {
                
                console.log(`Auto-switching to company ${altCompany.company_name || altCompany.CName} with valid subscription`);
                company = altCompany; // Use the valid company instead
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking subscription during company switch:', error);
        // Continue with original company if check fails
      }
    }

    setCurrentCompany(company);
    
    // Handle different company data structures (owner vs Google user)
    const companyId = company.cid || company.CID;
    const companyName = company.company_name || company.CName;
    const companyLogo = company.company_logo || company.CLogo;
    const reportType = company.report_type || company.ReportType;
    
    // Update localStorage with new company data
    const companyData = {
      [STORAGE_KEYS.COMPANY_ID]: companyId,
      [STORAGE_KEYS.COMPANY_NAME]: companyName,
      [STORAGE_KEYS.COMPANY_LOGO]: companyLogo,
      [STORAGE_KEYS.ADMIN_TYPE]: company.admin_type,
      [STORAGE_KEYS.REPORT_TYPE]: reportType,
      [STORAGE_KEYS.NO_OF_DEVICES]: company.device_count?.toString() || '0',
      [STORAGE_KEYS.NO_OF_EMPLOYEES]: company.employee_count?.toString() || '0',
      'lastSelectedCompany': companyId // Remember user's preference
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
  }, [userCompanies]);

  // Get current company's admin type for the user
  const getCurrentAdminType = useCallback(() => {
    return currentCompany?.admin_type || localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE) || '';
  }, [currentCompany]);

  // Check if user has access to multiple companies
  const hasMultipleCompanies = useCallback(() => {
    return userCompanies.length > 1;
  }, [userCompanies]);

  // Validate current company subscription and switch if needed
  const validateCurrentCompanySubscription = useCallback(async () => {
    return await validateAndSwitchCompany(userCompanies, switchToCompany);
  }, [userCompanies]); // Remove switchToCompany from dependencies

  const value = {
    currentCompany,
    userCompanies,
    loading,
    loadUserCompanies,
    switchToCompany,
    getCurrentAdminType,
    hasMultipleCompanies,
    validateCurrentCompanySubscription
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};