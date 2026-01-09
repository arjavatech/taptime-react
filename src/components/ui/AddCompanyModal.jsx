import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Building, MapPin, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useZipLookup } from '../../hooks';
import { addNewCompany } from '../../api';

const AddCompanyModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFileName, setLogoFileName] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    companyName: '',
    companyStreet: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    reportType: 'Daily',
    noOfDevices: '1',
    noOfEmployees: '',
  });

  // Employment type tag input states
  const [employmentTypes, setEmploymentTypes] = useState(['General Employee']);
  const [employmentTypeInput, setEmploymentTypeInput] = useState('');

  // Error states
  const [errors, setErrors] = useState({
    companyName: '',
    companyStreet: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    noOfDevices: '',
    noOfEmployees: '',
  });

  // ZIP code auto-fill callback
  const handleZipResult = useCallback((result) => {
    setFormData(prev => ({
      ...prev,
      companyCity: result.city,
      companyState: result.state
    }));
    setErrors(prev => ({
      ...prev,
      companyCity: '',
      companyState: ''
    }));
  }, []);

  // ZIP code lookup hook
  const { isLoading: zipLoading } = useZipLookup(formData.companyZip, handleZipResult);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Only allow numbers for device and employee count fields
    if ((name === 'noOfDevices' || name === 'noOfEmployees') && value && !/^\d+$/.test(value)) {
      return;
    }
    // Restrict zip codes to 5 digits only
    if (name === 'companyZip' && value && !/^\d{0,5}$/.test(value)) {
      return;
    }

    // Auto-capitalize first character for text fields (exclude numeric fields)
    let processedValue = value;
    const numericFields = ['noOfDevices', 'noOfEmployees', 'companyZip'];

    if (!numericFields.includes(name) && processedValue.length > 0) {
      processedValue = processedValue.charAt(0).toUpperCase() + processedValue.slice(1);
    }

    // Clear errors when user types
    setErrors(prev => ({ ...prev, [name]: '' }));

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
        setErrors(prev => ({ ...prev, companyLogo: 'Please upload a valid image file (JPEG or PNG)' }));
        return;
      }
      setErrors(prev => ({ ...prev, companyLogo: '' }));
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

  const handleEmploymentTypeKeyDown = (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const value = employmentTypeInput.trim();
      const capitalizedValue = value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

      if (capitalizedValue && !employmentTypes.includes(capitalizedValue)) {
        setEmploymentTypes(prev => [...prev, capitalizedValue]);
      }
      setEmploymentTypeInput('');
    }
  };

  const handleRemoveEmploymentType = (typeToRemove) => {
    // Don't allow removing if it's the last one
    if (employmentTypes.length === 1) return;

    setEmploymentTypes(prev => prev.filter(type => type !== typeToRemove));
  };

  const validateForm = () => {
    const { companyName, companyStreet, companyCity, companyState, companyZip, noOfDevices, noOfEmployees } = formData;

    // Clear previous errors
    setErrors({
      companyName: '',
      companyStreet: '',
      companyCity: '',
      companyState: '',
      companyZip: '',
      noOfDevices: '',
      noOfEmployees: '',
    });

    let hasErrors = false;
    const newErrors = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
      hasErrors = true;
    }
    if (!companyStreet.trim()) {
      newErrors.companyStreet = 'Company street address is required';
      hasErrors = true;
    }
    if (!companyCity.trim()) {
      newErrors.companyCity = 'Company city is required';
      hasErrors = true;
    }
    if (!companyState.trim()) {
      newErrors.companyState = 'Company state is required';
      hasErrors = true;
    }
    if (!companyZip.trim()) {
      newErrors.companyZip = 'Company zip code is required';
      hasErrors = true;
    } else if (!/^\d{5}$/.test(companyZip)) {
      newErrors.companyZip = 'Company zip code must be exactly 5 digits';
      hasErrors = true;
    }
    if (!noOfDevices || Number(noOfDevices) <= 0) {
      newErrors.noOfDevices = 'Number of devices must be greater than 0';
      hasErrors = true;
    }
    if (!noOfEmployees || Number(noOfEmployees) <= 0) {
      newErrors.noOfEmployees = 'Number of employees must be greater than 0';
      hasErrors = true;
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const userEmail = localStorage.getItem('adminMail') || localStorage.getItem('email') || '';

      // Get customer contact and address data from localStorage
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';
      const email = localStorage.getItem('email') || localStorage.getItem('adminMail') || '';
      const phoneNumber = localStorage.getItem('phoneNumber') || localStorage.getItem('phone') || '';
      const customerAddress = localStorage.getItem('customerAddress1') || localStorage.getItem('address') || '';
      const customerCity = localStorage.getItem('customerCity') || '';
      const customerState = localStorage.getItem('customerState') || '';
      const customerZip = localStorage.getItem('customerZipCode') || '';

      // Create company data object matching API specification
      const companyData = {
        company_name: formData.companyName,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phoneNumber,
        company_address_line1: formData.companyStreet,
        company_city: formData.companyCity,
        company_state: formData.companyState,
        company_zip_code: formData.companyZip,
        customer_address_line1: customerAddress,
        customer_city: customerCity,
        customer_state: customerState,
        customer_zip_code: customerZip,
        report_type: formData.reportType,
        device_count: parseInt(formData.noOfDevices, 10),
        employee_count: parseInt(formData.noOfEmployees, 10),
        employment_type: employmentTypes.join(','),
        last_modified_by: userEmail
      };

      // Call the API to add the company
      await addNewCompany(companyData, logoFile);

      setSuccess('Company added successfully!');

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);

    } catch (error) {
      setError(error.message || 'Failed to add company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      companyName: '',
      companyStreet: '',
      companyCity: '',
      companyState: '',
      companyZip: '',
      reportType: 'Daily',
      noOfDevices: '1',
      noOfEmployees: '',
    });
    setEmploymentTypes(['General Employee']);
    setEmploymentTypeInput('');
    setLogoFileName('');
    setLogoFile(null);
    setErrors({});
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">Add New Company</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter company information to create a new company
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-xs sm:text-sm font-medium">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`text-xs sm:text-sm ${errors.companyName ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                {errors.companyName && (
                  <p className="text-red-600 text-xs mt-1">{errors.companyName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyLogo" className="text-xs sm:text-sm font-medium">Company Logo</Label>
                {formData.companyLogo ? (
                  <div className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                    <img
                      src={formData.companyLogo}
                      alt="Company Logo Preview"
                      className="w-12 h-12 object-cover rounded"
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
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Company Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyStreet" className="text-xs sm:text-sm font-medium">Street Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="companyStreet"
                      name="companyStreet"
                      placeholder="Street address"
                      value={formData.companyStreet}
                      onChange={handleInputChange}
                      className={`pl-10 ${errors.companyStreet ? 'border-red-500 focus:border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {errors.companyStreet && (
                    <p className="text-red-600 text-xs mt-1">{errors.companyStreet}</p>
                  )}
                </div>


                <div className="space-y-2">
                  <Label htmlFor="companyCity" className="text-xs sm:text-sm font-medium">City *</Label>
                  <Input
                    id="companyCity"
                    name="companyCity"
                    placeholder="City"
                    value={formData.companyCity}
                    onChange={handleInputChange}
                    className={errors.companyCity ? 'border-red-500 focus:border-red-500' : ''}
                    required
                  />
                  {errors.companyCity && (
                    <p className="text-red-600 text-xs mt-1">{errors.companyCity}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyState" className="text-xs sm:text-sm font-medium">State *</Label>
                  <Input
                    id="companyState"
                    name="companyState"
                    placeholder="State"
                    value={formData.companyState}
                    onChange={handleInputChange}
                    className={errors.companyState ? 'border-red-500 focus:border-red-500' : ''}
                    required
                  />
                  {errors.companyState && (
                    <p className="text-red-600 text-xs mt-1">{errors.companyState}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyZip" className="text-xs sm:text-sm font-medium">Zip Code *</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="companyZip"
                      name="companyZip"
                      placeholder="Zip code"
                      value={formData.companyZip}
                      onChange={handleInputChange}
                      className={errors.companyZip ? 'border-red-500 focus:border-red-500' : ''}
                      maxLength={5}
                      required
                    />
                    {zipLoading && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {errors.companyZip && (
                    <p className="text-red-600 text-xs mt-1">{errors.companyZip}</p>
                  )}
                </div>
              </div>


            </div>

            <div className="space-y-2">
              <Label htmlFor="reportType" className="text-xs sm:text-sm font-medium">Report Type *</Label>
              <select
                id="reportType"
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-xs sm:text-sm"
                required
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noOfDevices" className="text-xs sm:text-sm font-medium">Number of Devices *</Label>
                <Input
                  id="noOfDevices"
                  name="noOfDevices"
                  type="text"
                  placeholder="# Devices"
                  value={formData.noOfDevices}
                  onChange={handleInputChange}
                  className={errors.noOfDevices ? 'border-red-500 focus:border-red-500' : ''}
                  required
                />
                {errors.noOfDevices && (
                  <p className="text-red-600 text-xs mt-1">{errors.noOfDevices}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="noOfEmployees" className="text-xs sm:text-sm font-medium">Number of Employees *</Label>
                <Input
                  id="noOfEmployees"
                  name="noOfEmployees"
                  type="text"
                  placeholder="Employees"
                  value={formData.noOfEmployees}
                  onChange={handleInputChange}
                  className={errors.noOfEmployees ? 'border-red-500 focus:border-red-500' : ''}
                  required
                />
                {errors.noOfEmployees && (
                  <p className="text-red-600 text-xs mt-1">{errors.noOfEmployees}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-xs sm:text-sm font-medium">Employment Types</Label>
              <div className="border border-textMuted rounded-md p-3 min-h-[44px] flex flex-wrap gap-2 items-center focus-within:ring-1 focus-within:ring-textMuted focus-within:border-textMuted">
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
                  placeholder={employmentTypes.length === 0 ? "Type and press comma" : "Add more..."}
                  className="flex-1 min-w-[120px] outline-none text-xs sm:text-sm bg-transparent"
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Type employment type and press comma to add. Default: General Employee</p>
            </div>

            {/* Success message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 order-1 sm:order-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Adding Company..." : "Add Company"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCompanyModal;