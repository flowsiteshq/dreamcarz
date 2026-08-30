import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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

// ── DreamCarz OS access, membership, eligibility, and wallet foundations ───

/**
 * Named role assignments expand the original user/admin distinction without
 * changing existing account access. The legacy users.role field remains the
 * compatibility bridge until all staff accounts receive explicit assignments.
 */
export const userRoleAssignments = mysqlTable("user_role_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["customer", "associate", "fleet_partner", "operations", "support", "manager", "administrator"]).notNull(),
  assignedByUserId: int("assignedByUserId"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => [uniqueIndex("user_role_assignment_unique").on(table.userId, table.role)]);

/** Configurable memberships are deliberately unseeded until approved plans and benefits are supplied. */
export const membershipPlans = mysqlTable("membership_plans", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  enrollmentFeeCents: int("enrollmentFeeCents"),
  monthlyFeeCents: int("monthlyFeeCents"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const membershipBenefits = mysqlTable("membership_benefits", {
  id: int("id").autoincrement().primaryKey(),
  membershipPlanId: int("membershipPlanId").notNull(),
  benefitType: mysqlEnum("benefitType", ["vehicle_access", "rental_discount", "deposit_adjustment", "rental_credit", "delivery_credit", "upgrade_priority", "partner_benefit", "other"]).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  configuration: text("configuration").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const customerMemberships = mysqlTable("customer_memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  membershipPlanId: int("membershipPlanId").notNull(),
  status: mysqlEnum("status", ["pending", "active", "paused", "canceled", "expired"]).default("pending").notNull(),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  providerSubscriptionReference: varchar("providerSubscriptionReference", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const membershipEvents = mysqlTable("membership_events", {
  id: int("id").autoincrement().primaryKey(),
  customerMembershipId: int("customerMembershipId").notNull(),
  actorUserId: int("actorUserId"),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  previousStatus: varchar("previousStatus", { length: 48 }),
  nextStatus: varchar("nextStatus", { length: 48 }),
  note: text("note"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * A specific assessment is bound to a transaction. It records a human or
 * provider-supported eligibility outcome without assigning fraud labels.
 */
export const transactionEligibilityAssessments = mysqlTable("transaction_eligibility_assessments", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull().unique(),
  status: mysqlEnum("status", ["pending", "cleared", "manual_review", "unable_to_proceed"]).default("pending").notNull(),
  ruleSnapshot: text("ruleSnapshot"),
  decisionReason: text("decisionReason"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** One wallet per customer; all value movement is represented by append-only ledger entries. */
export const walletAccounts = mysqlTable("wallet_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["active", "restricted", "closed"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const walletLedgerEntries = mysqlTable("wallet_ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 48 }).notNull().unique(),
  walletAccountId: int("walletAccountId").notNull(),
  userId: int("userId").notNull(),
  transactionId: int("transactionId"),
  entryType: mysqlEnum("entryType", ["credit", "debit", "deposit_hold", "deposit_release", "refund", "promotion", "membership_credit", "referral_credit", "adjustment"]).notNull(),
  status: mysqlEnum("status", ["pending", "posted", "reversed", "voided"]).default("pending").notNull(),
  amountCents: int("amountCents").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  providerReference: varchar("providerReference", { length: 160 }),
  receiptKey: varchar("receiptKey", { length: 512 }),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  postedAt: timestamp("postedAt"),
  reversedAt: timestamp("reversedAt"),
});

// ── DreamCarz OS rental and purchase transaction engine ────────────────────

/** Planned journey details remain outside the core transaction so saved requests can change safely. */
export const transactionSchedules = mysqlTable("transaction_schedules", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull().unique(),
  requestedStartAt: timestamp("requestedStartAt"),
  requestedEndAt: timestamp("requestedEndAt"),
  pickupMethod: mysqlEnum("pickupMethod", ["not_selected", "pickup", "delivery"]).default("not_selected").notNull(),
  pickupLocation: varchar("pickupLocation", { length: 255 }),
  deliveryAddress: text("deliveryAddress"),
  customerNotes: text("customerNotes"),
  scheduledHandoffAt: timestamp("scheduledHandoffAt"),
  assignedDriverName: varchar("assignedDriverName", { length: 160 }),
  handoffStatus: mysqlEnum("handoffStatus", ["not_scheduled", "scheduled", "en_route", "arrived", "customer_verified", "completed", "missed", "cancelled"]).default("not_scheduled").notNull(),
  handoffNotes: text("handoffNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A quote is an immutable review artifact, not an automatic calculation or a promise of final terms. */
export const transactionQuotes = mysqlTable("transaction_quotes", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  version: int("version").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "superseded", "expired", "declined"]).default("draft").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  totalDueNowCents: int("totalDueNowCents"),
  conditionalTotalCents: int("conditionalTotalCents"),
  validUntil: timestamp("validUntil"),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("transaction_quote_version_unique").on(table.transactionId, table.version)]);

export const transactionQuoteLines = mysqlTable("transaction_quote_lines", {
  id: int("id").autoincrement().primaryKey(),
  transactionQuoteId: int("transactionQuoteId").notNull(),
  lineType: mysqlEnum("lineType", ["base_rental", "membership_discount", "tax", "fee", "protection", "deposit_authorization", "credit", "purchase_price", "trade_in_credit", "down_payment", "other"]).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  amountCents: int("amountCents").notNull(),
  isConditional: boolean("isConditional").default(false).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Links preserve the originating rental when a customer requests a purchase or vehicle swap. */
export const transactionLinks = mysqlTable("transaction_links", {
  id: int("id").autoincrement().primaryKey(),
  sourceTransactionId: int("sourceTransactionId").notNull(),
  targetTransactionId: int("targetTransactionId").notNull(),
  linkType: mysqlEnum("linkType", ["rent_to_buy", "swap"]).notNull(),
  status: mysqlEnum("status", ["requested", "under_review", "approved", "declined", "completed", "canceled"]).default("requested").notNull(),
  requestedByUserId: int("requestedByUserId").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewNote: text("reviewNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("transaction_link_unique").on(table.sourceTransactionId, table.targetTransactionId, table.linkType)]);

// ── DreamCarz OS vehicle passports and fleet operations ─────────────────────

/** Internal operating record for one confirmed inventory vehicle. Sensitive VIN, plate, and acquisition details never appear in public inventory. */
export const vehiclePassports = mysqlTable("vehicle_passports", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: varchar("vehicleId", { length: 96 }).notNull().unique(),
  vehicleName: varchar("vehicleName", { length: 180 }).notNull(),
  acquisitionStatus: mysqlEnum("acquisitionStatus", ["not_recorded", "owned", "leased", "partner_managed", "retired"]).default("not_recorded").notNull(),
  readinessStatus: mysqlEnum("readinessStatus", ["not_ready", "inspection_due", "maintenance_due", "available", "reserved", "active_rental", "out_of_service", "retired"]).default("not_ready").notNull(),
  stockNumber: varchar("stockNumber", { length: 96 }),
  vinLast4: varchar("vinLast4", { length: 4 }),
  plateNumber: varchar("plateNumber", { length: 32 }),
  currentLocation: varchar("currentLocation", { length: 255 }),
  currentOdometer: int("currentOdometer"),
  fuelOrChargeLevel: varchar("fuelOrChargeLevel", { length: 80 }),
  acquisitionReference: varchar("acquisitionReference", { length: 160 }),
  insurancePolicyReference: varchar("insurancePolicyReference", { length: 160 }),
  registrationDocumentKey: varchar("registrationDocumentKey", { length: 512 }),
  insuranceDocumentKey: varchar("insuranceDocumentKey", { length: 512 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicleOperationalInspections = mysqlTable("vehicle_operational_inspections", {
  id: int("id").autoincrement().primaryKey(),
  vehiclePassportId: int("vehiclePassportId").notNull(),
  transactionId: int("transactionId"),
  stage: mysqlEnum("stage", ["intake", "pre_rental", "pickup", "return", "post_rental", "periodic", "maintenance_release"]).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "needs_attention"]).default("draft").notNull(),
  odometerReading: int("odometerReading"),
  fuelOrChargeLevel: varchar("fuelOrChargeLevel", { length: 80 }),
  tireCondition: varchar("tireCondition", { length: 80 }),
  cleanliness: varchar("cleanliness", { length: 80 }),
  damageNotes: text("damageNotes"),
  photoKeys: text("photoKeys"),
  inspectedByUserId: int("inspectedByUserId"),
  reviewedByUserId: int("reviewedByUserId"),
  inspectedAt: timestamp("inspectedAt"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicleMaintenanceRecords = mysqlTable("vehicle_maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  vehiclePassportId: int("vehiclePassportId").notNull(),
  maintenanceType: mysqlEnum("maintenanceType", ["scheduled_service", "repair", "recall", "tire", "cleaning", "inspection_follow_up", "other"]).notNull(),
  status: mysqlEnum("status", ["planned", "scheduled", "in_progress", "completed", "deferred", "canceled"]).default("planned").notNull(),
  dueAt: timestamp("dueAt"),
  completedAt: timestamp("completedAt"),
  odometerAtService: int("odometerAtService"),
  vendorName: varchar("vendorName", { length: 160 }),
  workOrderReference: varchar("workOrderReference", { length: 160 }),
  invoiceDocumentKey: varchar("invoiceDocumentKey", { length: 512 }),
  notes: text("notes"),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicleIncidentRecords = mysqlTable("vehicle_incident_records", {
  id: int("id").autoincrement().primaryKey(),
  vehiclePassportId: int("vehiclePassportId").notNull(),
  transactionId: int("transactionId"),
  incidentType: mysqlEnum("incidentType", ["collision", "mechanical", "damage", "theft", "towing", "ticket_or_impound", "roadside", "other"]).notNull(),
  severity: mysqlEnum("severity", ["standard", "urgent", "emergency"]).default("standard").notNull(),
  status: mysqlEnum("status", ["reported", "under_review", "assigned", "resolved", "closed"]).default("reported").notNull(),
  reportedLocation: varchar("reportedLocation", { length: 255 }),
  occurredAt: timestamp("occurredAt"),
  policeReportReference: varchar("policeReportReference", { length: 160 }),
  towReference: varchar("towReference", { length: 160 }),
  insuranceClaimReference: varchar("insuranceClaimReference", { length: 160 }),
  description: text("description").notNull(),
  photoKeys: text("photoKeys"),
  reportedByUserId: int("reportedByUserId"),
  resolvedByUserId: int("resolvedByUserId"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

/** Associate-owned lead records remain private and require the prospect's contact consent. */
export const associateLeads = mysqlTable("associate_leads", {
  id: int("id").autoincrement().primaryKey(),
  associateUserId: int("associateUserId").notNull(),
  contactName: varchar("contactName", { length: 160 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 48 }),
  interestType: mysqlEnum("interestType", ["membership", "rental", "purchase", "fleet_partner", "associate", "general"]).default("general").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "closed"]).default("new").notNull(),
  consentToContact: boolean("consentToContact").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

/**
 * Reusable, account-bound profile for transactional onboarding. This stores
 * necessary contact and verification outcomes, never payment credentials,
 * facial templates, identity-document images, or provider client secrets.
 */
export const customerProfiles = mysqlTable("customer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 160 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  phoneVerifiedAt: timestamp("phoneVerifiedAt"),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  addressLine1: varchar("addressLine1", { length: 255 }),
  addressLine2: varchar("addressLine2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 64 }),
  postalCode: varchar("postalCode", { length: 24 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  identityStatus: mysqlEnum("identityStatus", ["not_started", "pending", "verified", "requires_input", "manual_review", "redacted"]).default("not_started").notNull(),
  licenseStatus: mysqlEnum("licenseStatus", ["not_started", "pending", "verified", "expired", "manual_review", "failed"]).default("not_started").notNull(),
  identityProvider: varchar("identityProvider", { length: 64 }),
  identityProviderSessionId: varchar("identityProviderSessionId", { length: 160 }),
  identityVerifiedAt: timestamp("identityVerifiedAt"),
  licenseVerifiedAt: timestamp("licenseVerifiedAt"),
  verificationExpiresAt: timestamp("verificationExpiresAt"),
  profileStatus: mysqlEnum("profileStatus", ["incomplete", "ready_for_verification", "verified", "manual_review", "restricted"]).default("incomplete").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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

// ── Vehicle Rental & Purchase Inquiries ─────────────────────────────────────

export const vehicleInquiries = mysqlTable("vehicle_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  userId: int("userId"),
  inquiryType: mysqlEnum("inquiryType", ["rental", "purchase", "reserve"]).notNull(),
  vehicleId: varchar("vehicleId", { length: 96 }).notNull(),
  vehicleName: varchar("vehicleName", { length: 160 }).notNull(),
  contactName: varchar("contactName", { length: 160 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 32 }).notNull(),
  preferredContact: mysqlEnum("preferredContact", ["phone", "email"]).default("phone").notNull(),
  requestedStartDate: varchar("requestedStartDate", { length: 10 }),
  requestedEndDate: varchar("requestedEndDate", { length: 10 }),
  pickupLocation: varchar("pickupLocation", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["submitted", "under_review", "contacted", "closed", "declined"])
    .default("submitted")
    .notNull(),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Transactional Rental & Purchase Lifecycle ──────────────────────────────

/**
 * A durable customer transaction created when a member selects Rent or Buy.
 * Provider values are opaque identifiers only; card data, biometrics, client
 * secrets, and raw webhook payloads must never be stored in DreamCarz.
 */
export const vehicleTransactions = mysqlTable("vehicle_transactions", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  transactionType: mysqlEnum("transactionType", ["rental", "purchase"]).notNull(),
  vehicleId: varchar("vehicleId", { length: 96 }).notNull(),
  vehicleName: varchar("vehicleName", { length: 160 }).notNull(),
  vehicleImage: varchar("vehicleImage", { length: 512 }),
  membershipPlan: varchar("membershipPlan", { length: 64 }),
  status: mysqlEnum("status", [
    "initiated",
    "profile_incomplete",
    "verification_pending",
    "manual_review",
    "eligibility_review",
    "payment_pending",
    "agreement_pending",
    "ready_for_pickup",
    "active_rental",
    "return_pending",
    "settlement_pending",
    "completed",
    "canceled",
    "declined",
  ]).default("initiated").notNull(),
  currentStep: varchar("currentStep", { length: 64 }).default("vehicle").notNull(),
  contactName: varchar("contactName", { length: 160 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  addressLine1: varchar("addressLine1", { length: 255 }),
  addressLine2: varchar("addressLine2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 64 }),
  postalCode: varchar("postalCode", { length: 24 }),
  identityStatus: mysqlEnum("identityStatus", ["not_started", "pending", "verified", "requires_input", "manual_review", "redacted"]).default("not_started").notNull(),
  licenseStatus: mysqlEnum("licenseStatus", ["not_started", "pending", "verified", "expired", "manual_review", "failed"]).default("not_started").notNull(),
  eligibilityStatus: mysqlEnum("eligibilityStatus", ["not_started", "pending", "cleared", "manual_review", "ineligible"]).default("not_started").notNull(),
  insuranceStatus: mysqlEnum("insuranceStatus", ["not_required", "pending", "verified", "manual_review", "rejected"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["not_required", "pending", "authorized", "paid", "failed", "refunded", "manual_review"]).default("pending").notNull(),
  agreementStatus: mysqlEnum("agreementStatus", ["not_required", "draft", "awaiting_signature", "signed", "declined", "voided"]).default("draft").notNull(),
  conditionStatus: mysqlEnum("conditionStatus", ["not_started", "pickup_complete", "return_complete", "review_required"]).default("not_started").notNull(),
  pickupStatus: mysqlEnum("pickupStatus", ["not_applicable", "pending", "verified", "completed", "missed"]).default("pending").notNull(),
  activeRentalStatus: mysqlEnum("activeRentalStatus", ["not_applicable", "pending", "active", "paused", "ended", "incident_review"]).default("not_applicable").notNull(),
  returnStatus: mysqlEnum("returnStatus", ["not_applicable", "pending", "in_progress", "inspected", "complete"]).default("not_applicable").notNull(),
  settlementStatus: mysqlEnum("settlementStatus", ["not_applicable", "pending", "complete", "adjustment_required", "disputed"]).default("not_applicable").notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["not_applicable", "pending", "scheduled", "verified", "completed", "missed"]).default("not_applicable").notNull(),
  identityProvider: varchar("identityProvider", { length: 64 }),
  identitySessionId: varchar("identitySessionId", { length: 160 }),
  paymentProvider: varchar("paymentProvider", { length: 64 }),
  paymentProviderTransactionId: varchar("paymentProviderTransactionId", { length: 160 }),
  paymentProviderAuthorizationId: varchar("paymentProviderAuthorizationId", { length: 160 }),
  paymentProviderCustomerVaultId: varchar("paymentProviderCustomerVaultId", { length: 160 }),
  cocardCheckoutAttemptToken: varchar("cocardCheckoutAttemptToken", { length: 96 }),
  cocardCheckoutAttemptedAt: timestamp("cocardCheckoutAttemptedAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 160 }),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 160 }),
  stripeSetupIntentId: varchar("stripeSetupIntentId", { length: 160 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 160 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 160 }),
  agreementProvider: varchar("agreementProvider", { length: 64 }),
  agreementEnvelopeId: varchar("agreementEnvelopeId", { length: 160 }),
  requestedStartDate: varchar("requestedStartDate", { length: 10 }),
  requestedEndDate: varchar("requestedEndDate", { length: 10 }),
  pickupLocation: varchar("pickupLocation", { length: 255 }),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }),
  eligibilityDetails: text("eligibilityDetails"),
  insuranceDetails: text("insuranceDetails"),
  tradeInDetails: text("tradeInDetails"),
  purchasePaymentPath: mysqlEnum("purchasePaymentPath", ["not_applicable", "undecided", "cash", "finance"]).default("not_applicable").notNull(),
  financingStatus: mysqlEnum("financingStatus", ["not_applicable", "not_started", "provider_required", "submitted", "approved", "manual_review", "declined"]).default("not_applicable").notNull(),
  pricingSnapshot: text("pricingSnapshot"),
  cocardProductSku: varchar("cocardProductSku", { length: 128 }),
  internalNote: text("internalNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const transactionConsents = mysqlTable("transaction_consents", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  userId: int("userId").notNull(),
  consentType: mysqlEnum("consentType", ["identity_biometric", "identity_document", "insurance_review", "payment_authorization", "credit_authorization", "electronic_signature", "communications"]).notNull(),
  policyVersion: varchar("policyVersion", { length: 64 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  withdrawnAt: timestamp("withdrawnAt"),
  source: varchar("source", { length: 64 }).default("transaction_flow").notNull(),
});

export const transactionDocuments = mysqlTable("transaction_documents", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  userId: int("userId").notNull(),
  documentType: mysqlEnum("documentType", ["license_front", "license_back", "live_selfie", "insurance_card", "additional_driver_license", "trade_in_document", "condition_photo", "agreement_copy", "other"]).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "redacted"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const transactionAdditionalDrivers = mysqlTable("transaction_additional_drivers", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  licenseStatus: mysqlEnum("licenseStatus", ["not_started", "pending", "verified", "manual_review", "rejected"]).default("not_started").notNull(),
  identityStatus: mysqlEnum("identityStatus", ["not_started", "pending", "verified", "manual_review", "rejected"]).default("not_started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const transactionAgreements = mysqlTable("transaction_agreements", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  templateId: int("templateId"),
  agreementType: mysqlEnum("agreementType", ["rental", "purchase", "addendum"]).notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }),
  providerEnvelopeId: varchar("providerEnvelopeId", { length: 160 }),
  status: mysqlEnum("status", ["draft", "awaiting_signature", "signed", "declined", "voided"]).default("draft").notNull(),
  signingMethod: mysqlEnum("signingMethod", ["native_attestation", "external_provider"]).default("native_attestation").notNull(),
  signerUserId: int("signerUserId"),
  signerName: varchar("signerName", { length: 160 }),
  signerAcknowledgedAt: timestamp("signerAcknowledgedAt"),
  signatureHash: varchar("signatureHash", { length: 128 }),
  signerIpHash: varchar("signerIpHash", { length: 128 }),
  contentSnapshot: text("contentSnapshot"),
  signedDocumentKey: varchar("signedDocumentKey", { length: 512 }),
  sentAt: timestamp("sentAt"),
  signedAt: timestamp("signedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agreementTemplates = mysqlTable("agreement_templates", {
  id: int("id").autoincrement().primaryKey(),
  agreementType: mysqlEnum("agreementType", ["rental", "purchase"]).notNull(),
  version: varchar("version", { length: 64 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  legalApprovalReference: varchar("legalApprovalReference", { length: 255 }),
  legalApprovedAt: timestamp("legalApprovedAt"),
  legalApprovedByUserId: int("legalApprovedByUserId"),
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("agreement_template_version_unique").on(table.agreementType, table.version)]);

export const vehicleConditionReports = mysqlTable("vehicle_condition_reports", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  stage: mysqlEnum("stage", ["pickup", "return"]).notNull(),
  completedByUserId: int("completedByUserId"),
  odometerReading: int("odometerReading"),
  fuelLevel: varchar("fuelLevel", { length: 32 }),
  notes: text("notes"),
  photoKeys: text("photoKeys"),
  status: mysqlEnum("status", ["draft", "submitted", "reviewed", "disputed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const transactionEvents = mysqlTable("transaction_events", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("transactionId").notNull(),
  actorUserId: int("actorUserId"),
  actorType: mysqlEnum("actorType", ["customer", "admin", "system", "provider"]).notNull(),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  fromStatus: varchar("fromStatus", { length: 64 }),
  toStatus: varchar("toStatus", { length: 64 }),
  note: text("note"),
  metadata: text("metadata"),
  providerEventId: varchar("providerEventId", { length: 160 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Partner access is explicit and account-bound; public marketing pages do not create fleet operations access. */
export const fleetPartnerProfiles = mysqlTable("fleet_partner_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 160 }),
  status: mysqlEnum("status", ["pending", "active", "suspended", "inactive"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fleetPartnerVehicleAssignments = mysqlTable("fleet_partner_vehicle_assignments", {
  id: int("id").autoincrement().primaryKey(),
  partnerUserId: int("partnerUserId").notNull(),
  vehiclePassportId: int("vehiclePassportId").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["active", "paused", "ended"]).default("active").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("partner_passport_assignment_unique").on(table.partnerUserId, table.vehiclePassportId)]);

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
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type ReservationRequest = typeof reservationRequests.$inferSelect;
export type VehicleInquiry = typeof vehicleInquiries.$inferSelect;
export type VehicleTransaction = typeof vehicleTransactions.$inferSelect;
export type TransactionConsent = typeof transactionConsents.$inferSelect;
export type TransactionDocument = typeof transactionDocuments.$inferSelect;
export type TransactionAdditionalDriver = typeof transactionAdditionalDrivers.$inferSelect;
export type TransactionAgreement = typeof transactionAgreements.$inferSelect;
export type VehicleConditionReport = typeof vehicleConditionReports.$inferSelect;
export type TransactionEvent = typeof transactionEvents.$inferSelect;
export type FleetPartnerProfile = typeof fleetPartnerProfiles.$inferSelect;
export type FleetPartnerVehicleAssignment = typeof fleetPartnerVehicleAssignments.$inferSelect;
export type ServiceReport = typeof serviceReports.$inferSelect;
export type ServiceReportPhoto = typeof serviceReportPhotos.$inferSelect;
export type ServiceReportReviewEvent = typeof serviceReportReviewEvents.$inferSelect;
