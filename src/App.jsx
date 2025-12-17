// App.js (or your main component)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  BrowserRouter,
} from "react-router-dom";
import { Toaster } from "sonner";

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
            <Route path="/employee-management" element={<EmployeeList/>} />
            <Route path="/device" element={<Device/>}/>
            <Route path="/profile" element={<Profile/>} />
            <Route path="/contact" element={<ContactUs/>}/>
            <Route path="/contact-us" element={<GetInTouch/>}/>
            <Route path="/reports" element={<ReportSummary/>}/>
            <Route path="/reportsummary" element={<ReportSummary/>}/>
            <Route path="/daywisereport" element={<ReportSummary/>}/>
            <Route path="/salariedreport" element={<ReportSummary/>}/>
            <Route path="/reportsetting" element={<ReportSetting/>}/>
            {/* Add other routes as needed */}
          </Routes>
          {/* <Footer /> */}
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
    // </BrowserRouter>
  );
}

export default App;
