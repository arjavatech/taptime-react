import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Tablet, 
  Clock, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

const Device = () => {
  // Device API functions
  const deviceApi = {
    getAll: async (companyId) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev'}/device/get_all/${companyId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    create: async (deviceData) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev'}/device/create`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://postgresql-restless-waterfall-2105.fly.dev'}/device/delete/${accessKey}/${companyId}/Admin`, {
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

  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [maxDevices, setMaxDevices] = useState(0);
  const [userRole] = useState("admin");

  const [formData, setFormData] = useState({
    deviceName: "",
    branchName: "",
    timeZone: "America/New_York"
  });

  useEffect(() => {
    const limitStr = localStorage.getItem("device_count") || "";
    setMaxDevices(parseInt(limitStr, 10) || 1);
    loadDevices();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const loadDevices = async () => {
    setIsLoading(true);
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      showToast("Company ID not found", "error");
      setIsLoading(false);
      return;
    }

    try {
      const data = await deviceApi.getAll(companyId);
      if (data.error || data.length === 0) {
        setDevices([]);
      } else {
        setDevices(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      showToast("Failed to load devices", "error");
      setDevices([]);
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

  const maskAccessKey = (key) => {
    if (!key) return "";
    return "*".repeat(key.length - 4) + key.slice(-4);
  };

  const copyAccessKey = async (accessKey) => {
    try {
      await navigator.clipboard.writeText(accessKey);
      setCopiedKey(accessKey);
      showToast("Access key copied to clipboard!");
      setTimeout(() => setCopiedKey(""), 2000);
    } catch (error) {
      showToast("Failed to copy access key", "error");
    }
  };

  const handleAddDevice = async () => {
    setIsAddLoading(true);
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      showToast("Company ID not found", "error");
      setIsAddLoading(false);
      return;
    }

    const newDevice = {
      timezone: null,
      device_id: null,
      c_id: companyId,
      device_name: null,
      access_key: createAccessKey(),
      access_key_generated_time: new Date().toISOString(),
      last_modified_by: "Admin"
    };

    try {
      await deviceApi.create(newDevice);
      await loadDevices();
      showToast("Device added successfully!");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to add device", "error");
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditDevice = async () => {
    if (!formData.deviceName.trim()) {
      showToast("Device name is required", "error");
      return;
    }

    setIsAddLoading(true);
    try {
      // Since there's no update API, we'll simulate it by updating the local state
      setDevices(prev => prev.map(device => 
        device.AccessKey === editingDevice.AccessKey 
          ? {
              ...device,
              device_name: formData.deviceName,
              device_id: formData.deviceName,
              branch_name: formData.branchName,
              timezone: formData.timeZone,
              last_modified_by: formData.last_modified_by
            }
          : device
      ));
      
      setEditingDevice(null);
      setShowAddModal(false);
      setFormData({ deviceName: "", branchName: "", timeZone: "America/New_York" });
      showToast("Device updated successfully!");
    } catch (error) {
      showToast("Failed to update device", "error");
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    setIsDeleteLoading(true);
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      showToast("Company ID not found", "error");
      setIsDeleteLoading(false);
      return;
    }

    try {
      await deviceApi.delete(deviceToDelete.access_key, companyId);
      const updatedDevices = devices.filter(device => device.AccessKey !== deviceToDelete.AccessKey);
      setDevices(updatedDevices);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
      showToast("Device deleted successfully!");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete device", "error");
      await loadDevices();
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const openAddDevice = async () => {
    if (devices.length >= maxDevices) {
      setShowApprovalModal(true);
      return;
    }

    await handleAddDevice();
  };

  const openEditModal = (device) => {
    setEditingDevice(device);
    
    setFormData({
      deviceName: device.device_name || device.DeviceName || "",
      branchName: device.branch_name || "",
      timeZone: device.timezone || "America/New_York"
    });
    setShowAddModal(true);
  };

  const openDeleteModal = (device) => {
    setDeviceToDelete(device);
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:right-4 sm:left-auto z-50 animate-in slide-in-from-top-2">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            toast.type === 'success' 
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
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Device Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage and monitor your registered devices
                </p>
              </div>
              <Button
                onClick={openAddDevice}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={devices.length >= maxDevices || isAddLoading}
              >
                {isAddLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="sm:inline">Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="sm:inline">Add Device</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {devices.length === 0 ? (
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Tablet className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No devices registered</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Get started by adding your first device.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={openAddDevice}
                    disabled={devices.length >= maxDevices || isAddLoading}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {isAddLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Device
                      </>
                    )}
                  </Button>
                </div>
               
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Device</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Branch</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Time Zone</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Access Key</th>
                            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devices.map((device) => (
                            <tr key={device.AccessKey || device.access_key} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Tablet className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {device.device_name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">ID: {device.device_id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium">
                                  {device.branch_name === "Not Registered" ? "Not Set" : device.branch_name}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium">
                                  {device.timezone === "Not Registered" ? "Not Set" : device.timezone}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 max-w-xs">
                                  <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono truncate">
                                    {maskAccessKey(device.access_key)}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyAccessKey(device.access_key)}
                                    className="flex items-center gap-1 text-sm px-2 flex-shrink-0"
                                  >
                                    <Copy className="w-3 h-3" />
                                    {copiedKey === device.access_key ? "Copied!" : "Copy"}
                                  </Button>
                                </div>
                              </td>
                           
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled="True"
                                    onClick={() => openEditModal(device)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteModal(device)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {devices.map((device) => (
                  <Card key={device.AccessKey || device.access_key} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tablet className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">
                              {device.device_name === "Not Registered" ? "Pending Setup" : device.device_name}
                            </CardTitle>
                            <CardDescription className="text-xs truncate">
                              ID: {device.device_id}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(device)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(device)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Time Zone:</span>
                          <span className="font-medium truncate">
                            {device.timezone === "Not Registered" ? "Not Set" : device.timezone}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="font-medium truncate">
                            {device.branch_name === "Not Registered" ? "Not Set" : device.branch_name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Access Key</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-2 py-1.5 bg-muted rounded text-xs font-mono min-w-0 truncate">
                            {maskAccessKey(device.access_key)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyAccessKey(device.access_key)}
                            className="flex items-center gap-1 text-xs px-2 flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                     
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
          
          {/* Device Limit Info */}
          {devices.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  {devices.length >= maxDevices ? (
                    <p className="text-sm text-blue-800">
                      You have reached the device registration limit ({devices.length}/{maxDevices}). 
                      <a href="/contact" className="font-medium underline hover:text-blue-900">
                        Contact us
                      </a> to add more devices.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-800">
                      Device usage: {devices.length}/{maxDevices} devices registered.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">{editingDevice ? "Edit Device" : "Add New Device"}</CardTitle>
              <CardDescription className="text-sm">
                {editingDevice ? "Update device information" : "Configure a new device for your system"}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName" className="text-sm font-medium">Device Name *</Label>
                <Input
                  id="deviceName"
                  placeholder="Enter device name"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branchName" className="text-sm font-medium">Branch Name</Label>
                <Input
                  id="branchName"
                  placeholder="Enter branch name"
                  value={formData.branchName}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeZone" className="text-sm font-medium">Time Zone</Label>
                <select
                  id="timeZone"
                  value={formData.timeZone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeZone: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingDevice ? handleEditDevice : handleAddDevice}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isAddLoading}
                >
                  {isAddLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      {editingDevice ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>{editingDevice ? "Update Device" : "Add Device"}</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Super Admin Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-orange-600 text-lg">
                <AlertCircle className="w-5 h-5" />
                Device Limit Reached
              </CardTitle>
              <CardDescription className="text-sm">
                You have reached the maximum device limit ({maxDevices}). Please contact support to add more devices.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setShowApprovalModal(false)}
                  className="w-full"
                >
                  Understood
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deviceToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-lg">
                <AlertCircle className="w-5 h-5" />
                Delete Device
              </CardTitle>
              <CardDescription className="text-sm">
                Are you sure you want to delete "{deviceToDelete.device_name}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteDevice}
                  className="flex-1 order-1 sm:order-2"
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Device"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Device;