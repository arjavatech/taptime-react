import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header1 from "./Navbar/Header1";
import { loginCheck, googleSignInCheck, getTimeZone, getCustomerData } from "../../utils/apiUtils";
import { decodeJwtResponse } from "../../utils/commonUtils";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  const googleSignInBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoogleSignIn();
  }, []);

  const loadGoogleSignIn = () => {
    if (typeof google !== "undefined" && google?.accounts?.id) {
      initializeGoogleSignIn();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);
  };

  const initializeGoogleSignIn = () => {
    google.accounts.id.initialize({
      client_id: "1070255023214-gc25jf1quuc0bgu7vut9e2g4nghlhtbs.apps.googleusercontent.com",
      callback: handleCredentialResponse
    });

    if (googleSignInBtnRef.current) {
      google.accounts.id.renderButton(googleSignInBtnRef.current, {
        theme: "outline",
        size: "large"
      });
    }
  };

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const userObject = decodeJwtResponse(response.credential);
      const result = await googleSignInCheck(userObject.email);
      
      if (!result.success) {
        setErrorMsg(result.error || "Invalid Gmail login");
        return;
      }

      localStorage.setItem("userName", userObject.name);
      localStorage.setItem("userPicture", userObject.picture);
      
      getTimeZone(result.companyID);
      getCustomerData(result.companyID);
      navigate("/employeelist");
    } catch (error) {
      setErrorMsg("Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  };





  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg("Please enter both username and password");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const isAuthenticated = await loginCheck(username, password);
      if (isAuthenticated) {
        getTimeZone(localStorage.getItem("companyID"));
        navigate("/employeelist");
      } else {
        setErrorMsg("Invalid username or password");
      }
    } catch (err) {
      setErrorMsg("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Header1 />
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side image & intro */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center xl:p-6">
          <div className="w-full flex flex-col items-center text-center">
            <img
              src="/images/tap-time-logo.png"
              alt="icode-logo"
              className="w-44 xl:w-94 md:w-32 mb-12 pt-42"
            />
            <h3 className="text-2xl xl:text-3xl md:text-2xl font-semibold text-gray-800 mb-2">
              Employee Time Tracking
            </h3>
            <p className="text-gray-900">
              One tap solution for simplifying and streamlining employee time
              logging and reporting.
            </p>
          </div>
        </div>

        {/* Right side login form */}
        <div className="w-full md:w-1/2 flex justify-center items-center py-16 px-6 sm:px-8 md:px-8 md:pt-30 lg:px-20">
          <div className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 text-center">
            <h2 className="sm:text-3xl md:text-3xl text-2xl pt-4 font-semibold text-gray-800 mb-10">
              Login
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02066F]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02066F]"
              />
              <div className="text-right mb-4">
                <a href="/forget-password" className="text-[#02066F] text-sm font-bold hover:underline">
                  Forgot password?
                </a>
              </div>
              <button onClick={handleLogin} className="w-full bg-[#02066F] text-white py-3 rounded-lg font-semibold hover:bg-blue-800">
                Login
              </button>
            </div>

            {/* Separator */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="flex justify-center mb-6">
              <div ref={googleSignInBtnRef} style={{ width: "280px", height: "44px" }}></div>
            </div>
            
            <div className="text-center pt-6">
              <span className="text-lg font-bold text-gray-800">
                Don't have an account?
                <a href="/register" className="ml-2 text-[#02066F] hover:underline">
                  Signup
                </a>
              </span>
            </div>

            {errorMsg && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={() => setErrorMsg("")}>
                <div className="bg-white rounded-lg max-w-xs mx-4" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-[#02066F] text-white p-3 rounded-t-lg flex justify-between items-center">
                    <h3 className="font-bold">{errorMsg}</h3>
                    <button onClick={() => setErrorMsg("")} className="text-2xl">&times;</button>
                  </div>
                  <div className="p-4 text-center">
                    <img src="/images/image-4.png" alt="Error" className="w-10 mx-auto mb-2" />
                    <p className="text-sm">
                      You are not registered. Please{" "}
                      <a href="/register" className="text-yellow-700 hover:underline">register</a>
                    </p>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>

        {loading && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;
