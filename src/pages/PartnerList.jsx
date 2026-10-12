import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  User,
} from "lucide-react";
import {
  getPartnersByCompany,
  deletePartner,
  getAssignmentsByCompany,
  deleteAssignment,
  fetchEmployeeData,
  clearApiCache,
} from "../api.js";
import PartnerFormModal from "./PartnerFormModal";
import PartnerViewModal from "./PartnerViewModal";
import AssignmentFormModal from "./AssignmentFormModal";

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
};

const PartnerList = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem("adminType") || "";
  const canDelete = userType === "Owner" || userType === "SuperAdmin";

  // ── Tab ──
  const [activeTab, setActiveTab] = useState("partners");

  // ── Partners tab state ──
  const [partners, setPartners] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPartner, setViewingPartner] = useState(null);

  // ── Employees (pre-loaded for assignment form) ──
  const [employees, setEmployees] = useState([]);

  // ── Assignments tab state ──
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAssignmentError, setDeleteAssignmentError] = useState("");

  // ── Pagination ──
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnerPageSize, setPartnerPageSize] = useState(10);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [assignmentPageSize, setAssignmentPageSize] = useState(10);

  useEffect(() => { loadPartners(); loadEmployees(); }, []);

  useEffect(() => {
    const handleCompanyChange = () => {
      setAssignmentsLoaded(false);
      loadPartners();
    };
    window.addEventListener("companyChanged", handleCompanyChange);
    return () => window.removeEventListener("companyChanged", handleCompanyChange);
  }, []);

  const loadPartners = async () => {
    setGlobalLoading(true);
    const companyId = localStorage.getItem("companyID");
    if (!companyId) { setGlobalLoading(false); return; }
    try {
      const data = await getPartnersByCompany(companyId);
      setPartners(data);
    } catch {
      setPartners([]);
    } finally {
      setGlobalLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployeeData();
      setEmployees(Array.isArray(data) ? data.filter((e) => e.is_active !== false) : []);
    } catch {
      setEmployees([]);
    }
  };

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    const companyId = localStorage.getItem("companyID");
    if (!companyId) { setAssignmentsLoading(false); return; }
    try {
      const data = await getAssignmentsByCompany(companyId);
      setAssignments(data);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
      setAssignmentsLoaded(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "assignments" && !assignmentsLoaded) loadAssignments();
  };

  // ── Scroll lock when any delete modal is open ──
  useEffect(() => {
    const anyOpen = Boolean(partnerToDelete || assignmentToDelete);
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [partnerToDelete, assignmentToDelete]);

  // ── Partner delete ──
  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deletePartner(partnerToDelete.partner_id);
      await loadPartners();
      setPartnerToDelete(null);
    } catch (err) {
      setDeleteError(err?.message || "Failed to delete partner. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Assignment delete ──
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setIsDeletingAssignment(true);
    setDeleteAssignmentError("");
    try {
      await deleteAssignment(assignmentToDelete.assignment_id);
      await loadAssignments();
      setAssignmentToDelete(null);
    } catch (err) {
      setDeleteAssignmentError(err?.message || "Failed to delete assignment. Please try again.");
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  // ── Filtered lists ──
  const filteredPartners = partners.filter((p) =>
    !searchTerm ||
    p.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split("T")[0];
  const filteredAssignments = assignments.filter((a) => {
    if (!assignmentSearch) return true;
    const empName = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
    return (
      empName.includes(assignmentSearch.toLowerCase()) ||
      a.email?.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.partner_name?.toLowerCase().includes(assignmentSearch.toLowerCase())
    );
  });

  // ── Paginated slices ──
  const partnerTotalPages = Math.ceil(filteredPartners.length / partnerPageSize);
  const partnerStart = (partnerPage - 1) * partnerPageSize;
  const paginatedPartners = filteredPartners.slice(partnerStart, partnerStart + partnerPageSize);

  const assignmentTotalPages = Math.ceil(filteredAssignments.length / assignmentPageSize);
  const assignmentStart = (assignmentPage - 1) * assignmentPageSize;
  const paginatedAssignments = filteredAssignments.slice(assignmentStart, assignmentStart + assignmentPageSize);

  // Reset to page 1 when search or page size changes
  useEffect(() => { setPartnerPage(1); }, [searchTerm, partnerPageSize]);
  useEffect(() => { setAssignmentPage(1); }, [assignmentSearch, assignmentPageSize]);

  const getAssignmentStatus = (a) => {
    if (a.is_active === false) return { label: "Inactive", color: "text-gray-500", icon: XCircle };
    if (a.start_date <= today && a.end_date >= today) return { label: "Active today", color: "text-green-600", icon: CheckCircle };
    if (a.start_date > today) return { label: "Upcoming", color: "text-blue-600", icon: Calendar };
    return { label: "Expired", color: "text-gray-400", icon: XCircle };
  };

  const TABS = [
    { key: "partners", label: "Partner Management", icon: Building2 },
    { key: "assignments", label: "Employee Assignments", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {globalLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </div>
      )}

      <div className="pt-20 pb-8 flex-grow bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Page Header */}
        <div className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Partners</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Manage partner locations and employee assignments
                </p>
              </div>
              {activeTab === "partners" && (
                <Button
                  onClick={() => { setEditingPartner(null); setShowFormModal(true); }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Partner
                </Button>
              )}
              {activeTab === "assignments" && (
                <Button
                  onClick={() => { setEditingAssignment(null); setShowAssignmentModal(true); }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Assignment
                </Button>
              )}
            </div>

            {/* Tab bar */}
            <nav className="flex gap-1 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

          {/* ═══════ PARTNER MANAGEMENT TAB ═══════ */}
          {activeTab === "partners" && (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, address, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {filteredPartners.length === 0 && !globalLoading ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {partners.length === 0 ? "No partners yet" : "No results found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {partners.length === 0
                        ? "Add your first partner location to start assigning employees."
                        : "Try adjusting your search."}
                    </p>
                    {partners.length === 0 && (
                      <Button
                        onClick={() => { setEditingPartner(null); setShowFormModal(true); }}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Add Partner
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Card>
                      <CardHeader className="py-3 px-4 border-b flex-row items-center justify-end gap-2">
                        <Label htmlFor="partner-page-size" className="text-sm whitespace-nowrap">Records per page:</Label>
                        <select
                          id="partner-page-size"
                          value={partnerPageSize}
                          onChange={(e) => setPartnerPageSize(parseInt(e.target.value))}
                          className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Partner</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Address</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Radius</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedPartners.map((partner) => (
                                <tr
                                  key={partner.partner_id}
                                  className="border-b hover:bg-muted/30 cursor-pointer"
                                  onClick={() => { setViewingPartner(partner); setShowViewModal(true); }}
                                >
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-4 h-4 text-primary" />
                                      </div>
                                      <span className="font-medium">{partner.partner_name}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-xs">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{partner.address || "—"}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="text-sm">
                                      {partner.contact_name && <div className="font-medium">{partner.contact_name}</div>}
                                      {partner.contact_email && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Mail className="w-3 h-3" />{partner.contact_email}
                                        </div>
                                      )}
                                      {partner.contact_phone && (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                          <Phone className="w-3 h-3" />{partner.contact_phone}
                                        </div>
                                      )}
                                      {!partner.contact_name && !partner.contact_email && !partner.contact_phone && "—"}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm">
                                    {partner.geofence_radius_meters >= 1000
                                      ? `${partner.geofence_radius_meters / 1000} km`
                                      : `${partner.geofence_radius_meters} m`}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      partner.is_active !== false
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                      {partner.is_active !== false ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div
                                      className="flex items-center justify-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setViewingPartner(partner); setShowViewModal(true); }}
                                        className="h-8 w-8 p-0" title="View"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost" size="sm"
                                        onClick={() => { setEditingPartner(partner); setShowFormModal(true); }}
                                        className="h-8 w-8 p-0" title="Edit"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      {canDelete && (
                                        <Button
                                          variant="ghost" size="sm"
                                          onClick={() => setPartnerToDelete(partner)}
                                          className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200">
                          <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                            Showing {partnerStart + 1}-{Math.min(partnerStart + partnerPageSize, filteredPartners.length)} of {filteredPartners.length}
                          </div>
                          {partnerTotalPages > 1 && (
                            <div className="flex items-center gap-3 order-1 sm:order-2">
                              <button
                                onClick={() => setPartnerPage((p) => Math.max(p - 1, 1))}
                                disabled={partnerPage === 1}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  partnerPage === 1
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }`}
                              >
                                Prev
                              </button>
                              <span className="text-sm font-medium text-gray-900 px-2">
                                {partnerPage} / {partnerTotalPages}
                              </span>
                              <button
                                onClick={() => setPartnerPage((p) => Math.min(p + 1, partnerTotalPages))}
                                disabled={partnerPage === partnerTotalPages}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  partnerPage === partnerTotalPages
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {paginatedPartners.map((partner) => (
                      <Card
                        key={partner.partner_id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => { setViewingPartner(partner); setShowViewModal(true); }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate">{partner.partner_name}</div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  partner.is_active !== false
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                  {partner.is_active !== false ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => { setEditingPartner(partner); setShowFormModal(true); }}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => setPartnerToDelete(partner)}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {partner.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{partner.address}</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Geofence: {partner.geofence_radius_meters >= 1000
                              ? `${partner.geofence_radius_meters / 1000} km`
                              : `${partner.geofence_radius_meters} m`}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 md:hidden">
                    <p className="text-sm text-muted-foreground">
                      Showing {partnerStart + 1}-{Math.min(partnerStart + partnerPageSize, filteredPartners.length)} of {filteredPartners.length}
                    </p>
                    {partnerTotalPages > 1 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPartnerPage((p) => Math.max(p - 1, 1))}
                          disabled={partnerPage === 1}
                          className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                            partnerPage === 1
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Prev
                        </button>
                        <span className="text-sm font-medium text-gray-900 px-2">
                          {partnerPage} / {partnerTotalPages}
                        </span>
                        <button
                          onClick={() => setPartnerPage((p) => Math.min(p + 1, partnerTotalPages))}
                          disabled={partnerPage === partnerTotalPages}
                          className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                            partnerPage === partnerTotalPages
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ═══════ EMPLOYEE ASSIGNMENTS TAB ═══════ */}
          {activeTab === "assignments" && (
            <>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee or partner..."
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredAssignments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {assignments.length === 0 ? "No assignments yet" : "No results found"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {assignments.length === 0
                        ? "Assign employees to partner locations to get started."
                        : "Try adjusting your search."}
                    </p>
                    {assignments.length === 0 && (
                      <Button
                        onClick={() => { setEditingAssignment(null); setShowAssignmentModal(true); }}
                        className="flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Add Assignment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Card>
                      <CardHeader className="py-3 px-4 border-b flex-row items-center justify-end gap-2">
                        <Label htmlFor="assignment-page-size" className="text-sm whitespace-nowrap">Records per page:</Label>
                        <select
                          id="assignment-page-size"
                          value={assignmentPageSize}
                          onChange={(e) => setAssignmentPageSize(parseInt(e.target.value))}
                          className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                        </select>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Partner</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Period</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Manage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedAssignments.map((a) => {
                                const empName = [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email || "—";
                                const status = getAssignmentStatus(a);
                                const StatusIcon = status.icon;
                                return (
                                  <tr key={a.assignment_id} className="border-b hover:bg-muted/30">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                          <User className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium">{empName}</div>
                                          {a.email && a.first_name && (
                                            <div className="text-xs text-muted-foreground">{a.email}</div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-1.5 text-sm">
                                        <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                        {a.partner_name || "—"}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                      {formatDate(a.start_date)} – {formatDate(a.end_date)}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {status.label}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          variant="ghost" size="sm"
                                          onClick={() => { setEditingAssignment(a); setShowAssignmentModal(true); }}
                                          className="h-8 w-8 p-0" title="Edit"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        {canDelete && (
                                          <Button
                                            variant="ghost" size="sm"
                                            onClick={() => setAssignmentToDelete(a)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200">
                          <div className="text-sm sm:text-base text-muted-foreground order-2 sm:order-1">
                            Showing {assignmentStart + 1}-{Math.min(assignmentStart + assignmentPageSize, filteredAssignments.length)} of {filteredAssignments.length}
                          </div>
                          {assignmentTotalPages > 1 && (
                            <div className="flex items-center gap-3 order-1 sm:order-2">
                              <button
                                onClick={() => setAssignmentPage((p) => Math.max(p - 1, 1))}
                                disabled={assignmentPage === 1}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  assignmentPage === 1
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }`}
                              >
                                Prev
                              </button>
                              <span className="text-sm font-medium text-gray-900 px-2">
                                {assignmentPage} / {assignmentTotalPages}
                              </span>
                              <button
                                onClick={() => setAssignmentPage((p) => Math.min(p + 1, assignmentTotalPages))}
                                disabled={assignmentPage === assignmentTotalPages}
                                className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                                  assignmentPage === assignmentTotalPages
                                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                    : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                                }`}
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {paginatedAssignments.map((a) => {
                      const empName = [a.first_name, a.last_name].filter(Boolean).join(" ") || a.email || "—";
                      const status = getAssignmentStatus(a);
                      const StatusIcon = status.icon;
                      return (
                        <Card key={a.assignment_id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{empName}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3" />{a.partner_name || "—"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatDate(a.start_date)} – {formatDate(a.end_date)}
                                </div>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${status.color}`}>
                                  <StatusIcon className="w-3 h-3" />{status.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => { setEditingAssignment(a); setShowAssignmentModal(true); }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost" size="sm"
                                    onClick={() => setAssignmentToDelete(a)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 md:hidden">
                    <p className="text-sm text-muted-foreground">
                      Showing {assignmentStart + 1}-{Math.min(assignmentStart + assignmentPageSize, filteredAssignments.length)} of {filteredAssignments.length}
                    </p>
                    {assignmentTotalPages > 1 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAssignmentPage((p) => Math.max(p - 1, 1))}
                          disabled={assignmentPage === 1}
                          className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                            assignmentPage === 1
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Prev
                        </button>
                        <span className="text-sm font-medium text-gray-900 px-2">
                          {assignmentPage} / {assignmentTotalPages}
                        </span>
                        <button
                          onClick={() => setAssignmentPage((p) => Math.min(p + 1, assignmentTotalPages))}
                          disabled={assignmentPage === assignmentTotalPages}
                          className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                            assignmentPage === assignmentTotalPages
                              ? "text-gray-400 border-gray-200 cursor-not-allowed"
                              : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Partner View Modal ── */}
      {showViewModal && viewingPartner && (
        <PartnerViewModal
          partner={viewingPartner}
          onClose={() => { setShowViewModal(false); setViewingPartner(null); }}
          onPartnerUpdated={async () => { await loadPartners(); }}
        />
      )}

      {/* ── Partner Add/Edit Modal ── */}
      {showFormModal && (
        <PartnerFormModal
          partner={editingPartner}
          onClose={() => { setShowFormModal(false); setEditingPartner(null); }}
          onSave={async () => {
            setShowFormModal(false);
            setEditingPartner(null);
            await loadPartners();
          }}
        />
      )}

      {/* ── Assignment Add/Edit Modal ── */}
      {showAssignmentModal && (
        <AssignmentFormModal
          assignment={editingAssignment}
          partners={partners}
          employees={employees}
          onClose={() => { setShowAssignmentModal(false); setEditingAssignment(null); }}
          onSave={async () => {
            setShowAssignmentModal(false);
            setEditingAssignment(null);
            await loadAssignments();
          }}
        />
      )}

      {/* ── Delete Partner Modal ── */}
      {partnerToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          onKeyDown={(e) => { if (e.key === "Escape" && !isDeleting) { setPartnerToDelete(null); setDeleteError(""); } }}
          tabIndex={-1}
        >
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <h3 className="text-lg font-semibold">Delete Partner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete <strong>{partnerToDelete.partner_name}</strong>? This will
                also deactivate all employee assignments linked to this partner.
              </p>
              {deleteError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {deleteError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => { setPartnerToDelete(null); setDeleteError(""); }} className="flex-1" disabled={isDeleting}>
                  Cancel
                </Button>
                <Button onClick={handleDeletePartner} className="flex-1 bg-destructive hover:bg-destructive/90 text-white" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Partner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Delete Assignment Modal ── */}
      {assignmentToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          onKeyDown={(e) => { if (e.key === "Escape" && !isDeletingAssignment) { setAssignmentToDelete(null); setDeleteAssignmentError(""); } }}
          tabIndex={-1}
        >
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <h3 className="text-lg font-semibold">Delete Assignment</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to remove the assignment for{" "}
                <strong>
                  {[assignmentToDelete.first_name, assignmentToDelete.last_name].filter(Boolean).join(" ") || assignmentToDelete.email || "this employee"}
                </strong>{" "}
                at <strong>{assignmentToDelete.partner_name}</strong>?
              </p>
              {deleteAssignmentError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {deleteAssignmentError}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => { setAssignmentToDelete(null); setDeleteAssignmentError(""); }} className="flex-1" disabled={isDeletingAssignment}>
                  Cancel
                </Button>
                <Button onClick={handleDeleteAssignment} className="flex-1 bg-destructive hover:bg-destructive/90 text-white" disabled={isDeletingAssignment}>
                  {isDeletingAssignment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Assignment
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

export default PartnerList;
