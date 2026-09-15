CREATE TABLE `advertising_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(24) NOT NULL,
	`contactName` varchar(160) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(48) NOT NULL,
	`source` enum('facebook') NOT NULL DEFAULT 'facebook',
	`consentToContact` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `advertising_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `advertising_leads_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE INDEX `advertising_lead_created_idx` ON `advertising_leads` (`createdAt`);