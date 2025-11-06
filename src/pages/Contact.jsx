import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import DashboardNavigation from '../components/DashboardNavigation';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear errors on input change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatPhoneNumber = (value) => {
    value = value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 6) {
      value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length > 3) {
      value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    }
    return value;
  };

  const validateName = (value) => {
    const isAlpha = /^[a-zA-Z\s]+$/;
    if (value.trim() === '') {
      return '';
    } else if (!isAlpha.test(value)) {
      return 'Only use letters, don\'t use digits';
    }
    return '';
  };

  const validatePhone = (value) => {
    const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
    if (value === '') {
      return '';
    } else if (!phoneRegex.test(value)) {
      return 'Invalid phone number format';
    }
    return '';
  };

  const validateMessage = (value) => {
    if (value.trim() === '') {
      return 'Message is required';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const phoneError = validatePhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    const messageError = validateMessage(formData.message);
    if (messageError) newErrors.message = messageError;

    // Check required fields
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const apiLink = 'https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/contact_us/create';
      
      const contactData = {
        Name: formData.name,
        Email: formData.email,
        Message: formData.message,
        PhoneNumber: formData.phoneNumber,
        LastModifiedBy: 'User'
      };

      const response = await fetch(apiLink, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setShowModal(true);
      setFormData({
        name: '',
        email: '',
        message: '',
        phoneNumber: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DashboardNavigation />
      
      {loading && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="spinner"></div>
        </div>
      )}

      <section>
        <div className="container box-sty mt-5">
          <h3 className="text-center fw-bold mb-3">Contact Us</h3>
          
          <form onSubmit={handleSubmit} className="p-2 text-center">
            <Input
              type="text"
              name="name"
              placeholder="Name"
              className="all-input-style mb-3"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            {errors.name && <span className="text-danger d-block mb-2">{errors.name}</span>}

            <Input
              type="email"
              name="email"
              placeholder="Email"
              className="all-input-style mb-3"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {errors.email && <span className="text-danger d-block mb-2">{errors.email}</span>}

            <Textarea
              name="message"
              className="all-input-style mb-3"
              placeholder="Message/Queries"
              value={formData.message}
              onChange={handleInputChange}
              required
            />
            {errors.message && <span className="text-danger d-block mb-2">{errors.message}</span>}

            <Input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              className="all-input-style mb-3"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
            {errors.phoneNumber && <span className="text-danger d-block mb-2">{errors.phoneNumber}</span>}

            <div className="d-flex justify-content-center align-items-baseline textfond mb-3">
              <h6 className="me-2 link-text"><b>Write to us at :</b></h6>
              <p className="ms-1">
                <a href="mailto:contact@tap-time.com" target="_blank" rel="noopener noreferrer" className="link-style">
                  contact@tap-time.com
                </a>
              </p>
            </div>

            <Button
              type="submit"
              className="btn btn-green"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </div>
      </section>

      {/* Success Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header justify-content-center">
                <h5 className="modal-title text-center">Thank You for Contacting Us!</h5>
              </div>
              <div className="modal-body">
                <h5 className="fw-bold mb-3 text-center">
                  We have received your message and will get back to you shortly.
                </h5>
                <p className="d-flex justify-content-center">
                  <img
                    src="https://www.shutterstock.com/image-vector/blue-check-mark-icon-tick-260nw-787016416.jpg"
                    style={{ width: '100px' }}
                    alt="Checkmark"
                  />
                </p>
                <div className="text-center">
                  <Button onClick={() => setShowModal(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Contact;