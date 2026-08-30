CREATE TABLE `eligibility_policy_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eligibilityPolicyId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`fromStatus` varchar(32),
	`toStatus` varchar(32),
	`note` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eligibility_policy_events_id` PRIMARY KEY(`id`)
);
