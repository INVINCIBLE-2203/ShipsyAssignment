import 'dotenv/config';

export const appConfig = {
  name: process.env.APP_NAME || 'TaskManagementAPI',
  env: process.env.APP_ENV || 'development',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api',
};
