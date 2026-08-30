CREATE TABLE `transaction_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceTransactionId` int NOT NULL,
	`targetTransactionId` int NOT NULL,
	`linkType` enum('rent_to_buy','swap') NOT NULL,
	`status` enum('requested','under_review','approved','declined','completed','canceled') NOT NULL DEFAULT 'requested',
	`requestedByUserId` int NOT NULL,
	`reviewedByUserId` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_link_unique` UNIQUE(`sourceTransactionId`,`targetTransactionId`,`linkType`)
);
--> statement-breakpoint
CREATE TABLE `transaction_quote_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionQuoteId` int NOT NULL,
	`lineType` enum('base_rental','membership_discount','tax','fee','protection','deposit_authorization','credit','purchase_price','trade_in_credit','down_payment','other') NOT NULL,
	`label` varchar(160) NOT NULL,
	`amountCents` int NOT NULL,
	`isConditional` boolean NOT NULL DEFAULT false,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transaction_quote_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`version` int NOT NULL,
	`status` enum('draft','approved','superseded','expired','declined') NOT NULL DEFAULT 'draft',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`totalDueNowCents` int,
	`conditionalTotalCents` int,
	`validUntil` timestamp,
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_quote_version_unique` UNIQUE(`transactionId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `transaction_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionId` int NOT NULL,
	`requestedStartAt` timestamp,
	`requestedEndAt` timestamp,
	`pickupMethod` enum('not_selected','pickup','delivery') NOT NULL DEFAULT 'not_selected',
	`pickupLocation` varchar(255),
	`deliveryAddress` text,
	`customerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transaction_schedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `transaction_schedules_transactionId_unique` UNIQUE(`transactionId`)
);
