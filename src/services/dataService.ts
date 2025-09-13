import type { Match, Season, TeamStats, Standing, TeamForm } from '../types';
import { footballDataAPI } from './api/footballData';

interface DataSource {
  type: 'api';
  available: boolean;
}

class DataService {
  private apiSource: DataSource = { type: 'api', available: false };
  private useCache: boolean = true;
  private cacheDb: IDBDatabase | null = null;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes default
  
  constructor() {
    this.initializeIndexedDB();
    this.checkDataSources();
  }
  
  private async initializeIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }
    
    const request = indexedDB.open('PremierLeagueOracle', 1);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB');
    };
    
    request.onsuccess = () => {
      this.cacheDb = request.result;
      console.log('IndexedDB initialized');
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores for caching
      if (!db.objectStoreNames.contains('matches')) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' });
        matchStore.createIndex('date', 'date', { unique: false });
        matchStore.createIndex('teams', ['home_team', 'away_team'], { unique: false });
      }
      
      if (!db.objectStoreNames.contains('standings')) {
        const standingsStore = db.createObjectStore('standings', { keyPath: 'team_id' });
        standingsStore.createIndex('position', 'position', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('teamStats')) {
        db.createObjectStore('teamStats', { keyPath: 'team_name' });
      }
    };
  }
  
  private async checkDataSources(): Promise<void> {
    try {
      // First check if API key is available
      if (!footballDataAPI.hasApiKey()) {
        console.log('⏳ Football-Data API: No API key available, marking as unavailable');
        this.apiSource.available = false;
        return;
      }
      
      // Test API availability with the key
      const season = await footballDataAPI.getCurrentSeason();
      this.apiSource.available = season !== null;
      
      if (this.apiSource.available) {
        console.log('✅ Football-Data API is available and working');
      } else {
        console.error('❌ Football-Data API is not working (invalid response)');
      }
    } catch (error) {
      console.error('Error checking API availability:', error);
      this.apiSource.available = false;
    }
  }
  
  // Public API for checking data source status
  public getDataSourceStatus() {
    return {
      api: this.apiSource.available,
      usingAPI: this.apiSource.available
    };
  }

  // Get overall service status
  public getStatus() {
    return {
      primarySource: this.apiSource,
      fallbackSource: { type: 'none', available: false }
    };
  }
  
  // Cache management
  private async getCachedData<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.useCache || !this.cacheDb) return null;
    
    return new Promise((resolve) => {
      const transaction = this.cacheDb!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.timestamp && Date.now() - result.timestamp < this.cacheTimeout) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }
  
  private async setCachedData<T>(storeName: string, key: string, data: T): Promise<void> {
    if (!this.useCache || !this.cacheDb) return;
    
    const transaction = this.cacheDb.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await store.put({
      id: key,
      data,
      timestamp: Date.now()
    });
  }
  
  // Main data fetching methods - API only
  public async getCurrentSeason(): Promise<Season | null> {
    const cacheKey = 'current_season';
    
    // Try cache first
    const cached = await this.getCachedData<Season>('teamStats', cacheKey);
    if (cached) return cached;
    
    // Get from API
    if (this.apiSource.available) {
      try {
        const season = await footballDataAPI.getCurrentSeason();
        if (season) {
          await this.setCachedData('teamStats', cacheKey, season);
          return season;
        }
      } catch (error) {
        console.error('Error fetching season from API:', error);
      }
    }
    
    throw new Error('No data source available for current season');
  }
  
  public async getMatches(options: {
    upcoming?: boolean;
    recent?: boolean;
    days?: number;
    matchday?: number;
  } = {}): Promise<Match[]> {
    const { upcoming = false, recent = false, days = 7, matchday } = options;
    const cacheKey = `matches_${upcoming ? 'upcoming' : 'recent'}_${days}_${matchday || 'all'}`;
    
    // Try cache first
    const cached = await this.getCachedData<Match[]>('matches', cacheKey);
    if (cached) return cached;
    
    // Get from API
    if (this.apiSource.available) {
      try {
        let matches: Match[] = [];
        
        if (upcoming) {
          matches = await footballDataAPI.getUpcomingMatches(days);
        } else if (recent) {
          matches = await footballDataAPI.getRecentMatches(days);
        } else if (matchday) {
          matches = await footballDataAPI.getMatchesByMatchday(matchday);
        } else {
          matches = await footballDataAPI.getAllMatches();
        }
        
        if (matches.length > 0) {
          await this.setCachedData('matches', cacheKey, matches);
          return matches;
        }
      } catch (error) {
        console.error('Error fetching matches from API:', error);
      }
    }
    
    // Fall back to Supabase if API is not available
    console.log('📊 Falling back to Supabase for match data');
    try {
      const { getRecentMatches } = await import('../lib/supabase');
      const matches = await getRecentMatches(recent ? 50 : 100);
      
      // Filter based on options
      const now = new Date();
      let filteredMatches = matches;
      
      if (upcoming) {
        filteredMatches = matches.filter(m => new Date(m.date) > now).slice(0, 20);
      } else if (recent) {
        filteredMatches = matches.filter(m => new Date(m.date) <= now).slice(0, 20);
      }
      
      return filteredMatches;
    } catch (supabaseError) {
      console.error('Error fetching from Supabase:', supabaseError);
      // Return empty array instead of throwing
      return [];
    }
  }
  
  public async getCurrentSeasonMatches(): Promise<Match[]> {
    return this.getMatches();
  }
  
  public async getStandings(): Promise<Standing[]> {
    const cacheKey = 'current_standings';
    
    // Try cache first
    const cached = await this.getCachedData<Standing[]>('standings', cacheKey);
    if (cached) return cached;
    
    // Get from API
    if (this.apiSource.available) {
      try {
        const standings = await footballDataAPI.getStandings();
        if (standings && standings.length > 0) {
          await this.setCachedData('standings', cacheKey, standings);
          return standings;
        }
      } catch (error) {
        console.error('Error fetching standings from API:', error);
      }
    }
    
    throw new Error('No data source available for standings');
  }
  
  public async getTeamStats(teamName: string): Promise<TeamStats | null> {
    const cacheKey = `team_stats_${teamName}`;
    
    // Try cache first
    const cached = await this.getCachedData<TeamStats>('teamStats', cacheKey);
    if (cached) return cached;
    
    // Get from API
    if (this.apiSource.available) {
      try {
        const teamStats = await footballDataAPI.getTeamStats(teamName);
        if (teamStats) {
          // Transform Football API stats to our TeamStats format
          const stats: TeamStats = {
            id: `${teamName}_${new Date().getFullYear()}`,
            season_id: '2024', // TODO: Get current season ID
            team_name: teamName,
            matches_played: teamStats.played,
            wins: teamStats.wins,
            draws: teamStats.draws,
            losses: teamStats.losses,
            goals_for: teamStats.goalsFor,
            goals_against: teamStats.goalsAgainst,
            clean_sheets: 0, // Not available from API
            failed_to_score: 0, // Not available from API
            points: teamStats.points,
            home_matches_played: 0, // Calculate separately if needed
            home_wins: 0,
            home_draws: 0,
            home_losses: 0,
            home_goals_for: 0,
            home_goals_against: 0,
            away_matches_played: 0,
            away_wins: 0,
            away_draws: 0,
            away_losses: 0,
            away_goals_for: 0,
            away_goals_against: 0,
            updated_at: new Date().toISOString()
          };
          
          await this.setCachedData('teamStats', cacheKey, stats);
          return stats;
        }
      } catch (error) {
        console.error('Error fetching team stats from API:', error);
      }
    }
    
    return null;
  }
  
  public async getTeamForm(teamName: string, matches?: Match[]): Promise<TeamForm[]> {
    const cacheKey = `team_form_${teamName}_${matches?.length || 5}`;
    
    // Try cache first
    const cached = await this.getCachedData<TeamForm[]>('teamStats', cacheKey);
    if (cached) return cached;
    
    // Get from API
    if (this.apiSource.available) {
      try {
        const teamForm = await footballDataAPI.getTeamForm(teamName, matches);
        if (teamForm) {
          await this.setCachedData('teamStats', cacheKey, teamForm);
          return teamForm;
        }
      } catch (error) {
        console.error('Error fetching team form from API:', error);
      }
    }
    
    // Return empty array if no data available
    return [];
  }
  
  // Get all seasons
  public async getAllSeasons(): Promise<Season[]> {
    const cacheKey = 'all_seasons';
    
    // Try cache first
    const cached = await this.getCachedData<Season[]>('matches', cacheKey);
    if (cached) return cached;
    
    // Get current season from API
    if (this.apiSource.available) {
      try {
        const currentSeason = await footballDataAPI.getCurrentSeason();
        if (currentSeason) {
          const seasons = [currentSeason];
          await this.setCachedData('matches', cacheKey, seasons);
          return seasons;
        }
      } catch (error) {
        console.error('Error fetching seasons from API:', error);
      }
    }
    
    return [];
  }

  // Get matches by season
  public async getMatchesBySeason(seasonId: string): Promise<Match[]> {
    // For now, just return all matches since we only have current season
    return this.getMatches();
  }

  // Set data source preference
  public setDataSource(source: 'api'): void {
    // Currently only API source is supported
    console.log(`Data source set to: ${source}`);
  }

  // Refresh data source availability (useful after API key is set)
  public async refreshDataSources(): Promise<void> {
    await this.checkDataSources();
  }

  // Get prediction accuracy for a season
  public async getPredictionAccuracy(seasonId: string): Promise<{ total: number; correct: number; accuracy: number; }> {
    // TODO: Implement prediction tracking and accuracy calculation
    // For now, return a placeholder value
    return {
      total: 100,
      correct: 65,
      accuracy: 0.65
    };
  }

  // Cache management utilities
  public async clearCache(): Promise<void> {
    if (!this.cacheDb) return;
    
    const storeNames = ['matches', 'standings', 'teamStats'];
    const transaction = this.cacheDb.transaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
    
    console.log('Cache cleared');
  }
  
  public setCacheTimeout(minutes: number): void {
    this.cacheTimeout = minutes * 60 * 1000;
  }
  
  public disableCache(): void {
    this.useCache = false;
  }
  
  public enableCache(): void {
    this.useCache = true;
  }
}

// Export singleton instance
export const dataService = new DataService();