import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LogoutModal from "../ui/LogoutModal";
import Avatar from "../ui/Avatar";
import CompanySwitcher from "../ui/CompanySwitcher";
import tapTimeLogo from "../../assets/images/tap-time-logo.png";

const Header = () => {
  const { user, session, signOut } = useAuth();

  // Initialize as false to prevent showing authenticated UI before session validation
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [userType, setUserType] = useState("");
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [showMobileReportsDropdown, setShowMobileReportsDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    picture: "",
    companyName: ""
  });

  useEffect(() => {
    const checkAuthStatus = () => {
      // Check if user is on login or public pages - force unauthenticated state
      const isOnLoginPage = location.pathname === "/login" || location.pathname === "/forgot-password" || location.pathname === "/register";

      if (isOnLoginPage) {
        setIsAuthenticated(false);
        setUserType("");
        setUserProfile({ name: "", email: "", picture: "" });
        return;
      }

      // Check Supabase session (auth tokens in sessionStorage)
      const hasSupabaseAuth = !!(user && session);

      // If no Supabase auth, immediately clear localStorage and set as unauthenticated
      if (!hasSupabaseAuth) {
        localStorage.clear();
        setIsAuthenticated(false);
        setUserType("");
        setUserProfile({ name: "", email: "", picture: "" });
        return;
      }

      // Only set authenticated if both Supabase auth exists AND user setup is complete
      const isUserSetupComplete = localStorage.getItem("adminMail") && localStorage.getItem("adminType");
      setIsAuthenticated(hasSupabaseAuth && !!isUserSetupComplete);

      if (hasSupabaseAuth) {
        const adminType = localStorage.getItem("adminType") || "";
        const email = localStorage.getItem("adminMail") || "";
        const userName = localStorage.getItem("userName") || "";
        const userPictureUrl = localStorage.getItem("userPicture");
        const companyName = localStorage.getItem("companyName") || "";

        // Determine if this is a Google login by checking if user has a profile picture
        // For email-based login, always use default avatar (no picture)
        const isGoogleLogin = userPictureUrl && userPictureUrl.trim() !== "";
        const profilePicture = isGoogleLogin
          ? (userPictureUrl.startsWith("http") ? userPictureUrl : `https:${userPictureUrl}`)
          : "";

        setUserType(adminType);
        setUserProfile({
          name: userName,
          email: email,
          picture: profilePicture,
          companyName: companyName
        });
      }
    };

    checkAuthStatus();
  }, [user, session, location.pathname]);

  // Listen for company changes
  useEffect(() => {
    const handleCompanyChange = () => {
      const companyName = localStorage.getItem("companyName") || "";
      setUserProfile(prev => ({ ...prev, companyName }));
    };

    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
      if (showReportsDropdown && !event.target.closest('.reports-dropdown')) {
        setShowReportsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, showReportsDropdown]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showProfileSidebar) setShowProfileSidebar(false);
        if (showProfileDropdown) setShowProfileDropdown(false);
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showProfileSidebar, showProfileDropdown]);

  useEffect(() => {
    // Set initial collapsed state after component mounts
    setIsCollapsed(window.innerWidth <= 996);

    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 996);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "/login" && (location.pathname === "/login" || location.pathname === "/forgot-password")) return true;
    if (path !== "/" && path !== "/login" && location.pathname.startsWith(path)) return true;
    return false;
  };
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setShowMobileReportsDropdown(false);
  };
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = async () => {
    // Clear both Supabase session AND localStorage
    await signOut();
    // localStorage.clear() is already called in signOut() method in AuthContext
    navigate("/login", { replace: true });
  };

  const publicNavItems = [
    { to: "/", label: "Home" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
    { to: "/contact-us", label: "Contact Us" },
  ];

  const authenticatedNavItems = [
    ...(userType === "Owner" || userType === "SuperAdmin" ? [{ to: "/device", label: "Device" }] : []),
    { to: "/employee-management", label: "Employee Management" },
    ...(userType === "Admin" ? [
      { to: "/reportsummary", label: "Report Summary" }
    ] : [
      {
        label: "Reports",
        dropdown: true,
        items: [
          { to: "/reportsummary", label: "Report Summary" },
          ...(userType === "Owner" || userType === "SuperAdmin" ? [{ to: "/reportsetting", label: "Report Settings" }] : [])
        ]
      }
    ]),
    { to: "/profile", label: "Profile" },
    { to: "/contact", label: "Contact" }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8 max-w-full mx-auto">
          <div className="flex items-center">
            {isAuthenticated ? (
              <img
                src={tapTimeLogo}
                alt="Tap Time Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => setShowHomeModal(true)}
                loading="eager"
                decoding="async"
              />
            ) : (
              <Link to="/">
                <img
                  src={tapTimeLogo}
                  alt="Tap Time Logo"
                  className="h-16 w-auto"
                  loading="eager"
                  decoding="async"
                />
              </Link>
            )}
          </div>

          <nav className={`${isCollapsed ? 'hidden' : 'flex'} items-center space-x-8`}>
            {navItems.map((item, index) => (
              item.href ? (
                <a
                  key={index}
                  href={item.href}
                  onClick={item.onClick}
                  className={`${item.href === "#contact" && location.hash === "#contact"
                    ? "text-[#02066F] bg-blue-50"
                    : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                    } px-3 py-2 text-base font-medium rounded-md transition-all duration-150`}
                >
                  {item.label}
                </a>
              ) : item.dropdown ? (
                <div key={index} className="relative reports-dropdown">
                  <button
                    onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                    className={`${location.pathname.includes("/report")
                      ? "text-[#02066F] bg-blue-50"
                      : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                      } px-3 py-2 text-base font-medium rounded-md transition-all duration-150 flex items-center gap-1`}
                  >
                    {item.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showReportsDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.to}
                          onClick={() => setShowReportsDropdown(false)}
                          className={`${isActive(subItem.to)
                            ? "text-[#02066F] bg-blue-50"
                            : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                            } block px-4 py-2 text-sm font-medium first:rounded-t-md last:rounded-b-md`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={index}
                  to={item.to}
                  className={`${isActive(item.to)
                    ? "text-[#02066F] bg-blue-50"
                    : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                    } px-3 py-2 text-base font-medium rounded-md transition-all duration-150`}
                >
                  {item.label}
                </Link>
              )
            ))}

            {isAuthenticated && (
              <div className="relative ml-3">
                <button
                  className="flex items-center text-base rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#02066F]"
                  onClick={() => {
                    if (window.innerWidth >= 1024) {
                      setShowProfileDropdown(!showProfileDropdown);
                      setShowProfileSidebar(false);
                    } else {
                      setShowProfileSidebar(!showProfileSidebar);
                      setShowProfileDropdown(false);
                    }
                  }}
                >
                  <Avatar
                    src={userProfile.picture}
                    email={userProfile.email}
                    size="md"
                    alt="Profile"
                  />
                </button>

                {/* Desktop Profile Menu */}
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)}></div>
                    <div className="hidden lg:block absolute right-0 top-full mt-2 z-50">
                      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 min-w-[300px] overflow-hidden">
                        {/* Profile Header */}
                        <div className="px-6 py-5   ">
                          <div className="flex items-center justify-center space-x-4">
                            <Avatar
                              src={userProfile.picture}
                              email={userProfile.email}
                              size="lg"
                              alt="Profile"
                              className="ring-2 ring-white/20"
                            />

                          </div>
                          <div className="flex-1 min-w-0 py-3 text-center">
                            <p className="text-[#02066F] font-medium truncate">{userProfile.companyName}</p>
                            <p className="text-gray-600 text-sm mt-1">{userProfile.email}</p>
                          </div>
                        </div>

                        {/* Company Switcher Section */}
                        {(() => {
                          const adminType = localStorage.getItem("adminType");
                          const storedCompanies = localStorage.getItem("userCompanies");
                          const hasCompanies = adminType === "Owner" && storedCompanies && JSON.parse(storedCompanies).length > 0;
                          return hasCompanies ? (
                            <div className="px-6">
                              <CompanySwitcher onAddCompanyClick={() => setShowProfileDropdown(false)} onCompanySwitch={() => setShowProfileDropdown(false)} />
                            </div>
                          ) : null;
                        })()}

                        {/* Sign Out Section */}
                        <div className="px-6 py-4">
                          <button
                            onClick={() => { setShowModal(true); setShowProfileDropdown(false); }}
                            className="w-full text-center justify-center py-2 cursor-pointer bg-[#02066F] text-white rounded-md font-medium text-base transition-all duration-200 flex items-center space-x-3 rounded-md group"
                          >
                            <svg className="w-5 h-5 text-white " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </nav>

          <button className={`${isCollapsed ? 'inline-flex' : 'hidden'} items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#02066F]`} onClick={toggleSidebar}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div className="lg:hidden fixed inset-0 z-40" onClick={toggleSidebar}></div>
            <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 border-r flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b">
                <img className="h-10 w-auto" src={tapTimeLogo} alt="Tap Time Logo" />
                <button onClick={toggleSidebar} className="text-gray-400 hover:text-black">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map((item, index) => (
                  item.href ? (
                    <a
                      key={index}
                      href={item.href}
                      onClick={item.onClick}
                      className="block px-3 py-2 text-gray-700 hover:text-[#02066F] hover:bg-gray-50 rounded-md font-medium text-base"
                    >
                      {item.label}
                    </a>
                  ) : item.dropdown ? (
                    <div key={index}>
                      <button
                        onClick={() => setShowMobileReportsDropdown(!showMobileReportsDropdown)}
                        className={`w-full text-left px-3 py-2 rounded-md font-medium text-base flex items-center justify-between ${location.pathname.includes("/report")
                          ? "text-[#02066F] bg-blue-50"
                          : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                          }`}
                      >
                        {item.label}
                        <svg className={`w-4 h-4 transition-transform ${showMobileReportsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showMobileReportsDropdown && item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.to}
                          className={`block px-6 py-2 rounded-md font-medium text-sm ml-3 ${isActive(subItem.to)
                            ? "text-[#02066F] bg-blue-50"
                            : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                            }`}
                          onClick={toggleSidebar}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      key={index}
                      to={item.to}
                      className={`block px-3 py-2 rounded-md font-medium text-base ${isActive(item.to)
                        ? "text-[#02066F] bg-blue-50"
                        : "text-gray-700 hover:text-[#02066F] hover:bg-gray-50"
                        }`}
                      onClick={toggleSidebar}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </nav>
              {isAuthenticated && (
                <div className="px-4 pb-4">
                  {(() => {
                    const adminType = localStorage.getItem("adminType");
                    const storedCompanies = localStorage.getItem("userCompanies");
                    console.log("Mobile - adminType:", adminType);
                    console.log("Mobile - storedCompanies:", storedCompanies);

                    let hasCompanies = false;
                    if (adminType === "Owner" && storedCompanies) {
                      try {
                        const companies = JSON.parse(storedCompanies);
                        hasCompanies = companies.length > 0;
                        console.log("Mobile - parsed companies:", companies);
                      } catch (e) {
                        console.log("Mobile - error parsing companies:", e);
                      }
                    }

                    console.log("Mobile - hasCompanies:", hasCompanies);
                    return hasCompanies ? (
                      <div className="mb-6">
                        <CompanySwitcher onAddCompanyClick={() => setShowProfileSidebar(false)} />
                      </div>
                    ) : null;
                  })()}
                  <button
                    onClick={() => { setShowModal(true); setShowProfileDropdown(false); }}
                    className="w-full text-center justify-center px-2 py-2 bg-[#02066F] text-white rounded-md text-sm transition-all duration-200 flex items-center space-x-3 rounded-md group"
                  >
                    <svg className="w-5 h-5 text-white " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </aside>
          </>
        )}
      </header>

      <LogoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        userName={userProfile.name}
      />


    </>
  );
};

export default Header;