-- Sports App – Cloudflare D1 Schema
-- Run with: wrangler d1 execute sports-db --file=schema.sql

CREATE TABLE IF NOT EXISTS sports (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL UNIQUE,
  icon      TEXT    NOT NULL DEFAULT '🏅'
);

CREATE TABLE IF NOT EXISTS teams (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT    NOT NULL,
  sport_id INTEGER NOT NULL REFERENCES sports(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sport_id     INTEGER NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  home_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_score   INTEGER NOT NULL DEFAULT 0,
  away_score   INTEGER NOT NULL DEFAULT 0,
  match_date   TEXT    NOT NULL,
  location     TEXT    NOT NULL DEFAULT ''
);

-- Seed data
INSERT OR IGNORE INTO sports (name, icon) VALUES
  ('Football',   '⚽'),
  ('Basketball', '🏀'),
  ('Volleyball', '🏐'),
  ('Tennis',     '🎾'),
  ('Swimming',   '🏊');

INSERT OR IGNORE INTO teams (name, sport_id) VALUES
  ('Team A', 1),
  ('Team B', 1),
  ('Team C', 2),
  ('Team D', 2);

INSERT OR IGNORE INTO matches (sport_id, home_team_id, away_team_id, home_score, away_score, match_date, location) VALUES
  (1, 1, 2, 3, 1, '2024-03-15', 'School Field'),
  (2, 3, 4, 78, 65, '2024-03-18', 'School Gym');
