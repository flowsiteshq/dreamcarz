CREATE TABLE `concierge_journey_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`intent` enum('rental','purchase','membership','explore') NOT NULL DEFAULT 'explore',
	`preferredVehicleClass` enum('sedan','suv'),
	`selectedVehicleId` varchar(96),
	`selectedVehicleName` varchar(160),
	`timeline` enum('exploring','soon','this_week'),
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `concierge_journey_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `concierge_journey_preferences_userId_unique` UNIQUE(`userId`)
);
