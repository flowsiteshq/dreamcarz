CREATE TABLE `vehicle_subscription_rate_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`masterProgramConfigurationId` int NOT NULL,
	`vehicleId` varchar(96) NOT NULL,
	`membershipPlanCode` varchar(32),
	`termMonths` int NOT NULL,
	`monthlyBaseCents` int NOT NULL,
	`includedMilesPerMonth` int NOT NULL,
	`includedDaysPerMonth` int NOT NULL,
	`monthlyDcpCap` int NOT NULL,
	`depositCents` int,
	`coverageConfiguration` varchar(255) NOT NULL,
	`status` enum('draft','approved','paused','retired') NOT NULL DEFAULT 'draft',
	`effectiveStart` timestamp NOT NULL,
	`effectiveEnd` timestamp,
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicle_subscription_rate_cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_rate_card_version_vehicle_term_unique` UNIQUE(`masterProgramConfigurationId`,`vehicleId`,`termMonths`,`effectiveStart`)
);
--> statement-breakpoint
CREATE INDEX `subscription_rate_card_vehicle_status_effective_idx` ON `vehicle_subscription_rate_cards` (`vehicleId`,`status`,`effectiveStart`);