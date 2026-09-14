CREATE TABLE `future_driver_goal_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`futureDriverProfileId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`fromMode` varchar(24),
	`toMode` varchar(24),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `future_driver_goal_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `future_driver_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mode` enum('inactive','future_driver') NOT NULL DEFAULT 'future_driver',
	`goalArea` enum('vehicle_discovery','rental_readiness','membership_review','transportation_plan') NOT NULL DEFAULT 'vehicle_discovery',
	`desiredVehicleId` varchar(96),
	`horizon` enum('exploring','later','preparing') NOT NULL DEFAULT 'exploring',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `future_driver_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `future_driver_profiles_userId_unique` UNIQUE(`userId`)
);
