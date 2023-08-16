import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import Excel from 'exceljs';
import os from "os";

import {
  isUniqueConstraintError, NotFoundError,
  getStudies, createStudy, updateStudy, deleteStudy,
  getExperimentsFromStudy, createExperiment, updateExperiment, deleteExperiment, countRunsWithTrialsExp,
  getRunsFromExperiment, createRun, updateRun, deleteRun, getRun, getRuns,
  getCageCompleteFromExp, getAllCagesFromExp, deleteCage, createCage,
  getExperiment,
  updateMouse, deleteMouse, createMouse, getAllMiceFromExp,
  shuffleArray,
  getCageOrder,
  getTrialsAndRecords,
  createCageOrder,
  deleteAllCagesExp,
  getMice,
  getCages,
  updateTrial, createTrial, updateTrialRecord, createTrialRecord, deleteTrial, deleteTrialRecord, getTrials, getTrialRecords, deleteAllTrials, deleteAllTrialRecords,
  getTrialsFromRun, getRecordsFromTrial, getMouse, getRunOrdering, getOrderingFromRun, getCage, getMiceFromCage, getTrialsFromRunForMouse, getStudy
} from './server/utils'

declare module 'express-session' {
  export interface SessionData {
    CorporateAccount: string; // Add your session values here.
    // Other data...
  }
}

const app: express.Application = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Adjust the views directory path
app.set('views', path.join(__dirname, 'client', 'views'));

app.use(
  session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Note: a secure cookie requires an HTTPS connection
  })
);

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
  if (!req.session.CorporateAccount) {
    console.log("Back to login")
    console.log(req.url)
    res.redirect('/auth/login.html');
  } else {
    next();
  }
};

// Define a list of routes to be excluded from authentication
const excludeRoutes = ['/auth/login', '/auth/login.html', '/assets/css/login.css', '/assets/js/login.js'];

// Apply middleware to the application
app.use((req, res, next) => {
  // Check if the current URL is in the list of excluded routes
  if (excludeRoutes.includes(req.url)) {
    // If it is, simply continue without authentication
    next();
  } else {
    // If it isn't, authenticate the user
    authenticateUser(req, res, next);
  }
});

// Serve static files from the 'client' directory
app.use(express.static('client'));

// Define routes AFTER middleware
app.post('/auth/login', setUserAuth);

app.get('/', async(req, res) => {
  if (req.session.CorporateAccount) {
    // If user is logged in, redirect to the main page
    res.redirect('/main');
  } else {
    // If user is not logged in, redirect to the login page
    res.redirect('/auth/login.html');
  }
});

// All routes

// Main page listing studies etc.
app.get('/main', async(req, res) => {
  res.render('main')
});

// Fetching all the studies
app.get('/study_data', async(req, res) => {
  try {
    const studies = await getStudies();
    res.json(studies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred while fetching studies.' }); // HTTP status 500: Internal Server Error
  }
});

// Fetching all the experiments from a study
app.get('/study/:study_id/experiment_data', async(req, res) => {
  try {
    const experiments = await getExperimentsFromStudy(req.params.study_id);
    res.json(experiments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred while fetching the experiments for the study.' }); // HTTP status 500: Internal Server Error
  }
});

// Fetching all the runs from an experiment
app.get('/study/:study_id/experiment/:exp_id/run_data', async(req, res) => {
  console.log("Getting run data");
  const all_runs = await getRuns();
  console.log("All runs ", all_runs);
  console.log("exp_id ", req.params.exp_id);
  try {
    const runs = await getRunsFromExperiment(req.params.exp_id);
    console.log(runs);
    res.json(runs);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred while fetching the runs for the experiment.' }); // HTTP status 500: Internal Server Error
  }
});

app.get('/experiment/:exp_id/cages', async(req, res) => {
  const { exp_id } = req.params;
  try {
      const cages = await getAllCagesFromExp(exp_id);
      res.json(cages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error : 'An error occured while fetching the cages of the experiment.'});
  }
});


// Create a new study
app.post('/study', async (req, res) => {
  let { title } = req.body;
 
  try {
    const id = await createStudy(title);
    res.json({ id });
  } catch (err) {
    console.log(err);
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'A study with this title already exists' }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while creating the study.' }); // HTTP status 500: Internal Server Error
    }
  }
});

