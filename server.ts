import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

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
  updateTrial, createTrial, updateTrialRecord, createTrialRecord, deleteTrial, deleteTrialRecord, getTrials, getTrialRecords, deleteAllTrials, deleteAllTrialRecords
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
      if (record.exists) {
        if (!existingTrialRecordsMap[key]) {
          throw new NotFoundError(`No existing trial record found for trial_id ${trialId} and mouse_id ${mouseId}`);
        }
        const timeRecord = record.time_record || null;
        const rpmRecord = record.rpm_record || null;
        await updateTrialRecord(trialId, mouseId, timeRecord, rpmRecord);
      } else {
        const timeRecord = record.time_record || null;
        const rpmRecord = record.rpm_record || null;
        await createTrialRecord(trialId, mouseId, timeRecord, rpmRecord);
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
    await createCageOrder(id, cage_order); // Could move in separate try catch to delete run if problem occurs here
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