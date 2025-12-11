import React, { useState } from "react";
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

  const validatePhoneNumber = () => {
    if (phoneNumber.trim() === "") {
      setErrorPhone("");
      return false;
    } else {
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 10) {
        setErrorPhone("Invalid phone number format");
        return false;
      }
      setErrorPhone("");
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
      setIsSubmitting(true);
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
    const apiLink = `https://postgresql-restless-waterfall-2105.fly.dev/contact-us/create`;
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

      <section className="flex-grow bg-gray-50 px-4 sm:px-6 pt-25 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get in touch with our team. We're here to help and answer any questions you might have.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="flex center">
              <div className="bg-white rounded-lg shadow-sm border p-8 flex-1 flex flex-col">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Get in Touch</h2>

                <div className="space-y-6 flex-grow">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#02066F] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <a href="mailto:contact@tap-time.com" className="text-[#02066F] hover:underline">
                        contact@tap-time.com
                      </a>
                    </div>
                  </div>


                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#02066F] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Phone</h3>
                      <p className="text-gray-600">+1 (425) 999-9719</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#02066F] rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Office</h3>
                      <p className="text-gray-600">123 Business Ave, Suite 100<br />New York, NY 10001</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="flex">
              <div className="bg-white rounded-lg shadow-sm border p-8 flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send Message</h2>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="cname" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="cname"
                        value={cname}
                        onChange={(e) => setCname(e.target.value)}
                        onBlur={validCName}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors"
                        required
                      />
                      {errorName && (
                        <p className="text-red-500 text-sm mt-1">{errorName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="cemail" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="cemail"
                        value={cemail}
                        onChange={(e) => setCemail(e.target.value)}
                        onBlur={validCEmail}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors"
                        required
                      />
                      {errorEmail && (
                        <p className="text-red-500 text-sm mt-1">{errorEmail}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <PhoneInput
                      defaultCountry="us"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      onBlur={validatePhoneNumber}
                      forceDialCode={true}
                      className={errorPhone ? 'phone-input-error' : ''}
                      inputClassName="w-full"
                      style={{
                        '--react-international-phone-border-radius': '0.5rem',
                        '--react-international-phone-border-color': errorPhone ? '#ef4444' : '#d1d5db',
                        '--react-international-phone-background-color': '#ffffff',
                        '--react-international-phone-text-color': '#000000',
                        '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                        '--react-international-phone-height': '3rem'
                      }}
                    />
                    {errorPhone && (
                      <p className="text-red-500 text-sm mt-1">{errorPhone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="question"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onBlur={validCQueries}
                      placeholder="How can we help you?"
                      rows="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#02066F] focus:border-[#02066F] transition-colors resize-none"
                      required
                    />
                    <div className="flex justify-between items-center mt-2">
                      {errorTextarea ? (
                        <p className="text-red-500 text-sm">{errorTextarea}</p>
                      ) : (
                        <span></span>
                      )}
                      <span className="text-sm text-gray-500">
                        {question.length}/{maxMessageLength}
                      </span>
                    </div>
                  </div>

                  {submitSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-600">{submitSuccess}</p>
                    </div>
                  )}
                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#02066F] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#030974] focus:ring-2 focus:ring-[#02066F] focus:ring-offset-2 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Sending...
                      </div>
                    ) : (
                      'Send Message'
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