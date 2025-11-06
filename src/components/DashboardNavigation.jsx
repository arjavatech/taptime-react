import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const DashboardNavigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      const toggler = document.querySelector('.navbar-toggler');
      
      if (sidebar && toggler && !sidebar.contains(event.target) && !toggler.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("companyID");
    localStorage.removeItem("customId");
    localStorage.removeItem("password");
    localStorage.removeItem("companyName");
    localStorage.removeItem("companyLogo");
    localStorage.removeItem("companyAddress");
    localStorage.removeItem("reportType");
    localStorage.removeItem("TimeZone");
    
    setTimeout(() => {
      navigate('/login');
    }, 100);
  };

  const handleHomePage = () => {
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav 
        className="navbar navbar-expand-lg navbar-light"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #02066F',
          padding: '5px 15px',
          height: '70px'
        }}
      >
        <div className="container-fluid">
          <img 
            src="/Image/icode logo 2 (1).png" 
            alt="Tap Time Logo" 
            className="logo" 
            onClick={() => setShowHomeModal(true)}
            style={{
              height: '50px',
              width: 'auto',
              padding: 0,
              marginTop: '-5px',
              cursor: 'pointer'
            }}
          />

          <button 
            className="navbar-toggler" 
            type="button" 
            aria-label="Toggle navigation"
            style={{ padding: 0 }}
            onClick={toggleSidebar}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup" style={{ justifyContent: 'end' }}>
            <div className="navbar-nav">
              <Link 
                className="nav-link"
                to="/device" 
                style={{ color: '#02066F', padding: '5px 10px' }}
              >
                Device
              </Link>
              <Link 
                className={`nav-link ${isActive('/employee-list') ? 'active' : ''}`}
                to="/employee-list" 
                style={{ color: '#02066F', padding: '5px 10px' }}
              >
                Employee Management
              </Link>
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle" 
                  href="#service" 
                  id="navbarDropdown" 
                  role="button"
                  data-bs-toggle="dropdown" 
                  aria-expanded="false" 
                  style={{ color: '#02066F', padding: '5px 10px' }}
                >
                  Report
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
                    <Link className="dropdown-item" to="/report-summary" style={{ padding: '5px' }}>
                      Report Summary
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/report-settings" style={{ padding: '5px' }}>
                      Report Settings
                    </Link>
                  </li>
                </ul>
              </li>
              <Link 
                className="nav-link"
                to="/profile" 
                style={{ color: '#02066F', padding: '5px 10px' }}
              >
                Profile
              </Link>
              <Link 
                className="nav-link"
                to="/contact" 
                style={{ color: '#02066F', padding: '5px 10px' }}
              >
                Contact Us
              </Link>
              <button 
                className="btn logoutButton" 
                onClick={() => setShowLogoutModal(true)}
                style={{ padding: '5px 10px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div id="sidebar" className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '250px', padding: '10px' }}>
        <img src="/Image/Group 91.png" alt="Tap Time Logo" className="app_logo" />
        <Link to="/device">Device</Link>
        <Link to="/employee-list">Employee Management</Link>
        <Link to="/report-summary">Report Summary</Link>
        <Link to="/report-settings">Report Settings</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/contact">Contact Us</Link>
        <button className="btn logoutButton" onClick={() => setShowLogoutModal(true)} style={{ backgroundColor: 'white', color: '#02066F', margin: '20px', borderRadius: '6px' }}>
          Logout
        </button>
      </div>

      {/* Home Page Modal */}
      {showHomeModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ textAlign: 'center', width: '100%' }}>Home</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHomeModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h5 className="fw-bold mb-3 text-center">Are you sure you want to go home?</h5>
                <p className="d-flex justify-content-center">
                  <button className="btn yes" onClick={handleHomePage}>Yes</button>
                  <button 
                    className="btn no" 
                    onClick={() => setShowHomeModal(false)}
                    style={{ marginLeft: '2%' }}
                  >
                    No
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" style={{ textAlign: 'center', width: '100%' }}>Logout</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLogoutModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h5 className="fw-bold mb-3 text-center">Are you sure, you want to logout?</h5>
                <p className="d-flex justify-content-center">
                  <button className="btn yes" onClick={handleLogout} style={{ marginLeft: '2%' }}>
                    Yes
                  </button>
                  <button 
                    className="btn no" 
                    onClick={() => setShowLogoutModal(false)}
                    style={{ marginLeft: '2%' }}
                  >
                    No
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardNavigation;