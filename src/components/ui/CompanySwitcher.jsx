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
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const adminType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE);
  const currentCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);

  useEffect(() => {
    loadCompanies();
  }, [adminType, currentCompanyId]);

  const loadCompanies = () => {
    // Load owned companies (Owner role)
    const storedCompanies = localStorage.getItem(STORAGE_KEYS.USER_COMPANIES);
    if (storedCompanies) {
      const userCompanies = JSON.parse(storedCompanies);
      setCompanies(userCompanies);
      const current = userCompanies.find(c => c.cid === currentCompanyId || c.CID === currentCompanyId);
      setCurrentCompany(current);
    }

    // Load cross-company employee roles (SuperAdmin in another company)
    const storedAccess = localStorage.getItem(STORAGE_KEYS.USER_ACCESS_ROLES);
    if (storedAccess) {
      const access = JSON.parse(storedAccess);
      setEmployeeRoles(access.employee_roles || []);
    }
  };

  // Show for Owners and for SuperAdmins with cross-company access
  const hasAccessRoles = employeeRoles.length > 0;
  if (adminType !== 'Owner' && !hasAccessRoles) {
    return null;
  }

  const handleCompanySwitch = async (companyId, role = 'Owner') => {
    if (companyId === currentCompanyId || loading) return;

    setLoading(true);
    try {
      // Search owned companies first, then employee roles
      const ownedCompanies = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_COMPANIES) || '[]');
      let selectedCompany = ownedCompanies.find(c => c.cid === companyId || c.CID === companyId);

      // Fall back to employee roles (cross-company SuperAdmin)
      if (!selectedCompany) {
        const storedAccess = localStorage.getItem(STORAGE_KEYS.USER_ACCESS_ROLES);
        if (storedAccess) {
          const access = JSON.parse(storedAccess);
          selectedCompany = (access.employee_roles || []).find(r => r.cid === companyId);
        }
      }

      if (selectedCompany) {
        const cid = selectedCompany.cid || selectedCompany.CID;
        const companyName = selectedCompany.company_name || selectedCompany.CName;

        localStorage.setItem(STORAGE_KEYS.COMPANY_ID, cid);
        localStorage.setItem(STORAGE_KEYS.COMPANY_NAME, companyName);
        localStorage.setItem(STORAGE_KEYS.REPORT_TYPE, selectedCompany.report_type || '');
        localStorage.setItem(STORAGE_KEYS.ADMIN_MAIL, selectedCompany.email || '');
        localStorage.setItem(STORAGE_KEYS.ADMIN_TYPE, role);

        if (selectedCompany.company_logo) {
          localStorage.setItem(STORAGE_KEYS.COMPANY_LOGO, selectedCompany.company_logo);
        } else {
          localStorage.removeItem(STORAGE_KEYS.COMPANY_LOGO);
        }
        if (selectedCompany.device_count !== undefined) {
          localStorage.setItem(STORAGE_KEYS.NO_OF_DEVICES, selectedCompany.device_count.toString());
        }
        if (selectedCompany.employee_count !== undefined) {
          localStorage.setItem(STORAGE_KEYS.NO_OF_EMPLOYEES, selectedCompany.employee_count.toString());
        }

        localStorage.setItem('lastSelectedCompany', cid);
        setCurrentCompany(selectedCompany);
        setIsOpen(false);

        if (onCompanySwitch) onCompanySwitch();

        window.dispatchEvent(new CustomEvent('companyChanged', {
          detail: { company: selectedCompany, companyId: cid }
        }));

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
  // All switchable entries: other owned companies + cross-company roles (excluding current)
  const allOtherEntries = [
    ...otherCompanies.map(c => ({ ...c, _role: 'Owner' })),
    ...employeeRoles.filter(r => r.cid !== currentCompanyId).map(r => ({ ...r, _role: 'SuperAdmin' }))
  ];
  const hasMultipleCompanies = allOtherEntries.length > 0;

  if (!companies.length && !employeeRoles.length) {
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
              {allOtherEntries.slice(0, 2).map((entry) => (
                <div key={entry.cid || entry.CID} className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                  {(entry.company_name || entry.CName)?.charAt(0)?.toUpperCase() || 'C'}
                </div>
              ))}
              {allOtherEntries.length > 2 && (
                <div className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                  +{allOtherEntries.length - 2}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      )}

      {hasMultipleCompanies && (
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="h-px w-full bg-gray-200 mb-2" />
          <div className="px-2 pb-2 space-y-1">
            {allOtherEntries.map((entry) => {
              const entryId = entry.cid || entry.CID;
              const entryName = entry.company_name || entry.CName || 'Unknown Company';
              const expired = isCompanySubscriptionExpired(entry);
              return (
                <div
                  key={entryId}
                  className={`group w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 border-b border-gray-200 ${
                    expired ? 'opacity-100' : 'hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-[#02066F]">
                    {entryName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className="flex-1 text-left"
                    onClick={!expired ? () => handleCompanySwitch(entryId, entry._role) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm text-[#02066F]">{entryName}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                        {entry._role}
                      </span>
                      {expired && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleSubscriptionClick(); }}
                          disabled={subscriptionLoading}
                          size="sm"
                          className="!bg-[#02066F] hover:!bg-[#02066F]/90 !text-white px-2 py-1 text-xs !opacity-100"
                        >
                          {subscriptionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}
                          Subscribe
                        </Button>
                      )}
                    </div>
                    {expired && (
                      <div className="text-xs text-red-500 mt-1">{entry.subscription_message}</div>
                    )}
                  </div>
                  {entryId === currentCompanyId && (
                    <div className="w-2 h-2 rounded-full bg-[#02066F]" />
                  )}
                </div>
              );
            })}
          </div>
          {adminType === 'Owner' && (
            <div className="px-2 pb-2 pt-1">
              <button
                onClick={handleAddCompany}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/90 transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium text-sm">Add company</span>
              </button>
            </div>
          )}
        </div>
      )}

      {!hasMultipleCompanies && adminType === 'Owner' && (
        <div className="px-2 py-2">
          <button
            onClick={handleAddCompany}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#02066F] text-white rounded-lg hover:bg-[#02066F]/90 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">Add company</span>
          </button>
        </div>
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