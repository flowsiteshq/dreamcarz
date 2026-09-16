CREATE TABLE `meta_lead_test_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`formId` varchar(128) NOT NULL,
	`metaLeadId` varchar(128) NOT NULL,
	`status` enum('requested','webhook_received','processed','manual_review','failed') NOT NULL DEFAULT 'requested',
	`requestedByUserId` int NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`webhookReceivedAt` timestamp,
	`processedAt` timestamp,
	`errorCode` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_lead_test_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_lead_test_runs_metaLeadId_unique` UNIQUE(`metaLeadId`)
);
--> statement-breakpoint
CREATE INDEX `meta_lead_test_run_integration_created_idx` ON `meta_lead_test_runs` (`integrationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `meta_lead_test_run_status_idx` ON `meta_lead_test_runs` (`status`,`requestedAt`);