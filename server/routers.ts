import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { referralProfiles, referrals, commissions } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

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
});

export type AppRouter = typeof appRouter;
