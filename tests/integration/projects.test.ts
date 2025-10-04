import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database.config';
import { projectsRouter } from '../../src/modules/projects/projects.routes';
import { globalErrorHandler } from '../../src/common/middleware/error.middleware';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { OrganizationMember } from '../../src/database/entities/organization-member.entity';
import { Project } from '../../src/database/entities/project.entity';
import { getTestUserToken } from '../test-utils';

const app = express();
app.use(express.json());
app.use('/', projectsRouter);
app.use(globalErrorHandler);

describe('Projects Module (Integration)', () => {
  let token: string;
  let userId: string;
  let orgId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const { token: testToken, userId: testUserId } = await getTestUserToken();
    token = testToken;
    userId = testUserId;

    const org = await AppDataSource.getRepository(Organization).save({ name: 'Test Org' });
    orgId = org.id;
    await AppDataSource.getRepository(OrganizationMember).save({ organization_id: orgId, user_id: userId });
  });

  afterAll(async () => {
    await AppDataSource.getRepository(Project).delete({});
    await AppDataSource.getRepository(OrganizationMember).delete({});
    await AppDataSource.getRepository(Organization).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.destroy();
  });

  it('POST /organizations/:orgId/projects - should create a new project', async () => {
    const response = await request(app)
      .post(`/organizations/${orgId}/projects`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Project');
  });
});
