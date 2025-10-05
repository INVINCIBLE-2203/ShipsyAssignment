// Simple mock data generators to replace faker.js

const mockEmails = [
  'test1@example.com', 'test2@example.com', 'user@test.com', 'admin@company.com',
  'developer@startup.com', 'manager@corp.com', 'analyst@firm.com', 'consultant@agency.com'
];

const mockUsernames = [
  'testuser1', 'testuser2', 'johndoe', 'janedoe', 'admin', 'developer', 'manager', 'analyst'
];

let emailIndex = 0;
let usernameIndex = 0;

const getRandomEmail = () => {
  const email = mockEmails[emailIndex % mockEmails.length];
  emailIndex++;
  return `${Date.now()}_${email}`;
};

const getRandomUsername = () => {
  const username = mockUsernames[usernameIndex % mockUsernames.length];
  usernameIndex++;
  return `${username}_${Date.now()}`;
};

export const createValidUserPayload = (overrides: any = {}) => ({
  email: getRandomEmail(),
  username: getRandomUsername(),
  password: 'ValidPass123!',
  ...overrides
});

export const createLoginPayload = (overrides: any = {}) => ({
  email: 'test@example.com',
  password: 'ValidPass123!',
  ...overrides
});

export const createInvalidUserPayloads = () => ({
  emptyEmail: {
    email: '',
    username: 'validuser',
    password: 'ValidPass123!'
  },
  invalidEmail: {
    email: 'invalid-email',
    username: 'validuser',
    password: 'ValidPass123!'
  },
  emptyUsername: {
    email: 'valid@email.com',
    username: '',
    password: 'ValidPass123!'
  },
  missingUsername: {
    email: 'valid@email.com',
    password: 'ValidPass123!'
  },
  shortUsername: {
    email: 'valid@email.com',
    username: 'ab',
    password: 'ValidPass123!'
  },
  longUsername: {
    email: 'valid@email.com',
    username: 'a'.repeat(31),
    password: 'ValidPass123!'
  },
  specialCharsUsername: {
    email: 'valid@email.com',
    username: 'user@name!',
    password: 'ValidPass123!'
  },
  weakPassword: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'weak'
  },
  shortPassword: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'Aa1!'
  },
  noUppercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'validpass123!'
  },
  missingUppercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'validpass123!'
  },
  noLowercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'VALIDPASS123!'
  },
  missingLowercase: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'VALIDPASS123!'
  },
  noNumber: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'ValidPass!'
  },
  missingNumber: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'ValidPass!'
  },
  noSpecialChar: {
    email: 'valid@email.com',
    username: 'validuser',
    password: 'ValidPass123'
  }
});

export const createInvalidLoginPayloads = () => ({
  emptyEmail: {
    email: '',
    password: 'ValidPass123!'
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'ValidPass123!'
  },
  wrongEmail: {
    email: 'nonexistent@email.com',
    password: 'ValidPass123!'
  },
  missingEmail: {
    password: 'ValidPass123!'
  },
  emptyPassword: {
    email: 'valid@email.com',
    password: ''
  },
  missingPassword: {
    email: 'valid@email.com'
  },
  wrongPassword: {
    email: 'valid@email.com',
    password: 'WrongPassword123!'
  },
  emptyCredentials: {
    email: '',
    password: ''
  }
});
