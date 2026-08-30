import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APPROVED_TRANSACTION_VEHICLES } from "@shared/transactionLifecycle";

const scopes = [
  ["all_rentals", "All rentals"],
  ["entry", "Entry access"],
  ["mid_range", "Mid-Range access"],
  ["elite", "Elite access"],
  ["specific_vehicle", "Specific confirmed vehicle"],
] as const;

const confirmedVehicles = Object.entries(APPROVED_TRANSACTION_VEHICLES).map(([id, vehicle]) => ({ id, name: vehicle.vehicleName }));

export function EligibilityPolicyManager() {
  const policies = trpc.operations.eligibilityPolicies.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [scope, setScope] = useState<(typeof scopes)[number][0]>("all_rentals");
  const [vehicleId, setVehicleId] = useState("");
  const [ruleConfiguration, setRuleConfiguration] = useState("");
  const [approvalReference, setApprovalReference] = useState("");
  const [note, setNote] = useState("");
  const create = trpc.operations.eligibilityPolicies.create.useMutation({
    onSuccess: () => {
      void policies.refetch();
      setCode(""); setName(""); setVersion(""); setVehicleId(""); setRuleConfiguration(""); setApprovalReference(""); setNote("");
    },
  });
  const setStatus = trpc.operations.eligibilityPolicies.setStatus.useMutation({ onSuccess: () => void policies.refetch() });
  const canCreate = code.trim().length >= 3 && name.trim().length >= 3 && version.trim().length > 0 && ruleConfiguration.trim().length >= 2 && (scope !== "specific_vehicle" || Boolean(vehicleId));

  return <section className="border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-6">
    <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-[#B8860B]" size={18} /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Eligibility governance</p><h3 className="mt-1 text-[16px] font-bold text-black">Eligibility policy manager</h3><p className="mt-1 max-w-4xl text-[12px] leading-5 text-gray-500">Policies are unseeded, versioned records for approved internal checks. Activating a policy does not approve, decline, price, or release any rental; each transaction still requires an administrator decision and recorded rationale.</p></div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-[11px] font-semibold text-gray-600">Policy code<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="e.g., RENTAL-MD" className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black" /></label>
      <label className="text-[11px] font-semibold text-gray-600">Policy name<input value={name} onChange={event => setName(event.target.value)} placeholder="Approved rental review" className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black" /></label>
      <label className="text-[11px] font-semibold text-gray-600">Version<input value={version} onChange={event => setVersion(event.target.value)} placeholder="e.g., 2026.1" className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black" /></label>
      <label className="text-[11px] font-semibold text-gray-600">Scope<select value={scope} onChange={event => setScope(event.target.value as typeof scope)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black">{scopes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {scope === "specific_vehicle" && <label className="mt-3 block text-[11px] font-semibold text-gray-600">Confirmed vehicle<select value={vehicleId} onChange={event => setVehicleId(event.target.value)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black"><option value="">Select confirmed inventory</option>{confirmedVehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>)}</select></label>}
    <label className="mt-3 block text-[11px] font-semibold text-gray-600">Approved internal check configuration (JSON)<textarea value={ruleConfiguration} onChange={event => setRuleConfiguration(event.target.value)} rows={5} placeholder={'Enter counsel/operations-approved checks as JSON, for example: {"requiredChecks":["license_validity","insurance_review"]}'} className="mt-1 w-full border border-gray-300 bg-white p-3 font-mono text-xs font-normal leading-5 text-black outline-none focus:border-black" /></label>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-gray-600">Approval reference (optional)<input value={approvalReference} onChange={event => setApprovalReference(event.target.value)} placeholder="Internal counsel or policy reference" className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black" /></label><label className="text-[11px] font-semibold text-gray-600">Creation note (optional)<input value={note} onChange={event => setNote(event.target.value)} placeholder="Why this version was recorded" className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-xs font-normal text-black outline-none focus:border-black" /></label></div>
    <button type="button" disabled={!canCreate || create.isPending} onClick={() => create.mutate({ code, name, version, scope, vehicleId: scope === "specific_vehicle" ? vehicleId : undefined, ruleConfiguration, approvalReference: approvalReference.trim() || undefined, note: note.trim() || undefined })} className="mt-4 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{create.isPending ? "Recording policy…" : "Record draft policy"}</button>{create.error && <p className="mt-3 text-xs text-red-600">{create.error.message}</p>}
    <div className="mt-6 border-t border-gray-200 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recorded policies</p><div className="mt-3 space-y-2">{policies.data?.map(policy => <article key={policy.id} className="border border-gray-200 bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[12px] font-bold text-black">{policy.name} <span className="font-normal text-gray-500">· {policy.code} · v{policy.version}</span></p><p className="mt-1 text-[10px] text-gray-500">{policy.scope.replaceAll("_", " ")}{policy.vehicleId ? ` · ${confirmedVehicles.find(vehicle => vehicle.id === policy.vehicleId)?.name || "Confirmed vehicle"}` : ""} · {policy.history.length} recorded action{policy.history.length === 1 ? "" : "s"}</p></div><span className={policy.status === "active" ? "bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white" : "border border-gray-300 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500"}>{policy.status}</span></div>{policy.status !== "retired" && <div className="mt-3 flex flex-wrap gap-2">{policy.status !== "active" && <button type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ eligibilityPolicyId: policy.id, nextStatus: "active", note: "Policy activated for administrator-selected manual reviews." })} className="inline-flex h-8 items-center gap-1 bg-black px-3 text-[10px] font-bold text-white disabled:opacity-50"><CheckCircle2 size={12} /> Activate</button>}{policy.status === "active" && <button type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ eligibilityPolicyId: policy.id, nextStatus: "draft", note: "Policy returned to draft for revision." })} className="h-8 border border-gray-300 px-3 text-[10px] font-bold text-black disabled:opacity-50">Return to draft</button>}<button type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ eligibilityPolicyId: policy.id, nextStatus: "retired", note: "Policy retired; its prior transaction snapshots remain unchanged." })} className="h-8 border border-gray-300 px-3 text-[10px] font-bold text-gray-600 disabled:opacity-50">Retire</button></div>}</article>)}{!policies.isLoading && !policies.data?.length && <p className="py-4 text-xs text-gray-400">No eligibility policy is recorded. No thresholds or eligibility outcome will be inferred.</p>}</div>{setStatus.error && <p className="mt-3 text-xs text-red-600">{setStatus.error.message}</p>}</div>
  </section>;
}
