import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer-fluid">
      <div className="container py-5">
        <div className="row">
          {/* Footer Column 1: Logo and Social Links */}
          <div className="col-12 col-md-4 mb-4">
            <div className="text-center text-md-left">
              <img 
                src="/web_Image/footer_logo.png" 
                alt="Logo" 
                className="footer-logo-img mb-3"
              />
              <p className="font-weight-bold mb-5">
                Powered by <br /> Arjava Technology
              </p>
              <div className="social-icons mb-3">
                <a 
                  href="https://www.facebook.com/profile.php?id=61565587366048"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.target.style.boxShadow = '0 0 10px white'}
                  onMouseOut={(e) => e.target.style.boxShadow = 'none'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="mx-2"
                >
                  <i className="fa-brands fa-facebook"></i>
                </a>
                <a 
                  href="https://www.instagram.com/_tap_time"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.target.style.boxShadow = '0 0 10px white'}
                  onMouseOut={(e) => e.target.style.boxShadow = 'none'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="mx-2"
                >
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a 
                  href="https://www.linkedin.com/company/arjavatech/"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.target.style.boxShadow = '0 0 10px white'}
                  onMouseOut={(e) => e.target.style.boxShadow = 'none'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                  className="mx-2"
                >
                  <i className="fa-brands fa-linkedin"></i>
                </a>
                <a 
                  href="https://x.com/_Tap_Time"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.target.style.boxShadow = '0 0 10px white'}
                  onMouseOut={(e) => e.target.style.boxShadow = 'none'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Twitter"
                  className="mx-2"
                >
                  <i className="fa-brands fa-twitter"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Column 2: Quick Links */}
          <div className="col-12 col-md-4 mb-4">
            <h6 className="text-uppercase font-weight-bold mb-4 text-center text-md-left">
              Quick Explore
            </h6>
            <ul className="list-unstyled text-center text-md-left">
              <li><a href="#home" className="quick-explore">Home</a></li>
              <li><a href="#login" className="quick-explore">Login</a></li>
              <li><a href="#register" className="quick-explore">Register</a></li>
              <li><a href="#contact" className="quick-explore">Contact Us</a></li>
              <li><a href="#privacy" className="quick-explore">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Footer Column 3: Contact Information */}
          <div className="col-12 col-md-4">
            <h6 className="text-uppercase font-weight-bold mb-4 text-center text-md-left">
              Contact Information
            </h6>
            <div className="d-flex align-items-center mb-3">
              <MapPin className="mr-2" size={16} />
              <address className="mb-0">
                Arjava Technologies,<br />
                2135 204th PL NE,<br />
                Sammamish,<br />
                WA - 98074.
              </address>
            </div>
            <div className="d-flex align-items-center mb-3">
              <Phone className="mr-2" size={16} />
              <a href="tel:+15413712950" className="text-white">
                (541) 371-2950
              </a>
            </div>
            <div className="d-flex align-items-center">
              <Mail className="mr-2" size={16} />
              <a href="mailto:contact@tap-time.com" className="text-white">
                contact@tap-time.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;