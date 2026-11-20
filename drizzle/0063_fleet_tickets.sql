CREATE TABLE `fleet_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`citationNumber` varchar(100) NOT NULL,
	`authority` varchar(160) NOT NULL,
	`duplicateKey` varchar(64) NOT NULL,
	`plate` varchar(32) NOT NULL,
	`citedName` varchar(160),
	`violationAt` timestamp NOT NULL,
	`amountCents` int NOT NULL,
	`photo` mediumtext NOT NULL,
	`transactionId` int,
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`authorizationReference` varchar(240),
	`status` enum('review','scheduled','charging','paid','declined','blocked','uncertain','void') NOT NULL DEFAULT 'review',
	`dueAt` timestamp,
	`attemptedAt` timestamp,
	`providerTransactionId` varchar(160),
	`outcome` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fleet_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `fleet_tickets_duplicateKey_unique` UNIQUE(`duplicateKey`)
);
--> statement-breakpoint
CREATE INDEX `fleet_ticket_due_idx` ON `fleet_tickets` (`status`,`dueAt`);