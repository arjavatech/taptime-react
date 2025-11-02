import React, { useState, useRef } from "react";
import Header1 from "./Navbar/Header1";
import Footer from "./Footer/Footer";
import { submitContactForm } from "../../utils/apiUtils";

const HomePage = () => {
  const [phone, setPhone] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);

  const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
  const zipRegex = /^\d{5}(-\d{4})?$/;
  const nameRegex = /^[a-zA-Z\s]+$/;

  const features = [
    { icon: "Mask-group.png", title: "Facial Recognition", desc: "Snap photo to log hours instantly." },
    { icon: "Mask group-1.png", title: "Clock In/Out", desc: "Seamless one-tap login and logout solution with employee identifications." },
    { icon: "Mask group-2.png", title: "Timesheet Reports", desc: "Provides employee time reports at your preferred frequency." },
    { icon: "Mask group-3.png", title: "Admin Dashboard", desc: "Employee onboarding system for Admins." },
    { icon: "Mask group-4.png", title: "Export Options", desc: "Delivers time reports in multiple formats like CSV and PDF." },
    { icon: "Mask group-5.png", title: "Validation", desc: "Admin features to update time entries." }
  ];

  const formatPhoneNumber = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) setPhone(value);
    else if (value.length <= 6) setPhone(`(${value.slice(0, 3)}) ${value.slice(3)}`);
    else setPhone(`(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`);
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    if (!value.trim()) {
      newErrors[name] = `${name.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
    } else if ((name === 'firstName' || name === 'lastName') && !nameRegex.test(value)) {
      newErrors[name] = 'Only letters allowed';
    } else if (name === 'phone' && !phoneRegex.test(value)) {
      newErrors[name] = 'Invalid phone format';
    } else if (name === 'zip' && !zipRegex.test(value)) {
      newErrors[name] = 'Invalid ZIP code';
    } else {
      delete newErrors[name];
    }
    
    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const fields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'zip', 'subject', 'message'];
    const isValid = fields.every(field => validateField(field, data[field] || ''));
    
    if (!isValid) return;
    
    setShowOverlay(true);
    try {
      const userData = {
        FirstName: data.firstName,
        LastName: data.lastName,
        Email: data.email,
        PhoneNumber: data.phone,
        Subject: data.subject,
        Address: `${data.street}--${data.city}--${data.state}--${data.zip}`,
        Message: data.message,
        WhatsappNumber: null,
        LastModifiedBy: "Admin"
      };
      
      await submitContactForm(userData);
      setShowModal(true);
      formRef.current.reset();
      setPhone('');
      setTimeout(() => setShowModal(false), 5000);
    } catch (error) {
      alert('Something went wrong. Please try again.');
    } finally {
      setShowOverlay(false);
    }
  };

  return (
    <>
    <Header1/>

    
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
          src="/images/main-image.jpeg"
          alt="Main Feature"
          className="w-full lg:w-1/2 shadow-md"
        />

        <div className="space-y-8 w-full lg:w-1/2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-6 sm:gap-8">
              <img
                src={`/images/${feature.icon}`}
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

          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)] p-6 sm:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'firstName', placeholder: 'First Name', type: 'text' },
                { name: 'lastName', placeholder: 'Last Name', type: 'text' },
                { name: 'email', placeholder: 'Email', type: 'email' },
                { name: 'phone', placeholder: 'Phone', type: 'text', value: phone, onChange: formatPhoneNumber },
                { name: 'street', placeholder: 'Address Line 1', type: 'text' },
                { name: 'city', placeholder: 'City', type: 'text' },
                { name: 'zip', placeholder: 'Zip', type: 'text' },
                { name: 'state', placeholder: 'State', type: 'text' }
              ].map(field => (
                <div key={field.name}>
                  <input
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={field.onChange}
                    className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold focus:outline-none placeholder:text-[#02066F]"
                    required
                  />
                  {errors[field.name] && <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>}
                </div>
              ))}
            </div>
            
            <input name="subject" placeholder="Subject" className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold focus:outline-none placeholder:text-[#02066F]" required />
            <textarea name="message" placeholder="Message..." rows="4" className="border-2 border-[#02066F] rounded-[10px] w-full p-3 font-bold resize-none focus:outline-none placeholder:text-[#02066F]" required></textarea>
            
            <button type="submit" className="w-full bg-[#02066F] text-lg cursor-pointer text-white font-semibold py-4 rounded-[10px] transition-colors">
              Submit
            </button>
          </form>

          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0, 0, 0, 0.5)" }} onClick={() => setShowModal(false)}>
              <div className="bg-white rounded-sm shadow-xl w-full max-w-sm sm:max-w-lg mx-auto my-6 sm:my-12">
                <div className="bg-[#02066F] text-white py-4 px-4 sm:px-6 rounded-t-sm text-center">
                  <h5 className="text-lg sm:text-xl font-semibold">Thank You for Contacting Us!</h5>
                </div>
                <div className="p-4 sm:p-6 text-center">
                  <p className="font-bold mb-4 text-base sm:text-xl">We have received your message and will get back to you shortly.</p>
                  <div className="flex justify-center">
                    <img src="https://www.shutterstock.com/image-vector/blue-check-mark-icon-tick-260nw-787016416.jpg" alt="Checkmark" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
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
