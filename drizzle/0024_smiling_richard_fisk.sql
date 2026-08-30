CREATE TABLE `customer_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`membershipPlanId` int NOT NULL,
	`status` enum('pending','active','paused','canceled','expired') NOT NULL DEFAULT 'pending',
	`startsAt` timestamp,
	`endsAt` timestamp,
	`providerSubscriptionReference` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_benefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipPlanId` int NOT NULL,
	`benefitType` enum('vehicle_access','rental_discount','deposit_adjustment','rental_credit','delivery_credit','upgrade_priority','partner_benefit','other') NOT NULL,
	`label` varchar(160) NOT NULL,
	`configuration` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_benefits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerMembershipId` int NOT NULL,
	`actorUserId` int,
	`eventType` varchar(96) NOT NULL,
	`previousStatus` varchar(48),
	`nextStatus` varchar(48),
	`note` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membership_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`enrollmentFeeCents` int,
	`monthlyFeeCents` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `transaction_eligibility_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`status` enum('pending','cleared','manual_review','unable_to_proceed') NOT NULL DEFAULT 'pending',
	`ruleSnapshot` text,
	`decisionReason` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_eligibility_assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_eligibility_assessments_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `user_role_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('customer','associate','fleet_partner','operations','support','manager','administrator') NOT NULL,
	`assignedByUserId` int,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `user_role_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_role_assignment_unique` UNIQUE(`userId`,`role`)
);
--> statement-breakpoint
CREATE TABLE `wallet_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('active','restricted','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_accounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `wallet_ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(48) NOT NULL,
	`walletAccountId` int NOT NULL,
	`userId` int NOT NULL,
	`transactionId` int,
	`entryType` enum('credit','debit','deposit_hold','deposit_release','refund','promotion','membership_credit','referral_credit','adjustment') NOT NULL,
	`status` enum('pending','posted','reversed','voided') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`description` varchar(255) NOT NULL,
	`providerReference` varchar(160),
	`receiptKey` varchar(512),
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`postedAt` timestamp,
	`reversedAt` timestamp,
	CONSTRAINT `wallet_ledger_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_ledger_entries_reference_unique` UNIQUE(`reference`)
);
