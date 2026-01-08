import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/layout/Header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Footer from "@/components/layout/Footer";
import { getAllDevices, createDevice, deleteDevice } from "../api.js";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  Tablet,
  Clock,
  MapPin,
  AlertCircle,
  Loader2
} from "lucide-react";

const Device = ({ accessDenied = false }) => {
  const [devices, setDevices] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [maxDevices, setMaxDevices] = useState(0);

  const [formData, setFormData] = useState({
    deviceName: "",
    branchName: "",
    timeZone: "America/New_York"
  });

  useEffect(() => {
    const limitStr = localStorage.getItem("NoOfDevices") || "";
    setMaxDevices(parseInt(limitStr, 10) || 1);
    loadDevices();
  }, []); // Only run once on component mount

  // Listen for company changes
  useEffect(() => {
    const handleCompanyChange = () => {
      const limitStr = localStorage.getItem("NoOfDevices") || "";
      setMaxDevices(parseInt(limitStr, 10) || 1);
      loadDevices();
    };

    window.addEventListener('companyChanged', handleCompanyChange);
    return () => window.removeEventListener('companyChanged', handleCompanyChange);
  }, []);

  const [centerLoading, setCenterLoading] = useState({ show: false, message: "" });

  const showCenterLoading = (message) => {
    setCenterLoading({ show: true, message });
  };

  const hideCenterLoading = () => {
    setCenterLoading({ show: false, message: "" });
  };

  const loadDevices = async () => {
    setGlobalLoading(true);
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      setGlobalLoading(false);
      return;
    }

    try {
      const data = await getAllDevices(companyId);
      if (data.error || data.length === 0) {
        setDevices([]);
      } else {
        setDevices(Array.isArray(data) ? data : [data]);
      }
    } catch (error) {
      setDevices([]);
    } finally {
      setGlobalLoading(false);
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
      setTimeout(() => setCopiedKey(""), 2000);
    } catch (error) {
      // Copy failed silently
    }
  };

  const handleAddDevice = async () => {
    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      return;
    }

    setIsSubmitting(true);
    showCenterLoading("Adding device...");

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
      await createDevice(newDevice);
      await loadDevices();
      showCenterLoading("Device added successfully!");
      setTimeout(() => hideCenterLoading(), 800);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDevice = async () => {
    if (!formData.deviceName.trim()) {
      return;
    }

    setIsSubmitting(true);
    showCenterLoading("Updating device...");

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
      showCenterLoading("Device updated successfully!");
      setTimeout(() => hideCenterLoading(), 800);
    } catch (error) {
      // Error handled silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    const companyId = localStorage.getItem("companyID");

    if (!companyId) {
      return;
    }

    setIsDeleting(true);
    showCenterLoading("Deleting device...");

    try {
      await deleteDevice(deviceToDelete.access_key, companyId);
      const updatedDevices = devices.filter(device => 
        (device.AccessKey || device.access_key) !== (deviceToDelete.AccessKey || deviceToDelete.access_key)
      );
      setDevices(updatedDevices);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
      showCenterLoading("Device deleted successfully!");
      setTimeout(() => hideCenterLoading(), 800);
    } catch (error) {
      await loadDevices();
    } finally {
      setIsDeleting(false);
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

      {accessDenied ? (
        <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Device Management</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage and monitor your registered devices
                </p>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h3>
                <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
                <p className="text-sm text-gray-500">Contact your administrator for access to device management features.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
      {/* Loading Overlay */}
      {globalLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
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
                disabled={globalLoading || devices.length >= maxDevices || centerLoading.show}
              >
                {globalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="sm:inline">{globalLoading ? "Loading..." : "Add Device"}</span>
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
                    disabled={globalLoading || devices.length >= maxDevices || centerLoading.show}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Device
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
                          {devices.map((device, index) => (
                            <tr key={device.AccessKey || device.access_key || `device-${index}`} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Tablet className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {device.device_name ?? "Pending Setup"}
                                    </div>
                                    <div className="text-sm text-muted-foreground">ID: {device.device_id ?? "Not Set"}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium">
                                  {device.branch_name ?? "Not Set"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium">
                                  {device.timezone ?? "Not Set"}
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
                {devices.map((device, index) => (
                  <Card key={device.AccessKey || device.access_key || `device-mobile-${index}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tablet className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">
                              {device.device_name ?? "Pending Setup"}
                            </CardTitle>
                            <CardDescription className="text-xs truncate">
                              ID: {device.device_id ?? "Not Set"}
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
                            {device.timezone ?? "Not Set"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="font-medium truncate">
                            {device.branch_name ?? "Not Set"}
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="device-add-modal" className="w-full max-w-md mx-4">
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
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingDevice ? "Update Device" : "Add Device"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Super Admin Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="device-approval-modal" className="w-full max-w-md mx-4">
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm modal-backdrop">
          <Card id="device-delete-modal" className="w-full max-w-md mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#01005a' }}>
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
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteDevice}
                  className="flex-1 order-1 sm:order-2 bg-[#01005a] hover:bg-[#01005a]/90 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Device
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </>
      )}
      <Footer />
    </div>
  );
};

export default Device;