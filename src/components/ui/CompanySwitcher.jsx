import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, CreditCard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Card, CardContent } from './card';
import { switchCompany, addNewCompany, getSubscriptionPlans, createCheckoutSession } from '../../api';
import { STORAGE_KEYS } from '../../constants';
import AddCompanyModal from './AddCompanyModal';

const CompanySwitcher = ({ onAddCompanyClick, onCompanySwitch, subscriptionStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
  const currentCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);

  useEffect(() => {
    if (adminType === 'Owner') {
      loadCompanies();
    }
  }, [adminType, currentCompanyId]);

  const loadCompanies = () => {
    const storedCompanies = localStorage.getItem(STORAGE_KEYS.USER_COMPANIES);
    if (storedCompanies) {
      const userCompanies = JSON.parse(storedCompanies);
      setCompanies(userCompanies);
      
      const current = userCompanies.find(c => c.cid === currentCompanyId || c.CID === currentCompanyId);
      setCurrentCompany(current);
    }
  };

  // Only show for owners
  if (adminType !== 'Owner') {
    return null;
  }

  const handleCompanySwitch = async (companyId) => {
    if (companyId === currentCompanyId || loading) return;
    
    setLoading(true);
    try {
      // Use switchToCompany instead of switchCompany to avoid page reload
      const companies = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COMPANIES) || '[]');
      const selectedCompany = companies.find(company => company.cid === companyId);
      
      if (selectedCompany) {
        // Set the new active company without page reload
        localStorage.setItem(STORAGE_KEYS.COMPANY_ID, selectedCompany.cid);
        localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, selectedCompany.company_name);
        localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, selectedCompany.report_type);
        localStorage.setItem(STORAGE_KEYS.ADMIN_MAIL, selectedCompany.email);
        
        // Update company logo if available
        if (selectedCompany.company_logo) {
          localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, selectedCompany.company_logo);
        } else {
          localStorage.removeItem(STORAGE_KEYS.COMPANY_LOGO);
        }
        
        // Update device and employee counts
        if (selectedCompany.device_count !== undefined) {
          localStorage.setItem(STORAGE_KEYS.NO_OF_DEVICES, selectedCompany.device_count.toString());
        }
        if (selectedCompany.employee_count !== undefined) {
          localStorage.setItem(STORAGE_KEYS.NO_OF_EMPLOYEES, selectedCompany.employee_count.toString());
        }
        
        localStorage.setItem('lastSelectedCompany', companyId);
        
        // Update current company immediately
        setCurrentCompany(selectedCompany);
        
        // Close the dropdown
        setIsOpen(false);
        
        // Close parent dropdown if callback provided
        if (onCompanySwitch) {
          onCompanySwitch();
        }
        
        // Dispatch company change event for other components to listen
        window.dispatchEvent(new CustomEvent('companyChanged', {
          detail: { company: selectedCompany, companyId }
        }));
        
        // Navigate to Employee Management page
        navigate('/employee-management');
      }
    } catch (error) {
      console.error('Error switching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = () => {
    console.log('handleAddCompany called');
    setIsOpen(false);
    setShowAddModal(true);
    console.log('showAddModal set to true');
  };

  const handleAddCompanySuccess = () => {
    loadCompanies();
    setShowAddModal(false);
  };

  const handleSubscriptionClick = async () => {
    setSubscriptionLoading(true);
    try {
      const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      const employeeCount = parseInt(localStorage.getItem(STORAGE_KEYS.NO_OF_EMPLOYEES) || '1', 10);
      
      const plansResponse = await getSubscriptionPlans();
      if (!plansResponse.success || !plansResponse.plans || plansResponse.plans.length === 0) {
        console.error('Unable to load subscription plans');
        return;
      }
      
      const priceId = plansResponse.plans[0].stripe_price_id;
      const successUrl = `${window.location.origin}/employee-management`;
      const cancelUrl = window.location.href;
      
      const checkoutResponse = await createCheckoutSession(
        companyId,
        priceId,
        employeeCount,
        successUrl,
        cancelUrl
      );
      
      if (checkoutResponse.success) {
        window.location.href = checkoutResponse.data.checkout_url;
      } else {
        console.error('Failed to create checkout session:', checkoutResponse.error);
      }
    } catch (error) {
      console.error('Error handling subscription:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const isCompanySubscriptionExpired = (company) => {
    return company.is_subscription_valid === false && 
           company.subscription_message === "Your subscription has expired. Please renew to continue.";
  };

  const otherCompanies = companies.filter(company => (company.cid || company.CID) !== currentCompanyId);
  const hasMultipleCompanies = otherCompanies.length > 0;

  if (!companies.length) {
    return null;
  }

  return (
    <div className="w-full rounded-[15px] border border-gray-200">
      {hasMultipleCompanies && (
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-3 py-3 h-auto hover:bg-white hover:text-[#02066F]"
          disabled={loading}
        >
          <div className="flex items-center justify-between w-full">
            {isOpen ? 'Hide more accounts' : 'Show more accounts'}
            <div className="flex -space-x-1 items-center justify-end">
              {otherCompanies.slice(0, 2).map((company, index) => (
                <div key={company.cid || company.CID} className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                  {(company.company_name || company.CName)?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              ))}
              {otherCompanies.length > 2 && (
                <div className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                  +{otherCompanies.length - 2}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      )}

      {hasMultipleCompanies && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="h-px w-full bg-gray-200 mb-2" />
          <div className="px-2 pb-2 space-y-1">
            {otherCompanies.map((company) => (
              <div
                key={company.cid || company.CID}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 border-b border-[gray-300] ${
                  isCompanySubscriptionExpired(company) ? 'opacity-100' : 'hover:bg-white hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-[#02066F]">
                  {(company.company_name || company.CName)?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div 
                  className="flex-1 text-left"
                  onClick={!isCompanySubscriptionExpired(company) ? () => handleCompanySwitch(company.cid || company.CID) : undefined}
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-[#02066F]">
                      {company.company_name || company.CName || 'Unknown Company'}
                    </div>
                    {isCompanySubscriptionExpired(company) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscriptionClick();
                        }}
                        disabled={subscriptionLoading}
                        size="sm"
                        className="!bg-[#02066F] hover:!bg-[#02066F]/90 !text-white px-2 py-1 text-xs !opacity-100"
                      >
                        {subscriptionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="w-3 h-3 mr-1" />
                        )}
                        Subscribe
                      </Button>
                    )}
                  </div>
                  {isCompanySubscriptionExpired(company) && (
                    <div className="text-xs text-red-500 mt-1">
                      {company.subscription_message}
                    </div>
                  )}
                </div>
                {(company.cid || company.CID) === currentCompanyId && (
                  <div className="w-2 h-2 rounded-full bg-[#02066F]" />
                )}
              </div>
            ))}
          </div>
          <button
            onClick={handleAddCompany}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:shadow-sm transition-all duration-150 border-t border-[gray-300]"
          >
            <Plus className="w-7 h-7 text-[#02066F] p-1" />
            <span className="flex-1 text-left font-medium text-sm text-[#02066F]">Add company</span>
          </button>
        </div>
      )}
      
      {!hasMultipleCompanies && (
        <button
          onClick={handleAddCompany}
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:shadow-sm transition-all duration-150"
        >
          <Plus className="w-7 h-7 text-[#02066F] p-1" />
          <span className="flex-1 text-left font-medium text-sm text-[#02066F]">Add company</span>
        </button>
      )}
      
      
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddCompanySuccess}
      />
    </div>
  );
};

export default CompanySwitcher;