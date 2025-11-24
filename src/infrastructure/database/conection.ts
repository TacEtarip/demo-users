// Add conection to a mongo database using mongoos, secure that the URI is stored in an environment variable and it only conects if already not conected
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '@shared/logger/logger';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/productsdb';

const connectToDatabase = async (): Promise<void> => {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGO_URI);
            logger.info('Connected to MongoDB');
        } catch (error) {
            logger.error('Error connecting to MongoDB:', error);
        }
    }
};

export default connectToDatabase;
