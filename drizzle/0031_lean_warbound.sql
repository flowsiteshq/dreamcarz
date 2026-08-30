CREATE TABLE `communication_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationId` int,
	`channel` enum('in_app','email','sms','push') NOT NULL,
	`status` enum('queued','delivered','failed','suppressed','read') NOT NULL DEFAULT 'queued',
	`providerReference` varchar(160),
	`detail` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communication_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communication_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`smsEnabled` boolean NOT NULL DEFAULT false,
	`pushEnabled` boolean NOT NULL DEFAULT false,
	`transactionalInAppEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communication_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `communication_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `customer_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('transaction','membership','wallet','vehicle','incident','support','account','other') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`actionPath` varchar(512),
	`relatedTransactionId` int,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_notifications_id` PRIMARY KEY(`id`)
);
