import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const empty = {
  citationNumber: "",
  authority: "",
  plate: "",
  citedName: "",
  violationAt: "",
  amount: "",
};
const fields = [
  ["citationNumber", "Citation number"],
  ["authority", "Issuing authority"],
  ["plate", "License plate"],
  ["citedName", "Name printed on citation"],
  ["violationAt", "Violation date and time with UTC offset"],
  ["amount", "Fine amount (USD)"],
] as const;
const formatDate = (value: Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);

function encodePhoto(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, 2400 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo processing unavailable");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

async function preparePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    return encodePhoto(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

function TicketCamera({
  onCapture,
  onUpload,
}: {
  onCapture: (photo: string) => void;
  onUpload: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let closed = false;
    let stream: MediaStream | undefined;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
          },
        });
        if (closed) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        if (video.current) video.current.srcObject = stream;
      } catch {
        if (!closed)
          setError(
            "Camera unavailable. Allow camera access in your browser or upload a photo."
          );
      }
    };
    void start();
    return () => {
      closed = true;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
      <DialogTitle>Take ticket photo</DialogTitle>
      <DialogDescription>
        Fit the entire ticket in the frame and make sure the text is readable.
      </DialogDescription>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <video
        ref={video}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setReady(true)}
        className={
          error
            ? "hidden"
            : "max-h-[55dvh] min-h-40 w-full rounded bg-black object-contain"
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!ready || Boolean(error)}
          onClick={() => {
            const frame = video.current;
            if (!frame?.videoWidth || !frame.videoHeight) return;
            try {
              onCapture(
                encodePhoto(frame, frame.videoWidth, frame.videoHeight)
              );
            } catch {
              setError("Could not take the photo. Upload a photo to continue.");
            }
          }}
        >
          <Camera /> Capture photo
        </Button>
        <Button type="button" variant="outline" onClick={onUpload}>
          Upload a photo instead
        </Button>
      </div>
    </DialogContent>
  );
}

