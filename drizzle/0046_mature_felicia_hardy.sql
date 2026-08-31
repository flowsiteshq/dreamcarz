CREATE TABLE `associate_lead_activity_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`associateUserId` int NOT NULL,
	`leadId` int NOT NULL,
	`eventType` enum('lead_created','status_updated') NOT NULL,
	`status` enum('new','contacted','qualified','converted','closed'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `associate_lead_activity_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `associate_lead_activity_owner_idx` ON `associate_lead_activity_events` (`associateUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `associate_lead_activity_lead_idx` ON `associate_lead_activity_events` (`leadId`,`createdAt`);