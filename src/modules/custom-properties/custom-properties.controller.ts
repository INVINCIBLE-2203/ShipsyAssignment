import { NextFunction, Request, Response } from 'express';
import { CustomPropertiesService } from './custom-properties.service';
import { CreateCustomPropertyDto } from './dto/create-custom-property.dto';
import { UpdateCustomPropertyDto } from './dto/update-custom-property.dto';

export class CustomPropertiesController {
  constructor(private readonly customPropertiesService: CustomPropertiesService) {}

  async define(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = req.params;
      const result = await this.customPropertiesService.defineCustomProperty(orgId, (req.user as any)?.id, req.body as CreateCustomPropertyDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, entityType } = req.params;
      const result = await this.customPropertiesService.getOrganizationProperties(orgId, entityType as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this.customPropertiesService.updatePropertyDefinition(id, (req.user as any)?.id, req.body as UpdateCustomPropertyDto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.customPropertiesService.deleteProperty(id, (req.user as any)?.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async setValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityId, propertyId } = req.params;
      const { value } = req.body;
      const result = await this.customPropertiesService.setPropertyValue(entityId, propertyId, value, (req.user as any)?.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getValues(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityId, entityType } = req.params;
      const result = await this.customPropertiesService.getEntityPropertyValues(entityId, entityType);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
