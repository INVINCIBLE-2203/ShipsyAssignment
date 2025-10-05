import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { appConfig } from './config/app.config';
import { AppDataSource } from './config/database.config';
import { swaggerSpec } from './config/swagger.config';
import { authRouter } from './modules/auth/auth.routes';
import { tasksRouter } from './modules/tasks/tasks.routes';
import { organizationsRouter } from './modules/organizations/organizations.routes';
import { projectsRouter } from './modules/projects/projects.routes';
import { commentsRouter } from './modules/comments/comments.routes';
import { customPropertiesRouter } from './modules/custom-properties/custom-properties.routes';
import { globalErrorHandler } from './common/middleware/error.middleware';
import { applyJwtStrategy } from './modules/auth/guards/jwt.strategy';

export function createApp(): Application {
  const app: Application = express();

  // --- Middleware ---
  app.use(helmet());
  app.use(cors({ origin: '*' })); // Configure for production
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.use(passport.initialize());
  applyJwtStrategy(passport);

  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // --- Swagger Documentation ---
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
  
  // Serve raw swagger spec at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // --- API Routes ---
  app.use('/api/auth', authRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/custom-properties', customPropertiesRouter);
  // ... other module routes

  // --- Global Error Handler ---
  // This must be after all routes
  app.use(globalErrorHandler);

  return app;
}

async function bootstrap() {
  const app = createApp();

  // --- Database Connection ---
  try {
    await AppDataSource.initialize();
    console.log('Database connection has been initialized!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }

  // --- Start Server ---
  app.listen(appConfig.port, () => {
    console.log(`Server is running on http://localhost:${appConfig.port}`);
    console.log(`📚 API Documentation is available at: http://localhost:${appConfig.port}/api-docs`);
    console.log(`📄 Raw Swagger JSON is available at: http://localhost:${appConfig.port}/api-docs.json`);
  });
}

// Export the app for testing
const app = createApp();
export default app;

// Only start the server if this file is run directly
if (require.main === module) {
  bootstrap();
}
