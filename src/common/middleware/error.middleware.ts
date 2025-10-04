import { Request, Response, NextFunction } from 'express';
import { AppError } from '../AppError';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
    });
  }

  // Log the error for debugging purposes
  console.error(err);

  // Generic error for unexpected issues
  return res.status(500).json({
    message: 'Internal Server Error',
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
}
