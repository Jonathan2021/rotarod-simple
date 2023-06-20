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
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "name" varchar
    )`);

  await db.run(`
    CREATE TABLE "Mouse_Group" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "group_family_id" integer,
    "precision" varchar,
    FOREIGN KEY ("group_family_id") REFERENCES "Mouse_Group_Family" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Mouse" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "group_id" integer,
    FOREIGN KEY ("group_id") REFERENCES "Mouse_Group" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Cage" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "cage_nb" integer
    )`);

  await db.run(`
    CREATE TABLE "Mouse_Cage" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "mouse_id" integer,
    "cage_id" integer,
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id")
    )`);
  
  await db.run(`Create UNIQUE INDEX "mouse_cage_index" ON "Mouse_Cage" ("mouse_id", "cage_id")`);

  await db.run(`
    CREATE TABLE "Experiment" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "title" varchar,
    "description" varchar,
    "creation_date" timestamp
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
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "firstname" varchar,
    "surname" varchar
    )`);

  await db.run(`
    CREATE TABLE "Daily_Experiment" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "experiment_id" integer,
    "experimentator_id" integer,
    "date" varchar,
    "acclimatation_time" varchar,
    "temperature" float,
    "lux" integer,
    "humidity" integer,
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id"),
    FOREIGN KEY ("experimentator_id") REFERENCES "Experimentator" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Trial" (
    "id" integer PRIMARY KEY AUTOINCREMENT,
    "daily_experiment_id" integer,
    "time" timestamp,
    FOREIGN KEY ("daily_experiment_id") REFERENCES "Daily_Experiment" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Trial_line" (
    "mouse_id" integer,
    "trial_id" integer,
    "duration" float,
    "mouse_order" integer,
    PRIMARY KEY ("mouse_id", "trial_id"),
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("trial_id") REFERENCES "Trial" ("id"),
    UNIQUE ("mouse_order", "trial_id")
    )`);
  

  console.log('Database and tables created successfully');

  // Inserting dummy data
  //await db.run(
  //  `INSERT INTO "Experiment" ("title", "description", "creation_date") 
  //  VALUES ("New Experiment", "No description.", date('now'))`);
  
  //await db.run(
  //  `INSERT INTO "Mouse" ("group_id") 
  //  VALUES (NULL)`);

  //await db.run(
  //  `INSERT INTO "Mouse" ("group_id") 
  //  VALUES (NULL)`);

})();
