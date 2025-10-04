import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database.config';
import { organizationsRouter } from '../../src/modules/organizations/organizations.routes';
import { globalErrorHandler } from '../../src/common/middleware/error.middleware';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { OrganizationMember } from '../../src/database/entities/organization-member.entity';
import { getTestUserToken } from '../test-utils'; // Helper to get a token

const app = express();
app.use(express.json());
app.use('/organizations', organizationsRouter);
app.use(globalErrorHandler);

describe('Organizations Module (Integration)', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const { token: testToken, userId: testUserId } = await getTestUserToken();
    token = testToken;
    userId = testUserId;
  });

  afterAll(async () => {
    await AppDataSource.getRepository(OrganizationMember).delete({});
    await AppDataSource.getRepository(Organization).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.destroy();
  });

  it('POST /organizations - should create a new organization', async () => {
    const response = await request(app)
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Organization' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Organization');
  });
});
