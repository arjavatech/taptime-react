import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

const ContactUs = () => {
  // Form fields
  const [cname, setCname] = useState("");
  const [cemail, setCemail] = useState("");
  const [question, setQuestion] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Error messages
  const [errorName, setErrorName] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorTextarea, setErrorTextarea] = useState("");
  const [errorPhone, setErrorPhone] = useState("");

  // Loading and response states
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);

  useEffect(() => {
    setGlobalLoading(false);
  }, []);

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



  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous messages
    setSubmitSuccess("");
    setSubmitError("");

    // Validate all fields
    const isNameValid = validCName();
    const isEmailValid = validCEmail();
    const isValidMessage = validCQueries();

    // Check required fields (name, email, question)
    const isRequiredFieldsValid =
      cname.trim() !== "" && cemail.trim() !== "" && question.trim() !== "";

    if (
      isNameValid &&
      isEmailValid &&
      isValidMessage &&
      isRequiredFieldsValid
    ) {
      setIsSubmitting(true);
      setGlobalLoading(true);
      try {
        await callContactUsCreateAPiData();
        setSubmitSuccess("Message sent successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubmitSuccess("");
        }, 3000);
      } catch (error) {
        console.error("Form submission failed:", error);
        setSubmitError(error.message || "Failed to send message. Please try again.");

        // Clear error message after 3 seconds
        setTimeout(() => {
          setSubmitError("");
        }, 3000);
      } finally {
        setIsSubmitting(false);
        setGlobalLoading(false);
      }
    } else {
      // Trigger validation messages for required fields
      if (cname.trim() === "") setErrorName("Name is required");
      if (cemail.trim() === "") setErrorEmail("Email is required");
      if (question.trim() === "") setErrorTextarea("Message is required");
    }
  };

  // API call
  const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev').replace(/\/$/, '');
  const callContactUsCreateAPiData = async () => {
    const apiLink = `${API_BASE}/contact-us/create`;
    const requestID = uuidv4();
    const cid = localStorage.getItem("companyID") || "";

    const userData = {
      request_id: requestID,
      c_id: cid,
      name: cname,
      requestor_email: cemail,
      concerns_questions: question,
      phone_number: phoneNumber,
      status: "pending",
      last_modified_by: "Admin",
      is_active: true
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
      <Header isAuthenticated={true} />

      {/* Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
      )}

      <section className="flex-grow bg-gray-50 px-4 sm:px-6 pt-25 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
              Contact Us
            </h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-600 max-w-2xl lg:max-w-3xl mx-auto px-4">
              Get in touch with our team. We're here to help and answer any questions you might have.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 h-full">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Get in Touch
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#02066F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Email</h3>
                      <a href="mailto:contact@tap-time.com" className="text-xs sm:text-sm lg:text-base text-[#02066F] hover:underline break-all">
                        contact@tap-time.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#02066F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Phone</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600">+1 (425) 999-9719</p>
                    </div>
                  </div>

                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#02066F] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Office</h3>
                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                        123 Business Ave, Suite 100<br />New York, NY 10001
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  Send Message
                </h2>

                <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label htmlFor="cname" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="cname"
                        value={cname}
                        onChange={(e) => setCname(e.target.value)}
                        onBlur={validCName}
                        placeholder="Enter your name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors"
                        required
                      />
                      {errorName && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">{errorName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="cemail" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="cemail"
                        value={cemail}
                        onChange={(e) => setCemail(e.target.value)}
                        onBlur={validCEmail}
                        placeholder="Enter your email"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors"
                        required
                      />
                      {errorEmail && (
                        <p className="text-red-500 text-xs sm:text-sm mt-1">{errorEmail}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Phone Number (Optional)
                    </label>
                    <PhoneInput
                      defaultCountry="us"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      
                     
                      inputClassName="w-full"
                      style={{
                        '--react-international-phone-border-radius': '0.5rem',
                        '--react-international-phone-border-color': '#d1d5db',
                        '--react-international-phone-background-color': '#ffffff',
                        '--react-international-phone-text-color': '#000000',
                        '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                        '--react-international-phone-height': window.innerWidth < 640 ? '2.5rem' : '3rem',
                        '--react-international-phone-font-size': window.innerWidth < 640 ? '0.875rem' : '1rem'
                      }}
                    />

                  </div>

                  <div>
                    <label htmlFor="question" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Message *
                    </label>
                    <textarea
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onBlur={validCQueries}
                      placeholder="How can we help you?"
                      rows={window.innerWidth < 640 ? "4" : "5"}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors resize-none"
                      required
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-1 sm:gap-0">
                      {errorTextarea ? (
                        <p className="text-red-500 text-xs sm:text-sm">{errorTextarea}</p>
                      ) : (
                        <span></span>
                      )}
                      <span className="text-xs sm:text-sm text-gray-500">
                        {question.length}/{maxMessageLength}
                      </span>
                    </div>
                  </div>

                  {submitSuccess && (
                    <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-green-600">{submitSuccess}</p>
                    </div>
                  )}
                  {submitError && (
                    <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-red-600">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#02066F] text-white py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg font-medium hover:bg-[#030974] focus:ring-2 focus:ring-[#02066F] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        <span className="text-sm sm:text-base">Sending...</span>
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base">Send Message</span>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>



      <Footer variant="authenticated" />
    </div>
  );
};

export default ContactUs;