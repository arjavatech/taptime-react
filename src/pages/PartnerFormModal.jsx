import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { X, Loader2, AlertCircle } from "lucide-react";
import { createPartner, updatePartner, clearApiCache } from "../api.js";

const RADIUS_PRESETS = [
  { label: "100 m", value: 100 },
  { label: "250 m", value: 250 },
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "Custom", value: "custom" },
];

const TIMEZONES = [
  { label: "UTC — Coordinated Universal Time",        value: "UTC" },
  { label: "GMT — Greenwich Mean Time",               value: "Europe/London" },
  { label: "IST — India Standard Time (+5:30)",       value: "Asia/Kolkata" },
  { label: "EST / EDT — US Eastern",                  value: "America/New_York" },
  { label: "CST / CDT — US Central",                  value: "America/Chicago" },
  { label: "MST / MDT — US Mountain",                 value: "America/Denver" },
  { label: "PST / PDT — US Pacific",                  value: "America/Los_Angeles" },
  { label: "AKST / AKDT — US Alaska",                 value: "America/Anchorage" },
  { label: "HST — Hawaii Standard Time",              value: "America/Honolulu" },
  { label: "AST / ADT — Atlantic (Canada)",           value: "America/Halifax" },
  { label: "NST — Newfoundland Standard Time",        value: "America/St_Johns" },
  { label: "MST — Mexico City",                       value: "America/Mexico_City" },
  { label: "BRT — Brazil (São Paulo)",                value: "America/Sao_Paulo" },
  { label: "ART — Argentina Time",                    value: "America/Argentina/Buenos_Aires" },
  { label: "CET / CEST — Central Europe",             value: "Europe/Paris" },
  { label: "EET / EEST — Eastern Europe",             value: "Europe/Helsinki" },
  { label: "MSK — Moscow Standard Time (+3)",         value: "Europe/Moscow" },
  { label: "GST — Gulf Standard Time (Dubai +4)",     value: "Asia/Dubai" },
  { label: "PKT — Pakistan Standard Time (+5)",       value: "Asia/Karachi" },
  { label: "BST — Bangladesh Standard Time (+6)",     value: "Asia/Dhaka" },
  { label: "ICT — Indochina Time (Bangkok +7)",       value: "Asia/Bangkok" },
  { label: "SGT / MYT — Singapore / Malaysia (+8)",  value: "Asia/Singapore" },
  { label: "CST — China Standard Time (+8)",          value: "Asia/Shanghai" },
  { label: "JST — Japan Standard Time (+9)",          value: "Asia/Tokyo" },
  { label: "KST — Korea Standard Time (+9)",          value: "Asia/Seoul" },
  { label: "AEST / AEDT — Australia Eastern",        value: "Australia/Sydney" },
  { label: "ACST / ACDT — Australia Central",        value: "Australia/Darwin" },
  { label: "AWST — Australia Western (+8)",           value: "Australia/Perth" },
  { label: "NZST / NZDT — New Zealand",              value: "Pacific/Auckland" },
  { label: "CAT — Central Africa Time (+2)",          value: "Africa/Johannesburg" },
  { label: "EAT — East Africa Time (+3)",             value: "Africa/Nairobi" },
  { label: "WAT — West Africa Time (+1)",             value: "Africa/Lagos" },
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

const PartnerFormModal = ({ partner, onClose, onSave }) => {
  const isEdit = Boolean(partner);

  const [form, setForm] = useState(EMPTY_FORM);
  const [radiusMode, setRadiusMode] = useState("preset");
  const [customRadius, setCustomRadius] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Pre-populate form when editing (no API call needed)
  useEffect(() => {
    if (partner) {
      const radius = Number(partner.geofence_radius_meters) || 500;
      const presetValues = RADIUS_PRESETS.filter((r) => r.value !== "custom").map((r) => r.value);
      if (!presetValues.includes(radius)) {
        setRadiusMode("custom");
        setCustomRadius(String(radius));
      } else {
        setRadiusMode("preset");
      }
      setForm({
        partner_name: partner.partner_name || "",
        contact_name: partner.contact_name || "",
        contact_email: partner.contact_email || "",
        contact_phone: partner.contact_phone || "",
        address: partner.address || "",
        latitude: partner.latitude != null ? String(partner.latitude) : "",
        longitude: partner.longitude != null ? String(partner.longitude) : "",
        geofence_radius_meters: radius,
        timezone: partner.timezone || "UTC",
        google_place_id: partner.google_place_id || "",
        notes: partner.notes || "",
      });
    }
  }, [partner]);

  // Lock background scroll + Escape to close
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    if (!radius || radius < 50 || radius > 50000) return "Geofence radius must be between 50 and 50,000 meters.";
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
        await updatePartner(partner.partner_id, payload);
      } else {
        await createPartner({ ...payload, c_id: companyId, is_active: true });
      }
      clearApiCache();
      onSave();
    } catch (err) {
      setSubmitError(err?.message || "Failed to save partner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <CardHeader className="pb-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{isEdit ? "Edit Partner" : "Add Partner"}</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                {isEdit ? "Update partner location details" : "Create a new partner location for employee assignments"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-5">

            {/* ── Partner Information ── */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Partner Information</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pm_partner_name">Partner Name *</Label>
                  <Input
                    id="pm_partner_name"
                    placeholder='e.g. Acme Corp — Downtown'
                    value={form.partner_name}
                    onChange={(e) => handleChange("partner_name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pm_contact_name">Contact Name</Label>
                    <Input
                      id="pm_contact_name"
                      placeholder="Optional"
                      value={form.contact_name}
                      onChange={(e) => handleChange("contact_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm_contact_email">Contact Email</Label>
                    <Input
                      id="pm_contact_email"
                      type="email"
                      placeholder="Optional"
                      value={form.contact_email}
                      onChange={(e) => handleChange("contact_email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm_contact_phone">Contact Phone</Label>
                    <Input
                      id="pm_contact_phone"
                      placeholder="Optional"
                      value={form.contact_phone}
                      onChange={(e) => handleChange("contact_phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pm_notes">Notes</Label>
                  <textarea
                    id="pm_notes"
                    rows={2}
                    placeholder="Optional notes about this location..."
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* ── Location & GPS ── */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Location &amp; GPS</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pm_address">Address *</Label>
                  <Input
                    id="pm_address"
                    placeholder="Enter the full location address"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pm_latitude">Latitude *</Label>
                    <Input
                      id="pm_latitude"
                      type="number"
                      step="any"
                      placeholder="e.g. 37.42216"
                      value={form.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm_longitude">Longitude *</Label>
                    <Input
                      id="pm_longitude"
                      type="number"
                      step="any"
                      placeholder="e.g. -122.08427"
                      value={form.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pm_timezone">Timezone *</Label>
                  <select
                    id="pm_timezone"
                    value={form.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* ── Geofence Settings ── */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Geofence Settings</p>
              <p className="text-xs text-muted-foreground mb-3">
                Employees must be within this radius to check in from mobile.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {RADIUS_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleRadiusChange(preset.value)}
                    className={`px-2 py-2 rounded-md text-xs border transition-colors ${
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
                    className="w-36"
                  />
                  <span className="text-sm text-muted-foreground">meters (50 – 50,000)</span>
                </div>
              )}
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Update Partner" : "Create Partner"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default PartnerFormModal;
