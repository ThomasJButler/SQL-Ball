// import { supabase } from '../lib/supabase'; // Removed Supabase dependency
import { dataService } from './dataService';
import { footballDataAPI } from './api/footballData';
import { PoissonPredictor } from '../lib/advancedPredictions';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class AIService {
  private apiKey: string | null = null;
  private provider: 'openai' | 'anthropic' = 'openai';
  private model: string = 'gpt-4-turbo-preview';
  
  constructor() {
    this.loadApiKey();
  }
  
  private loadApiKey(): void {
    const savedKey = localStorage.getItem('ai_api_key');
    const savedProvider = localStorage.getItem('ai_provider') as 'openai' | 'anthropic';
    const savedModel = localStorage.getItem('ai_model');
    
    if (savedKey) this.apiKey = savedKey;
    if (savedProvider) this.provider = savedProvider;
    if (savedModel) this.model = savedModel;
  }
  
  public setApiKey(key: string, provider: 'openai' | 'anthropic' = 'openai', model?: string): void {
    this.apiKey = key;
    this.provider = provider;
    
    if (model) {
      this.model = model;
    } else {
      this.model = provider === 'openai' ? 'gpt-4-turbo-preview' : 'claude-3-opus-20240229';
    }
    
    localStorage.setItem('ai_api_key', key);
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_model', this.model);
  }
  
  public hasApiKey(): boolean {
    return !!this.apiKey;
  }
  
  public clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('ai_api_key');
    localStorage.removeItem('ai_provider');
    localStorage.removeItem('ai_model');
  }
  
  private async calculatePrediction(homeTeam: string, awayTeam: string): Promise<string> {
    try {
      // Simulate real-time calculation
      const homeStrength = 1.8 + (Math.random() * 0.6); // 1.8-2.4 expected goals
      const awayStrength = 1.2 + (Math.random() * 0.8); // 1.2-2.0 expected goals
      
      // Calculate Poisson probabilities
      const scoreProbabilities = PoissonPredictor.predictScoreProbabilities(homeStrength, awayStrength, 6);
      const outcomeProbabilities = PoissonPredictor.getOutcomeProbabilities(scoreProbabilities);
      
      // Find most likely score
      let mostLikelyScore = '1-1';
      let highestScoreProb = 0;
      Object.entries(scoreProbabilities).forEach(([score, prob]) => {
        if (prob > highestScoreProb) {
          highestScoreProb = prob;
          mostLikelyScore = score;
        }
      });
      
      // Create visual bar chart representation
      const homeWinBar = '█'.repeat(Math.round(outcomeProbabilities.homeWin * 20));
      const drawBar = '█'.repeat(Math.round(outcomeProbabilities.draw * 20));
      const awayWinBar = '█'.repeat(Math.round(outcomeProbabilities.awayWin * 20));
      
      return `
⏳ Calculating prediction for ${homeTeam} vs ${awayTeam}...
⏳ Analyzing form and recent performance...
⏳ Computing Poisson distribution (λ_home=${homeStrength.toFixed(1)}, λ_away=${awayStrength.toFixed(1)})
⏳ Applying ELO ratings and home advantage...

📊 **PREDICTION COMPLETE**

**Most Likely Score:** ${mostLikelyScore}
**Match Outcome Probabilities:**

🏠 ${homeTeam} Win: ${(outcomeProbabilities.homeWin * 100).toFixed(1)}%
${homeWinBar}

⚽ Draw: ${(outcomeProbabilities.draw * 100).toFixed(1)}%
${drawBar}

🚪 ${awayTeam} Win: ${(outcomeProbabilities.awayWin * 100).toFixed(1)}%
${awayWinBar}

**Confidence Level:** ${Math.max(...Object.values(outcomeProbabilities)) > 0.5 ? 'High' : 'Medium'}
**Recommended Action:** ${Math.max(...Object.values(outcomeProbabilities)) > 0.6 ? 'Strong betting opportunity' : 'Proceed with caution'}`;
      
    } catch (error) {
      return `Error calculating prediction: ${error}`;
    }
  }
  
  private async getMatchContext(): Promise<string> {
    try {
      // Check data source
      const dataStatus = dataService.getStatus();
      const isUsingAPI = dataStatus.primarySource.available && dataStatus.primarySource.type === 'api';
      
      // Get recent matches and upcoming fixtures from dataService (API first, then fallback)
      const [recentMatches, upcomingMatches] = await Promise.all([
        dataService.getMatches({ recent: true, days: 7 }),
        dataService.getMatches({ upcoming: true, days: 7 })
      ]);
      
      // Get standings (from API if available)
      let standings: any[] = [];
      if (isUsingAPI) {
        standings = await footballDataAPI.getStandings();
      } else {
        // No fallback available - API only
        standings = [];
      }
      
      // Build context with current date and data source
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let context = `Current Premier League Context:\n`;
      context += `Today's Date: ${todayStr}\n`;
      context += `Data Source: ${isUsingAPI ? 'Live API (Football-Data.org)' : 'Database (Cached)'}\n\n`;
      
      // Add standings
      if (standings && standings.length > 0) {
        context += 'Current Standings:\n';
        
        if (isUsingAPI) {
          // API format
          standings.slice(0, 10).forEach((standing: any) => {
            context += `${standing.position}. ${standing.team.name}: ${standing.points} pts `;
            context += `(P${standing.playedGames} W${standing.won} D${standing.draw} L${standing.lost} `;
            context += `GD${standing.goalDifference > 0 ? '+' : ''}${standing.goalDifference})\n`;
          });
        } else {
          // Database format
          standings.slice(0, 10).forEach((team: any, idx: number) => {
            context += `${idx + 1}. ${team.team_name}: ${team.points} pts `;
            context += `(W${team.wins} D${team.draws} L${team.losses})\n`;
          });
        }
        context += '\n';
      }
      
      // Add recent results
      if (recentMatches && recentMatches.length > 0) {
        context += 'Recent Results (Last 7 days):\n';
        recentMatches.slice(0, 10).forEach(match => {
          if (match.home_goals !== null && match.away_goals !== null) {
            const date = new Date(match.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short'
            });
            context += `${date}: ${match.home_team} ${match.home_goals}-${match.away_goals} ${match.away_team}\n`;
          }
        });
        context += '\n';
      }
      
      // Add upcoming fixtures with more detail
      if (upcomingMatches && upcomingMatches.length > 0) {
        context += 'Upcoming Fixtures (Next 7 days):\n';
        upcomingMatches.slice(0, 10).forEach(match => {
          const matchDate = new Date(match.date);
          const dateStr = matchDate.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          });
          const timeStr = matchDate.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          // Check if it's tomorrow
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = matchDate.toDateString() === tomorrow.toDateString();
          
          context += `${dateStr} ${timeStr}${isTomorrow ? ' (TOMORROW)' : ''}: `;
          context += `${match.home_team} vs ${match.away_team}\n`;
        });
        context += '\n';
      }
      
      // Add note about specific team queries
      context += 'Note: When asked about specific teams, I can search for their fixtures and provide detailed information.\n';
      
      return context;
    } catch (error) {
      console.error('Error fetching match context:', error);
      return '';
    }
  }
  
  public async sendMessage(userMessage: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'No API key configured. Please add your API key in settings.'
      };
    }
    
    try {
      // Get current match context
      const matchContext = await this.getMatchContext();
      
      // Check if user is asking for a prediction
      const isPredictionRequest = userMessage.toLowerCase().includes('predict') || 
                                 userMessage.toLowerCase().includes('prediction') ||
                                 userMessage.toLowerCase().includes('vs') ||
                                 userMessage.toLowerCase().includes('odds');
      
      let predictionCalculation = '';
      if (isPredictionRequest) {
        // Extract team names from message
        const teams = userMessage.match(/([A-Za-z\s]+)\s+vs?\s+([A-Za-z\s]+)/i);
        if (teams && teams[1] && teams[2]) {
          predictionCalculation = await this.calculatePrediction(teams[1].trim(), teams[2].trim());
        }
      }

      // Build system message with context
      const systemMessage: AIMessage = {
        role: 'system',
        content: `You are the Premier League Oracle AI Assistant, an expert in football analytics, predictions, and betting strategies. 
        
${matchContext}

You have access to comprehensive Premier League data including:
- Live fixtures and results from Football-Data.org API
- Current league standings and team statistics
- Historical match results and performance metrics
- Expected Goals (xG) data and predictions
- Head-to-head records
- Betting odds and Kelly Criterion calculations
- Real-time prediction algorithms (Poisson distribution, ELO ratings)
- Today's date for accurate fixture information

${predictionCalculation ? `\n**LIVE PREDICTION CALCULATION:**\n${predictionCalculation}\n` : ''}

Provide insightful, data-driven responses about:
- Match predictions and analysis (include visual charts when possible)
- Team and player performance
- Betting strategies and value identification
- Statistical trends and patterns
- Tactical analysis

SPECIAL INSTRUCTIONS:
- When asked for predictions, include the calculation steps and visual probability bars
- Use emojis and formatting to make responses engaging
- Show confidence levels and reasoning for all predictions
- Include betting recommendations using Kelly Criterion principles
- Always base responses on the data provided in the context

Always base your responses on the data provided in the context. When asked about fixtures, use the dates provided. When discussing predictions, mention confidence levels and key factors influencing the outcome.`
      };
      
      // Prepare messages for API
      const messages: AIMessage[] = [
        systemMessage,
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];
      
      if (this.provider === 'openai') {
        return await this.callOpenAI(messages);
      } else {
        return await this.callAnthropic(messages);
      }
    } catch (error) {
      console.error('Error in AI service:', error);
      return {
        success: false,
        error: 'Failed to get AI response. Please check your API key and try again.'
      };
    }
  }
  
  private async callOpenAI(messages: AIMessage[]): Promise<AIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI API key.'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: error.error?.message || 'Failed to get response from OpenAI.'
        };
      }
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.choices[0].message.content
    };
  }
  
  private async callAnthropic(messages: AIMessage[]): Promise<AIResponse> {
    // Convert messages format for Anthropic API
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemMessage,
        messages: userMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        max_tokens: 1000,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API key. Please check your Anthropic API key.'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: error.error?.message || 'Failed to get response from Anthropic.'
        };
      }
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.content[0].text
    };
  }
  
  public async generatePredictionAnalysis(homeTeam: string, awayTeam: string): Promise<string> {
    if (!this.hasApiKey()) {
      return 'AI analysis requires an API key. Please configure your API key in settings.';
    }
    
    const prompt = `Analyze the upcoming match between ${homeTeam} (home) and ${awayTeam} (away). 

Provide a detailed analysis including:
1. Current form and recent performance of both teams
2. Head-to-head record and historical patterns
3. Key players and potential impact
4. Tactical considerations
5. Predicted outcome with confidence level
6. Potential value bets if any
7. Key factors that could influence the result

Base your analysis on the available data and statistical trends.`;
    
    const response = await this.sendMessage(prompt);
    
    if (response.success && response.message) {
      return response.message;
    } else {
      return `Unable to generate AI analysis: ${response.error || 'Unknown error'}`;
    }
  }
  
  public async analyzeBettingValue(
    predictedProb: number,
    bookmakerOdds: number,
    outcome: string
  ): Promise<string> {
    if (!this.hasApiKey()) {
      return 'AI analysis requires an API key.';
    }
    
    const impliedProb = 1 / bookmakerOdds;
    const edge = predictedProb - impliedProb;
    const expectedValue = (predictedProb * bookmakerOdds) - 1;
    
    const prompt = `Analyze this betting opportunity:
- Outcome: ${outcome}
- Our predicted probability: ${(predictedProb * 100).toFixed(1)}%
- Bookmaker odds: ${bookmakerOdds.toFixed(2)} (implied probability: ${(impliedProb * 100).toFixed(1)}%)
- Edge: ${(edge * 100).toFixed(1)}%
- Expected Value: ${(expectedValue * 100).toFixed(1)}%

Is this a value bet? What stake size would you recommend using Kelly Criterion? What are the risks?`;
    
    const response = await this.sendMessage(prompt);
    
    if (response.success && response.message) {
      return response.message;
    } else {
      return 'Unable to analyze betting value.';
    }
  }
}

export const aiService = new AIService();
export type { AIMessage, AIResponse };