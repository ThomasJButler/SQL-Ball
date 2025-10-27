import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Clear environment variables that might interfere with tests
delete process.env.VITE_FOOTBALL_DATA_API_KEY;
delete process.env.VITE_OPENAI_API_KEY;

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: true,
    VITE_FOOTBALL_DATA_API_KEY: '',
    VITE_OPENAI_API_KEY: ''
  },
  configurable: true
});

// Mock IndexedDB for tests
const mockIndexedDB = {
  open: vi.fn(() => {
    const request: any = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: null
            })),
            put: vi.fn(() => ({
              onsuccess: null,
              onerror: null
            })),
            clear: vi.fn(() => ({
              onsuccess: null,
              onerror: null
            }))
          }))
        })),
        objectStoreNames: {
          contains: vi.fn(() => false)
        },
        createObjectStore: vi.fn()
      }
    };
    // Don't trigger callbacks automatically
    return request;
  })
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

// Mock Chart.js chart types
global.Chart = {
  register: vi.fn(),
  defaults: {},
} as any;

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});