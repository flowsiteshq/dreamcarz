CREATE TABLE `google_oauth_identities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleSubject` varchar(255) NOT NULL,
	`emailAtLink` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `google_oauth_identities_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_oauth_identities_googleSubject_unique` UNIQUE(`googleSubject`),
	CONSTRAINT `google_oauth_identity_user_unique` UNIQUE(`userId`)
);
