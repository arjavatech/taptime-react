import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#02066F] text-white w-full pt-10 mt-4 pb-18 sm:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row flex-wrap justify-evenly items-start gap-12 text-center md:text-left">
        {/* Logo & Social */}
        <div className="flex flex-col items-center md:items-start w-full md:w-auto">
          <div className="flex items-center justify-center md:justify-start">
            <img
              src="/images/icode-logo-white.png"
              alt="Tap Time Logo"
              className="w-24 sm:w-28 md:w-30 pb-2"
            />
          </div>
          <p className="text-center md:text-left text-sm sm:text-base mt-4 font-bold text-lg">
            Powered by
            <br />
            Arjava Technologies
          </p>

          <div className="flex mt-5 gap-6 items-center justify-center md:justify-start flex-wrap">
            <a href="https://www.facebook.com/profile.php?id=61565587366048">
              <img
                src="/images/facebook.png"
                alt="Facebook"
                className="w-5 sm:w-6 rounded-full inline-block transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_white]"
              />
            </a>
            <a href="https://www.instagram.com/_tap_time">
              <img
                src="/images/instagram.png"
                alt="Instagram"
                className="w-5 sm:w-6 inline-block transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_white]"
              />
            </a>
            <a href="https://www.linkedin.com/company/arjavatech/">
              <img
                src="/images/linkedin.png"
                alt="LinkedIn"
                className="w-5 sm:w-6 inline-block transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_white]"
              />
            </a>
            <a href="https://x.com/_Tap_Time">
              <img
                src="/images/twitter.png"
                alt="X"
                className="w-5 sm:w-6 inline-block transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_white]"
              />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div
          className="quick-links w-50 md:w-auto text-left "
          style={{
            alignSelf: "center",
            justifySelf: "center",
            paddingLeft: "25px",
          }}
        >
          <h4 className="text-lg sm:text-[16px] font-bold mb-6">
            QUICK EXPLORE
          </h4>
          <ul className="list-none space-y-2 text-sm sm:text-base">
            <li>
              <a
                href="/"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/login"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Login
              </a>
            </li>
            <li>
              <a
                href="register"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Register
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Contact Us
              </a>
            </li>
            <li>
              <a
                href="privacypolicy"
                className="hover:text-blue-400 transition-colors duration-200"
              >
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Address */}
        <div className="address text-sm sm:text-base w-full md:w-auto text-center md:text-left">
          <h4 className="text-lg sm:text-[16px] font-semibold mb-4">
            CONTACT INFORMATION
          </h4>

          <a
            href="https://maps.google.com/?q=2135+204th+PL+NE,+Sammamish,+WA+98074"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-white"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start mb-3 gap-2">
              <img
                src="/images/location-pin.png"
                alt="Location"
                className="w-5 mt-1"
              />
              Arjava Technologies,
              <br />
              2135 204th PL NE,
              <br />
              Sammamish,
              <br />
              WA - 98074.
            </div>
          </a>

          <a href="tel:+14258181900" className="hover:underline text-white">
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start mb-2 gap-2">
              <img
                src="/images/phone-call.png"
                alt="Phone"
                className="w-4 h-4"
              />
              (541) 371-2950
            </div>
          </a>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@tap-time.com"
            className="hover:underline text-white"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2">
              <img
                src="/images/paper-plane.png"
                alt="Email"
                className="w-4 h-4"
              />
              contact@tap-time.com
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
