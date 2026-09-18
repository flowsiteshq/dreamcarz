CREATE TABLE `staff_sms_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('marketing_opt_in','associate_opt_in','associate_enrollment_activated') NOT NULL,
	`sourceRecordType` enum('marketing_lead','advertising_lead','associate_lead','associate_enrollment') NOT NULL,
	`sourceRecordId` varchar(160) NOT NULL,
	`deliveryKey` varchar(255) NOT NULL,
	`recipientHash` varchar(64) NOT NULL,
	`status` enum('disabled','pending','sending','sent','retry_scheduled','failed') NOT NULL DEFAULT 'disabled',
	`message` varchar(480) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`nextAttemptAt` timestamp,
	`lastErrorCode` varchar(96),
	`providerMessageSid` varchar(160),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `staff_sms_notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `staff_sms_notifications_deliveryKey_unique` UNIQUE(`deliveryKey`)
);
--> statement-breakpoint
CREATE INDEX `staff_sms_status_due_idx` ON `staff_sms_notifications` (`status`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `staff_sms_source_idx` ON `staff_sms_notifications` (`sourceRecordType`,`sourceRecordId`);