import React, { useState } from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zipCode: '',
    state: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isAlpha = /^[a-zA-Z\s]+$/;

  const validateName = (value, fieldName) => {
    if (value.trim() === '') {
      return '';
    } else if (!isAlpha.test(value)) {
      return 'Only use letters, don\'t use digits';
    }
    return '';
  };

  const validateZipCode = (value) => {
    const zipCodePattern = /^\d{5}(?:[-\s]\d{4})?$/;
    if (value === '' || zipCodePattern.test(value.trim())) {
      return '';
    } else {
      return 'Invalid ZIP Code';
    }
  };

  const validatePhone = (value) => {
    const phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
    if (value === '') {
      return '';
    } else if (!phoneRegex.test(value)) {
      return 'Invalid phone number format';
    } else {
      return '';
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phone') {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    const newErrors = {};
    
    const firstNameError = validateName(formData.firstName, 'firstName');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateName(formData.lastName, 'lastName');
    if (lastNameError) newErrors.lastName = lastNameError;
    
    const zipError = validateZipCode(formData.zipCode);
    if (zipError) newErrors.zipCode = zipError;
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    // Check required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'zipCode', 'state', 'subject', 'message'];
    requiredFields.forEach(field => {
      if (formData[field].trim() === '') {
        newErrors[field] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const apiLink = 'https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/web_contact_us/create';
      
      const userData = {
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Email: formData.email,
        WhatsappNumber: null,
        Subject: formData.subject,
        PhoneNumber: formData.phone,
        Address: `${formData.street}--${formData.city}--${formData.state}--${formData.zipCode}`,
        Message: formData.message,
        LastModifiedBy: 'Admin'
      };

      const response = await fetch(apiLink, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.error) {
        setShowModal(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          street: '',
          city: '',
          zipCode: '',
          state: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="spinner"></div>
        </div>
      )}

      <h1 className="text-center mt-5 font-weight-bold">Contact</h1>
      <div className="container d-flex justify-content-center mb-3" id="contact">
        <div className="box-sty p-5">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
                {errors.firstName && <div className="text-danger text-center">{errors.firstName}</div>}
              </div>
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
                {errors.lastName && <div className="text-danger text-center">{errors.lastName}</div>}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && <div className="text-danger text-center">{errors.email}</div>}
              </div>
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
                {errors.phone && <div className="text-danger text-center">{errors.phone}</div>}
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="street"
                  placeholder="Street"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.street}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="city"
                  placeholder="City"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="zipCode"
                  placeholder="Zip"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                />
                {errors.zipCode && <div className="text-danger text-center">{errors.zipCode}</div>}
              </div>
              <div className="col-sm-6">
                <Input
                  type="text"
                  name="state"
                  placeholder="State"
                  className="all-input-style mb-3"
                  style={{ textAlign: 'center' }}
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <Input
              type="text"
              name="subject"
              placeholder="Subject"
              className="all-input-style mb-3"
              style={{ textAlign: 'center' }}
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
            <Textarea
              name="message"
              className="all-input-style mb-3"
              style={{ textAlign: 'center' }}
              placeholder="Message..."
              value={formData.message}
              onChange={handleInputChange}
              required
            />
            <Button
              type="submit"
              className="btn-green mt-3"
              style={{ textAlign: 'center' }}
              disabled={loading}
            >
              Submit
            </Button>
          </form>
        </div>
      </div>

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
                    alt="Success"
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
    </>
  );
};

export default ContactForm;