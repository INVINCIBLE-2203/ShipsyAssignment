import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/AppError';

export function validationMiddleware(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(dtoClass, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorDetails = errors.map(error => Object.values(error.constraints)).flat();
      next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', errorDetails));
    } else {
      req.body = dto;
      next();
    }
  };
}
