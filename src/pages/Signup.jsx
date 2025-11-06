import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import Navigation from '../components/Navigation';

const Signup = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    phoneNumber: '',
    emailAddress: '',
    companyAddress: '',
    streetAddress: '',
    state: '',
    zip: ''
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    } else if (name === 'zip') {
      formattedValue = value.replace(/\D/g, '').slice(0, 5);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
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

  const validateForm = () => {
    const { companyName, phoneNumber, emailAddress, companyAddress, streetAddress, state, zip } = formData;
    return companyName && phoneNumber && emailAddress && companyAddress && streetAddress && state && zip;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all the fields!');
      return;
    }

    setLoading(true);

    try {
      const apiLink = 'https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/contact/send';
      
      const userData = {
        Name: formData.companyAddress,
        CompanyName: formData.companyName,
        PhoneNumber: formData.phoneNumber,
        email: formData.emailAddress,
        street: formData.streetAddress,
        state: formData.state,
        zip: formData.zip
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
      setShowModal(true);
      setFormData({
        companyName: '',
        phoneNumber: '',
        emailAddress: '',
        companyAddress: '',
        streetAddress: '',
        state: '',
        zip: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />

      <div className="row" style={{ height: 'calc(100vh - 70px)', margin: 0 }}>
        <div className="col-sm-12 col-xl-6 col-md-6 col-lg-6 col-sty d-flex flex-column justify-content-center align-items-center">
          <img src="/Image/icode logo 2 (1).png" className="p-5 img-fluid login-img-sty" style={{ width: '70%' }} />
          <h3 className="text-center head-sty">Join Us Today</h3>
          <p className="text-center content-sty">
            Create an account to unlock seamless time tracking and boost <br /> your team's efficiency.
          </p>
        </div>
        
        <div className="col-sm-12 col-xl-6 col-md-6 col-lg-6 d-flex justify-content-center align-items-center">
          <div className="container container-sty">
            <h2 className="text-center m-3">REGISTER</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="material-textfield mt-4">
                <Input
                  name="companyName"
                  placeholder=" "
                  type="text"
                  className="input-sty"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
                <label className="label-sty">Company Name</label>
              </div>

              <div className="material-textfield mt-4">
                <Input
                  type="tel"
                  name="phoneNumber"
                  placeholder=" "
                  className="input-sty"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
                <label>Phone Number</label>
              </div>

              <div className="material-textfield mt-4">
                <Input
                  name="emailAddress"
                  type="email"
                  placeholder=" "
                  className="input-sty"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  required
                />
                <label className="label-sty">Email Address</label>
              </div>

              <div className="material-textfield mt-4">
                <Input
                  name="companyAddress"
                  placeholder=" "
                  type="text"
                  className="input-sty"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  required
                />
                <label className="label-sty">Customer Name</label>
              </div>

              <div className="material-textfield">
                <Input
                  name="streetAddress"
                  placeholder=" "
                  type="text"
                  className="input-sty"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  required
                />
                <label className="label-sty">Street Address</label>
              </div>

              <div className="row">
                <div className="col-sm-6">
                  <div className="material-textfield mb-4">
                    <Input
                      name="state"
                      placeholder=" "
                      type="text"
                      className="input-sty"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                    <label className="label-sty">State</label>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="material-textfield">
                    <Input
                      name="zip"
                      placeholder=" "
                      type="text"
                      className="input-sty"
                      pattern="\\d*"
                      maxLength="5"
                      minLength="5"
                      title="Please enter a valid 5-digit ZIP code"
                      value={formData.zip}
                      onChange={handleInputChange}
                      required
                    />
                    <label className="label-sty">Zip</label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="btn btn-green mt-3"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header justify-content-center">
                <h5 className="modal-title text-center">Thanks for signing up</h5>
              </div>
              <div className="modal-body">
                <h5 className="fw-bold mb-3 text-center">Our team will shortly reach out to you!</h5>
                <p className="d-flex justify-content-center">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfz3upZJUzgki4bn27faJf6gPIIo7Yo5HxZg&s"
                    style={{ width: '100px' }}
                    alt=""
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

export default Signup;