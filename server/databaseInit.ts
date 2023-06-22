import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { getDatabase } from './utils/databaseUtils';

(async () => {
  // Open the database connection
  const db = await getDatabase();
  // Execute SQL queries to create tables

  await db.run(`
    CREATE TABLE "Mouse_Group_Family" (
    "id" integer PRIMARY KEY,
    "title" varchar,
    "description" varchar
    )`);

  await db.run(`
    CREATE TABLE "Mouse_Group" (
    "id" integer PRIMARY KEY,
    "group_family_id" integer,
    "title" varchar,
    "description" varchar,
    FOREIGN KEY ("group_family_id") REFERENCES "Mouse_Group_Family" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Study" (
    "id" integer PRIMARY KEY,
    "title" varchar,
    "description" varchar
    )`);

  await db.run(`
    CREATE TABLE "Mouse" (
    "id" integer PRIMARY KEY,
    "study_id" integer,
    "group_id" integer,
    FOREIGN KEY ("study_id") REFERENCES "Study" ("id"),
    FOREIGN KEY ("group_id") REFERENCES "Mouse_Group" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Cage" (
    "id" integer PRIMARY KEY,
    "cage_nb" integer
    )`);

  await db.run(`
    CREATE TABLE "Mouse_Cage" (
    "id" integer PRIMARY KEY,
    "mouse_id" integer,
    "cage_id" integer,
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id")
    )`);

  await db.run(`Create UNIQUE INDEX "mouse_cage_index" ON "Mouse_Cage" ("mouse_id", "cage_id")`);

  await db.run(`
    CREATE TABLE "Project"(
    "id" integer PRIMARY KEY,
    "title" varchar,
    "description" varchar
    )`);

  await db.run(`
    CREATE TABLE "Place"(
    "id" integer PRIMARY KEY,
    "title" varchar,
    "description" varchar
    )`);

  await db.run(`
    CREATE TABLE "Experiment" (
    "id" integer PRIMARY KEY,
    "project_id" integer,
    "title" varchar,
    "objective" varchar,
    "animals_description" varchar,
    "additional_info" varchar,
    "creation_date" timestamp,
    FOREIGN KEY ("project_id") REFERENCES "Project" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Cage_Experiment" (
    "cage_id" integer,
    "experiment_id" integer,
    PRIMARY KEY ("cage_id", "experiment_id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id"),
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Experimentator" (
    "id" integer PRIMARY KEY,
    "firstname" varchar,
    "surname" varchar
    )`);

  await db.run(`
    CREATE TABLE "Daily_Experiment" (
    "id" integer PRIMARY KEY,
    "experiment_id" integer,
    "experimentator_id" integer,
    "place_id" integer,
    "acclimatation_time" timestamp,
    "temperature" float,
    "lux" integer,
    "humidity" integer,
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id"),
    FOREIGN KEY ("experimentator_id") REFERENCES "Experimentator" ("id"),
    FOREIGN KEY ("place_id") REFERENCES "Place" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Trial" (
    "id" integer PRIMARY KEY,
    "daily_experiment_id" integer,
    "time" timestamp,
    FOREIGN KEY ("daily_experiment_id") REFERENCES "Daily_Experiment" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Trial_line" (
    "mouse_id" integer,
    "trial_id" integer,
    "duration_sec" float,
    "mouse_order" integer,
    PRIMARY KEY ("mouse_id", "trial_id"),
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("trial_id") REFERENCES "Trial" ("id")
    )`);
  
  await db.run(`CREATE UNIQUE INDEX "mouse_order_index" ON "Trial_line" ("mouse_order", "mouse_id")`);

  console.log('Database and tables created successfully');
})();

