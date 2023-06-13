import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
// Import other dependencies and routes as your project grows

// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Setup routes here

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
