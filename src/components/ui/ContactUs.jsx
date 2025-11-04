import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Header2 from "./Navbar/Header";
import Footer2 from "./Footer/Footer";

const ContactUs = () => {
  // Form fields
  const [cname, setCname] = useState("");
  const [cemail, setCemail] = useState("");
  const [question, setQuestion] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);

  // Error messages
  const [errorName, setErrorName] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorTextarea, setErrorTextarea] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Regular expressions
  const isAlpha = /^[a-zA-Z\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
  const maxMessageLength = 500;

  // Field validations
  const validCName = () => {
    if (cname.trim() === "") {
      setErrorName("");
      return false;
    } else if (!isAlpha.test(cname)) {
      setErrorName("Only use letters, don't use digits");
      return false;
    } else {
      setErrorName("");
      return true;
    }
  };

  const validCEmail = () => {
    if (cemail.trim() === "") {
      setErrorEmail("");
      return false;
    } else if (!emailRegex.test(cemail)) {
      setErrorEmail("Please enter a valid email address");
      return false;
    } else {
      setErrorEmail("");
      return true;
    }
  };

  const validCQueries = () => {
    if (question.trim() === "") {
      setErrorTextarea("");
      return false;
    } else if (question.length >= maxMessageLength) {
      setErrorTextarea(`Maximum ${maxMessageLength} characters allowed`);
      setQuestion(question.substring(0, maxMessageLength));
      return false;
    } else {
      setErrorTextarea("");
      return true;
    }
  };

  const formatPhoneNumber = (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 3 && value.length <= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(
        6,
        10
      )}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }

    setPhoneNumber(value);
  };

  const validatePhoneNumber = () => {
    if (phoneNumber.trim() === "") {
      setErrorPhone("");
      return false;
    } else if (!phoneRegex.test(phoneNumber)) {
      setErrorPhone("Please use format: (123) 456-7890");
      return false;
    } else {
      setErrorPhone("");
      return true;
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validCName();
    const isEmailValid = validCEmail();
    const isValidMessage = validCQueries();
    const isPhoneNumberValid = validatePhoneNumber();

    // Check required fields (name, email, question)
    const isRequiredFieldsValid =
      cname.trim() !== "" && cemail.trim() !== "" && question.trim() !== "";

    if (
      isNameValid &&
      isEmailValid &&
      isValidMessage &&
      isPhoneNumberValid &&
      isRequiredFieldsValid
    ) {
      setShowOverlay(true);
      try {
        await callContactUsCreateAPiData();
        setShowSuccessModal(true);

        // Hide modal after 5 seconds
        setTimeout(() => {
          setShowOverlay(false);
          setShowSuccessModal(false);
        }, 5000);
      } catch (error) {
        console.error("Form submission failed:", error);
      }
    } else {
      // Trigger validation messages for required fields
      if (cname.trim() === "") setErrorName("Name is required");
      if (cemail.trim() === "") setErrorEmail("Email is required");
      if (question.trim() === "") setErrorTextarea("Message is required");
    }
  };

  // API call
  const callContactUsCreateAPiData = async () => {
    const apiLink = `http://0.0.0.0:8000/contact-us/create`;
    const requestID = uuidv4();
    const cid = localStorage.getItem("companyID") || "";

    const userData = {
      RequestID: requestID,
      CID: cid,
      Name: cname,
      RequestorEmail: cemail,
      ConcernsQuestions: question,
      PhoneNumber: phoneNumber,
      Status: "pending",
      LastModifiedBy: "Admin",
    };

    const response = await fetch(apiLink, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Reset form only after successful submission
    setCname("");
    setCemail("");
    setQuestion("");
    setPhoneNumber("");
  };

  return (
    <div className="min-h-screen flex flex-col">
    <Header2/>

      {/* Loading Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
        </div>
      )}

      <section className="flex-grow bg-gray-100 px-6 pt-28 pb-12">
        <div className="max-w-md mx-auto bg-gray-50 rounded-lg shadow-xl overflow-hidden p-6 px-10">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Contact Us
          </h3>

          <form id="emp_form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <input
                type="text"
                id="cname"
                value={cname}
                onChange={(e) => setCname(e.target.value)}
                onBlur={validCName}
                placeholder="Name"
                className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg font-bold focus:outline-none bg-white"
                required
              />
              {errorName && (
                <p className="text-red-500 text-sm mt-1">{errorName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                id="cemail"
                value={cemail}
                onChange={(e) => setCemail(e.target.value)}
                onBlur={validCEmail}
                placeholder="Email"
                className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg font-bold focus:outline-none bg-white"
                required
              />
              {errorEmail && (
                <p className="text-red-500 text-sm mt-1">{errorEmail}</p>
              )}
            </div>

            {/* Message */}
            <div>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onBlur={validCQueries}
                placeholder="Message"
                className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg font-bold focus:outline-none bg-white min-h-[90px]"
                required
              />
              {errorTextarea && (
                <p className="text-red-500 text-sm mt-1">{errorTextarea}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={formatPhoneNumber}
                onBlur={validatePhoneNumber}
                placeholder="Phone Number"
                className="w-full px-4 py-3 border-2 border-[#02066F] rounded-lg font-bold focus:outline-none bg-white"
                required
              />
              {errorPhone && (
                <p className="text-red-500 text-sm mt-1">{errorPhone}</p>
              )}
            </div>

            {/* Email Link */}
            <div className="flex flex-col md:flex md:flex-row items-center justify-center text-sm sm:text-base gap-2">
              <span className="font-bold text-gray-800 mr-2">
                Write to us at : <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contact@tap-time.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                > contact@tap-time.com
                </a>
              </span>
            </div>

            {/* Submit Button */}
            <div className="pb-4 text-center">
              <button
                type="submit"
                className="w-auto bg-[#02066F] text-white py-3 px-8 rounded-md font-bold cursor-pointer transition duration-200"
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="bg-white rounded-sm shadow-xl w-full max-w-sm sm:max-w-lg mx-auto my-6 sm:my-12">
              {/* Header */}
              <div className="bg-[#02066F] text-white py-4 px-4 sm:px-6 rounded-t-sm text-center">
                <h5 className="text-lg sm:text-xl font-semibold">
                  Thank You for Contacting Us!
                </h5>
              </div>

              {/* Body */}
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
      </section>

      <Footer2/>
    </div>
  );
};

export default ContactUs;
