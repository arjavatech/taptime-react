import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DevicePage from "./pages/DevicePage"
import EmployeePage from "./pages/EmployeePage"
import ReportsPage from "./pages/Reportsummary"
import ReportSettings from "./pages/ReportSettings"
import ProfilePage from "./pages/ProfilePage"
import ContactsPage from "./pages/ContactsPage"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/device" element={<DevicePage />} />
          <Route path="/employee-management" element={<EmployeePage />} />
          <Route path="/reportsummary" element={<ReportsPage />} />
          <Route path="/report-settings" element={<ReportSettings />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/contact" element={<ContactsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
