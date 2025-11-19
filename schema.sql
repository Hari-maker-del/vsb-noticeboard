PRAGMA foreign_keys = ON;
class_code TEXT NOT NULL,
period TEXT,
monday TEXT, tuesday TEXT, wednesday TEXT, thursday TEXT, friday TEXT,
FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);


-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
id INTEGER PRIMARY KEY AUTOINCREMENT,
class_code TEXT NOT NULL,
time TEXT,
subject TEXT,
faculty TEXT,
room TEXT,
"order" INTEGER DEFAULT 0,
FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);


-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
id INTEGER PRIMARY KEY AUTOINCREMENT,
class_code TEXT NOT NULL,
name TEXT,
subject TEXT,
availability TEXT,
photo TEXT,
FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);


-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
id INTEGER PRIMARY KEY AUTOINCREMENT,
class_code TEXT NOT NULL,
task TEXT,
deadline TEXT,
priority TEXT,
FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);


-- Performance
CREATE TABLE IF NOT EXISTS performance (
id INTEGER PRIMARY KEY AUTOINCREMENT,
class_code TEXT NOT NULL,
metric_index INTEGER,
value INTEGER,
FOREIGN KEY (class_code) REFERENCES classes(code) ON DELETE CASCADE
);


-- Placement stats
CREATE TABLE IF NOT EXISTS placement_stats (
id INTEGER PRIMARY KEY AUTOINCREMENT,
placement_rate INTEGER,
highest_package INTEGER,
companies_visited INTEGER
);


-- Admins
CREATE TABLE IF NOT EXISTS admins (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT UNIQUE NOT NULL,
password_hash TEXT NOT NULL
);


-- Seed classes
INSERT OR IGNORE INTO classes (code, name) VALUES ('IT-A','IT-A'),('IT-B','IT-B'),('IT-C','IT-C');


-- Seed a couple announcements for IT-A
INSERT INTO announcements (class_code, title, content, priority, icon, time, "order")
VALUES
('IT-A','Project Submission Deadline','Final year project reports must be submitted by May 15th. Late submissions will not be accepted.','high','fa-exclamation-triangle','1 hour ago', 1),
('IT-A','Lab Test Rescheduled','Database Management Lab test has been rescheduled to Thursday, 2:00 PM.','medium','fa-clock','3 hours ago', 2);


-- Seed placement stats
INSERT OR IGNORE INTO placement_stats (placement_rate, highest_package, companies_visited)
VALUES (95, 42, 180);