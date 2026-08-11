import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  referralProfiles,
  referrals,
  commissions,
  rentalApplications,
  rentalApplicationDocuments,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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

    // Get the user's direct downline
    getDownline: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(referrals).where(eq(referrals.referrerId, ctx.user.id));
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
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthCommissions = await db.select().from(commissions).where(and(eq(commissions.userId, ctx.user.id), eq(commissions.month, thisMonth))).limit(1);
      return {
        teamSize: directReferrals.length,
        directReferrals: directReferrals.length,
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
});

export type AppRouter = typeof appRouter;
