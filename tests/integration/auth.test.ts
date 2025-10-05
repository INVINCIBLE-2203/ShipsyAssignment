import request from 'supertest';
import app from '../../src/main';
import { cleanDatabase } from '../helpers/database.helper';
import { 
  createValidUserPayload, 
  createInvalidUserPayloads, 
  createLoginPayload,
  createInvalidLoginPayloads 
} from '../fixtures/users.fixture';

describe('Auth Validation Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register with valid data', async () => {
      const userData = createValidUserPayload();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.username).toBe(userData.username);
      expect(response.body).not.toHaveProperty('password_hash');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');
    });

    it('should reject registration with invalid email format', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.invalidEmail)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject registration with short password (<8 chars)', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.shortPassword)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject registration with missing username', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.missingUsername)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = createValidUserPayload();
      
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('email');
    });

    it('should allow registration with special characters in username', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.specialCharsUsername)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should allow password without uppercase letter', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.missingUppercase)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should allow password without lowercase letter', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.missingLowercase)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should allow password without number', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.missingNumber)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should allow registration with long username', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.longUsername)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should reject registration with short username', async () => {
      const invalidPayloads = createInvalidUserPayloads();
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidPayloads.shortUsername)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserData: any;
    
    beforeEach(async () => {
      // Create a test user for login tests
      testUserData = createValidUserPayload();
      await request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(201);
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserData.email, password: testUserData.password })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject login with non-existent email', async () => {
      const invalidPayloads = createInvalidLoginPayloads();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidPayloads.wrongEmail)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });

    it('should reject login with incorrect password', async () => {
      const invalidPayloads = createInvalidLoginPayloads();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidPayloads.wrongPassword)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('invalid');
    });

    it('should reject login with missing email', async () => {
      const invalidPayloads = createInvalidLoginPayloads();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidPayloads.missingEmail)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with missing password', async () => {
      const invalidPayloads = createInvalidLoginPayloads();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidPayloads.missingPassword)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with empty credentials', async () => {
      const invalidPayloads = createInvalidLoginPayloads();
      
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidPayloads.emptyCredentials)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const userData = createValidUserPayload();
      
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Then login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});
