import { Loader2, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const allowedContentTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function InsuranceProofUpload({ reference }: { reference: string }) {
  const utils = trpc.useUtils();
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState("");
  const upload = trpc.transactions.uploadInsuranceDocument.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.transactions.get.invalidate({ reference }), utils.transactions.backOffice.invalidate()]);
      setError("");
    },
  });

  const uploadRecord = async (file?: File) => {
    if (!file) return;
    if (!allowedContentTypes.includes(file.type as typeof allowedContentTypes[number])) {
      setError("Use a JPG, PNG, WEBP, or PDF insurance record.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Each insurance record must be 6 MB or smaller.");
      return;
    }
    if (!consented) {
      setError("Confirm insurance-review consent before uploading proof of insurance.");
      return;
    }
    try {
      setError("");
      await upload.mutateAsync({
        reference,
        filename: file.name,
        contentType: file.type as typeof allowedContentTypes[number],
        base64: await readFileAsBase64(file),
        insuranceReviewConsent: true,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your insurance record could not be saved. Please try again.");
    }
  };

  return (
    <section className="mx-auto max-w-3xl border border-gray-200 bg-[#fbfaf7] p-6 sm:p-9">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><ShieldCheck size={18} /></div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Insurance & protection</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.045em]">Provide proof for review.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">Upload current proof of insurance for DreamCarz review. Uploading does not verify coverage, sell protection, or change the vehicle-release decision.</p>
        </div>
      </div>
      <label className="mt-7 flex items-start gap-3 border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-700">
        <input checked={consented} onChange={event => setConsented(event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-black" />
        <span>I consent to DreamCarz collecting and securely retaining this proof of insurance solely for transaction insurance review. I understand approval remains manual and I can contact Support with a privacy request.</span>
      </label>
      <label className="mt-4 flex min-h-32 cursor-pointer flex-col justify-between border border-gray-200 bg-white p-5">
        <div><Upload className="h-5 w-5 text-[#a8832d]" /><p className="mt-4 text-sm font-bold">Proof of insurance</p><p className="mt-1 text-xs leading-5 text-gray-500">JPG, PNG, WEBP, or PDF · 6 MB maximum · private record</p></div>
        <span className="mt-4 text-sm font-semibold underline underline-offset-4">Choose file<input className="sr-only" onChange={event => void uploadRecord(event.target.files?.[0])} accept="image/jpeg,image/png,image/webp,application/pdf" type="file" /></span>
      </label>
      {upload.isPending && <p className="mt-5 inline-flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Saving your private insurance record…</p>}
      {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
      <p className="mt-6 text-xs leading-5 text-gray-500">Only you and authorized DreamCarz staff can access this private record. Insurance remains pending until a reviewer records a status. You can review stored records in <Link href="/dashboard/transactions" className="font-semibold underline underline-offset-4">My Records</Link>.</p>
    </section>
  );
}
