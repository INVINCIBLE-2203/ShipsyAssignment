import { faker } from '@faker-js/faker';

export const createProjectPayload = (overrides: any = {}) => ({
  name: faker.lorem.words(2),
  description: faker.lorem.paragraph(),
  ...overrides
});

export const createValidProjectPayload = (overrides: any = {}) => ({
  name: 'Test Project',
  description: 'This is a test project description',
  ...overrides
});

export const createInvalidProjectPayloads = () => ({
  emptyName: {
    name: '',
    description: 'Valid description'
  },
  longName: {
    name: 'a'.repeat(101),
    description: 'Valid description'
  },
  shortName: {
    name: 'ab',
    description: 'Valid description'
  },
  longDescription: {
    name: 'Valid name',
    description: 'a'.repeat(1001)
  },
  missingName: {
    description: 'Valid description'
  }
});

export const createOrganizationPayload = (overrides: any = {}) => ({
  name: faker.company.name(),
  ...overrides
});

export const createValidOrganizationPayload = (overrides: any = {}) => ({
  name: 'Test Organization',
  ...overrides
});

export const createInvalidOrganizationPayloads = () => ({
  emptyName: {
    name: ''
  },
  longName: {
    name: 'a'.repeat(101)
  },
  shortName: {
    name: 'ab'
  },
  missingName: {}
});
