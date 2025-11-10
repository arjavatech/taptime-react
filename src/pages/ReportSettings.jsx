import React, { useState, useEffect } from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  Settings, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Search,
  Grid3X3,
  Table
} from "lucide-react"

const ReportSettings = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSettings, setEmailSettings] = useState([
    {
      id: 1,
      email: "admin@company.com",
      frequencies: ["Weekly", "Monthly"]
    },
    {
      id: 2,
      email: "hr@company.com", 
      frequencies: ["Daily"]
    }
  ])
  const [viewSettings, setViewSettings] = useState(["Weekly"])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewEditModal, setShowViewEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentSetting, setCurrentSetting] = useState(null)
  const [newEmail, setNewEmail] = useState("")
  const [newFrequencies, setNewFrequencies] = useState([])
  const [editFrequencies, setEditFrequencies] = useState([])
  const [tempViewSettings, setTempViewSettings] = useState([])
  const [emailError, setEmailError] = useState("")
  const [frequencyError, setFrequencyError] = useState("")
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("table") // table, grid
  const [sortConfig, setSortConfig] = useState({ key: "email", direction: "asc" })

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && viewMode === "table") { // lg breakpoint
        setViewMode("grid") // Only auto-switch if currently on table view
      }
    }

    // Set initial view mode to grid on mobile
    if (window.innerWidth < 1024) {
      setViewMode("grid")
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const frequencies = ["Daily", "Weekly", "Biweekly", "Monthly", "Bimonthly"]

  const getFilteredAndSortedSettings = () => {
    let filtered = emailSettings
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(setting =>
        setting.email.toLowerCase().includes(query) ||
        setting.frequencies.some(freq => freq.toLowerCase().includes(query))
      )
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue
      if (sortConfig.key === "email") {
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "frequency") {
        aValue = a.frequencies[0]?.toLowerCase() || ""
        bValue = b.frequencies[0]?.toLowerCase() || ""
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      return 0
    })
    
    return filtered
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000)
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      setEmailError("Email is required")
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }

  const validateFrequencies = (freqs) => {
    if (freqs.length === 0) {
      setFrequencyError("Please select at least one frequency")
      return false
    }
    if (freqs.length > 2) {
      setFrequencyError("Maximum 2 frequencies allowed")
      return false
    }
    setFrequencyError("")
    return true
  }

  const openAddModal = () => {
    setNewEmail("")
    setNewFrequencies([])
    setEmailError("")
    setFrequencyError("")
    setShowAddModal(true)
  }

  const openEditModal = (setting) => {
    setCurrentSetting(setting)
    setNewEmail(setting.email)
    setEditFrequencies([...setting.frequencies])
    setEmailError("")
    setFrequencyError("")
    setShowEditModal(true)
  }

  const openViewEditModal = () => {
    setTempViewSettings([...viewSettings])
    setShowViewEditModal(true)
  }

  const openDeleteModal = (setting) => {
    setCurrentSetting(setting)
    setShowDeleteModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowViewEditModal(false)
    setShowDeleteModal(false)
    setCurrentSetting(null)
    setNewEmail("")
    setNewFrequencies([])
    setEditFrequencies([])
    setTempViewSettings([])
    setEmailError("")
    setFrequencyError("")
  }

  const toggleFrequency = (freq, isEdit = false) => {
    const currentFreqs = isEdit ? editFrequencies : newFrequencies
    const setFreqs = isEdit ? setEditFrequencies : setNewFrequencies
    
    if (currentFreqs.includes(freq)) {
      setFreqs(currentFreqs.filter(f => f !== freq))
    } else if (currentFreqs.length < 2) {
      setFreqs([...currentFreqs, freq])
    }
    setFrequencyError("")
  }

  const toggleViewFrequency = (freq) => {
    if (tempViewSettings.includes(freq)) {
      setTempViewSettings([])
    } else {
      setTempViewSettings([freq])
    }
  }

  const saveEmailSetting = () => {
    if (!validateEmail(newEmail) || !validateFrequencies(newFrequencies)) return

    const newSetting = {
      id: Date.now(),
      email: newEmail.trim(),
      frequencies: [...newFrequencies]
    }

    setEmailSettings([...emailSettings, newSetting])
    showToast("Email setting added successfully!")
    closeModals()
  }

  const updateEmailSetting = () => {
    if (!validateEmail(newEmail) || !validateFrequencies(editFrequencies)) return

    setEmailSettings(emailSettings.map(setting => 
      setting.id === currentSetting.id 
        ? { ...setting, email: newEmail.trim(), frequencies: [...editFrequencies] }
        : setting
    ))
    showToast("Email setting updated successfully!")
    closeModals()
  }

  const deleteEmailSetting = () => {
    setEmailSettings(emailSettings.filter(setting => setting.id !== currentSetting.id))
    showToast("Email setting deleted successfully!")
    closeModals()
  }

  const updateViewSettings = () => {
    if (tempViewSettings.length === 0) {
      showToast("Please select one frequency", "error")
      return
    }
    const newSettings = [...tempViewSettings]
    setViewSettings(newSettings)
    
    // Save to localStorage and notify other components
    localStorage.setItem('reportViewSettings', JSON.stringify(newSettings))
    window.dispatchEvent(new CustomEvent('reportSettingsUpdated'))
    
    showToast("View settings updated successfully!")
    closeModals()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:right-4 sm:left-auto z-50 animate-in slide-in-from-top-2">
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

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                  Report Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure email notifications and report frequencies
                </p>
              </div>
              <Button onClick={openAddModal} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Setting</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Search and Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search email settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-')
                    setSortConfig({ key, direction })
                  }}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 sm:flex-none"
                >
                  <option value="email-asc">Email A-Z</option>
                  <option value="email-desc">Email Z-A</option>
                  <option value="frequency-asc">Frequency A-Z</option>
                  <option value="frequency-desc">Frequency Z-A</option>
                </select>
                
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className="h-8 w-8 p-0"
                  >
                    <Table className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Report Settings
              </CardTitle>
              <CardDescription>
                Configure email addresses and their report frequencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredAndSortedSettings().length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Mail className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No email settings found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-4">
                    {searchQuery ? "Try adjusting your search criteria." : "Get started by adding your first email setting."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={openAddModal} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Add Email Setting
                    </Button>
                  )}
                </div>
              ) : (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {getFilteredAndSortedSettings().map((setting) => (
                      <Card key={setting.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <CardTitle className="text-base sm:text-lg truncate">{setting.email}</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Email Setting</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(setting)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(setting)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4 pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Frequencies</span>
                            <div className="flex gap-1 flex-wrap">
                              {setting.frequencies.map((freq) => (
                                <span key={freq} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {freq}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead className="bg-[#02066F] text-white">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Email Address</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Frequency</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getFilteredAndSortedSettings().map((setting) => (
                          <tr key={setting.id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-xs sm:text-sm">{setting.email}</td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                                {setting.frequencies.map((freq) => (
                                  <span key={freq} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {freq}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                              <div className="flex gap-1 sm:gap-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(setting)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(setting)}
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* View Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Report View Settings
              </CardTitle>
              <CardDescription>
                Configure default report frequencies for viewing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg">
                  <thead className="bg-[#02066F] text-white">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Current Frequencies</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
                          {viewSettings.length === 0 ? (
                            <span className="text-muted-foreground text-xs sm:text-sm">No frequencies selected</span>
                          ) : (
                            viewSettings.map((freq) => (
                              <span key={freq} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {freq}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openViewEditModal}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Configure email notifications for reports
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`text-sm ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Frequency * (Max 2)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.map((freq) => (
                    <Button
                      key={freq}
                      variant={newFrequencies.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFrequency(freq)}
                      disabled={!newFrequencies.includes(freq) && newFrequencies.length >= 2}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
                {frequencyError && <p className="text-sm text-red-600">{frequencyError}</p>}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEmailSetting}
                  className="flex-1 order-1 sm:order-2"
                >
                  Save Setting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Update email notification settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`text-sm ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Frequency * (Max 2)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.map((freq) => (
                    <Button
                      key={freq}
                      variant={editFrequencies.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFrequency(freq, true)}
                      disabled={!editFrequencies.includes(freq) && editFrequencies.length >= 2}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
                {frequencyError && <p className="text-sm text-red-600">{frequencyError}</p>}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateEmailSetting}
                  className="flex-1 order-1 sm:order-2"
                >
                  Update Setting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Edit Modal */}
      {showViewEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Edit View Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Configure default report viewing frequencies
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select One Frequency</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.filter(f => f !== "Daily").map((freq) => (
                    <Button
                      key={freq}
                      variant={tempViewSettings.includes(freq) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleViewFrequency(freq)}
                      className="text-sm"
                    >
                      {freq}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateViewSettings}
                  className="flex-1 order-1 sm:order-2"
                >
                  Update Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                <AlertCircle className="w-5 h-5" />
                Delete Email Setting
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete the email setting for "{currentSetting?.email}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={closeModals}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteEmailSetting}
                  className="flex-1 order-1 sm:order-2"
                >
                  Delete Setting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ReportSettings