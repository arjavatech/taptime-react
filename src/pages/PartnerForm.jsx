import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  getPartnerById,
  createPartner,
  updatePartner,
  clearApiCache,
} from "../api.js";

const RADIUS_PRESETS = [
  { label: "100 m", value: 100 },
  { label: "250 m", value: 250 },
  { label: "500 m (default)", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "Custom", value: "custom" },
];

const TIMEZONES = [
  { label: "UTC — Coordinated Universal Time",         value: "UTC" },
  { label: "GMT — Greenwich Mean Time",                value: "Europe/London" },
  { label: "IST — India Standard Time (+5:30)",        value: "Asia/Kolkata" },
  { label: "EST / EDT — US Eastern",                   value: "America/New_York" },
  { label: "CST / CDT — US Central",                   value: "America/Chicago" },
  { label: "MST / MDT — US Mountain",                  value: "America/Denver" },
  { label: "PST / PDT — US Pacific",                   value: "America/Los_Angeles" },
  { label: "AKST / AKDT — US Alaska",                  value: "America/Anchorage" },
  { label: "HST — Hawaii Standard Time",               value: "America/Honolulu" },
  { label: "AST / ADT — Atlantic (Canada)",            value: "America/Halifax" },
  { label: "NST — Newfoundland Standard Time",         value: "America/St_Johns" },
  { label: "MST — Mexico City",                        value: "America/Mexico_City" },
  { label: "BRT — Brazil (São Paulo)",                 value: "America/Sao_Paulo" },
  { label: "ART — Argentina Time",                     value: "America/Argentina/Buenos_Aires" },
  { label: "CET / CEST — Central Europe",              value: "Europe/Paris" },
  { label: "EET / EEST — Eastern Europe",              value: "Europe/Helsinki" },
  { label: "MSK — Moscow Standard Time (+3)",          value: "Europe/Moscow" },
  { label: "GST — Gulf Standard Time (Dubai +4)",      value: "Asia/Dubai" },
  { label: "PKT — Pakistan Standard Time (+5)",        value: "Asia/Karachi" },
  { label: "BST — Bangladesh Standard Time (+6)",      value: "Asia/Dhaka" },
  { label: "ICT — Indochina Time (Bangkok +7)",        value: "Asia/Bangkok" },
  { label: "SGT / MYT — Singapore / Malaysia (+8)",   value: "Asia/Singapore" },
  { label: "CST — China Standard Time (+8)",           value: "Asia/Shanghai" },
  { label: "JST — Japan Standard Time (+9)",           value: "Asia/Tokyo" },
  { label: "KST — Korea Standard Time (+9)",           value: "Asia/Seoul" },
  { label: "AEST / AEDT — Australia Eastern",         value: "Australia/Sydney" },
  { label: "ACST / ACDT — Australia Central",         value: "Australia/Darwin" },
  { label: "AWST — Australia Western (+8)",            value: "Australia/Perth" },
  { label: "NZST / NZDT — New Zealand",               value: "Pacific/Auckland" },
  { label: "CAT — Central Africa Time (+2)",           value: "Africa/Johannesburg" },
  { label: "EAT — East Africa Time (+3)",              value: "Africa/Nairobi" },
  { label: "WAT — West Africa Time (+1)",              value: "Africa/Lagos" },
];

const EMPTY_FORM = {
  partner_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  latitude: "",
  longitude: "",
  geofence_radius_meters: 500,
  timezone: "UTC",
  google_place_id: "",
  notes: "",
};

const PartnerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [radiusMode, setRadiusMode] = useState("preset");
  const [customRadius, setCustomRadius] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) loadPartner();
  }, [id]);

  const loadPartner = async () => {
    setLoading(true);
    try {
      const data = await getPartnerById(id);
      const radius = Number(data.geofence_radius_meters) || 500;
      const presetValues = RADIUS_PRESETS.filter((r) => r.value !== "custom").map((r) => r.value);
      if (!presetValues.includes(radius)) {
        setRadiusMode("custom");
        setCustomRadius(String(radius));
      }
      setForm({
        partner_name: data.partner_name || "",
        contact_name: data.contact_name || "",
        contact_email: data.contact_email || "",
        contact_phone: data.contact_phone || "",
        address: data.address || "",
        latitude: data.latitude != null ? String(data.latitude) : "",
        longitude: data.longitude != null ? String(data.longitude) : "",
        geofence_radius_meters: radius,
        timezone: data.timezone || "UTC",
        google_place_id: data.google_place_id || "",
        notes: data.notes || "",
      });
    } catch {
      // if not found, stay on blank form
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRadiusChange = (val) => {
    if (val === "custom") {
      setRadiusMode("custom");
    } else {
      setRadiusMode("preset");
      setForm((prev) => ({ ...prev, geofence_radius_meters: Number(val) }));
    }
  };

  const validate = () => {
    if (!form.partner_name.trim()) return "Partner name is required.";
    if (!form.address.trim()) return "Address is required.";
    if (form.latitude === "" || form.longitude === "") return "Latitude and Longitude are required.";
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
    if (isNaN(lng) || lng < -180 || lng > 180) return "Longitude must be between -180 and 180.";
    const radius = radiusMode === "custom" ? Number(customRadius) : Number(form.geofence_radius_meters);
    if (!radius || radius < 50 || radius > 50000) return "Geofence radius must be between 50 and 50000 meters.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const err = validate();
    if (err) { setSubmitError(err); return; }

    setIsSubmitting(true);
    const companyId = localStorage.getItem("companyID");
    const lastModifiedBy = localStorage.getItem("adminMail") || "Admin";
    const radius = radiusMode === "custom" ? Number(customRadius) : Number(form.geofence_radius_meters);

    const payload = {
      partner_name: form.partner_name.trim(),
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      address: form.address.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      geofence_radius_meters: radius,
      timezone: form.timezone,
      google_place_id: form.google_place_id || null,
      notes: form.notes.trim() || null,
      last_modified_by: lastModifiedBy,
    };

    try {
      if (isEdit) {
        await updatePartner(id, payload);
      } else {
        await createPartner({ ...payload, c_id: companyId, is_active: true });
      }
      clearApiCache();
      navigate("/partners");
    } catch (err) {
      setSubmitError(err?.message || "Failed to save partner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/partners")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {isEdit ? "Edit Partner" : "Add Partner"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isEdit ? "Update partner location details" : "Create a new partner location for employee assignments"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Partner Information</CardTitle>
                <CardDescription>Basic details about this partner location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partner_name">Partner Name *</Label>
                  <Input
                    id="partner_name"
                    placeholder="e.g. Acme Corp — Downtown"
                    value={form.partner_name}
                    onChange={(e) => handleChange("partner_name", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a descriptive name that includes the site if the partner has multiple locations (e.g. "Acme Corp — Northside").
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      placeholder="Optional"
                      value={form.contact_name}
                      onChange={(e) => handleChange("contact_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="Optional"
                      value={form.contact_email}
                      onChange={(e) => handleChange("contact_email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      placeholder="Optional"
                      value={form.contact_phone}
                      onChange={(e) => handleChange("contact_phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Optional notes about this location..."
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & GPS */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Location & GPS</CardTitle>
                <CardDescription>
                  Enter the address and GPS coordinates for this partner location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter the full location address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                {/* Lat / Lng */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude *</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 37.42216"
                      value={form.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude *</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. -122.08427"
                      value={form.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                    />
                  </div>
                </div>
                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <select
                    id="timezone"
                    value={form.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Geofencing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Geofence Settings</CardTitle>
                <CardDescription>
                  Employees must be within this radius of the location to check in from their mobile app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Geofence Radius *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RADIUS_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleRadiusChange(preset.value)}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                          (preset.value === "custom" && radiusMode === "custom") ||
                          (preset.value !== "custom" && radiusMode === "preset" && form.geofence_radius_meters === preset.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  {radiusMode === "custom" && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min={50}
                        max={50000}
                        placeholder="e.g. 750"
                        value={customRadius}
                        onChange={(e) => setCustomRadius(e.target.value)}
                        className="w-40"
                      />
                      <span className="text-sm text-muted-foreground">meters (50 – 50,000)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error + Actions */}
            {submitError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/partners")}
                className="flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 order-1 sm:order-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Update Partner" : "Create Partner"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PartnerForm;
