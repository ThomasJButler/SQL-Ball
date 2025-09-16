import { vi } from 'vitest';

// Mock localStorage globally
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock as any;

// Mock IndexedDB for Node.js test environment
const mockIndexedDB = {
  open: vi.fn(() => {
    const request: any = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => ({
              onsuccess: null,
              onerror: null
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
        }))
      }
    };
    // Simulate async success
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);
    return request;
  })
};

// @ts-ignore
global.indexedDB = mockIndexedDB;

// Clear any environment variables that might interfere with tests
delete process.env.VITE_FOOTBALL_DATA_API_KEY;
delete process.env.VITE_OPENAI_API_KEY;