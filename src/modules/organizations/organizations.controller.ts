import { NextFunction, Request, Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { MemberRole } from '../../database/entities/organization-member.entity';

export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.organizationsService.createOrganization(req.user.id, req.body as CreateOrganizationDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await this.organizationsService.getUserOrganizations(req.user.id, { page: +page, limit: +limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.organizationsService.getOrganizationById(req.params.id, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.organizationsService.updateOrganization(req.params.id, req.user.id, req.body as UpdateOrganizationDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await this.organizationsService.deleteOrganization(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role } = req.body;
      const result = await this.organizationsService.inviteMember(req.params.id, req.user.id, email, role as MemberRole);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await this.organizationsService.getOrganizationMembers(req.params.id, req.user.id, { page: +page, limit: +limit });
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      await this.organizationsService.updateMemberRole(req.params.id, req.user.id, userId, role as MemberRole);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      await this.organizationsService.removeMember(req.params.id, req.user.id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}