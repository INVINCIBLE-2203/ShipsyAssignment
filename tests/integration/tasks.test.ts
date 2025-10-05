import request from 'supertest';
import app from '../../src/main';
import { cleanDatabase } from '../helpers/database.helper';
import { createTestUserWithProject, getAuthHeader } from '../helpers/auth.helper';
import { 
  createValidTaskPayload, 
  createInvalidTaskPayloads,
  createTaskBatch,
  createOverdueTask,
  createCompletedTask
} from '../fixtures/tasks.fixture';
import { TaskStatus, TaskPriority } from '../../src/database/entities/task.entity';

describe('Task Validation Tests', () => {
  let testUser: any;
  let authHeaders: any;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUserWithProject();
    authHeaders = getAuthHeader(testUser.token);
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create task with valid data', async () => {
      const taskData = createValidTaskPayload();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.status).toBe(taskData.status);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.project_id).toBe(testUser.projectId);
      expect(response.body.created_by).toBe(testUser.id);
    });

    it('should reject task with empty title', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.emptyTitle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('title');
    });

    it('should reject task with title > 200 characters', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.longTitle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('title');
    });

    it('should reject task with title < 3 characters', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.shortTitle)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject task with invalid status enum value', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.invalidStatus)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('status');
    });

    it('should reject task with invalid priority enum value', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.invalidPriority)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message.toLowerCase()).toContain('priority');
    });

    it('should reject task with non-UUID assigneeId', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.invalidAssigneeId)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject task with invalid date format', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.invalidDate)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject task with description > 2000 characters', async () => {
      const invalidPayloads = createInvalidTaskPayloads();
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidPayloads.longDescription)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should accept task with only required fields (title)', async () => {
      const taskData = { title: 'Minimal Task' };
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.status).toBe(TaskStatus.TODO); // Default value
      expect(response.body.priority).toBe(TaskPriority.MEDIUM); // Default value
    });

    it('should set default values for status (todo) and priority (medium)', async () => {
      const taskData = { title: 'Task with defaults' };
      
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      expect(response.body.status).toBe(TaskStatus.TODO);
      expect(response.body.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should validate all enum values for status', async () => {
      const validStatuses = Object.values(TaskStatus);
      
      for (const status of validStatuses) {
        const taskData = createValidTaskPayload({ status, title: `Task with ${status}` });
        
        const response = await request(app)
          .post(`/api/projects/${testUser.projectId}/tasks`)
          .set(authHeaders)
          .send(taskData)
          .expect(201);

        expect(response.body.status).toBe(status);
      }
    });

    it('should validate all enum values for priority', async () => {
      const validPriorities = Object.values(TaskPriority);
      
      for (const priority of validPriorities) {
        const taskData = createValidTaskPayload({ priority, title: `Task with ${priority} priority` });
        
        const response = await request(app)
          .post(`/api/projects/${testUser.projectId}/tasks`)
          .set(authHeaders)
          .send(taskData)
          .expect(201);

        expect(response.body.priority).toBe(priority);
      }
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = createValidTaskPayload();
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);
      taskId = response.body.id;
    });

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH
      };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.priority).toBe(updateData.priority);
    });

    it('should reject update with invalid field types', async () => {
      const invalidData = {
        title: 123, // Should be string
        status: 'invalid_status',
        priority: true // Should be enum
      };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject update with non-existent task ID', async () => {
      const updateData = { title: 'Updated Title' };
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject partial update with invalid enum values', async () => {
      const invalidData = {
        status: 'invalid_status_enum'
      };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should maintain existing values when fields not provided', async () => {
      // Get current task
      const currentResponse = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .expect(200);

      const originalTitle = currentResponse.body.title;
      const originalPriority = currentResponse.body.priority;

      // Update only status
      const updateData = { status: TaskStatus.DONE };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(originalTitle);
      expect(response.body.priority).toBe(originalPriority);
      expect(response.body.status).toBe(TaskStatus.DONE);
    });

    it('should set completedAt when status changes to done', async () => {
      const updateData = { status: TaskStatus.DONE };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.DONE);
      expect(response.body.completed_at).toBeTruthy();
      expect(new Date(response.body.completed_at)).toBeInstanceOf(Date);
      expect(isNaN(new Date(response.body.completed_at).getTime())).toBe(false);
    });

    it('should clear completedAt when status changes from done to other', async () => {
      // First set to done
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      // Then change back to in_progress
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .send({ status: TaskStatus.IN_PROGRESS })
        .expect(200);

      expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);
      expect(response.body.completed_at).toBeNull();
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = createValidTaskPayload();
      const response = await request(app)
        .post(`/api/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);
      taskId = response.body.id;
    });

    it('should delete task successfully', async () => {
      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .expect(204);

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(authHeaders)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set(authHeaders)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
