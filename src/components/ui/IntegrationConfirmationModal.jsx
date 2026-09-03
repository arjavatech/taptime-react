import React from "react";
import { Link2, Power } from "lucide-react";
import { useModalClose } from "../../hooks/useModalClose";

export default function IntegrationConfirmationModal({ action, error, isOpen, isSubmitting, onClose, onConfirm }) {
  useModalClose(isOpen, () => { if (!isSubmitting) onClose(); }, "integration-confirmation-modal");

  if (!isOpen || !action) return null;

  const isConnection = action.type === "connect";
  const Icon = isConnection ? Link2 : Power;
  const confirmLabel = isConnection ? "Connect school" : action.nextStatus === "disabled" ? "Disable connection" : "Enable connection";

  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="integration-confirmation-title">
    <button type="button" aria-label="Close confirmation" className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />
    <section id="integration-confirmation-modal" className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isConnection ? "bg-indigo-100 text-[#08076b]" : "bg-amber-100 text-amber-700"}`}><Icon className="h-6 w-6" /></div>
      <h2 id="integration-confirmation-title" className="mt-4 text-xl font-semibold text-slate-900">{isConnection ? "Connect school to TapTime" : `${confirmLabel}?`}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{isConnection ? "Confirm that this school belongs to the verified TapTime company below. You can disable the connection later if needed." : `This changes the availability of this school's TapTime connection for your company.`}</p>

      <dl className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr]"><dt className="font-medium text-slate-500">Provider</dt><dd className="font-semibold text-slate-900">{action.providerName}</dd></div>
        <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr]"><dt className="font-medium text-slate-500">School ID</dt><dd className="break-all font-mono text-xs text-slate-800">{action.schoolId}</dd></div>
        <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr]"><dt className="font-medium text-slate-500">TapTime company</dt><dd className="font-semibold text-slate-900">{action.companyName}</dd></div>
      </dl>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" disabled={isSubmitting} onClick={onClose} className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">Cancel</button>
        <button type="button" disabled={isSubmitting} onClick={onConfirm} className={`h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50 ${isConnection ? "bg-[#08076b] hover:bg-[#11108a]" : action.nextStatus === "disabled" ? "bg-red-700 hover:bg-red-800" : "bg-[#08076b] hover:bg-[#11108a]"}`}>{isSubmitting ? "Saving…" : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
