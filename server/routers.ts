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
  rentalApplications,
  rentalApplicationDocuments,
  customerProfiles,
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
  membershipPlans,
  membershipBenefits,
  customerMemberships,
  walletAccounts,
  walletLedgerEntries,
  transactionEligibilityAssessments,
} from "../drizzle/schema";
import { eq, and, desc, inArray, isNotNull, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { filterPartnerDirectory, partnerActivationValue } from "../shared/partnerDirectory";
import { orderServiceReportTimeline } from "../shared/serviceReportTimeline";
import { z } from "zod";
import { storageGetSignedUrl, storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { parse } from "cookie";
import { createHash } from "node:crypto";
import { DREAMCARZ_LEDGER_REFERENCE_PREFIX, DREAMCARZ_MEMBERSHIP_BENEFIT_TYPES, DREAMCARZ_WALLET_ENTRY_TYPES, summarizeWalletLedger } from "../shared/dreamcarzOs";
import { canMemberCancelReservation, hasValidReservationDateRange } from "../shared/reservationRequest";
import { hasCompleteRentalInquiry, vehicleInquiryReferencePrefix } from "../shared/vehicleInquiry";
import { createStripeIdentityVerificationSession, getIdentityProviderStatus } from "./identityProvider";
import { cocardPaymentSetupBlocker, getPaymentProviderStatus, verifyCoCardCheckoutReturn } from "./paymentProvider";
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

function nativeSignatureHash(input: { agreementId: number; signerName: string; acknowledgedAt: Date; contentSnapshot: string }) {
  return createHash("sha256").update([input.agreementId, input.signerName, input.acknowledgedAt.toISOString(), input.contentSnapshot, process.env.JWT_SECRET ?? "dreamcarz-native-signature"].join("|"), "utf8").digest("hex");
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
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const user = await registerDirectAccount(input);
        if (!user) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists. Please sign in instead." });
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
      const [profiles, activeRoles, memberships, wallets, transactions] = await Promise.all([
        db.select().from(customerProfiles).where(eq(customerProfiles.userId, ctx.user.id)).limit(1),
        db.select({ role: userRoleAssignments.role }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId, ctx.user.id), isNull(userRoleAssignments.revokedAt))),
        db.select({ membership: customerMemberships, plan: membershipPlans }).from(customerMemberships).innerJoin(membershipPlans, eq(customerMemberships.membershipPlanId, membershipPlans.id)).where(and(eq(customerMemberships.userId, ctx.user.id), eq(customerMemberships.status, "active"))).orderBy(desc(customerMemberships.updatedAt)).limit(1),
        db.select().from(walletAccounts).where(eq(walletAccounts.userId, ctx.user.id)).limit(1),
        db.select({ reference: vehicleTransactions.reference, transactionType: vehicleTransactions.transactionType, vehicleName: vehicleTransactions.vehicleName, status: vehicleTransactions.status, updatedAt: vehicleTransactions.updatedAt }).from(vehicleTransactions).where(eq(vehicleTransactions.userId, ctx.user.id)).orderBy(desc(vehicleTransactions.updatedAt)).limit(12),
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
        roles: activeRoles.map(record => record.role),
        membership: membership ? { ...membership.membership, plan: membership.plan, benefits } : null,
        wallet: wallet ? { account: wallet, ...walletSummary, entries: ledgerEntries } : null,
        transactions,
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Membership configuration is temporarily unavailable." });
        const created = await db.insert(membershipPlans).values({ ...input, description: input.description || null, enrollmentFeeCents: input.enrollmentFeeCents ?? null, monthlyFeeCents: input.monthlyFeeCents ?? null, isActive: input.activate });
        return { success: true, planId: Number(created[0].insertId) };
      }),
    addBenefit: protectedProcedure
      .input(z.object({ membershipPlanId: z.number().int().positive(), benefitType: z.enum(DREAMCARZ_MEMBERSHIP_BENEFIT_TYPES), label: z.string().trim().min(2).max(160), configuration: z.string().trim().min(2).max(5_000), activate: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
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
          membershipPlan: input.membershipPlan ?? null,
          ...lifecycle,
          status: initialStatus,
          currentStep: profileComplete ? (input.transactionType === "rental" ? "contact_verification" : "identity") : lifecycle.currentStep,
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
          ruleSnapshot: JSON.stringify({ version: "dreamcarz-eligibility-v1", requiresManualReview: true, transactionType: input.transactionType, vehicleId: input.vehicleId }),
        });
        await db.insert(transactionEvents).values({
          transactionId,
          actorUserId: ctx.user.id,
          actorType: "customer",
          eventType: "transaction.initiated",
          toStatus: initialStatus,
          metadata: JSON.stringify({ vehicleId: input.vehicleId, transactionType: input.transactionType, membershipPlan: input.membershipPlan ?? null, profileVerificationReused: profileVerificationReusable, manualReviewRequired: withdrawnConsents.length > 0 }),
        });
        return { success: true, resumed: false, reference, transactionType: input.transactionType };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(vehicleTransactions)
        .where(eq(vehicleTransactions.userId, ctx.user.id))
        .orderBy(desc(vehicleTransactions.updatedAt));
    }),

    identityProviderStatus: protectedProcedure.query(() => getIdentityProviderStatus()),

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

    submitConditionReport: protectedProcedure
      .input(z.object({
        reference: z.string().trim().min(8).max(32),
        stage: z.enum(["pickup", "return"]),
        odometerReading: z.number().int().min(0).max(2_000_000).optional(),
        fuelLevel: z.string().trim().max(32).optional(),
        notes: z.string().trim().max(2_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
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
        await db.insert(vehicleConditionReports).values({
          transactionId: transaction.id,
          stage: input.stage,
          completedByUserId: ctx.user.id,
          odometerReading: input.odometerReading,
          fuelLevel: input.fuelLevel,
          notes: input.notes,
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
          metadata: JSON.stringify({ stage: input.stage, hasOdometerReading: input.odometerReading !== undefined, hasFuelLevel: Boolean(input.fuelLevel), hasNotes: Boolean(input.notes) }),
        });
        return { success: true };
      }),

    backOffice: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Back-office records are temporarily unavailable." });
      const [profiles, legacyLicenseDocuments, transactionLicenseDocuments, agreements] = await Promise.all([
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
        agreements: agreements.map(({ signedDocumentKey, ...agreement }) => ({ ...agreement, hasSignedDocument: Boolean(signedDocumentKey) })),
      };
    }),

    getRecordLink: protectedProcedure
      .input(z.object({ recordType: z.enum(["legacy_license_document", "transaction_license_document", "agreement"]), id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
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
        if (input.recordType === "transaction_license_document") {
          const documents = await db.select({ storageKey: transactionDocuments.storageKey })
            .from(transactionDocuments)
            .innerJoin(vehicleTransactions, eq(transactionDocuments.transactionId, vehicleTransactions.id))
            .where(and(eq(transactionDocuments.id, input.id), eq(vehicleTransactions.userId, ctx.user.id)))
            .limit(1);
          if (!documents[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Driver-license record not found." });
          return { url: await storageGetSignedUrl(documents[0].storageKey) };
        }
        const agreements = await db.select({ signedDocumentKey: transactionAgreements.signedDocumentKey })
          .from(transactionAgreements)
          .innerJoin(vehicleTransactions, eq(transactionAgreements.transactionId, vehicleTransactions.id))
          .where(and(eq(transactionAgreements.id, input.id), eq(vehicleTransactions.userId, ctx.user.id)))
          .limit(1);
        const agreement = agreements[0];
        if (!agreement) throw new TRPCError({ code: "NOT_FOUND", message: "Agreement record not found." });
        if (!agreement.signedDocumentKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A signed agreement file is not available yet." });
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
        return { transaction, profile: profiles[0] ?? null };
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
      .input(z.object({ agreementType: z.enum(["rental", "purchase"]), version: z.string().trim().min(1).max(64), title: z.string().trim().min(3).max(160), content: z.string().trim().min(40).max(50_000), legalApprovalReference: z.string().trim().min(2).max(255), legallyApproved: z.literal(true), activate: z.boolean().default(true) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Agreement templates are temporarily unavailable." });
        if (input.activate) await db.update(agreementTemplates).set({ isActive: false }).where(eq(agreementTemplates.agreementType, input.agreementType));
        const result = await db.insert(agreementTemplates).values({ agreementType: input.agreementType, version: input.version, title: input.title, content: input.content, legalApprovalReference: input.legalApprovalReference, legalApprovedAt: new Date(), legalApprovedByUserId: ctx.user.id, isActive: input.activate });
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

  operations: router({
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
        const [agreements, documents, consents, conditionReports, events] = await Promise.all([
          db.select().from(transactionAgreements).where(eq(transactionAgreements.transactionId, record.transaction.id)).orderBy(desc(transactionAgreements.updatedAt)),
          db.select({ id: transactionDocuments.id, documentType: transactionDocuments.documentType, originalFilename: transactionDocuments.originalFilename, contentType: transactionDocuments.contentType, status: transactionDocuments.status, createdAt: transactionDocuments.createdAt }).from(transactionDocuments).where(eq(transactionDocuments.transactionId, record.transaction.id)).orderBy(desc(transactionDocuments.createdAt)),
          db.select().from(transactionConsents).where(eq(transactionConsents.transactionId, record.transaction.id)).orderBy(desc(transactionConsents.acceptedAt)),
          db.select().from(vehicleConditionReports).where(eq(vehicleConditionReports.transactionId, record.transaction.id)).orderBy(desc(vehicleConditionReports.updatedAt)),
          db.select().from(transactionEvents).where(eq(transactionEvents.transactionId, record.transaction.id)).orderBy(desc(transactionEvents.createdAt)),
        ]);
        return { ...record, agreements, documents, consents, conditionReports, events };
      }),

    updateTransactionStatus: protectedProcedure
      .input(z.object({ reference: z.string().trim().min(8).max(32), nextStatus: z.enum(TRANSACTION_STATUSES), note: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transaction operations are temporarily unavailable." });
        const rows = await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1);
        const transaction = rows[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        if (!canTransitionTransaction(transaction.status, input.nextStatus)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "That transaction status change is not allowed from the current lifecycle stage." });
        if (input.nextStatus === "ready_for_pickup" && !hasVehicleReleaseReadiness(transaction)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Identity, license, eligibility, insurance, payment authorization, and a signed agreement must all be verified before vehicle release." });
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
      .input(z.object({ reference: z.string().trim().min(8).max(32), status: z.enum(["cleared", "manual_review", "unable_to_proceed"]), decisionReason: z.string().trim().min(3).max(2_000), ruleSnapshot: z.string().trim().max(10_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Eligibility records are temporarily unavailable." });
        const transaction = (await db.select().from(vehicleTransactions).where(eq(vehicleTransactions.reference, input.reference)).limit(1))[0];
        if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const assessment = (await db.select().from(transactionEligibilityAssessments).where(eq(transactionEligibilityAssessments.transactionId, transaction.id)).limit(1))[0];
        const vehicleEligibilityStatus = input.status === "unable_to_proceed" ? "ineligible" as const : input.status;
        await db.update(vehicleTransactions).set({ eligibilityStatus: vehicleEligibilityStatus }).where(eq(vehicleTransactions.id, transaction.id));
        if (assessment) {
          await db.update(transactionEligibilityAssessments).set({ status: input.status, decisionReason: input.decisionReason, ruleSnapshot: input.ruleSnapshot ?? assessment.ruleSnapshot, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(transactionEligibilityAssessments.id, assessment.id));
        } else {
          await db.insert(transactionEligibilityAssessments).values({ transactionId: transaction.id, status: input.status, decisionReason: input.decisionReason, ruleSnapshot: input.ruleSnapshot ?? JSON.stringify({ version: "dreamcarz-eligibility-v1", source: "manual" }), reviewedByUserId: ctx.user.id, reviewedAt: new Date() });
        }
        await db.insert(transactionEvents).values({ transactionId: transaction.id, actorUserId: ctx.user.id, actorType: "admin", eventType: "eligibility.review_recorded", fromStatus: transaction.eligibilityStatus, toStatus: vehicleEligibilityStatus, note: input.decisionReason, metadata: JSON.stringify({ assessmentStatus: input.status }) });
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

    getTransactionRecordLink: protectedProcedure
      .input(z.object({ transactionId: z.number().int().positive(), source: z.enum(["document", "agreement"]), recordId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Secure records are temporarily unavailable." });
        const transactions = await db.select({ id: vehicleTransactions.id }).from(vehicleTransactions).where(eq(vehicleTransactions.id, input.transactionId)).limit(1);
        if (!transactions[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
        const record = input.source === "document"
          ? (await db.select({ key: transactionDocuments.storageKey }).from(transactionDocuments).where(and(eq(transactionDocuments.id, input.recordId), eq(transactionDocuments.transactionId, input.transactionId))).limit(1))[0]
          : (await db.select({ key: transactionAgreements.signedDocumentKey }).from(transactionAgreements).where(and(eq(transactionAgreements.id, input.recordId), eq(transactionAgreements.transactionId, input.transactionId))).limit(1))[0];
        if (!record?.key) throw new TRPCError({ code: "NOT_FOUND", message: "A secure record is not available for this item." });
        return { url: await storageGetSignedUrl(record.key) };
      }),

    reviewApplication: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "needs_attention", "declined"]), reviewNote: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
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
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operations are temporarily unavailable." });
        await db.update(reservationRequests).set({ status: input.status, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(eq(reservationRequests.id, input.id));
        return { success: true };
      }),

    reviewServiceReport: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["under_review", "assigned", "resolved", "closed"]), reviewNote: z.string().trim().max(2_000).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Operations are temporarily unavailable." });
        await db.update(serviceReports).set({ status: input.status, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(eq(serviceReports.id, input.id));
        await db.insert(serviceReportReviewEvents).values({ reportId: input.id, reviewerId: ctx.user.id, status: input.status, note: input.reviewNote || null });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
