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
  transactionConsents,
  transactionDocuments,
  users,
  serviceReports,
  serviceReportPhotos,
  serviceReportReviewEvents,
  partnerLocations,
} from "../drizzle/schema";
import { eq, and, desc, inArray, isNotNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { filterPartnerDirectory, partnerActivationValue } from "../shared/partnerDirectory";
import { orderServiceReportTimeline } from "../shared/serviceReportTimeline";
import { z } from "zod";
import { storageGetSignedUrl, storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { parse } from "cookie";
import { canMemberCancelReservation, hasValidReservationDateRange } from "../shared/reservationRequest";
import { hasCompleteRentalInquiry, vehicleInquiryReferencePrefix } from "../shared/vehicleInquiry";
import {
  APPROVED_TRANSACTION_VEHICLES,
  canReuseProfileVerification,
  initialTransactionLifecycle,
  isApprovedTransactionVehicle,
  isTransactionStep,
  TRANSACTION_MEMBERSHIP_PLANS,
  TRANSACTION_REFERENCE_PREFIX,
} from "../shared/transactionLifecycle";

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
        await db.update(vehicleTransactions).set({ currentStep: input.currentStep }).where(eq(vehicleTransactions.id, transaction.id));
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
