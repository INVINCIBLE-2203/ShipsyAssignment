import { NextFunction, Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = req.params;
      const result = await this.projectsService.createProject(orgId, req.user.id, req.body as CreateProjectDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = req.params;
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await this.projectsService.getOrganizationProjects(
        orgId,
        req.user.id,
        filters as any,
        { page: +page, limit: +limit },
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.projectsService.getProjectById(req.params.id, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.projectsService.updateProject(req.params.id, req.user.id, req.body as UpdateProjectDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await this.projectsService.deleteProject(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.projectsService.getProjectStats(req.params.id, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}