// Update a study
app.put('/study/:study_id', async (req, res) => {
  const { study_id } = req.params;
  const { newTitle } = req.body;
  
  try {
    await updateStudy(study_id, newTitle);
    res.json({ study_id });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'A study with this title already exists' }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while updating the study.' }); // HTTP status 500: Internal Server Error
    }
  }
});

// Delete a study
app.delete('/study/:study_id', async (req, res) => {
  const { study_id } = req.params;
  
  try {
    await deleteStudy(study_id);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else {
      res.status(500).json({ error: 'An error occurred while deleting the study.' }); // HTTP status 500: Internal Server Error
    }
  }
});

// Getting the form for updating an experiment
app.get('/study/:study_id/experiment/:exp_id', async (req, res) => {
  const { study_id, exp_id } = req.params;
  try {
    const exp = await getExperiment(exp_id);
    if (!exp) {
      res.status(404).send("Couldn't find the requested experiment");
    } else {
      const cage_info = await getCageCompleteFromExp(exp_id);
      console.log("Got cage info ", cage_info);
      const nbRunsWithTrials = await countRunsWithTrialsExp(exp_id);
      res.render("update_exp_form", { cage_info, study_id, exp, nruns: nbRunsWithTrials });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred while getting the form for updating an experiment.' }); // HTTP status 500: Internal Server Error
  }
});

// Create a new experiment for a study
app.post('/study/:study_id/experiment', async (req, res) => {
  const { study_id } = req.params;
  const { title } = req.body;
 
  try {
    const id = await createExperiment(study_id, title);
    res.json({ id });
  } catch (err) {
    console.log(err);
    if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'An experiment with this title already exists for that study' }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while creating the experiment.' }); // HTTP status 500: Internal Server Error
    }
  }
});
interface ICageInfo {
  cage_nb: number;
  ucb_identifier: number;
  zigosity: string;
}

const updateExperimentCages = async (expId: number, cageInfo: ICageInfo[]) => {
  const res = await deleteAllCagesExp(expId);
  console.log("DELETED ", res);
  console.log("CAGEINFO", cageInfo);
  
  let grouped = {};
  for (let info of cageInfo)
  {
    if (!grouped[info.cage_nb])
      grouped[info.cage_nb] = [];
    grouped[info.cage_nb].push({ucb_identifier: info.ucb_identifier, zigosity: info.zigosity});
  }
  console.log("GROUPED ", grouped);
  let cage_id;
  for (let cage of Object.keys(grouped)) {
    cage_id = await createCage(cage, expId);
    for (let info_mouse of grouped[cage]) {
      await createMouse(cage_id, info_mouse.ucb_identifier, info_mouse.zigosity);
    }
  }
};

