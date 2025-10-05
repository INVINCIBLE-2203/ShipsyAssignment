import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

const getConnectionString = (): string | undefined => {
  const appEnv = process.env.APP_ENV || 'development';
  
  if (appEnv === 'production') {
    return process.env.DATABASE_URL_PRODUCTION;
  } else {
    return process.env.DATABASE_URL_DEVELOPMENT;
  }
};

export const dbConfig = {
  // Use connection string if available, otherwise fall back to individual parameters
  url: getConnectionString(),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? "5432", 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'task_management',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
};

// Create DataSource with connection string or individual parameters
const createDataSourceConfig = () => {
  // Determine if we're running in production (compiled) or development
  const isProduction = process.env.NODE_ENV === 'production' || !process.env.NODE_ENV;
  const entityExtension = isProduction ? 'js' : 'ts';
  const migrationExtension = isProduction ? 'js' : 'ts';

  const baseConfig = {
    type: 'postgres' as const,
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
    entities: [join(__dirname, `../database/entities/**/*.${entityExtension}`)],
    migrations: [join(__dirname, `../database/migrations/**/*.${migrationExtension}`)],
    subscribers: [],
  };

  // If connection string is available, use it
  if (dbConfig.url) {
    return {
      ...baseConfig,
      url: dbConfig.url,
      ssl: {
        rejectUnauthorized: false, // For cloud databases like Render, Railway, etc.
      },
    };
  }

  // Otherwise, use individual parameters (for local development)
  return {
    ...baseConfig,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
  };
};

export const AppDataSource = new DataSource(createDataSourceConfig());
