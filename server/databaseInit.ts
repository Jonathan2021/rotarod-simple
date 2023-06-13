import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
  // Open the database connection
  const db = await open({
    filename: './database/myDatabase.db',
    driver: sqlite3.Database
  });

  // Execute SQL queries to create tables

  // MouseGroupFamily
  await db.run(`
    CREATE TABLE MouseGroupFamily (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);

  // MouseGroup
  await db.run(`
    CREATE TABLE MouseGroup (
      id INTEGER PRIMARY KEY,
      mouse_group_family_id INTEGER,
      precision TEXT,
      FOREIGN KEY (mouse_group_family_id) REFERENCES MouseGroupFamily(id)
    )
  `);

  // Mouse
  await db.run(`
    CREATE TABLE Mouse (
      id INTEGER PRIMARY KEY,
      mouse_group_id INTEGER,
      FOREIGN KEY (mouse_group_id) REFERENCES MouseGroup(id)
    )
  `);

  // Experiment
  await db.run(`
    CREATE TABLE Experiment (
      id INTEGER PRIMARY KEY,
      description TEXT
    )
  `);

  // Experimentator
  await db.run(`
    CREATE TABLE Experimentator (
      id INTEGER PRIMARY KEY,
      firstname TEXT,
      surname TEXT
    )
  `);

  // Daily_Experiment
  await db.run(`
    CREATE TABLE Daily_Experiment (
      id INTEGER PRIMARY KEY,
      experiment_id INTEGER,
      experimentator INTEGER,
      date TEXT,
      acclimatation_time TEXT,
      temperature REAL,
      lux INTEGER,
      humidity INTEGER,
      FOREIGN KEY (experiment_id) REFERENCES Experiment(id),
      FOREIGN KEY (experimentator) REFERENCES Experimentator(id)
    )
  `);

  // Trials
  await db.run(`
    CREATE TABLE Trials (
      id INTEGER PRIMARY KEY,
      daily_experiment_id INTEGER,
      time TEXT,
      FOREIGN KEY (daily_experiment_id) REFERENCES Daily_Experiment(id)
    )
  `);

  // Trial_line
  await db.run(`
    CREATE TABLE Trial_line (
      mouse_id INTEGER,
      trial_id INTEGER,
      duration REAL,
      FOREIGN KEY (mouse_id) REFERENCES Mouse(id),
      FOREIGN KEY (trial_id) REFERENCES Trials(id)
    )
  `);

  // Create indexes
  await db.run(`
    CREATE INDEX idx_trial_line_mouse_id
    ON Trial_line (mouse_id)
  `);

  await db.run(`
    CREATE INDEX idx_trial_line_trial_id
    ON Trial_line (trial_id)
  `);

  console.log('Database and tables created successfully');
})();
