import { useState } from "react";
import { FileKey, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";

type Passport = { id: number; vehicleName: string; hasRegistrationDocument: boolean; hasInsuranceDocument: boolean };
type DocumentType = "registration" | "insurance";

async function fileBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
  return dataUrl.split(",", 2)[1] ?? "";
}

export function VehiclePassportDocuments({ passports, onUploaded }: { passports: Passport[]; onUploaded: () => void }) {
  const [passportId, setPassportId] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("registration");
  const [file, setFile] = useState<File | null>(null);
  const upload = trpc.operations.vehiclePassports.uploadDocument.useMutation({ onSuccess: () => { setFile(null); onUploaded(); } });
  const registrationUrl = trpc.operations.vehiclePassports.documentUrl.useQuery({ vehiclePassportId: Number(passportId || 0), documentType: "registration" }, { enabled: false, retry: false });
  const insuranceUrl = trpc.operations.vehiclePassports.documentUrl.useQuery({ vehiclePassportId: Number(passportId || 0), documentType: "insurance" }, { enabled: false, retry: false });
  const selected = passports.find(passport => passport.id === Number(passportId));
  const openDocument = async (type: DocumentType) => { const result = await (type === "registration" ? registrationUrl.refetch() : insuranceUrl.refetch()); if (result.data?.url) window.open(result.data.url, "_blank", "noopener,noreferrer"); };
  const submit = async () => { if (!file || !passportId) return; await upload.mutateAsync({ vehiclePassportId: Number(passportId), documentType, filename: file.name, contentType: file.type as "application/pdf" | "image/jpeg" | "image/png", base64: await fileBase64(file) }); };
  return <section className="mt-5 border border-[#ded8cf] bg-white p-5"><div className="flex items-center gap-2"><FileKey size={15} className="text-[#B8860B]" /><div><h4 className="text-[13px] font-bold text-black">Private vehicle documents</h4><p className="mt-1 text-[11px] leading-4 text-gray-500">Registration and insurance documents are stored as private references. Lists show presence only; opening a document obtains a time-limited administrator link.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={passportId} onChange={event => setPassportId(event.target.value)} className="h-10 border border-gray-300 bg-white px-3 text-xs text-black"><option value="">Select Vehicle Passport</option>{passports.map(passport => <option key={passport.id} value={passport.id}>{passport.vehicleName}</option>)}</select><select value={documentType} onChange={event => setDocumentType(event.target.value as DocumentType)} className="h-10 border border-gray-300 bg-white px-3 text-xs text-black"><option value="registration">Registration document</option><option value="insurance">Insurance document</option></select><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => setFile(event.target.files?.[0] ?? null)} className="h-10 border border-gray-300 bg-white px-3 py-2 text-xs text-black" /><button type="button" disabled={!passportId || !file || upload.isPending} onClick={() => void submit()} className="inline-flex h-10 items-center justify-center gap-2 bg-black px-3 text-xs font-semibold text-white disabled:opacity-50"><Upload size={13} />{upload.isPending ? "Uploading…" : "Store document"}</button></div>{selected && <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!selected.hasRegistrationDocument || registrationUrl.isFetching} onClick={() => void openDocument("registration")} className="border border-gray-300 px-3 py-2 text-[11px] font-semibold text-black disabled:opacity-40">Open registration</button><button type="button" disabled={!selected.hasInsuranceDocument || insuranceUrl.isFetching} onClick={() => void openDocument("insurance")} className="border border-gray-300 px-3 py-2 text-[11px] font-semibold text-black disabled:opacity-40">Open insurance</button></div>}{upload.error || registrationUrl.error || insuranceUrl.error ? <p className="mt-2 text-[11px] text-red-600">{upload.error?.message || registrationUrl.error?.message || insuranceUrl.error?.message}</p> : null}</section>;
}
