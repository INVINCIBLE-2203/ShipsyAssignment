import { AppDataSource } from '../src/config/database.config';

beforeAll(async () => {
  // Initialize database connection for tests
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  } catch (error) {
    console.error('Failed to initialize test database:', error);
  }
});

afterAll(async () => {
  // Close database connection after all tests
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch (error) {
    console.error('Failed to close test database:', error);
  }
});

// Global test timeout
jest.setTimeout(30000);
