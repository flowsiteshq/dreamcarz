import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, BookmarkPlus, CalendarDays, CarFront, CheckCircle2, Mail, Phone, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export type InventoryVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string;
  type: string;
  image: string;
  availability?: "confirmed" | "coming-soon";
};

type ViewState = "overview" | "rental" | "purchase" | "reserve" | "success";

type VehicleExperienceDialogProps = {
  vehicle: InventoryVehicle;
  membershipPlan?: { name: string; focus: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: "overview" | "rental" | "purchase" | "reserve";
};

const inputClass = "h-11 w-full border border-gray-200 bg-white px-3 text-sm text-black outline-none ring-0 placeholder:text-gray-400 focus:border-black";

export function VehicleExperienceDialog({ vehicle, membershipPlan, open, onOpenChange, initialView = "overview" }: VehicleExperienceDialogProps) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const handledInitialAction = useRef(false);
  const [view, setView] = useState<ViewState>("overview");
  const [submittedInquiryType, setSubmittedInquiryType] = useState<"rental" | "purchase" | "reserve" | null>(null);
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    preferredContact: "phone" as "phone" | "email",
    requestedStartDate: "",
    requestedEndDate: "",
    pickupLocation: "",
    notes: "",
  });
  const createInquiry = trpc.vehicleInquiries.create.useMutation({
    onSuccess: (result) => {
      setSubmittedInquiryType(result.inquiryType);
      setView("success");
    },
  });

  const fullName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const isRental = view === "rental";
  const isPurchase = view === "purchase";
  const isReserve = view === "reserve";
  const isComingSoon = vehicle.availability === "coming-soon";

  const beginTransaction = (transactionType: "rental" | "purchase") => {
    const plan = membershipPlan?.name.toLowerCase();
    const destination = `/dashboard/transactions?intent=${transactionType}&vehicle=${encodeURIComponent(vehicle.id)}${plan ? `&plan=${encodeURIComponent(plan)}` : ""}`;
    onOpenChange(false);
    navigate(isAuthenticated ? destination : `/login?next=${encodeURIComponent(destination)}`);
  };

  useEffect(() => {
    if (!open) {
      handledInitialAction.current = false;
      setView("overview");
      return;
    }
    if ((initialView === "rental" || initialView === "purchase") && !handledInitialAction.current) {
      handledInitialAction.current = true;
      beginTransaction(initialView);
      return;
    }
    setView(initialView === "reserve" ? "reserve" : "overview");
  }, [initialView, open]);

  const resetAndClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setView("overview");
      setSubmittedInquiryType(null);
      createInquiry.reset();
    }
    onOpenChange(nextOpen);
  };

  const submitInquiry = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isRental && !isPurchase && !isReserve) return;
    createInquiry.mutate({
      inquiryType: isRental ? "rental" : isPurchase ? "purchase" : "reserve",
      vehicleId: vehicle.id,
      vehicleName: fullName,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      preferredContact: form.preferredContact,
      requestedStartDate: isRental ? form.requestedStartDate : undefined,
      requestedEndDate: isRental ? form.requestedEndDate : undefined,
      pickupLocation: isRental ? form.pickupLocation : undefined,
      notes: [membershipPlan ? `Selected membership context: ${membershipPlan.name} (${membershipPlan.focus}). Membership and vehicle-specific terms remain separate.` : "", form.notes].filter(Boolean).join("\n") || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent showCloseButton={false} className="max-h-[94vh] w-[calc(100%-1rem)] max-w-[1120px] overflow-y-auto border-0 bg-[#fbfaf7] p-0 shadow-2xl sm:max-w-[1120px] sm:rounded-none">
        <button type="button" onClick={() => resetAndClose(false)} aria-label="Close vehicle view" className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-black transition-colors hover:bg-black hover:text-white"><X size={18} /></button>
        {view === "overview" && (
          <div className="grid min-h-[720px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-h-[420px] items-center justify-center bg-white px-8 py-16 lg:px-14">
              <img src={vehicle.image} alt={fullName} className="h-[360px] w-full object-contain sm:h-[460px]" />
            </div>
            <div className="flex flex-col justify-between bg-[#f4f1e9] px-8 py-14 sm:px-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">{isComingSoon ? "Coming Soon · reserve your vehicle" : "DreamCarz confirmed inventory"}</p>
                <DialogTitle className="mt-5 font-display text-5xl font-bold tracking-[-0.055em] text-black sm:text-6xl">{vehicle.year} {vehicle.make}<br />{vehicle.model}</DialogTitle>
                <DialogDescription className="mt-5 max-w-md text-base leading-relaxed text-gray-600">{vehicle.type} · Exterior: {vehicle.color}. {isComingSoon ? "This representative vehicle is not current DreamCarz inventory. Reserve your place and our team will guide you through the availability process." : "Review the vehicle in full, then choose whether you want to request a rental or ask about purchase options."}</DialogDescription>
                <div className="mt-10 grid gap-3 text-sm text-gray-600">
                  <p className="border-l-2 border-[#a8832d] pl-4">{isComingSoon ? "Reserve requests are reviewed before DreamCarz confirms timing, availability, and any next steps." : "Availability and final terms are confirmed after your request is reviewed."}</p>
                  <p className="border-l-2 border-[#a8832d] pl-4">No price, financing, or availability promise is displayed before DreamCarz confirmation.</p>
                </div>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {isComingSoon ? <button type="button" onClick={() => setView("reserve")} className="inline-flex h-12 items-center justify-center gap-2 bg-black px-5 text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.97]"><BookmarkPlus size={16} /> Reserve your vehicle</button> : <><button type="button" onClick={() => beginTransaction("rental")} className="inline-flex h-12 items-center justify-center gap-2 bg-black px-5 text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.97]"><CalendarDays size={16} /> Start rental application</button><button type="button" onClick={() => beginTransaction("purchase")} className="inline-flex h-12 items-center justify-center gap-2 border border-black bg-transparent px-5 text-sm font-semibold text-black transition-colors hover:bg-white"><ShoppingBag size={16} /> Start purchase application</button></>}
              </div>
            </div>
          </div>
        )}

        {isReserve && (
          <div className="grid min-h-[720px] lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="hidden bg-black px-10 py-14 text-white lg:block">
              <button type="button" onClick={() => setView("overview")} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft size={15} /> Back to vehicle</button>
              <img src={vehicle.image} alt={fullName} className="mt-16 h-60 w-full object-contain" />
              <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d1ad54]">{isRental ? "Rental request" : isPurchase ? "Purchase inquiry" : "Reserve request"}</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.045em]">{fullName}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/65">{isRental ? "Share your preferred dates and location. DreamCarz will review your request and guide you through any remaining rental requirements." : isPurchase ? "Share your preferred contact details. DreamCarz will follow up with the vehicle’s current purchase options and next steps." : "Share your contact details to reserve your interest. DreamCarz will follow up when an appropriate vehicle-access path is available."}</p>
            </aside>
            <div className="px-6 py-16 sm:px-12">
              <button type="button" onClick={() => setView("overview")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black lg:hidden"><ArrowLeft size={15} /> Back to vehicle</button>
              <DialogHeader className="mt-8 text-left lg:mt-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a8832d]">{isRental ? "Request a rental" : isPurchase ? "Ask about purchase" : "Reserve your vehicle"}</p>
                <DialogTitle className="font-display text-4xl font-bold tracking-[-0.05em] text-black">{isRental ? "Start your rental request." : isPurchase ? "Send a purchase inquiry." : "Reserve your vehicle."}</DialogTitle>
                <DialogDescription className="max-w-xl leading-relaxed text-gray-600">{isRental ? "We will confirm vehicle availability, then help you complete the required rental steps." : isPurchase ? "We will confirm current availability and discuss the applicable purchase path directly with you." : "This vehicle is labeled Coming Soon. Submit your interest and DreamCarz will guide you when a suitable option is ready."}</DialogDescription>
              </DialogHeader>
              {membershipPlan && <div className="mt-6 border-l-2 border-[#a8832d] bg-[#fcfaf2] px-4 py-3 text-sm leading-6 text-gray-700"><strong className="text-black">Your selected membership: {membershipPlan.name}</strong> · {membershipPlan.focus}. Membership and vehicle-specific terms are reviewed separately for this {isRental ? "rental" : isPurchase ? "purchase" : "reserve"} request.</div>}
              <form onSubmit={submitInquiry} className="mt-9 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-black">Your name<input required value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} className={inputClass} placeholder="Full name" /></label>
                  <label className="grid gap-2 text-sm font-semibold text-black">Mobile number<input required value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} className={inputClass} placeholder="(000) 000-0000" type="tel" /></label>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-black">Email address<input required value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className={inputClass} placeholder="you@example.com" type="email" /></label>
                <fieldset className="grid gap-2 text-sm font-semibold text-black"><legend>Preferred contact method</legend><div className="flex gap-3"><button type="button" onClick={() => setForm({ ...form, preferredContact: "phone" })} className={`inline-flex h-10 items-center gap-2 border px-4 text-sm ${form.preferredContact === "phone" ? "border-black bg-black text-white" : "border-gray-200 bg-white text-black"}`}><Phone size={14} /> Phone</button><button type="button" onClick={() => setForm({ ...form, preferredContact: "email" })} className={`inline-flex h-10 items-center gap-2 border px-4 text-sm ${form.preferredContact === "email" ? "border-black bg-black text-white" : "border-gray-200 bg-white text-black"}`}><Mail size={14} /> Email</button></div></fieldset>
                {isRental && <><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-black">Pickup date<input required value={form.requestedStartDate} onChange={(event) => setForm({ ...form, requestedStartDate: event.target.value })} className={inputClass} type="date" /></label><label className="grid gap-2 text-sm font-semibold text-black">Return date<input required value={form.requestedEndDate} onChange={(event) => setForm({ ...form, requestedEndDate: event.target.value })} className={inputClass} type="date" /></label></div><label className="grid gap-2 text-sm font-semibold text-black">Preferred pickup location<input required value={form.pickupLocation} onChange={(event) => setForm({ ...form, pickupLocation: event.target.value })} className={inputClass} placeholder="City, airport, or DreamCarz location" /></label></>}
                <label className="grid gap-2 text-sm font-semibold text-black">Anything else we should know?<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-24 w-full resize-y border border-gray-200 bg-white p-3 text-sm text-black outline-none placeholder:text-gray-400 focus:border-black" placeholder={isRental ? "Rental purpose or timing notes" : isPurchase ? "Questions about purchase options" : "Your preferred timeline or vehicle needs"} /></label>
                {createInquiry.error && <p className="text-sm text-red-600">{createInquiry.error.message}</p>}
                <button disabled={createInquiry.isPending} type="submit" className="inline-flex h-12 items-center justify-center gap-2 bg-black px-6 text-sm font-semibold text-white transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"><CarFront size={16} /> {createInquiry.isPending ? "Sending request…" : isRental ? "Submit rental request" : isPurchase ? "Submit purchase inquiry" : "Reserve your vehicle"}</button>
              </form>
            </div>
          </div>
        )}

        {view === "success" && (
          <div className="flex min-h-[560px] items-center justify-center px-8 py-16 text-center">
            <div className="max-w-lg">
              <CheckCircle2 className="mx-auto h-14 w-14 text-[#a8832d]" />
              <DialogTitle className="mt-6 font-display text-5xl font-bold tracking-[-0.055em] text-black">Your request is in.</DialogTitle>
              <DialogDescription className="mt-5 text-base leading-relaxed text-gray-600">DreamCarz received your {submittedInquiryType === "rental" ? "rental request" : submittedInquiryType === "purchase" ? "purchase inquiry" : "reserve request"} for the {fullName}. We will use your selected contact method to confirm the next step.</DialogDescription>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={() => resetAndClose(false)} className="h-12 bg-black px-6 text-sm font-semibold text-white">Back to inventory</button>{submittedInquiryType === "rental" && <Link href="/dashboard/rental-setup" className="inline-flex h-12 items-center justify-center border border-black px-6 text-sm font-semibold text-black">Open rental setup</Link>}</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
