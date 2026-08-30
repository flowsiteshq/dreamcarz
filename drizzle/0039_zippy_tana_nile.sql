CREATE TABLE `support_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`category` enum('general','account','membership','reservation','transaction','payment','vehicle','incident','other') NOT NULL DEFAULT 'general',
	`urgency` enum('standard','urgent') NOT NULL DEFAULT 'standard',
	`status` enum('submitted','under_review','resolved','closed') NOT NULL DEFAULT 'submitted',
	`subject` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`relatedTransactionId` int,
	`assignedToUserId` int,
	`customerUpdate` text,
	`internalNote` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `support_requests_reference_unique` UNIQUE(`reference`)
);
