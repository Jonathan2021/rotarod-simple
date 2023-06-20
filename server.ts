import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';
import { getCagesForExperiment, addCageToExperiment } from './server/utils/cageUtils';
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';


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
  res.render('experiment', { experimentId: req.params.id });
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

app.listen(port, function () {
  console.log('App is listening on port ' + port);
});