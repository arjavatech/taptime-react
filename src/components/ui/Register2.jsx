import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { loadStripe } from "@stripe/stripe-js";
import Header from "./Navbar/Header";

const Register2 = () => {
  // Constants
  const isAlpha = /^[a-zA-Z\s]+$/;
  const apiUrlBase =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/customer";
  const firstSignupPageapiUrlBase =
    "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/company";
  const cid = uuidv4();
  const key = new Uint8Array([
    16, 147, 220, 113, 166, 142, 22, 93, 241, 91, 13, 252, 112, 122, 119, 95,
  ]);
  const stripePromise = loadStripe(
    "pk_test_51OB8JlIPoM7JHRT2DlaE8KmPRFkgeSXkqf4eQZxEahu0Lbno3vHzCTH5J4rDAfw53PjdWlLteNJNzPVdahkzTb8100DA6sqAp4"
  );

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [customerStreet, setCustomerStreet] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerZip, setCustomerZip] = useState("");

  // Error messages
  const [errorFirstName, setErrorFirstName] = useState("");
  const [errorLastName, setErrorLastName] = useState("");
  const [errorPhone, setErrorPhone] = useState("");
  const [errorStreet, setErrorStreet] = useState("");
  const [errorCity, setErrorCity] = useState("");
  const [errorState, setErrorState] = useState("");
  const [errorZip, setErrorZip] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [totalError, setTotalError] = useState("");

  // UI states
  const [showOverlay, setShowOverlay] = useState(false);
  const itiRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Error map for phone validation
  const errorMap = {
    "-99": "Invalid number",
    "-2": "Invalid country code",
    "-1": "Invalid number",
    0: "Invalid number",
    1: "Invalid number length",
    2: "Invalid number",
  };

  // Validation functions
  const validateFirstName = () => {
    if (firstName.trim() === "") {
      setErrorFirstName("");
      return false;
    } else if (!isAlpha.test(firstName)) {
      setErrorFirstName("Only use letters and spaces");
      return false;
    }
    setErrorFirstName("");
    return true;
  };

  const validateLastName = () => {
    if (lastName.trim() === "") {
      setErrorLastName("");
      return false;
    } else if (!isAlpha.test(lastName)) {
      setErrorLastName("Only use letters and spaces");
      return false;
    }
    setErrorLastName("");
    return true;
  };

  const validateEmail = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() === "") {
      setErrorEmail("");
      return false;
    } else if (!emailPattern.test(email)) {
      setErrorEmail("Invalid email format");
      return false;
    }
    setErrorEmail("");
    return true;
  };

  const validateAddress = () => {
    let isValid = true;

    if (customerStreet.trim() === "") {
      setErrorStreet("Street is required");
      isValid = false;
    } else {
      setErrorStreet("");
    }

    if (customerCity.trim() === "") {
      setErrorCity("City is required");
      isValid = false;
    } else {
      setErrorCity("");
    }

    if (customerState.trim() === "") {
      setErrorState("State is required");
      isValid = false;
    } else {
      setErrorState("");
    }

    if (customerZip.trim() === "") {
      setErrorZip("Zip code is required");
      isValid = false;
    } else {
      setErrorZip("");
    }

    return isValid;
  };

  const validPhoneno = () => {
    const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;

    if (phoneNumber === "") {
      setErrorPhone("");
      return false;
    } else if (!phoneRegex.test(phoneNumber)) {
      setErrorPhone("Invalid phone number.");
      return false;
    } else {
      setErrorPhone("");
      return true;
    }
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits first
    let digits = value.replace(/\D/g, "");
    
    // Get country-specific max length
    let maxLength = 15; // default
    if (itiRef.current) {
      const countryCode = itiRef.current.getSelectedCountryData().iso2;
      switch (countryCode) {
        case 'in': maxLength = 10; break;
        case 'us': case 'ca': maxLength = 10; break;
        case 'gb': maxLength = 11; break;
        case 'au': maxLength = 9; break;
      }
    }
    
    // Restrict to max length
    digits = digits.slice(0, maxLength);
    
    // Format based on country
    if (itiRef.current) {
      const countryCode = itiRef.current.getSelectedCountryData().iso2;
      switch (countryCode) {
        case 'in': // India
          if (digits.length > 5) {
            digits = `${digits.slice(0, 5)} ${digits.slice(5)}`;
          }
          break;
        case 'us': case 'ca': // USA/Canada
          if (digits.length > 6) {
            digits = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
          } else if (digits.length > 3) {
            digits = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
          }
          break;
        case 'gb': // UK
          if (digits.length > 4) {
            digits = `${digits.slice(0, 4)} ${digits.slice(4)}`;
          }
          break;
        case 'au': // Australia
          if (digits.length > 4) {
            digits = `${digits.slice(0, 4)} ${digits.slice(4)}`;
          }
          break;
      }
    }
    
    setPhoneNumber(digits);
  };

  // API functions
  const createCheckoutSession = async () => {
    setShowOverlay(true);
    setTotalError("");

    try {
      const link2 = "http://localhost:5173";
      const link = "https://tap-time.com";
      const link3 = "https://arunkavitha1982.github.io/icode";

      const response = await fetch(
        "https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: link2,
            productName: "EMS Product",
            amount: 2000,
          }),
        }
      );

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error);
      }

      const session = await response.json();

      // Initialize Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setTotalError(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    } finally {
      setShowOverlay(false);
    }
  };

  // Form validation
  const validateForm = async (event) => {
    event.preventDefault();
    setShowOverlay(true);
    setTotalError("");

    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const isPhoneNumberValid = validPhoneno();
    const isAddressValid = validateAddress();
    const isEmailValid = validateEmail();

    if (
      isFirstNameValid &&
      isLastNameValid &&
      isPhoneNumberValid &&
      isAddressValid &&
      isEmailValid
    ) {
      const companyStreet = localStorage.getItem("companyStreet");
      const companyCity = localStorage.getItem("companyCity");
      const companyState = localStorage.getItem("companyState");
      const companyZip = localStorage.getItem("companyZip");

      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      localStorage.setItem(
        "address",
        `${companyStreet}--${companyCity}--${companyState}--${companyZip}`
      );
      localStorage.setItem("phone", phoneNumber);
      localStorage.setItem("email", email);
      let isFreeTrail = localStorage.getItem("trial") === "true";

      if (isFreeTrail) {
        window.location.href = "/login";
        localStorage.setItem(
          "expiryDate",
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        );
      } else {
        await createCheckoutSession();
      }
    } else {
      setTotalError("Please fix the errors");
      setShowOverlay(false);
    }
  };

  useEffect(() => {
    // Initialize phone input
    if (phoneInputRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: "us",
        utilsScript:
          "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
        dropdownContainer: document.body,
      });
      
      // Listen for country change
      phoneInputRef.current.addEventListener('countrychange', () => {
        setPhoneNumber(''); // Clear input when country changes
      });
    }

    // Store encryption key
    localStorage.setItem("key", JSON.stringify(Array.from(key)));

    // Add CSS to make dropdown appear at top
    const style = document.createElement('style');
    style.textContent = `
      .iti__dropdown-content {
        max-height: 200px;
        overflow-x: hidden;
        overflow-y: hidden;
        transform: translateY(-100%) !important;
        top: 0 !important;
        bottom: auto !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
    <Header/>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Section */}
        <div className="hidden md:flex md:w-1/2 bg-blue-100 flex-col justify-center items-center p-5">
          <img
            src="/src/Public/tap-time-logo.png"
            alt="icode-logo"
            className="w-44 xl:w-94 md:w-32 md:pt-2 xl:pt-8"
          />
          <div>
            <h3 className="text-center text-3xl xl:text-3xl md:text-2xl text-gray-800 font-semibold xl:pt-20 md:pt-18">
              Join Us Today
            </h3>
            <p className="text-center text-gray-700 mt-2">
              Create an account to unlock seamless time tracking and boost your
              team's efficiency.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 xl:w-1/2 flex justify-center items-center p-6 pt-10 xl:pt-16 md:pt-16">
          {showOverlay && (
            <div
              className="fixed inset-0 flex justify-center items-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="border-4 border-t-4 border-[#02066F] rounded-full w-10 h-10 animate-spin"></div>
            </div>
          )}

          <form className="w-full pt-14 md:pt-12" onSubmit={validateForm}>
            <h2 className="text-center text-3xl xl:text-3xl md:text-2xl text-gray-800 font-semibold mb-4">
              Signup
            </h2>

            {/* Horizontal line */}
            <hr className="w-full h-4 bg-gray-200 rounded-full border-4 mb-6 border-gray-200" />

            {totalError && (
              <p className="text-red-600 text-sm mb-2">{totalError}</p>
            )}

            {/* First Name */}
            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={validateFirstName}
                placeholder="First Name"
                className="w-full outline-none font-bold p-3 xl:p-5 md:p-3"
                required
              />
            </div>
            {errorFirstName && (
              <p className="text-red-600 text-sm mb-2">{errorFirstName}</p>
            )}

            {/* Last Name */}
            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={validateLastName}
                placeholder="Last Name"
                className="w-full outline-none font-bold p-3 xl:p-5 md:p-3"
                required
              />
            </div>
            {errorLastName && (
              <p className="text-red-600 text-sm mb-2">{errorLastName}</p>
            )}

            {/* Customer Address */}
            <div className="border-2 border-[#02066F] rounded-lg p-2 xl:p-4 md:p-4 mb-4">
              <p className="text-center text-[#02066F] font-bold mb-4">
                Customer Address
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={customerStreet}
                  onChange={(e) => setCustomerStreet(e.target.value)}
                  placeholder="Customer Address Line 1"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="Customer City"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 mt-4 mb-4">
                <input
                  type="text"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  placeholder="Customer State"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={customerZip}
                  onChange={(e) => setCustomerZip(e.target.value)}
                  placeholder="Customer Zip"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="tel"
                ref={phoneInputRef}
                value={phoneNumber}
                onInput={(e) => {
                  const value = e.target.value;
                  const digits = value.replace(/\D/g, "");
                  
                  // Get max length for selected country
                  let maxLength = 10;
                  if (itiRef.current) {
                    const countryCode = itiRef.current.getSelectedCountryData()?.iso2 || 'in';
                    switch (countryCode) {
                      case 'in': maxLength = 10; break;
                      case 'us': case 'ca': maxLength = 10; break;
                      case 'gb': maxLength = 11; break;
                      case 'au': maxLength = 9; break;
                      default: maxLength = 10;
                    }
                  }
                  
                  // Prevent input if exceeds limit
                  if (digits.length > maxLength) {
                    e.target.value = phoneNumber; // Reset to previous value
                    return;
                  }
                  
                  formatPhoneNumber(value);
                }}
                // onBlur={validPhoneno}
                placeholder="Phone Number"
                className="w-full outline-none font-bold p-2 xl:p-5 md:p-3"
                required
              />
            </div>
            {errorPhone && (
              <p className="text-red-600 text-sm mb-2">{errorPhone}</p>
            )}

            {/* Email */}
            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="Email"
                className="w-full outline-none font-bold p-2 xl:p-5 md:p-3"
                required
              />
            </div>
            {errorEmail && (
              <p className="text-red-600 text-sm mb-2">{errorEmail}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#02066F] text-white py-3 rounded-lg text-lg mt-4 cursor-pointer"
            >
              Pay
            </button>
          </form>

          {showOverlay && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="text-white text-xl font-semibold">
                Processing...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Register2;
