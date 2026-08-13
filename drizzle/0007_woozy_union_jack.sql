CREATE TABLE `partner_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(48) NOT NULL,
	`address` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(16) NOT NULL,
	`postalCode` varchar(24) NOT NULL,
	`phone` varchar(32),
	`hours` varchar(255),
	`description` text,
	`tags` text,
	`latitude` varchar(24),
	`longitude` varchar(24),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_locations_id` PRIMARY KEY(`id`)
);
