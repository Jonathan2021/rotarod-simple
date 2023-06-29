import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { getDatabase } from './utils';

(async () => {
  // Open the database connection
  const db = await getDatabase();
  // Execute SQL queries to create tables

  await db.run(`
    CREATE TABLE "Group" (
    "id" integer PRIMARY KEY,
    "title" varchar,
    "description" varchar
    )`);

  await db.run(`
    CREATE TABLE "Ethical_Project" (
    "id" integer PRIMARY KEY,
    "title" varchar UNIQUE
    )`);

  await db.run(`
    CREATE TABLE "Ethical_Experiment" (
    "id" integer PRIMARY KEY,
    "eth_project_id" integer,
    "title" varchar UNIQUE,
    FOREIGN KEY ("eth_project_id") REFERENCES "Ethical_Project" ("id") ON DELETE CASCADE
    )`);

  await db.run(`
    CREATE TABLE "Study" (
    "id" integer PRIMARY KEY,
    "eth_project_id" integer,
    "eth_exp_id" integer,
    "title" varchar UNIQUE,
    "objective" varchar,
    FOREIGN KEY ("eth_project_id") REFERENCES "Ethical_Project" ("id"),
    FOREIGN KEY ("eth_exp_id") REFERENCES "Ethical_Experiment" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Batch_tickatlab" (
    "study_id" integer,
    "batch_nb" integer,
    "description" varchar,
    PRIMARY KEY ("study_id", "batch_nb"),
    FOREIGN KEY ("study_id") REFERENCES "Study" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Mouse" (
    "id" integer PRIMARY KEY,
    "mouse_nb" integer,
    "study_id" integer,
    FOREIGN KEY ("study_id") REFERENCES "Study" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Place" (
    "id" integer PRIMARY KEY,
    "title" integer UNIQUE
    )`);

  await db.run(`
    CREATE TABLE "Experiment" (
    "id" integer PRIMARY KEY,
    "study_id" integer,
    "title" varchar,
    "test_info" varchar,
    "creation_date" timestamp,
    FOREIGN KEY ("study_id") REFERENCES "Study" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Cage" (
    "id" integer PRIMARY KEY,
    "cage_nb" integer
    )`);

  await db.run(`
    CREATE TABLE "Cage_Group" (
    "cage_id" integer,
    "group_id" integer,
    PRIMARY KEY ("cage_id", "group_id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id"),
    FOREIGN KEY ("group_id") REFERENCES "Group" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Mouse_Cage" (
    "mouse_id" integer,
    "cage_id" integer,
    PRIMARY KEY ("mouse_id", "cage_id"),
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Cage_Experiment" (
    "id" integer PRIMARY KEY,
    "cage_id" integer,
    "experiment_id" integer,
    FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id"),
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id")
    )`);

  await db.run(`Create UNIQUE INDEX "cage_experiment_index" ON "Cage_Experiment" ("cage_id", "experiment_id")`);

  await db.run(`
    CREATE TABLE "Experimentator" (
    "id" integer PRIMARY KEY,
    "firstname" varchar,
    "surname" varchar
    )`);
  
    await db.run(`Create UNIQUE INDEX "experimentator_index" ON "Experimentator" ("firstname", "surname")`);

  await db.run(`
    CREATE TABLE "Daily_Experiment" (
    "id" integer PRIMARY KEY,
    "experiment_id" integer,
    "place_id" integer,
    "datetime" timestamp,
    "temperature" float,
    "lux" integer,
    "humidity" integer,
    "additional_info" varchar,
    FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id"),
    FOREIGN KEY ("place_id") REFERENCES "Place" ("id")
    )`);

  await db.run(`
    CREATE TABLE "Daily_Cage_Order" (
    "daily_experiment_id" integer,
    "cage_experiment_id" integer,
    "order" integer,
    PRIMARY KEY ("daily_experiment_id", "cage_experiment_id"),
    FOREIGN KEY ("daily_experiment_id") REFERENCES "Daily_Experiment" ("id"),
    FOREIGN KEY ("cage_experiment_id") REFERENCES "Cage_Experiment" ("id")
    )`);
    
    await db.run(`Create UNIQUE INDEX "daily_cage_order_index" ON "Daily_Cage_Order" ("daily_experiment_id", "order")`);

  await db.run(`
    CREATE TABLE "Daily_Experimentator" (
    "daily_experiment_id" integer,
    "experimentator_id" integer,
    PRIMARY KEY ("daily_experiment_id", "experimentator_id"),
    FOREIGN KEY ("daily_experiment_id") REFERENCES "Daily_Experiment" ("id"),
    FOREIGN KEY ("experimentator_id") REFERENCES "Experimentator" ("id")
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
    PRIMARY KEY ("mouse_id", "trial_id"),
    FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id"),
    FOREIGN KEY ("trial_id") REFERENCES "Trial" ("id")
    )`);

  // Triggers
  await db.run(`
  CREATE TRIGGER enforce_mouse_cage_constraint
  BEFORE INSERT ON Mouse_Cage
  FOR EACH ROW
  BEGIN
    SELECT CASE
      WHEN ((SELECT study_id FROM Mouse WHERE id = NEW.mouse_id) != 
            (SELECT Experiment.study_id FROM Cage_Experiment
             INNER JOIN Experiment ON Cage_Experiment.experiment_id = Experiment.id 
             WHERE Cage_Experiment.cage_id = NEW.cage_id))
      THEN RAISE (ABORT, 'Constraint violation: mouse_id > study_id != cage_id > Cage_Experiment > experiment_id > study_id')
    END;
  END;`);

  await db.run(`
  CREATE TRIGGER enforce_daily_cage_order_constraint
  BEFORE INSERT ON Daily_Cage_Order
  FOR EACH ROW
  BEGIN
    SELECT CASE
      WHEN ((SELECT experiment_id FROM Daily_Experiment WHERE id = NEW.daily_experiment_id) != 
            (SELECT experiment_id FROM Cage_Experiment WHERE id = NEW.cage_experiment_id))
      THEN RAISE (ABORT, 'Constraint violation: daily_experiment_id > experiment_id != cage_experiment_id > experiment_id')
    END;
  END;
`);

  // Insert stuff in tables here

  console.log('Database and tables created successfully');
})();

