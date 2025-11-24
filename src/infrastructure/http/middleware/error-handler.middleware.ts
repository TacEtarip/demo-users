import { Request, Response, NextFunction } from 'express';
import logger from '@shared/logger/logger';
import { AppError } from '@domain/models/app-error.model';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            status: 'error',
            message: 'Validation error',
            details: err.message,
        });
        return;
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            status: 'error',
            message: 'Invalid ID format',
        });
        return;
    }

    // Log unexpected errors
    logger.error('Unexpected error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });

    // Default error response
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
