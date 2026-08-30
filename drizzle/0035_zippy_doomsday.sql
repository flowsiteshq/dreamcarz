CREATE TABLE `eligibility_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`version` varchar(64) NOT NULL,
	`scope` enum('all_rentals','entry','mid_range','elite','specific_vehicle') NOT NULL DEFAULT 'all_rentals',
	`vehicleId` varchar(96),
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`ruleConfiguration` text NOT NULL,
	`approvalReference` varchar(255),
	`createdByUserId` int NOT NULL,
	`activatedByUserId` int,
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eligibility_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `eligibility_policies_code_unique` UNIQUE(`code`)
);
