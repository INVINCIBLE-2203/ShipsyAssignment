import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { AppDataSource } from '../../config/database.config';
import { Organization } from '../../database/entities/organization.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';
import { Project } from '../../database/entities/project.entity';
import { Task } from '../../database/entities/task.entity';
import { CustomProperty } from '../../database/entities/custom-property.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const organizationsRouter = Router();

const organizationRepository = AppDataSource.getRepository(Organization);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const userRepository = AppDataSource.getRepository(User);
const projectRepository = AppDataSource.getRepository(Project);
const taskRepository = AppDataSource.getRepository(Task);
const customPropertyRepository = AppDataSource.getRepository(CustomProperty);
const organizationsService = new OrganizationsService(organizationRepository, organizationMemberRepository, userRepository, projectRepository, taskRepository, customPropertyRepository, AppDataSource);
const organizationsController = new OrganizationsController(organizationsService);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     tags: [organizations]
 *     summary: Create a new organization
 *     description: Create a new organization/workspace. The creator automatically becomes the owner.
 *     operationId: createOrganization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganizationDto'
 *           example:
 *             name: Acme Corporation
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationResponse'
 *             example:
 *               id: 550e8400-e29b-41d4-a716-446655440000
 *               name: Acme Corporation
 *               slug: acme-corporation
 *               created_at: 2024-01-15T10:30:00Z
 *               memberCount: 1
 *               projectCount: 0
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Organization name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.post('/', jwtAuthGuard, validationMiddleware(CreateOrganizationDto), (req, res, next) => organizationsController.create(req, res, next));

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     tags: [organizations]
 *     summary: Get user organizations
 *     description: Retrieve all organizations the authenticated user is a member of
 *     operationId: getUserOrganizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/OrganizationResponse'
 *                       - type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             enum: [owner, admin, member, viewer]
 *                             description: User's role in this organization
 *                 total:
 *                   type: integer
 *                   description: Total number of organizations
 *             example:
 *               data:
 *                 - id: 550e8400-e29b-41d4-a716-446655440000
 *                   name: Acme Corporation
 *                   slug: acme-corporation
 *                   role: owner
 *                   memberCount: 5
 *                   projectCount: 3
 *                 - id: 123e4567-e89b-12d3-a456-426614174000
 *                   name: Tech Startup
 *                   slug: tech-startup
 *                   role: member
 *                   memberCount: 12
 *                   projectCount: 8
 *               total: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.get('/', jwtAuthGuard, (req, res, next) => organizationsController.findAll(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     tags: [organizations]
 *     summary: Get organization by ID
 *     description: Retrieve detailed information about a specific organization
 *     operationId: getOrganizationById
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationResponse'
 *             example:
 *               id: 550e8400-e29b-41d4-a716-446655440000
 *               name: Acme Corporation
 *               slug: acme-corporation
 *               created_at: 2024-01-15T10:30:00Z
 *               memberCount: 5
 *               projectCount: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.get('/:id', jwtAuthGuard, (req, res, next) => organizationsController.findOne(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     tags: [organizations]
 *     summary: Update organization
 *     description: Update organization details. Requires admin or owner permissions.
 *     operationId: updateOrganization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Updated organization name
 *                 example: Acme Corporation Inc.
 *           example:
 *             name: Acme Corporation Inc.
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrganizationResponse'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateOrganizationDto), (req, res, next) => organizationsController.update(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     tags: [organizations]
 *     summary: Delete organization
 *     description: Delete an organization permanently. Only organization owners can perform this action.
 *     operationId: deleteOrganization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       204:
 *         description: Organization deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Only owners can delete organizations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => organizationsController.remove(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}/invite:
 *   post:
 *     tags: [organizations]
 *     summary: Invite user to organization
 *     description: Invite a user to join the organization by email. Requires admin or owner permissions.
 *     operationId: inviteUserToOrganization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to invite
 *                 example: newuser@example.com
 *               role:
 *                 type: string
 *                 enum: [admin, member, viewer]
 *                 description: Role to assign to the invited user
 *                 default: member
 *                 example: member
 *             required:
 *               - email
 *               - role
 *           example:
 *             email: newuser@example.com
 *             role: member
 *     responses:
 *       201:
 *         description: User invited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                 organization_id:
 *                   type: string
 *                   format: uuid
 *                 role:
 *                   type: string
 *                   enum: [owner, admin, member, viewer]
 *                 joined_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input or user already a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already a member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.post('/:id/invite', jwtAuthGuard, (req, res, next) => organizationsController.inviteMember(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}/members:
 *   get:
 *     tags: [organizations]
 *     summary: Get organization members
 *     description: Retrieve all members of the organization with their roles
 *     operationId: getOrganizationMembers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         $ref: '#/components/schemas/UserResponse'
 *                       role:
 *                         type: string
 *                         enum: [owner, admin, member, viewer]
 *                       joined_at:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *             example:
 *               data:
 *                 - user:
 *                     id: 123e4567-e89b-12d3-a456-426614174000
 *                     username: johndoe
 *                     email: john@example.com
 *                   role: owner
 *                   joined_at: 2024-01-15T10:30:00Z
 *                 - user:
 *                     id: 987fcdeb-51a2-43d1-9876-543210987654
 *                     username: janesmith
 *                     email: jane@example.com
 *                   role: member
 *                   joined_at: 2024-01-16T14:20:00Z
 *               total: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.get('/:id/members', jwtAuthGuard, (req, res, next) => organizationsController.getMembers(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   put:
 *     tags: [organizations]
 *     summary: Update member role
 *     description: Update the role of an organization member. Requires admin or owner permissions.
 *     operationId: updateMemberRole
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID of the member to update
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member, viewer]
 *                 description: New role for the member
 *                 example: admin
 *             required:
 *               - role
 *           example:
 *             role: admin
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member role updated successfully
 *       400:
 *         description: Invalid role or cannot demote last owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions or only owners can assign owner role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization or member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.put('/:id/members/:userId', jwtAuthGuard, (req, res, next) => organizationsController.updateMemberRole(req, res, next));

/**
 * @swagger
 * /api/organizations/{id}/members/{userId}:
 *   delete:
 *     tags: [organizations]
 *     summary: Remove member from organization
 *     description: Remove a member from the organization. Requires admin or owner permissions.
 *     operationId: removeMemberFromOrganization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID of the member to remove
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       204:
 *         description: Member removed successfully
 *       400:
 *         description: Cannot remove the last owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization or member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
organizationsRouter.delete('/:id/members/:userId', jwtAuthGuard, (req, res, next) => organizationsController.removeMember(req, res, next));

export { organizationsRouter };
