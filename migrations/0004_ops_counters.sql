CREATE TABLE `ops_counters` (
	`day` text NOT NULL,
	`metric` text NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`day`, `metric`)
);
