import request from 'supertest';
import express from 'express';
import { AppDataSource } from '../../src/config/database.config';
import { commentsRouter } from '../../src/modules/comments/comments.routes';
import { globalErrorHandler } from '../../src/common/middleware/error.middleware';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { OrganizationMember } from '../../src/database/entities/organization-member.entity';
import { Project } from '../../src/database/entities/project.entity';
import { Task } from '../../src/database/entities/task.entity';
import { Comment } from '../../src/database/entities/comment.entity';
import { getTestUserToken } from '../test-utils';

const app = express();
app.use(express.json());
app.use('/', commentsRouter);
app.use(globalErrorHandler);

describe('Comments Module (Integration)', () => {
  let token: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const { token: testToken, userId: testUserId } = await getTestUserToken();
    token = testToken;
    userId = testUserId;

    const org = await AppDataSource.getRepository(Organization).save({ name: 'Test Org' });
    await AppDataSource.getRepository(OrganizationMember).save({ organization_id: org.id, user_id: userId });
    const project = await AppDataSource.getRepository(Project).save({ name: 'Test Project', organization_id: org.id, created_by: userId });
    const task = await AppDataSource.getRepository(Task).save({ title: 'Test Task', project_id: project.id, created_by: userId });
    taskId = task.id;
  });

  afterAll(async () => {
    await AppDataSource.getRepository(Comment).delete({});
    await AppDataSource.getRepository(Task).delete({});
    await AppDataSource.getRepository(Project).delete({});
    await AppDataSource.getRepository(OrganizationMember).delete({});
    await AppDataSource.getRepository(Organization).delete({});
    await AppDataSource.getRepository(User).delete({});
    await AppDataSource.destroy();
  });

  it('POST /tasks/:taskId/comments - should create a new comment', async () => {
    const response = await request(app)
      .post(`/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test Comment' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.content).toBe('Test Comment');
  });
});
