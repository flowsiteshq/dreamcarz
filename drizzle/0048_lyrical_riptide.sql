CREATE TABLE `dcp_program_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`version` varchar(64) NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`earningRules` text NOT NULL,
	`expirationRules` text NOT NULL,
	`redemptionRules` text NOT NULL,
	`approvalReference` varchar(255),
	`createdByUserId` int NOT NULL,
	`activatedByUserId` int,
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dcp_program_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `dcp_program_policies_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `dcp_program_policy_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dcpProgramPolicyId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dcp_program_policy_events_id` PRIMARY KEY(`id`)
);
