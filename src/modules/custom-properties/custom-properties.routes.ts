import { Router } from 'express';
import { CustomPropertiesController } from './custom-properties.controller';
import { CustomPropertiesService } from './custom-properties.service';
import { AppDataSource } from '../../config/database.config';
import { CustomProperty } from '../../database/entities/custom-property.entity';
import { CustomPropertyValue } from '../../database/entities/custom-property-value.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateCustomPropertyDto } from './dto/create-custom-property.dto';
import { UpdateCustomPropertyDto } from './dto/update-custom-property.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const customPropertiesRouter = Router();

const customPropertyRepository = AppDataSource.getRepository(CustomProperty);
const customPropertyValueRepository = AppDataSource.getRepository(CustomPropertyValue);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const userRepository = AppDataSource.getRepository(User);
const customPropertiesService = new CustomPropertiesService(customPropertyRepository, customPropertyValueRepository, organizationMemberRepository, userRepository);
const customPropertiesController = new CustomPropertiesController(customPropertiesService);

/**
 * @swagger
 * /api/custom-properties/organizations/{orgId}/properties:
 *   post:
 *     tags: [custom-properties]
 *     summary: Define a custom property
 *     description: Create a new custom property definition for tasks or projects within an organization
 *     operationId: defineCustomProperty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
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
 *             $ref: '#/components/schemas/CreateCustomPropertyDto'
 *           examples:
 *             textProperty:
 *               summary: Text property example
 *               value:
 *                 name: "Story Points"
 *                 type: "text"
 *                 entityType: "task"
 *             numberProperty:
 *               summary: Number property example
 *               value:
 *                 name: "Estimated Hours"
 *                 type: "number"
 *                 entityType: "task"
 *             selectProperty:
 *               summary: Select property example
 *               value:
 *                 name: "Team"
 *                 type: "select"
 *                 entityType: "project"
 *                 options:
 *                   choices: ["Frontend", "Backend", "DevOps", "QA"]
 *             dateProperty:
 *               summary: Date property example
 *               value:
 *                 name: "Target Launch Date"
 *                 type: "date"
 *                 entityType: "project"
 *     responses:
 *       201:
 *         description: Custom property defined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Custom property ID
 *                 organization_id:
 *                   type: string
 *                   format: uuid
 *                   description: Organization ID
 *                 entity_type:
 *                   type: string
 *                   enum: [task, project]
 *                   description: Entity this property applies to
 *                 property_name:
 *                   type: string
 *                   description: Property name
 *                 property_type:
 *                   type: string
 *                   enum: [text, number, date, datetime, select, multi_select, user]
 *                   description: Property data type
 *                 options:
 *                   type: object
 *                   description: Property-specific configuration
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp
 *             example:
 *               id: 123e4567-e89b-12d3-a456-426614174000
 *               organization_id: 550e8400-e29b-41d4-a716-446655440000
 *               entity_type: task
 *               property_name: "Estimated Hours"
 *               property_type: number
 *               options: {}
 *               created_at: 2024-01-15T10:30:00Z
 *       400:
 *         description: Invalid input data or property name already exists
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
customPropertiesRouter.post('/organizations/:orgId/properties', jwtAuthGuard, validationMiddleware(CreateCustomPropertyDto), (req, res, next) => customPropertiesController.define(req, res, next));

/**
 * @swagger
 * /api/custom-properties/organizations/{orgId}/properties/{entityType}:
 *   get:
 *     tags: [custom-properties]
 *     summary: Get custom properties for entity type
 *     description: Retrieve all custom property definitions for a specific entity type within an organization
 *     operationId: getCustomProperties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [task, project]
 *         description: Entity type to get properties for
 *         example: task
 *     responses:
 *       200:
 *         description: Custom properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   organization_id:
 *                     type: string
 *                     format: uuid
 *                   entity_type:
 *                     type: string
 *                     enum: [task, project]
 *                   property_name:
 *                     type: string
 *                   property_type:
 *                     type: string
 *                     enum: [text, number, date, datetime, select, multi_select, user]
 *                   options:
 *                     type: object
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *             example:
 *               - id: 123e4567-e89b-12d3-a456-426614174000
 *                 organization_id: 550e8400-e29b-41d4-a716-446655440000
 *                 entity_type: task
 *                 property_name: "Estimated Hours"
 *                 property_type: number
 *                 options: {}
 *                 created_at: 2024-01-15T10:30:00Z
 *               - id: 987fcdeb-51a2-43d1-9876-543210987654
 *                 organization_id: 550e8400-e29b-41d4-a716-446655440000
 *                 entity_type: task
 *                 property_name: "Priority Level"
 *                 property_type: select
 *                 options:
 *                   choices: ["P0", "P1", "P2", "P3"]
 *                 created_at: 2024-01-16T14:20:00Z
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
customPropertiesRouter.get('/organizations/:orgId/properties/:entityType', jwtAuthGuard, (req, res, next) => customPropertiesController.findAll(req, res, next));

/**
 * @swagger
 * /api/custom-properties/{id}:
 *   put:
 *     tags: [custom-properties]
 *     summary: Update custom property definition
 *     description: Update an existing custom property definition. Only name and options can be modified.
 *     operationId: updateCustomProperty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom property ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
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
 *                 description: Updated property name
 *                 example: "Story Points (Updated)"
 *               options:
 *                 type: object
 *                 description: Updated property options (for select types)
 *                 example:
 *                   choices: ["1", "2", "3", "5", "8", "13", "21"]
 *           examples:
 *             updateName:
 *               summary: Update property name
 *               value:
 *                 name: "Epic Points"
 *             updateSelectOptions:
 *               summary: Update select options
 *               value:
 *                 name: "Team Assignment"
 *                 options:
 *                   choices: ["Frontend", "Backend", "DevOps", "QA", "Design"]
 *     responses:
 *       200:
 *         description: Custom property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 organization_id:
 *                   type: string
 *                   format: uuid
 *                 entity_type:
 *                   type: string
 *                   enum: [task, project]
 *                 property_name:
 *                   type: string
 *                 property_type:
 *                   type: string
 *                   enum: [text, number, date, datetime, select, multi_select, user]
 *                 options:
 *                   type: object
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input data or name conflict
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
 *         description: Access denied to custom property
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Custom property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
customPropertiesRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateCustomPropertyDto), (req, res, next) => customPropertiesController.update(req, res, next));

/**
 * @swagger
 * /api/custom-properties/{id}:
 *   delete:
 *     tags: [custom-properties]
 *     summary: Delete custom property definition
 *     description: Delete a custom property definition. This will also remove all associated values.
 *     operationId: deleteCustomProperty
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom property ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       204:
 *         description: Custom property deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to custom property
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Custom property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
customPropertiesRouter.delete('/:id', jwtAuthGuard, (req, res, next) => customPropertiesController.remove(req, res, next));

/**
 * @swagger
 * /api/custom-properties/values/entity/{entityId}/property/{propertyId}:
 *   post:
 *     tags: [custom-properties]
 *     summary: Set custom property value
 *     description: Set or update the value of a custom property for a specific entity (task or project)
 *     operationId: setCustomPropertyValue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity ID (task or project ID)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Custom property ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: object
 *                 description: The value to set (type depends on property type)
 *             required:
 *               - value
 *           examples:
 *             textValue:
 *               summary: Set text value
 *               value:
 *                 value: "High priority feature"
 *             numberValue:
 *               summary: Set number value
 *               value:
 *                 value: 8
 *             selectValue:
 *               summary: Set select value
 *               value:
 *                 value: "Frontend"
 *             multiSelectValue:
 *               summary: Set multi-select values
 *               value:
 *                 value: ["Frontend", "Backend"]
 *             dateValue:
 *               summary: Set date value
 *               value:
 *                 value: "2024-12-31"
 *     responses:
 *       200:
 *         description: Custom property value set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: Property value ID
 *                 entity_id:
 *                   type: string
 *                   format: uuid
 *                   description: Entity ID
 *                 entity_type:
 *                   type: string
 *                   enum: [task, project]
 *                   description: Entity type
 *                 custom_property_id:
 *                   type: string
 *                   format: uuid
 *                   description: Custom property ID
 *                 value:
 *                   type: object
 *                   description: The stored value
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 customProperty:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     property_name:
 *                       type: string
 *                     property_type:
 *                       type: string
 *                       enum: [text, number, date, datetime, select, multi_select, user]
 *             example:
 *               id: 789e0123-e45b-67d8-a901-234567890123
 *               entity_id: 550e8400-e29b-41d4-a716-446655440000
 *               entity_type: task
 *               custom_property_id: 123e4567-e89b-12d3-a456-426614174000
 *               value: 8
 *               created_at: 2024-01-15T10:30:00Z
 *               updated_at: 2024-01-15T10:30:00Z
 *               customProperty:
 *                 id: 123e4567-e89b-12d3-a456-426614174000
 *                 property_name: "Estimated Hours"
 *                 property_type: number
 *       400:
 *         description: Invalid value for property type
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
 *         description: Access denied to entity or property
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Entity or custom property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
customPropertiesRouter.post('/values/entity/:entityId/property/:propertyId', jwtAuthGuard, (req, res, next) => customPropertiesController.setValue(req, res, next));

/**
 * @swagger
 * /api/custom-properties/values/entity/{entityId}/{entityType}:
 *   get:
 *     tags: [custom-properties]
 *     summary: Get custom property values for entity
 *     description: Retrieve all custom property values for a specific entity (task or project)
 *     operationId: getCustomPropertyValues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity ID (task or project ID)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [task, project]
 *         description: Entity type
 *         example: task
 *     responses:
 *       200:
 *         description: Custom property values retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Property value ID
 *                   entity_id:
 *                     type: string
 *                     format: uuid
 *                     description: Entity ID
 *                   entity_type:
 *                     type: string
 *                     enum: [task, project]
 *                     description: Entity type
 *                   custom_property_id:
 *                     type: string
 *                     format: uuid
 *                     description: Custom property ID
 *                   value:
 *                     type: object
 *                     description: The stored value
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   customProperty:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       property_name:
 *                         type: string
 *                       property_type:
 *                         type: string
 *                         enum: [text, number, date, datetime, select, multi_select, user]
 *                       options:
 *                         type: object
 *             example:
 *               - id: 789e0123-e45b-67d8-a901-234567890123
 *                 entity_id: 550e8400-e29b-41d4-a716-446655440000
 *                 entity_type: task
 *                 custom_property_id: 123e4567-e89b-12d3-a456-426614174000
 *                 value: 8
 *                 created_at: 2024-01-15T10:30:00Z
 *                 updated_at: 2024-01-15T10:30:00Z
 *                 customProperty:
 *                   id: 123e4567-e89b-12d3-a456-426614174000
 *                   property_name: "Estimated Hours"
 *                   property_type: number
 *                   options: {}
 *               - id: 456e7890-e12b-34d5-a678-901234567890
 *                 entity_id: 550e8400-e29b-41d4-a716-446655440000
 *                 entity_type: task
 *                 custom_property_id: 987fcdeb-51a2-43d1-9876-543210987654
 *                 value: "Frontend"
 *                 created_at: 2024-01-16T14:20:00Z
 *                 updated_at: 2024-01-16T14:20:00Z
 *                 customProperty:
 *                   id: 987fcdeb-51a2-43d1-9876-543210987654
 *                   property_name: "Team Assignment"
 *                   property_type: select
 *                   options:
 *                     choices: ["Frontend", "Backend", "DevOps", "QA"]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied to entity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Entity not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
customPropertiesRouter.get('/values/entity/:entityId/:entityType', jwtAuthGuard, (req, res, next) => customPropertiesController.getValues(req, res, next));

export { customPropertiesRouter };
