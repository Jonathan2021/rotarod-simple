import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

import {
  isUniqueConstraintError,
  getGroups, getGroup, createGroup, updateGroup, deleteGroup,
  getEthicalProjects, getEthicalProject, createEthicalProject, updateEthicalProject, deleteEthicalProject, findEthicalProject,
  getEthicalExperimentsFromProject, createEthicalExperiment, updateEthicalExperiment, deleteEthicalExperiment, findEthicalExperiment, getEthicalExperiments,
  createStudy, updateStudy, findStudyByTitle, getStudy, deleteStudy
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
app.use(express.urlencoded());

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

// Serve client/assets directory static files
//app.use('/assets', express.static(path.join(__dirname, 'client/assets')));

// Define routes AFTER middleware
app.post('/auth/login', setUserAuth);

app.get('/', (req, res) => {
  if (req.session.CorporateAccount) {
    // If user is logged in, redirect to the main page
    res.redirect('/main.html');
  } else {
    // If user is not logged in, redirect to the login page
    res.redirect('/auth/login.html');
  }
});

// Groups

app.get('/groups_data', async (req, res) => {
  const groups = await getGroups();
  res.json(groups);
});

app.get('/groups', async (req, res) => {
  res.render('widgetStandalone', { partial: 'partials/groupGridWidget.ejs' });
});

app.post('/groups', async (req, res) => {
  const { title, description } = req.body;
  const id = await createGroup(title, description);
  res.json({ id });
});

app.put('/groups/:id', async (req, res) => {
  const { title, description } = req.body;
  await updateGroup(req.params.id, title, description);
  res.json({ success: true });
});

app.delete('/groups/:id', async (req, res) => {
  await deleteGroup(req.params.id);
  res.json({ success: true });
});

app.get('/group_form', (req, res) => {
  res.render('group_form', {group: null});
});

app.get('/group_form/:id', async (req, res) => {
  const group = await getGroup(req.params.id);
  res.render('group_form', { group: group });
});

// Ethical projects

app.get('/projects_data', async (req, res) => {
  const projects = await getEthicalProjects();
  console.log("Projects : ", projects);
  res.json(projects);
});

app.get('/projects', async (req, res) => {
  res.render('widgetStandalone', { partial: 'partials/ethicalWidget.ejs'});
});


app.post('/projects', async (req, res) => {
  const { title } = req.body;
  try {
    const id = await createEthicalProject(title);
    res.json({ id });
  } catch (err) {
    console.log(err);
    // Assuming err is a unique constraint violation error. Please replace this check with the appropriate one for your database/ORM.
    if (isUniqueConstraintError(err)) {
      const existingRecord = await findEthicalProject(title);
      res.status(409).json({ error: 'A project with this title already exists.', id: existingRecord.id }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while creating the project.' }); // HTTP status 500: Internal Server Error
    }
  }
});

app.put('/projects/:id', async (req, res) => {
  const { title } = req.body;
  try {
    await updateEthicalProject(req.params.id, title);
    res.json({ success: true });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      const existingRecord = await findEthicalProject(title);
      res.status(409).json({ error: 'A project with this title already exists.' , id : existingRecord.id}); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: err.message }); // HTTP status 500: Internal Server Error
    }
  }
});

app.delete('/projects/:id', async (req, res) => {
  try {
    await deleteEthicalProject(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message }); // HTTP status 500: Internal Server Error
  }
});

// Ethical Experiments

app.get('/experiments_data', async (req, res) => {
  const experiments = await getEthicalExperiments();
  console.log("Experiments : ", experiments);
  res.json(experiments);
});

app.get('/projects/:eth_project_id/experiments_data', async (req, res) => {
  const experiments = await getEthicalExperimentsFromProject(req.params.eth_project_id);
  console.log("Experiments : ", experiments);
  res.json(experiments);
});

