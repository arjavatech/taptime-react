import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Navbar/Header";
import { Card } from "./card";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoSrc, setLogoSrc] = useState("");
  const [isFreeTrail, setIsFreeTrail] = useState("");
  const [freeTrailEndDate, setFreeTrailEndDate] = useState("");

  const googleSignInBtnRef = useRef(null);
  const navigate = useNavigate();

  const key1 = new Uint8Array([
    16, 147, 220, 113, 166, 142, 22, 93, 241, 91, 13, 252, 112, 122, 119, 95,
  ]);

  // Cache for timezone data
  const timeZoneCache = new Map();

  useEffect(() => {
    // Initialize localStorage-dependent variables first
    setIsFreeTrail(localStorage.getItem("trial") || "");
    setFreeTrailEndDate(localStorage.getItem("expiryDate") || "");

    // Load company logo if exists
    const storedLogo = localStorage.getItem("companyLogo");
    if (storedLogo) {
      setLogoSrc(storedLogo);
    }

    // Load Google Sign-In script after slight delay
    setTimeout(loadGoogleSignIn, 50);
  }, []);

  const loadGoogleSignIn = () => {
    try {
      // Check if already loaded
      if (typeof google !== "undefined" && google?.accounts?.id) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Small delay to ensure everything is ready
        requestAnimationFrame(() => initializeGoogleSignIn());
      };
      script.onerror = () =>
        console.error("Failed to load Google Sign-In script");
      document.head.appendChild(script);
    } catch (error) {
      console.error("Error loading Google Sign-In:", error);
    }
  };

  const initializeGoogleSignIn = () => {
    try {
      google.accounts.id.initialize({
        client_id:
          "1070255023214-gc25jf1quuc0bgu7vut9e2g4nghlhtbs.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        auto_select: false,
        ux_mode: "popup", // Faster than redirect
      });

      // Use requestAnimationFrame for smoother rendering
      requestAnimationFrame(() => {
        if (googleSignInBtnRef.current) {
          google.accounts.id.renderButton(googleSignInBtnRef.current, {
            theme: "outline",
            size: "large",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      });
    } catch (error) {
      console.error("Google Sign-In initialization failed:", error);
    }
  };

  const handleCredentialResponse = async (response) => {
    setErrorMsg("");
    setLoading(true);

    try {
      const userObject = decodeJwtResponse(response.credential);
      const email = userObject.email;

      // Check trial expiration first (fast path check)
      if (freeTrailEndDate && new Date(freeTrailEndDate) <= new Date()) {
        localStorage.removeItem("trial");
        localStorage.removeItem("expiryDate");
        setErrorMsg("Your free trial has expired. Please sign up to continue.");
        setLoading(false);
        return;
      }

      // Clear localStorage early
      localStorage.clear();

      const res = await fetch(
        `https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/login_check/${email}`
      );
      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();

      if ("error" in data) {
        setErrorMsg("Invalid Gmail login");
        setLoading(false);
        return;
      }

      const isValidEmail =
        data["Email"] === email || localStorage.getItem("email") === email;
      if (!isValidEmail) {
        setErrorMsg("Invalid email or user not found");
        setLoading(false);
        return;
      }

      if (["Admin", "SuperAdmin", "Owner"].includes(data["AdminType"])) {
        const companyID = data["CID"];
        // Batch localStorage operations
        const storeData = {
          companyID,
          companyName: data["CName"],
          companyLogo: data["CLogo"],
          companyAddress: data["CAddress"],
          NoOfDevices: data["NoOfDevices"],
          NoOfEmployees: data["NoOfEmployees"],
          reportType: data["ReportType"],
          adminMail: data["Email"],
          adminType: data["AdminType"],
          userName: userObject.name,
          userPicture: userObject.picture,
        };

        Object.entries(storeData).forEach(([key, value]) => {
          if (value !== undefined) localStorage.setItem(key, value);
        });

        if (data["DeviceID"]) {
          localStorage.setItem("DeviceID", data["DeviceID"]);
        }

        // Fire parallel requests without waiting
        Promise.all([getTimeZone(companyID), getCustomerData(companyID)]).catch(
          console.error
        );
      }

      // Navigate immediately without waiting for parallel requests
      navigate("/employeelist");
    } catch (error) {
      console.error("Google Sign-In error:", error);
      setErrorMsg("An error occurred during Google Sign-In");
      setLoading(false);
    }
  };

  const decodeJwtResponse = (token) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  };

  const getCustomerData = async (cid) => {
    try {
      const response = await fetch(
        `https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/customer/getUsingCID/${cid}`
      );
      const data = await response.json();

      // Batch localStorage operations
      const customerData = {
        customerID: data.CustomerID,
        firstName: data.FName,
        lastName: data.LName,
        address: data.Address,
        phone: data.PhoneNumber,
        phoneNumber: data.PhoneNumber,
        email: data.Email,
      };

      Object.entries(customerData).forEach(([key, value]) => {
        if (value !== undefined) localStorage.setItem(key, value);
      });
    } catch (err) {
      console.error("Error fetching customer data:", err);
    }
  };

  const getTimeZone = async (cid) => {
    // Check cache first
    const cachedTZ =
      timeZoneCache.get(cid) || localStorage.getItem(`timeZone_${cid}`);
    if (cachedTZ) {
      localStorage.setItem("TimeZone", cachedTZ);
      return;
    }

    try {
      const res = await fetch(
        `https://9dq56iwo77.execute-api.ap-south-1.amazonaws.com/prod/device/getAll/${cid}`
      );
      const data = await res.json();
      const timeZone =
        !data.length || data.error === "No devices found !"
          ? "PST"
          : data[0]?.TimeZone || "PST";

      // Update cache and localStorage
      timeZoneCache.set(cid, timeZone);
      localStorage.setItem("TimeZone", timeZone);
      localStorage.setItem(`timeZone_${cid}`, timeZone);
    } catch (err) {
      console.error("Error fetching timezone:", err);
      localStorage.setItem("TimeZone", "PST");
    }
  };

  const startTrial = () => {
    localStorage.setItem("trial", "true");
    navigate("/register");
  };

  return (
    <>
    <Header />
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side image & intro */}
        <div className="hidden md:flex xl:w-1/2 md:w-1/2 bg-[#D9E9FB] flex-col justify-center items-center xl:p-6">
          <div className="w-full flex flex-col items-center text-center">
            <img
              src="/src/Public/tap-time-logo.png"
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

            <div className="w-full flex justify-center mb-">
              <div
                ref={googleSignInBtnRef}
                className="google-signin-btn"
                style={{ width: "300px", height: "44px" }}
              ></div>
            </div>
            <div className="w-full flex flex-row justify-center pt-6">
              <span className="text-xl sm:text-xl md:text-base xl:text-xl font-bold text-gray-800">
                Don't have an account?
                <a
                  href="/register"
                  className="ml-2 text-[#02066F] text-xl sm:text-xl md:text-base xl:text-xl font-bold hover:underline"
                >
                  Signup
                </a>
              </span>
            </div>

            {errorMsg && (
              <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{ background: "rgba(0, 0, 0, 0.5)" }}
              >
                <div
                  className="bg-white rounded-lg w-full max-w-xs mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex w-full bg-[#02066F] justify-between p-3 pl-4 pr-4 items-center rounded-t-md text-center">
                    <h3 className="text-xl font-bold text-white">{errorMsg}</h3>
                    <button
                      className="text-gray-400 hover:text-white cursor-pointer text-3xl"
                      onClick={() => setErrorMsg("")}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="px-4 py-4 flex flex-col justify-center items-center gap-2">
                    <img
                      src="/image 4.png"
                      alt="image 4"
                      className="text-center items-center justify-center w-10"
                    />
                    <p className="text-gray-800 text-base font-semibold">
                      You are currently not registered. Please sign up to
                      continue.{" "}
                      <a
                        href="/register"
                        className=" text-yellow-700 hover:underline"
                      >
                        register
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center ">
                <span className="px-2 bg-white font-bold text-gray-800">
                  or
                </span>
              </div>
            </div>

            {/* {!isFreeTrail && ( */}
            <div>
              <button
                type="button"
                onClick={startTrial}
                className="w-full bg-green-500 text-white text-lg font-bold cursor-pointer sm:text-xl py-4 rounded-lg transition duration-300 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start free trial now!
              </button>
            </div>
            {/* )} */}
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
