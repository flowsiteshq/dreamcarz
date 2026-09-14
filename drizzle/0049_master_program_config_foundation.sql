CREATE TABLE `dcp_ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`walletCode` varchar(8) NOT NULL,
	`transactionType` enum('earn','use','hold','release','expire','reverse','adjust') NOT NULL,
	`status` enum('pending','posted','reversed','voided') NOT NULL DEFAULT 'pending',
	`sourceType` varchar(96) NOT NULL,
	`sourceId` varchar(160) NOT NULL,
	`points` int NOT NULL,
	`ruleVersion` varchar(64) NOT NULL,
	`reasonCode` varchar(96),
	`linkedEntryId` int,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`postedAt` timestamp,
	CONSTRAINT `dcp_ledger_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `dcp_ledger_entries_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `dcp_wallet_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`masterProgramConfigurationId` int NOT NULL,
	`walletCode` varchar(8) NOT NULL,
	`walletName` varchar(120) NOT NULL,
	`minimumTier` varchar(32) NOT NULL,
	`earnMultiplier` int NOT NULL,
	`primaryUse` varchar(255) NOT NULL,
	`redemptionPriority` int NOT NULL,
	`guardrail` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dcp_wallet_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `dcp_wallet_definition_version_code_unique` UNIQUE(`masterProgramConfigurationId`,`walletCode`)
);
--> statement-breakpoint
CREATE TABLE `master_program_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(96) NOT NULL,
	`version` varchar(32) NOT NULL,
	`sourceLabel` varchar(255) NOT NULL,
	`effectiveStart` timestamp NOT NULL,
	`effectiveEnd` timestamp,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`faceValueDcpPerDollar` int NOT NULL,
	`standardWalletEarnRatePerEligibleDollar` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_program_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `master_program_configurations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `membership_plan_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`masterProgramConfigurationId` int NOT NULL,
	`planCode` varchar(32) NOT NULL,
	`planName` varchar(80) NOT NULL,
	`displayOrder` int NOT NULL,
	`enrollmentFeeCents` int NOT NULL,
	`monthlyFeeCents` int NOT NULL,
	`startingDcpr` int NOT NULL,
	`membershipMultiplier` int NOT NULL,
	`vehicleAccessLabel` varchar(160) NOT NULL,
	`asLowDailyRateCents` int NOT NULL,
	`dcpPerDay` int NOT NULL,
	`walletCodes` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `membership_plan_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_plan_config_version_code_unique` UNIQUE(`masterProgramConfigurationId`,`planCode`)
);
--> statement-breakpoint
CREATE INDEX `dcp_ledger_user_wallet_created_idx` ON `dcp_ledger_entries` (`userId`,`walletCode`,`createdAt`);--> statement-breakpoint
CREATE INDEX `dcp_ledger_source_idx` ON `dcp_ledger_entries` (`sourceType`,`sourceId`);--> statement-breakpoint
CREATE INDEX `master_program_config_status_effective_idx` ON `master_program_configurations` (`status`,`effectiveStart`);