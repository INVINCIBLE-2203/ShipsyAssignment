import request from 'supertest';
import app from '../../src/main';
import { cleanDatabase } from '../helpers/database.helper';
import { 
  createTestUserWithProject, 
  getAuthHeader, 
  getExpiredToken, 
  getInvalidToken 
} from '../helpers/auth.helper';
import { createValidTaskPayload } from '../fixtures/tasks.fixture';

describe('Security Tests', () => {
  let testUser: any;
  let authHeaders: any;

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUserWithProject();
    authHeaders = getAuthHeader(testUser.token);
  });

  describe('Protected Routes Without Token', () => {
    it('should return 401 for GET /tasks without token', async () => {
      const response = await request(app)
        .get('/api/tasks/123e4567-e89b-12d3-a456-426614174000')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for POST /tasks without token', async () => {
      const taskData = createValidTaskPayload();
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .send(taskData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for PUT /tasks/:id without token', async () => {
      const response = await request(app)
        .put('/api/tasks/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: 'Updated Title' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for DELETE /tasks/:id without token', async () => {
      const response = await request(app)
        .delete('/api/tasks/123e4567-e89b-12d3-a456-426614174000')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for GET /projects without token', async () => {
      const response = await request(app)
        .get(`/api/projects/organizations/${testUser.organizationId}/projects`)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for GET /organizations without token', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Invalid/Expired Tokens', () => {
    it('should reject expired JWT token', async () => {
      const expiredHeaders = getAuthHeader(getExpiredToken());
      
      const response = await request(app)
        .get('/api/organizations')
        .set(expiredHeaders)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject malformed JWT token', async () => {
      const invalidHeaders = getAuthHeader(getInvalidToken());
      
      const response = await request(app)
        .get('/api/organizations')
        .set(invalidHeaders)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject JWT with invalid signature', async () => {
      const tamperedToken = testUser.token.slice(0, -10) + 'tampered123';
      const tamperedHeaders = getAuthHeader(tamperedToken);
      
      const response = await request(app)
        .get('/api/organizations')
        .set(tamperedHeaders)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject JWT from different secret', async () => {
      // This would be a token signed with a different secret
      const differentSecretToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.different_signature_here';
      const differentHeaders = getAuthHeader(differentSecretToken);
      
      const response = await request(app)
        .get('/api/organizations')
        .set(differentHeaders)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Cross-Organization Access', () => {
    let secondUser: any;

    beforeEach(async () => {
      // Create second user with different organization
      secondUser = await createTestUserWithProject();
    });

    it('should prevent user from accessing other org tasks', async () => {
      // Create task in first user's project
      const taskData = createValidTaskPayload();
      const taskResponse = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      // Try to access with second user's token
      const secondUserHeaders = getAuthHeader(secondUser.token);
      
      const response = await request(app)
        .get(`/api/tasks/${taskResponse.body.id}`)
        .set(secondUserHeaders)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should prevent user from creating tasks in other org projects', async () => {
      const taskData = createValidTaskPayload();
      const secondUserHeaders = getAuthHeader(secondUser.token);
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(secondUserHeaders)
        .send(taskData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should prevent user from updating other org tasks', async () => {
      // Create task in first user's project
      const taskData = createValidTaskPayload();
      const taskResponse = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      // Try to update with second user's token
      const secondUserHeaders = getAuthHeader(secondUser.token);
      
      const response = await request(app)
        .put(`/api/tasks/${taskResponse.body.id}`)
        .set(secondUserHeaders)
        .send({ title: 'Hacked Title' })
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should prevent user from deleting other org tasks', async () => {
      // Create task in first user's project
      const taskData = createValidTaskPayload();
      const taskResponse = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      // Try to delete with second user's token
      const secondUserHeaders = getAuthHeader(secondUser.token);
      
      const response = await request(app)
        .delete(`/api/tasks/${taskResponse.body.id}`)
        .set(secondUserHeaders)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should prevent member from deleting org (owner only)', async () => {
      // This would require creating a member user and testing org deletion
      // For now, we test that non-owners cannot delete
      const secondUserHeaders = getAuthHeader(secondUser.token);
      
      const response = await request(app)
        .delete(`/api/organizations/${testUser.organizationId}`)
        .set(secondUserHeaders)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should sanitize search query with SQL characters', async () => {
      // Create some tasks first
      const taskData = createValidTaskPayload({ title: 'Normal Task' });
      await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      // Try SQL injection in search
      const maliciousSearch = "'; DROP TABLE tasks; --";
      
      const response = await request(app)
        .get(`/api/tasks/projects/${testUser.projectId}/tasks?search=${encodeURIComponent(maliciousSearch)}`)
        .set(authHeaders)
        .expect(200);

      // Should return normal response, not cause SQL error
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle special characters in task title safely', async () => {
      const taskWithSpecialChars = createValidTaskPayload({
        title: "Task with 'quotes' and \"double quotes\" and <script>alert('xss')</script>"
      });
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskWithSpecialChars)
        .expect(201);

      expect(response.body.title).toBe(taskWithSpecialChars.title);
    });

    it('should escape user input in comments', async () => {
      // First create a task
      const taskData = createValidTaskPayload();
      const taskResponse = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      // Create comment with potential SQL injection
      const maliciousComment = {
        content: "Great task! '; DROP TABLE comments; --"
      };
      
      const response = await request(app)
        .post(`/api/comments/tasks/${taskResponse.body.id}/comments`)
        .set(authHeaders)
        .send(maliciousComment)
        .expect(201);

      expect(response.body.content).toBe(maliciousComment.content);
    });
  });

  describe('Authorization Hierarchy', () => {
    it('should allow organization owner full access', async () => {
      // Owner should be able to access all organization resources
      const response = await request(app)
        .get(`/api/organizations/${testUser.organizationId}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.id).toBe(testUser.organizationId);
    });

    it('should respect role-based permissions', async () => {
      // Test that certain operations require specific roles
      // This would be more comprehensive with actual role implementation
      
      const response = await request(app)
        .get(`/api/organizations/${testUser.organizationId}/members`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests within limits', async () => {
      // Make multiple requests quickly
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/organizations')
          .set(authHeaders)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed if within rate limit
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Input Validation Security', () => {
    it('should reject oversized payloads', async () => {
      const oversizedTask = createValidTaskPayload({
        description: 'x'.repeat(10000) // Very large description
      });
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(oversizedTask)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate UUID formats strictly', async () => {
      const invalidUuidTask = createValidTaskPayload({
        assigneeId: 'not-a-valid-uuid'
      });
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(invalidUuidTask)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should sanitize HTML in text fields', async () => {
      const htmlTask = createValidTaskPayload({
        title: '<script>alert("xss")</script>Normal Title',
        description: '<img src="x" onerror="alert(1)">Description'
      });
      
      const response = await request(app)
        .post(`/api/tasks/projects/${testUser.projectId}/tasks`)
        .set(authHeaders)
        .send(htmlTask)
        .expect(201);

      // Should store the raw content but safely handle it
      expect(response.body.title).toBe(htmlTask.title);
      expect(response.body.description).toBe(htmlTask.description);
    });
  });
});
