CREATE TABLE `service_report_review_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`reviewerId` int,
	`status` enum('submitted','under_review','assigned','resolved','closed') NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_report_review_events_id` PRIMARY KEY(`id`)
);
