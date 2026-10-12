import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import {
  ArrowLeft,
  Edit,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  Radio,
  Clock,
  StickyNote,
  Loader2,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getPartnerById, getAssignmentsByPartner } from "../api.js";
import PartnerFormModal from "./PartnerFormModal";

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const PartnerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [partner, setPartner] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  const userType = localStorage.getItem("adminType") || "";
  const canEdit = ["Owner", "Admin", "SuperAdmin"].includes(userType);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadPartner();
      loadAssignments();
    }
  }, [id]);

  const loadPartner = async () => {
    setLoading(true);
    try {
      const data = await getPartnerById(id);
      setPartner(data);
    } catch {
      setPartner(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const data = await getAssignmentsByPartner(id);
      setAssignments(data);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
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

  if (!partner) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Partner not found</h2>
            <Button onClick={() => navigate("/partners")}>Back to Partners</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const radiusLabel = partner.geofence_radius_meters >= 1000
    ? `${partner.geofence_radius_meters / 1000} km`
    : `${partner.geofence_radius_meters} m`;

  const today = new Date().toISOString().split("T")[0];
  const activeAssignments = assignments.filter(
    (a) => a.is_active !== false && a.start_date <= today && a.end_date >= today
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/partners")}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">{partner.partner_name}</h1>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      partner.is_active !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {partner.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Partner location details</p>
                </div>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Partner Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm font-medium">{partner.address || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Latitude</p>
                    <p className="text-sm font-mono">{partner.latitude != null ? Number(partner.latitude).toFixed(6) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Longitude</p>
                    <p className="text-sm font-mono">{partner.longitude != null ? Number(partner.longitude).toFixed(6) : "—"}</p>
                  </div>
                </div>
                {partner.latitude != null && partner.longitude != null && (
                  <a
                    href={`https://maps.google.com/?q=${partner.latitude},${partner.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="w-3 h-3" />
                    Open in Google Maps
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Geofence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Geofence &amp; Timezone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Check-in Radius</p>
                  <p className="text-sm font-medium">{radiusLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Employees must be within {radiusLabel} to check in via mobile app.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Timezone
                  </p>
                  <p className="text-sm font-medium">{partner.timezone || "UTC"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {(partner.contact_name || partner.contact_email || partner.contact_phone) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {partner.contact_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{partner.contact_name}</p>
                    </div>
                  )}
                  {partner.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <a href={`mailto:${partner.contact_email}`} className="text-sm text-primary hover:underline">
                        {partner.contact_email}
                      </a>
                    </div>
                  )}
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <p className="text-sm">{partner.contact_phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {partner.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-primary" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{partner.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Employee Assignments
                  </CardTitle>
                  <CardDescription>
                    {activeAssignments.length} active today · {assignments.length} total
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/assignments/create?partner_id=${id}`)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Employee
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No employees assigned to this location yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Employee</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Period</th>
                        <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => {
                        const isActiveToday =
                          a.is_active !== false && a.start_date <= today && a.end_date >= today;
                        const empName =
                          a.first_name || a.last_name
                            ? `${a.first_name || ""} ${a.last_name || ""}`.trim()
                            : a.email || "—";
                        return (
                          <tr key={a.assignment_id} className="border-b hover:bg-muted/30">
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-primary" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{empName}</div>
                                  {a.email && a.first_name && (
                                    <div className="text-xs text-muted-foreground">{a.email}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-sm">
                              {formatDate(a.start_date)} – {formatDate(a.end_date)}
                            </td>
                            <td className="py-2 px-3">
                              {isActiveToday ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Active today
                                </span>
                              ) : a.is_active === false ? (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <XCircle className="w-3 h-3" />
                                  Inactive
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {a.start_date > today ? "Upcoming" : "Expired"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {showEditModal && partner && (
        <PartnerFormModal
          partner={partner}
          onClose={() => setShowEditModal(false)}
          onSave={async () => {
            setShowEditModal(false);
            await loadPartner();
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default PartnerDetail;
