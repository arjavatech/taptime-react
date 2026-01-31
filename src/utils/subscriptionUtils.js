import { getSubscriptionStatus } from '../api.js';
import { STORAGE_KEYS } from '../constants';

/**
 * Check if current company subscription is valid and auto-switch if needed
 * @param {Array} userCompanies - Array of user's companies
 * @param {Function} switchToCompany - Function to switch companies
 * @returns {Promise<boolean>} - Returns true if valid company found, false otherwise
 */
export const validateAndSwitchCompany = async (userCompanies, switchToCompany) => {
  try {
    const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
    
    // Only check for owners
    if (adminType !== 'Owner' && adminType !== 'owner') {
      return true;
    }

    if (!userCompanies || userCompanies.length === 0) {
      return false;
    }

    const currentCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
    const currentCompany = userCompanies.find(c => (c.cid || c.CID) === currentCompanyId);
    
    if (!currentCompany) {
      // No current company, switch to first available
      await switchToCompany(userCompanies[0]);
      return true;
    }

    // Check current company's subscription
    const subscriptionStatus = await getSubscriptionStatus(currentCompanyId);
    
    if (subscriptionStatus.success && subscriptionStatus.data) {
      const { is_subscription_valid, subscription_message } = subscriptionStatus.data;
      
      // If subscription is invalid and expired (handle both generic and specific messages)
      if (is_subscription_valid === false && 
          subscription_message && 
          (subscription_message.toLowerCase().includes('expired') || 
           subscription_message.includes('Your subscription has expired. Please renew to continue.'))) {
        
        console.log(`Current company subscription expired: ${subscription_message}`);
        
        // Find a company with valid subscription
        for (const company of userCompanies) {
          if ((company.cid || company.CID) === currentCompanyId) continue;
          
          const companySubscription = await getSubscriptionStatus(company.cid || company.CID);
          if (companySubscription.success && 
              companySubscription.data && 
              companySubscription.data.is_subscription_valid !== false) {
            
            console.log(`Auto-switching to company ${company.company_name || company.CName} with valid subscription`);
            await switchToCompany(company);
            return true;
          }
        }
        
        // No valid companies found
        console.log('No companies with valid subscriptions found');
        return false;
      }
    }
    
    return true; // Current company is valid
  } catch (error) {
    console.error('Error validating company subscription:', error);
    return true; // Return true to avoid blocking login on error
  }
};

/**
 * Check if a specific company has a valid subscription
 * @param {string} companyId - Company ID to check
 * @returns {Promise<boolean>} - Returns true if subscription is valid
 */
export const isCompanySubscriptionValid = async (companyId) => {
  try {
    const subscriptionStatus = await getSubscriptionStatus(companyId);
    
    if (subscriptionStatus.success && subscriptionStatus.data) {
      const { is_subscription_valid, subscription_message } = subscriptionStatus.data;
      
      // Consider subscription invalid only if explicitly false with expiration message
      return !(is_subscription_valid === false && 
               subscription_message && 
               (subscription_message.toLowerCase().includes('expired') || 
                subscription_message.includes('Your subscription has expired. Please renew to continue.')));
    }
    
    return true; // Default to valid if can't determine
  } catch (error) {
    console.error('Error checking company subscription:', error);
    return true; // Default to valid on error
  }
};