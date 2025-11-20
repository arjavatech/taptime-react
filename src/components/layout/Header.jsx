import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LogoutModal from "../ui/LogoutModal";
import tapTimeLogo from "../../assets/images/tap-time-logo.png";

const Header = () => {
  const { user, session, signOut } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [userType, setUserType] = useState("");
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [showMobileReportsDropdown, setShowMobileReportsDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 996);

  const location = useLocation();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({ 
    name: "",
    email: "",
    picture: "",
    fallback: "",
  });

  useEffect(() => {
    const checkAuthStatus = () => {
      // Check both AuthContext (Supabase session) AND localStorage (backend validation)
      // User must be authenticated with Supabase AND have backend user data stored
      const hasSupabaseAuth = !!(user && session);
      const adminMail = localStorage.getItem("adminMail");
      const hasBackendData = !!adminMail;

      // User is only truly authenticated if both conditions are met
      const authenticated = hasSupabaseAuth && hasBackendData;
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const adminType = localStorage.getItem("adminType") || "";
        const email = localStorage.getItem("adminMail") || "";
        const userName = localStorage.getItem("userName") || "";
        const userPictureUrl = localStorage.getItem("userPicture");

        const fixedPictureUrl = userPictureUrl && !userPictureUrl.startsWith("http")
          ? `https:${userPictureUrl}` : userPictureUrl;

        setUserType(adminType);
        setUserProfile({
          name: userName,
          email: email,
          picture: fixedPictureUrl || "",
          fallback: email.charAt(0).toUpperCase(),
        });
      } else {
        // Reset user profile when not authenticated
        setUserType("");
        setUserProfile({
          name: "",
          email: "",
          picture: "",
          fallback: "",
        });
      }
    };

    checkAuthStatus();
  }, [user, session, location]);

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
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 996);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setShowMobileReportsDropdown(false);
  };
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleContactClick = (e) => {
    e.preventDefault();
    setSidebarOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollToContact(), 100);
    } else {
      scrollToContact();
    }
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      const headerOffset = 70;
      const elementPosition = contactSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

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
    { href: "#contact", label: "Contact Us", onClick: handleContactClick },
  ];

  const authenticatedNavItems = [
    ...(userType !== "Admin" ? [{ to: "/device", label: "Device" }] : []),
    { to: "/employee-management", label: "Employee Management" },
    { 
      label: "Reports", 
      dropdown: true,
      items: [
        { to: "/reportsummary", label: "Report Summary" },
        { to: "/reportsetting", label: "Report Settings" }
      ]
    },
    { to: "/profile", label: "Profile" },
    { to: "/contact", label: "Contact" }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex justify-between items-center h-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center">
            {isAuthenticated ? (
              <img
                src={tapTimeLogo}
                alt="Tap Time Logo"
                className="h-16 w-auto cursor-pointer"
                onClick={() => setShowHomeModal(true)}
              />
            ) : (
              <Link to="/">
                <img src={tapTimeLogo} alt="Tap Time Logo" className="h-16 w-auto" />
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
                  className={`${
                    item.href === "#contact" && location.hash === "#contact"
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
                    className={`${
                      location.pathname.includes("/report")
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
                          className={`${
                            isActive(subItem.to)
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
                  className={`${
                    isActive(item.to)
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
                  onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                >
                  {userProfile.picture ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={userProfile.picture}
                      alt="Profile"
                      onError={() => setUserProfile(prev => ({ ...prev, picture: "" }))}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#02066F] flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{userProfile.fallback}</span>
                    </div>
                  )}
                </button>
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
              <button onClick={toggleSidebar} className="text-gray-400 hover:text-gray-600">
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
                      className="w-full text-left px-3 py-2 text-gray-700 hover:text-[#02066F] hover:bg-gray-50 rounded-md font-medium text-base flex items-center justify-between"
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
                        className={`block px-6 py-2 rounded-md font-medium text-sm ml-3 ${
                          isActive(subItem.to) 
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
                    className={`block px-3 py-2 rounded-md font-medium text-base ${
                      isActive(item.to) 
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
                <button 
                  className="w-full px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md font-medium text-left text-base" 
                  onClick={() => { setShowModal(true); setSidebarOpen(false); }}
                >
                  Logout
                </button>
              </div>
            )}
          </aside>
        </>
      )}
      </header>

      {/* Profile Sidebar */}
      {isAuthenticated && showProfileSidebar && (
        <>
          <div className="fixed inset-0 bg-opacity-50 z-40" onClick={() => setShowProfileSidebar(false)}></div>
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 border-l">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <button onClick={() => setShowProfileSidebar(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center space-x-4">
                {userProfile.picture ? (
                  <img className="h-16 w-16 rounded-full object-cover" src={userProfile.picture} alt="Profile" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#02066F] flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{userProfile.fallback}</span>
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{userProfile.name}</h4>
                  <p className="text-sm text-gray-500">{userProfile.email}</p>
                </div>
              </div>
              <div className="mt-8">
                <button
                  onClick={() => { setShowModal(true); setShowProfileSidebar(false); }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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