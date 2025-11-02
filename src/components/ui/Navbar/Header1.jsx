import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header1 = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleContactClick = (e) => {
    e.preventDefault();

    // Close mobile sidebar if open
    setSidebarOpen(false);

    // If not on homepage, navigate to it first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        scrollToContact();
      }, 100);
    } else {
      // Already on homepage, just scroll
      scrollToContact();
    }
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      const headerOffset = 70; // Fixed header height
      const elementPosition = contactSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

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

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10 text-gray-500 text-lg">
            <Link
              to="/"
              className={
                isActive("/")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Home
            </Link>

            <Link
              to="/login"
              className={
                isActive("/login")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Login
            </Link>

            <Link
              to="/register"
              className={
                isActive("/register")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Register
            </Link>

            <a
              href="#contact"
              onClick={handleContactClick}
              className="text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12 cursor-pointer"
            >
              Contact Us
            </a>

            <Link
              to="/privacypolicy"
              className={
                isActive("/privacypolicy")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Privacy Policy
            </Link>
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
              <Link
                to="/"
                className={
                  isActive("/")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
                onClick={toggleSidebar}
              >
                Home
              </Link>

              <Link
                to="/login"
                className={
                  isActive("/login")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
                onClick={toggleSidebar}
              >
                Login
              </Link>

              <Link
                to="/register"
                className={
                  isActive("/register")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
                onClick={toggleSidebar}
              >
                Register
              </Link>

              <a
                href="#contact"
                onClick={handleContactClick}
                className="block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4 cursor-pointer"
              >
                Contact Us
              </a>

              <Link
                to="/privacypolicy"
                className={
                  isActive("/privacypolicy")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
                onClick={toggleSidebar}
              >
                Privacy Policy
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
};

export default Header1;
