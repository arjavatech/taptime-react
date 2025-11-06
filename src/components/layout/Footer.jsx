import React from "react";

const Footer = ({ variant = "default" }) => {
  const socialLinks = [
    { href: "https://www.facebook.com/profile.php?id=61565587366048", src: "/images/facebook.png", alt: "Facebook" },
    { href: "https://www.instagram.com/_tap_time", src: "/images/instagram.png", alt: "Instagram" },
    { href: "https://www.linkedin.com/company/arjavatech/", src: "/images/linkedin.png", alt: "LinkedIn" },
    { href: "https://x.com/_Tap_Time", src: "/images/twitter.png", alt: "X" }
  ];

  const quickLinks = variant === "authenticated" ? [
    { href: "/device", text: "Device" },
    { href: "/employee-management", text: "Employee Management" },
    { href: "/reportsummary", text: "Report Summary" },
    { href: "/reportsetting", text: "Report Settings" },
    { href: "/profile", text: "Profile" },
    { href: "/contact", text: "Contact Us" }
  ] : [
    { href: "/", text: "Home" },
    { href: "/login", text: "Login" },
    { href: "/register", text: "Register" },
    { href: "#contact", text: "Contact Us" },
    { href: "/privacypolicy", text: "Privacy Policy" }
  ];

  const contactInfo = [
    { 
      href: "https://maps.google.com/?q=2135+204th+PL+NE,+Sammamish,+WA+98074", 
      src: "/images/location-pin.png", 
      alt: "Location", 
      text: "Arjava Technologies,\n2135 204th PL NE,\nSammamish,\nWA - 98074.", 
      className: "w-5 mt-1" 
    },
    { 
      href: "tel:+14258181900", 
      src: "/images/phone-call.png", 
      alt: "Phone", 
      text: "(541) 371-2950", 
      className: "w-4 h-4" 
    },
    { 
      href: "https://mail.google.com/mail/?view=cm&fs=1&to=contact@tap-time.com", 
      src: "/images/paper-plane.png", 
      alt: "Email", 
      text: "contact@tap-time.com", 
      className: "w-4 h-4" 
    }
  ];

  return (
    <footer className="bg-[#02066F] text-white w-full pt-10 mt-4 pb-18 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row flex-wrap justify-evenly items-start gap-12 text-center md:text-left">
        {/* Logo & Social */}
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <img src="/images/icode-logo-white.png" alt="Tap Time Logo" className="w-24 sm:w-28 md:w-30 pb-2" />
          <p className="text-center md:text-left text-sm sm:text-base mt-4 font-bold text-lg">
            Powered by<br />Arjava Technologies
          </p>
          <div className="flex mt-5 gap-6 items-center justify-center md:justify-start flex-wrap">
            {socialLinks.map((link, i) => (
              <a key={i} href={link.href}>
                <img 
                  src={link.src} 
                  alt={link.alt} 
                  className="w-5 sm:w-6 rounded-full inline-block transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_white]" 
                />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links w-50 md:w-auto text-left" style={{ alignSelf: "center", justifySelf: "center", paddingLeft: "25px" }}>
          <h4 className="text-lg sm:text-[16px] font-bold mb-6">
            {variant === "authenticated" ? "QUICK EXPLORE" : "QUICK LINKS"}
          </h4>
          <ul className="list-none space-y-2 text-sm sm:text-base">
            {quickLinks.map((link, i) => (
              <li key={i}>
                <a
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="address text-sm sm:text-base w-full md:w-auto text-center md:text-left">
          <h4 className="text-lg sm:text-[16px] font-semibold mb-4">CONTACT INFORMATION</h4>
          {contactInfo.map((info, i) => (
            <a 
              key={i} 
              href={info.href} 
              target={i === 0 ? "_blank" : undefined} 
              rel={i === 0 ? "noopener noreferrer" : undefined} 
              className="hover:underline text-white"
            >
              <div className={`flex flex-col sm:flex-row items-center justify-center md:justify-start ${i < contactInfo.length - 1 ? 'mb-3' : ''} gap-2`}>
                <img src={info.src} alt={info.alt} className={info.className} />
                {info.text.split('\n').map((line, j) => (
                  <React.Fragment key={j}>
                    {line}
                    {j < info.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;