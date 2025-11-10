import React, { useState, useEffect } from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { mockEmployeeData, delay } from "../data/mockData"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  Crown,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Grid3X3,
  List,
  ArrowUpDown,
  Table,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

const EmployeePage = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [paginatedEmployees, setPaginatedEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("employees") // employees, admins, superadmins
  const [isLoading, setIsLoading] = useState(true)
  const [isAddLoading, setIsAddLoading] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [viewMode, setViewMode] = useState("table") // table, grid
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const getItemsPerPage = () => {
    return (viewMode === "grid" || window.innerWidth < 1024) ? 5 : 10
  }

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    pin: "",
    isAdmin: 0 // 0 = Employee, 1 = Admin, 2 = SuperAdmin
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchQuery, activeTab, sortConfig, currentPage, viewMode])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, activeTab, sortConfig])

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

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when view mode changes
  }, [viewMode])

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      await delay(500) // Simulate API call
      setEmployees(mockEmployeeData)
    } catch (error) {
      showToast("Failed to load employees", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = employees

    // Filter by type
    if (activeTab === "employees") {
      filtered = filtered.filter(emp => emp.is_admin === 0)
    } else if (activeTab === "admins") {
      filtered = filtered.filter(emp => emp.is_admin === 1)
    } else if (activeTab === "superadmins") {
      filtered = filtered.filter(emp => emp.is_admin === 2)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.first_name.toLowerCase().includes(query) ||
        emp.last_name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.pin.includes(query)
      )
    }

    // Sort employees
    filtered.sort((a, b) => {
      let aValue, bValue
      if (sortConfig.key === "name") {
        aValue = (a.Name || `${a.first_name} ${a.last_name}`).toLowerCase()
        bValue = (b.Name || `${b.first_name} ${b.last_name}`).toLowerCase()
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "role") {
        return sortConfig.direction === "asc" ? a.is_admin - b.is_admin : b.is_admin - a.is_admin
      } else if (sortConfig.key === "status") {
        return sortConfig.direction === "asc" ? a.is_active - b.is_active : b.is_active - a.is_active
      }
      return 0
    })

    setFilteredEmployees(filtered)

    // Paginate results
    const itemsPerPage = getItemsPerPage()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedEmployees(filtered.slice(startIndex, endIndex))
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

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      phone: formatted,
      pin: formatted.slice(-4) // Auto-generate PIN from last 4 digits
    }))
  }

  const generateEmployeeId = () => {
    return `EMP${String(employees.length + 1).padStart(3, '0')}`
  }

  const handleAddEmployee = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast("First name and last name are required", "error")
      return
    }

    setIsAddLoading(true)
    try {
      await delay(1000) // Simulate API call

      const newEmployee = {
        emp_id: generateEmployeeId(),
        EmpID: generateEmployeeId(),
        pin: formData.pin,
        Pin: formData.pin,
        first_name: formData.firstName,
        FName: formData.firstName,
        last_name: formData.lastName,
        LName: formData.lastName,
        Name: `${formData.firstName} ${formData.lastName}`,
        phone_number: formData.phone.replace(/\D/g, ''),
        PhoneNumber: formData.phone,
        email: formData.email,
        Email: formData.email,
        is_admin: formData.isAdmin,
        IsAdmin: formData.isAdmin,
        is_active: true,
        IsActive: true,
        c_id: "COMP001",
        CID: "COMP001",
        last_modified_by: "Admin"
      }

      setEmployees(prev => [...prev, newEmployee])
      setShowAddModal(false)
      resetForm()
      showToast("Employee added successfully!")
    } catch (error) {
      showToast("Failed to add employee", "error")
    } finally {
      setIsAddLoading(false)
    }
  }

  const handleEditEmployee = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      showToast("First name and last name are required", "error")
      return
    }

    setIsAddLoading(true)
    try {
      await delay(1000) // Simulate API call

      setEmployees(prev => prev.map(employee =>
        employee.emp_id === editingEmployee.emp_id
          ? {
            ...employee,
            first_name: formData.firstName,
            FName: formData.firstName,
            last_name: formData.lastName,
            LName: formData.lastName,
            Name: `${formData.firstName} ${formData.lastName}`,
            phone_number: formData.phone.replace(/\D/g, ''),
            PhoneNumber: formData.phone,
            email: formData.email,
            Email: formData.email,
            pin: formData.pin,
            Pin: formData.pin,
            is_admin: formData.isAdmin,
            IsAdmin: formData.isAdmin,
            last_modified_by: "Admin"
          }
          : employee
      ))

      setEditingEmployee(null)
      setShowAddModal(false)
      resetForm()
      showToast("Employee updated successfully!")
    } catch (error) {
      showToast("Failed to update employee", "error")
    } finally {
      setIsAddLoading(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setIsDeleteLoading(true)
    try {
      await delay(1000) // Simulate API call

      setEmployees(prev => prev.filter(employee => employee.emp_id !== employeeToDelete.emp_id))
      setShowDeleteModal(false)
      setEmployeeToDelete(null)
      showToast("Employee deleted successfully!")
    } catch (error) {
      showToast("Failed to delete employee", "error")
    } finally {
      setIsDeleteLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      pin: "",
      isAdmin: activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0
    })
  }

  const openAddModal = (adminLevel = 0) => {
    setEditingEmployee(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      pin: "",
      isAdmin: adminLevel
    })
    setShowAddModal(true)
  }

  const openEditModal = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email || "",
      phone: employee.PhoneNumber || "",
      pin: employee.pin,
      isAdmin: employee.is_admin
    })
    setShowAddModal(true)
  }

  const openDeleteModal = (employee) => {
    setEmployeeToDelete(employee)
    setShowDeleteModal(true)
  }

  const getEmployeeTypeIcon = (isAdmin) => {
    if (isAdmin === 2) return <Crown className="w-4 h-4 text-yellow-600" />
    if (isAdmin === 1) return <Shield className="w-4 h-4 text-blue-600" />
    return <User className="w-4 h-4 text-gray-600" />
  }

  const getEmployeeTypeBadge = (isAdmin) => {
    if (isAdmin === 2) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Super Admin</span>
    if (isAdmin === 1) return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin</span>
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Employee</span>
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:right-4 sm:left-auto z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${toast.type === 'success'
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

      <div className="pt-20 pb-8 flex-1 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Employee Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage employees, admins, and super admins
                </p>
              </div>
              <Button
                onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span className="truncate">Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { key: "employees", label: "Employees", icon: Users },
                { key: "admins", label: "Admins", icon: Shield },
                { key: "superadmins", label: "Super Admins", icon: Crown }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                    }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{key === "superadmins" ? "Super" : label}</span>
                  <span className="ml-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted text-muted-foreground text-xs rounded-full">
                    {employees.filter(emp =>
                      key === "employees" ? emp.is_admin === 0 :
                        key === "admins" ? emp.is_admin === 1 :
                          emp.is_admin === 2
                    ).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search employees..."
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
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="role-asc">Role: Employee First</option>
                <option value="role-desc">Role: Admin First</option>
                <option value="status-asc">Status: Inactive First</option>
                <option value="status-desc">Status: Active First</option>
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

        {/* Employee List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {filteredEmployees.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  No {activeTab === "admins" ? "admins" : activeTab === "superadmins" ? "super admins" : "employees"} found
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery ? "Try adjusting your search criteria." : "Get started by adding your first employee."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => openAddModal(activeTab === "admins" ? 1 : activeTab === "superadmins" ? 2 : 0)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add {activeTab === "admins" ? "Admin" : activeTab === "superadmins" ? "Super Admin" : "Employee"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedEmployees.map((employee) => (
                  <Card key={employee.emp_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            {getEmployeeTypeIcon(employee.is_admin)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {employee.Name || `${employee.first_name} ${employee.last_name}`}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              PIN: {employee.pin}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(employee)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(employee)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-muted-foreground">Role</span>
                        {getEmployeeTypeBadge(employee.is_admin)}
                      </div>

                      {employee.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}

                      {employee.PhoneNumber && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                          <span>{employee.PhoneNumber}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {employee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#01005a' }}>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium text-sm text-white">Employee</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Role</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Contact</th>
                        <th className="text-left p-4 font-medium text-sm text-white">Status</th>
                        <th className="text-right p-4 font-medium text-sm text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((employee) => (
                        <tr key={employee.emp_id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                {getEmployeeTypeIcon(employee.is_admin)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {employee.Name || `${employee.first_name} ${employee.last_name}`}
                                </div>
                                <div className="text-xs text-muted-foreground">PIN: {employee.pin}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {getEmployeeTypeBadge(employee.is_admin)}
                          </td>
                          <td className="p-4">
                            <div className="text-sm space-y-1">
                              {employee.email && <div>{employee.email}</div>}
                              {employee.PhoneNumber && <div className="text-muted-foreground">{employee.PhoneNumber}</div>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(employee)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(employee)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )
          )}

          {/* Pagination */}
          {(() => {
            const itemsPerPage = getItemsPerPage()
            return filteredEmployees.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                  <span className="hidden sm:inline">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees</span>
                  <span className="sm:hidden">{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}</span>
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium px-2 sm:px-3">
                    {currentPage} of {Math.ceil(filteredEmployees.length / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredEmployees.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredEmployees.length / itemsPerPage)}
                    className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                {editingEmployee ? "Edit" : "Add"} {
                  formData.isAdmin === 2 ? "Super Admin" :
                    formData.isAdmin === 1 ? "Admin" :
                      "Employee"
                }
              </CardTitle>
              <CardDescription className="text-sm">
                {editingEmployee ? "Update employee information" : "Add a new team member"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="(123) 456-7890"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">PIN</Label>
                <Input
                  id="pin"
                  placeholder="Auto-generated from phone"
                  value={formData.pin}
                  disabled
                  className="bg-muted text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  PIN is automatically generated from the last 4 digits of phone number
                </p>
              </div>

              {formData.isAdmin > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <select
                  id="role"
                  value={formData.isAdmin}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAdmin: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value={0}>Employee</option>
                  <option value={1}>Admin</option>
                  <option value={2}>Super Admin</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingEmployee ? handleEditEmployee : handleAddEmployee}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isAddLoading}
                >
                  {isAddLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      {editingEmployee ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{editingEmployee ? "Update" : "Add"} Employee</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                <AlertCircle className="w-5 h-5" />
                Delete Employee
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete "{employeeToDelete.Name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEmployee}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Employee"
                  )}
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

export default EmployeePage