app.post('/projects/:eth_project_id/experiments', async (req, res) => {
  const { title } = req.body;

  try {
    const id = await createEthicalExperiment(req.params.eth_project_id, title);
    res.json({ id });
  } catch (err) {
    console.log(err);
    if (isUniqueConstraintError(err)) {
      const existingRecord = await findEthicalExperiment(title);
      res.status(409).json({ error: 'An experiment with this title already exists.', id: existingRecord.id }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while creating the experiment.' }); // HTTP status 500: Internal Server Error
    }
  }
});

app.put('/projects/:eth_project_id/experiments/:id', async (req, res) => {
  const { title } = req.body;
  try {
    await updateEthicalExperiment(req.params.id, req.params.eth_project_id, title);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    if (isUniqueConstraintError(err)) {
      const existingRecord = await findEthicalExperiment(title);
      res.status(409).json({ error: 'An experiment with this title already exists.', id: existingRecord.id }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: err.message }); // HTTP status 500: Internal Server Error
    }
  }
});

app.delete('/projects/:eth_project_id/experiments/:id', async (req, res) => {
  try {
    await deleteEthicalExperiment(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message }); // HTTP status 500: Internal Server Error
  }
});

app.post('/study', async (req, res) => {
  const { title } = req.body;
  
  try {
    const id = await createStudy(title);
    res.json({ id });
  } catch (err) {
    console.log(err);
    if (isUniqueConstraintError(err)) {
      const existingRecord = await findStudyByTitle(title);
      res.status(409).json({ error: 'A study with this title already exists.', id: existingRecord.id }); // HTTP status 409: Conflict
    } else {
      res.status(500).json({ error: 'An error occurred while creating the study.' }); // HTTP status 500: Internal Server Error
    }
  }
});

app.get('/study/:id/form', async (req, res) => {
    try {
        const id = req.params.id;
        const study = await getStudy(id);
        if (!study) {
            res.status(404).send('Study not found'); // HTTP status 404: Not Found
        } else {
            res.render('study_form', { study: study });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred while retrieving the study.'); // HTTP status 500: Internal Server Error
    }
});

app.put('/study/:id', async (req, res) => {
    const { title, objective, eth_project_id, eth_exp_id } = req.body;
    console.log("Putting", req.body);

    try {
        const existingRecord = await findStudyByTitle(title);
        if (existingRecord && existingRecord.id != req.params.id) {
            res.status(409).json({ error: 'A study with this title already exists.' }); // HTTP status 409: Conflict
        } else {
            await updateStudy(req.params.id, eth_project_id, eth_exp_id, title, objective);
            res.json({ message: 'Study updated successfully' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'An error occurred while updating the study.' }); // HTTP status 500: Internal Server Error
    }
});

app.delete('/study/:id', async (req, res) => {
    try {
        await deleteStudy(req.params.id);
        res.json({ message: 'Study deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'An error occurred while deleting the study.' });
    }
});

/*
app.post('/experiment/new', async (req, res) => {
  const db = await open({
    filename: path.join(__dirname, 'server', 'database', 'myDatabase.db'),
    driver: sqlite3.Database,
  });
  
  const result = await db.run(`
    INSERT INTO "Experiment" ("title", "description", "creation_date") 
    VALUES ("New Experiment", "No description.", date('now'))
  `);

  res.send({ experimentId: result.lastID });
});

app.get('/experiment/:id', (req, res) => {
  // Render the experiment page with the given ID
  const full_exp = getExperimentFull(req.params.id)
  res.render('experiment', full_exp);
});


app.get('/api/experiment/:id/cages', async (req, res) => {
  const experimentId = req.params.id;

  const db = await open({
    filename: path.join(__dirname, 'server', 'database', 'myDatabase.db'),
    driver: sqlite3.Database,
  });

  const cages = await db.all(`
    SELECT Cage.id, Cage.cage_nb, GROUP_CONCAT(Mouse_Cage.mouse_id) as mouse_ids
    FROM Cage
    INNER JOIN Cage_Experiment ON Cage_Experiment.cage_id = Cage.id
    INNER JOIN Mouse_Cage ON Mouse_Cage.cage_id = Cage.id
    WHERE Cage_Experiment.experiment_id = ?
    GROUP BY Cage.id, Cage.cage_nb`,
    experimentId
  );

  res.json(cages);
});
*/
app.listen(port, function () {
  console.log('App is listening on port ' + port);
});