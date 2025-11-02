import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header1 from './Navbar/Header1';

const Register = () => {
  const navigate = useNavigate();
  
  const [isFreeTrail, setIsFreeTrail] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyStreet, setCompanyStreet] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [companyZip, setCompanyZip] = useState(0);
  const [NoOfDevices, setNoOfDevices] = useState(0);
  const [NoOfEmployees, setNoOfEmployees] = useState(0);
  const [errorCompanyName, setErrorCompanyName] = useState('');
  const [totalError, setTotalError] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileInput, setFileInput] = useState(null);
  
  const isAlpha = /^[a-zA-Z\s]+$/;
  
  useEffect(() => {
    const trial = localStorage.getItem('trial') === 'true';
    setIsFreeTrail(trial);
    console.log("isFreeTrail", trial);
    setNoOfDevices(trial ? 1 : '');
    setNoOfEmployees(trial ? 10 : '');
  }, []);
  
  const validateCompanyName = () => {
    if (companyName.trim() === '') {
      setErrorCompanyName('');
      return false;
    } else if (!isAlpha.test(companyName)) {
      setErrorCompanyName("Only use letters, don't use digits");
      return false;
    }
    setErrorCompanyName('');
    return true;
  };
  
  const validateRequiredFields = () => {
    const requiredStrings = [companyName, companyStreet, companyCity, companyState];
    const requiredNumbers = [companyZip, NoOfDevices, NoOfEmployees];

    const areStringsValid = requiredStrings.every(val => typeof val === 'string' && val.trim() !== '');
    const areNumbersValid = requiredNumbers.every(val => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    });

    console.log(areStringsValid, areNumbersValid);
    
    return areStringsValid && areNumbersValid;
  };
  
  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileInput(files[0]);
      setFileName(files[0].name);
      setCompanyLogo(URL.createObjectURL(files[0]));
    }
  };
  
  const validateForm = (event) => {
    event.preventDefault();
  
    setOverlayVisible(true);
    setTotalError('');
  
    const isCompanyNameValid = validateCompanyName();
    const isRequiredFieldsValid = validateRequiredFields();
  
    if (isCompanyNameValid && isRequiredFieldsValid) {
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.width = '50%';
      }
  
      localStorage.setItem('companyName', companyName);
      localStorage.setItem('companyStreet', companyStreet);
      localStorage.setItem('companyCity', companyCity);
      localStorage.setItem('companyState', companyState);
      localStorage.setItem('companyZip', companyZip);
      localStorage.setItem('noOfDevices', NoOfDevices);
      localStorage.setItem('noOfEmployees', NoOfEmployees);
  
      if (fileInput) {
        const reader = new FileReader();
        reader.onloadend = () => {
          localStorage.setItem('companyLogo', reader.result);
          setTimeout(() => {
            setOverlayVisible(false);
            navigate('/register2');
          }, 100);
        };
        reader.readAsDataURL(fileInput);
      } else {
        setTimeout(() => {
          setOverlayVisible(false);
          navigate('/register2');
        }, 100);
      }
    } else {
      setTotalError('Please fix the errors');
      setOverlayVisible(false);
    }
  };

  return (
    <>
    <Header1/>
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="hidden md:flex md:w-1/2 bg-blue-100 flex-col justify-center items-center p-5">
          <img
            src="/images/tap-time-logo.png"
            alt="icode-logo"
            className="w-44 xl:w-94 md:w-32 md:pt-2 xl:pt-8"
          />
          <div>
            <h3 className="text-center text-3xl xl:text-3xl md:text-2xl text-gray-800 font-semibold xl:pt-20 md:pt-18">
              Join Us Today
            </h3>
            <p className="text-center text-gray-700 mt-2">
              Create an account to unlock seamless time tracking and boost your
              team's efficiency.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 xl:w-1/2 flex justify-center items-center p-6 pt-10 xl:pt-16 md:pt-16">
          {overlayVisible && (
            <div
              className="fixed inset-0 flex justify-center items-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="border-4 border-t-4 border-[#02066F] rounded-full w-10 h-10 animate-spin"></div>
            </div>
          )}

          <form className="w-full pt-14 md:pt-12">
            <h2 className="text-center text-3xl xl:text-3xl md:text-2xl text-gray-800 font-semibold mb-4">
              Signup
            </h2>
            <hr className="w-full h-4 bg-gray-200 rounded-full border-4 mb-6 border-gray-200" />

            {totalError && (
              <p className="text-red-600 text-sm mb-2">{totalError}</p>
            )}

            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="text"
                value={companyName}
                onBlur={validateCompanyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                className="w-full outline-none font-bold p-3 xl:p-6 md:p-3"
                required
              />
            </div>
            {errorCompanyName && (
              <p className="text-red-600 text-sm mb-2">{errorCompanyName}</p>
            )}

            <h1 className="text-[#02066F] text-md md:text-lg font-bold text-center mb-2">
              Company Logo
            </h1>
            <div className="border-2 border-[#02066F] rounded-lg mb-4 p-4 space-x-1">
              <label
                htmlFor="companyLogo"
                className="inline-block font-bold xl:text-lg md:text-lg text-base py-1 px-2 border-2 rounded cursor-pointer transition"
                style={{
                  borderColor: "rgb(234,234,234)",
                  backgroundColor: "#f0f0f0",
                  border: "1px solid gray",
                }}
              >
                Choose File
              </label>
              <span className="xl:text-lg md:text-lg text-gray-800 text-base font-bold ">
                {fileName || "No file chosen"}
              </span>
              <input
                id="companyLogo"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            <div className="border-2 border-[#02066F] rounded-lg p-2 xl:p-4 md:p-4 mb-4">
              <p className="text-center text-[#02066F] font-bold mb-4">
                Company Address
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={companyStreet}
                  onChange={(e) => setCompanyStreet(e.target.value)}
                  placeholder="Company Address Line 1"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
                <input
                  type="text"
                  value={companyCity}
                  onChange={(e) => setCompanyCity(e.target.value)}
                  placeholder="Company City"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4 mt-4 mb-4">
                <input
                  type="text"
                  value={companyState}
                  onChange={(e) => setCompanyState(e.target.value)}
                  placeholder="Company State"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
                <input
                  type="number"
                  value={companyZip === 0 ? "" : companyZip}
                  onChange={(e) => setCompanyZip(Number(e.target.value) || 0)}
                  placeholder="Company Zip"
                  className="w-full border-2 border-[#02066F] rounded-lg p-2 xl:p-6 md:p-3 font-bold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="number"
                value={NoOfDevices}
                onChange={(e) => setNoOfDevices(e.target.value)}
                placeholder={isFreeTrail ? "1" : "No Of Devices"}
                className="w-full outline-none font-bold p-2 xl:p-6 md:p-3"
                readOnly={isFreeTrail}
                required={!isFreeTrail}
              />
            </div>

            <div className="border-2 border-[#02066F] rounded-lg mb-4">
              <input
                type="number"
                value={NoOfEmployees}
                onChange={(e) => setNoOfEmployees(e.target.value)}
                placeholder={isFreeTrail ? "10" : "No Of Employees"}
                className="w-full outline-none font-bold p-2 xl:p-6 md:p-3"
                readOnly={isFreeTrail}
                required={!isFreeTrail}
              />
            </div>

            <button
              type="submit"
              onClick={validateForm}
              className="w-full bg-[#02066F] text-white py-3 rounded-lg text-lg mt-4 cursor-pointer"
            >
              Next
            </button>
          </form>

          {overlayVisible && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="text-white text-xl font-semibold">
                Processing...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Register;