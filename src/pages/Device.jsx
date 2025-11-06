import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
// API_URLS removed - using direct URLs

const Device = () => {
  // Device API functions
  const deviceApi = {
    getAll: async (companyId) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev/'}/device/get_all/${companyId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    create: async (deviceData) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev/'}/device/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(deviceData)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    delete: async (accessKey, companyId) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev/'}/device/delete/${accessKey}/${companyId}/Admin`, {
        method: "PUT",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    }
  };


  // UI States
  const [showTable, setShowTable] = useState(false);
  const [showNoDeviceMessage, setShowNoDeviceMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  // Data
  const [devices, setDevices] = useState([]);
  const [deviceToDelete, setDeviceToDelete] = useState("");
  const [copiedAccessKey, setCopiedAccessKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [maxDevices, setMaxDevices] = useState(0);
  const [editingBranch, setEditingBranch] = useState("");
  const [branchValues, setBranchValues] = useState({});



  useEffect(() => {
    const limitStr = localStorage.getItem("device_count") || "";
    setMaxDevices(parseInt(limitStr, 10) || 0);
    viewDevices();
  }, []);

  // Device Management Functions
  const maskString = (input, visibleChars = 4) => {
    if (!input) return "";
    visibleChars = Math.min(Math.max(visibleChars, 0), input.length);
    return "*".repeat(input.length - visibleChars) + input.slice(-visibleChars);
  };



  const handleBranchEdit = (accessKey, currentBranch) => {
    setEditingBranch(accessKey);
    setBranchValues(prev => ({ ...prev, [accessKey]: currentBranch || "" }));
  };

  const handleBranchKeydown = (event) => {
    if (event.key === "Enter") setEditingBranch("");
  };

  const handleBranchChange = (accessKey, value) => {
    setBranchValues(prev => ({ ...prev, [accessKey]: value }));
  };

  const copyAccessKey = async (accessKey) => {
    try {
      await navigator.clipboard.writeText(accessKey);
      setCopiedAccessKey(accessKey);
      setShowCopyTooltip(true);

      setTimeout(() => setShowCopyTooltip(false), 2000);
    } catch (err) {
      setErrorMessage("Failed to copy access key");
    }
  };

  const viewDevices = async () => {
    setIsLoading(true);
    setErrorMessage("");
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      setErrorMessage("Company ID not found");
      setShowNoDeviceMessage(true);
      setIsLoading(false);
      return;
    }

    try {
      const data = await deviceApi.getAll(companyId);
      if (data.error || data.length === 0) {
        setShowTable(false);
        setShowNoDeviceMessage(true);
        setDevices([]);
        if (data.error) setErrorMessage(data.error);
      } else {
        setDevices(Array.isArray(data) ? data : [data]);
        setShowTable(true);
        setShowNoDeviceMessage(false);
      }
    } catch (error) {
      setErrorMessage("Failed to load devices");
      setShowNoDeviceMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomString = (length = 4) => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length)
      .padEnd(length, "0");
  };

  const createAccessKey = () => {
    return `${generateRandomString(4)}${uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)}${generateRandomString(4)}`;
  };

  const addDevice = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setShowNoDeviceMessage(false);
    setShowTable(true);

    const companyId = localStorage.getItem("companyID");
    if (!companyId) {
      setErrorMessage("Company ID not found");
      setIsLoading(false);
      return;
    }

    const newDevice = {
      time_zone: "Not Registered",
      device_id: "Not Registered",
      c_id: companyId,
      device_name: "Not Registered",
      access_key: createAccessKey(),
      access_key_generated_time: new Date().toISOString(),
      last_modified_by: "Admin"
    };

    try {
      await deviceApi.create(newDevice);
      await viewDevices();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to add device");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (accessKey) => {
    setDeviceToDelete(accessKey);
    setShowDeleteModal(true);
  };

  const deleteDevice = async () => {
    if (!deviceToDelete) return;

    setShowDeleteModal(false);
    setIsLoading(true);
    setErrorMessage("");
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      setErrorMessage("Company ID not found");
      setIsLoading(false);
      return;
    }

    try {
      await deviceApi.delete(deviceToDelete, companyId);
      const updatedDevices = devices.filter(device => device.AccessKey !== deviceToDelete);
      setDevices(updatedDevices);
      if (updatedDevices.length === 0) {
        setShowTable(false);
        setShowNoDeviceMessage(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete device");
      await viewDevices();
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setDeviceToDelete("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
    <Header isAuthenticated={true}/>

      <div className="bg-gray-100 flex-1 flex flex-col pt-28 pb-19">
        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {/* Loading Overlay */}
          {isLoading && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50"
              style={{ background: "rgba(0, 0, 0, 0.5)" }}
            >
              <div className="animate-spin w-12 h-12 border-t-4 border-b-4 border-[#02066F] rounded-full"></div>
            </div>
          )}

          {/* Device Table */}
          {devices.length !== 0 && (
            <>
              <div className="relative group max-w-7xl flex justify-end px-0 md:px-4 xl:px-6 py-5">
                <button
                  className="border border-[#02066F] text-[#02066F] bg-white px-6 py-2 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={addDevice}
                  disabled={devices.length >= maxDevices}
                >
                  Add device
                </button>
              </div>

              <div className="max-w-5xl mx-auto bg-white rounded-xl overflow-hidden mb-8 border-1 border-gray-300">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Time zone
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Access Key
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Device Id
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Device Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Branch
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-center text-base font-bold tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devices.map((device) => (
                        <tr key={device.AccessKey}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            {device.time_zone || "Not Registered"}
                          </td>
                          <td className="relative px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            {maskString(device.access_key, 4)}

                            <button
                              className="ml-2 text-[#02066F] hover:text-black cursor-pointer relative"
                              onClick={() => copyAccessKey(device.access_key)}
                            >
                              <i className="far fa-copy"></i>
                            </button>

                            {showCopyTooltip &&
                              copiedAccessKey === device.access_key && (
                                <span
                                  className="absolute -top-3 left-32 transform -translate-x-1/2 
                              bg-gray-300 text-black text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap"
                                >
                                  Copied!
                                </span>
                              )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            {device.device_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            {device.device_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            {editingBranch === device.AccessKey ? (
                              <input
                                type="text"
                                value={branchValues[device.AccessKey] || ""}
                                onChange={(e) => handleBranchChange(device.AccessKey, e.target.value)}
                                onKeyDown={handleBranchKeydown}
                                onBlur={() => setEditingBranch("")}
                                className="w-full text-center border border-gray-400 rounded px-2 py-1 focus:outline-none focus:border-[#02066F]"
                                autoFocus
                              />
                            ) : (
                              branchValues[device.AccessKey] || device.branch_name || "Not Registered"
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                className="text-[#02066F] p-1 cursor-pointer hover:text-blue-800"
                                onClick={() => handleBranchEdit(device.AccessKey, device.branch_name)}
                                title="Edit Branch"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="text-red-600 p-1 cursor-pointer hover:text-red-800"
                                onClick={() => confirmDelete(device.access_key)}
                                title="Delete Device"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {devices.length >= maxDevices ? (
                <div>
                  <p className="text-center text-[#02066F] font-semibold">
                    You have reached the device registration limit. If you need
                    to add more devices, please{" "}
                    <a
                      href="/contact"
                      className="text-yellow-700 hover:underline"
                    >
                      contact!
                    </a>
                  </p>
                </div>
              ) : (
                <p className="text-center text-[#02066F] font-semibold">
                  You can add up to {maxDevices} devices.
                </p>
              )}
            </>
          )}

          {/* No Devices Message */}
          {showNoDeviceMessage && (
            <div className="text-center h-[112px]">
              <p className="text-gray-600 mb-[20px]">No device Added</p>
              <button
                className="border border-[#02066F] text-[#02066F] bg-white px-6 py-2 rounded-md transition-colors cursor-pointer "
                onClick={addDevice}
              >
                Add device
              </button>
            </div>
          )}
        </main>

        {/* Modals */}

        {/* Delete Device Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300"
            style={{ background: "rgba(0, 0, 0, 0.5)" }}
          >
            <div className="bg-white rounded-md max-w-sm w-full shadow-xl">
              <div className="flex w-full bg-[#02066F] justify-between p-2 pl-4 pr-4 items-center text-center">
                <h3 className="text-xl font-semibold p-2 text-white pl-30">
                  Delete
                </h3>
                <button
                  className="text-gray-400 hover:text-white text-4xl cursor-pointer p-2"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="p-4">
                <h5 className="font-bold text-md mb-6 text-center">
                  Are you sure, you want to remove the device?
                </h5>
                <div className="flex justify-center space-x-4">
                  <button
                    className="bg-[#02066F] opacity-80 cursor-pointer text-white px-6 py-2 rounded-md hover:opacity-70 transition-colors"
                    onClick={deleteDevice}
                  >
                    Yes
                  </button>
                  <button
                    className="border border-[#02066F] text-blue-800 px-6 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer variant="authenticated"/>
    </div>
  );
};

export default Device;

