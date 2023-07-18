import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { getDatabase } from './utils';

(async () => {
  // Open the database connection
  const db = await getDatabase();
  // Execute SQL queries to create tables
  await db.run(`
  CREATE TABLE "Study" (
    "id" INTEGER PRIMARY KEY,
    "title" VARCHAR UNIQUE
  )`);

  await db.run(`
  CREATE TABLE "Experiment" (
    "id" INTEGER PRIMARY KEY,
    "study_id" INTEGER,
    "title" VARCHAR,
    FOREIGN KEY ("study_id") REFERENCES "Study" ("id")
  )`);

  await db.run(`CREATE UNIQUE INDEX "experiment_study_title_index" ON "Experiment" ("study_id", "title")`);
  await db.run(`CREATE INDEX "experiment_study_index" ON "Experiment" ("study_id")`);

  await db.run(`
  CREATE TABLE "Cage" (
    "id" INTEGER PRIMARY KEY,
    "cage_nb" INTEGER,
    "exp_id" INTEGER,
    FOREIGN KEY ("exp_id") REFERENCES "Experiment" ("id")
  )`);
  
  await db.run(`CREATE INDEX "cage_exp_id" ON "Cage" ("exp_id")`);

  await db.run(`
  CREATE TABLE "Mouse" (
    "id" INTEGER PRIMARY KEY,
    "cage_id" INTEGER,
    "ucb_identifier" INTEGER,
    "zigosity" VARCHAR,
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id")
  )`);
  
  await db.run(`CREATE INDEX "mouse_cage_id" ON "Mouse" ("cage_id")`);

  await db.run(`
  CREATE TABLE "Run" (
    "id" INTEGER PRIMARY KEY,
    "experiment_id" INTEGER,
    "is_constant_rpm" INTEGER CHECK("is_constant_rpm" IN (0, 1)),
    "rpm" INTEGER,
    "experimentator" VARCHAR,
    "date_acclim" TIMESTAMP,
    "temperature" VARCHAR,
    "humidity" VARCHAR,
    "lux" VARCHAR,
    "other" VARCHAR,
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id")
  )`);
  
  await db.run(`CREATE INDEX "run_experiment_index" ON "Run" ("experiment_id")`);

  await db.run(`
  CREATE TABLE "Run_Ordering" (
    "cage_id" INTEGER,
    "run_id" INTEGER,
    "order" INTEGER,
    PRIMARY KEY ("cage_id", "run_id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id"),
    FOREIGN KEY ("run_id") REFERENCES "Run" ("id")
  )`);

  await db.run(`CREATE UNIQUE INDEX "run_ordering_index" ON "Run_Ordering" ("run_id", "order")`);

  await db.run(`
  CREATE TABLE "Trial" (
    "id" INTEGER PRIMARY KEY,
    "run_id" INTEGER,
    "trial_nb" INTEGER,
    FOREIGN KEY ("run_id") REFERENCES "Run" ("id")
  )`);

  await db.run(`CREATE UNIQUE INDEX "trial_index" ON "Trial" ("run_id", "trial_nb")`);

  await db.run(`
  CREATE TABLE "Trial_record" (
    "trial_id" INTEGER,
    "mouse_id" INTEGER,
    "time_record" INTEGER,
    "rpm_record" INTEGER,
    FOREIGN KEY ("trial_id") REFERENCES "Trial" ("id"),
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id")
  )`);


  console.log('Database and tables created successfully');
})();

