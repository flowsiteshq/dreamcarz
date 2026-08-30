import { BadgeCheck, FilePenLine, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

function displayStatus(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "not started";
}

type SecureRecordType = "legacy_license_document" | "transaction_license_document" | "transaction_insurance_document" | "agreement";

export default function CustomerRecordsBackoffice() {
  const records = trpc.transactions.backOffice.useQuery(undefined, { refetchOnWindowFocus: false });
  const getRecordLink = trpc.transactions.getRecordLink.useMutation();
  const [error, setError] = useState("");

  const openRecord = async (recordType: SecureRecordType, id: number) => {
    try {
      setError("");
      const record = await getRecordLink.mutateAsync({ recordType, id });
      window.open(record.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("This private record could not be opened. Please try again or contact DreamCarz support.");
    }
  };

  if (records.isLoading) {
    return <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[#a8832d]" /></div>;
  }

  if (records.error) {
    return <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">{records.error.message}</div>;
  }

  const data = records.data;

  return (
    <div className="mx-auto max-w-6xl">
      <section className="grid gap-7 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8832d]">Customer back office</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.05em] text-black sm:text-5xl">Your private records.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Review records tied to your DreamCarz account. Documents appear only after you provide them or DreamCarz completes the relevant transaction stage.</p>
        </div>
        <div className="border-l-2 border-[#a8832d] pl-5">
          <LockKeyhole className="h-5 w-5 text-[#a8832d]" />
          <p className="mt-3 text-sm font-semibold">Private by design</p>
          <p className="mt-2 text-sm leading-6 text-gray-500">Only you and authorized DreamCarz staff can access account-bound records.</p>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-3">
        <article className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><BadgeCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Driver’s license</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.045em]">Verification record</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">Status: <strong className="capitalize text-black">{displayStatus(data?.profile?.licenseStatus)}</strong></p>
            </div>
          </div>
          <div className="mt-7 divide-y divide-gray-200 border-y border-gray-200">
            {data?.licenseDocuments?.length ? data.licenseDocuments.map(document => (
              <div key={`${document.recordSource}-${document.id}`} className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-semibold capitalize">{displayStatus(document.documentType)}</p><p className="mt-1 truncate text-xs text-gray-500">{document.originalFilename} · {displayStatus(document.reviewStatus)}</p></div>
                <button type="button" onClick={() => void openRecord(document.recordSource, document.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Open</button>
              </div>
            )) : <p className="py-5 text-sm leading-6 text-gray-500">No driver-license records are on file yet.</p>}
          </div>
        </article>

        <article className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><ShieldCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Insurance</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.045em]">Proof for review</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">Private insurance records stay pending until a DreamCarz reviewer records a status.</p>
            </div>
          </div>
          <div className="mt-7 divide-y divide-gray-200 border-y border-gray-200">
            {data?.insuranceDocuments?.length ? data.insuranceDocuments.map(document => (
              <div key={document.id} className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">Proof of insurance</p><p className="mt-1 truncate text-xs text-gray-500">{document.originalFilename} · {displayStatus(document.reviewStatus)}</p></div>
                <button type="button" onClick={() => void openRecord(document.recordSource, document.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Open</button>
              </div>
            )) : <p className="py-5 text-sm leading-6 text-gray-500">No proof-of-insurance record is on file yet.</p>}
          </div>
        </article>

        <article className="border border-gray-200 bg-[#fbfaf7] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><FilePenLine size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8832d]">Contracts & agreements</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.045em]">Transaction documents</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">Draft, review, and signed agreement status is retained with its related transaction.</p>
            </div>
          </div>
          <div className="mt-7 divide-y divide-gray-200 border-y border-gray-200">
            {data?.agreements?.length ? data.agreements.map(agreement => (
              <div key={agreement.id} className="flex items-center justify-between gap-3 py-4">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{agreement.vehicleName}</p><p className="mt-1 truncate text-xs capitalize text-gray-500">{agreement.agreementType} · Version {agreement.version} · {displayStatus(agreement.status)}</p></div>
                {agreement.hasSignedDocument ? <button type="button" onClick={() => void openRecord("agreement", agreement.id)} className="shrink-0 text-sm font-semibold underline underline-offset-4">Open</button> : <span className="shrink-0 text-xs text-gray-400">No signed file</span>}
              </div>
            )) : <p className="py-5 text-sm leading-6 text-gray-500">No transaction agreements are on file yet.</p>}
          </div>
        </article>
      </section>

      {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
      <p className="mt-8 text-center text-xs leading-5 text-gray-500">Do not share downloaded records. Insurance review and native agreement signing remain subject to DreamCarz’s documented review and approval controls.</p>
    </div>
  );
}
