CREATE TABLE `agreement_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agreementType` enum('rental','purchase') NOT NULL,
	`version` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`legalApprovalReference` varchar(255),
	`legalApprovedAt` timestamp,
	`legalApprovedByUserId` int,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agreement_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `agreement_template_version_unique` UNIQUE(`agreementType`,`version`)
);
--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `templateId` int;--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signingMethod` enum('native_attestation','external_provider') DEFAULT 'native_attestation' NOT NULL;--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signerUserId` int;--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signerName` varchar(160);--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signerAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signatureHash` varchar(128);--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `signerIpHash` varchar(128);--> statement-breakpoint
ALTER TABLE `transaction_agreements` ADD `contentSnapshot` text;