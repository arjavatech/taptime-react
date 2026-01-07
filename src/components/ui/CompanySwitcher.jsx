import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { switchCompany, addNewCompany } from '../../api';
import { STORAGE_KEYS } from '../../constants';
import AddCompanyModal from './AddCompanyModal';

const CompanySwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const userEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_MAIL);
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
      await switchCompany(companyId, userEmail);
      
      // Update current company immediately
      const updatedCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      const updatedCompany = companies.find(c => c.cid === updatedCompanyId || c.CID === updatedCompanyId);
      setCurrentCompany(updatedCompany);
      
      // Close the dropdown
      setIsOpen(false);
      
      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('companyChanged', { detail: { companyId: updatedCompanyId } }));
    } catch (error) {
      console.error('Error switching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompanySuccess = () => {
    loadCompanies();
  };

  if (!companies.length) {
    return null;
  }

  return (
    <div className="w-full bg-gray-50 rounded-lg border border-gray-200">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 h-auto hover:bg-gray-100 rounded-lg"
        disabled={loading}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#02066F] flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {currentCompany?.company_name?.charAt(0)?.toUpperCase() || currentCompany?.CName?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-gray-900 truncate">{currentCompany?.company_name || currentCompany?.CName || 'Unknown Company'}</span>
            <span className="text-xs text-gray-500">{companies.length} companies</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-2 pb-2 space-y-1">
          <div className="h-px bg-gray-200 mx-2 mb-2" />
          {companies.map((company) => (
            <button
              key={company.cid || company.CID}
              onClick={() => handleCompanySwitch(company.cid || company.CID)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 ${
                (company.cid || company.CID) === currentCompanyId
                  ? 'bg-[#02066F]/10 border border-[#02066F]/20 shadow-sm'
                  : 'hover:bg-white hover:shadow-sm border border-transparent'
              }`}
              disabled={loading}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                (company.cid || company.CID) === currentCompanyId
                  ? 'bg-[#02066F]'
                  : 'bg-gray-400'
              }`}>
                {(company.company_name || company.CName)?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 text-left">
                <div className={`font-medium text-sm ${
                  (company.cid || company.CID) === currentCompanyId ? 'text-[#02066F]' : 'text-gray-700'
                }`}>
                  {company.company_name || company.CName || 'Unknown Company'}
                </div>
              </div>
              {(company.cid || company.CID) === currentCompanyId && (
                <div className="w-2 h-2 rounded-full bg-[#02066F]" />
              )}
            </button>
          ))}
          
          <button
            key="add-company"
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white hover:shadow-sm rounded-md transition-all duration-150 border border-dashed border-gray-300 hover:border-[#02066F]/30 mt-3"
          >
            <Plus className="w-7 h-7 text-gray-400 p-1" />
            <span className="flex-1 text-left font-medium text-sm text-gray-600">Add company</span>
          </button>
        </div>
      </div>
      
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddCompanySuccess}
      />
    </div>
  );
};

export default CompanySwitcher;