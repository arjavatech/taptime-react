import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

const Navigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      const toggler = document.querySelector('.navbar-toggler');
      
      if (sidebar && toggler && !sidebar.contains(event.target) && !toggler.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav 
        className={`navbar navbar-expand-lg sticky-top ${scrolled ? 'scrolled' : ''}`}
        style={{
          backgroundColor: 'white',
          padding: '5px 15px',
          height: '70px',
          borderBottom: '1px solid #02066F',
          zIndex: 1030
        }}
      >
        <Link className="logo" to="/">
          <img 
            src="/web_Image/app_logo.png" 
            alt="Tap Time Logo" 
            className="logo"
            style={{
              height: '50px',
              width: 'auto',
              padding: 0,
              marginTop: '-5px'
            }}
          />
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          aria-label="Toggle navigation"
          style={{ padding: 0 }}
          onClick={toggleSidebar}
        >
          <span className="navbar-toggler-icon">
            <Menu size={24} />
          </span>
        </button>
        
        <div className="collapse navbar-collapse justify-content-end">
          <ul className="navbar-nav">
            <li className="nav-item mr-5">
              <div className="active">
                <Link className="nav-link nav-links" to="/">Home</Link>
              </div>
            </li>
            <li className="nav-item mr-5">
              <Link className="nav-link nav-links" to="/login">Login</Link>
            </li>
            <li className="nav-item mr-5">
              <Link className="nav-link nav-links" to="/signup">Register</Link>
            </li>
            <li className="nav-item mr-5">
              <Link className="nav-link nav-links" to="/#contact">Contact Us</Link>
            </li>
            <li className="nav-item mr-5">
              <Link className="nav-link nav-links" to="/privacy-policy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Sidebar */}
      <div id="sidebar" className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <img src="/Image/Group 91.png" alt="Tap Time Logo" className="app_logo" />
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/signup">Register</Link>
        <Link to="/#contact">Contact Us</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
      </div>
    </>
  );
};

export default Navigation;