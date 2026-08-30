CREATE TABLE `support_request_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supportRequestId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`customerUpdate` text,
	`internalNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_request_events_id` PRIMARY KEY(`id`)
);
