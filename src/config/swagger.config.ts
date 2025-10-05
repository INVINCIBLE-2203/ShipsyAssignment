import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API for collaborative task management with workspaces, projects, and custom properties',
      contact: {
        name: 'API Support',
        email: 'support@taskmanagement.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'organizations',
        description: 'Organization/Workspace management',
      },
      {
        name: 'projects',
        description: 'Project management',
      },
      {
        name: 'tasks',
        description: 'Task CRUD operations',
      },
      {
        name: 'comments',
        description: 'Comments and mentions',
      },
      {
        name: 'custom-properties',
        description: 'Custom field definitions',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token **_only_**',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
            path: {
              type: 'string',
              description: 'Request path',
            },
          },
          required: ['statusCode', 'message'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Items per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Whether there is a next page',
            },
            hasPreviousPage: {
              type: 'boolean',
              description: 'Whether there is a previous page',
            },
          },
          required: ['total', 'page', 'limit', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
        },
        LoginDto: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123',
            },
          },
          required: ['email', 'password'],
        },
        RegisterDto: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 50,
              description: 'Unique username',
              example: 'john_doe',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password',
              example: 'password123',
            },
          },
          required: ['email', 'username', 'password'],
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserResponse',
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT access token',
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token',
                },
              },
              required: ['accessToken', 'refreshToken'],
            },
          },
          required: ['user', 'tokens'],
        },
        CreateOrganizationDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Organization name',
              example: 'My Company',
            },
          },
          required: ['name'],
        },
        OrganizationResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID',
            },
            name: {
              type: 'string',
              description: 'Organization name',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly organization identifier',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date',
            },
            memberCount: {
              type: 'integer',
              description: 'Number of members',
            },
            projectCount: {
              type: 'integer',
              description: 'Number of projects',
            },
          },
        },
        CreateProjectDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Project name',
              example: 'Website Redesign',
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Project description',
              example: 'Complete redesign of the company website',
            },
          },
          required: ['name'],
        },
        ProjectResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            organization_id: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'Creator user ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date',
            },
            taskCount: {
              type: 'integer',
              description: 'Number of tasks',
            },
            completionRate: {
              type: 'number',
              format: 'float',
              description: 'Completion percentage',
            },
          },
        },
        CreateTaskDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description: 'Task title',
              example: 'Implement user authentication',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
              example: 'Add JWT-based authentication to the API',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done', 'archived'],
              description: 'Task status',
              default: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Task priority',
              default: 'medium',
            },
            assigneeId: {
              type: 'string',
              format: 'uuid',
              description: 'Assigned user ID',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
          },
          required: ['title'],
        },
        UpdateTaskDto: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description: 'Task title',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done', 'archived'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Task priority',
            },
            assigneeId: {
              type: 'string',
              format: 'uuid',
              description: 'Assigned user ID',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'Task due date',
            },
          },
        },
        TaskResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Task ID',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Task description',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'review', 'done', 'archived'],
              description: 'Task status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Task priority',
            },
            project_id: {
              type: 'string',
              format: 'uuid',
              description: 'Project ID',
            },
            assignee_id: {
              type: 'string',
              format: 'uuid',
              description: 'Assigned user ID',
            },
            due_date: {
              type: 'string',
              format: 'date-time',
              description: 'Due date',
            },
            created_by: {
              type: 'string',
              format: 'uuid',
              description: 'Creator user ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Completion date',
            },
            assignee: {
              $ref: '#/components/schemas/UserResponse',
            },
          },
        },
        CreateCommentDto: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              description: 'Comment content',
              example: 'This task needs more clarification on the requirements.',
            },
          },
          required: ['content'],
        },
        CommentResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Comment ID',
            },
            content: {
              type: 'string',
              description: 'Comment content',
            },
            task_id: {
              type: 'string',
              format: 'uuid',
              description: 'Task ID',
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'Author user ID',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
            user: {
              $ref: '#/components/schemas/UserResponse',
            },
          },
        },
        CreateCustomPropertyDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Property name',
              example: 'Estimated Hours',
            },
            type: {
              type: 'string',
              enum: ['text', 'number', 'date', 'datetime', 'select', 'multi_select', 'user'],
              description: 'Property data type',
            },
            entityType: {
              type: 'string',
              enum: ['task', 'project'],
              description: 'Entity this property applies to',
            },
            options: {
              type: 'object',
              description: 'Property-specific options (for select types)',
              example: {
                choices: ['Option 1', 'Option 2', 'Option 3']
              },
            },
          },
          required: ['name', 'type', 'entityType'],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/auth/auth.routes.ts',
    './src/modules/organizations/organizations.routes.ts',
    './src/modules/projects/projects.routes.ts',
    './src/modules/tasks/tasks.routes.ts',
    './src/modules/comments/comments.routes.ts',
    './src/modules/custom-properties/custom-properties.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
