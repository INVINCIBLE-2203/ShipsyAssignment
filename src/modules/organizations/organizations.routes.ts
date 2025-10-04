import { Router } from 'express';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { AppDataSource } from '../../config/database.config';
import { Organization } from '../../database/entities/organization.entity';
import { OrganizationMember } from '../../database/entities/organization-member.entity';
import { User } from '../../database/entities/user.entity';
import { validationMiddleware } from '../../common/middleware/validation.middleware';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const organizationsRouter = Router();

const organizationRepository = AppDataSource.getRepository(Organization);
const organizationMemberRepository = AppDataSource.getRepository(OrganizationMember);
const userRepository = AppDataSource.getRepository(User);
const organizationsService = new OrganizationsService(organizationRepository, organizationMemberRepository, userRepository, AppDataSource);
const organizationsController = new OrganizationsController(organizationsService);

organizationsRouter.post('/', jwtAuthGuard, validationMiddleware(CreateOrganizationDto), (req, res, next) => organizationsController.create(req, res, next));
organizationsRouter.get('/', jwtAuthGuard, (req, res, next) => organizationsController.findAll(req, res, next));
organizationsRouter.get('/:id', jwtAuthGuard, (req, res, next) => organizationsController.findOne(req, res, next));
organizationsRouter.put('/:id', jwtAuthGuard, validationMiddleware(UpdateOrganizationDto), (req, res, next) => organizationsController.update(req, res, next));
organizationsRouter.delete('/:id', jwtAuthGuard, (req, res, next) => organizationsController.remove(req, res, next));
organizationsRouter.post('/:id/invite', jwtAuthGuard, (req, res, next) => organizationsController.inviteMember(req, res, next));
organizationsRouter.get('/:id/members', jwtAuthGuard, (req, res, next) => organizationsController.getMembers(req, res, next));
organizationsRouter.put('/:id/members/:userId', jwtAuthGuard, (req, res, next) => organizationsController.updateMemberRole(req, res, next));
organizationsRouter.delete('/:id/members/:userId', jwtAuthGuard, (req, res, next) => organizationsController.removeMember(req, res, next));

export { organizationsRouter };
