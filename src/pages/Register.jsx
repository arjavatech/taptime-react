import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../api.js';
import { useZipLookup } from '../hooks';
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, User, Building, Phone, MapPin, CheckCircle, XCircle, X, Loader2 } from "lucide-react";
import tabtimelogo from "../assets/images/tap-time-logo.png";
import RegistrationSuccessModal from "../components/ui/RegistrationSuccessModal";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';


const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFileName, setLogoFileName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [centerLoading, setCenterLoading] = useState({ show: false, message: "" });

  // Error states for Step 1
  const [companyNameError, setCompanyNameError] = useState('');
  const [companyStreetError, setCompanyStreetError] = useState('');
  const [companyCityError, setCompanyCityError] = useState('');
  const [companyStateError, setCompanyStateError] = useState('');
  const [companyZipError, setCompanyZipError] = useState('');
  const [noOfDevicesError, setNoOfDevicesError] = useState('');
  const [noOfEmployeesError, setNoOfEmployeesError] = useState('');

  // Error states for Step 2
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [customerStreetError, setCustomerStreetError] = useState('');
  const [customerCityError, setCustomerCityError] = useState('');
  const [customerStateError, setCustomerStateError] = useState('');
  const [customerZipError, setCustomerZipError] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: null,
    companyStreet: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    noOfDevices: '1',
    noOfEmployees: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerStreet: '',
    customerCity: '',
    customerState: '',
    customerZip: '',
    employmentType: 'General Employee'
  });

  // Employment type tag input states
  const [employmentTypes, setEmploymentTypes] = useState(['General Employee']);
  const [employmentTypeInput, setEmploymentTypeInput] = useState('');

  // ZIP code auto-fill callbacks
  const handleCompanyZipResult = useCallback((result) => {
    setFormData(prev => ({
      ...prev,
      companyCity: result.city,
      companyState: result.state
    }));
    setCompanyCityError('');
    setCompanyStateError('');
  }, []);

  const handleCustomerZipResult = useCallback((result) => {
    setFormData(prev => ({
      ...prev,
      customerCity: result.city,
      customerState: result.state
    }));
    setCustomerCityError('');
    setCustomerStateError('');
  }, []);

  // ZIP code lookup hooks
  const { isLoading: companyZipLoading } = useZipLookup(formData.companyZip, handleCompanyZipResult);
  const { isLoading: customerZipLoading } = useZipLookup(formData.customerZip, handleCustomerZipResult);

  const showCenterLoading = (message) => {
    setCenterLoading({ show: true, message });
  };

  const hideCenterLoading = () => {
    setCenterLoading({ show: false, message: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers for device and employee count fields
    if ((name === 'noOfDevices' || name === 'noOfEmployees') && value && !/^\d+$/.test(value)) {
      return;
    }
    // Restrict zip codes to 5 digits only
    if ((name === 'companyZip' || name === 'customerZip') && value && !/^\d{0,5}$/.test(value)) {
      return;
    }
    
    // Clear errors when user types
    if (name === 'companyName') setCompanyNameError('');
    if (name === 'companyStreet') setCompanyStreetError('');
    if (name === 'companyCity') setCompanyCityError('');
    if (name === 'companyState') setCompanyStateError('');
    if (name === 'companyZip') setCompanyZipError('');
    if (name === 'noOfEmployees') setNoOfEmployeesError('');
    if (name === 'firstName') setFirstNameError('');
    if (name === 'lastName') setLastNameError('');
    if (name === 'email') setEmailError('');
    if (name === 'customerStreet') setCustomerStreetError('');
    if (name === 'customerCity') setCustomerCityError('');
    if (name === 'customerState') setCustomerStateError('');
    if (name === 'customerZip') setCustomerZipError('');
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFileName(file.name);
      setLogoFile(file); // Store the actual File object for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          companyLogo: reader.result // Keep base64 for preview
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFileName('');
    setLogoFile(null);
    setFormData(prev => ({
      ...prev,
      companyLogo: null
    }));
  };

  const handlePhoneChange = (phone) => {
    setPhoneError('');
    setFormData(prev => ({
      ...prev,
      phone: phone
    }));
  };

  const handleEmploymentTypeKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const value = employmentTypeInput.trim();

      if (value && !employmentTypes.includes(value)) {
        const newTypes = [...employmentTypes, value];
        setEmploymentTypes(newTypes);
        setFormData(prev => ({
          ...prev,
          employmentType: newTypes.join(',')
        }));
      }
      setEmploymentTypeInput('');
    }
  };

  const handleRemoveEmploymentType = (typeToRemove) => {
    // Don't allow removing if it's the last one
    if (employmentTypes.length === 1) return;

    const newTypes = employmentTypes.filter(type => type !== typeToRemove);
    setEmploymentTypes(newTypes);
    setFormData(prev => ({
      ...prev,
      employmentType: newTypes.join(',')
    }));
  };

  const validateStep1 = () => {
    const { companyName, companyStreet, companyCity, companyState, companyZip, noOfEmployees } = formData;

    // Clear previous errors
    setCompanyNameError('');
    setCompanyStreetError('');
    setCompanyCityError('');
    setCompanyStateError('');
    setCompanyZipError('');
    setNoOfDevicesError('');
    setNoOfEmployeesError('');

    let hasErrors = false;

    if (!companyName.trim()) {
      setCompanyNameError('Company name is required');
      hasErrors = true;
    }
    if (!companyStreet.trim()) {
      setCompanyStreetError('Street address is required');
      hasErrors = true;
    }
    if (!companyCity.trim()) {
      setCompanyCityError('City is required');
      hasErrors = true;
    }
    if (!companyState.trim()) {
      setCompanyStateError('State is required');
      hasErrors = true;
    }
    if (!companyZip.trim()) {
      setCompanyZipError('Zip code is required');
      hasErrors = true;
    }
    // noOfDevices is hardcoded to 1, no validation needed
    if (!noOfEmployees || Number(noOfEmployees) <= 0) {
      setNoOfEmployeesError('Number of employees must be greater than 0');
      hasErrors = true;
    }

    return !hasErrors;
  };

  const validateStep2 = () => {
    const { firstName, lastName, email, phone, customerStreet, customerCity, customerState, customerZip } = formData;

    // Clear previous errors
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPhoneError('');
    setCustomerStreetError('');
    setCustomerCityError('');
    setCustomerStateError('');
    setCustomerZipError('');

    let hasErrors = false;

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      hasErrors = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      hasErrors = true;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      hasErrors = true;
    }
    if (!customerStreet.trim()) {
      setCustomerStreetError('Street address is required');
      hasErrors = true;
    }
    if (!customerCity.trim()) {
      setCustomerCityError('City is required');
      hasErrors = true;
    }
    if (!customerState.trim()) {
      setCustomerStateError('State is required');
      hasErrors = true;
    }
    if (!customerZip.trim()) {
      setCustomerZipError('Zip code is required');
      hasErrors = true;
    }

    return !hasErrors;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      // Extract only digits from phone number
      const phoneDigits = formData.phone.replace(/\D/g, '').replace(/^1/, '');

      // Create plain object with proper field name mapping for API
      const submitData = {
        company_name: formData.companyName,
        company_address_line1: formData.companyStreet,
        company_city: formData.companyCity,
        company_state: formData.companyState,
        company_zip_code: formData.companyZip,
        device_count: parseInt(formData.noOfDevices, 10),
        employee_count: parseInt(formData.noOfEmployees, 10),
        employment_type: formData.employmentType,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        report_type: 'Weekly',
        phone_number: phoneDigits,
        customer_address_line1: formData.customerStreet,
        customer_city: formData.customerCity,
        customer_state: formData.customerState,
        customer_zip_code: formData.customerZip,
        last_modified_by: 'Admin'
      };

      console.log('Submitting registration data:', submitData);
      // Pass signup data and logo file separately - API uses multipart/form-data
      const response = await registerUser(submitData, logoFile);

      if (response.success) {
        showCenterLoading('Processing registration...');
        setTimeout(() => {
          hideCenterLoading();
          setShowSuccessModal(true);
        }, 800);
      } else {
        const errorMessage = response.error || response.message || 'Registration failed';
        
        if (errorMessage.includes('email') && errorMessage.includes('already')) {
          setEmailError('This email address is already registered');
        } else if (errorMessage.includes('company') && errorMessage.includes('exists')) {
          setCompanyNameError('Company name already exists');
        } else if (errorMessage.includes('validation')) {
          setEmailError('Please check your information and try again');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          setEmailError('Network error. Please check your connection and try again');
        } else {
          setEmailError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setEmailError('Network error. Please check your internet connection and try again');
      } else if (error.message.includes('timeout')) {
        setEmailError('Request timeout. Please try again');
      } else if (error.message.includes('400')) {
        setEmailError('Invalid data provided. Please check your information');
      } else if (error.message.includes('409')) {
        setEmailError('Email or company name already exists');
      } else if (error.message.includes('500')) {
        setEmailError('Server error. Please try again later');
      } else {
        setEmailError('Registration failed. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl">
        <CardTitle className="text-2xl font-bold">Company Information</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Tell us about your company
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="companyName"
                name="companyName"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`pl-10 ${companyNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {companyNameError && (
              <p className="text-red-600 text-xs mt-1">{companyNameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            {formData.companyLogo ? (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                <img
                  src={formData.companyLogo}
                  alt="Company Logo Preview"
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{logoFileName}</p>
                  <p className="text-xs text-gray-500">Image selected</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <Input
                id="companyLogo"
                name="companyLogo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyStreet">Street Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="companyStreet"
                name="companyStreet"
                placeholder="Enter street address"
                value={formData.companyStreet}
                onChange={handleInputChange}
                className={`pl-10 ${companyStreetError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {companyStreetError && (
              <p className="text-red-600 text-xs mt-1">{companyStreetError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyCity">City *</Label>
              <Input
                id="companyCity"
                name="companyCity"
                placeholder="City"
                value={formData.companyCity}
                onChange={handleInputChange}
                className={companyCityError ? 'border-red-500 focus:border-red-500' : ''}
                required
              />
              {companyCityError && (
                <p className="text-red-600 text-xs mt-1">{companyCityError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState">State *</Label>
              <Input
                id="companyState"
                name="companyState"
                placeholder="State"
                value={formData.companyState}
                onChange={handleInputChange}
                className={companyStateError ? 'border-red-500 focus:border-red-500' : ''}
                required
              />
              {companyStateError && (
                <p className="text-red-600 text-xs mt-1">{companyStateError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyZip">Zip Code *</Label>
            <div className="relative">
              <Input
                type="text"
                id="companyZip"
                name="companyZip"
                placeholder="Enter zip code"
                value={formData.companyZip}
                onChange={handleInputChange}
                className={companyZipError ? 'border-red-500 focus:border-red-500' : ''}
                maxLength={5}
                required
              />
              {companyZipLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {companyZipError && (
              <p className="text-red-600 text-xs mt-1">{companyZipError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="noOfDevices">Number of Devices *</Label>
              <Input
                id="noOfDevices"
                name="noOfDevices"
                type="text"
                placeholder="Devices"
                value={formData.noOfDevices}
                disabled
                readOnly
                className="bg-gray-100 cursor-not-allowed text-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noOfEmployees">Number of Employees *</Label>
              <Input
                id="noOfEmployees"
                name="noOfEmployees"
                type="text"
                placeholder="Employees"
                value={formData.noOfEmployees}
                onChange={handleInputChange}
                className={noOfEmployeesError ? 'border-red-500 focus:border-red-500' : ''}
                required
              />
              {noOfEmployeesError && (
                <p className="text-red-600 text-xs mt-1">{noOfEmployeesError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Types</Label>
            <div className="border rounded-md p-2 min-h-[42px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              {employmentTypes.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
                >
                  {type}
                  {employmentTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmploymentType(type)}
                      className="hover:text-red-500 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              <input
                type="text"
                id="employmentType"
                value={employmentTypeInput}
                onChange={(e) => setEmploymentTypeInput(e.target.value)}
                onKeyDown={handleEmploymentTypeKeyDown}
                placeholder={employmentTypes.length === 0 ? "Type and press comma to add" : "Add more..."}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">Type employment type and press comma to add. Default: General Employee</p>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Next
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl">
        <CardTitle className="text-2xl font-bold">Personal Information</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Tell us about yourself
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`pl-10 ${firstNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {firstNameError && (
                <p className="text-red-600 text-xs mt-1">{firstNameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`pl-10 ${lastNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {lastNameError && (
                <p className="text-red-600 text-xs mt-1">{lastNameError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`pl-10 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-xs mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInput
              defaultCountry="us"
              value={formData.phone}
              onChange={handlePhoneChange}
              disableDialCodePrefill={false}
              forceDialCode={true}
              className={phoneError ? 'phone-input-error' : ''}
              inputClassName="w-full"
              style={{
                '--react-international-phone-border-radius': '0.375rem',
                '--react-international-phone-border-color': phoneError ? '#ef4444' : '#e5e7eb',
                '--react-international-phone-background-color': '#ffffff',
                '--react-international-phone-text-color': '#000000',
                '--react-international-phone-selected-dropdown-item-background-color': '#f3f4f6',
                '--react-international-phone-height': '2.5rem'
              }}
            />
            {phoneError && (
              <p className="text-red-600 text-xs mt-1">{phoneError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerStreet">Street Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="customerStreet"
                name="customerStreet"
                placeholder="Enter street address"
                value={formData.customerStreet}
                onChange={handleInputChange}
                className={`pl-10 ${customerStreetError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {customerStreetError && (
              <p className="text-red-600 text-xs mt-1">{customerStreetError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCity">City *</Label>
              <Input
                id="customerCity"
                name="customerCity"
                placeholder="City"
                value={formData.customerCity}
                onChange={handleInputChange}
                className={customerCityError ? 'border-red-500 focus:border-red-500' : ''}
                required
              />
              {customerCityError && (
                <p className="text-red-600 text-xs mt-1">{customerCityError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerState">State *</Label>
              <Input
                id="customerState"
                name="customerState"
                placeholder="State"
                value={formData.customerState}
                onChange={handleInputChange}
                className={customerStateError ? 'border-red-500 focus:border-red-500' : ''}
                required
              />
              {customerStateError && (
                <p className="text-red-600 text-xs mt-1">{customerStateError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerZip">Zip Code *</Label>
            <div className="relative">
              <Input
                id="customerZip"
                name="customerZip"
                placeholder="Enter zip code"
                value={formData.customerZip}
                onChange={handleInputChange}
                className={customerZipError ? 'border-red-500 focus:border-red-500' : ''}
                maxLength={5}
                required
              />
              {customerZipLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {customerZipError && (
              <p className="text-red-600 text-xs mt-1">{customerZipError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1 py-2.5" size="lg">
              Back
            </Button>
            <Button type="submit" className="flex-1 py-2.5" size="lg" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Header Navigation */}
      <Header />

      <CenterLoadingOverlay show={centerLoading.show} message={centerLoading.message} />

      <div className="min-h-screen flex flex-col md:flex-row pt-20 md:pt-0">
        {/* Left side - Brand section (hidden on mobile) */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-12 md:pt-32">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
            {/* Brand Logo */}
            <img
              src={tabtimelogo}
              alt="Tap-Time Logo"
              className="w-48 xl:w-56 md:w-40 mx-auto"
            />
            <div className="space-y-4">
              <h1 className="text-3xl xl:text-4xl md:text-3xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex gap-8 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center mt-0 md:mt-12 py-12 px-6 sm:px-8 md:px-12 lg:px-20">
          <div className="w-full max-w-md">
            {/* Logo (visible on mobile only) */}
            <div className="text-center mb-8 md:hidden">
              <img src={tabtimelogo} alt="TabTime Logo" className="mx-auto h-20 w-auto sm:h-25" />
            </div>

            {/* Progress Indicator
            <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                1
              </div>
              <div className={`w-16 h-1 rounded ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'
                }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                2
              </div>
            </div>
          </div>
           */}

          {currentStep === 1 ? renderStep1() : renderStep2()}

            <div className="text-center mt-8">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal isOpen={showSuccessModal} />
    </>
  );
};

export default Register;