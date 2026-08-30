CREATE TABLE `pricing_rule_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pricingRuleId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricing_rule_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`scope` enum('rental','purchase','membership','deposit','delivery','other') NOT NULL,
	`status` enum('draft','approved','paused','archived') NOT NULL DEFAULT 'draft',
	`configuration` text NOT NULL,
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_rules_id` PRIMARY KEY(`id`)
);
