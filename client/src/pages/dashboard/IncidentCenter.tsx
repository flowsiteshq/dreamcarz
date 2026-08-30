import { useMemo, useState } from "react";
import { AlertTriangle, Camera, MapPin, PhoneCall, ShieldAlert } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";

type PendingPhoto = { filename: string; contentType: "image/jpeg" | "image/png" | "image/webp"; base64: string };

function asBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] || "") : reject(new Error("The image could not be read."));
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

export default function IncidentCenter() {
  const utils = trpc.useUtils();
  const transactions = trpc.transactions.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const incidents = trpc.incidents.listMine.useQuery(undefined, { refetchOnWindowFocus: false });
  const report = trpc.incidents.report.useMutation({ onSuccess: () => { incidents.refetch(); transactions.refetch(); } });
  const activeRentals = useMemo(() => (transactions.data ?? []).filter(transaction => transaction.transactionType === "rental" && ["ready_for_pickup", "active_rental", "return_pending"].includes(transaction.status)), [transactions.data]);
  const [transactionReference, setTransactionReference] = useState("");
  const [incidentType, setIncidentType] = useState<"collision" | "mechanical" | "damage" | "theft" | "towing" | "ticket_or_impound" | "roadside" | "other">("damage");
  const [severity, setSeverity] = useState<"standard" | "urgent" | "emergency">("standard");
  const [reportedLocation, setReportedLocation] = useState("");
  const [description, setDescription] = useState("");
  const [policeReference, setPoliceReference] = useState("");
  const [towReference, setTowReference] = useState("");
  const [insuranceReference, setInsuranceReference] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [message, setMessage] = useState("");

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 8 - photos.length));
    try {
      const converted = await Promise.all(selected.map(async file => {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use JPEG, PNG, or WebP photo files only.");
        if (file.size > 6 * 1024 * 1024) throw new Error("Each photo must be 6 MB or smaller.");
        return { filename: file.name, contentType: file.type as PendingPhoto["contentType"], base64: await asBase64(file) };
      }));
      setPhotos(current => [...current, ...converted].slice(0, 8));
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Photos could not be prepared."); }
  };

  const submit = async () => {
    if (!transactionReference) { setMessage("Choose the current rental vehicle before submitting a report."); return; }
    if (description.trim().length < 10) { setMessage("Please describe what happened in at least 10 characters."); return; }
    try {
      setMessage("");
      await report.mutateAsync({ transactionReference, incidentType, severity, reportedLocation: reportedLocation.trim() || undefined, policeReportReference: policeReference.trim() || undefined, towReference: towReference.trim() || undefined, insuranceClaimReference: insuranceReference.trim() || undefined, description: description.trim(), photos });
      setDescription(""); setReportedLocation(""); setPoliceReference(""); setTowReference(""); setInsuranceReference(""); setPhotos([]);
      setMessage("Your incident report was saved for DreamCarz review. A team member will use your saved contact information for follow-up.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The incident could not be submitted. Please try again or contact DreamCarz support."); }
  };

  return <DashboardShell title="Safety & Incident Center"><div className="mx-auto max-w-5xl space-y-6"><section className="border border-black bg-black p-6 text-white sm:p-8"><div className="flex flex-wrap gap-4"><ShieldAlert className="shrink-0 text-[#d8ad45]" size={28} /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8ad45]">Safety first</p><h1 className="mt-2 font-display text-2xl font-bold">Report a vehicle incident</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">For injuries, immediate danger, or an unsafe road condition, call 911 first. Then use this private report to share the operational details DreamCarz needs for follow-up. Submitting a report does not replace emergency, police, insurance, or roadside procedures.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><a href="tel:911" className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-xs font-bold text-white"><PhoneCall size={14} /> Call 911 for an emergency</a><a href="tel:+13017722500" className="inline-flex items-center gap-2 border border-[#d8ad45] bg-[#d8ad45] px-4 py-2 text-xs font-bold text-black"><PhoneCall size={14} /> Contact DreamCarz</a></div></section>
    <section className="border border-[#ded8cf] bg-[#faf9f6] p-5 sm:p-7"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 text-[#B8860B]" size={20} /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8860B]">Account-bound report</p><h2 className="mt-1 text-xl font-bold text-black">Current rental incident details</h2><p className="mt-1 text-xs leading-5 text-gray-500">Your report and evidence are private to your account and authorized DreamCarz staff. Upload only incident-related photos; do not upload identity documents or payment information.</p></div></div>
      {activeRentals.length ? <><div className="mt-5 grid gap-3 sm:grid-cols-3"><label className="text-[11px] font-semibold text-gray-600 sm:col-span-2">Current rental<select value={transactionReference} onChange={event => setTransactionReference(event.target.value)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black"><option value="">Select a current rental</option>{activeRentals.map(transaction => <option key={transaction.reference} value={transaction.reference}>{transaction.vehicleName} · {transaction.reference}</option>)}</select></label><label className="text-[11px] font-semibold text-gray-600">Urgency<select value={severity} onChange={event => setSeverity(event.target.value as typeof severity)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black"><option value="standard">Standard</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option></select></label></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-gray-600">Incident type<select value={incidentType} onChange={event => setIncidentType(event.target.value as typeof incidentType)} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black"><option value="collision">Collision</option><option value="mechanical">Mechanical concern</option><option value="damage">Vehicle damage</option><option value="theft">Theft or attempted theft</option><option value="towing">Towing</option><option value="ticket_or_impound">Ticket or impound</option><option value="roadside">Roadside support</option><option value="other">Other</option></select></label><label className="text-[11px] font-semibold text-gray-600">Location <span className="font-normal text-gray-400">(optional)</span><div className="relative mt-1"><MapPin size={14} className="absolute left-3 top-3 text-gray-400" /><input value={reportedLocation} onChange={event => setReportedLocation(event.target.value)} placeholder="Address, landmark, or safe location" className="h-10 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm font-normal text-black" /></div></label></div><label className="mt-3 block text-[11px] font-semibold text-gray-600">What happened<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={4000} rows={4} placeholder="Briefly describe what happened, the vehicle condition, and any immediate safety concern." className="mt-1 w-full border border-gray-300 bg-white p-3 text-sm font-normal text-black" /></label><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-[11px] font-semibold text-gray-600">Police report reference <span className="font-normal text-gray-400">(optional)</span><input value={policeReference} onChange={event => setPoliceReference(event.target.value)} maxLength={160} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black" /></label><label className="text-[11px] font-semibold text-gray-600">Tow reference <span className="font-normal text-gray-400">(optional)</span><input value={towReference} onChange={event => setTowReference(event.target.value)} maxLength={160} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black" /></label><label className="text-[11px] font-semibold text-gray-600">Insurance claim reference <span className="font-normal text-gray-400">(optional)</span><input value={insuranceReference} onChange={event => setInsuranceReference(event.target.value)} maxLength={160} className="mt-1 h-10 w-full border border-gray-300 bg-white px-3 text-sm font-normal text-black" /></label></div><label className="mt-4 flex min-h-24 cursor-pointer items-center justify-center gap-3 border border-dashed border-gray-300 bg-white px-4 text-center text-xs text-gray-500"><Camera size={17} className="text-[#B8860B]" /><span>Attach up to 8 incident photos, 6 MB each (JPEG, PNG, or WebP)<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={event => void addPhotos(event.target.files)} /></span></label>{photos.length ? <div className="mt-2 flex flex-wrap gap-2">{photos.map((photo, index) => <button type="button" key={`${photo.filename}-${index}`} onClick={() => setPhotos(current => current.filter((_, photoIndex) => photoIndex !== index))} className="border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-600">{photo.filename} ×</button>)}</div> : null}<button type="button" disabled={report.isPending} onClick={() => void submit()} className="mt-5 h-10 bg-black px-4 text-xs font-semibold text-white disabled:opacity-50">{report.isPending ? "Submitting report…" : "Submit private incident report"}</button>{message ? <p className={`mt-3 text-xs leading-5 ${report.error ? "text-red-600" : "text-gray-600"}`}>{message}</p> : null}</> : <div className="mt-6 border border-dashed border-gray-300 bg-white p-5 text-center"><p className="text-sm font-semibold text-black">No current rental is available to select.</p><p className="mt-2 text-xs leading-5 text-gray-500">For an issue with a past booking or a non-rental vehicle, contact DreamCarz support so a team member can route it correctly.</p></div>}</section>
    <section className="border border-gray-200 bg-white p-5"><h2 className="text-sm font-bold text-black">Your recent incident reports</h2><div className="mt-3 space-y-3">{incidents.data?.map(incident => <article key={incident.id} className="border border-gray-100 bg-[#fbfaf7] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold capitalize text-black">{incident.incidentType.replaceAll("_", " ")} · {incident.vehicleName}</p><p className="mt-1 text-[10px] text-gray-500">{incident.transactionReference} · reported {new Date(incident.createdAt).toLocaleDateString()}</p></div><span className="border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-gray-600">{incident.status.replaceAll("_", " ")}</span></div><p className="mt-2 text-xs leading-5 text-gray-600">{incident.description}</p>{incident.photoKeys ? <p className="mt-2 text-[10px] font-semibold text-gray-500">Private photo evidence is attached to this report.</p> : null}</article>)}{!incidents.isLoading && !incidents.data?.length ? <p className="py-4 text-center text-xs text-gray-400">No private incident reports have been submitted.</p> : null}</div></section>
  </div></DashboardShell>;
}
