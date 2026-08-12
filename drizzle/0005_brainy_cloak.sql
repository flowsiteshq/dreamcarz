CREATE TABLE `service_report_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`userId` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`contentType` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_report_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reference` varchar(24) NOT NULL,
	`vehicleName` varchar(160) NOT NULL,
	`category` varchar(80) NOT NULL,
	`description` text NOT NULL,
	`reportedLocation` varchar(255),
	`urgency` enum('standard','urgent') NOT NULL DEFAULT 'standard',
	`status` enum('submitted','under_review','assigned','resolved','closed') NOT NULL DEFAULT 'submitted',
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_reports_reference_unique` UNIQUE(`reference`)
);
