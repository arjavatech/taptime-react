import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api.js';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, MapPin, CheckCircle, XCircle } from "lucide-react";
import tabtimelogo from "../assets/images/tap-time-logo.png";


const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Form data state
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: null,
    companyStreet: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    noOfDevices: '',
    noOfEmployees: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerStreet: '',
    customerCity: '',
    customerState: '',
    customerZip: '',
    password: '',
    confirmPassword: ''
  });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Only allow numbers for device, employee count, and zip code fields
    if ((name === 'noOfDevices' || name === 'noOfEmployees' || name === 'companyZip' || name === 'customerZip') && value && !/^\d+$/.test(value)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        companyLogo: file
      }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';

    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }

    setFormData(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  const validateStep1 = () => {
    const { companyName, companyStreet, companyCity, companyState, companyZip, noOfDevices, noOfEmployees } = formData;

    if (!companyName.trim()) {
      showToast('Company name is required', 'error');
      return false;
    }
    if (!companyStreet.trim()) {
      showToast('Street address is required', 'error');
      return false;
    }
    if (!companyCity.trim()) {
      showToast('City is required', 'error');
      return false;
    }
    if (!companyState.trim()) {
      showToast('State is required', 'error');
      return false;
    }
    if (!companyZip.trim()) {
      showToast('Zip code is required', 'error');
      return false;
    }
    if (!noOfDevices || Number(noOfDevices) <= 0) {
      showToast('Number of devices must be greater than 0', 'error');
      return false;
    }
    if (!noOfEmployees || Number(noOfEmployees) <= 0) {
      showToast('Number of employees must be greater than 0', 'error');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const { firstName, lastName, email, phone, customerStreet, customerCity, customerState, customerZip, password, confirmPassword } = formData;

    if (!firstName.trim()) {
      showToast('First name is required', 'error');
      return false;
    }
    if (!lastName.trim()) {
      showToast('Last name is required', 'error');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Valid email address is required', 'error');
      return false;
    }
    if (!phone.trim()) {
      showToast('Phone number is required', 'error');
      return false;
    }
    if (!customerStreet.trim()) {
      showToast('Street address is required', 'error');
      return false;
    }
    if (!customerCity.trim()) {
      showToast('City is required', 'error');
      return false;
    }
    if (!customerState.trim()) {
      showToast('State is required', 'error');
      return false;
    }
    if (!customerZip.trim()) {
      showToast('Zip code is required', 'error');
      return false;
    }
    if (!password.trim() || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return false;
    }

    return true;
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
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      const response = await registerUser(submitData);

      if (response.success) {
        showToast('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showToast(response.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast('Registration failed. Please try again.', 'error');
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
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyLogo">Company Logo</Label>
            <Input
              id="companyLogo"
              name="companyLogo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
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
                className="pl-10"
                required
              />
            </div>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyState">State *</Label>
              <Input
                id="companyState"
                name="companyState"
                placeholder="State"
                value={formData.companyState}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyZip">Zip Code *</Label>
            <Input
              type="text"
              id="companyZip"
              name="companyZip"
              placeholder="Enter zip code"
              value={formData.companyZip}
              onChange={handleInputChange}
              required
            />
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
                onChange={handleInputChange}
                required
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
                required
              />
            </div>
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
                  className="pl-10"
                  required
                />
              </div>
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
                  className="pl-10"
                  required
                />
              </div>
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
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(123) 456-7890"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="pl-10"
                required
              />
            </div>
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
                className="pl-10"
                required
              />
            </div>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerState">State *</Label>
              <Input
                id="customerState"
                name="customerState"
                placeholder="State"
                value={formData.customerState}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerZip">Zip Code *</Label>
            <Input
              id="customerZip"
              name="customerZip"
              placeholder="Enter zip code"
              value={formData.customerZip}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
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

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={tabtimelogo} alt="TabTime Logo" className="mx-auto h-20 w-auto sm:h-25" />
          </div>

          {/* Progress Indicator */}
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

          {currentStep === 1 ? renderStep1() : renderStep2()}

          <div className="text-center mt-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;