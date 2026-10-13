import React, { useEffect } from "react";
import { Button } from "../components/ui/button";
import { X, User, Building2, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const getAssignmentStatus = (a) => {
  const today = new Date().toISOString().split("T")[0];
  if (a.is_active === false) return { label: "Inactive", color: "text-gray-500", icon: XCircle };
  if (a.start_date <= today && a.end_date >= today) return { label: "Active today", color: "text-green-600", icon: CheckCircle };
  if (a.start_date > today) return { label: "Upcoming", color: "text-blue-600", icon: AlertCircle };
  return { label: "Expired", color: "text-gray-400", icon: XCircle };
};

const AssignmentViewModal = ({ assignment, onClose }) => {
  const empName = [assignment.first_name, assignment.last_name].filter(Boolean).join(" ") || assignment.email || "—";
  const status = getAssignmentStatus(assignment);
  const StatusIcon = status.icon;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
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
