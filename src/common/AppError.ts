export class AppError extends Error {
    constructor(
      public statusCode: number,
      public message: string,
      public errorCode?: string,
      public details?: any
    ) {
      super(message);
      this.name = 'AppError';
    }
  }
  