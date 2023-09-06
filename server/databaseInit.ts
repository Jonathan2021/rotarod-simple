import { getDatabase } from './utils';

async function createTableIfNotExists(db, tableName, tableSchema) {
  const tableExists = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`);
  if (!tableExists) {
    await db.run(tableSchema);
  }
}

async function createIndexIfNotExists(db, indexName, indexSchema) {
  const indexExists = await db.get(`SELECT name FROM sqlite_master WHERE type='index' AND name='${indexName}';`);
  if (!indexExists) {
    await db.run(indexSchema);
  }
}

(async () => {
  // Open the database connection
  const db = await getDatabase();

  // Create tables if they don't exist
  await createTableIfNotExists(db, 'Study', `
    CREATE TABLE "Study" (
      "id" INTEGER PRIMARY KEY,
      "title" VARCHAR UNIQUE,
      "eth_proj" VARCHAR,
      "tickat" VARCHAR
    )`);

  await createTableIfNotExists(db, 'Experiment', `
    CREATE TABLE "Experiment" (
      "id" INTEGER PRIMARY KEY,
      "study_id" INTEGER,
      "title" VARCHAR,
      "creation_dt" TIMESTAMP,
      FOREIGN KEY ("study_id") REFERENCES "Study" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Cage', `
    CREATE TABLE "Cage" (
      "id" INTEGER PRIMARY KEY,
      "cage_nb" INTEGER,
      "exp_id" INTEGER,
      FOREIGN KEY ("exp_id") REFERENCES "Experiment" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Mouse', `
    CREATE TABLE "Mouse" (
      "id" INTEGER PRIMARY KEY,
      "cage_id" INTEGER,
      "ucb_identifier" INTEGER,
      "zigosity" VARCHAR,
      "treatment" VARCHAR,
      FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Run', `
    CREATE TABLE "Run" (
      "id" INTEGER PRIMARY KEY,
      "experiment_id" INTEGER,
      "place" VARCHAR,
      "is_constant_rpm" INTEGER CHECK("is_constant_rpm" IN (0, 1)),
      "rpm" INTEGER,
      "experimentator" VARCHAR,
      "date_acclim" TIMESTAMP,
      "temperature" VARCHAR,
      "humidity" VARCHAR,
      "lux" VARCHAR,
      "other" VARCHAR,
      FOREIGN KEY ("experiment_id") REFERENCES "Experiment" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Run_Ordering', `
    CREATE TABLE "Run_Ordering" (
      "cage_id" INTEGER,
      "run_id" INTEGER,
      "ordering" INTEGER,
      PRIMARY KEY ("cage_id", "run_id"),
      FOREIGN KEY ("cage_id") REFERENCES "Cage" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("run_id") REFERENCES "Run" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Trial', `
    CREATE TABLE "Trial" (
      "id" INTEGER PRIMARY KEY,
      "run_id" INTEGER,
      "trial_nb" INTEGER,
      "trial_time" TIMESTAMP,
      FOREIGN KEY ("run_id") REFERENCES "Run" ("id") ON DELETE CASCADE
    )`);

  await createTableIfNotExists(db, 'Trial_record', `
    CREATE TABLE "Trial_record" (
      "trial_id" INTEGER,
      "mouse_id" INTEGER,
      "time_record" INTEGER,
      "rpm_record" INTEGER,
      "event" INTEGER CHECK("event" IN (0,1)),
      FOREIGN KEY ("trial_id") REFERENCES "Trial" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("mouse_id") REFERENCES "Mouse" ("id") ON DELETE SET NULL
    )`);

  // Create indices if they don't exist
  await createIndexIfNotExists(db, 'experiment_study_title_index', 
    `CREATE UNIQUE INDEX "experiment_study_title_index" ON "Experiment" ("study_id", "title")`);

  await createIndexIfNotExists(db, 'experiment_study_index', 
    `CREATE INDEX "experiment_study_index" ON "Experiment" ("study_id")`);

  await createIndexIfNotExists(db, 'cage_exp_id', 
    `CREATE INDEX "cage_exp_id" ON "Cage" ("exp_id")`);

  await createIndexIfNotExists(db, 'cage_nb_exp_id', 
    `CREATE UNIQUE INDEX "cage_nb_exp_id" ON "Cage" ("cage_nb", "exp_id")`);

  await createIndexIfNotExists(db, 'mouse_cage_id', 
    `CREATE INDEX "mouse_cage_id" ON "Mouse" ("cage_id")`);

  await createIndexIfNotExists(db, 'run_experiment_index', 
    `CREATE INDEX "run_experiment_index" ON "Run" ("experiment_id")`);

  await createIndexIfNotExists(db, 'run_ordering_index', 
    `CREATE UNIQUE INDEX "run_ordering_index" ON "Run_Ordering" ("run_id", "ordering")`);

  await createIndexIfNotExists(db, 'trial_id_nb_index', 
    `CREATE UNIQUE INDEX "trial_id_nb_index" ON "Trial" ("id", "trial_nb")`);

  console.log('Database tables and indices created successfully if they do not exist');
})();