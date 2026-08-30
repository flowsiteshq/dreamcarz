CREATE TABLE `vehicle_passport_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehiclePassportId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_passport_activity_events_id` PRIMARY KEY(`id`)
);
