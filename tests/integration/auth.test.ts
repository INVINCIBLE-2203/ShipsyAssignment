import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database.config';
import { authRouter } from '../../src/modules/auth/auth.routes';
import { globalErrorHandler } from '../../src/common/middleware/error.middleware';
import { User } from '../../src/database/entities/user.entity';

// Create a minimal express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use(globalErrorHandler);

describe('Auth Module (Integration)', () => {
  beforeAll(async () => {
    // Initialize database connection for testing
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    // Clean up the database after tests
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete({});
    await AppDataSource.destroy();
  });

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
  };

  it('POST /auth/register - should register a new user successfully', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.username).toBe(testUser.username);
    expect(response.body).not.toHaveProperty('password_hash');
  });

  it('POST /auth/register - should fail if email is already taken', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(response.status).toBe(409);
  });

  it('POST /auth/login - should login the user and return tokens', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('POST /auth/login - should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
  });
});
