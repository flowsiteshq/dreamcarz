CREATE TABLE `associate_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`associateUserId` int NOT NULL,
	`contactName` varchar(160) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(48),
	`interestType` enum('membership','rental','purchase','fleet_partner','associate','general') NOT NULL DEFAULT 'general',
	`status` enum('new','contacted','qualified','converted','closed') NOT NULL DEFAULT 'new',
	`consentToContact` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `associate_leads_id` PRIMARY KEY(`id`)
);
