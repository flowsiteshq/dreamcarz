CREATE TABLE `fleet_partner_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(160),
	`status` enum('pending','active','suspended','inactive') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_partner_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_partner_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fleet_partner_vehicle_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerUserId` int NOT NULL,
	`vehiclePassportId` int NOT NULL,
	`accessStatus` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_partner_vehicle_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_passport_assignment_unique` UNIQUE(`partnerUserId`,`vehiclePassportId`)
);
