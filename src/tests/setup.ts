import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB for tests
const mockIndexedDB = {
  open: vi.fn(() => ({
    onerror: vi.fn(),
    onsuccess: vi.fn(),
    onupgradeneeded: vi.fn(),
    result: {
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({
            onsuccess: vi.fn(),
            onerror: vi.fn(),
            result: null
          })),
          put: vi.fn(),
          clear: vi.fn()
        }))
      })),
      objectStoreNames: {
        contains: vi.fn(() => false)
      }
    }
  }))
};

// Setup global mocks
global.indexedDB = mockIndexedDB as any;

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock as Storage;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};