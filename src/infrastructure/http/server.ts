// Reflect metadata polyfill for decorators
import 'reflect-metadata';

// Added for loading environment variables from a .env file
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import connectToDatabase from '@infra/database/conection';
import { errorHandler } from './middleware/error-handler.middleware';
import logger from '@shared/logger/logger';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// add CORS middleware
app.use(cors());

// Global error handler (must be last)
app.use(errorHandler);

// Connect to DB first, then start server
const startServer = async () => {
    try {
        await connectToDatabase();
        logger.info('Database connected successfully');

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
