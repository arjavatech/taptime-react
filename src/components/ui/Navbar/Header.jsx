import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Header = () => {
  const [activePage, setActivePage] = useState("Home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const pages = ["Home", "Login", "Register", "Contact Us", "PrivacyPolicy"];

  const getPath = (page) => {
    if (page === "Contact Us") return "/#contact";
    return page === "Home"
      ? "/"
      : "/" + page.toLowerCase().replace(/\s+/g, "-");
  };

  const getPageFromPath = (path) => {
    if (path === "/" || path === "") return "Home";
    if (path.includes("#contact")) return "Contact Us";
    const formatted = path.replace("/", "").replace(/-/g, " ");
    if (formatted.includes("forget") || formatted.includes("forgot")) {
      return "Login";
    }
    if (formatted.includes("updatepassword")) {
      return "Login";
    }
    if (formatted.includes("register2")) {
      return "Register";
    }
    const foundPage = pages.find((p) => p.toLowerCase() === formatted);
    return foundPage || "Home";
  };

  // Set active page based on current path on initial load and route changes
  useEffect(() => {
    const currentPath = location.pathname + location.hash;
    setActivePage(getPageFromPath(currentPath));

    // If we have a hash in the URL, scroll to that section
    if (location.hash === "#contact") {
      setTimeout(() => {
        scrollToContact();
      }, 100);
    }
  }, [location]);

  

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleNavigate = (page) => {
    setActivePage(page);

    if (page === "Contact Us") {
      // If we're already on the home page, just scroll to contact
      if (location.pathname === "/") {
        scrollToContact();
        // Update URL with hash
        window.history.pushState(null, "", "/#contact");
      } else {
        // Navigate to home page with contact hash
        navigate("/#contact");
      }
    } else if (page === "Home") {
      // Remove any hash from URL first
      if (window.location.hash) {
        window.history.replaceState(null, "", "/");
      }
      // Always scroll to top immediately
      scrollToTop();
      // If not on home page, navigate to home
      if (location.pathname !== "/") {
        navigate("/");
      }
    } else {
      // For other pages, scroll to top and navigate
      scrollToTop();
      const path = getPath(page);
      navigate(path);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="flex justify-between items-center px-2 py-0">
          {/* Logo */}
          <div className="flex items-center p-2 pl-1">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("Home");
              }}
              className="cursor-pointer"
            >
              <img
                className="w-19"
                src="/src/Public/tap-time-logo.png"
                alt="app-logo"
              />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-md hover:text-[#02066F] focus:outline-none"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex space-x-12 pr-8 text-lg">
              {pages.map((page) => (
                <li key={page}>
                  <button
                    className={`px-2 py-1 transition-all cursor-pointer duration-200 hover:text-[#02066F] hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12 ${
                      activePage === page
                        ? "text-[#02066F] underline decoration-2 underline-offset-12"
                        : "text-gray-500"
                    }`}
                    onClick={() => handleNavigate(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <hr className="mt-2" />
      </header>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-opacity-50 z-40 transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setMobileMenuOpen(false)}
        ></div>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-[#02066F] text-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center p-4">
            <img className="w-20 pt-2" src="/src/Public/logo.png" alt="logo" />
            <button
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                className="w-6 h-6"
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

          <nav className="p-4">
            <ul className="space-y-3">
              {pages.map((page) => (
                <li key={page}>
                  <button
                    className={`w-full block text-left px-4 py-2 rounded transition-all duration-200 hover:decoration-2 focus:decoration-2 ${
                      activePage === page
                        ? "text-white underline decoration-white font-semibold decoration-2 underline-offset-6"
                        : "text-white hover:underline hover:decoration-white hover:underline-offset-4"
                    }`}
                    onClick={() => {
                      handleNavigate(page);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {page}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
};

export default Header;
