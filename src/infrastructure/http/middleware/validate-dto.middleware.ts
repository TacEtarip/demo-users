import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ValidationSource } from '@shared/enums/validation-source.enum';

export function validateDto<T>(
    dtoClass: new () => T,
    source: ValidationSource = ValidationSource.QUERY
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const sourceData = source === ValidationSource.BODY ? req.body : req.query;
        const dtoInstance = plainToClass(dtoClass, sourceData);
        const errors: ValidationError[] = await validate(dtoInstance as object);

        if (errors.length > 0) {
            const formattedErrors = errors.map((error) => ({
                property: error.property,
                constraints: error.constraints,
            }));

            res.status(400).json({
                error: 'Validation failed',
                details: formattedErrors,
            });
            return;
        }

        if (source === ValidationSource.BODY) {
            req.body = dtoInstance;
        } else {
            // Attach validated DTO to request for controller access
            (req as any).validatedQuery = dtoInstance;
        }
        next();
    };
}
