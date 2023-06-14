import session from 'express-session';
import express from 'express';
import path from 'path';
import { setUserAuth, getUserAcc } from './server/controllers/auth';

declare module 'express-session' {
  export interface SessionData {
    CorporateAccount: string; // Add your session values here.
    // Other data...
  }
}

const app: express.Application = express();

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

// Serve static files from the 'client' directory
app.use(express.static('client'));

// Serve client/assets directory static files
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));

// Login route
app.post('/auth/login', setUserAuth);

// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
  if (!req.session.CorporateAccount) {
    res.status(401).send({ error: "Not authenticated" });
  } else {
    next();
  }
};

// Insert the routes for your application here

// Apply the middleware function to the route serving main.html
app.get('/main.html', authenticateUser, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/main.html'));
});

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
