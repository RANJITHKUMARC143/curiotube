/**
 * Mock implementation of the idb package for React Native
 * This provides empty implementations of the required methods
 */

// Mock openDB function
const openDB = (name, version, options) => {
  console.log(`[IDB Mock] openDB called with name: ${name}, version: ${version}`);
  return {
    transaction: () => ({
      objectStore: () => ({
        get: async () => null,
        put: async () => undefined,
        delete: async () => undefined,
        clear: async () => undefined,
        getAll: async () => [],
        getAllKeys: async () => [],
        count: async () => 0,
      }),
      commit: async () => undefined,
    }),
    close: () => undefined,
  };
};

// Mock deleteDB function
const deleteDB = (name) => {
  console.log(`[IDB Mock] deleteDB called with name: ${name}`);
  return Promise.resolve();
};

// Export the mock functions
module.exports = {
  openDB,
  deleteDB,
}; 