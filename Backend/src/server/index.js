import 'dotenv/config';

import express from 'express';
import ErrorHandler from '../middlewares/error.js';

const app = express();

app.use(express.json());
app.use(ErrorHandler);

export default app;