import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header1 = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleContactClick = (e) => {
    e.preventDefault();
    setSidebarOpen(false);
    
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(scrollToContact, 100);
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

  // Navigation data
  const navItems = [
    { to: "/", label: "Home" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
    { to: "/privacypolicy", label: "Privacy Policy" }
  ];

  // CSS classes
  const desktopActiveClass = "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4";
  const desktopInactiveClass = "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12";
  const mobileActiveClass = "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4";
  const mobileInactiveClass = "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4";

  // Reusable Components
  const NavLink = ({ to, label, className, onClick }) => (
    <Link to={to} className={className} onClick={onClick}>
      {label}
    </Link>
  );

  const ContactLink = ({ className, onClick }) => (
    <a href="#contact" onClick={onClick} className={`${className} cursor-pointer`}>
      Contact Us
    </a>
  );

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#02066F]">
        <div className="flex justify-between items-center h-[70px] px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/">
              <img
                src="/images/tap-time-logo.png"
                alt="icode-logo"
                className="w-20 cursor-pointer"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-10 text-gray-500 text-lg">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                label={label}
                className={isActive(to) ? desktopActiveClass : desktopInactiveClass}
              />
            ))}
            <ContactLink
              className={desktopInactiveClass}
              onClick={handleContactClick}
            />
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-[#02066F]"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40"
            onClick={toggleSidebar}
          ></div>

          <aside className="fixed top-0 left-0 h-full w-[250px] bg-[#02066F] z-50 shadow">
            <div className="flex justify-between items-center p-2">
              <img className="w-16 pt-2" src="/logo.png" alt="logo" />
              <button onClick={toggleSidebar}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav className="space-y-3 text-[#02066F] font-medium p-10 pt-0">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  label={label}
                  className={isActive(to) ? mobileActiveClass : mobileInactiveClass}
                  onClick={toggleSidebar}
                />
              ))}
              <ContactLink
                className={mobileInactiveClass}
                onClick={handleContactClick}
              />
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header1;
