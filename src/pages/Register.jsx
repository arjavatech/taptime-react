import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import { registerUser } from '../api.js';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  
  const [isFreeTrail, setIsFreeTrail] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyZip, setCompanyZip] = useState('');
  const [NoOfDevices, setNoOfDevices] = useState(0);
  const [NoOfEmployees, setNoOfEmployees] = useState(0);
  const [errorCompanyName, setErrorCompanyName] = useState('');
  const [totalError, setTotalError] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileInput, setFileInput] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Personal info fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerZip, setCustomerZip] = useState('');
  
  // Step 1 error states
  const [errorCompanyStreet, setErrorCompanyStreet] = useState('');
  const [errorCompanyCity, setErrorCompanyCity] = useState('');
  const [errorCompanyState, setErrorCompanyState] = useState('');
  const [errorCompanyZip, setErrorCompanyZip] = useState('');
  const [errorNoOfDevices, setErrorNoOfDevices] = useState('');
  const [errorNoOfEmployees, setErrorNoOfEmployees] = useState('');
  
  // Personal info error states
  const [errorFirstName, setErrorFirstName] = useState('');
  const [errorLastName, setErrorLastName] = useState('');
  const [errorPhone, setErrorPhone] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorStreet, setErrorStreet] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [errorState, setErrorState] = useState('');
  const [errorZip, setErrorZip] = useState('');
  
  // Phone input refs
  const itiRef = useRef(null);
  const phoneInputRef = useRef(null);
  
  const isAlpha = /^[a-zA-Z\s]+$/;
  
  useEffect(() => {
    const trial = localStorage.getItem('trial') === 'true';
    setIsFreeTrail(trial);
    console.log("isFreeTrail", trial);
    setNoOfDevices(trial ? 1 : '');
    setNoOfEmployees(trial ? 10 : '');
  }, []);

  useEffect(() => {
    if (currentStep === 2 && phoneInputRef.current && !itiRef.current) {
      itiRef.current = intlTelInput(phoneInputRef.current, {
        initialCountry: 'us',
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js',
        dropdownContainer: document.body
      });
      
      phoneInputRef.current.addEventListener('countrychange', () => {
        setPhoneNumber('');
      });

      const style = document.createElement('style');
      style.textContent = `
        .iti__dropdown-content {
          max-height: 200px;
          overflow-x: hidden;
          overflow-y: hidden;
          transform: translateY(-100%) !important;
          top: 0 !important;
          bottom: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, [currentStep]);
  
  const validate = (field, value, type = 'text') => {
    if (!value?.trim()) return false;
    
    switch (type) {
      case 'name':
        return isAlpha.test(value);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 && /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/.test(value);
      default:
        return true;
    }
  };

  const validateStep1 = () => {
    let isValid = true;
    
    // Clear previous errors
    setErrorCompanyName('');
    setErrorCompanyStreet('');
    setErrorCompanyCity('');
    setErrorCompanyState('');
    setErrorCompanyZip('');
    setErrorNoOfDevices('');
    setErrorNoOfEmployees('');
    
    if (!validate('company', companyName, 'name')) {
      setErrorCompanyName('Company name is required and must contain only letters');
      isValid = false;
    }
    if (!companyStreet?.trim()) {
      setErrorCompanyStreet('Street address is required');
      isValid = false;
    }
    if (!companyCity?.trim()) {
      setErrorCompanyCity('City is required');
      isValid = false;
    }
    if (!companyState?.trim()) {
      setErrorCompanyState('State is required');
      isValid = false;
    }
    if (!companyZip?.trim() || Number(companyZip) <= 0) {
      setErrorCompanyZip('Valid zip code is required');
      isValid = false;
    }
    if (!NoOfDevices || Number(NoOfDevices) <= 0) {
      setErrorNoOfDevices('Number of devices must be greater than 0');
      isValid = false;
    }
    if (!NoOfEmployees || Number(NoOfEmployees) <= 0) {
      setErrorNoOfEmployees('Number of employees must be greater than 0');
      isValid = false;
    }
    
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    
    // Clear previous errors
    setErrorFirstName('');
    setErrorLastName('');
    setErrorEmail('');
    setErrorPhone('');
    setErrorStreet('');
    setErrorCity('');
    setErrorState('');
    setErrorZip('');
    
    if (!validate('firstName', firstName, 'name')) {
      setErrorFirstName('First name is required and must contain only letters');
      isValid = false;
    }
    if (!validate('lastName', lastName, 'name')) {
      setErrorLastName('Last name is required and must contain only letters');
      isValid = false;
    }
    if (!validate('email', email, 'email')) {
      setErrorEmail('Valid email address is required');
      isValid = false;
    }
    if (!validate('phone', phoneNumber, 'phone')) {
      setErrorPhone('Valid phone number is required (123) 456-7890');
      isValid = false;
    }
    if (!customerStreet?.trim()) {
      setErrorStreet('Street address is required');
      isValid = false;
    }
    if (!customerCity?.trim()) {
      setErrorCity('City is required');
      isValid = false;
    }
    if (!customerState?.trim()) {
      setErrorState('State is required');
      isValid = false;
    }
    if (!customerZip?.trim()) {
      setErrorZip('Zip code is required');
      isValid = false;
    }
    
    return isValid;
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    setPhoneNumber(formatted);
  };
  
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileInput(files[0]);
      setFileName(files[0].name);
      setCompanyLogo(URL.createObjectURL(files[0]));
    }
  };

  const handleNext = (event) => {
    event.preventDefault();
    setOverlayVisible(true);
    setTotalError('');

    if (validateStep1()) {
      if (fileInput) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCompanyLogo(reader.result);
          setTimeout(() => {
            setOverlayVisible(false);
            setCurrentStep(2);
          }, 100);
        };
        reader.readAsDataURL(fileInput);
      } else {
        setTimeout(() => {
          setOverlayVisible(false);
          setCurrentStep(2);
        }, 100);
      }
    } else {
      setOverlayVisible(false);
    }
  };
  
  const validateForm = async (event) => {
    event.preventDefault();
    setOverlayVisible(true);
    setTotalError('');

    if (validateStep2()) {
      try {
        const formData = new FormData();
        formData.append('companyName', companyName);
        formData.append('companyStreet', companyStreet);
        formData.append('companyCity', companyCity);
        formData.append('companyState', companyState);
        formData.append('companyZip', companyZip);
        formData.append('NoOfDevices', NoOfDevices);
        formData.append('NoOfEmployees', NoOfEmployees);
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('phoneNumber', phoneNumber);
        formData.append('email', email);
        formData.append('customerStreet', customerStreet);
        formData.append('customerCity', customerCity);
        formData.append('customerState', customerState);
        formData.append('customerZip', customerZip);
        formData.append('isFreeTrail', isFreeTrail);
        
        if (fileInput) {
          formData.append('companyLogo', fileInput);
        }

        const response = await registerUser(formData);
        
        if (response.success) {
          showToast('Registration successful! Redirecting to login...', 'success');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          showToast(response.message || 'Registration failed', 'error');
        }
      } catch (error) {
        showToast('Registration failed. Please try again.', 'error');
      }
    } else {
      // Validation errors are shown as text under fields
    }
    setOverlayVisible(false);
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 mt-20">
      <CardHeader className="space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
          Company Information
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Tell us about your company
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {totalError && (
          <Alert variant="destructive" className="border-red-200">
            <AlertDescription className="text-sm">
              {totalError}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm font-medium">
              Company Name *
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errorCompanyName) setErrorCompanyName('');
              }}

              className="h-10 sm:h-11"
            />
            {errorCompanyName && <p className="text-red-500 text-xs">{errorCompanyName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo" className="text-sm font-medium">
              Company Logo
            </Label>
            <Input
              id="companyLogo"
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="h-10 sm:h-11"
            />
            {fileName && <p className="text-green-600 text-xs">Selected: {fileName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyStreet" className="text-sm font-medium">
              Street Address *
            </Label>
            <Input
              id="companyStreet"
              type="text"
              placeholder="Enter street address"
              value={companyStreet}
              onChange={(e) => {
                setCompanyStreet(e.target.value);
                if (errorCompanyStreet) setErrorCompanyStreet('');
              }}
              className="h-10 sm:h-11"
            />
            {errorCompanyStreet && <p className="text-red-500 text-xs">{errorCompanyStreet}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyCity" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="companyCity"
                type="text"
                placeholder="City"
                value={companyCity}
                onChange={(e) => {
                  setCompanyCity(e.target.value);
                  if (errorCompanyCity) setErrorCompanyCity('');
                }}
                className="h-10 sm:h-11"
              />
              {errorCompanyCity && <p className="text-red-500 text-xs">{errorCompanyCity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState" className="text-sm font-medium">
                State *
              </Label>
              <Input
                id="companyState"
                type="text"
                placeholder="State"
                value={companyState}
                onChange={(e) => {
                  setCompanyState(e.target.value);
                  if (errorCompanyState) setErrorCompanyState('');
                }}
                className="h-10 sm:h-11"
              />
              {errorCompanyState && <p className="text-red-500 text-xs">{errorCompanyState}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyZip" className="text-sm font-medium">
              Zip Code *
            </Label>
            <Input
              id="companyZip"
              type="text"
              placeholder="Enter zip code"
              value={companyZip}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setCompanyZip(value);
                if (errorCompanyZip) setErrorCompanyZip('');
              }}
              className="h-10 sm:h-11"
            />
            {errorCompanyZip && <p className="text-red-500 text-xs">{errorCompanyZip}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="NoOfDevices" className="text-sm font-medium">
                Number of Devices *
              </Label>
              <Input
                id="NoOfDevices"
                type="text"
                placeholder="Devices"
                value={NoOfDevices}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setNoOfDevices(value);
                  if (errorNoOfDevices) setErrorNoOfDevices('');
                }}
                disabled={isFreeTrail}
                className="h-10 sm:h-11"
              />
              {errorNoOfDevices && <p className="text-red-500 text-xs">{errorNoOfDevices}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="NoOfEmployees" className="text-sm font-medium">
                Number of Employees *
              </Label>
              <Input
                id="NoOfEmployees"
                type="text"
                placeholder="Employees"
                value={NoOfEmployees}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setNoOfEmployees(value);
                  if (errorNoOfEmployees) setErrorNoOfEmployees('');
                }}
                disabled={isFreeTrail}
                className="h-10 sm:h-11"
              />
              {errorNoOfEmployees && <p className="text-red-500 text-xs">{errorNoOfEmployees}</p>}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-11 bg-[#02066F] hover:bg-[#030974] text-white font-semibold text-sm sm:text-base"
            disabled={overlayVisible}
          >
            {overlayVisible ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </form>

        <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-[#02066F] hover:underline"
          >
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-md mx-auto shadow-xl border-0 mt-20">
      <CardHeader className="space-y-2 pb-4 sm:pb-6 px-4 sm:px-6">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
          Personal Information
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Tell us about yourself
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {totalError && (
          <Alert variant="destructive" className="border-red-200">
            <AlertDescription className="text-sm">
              {totalError}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={validateForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errorFirstName) setErrorFirstName('');
                }}
  
                className="h-10 sm:h-11"
              />
              {errorFirstName && <p className="text-red-500 text-xs">{errorFirstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errorLastName) setErrorLastName('');
                }}
  
                className="h-10 sm:h-11"
              />
              {errorLastName && <p className="text-red-500 text-xs">{errorLastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorEmail) setErrorEmail('');
              }}

              className="h-10 sm:h-11"
            />
            {errorEmail && <p className="text-red-500 text-xs">{errorEmail}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              ref={phoneInputRef}
              id="phoneNumber"
              type="tel"
              placeholder="(123) 456-7890"
              value={phoneNumber}
              onInput={(e) => {
                const value = e.target.value;
                const digits = value.replace(/\D/g, '');
                
                // Get max length for selected country
                let maxLength = 10;
                if (itiRef.current) {
                  const countryCode = itiRef.current.getSelectedCountryData()?.iso2 || 'us';
                  switch (countryCode) {
                    case 'in': maxLength = 10; break;
                    case 'us': case 'ca': maxLength = 10; break;
                    case 'gb': maxLength = 11; break;
                    case 'au': maxLength = 9; break;
                    default: maxLength = 10;
                  }
                }
                
                if (digits.length > 10) return;
                
                formatPhoneNumber(value);
              }}

              maxLength="14"
              className="h-10 sm:h-11"
            />
            {errorPhone && <p className="text-red-500 text-xs">{errorPhone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerStreet" className="text-sm font-medium">
              Street Address *
            </Label>
            <Input
              id="customerStreet"
              type="text"
              placeholder="Enter street address"
              value={customerStreet}
              onChange={(e) => {
                setCustomerStreet(e.target.value);
                if (errorStreet) setErrorStreet('');
              }}
              className="h-10 sm:h-11"
            />
            {errorStreet && <p className="text-red-500 text-xs">{errorStreet}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerCity" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="customerCity"
                type="text"
                placeholder="City"
                value={customerCity}
                onChange={(e) => {
                  setCustomerCity(e.target.value);
                  if (errorCity) setErrorCity('');
                }}
                className="h-10 sm:h-11"
              />
              {errorCity && <p className="text-red-500 text-xs">{errorCity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerState" className="text-sm font-medium">
                State *
              </Label>
              <Input
                id="customerState"
                type="text"
                placeholder="State"
                value={customerState}
                onChange={(e) => {
                  setCustomerState(e.target.value);
                  if (errorState) setErrorState('');
                }}
                className="h-10 sm:h-11"
              />
              {errorState && <p className="text-red-500 text-xs">{errorState}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerZip" className="text-sm font-medium">
              Zip Code *
            </Label>
            <Input
              id="customerZip"
              type="text"
              placeholder="Enter zip code"
              value={customerZip}
              onChange={(e) => {
                setCustomerZip(e.target.value);
                if (errorZip) setErrorZip('');
              }}
              className="h-10 sm:h-11"
            />
            {errorZip && <p className="text-red-500 text-xs">{errorZip}</p>}
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex-1 h-10 sm:h-11 border-gray-300 hover:bg-gray-50 text-sm sm:text-base"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-10 sm:h-11 bg-[#02066F] hover:bg-[#030974] text-white font-semibold text-sm sm:text-base"
              disabled={overlayVisible}
            >
              {overlayVisible ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-[#02066F] hover:underline"
          >
            Sign in
          </a>
        </p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header isAuthenticated={false} />
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Left side - Brand section */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center p-6 lg:p-8 xl:p-12">
          <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 lg:space-y-8">
            {/* Brand Logo */}
            <img
              src="/images/tap-time-logo.png"
              alt="Tap-Time Logo"
              className="w-40 lg:w-48 xl:w-56 mx-auto"
            />
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                Join Tap-Time Today
              </h1>
              <p className="text-base lg:text-lg text-gray-700 leading-relaxed">
                Start your journey with our comprehensive employee time tracking solution.
              </p>
            </div>
            <div className="flex gap-4 lg:gap-8 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Easy Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Multi-Step</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="w-full lg:w-1/2 flex justify-center items-start lg:items-center min-h-screen py-4 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20">
          <div className="w-full mt-16 lg:mt-0">
            {currentStep === 1 ? renderStep1() : renderStep2()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;