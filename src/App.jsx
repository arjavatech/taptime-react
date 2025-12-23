// App.js (or your main component)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import Register from "./pages/Register";
import EmployeeList from "./pages/EmployeeList";
import Device from "./pages/Device";
import Profile from "./pages/Profile";
import ContactUs from "./pages/ContactUs";
import GetInTouch from "./pages/GetInTouch";
import ReportSummary from "./pages/ReportSummary";
import ReportSetting from "./pages/ReportSetting";
import ForgotPassword from "./pages/ForgotPassword";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";


function App() {
  return (
    // <BrowserRouter>
    <Router>
      <AuthProvider>
        <div className="App">
          {/* <Header /> */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact-us" element={<GetInTouch/>}/>
            <Route path="/employee-management" element={<ProtectedRoute><EmployeeList/></ProtectedRoute>} />
            <Route path="/device" element={<RoleProtectedRoute allowedRoles={['Owner', 'Super Admin']}><Device/></RoleProtectedRoute>}/>
            <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><ContactUs/></ProtectedRoute>}/>            
            <Route path="/reports" element={<ProtectedRoute><ReportSummary/></ProtectedRoute>}/>
            <Route path="/reportsummary" element={<ProtectedRoute><ReportSummary/></ProtectedRoute>}/>
            <Route path="/daywisereport" element={<ProtectedRoute><ReportSummary/></ProtectedRoute>}/>
            <Route path="/salariedreport" element={<ProtectedRoute><ReportSummary/></ProtectedRoute>}/>
            <Route path="/reportsetting" element={<RoleProtectedRoute allowedRoles={['Owner', 'Super Admin']}><ReportSetting/></RoleProtectedRoute>}/>
            {/* Add other routes as needed */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
    // </BrowserRouter>
  );
}

export default App;
