import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database.config';
import { customPropertiesRouter } from '../../src/modules/custom-properties/custom-properties.routes';
import { globalErrorHandler } from '../../src/common/middleware/error.middleware';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { OrganizationMember, MemberRole } from '../../src/database/entities/organization-member.entity';
import { CustomProperty } from '../../src/database/entities/custom-property.entity';
import { getTestUserToken } from '../test-utils';

const app = express();
app.use(express.json());
app.use('/', customPropertiesRouter);
app.use(globalErrorHandler);

describe('Custom Properties Module (Integration)', () => {
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
    await AppDataSource.getRepository(OrganizationMember).save({ organization_id: orgId, user_id: userId, role: MemberRole.ADMIN });
  });

  afterAll(async () => {
    await AppDataSource.getRepository(CustomProperty).delete({});
    await AppDataSource.getRepository(OrganizationMember).delete({});
    await AppDataSource.getRepository(Organization).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.destroy();
  });

  it('POST /organizations/:orgId/properties - should define a new custom property', async () => {
    const response = await request(app)
      .post(`/organizations/${orgId}/properties`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Property', type: 'text', entityType: 'task' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.property_name).toBe('Test Property');
  });
});
