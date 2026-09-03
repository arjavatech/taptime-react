import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import SetPassword from "./pages/SetPassword";
import Register from "./pages/Register";

import RegisterSuccess from "./pages/RegisterSuccess";
import EmployeeList from "./pages/EmployeeList";
import Device from "./pages/Device";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import GetInTouch from "./pages/GetInTouch";
import ReportSummary from "./pages/ReportSummary";
import ReportSetting from "./pages/ReportSetting";
import ForgotPassword from "./pages/ForgotPassword";
import Invoices from "./pages/Invoices";
import MyProfile from "./pages/MyProfile";
import MyReports from "./pages/MyReports";
import IntegrationConnections from "./pages/IntegrationConnections";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import EmployeeRoute from "./components/EmployeeRoute";


function App() {
  return (
    <Router>
      <CompanyProvider>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomePage />} />
               <Route path="/register/success" element={<RegisterSuccess />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/contact-us" element={<GetInTouch />} />
              <Route path="/my-profile" element={<EmployeeRoute><MyProfile /></EmployeeRoute>} />
              <Route path="/my-reports" element={<EmployeeRoute><MyReports /></EmployeeRoute>} />
              <Route path="/pending-checkout" element={<EmployeeRoute><Navigate to="/my-reports?tab=pending" replace /></EmployeeRoute>} />
              <Route path="/employee-management" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><EmployeeList /></RoleProtectedRoute>} />
              <Route path="/device" element={<RoleProtectedRoute allowedRoles={['Owner', 'SuperAdmin']}><Device /></RoleProtectedRoute>} />
              <Route path="/invoices" element={<RoleProtectedRoute allowedRoles={['Owner', 'SuperAdmin']}><Invoices /></RoleProtectedRoute>} />
              <Route path="/integrations" element={<RoleProtectedRoute allowedRoles={['Owner', 'SuperAdmin']}><IntegrationConnections /></RoleProtectedRoute>} />
              <Route path="/profile" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><Profile /></RoleProtectedRoute>} />
              <Route path="/contact" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><ContactUs /></RoleProtectedRoute>} />
              <Route path="/reports" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><ReportSummary /></RoleProtectedRoute>} />
              <Route path="/reportsummary" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><ReportSummary /></RoleProtectedRoute>} />
              <Route path="/daywisereport" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><ReportSummary /></RoleProtectedRoute>} />
              <Route path="/salariedreport" element={<RoleProtectedRoute allowedRoles={['Owner', 'Admin', 'SuperAdmin']}><ReportSummary /></RoleProtectedRoute>} />
              <Route path="/reportsetting" element={<RoleProtectedRoute allowedRoles={['Owner', 'SuperAdmin']}><ReportSetting /></RoleProtectedRoute>} />
            </Routes>
          </div>
        </AuthProvider>
      </CompanyProvider>
    </Router>
  );
}

export default App;
