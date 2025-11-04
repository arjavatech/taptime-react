// App.js (or your main component)
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  BrowserRouter,
} from "react-router-dom";

import HomePage from "./components/ui/HomePage";
import Login from "./components/ui/Login";
import SetPassword from "./components/ui/SetPassword";
import Register from "./components/ui/Register";
import PrivacyPolicy from "./components/ui/PrivacyPolicy";
import Register2 from "./components/ui/Register2";
import EmployeeList from "./components/ui/EmployeeList";
import Device from "./components/ui/Device";
import Profile from "./components/ui/Profile";
import ContactUs from "./components/ui/ContactUs";
import Reports from "./components/ui/Reportsummary.";
import ReportSetting from "./components/ui/ReportSetting";
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
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy />} />
            <Route path="/register2" element={<Register2 />} />
            <Route path="/employeelist" element={<EmployeeList/>} />
            <Route path="/device" element={<Device/>}/>
            <Route path="/profile" element={<Profile/>} />
            <Route path="/contact" element={<ContactUs/>}/>
            <Route path="/reports" element={<Reports/>}/>
            <Route path="/reportsummary" element={<Reports/>}/>
            <Route path="/daywisereport" element={<Reports/>}/>
            <Route path="/salariedreport" element={<Reports/>}/>
            <Route path="/reportsetting" element={<ReportSetting/>}/>
            {/* Add other routes as needed */}
          </Routes>
          {/* <Footer /> */}
        </div>
      </AuthProvider>
    </Router>
    // </BrowserRouter>
  );
}

export default App;
