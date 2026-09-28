import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mysql = require("mysql2/promise");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const db = await mysql.createConnection(process.env.DATABASE_URL);
const exists = async (table) => {
  const [rows] = await db.execute("SHOW TABLES LIKE ?", [table]);
  return rows.length > 0;
};

try {
  if (!(await exists("investment_opportunities"))) {
    await db.execute(`CREATE TABLE \`investment_opportunities\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`code\` varchar(64) NOT NULL,
      \`title\` varchar(160) NOT NULL,
      \`targetRaiseCents\` int NOT NULL,
      \`status\` enum('draft','pending_approval','closed') NOT NULL DEFAULT 'pending_approval',
      \`monthlyDistributableProfitCents\` int,
      \`reportingAsOf\` timestamp,
      \`legalApprovalReference\` varchar(255),
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`investment_opportunities_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`investment_opportunities_code_unique\` UNIQUE(\`code\`)
    )`);
  }
  if (!(await exists("investment_interest_indications"))) {
    await db.execute(`CREATE TABLE \`investment_interest_indications\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`opportunityId\` int NOT NULL,
      \`userId\` int NOT NULL,
      \`indicatedAmountCents\` int NOT NULL,
      \`status\` enum('draft','submitted','withdrawn') NOT NULL DEFAULT 'draft',
      \`submittedAt\` timestamp,
      \`withdrawnAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`investment_interest_indications_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`investment_interest_opportunity_user_unique\` UNIQUE(\`opportunityId\`,\`userId\`),
      INDEX \`investment_interest_user_status_idx\` (\`userId\`,\`status\`)
    )`);
  }
  if (!(await exists("investment_opportunity_reports"))) {
    await db.execute(`CREATE TABLE \`investment_opportunity_reports\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`opportunityId\` int NOT NULL,
      \`periodMonth\` varchar(7) NOT NULL,
      \`grossRevenueCents\` int,
      \`distributableProfitCents\` int,
      \`status\` enum('draft','published') NOT NULL DEFAULT 'draft',
      \`sourceReference\` varchar(255),
      \`publishedByUserId\` int,
      \`publishedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`investment_opportunity_reports_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`investment_report_opportunity_period_unique\` UNIQUE(\`opportunityId\`,\`periodMonth\`),
      INDEX \`investment_report_opportunity_status_idx\` (\`opportunityId\`,\`status\`)
    )`);
  }
  await db.execute("ALTER TABLE `role_assignment_events` MODIFY COLUMN `role` enum('customer','associate','fleet_partner','investor','operations','support','manager','administrator') NOT NULL");
  await db.execute("ALTER TABLE `user_role_assignments` MODIFY COLUMN `role` enum('customer','associate','fleet_partner','investor','operations','support','manager','administrator') NOT NULL");
  await db.execute(`INSERT INTO investment_opportunities (code, title, targetRaiseCents, status)
    SELECT 'DC-INITIAL-250K', 'DreamCarz Initial Vehicle Portfolio — Preliminary', 25000000, 'pending_approval'
    WHERE NOT EXISTS (SELECT 1 FROM investment_opportunities WHERE code = 'DC-INITIAL-250K')`);
  const [rows] = await db.execute("SELECT code, targetRaiseCents, status FROM investment_opportunities WHERE code = 'DC-INITIAL-250K'");
  console.log(JSON.stringify({ migrated: true, opportunity: rows[0] ?? null }));
} finally {
  await db.end();
}
