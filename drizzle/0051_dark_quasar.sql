CREATE TABLE `subscription_rate_card_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionRateCardId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_rate_card_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `subscription_rate_card_event_card_created_idx` ON `subscription_rate_card_events` (`subscriptionRateCardId`,`createdAt`);