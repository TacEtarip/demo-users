import { Request, Response, NextFunction } from 'express';
import 'reflect-metadata';
import { validateDto } from '../validate-dto.middleware';
import { ValidationSource } from '@shared/enums/validation-source.enum';
import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// Test DTO classes
class TestQueryDto {
    @IsString()
    @IsOptional()
    name!: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    age!: number;
}

class TestBodyDto {
    @IsString()
    title!: string;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    price!: number;
}

describe('validateDto Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            query: {},
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('Query validation (default)', () => {
        it('should validate and transform valid query parameters', async () => {
            mockRequest.query = { name: 'John', age: '25' };

            const middleware = validateDto(TestQueryDto);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockRequest as any).validatedQuery).toBeDefined();
            expect((mockRequest as any).validatedQuery.name).toBe('John');
            expect((mockRequest as any).validatedQuery.age).toBe(25);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid query parameters', async () => {
            mockRequest.query = { name: 'John', age: '-5' };

            const middleware = validateDto(TestQueryDto);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Validation failed',
                    details: expect.any(Array),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should pass validation with empty query parameters', async () => {
            mockRequest.query = {};

            const middleware = validateDto(TestQueryDto);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Since fields are optional, this should pass validation
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('Body validation', () => {
        it('should validate and transform valid body data', async () => {
            mockRequest.body = { title: 'Product', price: 99 };

            const middleware = validateDto(TestBodyDto, ValidationSource.BODY);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRequest.body).toBeDefined();
            expect(mockRequest.body.title).toBe('Product');
            expect(mockRequest.body.price).toBe(99);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid body data', async () => {
            mockRequest.body = { title: 'Product', price: -10 };

            const middleware = validateDto(TestBodyDto, ValidationSource.BODY);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Validation failed',
                    details: expect.arrayContaining([
                        expect.objectContaining({
                            property: 'price',
                        }),
                    ]),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 for missing required body fields', async () => {
            mockRequest.body = { title: 'Product' };

            const middleware = validateDto(TestBodyDto, ValidationSource.BODY);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('ValidationSource enum', () => {
        it('should use QUERY as default source', async () => {
            mockRequest.query = { name: 'John', age: '25' };

            const middleware = validateDto(TestQueryDto);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockRequest as any).validatedQuery).toBeDefined();
        });

        it('should use BODY when ValidationSource.BODY is specified', async () => {
            mockRequest.body = { title: 'Product', price: 99 };

            const middleware = validateDto(TestBodyDto, ValidationSource.BODY);
            await middleware(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockRequest.body).toBeDefined();
            expect(mockNext).toHaveBeenCalled();
        });
    });
});
