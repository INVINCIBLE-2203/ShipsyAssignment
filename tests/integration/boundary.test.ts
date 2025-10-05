import request from 'supertest';
import app from '../../src/main';
import { cleanDatabase } from '../helpers/database.helper';
import { createTestUserWithProject, getAuthHeader } from '../helpers/auth.helper';
import { createValidTaskPayload, createTaskBatch } from '../fixtures/tasks.fixture';
import { TaskStatus, TaskPriority } from '../../src/database/entities/task.entity';

describe('Boundary Testing - Pagination & Calculated Fields', () => {
  let testUser: any;
  let authHeaders: any;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUserWithProject();
    authHeaders = getAuthHeader(testUser.token);
  });

  describe('Pagination Boundaries', () => {
    beforeEach(async () => {
      // Create 25 test tasks
      for (let i = 0; i < 25; i++) {
        const taskData = createValidTaskPayload({ title: `Task ${i + 1}` });
        await request(app)
          .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
          .set(authHeaders)
          .send(taskData)
          .expect(201);
      }
    });

    describe('GET /api/projects/:projectId/tasks', () => {
      it('should return exactly 10 items by default', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.data).toHaveLength(10);
        expect(response.body.total).toBe(25);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
      });

      it('should return 5 items when limit=5', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?limit=5`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.data).toHaveLength(5);
        expect(response.body.limit).toBe(5);
      });

      it('should enforce maximum limit of 100 items', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?limit=500`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.limit).toBeLessThanOrEqual(100);
      });

      it('should return empty array for page beyond total', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=10&limit=10`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.data).toHaveLength(0);
        expect(response.body.page).toBe(10);
      });

      it('should handle page=0 gracefully (default to page 1)', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=0`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.page).toBe(1);
        expect(response.body.data).toHaveLength(10);
      });

      it('should handle negative page numbers (default to page 1)', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=-5`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.page).toBe(1);
        expect(response.body.data).toHaveLength(10);
      });

      it('should calculate correct totalPages for 25 items with limit=10', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?limit=10`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.total).toBe(25);
        expect(response.body.totalPages).toBe(3);
      });

      it('should set hasNextPage=false on last page', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=3&limit=10`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.hasNextPage).toBe(false);
        expect(response.body.data).toHaveLength(5); // 5 remaining items
      });

      it('should set hasPreviousPage=false on first page', async () => {
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=1`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.hasPreviousPage).toBe(false);
      });

      it('should maintain filters across pagination', async () => {
        // Set some tasks to different status
        const tasks = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?limit=5`)
          .set(authHeaders)
          .expect(200);

        // Update first 3 tasks to DONE status
        for (let i = 0; i < 3; i++) {
          await request(app)
            .put(`/api/tasks/${tasks.body.data[i].id}`)
            .set(authHeaders)
            .send({ status: TaskStatus.DONE })
            .expect(200);
        }

        // Test pagination with status filter
        const response = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?status=done&page=1&limit=2`)
          .set(authHeaders)
          .expect(200);

        expect(response.body.data).toHaveLength(2);
        response.body.data.forEach((task: any) => {
          expect(task.status).toBe(TaskStatus.DONE);
        });
      });

      it('should return consistent results for same page request', async () => {
        const response1 = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=2&limit=5`)
          .set(authHeaders)
          .expect(200);

        const response2 = await request(app)
          .get(`/api/tasks/projects/${testUser.projectId}/tasks?page=2&limit=5`)
          .set(authHeaders)
          .expect(200);

        expect(response1.body.data).toEqual(response2.body.data);
      });
    });
  });

  describe('Task CRUD Edge Cases', () => {
    let taskId: string;

    beforeEach(async () => {
      const taskData = createValidTaskPayload();
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);
      taskId = response.body.id;
    });

    describe('Task Status Updates', () => {
      it('should update task status to DONE', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ status: TaskStatus.DONE })
          .expect(200);

        expect(response.body.status).toBe(TaskStatus.DONE);
        expect(response.body.completed_at).toBeDefined();
      });

      it('should handle task status transitions', async () => {
        // Start with TODO
        let response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ status: TaskStatus.TODO })
          .expect(200);
        expect(response.body.status).toBe(TaskStatus.TODO);

        // Move to IN_PROGRESS
        response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ status: TaskStatus.IN_PROGRESS })
          .expect(200);
        expect(response.body.status).toBe(TaskStatus.IN_PROGRESS);

        // Move to DONE
        response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ status: TaskStatus.DONE })
          .expect(200);
        expect(response.body.status).toBe(TaskStatus.DONE);
      });
    });

    describe('Task Priority Updates', () => {
      it('should update task priority', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ priority: TaskPriority.HIGH })
          .expect(200);

        expect(response.body.priority).toBe(TaskPriority.HIGH);
      });

      it('should handle all priority levels', async () => {
        const priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];
        
        for (const priority of priorities) {
          const response = await request(app)
            .put(`/api/tasks/${taskId}`)
            .set(authHeaders)
            .send({ priority })
            .expect(200);

          expect(response.body.priority).toBe(priority);
        }
      });
    });

    describe('Task Due Date Handling', () => {
      it('should update task due date', async () => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ dueDate: futureDate })
          .expect(200);

        expect(new Date(response.body.due_date)).toEqual(new Date(futureDate));
      });

      it('should handle tasks without due date', async () => {
        const response = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set(authHeaders)
          .send({ dueDate: null })
          .expect(200);

        expect(response.body.due_date).toBeUndefined();
      });
    });
  });
});
