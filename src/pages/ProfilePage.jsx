import React, { useState, useEffect } from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { mockUserProfile, mockCompanyData, mockCustomerData, delay } from "../data/mockData"
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState({ personal: false, company: false })
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    logo: "",
    description: ""
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    setIsLoading(true)
    try {
      await delay(500) // Simulate API call
      
      // Load personal data
      const customerAddress = mockCustomerData.address.split("--")
      setPersonalData({
        firstName: mockCustomerData.firstName,
        lastName: mockCustomerData.lastName,
        email: mockCustomerData.email,
        phone: mockCustomerData.phone,
        address: customerAddress[0] || "",
        city: customerAddress[1] || "",
        state: customerAddress[2] || "",
        zipCode: customerAddress[3] || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      // Load company data
      const companyAddress = mockCompanyData.companyAddress.split("--")
      setCompanyData({
        name: mockCompanyData.companyName,
        address: companyAddress[0] || "",
        city: companyAddress[1] || "",
        state: companyAddress[2] || "",
        zipCode: companyAddress[3] || "",
        logo: mockCompanyData.companyLogo,
        description: "Leading provider of innovative time tracking solutions for modern businesses."
      })
    } catch (error) {
      showToast("Failed to load profile data", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000)
  }

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    let formatted = ''
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    } else if (digits.length > 0) {
      formatted = `(${digits}`
    }
    return formatted
  }

  const handlePersonalInputChange = (field, value) => {
    if (field === "phone") {
      value = formatPhoneNumber(value)
    }
    setPersonalData(prev => ({ ...prev, [field]: value }))
  }

  const handleCompanyInputChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCompanyData(prev => ({ ...prev, logo: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validatePersonalForm = () => {
    if (!personalData.firstName.trim()) {
      showToast("First name is required", "error")
      return false
    }
    if (!personalData.lastName.trim()) {
      showToast("Last name is required", "error")
      return false
    }
    if (!personalData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      showToast("Valid email is required", "error")
      return false
    }
    if (showPasswordFields) {
      if (!personalData.currentPassword) {
        showToast("Current password is required", "error")
        return false
      }
      if (!personalData.newPassword || personalData.newPassword.length < 6) {
        showToast("New password must be at least 6 characters", "error")
        return false
      }
      if (personalData.newPassword !== personalData.confirmPassword) {
        showToast("Passwords do not match", "error")
        return false
      }
    }
    return true
  }

  const validateCompanyForm = () => {
    if (!companyData.name.trim()) {
      showToast("Company name is required", "error")
      return false
    }
    return true
  }

  const handleSavePersonal = async () => {
    if (!validatePersonalForm()) return

    setIsLoading(true)
    try {
      await delay(1000) // Simulate API call
      setIsEditing(prev => ({ ...prev, personal: false }))
      setShowPasswordFields(false)
      setPersonalData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
      showToast("Personal information updated successfully!")
    } catch (error) {
      showToast("Failed to update personal information", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    if (!validateCompanyForm()) return

    setIsLoading(true)
    try {
      await delay(1000) // Simulate API call
      setIsEditing(prev => ({ ...prev, company: false }))
      showToast("Company information updated successfully!")
    } catch (error) {
      showToast("Failed to update company information", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = (type) => {
    setIsEditing(prev => ({ ...prev, [type]: false }))
    if (type === "personal") {
      setShowPasswordFields(false)
      setPersonalData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
    }
    loadProfileData() // Reset to original data
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg p-6 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </div>
              </div>
            )}

      <div className="pt-20 pb-8 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profile Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account and company information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
              {[
                { key: "personal", label: "Personal Information", icon: User },
                { key: "company", label: "Company Information", icon: Building }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key === "personal" ? "Personal" : "Company"}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {activeTab === "personal" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and account settings
                    </CardDescription>
                  </div>
                  {!isEditing.personal && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, personal: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="firstName"
                        value={personalData.firstName}
                        onChange={(e) => handlePersonalInputChange("firstName", e.target.value)}
                        disabled={!isEditing.personal}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="lastName"
                        value={personalData.lastName}
                        onChange={(e) => handlePersonalInputChange("lastName", e.target.value)}
                        disabled={!isEditing.personal}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) => handlePersonalInputChange("email", e.target.value)}
                        disabled={!isEditing.personal}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="phone"
                        value={personalData.phone}
                        onChange={(e) => handlePersonalInputChange("phone", e.target.value)}
                        disabled={!isEditing.personal}
                        className="pl-10"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="address"
                        value={personalData.address}
                        onChange={(e) => handlePersonalInputChange("address", e.target.value)}
                        disabled={!isEditing.personal}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={personalData.city}
                      onChange={(e) => handlePersonalInputChange("city", e.target.value)}
                      disabled={!isEditing.personal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={personalData.state}
                      onChange={(e) => handlePersonalInputChange("state", e.target.value)}
                      disabled={!isEditing.personal}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={personalData.zipCode}
                      onChange={(e) => handlePersonalInputChange("zipCode", e.target.value)}
                      disabled={!isEditing.personal}
                    />
                  </div>
                </div>

                
                {isEditing.personal && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleCancel("personal")}
                      className="flex-1 order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePersonal}
                      className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "company" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Information
                    </CardTitle>
                    <CardDescription>
                      Manage your company details and branding
                    </CardDescription>
                  </div>
                  {!isEditing.company && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(prev => ({ ...prev, company: true }))}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Company Logo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {companyData.logo ? (
                        <img src={companyData.logo} alt="Company Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    {isEditing.company && (
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                        <Camera className="w-4 h-4 text-primary-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Company Logo</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a logo for your company. Recommended size: 200x200px
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="companyName"
                        value={companyData.name}
                        onChange={(e) => handleCompanyInputChange("name", e.target.value)}
                        disabled={!isEditing.company}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Street Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="companyAddress"
                        value={companyData.address}
                        onChange={(e) => handleCompanyInputChange("address", e.target.value)}
                        disabled={!isEditing.company}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCity">City</Label>
                    <Input
                      id="companyCity"
                      value={companyData.city}
                      onChange={(e) => handleCompanyInputChange("city", e.target.value)}
                      disabled={!isEditing.company}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyState">State</Label>
                    <Input
                      id="companyState"
                      value={companyData.state}
                      onChange={(e) => handleCompanyInputChange("state", e.target.value)}
                      disabled={!isEditing.company}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyZipCode">Zip Code</Label>
                    <Input
                      id="companyZipCode"
                      value={companyData.zipCode}
                      onChange={(e) => handleCompanyInputChange("zipCode", e.target.value)}
                      disabled={!isEditing.company}
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    value={companyData.description}
                    onChange={(e) => handleCompanyInputChange("description", e.target.value)}
                    disabled={!isEditing.company}
                    rows={4}
                    placeholder="Tell us about your company..."
                  />
                </div> */}

                {isEditing.company && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleCancel("company")}
                      className="flex-1 order-2 sm:order-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCompany}
                      className="flex-1 flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ProfilePage