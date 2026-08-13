import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Direct DreamCarz Authentication ─────────────────────────────────────────

export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const authSessions = mysqlTable("auth_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Drive Network Referral Tracking ──────────────────────────────────────────

export const referralProfiles = mysqlTable("referral_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  rank: mysqlEnum("rank", ["associate", "driver", "road_captain", "fleet_director", "elite_executive", "dream_ambassador"]).default("associate").notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredId: int("referredId").notNull().unique(),
  level: int("level").default(1).notNull(),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending").notNull(),
  bonusPaid: int("bonusPaid").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const commissions = mysqlTable("commissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  referralBonus: int("referralBonus").default(0).notNull(),
  residualIncome: int("residualIncome").default(0).notNull(),
  dcpMatching: int("dcpMatching").default(0).notNull(),
  rankBonus: int("rankBonus").default(0).notNull(),
  total: int("total").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Rental Onboarding & Identity Verification ───────────────────────────────

export const rentalApplications = mysqlTable("rental_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: mysqlEnum("status", [
    "not_started",
    "in_progress",
    "submitted",
    "under_review",
    "approved",
    "needs_attention",
    "declined",
  ]).default("not_started").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  phone: varchar("phone", { length: 32 }),
  addressLine1: varchar("addressLine1", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 64 }),
  postalCode: varchar("postalCode", { length: 24 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  licenseState: varchar("licenseState", { length: 64 }),
  licenseClass: varchar("licenseClass", { length: 24 }),
  licenseExpiresOn: varchar("licenseExpiresOn", { length: 10 }),
  drivingExperience: varchar("drivingExperience", { length: 32 }),
  recentClaims: varchar("recentClaims", { length: 32 }),
  preferredVehicleClasses: text("preferredVehicleClasses"),
  rentalPurpose: varchar("rentalPurpose", { length: 64 }),
  pickupLocation: varchar("pickupLocation", { length: 255 }),
  requestedStartDate: varchar("requestedStartDate", { length: 10 }),
  requestedEndDate: varchar("requestedEndDate", { length: 10 }),
  identityVerificationStatus: mysqlEnum("identityVerificationStatus", [
    "not_started",
    "documents_uploaded",
    "pending_review",
    "verified",
    "manual_review",
    "failed",
  ]).default("not_started").notNull(),
  verificationProvider: varchar("verificationProvider", { length: 64 }),
  identityConsentAt: timestamp("identityConsentAt"),
  rentalTermsConsentAt: timestamp("rentalTermsConsentAt"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rentalApplicationDocuments = mysqlTable("rental_application_documents", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["license_front", "license_back", "live_selfie"]).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Vehicle Reservation Requests ────────────────────────────────────────────

export const reservationRequests = mysqlTable("reservation_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  vehicleId: int("vehicleId").notNull(),
  vehicleName: varchar("vehicleName", { length: 160 }).notNull(),
  vehicleCategory: varchar("vehicleCategory", { length: 48 }).notNull(),
  vehicleImage: varchar("vehicleImage", { length: 512 }).notNull(),
  memberTier: mysqlEnum("memberTier", ["freedom", "plus", "pro", "elite"]).notNull(),
  estimatedWeeklyFee: int("estimatedWeeklyFee").notNull(),
  requestedStartDate: varchar("requestedStartDate", { length: 10 }).notNull(),
  requestedEndDate: varchar("requestedEndDate", { length: 10 }).notNull(),
  pickupLocation: varchar("pickupLocation", { length: 255 }).notNull(),
  dropoffLocation: varchar("dropoffLocation", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 32 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["submitted", "under_review", "confirmed", "change_requested", "canceled", "declined"])
    .default("submitted")
    .notNull(),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Service & Incident Reports ─────────────────────────────────────────────

export const serviceReports = mysqlTable("service_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  vehicleName: varchar("vehicleName", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  reportedLocation: varchar("reportedLocation", { length: 255 }),
  urgency: mysqlEnum("urgency", ["standard", "urgent"]).default("standard").notNull(),
  status: mysqlEnum("status", ["submitted", "under_review", "assigned", "resolved", "closed"])
    .default("submitted")
    .notNull(),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const serviceReportPhotos = mysqlTable("service_report_photos", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  userId: int("userId").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const serviceReportReviewEvents = mysqlTable("service_report_review_events", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  reviewerId: int("reviewerId"),
  status: mysqlEnum("status", ["submitted", "under_review", "assigned", "resolved", "closed"]).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const partnerLocations = mysqlTable("partner_locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 16 }).notNull(),
  postalCode: varchar("postalCode", { length: 24 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  hours: varchar("hours", { length: 255 }),
  description: text("description"),
  tags: text("tags"),
  latitude: varchar("latitude", { length: 24 }),
  longitude: varchar("longitude", { length: 24 }),
  isInNetwork: int("isInNetwork").default(1).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralProfile = typeof referralProfiles.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type RentalApplication = typeof rentalApplications.$inferSelect;
export type RentalApplicationDocument = typeof rentalApplicationDocuments.$inferSelect;
export type ReservationRequest = typeof reservationRequests.$inferSelect;
export type ServiceReport = typeof serviceReports.$inferSelect;
export type ServiceReportPhoto = typeof serviceReportPhotos.$inferSelect;
export type ServiceReportReviewEvent = typeof serviceReportReviewEvents.$inferSelect;
