CREATE TABLE `rental_extension_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`userId` int NOT NULL,
	`requestedEndDate` varchar(10) NOT NULL,
	`customerNote` text,
	`status` enum('pending','approved','declined','canceled') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`reviewedByUserId` int,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_extension_requests_id` PRIMARY KEY(`id`)
);
