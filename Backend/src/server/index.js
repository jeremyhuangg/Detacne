import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import path from 'path';

import ErrorHandler from '../middlewares/error.js';
import routes from '../routes/index.js';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(routes);
app.use(ErrorHandler);
app.use('/hasil', express.static(path.resolve(process.env.RESULT_DIR)));

export default app;