// Update an experiment
app.put('/study/:study_id/experiment/:exp_id', async (req, res) => {
  const exp_id = parseInt(req.params.exp_id);
  const { title } = req.body;
  
  try {
    await updateExperiment(exp_id, title);
    const nbRunsWithTrials = await countRunsWithTrialsExp(exp_id);
    if (!nbRunsWithTrials)
    {
      const cage_info = JSON.parse(req.body.cage_info);
      await updateExperimentCages(exp_id, cage_info);
    }
    res.json({ id: exp_id });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else if (isUniqueConstraintError(err)) {
      res.status(409).json({ error: 'An experiment with this title already exists' }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while updating the experiment.' }); // HTTP status 500: Internal Server Error
    }
  }
});

// Delete an experiment
app.delete('/study/:study_id/experiment/:exp_id', async (req, res) => {
  const exp_id = req.params.exp_id;
  
  try {
    await deleteExperiment(exp_id);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else {
      res.status(500).json({ error: 'An error occurred while deleting the experiment.' }); // HTTP status 500: Internal Server Error
    }
  }
});


const getCageMice = async (expId: number) => {
  let cage_info = await getCageCompleteFromExp(expId);
  let dict = {};

  for(let item of cage_info) {
    if(!dict[item.cage_nb]) {
      dict[item.cage_nb] = [];
    }
    dict[item.cage_nb].push({id: item.mouse_id, number: item.ucb_identifier});
  }
  return dict;
};

// Getting the run page for a new run
app.get('/study/:study_id/experiment/:exp_id/run', async (req, res) => {
  const { study_id, exp_id } = req.params;
  try
  {
    const cages = await getCageMice(parseInt(exp_id));
    const cage_order = shuffleArray(Object.keys(cages)).map(Number);
    console.log(cage_order);
    res.render('run_form', {study_id, exp_id, run: null, cages : JSON.stringify(cages), cage_order: JSON.stringify(cage_order), trials: JSON.stringify([]), trial_records : JSON.stringify([])});
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occured while retrieving the cages");
  }
});

// Getting the run page for an existing run
app.get('/study/:study_id/experiment/:exp_id/run/:run_id', async (req, res) => {
  const { run_id, exp_id, study_id } = req.params;
  console.log("Getting run")
  try {
    const run = await getRun(run_id);
    if (!run)
    {
      res.status(404).send("Couldn't find the requested run");
    } else {
      const cages = await getCageMice(parseInt(exp_id));
      let cage_order = await getCageOrder(run_id);
      console.log("CAGE ORDER WOOOW ", cage_order);
      // FIXME Hacky solution to someone modifying cages for an experiment with existing runs. Cage_order are deleted and now a new one needs to be done.
      if (!cage_order.length)
      {
        cage_order = shuffleArray(Object.keys(cages)).map(Number);
        if (cage_order.length)
          await createCageOrder(run_id, cage_order);
      }

      const trials = await getTrialsAndRecords(run_id);
      console.log("TrialsAndRecords RAW ", trials);
      let only_trials = [];
      let trial_records = {};
      for (let trial_id of Object.keys(trials)) {
          only_trials.push({
            id: trial_id,
            trial_time: trials[trial_id].trial_time,
            trial_nb: trials[trial_id].trial_nb,
            exists: true,
          });
          let cur_records = {};
          for (let record of trials[trial_id].records) {
            if (record.mouse_id) {
              cur_records[record.mouse_id] = {
                time_record: record.time_record ? record.time_record : "",
                rpm_record: record.rpm_record ? record.rpm_record : "",
                exists: true
              };
            }
          }
          trial_records[trial_id] = cur_records;
    }
    console.log("Run ", run);
    console.log("Cages ", cages);
    console.log("Cage order", cage_order);
    console.log("Only trials", only_trials);
    console.log("Trial records", trial_records);
    res.render('run_form', {study_id, exp_id, run: run, cages : JSON.stringify(cages), cage_order: JSON.stringify(cage_order), trials: JSON.stringify(only_trials), trial_records : JSON.stringify(trial_records)});
  }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occured while retrieving the run's information");
  }
});

const processRunTrials = async (run_id, trials, trial_records) => {
  console.log("Processing : ");
  console.log("trials : ", trials);
  console.log("records : ", trial_records);

  // Fetch existing trials and trial records for the given run
  const existingTrialsAndRecords = await getTrialsAndRecords(run_id);

  console.log("We have the following existing ", existingTrialsAndRecords);
  // Mapping existing trials for easy lookup
  const existingTrialsMap = {};
  Object.keys(existingTrialsAndRecords).forEach(trial_id => {
    existingTrialsMap[trial_id] = existingTrialsAndRecords[trial_id];
  });

  let count = 0;
  // Process Trials
  console.log("Creating and updating Trials");
  let real_id;
  for (const trial of trials) {
    console.log("Create Update number ", ++count);
    if (trial.exists) {
      if (!existingTrialsMap[trial.id]) {
        throw new NotFoundError(`No existing trial found with id ${trial.id}`);
      }
      await updateTrial(trial.id, trial.trial_nb, trial.trial_time);
    } else {
      real_id = await createTrial(run_id, trial.trial_nb, trial.trial_time);
      console.log(`real : ${real_id} vs fake ${trial.id}`);
      if (real_id != parseInt(trial.id)) {
        console.log("Replacing");
        trial_records[real_id] = trial_records[trial.id];
        delete trial_records[trial.id];
        trial.id = real_id;
      }
    }
  }

  // Mapping existing trial records for easy lookup
  const existingTrialRecordsMap = {};
  Object.keys(existingTrialsAndRecords).forEach(trial_id => {
    existingTrialsAndRecords[trial_id].records.forEach(record => {
      existingTrialRecordsMap[`${trial_id}_${record.mouse_id}`] = record;
    });
  });

  // Process Trial Records
  console.log("State before record updates");
  const trials_exist = await getTrials();
  console.log(trials_exist);
  console.log("trials : ", trials);
  count = 0;
  console.log("Creating and updating Records");
  for (const trialId in trial_records) {
    for (const mouseId in trial_records[trialId]) {
      console.log("Create Update number ", ++count);
      const record = trial_records[trialId][mouseId];
      const key = `${trialId}_${mouseId}`;
      console.log(key);
      const timeRecord = record.time_record || null;
      const rpmRecord = record.rpm_record || null;
      if (timeRecord)
      {
        if (record.exists) {
          if (!existingTrialRecordsMap[key]) {
            throw new NotFoundError(`No existing trial record found for trial_id ${trialId} and mouse_id ${mouseId}`);
          }
          await updateTrialRecord(trialId, mouseId, timeRecord, rpmRecord);
        } else {
          await createTrialRecord(trialId, mouseId, timeRecord, rpmRecord);
        }
      } else {
        delete trial_records[trialId][mouseId]; // No time record -> remove the value from db if it is there.
      }
    }
  }

  // Identify and delete trial_records that were removed
  console.log("Deleting Records");
  for (const key in existingTrialRecordsMap) {
    const [trialId, mouseId] = key.split('_');
    if (!trial_records[trialId] || !trial_records[trialId][mouseId]) {
      console.log("Deleting Record : (", trialId, "", mouseId, ")");
      await deleteTrialRecord(trialId, mouseId);
    }
  }

  // Identify and delete trials that were removed
  console.log("State before deletion");
  console.log("trials : ", trials);
  console.log("records : ", trial_records);
  console.log("Deleting Trials");
  for (const existingTrialId in existingTrialsMap) {
    if (!trials.some(trial => trial.id == parseInt(existingTrialId))) {
      console.log("Deleting Trial :", existingTrialId);
      await deleteTrial(existingTrialId);
    }
  }
};

// Creating a run
app.post('/study/:study_id/experiment/:exp_id/run', async (req, res) => {
  const { exp_id } = req.params;
  const {
    is_constant_rpm,
    rpm,
    experimentator,
    date_acclim,
    temperature,
    humidity,
    lux,
    other,
    cage_order,
    trials,
    trial_records
   } = req.body;
  try {
    console.log(is_constant_rpm);
    const id = await createRun(exp_id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);
    console.log("In create");
    console.log(cage_order);
    await createCageOrder(id, JSON.parse(cage_order)); // Could move in separate try catch to delete run if problem occurs here
    await processRunTrials(id, JSON.parse(trials), JSON.parse(trial_records));
    res.json({ redirect: `/study/${req.params.study_id}/experiment/${req.params.exp_id}/run/${id}` });
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occured while creating the run");
  }
});

// Updating a run
app.put('/study/:study_id/experiment/:exp_id/run/:run_id', async (req, res) => {
  const { run_id } = req.params;
  const {
    is_constant_rpm,
    rpm,
    experimentator,
    date_acclim,
    temperature,
    humidity,
    lux,
    other,
    trials,
    trial_records
   } = req.body;
  try {
    await updateRun(run_id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);
    await processRunTrials(run_id, JSON.parse(trials), JSON.parse(trial_records));
    res.json({ redirect: `/study/${req.params.study_id}/experiment/${req.params.exp_id}/run/${run_id}` });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else {
      res.status(500).send("An error occured while updating the run : " + err.message);
    }
  }
});

// Delete a study
app.delete('/study/:study_id/experiment/:exp_id/run/:run_id', async (req, res) => {
  const run_id = req.params.run_id;
  console.log("Deleting run ", run_id); 
  try {
    await deleteRun(run_id);
    console.log("Success");
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else {
      res.status(500).json({ error: 'An error occurred while deleting the run.' }); // HTTP status 500: Internal Server Error
    }
  }
});

// Excel logic

async function getExcelFilePath(title) {
  const tempDir = os.tmpdir();
  const fileName = `export_${title.replace(/ /g,"_")}_${Date.now()}.xlsx`;

  return path.join('C:/Users/e637792/rotarod-simple/excel/', fileName);
  //return path.join(tempDir, fileName);
}

function isNumber(value) {
  return typeof value === 'number' && !isNaN(value) || 
         !isNaN(parseFloat(value)) && isFinite(value);
}

interface TrialRecord {
  time_record: number;
  rpm_record: number;
}

const average = array => array.reduce((a, b) => a + b) / array.length;

function formatWorksheet(worksheet) {
  // Initialize column widths
  const columnWidths = [];

  // Iterate through the rows and cells to set alignment and calculate column widths
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', wrapText: true };

      // Get the cell's length and update the corresponding column width if it's larger
      const cellLength = cell.text.length;
      columnWidths[colNumber - 1] = Math.max(columnWidths[colNumber - 1] || 0, cellLength);
    });
  });

  // Apply the calculated column widths, with additional padding
  const padding = 5;
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width + padding;
  });
}

