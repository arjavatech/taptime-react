import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Header2 = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [userType, setUserType] = useState("");
  const [getEmail, setGetEmail] = useState("");
  const [avatarDropdown, setAvatarDropdown] = useState(false);
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
    const currentPath = location.pathname;
    const adminType = localStorage.getItem("adminType") || "";
    const email = localStorage.getItem("adminMail") || "";
    const userName = localStorage.getItem("userName") || "";
    const userPictureUrl = localStorage.getItem("userPicture");

    // Fix Google image URL if needed
    const fixedPictureUrl =
      userPictureUrl && !userPictureUrl.startsWith("http")
        ? `https:${userPictureUrl}`
        : userPictureUrl;

    setUserType(adminType);
    setGetEmail(email);
    setUserProfile({
      name: userName,
      email: email,
      picture: fixedPictureUrl || "",
      fallback: email.charAt(0).toUpperCase(),
    });

    console.log("User Profile:", userProfile);
  }, [location]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const logOutAction = () => {
    setShowModal(true);
    setSidebarOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const HomePage = () => {
    setShowHomeModal(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem("username");
    localStorage.removeItem("companyID");
    localStorage.removeItem("customId");
    localStorage.removeItem("password");
    localStorage.removeItem("adminType");
    localStorage.clear();

    try {
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Navigation error:", error);
      try {
        navigate("/", { replace: true });
      } catch (fallbackError) {
        console.error("Fallback navigation error:", fallbackError);
        window.location.href = "/";
      }
    }
  };

  const toggleAvatarDropdown = (event) => {
    event.stopPropagation();
    setAvatarDropdown(!avatarDropdown);
  };

  const closeAvatarDropdown = () => {
    setAvatarDropdown(false);
  };

  useEffect(() => {
    document.addEventListener("click", closeAvatarDropdown);
    return () => {
      document.removeEventListener("click", closeAvatarDropdown);
    };
  }, []);

  const toggleProfileSidebar = () => {
    setShowProfileSidebar(!showProfileSidebar);
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#02066F]">
        <div className="flex justify-between items-center h-[70px] px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/images/tap-time-logo.png"
              alt="icode-logo"
              className="w-20 cursor-pointer"
              onClick={HomePage}
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10 text-gray-500 text-lg">
            {userType !== "Admin" && (
              <a
                href="/device"
                className={
                  isActive("/device")
                    ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                    : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
                }
              >
                Device
              </a>
            )}

            <a
              href="/employeelist"
              className={
                isActive("/employeelist")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Employee Management
            </a>

            {/* Dropdown */}
            <div className="relative">
              <button
                className={
                  isActive("/reportsummary") ||
                  isActive("/daywisereport") ||
                  isActive("/salariedreport") ||
                  isActive("/reportsetting")
                    ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4 cursor-pointer"
                    : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 cursor-pointer focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
                }
                onClick={toggleDropdown}
              >
                Report
              </button>
              {dropdownOpen && (
                <ul className="absolute mt-2 w-48 bg-white shadow-md border rounded z-10 text-[#02066F]">
                  <li>
                    <a
                      href="/reportsummary"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Report Summary
                    </a>
                  </li>
                  {userType !== "Admin" && (
                    <li>
                      <a
                        href="/reportsetting"
                        className="block px-4 py-2 hover:bg-gray-100"
                      >
                        Report Settings
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <a
              href="/profile"
              className={
                isActive("/profile")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Profile
            </a>
            <a
              href="/contact"
              className={
                isActive("/contact")
                  ? "text-[#02066F] font-semibold underline decoration-2 underline-offset-12 underline-offset-4"
                  : "text-gray-500 underline-offset-4 hover:underline hover:decoration-2 hover:underline-offset-12 focus:text-[#02066F] focus:underline focus:decoration-2 focus:underline-offset-12"
              }
            >
              Contact Us
            </a>

            {/* Profile Avatar */}
            <div className="relative z-50">
              <button
                className="w-10 h-10 rounded-full bg-[#02066F] text-white flex items-center justify-center font-bold uppercase cursor-pointer"
                onClick={toggleProfileSidebar}
              >
                {userProfile.picture ? (
                  <img
                    src={userProfile.picture}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    onError={() =>
                      setUserProfile((prev) => ({ ...prev, picture: "" }))
                    }
                  />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {userProfile.fallback}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* ✅ Sidebar Modal */}
          {showProfileSidebar && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-opacity-50 z-40"
                onClick={toggleProfileSidebar}
              ></div>

              {/* Sidebar */}
              <div className="fixed top-0 right-0 h-full w-72 bg-[#02066F] text-white shadow-lg z-50 transition-transform duration-300">
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-4 border-b border-white">
                  <h2 className="text-lg font-bold">Profile</h2>
                  <button
                    onClick={toggleProfileSidebar}
                    className="text-white text-xl cursor-pointer hover:text-gray-300"
                  >
                    &times;
                  </button>
                </div>

                {/* User Info */}
                <div className="px-4 py-4 flex flex-col gap-4 justify-center text-center items-center">
                  {userProfile.picture ? (
                    <img
                      src={userProfile.picture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-3 border-white"
                      onError={() =>
                        setUserProfile((prev) => ({ ...prev, picture: "" }))
                      }
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white text-[#02066F] flex items-center justify-center text-3xl font-bold border-3 border-yellow-600">
                      {userProfile.fallback}
                    </div>
                  )}
                  <p className="text-base text-white font-bold">
                    {userProfile.name}
                  </p>
                  <p className="text-base text-gray-200">{userProfile.email}</p>
                </div>

                {/* Actions */}
                <div className="px-4 py-4 flex flex-col gap-2 justify-center text-center">
                  <div
                    className="flex flex-row bg-red-500 text-white rounded hover:opacity-90 font-semibold cursor-pointer mt-4 px-20 py-2 items-center text-center gap-2"
                    onClick={() => {
                      logOutAction();
                      toggleProfileSidebar();
                    }}
                  >
                    <img src="/images/logout.png" alt="logout" className="w-6 h-5" />
                    <button className="cursor-pointer">Logout</button>
                  </div>
                </div>
                <div className="pt-6 flex justify-center items-center text-center">
                  <span className="text-base flex gap-2">
                    <p className="text-gray-100">Need help?</p>
                    <a href="/contact">
                      <p className="text-[yellow] hover:underline">
                        Contact Support
                      </p>
                    </a>
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Logout Modal */}
          {showModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="bg-white rounded-lg w-auto max-w-md shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-[#02066F] text-white p-1 flex justify-between text-center items-center">
                  <h2 className="text-xl font-semibold w-full text-center">
                    Logout
                  </h2>
                  <button
                    className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2"
                    onClick={closeModal}
                  >
                    &times;
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                  <h5 className="text-xl font-bold mb-4 text-gray-800">
                    Are you sure you want to logout?
                  </h5>
                  <div className="flex justify-center space-x-2">
                    <button
                      className="bg-[#02066F] opacity-80 hover:opacity-70 text-white px-6 py-2 rounded-md cursor-pointer"
                      onClick={handleLogout}
                    >
                      Yes
                    </button>
                    <button
                      className="bg-white text-black px-6 py-2 rounded-md cursor-pointer border-1 border-[#02066F]"
                      onClick={closeModal}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          <aside className="fixed top-0 left-0 h-full w-[250px] bg-[#02066F] z-50 shadow ">
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
              <a
                href="/device"
                className={
                  isActive("/device")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
              >
                Device
              </a>

              <a
                href="/employeelist"
                className={
                  isActive("/employeelist")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
              >
                Employee Management
              </a>

              {/* Report Dropdown Section */}
              <div className="relative">
                <button
                  className={
                    isActive("/reportsummary") ||
                    isActive("/daywisereport") ||
                    isActive("/salariedreport") ||
                    isActive("/reportsetting")
                      ? "w-full text-left px-2 py-1 text-white rounded font-medium text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                      : "w-full text-left px-2 py-1 text-white rounded font-medium text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                  }
                  onClick={toggleDropdown}
                >
                  Report
                </button>

                {dropdownOpen && (
                  <div className="pl-4 space-y-1 mt-1">
                    <a
                      href="/reportsummary"
                      className={
                        isActive("/reportsummary")
                          ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                          : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                      }
                    >
                      Report Summary
                    </a>
                    <a
                      href="/reportsetting"
                      className={
                        isActive("/reportsetting")
                          ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                          : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                      }
                    >
                      Report Settings
                    </a>
                  </div>
                )}
              </div>

              <a
                href="/profile"
                className={
                  isActive("/profile")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
              >
                Profile
              </a>

              <a
                href="/contact"
                className={
                  isActive("/contact")
                    ? "block px-2 py-1 text-white rounded text-sm underline decoration-white decoration-2 underline-offset-6 underline-offset-4"
                    : "block px-2 py-1 text-white rounded text-sm hover:underline hover:decoration-white hover:underline-offset-4"
                }
              >
                Contact Us
              </a>

              <button
                className="w-25 mt-4 px-4 py-2 bg-white rounded text-center items-center justify-center"
                onClick={logOutAction}
              >
                Logout
              </button>
            </nav>
          </aside>
        </>
      )}

      {/* Home Modal */}
      {showHomeModal && (
        <div
          className="fixed p-6 inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#02066F] text-white p-4 flex justify-between text-center items-center">
              <h3 className="text-xl font-semibold w-full text-center">Home</h3>
              <button
                className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2"
                onClick={() => setShowHomeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-center text-sm md:text-xl font-bold mb-6 text-gray-800">
                Are you sure, you want to go home?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  className="bg-[#02066F] opacity-80 hover:opacity-60 text-white px-6 py-2 rounded font-semibold cursor-pointer transition"
                  onClick={() => (window.location.href = "/")}
                >
                  Yes
                </button>
                <button
                  className="border border-[#02066F] text-[#02066F] px-6 py-2 rounded font-semibold hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => setShowHomeModal(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header2;
