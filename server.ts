import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';
import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

import {
  isUniqueConstraintError,
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

app.listen(port, function () {
  console.log('App is listening on port ' + port);
});
