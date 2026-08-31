import { COOKIE_NAME, DIRECT_SESSION_COOKIE, DIRECT_SESSION_MAX_AGE_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { createDirectSession, loginDirectAccount, registerDirectAccount, revokeDirectSession, setDirectPasswordForUser } from "./directAuth";
import {
  referralProfiles,
  referrals,
  commissions,
  associateLeads,
  associateLeadActivityEvents,
  rentalApplications,
  rentalApplicationDocuments,
  customerProfiles,
  conciergeJourneyPreferences,
  reservationRequests,
  vehicleInquiries,
  vehicleTransactions,
  transactionEvents,
  transactionAgreements,
  agreementTemplates,
  transactionConsents,
  transactionDocuments,
  transactionAdditionalDrivers,
  vehicleConditionReports,
  users,
  serviceReports,
  serviceReportPhotos,
  serviceReportReviewEvents,
  partnerLocations,
  userRoleAssignments,
  roleAssignmentEvents,
  membershipPlans,
  membershipBenefits,
  customerMemberships,
  walletAccounts,
  walletLedgerEntries,
  transactionEligibilityAssessments,
  eligibilityPolicies,
  eligibilityPolicyEvents,
  transactionSchedules,
  transactionQuotes,
  transactionQuoteLines,
  pricingRules,
  pricingRuleEvents,
  transactionLinks,
  vehiclePassports,
  vehiclePassportActivityEvents,
  vehicleOperationalInspections,
  vehicleMaintenanceRecords,
  vehicleIncidentRecords,
  fleetPartnerProfiles,
  fleetPartnerVehicleAssignments,
  communicationPreferences,
  customerNotifications,
  communicationEvents,
  supportRequests,
  supportRequestEvents,
  rentalExtensionRequests,
  transactionSettlements,
  transactionAdjustments,
  referralConversionEvents,
} from "../drizzle/schema";
import { eq, and, desc, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { filterPartnerDirectory, partnerActivationValue } from "../shared/partnerDirectory";
import { orderServiceReportTimeline } from "../shared/serviceReportTimeline";
import { z } from "zod";
import { storageGetSignedUrl, storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { parse } from "cookie";
import { createHash } from "node:crypto";
import { DREAMCARZ_LEDGER_REFERENCE_PREFIX, DREAMCARZ_MEMBERSHIP_BENEFIT_TYPES, DREAMCARZ_WALLET_ENTRY_TYPES, summarizeWalletLedger } from "../shared/dreamcarzOs";
import { DREAMCARZ_ROLES, effectiveDreamCarzRoles } from "../shared/dreamcarzRoles";
import { canMemberCancelReservation, hasValidReservationDateRange } from "../shared/reservationRequest";
import { hasCompleteRentalInquiry, vehicleInquiryReferencePrefix } from "../shared/vehicleInquiry";
import { createStripeIdentityVerificationSession, getIdentityProviderStatus } from "./identityProvider";
import { createAwsFaceLivenessBrowserCredentials, createAwsFaceLivenessSession, getAwsFaceLivenessResult, getAwsFaceLivenessStatus } from "./awsFaceLiveness";
import { cocardPaymentSetupBlocker, getPaymentProviderStatus, verifyCoCardCheckoutReturn } from "./paymentProvider";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { evaluateActiveMembershipBenefits, membershipAllowsVehicle } from "../shared/membershipBenefits";
import { consumeRateLimit, rateLimitKey } from "./rateLimit";
import {
  APPROVED_TRANSACTION_VEHICLES,
  canReuseProfileVerification,
  hasVehicleReleaseReadiness,
  initialTransactionLifecycle,
  isApprovedTransactionVehicle,
  isTransactionStep,
  nextCustomerTransactionStep,
  canTransitionTransaction,
  TRANSACTION_STATUSES,
  transactionStepForStatus,
  TRANSACTION_MEMBERSHIP_PLANS,
  TRANSACTION_REFERENCE_PREFIX,
} from "../shared/transactionLifecycle";

function escapeAgreementHtml(value: string) {
  return value.replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
}

function renderAgreementContent(template: string, transaction: { reference: string; vehicleName: string; contactName: string | null }) {
  return template
    .replaceAll("{{TRANSACTION_REFERENCE}}", transaction.reference)
    .replaceAll("{{VEHICLE_NAME}}", transaction.vehicleName)
    .replaceAll("{{CUSTOMER_NAME}}", transaction.contactName ?? "DreamCarz customer");
}

function hasFutureRecordedInsuranceCoverage(insuranceDetails: string | null | undefined, now = new Date()) {
  if (!insuranceDetails) return false;
  try {
    const parsed = JSON.parse(insuranceDetails) as { coverageExpiresOn?: unknown };
    if (typeof parsed.coverageExpiresOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.coverageExpiresOn)) return false;
    return parsed.coverageExpiresOn > now.toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

function parseStoredEvidenceKeys(raw: string | null | undefined) {
  if (!raw) return [] as string[];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string" && key.length > 0) : [];
  } catch {
    return [] as string[];
  }
}

const VEHICLE_PASSPORT_READINESS_STATUSES = ["not_ready", "inspection_due", "maintenance_due", "available", "reserved", "active_rental", "out_of_service", "retired"] as const;

function parseVehiclePassportReadinessTransition(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const { fromReadinessStatus, toReadinessStatus } = value as Record<string, unknown>;
    if (
      typeof fromReadinessStatus !== "string" ||
      typeof toReadinessStatus !== "string" ||
      !VEHICLE_PASSPORT_READINESS_STATUSES.includes(fromReadinessStatus as typeof VEHICLE_PASSPORT_READINESS_STATUSES[number]) ||
      !VEHICLE_PASSPORT_READINESS_STATUSES.includes(toReadinessStatus as typeof VEHICLE_PASSPORT_READINESS_STATUSES[number])
    ) return null;
    return { fromReadinessStatus, toReadinessStatus };
  } catch {
    return null;
  }
}

function containsRestrictedSupportContent(value: string) {
  const digitsOnly = value.replace(/[^0-9]/g, "");
  const likelyCardNumber = /\d{13,19}/.test(digitsOnly);
  const likelyPassword = /\b(?:password|passcode|pin)\b\s*(?:is|:|=)\s*\S+/i.test(value);
  const likelyLicenseNumber = /\b(?:driver'?s?\s*licen[cs]e|dl)\s*(?:number|no\.?|#|:|=)\s*(?::|=)?\s*[a-z0-9-]{4,}/i.test(value);
  return likelyCardNumber || likelyPassword || likelyLicenseNumber;
}

function assertSafeRestrictedContent(value: string, destination: "support message" | "operational report" | "private lead note" | "condition report") {
  if (containsRestrictedSupportContent(value)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Please remove payment-card numbers, passwords, and driver-license numbers before sending this ${destination}.` });
  }
}

function assertSafeSupportContent(value: string) {
  assertSafeRestrictedContent(value, "support message");
}

async function recordVehiclePassportActivity(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: { vehiclePassportId: number; actorUserId: number; eventType: string; metadata?: Record<string, string> },
) {
  await db.insert(vehiclePassportActivityEvents).values({
    vehiclePassportId: input.vehiclePassportId,
    actorUserId: input.actorUserId,
    eventType: input.eventType,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}

async function deliverLifecycleInAppNotice(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  input: { userId: number; title: string; body: string; actionPath: string; relatedTransactionId: number },
) {
  const preference = (await db.select().from(communicationPreferences).where(eq(communicationPreferences.userId, input.userId)).limit(1))[0];
  if (preference?.transactionalInAppEnabled === false) {
    await db.insert(communicationEvents).values({ userId: input.userId, channel: "in_app", status: "suppressed", detail: "Customer disabled transactional in-app notices." });
    return { suppressed: true } as const;
  }
  const inserted = await db.insert(customerNotifications).values({ ...input, category: "transaction" });
  const notificationId = Number(inserted[0].insertId);
  await db.insert(communicationEvents).values({ userId: input.userId, notificationId, channel: "in_app", status: "delivered", detail: "Automated lifecycle notice" });
  return { suppressed: false, notificationId } as const;
}

function nativeSignatureHash(input: { agreementId: number; signerName: string; acknowledgedAt: Date; contentSnapshot: string }) {
  return createHash("sha256").update([input.agreementId, input.signerName, input.acknowledgedAt.toISOString(), input.contentSnapshot, process.env.JWT_SECRET ?? "dreamcarz-native-signature"].join("|"), "utf8").digest("hex");
}

async function hasReviewedRentalAdditionalDrivers(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  transactionId: number,
) {
  const drivers = await db.select({
    licenseStatus: transactionAdditionalDrivers.licenseStatus,
    identityStatus: transactionAdditionalDrivers.identityStatus,
  }).from(transactionAdditionalDrivers).where(eq(transactionAdditionalDrivers.transactionId, transactionId));
  return drivers.every(driver => driver.licenseStatus === "verified" && driver.identityStatus === "verified");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          email: z.string().trim().email().max(320),
          password: z.string().min(10).max(128),
          acceptedTerms: z.literal(true),
          referralCode: z.string().trim().toUpperCase().regex(/^DC-[A-Z0-9_-]{4,28}$/).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const registrationLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "register", input.email), limit: 5, windowMs: 15 * 60_000 });
        if (!registrationLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying to create another account." });
        const db = await getDb();
        const referrer = input.referralCode && db ? (await db.select().from(referralProfiles).where(eq(referralProfiles.referralCode, input.referralCode)).limit(1))[0] : undefined;
        if (input.referralCode && !referrer) throw new TRPCError({ code: "BAD_REQUEST", message: "That Associate referral code is not active." });
        const user = await registerDirectAccount({ name: input.name, email: input.email, password: input.password });
        if (!user) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please sign in instead." });
        }
        if (referrer && db && referrer.userId !== user.id) {
          const createdReferral = await db.insert(referrals).values({ referrerId: referrer.userId, referredId: user.id, status: "pending" });
          await db.insert(referralConversionEvents).values({ referralId: Number(createdReferral[0].insertId), referrerUserId: referrer.userId, referredUserId: user.id, eventType: "account_registered" });
        }
        const session = await createDirectSession(user.id);
        ctx.res.cookie(DIRECT_SESSION_COOKIE, session.token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: DIRECT_SESSION_MAX_AGE_MS,
        });
        return user;
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) }))
      .mutation(async ({ ctx, input }) => {
        const loginLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "login", input.email), limit: 8, windowMs: 15 * 60_000 });
        if (!loginLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many sign-in attempts. Please wait and try again." });
        const user = await loginDirectAccount(input.email, input.password);
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
        }
        const session = await createDirectSession(user.id);
        ctx.res.cookie(DIRECT_SESSION_COOKIE, session.token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: DIRECT_SESSION_MAX_AGE_MS,
        });
        return user;
      }),
    setDirectPassword: protectedProcedure
      .input(z.object({ password: z.string().min(10).max(128) }))
      .mutation(async ({ ctx, input }) => {
        await setDirectPasswordForUser(ctx.user.id, input.password);
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const cookies = parse(ctx.req.headers.cookie ?? "");
      await revokeDirectSession(cookies[DIRECT_SESSION_COOKIE]);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(DIRECT_SESSION_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  concierge: router({
    confirmedVehicles: publicProcedure.query(() => Object.entries(APPROVED_TRANSACTION_VEHICLES).map(([vehicleId, vehicle]) => ({
      vehicleId,
      vehicleName: vehicle.vehicleName,
      image: vehicle.image,
      vehicleClass: vehicleId.includes("traverse") || vehicleId.includes("equinox") ? "suv" as const : "sedan" as const,
    }))),

    publicGuide: publicProcedure
      .input(z.object({ question: z.string().trim().min(2).max(240) }))
      .mutation(async ({ ctx, input }) => {
        const guidanceLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "public_concierge_guidance", "guest"), limit: 12, windowMs: 60 * 60_000 });
        if (!guidanceLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before asking DreamCarz Concierge another question." });
        const containsSensitiveInput = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:card|cvv|password|passcode|pin|license\s*(?:number|#)?|driver'?s\s*license)\b/i.test(input.question);
        if (containsSensitiveInput) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "For your privacy, do not enter contact, payment, license, password, or government-identification details in DreamCarz Concierge. Sign in and use the protected onboarding steps when you are ready." });
        }
        const inventory = Object.entries(APPROVED_TRANSACTION_VEHICLES).map(([vehicleId, vehicle]) => ({
          vehicleId,
          vehicleName: vehicle.vehicleName,
          vehicleClass: vehicleId.includes("traverse") || vehicleId.includes("equinox") ? "suv" as const : "sedan" as const,
        }));
        const vehicleIds = inventory.map(vehicle => vehicle.vehicleId);
        const fallback = {
          answer: "I can help you compare the confirmed DreamCarz vehicles and choose a rental or purchase journey. I cannot quote prices, promise availability, make a payment or eligibility decision, or collect private information here.",
          intent: "explore" as const,
          vehicleClass: null,
          nextPrompt: "Would you like to compare sedans or SUVs?",
          recommendedVehicleIds: vehicleIds,
          source: "fallback" as const,
        };
        try {
          const { data: models } = await listLLMModels();
          const model = models.find(candidate => candidate.id === "claude-haiku-4-5")?.id ?? models.find(candidate => candidate.id === "gpt-5-mini")?.id ?? models.find(candidate => candidate.id.startsWith("gpt-5"))?.id;
          for (let attempt = 0; attempt < 2; attempt += 1) {
            const response = await invokeLLM({
              model,
              maxTokens: 500,
              messages: [
                { role: "system", content: "You are DreamCarz Concierge for a public vehicle discovery page. Chat text is temporary and must not be treated as a record. Use only the CONFIRMED_INVENTORY supplied below. Never invent a vehicle, price, payment, availability, eligibility, financing, insurance, contract, timing, vehicle release, policy, or approval. Never ask for or repeat names, email, phone, address, driver license, government ID, biometric, password, PIN, or card information; direct the visitor to sign in and protected onboarding instead. Keep the answer under 420 characters, answer the question warmly, and propose a non-sensitive next vehicle-selection question. Return vehicleClass as sedan, suv, or all when no vehicle-class filter should apply." },
                { role: "user", content: `QUESTION: ${input.question}\n\nCONFIRMED_INVENTORY: ${JSON.stringify(inventory)}\n\nReturn only the requested structured response.` },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "public_dreamcarz_concierge_guidance",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      answer: { type: "string" },
                      intent: { type: "string", enum: ["rental", "purchase", "membership", "explore"] },
                      vehicleClass: { type: "string", enum: ["sedan", "suv", "all"] },
                      nextPrompt: { type: "string" },
                      recommendedVehicleIds: { type: "array", items: { type: "string", enum: vehicleIds }, maxItems: 4 },
                    },
                    required: ["answer", "intent", "vehicleClass", "nextPrompt", "recommendedVehicleIds"],
                    additionalProperties: false,
                  },
                },
              },
            });
            const content = response.choices?.[0]?.message.content;
            if (typeof content !== "string") continue;
            let parsed: Record<string, unknown>;
            try { parsed = JSON.parse(content) as Record<string, unknown>; } catch { continue; }
            const answer = typeof parsed.answer === "string" ? parsed.answer.trim().slice(0, 420) : "";
            const intent = ["rental", "purchase", "membership", "explore"].includes(String(parsed.intent)) ? parsed.intent as "rental" | "purchase" | "membership" | "explore" : "explore";
            const vehicleClass = parsed.vehicleClass === "sedan" || parsed.vehicleClass === "suv" ? parsed.vehicleClass : null;
            const nextPrompt = typeof parsed.nextPrompt === "string" ? parsed.nextPrompt.trim().slice(0, 200) : fallback.nextPrompt;
            const recommendedVehicleIds = Array.isArray(parsed.recommendedVehicleIds) ? parsed.recommendedVehicleIds.filter((vehicleId): vehicleId is string => typeof vehicleId === "string" && vehicleIds.includes(vehicleId)).slice(0, 4) : [];
            const unsupportedClaim = /\$\s*\d|(?:price|pricing|rate|quote)\s+(?:is|of|at)\b|(?:approved|eligible|guaranteed|released)\s+(?:for|to)\b|(?:available|availability)\s+(?:today|now|this\s+week)\b/i.test(`${answer} ${nextPrompt}`);
            if (!answer || unsupportedClaim) continue;
            return { answer, intent, vehicleClass, nextPrompt, recommendedVehicleIds: recommendedVehicleIds.length ? recommendedVehicleIds : vehicleIds, source: "live_guidance" as const };
          }
          return fallback;
        } catch {
          console.warn("[DreamCarz Concierge] Public guidance unavailable");
          return fallback;
        }
      }),

    saveJourneyPreference: protectedProcedure
      .input(z.object({
        intent: z.enum(["rental", "purchase", "membership", "explore"]),
        preferredVehicleClass: z.enum(["sedan", "suv"]).nullable(),
        selectedVehicleId: z.string().trim().min(2).max(96).nullable(),
        timeline: z.enum(["exploring", "soon", "this_week"]).nullable(),
        confirmSave: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const saveLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "concierge_journey_preference", String(ctx.user.id)), limit: 12, windowMs: 60 * 60_000 });
        if (!saveLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before updating your DreamCarz concierge preferences again." });
        if (input.selectedVehicleId && !isApprovedTransactionVehicle(input.selectedVehicleId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Select a confirmed DreamCarz inventory vehicle." });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DreamCarz concierge preferences are temporarily unavailable." });
        const selectedVehicle = input.selectedVehicleId ? APPROVED_TRANSACTION_VEHICLES[input.selectedVehicleId as keyof typeof APPROVED_TRANSACTION_VEHICLES] : null;
        const values = {
          intent: input.intent,
          preferredVehicleClass: input.preferredVehicleClass,
          selectedVehicleId: input.selectedVehicleId,
          selectedVehicleName: selectedVehicle?.vehicleName ?? null,
          timeline: input.timeline,
          savedAt: new Date(),
        };
        const existing = await db.select({ id: conciergeJourneyPreferences.id }).from(conciergeJourneyPreferences).where(eq(conciergeJourneyPreferences.userId, ctx.user.id)).limit(1);
        if (existing[0]) await db.update(conciergeJourneyPreferences).set(values).where(eq(conciergeJourneyPreferences.id, existing[0].id));
        else await db.insert(conciergeJourneyPreferences).values({ userId: ctx.user.id, ...values });
        return { success: true, preference: values };
      }),

    guide: protectedProcedure.input(z.object({ question: z.string().trim().min(2).max(800) })).mutation(async ({ ctx, input }) => {
      const guidanceLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "concierge_guidance", String(ctx.user.id)), limit: 18, windowMs: 60 * 60 * 1000 });
      if (!guidanceLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before asking DreamCarz Concierge another question." });

      const actionMap = {
        inventory: { label: "Confirmed inventory", href: "/fleet" },
        transactions: { label: "My Records", href: "/dashboard/transactions" },
        vehicles: { label: "My Vehicles", href: "/dashboard/vehicles" },
        membership: { label: "DreamCarz ID", href: "/dashboard/dreamcarz-id" },
        reservations: { label: "Reservations", href: "/dashboard/reservations" },
        incidents: { label: "Safety & Incident Center", href: "/dashboard/incidents" },
        support: { label: "Support", href: "/dashboard/support" },
        call: { label: "Call DreamCarz", href: "tel:3017722500" },
      } as const;
      type ActionId = keyof typeof actionMap;
      const actionIds = Object.keys(actionMap) as ActionId[];
      const fallback = {
        answer: "I can guide you to your current DreamCarz records, confirmed inventory, or support. I cannot approve a vehicle, confirm availability, quote a price, make a payment decision, or provide legal or eligibility determinations.",
        actions: [actionMap.transactions, actionMap.support],
        source: "fallback" as const,
      };

      const db = await getDb();
      if (!db) return fallback;
      const [membership, transactions] = await Promise.all([
        db.select({ planName: membershipPlans.name, status: customerMemberships.status, endsAt: customerMemberships.endsAt }).from(customerMemberships).innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id)).where(eq(customerMemberships.userId, ctx.user.id)).orderBy(desc(customerMemberships.updatedAt)).limit(1),
        db.select({ transactionType: vehicleTransactions.transactionType, vehicleName: vehicleTransactions.vehicleName, status: vehicleTransactions.status, currentStep: vehicleTransactions.currentStep, agreementStatus: vehicleTransactions.agreementStatus, paymentStatus: vehicleTransactions.paymentStatus, pickupStatus: vehicleTransactions.pickupStatus, returnStatus: vehicleTransactions.returnStatus, settlementStatus: vehicleTransactions.settlementStatus, updatedAt: vehicleTransactions.updatedAt }).from(vehicleTransactions).where(eq(vehicleTransactions.userId, ctx.user.id)).orderBy(desc(vehicleTransactions.updatedAt)).limit(6),
      ]);
      const recordContext = {
        activeMembership: membership[0] ? { planName: membership[0].planName, status: membership[0].status, endsAt: membership[0].endsAt?.toISOString() ?? null } : null,
        recentTransactionStatuses: transactions.map(transaction => ({ type: transaction.transactionType, vehicle: transaction.vehicleName, status: transaction.status, step: transaction.currentStep, agreement: transaction.agreementStatus, payment: transaction.paymentStatus, pickup: transaction.pickupStatus, return: transaction.returnStatus, settlement: transaction.settlementStatus })),
        confirmedInventory: Object.values(APPROVED_TRANSACTION_VEHICLES).map(vehicle => vehicle.vehicleName),
        publishedOffice: { address: "10001 Derekwood Ln, Suite 204, Lanham, MD 20706", phone: "(301) 772-2500", hours: "Monday–Friday 9:00 AM–6:00 PM; Saturday 9:00 AM–3:00 PM; Sunday closed" },
      };

      try {
        const { data: models } = await listLLMModels();
        const model = models.find(candidate => candidate.id === "gpt-5-mini")?.id ?? models.find(candidate => candidate.id.startsWith("gpt-5"))?.id;
        const response = await invokeLLM({
          model,
          maxTokens: 700,
          messages: [
            { role: "system", content: "You are DreamCarz Concierge. Answer only from the RECORDS_CONTEXT supplied by the application. Do not invent information or use knowledge outside it. Never promise or decide availability, eligibility, financing, pricing, deposits, payment, insurance, contracts, legal outcomes, compensation, timing, or vehicle release. Do not request or repeat card data, license numbers, government ID, full address, or biometric information. For immediate danger or an accident, tell the member to contact emergency services first when appropriate and direct them to the Safety & Incident Center. Do not claim you are a human or that chat is monitored. Keep answer under 550 characters and make it clear when staff review is required." },
            { role: "user", content: `QUESTION: ${input.question}\n\nRECORDS_CONTEXT: ${JSON.stringify(recordContext)}\n\nReturn structured guidance.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "dreamcarz_guidance",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  answer: { type: "string" },
                  actionIds: { type: "array", items: { type: "string", enum: actionIds }, maxItems: 2 },
                },
                required: ["answer", "actionIds"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        const parsed = typeof content === "string" ? JSON.parse(content) as { answer?: unknown; actionIds?: unknown } : null;
        const answer = typeof parsed?.answer === "string" ? parsed.answer.trim().slice(0, 550) : "";
        const selectedActionIds = Array.isArray(parsed?.actionIds) ? parsed.actionIds.filter((id): id is ActionId => typeof id === "string" && actionIds.includes(id as ActionId)).slice(0, 2) : [];
        if (!answer) return fallback;
        return { answer, actions: selectedActionIds.map(id => actionMap[id]), source: "live_guidance" as const };
      } catch (error) {
        console.warn("[DreamCarz Concierge] Guidance unavailable", error instanceof Error ? error.message : "unknown error");
        return fallback;
      }
    }),
  }),

  dreamcarzId: router({
    ensure: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DreamCarz ID is temporarily unavailable." });

      const profile = await db.select({ id: customerProfiles.id }).from(customerProfiles).where(eq(customerProfiles.userId, ctx.user.id)).limit(1);
      if (!profile[0]) {
        await db.insert(customerProfiles).values({ userId: ctx.user.id, fullName: ctx.user.name ?? null, email: ctx.user.email ?? null });
      }
      const wallet = await db.select({ id: walletAccounts.id }).from(walletAccounts).where(eq(walletAccounts.userId, ctx.user.id)).limit(1);
      if (!wallet[0]) await db.insert(walletAccounts).values({ userId: ctx.user.id });
      return { success: true, profileCreated: !profile[0], walletCreated: !wallet[0] } as const;
    }),

    overview: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DreamCarz ID is temporarily unavailable." });
      const [profiles, activeRoles, memberships, wallets, transactions, conciergePreferences] = await Promise.all([
        db.select({
          id: customerProfiles.id,
          userId: customerProfiles.userId,
          fullName: customerProfiles.fullName,
          email: customerProfiles.email,
          phone: customerProfiles.phone,
          phoneVerifiedAt: customerProfiles.phoneVerifiedAt,
          emailVerifiedAt: customerProfiles.emailVerifiedAt,
          addressLine1: customerProfiles.addressLine1,
          addressLine2: customerProfiles.addressLine2,
          city: customerProfiles.city,
          state: customerProfiles.state,
          postalCode: customerProfiles.postalCode,
          identityStatus: customerProfiles.identityStatus,
          licenseStatus: customerProfiles.licenseStatus,
          identityVerifiedAt: customerProfiles.identityVerifiedAt,
          licenseVerifiedAt: customerProfiles.licenseVerifiedAt,
          verificationExpiresAt: customerProfiles.verificationExpiresAt,
          profileStatus: customerProfiles.profileStatus,
          createdAt: customerProfiles.createdAt,
          updatedAt: customerProfiles.updatedAt,
        }).from(customerProfiles).where(eq(customerProfiles.userId, ctx.user.id)).limit(1),
        db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))),
        db.select({ membership: customerMemberships, plan: membershipPlans }).from(customerMemberships).innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id)).where(and(eq(customerMemberships.userId, ctx.user.id), eq(customerMemberships.status, "active"))).orderBy(desc(customerMemberships.updatedAt)).limit(1),
        db.select().from(walletAccounts).where(eq(walletAccounts.userId, ctx.user.id)).limit(1),
        db.select({ reference: vehicleTransactions.reference, transactionType: vehicleTransactions.transactionType, vehicleName: vehicleTransactions.vehicleName, status: vehicleTransactions.status, updatedAt: vehicleTransactions.updatedAt }).from(vehicleTransactions).where(eq(vehicleTransactions.userId, ctx.user.id)).orderBy(desc(vehicleTransactions.updatedAt)).limit(12),
        db.select().from(conciergeJourneyPreferences).where(eq(conciergeJourneyPreferences.userId, ctx.user.id)).limit(1),
      ]);
      const membership = memberships[0] ?? null;
      const benefits = membership
        ? await db.select({ benefitType: membershipBenefits.benefitType, label: membershipBenefits.label, configuration: membershipBenefits.configuration }).from(membershipBenefits).where(and(eq(membershipBenefits.membershipPlanId, membership.plan.id), eq(membershipBenefits.isActive, true)))
        : [];
      const wallet = wallets[0] ?? null;
      const ledgerEntries = wallet
        ? await db.select({ reference: walletLedgerEntries.reference, entryType: walletLedgerEntries.entryType, status: walletLedgerEntries.status, amountCents: walletLedgerEntries.amountCents, description: walletLedgerEntries.description, createdAt: walletLedgerEntries.createdAt, postedAt: walletLedgerEntries.postedAt }).from(walletLedgerEntries).where(eq(walletLedgerEntries.walletAccountId, wallet.id)).orderBy(desc(walletLedgerEntries.createdAt)).limit(25)
        : [];
      const walletSummary = summarizeWalletLedger(ledgerEntries);
      const profile = profiles[0] ?? null;
      return {
        profile,
        roles: effectiveDreamCarzRoles(ctx.user.role, activeRoles.map(record => record.role)),
        membership: membership ? { ...membership.membership, plan: membership.plan, benefits } : null,
        wallet: wallet ? { account: wallet, ...walletSummary, entries: ledgerEntries } : null,
        transactions,
        conciergeJourney: conciergePreferences[0] ?? null,
        accountStanding: profile?.profileStatus === "restricted" || wallet?.status === "restricted" ? "restricted" : profile?.profileStatus ?? "incomplete",
      };
    }),
  }),

  memberships: router({
    listActive: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ id: membershipPlans.id, code: membershipPlans.code, name: membershipPlans.name, description: membershipPlans.description, enrollmentFeeCents: membershipPlans.enrollmentFeeCents, monthlyFeeCents: membershipPlans.monthlyFeeCents }).from(membershipPlans).where(eq(membershipPlans.isActive, true)).orderBy(membershipPlans.name);
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const memberships = await db.select({ membership: customerMemberships, plan: membershipPlans }).from(customerMemberships).innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id)).where(and(eq(customerMemberships.userId, ctx.user.id), eq(customerMemberships.status, "active"))).orderBy(desc(customerMemberships.updatedAt)).limit(1);
      const membership = memberships[0];
      if (!membership) return null;
      const benefits = await db.select({ benefitType: membershipBenefits.benefitType, label: membershipBenefits.label, configuration: membershipBenefits.configuration }).from(membershipBenefits).where(and(eq(membershipBenefits.membershipPlanId, membership.plan.id), eq(membershipBenefits.isActive, true)));
      return { ...membership.membership, plan: membership.plan, benefits };
    }),
    createPlan: protectedProcedure
      .input(z.object({ code: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/), name: z.string().trim().min(2).max(120), description: z.string().trim().max(2_000).optional(), enrollmentFeeCents: z.number().int().min(0).max(10_000_000).optional(), monthlyFeeCents: z.number().int().min(0).max(10_000_000).optional(), activate: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.activate) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Membership plans remain draft-only until approved plan configurations are defined." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership configuration is temporarily unavailable." });
        const created = await db.insert(membershipPlans).values({ ...input, description: input.description || null, enrollmentFeeCents: input.enrollmentFeeCents ?? null, monthlyFeeCents: input.monthlyFeeCents ?? null, isActive: false });
        return { success: true, planId: Number(created[0].insertId) };
      }),
    addBenefit: protectedProcedure
      .input(z.object({ membershipPlanId: z.number().int().positive(), benefitType: z.enum(DREAMCARZ_MEMBERSHIP_BENEFIT_TYPES), label: z.string().trim().min(2).max(160), configuration: z.string().trim().min(2).max(5_000), activate: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.activate) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Membership benefits remain draft-only until approved benefit configurations are defined." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership configuration is temporarily unavailable." });
        const plan = await db.select({ id: membershipPlans.id }).from(membershipPlans).where(eq(membershipPlans.id, input.membershipPlanId)).limit(1);
        if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Membership plan not found." });
        const created = await db.insert(membershipBenefits).values({ ...input, isActive: input.activate });
        return { success: true, benefitId: Number(created[0].insertId) };
      }),
  }),

  wallet: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Wallet records are temporarily unavailable." });
      const accounts = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, ctx.user.id)).limit(1);
      const account = accounts[0] ?? null;
      if (!account) return { account: null, availableCreditCents: 0, activeHoldCents: 0, entries: [] };
      const entries = await db.select().from(walletLedgerEntries).where(eq(walletLedgerEntries.walletAccountId, account.id)).orderBy(desc(walletLedgerEntries.createdAt)).limit(100);
      return { account, ...summarizeWalletLedger(entries), entries };
    }),
    recordEntry: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), transactionId: z.number().int().positive().optional(), entryType: z.enum(DREAMCARZ_WALLET_ENTRY_TYPES), amountCents: z.number().int().min(1).max(10_000_000), description: z.string().trim().min(2).max(255), providerReference: z.string().trim().min(1).max(160).optional(), status: z.enum(["pending", "posted"]).default("pending") }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Wallet records are temporarily unavailable." });
        let account = (await db.select().from(walletAccounts).where(eq(walletAccounts.userId, input.userId)).limit(1))[0];
        if (!account) {
          await db.insert(walletAccounts).values({ userId: input.userId });
          account = (await db.select().from(walletAccounts).where(eq(walletAccounts.userId, input.userId)).limit(1))[0];
        }
        if (!account) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Wallet account could not be initialized." });
        const reference = `${DREAMCARZ_LEDGER_REFERENCE_PREFIX}-${new Date().getFullYear()}-${nanoid(10).toUpperCase()}`;
        await db.insert(walletLedgerEntries).values({ reference, walletAccountId: account.id, userId: input.userId, transactionId: input.transactionId ?? null, entryType: input.entryType, amountCents: input.amountCents, description: input.description, providerReference: input.providerReference ?? null, status: input.status, createdByUserId: ctx.user.id, postedAt: input.status === "posted" ? new Date() : null });
        return { success: true, reference };
      }),
  }),

  roles: router({
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { roles: effectiveDreamCarzRoles(ctx.user.role, []) };
      const assignments = await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt)));
      return { roles: effectiveDreamCarzRoles(ctx.user.role, assignments.map(assignment => assignment.role)) };
    }),
    listForUser: protectedProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        return db.select().from(userRoleAssignments).where(eq(userRoleAssignments.userId, input.userId)).orderBy(desc(userRoleAssignments.assignedAt));
      }),
    assign: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(DREAMCARZ_ROLES) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Role management is temporarily unavailable." });
        const existing = await db.select().from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, input.userId), eq(userRoleAssignments.role, input.role))).limit(1);
        if (existing[0]) {
          if (!existing[0].revokedAt) return { success: true, restored: false, alreadyActive: true };
          await db.update(userRoleAssignments).set({ revokedAt: null, assignedByUserId: ctx.user.id, assignedAt: new Date() }).where(eq(userRoleAssignments.id, existing[0].id));
          await db.insert(roleAssignmentEvents).values({ roleAssignmentId: existing[0].id, targetUserId: input.userId, actorUserId: ctx.user.id, role: input.role, eventType: "role_restored" });
          return { success: true, restored: true, alreadyActive: false };
        }
        const created = await db.insert(userRoleAssignments).values({ userId: input.userId, role: input.role, assignedByUserId: ctx.user.id });
        await db.insert(roleAssignmentEvents).values({ roleAssignmentId: Number(created[0].insertId), targetUserId: input.userId, actorUserId: ctx.user.id, role: input.role, eventType: "role_granted" });
        return { success: true, restored: false, alreadyActive: false };
      }),
    revoke: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(DREAMCARZ_ROLES) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Role management is temporarily unavailable." });
        const assignment = (await db.select().from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, input.userId), eq(userRoleAssignments.role, input.role), isNull(userRoleAssignments.revokedAt))).limit(1))[0];
        if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Active role assignment not found." });
        await db.update(userRoleAssignments).set({ revokedAt: new Date() }).where(eq(userRoleAssignments.id, assignment.id));
        await db.insert(roleAssignmentEvents).values({ roleAssignmentId: assignment.id, targetUserId: input.userId, actorUserId: ctx.user.id, role: input.role, eventType: "role_revoked" });
        return { success: true };
      }),
  }),

  driveNetwork: router({
    // Get or auto-create the current user's referral profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      let profile = await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1);
      if (profile.length === 0) {
        const code = `DC${ctx.user.id}${nanoid(6).toUpperCase()}`;
        await db.insert(referralProfiles).values({ userId: ctx.user.id, referralCode: code });
        profile = await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1);
      }
      return profile[0] ?? null;
    }),

    // Get a real, privacy-conscious view of the user's direct referral activity.
    getDownline: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          id: referrals.id,
          userId: referrals.referredId,
          name: users.name,
          email: users.email,
          level: referrals.level,
          status: referrals.status,
          joinedAt: referrals.createdAt,
          rank: referralProfiles.rank,
        })
        .from(referrals)
        .innerJoin(users, eq(referrals.referredId, users.id))
        .leftJoin(referralProfiles, eq(referralProfiles.userId, referrals.referredId))
        .where(eq(referrals.referrerId, ctx.user.id))
        .orderBy(desc(referrals.createdAt));
    }),

    // Get commission history (last 12 months)
    getCommissions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(commissions).where(eq(commissions.userId, ctx.user.id)).orderBy(desc(commissions.createdAt)).limit(12);
    }),

    // Get aggregated stats for the dashboard hero card
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { teamSize: 0, directReferrals: 0, totalEarned: 0, thisMonthTotal: 0, rank: "associate", referralCode: null };
      // Auto-create profile if needed
      let profile = await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1);
      if (profile.length === 0) {
        const code = `DC${ctx.user.id}${nanoid(6).toUpperCase()}`;
        await db.insert(referralProfiles).values({ userId: ctx.user.id, referralCode: code });
        profile = await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1);
      }
      const directReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, ctx.user.id));
      const activeDirectReferrals = directReferrals.filter(referral => referral.status === "active").length;
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthCommissions = await db.select().from(commissions).where(and(eq(commissions.userId, ctx.user.id), eq(commissions.month, thisMonth))).limit(1);
      return {
        teamSize: directReferrals.length,
        directReferrals: directReferrals.length,
        activeDirectReferrals,
        totalEarned: profile[0]?.totalEarned ?? 0,
        thisMonthTotal: monthCommissions[0]?.total ?? 0,
        rank: profile[0]?.rank ?? "associate",
        referralCode: profile[0]?.referralCode ?? null,
      };
    }),

    // Register a referral when a new user signs up via referral link
    registerReferral: protectedProcedure
      .input(z.object({ referralCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const referrerProfile = await db.select().from(referralProfiles).where(eq(referralProfiles.referralCode, input.referralCode)).limit(1);
        if (referrerProfile.length === 0) return { success: false, error: "Invalid referral code" };
        const referrerId = referrerProfile[0].userId;
        if (referrerId === ctx.user.id) return { success: false, error: "Cannot refer yourself" };
        const existing = await db.select().from(referrals).where(eq(referrals.referredId, ctx.user.id)).limit(1);
        if (existing.length > 0) return { success: false, error: "Already referred" };
        await db.insert(referrals).values({ referrerId, referredId: ctx.user.id, level: 1, status: "active" });
        return { success: true };
      }),
  }),

  rentalOnboarding: router({
    getApplication: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { application: null, documents: [] };

      const applications = await db
        .select()
        .from(rentalApplications)
        .where(eq(rentalApplications.userId, ctx.user.id))
        .limit(1);
      const application = applications[0] ?? null;
      if (!application) return { application: null, documents: [] };

      const documents = await db
        .select({
          id: rentalApplicationDocuments.id,
          documentType: rentalApplicationDocuments.documentType,
          originalFilename: rentalApplicationDocuments.originalFilename,
          contentType: rentalApplicationDocuments.contentType,
          reviewStatus: rentalApplicationDocuments.reviewStatus,
          createdAt: rentalApplicationDocuments.createdAt,
        })
        .from(rentalApplicationDocuments)
        .where(eq(rentalApplicationDocuments.applicationId, application.id));

      return { application, documents };
    }),

    saveDraft: protectedProcedure
      .input(
        z.object({
          currentStep: z.number().int().min(1).max(5),
          phone: z.string().max(32).optional(),
          addressLine1: z.string().max(255).optional(),
          city: z.string().max(100).optional(),
          state: z.string().max(64).optional(),
          postalCode: z.string().max(24).optional(),
          dateOfBirth: z.string().max(10).optional(),
          licenseState: z.string().max(64).optional(),
          licenseClass: z.string().max(24).optional(),
          licenseExpiresOn: z.string().max(10).optional(),
          drivingExperience: z.string().max(32).optional(),
          recentClaims: z.string().max(32).optional(),
          preferredVehicleClasses: z.array(z.string().max(48)).max(8).optional(),
          rentalPurpose: z.string().max(64).optional(),
          pickupLocation: z.string().max(255).optional(),
          requestedStartDate: z.string().max(10).optional(),
          requestedEndDate: z.string().max(10).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database is not available");

        const values = {
          currentStep: input.currentStep,
          status: "in_progress" as const,
          phone: input.phone,
          addressLine1: input.addressLine1,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          dateOfBirth: input.dateOfBirth,
          licenseState: input.licenseState,
          licenseClass: input.licenseClass,
          licenseExpiresOn: input.licenseExpiresOn,
          drivingExperience: input.drivingExperience,
          recentClaims: input.recentClaims,
          preferredVehicleClasses: input.preferredVehicleClasses
            ? JSON.stringify(input.preferredVehicleClasses)
            : undefined,
          rentalPurpose: input.rentalPurpose,
          pickupLocation: input.pickupLocation,
          requestedStartDate: input.requestedStartDate,
          requestedEndDate: input.requestedEndDate,
        };

        const existing = await db
          .select({ id: rentalApplications.id })
          .from(rentalApplications)
          .where(eq(rentalApplications.userId, ctx.user.id))
          .limit(1);

        if (existing[0]) {
          await db
            .update(rentalApplications)
            .set(values)
            .where(eq(rentalApplications.id, existing[0].id));
          return { applicationId: existing[0].id };
        }

        const inserted = await db.insert(rentalApplications).values({
          userId: ctx.user.id,
          ...values,
        });
        return { applicationId: Number(inserted[0].insertId) };
      }),

    uploadDocument: protectedProcedure
      .input(
        z.object({
          documentType: z.enum(["license_front", "license_back", "live_selfie"]),
          filename: z.string().min(1).max(120),
          contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
          base64: z.string().min(100).max(8_400_000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database is not available");

        const rawBytes = Buffer.from(input.base64, "base64");
        if (rawBytes.length > 6 * 1024 * 1024) {
          throw new Error("Each document must be 6 MB or smaller");
        }

        let application = await db
          .select()
          .from(rentalApplications)
          .where(eq(rentalApplications.userId, ctx.user.id))
          .limit(1);
        if (!application[0]) {
          await db.insert(rentalApplications).values({
            userId: ctx.user.id,
            status: "in_progress",
            currentStep: 3,
          });
          application = await db
            .select()
            .from(rentalApplications)
            .where(eq(rentalApplications.userId, ctx.user.id))
            .limit(1);
        }
        const applicationId = application[0].id;
        const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
        const { key } = await storagePut(
          `rental-applications/${ctx.user.id}/${input.documentType}_${Date.now()}.${extension}`,
          rawBytes,
          input.contentType,
        );

        await db
          .delete(rentalApplicationDocuments)
          .where(
            and(
              eq(rentalApplicationDocuments.applicationId, applicationId),
              eq(rentalApplicationDocuments.documentType, input.documentType),
            ),
          );
        await db.insert(rentalApplicationDocuments).values({
          applicationId,
          userId: ctx.user.id,
          documentType: input.documentType,
          storageKey: key,
          originalFilename: input.filename,
          contentType: input.contentType,
        });
        await db
          .update(rentalApplications)
          .set({
            currentStep: 3,
            status: "in_progress",
            identityVerificationStatus: "documents_uploaded",
          })
          .where(eq(rentalApplications.id, applicationId));

        return { success: true, documentType: input.documentType };
      }),

    submitApplication: protectedProcedure
      .input(
        z.object({
          identityConsent: z.literal(true),
          rentalTermsConsent: z.literal(true),
        }),
      )
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database is not available");

        const applications = await db
          .select()
          .from(rentalApplications)
          .where(eq(rentalApplications.userId, ctx.user.id))
          .limit(1);
        const application = applications[0];
        if (!application) throw new Error("Complete your rental profile before submitting");

        const missingFields = [
          !application.phone && "mobile number",
          !application.addressLine1 && "home address",
          !application.dateOfBirth && "date of birth",
          !application.licenseState && "license jurisdiction",
          !application.licenseExpiresOn && "license expiration date",
          !application.drivingExperience && "driving experience",
          !application.rentalPurpose && "rental purpose",
          !application.requestedStartDate && "requested start date",
        ].filter(Boolean);
        if (missingFields.length) {
          throw new Error(`Complete your ${missingFields.join(", ")} before submitting`);
        }

        const documents = await db
          .select({ documentType: rentalApplicationDocuments.documentType })
          .from(rentalApplicationDocuments)
          .where(eq(rentalApplicationDocuments.applicationId, application.id));
        const documentTypes = new Set(documents.map(document => document.documentType));
        if (!documentTypes.has("license_front") || !documentTypes.has("live_selfie")) {
          throw new Error("Upload your driver's license and live selfie before submitting");
        }

        await db
          .update(rentalApplications)
          .set({
            status: "under_review",
            currentStep: 5,
            identityVerificationStatus: "pending_review",
            verificationProvider: "manual_review_pending",
            identityConsentAt: new Date(),
            rentalTermsConsentAt: new Date(),
            submittedAt: new Date(),
          })
          .where(eq(rentalApplications.id, application.id));

        return { success: true, status: "under_review" as const };
      }),
  }),

  reservations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(reservationRequests)
        .where(eq(reservationRequests.userId, ctx.user.id))
        .orderBy(desc(reservationRequests.createdAt));
    }),

    create: protectedProcedure
      .input(
        z.object({
          vehicleId: z.number().int().positive(),
          vehicleName: z.string().trim().min(2).max(160),
          vehicleCategory: z.string().trim().min(2).max(48),
          vehicleImage: z.string().trim().min(1).max(512),
          memberTier: z.enum(["freedom", "plus", "pro", "elite"]),
          estimatedWeeklyFee: z.number().int().positive().max(10_000),
          requestedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          pickupLocation: z.string().trim().min(2).max(255),
          dropoffLocation: z.string().trim().max(255).optional(),
          contactPhone: z.string().trim().min(7).max(32),
          notes: z.string().trim().max(2_000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Reservations are temporarily unavailable." });

        if (!hasValidReservationDateRange(input.requestedStartDate, input.requestedEndDate)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Your return date must be after your pickup date." });
        }

        const applications = await db
          .select({ status: rentalApplications.status })
          .from(rentalApplications)
          .where(eq(rentalApplications.userId, ctx.user.id))
          .limit(1);
        const application = applications[0];
        if (!application || application.status !== "approved") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Complete Rental Setup and receive approval before requesting a vehicle.",
          });
        }

        const reference = `DC-${new Date().getFullYear()}-${nanoid(7).toUpperCase()}`;
        await db.insert(reservationRequests).values({
          userId: ctx.user.id,
          reference,
          ...input,
          status: "submitted",
        });
        return { success: true, reference };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Reservations are temporarily unavailable." });
        const requests = await db
          .select()
          .from(reservationRequests)
          .where(and(eq(reservationRequests.id, input.id), eq(reservationRequests.userId, ctx.user.id)))
          .limit(1);
        const request = requests[0];
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Reservation request not found." });
        if (!canMemberCancelReservation(request.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This reservation request can no longer be canceled." });
        }
        await db.update(reservationRequests).set({ status: "canceled" }).where(eq(reservationRequests.id, input.id));
        return { success: true };
      }),
  }),

  transactions: router({
    begin: protectedProcedure
      .input(z.object({
        transactionType: z.enum(["rental", "purchase"]),
        vehicleId: z.string().trim().min(2).max(96),
        membershipPlan: z.enum(TRANSACTION_MEMBERSHIP_PLANS).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transactions are temporarily unavailable." });
        if (!isApprovedTransactionVehicle(input.vehicleId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Select a confirmed DreamCarz inventory vehicle to begin a rental or purchase transaction." });
        }

        const existingTransactions = await db
          .select()
          .from(vehicleTransactions)
          .where(and(
            eq(vehicleTransactions.userId, ctx.user.id),
            eq(vehicleTransactions.transactionType, input.transactionType),
            eq(vehicleTransactions.vehicleId, input.vehicleId),
          ));
        const resumable = existingTransactions.find(transaction => !["completed", "canceled", "declined"].includes(transaction.status));
        if (resumable) return { success: true, resumed: true, reference: resumable.reference, transactionType: resumable.transactionType };

        let profiles = await db
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.userId, ctx.user.id))
          .limit(1);
        if (!profiles[0]) {
          await db.insert(customerProfiles).values({
            userId: ctx.user.id,
            fullName: ctx.user.name ?? null,
            email: ctx.user.email ?? null,
          });
          profiles = await db
            .select()
            .from(customerProfiles)
            .where(eq(customerProfiles.userId, ctx.user.id))
            .limit(1);
        }
        const wallets = await db.select({ id: walletAccounts.id }).from(walletAccounts).where(eq(walletAccounts.userId, ctx.user.id)).limit(1);
        if (!wallets[0]) await db.insert(walletAccounts).values({ userId: ctx.user.id });

        const activeMembershipRows = await db
          .select({ membership: customerMemberships, plan: membershipPlans })
          .from(customerMemberships)
          .innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id))
          .where(and(eq(customerMemberships.userId, ctx.user.id), eq(customerMemberships.status, "active")))
          .orderBy(desc(customerMemberships.updatedAt))
          .limit(1);
        const activeMembership = activeMembershipRows[0] ?? null;
        const activeBenefits = activeMembership
          ? await db.select({ benefitType: membershipBenefits.benefitType, label: membershipBenefits.label, configuration: membershipBenefits.configuration })
            .from(membershipBenefits)
            .where(and(eq(membershipBenefits.membershipPlanId, activeMembership.plan.id), eq(membershipBenefits.isActive, true)))
          : [];
        const membershipEffects = evaluateActiveMembershipBenefits(activeBenefits);
        if (activeMembership && !membershipAllowsVehicle(membershipEffects, input.vehicleId)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Your active membership does not currently include this confirmed vehicle. Please request an eligibility review." });
        }

        const profile = profiles[0];
        const withdrawnConsents = await db
          .select({ id: transactionConsents.id })
          .from(transactionConsents)
          .where(and(eq(transactionConsents.userId, ctx.user.id), isNotNull(transactionConsents.withdrawnAt)));
        const vehicle = APPROVED_TRANSACTION_VEHICLES[input.vehicleId];
        const reference = `${TRANSACTION_REFERENCE_PREFIX[input.transactionType]}-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
        const lifecycle = initialTransactionLifecycle(input.transactionType);
        const profileComplete = Boolean(profile?.fullName && profile.phone && profile.addressLine1 && profile.city && profile.state && profile.postalCode && profile.dateOfBirth);
        const profileVerificationReusable = canReuseProfileVerification({
          identityStatus: profile?.identityStatus,
          licenseStatus: profile?.licenseStatus,
          verificationExpiresAt: profile?.verificationExpiresAt,
          hasWithdrawnConsent: withdrawnConsents.length > 0,
        });
        const initialStatus = profileComplete
          ? withdrawnConsents.length > 0 ? "manual_review" as const : "verification_pending" as const
          : lifecycle.status;
        const created = await db.insert(vehicleTransactions).values({
          reference,
          userId: ctx.user.id,
          transactionType: input.transactionType,
          vehicleId: input.vehicleId,
          vehicleName: vehicle.vehicleName,
          vehicleImage: vehicle.image,
          membershipPlan: activeMembership?.plan.code ?? input.membershipPlan ?? null,
          ...lifecycle,
          status: initialStatus,
          currentStep: input.transactionType === "rental" ? "dates" : profileComplete ? "identity" : lifecycle.currentStep,
          contactName: profile?.fullName ?? ctx.user.name ?? null,
          contactEmail: profile?.email ?? ctx.user.email ?? null,
          contactPhone: profile?.phone ?? null,
          addressLine1: profile?.addressLine1 ?? null,
          addressLine2: profile?.addressLine2 ?? null,
          city: profile?.city ?? null,
          state: profile?.state ?? null,
          postalCode: profile?.postalCode ?? null,
          identityStatus: profileVerificationReusable ? "verified" : withdrawnConsents.length > 0 ? "manual_review" : "not_started",
          licenseStatus: profileVerificationReusable ? "verified" : withdrawnConsents.length > 0 ? "manual_review" : "not_started",
        });
        const transactionId = Number(created[0].insertId);
        await db.insert(transactionEligibilityAssessments).values({
          transactionId,
          status: "pending",
          ruleSnapshot: JSON.stringify({ version: "dreamcarz-eligibility-v2", requiresManualReview: true, transactionType: input.transactionType, vehicleId: input.vehicleId, activeMembershipPlan: activeMembership?.plan.code ?? null, membershipEffects }),
        });
        await db.insert(transactionEvents).values({
          transactionId,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "transaction.initiated",
          toStatus: initialStatus,
          metadata: JSON.stringify({ vehicleId: input.vehicleId, transactionType: input.transactionType, membershipPlan: activeMembership?.plan.code ?? input.membershipPlan ?? null, membershipEffects, profileVerificationReused: profileVerificationReusable, manualReviewRequired: withdrawnConsents.length > 0 }),
        });
        const referral = (await db.select({ id: referrals.id, referrerId: referrals.referrerId, status: referrals.status }).from(referrals).where(eq(referrals.referredId, ctx.user.id)).limit(1))[0];
        if (referral) {
          await db.insert(referralConversionEvents).values({ referralId: referral.id, referrerUserId: referral.referrerId, referredUserId: ctx.user.id, eventType: input.transactionType === "rental" ? "rental_started" : "purchase_started", sourceTransactionId: transactionId });
          if (referral.status === "pending") await db.update(referrals).set({ status: "active" }).where(eq(referrals.id, referral.id));
        }
        return { success: true, resumed: false, reference, transactionType: input.transactionType };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select({
          reference: vehicleTransactions.reference,
          transactionType: vehicleTransactions.transactionType,
          vehicleId: vehicleTransactions.vehicleId,
          vehicleName: vehicleTransactions.vehicleName,
          vehicleImage: vehicleTransactions.vehicleImage,
          membershipPlan: vehicleTransactions.membershipPlan,
          status: vehicleTransactions.status,
          currentStep: vehicleTransactions.currentStep,
          identityStatus: vehicleTransactions.identityStatus,
          licenseStatus: vehicleTransactions.licenseStatus,
          eligibilityStatus: vehicleTransactions.eligibilityStatus,
          insuranceStatus: vehicleTransactions.insuranceStatus,
          paymentStatus: vehicleTransactions.paymentStatus,
          agreementStatus: vehicleTransactions.agreementStatus,
          conditionStatus: vehicleTransactions.conditionStatus,
          pickupStatus: vehicleTransactions.pickupStatus,
          activeRentalStatus: vehicleTransactions.activeRentalStatus,
          returnStatus: vehicleTransactions.returnStatus,
          settlementStatus: vehicleTransactions.settlementStatus,
          deliveryStatus: vehicleTransactions.deliveryStatus,
          requestedStartDate: vehicleTransactions.requestedStartDate,
          requestedEndDate: vehicleTransactions.requestedEndDate,
          pickupLocation: vehicleTransactions.pickupLocation,
          createdAt: vehicleTransactions.createdAt,
          updatedAt: vehicleTransactions.updatedAt,
        })
        .from(vehicleTransactions)
        .where(eq(vehicleTransactions.userId, ctx.user.id))
        .orderBy(desc(vehicleTransactions.updatedAt));
    }),

    activeRentalSummary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const rental = (await db.select({
        id: vehicleTransactions.id,
        reference: vehicleTransactions.reference,
        vehicleId: vehicleTransactions.vehicleId,
        vehicleName: vehicleTransactions.vehicleName,
        vehicleImage: vehicleTransactions.vehicleImage,
        status: vehicleTransactions.status,
        paymentStatus: vehicleTransactions.paymentStatus,
        agreementStatus: vehicleTransactions.agreementStatus,
        conditionStatus: vehicleTransactions.conditionStatus,
        pickupStatus: vehicleTransactions.pickupStatus,
        activeRentalStatus: vehicleTransactions.activeRentalStatus,
        returnStatus: vehicleTransactions.returnStatus,
        settlementStatus: vehicleTransactions.settlementStatus,
      }).from(vehicleTransactions).where(and(
        eq(vehicleTransactions.userId, ctx.user.id),
        eq(vehicleTransactions.transactionType, "rental"),
        eq(vehicleTransactions.status, "active_rental"),
      )).orderBy(desc(vehicleTransactions.updatedAt)).limit(1))[0];
      if (!rental) return null;

      const [schedule, agreement, conditionReports, settlement] = await Promise.all([
        db.select({
          requestedStartAt: transactionSchedules.requestedStartAt,
          requestedEndAt: transactionSchedules.requestedEndAt,
          pickupMethod: transactionSchedules.pickupMethod,
          pickupLocation: transactionSchedules.pickupLocation,
          scheduledHandoffAt: transactionSchedules.scheduledHandoffAt,
          estimatedArrivalAt: transactionSchedules.estimatedArrivalAt,
          handoffStatus: transactionSchedules.handoffStatus,
        }).from(transactionSchedules).where(eq(transactionSchedules.transactionId, rental.id)).limit(1),
        db.select({
          status: transactionAgreements.status,
          version: transactionAgreements.version,
          signedAt: transactionAgreements.signedAt,
        }).from(transactionAgreements).where(eq(transactionAgreements.transactionId, rental.id)).orderBy(desc(transactionAgreements.updatedAt)).limit(1),
        db.select({
          stage: vehicleConditionReports.stage,
          status: vehicleConditionReports.status,
          updatedAt: vehicleConditionReports.updatedAt,
        }).from(vehicleConditionReports).where(eq(vehicleConditionReports.transactionId, rental.id)).orderBy(desc(vehicleConditionReports.updatedAt)),
        db.select({
          status: transactionSettlements.status,
          updatedAt: transactionSettlements.updatedAt,
        }).from(transactionSettlements).where(eq(transactionSettlements.transactionId, rental.id)).limit(1),
      ]);

      const safeSchedule = schedule[0] ? {
        requestedStartAt: schedule[0].requestedStartAt,
        requestedEndAt: schedule[0].requestedEndAt,
        pickupMethod: schedule[0].pickupMethod,
        pickupLocation: schedule[0].pickupLocation,
        scheduledHandoffAt: schedule[0].scheduledHandoffAt,
        estimatedArrivalAt: schedule[0].estimatedArrivalAt,
        handoffStatus: schedule[0].handoffStatus,
      } : null;
      const safeAgreement = agreement[0] ? {
        status: agreement[0].status,
        version: agreement[0].version,
        signedAt: agreement[0].signedAt,
      } : null;
      const conditionForStage = (stage: "pickup" | "return") => {
        const condition = conditionReports.find(report => report.stage === stage);
        return condition ? { stage: condition.stage, status: condition.status, updatedAt: condition.updatedAt } : null;
      };
      const safeSettlement = settlement[0] ? { status: settlement[0].status, updatedAt: settlement[0].updatedAt } : null;
      const pickupCondition = conditionForStage("pickup");
      const returnCondition = conditionForStage("return");
      return {
        reference: rental.reference,
        vehicle: { id: rental.vehicleId, name: rental.vehicleName, image: rental.vehicleImage },
        lifecycle: {
          status: rental.status,
          activeRentalStatus: rental.activeRentalStatus,
          paymentStatus: rental.paymentStatus,
          agreementStatus: safeAgreement?.status ?? rental.agreementStatus,
          pickupStatus: rental.pickupStatus,
          returnStatus: rental.returnStatus,
          settlementStatus: safeSettlement?.status ?? rental.settlementStatus,
        },
        schedule: safeSchedule,
        agreement: safeAgreement,
        condition: { pickup: pickupCondition, return: returnCondition, overallStatus: rental.conditionStatus },
        settlement: safeSettlement,
      };
    }),

    getSettlementStatement: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .query(async ({ ctx, input }) => {
        const statementLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "settlement_statement_read", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!statementLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many settlement statement requests. Please try again later." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settlement records are temporarily unavailable." });
        const transaction = (await db.select({
          id: vehicleTransactions.id,
          reference: vehicleTransactions.reference,
          transactionType: vehicleTransactions.transactionType,
          vehicleName: vehicleTransactions.vehicleName,
          status: vehicleTransactions.status,
          returnStatus: vehicleTransactions.returnStatus,
          settlementStatus: vehicleTransactions.settlementStatus,
        }).from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "NOT_FOUND", message: "Rental transaction not found." });

        const settlement = (await db.select({
          id: transactionSettlements.id,
          status: transactionSettlements.status,
          currency: transactionSettlements.currency,
          approvedSubtotalCents: transactionSettlements.approvedSubtotalCents,
          depositAppliedCents: transactionSettlements.depositAppliedCents,
          adjustmentsCents: transactionSettlements.adjustmentsCents,
          finalAmountCents: transactionSettlements.finalAmountCents,
          summary: transactionSettlements.summary,
          settledAt: transactionSettlements.settledAt,
          updatedAt: transactionSettlements.updatedAt,
        }).from(transactionSettlements).where(eq(transactionSettlements.transactionId, transaction.id)).limit(1))[0];
        const safeTransaction = {
          reference: transaction.reference,
          vehicleName: transaction.vehicleName,
          status: transaction.status,
          returnStatus: transaction.returnStatus,
          settlementStatus: transaction.settlementStatus,
        };
        if (!settlement) return { transaction: safeTransaction, statement: null };

        const isFinalized = settlement.status === "settled" || settlement.status === "disputed" || settlement.status === "waived";
        if (!isFinalized) {
          return { transaction: safeTransaction, statement: { status: settlement.status, updatedAt: settlement.updatedAt, isFinalized: false as const } };
        }
        const adjustments = await db.select({
          adjustmentType: transactionAdjustments.adjustmentType,
          status: transactionAdjustments.status,
          amountCents: transactionAdjustments.amountCents,
          description: transactionAdjustments.description,
          reviewedAt: transactionAdjustments.reviewedAt,
        }).from(transactionAdjustments).where(and(
          eq(transactionAdjustments.settlementId, settlement.id),
          inArray(transactionAdjustments.status, ["approved", "disputed"]),
        )).orderBy(desc(transactionAdjustments.createdAt));

        return {
          transaction: safeTransaction,
          statement: {
            status: settlement.status,
            currency: settlement.currency,
            approvedSubtotalCents: settlement.approvedSubtotalCents,
            depositAppliedCents: settlement.depositAppliedCents,
            adjustmentsCents: settlement.adjustmentsCents,
            finalAmountCents: settlement.finalAmountCents,
            summary: settlement.summary,
            settledAt: settlement.settledAt,
            updatedAt: settlement.updatedAt,
            isFinalized: true as const,
            adjustments: adjustments.map(item => ({
              adjustmentType: item.adjustmentType,
              status: item.status,
              amountCents: item.amountCents,
              description: item.description,
              reviewedAt: item.reviewedAt,
            })),
          },
        };
      }),

    confirmHandoff: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        acknowledgesHandoff: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const handoffLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "transaction_handoff_confirmation", String(ctx.user.id)), limit: 4, windowMs: 30 * 60 * 1000 });
        if (!handoffLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many handoff confirmations. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Handoff confirmation is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "NOT_FOUND", message: "Rental transaction not found." });
        if (transaction.status !== "ready_for_pickup" || !hasVehicleReleaseReadiness(transaction)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DreamCarz must complete vehicle release before you can confirm this handoff." });
        }
        if (!hasFutureRecordedInsuranceCoverage(transaction.insuranceDetails)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A future recorded insurance coverage date is required before handoff confirmation." });
        }
        if (!await hasReviewedRentalAdditionalDrivers(db, transaction.id)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Any added driver must complete separate identity and license review before handoff confirmation." });
        }
        const schedule = (await db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1))[0];
        if (!schedule || schedule.handoffStatus !== "arrived") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This handoff can be confirmed only after DreamCarz marks the pickup or delivery as arrived." });
        }
        await db.update(transactionSchedules).set({ handoffStatus: "customer_verified" }).where(eq(transactionSchedules.id, schedule.id));
        await db.update(vehicleTransactions).set({ pickupStatus: "verified" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "handoff.customer_verified",
          fromStatus: schedule.handoffStatus,
          toStatus: "customer_verified",
          metadata: JSON.stringify({ pickupMethod: schedule.pickupMethod, rentalStatusChanged: false }),
        });
        return { success: true, handoffStatus: "customer_verified" as const, pickupStatus: "verified" as const };
      }),

    saveRentalSchedule: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        requestedStartAt: z.coerce.date(),
        requestedEndAt: z.coerce.date(),
        pickupMethod: z.enum(["pickup", "delivery"]),
        pickupLocation: z.string().trim().min(2).max(255).optional(),
        deliveryAddress: z.string().trim().min(8).max(1_000).optional(),
        customerNotes: z.string().trim().max(1_000).optional(),
      }).superRefine((value, context) => {
        if (value.requestedEndAt <= value.requestedStartAt) context.addIssue({ code: z.ZodIssueCode.custom, path: ["requestedEndAt"], message: "Return time must be after pickup time." });
        if (value.pickupMethod === "pickup" && !value.pickupLocation) context.addIssue({ code: z.ZodIssueCode.custom, path: ["pickupLocation"], message: "Select a DreamCarz pickup location." });
        if (value.pickupMethod === "delivery" && !value.deliveryAddress) context.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryAddress"], message: "Provide the requested delivery address." });
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.customerNotes) assertSafeRestrictedContent(input.customerNotes, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Rental scheduling is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Rental dates are available only for rental transactions." });
        if (transaction.currentStep !== "dates") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Rental dates can be updated when the saved transaction is at the dates stage." });
        const values = { requestedStartAt: input.requestedStartAt, requestedEndAt: input.requestedEndAt, pickupMethod: input.pickupMethod, pickupLocation: input.pickupMethod === "pickup" ? input.pickupLocation ?? null : null, deliveryAddress: input.pickupMethod === "delivery" ? input.deliveryAddress ?? null : null, customerNotes: input.customerNotes ?? null };
        const existing = (await db.select({ id: transactionSchedules.id }).from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1))[0];
        if (existing) await db.update(transactionSchedules).set(values).where(eq(transactionSchedules.id, existing.id));
        else await db.insert(transactionSchedules).values({ transactionId: transaction.id, ...values });
        await db.update(vehicleTransactions).set({ currentStep: "profile", status: "profile_incomplete" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "rental.schedule_saved", fromStatus: transaction.status, toStatus: "profile_incomplete", metadata: JSON.stringify({ pickupMethod: input.pickupMethod, requestedStartAt: input.requestedStartAt.toISOString(), requestedEndAt: input.requestedEndAt.toISOString() }) });
        return { success: true, nextStep: "profile" as const };
      }),

    identityProviderStatus: protectedProcedure.query(() => getIdentityProviderStatus()),

    awsFaceLivenessStatus: protectedProcedure.query(() => getAwsFaceLivenessStatus()),

    requestAwsFaceLivenessBrowserCredentials: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const credentialLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "aws_face_liveness_browser_credentials", String(ctx.user.id)), limit: 3, windowMs: 15 * 60_000 });
        if (!credentialLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many identity-verification requests. Please use the manual review path or try again later." });

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Identity verification is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "identity") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete the saved profile steps before starting identity verification." });
        if (transaction.identityProvider !== "aws_face_liveness" || !transaction.identitySessionId || transaction.identityStatus !== "pending") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A pending DreamCarz Face Liveness session is required before temporary browser credentials can be issued." });
        }

        const provider = getAwsFaceLivenessStatus();
        if (!provider.configured) return { granted: false as const, provider };

        const activeConsents = await db.select({ consentType: transactionConsents.consentType })
          .from(transactionConsents)
          .where(and(
            eq(transactionConsents.transactionId, transaction.id),
            eq(transactionConsents.userId, ctx.user.id),
            isNull(transactionConsents.withdrawnAt),
            inArray(transactionConsents.consentType, ["identity_document", "identity_biometric"]),
          ));
        const consentTypes = new Set(activeConsents.map(consent => consent.consentType));
        if (!consentTypes.has("identity_document") || !consentTypes.has("identity_biometric")) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Active document and biometric consent are required before temporary browser credentials can be issued." });
        }
        const credentials = await createAwsFaceLivenessBrowserCredentials();
        if (!credentials.configured) return { granted: false as const, provider: credentials.provider };

        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "identity.aws_liveness_browser_credentials_issued",
          metadata: JSON.stringify({ provider: "aws_face_liveness", credentialScope: "start_face_liveness_only", temporary: true }),
        });
        return { granted: true as const, provider: credentials.provider, sessionId: transaction.identitySessionId, credentials: credentials.credentials };
      }),

    startAwsFaceLiveness: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        identityDocumentConsent: z.literal(true),
        biometricConsent: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Identity verification is temporarily unavailable." });
        if (!consumeRateLimit({ key: rateLimitKey(ctx.req, "aws-face-liveness-start", String(ctx.user.id)), limit: 3, windowMs: 15 * 60_000 }).allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many identity-session requests. Please use the manual review path or try again later." });
        }
        const transaction = (await db.select().from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "identity") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete the saved profile steps before starting identity verification." });

        const provider = getAwsFaceLivenessStatus();
        if (!provider.configured) return { started: false as const, provider };
        await db.insert(transactionConsents).values([
          { transactionId: transaction.id, userId: ctx.user.id, consentType: "identity_document", policyVersion: "aws-face-liveness-v1", source: "aws_face_liveness" },
          { transactionId: transaction.id, userId: ctx.user.id, consentType: "identity_biometric", policyVersion: "aws-face-liveness-v1", source: "aws_face_liveness" },
        ]);
        const session = await createAwsFaceLivenessSession({ clientRequestToken: nanoid(32) });
        if (!session.configured) return { started: false as const, provider: session.provider };
        await db.update(vehicleTransactions).set({
          status: "verification_pending",
          identityStatus: "pending",
          licenseStatus: "pending",
          identityProvider: "aws_face_liveness",
          identitySessionId: session.sessionId,
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.update(customerProfiles).set({
          profileStatus: "ready_for_verification",
          identityStatus: "pending",
          licenseStatus: "pending",
          identityProvider: "aws_face_liveness",
          identityProviderSessionId: session.sessionId,
        }).where(eq(customerProfiles.userId, ctx.user.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "identity.aws_liveness_session_created",
          fromStatus: transaction.status,
          toStatus: "verification_pending",
          metadata: JSON.stringify({ provider: "aws_face_liveness" }),
        });
        return { started: true as const, provider: session.provider, sessionId: session.sessionId };
      }),

    checkAwsFaceLiveness: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Identity verification is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction || transaction.identityProvider !== "aws_face_liveness" || !transaction.identitySessionId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "An AWS Face Liveness session is not available for this transaction." });
        }
        const result = await getAwsFaceLivenessResult(transaction.identitySessionId);
        if (!result.configured) return { configured: false as const, provider: result.provider, completed: false };
        const completed = result.status === "SUCCEEDED";
        const alreadyRoutedToManualReview = transaction.status === "manual_review" && transaction.identityStatus === "manual_review";
        if (completed && !alreadyRoutedToManualReview) {
          await db.update(vehicleTransactions).set({
            status: "manual_review",
            identityStatus: "manual_review",
          }).where(eq(vehicleTransactions.id, transaction.id));
          await db.update(customerProfiles).set({
            profileStatus: "manual_review",
            identityStatus: "manual_review",
          }).where(eq(customerProfiles.userId, ctx.user.id));
          await db.insert(transactionEvents).values({
            transactionId: transaction.id,
            actorUserId: ctx.user.id,
            actorType: "customer",
            eventType: "identity.aws_liveness_completed",
            fromStatus: transaction.status,
            toStatus: "manual_review",
            metadata: JSON.stringify({ provider: "aws_face_liveness", manualReviewRequired: true }),
          });
        }
        return { configured: true as const, provider: result.provider, completed };
      }),

    reconcileAwsFaceLivenessManualReview: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const reconciliationLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "aws_face_liveness_manual_review_reconcile", String(ctx.user.id)), limit: 3, windowMs: 15 * 60_000 });
        if (!reconciliationLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many identity-review reconciliation requests. Please try again later." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Identity verification is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(
          eq(vehicleTransactions.reference, input.reference),
          eq(vehicleTransactions.userId, ctx.user.id),
        )).limit(1))[0];
        if (!transaction || transaction.identityProvider !== "aws_face_liveness" || !transaction.identitySessionId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "An AWS Face Liveness session is not available for this transaction." });
        }
        const completedEvent = (await db.select({ id: transactionEvents.id }).from(transactionEvents).where(and(
          eq(transactionEvents.transactionId, transaction.id),
          eq(transactionEvents.eventType, "identity.aws_liveness_completed"),
        )).limit(1))[0];
        if (!completedEvent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A completed Face Liveness review event is required before reconciliation." });
        if (transaction.status === "manual_review" && transaction.identityStatus === "manual_review") return { reconciled: false as const, status: "manual_review" as const };

        await db.update(vehicleTransactions).set({ status: "manual_review", identityStatus: "manual_review" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.update(customerProfiles).set({ profileStatus: "manual_review", identityStatus: "manual_review" }).where(eq(customerProfiles.userId, ctx.user.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "system",
          eventType: "identity.aws_liveness_manual_review_reconciled",
          fromStatus: transaction.status,
          toStatus: "manual_review",
          metadata: JSON.stringify({ provider: "aws_face_liveness", source: "existing_completion_audit", manualReviewRequired: true }),
        });
        return { reconciled: true as const, status: "manual_review" as const };
      }),

    startIdentityVerification: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        identityDocumentConsent: z.literal(true),
        biometricConsent: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Identity verification is temporarily unavailable." });
        const transactions = await db.select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "identity") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete the saved profile steps before starting identity verification." });
        }
        const returnUrl = process.env.STRIPE_IDENTITY_RETURN_URL;
        const provider = getIdentityProviderStatus();
        if (!provider.configured || !returnUrl) return { started: false as const, provider };
        const session = await createStripeIdentityVerificationSession({
          transactionReference: transaction.reference,
          userId: ctx.user.id,
          returnUrl: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}ref=${encodeURIComponent(transaction.reference)}`,
        });
        if (!session.configured) return { started: false as const, provider: session.provider };
        await db.insert(transactionConsents).values([
          { transactionId: transaction.id, userId: ctx.user.id, consentType: "identity_document", policyVersion: "transaction-identity-v1", source: "stripe_identity" },
          { transactionId: transaction.id, userId: ctx.user.id, consentType: "identity_biometric", policyVersion: "transaction-identity-v1", source: "stripe_identity" },
        ]);
        await db.update(vehicleTransactions).set({
          status: "verification_pending",
          currentStep: "identity",
          identityStatus: "pending",
          licenseStatus: "pending",
          identityProvider: "stripe_identity",
          identitySessionId: session.sessionId,
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.update(customerProfiles).set({
          profileStatus: "ready_for_verification",
          identityStatus: "pending",
          licenseStatus: "pending",
          identityProvider: "stripe_identity",
          identityProviderSessionId: session.sessionId,
        }).where(eq(customerProfiles.userId, ctx.user.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "identity.provider_session_created",
          fromStatus: transaction.status,
          toStatus: "verification_pending",
          metadata: JSON.stringify({ provider: "stripe_identity", sessionId: session.sessionId }),
        });
        return { started: true as const, clientSecret: session.clientSecret, provider: session.provider };
      }),

    paymentProviderStatus: protectedProcedure.query(() => getPaymentProviderStatus()),

    startPaymentMethodSetup: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), futurePaymentConsent: z.literal(true) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment setup is temporarily unavailable." });
        const transactions = await db.select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "payment") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DreamCarz must complete the preceding transaction review before collecting a payment method." });
        }
        if (!transaction.cocardProductSku) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DreamCarz must attach an approved CoCard Product Manager SKU before hosted checkout can begin." });
        }
        const provider = getPaymentProviderStatus();
        const blocker = cocardPaymentSetupBlocker();
        if (blocker || !provider.checkoutKey) return { started: false as const, provider, message: blocker ?? "CoCard checkout is not configured." };
        const checkoutAttemptToken = nanoid(40);
        await db.insert(transactionConsents).values({ transactionId: transaction.id, userId: ctx.user.id, consentType: "payment_authorization", policyVersion: "cocard-collect-checkout-v1", source: "cocard_collect_checkout" });
        await db.update(vehicleTransactions).set({ paymentProvider: "cocard_gateway", paymentStatus: "pending", cocardCheckoutAttemptToken: checkoutAttemptToken, cocardCheckoutAttemptedAt: new Date() }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "payment.cocard_checkout_requested", metadata: JSON.stringify({ provider: "cocard_gateway", productSku: transaction.cocardProductSku, checkoutAttemptIssued: true }) });
        return { started: true as const, provider, checkoutKey: provider.checkoutKey, productSku: transaction.cocardProductSku, reference: transaction.reference, checkoutAttemptToken };
      }),

    recordCoCardCheckoutReturn: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), checkoutAttemptToken: z.string().trim().min(24).max(96).regex(/^[A-Za-z0-9_-]+$/, "Use the secure checkout-attempt reference returned by DreamCarz."), gatewayTransactionId: z.string().trim().min(4).max(160).regex(/^[A-Za-z0-9._-]+$/, "Use the gateway transaction identifier returned by CoCard."), customerVaultId: z.string().trim().min(2).max(160).regex(/^[A-Za-z0-9._-]+$/, "Use the gateway customer-vault identifier returned by CoCard.").optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payment reconciliation is temporarily unavailable." });
        const transactions = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "payment") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This transaction is not awaiting a payment authorization." });
        if (!transaction.cocardCheckoutAttemptToken || transaction.cocardCheckoutAttemptToken !== input.checkoutAttemptToken) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This CoCard checkout return does not match the current DreamCarz payment attempt." });
        }
        if (transaction.paymentProviderTransactionId && transaction.paymentProviderTransactionId !== input.gatewayTransactionId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A different CoCard transaction is already associated with this request. DreamCarz must review it manually." });
        }
        const reusedGatewayTransaction = await db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(eq(vehicleTransactions.paymentProviderTransactionId, input.gatewayTransactionId)).limit(1);
        if (reusedGatewayTransaction[0] && reusedGatewayTransaction[0].id !== transaction.id) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This CoCard transaction is already associated with another DreamCarz request and requires manual review." });
        }
        const providerEventId = `cocard:return:${transaction.id}:${input.gatewayTransactionId}`;
        const duplicate = await db.select({ id: transactionEvents.id }).from(transactionEvents).where(eq(transactionEvents.providerEventId, providerEventId)).limit(1);
        if (duplicate[0]) return { recorded: true as const, duplicate: true as const, paymentStatus: transaction.paymentStatus };
        const verification = await verifyCoCardCheckoutReturn(input.gatewayTransactionId);
        if (!verification.verified) {
          await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "payment.cocard_checkout_return_verification_pending", fromStatus: transaction.status, toStatus: transaction.status, providerEventId, metadata: JSON.stringify({ provider: "cocard_gateway", gatewayTransactionId: input.gatewayTransactionId }) });
          return { recorded: false as const, duplicate: false as const, paymentStatus: "pending" as const, verificationPending: true as const };
        }
        const nextStatus = verification.paymentStatus === "authorized" || verification.paymentStatus === "paid" ? "agreement_pending" as const : "payment_pending" as const;
        await db.update(vehicleTransactions).set({
          paymentProvider: "cocard_gateway",
          paymentProviderTransactionId: verification.gatewayTransactionId,
          paymentProviderAuthorizationId: verification.authorizationCode || null,
          paymentProviderCustomerVaultId: verification.customerVaultId || null,
          paymentStatus: verification.paymentStatus,
          status: nextStatus,
          currentStep: verification.paymentStatus === "authorized" || verification.paymentStatus === "paid" ? "review" : "payment",
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "payment.cocard_checkout_return_verified", fromStatus: transaction.status, toStatus: nextStatus, providerEventId, metadata: JSON.stringify({ provider: "cocard_gateway", gatewayTransactionId: verification.gatewayTransactionId, paymentStatus: verification.paymentStatus, customerVaultVerified: Boolean(verification.customerVaultId) }) });
        return { recorded: true as const, duplicate: false as const, paymentStatus: verification.paymentStatus, verificationPending: false as const };
      }),

    activeTransactions: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(vehicleTransactions)
        .where(and(eq(vehicleTransactions.userId, ctx.user.id), inArray(vehicleTransactions.status, ["ready_for_pickup", "active_rental", "return_pending", "settlement_pending"])))
        .orderBy(desc(vehicleTransactions.updatedAt));
    }),

    requestRentalExtension: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        note: z.string().trim().max(1_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const extensionLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "rental_extension_request", String(ctx.user.id)), limit: 4, windowMs: 12 * 60 * 60 * 1000 });
        if (!extensionLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many extension requests. Please wait before trying again." });
        if (input.note) assertSafeRestrictedContent(input.note, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Extension requests are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "rental" || transaction.status !== "active_rental") {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An extension can be requested only for an active rental." });
        }
        const schedule = (await db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1))[0];
        if (!schedule?.requestedEndAt || Date.parse(`${input.requestedEndDate}T12:00:00Z`) <= schedule.requestedEndAt.getTime()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an extension date after the currently requested rental end date." });
        }
        const existing = (await db.select({ id: rentalExtensionRequests.id }).from(rentalExtensionRequests)
          .where(and(eq(rentalExtensionRequests.transactionId, transaction.id), eq(rentalExtensionRequests.status, "pending")))
          .limit(1))[0];
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "DreamCarz already has a pending extension request for this rental." });
        const inserted = await db.insert(rentalExtensionRequests).values({
          transactionId: transaction.id,
          userId: ctx.user.id,
          requestedEndDate: input.requestedEndDate,
          customerNote: input.note ?? null,
        });
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "rental.extension_requested",
          fromStatus: transaction.status,
          toStatus: transaction.status,
          metadata: JSON.stringify({ extensionRequestId: Number(inserted[0].insertId), requestedEndDate: input.requestedEndDate, hasCustomerNote: Boolean(input.note) }),
        });
        return { success: true, extensionRequestId: Number(inserted[0].insertId), requestedEndDate: input.requestedEndDate };
      }),

    uploadConditionEvidence: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        stage: z.enum(["pickup", "return"]),
        view: z.enum(["front", "rear", "driver_side", "passenger_side", "interior", "odometer"]),
        filename: z.string().trim().min(1).max(120),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(100).max(8_400_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const evidenceLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "condition_evidence_upload", String(ctx.user.id)), limit: 18, windowMs: 60 * 60 * 1000 });
        if (!evidenceLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many condition image uploads. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Condition evidence storage is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Vehicle condition evidence is available only for rental transactions." });
        const pickupAllowed = input.stage === "pickup" && transaction.status === "ready_for_pickup";
        const returnAllowed = input.stage === "return" && ["active_rental", "return_pending"].includes(transaction.status);
        if (!pickupAllowed && !returnAllowed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Condition evidence is not available at the current rental lifecycle stage." });
        const rawBytes = Buffer.from(input.base64, "base64");
        if (rawBytes.length > 6 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Each condition image must be 6 MB or smaller." });
        const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
        const { key } = await storagePut(`transaction-documents/${ctx.user.id}/${transaction.id}/condition_${input.stage}_${input.view}_${Date.now()}.${extension}`, rawBytes, input.contentType);
        const inserted = await db.insert(transactionDocuments).values({
          transactionId: transaction.id,
          userId: ctx.user.id,
          documentType: "condition_photo",
          conditionStage: input.stage,
          conditionEvidenceView: input.view,
          storageKey: key,
          originalFilename: input.filename,
          contentType: input.contentType,
          status: "pending",
        });
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "condition.evidence_uploaded", fromStatus: transaction.status, toStatus: transaction.status, metadata: JSON.stringify({ stage: input.stage, view: input.view, documentId: Number(inserted[0].insertId) }) });
        return { success: true, documentId: Number(inserted[0].insertId) };
      }),

    submitConditionReport: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        stage: z.enum(["pickup", "return"]),
        odometerReading: z.number().int().min(0).max(2_000_000).optional(),
        fuelLevel: z.string().trim().max(32).optional(),
        notes: z.string().trim().max(2_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.notes) assertSafeRestrictedContent(input.notes, "condition report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle condition reporting is temporarily unavailable." });
        const transactions = await db.select().from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Condition reporting is available only for rental transactions." });
        const pickupAllowed = input.stage === "pickup" && transaction.status === "ready_for_pickup";
        const returnAllowed = input.stage === "return" && ["active_rental", "return_pending"].includes(transaction.status);
        if (!pickupAllowed && !returnAllowed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This condition report is not available at the current rental lifecycle stage." });
        const requiredEvidenceViews = ["front", "rear", "driver_side", "passenger_side", "interior", "odometer"] as const;
        const evidence = await db.select({ id: transactionDocuments.id, view: transactionDocuments.conditionEvidenceView, storageKey: transactionDocuments.storageKey })
          .from(transactionDocuments)
          .where(and(eq(transactionDocuments.transactionId, transaction.id), eq(transactionDocuments.documentType, "condition_photo"), eq(transactionDocuments.conditionStage, input.stage)));
        const submittedViews = new Set(evidence.map(record => record.view).filter((view): view is typeof requiredEvidenceViews[number] => Boolean(view)));
        const missingViews = requiredEvidenceViews.filter(view => !submittedViews.has(view));
        if (missingViews.length > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Add the required ${missingViews.map(view => view.replace("_", " ")).join(", ")} condition photo view${missingViews.length === 1 ? "" : "s"} before submitting this report.` });
        await db.insert(vehicleConditionReports).values({
          transactionId: transaction.id,
          stage: input.stage,
          completedByUserId: ctx.user.id,
          odometerReading: input.odometerReading,
          fuelLevel: input.fuelLevel,
          notes: input.notes,
          photoKeys: JSON.stringify(evidence.map(record => record.storageKey)),
          status: "submitted",
        });
        const isReturn = input.stage === "return";
        await db.update(vehicleTransactions).set({
          status: isReturn && transaction.status === "active_rental" ? "return_pending" : transaction.status,
          currentStep: isReturn ? "return" : transaction.currentStep,
          conditionStatus: isReturn ? "return_complete" : "pickup_complete",
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: `condition.${input.stage}_report_submitted`,
          fromStatus: transaction.status,
          toStatus: isReturn && transaction.status === "active_rental" ? "return_pending" : transaction.status,
          metadata: JSON.stringify({ stage: input.stage, hasOdometerReading: input.odometerReading !== undefined, hasFuelLevel: Boolean(input.fuelLevel), hasNotes: Boolean(input.notes), evidenceViewCount: submittedViews.size }),
        });
        return { success: true };
      }),

    backOffice: protectedProcedure.query(async ({ ctx }) => {
      const backOfficeLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "dreamcarz_id_back_office_read", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
      if (!backOfficeLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many private record requests. Please try again later." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Back-office records are temporarily unavailable." });
      const [profiles, legacyLicenseDocuments, transactionLicenseDocuments, insuranceDocuments, agreements] = await Promise.all([
        db.select().from(customerProfiles).where(eq(customerProfiles.userId, ctx.user.id)).limit(1),
        db.select({
          id: rentalApplicationDocuments.id,
          documentType: rentalApplicationDocuments.documentType,
          originalFilename: rentalApplicationDocuments.originalFilename,
          contentType: rentalApplicationDocuments.contentType,
          reviewStatus: rentalApplicationDocuments.reviewStatus,
          createdAt: rentalApplicationDocuments.createdAt,
        }).from(rentalApplicationDocuments).where(eq(rentalApplicationDocuments.userId, ctx.user.id)).orderBy(desc(rentalApplicationDocuments.createdAt)),
        db.select({
          id: transactionDocuments.id,
          documentType: transactionDocuments.documentType,
          originalFilename: transactionDocuments.originalFilename,
          contentType: transactionDocuments.contentType,
          reviewStatus: transactionDocuments.status,
          createdAt: transactionDocuments.createdAt,
        }).from(transactionDocuments)
          .innerJoin(vehicleTransactions, eq(transactionDocuments.transactionId, vehicleTransactions.id))
          .where(and(
            eq(vehicleTransactions.userId, ctx.user.id),
            inArray(transactionDocuments.documentType, ["license_front", "license_back"]),
          ))
          .orderBy(desc(transactionDocuments.createdAt)),
        db.select({
          id: transactionDocuments.id,
          originalFilename: transactionDocuments.originalFilename,
          contentType: transactionDocuments.contentType,
          reviewStatus: transactionDocuments.status,
          createdAt: transactionDocuments.createdAt,
        }).from(transactionDocuments)
          .innerJoin(vehicleTransactions, eq(transactionDocuments.transactionId, vehicleTransactions.id))
          .where(and(eq(vehicleTransactions.userId, ctx.user.id), eq(transactionDocuments.documentType, "insurance_card")))
          .orderBy(desc(transactionDocuments.createdAt)),
        db.select({
          id: transactionAgreements.id,
          reference: vehicleTransactions.reference,
          vehicleName: vehicleTransactions.vehicleName,
          agreementType: transactionAgreements.agreementType,
          version: transactionAgreements.version,
          status: transactionAgreements.status,
          signedAt: transactionAgreements.signedAt,
          createdAt: transactionAgreements.createdAt,
          signedDocumentKey: transactionAgreements.signedDocumentKey,
        }).from(transactionAgreements)
          .innerJoin(vehicleTransactions, eq(transactionAgreements.transactionId, vehicleTransactions.id))
          .where(eq(vehicleTransactions.userId, ctx.user.id))
          .orderBy(desc(transactionAgreements.createdAt)),
      ]);
      return {
        profile: profiles[0] ?? null,
        licenseDocuments: [
          ...legacyLicenseDocuments.map(document => ({ ...document, recordSource: "legacy_license_document" as const })),
          ...transactionLicenseDocuments.map(document => ({ ...document, recordSource: "transaction_license_document" as const })),
        ],
        insuranceDocuments: insuranceDocuments.map(document => ({ ...document, recordSource: "transaction_insurance_document" as const })),
        agreements: agreements.map(({ signedDocumentKey, ...agreement }) => ({ ...agreement, hasSignedDocument: Boolean(signedDocumentKey) })),
      };
    }),

    getRecordLink: protectedProcedure
      .input(z.object({ recordType: z.enum(["legacy_license_document", "transaction_license_document", "transaction_insurance_document", "condition_evidence", "agreement"]), id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const recordLinkLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "secure_record_link", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!recordLinkLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many secure record requests. Please try again later." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Secure records are temporarily unavailable." });
        if (input.recordType === "legacy_license_document") {
          const documents = await db.select({ storageKey: rentalApplicationDocuments.storageKey })
            .from(rentalApplicationDocuments)
            .where(and(eq(rentalApplicationDocuments.id, input.id), eq(rentalApplicationDocuments.userId, ctx.user.id)))
            .limit(1);
          if (!documents[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Driver-license record not found." });
          return { url: await storageGetSignedUrl(documents[0].storageKey) };
        }
        if (input.recordType === "transaction_license_document" || input.recordType === "transaction_insurance_document" || input.recordType === "condition_evidence") {
          const documents = await db.select({ storageKey: transactionDocuments.storageKey, transactionId: transactionDocuments.transactionId })
            .from(transactionDocuments)
            .innerJoin(vehicleTransactions, eq(transactionDocuments.transactionId, vehicleTransactions.id))
            .where(and(
              eq(transactionDocuments.id, input.id),
              eq(vehicleTransactions.userId, ctx.user.id),
              input.recordType === "transaction_insurance_document"
                ? eq(transactionDocuments.documentType, "insurance_card")
                : input.recordType === "condition_evidence"
                  ? eq(transactionDocuments.documentType, "condition_photo")
                  : inArray(transactionDocuments.documentType, ["license_front", "license_back"]),
          ))
          .limit(1);
        if (!documents[0]) throw new TRPCError({ code: "NOT_FOUND", message: input.recordType === "transaction_insurance_document" ? "Insurance record not found." : input.recordType === "condition_evidence" ? "Condition evidence record not found." : "Driver-license record not found." });
          await db.insert(transactionEvents).values({
            transactionId: documents[0].transactionId,
            actorUserId: ctx.user.id,
            actorType: "customer",
            eventType: "record.access_requested",
            metadata: JSON.stringify({ recordType: input.recordType }),
          });
          return { url: await storageGetSignedUrl(documents[0].storageKey) };
        }
        const agreements = await db.select({ signedDocumentKey: transactionAgreements.signedDocumentKey, transactionId: transactionAgreements.transactionId })
          .from(transactionAgreements)
          .innerJoin(vehicleTransactions, eq(transactionAgreements.transactionId, vehicleTransactions.id))
          .where(and(eq(transactionAgreements.id, input.id), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const agreement = agreements[0];
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND", message: "Agreement record not found." });
        if (!agreement.signedDocumentKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A signed agreement file is not available yet." });
        await db.insert(transactionEvents).values({
          transactionId: agreement.transactionId,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "record.access_requested",
          metadata: JSON.stringify({ recordType: input.recordType }),
        });
        return { url: await storageGetSignedUrl(agreement.signedDocumentKey) };
      }),

    uploadIdentityDocument: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        documentType: z.enum(["license_front", "license_back", "live_selfie"]),
        filename: z.string().trim().min(1).max(120),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(100).max(8_400_000),
        identityDocumentConsent: z.literal(true).optional(),
        biometricConsent: z.literal(true).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const documentLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "identity_document_upload", String(ctx.user.id)), limit: 12, windowMs: 60 * 60 * 1000 });
        if (!documentLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many identity-document uploads. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Secure document capture is temporarily unavailable." });
        const transactions = await db.select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (["completed", "canceled", "declined"].includes(transaction.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This closed transaction cannot accept documents." });
        }
        const isSelfie = input.documentType === "live_selfie";
        if (isSelfie ? input.biometricConsent !== true : input.identityDocumentConsent !== true) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: isSelfie ? "Explicit identity and biometric consent is required before a live selfie can be processed." : "Explicit identity-document consent is required before a driver-license image can be processed." });
        }
        const rawBytes = Buffer.from(input.base64, "base64");
        if (rawBytes.length > 6 * 1024 * 1024) {
          throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Each identity document must be 6 MB or smaller." });
        }
        const extension = input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
        const { key } = await storagePut(
          `transaction-documents/${ctx.user.id}/${transaction.id}/${input.documentType}_${Date.now()}.${extension}`,
          rawBytes,
          input.contentType,
        );
        const inserted = await db.insert(transactionDocuments).values({
          transactionId: transaction.id,
          userId: ctx.user.id,
          documentType: input.documentType,
          storageKey: key,
          originalFilename: input.filename,
          contentType: input.contentType,
          status: "pending",
        });
        await db.insert(transactionConsents).values({
          transactionId: transaction.id,
          userId: ctx.user.id,
          consentType: isSelfie ? "identity_biometric" : "identity_document",
          policyVersion: "transaction-identity-v1",
          source: "transaction_identity_upload",
        });
        await db.update(vehicleTransactions).set({
          status: "verification_pending",
          currentStep: "identity",
          identityStatus: "pending",
          licenseStatus: isSelfie ? transaction.licenseStatus : "pending",
          identityProvider: "manual_review_pending",
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: isSelfie ? "identity.selfie_uploaded" : "identity.license_uploaded",
          fromStatus: transaction.status,
          toStatus: "verification_pending",
          metadata: JSON.stringify({ documentType: input.documentType, documentId: Number(inserted[0].insertId) }),
        });
        return { success: true, documentId: Number(inserted[0].insertId), status: "pending" as const };
      }),

    withdrawIdentityConsent: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        consentType: z.enum(["identity_document", "identity_biometric"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Consent controls are temporarily unavailable." });
        const transactions = await db.select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const withdrawnAt = new Date();
        await db.update(transactionConsents).set({ withdrawnAt }).where(and(
          eq(transactionConsents.transactionId, transaction.id),
          eq(transactionConsents.userId, ctx.user.id),
          eq(transactionConsents.consentType, input.consentType),
        ));
        await db.update(customerProfiles).set({
          profileStatus: "manual_review",
          identityStatus: "manual_review",
          licenseStatus: "manual_review",
        }).where(eq(customerProfiles.userId, ctx.user.id));
        await db.update(vehicleTransactions).set({
          status: "manual_review",
          currentStep: "identity",
          identityStatus: "manual_review",
          licenseStatus: "manual_review",
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "identity.consent_withdrawn",
          fromStatus: transaction.status,
          toStatus: "manual_review",
          metadata: JSON.stringify({ consentType: input.consentType }),
        });
        return { success: true, status: "manual_review" as const };
      }),

    requestIdentityRecordDeletion: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), reason: z.string().trim().min(2).max(1_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Privacy controls are temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        await db.update(vehicleTransactions).set({ status: "manual_review", currentStep: "identity", identityStatus: "manual_review", licenseStatus: "manual_review" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "privacy.identity_record_deletion_requested",
          fromStatus: transaction.status,
          toStatus: "manual_review",
          note: input.reason || null,
        });
        return { success: true, status: "manual_review" as const };
      }),

    get: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transactions are temporarily unavailable." });
        const transactions = await db
          .select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const profiles = await db
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.userId, ctx.user.id))
          .limit(1);
        const [schedules, quotes, links, conditionEvidence] = await Promise.all([
          db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1),
          db.select().from(transactionQuotes).where(eq(transactionQuotes.transactionId, transaction.id)).orderBy(desc(transactionQuotes.version)),
          db.select().from(transactionLinks).where(and(eq(transactionLinks.sourceTransactionId, transaction.id), eq(transactionLinks.requestedByUserId, ctx.user.id))).orderBy(desc(transactionLinks.createdAt)),
          db.select({ id: transactionDocuments.id, stage: transactionDocuments.conditionStage, view: transactionDocuments.conditionEvidenceView, originalFilename: transactionDocuments.originalFilename, createdAt: transactionDocuments.createdAt })
            .from(transactionDocuments)
            .where(and(eq(transactionDocuments.transactionId, transaction.id), eq(transactionDocuments.documentType, "condition_photo")))
            .orderBy(desc(transactionDocuments.createdAt)),
        ]);
        return { transaction, profile: profiles[0] ?? null, schedule: schedules[0] ?? null, quotes, links, conditionEvidence };
      }),

    saveProfile: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        fullName: z.string().trim().min(2).max(160),
        phone: z.string().trim().min(7).max(32),
        addressLine1: z.string().trim().min(2).max(255),
        addressLine2: z.string().trim().max(255).optional(),
        city: z.string().trim().min(2).max(100),
        state: z.string().trim().min(2).max(64),
        postalCode: z.string().trim().min(3).max(24),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transactions are temporarily unavailable." });
        const transactions = await db
          .select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (["completed", "canceled", "declined"].includes(transaction.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This closed transaction cannot be changed." });
        }

        const values = {
          fullName: input.fullName,
          email: ctx.user.email ?? null,
          phone: input.phone,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          dateOfBirth: input.dateOfBirth,
          profileStatus: "ready_for_verification" as const,
        };
        const existingProfile = await db
          .select({ id: customerProfiles.id })
          .from(customerProfiles)
          .where(eq(customerProfiles.userId, ctx.user.id))
          .limit(1);
        if (existingProfile[0]) {
          await db.update(customerProfiles).set(values).where(eq(customerProfiles.id, existingProfile[0].id));
        } else {
          await db.insert(customerProfiles).values({ userId: ctx.user.id, ...values });
        }
        await db.update(users).set({ name: input.fullName }).where(eq(users.id, ctx.user.id));
        const nextStep = transaction.transactionType === "rental" ? "contact_verification" : "identity";
        await db.update(vehicleTransactions).set({
          status: "verification_pending",
          currentStep: nextStep,
          contactName: input.fullName,
          contactEmail: ctx.user.email ?? null,
          contactPhone: input.phone,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
        }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "profile.saved",
          fromStatus: transaction.status,
          toStatus: "verification_pending",
        });
        return { success: true, nextStep };
      }),

    saveEligibility: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), attestsInformationAccurate: z.literal(true), notes: z.string().trim().max(1_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Eligibility review is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "eligibility") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Eligibility details can be saved when DreamCarz opens the eligibility-review stage." });
        await db.update(vehicleTransactions).set({ eligibilityDetails: JSON.stringify({ attestsInformationAccurate: true, notes: input.notes || null }), eligibilityStatus: "pending" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "eligibility.self_attestation_saved", metadata: JSON.stringify({ hasNotes: Boolean(input.notes) }) });
        return { success: true };
      }),

    saveInsurance: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), insurer: z.string().trim().min(2).max(120), policyLastFour: z.string().trim().regex(/^[A-Za-z0-9]{4}$/), coverageExpiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), insuranceReviewConsent: z.literal(true) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Insurance review is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "insurance") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Insurance details can be saved when DreamCarz opens the insurance stage." });
        await db.update(vehicleTransactions).set({ insuranceDetails: JSON.stringify({ insurer: input.insurer, policyLastFour: input.policyLastFour, coverageExpiresOn: input.coverageExpiresOn }), insuranceStatus: "pending" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionConsents).values({ transactionId: transaction.id, userId: ctx.user.id, consentType: "insurance_review", policyVersion: "insurance-review-v1", source: "transaction_flow" });
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "insurance.details_saved", metadata: JSON.stringify({ insurer: input.insurer, policyLastFour: input.policyLastFour, coverageExpiresOn: input.coverageExpiresOn }) });
        return { success: true };
      }),

    uploadInsuranceDocument: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        filename: z.string().trim().min(1).max(120),
        contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
        base64: z.string().min(100).max(8_400_000),
        insuranceReviewConsent: z.literal(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const documentLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "insurance_document_upload", String(ctx.user.id)), limit: 8, windowMs: 60 * 60 * 1000 });
        if (!documentLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many insurance-document uploads. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Insurance document capture is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "insurance") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Insurance proof can be uploaded when DreamCarz opens the insurance stage." });
        if (["completed", "canceled", "declined"].includes(transaction.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "This closed transaction cannot accept insurance proof." });
        const rawBytes = Buffer.from(input.base64, "base64");
        if (rawBytes.length > 6 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Each insurance record must be 6 MB or smaller." });
        const extension = input.contentType === "application/pdf" ? "pdf" : input.contentType === "image/png" ? "png" : input.contentType === "image/webp" ? "webp" : "jpg";
        const { key } = await storagePut(`transaction-documents/${ctx.user.id}/${transaction.id}/insurance_card_${Date.now()}.${extension}`, rawBytes, input.contentType);
        const inserted = await db.insert(transactionDocuments).values({ transactionId: transaction.id, userId: ctx.user.id, documentType: "insurance_card", storageKey: key, originalFilename: input.filename, contentType: input.contentType, status: "pending" });
        await db.insert(transactionConsents).values({ transactionId: transaction.id, userId: ctx.user.id, consentType: "insurance_review", policyVersion: "insurance-review-v1", source: "transaction_insurance_upload" });
        await db.update(vehicleTransactions).set({ insuranceStatus: "pending" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "insurance.proof_uploaded", metadata: JSON.stringify({ documentId: Number(inserted[0].insertId), contentType: input.contentType }) });
        return { success: true, documentId: Number(inserted[0].insertId), status: "pending" as const };
      }),

    addAdditionalDriver: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), fullName: z.string().trim().min(2).max(160), email: z.string().trim().email().max(320).optional(), phone: z.string().trim().min(7).max(32).optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Additional-driver setup is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "rental" || transaction.currentStep !== "additional_drivers") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Additional drivers may be added only during the rental additional-drivers stage." });
        const inserted = await db.insert(transactionAdditionalDrivers).values({ transactionId: transaction.id, fullName: input.fullName, email: input.email || null, phone: input.phone || null, licenseStatus: "pending", identityStatus: "pending" });
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "additional_driver.added", metadata: JSON.stringify({ driverId: Number(inserted[0].insertId) }) });
        return { success: true, driverId: Number(inserted[0].insertId) };
      }),

    saveTradeIn: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), hasTradeIn: z.boolean(), vehicleDescription: z.string().trim().max(300).optional(), estimatedMileage: z.number().int().min(0).max(2_000_000).optional(), notes: z.string().trim().max(1_000).optional() }).refine(input => !input.hasTradeIn || Boolean(input.vehicleDescription), { message: "Describe the trade-in vehicle before saving." }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Trade-in setup is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "purchase" || transaction.currentStep !== "trade_in") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Trade-in details may be saved only during the purchase trade-in stage." });
        await db.update(vehicleTransactions).set({ tradeInDetails: JSON.stringify({ hasTradeIn: input.hasTradeIn, vehicleDescription: input.vehicleDescription || null, estimatedMileage: input.estimatedMileage ?? null, notes: input.notes || null }) }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "purchase.trade_in_saved", metadata: JSON.stringify({ hasTradeIn: input.hasTradeIn }) });
        return { success: true };
      }),

    savePurchasePaymentPath: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), paymentPath: z.enum(["cash", "finance"]), creditAuthorization: z.literal(true).optional() }).refine(input => input.paymentPath !== "finance" || input.creditAuthorization === true, { message: "Explicit authorization is required before DreamCarz can route a financing request to a configured provider or manual-review process." }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Purchase path setup is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.transactionType !== "purchase" || !["payment_path", "financing"].includes(transaction.currentStep)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Select cash or finance when DreamCarz opens the purchase-payment stage." });
        const financingStatus = input.paymentPath === "finance" ? "provider_required" as const : "not_applicable" as const;
        await db.update(vehicleTransactions).set({ purchasePaymentPath: input.paymentPath, financingStatus }).where(eq(vehicleTransactions.id, transaction.id));
        if (input.paymentPath === "finance") await db.insert(transactionConsents).values({ transactionId: transaction.id, userId: ctx.user.id, consentType: "credit_authorization", policyVersion: "financing-authority-v1", source: "transaction_flow" });
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "purchase.payment_path_saved", metadata: JSON.stringify({ paymentPath: input.paymentPath }) });
        return { success: true, financingStatus };
      }),

    createAgreementTemplate: protectedProcedure
      .input(z.object({ agreementType: z.enum(["rental", "purchase"]), version: z.string().trim().min(1).max(64), title: z.string().trim().min(3).max(160), content: z.string().trim().min(40).max(50_000), jurisdiction: z.string().trim().min(2).max(80).default("Maryland"), legalApprovalReference: z.string().trim().min(2).max(255), legalReviewNotes: z.string().trim().max(3_000).optional(), legallyApproved: z.literal(true), activate: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Agreement templates are temporarily unavailable." });
        if (input.activate) await db.update(agreementTemplates).set({ isActive: false }).where(eq(agreementTemplates.agreementType, input.agreementType));
        const result = await db.insert(agreementTemplates).values({ agreementType: input.agreementType, version: input.version, title: input.title, content: input.content, jurisdiction: input.jurisdiction, legalApprovalReference: input.legalApprovalReference, legalReviewNotes: input.legalReviewNotes || null, legalApprovedAt: new Date(), legalApprovedByUserId: ctx.user.id, isActive: input.activate });
        return { success: true, templateId: Number(result[0].insertId) };
      }),

    listAgreementTemplates: protectedProcedure
      .input(z.object({ agreementType: z.enum(["rental", "purchase"]).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        return input?.agreementType
          ? db.select().from(agreementTemplates).where(eq(agreementTemplates.agreementType, input.agreementType)).orderBy(desc(agreementTemplates.updatedAt))
          : db.select().from(agreementTemplates).orderBy(desc(agreementTemplates.updatedAt));
      }),

    prepareNativeAgreement: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Agreement preparation is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "review") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete the available transaction review stages before preparing an agreement." });
        const agreementType = transaction.transactionType;
        const templateRows = await db.select().from(agreementTemplates).where(and(eq(agreementTemplates.agreementType, agreementType), eq(agreementTemplates.isActive, true))).limit(1);
        const template = templateRows[0];
        if (!template?.legalApprovedAt || !template.legalApprovalReference) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A legally approved DreamCarz agreement template is required before signing can begin." });
        const currentAgreements = await db.select().from(transactionAgreements).where(and(eq(transactionAgreements.transactionId, transaction.id), eq(transactionAgreements.templateId, template.id), eq(transactionAgreements.status, "awaiting_signature"))).limit(1);
        if (currentAgreements[0]) return { success: true, agreementId: currentAgreements[0].id, resumed: true };
        const contentSnapshot = renderAgreementContent(template.content, transaction);
        const created = await db.insert(transactionAgreements).values({ transactionId: transaction.id, templateId: template.id, agreementType, version: template.version, status: "awaiting_signature", signingMethod: "native_attestation", contentSnapshot, sentAt: new Date() });
        const agreementId = Number(created[0].insertId);
        await db.update(vehicleTransactions).set({ status: "agreement_pending", currentStep: "agreement", agreementStatus: "awaiting_signature", agreementProvider: "dreamcarz_native" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "agreement.native_prepared", fromStatus: transaction.status, toStatus: "agreement_pending", metadata: JSON.stringify({ agreementId, templateId: template.id, version: template.version, legalApprovalReference: template.legalApprovalReference }) });
        return { success: true, agreementId, resumed: false };
      }),

    getNativeAgreement: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Agreement records are temporarily unavailable." });
        const transactionRows = await db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        if (!transactionRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const agreements = await db.select({ id: transactionAgreements.id, agreementType: transactionAgreements.agreementType, version: transactionAgreements.version, status: transactionAgreements.status, contentSnapshot: transactionAgreements.contentSnapshot, signerName: transactionAgreements.signerName, signerAcknowledgedAt: transactionAgreements.signerAcknowledgedAt, signedAt: transactionAgreements.signedAt })
          .from(transactionAgreements).where(eq(transactionAgreements.transactionId, transactionRows[0].id)).orderBy(desc(transactionAgreements.createdAt)).limit(1);
        return agreements[0] ?? null;
      }),

    signNativeAgreement: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), agreementId: z.number().int().positive(), signerName: z.string().trim().min(2).max(160), acknowledgesAgreement: z.literal(true), electronicSignatureConsent: z.literal(true) }))
      .mutation(async ({ ctx, input }) => {
        const signingLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "native_agreement_signing", String(ctx.user.id)), limit: 5, windowMs: 30 * 60 * 1000 });
        if (!signingLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many signing attempts. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Native signing is temporarily unavailable." });
        const transactionRows = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
        const transaction = transactionRows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const agreementRows = await db.select().from(transactionAgreements).where(and(eq(transactionAgreements.id, input.agreementId), eq(transactionAgreements.transactionId, transaction.id))).limit(1);
        const agreement = agreementRows[0];
        if (!agreement?.contentSnapshot || agreement.status !== "awaiting_signature") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This agreement is not available for signing." });
        const signedAt = new Date();
        const signatureHash = nativeSignatureHash({ agreementId: agreement.id, signerName: input.signerName, acknowledgedAt: signedAt, contentSnapshot: agreement.contentSnapshot });
        const forwardedFor = ctx.req.headers["x-forwarded-for"];
        const signerIpHash = typeof forwardedFor === "string" && forwardedFor ? createHash("sha256").update(forwardedFor.split(",")[0].trim()).digest("hex") : null;
        const signatureArtifact = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeAgreementHtml(agreement.agreementType)} agreement</title></head><body><article><h1>DreamCarz ${escapeAgreementHtml(agreement.agreementType)} agreement</h1><pre style="white-space:pre-wrap;font-family:inherit">${escapeAgreementHtml(agreement.contentSnapshot)}</pre><hr><p>Signed by: ${escapeAgreementHtml(input.signerName)}</p><p>Signed at: ${signedAt.toISOString()}</p><p>Native signature record: ${signatureHash}</p></article></body></html>`;
        const { key } = await storagePut(`transaction-agreements/${ctx.user.id}/${transaction.id}/${agreement.id}/native-signed-${Date.now()}.html`, Buffer.from(signatureArtifact, "utf8"), "text/html");
        await db.insert(transactionConsents).values({ transactionId: transaction.id, userId: ctx.user.id, consentType: "electronic_signature", policyVersion: "dreamcarz-native-signing-v1", source: "native_signing" });
        await db.update(transactionAgreements).set({ status: "signed", signerUserId: ctx.user.id, signerName: input.signerName, signerAcknowledgedAt: signedAt, signatureHash, signerIpHash, signedDocumentKey: key, signedAt }).where(eq(transactionAgreements.id, agreement.id));
        await db.update(vehicleTransactions).set({ status: "manual_review", currentStep: "confirmation", agreementStatus: "signed" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "agreement.native_signed", fromStatus: transaction.status, toStatus: "manual_review", metadata: JSON.stringify({ agreementId: agreement.id, version: agreement.version, signatureHash }) });
        return { success: true, signedAt };
      }),

    saveStep: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), currentStep: z.string().trim().min(2).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transactions are temporarily unavailable." });
        const transactions = await db
          .select()
          .from(vehicleTransactions)
          .where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const transaction = transactions[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (!isTransactionStep(transaction.transactionType, input.currentStep)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This step is not valid for the selected transaction." });
        }
        const nextStep = nextCustomerTransactionStep(transaction.transactionType, transaction.currentStep, transaction.purchasePaymentPath);
        if (input.currentStep !== nextStep) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This transaction can advance only to its next available customer stage." });
        }
        if (transaction.currentStep === "identity") {
          const identityDocuments = await db.select({ id: transactionDocuments.id }).from(transactionDocuments)
            .where(and(eq(transactionDocuments.transactionId, transaction.id), eq(transactionDocuments.documentType, "license_front"))).limit(1);
          if (!identityDocuments[0]) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Upload a driver-license front record before continuing to eligibility." });
        }
        if (transaction.currentStep === "eligibility" && !transaction.eligibilityDetails) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Save your eligibility attestation before continuing." });
        if (transaction.currentStep === "insurance" && !transaction.insuranceDetails) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Save the required limited insurance details before continuing." });
        if (transaction.currentStep === "trade_in" && !transaction.tradeInDetails) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Save your trade-in preference before continuing." });
        if (transaction.currentStep === "payment_path" && transaction.purchasePaymentPath === "undecided") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Select your cash or financing path before continuing." });
        if (transaction.currentStep === "pricing" && !transaction.pricingSnapshot) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DreamCarz must record an approved transaction pricing summary before payment-method setup can begin." });
        if (transaction.currentStep === "payment" && !["authorized", "paid"].includes(transaction.paymentStatus)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete the provider-managed payment authorization before continuing to agreement review." });
        await db.update(vehicleTransactions).set({ currentStep: input.currentStep }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "transaction.step_advanced", metadata: JSON.stringify({ fromStep: transaction.currentStep, toStep: input.currentStep }) });
        return { success: true, currentStep: input.currentStep };
      }),
  }),

  vehicleInquiries: router({
    create: publicProcedure
      .input(z.object({
        inquiryType: z.enum(["rental", "purchase", "reserve"]),
        vehicleId: z.string().trim().min(2).max(96),
        vehicleName: z.string().trim().min(2).max(160),
        contactName: z.string().trim().min(2).max(160),
        contactEmail: z.string().trim().email().max(320),
        contactPhone: z.string().trim().min(7).max(32),
        preferredContact: z.enum(["phone", "email"]),
        requestedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        requestedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        pickupLocation: z.string().trim().max(255).optional(),
        notes: z.string().trim().max(2_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle requests are temporarily unavailable." });

        if (input.inquiryType === "rental") {
          if (!hasCompleteRentalInquiry(input)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Add a pickup location and valid rental dates to continue." });
          }
        }

        const referenceCode = nanoid(7).toUpperCase().replace(/[^A-Z0-9]/g, "X");
        const reference = `${vehicleInquiryReferencePrefix(input.inquiryType)}-${new Date().getFullYear()}-${referenceCode}`;
        await db.insert(vehicleInquiries).values({
          reference,
          userId: ctx.user?.id ?? null,
          ...input,
          requestedStartDate: input.requestedStartDate ?? null,
          requestedEndDate: input.requestedEndDate ?? null,
          pickupLocation: input.pickupLocation ?? null,
          notes: input.notes ?? null,
          status: "submitted",
        });
        return { success: true, reference, inquiryType: input.inquiryType } as const;
      }),

    listMine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(vehicleInquiries).where(eq(vehicleInquiries.userId, ctx.user.id)).orderBy(desc(vehicleInquiries.createdAt));
    }),
  }),

  incidents: router({
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select({
        id: vehicleIncidentRecords.id,
        incidentType: vehicleIncidentRecords.incidentType,
        severity: vehicleIncidentRecords.severity,
        status: vehicleIncidentRecords.status,
        reportedLocation: vehicleIncidentRecords.reportedLocation,
        occurredAt: vehicleIncidentRecords.occurredAt,
        description: vehicleIncidentRecords.description,
        hasEvidence: isNotNull(vehicleIncidentRecords.photoKeys),
        createdAt: vehicleIncidentRecords.createdAt,
        vehicleName: vehiclePassports.vehicleName,
        transactionReference: vehicleTransactions.reference,
      }).from(vehicleIncidentRecords)
        .innerJoin(vehiclePassports, eq(vehicleIncidentRecords.vehiclePassportId, vehiclePassports.id))
        .innerJoin(vehicleTransactions, eq(vehicleIncidentRecords.transactionId, vehicleTransactions.id))
        .where(eq(vehicleTransactions.userId, ctx.user.id))
        .orderBy(desc(vehicleIncidentRecords.createdAt));
    }),

    openEvidence: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), evidenceIndex: z.number().int().min(0).max(24).default(0) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Incident evidence is temporarily unavailable." });
      const incident = (await db.select({ id: vehicleIncidentRecords.id, transactionId: vehicleIncidentRecords.transactionId, photoKeys: vehicleIncidentRecords.photoKeys }).from(vehicleIncidentRecords)
        .innerJoin(vehicleTransactions, eq(vehicleIncidentRecords.transactionId, vehicleTransactions.id))
        .where(and(eq(vehicleIncidentRecords.id, input.incidentId), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0];
      if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Incident report not found." });
      const evidenceKeys = parseStoredEvidenceKeys(incident.photoKeys);
      const evidenceKey = evidenceKeys[input.evidenceIndex];
      if (!evidenceKey) throw new TRPCError({ code: "NOT_FOUND", message: "Incident evidence is not available for this item." });
      if (!incident.transactionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Incident evidence is not linked to an account-owned rental record." });
      await db.insert(transactionEvents).values({ transactionId: incident.transactionId, actorUserId: ctx.user.id, actorType: "customer", eventType: "incident.evidence_access_requested", metadata: JSON.stringify({ incidentId: incident.id, evidenceIndex: input.evidenceIndex }) });
      return { url: await storageGetSignedUrl(evidenceKey) };
    }),

    report: protectedProcedure.input(z.object({
      transactionReference: z.string().trim().min(8).max(32),
      incidentType: z.enum(["collision", "mechanical", "damage", "theft", "towing", "ticket_or_impound", "roadside", "other"]),
      severity: z.enum(["standard", "urgent", "emergency"]),
      reportedLocation: z.string().trim().max(255).optional(),
      occurredAt: z.date().optional(),
      policeReportReference: z.string().trim().max(160).optional(),
      towReference: z.string().trim().max(160).optional(),
      insuranceClaimReference: z.string().trim().max(160).optional(),
      description: z.string().trim().min(10).max(4000),
      photos: z.array(z.object({ filename: z.string().trim().min(1).max(160), contentType: z.enum(["image/jpeg", "image/png", "image/webp"]), base64: z.string().min(100).max(8_400_000) })).max(8).default([]),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Incident reporting is temporarily unavailable." });
      const transactions = await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.transactionReference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1);
      const transaction = transactions[0];
      if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "This transaction is not available for incident reporting." });
      if (transaction.transactionType !== "rental" || !["ready_for_pickup", "active_rental", "return_pending"].includes(transaction.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Incidents can be linked only to an active or current rental transaction." });
      const passports = await db.select({ id: vehiclePassports.id }).from(vehiclePassports).where(eq(vehiclePassports.vehicleId, transaction.vehicleId)).limit(1);
      if (!passports[0]) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "DreamCarz must create the internal Vehicle Passport before this incident can be submitted." });
      const incidentDraft = await db.insert(vehicleIncidentRecords).values({
        vehiclePassportId: passports[0].id, transactionId: transaction.id, incidentType: input.incidentType, severity: input.severity, status: "reported",
        reportedLocation: input.reportedLocation || null, occurredAt: input.occurredAt ?? new Date(), policeReportReference: input.policeReportReference || null,
        towReference: input.towReference || null, insuranceClaimReference: input.insuranceClaimReference || null, description: input.description, reportedByUserId: ctx.user.id,
      });
      const incidentId = Number(incidentDraft[0].insertId);
      const photoKeys = await Promise.all(input.photos.map(async (photo, index) => {
        const fileName = photo.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const stored = await storagePut(`vehicle-incidents/${ctx.user.id}/${transaction.id}/${incidentId}/${index}-${fileName}`, Buffer.from(photo.base64, "base64"), photo.contentType);
        return stored.key;
      }));
      if (photoKeys.length) await db.update(vehicleIncidentRecords).set({ photoKeys: JSON.stringify(photoKeys) }).where(eq(vehicleIncidentRecords.id, incidentId));
      await db.update(vehicleTransactions).set({ conditionStatus: "review_required" }).where(eq(vehicleTransactions.id, transaction.id));
      await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "customer", eventType: "incident.reported", fromStatus: transaction.status, toStatus: transaction.status, metadata: JSON.stringify({ incidentId, incidentType: input.incidentType, severity: input.severity, privateEvidenceCount: photoKeys.length }) });
      return { success: true, incidentId, privateEvidenceCount: photoKeys.length };
    }),
  }),

  serviceReports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const reports = await db.select().from(serviceReports).where(eq(serviceReports.userId, ctx.user.id)).orderBy(desc(serviceReports.createdAt));
      return Promise.all(reports.map(async report => ({
        ...report,
        history: orderServiceReportTimeline(await db.select().from(serviceReportReviewEvents).where(eq(serviceReportReviewEvents.reportId, report.id)).orderBy(desc(serviceReportReviewEvents.createdAt))),
      })));
    }),

    create: protectedProcedure
      .input(z.object({
        category: z.string().trim().min(2).max(80),
        description: z.string().trim().min(5).max(4_000),
        reportedLocation: z.string().trim().max(255).optional(),
        urgency: z.enum(["standard", "urgent"]),
        photos: z.array(z.object({
          filename: z.string().min(1).max(120),
          contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
          base64: z.string().min(100).max(8_400_000),
        })).max(8),
      }))
      .mutation(async ({ ctx, input }) => {
        assertSafeRestrictedContent(input.description, "operational report");
        if (input.reportedLocation) assertSafeRestrictedContent(input.reportedLocation, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Service reporting is temporarily unavailable." });
        const activeReservations = await db
          .select({ vehicleName: reservationRequests.vehicleName })
          .from(reservationRequests)
          .where(and(eq(reservationRequests.userId, ctx.user.id), eq(reservationRequests.status, "confirmed")))
          .orderBy(desc(reservationRequests.updatedAt))
          .limit(1);
        const currentVehicle = activeReservations[0]?.vehicleName;
        if (!currentVehicle) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A confirmed DreamCarz reservation is required before submitting a vehicle service report." });
        }
        const reference = `SR-${new Date().getFullYear()}-${nanoid(7).toUpperCase()}`;
        const inserted = await db.insert(serviceReports).values({
          userId: ctx.user.id,
          reference,
          vehicleName: currentVehicle,
          category: input.category,
          description: input.description,
          reportedLocation: input.reportedLocation || null,
          urgency: input.urgency,
        });
        const reportId = Number(inserted[0].insertId);
        await db.insert(serviceReportReviewEvents).values({ reportId, status: "submitted", note: "Report received" });
        for (const photo of input.photos) {
          const bytes = Buffer.from(photo.base64, "base64");
          if (bytes.length > 6 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Each photo must be 6 MB or smaller." });
          const extension = photo.contentType === "image/png" ? "png" : photo.contentType === "image/webp" ? "webp" : "jpg";
          const { key } = await storagePut(`service-reports/${ctx.user.id}/${reportId}_${Date.now()}_${nanoid(4)}.${extension}`, bytes, photo.contentType);
          await db.insert(serviceReportPhotos).values({ reportId, userId: ctx.user.id, storageKey: key, originalFilename: photo.filename, contentType: photo.contentType });
        }
        return { success: true, reference };
      }),
  }),

  supportRequests: router({
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const requests = await db.select().from(supportRequests).where(eq(supportRequests.userId, ctx.user.id)).orderBy(desc(supportRequests.updatedAt));
      const requestIds = requests.map(request => request.id);
      const events = requestIds.length ? await db.select({ id: supportRequestEvents.id, supportRequestId: supportRequestEvents.supportRequestId, eventType: supportRequestEvents.eventType, fromStatus: supportRequestEvents.fromStatus, toStatus: supportRequestEvents.toStatus, customerUpdate: supportRequestEvents.customerUpdate, createdAt: supportRequestEvents.createdAt }).from(supportRequestEvents).where(inArray(supportRequestEvents.supportRequestId, requestIds)).orderBy(desc(supportRequestEvents.createdAt)) : [];
      return requests.map(request => ({
        id: request.id,
        reference: request.reference,
        category: request.category,
        urgency: request.urgency,
        status: request.status,
        subject: request.subject,
        description: request.description,
        customerUpdate: request.customerUpdate,
        relatedTransactionId: request.relatedTransactionId,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        resolvedAt: request.resolvedAt,
        history: events.filter(event => event.supportRequestId === request.id).map(event => ({
          id: event.id,
          supportRequestId: event.supportRequestId,
          eventType: event.eventType,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          customerUpdate: event.customerUpdate,
          createdAt: event.createdAt,
        })),
      }));
    }),
    create: protectedProcedure.input(z.object({
      category: z.enum(["general", "account", "membership", "reservation", "transaction", "payment", "vehicle", "incident", "other"]),
      urgency: z.enum(["standard", "urgent"]),
      subject: z.string().trim().min(3).max(160),
      description: z.string().trim().min(10).max(4_000),
      relatedTransactionReference: z.string().trim().max(48).optional(),
    })).mutation(async ({ ctx, input }) => {
      assertSafeSupportContent(`${input.subject}\n${input.description}`);
      const requestLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "support_request", String(ctx.user.id)), limit: 6, windowMs: 15 * 60_000 });
      if (!requestLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before sending another support request." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Support requests are temporarily unavailable." });
      const transaction = input.relatedTransactionReference ? (await db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.relatedTransactionReference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0] : undefined;
      if (input.relatedTransactionReference && !transaction) throw new TRPCError({ code: "NOT_FOUND", message: "That transaction is not available for this support request." });
      const reference = `SP-${new Date().getFullYear()}-${nanoid(7).toUpperCase()}`;
      const inserted = await db.insert(supportRequests).values({ reference, userId: ctx.user.id, category: input.category, urgency: input.urgency, subject: input.subject, description: input.description, relatedTransactionId: transaction?.id ?? null });
      const supportRequestId = Number(inserted[0].insertId);
      await db.insert(supportRequestEvents).values({ supportRequestId, actorUserId: ctx.user.id, eventType: "support_request.submitted", toStatus: "submitted", customerUpdate: "Your request was recorded for DreamCarz review." });
      return { success: true, reference } as const;
    }),
    addFollowUp: protectedProcedure.input(z.object({
      supportRequestId: z.number().int().positive(),
      message: z.string().trim().min(10).max(2_000),
    })).mutation(async ({ ctx, input }) => {
      assertSafeSupportContent(input.message);
      const followUpLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "support_request_follow_up", String(ctx.user.id)), limit: 6, windowMs: 15 * 60_000 });
      if (!followUpLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before adding another support follow-up." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Support follow-ups are temporarily unavailable." });
      const request = (await db.select({ id: supportRequests.id, status: supportRequests.status }).from(supportRequests).where(and(eq(supportRequests.id, input.supportRequestId), eq(supportRequests.userId, ctx.user.id))).limit(1))[0];
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "That support request is not available from this account." });
      if (request.status !== "submitted" && request.status !== "under_review") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A follow-up can be added only while this support request is open." });
      await db.insert(supportRequestEvents).values({ supportRequestId: request.id, actorUserId: ctx.user.id, eventType: "support_request.customer_follow_up", fromStatus: request.status, toStatus: request.status, customerUpdate: input.message });
      await db.update(supportRequests).set({ updatedAt: new Date() }).where(eq(supportRequests.id, request.id));
      return { success: true } as const;
    }),
    queue: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Support operations are temporarily unavailable." });
      const assignments = await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt)));
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(assignment => assignment.role));
      if (!roles.some(role => ["support", "operations", "manager", "administrator"].includes(role))) throw new TRPCError({ code: "FORBIDDEN", message: "DreamCarz support operations access is required." });
      const requests = await db.select().from(supportRequests).orderBy(desc(supportRequests.updatedAt));
      const requestIds = requests.map(request => request.id);
      const followUps = requestIds.length ? await db.select({ id: supportRequestEvents.id, supportRequestId: supportRequestEvents.supportRequestId, customerUpdate: supportRequestEvents.customerUpdate, createdAt: supportRequestEvents.createdAt }).from(supportRequestEvents).where(inArray(supportRequestEvents.supportRequestId, requestIds)).orderBy(desc(supportRequestEvents.createdAt)) : [];
      return requests.map(request => ({
        ...request,
        customerFollowUps: followUps.filter(event => event.supportRequestId === request.id && event.customerUpdate).map(event => ({ id: event.id, message: event.customerUpdate!, createdAt: event.createdAt })),
      }));
    }),
    review: protectedProcedure.input(z.object({
      supportRequestId: z.number().int().positive(),
      status: z.enum(["submitted", "under_review", "resolved", "closed"]),
      customerUpdate: z.string().trim().min(3).max(2_000).optional(),
      internalNote: z.string().trim().min(3).max(2_000).optional(),
      assignedToUserId: z.number().int().positive().nullable().optional(),
    }).refine(input => Boolean(input.customerUpdate || input.internalNote || input.assignedToUserId !== undefined || input.status), { message: "Add a review change before saving." })).mutation(async ({ ctx, input }) => {
      const reviewLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "support_request_review", String(ctx.user.id)), limit: 30, windowMs: 60 * 60 * 1000 });
      if (!reviewLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many support updates. Please wait before trying again." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Support operations are temporarily unavailable." });
      const assignments = await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt)));
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(assignment => assignment.role));
      if (!roles.some(role => ["support", "operations", "manager", "administrator"].includes(role))) throw new TRPCError({ code: "FORBIDDEN", message: "DreamCarz support operations access is required." });
      if (input.customerUpdate) assertSafeRestrictedContent(input.customerUpdate, "support message");
      if (input.internalNote) assertSafeRestrictedContent(input.internalNote, "operational report");
      const request = (await db.select().from(supportRequests).where(eq(supportRequests.id, input.supportRequestId)).limit(1))[0];
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Support request not found." });
      const resolvedAt = ["resolved", "closed"].includes(input.status) ? new Date() : null;
      await db.update(supportRequests).set({ status: input.status, customerUpdate: input.customerUpdate ?? request.customerUpdate, internalNote: input.internalNote ?? request.internalNote, assignedToUserId: input.assignedToUserId === undefined ? request.assignedToUserId : input.assignedToUserId, resolvedAt }).where(eq(supportRequests.id, request.id));
      await db.insert(supportRequestEvents).values({ supportRequestId: request.id, actorUserId: ctx.user.id, eventType: "support_request.reviewed", fromStatus: request.status, toStatus: input.status, customerUpdate: input.customerUpdate ?? null, internalNote: input.internalNote ?? null });
      if (input.customerUpdate) await deliverLifecycleInAppNotice(db, { userId: request.userId, title: "DreamCarz support update", body: "A support request has an update in your private Support center.", actionPath: "/dashboard/support", relatedTransactionId: request.relatedTransactionId ?? 0 });
      return { success: true } as const;
    }),
  }),

  partners: router({
    list: publicProcedure
      .input(z.object({ query: z.string().trim().max(120).optional(), category: z.string().trim().max(48).optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select().from(partnerLocations).where(eq(partnerLocations.isActive, 1)).orderBy(desc(partnerLocations.updatedAt));
        return filterPartnerDirectory(rows, input);
      }),
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      return db ? db.select().from(partnerLocations).orderBy(desc(partnerLocations.updatedAt)) : [];
    }),
    setActive: protectedProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(partnerLocations).set({ isActive: partnerActivationValue(input.isActive) }).where(eq(partnerLocations.id, input.id));
      return { success: true };
    }),
  }),

  fleetPartner: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("fleet_partner") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Fleet Partner access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet Partner data is temporarily unavailable." });
      const profile = (await db.select({ businessName: fleetPartnerProfiles.businessName, status: fleetPartnerProfiles.status }).from(fleetPartnerProfiles).where(eq(fleetPartnerProfiles.userId, ctx.user.id)).limit(1))[0] ?? null;
      const vehicleAssignments = await db.select().from(fleetPartnerVehicleAssignments).where(and(eq(fleetPartnerVehicleAssignments.partnerUserId, ctx.user.id), eq(fleetPartnerVehicleAssignments.accessStatus, "active")));
      const passportIds = vehicleAssignments.map(item => item.vehiclePassportId);
      const vehicles = passportIds.length ? await db.select({ id: vehiclePassports.id, vehicleName: vehiclePassports.vehicleName, readinessStatus: vehiclePassports.readinessStatus }).from(vehiclePassports).where(inArray(vehiclePassports.id, passportIds)) : [];
      const vehicleNames = vehicles.map(vehicle => vehicle.vehicleName);
      const maintenance = passportIds.length ? await db.select({ id: vehicleMaintenanceRecords.id, vehiclePassportId: vehicleMaintenanceRecords.vehiclePassportId, maintenanceType: vehicleMaintenanceRecords.maintenanceType, status: vehicleMaintenanceRecords.status, createdAt: vehicleMaintenanceRecords.createdAt }).from(vehicleMaintenanceRecords).where(inArray(vehicleMaintenanceRecords.vehiclePassportId, passportIds)).orderBy(desc(vehicleMaintenanceRecords.createdAt)) : [];
      const inspections = passportIds.length ? await db.select({ id: vehicleOperationalInspections.id, vehiclePassportId: vehicleOperationalInspections.vehiclePassportId, stage: vehicleOperationalInspections.stage, status: vehicleOperationalInspections.status, createdAt: vehicleOperationalInspections.createdAt }).from(vehicleOperationalInspections).where(inArray(vehicleOperationalInspections.vehiclePassportId, passportIds)).orderBy(desc(vehicleOperationalInspections.createdAt)) : [];
      const incidents = passportIds.length ? await db.select({ id: vehicleIncidentRecords.id, vehiclePassportId: vehicleIncidentRecords.vehiclePassportId, incidentType: vehicleIncidentRecords.incidentType, severity: vehicleIncidentRecords.severity, status: vehicleIncidentRecords.status, createdAt: vehicleIncidentRecords.createdAt }).from(vehicleIncidentRecords).where(inArray(vehicleIncidentRecords.vehiclePassportId, passportIds)).orderBy(desc(vehicleIncidentRecords.createdAt)) : [];
      const activeRentalVehicleRows = vehicleNames.length ? await db.select({ vehicleName: vehicleTransactions.vehicleName }).from(vehicleTransactions).where(and(inArray(vehicleTransactions.vehicleName, vehicleNames), eq(vehicleTransactions.status, "active_rental"))) : [];
      const activeRentalCounts = activeRentalVehicleRows.reduce<Record<string, number>>((counts, row) => {
        counts[row.vehicleName] = (counts[row.vehicleName] ?? 0) + 1;
        return counts;
      }, {});
      const activity = vehicles.map(vehicle => ({
        vehiclePassportId: vehicle.id,
        vehicleName: vehicle.vehicleName,
        activeRentalCount: activeRentalCounts[vehicle.vehicleName] ?? 0,
      }));
      return { profile, roles, vehicles, maintenance, inspections, incidents, activity };
    }),
    adminAssignmentOverview: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet assignment operations are temporarily unavailable." });
      const [partners, passports, assignments] = await Promise.all([
        db.select({ userId: fleetPartnerProfiles.userId, businessName: fleetPartnerProfiles.businessName, status: fleetPartnerProfiles.status }).from(fleetPartnerProfiles).where(eq(fleetPartnerProfiles.status, "active")).orderBy(fleetPartnerProfiles.businessName),
        db.select({ id: vehiclePassports.id, vehicleName: vehiclePassports.vehicleName, readinessStatus: vehiclePassports.readinessStatus }).from(vehiclePassports).orderBy(vehiclePassports.vehicleName),
        db.select().from(fleetPartnerVehicleAssignments).orderBy(desc(fleetPartnerVehicleAssignments.updatedAt)),
      ]);
      return { partners, passports, assignments };
    }),
    assignVehicle: protectedProcedure.input(z.object({ partnerUserId: z.number().int().positive(), vehiclePassportId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet assignment operations are temporarily unavailable." });
      const partner = (await db.select({ userId: fleetPartnerProfiles.userId }).from(fleetPartnerProfiles).where(and(eq(fleetPartnerProfiles.userId, input.partnerUserId), eq(fleetPartnerProfiles.status, "active"))).limit(1))[0];
      if (!partner) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The Fleet Partner must have an active DreamCarz partner profile before assignment." });
      const partnerRoles = await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, input.partnerUserId), isNull(userRoleAssignments.revokedAt)));
      if (!effectiveDreamCarzRoles("user", partnerRoles.map(item => item.role)).includes("fleet_partner")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The Fleet Partner role must be active before vehicle assignment." });
      const passport = (await db.select({ id: vehiclePassports.id }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1))[0];
      if (!passport) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
      const existing = (await db.select().from(fleetPartnerVehicleAssignments).where(and(eq(fleetPartnerVehicleAssignments.partnerUserId, input.partnerUserId), eq(fleetPartnerVehicleAssignments.vehiclePassportId, input.vehiclePassportId))).limit(1))[0];
      if (existing) {
        await db.update(fleetPartnerVehicleAssignments).set({ accessStatus: "active", endedAt: null }).where(eq(fleetPartnerVehicleAssignments.id, existing.id));
        await recordVehiclePassportActivity(db, { vehiclePassportId: input.vehiclePassportId, actorUserId: ctx.user.id, eventType: "fleet_partner.assignment_activated", metadata: { assignmentAction: "reactivated" } });
        return { success: true, assignmentId: existing.id, reactivated: true } as const;
      }
      const created = await db.insert(fleetPartnerVehicleAssignments).values({ partnerUserId: input.partnerUserId, vehiclePassportId: input.vehiclePassportId, accessStatus: "active" });
      const assignmentId = Number(created[0].insertId);
      await recordVehiclePassportActivity(db, { vehiclePassportId: input.vehiclePassportId, actorUserId: ctx.user.id, eventType: "fleet_partner.assignment_activated", metadata: { assignmentAction: "created" } });
      return { success: true, assignmentId, reactivated: false } as const;
    }),
    updateVehicleAssignment: protectedProcedure.input(z.object({ assignmentId: z.number().int().positive(), accessStatus: z.enum(["active", "paused", "ended"]) })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet assignment operations are temporarily unavailable." });
      const assignment = (await db.select().from(fleetPartnerVehicleAssignments).where(eq(fleetPartnerVehicleAssignments.id, input.assignmentId)).limit(1))[0];
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Fleet Partner vehicle assignment not found." });
      const endedAt = input.accessStatus === "ended" ? new Date() : null;
      await db.update(fleetPartnerVehicleAssignments).set({ accessStatus: input.accessStatus, endedAt }).where(eq(fleetPartnerVehicleAssignments.id, assignment.id));
      await recordVehiclePassportActivity(db, { vehiclePassportId: assignment.vehiclePassportId, actorUserId: ctx.user.id, eventType: `fleet_partner.assignment_${input.accessStatus}`, metadata: { assignmentAction: input.accessStatus } });
      return { success: true } as const;
    }),
    submitInspection: protectedProcedure.input(z.object({
      vehiclePassportId: z.number().int().positive(),
      odometerReading: z.number().int().nonnegative().optional(),
      fuelOrChargeLevel: z.string().trim().max(80).optional(),
      tireCondition: z.string().trim().max(80).optional(),
      cleanliness: z.string().trim().max(80).optional(),
      damageNotes: z.string().trim().max(2_000).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (input.damageNotes) assertSafeRestrictedContent(input.damageNotes, "operational report");
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("fleet_partner") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Fleet Partner access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet operations are temporarily unavailable." });
      if (!roles.includes("administrator")) {
        const assignment = await db.select({ id: fleetPartnerVehicleAssignments.id }).from(fleetPartnerVehicleAssignments).where(and(eq(fleetPartnerVehicleAssignments.partnerUserId, ctx.user.id), eq(fleetPartnerVehicleAssignments.vehiclePassportId, input.vehiclePassportId), eq(fleetPartnerVehicleAssignments.accessStatus, "active"))).limit(1);
        if (!assignment[0]) throw new TRPCError({ code: "FORBIDDEN", message: "This vehicle is not assigned to your partner account." });
      }
      const created = await db.insert(vehicleOperationalInspections).values({ vehiclePassportId: input.vehiclePassportId, stage: "periodic", status: "submitted", odometerReading: input.odometerReading, fuelOrChargeLevel: input.fuelOrChargeLevel, tireCondition: input.tireCondition, cleanliness: input.cleanliness, damageNotes: input.damageNotes, inspectedByUserId: ctx.user.id, inspectedAt: new Date() });
      return { success: true, inspectionId: Number(created[0].insertId) };
    }),
    requestMaintenance: protectedProcedure.input(z.object({
      vehiclePassportId: z.number().int().positive(),
      maintenanceType: z.enum(["scheduled_service", "repair", "recall", "tire", "cleaning", "inspection_follow_up", "other"]),
      notes: z.string().trim().min(3).max(2_000),
      odometerAtService: z.number().int().nonnegative().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertSafeRestrictedContent(input.notes, "operational report");
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("fleet_partner") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Fleet Partner access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet operations are temporarily unavailable." });
      if (!roles.includes("administrator")) {
        const assignment = await db.select({ id: fleetPartnerVehicleAssignments.id }).from(fleetPartnerVehicleAssignments).where(and(eq(fleetPartnerVehicleAssignments.partnerUserId, ctx.user.id), eq(fleetPartnerVehicleAssignments.vehiclePassportId, input.vehiclePassportId), eq(fleetPartnerVehicleAssignments.accessStatus, "active"))).limit(1);
        if (!assignment[0]) throw new TRPCError({ code: "FORBIDDEN", message: "This vehicle is not assigned to your partner account." });
      }
      const created = await db.insert(vehicleMaintenanceRecords).values({ vehiclePassportId: input.vehiclePassportId, maintenanceType: input.maintenanceType, status: "planned", notes: input.notes, odometerAtService: input.odometerAtService, createdByUserId: ctx.user.id });
      return { success: true, maintenanceId: Number(created[0].insertId) };
    }),
    reportIncident: protectedProcedure.input(z.object({
      vehiclePassportId: z.number().int().positive(),
      incidentType: z.enum(["mechanical", "damage", "theft", "towing", "ticket_or_impound", "roadside", "other"]),
      severity: z.enum(["standard", "urgent"]),
      description: z.string().trim().min(8).max(4_000),
      reportedLocation: z.string().trim().max(255).optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertSafeRestrictedContent(input.description, "operational report");
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("fleet_partner") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Fleet Partner access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet operations are temporarily unavailable." });
      if (!roles.includes("administrator")) {
        const assignment = await db.select({ id: fleetPartnerVehicleAssignments.id }).from(fleetPartnerVehicleAssignments).where(and(eq(fleetPartnerVehicleAssignments.partnerUserId, ctx.user.id), eq(fleetPartnerVehicleAssignments.vehiclePassportId, input.vehiclePassportId), eq(fleetPartnerVehicleAssignments.accessStatus, "active"))).limit(1);
        if (!assignment[0]) throw new TRPCError({ code: "FORBIDDEN", message: "This vehicle is not assigned to your partner account." });
      }
      const created = await db.insert(vehicleIncidentRecords).values({ vehiclePassportId: input.vehiclePassportId, incidentType: input.incidentType, severity: input.severity, status: "reported", reportedLocation: input.reportedLocation || null, description: input.description, reportedByUserId: ctx.user.id, occurredAt: new Date() });
      return { success: true, incidentId: Number(created[0].insertId) };
    }),
  }),

  associate: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("associate") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Associate access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Associate data is temporarily unavailable." });
      const profile = (await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1))[0] ?? null;
      const leads = await db.select().from(associateLeads).where(eq(associateLeads.associateUserId, ctx.user.id)).orderBy(desc(associateLeads.updatedAt));
      const referralsForAssociate = await db.select().from(referrals).where(eq(referrals.referrerId, ctx.user.id)).orderBy(desc(referrals.createdAt));
      const [commissionRecords, conversionEvents, leadActivity] = await Promise.all([
        db.select().from(commissions).where(eq(commissions.userId, ctx.user.id)).orderBy(desc(commissions.month)),
        db.select({ id: referralConversionEvents.id, referralId: referralConversionEvents.referralId, eventType: referralConversionEvents.eventType, createdAt: referralConversionEvents.createdAt }).from(referralConversionEvents).where(eq(referralConversionEvents.referrerUserId, ctx.user.id)).orderBy(desc(referralConversionEvents.createdAt)),
        db.select({ id: associateLeadActivityEvents.id, leadId: associateLeadActivityEvents.leadId, eventType: associateLeadActivityEvents.eventType, status: associateLeadActivityEvents.status, createdAt: associateLeadActivityEvents.createdAt }).from(associateLeadActivityEvents).where(eq(associateLeadActivityEvents.associateUserId, ctx.user.id)).orderBy(desc(associateLeadActivityEvents.createdAt)),
      ]);
      return { profile, leads, referrals: referralsForAssociate, commissionRecords, conversionEvents, leadActivity, roles };
    }),
    ensureProfile: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("associate") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Associate access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Associate profile setup is temporarily unavailable." });
      const existing = (await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1))[0];
      if (existing) return existing;
      const referralCode = `DC-${nanoid(8).toUpperCase()}`;
      await db.insert(referralProfiles).values({ userId: ctx.user.id, referralCode });
      return (await db.select().from(referralProfiles).where(eq(referralProfiles.userId, ctx.user.id)).limit(1))[0];
    }),
    createLead: protectedProcedure.input(z.object({
      contactName: z.string().trim().min(2).max(160),
      contactEmail: z.string().trim().email().max(320).optional(),
      contactPhone: z.string().trim().min(7).max(48).optional(),
      interestType: z.enum(["membership", "rental", "purchase", "fleet_partner", "associate", "general"]),
      consentToContact: z.literal(true),
      notes: z.string().trim().max(2_000).optional(),
    }).refine(input => Boolean(input.contactEmail || input.contactPhone), { message: "An email address or phone number is required." })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (input.notes) assertSafeRestrictedContent(input.notes, "private lead note");
      const assignments = db ? await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))) : [];
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("associate") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Associate access is required." });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Lead capture is temporarily unavailable." });
      const result = await db.insert(associateLeads).values({ associateUserId: ctx.user.id, ...input });
      const leadId = Number(result[0].insertId);
      await db.insert(associateLeadActivityEvents).values({ associateUserId: ctx.user.id, leadId, eventType: "lead_created", status: "new" });
      return { id: leadId };
    }),
    updateLead: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "contacted", "qualified", "converted", "closed"]), notes: z.string().trim().max(2_000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Lead capture is temporarily unavailable." });
      if (input.notes) assertSafeRestrictedContent(input.notes, "private lead note");
      const assignments = await db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt)));
      const roles = effectiveDreamCarzRoles(ctx.user.role, assignments.map(item => item.role));
      if (!roles.includes("associate") && !roles.includes("administrator")) throw new TRPCError({ code: "FORBIDDEN", message: "Associate access is required." });
      const lead = (await db.select().from(associateLeads).where(eq(associateLeads.id, input.id)).limit(1))[0];
      if (!lead || (lead.associateUserId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN", message: "This lead is not available to this account." });
      await db.update(associateLeads).set({ status: input.status, notes: input.notes ?? lead.notes }).where(eq(associateLeads.id, input.id));
      await db.insert(associateLeadActivityEvents).values({ associateUserId: lead.associateUserId, leadId: lead.id, eventType: "status_updated", status: input.status });
      return { success: true };
    }),
  }),

  communications: router({
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { preferences: null, notifications: [] };
      const preferences = (await db.select().from(communicationPreferences).where(eq(communicationPreferences.userId, ctx.user.id)).limit(1))[0] ?? null;
      const notifications = await db.select().from(customerNotifications).where(eq(customerNotifications.userId, ctx.user.id)).orderBy(desc(customerNotifications.createdAt)).limit(60);
      return { preferences, notifications };
    }),
    updatePreferences: protectedProcedure.input(z.object({
      emailEnabled: z.boolean(),
      smsEnabled: z.boolean(),
      pushEnabled: z.boolean(),
      transactionalInAppEnabled: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Communication preferences are temporarily unavailable." });
      const existing = (await db.select({ id: communicationPreferences.id }).from(communicationPreferences).where(eq(communicationPreferences.userId, ctx.user.id)).limit(1))[0];
      if (existing) await db.update(communicationPreferences).set(input).where(eq(communicationPreferences.id, existing.id));
      else await db.insert(communicationPreferences).values({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Notifications are temporarily unavailable." });
      const notification = (await db.select().from(customerNotifications).where(eq(customerNotifications.id, input.id)).limit(1))[0];
      if (!notification || notification.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "This notification is not available to this account." });
      if (!notification.readAt) {
        await db.update(customerNotifications).set({ readAt: new Date() }).where(eq(customerNotifications.id, notification.id));
        await db.insert(communicationEvents).values({ userId: ctx.user.id, notificationId: notification.id, channel: "in_app", status: "read" });
      }
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Notifications are temporarily unavailable." });
      const unread = await db.select({ id: customerNotifications.id }).from(customerNotifications).where(and(eq(customerNotifications.userId, ctx.user.id), isNull(customerNotifications.readAt)));
      if (!unread.length) return { success: true, markedCount: 0 } as const;
      const readAt = new Date();
      await db.update(customerNotifications).set({ readAt }).where(and(eq(customerNotifications.userId, ctx.user.id), isNull(customerNotifications.readAt)));
      await db.insert(communicationEvents).values(unread.map(notification => ({ userId: ctx.user.id, notificationId: notification.id, channel: "in_app" as const, status: "read" as const, detail: "Customer marked notification as read." })));
      return { success: true, markedCount: unread.length } as const;
    }),
    issueInApp: protectedProcedure.input(z.object({
      userId: z.number().int().positive(),
      category: z.enum(["transaction", "membership", "wallet", "vehicle", "incident", "support", "account", "other"]),
      title: z.string().trim().min(2).max(180),
      body: z.string().trim().min(2).max(4_000),
      actionPath: z.string().trim().regex(/^\/[a-zA-Z0-9_?=&\-/.]*$/).max(512).optional(),
      relatedTransactionId: z.number().int().positive().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Notifications are temporarily unavailable." });
      const preference = (await db.select().from(communicationPreferences).where(eq(communicationPreferences.userId, input.userId)).limit(1))[0];
      if (preference?.transactionalInAppEnabled === false) {
        await db.insert(communicationEvents).values({ userId: input.userId, channel: "in_app", status: "suppressed", detail: "Customer disabled transactional in-app notices." });
        return { success: true, suppressed: true };
      }
      const inserted = await db.insert(customerNotifications).values(input);
      const notificationId = Number(inserted[0].insertId);
      await db.insert(communicationEvents).values({ userId: input.userId, notificationId, channel: "in_app", status: "delivered" });
      return { success: true, notificationId, suppressed: false };
    }),
  }),

  operations: router({
    launchReadiness: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Launch readiness is temporarily unavailable." });

      const [transactions, approvedQuotes, activeTemplates] = await Promise.all([
        db.select({ status: vehicleTransactions.status, paymentStatus: vehicleTransactions.paymentStatus, identityStatus: vehicleTransactions.identityStatus, agreementStatus: vehicleTransactions.agreementStatus })
          .from(vehicleTransactions),
        db.select({ id: transactionQuotes.id }).from(transactionQuotes).where(eq(transactionQuotes.status, "approved")),
        db.select({ id: agreementTemplates.id }).from(agreementTemplates).where(eq(agreementTemplates.isActive, true)),
      ]);
      const payment = getPaymentProviderStatus();
      const stripeIdentity = getIdentityProviderStatus();
      const awsFaceLiveness = getAwsFaceLivenessStatus();
      const pendingIdentity = transactions.filter(transaction => ["pending", "manual_review", "needs_attention"].includes(transaction.identityStatus)).length;
      const pendingPayment = transactions.filter(transaction => ["pending", "required", "failed"].includes(transaction.paymentStatus)).length;
      const pendingAgreement = transactions.filter(transaction => ["pending", "prepared", "needs_attention"].includes(transaction.agreementStatus)).length;

      const checks = [
        {
          key: "pricing",
          label: "Approved transaction pricing",
          state: approvedQuotes.length ? "attention" : "blocker",
          detail: approvedQuotes.length
            ? `${approvedQuotes.length} approved quote${approvedQuotes.length === 1 ? " is" : "s are"} recorded. Vehicle-level rates still require DreamCarz approval and a CoCard product mapping before checkout.`
            : "No approved quotes are recorded. Customer checkout must remain unavailable until DreamCarz approves vehicle-level pricing and product mappings.",
        },
        {
          key: "payment",
          label: "Hosted payment verification",
          state: payment.configured ? "attention" : "blocker",
          detail: payment.configured
            ? `${pendingPayment} transaction${pendingPayment === 1 ? " is" : "s are"} awaiting payment-related review. Signed webhook delivery and a harmless end-to-end hosted-checkout test remain required.`
            : "CoCard hosted checkout is not fully configured for launch. No payment collection should be enabled.",
        },
        {
          key: "identity",
          label: "Identity and liveness verification",
          state: awsFaceLiveness.configured || stripeIdentity.configured ? "attention" : "blocker",
          detail: awsFaceLiveness.configured
            ? `${pendingIdentity} transaction${pendingIdentity === 1 ? " is" : "s are"} in an identity review state. AWS customer verification requires consent and a manual-review decision.`
            : awsFaceLiveness.browserCredentialBrokerConfigured
              ? "AWS temporary browser credentials are prepared, but the customer camera flow remains disabled pending protected broker and official client verification. The private document and manual-review path remains available."
              : "Provider liveness verification is not customer-active. The private document and manual-review path remains available.",
        },
        {
          key: "agreement",
          label: "Counsel-approved agreement templates",
          state: activeTemplates.length ? "attention" : "blocker",
          detail: activeTemplates.length
            ? `${activeTemplates.length} active agreement template${activeTemplates.length === 1 ? " is" : "s are"} recorded. Confirm Maryland counsel approval for the exact language, entity, and retention process before launch.`
            : "No active counsel-approved agreement template is recorded. Native signing must remain unavailable until counsel approval is documented.",
        },
        {
          key: "transaction_reviews",
          label: "Open transaction review",
          state: pendingAgreement || pendingIdentity ? "attention" : "ready",
          detail: `${transactions.length} transaction${transactions.length === 1 ? " is" : "s are"} recorded; ${pendingIdentity} need identity review and ${pendingAgreement} need agreement review. This is an operational count, not an approval decision.`,
        },
      ] as const;

      return {
        generatedAt: new Date(),
        checks,
        summary: {
          transactionCount: transactions.length,
          approvedQuoteCount: approvedQuotes.length,
          pendingIdentityCount: pendingIdentity,
          pendingPaymentCount: pendingPayment,
          pendingAgreementCount: pendingAgreement,
          awsFaceLiveness: {
            serverCredentialsConfigured: awsFaceLiveness.serverCredentialsConfigured,
            browserCredentialBrokerConfigured: awsFaceLiveness.browserCredentialBrokerConfigured,
            browserFlowEnabled: awsFaceLiveness.browserFlowEnabled,
            enabled: awsFaceLiveness.enabled,
          },
        },
      };
    }),

    getQueue: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) return { applications: [], reservations: [], serviceReports: [] };

      const applications = await db
        .select({
          id: rentalApplications.id,
          status: rentalApplications.status,
          currentStep: rentalApplications.currentStep,
          phone: rentalApplications.phone,
          requestedStartDate: rentalApplications.requestedStartDate,
          requestedEndDate: rentalApplications.requestedEndDate,
          pickupLocation: rentalApplications.pickupLocation,
          identityVerificationStatus: rentalApplications.identityVerificationStatus,
          submittedAt: rentalApplications.submittedAt,
          reviewNote: rentalApplications.reviewNote,
          memberName: users.name,
          memberEmail: users.email,
        })
        .from(rentalApplications)
        .innerJoin(users, eq(rentalApplications.userId, users.id))
        .orderBy(desc(rentalApplications.updatedAt));

      const reservations = await db
        .select({
          id: reservationRequests.id,
          reference: reservationRequests.reference,
          status: reservationRequests.status,
          vehicleName: reservationRequests.vehicleName,
          requestedStartDate: reservationRequests.requestedStartDate,
          requestedEndDate: reservationRequests.requestedEndDate,
          pickupLocation: reservationRequests.pickupLocation,
          contactPhone: reservationRequests.contactPhone,
          notes: reservationRequests.notes,
          reviewNote: reservationRequests.reviewNote,
          memberName: users.name,
          memberEmail: users.email,
        })
        .from(reservationRequests)
        .innerJoin(users, eq(reservationRequests.userId, users.id))
        .orderBy(desc(reservationRequests.updatedAt));

      const serviceReportsQueue = await db
        .select({
          id: serviceReports.id,
          reference: serviceReports.reference,
          status: serviceReports.status,
          urgency: serviceReports.urgency,
          category: serviceReports.category,
          vehicleName: serviceReports.vehicleName,
          description: serviceReports.description,
          reportedLocation: serviceReports.reportedLocation,
          reviewNote: serviceReports.reviewNote,
          createdAt: serviceReports.createdAt,
          memberName: users.name,
          memberEmail: users.email,
        })
        .from(serviceReports)
        .innerJoin(users, eq(serviceReports.userId, users.id))
        .orderBy(desc(serviceReports.updatedAt));

      const serviceReportsWithHistory = await Promise.all(serviceReportsQueue.map(async report => ({
        ...report,
        history: orderServiceReportTimeline(await db.select().from(serviceReportReviewEvents).where(eq(serviceReportReviewEvents.reportId, report.id)).orderBy(desc(serviceReportReviewEvents.createdAt))),
      })));

      return { applications, reservations, serviceReports: serviceReportsWithHistory };
    }),

    commandCenter: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Command Center data is temporarily unavailable." });
      const [passports, transactions, incidents, maintenance, inspections, schedules] = await Promise.all([
        db.select({ id: vehiclePassports.id, readinessStatus: vehiclePassports.readinessStatus }).from(vehiclePassports),
        db.select({ id: vehicleTransactions.id, reference: vehicleTransactions.reference, vehicleName: vehicleTransactions.vehicleName, status: vehicleTransactions.status, currentStep: vehicleTransactions.currentStep, transactionType: vehicleTransactions.transactionType, paymentStatus: vehicleTransactions.paymentStatus, updatedAt: vehicleTransactions.updatedAt }).from(vehicleTransactions).orderBy(desc(vehicleTransactions.updatedAt)),
        db.select({ id: vehicleIncidentRecords.id, status: vehicleIncidentRecords.status, severity: vehicleIncidentRecords.severity }).from(vehicleIncidentRecords),
        db.select({ id: vehicleMaintenanceRecords.id, status: vehicleMaintenanceRecords.status }).from(vehicleMaintenanceRecords),
        db.select({ id: vehicleOperationalInspections.id, status: vehicleOperationalInspections.status }).from(vehicleOperationalInspections),
        db.select({ id: transactionSchedules.id, handoffStatus: transactionSchedules.handoffStatus }).from(transactionSchedules),
      ]);
      const count = <T,>(records: T[], predicate: (record: T) => boolean) => records.filter(predicate).length;
      const openIncidents = count(incidents, item => !["resolved", "closed"].includes(item.status));
      const openMaintenance = count(maintenance, item => !["completed", "canceled"].includes(item.status));
      const pendingInspections = count(inspections, item => ["draft", "submitted", "needs_attention"].includes(item.status));
      const manualExceptions = count(transactions, item => ["manual_review", "verification_pending", "eligibility_review", "payment_pending", "settlement_pending"].includes(item.status));
      return {
        fleet: {
          total: passports.length,
          available: count(passports, item => item.readinessStatus === "available"),
          activeRental: count(passports, item => item.readinessStatus === "active_rental"),
          requiresAttention: count(passports, item => ["inspection_due", "maintenance_due", "out_of_service"].includes(item.readinessStatus)),
        },
        transactions: {
          total: transactions.length,
          activeRentals: count(transactions, item => item.status === "active_rental"),
          manualExceptions,
          pendingPayments: count(transactions, item => item.paymentStatus === "pending"),
        },
        operations: {
          openIncidents,
          urgentIncidents: count(incidents, item => item.severity === "urgent" || item.severity === "emergency"),
          openMaintenance,
          pendingInspections,
          scheduledHandoffs: count(schedules, item => item.handoffStatus === "scheduled"),
        },
        recentTransactions: transactions.slice(0, 8),
      };
    }),

    returnProcessing: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const returns = await db.select({ id: vehicleTransactions.id, reference: vehicleTransactions.reference, vehicleId: vehicleTransactions.vehicleId, vehicleName: vehicleTransactions.vehicleName, status: vehicleTransactions.status, conditionStatus: vehicleTransactions.conditionStatus, settlementStatus: vehicleTransactions.settlementStatus, updatedAt: vehicleTransactions.updatedAt }).from(vehicleTransactions).where(and(eq(vehicleTransactions.transactionType, "rental"), inArray(vehicleTransactions.status, ["return_pending", "settlement_pending"]))).orderBy(desc(vehicleTransactions.updatedAt));
        const vehicleIds = returns.map(record => record.vehicleId);
        const [passports, settlements] = await Promise.all([
          vehicleIds.length ? db.select({ id: vehiclePassports.id, vehicleId: vehiclePassports.vehicleId, readinessStatus: vehiclePassports.readinessStatus, currentLocation: vehiclePassports.currentLocation }).from(vehiclePassports).where(inArray(vehiclePassports.vehicleId, vehicleIds)) : Promise.resolve([]),
          returns.length ? db.select({ transactionId: transactionSettlements.transactionId, status: transactionSettlements.status, updatedAt: transactionSettlements.updatedAt }).from(transactionSettlements).where(inArray(transactionSettlements.transactionId, returns.map(record => record.id))) : Promise.resolve([]),
        ]);
        return returns.map(record => {
          const settlement = settlements.find(item => item.transactionId === record.id) ?? null;
          return { ...record, passport: passports.find(passport => passport.vehicleId === record.vehicleId) ?? null, settlement: settlement ? { status: settlement.status, updatedAt: settlement.updatedAt, isFinalized: ["settled", "disputed", "waived"].includes(settlement.status) } : null };
        });
      }),
      process: protectedProcedure.input(z.object({
        reference: z.string().trim().min(8).max(32),
        readinessStatus: z.enum(["inspection_due", "maintenance_due", "available", "out_of_service"]),
        note: z.string().trim().min(3).max(2_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Return processing is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "NOT_FOUND", message: "Rental transaction not found." });
        if (!['return_pending', 'settlement_pending'].includes(transaction.status) || transaction.conditionStatus !== "return_complete") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A completed return condition report is required before vehicle processing." });
        const settlement = (await db.select().from(transactionSettlements).where(eq(transactionSettlements.transactionId, transaction.id)).limit(1))[0];
        if (!settlement || !["settled", "disputed", "waived"].includes(settlement.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Finalize the return settlement review before recording vehicle processing." });
        const passport = (await db.select().from(vehiclePassports).where(eq(vehiclePassports.vehicleId, transaction.vehicleId)).limit(1))[0];
        if (!passport) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Create the internal Vehicle Passport before processing this return." });
        const previousReadiness = passport.readinessStatus;
        await db.update(vehiclePassports).set({ readinessStatus: input.readinessStatus }).where(eq(vehiclePassports.id, passport.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "return.vehicle_processing_recorded", fromStatus: transaction.status, toStatus: transaction.status, note: input.note, metadata: JSON.stringify({ previousReadiness, readinessStatus: input.readinessStatus, settlementStatus: settlement.status, conditionStatus: transaction.conditionStatus }) });
        return { success: true, previousReadiness, readinessStatus: input.readinessStatus } as const;
      }),
    }),

    pricingRules: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const rules = await db.select().from(pricingRules).orderBy(desc(pricingRules.updatedAt));
        return Promise.all(rules.map(async rule => ({
          ...rule,
          history: await db.select().from(pricingRuleEvents).where(eq(pricingRuleEvents.pricingRuleId, rule.id)).orderBy(desc(pricingRuleEvents.createdAt)),
        })));
      }),

      create: protectedProcedure.input(z.object({
        name: z.string().trim().min(3).max(160),
        scope: z.enum(["rental", "purchase", "membership", "deposit", "delivery", "other"]),
        configuration: z.string().trim().min(2).max(12000).refine(value => {
          try { return typeof JSON.parse(value) === "object" && JSON.parse(value) !== null; } catch { return false; }
        }, "Enter a valid JSON configuration object."),
        note: z.string().trim().max(1000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pricing controls are temporarily unavailable." });
        const created = await db.insert(pricingRules).values({ name: input.name, scope: input.scope, configuration: input.configuration, createdByUserId: ctx.user.id });
        const pricingRuleId = Number(created[0].insertId);
        await db.insert(pricingRuleEvents).values({ pricingRuleId, actorUserId: ctx.user.id, eventType: "pricing_rule_created", toStatus: "draft", note: input.note || null });
        return { success: true, pricingRuleId };
      }),

      setStatus: protectedProcedure.input(z.object({
        pricingRuleId: z.number().int().positive(),
        nextStatus: z.enum(["approved", "paused", "archived"]),
        note: z.string().trim().min(3).max(1000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Pricing controls are temporarily unavailable." });
        const rule = await db.select().from(pricingRules).where(eq(pricingRules.id, input.pricingRuleId)).limit(1);
        if (!rule[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Pricing rule not found." });
        if (rule[0].status === "archived") throw new TRPCError({ code: "BAD_REQUEST", message: "Archived rules cannot be changed." });
        if (rule[0].status === input.nextStatus) return { success: true, unchanged: true };
        await db.update(pricingRules).set({ status: input.nextStatus, approvedByUserId: input.nextStatus === "approved" ? ctx.user.id : rule[0].approvedByUserId, approvedAt: input.nextStatus === "approved" ? new Date() : rule[0].approvedAt }).where(eq(pricingRules.id, input.pricingRuleId));
        await db.insert(pricingRuleEvents).values({ pricingRuleId: input.pricingRuleId, actorUserId: ctx.user.id, eventType: `pricing_rule_${input.nextStatus}`, fromStatus: rule[0].status, toStatus: input.nextStatus, note: input.note });
        return { success: true, unchanged: false };
      }),
    }),

    eligibilityPolicies: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const [policies, events] = await Promise.all([
          db.select().from(eligibilityPolicies).orderBy(desc(eligibilityPolicies.updatedAt)),
          db.select().from(eligibilityPolicyEvents).orderBy(desc(eligibilityPolicyEvents.createdAt)),
        ]);
        return policies.map(policy => ({ ...policy, history: events.filter(event => event.eligibilityPolicyId === policy.id) }));
      }),

      create: protectedProcedure.input(z.object({
        code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,64}$/, "Use 3–64 uppercase letters, numbers, hyphens, or underscores."),
        name: z.string().trim().min(3).max(160),
        version: z.string().trim().min(1).max(64),
        scope: z.enum(["all_rentals", "entry", "mid_range", "elite", "specific_vehicle"]),
        vehicleId: z.string().trim().max(96).optional(),
        ruleConfiguration: z.string().trim().min(2).max(12_000).refine(value => {
          try { return typeof JSON.parse(value) === "object" && JSON.parse(value) !== null; } catch { return false; }
        }, "Enter a valid JSON configuration object."),
        approvalReference: z.string().trim().max(255).optional(),
        note: z.string().trim().max(1_000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.scope === "specific_vehicle" && (!input.vehicleId || !isApprovedTransactionVehicle(input.vehicleId))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A specific-vehicle policy must reference confirmed DreamCarz inventory." });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Eligibility policy controls are temporarily unavailable." });
        const created = await db.insert(eligibilityPolicies).values({
          code: input.code,
          name: input.name,
          version: input.version,
          scope: input.scope,
          vehicleId: input.scope === "specific_vehicle" ? input.vehicleId! : null,
          ruleConfiguration: input.ruleConfiguration,
          approvalReference: input.approvalReference || null,
          createdByUserId: ctx.user.id,
        });
        const eligibilityPolicyId = Number(created[0].insertId);
        await db.insert(eligibilityPolicyEvents).values({ eligibilityPolicyId, actorUserId: ctx.user.id, eventType: "eligibility_policy_created", toStatus: "draft", note: input.note || null, metadata: JSON.stringify({ scope: input.scope, vehicleId: input.scope === "specific_vehicle" ? input.vehicleId : null, ruleConfigurationLength: input.ruleConfiguration.length }) });
        return { success: true, eligibilityPolicyId };
      }),

      setStatus: protectedProcedure.input(z.object({
        eligibilityPolicyId: z.number().int().positive(),
        nextStatus: z.enum(["draft", "active", "retired"]),
        note: z.string().trim().min(3).max(1_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Eligibility policy controls are temporarily unavailable." });
        const policy = (await db.select().from(eligibilityPolicies).where(eq(eligibilityPolicies.id, input.eligibilityPolicyId)).limit(1))[0];
        if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Eligibility policy not found." });
        if (policy.status === "retired") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Retired eligibility policies cannot be changed." });
        if (policy.status === input.nextStatus) return { success: true, unchanged: true };
        await db.update(eligibilityPolicies).set({
          status: input.nextStatus,
          activatedByUserId: input.nextStatus === "active" ? ctx.user.id : policy.activatedByUserId,
          activatedAt: input.nextStatus === "active" ? new Date() : policy.activatedAt,
        }).where(eq(eligibilityPolicies.id, policy.id));
        await db.insert(eligibilityPolicyEvents).values({ eligibilityPolicyId: policy.id, actorUserId: ctx.user.id, eventType: `eligibility_policy_${input.nextStatus}`, fromStatus: policy.status, toStatus: input.nextStatus, note: input.note });
        return { success: true, unchanged: false };
      }),
    }),

    transactionConsole: protectedProcedure
      .input(z.object({ query: z.string().trim().max(120).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const rows = await db.select({
          id: vehicleTransactions.id,
          reference: vehicleTransactions.reference,
          transactionType: vehicleTransactions.transactionType,
          vehicleName: vehicleTransactions.vehicleName,
          membershipPlan: vehicleTransactions.membershipPlan,
          status: vehicleTransactions.status,
          currentStep: vehicleTransactions.currentStep,
          identityStatus: vehicleTransactions.identityStatus,
          licenseStatus: vehicleTransactions.licenseStatus,
          eligibilityStatus: vehicleTransactions.eligibilityStatus,
          insuranceStatus: vehicleTransactions.insuranceStatus,
          paymentStatus: vehicleTransactions.paymentStatus,
          agreementStatus: vehicleTransactions.agreementStatus,
          conditionStatus: vehicleTransactions.conditionStatus,
          pickupStatus: vehicleTransactions.pickupStatus,
          returnStatus: vehicleTransactions.returnStatus,
          settlementStatus: vehicleTransactions.settlementStatus,
          deliveryStatus: vehicleTransactions.deliveryStatus,
          updatedAt: vehicleTransactions.updatedAt,
          customerName: users.name,
          customerEmail: users.email,
        }).from(vehicleTransactions).innerJoin(users, eq(vehicleTransactions.userId, users.id)).orderBy(desc(vehicleTransactions.updatedAt));
        const query = input?.query?.toLowerCase();
        return query ? rows.filter(row => [row.reference, row.vehicleName, row.customerName, row.customerEmail, row.status].some(value => value?.toLowerCase().includes(query))) : rows;
      }),

    vehiclePassports: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const passports = await db.select().from(vehiclePassports).orderBy(desc(vehiclePassports.updatedAt));
        return passports.map(({ registrationDocumentKey, insuranceDocumentKey, ...passport }) => ({ ...passport, hasRegistrationDocument: Boolean(registrationDocumentKey), hasInsuranceDocument: Boolean(insuranceDocumentKey) }));
      }),

      operationalHistory: protectedProcedure.input(z.object({ vehiclePassportId: z.number().int().positive() })).query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle Passport history is temporarily unavailable." });
        const passport = (await db.select({ id: vehiclePassports.id, vehicleId: vehiclePassports.vehicleId, vehicleName: vehiclePassports.vehicleName, readinessStatus: vehiclePassports.readinessStatus, currentOdometer: vehiclePassports.currentOdometer, fuelOrChargeLevel: vehiclePassports.fuelOrChargeLevel, updatedAt: vehiclePassports.updatedAt }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1))[0];
        if (!passport) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
        const [inspections, maintenance, activities, openReservations, activeRentals] = await Promise.all([
          db.select({ id: vehicleOperationalInspections.id, transactionId: vehicleOperationalInspections.transactionId, stage: vehicleOperationalInspections.stage, status: vehicleOperationalInspections.status, odometerReading: vehicleOperationalInspections.odometerReading, fuelOrChargeLevel: vehicleOperationalInspections.fuelOrChargeLevel, tireCondition: vehicleOperationalInspections.tireCondition, cleanliness: vehicleOperationalInspections.cleanliness, damageNotes: vehicleOperationalInspections.damageNotes, reviewNote: vehicleOperationalInspections.reviewNote, hasEvidence: isNotNull(vehicleOperationalInspections.photoKeys), inspectedAt: vehicleOperationalInspections.inspectedAt, reviewedAt: vehicleOperationalInspections.reviewedAt, createdAt: vehicleOperationalInspections.createdAt }).from(vehicleOperationalInspections).where(eq(vehicleOperationalInspections.vehiclePassportId, passport.id)).orderBy(desc(vehicleOperationalInspections.createdAt)).limit(40),
          db.select({ id: vehicleMaintenanceRecords.id, maintenanceType: vehicleMaintenanceRecords.maintenanceType, status: vehicleMaintenanceRecords.status, dueAt: vehicleMaintenanceRecords.dueAt, completedAt: vehicleMaintenanceRecords.completedAt, odometerAtService: vehicleMaintenanceRecords.odometerAtService, vendorName: vehicleMaintenanceRecords.vendorName, workOrderReference: vehicleMaintenanceRecords.workOrderReference, notes: vehicleMaintenanceRecords.notes, hasInvoiceDocument: isNotNull(vehicleMaintenanceRecords.invoiceDocumentKey), createdAt: vehicleMaintenanceRecords.createdAt, updatedAt: vehicleMaintenanceRecords.updatedAt }).from(vehicleMaintenanceRecords).where(eq(vehicleMaintenanceRecords.vehiclePassportId, passport.id)).orderBy(desc(vehicleMaintenanceRecords.createdAt)).limit(40),
          db.select({ id: vehiclePassportActivityEvents.id, eventType: vehiclePassportActivityEvents.eventType, metadata: vehiclePassportActivityEvents.metadata, createdAt: vehiclePassportActivityEvents.createdAt }).from(vehiclePassportActivityEvents).where(eq(vehiclePassportActivityEvents.vehiclePassportId, passport.id)).orderBy(desc(vehiclePassportActivityEvents.createdAt)).limit(40),
          db.select({ id: reservationRequests.id }).from(reservationRequests).where(and(eq(reservationRequests.vehicleName, passport.vehicleName), inArray(reservationRequests.status, ["submitted", "under_review", "confirmed", "change_requested"]))),
          db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(and(eq(vehicleTransactions.vehicleId, passport.vehicleId), eq(vehicleTransactions.status, "active_rental"))),
        ]);
        return {
          passport,
          inspections,
          maintenance,
          activities: activities.map(({ metadata, ...activity }) => ({
            ...activity,
            readinessTransition: activity.eventType === "passport.readiness_changed" ? parseVehiclePassportReadinessTransition(metadata) : null,
          })),
          operationalCounts: { openReservationCount: openReservations.length, activeRentalCount: activeRentals.length },
        };
      }),

      save: protectedProcedure.input(z.object({
        vehicleId: z.string().trim().min(2).max(96),
        vehicleName: z.string().trim().min(2).max(180),
        acquisitionStatus: z.enum(["not_recorded", "owned", "leased", "partner_managed", "retired"]),
        readinessStatus: z.enum(["not_ready", "inspection_due", "maintenance_due", "available", "reserved", "active_rental", "out_of_service", "retired"]),
        stockNumber: z.string().trim().max(96).optional(),
        vinLast4: z.string().trim().regex(/^$|^[A-Za-z0-9]{4}$/, "Enter only the final four VIN characters.").optional(),
        plateNumber: z.string().trim().max(32).optional(),
        currentLocation: z.string().trim().max(255).optional(),
        currentOdometer: z.number().int().min(0).optional(),
        fuelOrChargeLevel: z.string().trim().max(80).optional(),
        acquisitionReference: z.string().trim().max(160).optional(),
        insurancePolicyReference: z.string().trim().max(160).optional(),
        notes: z.string().trim().max(4000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle Passport records are temporarily unavailable." });
        const values = { ...input, stockNumber: input.stockNumber || null, vinLast4: input.vinLast4 || null, plateNumber: input.plateNumber || null, currentLocation: input.currentLocation || null, currentOdometer: input.currentOdometer ?? null, fuelOrChargeLevel: input.fuelOrChargeLevel || null, acquisitionReference: input.acquisitionReference || null, insurancePolicyReference: input.insurancePolicyReference || null, notes: input.notes || null };
        const existing = await db.select({ id: vehiclePassports.id, readinessStatus: vehiclePassports.readinessStatus }).from(vehiclePassports).where(eq(vehiclePassports.vehicleId, input.vehicleId)).limit(1);
        if (existing[0]) {
          await db.update(vehiclePassports).set(values).where(eq(vehiclePassports.id, existing[0].id));
          const readinessChanged = existing[0].readinessStatus !== input.readinessStatus;
          await recordVehiclePassportActivity(db, {
            vehiclePassportId: existing[0].id,
            actorUserId: ctx.user.id,
            eventType: readinessChanged ? "passport.readiness_changed" : "passport.updated",
            metadata: readinessChanged
              ? { fromReadinessStatus: existing[0].readinessStatus, toReadinessStatus: input.readinessStatus }
              : { readinessStatus: input.readinessStatus },
          });
          return { success: true, passportId: existing[0].id, updated: true };
        }
        const created = await db.insert(vehiclePassports).values(values);
        const passportId = Number(created[0].insertId);
        await recordVehiclePassportActivity(db, { vehiclePassportId: passportId, actorUserId: ctx.user.id, eventType: "passport.created", metadata: { readinessStatus: input.readinessStatus } });
        return { success: true, passportId, updated: false };
      }),

      uploadDocument: protectedProcedure.input(z.object({
        vehiclePassportId: z.number().int().positive(),
        documentType: z.enum(["registration", "insurance"]),
        filename: z.string().trim().min(1).max(180),
        contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
        base64: z.string().min(40),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle Passport documents are temporarily unavailable." });
        const passport = (await db.select({ id: vehiclePassports.id }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1))[0];
        if (!passport) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
        const bytes = Buffer.from(input.base64, "base64");
        if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Vehicle Passport documents must be between 1 byte and 8 MB." });
        const extension = input.contentType === "application/pdf" ? "pdf" : input.contentType === "image/png" ? "png" : "jpg";
        const { key } = await storagePut(`vehicle-passport-documents/${passport.id}/${input.documentType}_${Date.now()}.${extension}`, bytes, input.contentType);
        const patch = input.documentType === "registration" ? { registrationDocumentKey: key } : { insuranceDocumentKey: key };
        await db.update(vehiclePassports).set(patch).where(eq(vehiclePassports.id, passport.id));
        await recordVehiclePassportActivity(db, { vehiclePassportId: passport.id, actorUserId: ctx.user.id, eventType: "passport.document_uploaded", metadata: { documentType: input.documentType } });
        return { success: true, documentType: input.documentType } as const;
      }),

      documentUrl: protectedProcedure.input(z.object({ vehiclePassportId: z.number().int().positive(), documentType: z.enum(["registration", "insurance"]) })).query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle Passport documents are temporarily unavailable." });
        const passport = (await db.select({ id: vehiclePassports.id, registrationDocumentKey: vehiclePassports.registrationDocumentKey, insuranceDocumentKey: vehiclePassports.insuranceDocumentKey }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1))[0];
        if (!passport) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
        const key = input.documentType === "registration" ? passport.registrationDocumentKey : passport.insuranceDocumentKey;
        if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "No document has been stored for this Vehicle Passport." });
        return { url: await storageGetSignedUrl(key) };
      }),

      recordInspection: protectedProcedure.input(z.object({
        vehiclePassportId: z.number().int().positive(),
        transactionId: z.number().int().positive().optional(),
        stage: z.enum(["intake", "pre_rental", "pickup", "return", "post_rental", "periodic", "maintenance_release"]),
        odometerReading: z.number().int().min(0).optional(),
        fuelOrChargeLevel: z.string().trim().max(80).optional(),
        tireCondition: z.string().trim().max(80).optional(),
        cleanliness: z.string().trim().max(80).optional(),
        damageNotes: z.string().trim().max(4000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Vehicle inspections are temporarily unavailable." });
        const passport = await db.select({ id: vehiclePassports.id }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1);
        if (!passport[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
        const created = await db.insert(vehicleOperationalInspections).values({ ...input, transactionId: input.transactionId ?? null, fuelOrChargeLevel: input.fuelOrChargeLevel || null, tireCondition: input.tireCondition || null, cleanliness: input.cleanliness || null, damageNotes: input.damageNotes || null, status: "submitted", inspectedByUserId: ctx.user.id, inspectedAt: new Date() });
        await recordVehiclePassportActivity(db, { vehiclePassportId: passport[0].id, actorUserId: ctx.user.id, eventType: "inspection.recorded", metadata: { stage: input.stage } });
        return { success: true, inspectionId: Number(created[0].insertId) };
      }),

      reviewInspection: protectedProcedure.input(z.object({
        inspectionId: z.number().int().positive(),
        status: z.enum(["reviewed", "needs_attention"]),
        reviewNote: z.string().trim().max(2_000).optional(),
      }).refine(input => input.status !== "needs_attention" || Boolean(input.reviewNote?.trim()), { message: "Add a review note when inspection needs attention." })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.reviewNote) assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Inspection review is temporarily unavailable." });
        const inspection = (await db.select({ id: vehicleOperationalInspections.id, vehiclePassportId: vehicleOperationalInspections.vehiclePassportId }).from(vehicleOperationalInspections).where(eq(vehicleOperationalInspections.id, input.inspectionId)).limit(1))[0];
        if (!inspection) throw new TRPCError({ code: "NOT_FOUND", message: "Operational inspection not found." });
        await db.update(vehicleOperationalInspections).set({ status: input.status, reviewNote: input.reviewNote?.trim() || null, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(vehicleOperationalInspections.id, inspection.id));
        await recordVehiclePassportActivity(db, { vehiclePassportId: inspection.vehiclePassportId, actorUserId: ctx.user.id, eventType: "inspection.reviewed", metadata: { status: input.status } });
        return { success: true, status: input.status, vehicleReadinessChanged: false };
      }),

      createMaintenance: protectedProcedure.input(z.object({
        vehiclePassportId: z.number().int().positive(),
        maintenanceType: z.enum(["scheduled_service", "repair", "recall", "tire", "cleaning", "inspection_follow_up", "other"]),
        dueAt: z.date().optional(),
        vendorName: z.string().trim().max(160).optional(),
        workOrderReference: z.string().trim().max(160).optional(),
        notes: z.string().trim().max(4000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Maintenance records are temporarily unavailable." });
        const passport = await db.select({ id: vehiclePassports.id }).from(vehiclePassports).where(eq(vehiclePassports.id, input.vehiclePassportId)).limit(1);
        if (!passport[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle Passport not found." });
        const created = await db.insert(vehicleMaintenanceRecords).values({ ...input, dueAt: input.dueAt ?? null, vendorName: input.vendorName || null, workOrderReference: input.workOrderReference || null, notes: input.notes || null, createdByUserId: ctx.user.id });
        await recordVehiclePassportActivity(db, { vehiclePassportId: passport[0].id, actorUserId: ctx.user.id, eventType: "maintenance.recorded", metadata: { maintenanceType: input.maintenanceType } });
        return { success: true, maintenanceId: Number(created[0].insertId) };
      }),

      updateMaintenanceStatus: protectedProcedure.input(z.object({
        maintenanceId: z.number().int().positive(),
        status: z.enum(["scheduled", "in_progress", "completed", "deferred", "canceled"]),
        completedAt: z.date().optional(),
      }).refine(input => input.status !== "completed" || Boolean(input.completedAt), { message: "Enter the staff-recorded completion date before marking maintenance complete." })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Maintenance records are temporarily unavailable." });
        const maintenance = (await db.select({ id: vehicleMaintenanceRecords.id, vehiclePassportId: vehicleMaintenanceRecords.vehiclePassportId }).from(vehicleMaintenanceRecords).where(eq(vehicleMaintenanceRecords.id, input.maintenanceId)).limit(1))[0];
        if (!maintenance) throw new TRPCError({ code: "NOT_FOUND", message: "Maintenance record not found." });
        await db.update(vehicleMaintenanceRecords).set({ status: input.status, completedAt: input.status === "completed" ? input.completedAt! : null }).where(eq(vehicleMaintenanceRecords.id, maintenance.id));
        await recordVehiclePassportActivity(db, { vehiclePassportId: maintenance.vehiclePassportId, actorUserId: ctx.user.id, eventType: "maintenance.status_updated", metadata: { status: input.status } });
        return { success: true, status: input.status, vehicleReadinessChanged: false } as const;
      }),

      uploadMaintenanceInvoice: protectedProcedure.input(z.object({
        maintenanceId: z.number().int().positive(),
        filename: z.string().trim().min(1).max(180),
        contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
        base64: z.string().min(40),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const invoiceUploadLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "vehicle_maintenance_invoice_upload", String(ctx.user.id)), limit: 12, windowMs: 60 * 60 * 1000 });
        if (!invoiceUploadLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many maintenance-invoice uploads. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Maintenance records are temporarily unavailable." });
        const maintenance = (await db.select({ id: vehicleMaintenanceRecords.id, vehiclePassportId: vehicleMaintenanceRecords.vehiclePassportId }).from(vehicleMaintenanceRecords).where(eq(vehicleMaintenanceRecords.id, input.maintenanceId)).limit(1))[0];
        if (!maintenance) throw new TRPCError({ code: "NOT_FOUND", message: "Maintenance record not found." });
        const bytes = Buffer.from(input.base64, "base64");
        if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Maintenance invoices must be between 1 byte and 8 MB." });
        const extension = input.contentType === "application/pdf" ? "pdf" : input.contentType === "image/png" ? "png" : "jpg";
        const { key } = await storagePut(`vehicle-maintenance-invoices/${maintenance.id}/invoice_${Date.now()}.${extension}`, bytes, input.contentType);
        await db.update(vehicleMaintenanceRecords).set({ invoiceDocumentKey: key }).where(eq(vehicleMaintenanceRecords.id, maintenance.id));
        await recordVehiclePassportActivity(db, { vehiclePassportId: maintenance.vehiclePassportId, actorUserId: ctx.user.id, eventType: "maintenance.invoice_uploaded" });
        return { success: true } as const;
      }),

      maintenanceInvoiceUrl: protectedProcedure.input(z.object({ maintenanceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Maintenance records are temporarily unavailable." });
        const maintenance = (await db.select({ invoiceDocumentKey: vehicleMaintenanceRecords.invoiceDocumentKey }).from(vehicleMaintenanceRecords).where(eq(vehicleMaintenanceRecords.id, input.maintenanceId)).limit(1))[0];
        if (!maintenance?.invoiceDocumentKey) throw new TRPCError({ code: "NOT_FOUND", message: "Maintenance invoice not found." });
        return { url: await storageGetSignedUrl(maintenance.invoiceDocumentKey) };
      }),
    }),

    handoff: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        return db.select({
          reference: vehicleTransactions.reference,
          transactionType: vehicleTransactions.transactionType,
          status: vehicleTransactions.status,
          vehicleName: vehicleTransactions.vehicleName,
          customerName: vehicleTransactions.contactName,
          requestedStartAt: transactionSchedules.requestedStartAt,
          requestedEndAt: transactionSchedules.requestedEndAt,
          pickupMethod: transactionSchedules.pickupMethod,
          pickupLocation: transactionSchedules.pickupLocation,
          deliveryAddress: transactionSchedules.deliveryAddress,
          scheduledHandoffAt: transactionSchedules.scheduledHandoffAt,
          estimatedArrivalAt: transactionSchedules.estimatedArrivalAt,
          assignedDriverName: transactionSchedules.assignedDriverName,
          handoffStatus: transactionSchedules.handoffStatus,
          handoffNotes: transactionSchedules.handoffNotes,
        }).from(transactionSchedules).innerJoin(vehicleTransactions, eq(transactionSchedules.transactionId, vehicleTransactions.id)).orderBy(desc(transactionSchedules.requestedStartAt));
      }),

      update: protectedProcedure.input(z.object({
        reference: z.string().trim().min(8).max(32),
        scheduledHandoffAt: z.coerce.date().optional(),
        estimatedArrivalAt: z.coerce.date().nullable().optional(),
        assignedDriverName: z.string().trim().min(2).max(160).optional(),
        handoffStatus: z.enum(["scheduled", "en_route", "arrived", "customer_verified", "completed", "missed", "cancelled"]),
        handoffNotes: z.string().trim().max(1_000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.handoffNotes) assertSafeRestrictedContent(input.handoffNotes, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Handoff operations are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const schedule = (await db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1))[0];
        if (!schedule) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Save customer schedule details before assigning a handoff." });
        const pickupStatus = input.handoffStatus === "customer_verified" ? "verified" : input.handoffStatus === "completed" ? "completed" : input.handoffStatus === "missed" ? "missed" : "pending";
        const estimatedArrivalAt = input.estimatedArrivalAt === undefined ? schedule.estimatedArrivalAt : input.estimatedArrivalAt;
        await db.update(transactionSchedules).set({ scheduledHandoffAt: input.scheduledHandoffAt ?? schedule.scheduledHandoffAt, estimatedArrivalAt, assignedDriverName: input.assignedDriverName ?? schedule.assignedDriverName, handoffStatus: input.handoffStatus, handoffNotes: input.handoffNotes ?? schedule.handoffNotes }).where(eq(transactionSchedules.id, schedule.id));
        if (transaction.transactionType === "rental") await db.update(vehicleTransactions).set({ pickupStatus }).where(eq(vehicleTransactions.id, transaction.id));
        else await db.update(vehicleTransactions).set({ deliveryStatus: pickupStatus === "verified" ? "verified" : pickupStatus === "completed" ? "completed" : pickupStatus === "missed" ? "missed" : "scheduled" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "handoff.updated", fromStatus: schedule.handoffStatus, toStatus: input.handoffStatus, note: input.handoffNotes ?? null, metadata: JSON.stringify({ pickupMethod: schedule.pickupMethod, scheduledHandoffAt: (input.scheduledHandoffAt ?? schedule.scheduledHandoffAt)?.toISOString() ?? null, estimatedArrivalAt: estimatedArrivalAt?.toISOString() ?? null, assignedDriverName: input.assignedDriverName ?? schedule.assignedDriverName ?? null }) });
        await deliverLifecycleInAppNotice(db, { userId: transaction.userId, title: "Handoff update", body: `DreamCarz updated the ${schedule.pickupMethod === "delivery" ? "delivery" : "pickup"} status for your rental to ${input.handoffStatus.replaceAll("_", " ")}. Review current details in your private rental record.`, actionPath: `/dashboard/transactions?ref=${encodeURIComponent(transaction.reference)}`, relatedTransactionId: transaction.id });
        return { success: true, handoffStatus: input.handoffStatus };
      }),
    }),

    rentalExtensions: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        return db.select({
          id: rentalExtensionRequests.id,
          reference: vehicleTransactions.reference,
          vehicleName: vehicleTransactions.vehicleName,
          customerName: vehicleTransactions.contactName,
          requestedEndDate: rentalExtensionRequests.requestedEndDate,
          customerNote: rentalExtensionRequests.customerNote,
          status: rentalExtensionRequests.status,
          requestedAt: rentalExtensionRequests.requestedAt,
          reviewNote: rentalExtensionRequests.reviewNote,
        }).from(rentalExtensionRequests)
          .innerJoin(vehicleTransactions, eq(rentalExtensionRequests.transactionId, vehicleTransactions.id))
          .orderBy(desc(rentalExtensionRequests.requestedAt));
      }),

      review: protectedProcedure.input(z.object({
        requestId: z.number().int().positive(),
        decision: z.enum(["approved", "declined"]),
        reviewNote: z.string().trim().min(2).max(1_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Extension review is temporarily unavailable." });
        const request = (await db.select().from(rentalExtensionRequests).where(eq(rentalExtensionRequests.id, input.requestId)).limit(1))[0];
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Extension request not found." });
        if (request.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "This extension request has already been reviewed." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.id, request.transactionId)).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This extension request is not linked to a rental transaction." });
        const schedule = (await db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, transaction.id)).limit(1))[0];
        if (!schedule?.requestedEndAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This rental has no active schedule to extend." });
        const requestedEndAt = new Date(`${request.requestedEndDate}T12:00:00Z`);
        if (requestedEndAt.getTime() <= schedule.requestedEndAt.getTime()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The requested extension date must be after the current schedule end date." });
        await db.update(rentalExtensionRequests).set({ status: input.decision, reviewNote: input.reviewNote, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(rentalExtensionRequests.id, request.id));
        if (input.decision === "approved") await db.update(transactionSchedules).set({ requestedEndAt }).where(eq(transactionSchedules.id, schedule.id));
        await db.insert(transactionEvents).values({
          transactionId: transaction.id,
          actorUserId: ctx.user.id,
          actorType: "admin",
          eventType: `rental.extension_${input.decision}`,
          fromStatus: transaction.status,
          toStatus: transaction.status,
          note: input.reviewNote,
          metadata: JSON.stringify({ extensionRequestId: request.id, requestedEndDate: request.requestedEndDate, scheduleChanged: input.decision === "approved" }),
        });
        await deliverLifecycleInAppNotice(db, { userId: transaction.userId, title: "Rental extension reviewed", body: input.decision === "approved" ? "DreamCarz approved your rental extension request. Your updated return date is available in your private rental record." : "DreamCarz reviewed your rental extension request and it was not approved. Your existing rental schedule has not changed.", actionPath: `/dashboard/transactions?ref=${encodeURIComponent(transaction.reference)}`, relatedTransactionId: transaction.id });
        return { success: true, status: input.decision, requestedEndDate: request.requestedEndDate };
      }),
    }),

    settlements: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        const settlements = await db.select({
          id: transactionSettlements.id,
          transactionId: transactionSettlements.transactionId,
          status: transactionSettlements.status,
          currency: transactionSettlements.currency,
          approvedSubtotalCents: transactionSettlements.approvedSubtotalCents,
          depositAppliedCents: transactionSettlements.depositAppliedCents,
          adjustmentsCents: transactionSettlements.adjustmentsCents,
          finalAmountCents: transactionSettlements.finalAmountCents,
          summary: transactionSettlements.summary,
          settledAt: transactionSettlements.settledAt,
          reference: vehicleTransactions.reference,
          vehicleName: vehicleTransactions.vehicleName,
          customerName: vehicleTransactions.contactName,
        }).from(transactionSettlements).innerJoin(vehicleTransactions, eq(transactionSettlements.transactionId, vehicleTransactions.id)).orderBy(desc(transactionSettlements.updatedAt));
        const adjustments = await db.select().from(transactionAdjustments).orderBy(desc(transactionAdjustments.createdAt));
        return settlements.map(settlement => ({ ...settlement, adjustments: adjustments.filter(adjustment => adjustment.settlementId === settlement.id) }));
      }),

      addAdjustment: protectedProcedure.input(z.object({
        reference: z.string().trim().min(8).max(32),
        adjustmentType: z.enum(["deposit", "damage", "toll", "ticket", "cleaning", "fuel_charge", "other"]),
        amountCents: z.number().int().min(0).max(5_000_000),
        description: z.string().trim().min(3).max(2_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        assertSafeRestrictedContent(input.description, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settlement records are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Return adjustments are available only for rental transactions." });
        const existing = (await db.select().from(transactionSettlements).where(eq(transactionSettlements.transactionId, transaction.id)).limit(1))[0];
        const settlementId = existing?.id ?? Number((await db.insert(transactionSettlements).values({ transactionId: transaction.id, status: "under_review", summary: "Return review in progress.", reviewedByUserId: ctx.user.id }))[0].insertId);
        const created = await db.insert(transactionAdjustments).values({ transactionId: transaction.id, settlementId, adjustmentType: input.adjustmentType, amountCents: input.amountCents, description: input.description, reviewedByUserId: ctx.user.id });
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "settlement.adjustment_added", fromStatus: transaction.settlementStatus, toStatus: "pending", note: input.description, metadata: JSON.stringify({ adjustmentId: Number(created[0].insertId), adjustmentType: input.adjustmentType, amountCents: input.amountCents }) });
        return { success: true, adjustmentId: Number(created[0].insertId) };
      }),

      reviewAdjustment: protectedProcedure.input(z.object({
        adjustmentId: z.number().int().positive(),
        status: z.enum(["approved", "waived", "disputed"]),
        reviewNote: z.string().trim().min(2).max(1_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settlement review is temporarily unavailable." });
        const adjustment = (await db.select().from(transactionAdjustments).where(eq(transactionAdjustments.id, input.adjustmentId)).limit(1))[0];
        if (!adjustment) throw new TRPCError({ code: "NOT_FOUND", message: "Settlement adjustment not found." });
        await db.update(transactionAdjustments).set({ status: input.status, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(transactionAdjustments.id, adjustment.id));
        await db.insert(transactionEvents).values({ transactionId: adjustment.transactionId, actorUserId: ctx.user.id, actorType: "admin", eventType: "settlement.adjustment_reviewed", fromStatus: adjustment.status, toStatus: input.status, note: input.reviewNote, metadata: JSON.stringify({ adjustmentId: adjustment.id, amountCents: adjustment.amountCents }) });
        return { success: true, status: input.status };
      }),

      finalize: protectedProcedure.input(z.object({
        reference: z.string().trim().min(8).max(32),
        approvedSubtotalCents: z.number().int().min(0).max(5_000_000),
        depositAppliedCents: z.number().int().min(0).max(5_000_000),
        status: z.enum(["under_review", "settled", "disputed", "waived"]),
        summary: z.string().trim().min(3).max(4_000),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        assertSafeRestrictedContent(input.summary, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Settlement records are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction || transaction.transactionType !== "rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Final settlement is available only for rental transactions." });
        const settlement = (await db.select().from(transactionSettlements).where(eq(transactionSettlements.transactionId, transaction.id)).limit(1))[0];
        if (!settlement) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Record an itemized adjustment or settlement review before finalizing." });
        const adjustments = await db.select().from(transactionAdjustments).where(eq(transactionAdjustments.settlementId, settlement.id));
        const approvedAdjustmentsCents = adjustments.filter(item => item.status === "approved").reduce((total, item) => total + item.amountCents, 0);
        const finalAmountCents = Math.max(0, input.approvedSubtotalCents - input.depositAppliedCents + approvedAdjustmentsCents);
        const settledAt = input.status === "settled" ? new Date() : null;
        await db.update(transactionSettlements).set({ status: input.status, approvedSubtotalCents: input.approvedSubtotalCents, depositAppliedCents: input.depositAppliedCents, adjustmentsCents: approvedAdjustmentsCents, finalAmountCents, summary: input.summary, reviewedByUserId: ctx.user.id, settledAt }).where(eq(transactionSettlements.id, settlement.id));
        await db.update(vehicleTransactions).set({ settlementStatus: input.status === "settled" ? "complete" : input.status === "disputed" ? "disputed" : input.status === "waived" ? "complete" : "pending" }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "settlement.finalized", fromStatus: transaction.settlementStatus, toStatus: input.status, note: input.summary, metadata: JSON.stringify({ settlementId: settlement.id, approvedSubtotalCents: input.approvedSubtotalCents, depositAppliedCents: input.depositAppliedCents, approvedAdjustmentsCents, finalAmountCents, paymentAction: "not_collected" }) });
        await deliverLifecycleInAppNotice(db, { userId: transaction.userId, title: "Return settlement reviewed", body: input.status === "disputed" ? "DreamCarz marked your return settlement for further review. No payment action is available in this notice." : "DreamCarz finalized a return settlement review. You can review the private, read-only settlement statement in your transaction record. This notice does not initiate payment collection.", actionPath: `/dashboard/transactions?ref=${encodeURIComponent(transaction.reference)}`, relatedTransactionId: transaction.id });
        return { success: true, finalAmountCents, status: input.status };
      }),
    }),

    fleetIncidents: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) return [];
        return db.select({
          id: vehicleIncidentRecords.id,
          transactionId: vehicleIncidentRecords.transactionId,
          incidentType: vehicleIncidentRecords.incidentType,
          severity: vehicleIncidentRecords.severity,
          status: vehicleIncidentRecords.status,
          reportedLocation: vehicleIncidentRecords.reportedLocation,
          occurredAt: vehicleIncidentRecords.occurredAt,
          description: vehicleIncidentRecords.description,
          hasEvidence: isNotNull(vehicleIncidentRecords.photoKeys),
          policeReportReference: vehicleIncidentRecords.policeReportReference,
          towReference: vehicleIncidentRecords.towReference,
          insuranceClaimReference: vehicleIncidentRecords.insuranceClaimReference,
          createdAt: vehicleIncidentRecords.createdAt,
          vehicleName: vehiclePassports.vehicleName,
          transactionReference: vehicleTransactions.reference,
          customerName: users.name,
          customerEmail: users.email,
        }).from(vehicleIncidentRecords)
          .innerJoin(vehiclePassports, eq(vehicleIncidentRecords.vehiclePassportId, vehiclePassports.id))
          .leftJoin(vehicleTransactions, eq(vehicleIncidentRecords.transactionId, vehicleTransactions.id))
          .leftJoin(users, eq(vehicleTransactions.userId, users.id))
          .orderBy(desc(vehicleIncidentRecords.createdAt));
      }),

      openEvidence: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), evidenceIndex: z.number().int().min(0).max(24).default(0) })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Incident evidence is temporarily unavailable." });
        const incident = (await db.select({ id: vehicleIncidentRecords.id, transactionId: vehicleIncidentRecords.transactionId, photoKeys: vehicleIncidentRecords.photoKeys }).from(vehicleIncidentRecords).where(eq(vehicleIncidentRecords.id, input.incidentId)).limit(1))[0];
        if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Fleet incident not found." });
        const evidenceKeys = parseStoredEvidenceKeys(incident.photoKeys);
        const evidenceKey = evidenceKeys[input.evidenceIndex];
        if (!evidenceKey) throw new TRPCError({ code: "NOT_FOUND", message: "Incident evidence is not available for this item." });
        if (incident.transactionId) await db.insert(transactionEvents).values({ transactionId: incident.transactionId, actorUserId: ctx.user.id, actorType: "admin", eventType: "fleet_incident.evidence_access_requested", metadata: JSON.stringify({ incidentId: incident.id, evidenceIndex: input.evidenceIndex }) });
        return { url: await storageGetSignedUrl(evidenceKey) };
      }),

      review: protectedProcedure.input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["under_review", "assigned", "resolved", "closed"]),
        vehicleReadiness: z.enum(["not_ready", "inspection_due", "maintenance_due", "available", "reserved", "active_rental", "out_of_service", "retired"]).optional(),
        note: z.string().trim().max(1000).optional(),
      })).mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fleet incident records are temporarily unavailable." });
        const rows = await db.select().from(vehicleIncidentRecords).where(eq(vehicleIncidentRecords.id, input.id)).limit(1);
        const incident = rows[0];
        if (!incident) throw new TRPCError({ code: "NOT_FOUND", message: "Fleet incident not found." });
        const resolving = ["resolved", "closed"].includes(input.status);
        await db.update(vehicleIncidentRecords).set({ status: input.status, resolvedByUserId: resolving ? ctx.user.id : null, resolvedAt: resolving ? new Date() : null }).where(eq(vehicleIncidentRecords.id, incident.id));
        if (input.vehicleReadiness) await db.update(vehiclePassports).set({ readinessStatus: input.vehicleReadiness }).where(eq(vehiclePassports.id, incident.vehiclePassportId));
        if (incident.transactionId) await db.insert(transactionEvents).values({ transactionId: incident.transactionId, actorUserId: ctx.user.id, actorType: "admin", eventType: "incident.review_updated", fromStatus: null, toStatus: input.status, note: input.note || null, metadata: JSON.stringify({ incidentId: incident.id, vehicleReadiness: input.vehicleReadiness ?? null }) });
        return { success: true, status: input.status };
      }),
    }),

    transactionDetail: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction records are temporarily unavailable." });
        const rows = await db.select({ transaction: vehicleTransactions, customerName: users.name, customerEmail: users.email })
          .from(vehicleTransactions).innerJoin(users, eq(vehicleTransactions.userId, users.id))
          .where(eq(vehicleTransactions.reference, input.reference)).limit(1);
        const record = rows[0];
        if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const [agreements, documents, consents, rawConditionReports, events, schedules, quotes, links] = await Promise.all([
          db.select().from(transactionAgreements).where(eq(transactionAgreements.transactionId, record.transaction.id)).orderBy(desc(transactionAgreements.updatedAt)),
          db.select({ id: transactionDocuments.id, documentType: transactionDocuments.documentType, originalFilename: transactionDocuments.originalFilename, contentType: transactionDocuments.contentType, status: transactionDocuments.status, createdAt: transactionDocuments.createdAt }).from(transactionDocuments).where(eq(transactionDocuments.transactionId, record.transaction.id)).orderBy(desc(transactionDocuments.createdAt)),
          db.select().from(transactionConsents).where(eq(transactionConsents.transactionId, record.transaction.id)).orderBy(desc(transactionConsents.acceptedAt)),
          db.select().from(vehicleConditionReports).where(eq(vehicleConditionReports.transactionId, record.transaction.id)).orderBy(desc(vehicleConditionReports.updatedAt)),
          db.select().from(transactionEvents).where(eq(transactionEvents.transactionId, record.transaction.id)).orderBy(desc(transactionEvents.createdAt)),
          db.select().from(transactionSchedules).where(eq(transactionSchedules.transactionId, record.transaction.id)).limit(1),
          db.select().from(transactionQuotes).where(eq(transactionQuotes.transactionId, record.transaction.id)).orderBy(desc(transactionQuotes.version)),
          db.select().from(transactionLinks).where(or(eq(transactionLinks.sourceTransactionId, record.transaction.id), eq(transactionLinks.targetTransactionId, record.transaction.id))).orderBy(desc(transactionLinks.updatedAt)),
        ]);
        const quoteLines = quotes.length ? await db.select().from(transactionQuoteLines).where(inArray(transactionQuoteLines.transactionQuoteId, quotes.map(quote => quote.id))).orderBy(desc(transactionQuoteLines.createdAt)) : [];
        const conditionReports = rawConditionReports.map(({ photoKeys, ...report }) => ({ ...report, hasEvidence: Boolean(photoKeys) }));
        const transaction = {
          ...record.transaction,
          paymentProviderTransactionId: record.transaction.paymentProviderTransactionId ? "redacted" : null,
          paymentProviderAuthorizationId: record.transaction.paymentProviderAuthorizationId ? "redacted" : null,
          paymentProviderCustomerVaultId: record.transaction.paymentProviderCustomerVaultId ? "redacted" : null,
          cocardCheckoutAttemptToken: record.transaction.cocardCheckoutAttemptToken ? "redacted" : null,
          stripeCustomerId: record.transaction.stripeCustomerId ? "redacted" : null,
          stripePaymentMethodId: record.transaction.stripePaymentMethodId ? "redacted" : null,
          stripeSetupIntentId: record.transaction.stripeSetupIntentId ? "redacted" : null,
          stripeCheckoutSessionId: record.transaction.stripeCheckoutSessionId ? "redacted" : null,
          stripePaymentIntentId: record.transaction.stripePaymentIntentId ? "redacted" : null,
        };
        const safeAgreements = agreements.map(({ signedDocumentKey, providerEnvelopeId, signerIpHash, ...agreement }) => ({
          ...agreement,
          signedDocumentKey: signedDocumentKey ? "redacted" : null,
          hasSignedDocument: Boolean(signedDocumentKey),
          hasProviderEnvelope: Boolean(providerEnvelopeId),
          hasSignerAudit: Boolean(signerIpHash),
        }));
        return { ...record, transaction, agreements: safeAgreements, documents, consents, conditionReports, events, schedule: schedules[0] ?? null, quotes: quotes.map(quote => ({ ...quote, lines: quoteLines.filter(line => line.transactionQuoteId === quote.id) })), links };
      }),

    updateTransactionStatus: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), nextStatus: z.enum(TRANSACTION_STATUSES), note: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const lifecycleStatusLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "transaction_lifecycle_status_change", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!lifecycleStatusLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many lifecycle status changes. Please try again later." });
        if (input.note) assertSafeRestrictedContent(input.note, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction operations are temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (!canTransitionTransaction(transaction.status, input.nextStatus)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "That transaction status change is not allowed from the current lifecycle stage." });
        if (input.nextStatus === "ready_for_pickup") {
          if (!hasVehicleReleaseReadiness(transaction)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Identity, license, eligibility, insurance, payment authorization, and a signed agreement must all be verified before vehicle release." });
          }
          if (transaction.transactionType === "rental" && !hasFutureRecordedInsuranceCoverage(transaction.insuranceDetails)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A future recorded insurance coverage date is required before vehicle release." });
          }
          if (transaction.transactionType === "rental" && !await hasReviewedRentalAdditionalDrivers(db, transaction.id)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Any added driver must complete separate identity and license review before vehicle release." });
          }
        }
        await db.update(vehicleTransactions).set({ status: input.nextStatus, currentStep: transactionStepForStatus(transaction.transactionType, input.nextStatus, transaction.currentStep) }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "transaction.status_changed", fromStatus: transaction.status, toStatus: input.nextStatus, note: input.note || null });
        return { success: true };
      }),

    reviewTransactionStates: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        identityStatus: z.enum(["not_started", "pending", "verified", "requires_input", "manual_review", "redacted"]).optional(),
        licenseStatus: z.enum(["not_started", "pending", "verified", "expired", "manual_review", "failed"]).optional(),
        eligibilityStatus: z.enum(["not_started", "pending", "cleared", "manual_review", "ineligible"]).optional(),
        insuranceStatus: z.enum(["not_required", "pending", "verified", "manual_review", "rejected"]).optional(),
        agreementStatus: z.enum(["not_required", "draft", "awaiting_signature", "signed", "declined", "voided"]).optional(),
        conditionStatus: z.enum(["not_started", "pickup_complete", "return_complete", "review_required"]).optional(),
        pickupStatus: z.enum(["not_applicable", "pending", "verified", "completed", "missed"]).optional(),
        returnStatus: z.enum(["not_applicable", "pending", "in_progress", "inspected", "complete"]).optional(),
        settlementStatus: z.enum(["not_applicable", "pending", "complete", "adjustment_required", "disputed"]).optional(),
        deliveryStatus: z.enum(["not_applicable", "pending", "scheduled", "verified", "completed", "missed"]).optional(),
        note: z.string().trim().max(2_000).optional(),
      }).refine(input => Object.entries(input).some(([key, value]) => key !== "reference" && key !== "note" && value !== undefined), { message: "Select at least one review status to update." }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const transactionStateReviewLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "transaction_state_review", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!transactionStateReviewLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many transaction state reviews. Please try again later." });
        if (input.note) assertSafeRestrictedContent(input.note, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction operations are temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const updates = Object.fromEntries(Object.entries(input).filter(([key, value]) => !["reference", "note"].includes(key) && value !== undefined));
        await db.update(vehicleTransactions).set(updates).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "transaction.review_states_updated", note: input.note || null, metadata: JSON.stringify(updates) });
        return { success: true };
      }),

    reviewEligibility: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), status: z.enum(["cleared", "manual_review", "unable_to_proceed"]), decisionReason: z.string().trim().min(3).max(2_000), ruleSnapshot: z.string().trim().max(10_000).optional(), eligibilityPolicyId: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const eligibilityReviewLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "eligibility_review", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!eligibilityReviewLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many eligibility reviews. Please try again later." });
        assertSafeRestrictedContent(input.decisionReason, "operational report");
        if (input.ruleSnapshot) assertSafeRestrictedContent(input.ruleSnapshot, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Eligibility records are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const policy = input.eligibilityPolicyId ? (await db.select().from(eligibilityPolicies).where(eq(eligibilityPolicies.id, input.eligibilityPolicyId)).limit(1))[0] : null;
        if (input.eligibilityPolicyId && (!policy || policy.status !== "active")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Select an active eligibility policy or complete this review without a policy snapshot." });
        if (policy?.scope === "specific_vehicle" && policy.vehicleId !== transaction.vehicleId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This eligibility policy does not apply to the selected transaction vehicle." });
        const policySnapshot = policy ? JSON.stringify({ policy: { id: policy.id, code: policy.code, name: policy.name, version: policy.version, scope: policy.scope, vehicleId: policy.vehicleId, approvalReference: policy.approvalReference }, ruleConfiguration: policy.ruleConfiguration, evaluation: "administrator_review" }) : input.ruleSnapshot ?? JSON.stringify({ version: "dreamcarz-eligibility-v1", source: "manual" });
        const assessment = (await db.select().from(transactionEligibilityAssessments).where(eq(transactionEligibilityAssessments.transactionId, transaction.id)).limit(1))[0];
        const vehicleEligibilityStatus = input.status === "unable_to_proceed" ? "ineligible" as const : input.status;
        await db.update(vehicleTransactions).set({ eligibilityStatus: vehicleEligibilityStatus }).where(eq(vehicleTransactions.id, transaction.id));
        if (assessment) {
          await db.update(transactionEligibilityAssessments).set({ status: input.status, decisionReason: input.decisionReason, ruleSnapshot: policySnapshot, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(transactionEligibilityAssessments.id, assessment.id));
        } else {
          await db.insert(transactionEligibilityAssessments).values({ transactionId: transaction.id, status: input.status, decisionReason: input.decisionReason, ruleSnapshot: policySnapshot, reviewedByUserId: ctx.user.id, reviewedAt: new Date() });
        }
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "eligibility.review_recorded", fromStatus: transaction.eligibilityStatus, toStatus: vehicleEligibilityStatus, note: input.decisionReason, metadata: JSON.stringify({ assessmentStatus: input.status, eligibilityPolicyId: policy?.id ?? null, eligibilityPolicyVersion: policy?.version ?? null }) });
        return { success: true, eligibilityStatus: vehicleEligibilityStatus };
      }),

    setTransactionPricing: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), pricingSummary: z.string().trim().min(5).max(5_000), cocardProductSku: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._-]+$/, "Use the exact CoCard Product Manager SKU.").optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction pricing is temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (transaction.currentStep !== "pricing") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Pricing may be recorded only while this transaction is in pricing review." });
        await db.update(vehicleTransactions).set({ pricingSnapshot: input.pricingSummary, cocardProductSku: input.cocardProductSku || null }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "pricing.approved_summary_recorded", metadata: JSON.stringify({ summaryLength: input.pricingSummary.length, cocardProductSkuRecorded: Boolean(input.cocardProductSku) }) });
        return { success: true };
      }),

    createTransactionQuote: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        currency: z.literal("USD").default("USD"),
        validUntil: z.coerce.date().optional(),
        cocardProductSku: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._-]+$/, "Use the exact CoCard Product Manager SKU."),
        lines: z.array(z.object({
          lineType: z.enum(["base_rental", "membership_discount", "tax", "fee", "protection", "deposit_authorization", "credit", "purchase_price", "trade_in_credit", "down_payment", "other"]),
          label: z.string().trim().min(2).max(160),
          amountCents: z.number().int().min(-500_000_000).max(500_000_000),
          isConditional: z.boolean().default(false),
        })).min(1).max(32),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction quoting is temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (!["pricing", "payment", "review"].includes(transaction.currentStep)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Quotes may be issued only after the transaction reaches pricing review." });
        const priorQuotes = await db.select().from(transactionQuotes).where(eq(transactionQuotes.transactionId, transaction.id)).orderBy(desc(transactionQuotes.version));
        const totalDueNowCents = input.lines.filter(line => !line.isConditional).reduce((total, line) => total + line.amountCents, 0);
        const conditionalTotalCents = input.lines.filter(line => line.isConditional).reduce((total, line) => total + line.amountCents, 0);
        if (priorQuotes.length) await db.update(transactionQuotes).set({ status: "superseded" }).where(and(eq(transactionQuotes.transactionId, transaction.id), inArray(transactionQuotes.status, ["draft", "approved"])));
        const quoteVersion = (priorQuotes[0]?.version ?? 0) + 1;
        const created = await db.insert(transactionQuotes).values({ transactionId: transaction.id, version: quoteVersion, status: "approved", currency: input.currency, totalDueNowCents, conditionalTotalCents, validUntil: input.validUntil ?? null, approvedByUserId: ctx.user.id, approvedAt: new Date() });
        const quoteId = Number(created[0].insertId);
        await db.insert(transactionQuoteLines).values(input.lines.map(line => ({ transactionQuoteId: quoteId, ...line })));
        await db.update(vehicleTransactions).set({ pricingSnapshot: JSON.stringify({ quoteId, version: quoteVersion, currency: input.currency, totalDueNowCents, conditionalTotalCents, validUntil: input.validUntil?.toISOString() ?? null }), cocardProductSku: input.cocardProductSku }).where(eq(vehicleTransactions.id, transaction.id));
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "pricing.quote_approved", metadata: JSON.stringify({ quoteId, version: quoteVersion, totalDueNowCents, conditionalTotalCents, lineCount: input.lines.length, cocardProductSkuRecorded: Boolean(input.cocardProductSku) }) });
        return { success: true, quoteId, version: quoteVersion, totalDueNowCents, conditionalTotalCents };
      }),

    requestLinkedTransaction: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), linkType: z.enum(["rent_to_buy", "swap"]), targetVehicleId: z.string().trim().min(4).max(96).optional() }))
      .mutation(async ({ ctx, input }) => {
        const linkedRequestLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "linked_transaction_request", String(ctx.user.id)), limit: 6, windowMs: 6 * 60 * 60 * 1000 });
        if (!linkedRequestLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many rent-to-buy or swap requests. Please wait before trying again." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction requests are temporarily unavailable." });
        const source = (await db.select().from(vehicleTransactions).where(and(eq(vehicleTransactions.reference, input.reference), eq(vehicleTransactions.userId, ctx.user.id))).limit(1))[0];
        if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (source.transactionType !== "rental" || source.status !== "active_rental") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Rent-to-buy and vehicle-swap requests are available after an active rental begins." });
        const vehicleId = input.linkType === "rent_to_buy" ? source.vehicleId : input.targetVehicleId;
        if (!vehicleId || !isApprovedTransactionVehicle(vehicleId)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a confirmed DreamCarz inventory vehicle for this request." });
        const vehicle = APPROVED_TRANSACTION_VEHICLES[vehicleId];
        const targetType = input.linkType === "rent_to_buy" ? "purchase" as const : "rental" as const;
        const existingLinks = await db.select().from(transactionLinks).where(and(eq(transactionLinks.sourceTransactionId, source.id), eq(transactionLinks.linkType, input.linkType), inArray(transactionLinks.status, ["requested", "under_review", "approved"]))).limit(1);
        if (existingLinks[0]) throw new TRPCError({ code: "CONFLICT", message: "A current request of this type already exists for this rental." });
        const lifecycle = initialTransactionLifecycle(targetType);
        const reference = `DC${targetType === "purchase" ? "B" : "S"}-${nanoid(10).toUpperCase()}`;
        const created = await db.insert(vehicleTransactions).values({ reference, userId: ctx.user.id, transactionType: targetType, vehicleId, vehicleName: vehicle.vehicleName, vehicleImage: vehicle.image, membershipPlan: source.membershipPlan, ...lifecycle, status: "initiated", currentStep: targetType === "rental" ? "dates" : "profile", contactName: source.contactName, contactEmail: source.contactEmail, contactPhone: source.contactPhone, addressLine1: source.addressLine1, addressLine2: source.addressLine2, city: source.city, state: source.state, postalCode: source.postalCode, identityStatus: source.identityStatus === "verified" ? "verified" : "not_started", licenseStatus: source.licenseStatus === "verified" ? "verified" : "not_started" });
        const targetTransactionId = Number(created[0].insertId);
        await db.insert(transactionLinks).values({ sourceTransactionId: source.id, targetTransactionId, linkType: input.linkType, requestedByUserId: ctx.user.id });
        await db.insert(transactionEvents).values([
          { transactionId: source.id, actorUserId: ctx.user.id, actorType: "customer", eventType: `transaction.${input.linkType}_requested`, metadata: JSON.stringify({ targetReference: reference, targetVehicleId: vehicleId }) },
          { transactionId: targetTransactionId, actorUserId: ctx.user.id, actorType: "customer", eventType: "transaction.linked_request_created", metadata: JSON.stringify({ sourceReference: source.reference, linkType: input.linkType }) },
        ]);
        return { success: true, reference, transactionType: targetType };
      }),

    getTransactionRecordLink: protectedProcedure
      .input(z.object({ transactionId: z.number().int().positive(), source: z.enum(["document", "agreement"]), recordId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const secureRecordLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "admin_secure_transaction_record_link", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!secureRecordLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many secure transaction record requests. Please try again later." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Secure records are temporarily unavailable." });
        const transactions = await db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(eq(vehicleTransactions.id, input.transactionId)).limit(1);
        if (!transactions[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const record = input.source === "document"
          ? (await db.select({ key: transactionDocuments.storageKey }).from(transactionDocuments).where(and(eq(transactionDocuments.id, input.recordId), eq(transactionDocuments.transactionId, input.transactionId))).limit(1))[0]
          : (await db.select({ key: transactionAgreements.signedDocumentKey }).from(transactionAgreements).where(and(eq(transactionAgreements.id, input.recordId), eq(transactionAgreements.transactionId, input.transactionId))).limit(1))[0];
        if (!record?.key) throw new TRPCError({ code: "NOT_FOUND", message: "A secure record is not available for this item." });
        await db.insert(transactionEvents).values({ transactionId: input.transactionId, actorUserId: ctx.user.id, actorType: "admin", eventType: "secure_record.access_requested", metadata: JSON.stringify({ source: input.source }) });
        return { url: await storageGetSignedUrl(record.key) };
      }),

    reviewApplication: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "needs_attention", "declined"]), reviewNote: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const rentalApplicationReviewLimit = consumeRateLimit({ key: rateLimitKey(ctx.req, "rental_application_review", String(ctx.user.id)), limit: 30, windowMs: 60 * 60_000 });
        if (!rentalApplicationReviewLimit.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many rental application reviews. Please try again later." });
        if (input.reviewNote) assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operations are temporarily unavailable." });
        await db.update(rentalApplications).set({
          status: input.status,
          identityVerificationStatus: input.status === "approved" ? "verified" : "manual_review",
          reviewNote: input.reviewNote || null,
          reviewedAt: new Date(),
        }).where(eq(rentalApplications.id, input.id));
        return { success: true };
      }),

    reviewReservation: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["under_review", "confirmed", "change_requested", "declined"]), reviewNote: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.reviewNote) assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operations are temporarily unavailable." });
        await db.update(reservationRequests).set({ status: input.status, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(eq(reservationRequests.id, input.id));
        return { success: true };
      }),

    reviewServiceReport: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["under_review", "assigned", "resolved", "closed"]), reviewNote: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        if (input.reviewNote) assertSafeRestrictedContent(input.reviewNote, "operational report");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operations are temporarily unavailable." });
        await db.update(serviceReports).set({ status: input.status, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(eq(serviceReports.id, input.id));
        await db.insert(serviceReportReviewEvents).values({ reportId: input.id, reviewerId: ctx.user.id, status: input.status, note: input.reviewNote || null });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
