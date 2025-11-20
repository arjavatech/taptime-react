import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"
import icodeLogoWhite from "../../assets/images/icode-logo-white.png"
import facebookIcon from "../../assets/images/facebook.png"
import twitterIcon from "../../assets/images/twitter.png"
import linkedinIcon from "../../assets/images/linkedin.png"
import instagramIcon from "../../assets/images/instagram.png"
import PrivacyPolicyModal from "../PrivacyPolicyModal"

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const checkAuthStatus = () => {
      const adminMail = localStorage.getItem("adminMail")
      setIsAuthenticated(!!adminMail)
    }
    
    checkAuthStatus()
  }, [location])

  // Before Login (Public Navigation)
  const publicLinks = [
    { href: "/", text: "Home" },
    { href: "/login", text: "Login" },
    { href: "/register", text: "Register" },
    { href: "#contact", text: "Contact Us" },
    { action: () => setShowPrivacyModal(true), text: "Privacy Policy" }
  ]

  // After Login (Authenticated Navigation)
  const authenticatedLinks = [
    { href: "/device", text: "Device" },
    { href: "/employee-management", text: "Employee Management" },
    { href: "/reportsummary", text: "Report Summary" },
    { href: "/reportsetting", text: "Report Settings" },
    { href: "/profile", text: "Profile" },
    { href: "/contact", text: "Contact Us" }
  ]

  const quickLinks = isAuthenticated ? authenticatedLinks : publicLinks

  const socialLinks = [
    { href: "https://www.facebook.com/profile.php?id=61565587366048", src: facebookIcon, alt: "Facebook" },
    { href: "https://x.com/_Tap_Time", src: twitterIcon, alt: "Twitter" },
    { href: "https://www.linkedin.com/company/arjavatech/", src: linkedinIcon, alt: "LinkedIn" },
    { href: "https://www.instagram.com/_tap_time", src: instagramIcon, alt: "Instagram" }
  ]

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img src={icodeLogoWhite} alt="Tap Time Logo" className="w-32 h-auto mb-4" />
            </div>
            <p className="text-gray-200 text-base leading-relaxed mb-6 max-w-md">
              Powered by Arjava Technologies - Your trusted partner for innovative employee time tracking solutions that streamline workforce management.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 bg-opacity-10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-20 hover:scale-110 transition-all duration-300 group"
                >
                  <img src={social.src} alt={social.alt} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.text}>
                  {link.action ? (
                    <button
                      onClick={link.action}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.text}
                    </button>
                  ) : link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.text}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm"
                    >
                      {link.text}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-0.5 text-primary-foreground/60" />
                <div className="text-sm text-primary-foreground/80">
                  <p>Arjava Technologies</p>
                  <p>2135 204th PL NE</p>
                  <p>Sammamish, WA 98074</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-foreground/60" />
                <a 
                  href="tel:+15413712950" 
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  (541) 371-2950
                </a>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-foreground/60" />
                <a 
                  href="mailto:contact@tap-time.com" 
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  contact@tap-time.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-primary-foreground/60">
              © {currentYear} TapTime by Arjava Technologies. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Privacy Policy
              </button>
              
            </div>
          </div>
        </div>
      </div>
      
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
    </footer>
  )
}

export default Footer