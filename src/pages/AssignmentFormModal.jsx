import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { X, Loader2, AlertCircle } from "lucide-react";
import { createAssignment, updateAssignment, clearApiCache } from "../api.js";

const AssignmentFormModal = ({ assignment, partners, employees = [], onClose, onSave }) => {
  const isEdit = Boolean(assignment);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    emp_id: "",
    partner_id: "",
    start_date: today,
    end_date: today,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isEdit && assignment) {
      setForm({
        emp_id: assignment.emp_id || "",
        partner_id: assignment.partner_id || "",
        start_date: assignment.start_date || today,
        end_date: assignment.end_date || today,
        notes: assignment.notes || "",
      });
    }
  }, [assignment]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const validate = () => {
    if (!form.emp_id) return "Please select an employee.";
    if (!form.partner_id) return "Please select a partner.";
    if (!form.start_date) return "Start date is required.";
    if (!form.end_date) return "End date is required.";
    if (!isEdit && form.start_date < today) return "Start date cannot be in the past.";
    if (form.end_date < form.start_date) return "End date must be on or after the start date.";
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

    const payload = {
      emp_id: form.emp_id,
      partner_id: form.partner_id,
      c_id: companyId,
      start_date: form.start_date,
      end_date: form.end_date,
      allowed_actions: ["check_in", "check_out"],
      notes: form.notes.trim() || null,
      last_modified_by: lastModifiedBy,
    };

    try {
      if (isEdit) {
        await updateAssignment(assignment.assignment_id, payload);
      } else {
        await createAssignment(payload);
      }
      clearApiCache();
      onSave();
    } catch (err) {
      setSubmitError(err?.message || "Failed to save assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{isEdit ? "Edit Assignment" : "Add Assignment"}</CardTitle>
              <CardDescription className="mt-0.5">
                {isEdit ? "Update employee assignment details" : "Assign an employee to a partner location"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-5">
            {/* Employee */}
            <div className="space-y-1.5">
              <Label htmlFor="af_emp">Employee *</Label>
              <select
                id="af_emp"
                value={form.emp_id}
                onChange={(e) => setForm((p) => ({ ...p, emp_id: e.target.value }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {[emp.first_name, emp.last_name].filter(Boolean).join(" ") || emp.email || emp.emp_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Partner */}
            <div className="space-y-1.5">
              <Label htmlFor="af_partner">Partner Location *</Label>
              <select
                id="af_partner"
                value={form.partner_id}
                onChange={(e) => setForm((p) => ({ ...p, partner_id: e.target.value }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select partner...</option>
                {partners.filter((p) => p.is_active !== false).map((p) => (
                  <option key={p.partner_id} value={p.partner_id}>
                    {p.partner_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="af_start">Start Date *</Label>
                <Input
                  id="af_start"
                  type="date"
                  value={form.start_date}
                  min={!isEdit ? today : undefined}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="af_end">End Date *</Label>
                <Input
                  id="af_end"
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="af_notes">Notes</Label>
              <textarea
                id="af_notes"
                rows={2}
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Update Assignment" : "Create Assignment"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default AssignmentFormModal;
