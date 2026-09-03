import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import IntegrationConfirmationModal from "../components/ui/IntegrationConfirmationModal";
import {
  createIntegrationTenantMapping,
  getIntegrationConnections,
  getIntegrationProviders,
  getSessionContext,
  setIntegrationTenantStatus,
} from "../api";

export default function IntegrationConnections() {
  const [connections, setConnections] = useState([]);
  const [providers, setProviders] = useState([]);
  const [sessionContext, setSessionContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [externalTenantId, setExternalTenantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationError, setConfirmationError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [items, providerItems, context] = await Promise.all([
        getIntegrationConnections(),
        getIntegrationProviders(),
        getSessionContext(),
      ]);
      setConnections(items || []);
      setProviders(providerItems || []);
      setSessionContext(context);
      setSelectedProviderId((current) => current || items?.[0]?.integration_id || providerItems?.find((provider) => provider.status === "active")?.integration_id || "");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const availableProviders = useMemo(() => providers.filter((provider) => provider.status === "active"), [providers]);
  const selectedProvider = useMemo(
    () => availableProviders.find((provider) => provider.integration_id === selectedProviderId)
      || connections.find((connection) => connection.integration_id === selectedProviderId),
    [availableProviders, connections, selectedProviderId],
  );
  const selectedConnections = useMemo(
    () => connections.filter((connection) => connection.integration_id === selectedProviderId),
    [connections, selectedProviderId],
  );

  const submitMapping = async (event) => {
    event.preventDefault();
    if (!sessionContext?.company_id) {
      setError("Your verified TapTime company context is unavailable. Sign out and sign in again.");
      return;
    }
    if (!selectedProvider || !externalTenantId.trim()) return;
    setConfirmationError("");
    setConfirmation({
      type: "connect",
      providerName: selectedProvider.name,
      schoolId: externalTenantId.trim(),
      companyName: sessionContext.company_name || "your verified TapTime company",
    });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (confirmation.type === "connect") {
        await createIntegrationTenantMapping(selectedProviderId, {
          external_tenant_id: confirmation.schoolId,
        });
        setExternalTenantId("");
        setNotice(`School mapping created for ${sessionContext.company_name || "your verified TapTime company"}.`);
      } else {
        await setIntegrationTenantStatus(confirmation.integrationId, confirmation.schoolId, confirmation.nextStatus);
        setNotice(`School mapping ${confirmation.nextStatus}.`);
      }
      await refresh();
      setConfirmation(null);
      setConfirmationError("");
    } catch (requestError) {
      setError(requestError.message);
      setConfirmationError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const changeMappingStatus = async (item) => {
    const next = item.mapping_status === "active" ? "disabled" : "active";
    setConfirmationError("");
    setConfirmation({
      type: "status",
      integrationId: item.integration_id,
      nextStatus: next,
      providerName: item.name || selectedProvider?.name || "Integration provider",
      schoolId: item.external_tenant_id,
      companyName: sessionContext?.company_name || "your verified TapTime company",
    });
  };

  return <><Header /><main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28">
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#08076b]">Partner Integrations</h1>
        <p className="mt-1 text-slate-600">Connect your TapTime company to schools in a trusted partner application.</p>
        <p className="mt-2 text-sm text-slate-500">Only your company’s Owner and Super Admins can manage these mappings. Provider registration and backend credentials are managed by TapTime operations.</p>
        {sessionContext?.company_id && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
          <span className="font-semibold text-[#08076b]">Mapping for verified company: </span>
          {sessionContext.company_name || "Unnamed company"}
          <span className="ml-2 text-slate-500">Only this company’s connections are shown and managed here.</span>
        </div>}
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{notice}</div>}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-semibold text-[#08076b]">Choose an integration provider</h2><p className="mt-1 text-sm text-slate-600">Select the partner application whose schools you want to connect.</p></div>
          <span className="text-sm text-slate-500">{availableProviders.length} provider{availableProviders.length === 1 ? "" : "s"} available</span>
        </div>
        {loading ? <div className="py-8 text-slate-600">Loading providers…</div> : availableProviders.length === 0 ? <div className="py-8 text-slate-600">No active integration providers are available yet.</div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableProviders.map((provider) => {
            const isSelected = provider.integration_id === selectedProviderId;
            const connectionCount = connections.filter((connection) => connection.integration_id === provider.integration_id).length;
            return <button key={provider.integration_id} type="button" onClick={() => { setSelectedProviderId(provider.integration_id); setExternalTenantId(""); }} className={`rounded-xl border p-5 text-left transition ${isSelected ? "border-[#08076b] bg-indigo-50 ring-2 ring-[#08076b]/15" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"}`}>
              <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-[#08076b]">↔</div><span className={isSelected ? "rounded-full bg-[#08076b] px-2 py-1 text-xs font-semibold text-white" : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"}>{isSelected ? "Selected" : "Select"}</span></div>
              <div className="mt-4 font-semibold text-slate-900">{provider.name}</div>
              <div className="mt-1 text-sm text-slate-600">{connectionCount} connected school{connectionCount === 1 ? "" : "s"}</div>
            </button>;
          })}
        </div>}
      </section>

      {selectedProvider && <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Selected provider</p><h2 className="mt-1 text-xl font-semibold text-[#08076b]">{selectedProvider.name} school connections</h2><p className="mt-1 text-sm text-slate-600">Add and manage the schools from {selectedProvider.name} that are connected to {sessionContext?.company_name || "your TapTime company"}.</p></div><button type="button" onClick={() => document.getElementById("school-connection-form")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-lg bg-[#08076b] px-4 py-2 text-sm font-semibold text-white">Connect a school</button></div>
        <form id="school-connection-form" className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={submitMapping}>
          <Field label={`${selectedProvider.name} school ID`}><input required value={externalTenantId} onChange={(event) => setExternalTenantId(event.target.value)} placeholder="Paste the school UUID from the partner application" /></Field>
          <div className="flex items-end"><button disabled={saving || !sessionContext?.company_id || !externalTenantId.trim()} className="h-10 rounded-lg bg-[#08076b] px-5 font-semibold text-white disabled:opacity-50">{saving ? "Connecting…" : "Connect school"}</button></div>
          <p className="text-xs text-slate-500 md:col-span-2">Use the immutable school ID from {selectedProvider.name}. The identifier is used only to make the secure connection and remains scoped to this TapTime company.</p>
        </form>

        <div className="mt-7"><h3 className="text-base font-semibold text-slate-900">Connected schools</h3>{loading ? <div className="py-8 text-slate-600">Loading school connections…</div> : selectedConnections.length === 0 ? <div className="py-8 text-slate-600">No {selectedProvider.name} schools have been connected to this TapTime company.</div> :
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#08076b] text-white"><tr><th className="p-3">School ID</th><th className="p-3">Status</th><th className="p-3">Last authenticated</th><th className="p-3">Actions</th></tr></thead><tbody>{selectedConnections.map((item) => <tr key={`${item.integration_id}-${item.external_tenant_id}`} className="border-b"><td className="p-3 font-mono text-xs text-slate-700">{item.external_tenant_id}</td><td className="p-3"><Status value={item.mapping_status} /></td><td className="p-3">{item.last_authenticated_at ? new Date(item.last_authenticated_at).toLocaleString() : "Never"}</td><td className="p-3"><button disabled={saving} onClick={() => changeMappingStatus(item)} className="text-[#08076b] underline disabled:opacity-50">{item.mapping_status === "active" ? "Disable connection" : "Enable connection"}</button></td></tr>)}</tbody></table></div>}
        </div>
      </section>
      }
    </div>
  </main><Footer /><IntegrationConfirmationModal action={confirmation} error={confirmationError} isOpen={Boolean(confirmation)} isSubmitting={saving} onClose={() => { if (!saving) { setConfirmation(null); setConfirmationError(""); } }} onConfirm={confirmAction} /></>;
}

function Field({ label, children }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-700"><span>{label}</span>{React.cloneElement(children, {
    className: "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-[#08076b] focus:ring-2 focus:ring-[#08076b]/15",
  })}</label>;
}

function Status({ value }) {
  return <span className={value === "active" ? "font-medium text-green-700" : "font-medium text-red-600"}>{value || "—"}</span>;
}
