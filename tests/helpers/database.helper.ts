import { AppDataSource } from '../../src/config/database.config';
import { User } from '../../src/database/entities/user.entity';
import { Organization } from '../../src/database/entities/organization.entity';
import { OrganizationMember } from '../../src/database/entities/organization-member.entity';
import { Project } from '../../src/database/entities/project.entity';
import { Task } from '../../src/database/entities/task.entity';
import { Comment } from '../../src/database/entities/comment.entity';
import { CustomProperty } from '../../src/database/entities/custom-property.entity';
import { CustomPropertyValue } from '../../src/database/entities/custom-property-value.entity';
import { Mention } from '../../src/database/entities/mention.entity';

export const cleanDatabase = async (): Promise<void> => {
  if (!AppDataSource.isInitialized) {
    return;
  }

  try {
    // Use raw SQL to delete all records in proper order to handle foreign keys
    const entities = [
      'mentions',
      'custom_property_values', 
      'custom_properties',
      'comments',
      'tasks',
      'projects',
      'organization_members',
      'organizations',
      'users'
    ];

    for (const entity of entities) {
      await AppDataSource.query(`DELETE FROM ${entity}`);
    }
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
};

export const seedTestData = async () => {
  // This function can be used to create consistent test data
  // if needed for specific test scenarios
};

export const getEntityCount = async (entity: any): Promise<number> => {
  return await AppDataSource.getRepository(entity).count();
};

export const waitForDatabase = async (maxRetries = 10): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      // Test connection with a simple query
      await AppDataSource.query('SELECT 1');
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`Database not ready after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
