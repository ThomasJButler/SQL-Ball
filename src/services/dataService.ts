/**
 * @author Tom Butler
 * @date 2025-10-21
 * @description Primary data service managing football match data. Provides caching layer via IndexedDB,
 *              handles Supabase queries for matches/standings/team stats, and manages data source
 *              availability checking. Cache timeout configurable per use case.
 */

import type { Match, Season, TeamStats, Standing, TeamForm } from '../types';
import { supabase } from '../lib/supabase';

interface DataSource {
  type: 'database';
  available: boolean;
}

class DataService {
  private dataSource: DataSource = { type: 'database', available: true };
  private useCache: boolean = true;
  private cacheDb: IDBDatabase | null = null;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes default

  constructor() {
    this.initializeIndexedDB();
  }
  
  private async initializeIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      console.warn('IndexedDB not available');
      return;
    }

    const request = indexedDB.open('SQLBall', 1);
    
    request.onerror = () => {
      console.error('Failed to open IndexedDB');
    };
    
    request.onsuccess = () => {
      this.cacheDb = request.result;
      console.log('IndexedDB initialised');
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

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
  
  private async checkDataSource(): Promise<void> {
    try {
      // Test Supabase connection
      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .limit(1);

      this.dataSource.available = !error;

      if (this.dataSource.available) {
        console.log('Supabase database is available');
      } else {
        console.error('Supabase database connection failed:', error);
      }
    } catch (error) {
      console.error('Error checking database availability:', error);
      this.dataSource.available = false;
    }
  }
  
  // Public API for checking data source status
  public getDataSourceStatus() {
    return {
      database: this.dataSource.available,
      usingDatabase: true
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
  
  // Main data fetching methods - Supabase only
  public async getCurrentSeason(): Promise<Season | null> {
    const cacheKey = 'current_season';

    // Try cache first
    const cached = await this.getCachedData<Season>('teamStats', cacheKey);
    if (cached) return cached;

    // Query Supabase
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_current', true)
        .single();

      if (error) throw error;
      if (data) {
        await this.setCachedData('teamStats', cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching season from database:', error);
    }

    return null;
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

    // Query Supabase
    try {
      const { getRecentMatches } = await import('../lib/supabase');
      const matches = await getRecentMatches(recent ? 50 : 100);

      // Filter based on options
      const now = new Date();
      let filteredMatches = matches;

      if (upcoming) {
        filteredMatches = matches.filter(m => new Date(m.match_date) > now).slice(0, 20);
      } else if (recent) {
        filteredMatches = matches.filter(m => new Date(m.match_date) <= now).slice(0, 20);
      }

      if (filteredMatches.length > 0) {
        await this.setCachedData('matches', cacheKey, filteredMatches);
      }

      return filteredMatches;
    } catch (error) {
      console.error('Error fetching matches from Supabase:', error);
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

    // Query Supabase
    try {
      const { data, error } = await supabase
        .from('standings')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        await this.setCachedData('standings', cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching standings from database:', error);
    }

    return [];
  }
  
  public async getTeamStats(teamName: string): Promise<TeamStats | null> {
    const cacheKey = `team_stats_${teamName}`;

    // Try cache first
    const cached = await this.getCachedData<TeamStats>('teamStats', cacheKey);
    if (cached) return cached;

    // Query Supabase
    try {
      const { data, error } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_name', teamName)
        .single();

      if (error) throw error;
      if (data) {
        await this.setCachedData('teamStats', cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching team stats from database:', error);
    }

    return null;
  }
  
  public async getTeamForm(teamName: string, matches?: Match[]): Promise<TeamForm[]> {
    const cacheKey = `team_form_${teamName}_${matches?.length || 5}`;

    // Try cache first
    const cached = await this.getCachedData<TeamForm[]>('teamStats', cacheKey);
    if (cached) return cached;

    // Calculate form from recent matches
    try {
      const recentMatches = matches || await this.getMatches({ recent: true });
      const teamMatches = recentMatches.filter(m =>
        m.home_team === teamName || m.away_team === teamName
      ).slice(0, 5);

      const form: TeamForm[] = teamMatches.map(match => {
        const isHome = match.home_team === teamName;
        const homeScore = match.home_score ?? 0;
        const awayScore = match.away_score ?? 0;
        const result = isHome
          ? (homeScore > awayScore ? 'W' : homeScore < awayScore ? 'L' : 'D')
          : (awayScore > homeScore ? 'W' : awayScore < homeScore ? 'L' : 'D');

        return {
          match,
          result,
          goalsScored: isHome ? homeScore : awayScore,
          goalsConceded: isHome ? awayScore : homeScore
        };
      });

      if (form.length > 0) {
        await this.setCachedData('teamStats', cacheKey, form);
      }

      return form;
    } catch (error) {
      console.error('Error calculating team form:', error);
      return [];
    }
  }

  public async getAllSeasons(): Promise<Season[]> {
    const cacheKey = 'all_seasons';

    // Try cache first
    const cached = await this.getCachedData<Season[]>('matches', cacheKey);
    if (cached) return cached;

    // Query Supabase
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        await this.setCachedData('matches', cacheKey, data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching seasons from database:', error);
    }

    return [];
  }

  public async getHeadToHead(homeTeam: string, awayTeam: string): Promise<{
    homeWins: number;
    draws: number;
    awayWins: number;
    matches: Match[];
  }> {
    const cacheKey = `h2h_${homeTeam}_${awayTeam}`;

    // Try cache first
    const cached = await this.getCachedData<any>('matches', cacheKey);
    if (cached) return cached;

    // Query Supabase
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team.eq.${homeTeam},away_team.eq.${homeTeam}`)
        .or(`home_team.eq.${awayTeam},away_team.eq.${awayTeam}`)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;

      let homeWins = 0;
      let draws = 0;
      let awayWins = 0;

      const h2hMatches = matches?.filter(match =>
        (match.home_team === homeTeam && match.away_team === awayTeam) ||
        (match.home_team === awayTeam && match.away_team === homeTeam)
      ) || [];

      h2hMatches.forEach(match => {
        if (match.home_team === homeTeam) {
          if (match.result === 'H') homeWins++;
          else if (match.result === 'D') draws++;
          else if (match.result === 'A') awayWins++;
        } else {
          if (match.result === 'H') awayWins++;
          else if (match.result === 'D') draws++;
          else if (match.result === 'A') homeWins++;
        }
      });

      const result = {
        homeWins,
        draws,
        awayWins,
        matches: h2hMatches
      };

      await this.setCachedData('matches', cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching head to head from database:', error);
      return {
        homeWins: 0,
        draws: 0,
        awayWins: 0,
        matches: []
      };
    }
  }

  public async getMatchesBySeason(seasonId: string): Promise<Match[]> {
    // For now, just return all matches since we only have current season
    return this.getMatches();
  }

  // Data source is always Supabase now
  public setDataSource(source: 'database'): void {
    console.log('Data source is always Supabase database');
  }

  public getStatus(): {
    primarySource: DataSource;
    cacheEnabled: boolean;
  } {
    return {
      primarySource: this.dataSource,
      cacheEnabled: this.useCache
    };
  }

  // Refresh data source availability
  public async refreshDataSources(): Promise<void> {
    await this.checkDataSource();
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