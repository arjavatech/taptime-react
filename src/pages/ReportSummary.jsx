import React, { useState, useEffect } from "react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { mockReportData, mockEmployeeData, mockAnalyticsData, mockReportSummary, generateTodayMockData, getMockDataForDateRange, delay } from "../data/mockData"
import {
  Calendar,
  Download,
  FileText,
  Clock,
  Users,
  Search,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  Grid3X3,
  Table
} from "lucide-react"

const ReportsPage = () => {
  const [viewSettings, setViewSettings] = useState(["Weekly"]) // Default from Report Settings
  const [activeTab, setActiveTab] = useState("today")
  const [reportData, setReportData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [summaryStats, setSummaryStats] = useState(mockReportSummary.daily)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [showModal, setShowModal] = useState(false)
  const [newEntry, setNewEntry] = useState({
    EmployeeID: "",
    Type: "",
    Date: "",
    CheckInTime: "",
    CheckOutTime: ""
  })
  const [employeeList, setEmployeeList] = useState([])
  const [checkoutDisabled, setCheckoutDisabled] = useState(true)
  const [addButtonDisabled, setAddButtonDisabled] = useState(true)
  const [formErrors, setFormErrors] = useState({
    employee: "",
    type: "",
    date: "",
    checkinTime: "",
    checkoutTime: ""
  })
  const [viewMode, setViewMode] = useState("table") // table, grid
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" })

  useEffect(() => {
    loadViewSettings()
    
    // Listen for localStorage changes (when Report Settings are updated)
    const handleStorageChange = (e) => {
      if (e.key === 'reportViewSettings') {
        loadViewSettings()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events from same window
    const handleSettingsUpdate = () => {
      loadViewSettings()
    }
    
    window.addEventListener('reportSettingsUpdated', handleSettingsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('reportSettingsUpdated', handleSettingsUpdate)
    }
  }, [])

  useEffect(() => {
    loadEmployeeList()
  }, [])

  useEffect(() => {
    if (activeTab === "today" || activeTab === "daily") {
      loadDailyReport()
    }
  }, [selectedDate, activeTab])

  useEffect(() => {
    filterData()
  }, [reportData, searchQuery, sortConfig])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 650 && viewMode === "table") { // lg breakpoint
        setViewMode("grid") // Only auto-switch if currently on table view
      }
    }

    // Set initial view mode to grid on mobile
    if (window.innerWidth < 650) {
      setViewMode("grid")
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setViewMode(prev => prev) // Reset view mode when needed
  }, [viewMode])

  const loadViewSettings = () => {
    // Load from localStorage or API - simulating Report Settings data
    const savedSettings = localStorage.getItem('reportViewSettings')
    if (savedSettings) {
      setViewSettings(JSON.parse(savedSettings))
    }
  }

  const getThirdTabLabel = () => {
    const setting = viewSettings[0] || 'Weekly'
    return `${setting} Report`
  }

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000)
  }

  const loadDailyReport = async () => {
    setIsLoading(true)
    try {
      await delay(500) // Simulate API call
      let dateFilteredData

      // Use today's dynamic data if selected date is today
      const today = new Date().toISOString().split('T')[0]
      if (selectedDate === today) {
        dateFilteredData = generateTodayMockData()
      } else {
        dateFilteredData = mockReportData.filter(record =>
          record.Date === selectedDate
        )
      }

      setReportData(dateFilteredData)
      setSummaryStats({
        ...mockReportSummary.daily,
        totalRecords: dateFilteredData.length,
        presentEmployees: dateFilteredData.filter(r => r.CheckInTime).length,
        totalHours: dateFilteredData.reduce((sum, r) => {
          if (r.TimeWorked && r.TimeWorked !== "0:00") {
            const [hours, minutes] = r.TimeWorked.split(':').map(Number)
            return sum + hours + (minutes / 60)
          }
          return sum
        }, 0).toFixed(1)
      })
    } catch (error) {
      showToast("Failed to load report data", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDateRangeReport = async () => {
    if (!startDate || !endDate) {
      showToast("Please select both start and end dates", "error")
      return
    }

    setIsLoading(true)
    try {
      await delay(1000) // Simulate API call
      const rangeFilteredData = getMockDataForDateRange(startDate, endDate)

      // Group by employee for summary
      const employeeSummary = {}
      rangeFilteredData.forEach(record => {
        if (!employeeSummary[record.EmpID]) {
          employeeSummary[record.EmpID] = {
            EmpID: record.EmpID,
            Name: record.Name,
            Pin: record.Pin,
            totalHours: 0,
            totalDays: 0
          }
        }

        if (record.TimeWorked && record.TimeWorked !== "0:00") {
          const [hours, minutes] = record.TimeWorked.split(':').map(Number)
          employeeSummary[record.EmpID].totalHours += hours + (minutes / 60)
          employeeSummary[record.EmpID].totalDays += 1
        }
      })

      const summaryData = Object.values(employeeSummary).map(emp => ({
        ...emp,
        TimeWorked: `${Math.floor(emp.totalHours)}:${String(Math.round((emp.totalHours % 1) * 60)).padStart(2, '0')}`,
        avgHoursPerDay: emp.totalDays > 0 ? (emp.totalHours / emp.totalDays).toFixed(1) : "0.0"
      }))

      setReportData(summaryData)
      setSummaryStats({
        ...mockReportSummary.weekly,
        totalRecords: rangeFilteredData.length,
        totalHours: rangeFilteredData.reduce((sum, r) => {
          if (r.TimeWorked && r.TimeWorked !== "0:00") {
            const [hours, minutes] = r.TimeWorked.split(':').map(Number)
            return sum + hours + (minutes / 60)
          }
          return sum
        }, 0).toFixed(1)
      })
    } catch (error) {
      showToast("Failed to load report data", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const filterData = () => {
    let filtered = reportData
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(record =>
        record.Name?.toLowerCase().includes(query) ||
        record.Pin?.toLowerCase().includes(query) ||
        record.EmpID?.toLowerCase().includes(query)
      )
    }
    
    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue
      if (sortConfig.key === "name") {
        aValue = a.Name?.toLowerCase() || ""
        bValue = b.Name?.toLowerCase() || ""
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "pin") {
        aValue = a.Pin || ""
        bValue = b.Pin || ""
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "time") {
        aValue = a.TimeWorked || "0:00"
        bValue = b.TimeWorked || "0:00"
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "checkin" && activeTab === "daily") {
        aValue = a.CheckInTime || ""
        bValue = b.CheckInTime || ""
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortConfig.key === "days" && activeTab === "summary") {
        aValue = a.totalDays || 0
        bValue = b.totalDays || 0
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
      }
      return 0
    })
    
    setFilteredData(filtered)
  }

  const formatTime = (timeString) => {
    if (!timeString) return "--"
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const downloadCSV = () => {
    if (filteredData.length === 0) {
      showToast("No data to export", "error")
      return
    }

    let csvContent = ""
    let filename = ""

    if (activeTab === "daily") {
      csvContent = "Employee ID,Name,Check-in Time,Check-out Time,Time Worked,Type\n"
      csvContent += filteredData.map(record => [
        record.Pin || "",
        record.Name || "",
        record.CheckInTime ? formatTime(record.CheckInTime) : "",
        record.CheckOutTime ? formatTime(record.CheckOutTime) : "",
        record.TimeWorked || "",
        record.Type || ""
      ].join(",")).join("\n")
      filename = `daily_report_${selectedDate}.csv`
    } else {
      csvContent = "Employee ID,Name,Total Hours,Days Worked,Avg Hours/Day\n"
      csvContent += filteredData.map(record => [
        record.Pin || "",
        record.Name || "",
        record.TimeWorked || "",
        record.totalDays || "",
        record.avgHoursPerDay || ""
      ].join(",")).join("\n")
      filename = `summary_report_${startDate}_to_${endDate}.csv`
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()

    showToast("Report exported successfully!")
  }

  const downloadPDF = () => {
    showToast("PDF export functionality would be implemented here")
  }

  const getStatusBadge = (record) => {
    if (activeTab === "daily") {
      if (record.CheckOutTime) {
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
      } else {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">In Progress</span>
      }
    }
    return null
  }

  const getTotalHours = () => {
    return filteredData.reduce((total, record) => {
      if (record.TimeWorked && record.TimeWorked !== "0:00") {
        const [hours, minutes] = record.TimeWorked.split(':').map(Number)
        return total + hours + (minutes / 60)
      }
      return total
    }, 0).toFixed(1)
  }

  const getActiveEmployees = () => {
    return filteredData.filter(record =>
      activeTab === "daily" ? record.CheckInTime : record.totalDays > 0
    ).length
  }

  const closeModal = () => {
    setShowModal(false)
    setNewEntry({
      EmployeeID: "",
      Type: "",
      Date: "",
      CheckInTime: "",
      CheckOutTime: ""
    })
    setFormErrors({
      employee: "",
      type: "",
      date: "",
      checkinTime: "",
      checkoutTime: ""
    })
    setCheckoutDisabled(true)
    setAddButtonDisabled(true)
  }

  const handleCheckinTimeChange = (value) => {
    setNewEntry({ ...newEntry, CheckInTime: value })
    if (value) {
      setCheckoutDisabled(false)
      setAddButtonDisabled(false)
    } else {
      setCheckoutDisabled(true)
      setAddButtonDisabled(true)
    }
  }

  const loadEmployeeList = async () => {
    try {
      await delay(300)
      setEmployeeList(mockEmployeeData)
    } catch (error) {
      showToast("Failed to load employees", "error")
    }
  }

  const calculateTimeWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "0:00"
    
    const [checkInHour, checkInMin] = checkIn.split(':').map(Number)
    const [checkOutHour, checkOutMin] = checkOut.split(':').map(Number)
    
    const checkInMinutes = checkInHour * 60 + checkInMin
    const checkOutMinutes = checkOutHour * 60 + checkOutMin
    
    const diffMinutes = checkOutMinutes - checkInMinutes
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    
    return `${hours}:${String(minutes).padStart(2, '0')}`
  }

  const handleSaveEntry = () => {
    if (!newEntry.EmployeeID || !newEntry.Type || !newEntry.Date || !newEntry.CheckInTime) {
      showToast("Please fill in all required fields", "error")
      return
    }

    const selectedEmployee = employeeList.find(emp => emp.Pin === newEntry.EmployeeID)
    if (!selectedEmployee) {
      showToast("Selected employee not found", "error")
      return
    }

    const timeWorked = calculateTimeWorked(newEntry.CheckInTime, newEntry.CheckOutTime)
    
    const newRecord = {
      EmpID: selectedEmployee.EmpID,
      Pin: selectedEmployee.Pin,
      Name: `${selectedEmployee.FName} ${selectedEmployee.LName}`,
      Date: newEntry.Date,
      CheckInTime: `${newEntry.Date}T${newEntry.CheckInTime}:00`,
      CheckOutTime: newEntry.CheckOutTime ? `${newEntry.Date}T${newEntry.CheckOutTime}:00` : null,
      TimeWorked: timeWorked,
      Type: newEntry.Type
    }

    setReportData(prev => [...prev, newRecord])
    showToast("Entry saved successfully!")
    closeModal()
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

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports & Analytics</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  View and analyze employee time tracking data
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button variant="outline" onClick={downloadCSV} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button variant="outline" onClick={downloadPDF} className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Check-in employee</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{summaryStats.presentEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Currently working employee</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.filter(r => r.CheckInTime && !r.CheckOutTime).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{filteredData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
              {[
                { key: "today", label: "Today Report", icon: Calendar },
                { key: "daily", label: "Day-wise Report", icon: Calendar },
                { key: "summary", label: getThirdTabLabel(), icon: BarChart3 }
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
                  <span className="sm:hidden">
                    {key === "today" ? "Today" : key === "daily" ? "Daily" : "Summary"}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            {/* Date Controls Row */}
            {activeTab === "daily" ? (
              <div className="space-y-2">
                <Label htmlFor="selectedDate">Select Date</Label>
                <Input
                  id="selectedDate"
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            ) : activeTab === "summary" ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={loadDateRangeReport} className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Search and Controls Row */}
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
                  <option value="pin-asc">PIN A-Z</option>
                  <option value="pin-desc">PIN Z-A</option>
                  {activeTab === "daily" ? (
                    <>
                      <option value="checkin-asc">Check-in: Early First</option>
                      <option value="checkin-desc">Check-in: Late First</option>
                    </>
                  ) : activeTab === "summary" ? (
                    <>
                      <option value="days-asc">Days: Low to High</option>
                      <option value="days-desc">Days: High to Low</option>
                    </>
                  ) : null}
                  <option value="time-asc">Time: Low to High</option>
                  <option value="time-desc">Time: High to Low</option>
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
        </div>

        {/* Stats Cards */}
        

        {/* Today's Report Section */}
        {activeTab === "today" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Today's Report - {new Date().toLocaleDateString()}</span>
                      <span className="sm:hidden">Today's Report</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      Current day employee check-in and check-out summary
                    </CardDescription>
                  </div>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="bg-[#02066F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#030974] transition-colors w-full sm:w-auto text-sm sm:text-base"
                  >
                    Add Entry
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No Records Found</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground px-4">
                      No entries found for today. Click "Add Entry" to get started.
                    </p>
                  </div>
                ) : (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredData.map((record, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base sm:text-lg truncate">{record.Name}</CardTitle>
                                  <CardDescription className="text-xs sm:text-sm">PIN: {record.Pin}</CardDescription>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4 pt-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{record.Type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">In: {formatTime(record.CheckInTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">Out: {formatTime(record.CheckOutTime)}</span>
                            </div>
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Time Worked</span>
                                <span className="font-medium text-foreground">{record.TimeWorked}</span>
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
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Employee ID</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Name</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Check-in Time</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm border-r border-white/20">Check-out Time</th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-xs sm:text-sm">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center font-medium text-xs sm:text-sm">{record.Pin}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">{record.Name}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">{formatTime(record.CheckInTime)}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">{formatTime(record.CheckOutTime)}</td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {record.Type}
                                </span>
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
          </div>
        )}

        {/* Report Table */}
        {activeTab !== "today" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {activeTab === "daily" ? `Day-wise Report - ${selectedDate}` : getThirdTabLabel()}
                </CardTitle>
                <CardDescription>
                  {activeTab === "daily"
                    ? "Employee check-in and check-out times for the selected date"
                    : `Employee work summary for the selected date range (${viewSettings[0] || 'Weekly'} view)`
                  }
                </CardDescription>
              </CardHeader>

              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No data found</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "daily"
                        ? "No records found for the selected date."
                        : "No records found for the selected date range. Try generating a report first."
                      }
                    </p>
                  </div>
                ) : (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredData.map((record, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Users className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <CardTitle className="text-base sm:text-lg truncate">{record.Name}</CardTitle>
                                  <CardDescription className="text-xs sm:text-sm">PIN: {record.Pin}</CardDescription>
                                </div>
                              </div>
                              {activeTab === "daily" && getStatusBadge(record)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 sm:space-y-4 pt-0">
                            {activeTab === "daily" ? (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{record.Type}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">In: {formatTime(record.CheckInTime)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">Out: {formatTime(record.CheckOutTime)}</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm text-muted-foreground">Total Hours</span>
                                  <span className="font-medium">{record.TimeWorked}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm text-muted-foreground">Days Worked</span>
                                  <span className="font-medium">{record.totalDays}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs sm:text-sm text-muted-foreground">Avg Hours/Day</span>
                                  <span className="font-medium">{record.avgHoursPerDay}h</span>
                                </div>
                              </>
                            )}
                            <div className="pt-2 border-t">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Time Worked</span>
                                <span className="font-medium text-foreground">{record.TimeWorked}</span>
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
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Employee</th>
                            <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">PIN</th>
                            {activeTab === "daily" ? (
                              <>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Check In</th>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Check Out</th>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Type</th>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Status</th>
                              </>
                            ) : (
                              <>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Total Hours</th>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Days Worked</th>
                                <th className="px-4 py-3 text-center font-semibold text-sm border-r border-white/20">Avg Hours/Day</th>
                              </>
                            )}
                            <th className="px-4 py-3 text-center font-semibold text-sm">Time Worked</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-center font-medium">{record.Name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">{record.Pin}</td>
                              {activeTab === "daily" ? (
                                <>
                                  <td className="px-4 py-3 text-center">{formatTime(record.CheckInTime)}</td>
                                  <td className="px-4 py-3 text-center">{formatTime(record.CheckOutTime)}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {record.Type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">{getStatusBadge(record)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="px-4 py-3 text-center font-medium">{record.TimeWorked}</td>
                                  <td className="px-4 py-3 text-center">{record.totalDays}</td>
                                  <td className="px-4 py-3 text-center">{record.avgHoursPerDay}h</td>
                                </>
                              )}
                              <td className="px-4 py-3 text-center font-medium">{record.TimeWorked}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">
                Add Entry
              </CardTitle>
              <CardDescription className="text-sm">
                Add a new time tracking entry
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee" className="text-sm font-medium">Employee</Label>
                <select
                  id="employee"
                  value={newEntry.EmployeeID}
                  onChange={(e) => setNewEntry({ ...newEntry, EmployeeID: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Employee</option>
                  {employeeList.map((employee) => (
                    <option key={employee.Pin} value={employee.Pin}>
                      {employee.FName} {employee.LName}
                    </option>
                  ))}
                </select>
                {formErrors.employee && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.employee}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                <select
                  id="type"
                  value={newEntry.Type}
                  onChange={(e) => setNewEntry({ ...newEntry, Type: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="Belt">Belt</option>
                  <option value="Path">Path</option>
                  <option value="Camp">Camp</option>
                  <option value="External">Off site</option>
                  <option value="Trial">Trial</option>
                  <option value="Reception">Reception</option>
                </select>
                {formErrors.type && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.Date}
                  onChange={(e) => setNewEntry({ ...newEntry, Date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="text-sm"
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkinTime" className="text-sm font-medium">Check-in Time</Label>
                  <Input
                    id="checkinTime"
                    type="time"
                    value={newEntry.CheckInTime}
                    onChange={(e) => handleCheckinTimeChange(e.target.value)}
                    className="text-sm"
                  />
                  {formErrors.checkinTime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.checkinTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkoutTime" className="text-sm font-medium">Check-out Time</Label>
                  <Input
                    id="checkoutTime"
                    type="time"
                    value={newEntry.CheckOutTime}
                    onChange={(e) => setNewEntry({ ...newEntry, CheckOutTime: e.target.value })}
                    disabled={checkoutDisabled}
                    className="text-sm disabled:bg-muted"
                  />
                  {formErrors.checkoutTime && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.checkoutTime}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEntry}
                  disabled={addButtonDisabled}
                  className="flex-1 order-1 sm:order-2"
                >
                  Add Entry
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

export default ReportsPage