CREATE TABLE `investment_interest_indications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`userId` int NOT NULL,
	`indicatedAmountCents` int NOT NULL,
	`status` enum('draft','submitted','withdrawn') NOT NULL DEFAULT 'draft',
	`submittedAt` timestamp,
	`withdrawnAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_interest_indications_id` PRIMARY KEY(`id`),
	CONSTRAINT `investment_interest_opportunity_user_unique` UNIQUE(`opportunityId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `investment_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`targetRaiseCents` int NOT NULL,
	`status` enum('draft','pending_approval','closed') NOT NULL DEFAULT 'pending_approval',
	`monthlyDistributableProfitCents` int,
	`reportingAsOf` timestamp,
	`legalApprovalReference` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_opportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `investment_opportunities_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `investment_opportunity_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`periodMonth` varchar(7) NOT NULL,
	`grossRevenueCents` int,
	`distributableProfitCents` int,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`sourceReference` varchar(255),
	`publishedByUserId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investment_opportunity_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `investment_report_opportunity_period_unique` UNIQUE(`opportunityId`,`periodMonth`)
);
--> statement-breakpoint
ALTER TABLE `role_assignment_events` MODIFY COLUMN `role` enum('customer','associate','fleet_partner','investor','operations','support','manager','administrator') NOT NULL;--> statement-breakpoint
ALTER TABLE `user_role_assignments` MODIFY COLUMN `role` enum('customer','associate','fleet_partner','investor','operations','support','manager','administrator') NOT NULL;--> statement-breakpoint
CREATE INDEX `investment_interest_user_status_idx` ON `investment_interest_indications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `investment_report_opportunity_status_idx` ON `investment_opportunity_reports` (`opportunityId`,`status`);
--> statement-breakpoint
INSERT INTO `investment_opportunities` (`code`, `title`, `targetRaiseCents`, `status`)
VALUES ('DC-INITIAL-250K', 'DreamCarz Initial Vehicle Portfolio — Preliminary', 25000000, 'pending_approval');
