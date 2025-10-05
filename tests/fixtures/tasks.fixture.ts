// Simple mock data generators to replace faker.js
import { TaskStatus, TaskPriority } from '../../src/database/entities/task.entity';

const mockTitles = [
  'Complete project setup', 'Fix bug in authentication', 'Add new feature', 
  'Update documentation', 'Implement user interface', 'Write unit tests',
  'Deploy to production', 'Code review', 'Database migration', 'API integration'
];

const mockDescriptions = [
  'This is a detailed description of the task requirements.',
  'Task involves working with the database and API endpoints.',
  'UI/UX improvements needed for better user experience.',
  'Performance optimization and code refactoring required.',
  'Integration testing and quality assurance needed.',
  'Documentation update to reflect recent changes.',
  'Security audit and vulnerability assessment.',
  'New feature implementation as per requirements.',
  'Bug fixes and maintenance work required.',
  'Data migration and database optimization.'
];

let titleIndex = 0;
let descriptionIndex = 0;

const getRandomTitle = () => {
  const title = mockTitles[titleIndex % mockTitles.length];
  titleIndex++;
  return `${title} ${Date.now()}`;
};

const getRandomDescription = () => {
  const description = mockDescriptions[descriptionIndex % mockDescriptions.length];
  descriptionIndex++;
  return description;
};

export const createValidTaskPayload = (overrides: any = {}) => ({
  title: getRandomTitle(),
  description: getRandomDescription(),
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  ...overrides
});

export const createTaskPayload = (overrides: any = {}) => ({
  title: getRandomTitle(),
  description: getRandomDescription(),
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  estimatedHours: 8,
  ...overrides
});

export const createInvalidTaskPayloads = () => ({
  emptyTitle: {
    title: '',
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM
  },
  shortTitle: {
    title: 'ab',
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM
  },
  longTitle: {
    title: 'a'.repeat(201),
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM
  },
  longDescription: {
    title: 'Valid Title',
    description: 'a'.repeat(2001),
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM
  },
  invalidStatus: {
    title: 'Valid Title',
    description: 'Valid description',
    status: 'invalid_status' as any,
    priority: TaskPriority.MEDIUM
  },
  invalidPriority: {
    title: 'Valid Title',
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: 'invalid_priority' as any
  },
  invalidAssigneeId: {
    title: 'Valid Title',
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeId: 'invalid-uuid'
  },
  invalidDate: {
    title: 'Valid Title',
    description: 'Valid description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: 'invalid-date'
  }
});

export const createTaskBatch = (count: number, overrides: any = {}) => {
  return Array.from({ length: count }, (_, i) => 
    createValidTaskPayload({ 
      title: `Batch Task ${i + 1} ${Date.now()}`,
      ...overrides 
    })
  );
};

export const createOverdueTask = (overrides: any = {}) => ({
  title: `Overdue Task ${Date.now()}`,
  description: 'This task is overdue',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  ...overrides
});

export const createCompletedTask = (overrides: any = {}) => ({
  title: `Completed Task ${Date.now()}`,
  description: 'This task is completed',
  status: TaskStatus.DONE,
  priority: TaskPriority.MEDIUM,
  completed_at: new Date().toISOString(),
  ...overrides
});
