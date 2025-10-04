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

customPropertiesRouter.post('/organizations/:orgId/properties', jwtAuthGuard, validationMiddleware(CreateCustomPropertyDto), (req, res, next) => customPropertiesController.define(req, res, next));
customPropertiesRouter.get('/organizations/:orgId/properties/:entityType', jwtAuthGuard, (req, res, next) => customPropertiesController.findAll(req, res, next));
customPropertiesRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateCustomPropertyDto), (req, res, next) => customPropertiesController.update(req, res, next));
customPropertiesRouter.delete('/:id', jwtAuthGuard, (req, res, next) => customPropertiesController.remove(req, res, next));
customPropertiesRouter.post('/values/entity/:entityId/property/:propertyId', jwtAuthGuard, (req, res, next) => customPropertiesController.setValue(req, res, next));
customPropertiesRouter.get('/values/entity/:entityId/:entityType', jwtAuthGuard, (req, res, next) => customPropertiesController.getValues(req, res, next));

export { customPropertiesRouter };