async function generateExcelStudy(studyId, experimentIds, filePath) {
  const workbook = new Excel.Workbook();

  const study = await getStudy(studyId);

  for (const expId of experimentIds) {
    const runs = await getRunsFromExperiment(expId);
    await fillExcelExperiment(expId, runs.map(run => run.id), workbook);
  }
  
  await workbook.xlsx.writeFile(filePath);
  console.log('Excel file generated successfully!');
}

async function generateExcelExperiment(experimentId, runIds, filePath) {
  const workbook = new Excel.Workbook();
  
  await fillExcelExperiment(experimentId, runIds, workbook)

  // Save to file
  await workbook.xlsx.writeFile(filePath);
  console.log('Excel file generated successfully!');
}

async function fillExcelExperiment(experimentId, runIds, workbook) {
  const experiment = await getExperiment(experimentId);
  const study = await getStudy(experiment.study_id);
  
  // Create worksheet for individual runs
  const runsSheet = workbook.addWorksheet(experiment.title + ' Individual Runs ');

  runsSheet.addRow(['Study:', study.title]);
  runsSheet.addRow(['Experiment:', experiment.title]);
  runsSheet.addRow([]);

  let trial_count = 0;

  let mouse_rows = {};
  let mouse_day_means = {}
  let day_row = ['', '', '']; // Blank cells corresponding to Mouse, Cage and Zigosizy
  let trials_row = ['Mouse Id', "Cage Number", "Zigosity"];

  for (const [dayIndex, run_id] of runIds.entries()) {
    console.log("Day ", dayIndex + 1);
    console.log("Id : ", run_id);
    const run = await getRun(run_id);
    console.log("Run ", run);
    const runDate = new Date(run.date_acclim);

    const dd = String(runDate.getDate()).padStart(2, '0');
    const mm = String(runDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const yyyy = runDate.getFullYear();

    const dateFormatted = `${dd}/${mm}/${yyyy}`;

    const hh = String(runDate.getHours()).padStart(2, '0');
    const min = String(runDate.getMinutes()).padStart(2, '0');

    const timeFormatted = `${hh}:${min}`;

    const temp_str = isNumber(run.temperature) ? `${run.temperature}°C` : run.temperature;
    const humidity_str = isNumber(run.humidity) ? `${run.humidity} %` : run.humidity;
    const lux_str = isNumber(run.lux) ? `${run.lux} lx` : run.lux;
    runsSheet.addRow([`DAY ${dayIndex + 1}_${dateFormatted}`, `temp : ${temp_str}`, `humidity : ${humidity_str}`, `luminosity : ${lux_str}`,  `other : ${run.other}`, `Experimentator : ${run.experimentator}`]);
    runsSheet.addRow(['Acclimatation time', timeFormatted]);
    const run_trials = await getTrialsFromRun(run.id);
    console.log("Trials : ", run_trials);
    trials_row.push.apply(trials_row, [...Array(run_trials.length).fill(undefined).map((_, i) => `T${trial_count + i + 1}_ACC (s)`), `Mean Day ${dayIndex + 1}`]);
    runsSheet.addRow([]);
    runsSheet.addRow(['Time', '', ...run_trials.map(trial => trial.trial_time)]);
    runsSheet.addRow(['Mouse Id', 'N° cage', ...Array(run_trials.length).fill(undefined).map((_, i) => `T${trial_count + i + 1}_ACC (s)`), ...Array(run_trials.length).fill(undefined).map((_, i) => `T${trial_count + i + 1}_RPM`)]);
    day_row.push.apply(day_row, [`D${dayIndex + 1}`, ...Array(run_trials.length).fill('')]);
    trial_count += run_trials.length;
    
    const runOrdering = await getOrderingFromRun(run.id);
    for (const order of runOrdering) {
      const cage = await getCage(order.cage_id);
      const mice = await getMiceFromCage(cage.id);
      
      for (let mouse of mice) {
        const mouse_trials = await getTrialsFromRunForMouse(run.id, mouse.id);
        const time_rec_mouse = run_trials.map(trial => mouse_trials[trial.id] && mouse_trials[trial.id].time_record ? mouse_trials[trial.id].time_record : "");
        let trial_values : TrialRecord[] = Object.values(mouse_trials);
        trial_values = trial_values.filter(trial => trial.time_record != null);
        console.log("Values", trial_values);
        const mean_time = trial_values.length ? average(trial_values.map(trial => trial.time_record)) : "";
        runsSheet.addRow([
          mouse.ucb_identifier,
          cage.cage_nb,
          ...time_rec_mouse,
          ...run_trials.map(trial => mouse_trials[trial.id] ? mouse_trials[trial.id].rpm_record : "")
        ]);
        if (!mouse_rows[mouse.id]) {
          mouse_rows[mouse.id] = [mouse.ucb_identifier,  cage.cage_nb, mouse.zigosity];
        }
        if (!mouse_day_means[mouse.id]) {
          mouse_day_means[mouse.id] = []
        }
        if (trial_values.length) {
          mouse_day_means[mouse.id].push(mean_time);
        }
        console.log(time_rec_mouse);
        mouse_rows[mouse.id].push.apply(mouse_rows[mouse.id], [...time_rec_mouse, mean_time]);
      }
    }
    runsSheet.addRow([]);
  }

  console.log(mouse_rows);

  // Create worksheet for aggregate information
  const aggregateSheet = workbook.addWorksheet(experiment.title + ' Aggregate Information');
  aggregateSheet.addRow(["Study :", study.title]);
  aggregateSheet.addRow(["Experiment :", experiment.title]);
  if (runIds.length) {
    aggregateSheet.addRow([]);
    day_row.push("Total");
    aggregateSheet.addRow(day_row);
    trials_row.push("Mean / Day");
    aggregateSheet.addRow(trials_row);
    
    const cages = await getAllCagesFromExp(experimentId);
    for (const cage of cages) {
      const mice = await getMiceFromCage(cage.id);
      for (const mouse of mice) {
        mouse_rows[mouse.id].push(mouse_day_means[mouse.id].length ? average(mouse_day_means[mouse.id]) : "");
        aggregateSheet.addRow(mouse_rows[mouse.id]);
      }
    }
  }

  // Format worksheets
  formatWorksheet(runsSheet);
  formatWorksheet(aggregateSheet);
}



app.post('/experiment/:exp_id/export_runs_to_excel', async (req, res) => {
  const { exp_id } = req.params;
  const { runIds } = req.body;

  try {
    const exp = await getExperiment(exp_id);
    if (!exp) {
      res.status(404).send("Couldn't find an experiment with id " + exp_id);
      return;
    }
    // Validate the input
    if (!Array.isArray(runIds) || runIds.length === 0) {
      res.status(400).send("No valid run IDs provided");
      return;
    }

    // Retrieve the runs data using the provided runIds
    // Here, you will likely call functions to interact with your database, like your existing getTrialsFromRun, getRecordsFromTrial, getCageOrder, etc.

    // Generate Excel file from the data
    const filePath = await getExcelFilePath(exp.title); // Implement this function based on your requirements

    await generateExcelExperiment(exp_id, runIds, filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(500).send("An error occurred while generating the Excel file");
      return;
    }

    // Send the file as response
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    fs.createReadStream(filePath).pipe(res);

  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred while exporting runs to Excel");
  }
});

app.post('/study/:study_id/export_runs_to_excel', async (req, res) => {
  const { study_id } = req.params;
  let { expIds } = req.body;

  try {
    const study = await getStudy(study_id);
    if (!study)
    {
      res.status(404).send("Couldn't find study with id " + study_id);
    }
    // Validate the input
    if (!Array.isArray(expIds) || expIds.length === 0) {
      res.status(400).send("No valid run IDs provided");
      return;
    }

    // Retrieve the runs data using the provided runIds
    // Here, you will likely call functions to interact with your database, like your existing getTrialsFromRun, getRecordsFromTrial, getCageOrder, etc.

    // Generate Excel file from the data
    const filePath = await getExcelFilePath(study.title); // Implement this function based on your requirements
    
    expIds.sort().reverse();

    await generateExcelStudy(study_id, expIds, filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(500).send("An error occurred while generating the Excel file");
      return;
    }

    // Send the file as response
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    fs.createReadStream(filePath).pipe(res);

  } catch (err) {
    console.log(err);
    res.status(500).send("An error occurred while exporting experiments to Excel");
  }
});

app.listen(port, function () {
  console.log('App is listening on port ' + port);
});

const log_stuff = async () => {
  const mice = await getMice();
  console.log(mice);
  const cages = await getCages();
  console.log(cages);
  //await deleteAllTrialRecords();
  //await deleteAllTrials();
  const trials = await getTrials();
  console.log(trials);
  const trial_records = await getTrialRecords();
  console.log(trial_records);
};

log_stuff();