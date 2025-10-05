import request from 'supertest';
import app from '../../src/main';
import { AppDataSource } from '../../src/config/database.config';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { Project } from '../../src/database/entities/project.entity';

export interface TestUser {
  id: string;
  email: string;
  username: string;
  password: string;
  token: string;
  refreshToken: string;
}

export interface TestUserWithOrg extends TestUser {
  organizationId: string;
  organizationName: string;
}

export interface TestUserWithProject extends TestUserWithOrg {
  projectId: string;
  projectName: string;
}

export const createTestUser = async (): Promise<TestUser> => {
  const userData = {
    email: `test_${Date.now()}@example.com`,
    username: `testuser_${Date.now()}`,
    password: 'TestPass123!'
  };

  // Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201);

  // Login to get tokens
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password })
    .expect(200);

  return {
    id: registerResponse.body.id,
    email: userData.email,
    username: userData.username,
    password: userData.password,
    token: loginResponse.body.accessToken,
    refreshToken: loginResponse.body.refreshToken
  };
};

export const createTestUserWithOrganization = async (): Promise<TestUserWithOrg> => {
  const orgName = `Test Organization ${Date.now()}`;
  const userData = {
    email: `testorg_${Date.now()}@example.com`,
    username: `testorguser_${Date.now()}`,
    password: 'TestPass123!'
  };

  // Register user
  const userResponse = await request(app)
    .post('/api/auth/register')
    .send(userData)
    .expect(201);

  // Login to get tokens
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password })
    .expect(200);

  const orgResponse = await request(app)
    .post('/api/organizations')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .send({ name: orgName })
    .expect(201);

  return {
    id: userResponse.body.id,
    email: userData.email,
    username: userData.username,
    password: userData.password,
    token: loginResponse.body.accessToken,
    refreshToken: loginResponse.body.refreshToken,
    organizationId: orgResponse.body.id,
    organizationName: orgName
  };
};

export const createTestUserWithProject = async (): Promise<TestUserWithProject> => {
  const userWithOrg = await createTestUserWithOrganization();
  const projectName = `Test Project ${Date.now()}`;

  const projectResponse = await request(app)
    .post(`/api/projects/organizations/${userWithOrg.organizationId}/projects`)
    .set('Authorization', `Bearer ${userWithOrg.token}`)
    .send({
      name: projectName,
      description: 'Test project description for testing purposes'
    })
    .expect(201);

  return {
    ...userWithOrg,
    projectId: projectResponse.body.id,
    projectName
  };
};

export const loginUser = async (email: string, password: string): Promise<{ token: string; refreshToken: string }> => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    token: response.body.accessToken,
    refreshToken: response.body.refreshToken
  };
};

export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`
});

export const getExpiredToken = (): string => {
  // Return a properly formatted but expired JWT token for testing
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
};

export const getInvalidToken = (): string => {
  return 'invalid.jwt.token';
};
