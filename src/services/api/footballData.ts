/**
 * Football Data API Service (Stub)
 * This is now replaced by the RAG backend but kept for compatibility
 */

export const footballDataAPI = {
  setApiKey: (key: string) => {
    console.log('Football Data API key set (deprecated - using RAG backend)');
  },

  getMatches: async () => {
    console.log('Use RAG backend instead');
    return [];
  },

  getTeams: async () => {
    console.log('Use RAG backend instead');
    return [];
  },

  getPlayers: async () => {
    console.log('Use RAG backend instead');
    return [];
  }
};

export default footballDataAPI;