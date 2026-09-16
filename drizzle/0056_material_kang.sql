CREATE TABLE `marketing_lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`marketingLeadId` int NOT NULL,
	`eventType` enum('lead_created','website_lead_received','meta_lead_received','stage_updated','deduplication_review') NOT NULL,
	`actorType` enum('system','administrator','provider') NOT NULL DEFAULT 'system',
	`sourceRecordType` varchar(64),
	`sourceRecordId` varchar(160),
	`summary` varchar(255) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stage` enum('new_meta_lead','new','contacted','qualified','converted','closed') NOT NULL DEFAULT 'new',
	`primarySource` enum('meta_lead_ads','facebook_landing_page','manual') NOT NULL DEFAULT 'manual',
	`contactName` varchar(160),
	`contactEmail` varchar(320),
	`contactPhone` varchar(48),
	`normalizedEmail` varchar(320),
	`normalizedPhone` varchar(48),
	`contactConsentStatus` enum('not_confirmed','website_granted','meta_form_submitted','revoked') NOT NULL DEFAULT 'not_confirmed',
	`interest` varchar(160),
	`linkedUserId` int,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meta_lead_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaLeadId` varchar(128) NOT NULL,
	`pageId` varchar(128) NOT NULL,
	`metaFormId` varchar(128),
	`metaAdSetId` varchar(128),
	`metaAdId` varchar(128),
	`providerCreatedAt` timestamp,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`payloadDigest` varchar(64) NOT NULL,
	`structuralMetadata` text,
	`processingStatus` enum('received','processing','retry_scheduled','processed','manual_review','ignored') NOT NULL DEFAULT 'received',
	`attempts` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp,
	`lastErrorCode` varchar(96),
	`lastErrorAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_lead_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_lead_event_lead_unique` UNIQUE(`metaLeadId`)
);
--> statement-breakpoint
CREATE TABLE `meta_lead_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`metaFormId` varchar(128) NOT NULL,
	`formName` varchar(255),
	`formStatus` varchar(64),
	`lastReceivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_lead_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_lead_form_integration_form_unique` UNIQUE(`integrationId`,`metaFormId`)
);
--> statement-breakpoint
CREATE TABLE `meta_lead_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` varchar(128) NOT NULL,
	`pageName` varchar(255),
	`status` enum('not_configured','awaiting_subscription','connected','attention','disabled') NOT NULL DEFAULT 'not_configured',
	`graphApiVersion` varchar(24),
	`lastWebhookReceivedAt` timestamp,
	`lastSuccessfulLeadAt` timestamp,
	`lastErrorAt` timestamp,
	`lastErrorCode` varchar(96),
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_lead_integrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_lead_integrations_pageId_unique` UNIQUE(`pageId`)
);
--> statement-breakpoint
CREATE TABLE `meta_lead_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaLeadId` varchar(128) NOT NULL,
	`marketingLeadId` int NOT NULL,
	`metaLeadEventId` int NOT NULL,
	`pageId` varchar(128) NOT NULL,
	`formId` varchar(128) NOT NULL,
	`formName` varchar(255),
	`campaignId` varchar(128),
	`campaignName` varchar(255),
	`adSetId` varchar(128),
	`adSetName` varchar(255),
	`adId` varchar(128),
	`adName` varchar(255),
	`sourcePlacement` varchar(96),
	`submittedAt` timestamp,
	`fieldDataJson` text NOT NULL,
	`customDisclaimerResponsesJson` text,
	`mappedInterest` varchar(160),
	`isTestLead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meta_lead_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_lead_records_metaLeadId_unique` UNIQUE(`metaLeadId`),
	CONSTRAINT `meta_lead_records_metaLeadEventId_unique` UNIQUE(`metaLeadEventId`)
);
--> statement-breakpoint
ALTER TABLE `advertising_leads` ADD `marketingLeadId` int;--> statement-breakpoint
CREATE INDEX `marketing_lead_activity_lead_created_idx` ON `marketing_lead_activities` (`marketingLeadId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `marketing_lead_activity_source_idx` ON `marketing_lead_activities` (`sourceRecordType`,`sourceRecordId`);--> statement-breakpoint
CREATE INDEX `marketing_lead_stage_activity_idx` ON `marketing_leads` (`stage`,`lastActivityAt`);--> statement-breakpoint
CREATE INDEX `marketing_lead_email_lookup_idx` ON `marketing_leads` (`normalizedEmail`);--> statement-breakpoint
CREATE INDEX `marketing_lead_phone_lookup_idx` ON `marketing_leads` (`normalizedPhone`);--> statement-breakpoint
CREATE INDEX `marketing_lead_user_idx` ON `marketing_leads` (`linkedUserId`);--> statement-breakpoint
CREATE INDEX `meta_lead_event_status_due_idx` ON `meta_lead_events` (`processingStatus`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `meta_lead_event_page_received_idx` ON `meta_lead_events` (`pageId`,`receivedAt`);--> statement-breakpoint
CREATE INDEX `meta_lead_form_integration_idx` ON `meta_lead_forms` (`integrationId`,`lastReceivedAt`);--> statement-breakpoint
CREATE INDEX `meta_lead_record_marketing_lead_idx` ON `meta_lead_records` (`marketingLeadId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `meta_lead_record_form_submitted_idx` ON `meta_lead_records` (`formId`,`submittedAt`);--> statement-breakpoint
CREATE INDEX `advertising_lead_marketing_lead_idx` ON `advertising_leads` (`marketingLeadId`);