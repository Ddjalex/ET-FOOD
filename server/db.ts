import * as schema from '@shared/schema';

// Mock database implementation for development without external dependencies
const mockDatabase = {
  select: () => ({ from: () => ({ where: () => [] }) }),
  insert: () => ({ values: () => ({ returning: () => [] }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
  delete: () => ({ where: () => {} }),
};

console.log('Database configuration: Using in-memory storage (no external database required)');

// Export a mock database object that won't be used since we're using MemoryStorage
export const db = mockDatabase;
