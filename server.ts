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
  getExperimentsFromStudy, createExperiment, updateExperiment, deleteExperiment,
  getRunsFromExperiment, createRun, updateRun, deleteRun, getRun, getRuns,
  getCageCompleteFromExp, getAllCagesFromExp, deleteCage, createCage,
  getExperiment,
  updateMouse, deleteMouse, createMouse, getAllMiceFromExp
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
      console.log(cage_info);
      res.render("update_exp_form", { cage_info, study_id, exp });
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

export const updateExperimentCages = async (expId: number, cageInfo: ICageInfo[]) => {
  const cages = await getCageCompleteFromExp(expId);
  const mice = await getAllMiceFromExp(expId);

  const cageNbSet = new Set(cageInfo.map(info => info.cage_nb));
  const miceInfoMap = new Map(cageInfo.map(info => [info.ucb_identifier, info]));

  // Update or move mice
  for (let mouse of mice) {
    const newInfo = miceInfoMap.get(mouse.ucb_identifier);

    if (newInfo) {
      const existingCage = cages.find(cage => cage.cage_nb === newInfo.cage_nb);
      if (existingCage) {
        await updateMouse(mouse.id, existingCage.id, mouse.ucb_identifier, newInfo.zigosity);
      } else {
        const newCageId = await createCage(newInfo.cage_nb, expId);
        await updateMouse(mouse.id, newCageId, mouse.ucb_identifier, newInfo.zigosity);
      }
    } else {
      await deleteMouse(mouse.id);
    }
  }

  // Delete cages that no longer exist
  for (let cage of cages) {
    if (!cageNbSet.has(cage.cage_nb)) {
      await deleteCage(cage.id); // Will cascade delete any remaining mice
    }
  }

  // Create new cages and mice
  for (let info of cageInfo) {
    const existingCage = cages.find(cage => cage.cage_nb === info.cage_nb);
    if (!existingCage) {
      const newCageId = await createCage(info.cage_nb, expId);
      await createMouse(newCageId, info.ucb_identifier, info.zigosity);
    }
  }
};

// Update an experiment
app.put('/study/:study_id/experiment/:exp_id', async (req, res) => {
  const exp_id = parseInt(req.params.exp_id);
  const { title, cage_info } = req.body;
  console.log(cage_info);
  
  try {
    await updateExperiment(exp_id, title);
    await updateExperimentCages(exp_id, cage_info);
    res.json({ exp_id });
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

// Getting the run page for a new run
app.get('/study/:study_id/experiment/:exp_id/run', async (req, res) => {
  res.render('run_form', {study_id : req.params.study_id, exp_id : req.params.exp_id, run: null});
});

// Getting the run page for an existing run
app.get('/study/:study_id/experiment/:exp_id/run/:run_id', async (req, res) => {
  const run_id = req.params.run_id;
  console.log("Getting run")
  try {
    const run = await getRun(run_id);
    if (!run)
    {
      res.status(404).send("Couldn't find the requested run");
    } else {
    res.render('run_form', {study_id : req.params.study_id, exp_id : req.params.exp_id, run});
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("An error occured while retrieving the run");
  }
});

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
    other
   } = req.body;
  try {
    const id = await createRun(exp_id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);
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
    other
   } = req.body;
  try {
    await updateRun(run_id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);
    res.json({ redirect: `/study/${req.params.study_id}/experiment/${req.params.exp_id}/run/${run_id}` });
  } catch (err) {
    console.log(err);
    if(err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else {
      res.status(500).send("An error occured while updating the run");
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
