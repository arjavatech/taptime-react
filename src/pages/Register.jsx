import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { registerUser, getSubscriptionPlans, createCheckoutSessionForRegistration } from '../api.js';
import { useZipLookup } from '../hooks';
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, User, Building, Phone, MapPin, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import tabtimelogo from "../assets/images/tap-time-logo.png";
import RegistrationSuccessModal from "../components/ui/RegistrationSuccessModal";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';



const Register = () => {
  // Get trial parameter from URL
  const [searchParams] = useSearchParams();
  const [wantsTrial, setWantsTrial] = useState(() => {
    const trialParam = searchParams.get('trial');
    return trialParam === null ? true : trialParam === 'true'; // Default to true
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFileName, setLogoFileName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [centerLoading, setCenterLoading] = useState({ show: false, message: "" });

  // Error states for Step 1
  const [companyNameError, setCompanyNameError] = useState('');
  const [companyLogoError, setCompanyLogoError] = useState('');
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
  const [generalError, setGeneralError] = useState('');

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
    employmentType: ''
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
    // Restrict email to alphanumeric, @ and . only
    if (name === 'email' && value && !/^[a-zA-Z0-9@.]*$/.test(value)) {
      return;
    }
    // Restrict first and last name to letters only
    if ((name === 'firstName' || name === 'lastName') && value && !/^[a-zA-Z\s]*$/.test(value)) {
      return;
    }
    
    // Auto-capitalize first character for text fields (exclude email and numeric fields)
    let processedValue = value;
    const numericFields = ['noOfDevices', 'noOfEmployees', 'companyZip', 'customerZip'];
    const emailFields = ['email'];
    
    if (!numericFields.includes(name) && !emailFields.includes(name) && processedValue.length > 0) {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1);
    }
    
    // Clear errors when user types
    if (name === 'companyName') setCompanyNameError('');
    if (name === 'companyStreet') setCompanyStreetError('');
    if (name === 'companyCity') setCompanyCityError('');
    if (name === 'companyState') setCompanyStateError('');
    if (name === 'companyZip') setCompanyZipError('');
    if (name === 'noOfDevices') setNoOfDevicesError('');
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
      [name]: processedValue
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image format immediately
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
        setCompanyLogoError('Please upload a valid image file (JPEG or PNG)');
        return;
      }
      setCompanyLogoError('');
      setLogoFileName(file.name);
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          companyLogo: reader.result
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
      const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

      if (capitalizedValue && !employmentTypes.includes(capitalizedValue)) {
        const newTypes = [...employmentTypes, capitalizedValue];
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
    const { companyName, companyStreet, companyCity, companyState, companyZip, noOfDevices, noOfEmployees } = formData;

    // Clear previous errors
    setCompanyNameError('');
    setCompanyLogoError('');
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
    } else if (!/^\d{5}$/.test(companyZip)) {
      setCompanyZipError('Zip code must be exactly 5 digits');
      hasErrors = true;
    }
    if (!noOfDevices || Number(noOfDevices) <= 0) {
      setNoOfDevicesError('Number of devices must be greater than 0');
      hasErrors = true;
    }
    if (!noOfEmployees || Number(noOfEmployees) <= 0) {
      setNoOfEmployeesError('Number of employees must be greater than 0');
      hasErrors = true;
    }
    // Validate company logo
    if (logoFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      const fileExtension = logoFile.name.toLowerCase().substring(logoFile.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(logoFile.type) || !allowedExtensions.includes(fileExtension)) {
        setCompanyLogoError('Please upload a valid image file (JPEG or PNG)');
        hasErrors = true;
      }
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
    setGeneralError('');

    let hasErrors = false;

    if (!firstName.trim()) {
      setFirstNameError('First name is required');
      hasErrors = true;
    } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
      setFirstNameError('First name cannot contain numbers');
      hasErrors = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required');
      hasErrors = true;
    } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
      setLastNameError('Last name cannot contain numbers');
      hasErrors = true;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9@.]+$/.test(email)) {
      setEmailError('Email cannot contain special characters');
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      hasErrors = true;
    } else {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) {
        setPhoneError('Phone number must be at least 10 digits');
        hasErrors = true;
      }
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
    const isValid = validateStep1();
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // Helper function to convert File to base64 for localStorage
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsLoading(true);

    try {
      // Create plain object with proper field name mapping for API
      const submitData = {
        company_name: formData.companyName,
        company_address_line1: formData.companyStreet,
        company_city: formData.companyCity,
        company_state: formData.companyState,
        company_zip_code: formData.companyZip,
        device_count: parseInt(formData.noOfDevices, 10),
        employee_count: parseInt(formData.noOfEmployees, 10),
        employment_type: employmentTypes.join(','),
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        report_type: 'Weekly',
        phone_number: formData.phone,
        customer_address_line1: formData.customerStreet,
        customer_city: formData.customerCity,
        customer_state: formData.customerState,
        customer_zip_code: formData.customerZip,
        last_modified_by: 'Admin'
      };

      // 1. Save registration data to sessionStorage (persists better across Stripe redirects)
      sessionStorage.setItem('pendingRegistration', JSON.stringify(submitData));

      // 2. Convert and save logo to sessionStorage if exists
      if (logoFile) {
        const base64Logo = await fileToBase64(logoFile);
        sessionStorage.setItem('pendingRegistrationLogo', base64Logo);
        sessionStorage.setItem('pendingRegistrationLogoName', logoFile.name);
      }

      // 3. Get subscription plans to get the price ID
      const plansResponse = await getSubscriptionPlans();

      if (!plansResponse.success || !plansResponse.plans || plansResponse.plans.length === 0) {
        setGeneralError('Unable to load subscription plans. Please try again.');
        setIsLoading(false);
        return;
      }

      const priceId = plansResponse.plans[0].stripe_price_id;

      // 4. Create Stripe Checkout session for registration
      const quantity = parseInt(formData.noOfEmployees, 10);
      const successUrl = `${window.location.origin}/register/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/register`;

      const checkoutResponse = await createCheckoutSessionForRegistration({
        email: formData.email,
        company_name: formData.companyName,
        quantity: quantity,
        price_id: priceId,
        trial_period_days: wantsTrial ? 14 : 0,  // Dynamic trial
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      if (checkoutResponse.success) {
        // 5. Redirect to Stripe Checkout
        window.location.href = checkoutResponse.data.checkout_url;
      } else {
        // Clear sessionStorage on error
        sessionStorage.removeItem('pendingRegistration');
        sessionStorage.removeItem('pendingRegistrationLogo');
        sessionStorage.removeItem('pendingRegistrationLogoName');

        setGeneralError('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      // Clear sessionStorage on error
      sessionStorage.removeItem('pendingRegistration');
      sessionStorage.removeItem('pendingRegistrationLogo');
      sessionStorage.removeItem('pendingRegistrationLogoName');

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setGeneralError('Network error. Please check your internet connection and try again');
      } else if (error.message.includes('timeout')) {
        setGeneralError('Request timeout. Please try again');
      } else if (error.message.includes('500')) {
        setGeneralError('Server error. Please try again later');
      } else {
        setGeneralError('Failed to start checkout process. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl px-4 py-6 sm:px-6 sm:py-8">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Company Information</CardTitle>
        <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
          Tell us about your company
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        <form onSubmit={handleNext} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm sm:text-base font-medium">Company Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="companyName"
                name="companyName"
                placeholder="Enter company name"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${companyNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {companyNameError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{companyNameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo" className="text-sm sm:text-base font-medium">Company Logo</Label>
            {formData.companyLogo ? (
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-md bg-gray-50">
                <img
                  src={formData.companyLogo}
                  alt="Company Logo Preview"
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{logoFileName}</p>
                  <p className="text-xs text-gray-500">Image selected</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium px-2"
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
                className={`h-10 sm:h-11 text-sm sm:text-base ${companyLogoError ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            )}
            {companyLogoError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{companyLogoError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyStreet" className="text-sm sm:text-base font-medium">Street Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="companyStreet"
                name="companyStreet"
                placeholder="Enter street address"
                value={formData.companyStreet}
                onChange={handleInputChange}
                className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${companyStreetError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {companyStreetError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{companyStreetError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyCity" className="text-sm sm:text-base font-medium">City *</Label>
              <Input
                id="companyCity"
                name="companyCity"
                placeholder="City"
                value={formData.companyCity}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${companyCityError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {companyCityError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{companyCityError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState" className="text-sm sm:text-base font-medium">State *</Label>
              <Input
                id="companyState"
                name="companyState"
                placeholder="State"
                value={formData.companyState}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${companyStateError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {companyStateError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{companyStateError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyZip" className="text-sm sm:text-base font-medium">Zip Code *</Label>
            <div className="relative">
              <Input
                type="text"
                id="companyZip"
                name="companyZip"
                placeholder="Enter zip code"
                value={formData.companyZip}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${companyZipError ? 'border-red-500 focus:border-red-500' : ''}`}
                maxLength={5}
                required
              />
              {companyZipLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {companyZipError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{companyZipError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="noOfDevices" className="text-sm sm:text-base font-medium">Number of Devices *</Label>
              <Input
                id="noOfDevices"
                name="noOfDevices"
                type="text"
                placeholder="Devices"
                value={formData.noOfDevices}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${noOfDevicesError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {noOfDevicesError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{noOfDevicesError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="noOfEmployees" className="text-sm sm:text-base font-medium">Number of Employees *</Label>
              <Input
                id="noOfEmployees"
                name="noOfEmployees"
                type="text"
                placeholder="Employees"
                value={formData.noOfEmployees}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${noOfEmployeesError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {noOfEmployeesError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{noOfEmployeesError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employmentType" className="text-sm sm:text-base font-medium">Employment Types</Label>
            <div className="border border-textMuted rounded-md p-2 sm:p-3 min-h-[40px] sm:min-h-[44px] flex flex-wrap gap-1 sm:gap-2 items-center focus-within:ring-1 focus-within:ring-textMuted focus-within:border-textMuted">
              {employmentTypes.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs sm:text-sm rounded-md"
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
                className="flex-1 min-w-[100px] sm:min-w-[120px] outline-none text-xs sm:text-sm bg-transparent"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">Type employment type and press comma to add. Default: General Employee</p>
          </div>

          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg">
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
      <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl px-4 py-6 sm:px-6 sm:py-8">
        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Personal Information</CardTitle>
        <CardDescription className="text-primary-foreground/80 text-sm sm:text-base">
          {wantsTrial ? (
            <>You've selected the 14-day free trial. Complete your details to get started.</>
          ) : (
            <>You've selected direct subscription. Complete your details to proceed to payment.</>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Trial preference selection */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Trial Card */}
          <div
            onClick={() => setWantsTrial(true)}
            className={`
              cursor-pointer p-4 rounded-lg border-2 transition-all
              ${wantsTrial
                ? 'border-primary bg-primary/10'
                : 'border-muted bg-transparent hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-base mb-1">14-Day Free Trial</p>
                <p className="text-sm text-muted-foreground">
                  Try free for 14 days, then $1/employee/month
                </p>
              </div>
              {wantsTrial && (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
              )}
            </div>
          </div>

          {/* Direct Subscription Card */}
          <div
            onClick={() => setWantsTrial(false)}
            className={`
              cursor-pointer p-4 rounded-lg border-2 transition-all
              ${!wantsTrial
                ? 'border-primary bg-primary/10'
                : 'border-muted bg-transparent hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-base mb-1">Subscribe Now</p>
                <p className="text-sm text-muted-foreground">
                  Pay $1/employee/month starting today
                </p>
              </div>
              {!wantsTrial && (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm sm:text-base font-medium">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${firstNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {firstNameError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{firstNameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm sm:text-base font-medium">Last Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${lastNameError ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
              </div>
              {lastNameError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{lastNameError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleInputChange}
                className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm sm:text-base font-medium">Phone Number *</Label>
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
                '--react-international-phone-height': '2.75rem',
                '--react-international-phone-font-size': '0.875rem'
              }}
            />
            {phoneError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{phoneError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerStreet" className="text-sm sm:text-base font-medium">Street Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="customerStreet"
                name="customerStreet"
                placeholder="Enter street address"
                value={formData.customerStreet}
                onChange={handleInputChange}
                className={`pl-10 h-10 sm:h-11 text-sm sm:text-base ${customerStreetError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
            </div>
            {customerStreetError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{customerStreetError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCity" className="text-sm sm:text-base font-medium">City *</Label>
              <Input
                id="customerCity"
                name="customerCity"
                placeholder="City"
                value={formData.customerCity}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${customerCityError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {customerCityError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{customerCityError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerState" className="text-sm sm:text-base font-medium">State *</Label>
              <Input
                id="customerState"
                name="customerState"
                placeholder="State"
                value={formData.customerState}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${customerStateError ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {customerStateError && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">{customerStateError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerZip" className="text-sm sm:text-base font-medium">Zip Code *</Label>
            <div className="relative">
              <Input
                id="customerZip"
                name="customerZip"
                placeholder="Enter zip code"
                value={formData.customerZip}
                onChange={handleInputChange}
                className={`h-10 sm:h-11 text-sm sm:text-base ${customerZipError ? 'border-red-500 focus:border-red-500' : ''}`}
                maxLength={5}
                required
              />
              {customerZipLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {customerZipError && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">{customerZipError}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-10 sm:h-11 text-sm sm:text-base" size="lg">
              Back
            </Button>
            <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : wantsTrial ? (
                'Start Free Trial'
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
          {generalError && (
            <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 mt-3 sm:mt-4">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-600">{generalError}</p>
            </div>
          )}
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

      <div className="min-h-screen flex flex-col md:flex-row pt-16 sm:pt-20 md:pt-0">
        {/* Left side - Brand section (hidden on mobile) */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-6 lg:p-12 md:pt-24 lg:pt-32">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 lg:space-y-8">
            {/* Brand Logo */}
            <img
              src={tabtimelogo}
              alt="Tap-Time Logo"
              className="w-32 md:w-40 lg:w-48 xl:w-56 mx-auto"
            />
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                Employee Time Tracking
              </h1>
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed px-4">
                One tap solution for simplifying and streamlining employee time
                logging and reporting.
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6 lg:gap-8 text-gray-600 text-xs sm:text-sm">
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
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center mt-0 md:mt-8 lg:mt-12 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-md">
            {/* Logo (visible on mobile only) */}
            <div className="text-center mb-6 sm:mb-8 md:hidden">
              <img src={tabtimelogo} alt="TabTime Logo" className="mx-auto h-16 sm:h-20 w-auto" />
            </div>



          {currentStep === 1 ? renderStep1() : renderStep2()}


          </div>
        </div>
      </div>

      {/* Registration Success Modal */}
      <RegistrationSuccessModal isOpen={showSuccessModal} />
    </>
  );
};

export default Register;