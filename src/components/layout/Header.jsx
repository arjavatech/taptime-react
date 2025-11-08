import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutModal from "../ui/LogoutModal";

const Header = ({ isAuthenticated = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [userType, setUserType] = useState("");
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({ 
    name: "",
    email: "",
    picture: "",
    fallback: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [location, isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const isActive = (path) => location.pathname === path;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
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
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const publicNavItems = [
    { to: "/", label: "Home" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
    { href: "#contact", label: "Contact Us", onClick: handleContactClick },
    { to: "/privacypolicy", label: "Privacy Policy" }
  ];

  const authenticatedNavItems = [
    ...(userType !== "Admin" ? [{ to: "/device", label: "Device" }] : []),
    { to: "/employee-management", label: "Employee Management" },
    { to: "/reportsummary", label: "Report" },
    { to: "/profile", label: "Profile" },
    { to: "/contact", label: "Contact" }
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#02066F]">
        <div className="flex justify-between items-center h-[70px] px-4">
          <div className="flex items-center gap-2 ">
            {isAuthenticated ? (
              <img
                src="/images/tap-time-logo.png"
                alt="Tap Time Logo"
                className="w-20 cursor-pointer"
                onClick={() => setShowHomeModal(true)}
              />
            ) : (
              <Link to="/">
                <img src="/images/tap-time-logo.png" alt="Tap Time Logo" className="w-20 cursor-pointer" />
              </Link>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-10 text-gray-500 text-lg">
            {navItems.map((item, index) => (
              item.href ? (
                <a
                  key={index}
                  href={item.href}
                  onClick={item.onClick}
                  className="text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 cursor-pointer"
                >
                  {item.label}
                </a>
              ) : item.label === "Report" ? (
                <div key={index} className="relative">
                  <button
                    className={`${
                      isActive("/reportsummary") || isActive("/reportsetting")
                        ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-4"
                        : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12"
                    } cursor-pointer`}
                    onClick={toggleDropdown}
                  >
                    Report
                  </button>
                  {dropdownOpen && (
                    <ul className="absolute mt-2 w-48 bg-white shadow-md border rounded z-10 text-[#02066F]">
                      <li><Link to="/reportsummary" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Report Summary</Link></li>
                      {userType !== "Admin" && (
                        <li><Link to="/reportsetting" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Report Settings</Link></li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  key={index}
                  to={item.to}
                  className={isActive(item.to)
                    ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-4"
                    : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12"
                  }
                >
                  {item.label}
                </Link>
              )
            ))}

            {isAuthenticated && (
              <div className="relative z-50 ml-auto">
                  <button
                    className="w-10 h-10 rounded-full bg-[#02066F] text-white flex items-center justify-center font-bold uppercase cursor-pointer"
                    onClick={() => setShowProfileSidebar(!showProfileSidebar)}
                  >
                    {userProfile.picture ? (
                      <img
                        src={userProfile.picture}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                        onError={() => setUserProfile(prev => ({ ...prev, picture: "" }))}
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">{userProfile.fallback}</span>
                    )}
                  </button>
              </div>
            )}
          </nav>

          <button className="lg:hidden text-[#02066F]" onClick={toggleSidebar}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Sidebar */}
      {isAuthenticated && showProfileSidebar && (
        <>
          <div className="fixed inset-0 bg-opacity-50 z-40" onClick={() => setShowProfileSidebar(false)}></div>
          <div className="fixed top-0 right-0 h-full w-72 bg-[#02066F] text-white shadow-lg z-50">
            <div className="flex justify-between items-center px-4 py-4 border-b border-white">
              <h2 className="text-lg font-bold">Profile</h2>
              <button onClick={() => setShowProfileSidebar(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="px-4 py-4 flex flex-col gap-4 text-center items-center">
              {userProfile.picture ? (
                <img src={userProfile.picture} alt="Profile" className="w-20 h-20 rounded-full object-cover border-3 border-white" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white text-[#02066F] flex items-center justify-center text-3xl font-bold">
                  {userProfile.fallback}
                </div>
              )}
              <p className="text-base font-bold">{userProfile.name}</p>
              <p className="text-base text-gray-200">{userProfile.email}</p>
            </div>
            <div className="px-4 py-4 flex flex-col gap-2 text-center">
              <button
                className="bg-red-500 text-white rounded hover:opacity-90 font-semibold px-20 py-2"
                onClick={() => { setShowModal(true); setShowProfileSidebar(false); }}
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        userName={userProfile.name}
      />

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40" onClick={toggleSidebar}></div>
          <aside className="fixed top-0 left-0 h-full w-[260px] bg-[#02066F] z-50 shadow-lg">
            <div className="flex justify-between items-center p-2 bg-white border-b border-[#02066F]">
              <img className="w-18" src="/images/tap-time-logo.png" alt="Tap Time Logo" />
              <button onClick={toggleSidebar}>
                <svg className="w-6 h-6 text-[#02066F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="px-6 py-4">
              {navItems.map((item, index) => (
                item.href ? (
                  <a
                    key={index}
                    href={item.href}
                    onClick={item.onClick}
                    className="block px-3 py-3 text-white font-medium hover:bg-opacity-10 rounded mb-1"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.to}
                    className={`block px-3 py-3 font-medium rounded mb-1 ${
                      isActive(item.to) ? "bg-opacity-20 text-white" : "text-white hover:bg-opacity-10"
                    }`}
                    onClick={toggleSidebar}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              {isAuthenticated && (
                <button className="w-full mt-6 px-4 py-2 border border-white text-white rounded font-medium" onClick={() => { setShowModal(true); setSidebarOpen(false); }}>
                  Logout
                </button>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header;