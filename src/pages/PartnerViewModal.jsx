import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { X, Edit, MapPin, Radio, User, Mail, Phone, StickyNote, ExternalLink } from "lucide-react";
import PartnerFormModal from "./PartnerFormModal";

const Section = ({ icon: Icon, title, children }) => (
  <div className="rounded-xl overflow-hidden border border-gray-200">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-primary">
      <Icon className="w-4 h-4 text-white" />
      <span className="text-xs font-semibold text-white uppercase tracking-wider">{title}</span>
    </div>
    <div className="bg-white px-4 py-4 space-y-3">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
    <p className="text-sm font-medium text-foreground">{value || "—"}</p>
  </div>
);

const PartnerViewModal = ({ partner, onClose, onPartnerUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const userType = localStorage.getItem("adminType") || "";
  const canEdit = ["Owner", "Admin", "SuperAdmin"].includes(userType);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const radiusLabel = partner.geofence_radius_meters >= 1000
    ? `${partner.geofence_radius_meters / 1000} km`
    : `${partner.geofence_radius_meters} m`;

  const hasContact = partner.contact_name || partner.contact_email || partner.contact_phone;

  if (showEditModal) {
    return (
      <PartnerFormModal
        partner={partner}
        onClose={() => setShowEditModal(false)}
        onSave={async () => {
          setShowEditModal(false);
          onPartnerUpdated?.();
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg sm:mx-4 max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl bg-white">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{partner.partner_name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                partner.is_active !== false
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {partner.is_active !== false ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="h-8 px-3 text-xs flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">

          <Section icon={MapPin} title="Location">
            <Field label="Address" value={partner.address} />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Latitude"
                value={partner.latitude != null ? Number(partner.latitude).toFixed(6) : null}
              />
              <Field
                label="Longitude"
                value={partner.longitude != null ? Number(partner.longitude).toFixed(6) : null}
              />
            </div>
            {partner.latitude != null && partner.longitude != null && (
              <a
                href={`https://maps.google.com/?q=${partner.latitude},${partner.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Open in Google Maps
              </a>
            )}
          </Section>

          <Section icon={Radio} title="Geofence & Timezone">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in Radius" value={radiusLabel} />
              <Field label="Timezone" value={partner.timezone || "UTC"} />
            </div>
          </Section>

          {hasContact && (
            <Section icon={User} title="Contact">
              {partner.contact_name && <Field label="Name" value={partner.contact_name} />}
              {partner.contact_email && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <a
                    href={`mailto:${partner.contact_email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {partner.contact_email}
                  </a>
                </div>
              )}
              {partner.contact_phone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {partner.contact_phone}
                  </p>
                </div>
              )}
            </Section>
          )}

          {partner.notes && (
            <Section icon={StickyNote} title="Notes">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {partner.notes}
              </p>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-white flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerViewModal;
