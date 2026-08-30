CREATE TABLE `referral_conversion_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralId` int NOT NULL,
	`referrerUserId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`eventType` enum('account_registered','rental_started','purchase_started') NOT NULL,
	`sourceTransactionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_conversion_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_conversion_transaction_unique` UNIQUE(`referralId`,`eventType`,`sourceTransactionId`)
);