export function FleetTicketInventory() {
  const [before, setBefore] = useState<number>();
  const [selectedId, setSelectedId] = useState<number>();
  const [editId, setEditId] = useState<number>();
  const [photo, setPhoto] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [form, setForm] = useState(empty);
  const [rentalId, setRentalId] = useState<number>();
  const [authorization, setAuthorization] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const utils = trpc.useUtils();
  const list = trpc.fleetTickets.list.useQuery(
    { before },
    { refetchInterval: 30_000 }
  );
  const selected = list.data?.find(ticket => ticket.id === selectedId);
  const image = trpc.fleetTickets.photo.useQuery(selectedId ?? 0, {
    enabled: Boolean(selectedId),
  });
  const scan = trpc.fleetTickets.scan.useMutation({
    onError: error => toast.error(error.message),
  });
  const matches = trpc.fleetTickets.matches.useMutation({
    onError: error => toast.error(error.message),
  });
  const enter = trpc.fleetTickets.enter.useMutation({
    onError: error => toast.error(error.message),
    onSuccess: async ({ id }) => {
      setForm(empty);
      setPhoto("");
      setEditId(undefined);
      setBefore(undefined);
      setSelectedId(id);
      setRentalId(undefined);
      matches.reset();
      await utils.fleetTickets.list.invalidate();
      await utils.fleetTickets.photo.invalidate(id);
      toast.success("Citation saved.");
    },
  });
  const schedule = trpc.fleetTickets.schedule.useMutation({
    onError: error => toast.error(error.message),
    onSuccess: () => {
      setAuthorization("");
      void utils.fleetTickets.list.invalidate();
      toast.success("Charge attempt scheduled.");
    },
  });
  const voidTicket = trpc.fleetTickets.void.useMutation({
    onError: error => toast.error(error.message),
    onSuccess: () => {
      setVoidReason("");
      void utils.fleetTickets.list.invalidate();
      toast.success("Citation voided.");
    },
  });

  function readTicket(input: string) {
    scan.mutate(input, {
      onSuccess: data =>
        setForm(current => ({
          citationNumber: data.citationNumber ?? current.citationNumber,
          authority: data.authority ?? current.authority,
          plate: data.plate ?? current.plate,
          citedName: data.citedName ?? current.citedName,
          violationAt: data.violationAt ?? current.violationAt,
          amount:
            data.amountCents == null
              ? current.amount
              : (data.amountCents / 100).toFixed(2),
        })),
    });
  }

  function acceptPhoto(preview: string) {
    setPhoto(preview);
    readTicket(preview);
  }

  function selectTicket(id: number) {
    setSelectedId(id);
    setRentalId(undefined);
    setAuthorization("");
    setVoidReason("");
    matches.reset();
  }

  return (
    <section
      id="admin-tickets"
      className="scroll-mt-6 space-y-5 border border-gray-200 bg-white p-5"
    >
      <h3 className="text-lg font-bold text-black">Ticket inventory</h3>
      <form
        className="space-y-3"
        onSubmit={event => {
          event.preventDefault();
          const { amount, ...details } = form;
          enter.mutate({
            ...details,
            id: editId,
            photo,
            amountCents: Math.round(Number(amount) * 100),
          });
        }}
      >
        <h4 className="text-sm font-semibold">
          {editId ? "Edit citation" : "Enter citation"}
        </h4>
        <div className="flex flex-wrap items-end gap-3">
          <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                disabled={preparingPhoto || scan.isPending || enter.isPending}
              >
                <Camera /> {photo ? "Retake ticket photo" : "Take ticket photo"}
              </Button>
            </DialogTrigger>
            {cameraOpen && (
              <TicketCamera
                onCapture={preview => {
                  setCameraOpen(false);
                  acceptPhoto(preview);
                }}
                onUpload={() => {
                  setCameraOpen(false);
                  uploadInput.current?.click();
                }}
              />
            )}
          </Dialog>
          <Button
            type="button"
            variant="outline"
            disabled={preparingPhoto || scan.isPending || enter.isPending}
            onClick={() => uploadInput.current?.click()}
          >
            <Upload /> Upload photo
          </Button>
          <input
            ref={uploadInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async event => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(
                  file.type
                ) ||
                file.size > 20_000_000
              ) {
                toast.error("Choose a JPEG, PNG, or WebP image under 20 MB.");
                return;
              }
              setPreparingPhoto(true);
              try {
                const preview = await preparePhoto(file);
                acceptPhoto(preview);
              } catch {
                toast.error("Could not open the photo.");
              } finally {
                setPreparingPhoto(false);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={
              !photo || preparingPhoto || scan.isPending || enter.isPending
            }
            onClick={() => {
              readTicket(photo);
            }}
          >
            {scan.isPending ? "Reading photo…" : "Read ticket with AI"}
          </Button>
        </div>
        {photo && (
          <img
            src={photo}
            alt="Citation to be entered"
            className="max-h-40 rounded border object-contain"
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([name, label]) => (
            <label key={name} className="space-y-1 text-xs font-medium">
              <span>{label}</span>
              <Input
                value={form[name]}
                required={name !== "citedName"}
                type={name === "amount" ? "number" : "text"}
                min={name === "amount" ? "0.01" : undefined}
                step={name === "amount" ? "0.01" : undefined}
                placeholder={
                  name === "violationAt"
                    ? "2026-11-20T09:30:00-05:00"
                    : undefined
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    [name]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            disabled={
              !photo || preparingPhoto || enter.isPending || scan.isPending
            }
          >
            Save citation
          </Button>
          {editId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditId(undefined);
                setPhoto("");
                setForm(empty);
              }}
            >
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {[
                "Citation",
                "Customer and vehicle",
                "Fine",
                "Status",
                "Charge due",
              ].map(label => (
                <th key={label} scope="col" className="p-2">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.data?.map(ticket => (
              <tr key={ticket.id} className="border-b">
                <td className="p-2">
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => selectTicket(ticket.id)}
                  >
                    {ticket.citationNumber}
                  </button>
                  <div>{ticket.authority}</div>
                </td>
                <td className="p-2">
                  {ticket.customerName || ticket.accountName || "Unassigned"}
                  <div>{ticket.vehicleName || ticket.plate}</div>
                </td>
                <td className="p-2">
                  ${(ticket.amountCents / 100).toFixed(2)}
                </td>
                <td className="p-2 capitalize">
                  {ticket.status === "review" ? "Needs review" : ticket.status}
                </td>
                <td className="p-2">
                  {ticket.dueAt ? formatDate(ticket.dueAt) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.isLoading && <p className="p-2 text-sm">Loading tickets…</p>}
        {list.error && (
          <p role="alert" className="p-2 text-sm text-red-700">
            {list.error.message}
          </p>
        )}
        {list.data?.length === 0 && (
          <p className="p-2 text-sm">No tickets on this page.</p>
        )}
      </div>
      <div className="flex gap-2">
        {before && (
          <Button
            variant="outline"
            onClick={() => {
              setBefore(undefined);
              setSelectedId(undefined);
            }}
          >
            Latest tickets
          </Button>
        )}
        {list.data?.length === 50 && (
          <Button
            variant="outline"
            onClick={() => {
              setBefore(list.data?.at(-1)?.id);
              setSelectedId(undefined);
            }}
          >
            Older tickets
          </Button>
        )}
      </div>

      {selected && (
        <div className="space-y-3 border p-4">
          <h4 className="font-semibold">
            {selected.authority} · {selected.citationNumber}
          </h4>
          <p className="text-sm">
            {selected.plate} · {formatDate(selected.violationAt)}
            {selected.citedName ? ` · ${selected.citedName}` : ""}
          </p>
          {selected.rentalReference && (
            <p className="text-sm">Rental {selected.rentalReference}</p>
          )}
          {selected.outcome && <p className="text-sm">{selected.outcome}</p>}
          {selected.attemptedAt && (
            <p className="text-sm">
              Attempted {formatDate(selected.attemptedAt)} · CoCard order
              DC-TICKET-{selected.id}
              {selected.providerTransactionId
                ? ` · Payment ${selected.providerTransactionId}`
                : ""}
            </p>
          )}
          {image.data && (
            <img
              src={image.data}
              alt={`Citation ${selected.citationNumber}`}
              className="max-h-80 max-w-full object-contain"
            />
          )}
          {image.error && (
            <p role="alert" className="text-sm text-red-700">
              The citation photo could not be loaded.
            </p>
          )}
          {selected.status === "review" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={matches.isPending}
                  onClick={() =>
                    matches.mutate(
                      {
                        plate: selected.plate,
                        citedName: selected.citedName ?? undefined,
                        violationAt: selected.violationAt.toISOString(),
                      },
                      {
                        onSuccess: rows =>
                          setRentalId(
                            rows.length === 1 && rows[0].nameMatches
                              ? rows[0].id
                              : undefined
                          ),
                      }
                    )
                  }
                >
                  {matches.isPending
                    ? "Checking rental history…"
                    : "Review matching rentals"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!image.data}
                  onClick={() => {
                    setEditId(selected.id);
                    setPhoto(image.data ?? "");
                    setForm({
                      citationNumber: selected.citationNumber,
                      authority: selected.authority,
                      plate: selected.plate,
                      citedName: selected.citedName ?? "",
                      violationAt: selected.violationAt.toISOString(),
                      amount: (selected.amountCents / 100).toFixed(2),
                    });
                    document
                      .getElementById("admin-tickets")
                      ?.scrollIntoView({ block: "start" });
                  }}
                >
                  Edit citation
                </Button>
              </div>
              {matches.data?.length === 0 && (
                <p className="text-sm">
                  No recorded rental covers this plate and violation time.
                </p>
              )}
              {Boolean(matches.data?.length) && (
                <form
                  className="space-y-3"
                  onSubmit={event => {
                    event.preventDefault();
                    if (rentalId)
                      schedule.mutate({
                        id: selected.id,
                        transactionId: rentalId,
                        revision: selected.revision,
                        authorizationReference: authorization,
                      });
                  }}
                >
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      Confirm the responsible renter
                    </legend>
                    {matches.data?.map(rental => (
                      <label
                        key={rental.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name="ticket-rental"
                          checked={rentalId === rental.id}
                          onChange={() => setRentalId(rental.id)}
                          required
                        />
                        <span>
                          {rental.customerName ?? "Unnamed renter"} ·{" "}
                          {rental.vehicleName} · {rental.reference}
                          <br />
                          Pickup {formatDate(rental.pickupAt)}
                          {rental.returnAt &&
                            ` · Returned ${formatDate(rental.returnAt)}`}
                          {!rental.nameMatches && " · Printed name differs"}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <label className="block space-y-1 text-xs font-medium">
                    <span>
                      Agreement clause or customer authorization for this
                      citation charge
                    </span>
                    <Input
                      value={authorization}
                      onChange={event => setAuthorization(event.target.value)}
                      minLength={3}
                      maxLength={240}
                      required
                    />
                  </label>
                  <Button disabled={!rentalId || schedule.isPending}>
                    Approve and schedule charge
                  </Button>
                </form>
              )}
            </div>
          )}
          {["review", "scheduled"].includes(selected.status) && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={event => {
                event.preventDefault();
                voidTicket.mutate({ id: selected.id, reason: voidReason });
              }}
            >
              <label className="space-y-1 text-xs font-medium">
                <span>Reason to void</span>
                <Input
                  value={voidReason}
                  onChange={event => setVoidReason(event.target.value)}
                  minLength={3}
                  maxLength={180}
                  required
                />
              </label>
              <Button variant="outline" disabled={voidTicket.isPending}>
                Void citation
              </Button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
