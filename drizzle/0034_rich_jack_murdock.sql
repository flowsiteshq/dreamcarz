CREATE TABLE `transaction_adjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`settlementId` int,
	`adjustmentType` enum('deposit','damage','toll','ticket','cleaning','fuel_charge','other') NOT NULL,
	`status` enum('pending','approved','waived','disputed') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`description` text NOT NULL,
	`evidenceStorageKey` varchar(512),
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_adjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_settlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`status` enum('pending','under_review','settled','disputed','waived') NOT NULL DEFAULT 'pending',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`approvedSubtotalCents` int NOT NULL DEFAULT 0,
	`depositAppliedCents` int NOT NULL DEFAULT 0,
	`adjustmentsCents` int NOT NULL DEFAULT 0,
	`finalAmountCents` int NOT NULL DEFAULT 0,
	`summary` text,
	`receiptStorageKey` varchar(512),
	`reviewedByUserId` int,
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_settlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_settlements_transactionId_unique` UNIQUE(`transactionId`)
);
