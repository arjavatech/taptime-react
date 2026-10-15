import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Monitor, Users, Building2, ClipboardList, BarChart2,
  User, FileText, Settings, MessageCircle, ChevronDown,
  ChevronRight, Menu, X, LogOut, DollarSign, Calendar,
  Plug, Receipt
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import CompanySwitcher from '../ui/CompanySwitcher';
import LogoutModal from '../ui/LogoutModal';
import tapTimeLogo from '../../assets/images/tap-time-logo.png';
import { STORAGE_KEYS } from '../../constants/index.js';

const ITEM_BASE = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full';
const ITEM_ACTIVE = `${ITEM_BASE} bg-white/15 text-white`;
const ITEM_INACTIVE = `${ITEM_BASE} text-white/75 hover:bg-white/10 hover:text-white`;
const SUB_ITEM_BASE = `${ITEM_BASE} pl-7`;
const SUB_ITEM_ACTIVE = `${SUB_ITEM_BASE} bg-white/15 text-white`;
const SUB_ITEM_INACTIVE = `${SUB_ITEM_BASE} text-white/75 hover:bg-white/10 hover:text-white`;

const Sidebar = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userType = localStorage.getItem(STORAGE_KEYS.ADMIN_TYPE) || '';
  const userName = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  const userEmail = localStorage.getItem(STORAGE_KEYS.ADMIN_MAIL) || '';
  const companyName = localStorage.getItem(STORAGE_KEYS.COMPANY_NAME) || '';
  const rawPicture = localStorage.getItem('userPicture') || '';
  const userPicture = rawPicture
    ? rawPicture.startsWith('http') ? rawPicture : `https:${rawPicture}`
    : '';

  const isEmployee = userType === 'Employee';
  const isOwnerOrSuper = userType === 'Owner' || userType === 'SuperAdmin';
  const isAdmin = userType === 'Admin';

  const accessRaw = localStorage.getItem(STORAGE_KEYS.USER_ACCESS_ROLES);
  const hasEmployeeRoles = accessRaw
    ? (JSON.parse(accessRaw).employee_roles || []).length > 0
    : false;
  const showCompanySwitcher = userType === 'Owner' || hasEmployeeRoles;

  useEffect(() => {
    if (
      location.pathname.includes('/report') ||
      location.pathname.includes('/salary') ||
      location.pathname.includes('/weekly')
    ) {
      setReportsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isReportActive = ['/reportsummary', '/salary-report', '/weekly-report', '/reportsetting'].some(isActive);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const employeeItems = [
    { to: '/my-profile', label: 'My Profile', icon: User },
    { to: '/my-reports', label: 'My Reports', icon: FileText },
    { to: '/my-assignments', label: 'My Assignments', icon: ClipboardList },
  ];

  const primaryItems = [
    ...(isOwnerOrSuper ? [{ to: '/device', label: 'Device', icon: Monitor }] : []),
    { to: '/employee-management', label: 'Employee Management', icon: Users },
    ...(!isAdmin ? [{ to: '/partners', label: 'Partners', icon: Building2 }] : []),
    ...(userType !== 'Owner' ? [{ to: '/my-assignments', label: 'My Assignments', icon: ClipboardList }] : []),
  ];

  const reportSubItems = [
    { to: '/reportsummary', label: 'Report Summary', icon: BarChart2 },
    { to: '/salary-report', label: 'Salary Report', icon: DollarSign },
    { to: '/weekly-report', label: 'Weekly Report', icon: Calendar },
    ...(isOwnerOrSuper ? [{ to: '/reportsetting', label: 'Report Settings', icon: Settings }] : []),
  ];

  const secondaryItems = [
    { to: '/profile', label: 'Profile', icon: User },
    ...(isOwnerOrSuper ? [{ to: '/invoices', label: 'Invoices', icon: Receipt }] : []),
    ...(isOwnerOrSuper ? [{ to: '/integrations', label: 'Integrations', icon: Plug }] : []),
    { to: '/contact', label: 'Contact', icon: MessageCircle },
  ];

  const renderUserInfo = () => (
    <div className="px-3 py-3 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-2.5 px-1">
        <div className="ring-2 ring-white/20 rounded-full shrink-0">
          <Avatar src={userPicture} email={userEmail} size="sm" alt="Profile" />
        </div>
        <div className="flex-1 min-w-0">
          {companyName && (
            <p className="text-sm font-semibold text-white truncate">{companyName}</p>
          )}
          {userName && <p className="text-xs text-white/75 truncate">{userName}</p>}
          {userEmail && <p className="text-xs text-white/50 truncate">{userEmail}</p>}
        </div>
      </div>
      {showCompanySwitcher && (
        <div className="mt-2 rounded-2xl overflow-hidden bg-white shadow-sm">
          <CompanySwitcher
            onAddCompanyClick={() => {}}
            onCompanySwitch={() => {}}
            subscriptionStatus={{ is_subscription_valid: true, subscription_message: '' }}
          />
        </div>
      )}
    </div>
  );

  const renderNav = () => (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
      {isEmployee ? (
        employeeItems.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={isActive(to) ? ITEM_ACTIVE : ITEM_INACTIVE}>
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </Link>
        ))
      ) : (
        <>
          {/* Primary items */}
          {primaryItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={isActive(to) ? ITEM_ACTIVE : ITEM_INACTIVE}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}

          {/* Reports: accordion for Owner/SuperAdmin, flat list for Admin */}
          {isAdmin ? (
            reportSubItems.slice(0, 2).map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={isActive(to) ? ITEM_ACTIVE : ITEM_INACTIVE}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            ))
          ) : (
            <>
              <button
                onClick={() => setReportsOpen(prev => !prev)}
                className={`${ITEM_BASE} ${isReportActive && !reportsOpen ? 'text-white' : 'text-white/75'} hover:bg-white/10 hover:text-white`}
              >
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Reports</span>
                {reportsOpen
                  ? <ChevronDown className="w-4 h-4 shrink-0 text-white/60" />
                  : <ChevronRight className="w-4 h-4 shrink-0 text-white/60" />}
              </button>
              {reportsOpen && reportSubItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className={isActive(to) ? SUB_ITEM_ACTIVE : SUB_ITEM_INACTIVE}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </>
          )}

          {/* Secondary items with top divider */}
          <div className="pt-2 mt-1 border-t border-white/10 space-y-0.5">
            {secondaryItems.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={isActive(to) ? ITEM_ACTIVE : ITEM_INACTIVE}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </nav>
  );

  const renderSignOut = () => (
    <div className="border-t border-white/10 px-3 pt-2 pb-4 shrink-0">
      <button
        onClick={() => setShowLogoutModal(true)}
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold w-full transition-all duration-150 bg-white text-[#02066F] hover:bg-gray-100"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Sign Out</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-[#02066F] flex-col z-40 shadow-lg">
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <img src={tapTimeLogo} alt="Tap Time" className="h-12 w-auto brightness-0 invert" />
        </div>
        {renderUserInfo()}
        {renderNav()}
        {renderSignOut()}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#02066F] z-40 flex items-center justify-between px-4 shadow-md">
        <img src={tapTimeLogo} alt="Tap Time" className="h-10 w-auto brightness-0 invert" />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay + slide-in sidebar */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#02066F] z-50 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
              <img src={tapTimeLogo} alt="Tap Time" className="h-10 w-auto brightness-0 invert" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderUserInfo()}
            {renderNav()}
            {renderSignOut()}
          </aside>
        </>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        userName={userName}
      />
    </>
  );
};

export default Sidebar;
