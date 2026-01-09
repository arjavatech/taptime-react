import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { switchCompany, addNewCompany } from '../../api';
import { STORAGE_KEYS } from '../../constants';
import AddCompanyModal from './AddCompanyModal';

const CompanySwitcher = ({ onAddCompanyClick }) => {
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
      await switchCompany(companyId);
      
      // Update current company immediately
      const updatedCompanyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      const updatedCompany = companies.find(c => c.cid === updatedCompanyId || c.CID === updatedCompanyId);
      setCurrentCompany(updatedCompany);
      
      // Close the dropdown
      setIsOpen(false);
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

  if (!companies.length) {
    return null;
  }

  return (
    <div className="w-full rounded-[15px] border border-gray-200">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 h-auto hover:bg-white hover:text-[#02066F]"
        disabled={loading}
      >
        <div className="flex items-center justify-between w-full">
          {isOpen ? 'Hide more accounts' : 'Show more accounts'}
          <div className="flex -space-x-1 items-center justify-end">
            {companies.filter(company => (company.cid || company.CID) !== currentCompanyId).slice(0, 2).map((company, index) => (
              <div key={company.cid || company.CID} className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                {(company.company_name || company.CName)?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            ))}
            {companies.filter(company => (company.cid || company.CID) !== currentCompanyId).length > 2 && (
              <div className="w-6 h-6 rounded-full bg-[#02066F] flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                +{companies.filter(company => (company.cid || company.CID) !== currentCompanyId).length - 2}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="h-px w-full bg-gray-200 mb-2" />
        <div className="px-2 pb-2 space-y-1">
          
          {companies.filter(company => (company.cid || company.CID) !== currentCompanyId).map((company) => (
            
            <button
              key={company.cid || company.CID}
              onClick={() => handleCompanySwitch(company.cid || company.CID)}
              className="group w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 border-b border-[gray-300] hover:bg-white hover:shadow-smtransparent "
              disabled={loading}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-[#02066F] ">
                {(company.company_name || company.CName)?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-sm text-[#02066F] ">
                  {company.company_name || company.CName || 'Unknown Company'}
                </div>
              </div>
              {(company.cid || company.CID) === currentCompanyId && (
                <div className="w-2 h-2 rounded-full bg-[#02066F]" />
              )}
            </button>
          ))}
          
          
        </div>
        <button
            key="add-company"
            onClick={handleAddCompany}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white hover:shadow-sm  transition-all duration-150 border-t border-[gray-300]"
          >
            <Plus className="w-7 h-7 text-[#02066F] p-1" />
            <span className="flex-1 text-left font-medium text-sm text-[#02066F]">Add company</span>
          </button>
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