import React, { useState, useRef, useEffect } from "react";
import Header from "./Navbar/Header";
import Footer from "./Footer/Footer";

const HomePage = () => {
  // State variables
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [show, setShow] = useState(false);

  // Error states
  const [errorFName, setErrorFName] = useState("");
  const [errorLName, setErrorLName] = useState("");
  const [errorPhone, setErrorPhone] = useState("");
  const [errorZip, setErrorZip] = useState("");

  // Refs to access form input values
  const firstNameInput = useRef(null);
  const lastNameInput = useRef(null);
  const emailInput = useRef(null);
  const subjectInput = useRef(null);
  const phoneInput = useRef(null);
  const streetInput = useRef(null);
  const cityInput = useRef(null);
  const stateInput = useRef(null);
  const zipInput = useRef(null);
  const messageInput = useRef(null);

  // Regular expressions
  const isAlpha = /^[a-zA-Z\s]+$/;
  const zipPattern = /^\d{5}(?:[-\s]\d{4})?$/;
  const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;

  // Features data
  const features = [
    {
      icon: "Mask group.png",
      title: "Facial Recognition",
      desc: "Snap photo to log hours instantly.",
    },
    {
      icon: "Mask group-1.png",
      title: "Clock In/Out",
      desc: "Seamless one-tap login and logout solution with employee identifications.",
    },
    {
      icon: "Mask group-2.png",
      title: "Timesheet Reports",
      desc: "Provides employee time reports at your preferred frequency.",
    },
    {
      icon: "Mask group-3.png",
      title: "Admin Dashboard",
      desc: "Employee onboarding system for Admins.",
    },
    {
      icon: "Mask group-4.png",
      title: "Export Options",
      desc: "Delivers time reports in multiple formats like CSV and PDF.",
    },
    {
      icon: "Mask group-5.png",
      title: "Validation",
      desc: "Admin features to update time entries.",
    },
  ];

  // Validate names
  const validateName = (value, isFirstName) => {
    if (value.trim() === "") {
      if (isFirstName) setErrorFName("");
      else setErrorLName("");
      return false;
    } else if (!isAlpha.test(value)) {
      if (isFirstName) setErrorFName("Only use letters, don't use digits");
      else setErrorLName("Only use letters, don't use digits");
      return false;
    } else {
      if (isFirstName) setErrorFName("");
      else setErrorLName("");
      return true;
    }
  };

  // Validate zip code
  const validateZip = () => {
    const regex = /^\d{5}(-\d{4})?$/;
    const valid = regex.test(zip);
    setIsValid(valid);
    if (!valid && zip.trim() !== "") {
      setErrorZip("Invalid ZIP Code");
    } else {
      setErrorZip("");
    }
  };

  // Format and validate phone number
  const formatPhoneNumber = (event) => {
    const value = event.target.value.replace(/\D/g, "");
    let formattedValue = value;

    if (value.length > 3 && value.length <= 6) {
      formattedValue = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 6) {
      formattedValue = `(${value.slice(0, 3)}) ${value.slice(
        3,
        6
      )}-${value.slice(6, 10)}`;
    } else if (value.length > 3) {
      formattedValue = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }

    setPhone(formattedValue);
    validatePhoneNumber(formattedValue);
  };

  // Validate phone number format
  const validatePhoneNumber = (value = phone) => {
    if (value === "") {
      setErrorPhone("");
      return false;
    } else if (!phoneRegex.test(value)) {
      setErrorPhone("Invalid phone number format");
      return false;
    } else {
      setErrorPhone("");
      return true;
    }
  };

  const validateForm = async (event) => {
    event.preventDefault();

    // Validate all fields
    const isFirstNameValid = validateName(firstNameInput.current.value, true);
    const isLastNameValid = validateName(lastNameInput.current.value, false);
    const isZipValid = isValid || zip.trim() === "";
    const isPhoneValid = validatePhoneNumber();

    // Check required fields
    const isRequiredFieldsValid =
      firstNameInput.current.value.trim() !== "" &&
      lastNameInput.current.value.trim() !== "" &&
      emailInput.current.value.trim() !== "" &&
      phoneInput.current.value.trim() !== "" &&
      streetInput.current.value.trim() !== "" &&
      cityInput.current.value.trim() !== "" &&
      stateInput.current.value.trim() !== "" &&
      zipInput.current.value.trim() !== "" &&
      messageInput.current.value.trim() !== "";

    if (
      isFirstNameValid &&
      isLastNameValid &&
      isZipValid &&
      isPhoneValid &&
      isRequiredFieldsValid
    ) {
      setShowOverlay(true);

      const userData = {
        FirstName: firstNameInput.current.value,
        LastName: lastNameInput.current.value,
        Email: emailInput.current.value,
        WhatsappNumber: null,
        Subject: subjectInput.current.value,
        PhoneNumber: phoneInput.current.value,
        Address: `${streetInput.current.value}--${cityInput.current.value}--${stateInput.current.value}--${zipInput.current.value}`,
        Message: messageInput.current.value,
        LastModifiedBy: "Admin",
      };

      try {
        const apiLink = `https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/web_contact_us/create`;

        const response = await fetch(apiLink, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.error) {
          setShow(true);
          event.target.reset();
          setPhone("");
          setZip("");
          setTimeout(() => {
            setShow(false);
          }, 5000);
        }
      } catch (error) {
        event.target.reset();
        alert("Something went wrong. Please try again.");
        console.error(error);
      } finally {
        setShowOverlay(false);
      }
    } else {
      // Show errors for required fields
      if (firstNameInput.current.value.trim() === "")
        setErrorFName("First name is required");
      if (lastNameInput.current.value.trim() === "")
        setErrorLName("Last name is required");
      if (phoneInput.current.value.trim() === "")
        setErrorPhone("Phone number is required");
      if (zipInput.current.value.trim() === "")
        setErrorZip("ZIP code is required");
    }
  };

  const onClose = () => {
    setShow(false);
  };

  const handleBackgroundClick = (event) => {
    const modalContent = document.getElementById("modal-content");
    if (modalContent && !modalContent.contains(event.target)) {
      onClose();
    }
  };

  // Effect to validate zip when it changes
  useEffect(() => {
    validateZip();
  }, [zip]);

  return (
    <>
    <Header/>

    
      {/* Loading Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
        </div>
      )}

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 pt-24 text-center">
        <h2 className="text-3xl font-bold text-[#02066F] mb-3">
          Employee Time Tracking
        </h2>
        <p className="text-[16px]">
          One tap solution for simplifying and streamlining employee time
          logging and reporting.
        </p>
      </section>

      {/* Features Section */}
      <section
        id="whatWeProvide"
        className="flex flex-col lg:flex-row p-4 pt-10 gap-12 items-center"
      >
        <img
          src="/src/Public/tap-time-logo.png"
          alt="Main Feature"
          className="w-full lg:w-1/2 shadow-md"
        />

        <div className="space-y-8 w-full lg:w-1/2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-6 sm:gap-8">
              <img
                src={`/src/Public/${feature.icon}`}
                alt={feature.title}
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
              />
              <div className="flex flex-col gap-2">
                <h4 className="text-xl sm:text-2xl font-semibold">
                  {feature.title}
                </h4>
                <p className="text-gray-800 text-base sm:text-lg">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="pt-18">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-gray-900 text-center mb-2">
            Contact
          </h2>

          <form
            onSubmit={validateForm}
            className="bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)] p-6 sm:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  ref={firstNameInput}
                  className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                  required
                />
                {errorFName && (
                  <p className="text-red-500 text-sm mt-1">{errorFName}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  ref={lastNameInput}
                  className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                  required
                />
                {errorLName && (
                  <p className="text-red-500 text-sm mt-1">{errorLName}</p>
                )}
              </div>

              <input
                type="email"
                placeholder="Email"
                ref={emailInput}
                className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                required
              />

              <div>
                <input
                  type="text"
                  value={phone}
                  placeholder="Phone"
                  ref={phoneInput}
                  onChange={formatPhoneNumber}
                  className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                  required
                />
                {errorPhone && (
                  <p className="text-red-500 text-sm mt-1">{errorPhone}</p>
                )}
              </div>

              <input
                type="text"
                placeholder="Address Line 1"
                ref={streetInput}
                className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                required
              />

              <input
                type="text"
                placeholder="City"
                ref={cityInput}
                className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                required
              />

              <div>
                <input
                  type="text"
                  placeholder="Zip"
                  value={zip}
                  ref={zipInput}
                  onChange={(e) => setZip(e.target.value)}
                  className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                  required
                />
                {errorZip && (
                  <p className="text-red-500 text-sm mt-1">{errorZip}</p>
                )}
              </div>

              <input
                type="text"
                placeholder="State"
                ref={stateInput}
                className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Subject"
              ref={subjectInput}
              className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold text-center focus:outline-none"
              required
            />

            <textarea
              placeholder="Message..."
              rows="4"
              ref={messageInput}
              className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold resize-none text-center focus:outline-none"
              required
            ></textarea>

            <button
              type="submit"
              className="w-full bg-[#02066F] text-lg cursor-pointer text-white font-semibold py-4 rounded-[10px] transition-colors"
            >
              Submit
            </button>
          </form>

          {show && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
              onClick={handleBackgroundClick}
            >
              <div
                id="modal-content"
                className="bg-white rounded-sm shadow-xl w-full max-w-sm sm:max-w-lg mx-auto my-6 sm:my-12"
              >
                <div className="bg-[#02066F] text-white py-4 px-4 sm:px-6 rounded-t-sm text-center">
                  <h5 className="text-lg sm:text-xl font-semibold">
                    Thank You for Contacting Us!
                  </h5>
                </div>
                <div className="p-4 sm:p-6 text-center">
                  <p className="font-bold mb-4 text-base sm:text-xl">
                    We have received your message and will get back to you
                    shortly.
                  </p>

                  {/* Image */}
                  <div className="flex justify-center">
                    <img
                      src="https://www.shutterstock.com/image-vector/blue-check-mark-icon-tick-260nw-787016416.jpg"
                      alt="Checkmark"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;
