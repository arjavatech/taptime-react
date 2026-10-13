import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import CenterLoadingOverlay from "../components/ui/CenterLoadingOverlay";
import { HamburgerIcon } from "../components/icons/HamburgerIcon";
import { GridIcon } from "../components/icons/GridIcon";
import {
  Search, Building2, Calendar, CheckCircle, XCircle, Eye,
  ArrowUp, ArrowDown, ChevronDown, Check, Filter, X, Users,
  LogIn, Clock, Minus,
} from "lucide-react";
import AssignmentViewModal from "./AssignmentViewModal";
import { fetchMyEmployeeProfile, getAssignmentsByEmployee } from "../api";

const TODAY = new Date().toISOString().split("T")[0];

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return d;
  }
};

const getStatus = (a) => {
  if (a.is_active === false) return { label: "Inactive", color: "text-gray-500", icon: XCircle };
  if (a.start_date <= TODAY && a.end_date >= TODAY) return { label: "Active today", color: "text-green-600", icon: CheckCircle };
  if (a.start_date > TODAY) return { label: "Upcoming", color: "text-blue-600", icon: Calendar };
  return { label: "Expired", color: "text-gray-400", icon: XCircle };
};

const getActivityStatus = (a) => {
  if (a.has_pending_checkout) return { label: "Checked In", color: "text-emerald-700", bg: "bg-emerald-50", icon: LogIn };
  if (a.has_completed_sessions) return { label: "Worked", color: "text-blue-700", bg: "bg-blue-50", icon: Clock };
  return { label: "Not Started", color: "text-gray-400", bg: "bg-gray-50", icon: Minus };
};

const MyAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("active-upcoming");
  const [viewMode, setViewMode] = useState("table");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewingAssignment, setViewingAssignment] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await fetchMyEmployeeProfile();
        const empId = profile?.emp_id || profile?.data?.emp_id;
        if (!empId) { setLoading(false); return; }
        const data = await getAssignmentsByEmployee(empId);
        const list = Array.isArray(data) ? data : [];
        const firstName = profile?.first_name || profile?.data?.first_name || "";
        const lastName = profile?.last_name || profile?.data?.last_name || "";
        const email = profile?.email || profile?.data?.email || "";
        setAssignments(list.map(a => ({ ...a, first_name: firstName, last_name: lastName, email })));
      } catch {
        setError("Could not load your assignments. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => { setPage(1); }, [tab, search, partnerFilter, sortConfig]);

  const activeUpcomingCount = assignments.filter(a => a.is_active !== false && a.end_date >= TODAY).length;
  const pastCount = assignments.filter(a => a.end_date < TODAY || a.is_active === false).length;

  const partnerOptions = Array.from(new Set(assignments.map(a => a.partner_name).filter(Boolean))).sort();

  const filtered = assignments
    .filter(a => tab === "active-upcoming"
      ? a.is_active !== false && a.end_date >= TODAY
      : a.end_date < TODAY || a.is_active === false)
    .filter(a => !search ||
      a.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.address?.toLowerCase().includes(search.toLowerCase()))
    .filter(a => !partnerFilter || partnerFilter === "All" || a.partner_name === partnerFilter)
    .sort((a, b) => {
      if (sortConfig.key === "name") {
        const av = a.partner_name?.toLowerCase() || "";
        const bv = b.partner_name?.toLowerCase() || "";
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <CenterLoadingOverlay show={loading} />

      <div className="pt-20 pb-8 flex-grow">
        {/* Page Header */}
        <div className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Assignments</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              View your partner location assignments
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by partner or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-start flex-wrap">
              {/* Filter toggle */}
              {!showFilterPanel ? (
                <Button
                  variant="outline"
                  className="px-3 py-2 h-auto text-sm flex items-center gap-2"
                  onClick={() => setShowFilterPanel(true)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="px-3 py-2 h-auto text-sm flex items-center gap-2"
                  onClick={() => { setShowFilterPanel(false); setPartnerFilter(""); setPage(1); }}
                >
                  <X className="w-4 h-4" />
                  Hide Filters
                </Button>
              )}

              {/* Sort dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="px-3 py-2 h-auto text-sm flex items-center gap-2 min-w-[140px] justify-between"
                  onClick={() => document.getElementById("my-sort-dropdown").classList.toggle("hidden")}
                >
                  <div className="flex items-center gap-2">
                    {sortConfig.direction === "asc"
                      ? <ArrowUp className="w-4 h-4 text-green-600" />
                      : <ArrowDown className="w-4 h-4 text-blue-600" />}
                    <span>{sortConfig.key === "name" ? "Sort By Name" : "Sort"}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div
                  id="my-sort-dropdown"
                  className="absolute top-full left-0 mt-1 w-48 bg-background border border-input rounded-md shadow-lg z-10 hidden"
                >
                  {[
                    { key: "name", direction: "asc", label: "Sort By Name", Icon: ArrowUp },
                    { key: "name", direction: "desc", label: "Sort By Name", Icon: ArrowDown },
                  ].map(({ key, direction, label, Icon }) => (
                    <button
                      key={`${key}-${direction}`}
                      onClick={() => {
                        setSortConfig({ key, direction });
                        document.getElementById("my-sort-dropdown").classList.add("hidden");
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between transition-colors ${
                        sortConfig.key === key && sortConfig.direction === direction
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${direction === "asc" ? "text-green-600" : "text-blue-600"}`} />
                        {label}
                      </div>
                      {sortConfig.key === key && sortConfig.direction === direction && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-white">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8 p-0"
                  title="Table View"
                >
                  <HamburgerIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                  title="Grid View"
                >
                  <GridIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="mb-6 p-6 bg-white border border-input rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="my-partner-filter" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Partner
                  </label>
                  <div className="relative">
                    <select
                      id="my-partner-filter"
                      value={partnerFilter}
                      onChange={(e) => setPartnerFilter(e.target.value)}
                      className="w-full h-10 px-4 text-sm border border-input rounded-lg bg-background cursor-pointer appearance-none hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">All Partners</option>
                      {partnerOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtabs */}
          <div className="flex gap-1 mb-4 border-b border-border">
            <button
              onClick={() => { setTab("active-upcoming"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "active-upcoming"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Active &amp; Upcoming ({activeUpcomingCount})
            </button>
            <button
              onClick={() => { setTab("past"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === "past"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Past ({pastCount})
            </button>
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {/* Table / Grid Card */}
          <Card>
            <CardHeader className={`py-3 px-4 flex-row items-center justify-end gap-2 ${viewMode === "table" ? "border-b" : ""}`}>
              <Label htmlFor="my-page-size" className="text-sm whitespace-nowrap">Records per page:</Label>
              <select
                id="my-page-size"
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
                className="h-8 px-2 text-sm border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </CardHeader>

            <CardContent className="p-0">
              {/* Table View */}
              {viewMode === "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white">Partner</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white">Address</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white">Period</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-white">Activity</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-white">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center text-muted-foreground">
                            <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
                            <p>{tab === "active-upcoming" ? "No active or upcoming assignments" : "No past assignments"}</p>
                          </td>
                        </tr>
                      ) : paginated.map((a) => {
                        const status = getStatus(a);
                        const StatusIcon = status.icon;
                        const activity = getActivityStatus(a);
                        const ActivityIcon = activity.icon;
                        return (
                          <tr key={a.assignment_id} className="border-b hover:bg-muted/30">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                {a.partner_name || "—"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground max-w-[220px] truncate">
                              {a.address || "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(a.start_date)} – {formatDate(a.end_date)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${activity.color}`}>
                                <ActivityIcon className="w-3 h-3" />
                                {activity.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingAssignment(a)}
                                className="h-8 w-8 p-0"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="p-4 sm:p-6">
                  {paginated.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
                      <p>{tab === "active-upcoming" ? "No active or upcoming assignments" : "No past assignments"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {paginated.map((a) => {
                        const status = getStatus(a);
                        const StatusIcon = status.icon;
                        const activity = getActivityStatus(a);
                        const ActivityIcon = activity.icon;
                        return (
                          <Card key={a.assignment_id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base sm:text-lg truncate">{a.partner_name || "—"}</CardTitle>
                                    {a.address && (
                                      <CardDescription className="text-xs sm:text-sm truncate">{a.address}</CardDescription>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 pt-0">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{formatDate(a.start_date)} – {formatDate(a.end_date)}</span>
                              </div>
                              {a.allowed_actions?.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {a.allowed_actions.map((action) => (
                                    <span key={action} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                      {action.replace("_", " ")}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {a.notes && (
                                <p className="text-xs text-muted-foreground italic line-clamp-2">{a.notes}</p>
                              )}
                              <div className="pt-2 border-t flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {status.label}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${activity.color} ${activity.bg}`}>
                                    <ActivityIcon className="w-3 h-3" />
                                    {activity.label}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewingAssignment(a)}
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-gray-200">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Showing {start + 1}–{Math.min(start + pageSize, filtered.length)} of {filtered.length}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                          page === 1
                            ? "text-gray-400 border-gray-200 cursor-not-allowed"
                            : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        Prev
                      </button>
                      <span className="text-sm font-medium text-gray-900 px-2">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        className={`px-3 py-1 text-sm font-medium border rounded-md transition-colors ${
                          page === totalPages
                            ? "text-gray-400 border-gray-200 cursor-not-allowed"
                            : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {viewingAssignment && (
        <AssignmentViewModal
          assignment={viewingAssignment}
          onClose={() => setViewingAssignment(null)}
        />
      )}
    </div>
  );
};

export default MyAssignments;
