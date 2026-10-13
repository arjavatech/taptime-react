import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { X, User, Building2, Calendar, CheckCircle, XCircle, AlertCircle, Clock, LogIn, Minus, Loader2 } from "lucide-react";
import { getAssignmentReport } from "../api";

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

const formatTime = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return ts;
  }
};

const formatRowDate = (d) => {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d + "T00:00:00") : new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(d);
  }
};

const getAssignmentStatus = (a) => {
  const today = new Date().toISOString().split("T")[0];
  if (a.is_active === false) return { label: "Inactive", color: "text-gray-500", icon: XCircle };
  if (a.start_date <= today && a.end_date >= today) return { label: "Active today", color: "text-green-600", icon: CheckCircle };
  if (a.start_date > today) return { label: "Upcoming", color: "text-blue-600", icon: AlertCircle };
  return { label: "Expired", color: "text-gray-400", icon: XCircle };
};

const getActivityStatus = (records) => {
  const hasOpen = records.some(r => !r.check_out_time);
  const hasDone = records.some(r => r.check_out_time);
  if (hasOpen) return { label: "Currently Checked In", color: "text-emerald-700", bg: "bg-emerald-50 border border-emerald-200", icon: LogIn };
  if (hasDone) return { label: "Worked", color: "text-blue-700", bg: "bg-blue-50 border border-blue-200", icon: Clock };
  return { label: "Not Started", color: "text-gray-500", bg: "bg-gray-50 border border-gray-200", icon: Minus };
};

const AssignmentViewModal = ({ assignment, onClose }) => {
  const [records, setRecords] = useState([]);
  const [loadingLog, setLoadingLog] = useState(true);

  const empName = [assignment.first_name, assignment.last_name].filter(Boolean).join(" ") || assignment.email || "—";
  const status = getAssignmentStatus(assignment);
  const StatusIcon = status.icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!assignment.assignment_id) { setLoadingLog(false); return; }
    getAssignmentReport(assignment.assignment_id).then((data) => {
      setRecords(data);
      setLoadingLog(false);
    });
  }, [assignment.assignment_id]);

  const activity = getActivityStatus(records);
  const ActivityIcon = activity.icon;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg sm:mx-4 max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{empName}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                {!loadingLog && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${activity.color}`}>
                    <ActivityIcon className="w-3 h-3" />
                    {activity.label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
          <Section icon={User} title="Employee">
            <Field label="Full Name" value={empName} />
            {assignment.email && <Field label="Email" value={assignment.email} />}
          </Section>

          <Section icon={Building2} title="Assignment">
            <Field label="Partner Location" value={assignment.partner_name || "—"} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" value={formatDate(assignment.start_date)} />
              <Field label="End Date" value={formatDate(assignment.end_date)} />
            </div>
          </Section>

          {/* Time Log */}
          <Section icon={Clock} title="Time Log">
            {loadingLog ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity recorded for this assignment</p>
            ) : (
              <div className="overflow-x-auto -mx-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Check In</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Check Out</th>
                      <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Worked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.record_id || i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="py-2 px-4 text-xs text-foreground whitespace-nowrap">{formatRowDate(r.date)}</td>
                        <td className="py-2 px-4 text-xs text-foreground whitespace-nowrap">{formatTime(r.check_in_time)}</td>
                        <td className="py-2 px-4 text-xs whitespace-nowrap">
                          {r.check_out_time ? (
                            <span className="text-foreground">{formatTime(r.check_out_time)}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                              <LogIn className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-xs text-foreground">{r.time_worked || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
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

export default AssignmentViewModal;
