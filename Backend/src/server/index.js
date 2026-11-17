import 'dotenv/config';

import express from 'express';
import ErrorHandler from '../middlewares/error.js';
import routes from '../routes/index.js';

const app = express();

app.use(express.json());
app.use(routes);
app.use(ErrorHandler);

export default app;