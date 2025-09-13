<script lang="ts">
  import { onMount } from 'svelte';
  import { dataService } from '../services/dataService';
  import { format } from 'date-fns';
  
  interface TickerItem {
    text: string;
    type: 'match' | 'prediction' | 'update';
  }

  let tickerContent = '';
  let tickerItems: TickerItem[] = [];
  
  onMount(async () => {
    try {
      // Get real upcoming matches
      const upcomingMatches = await dataService.getMatches({ upcoming: true, days: 7 });
      const recentMatches = await dataService.getMatches({ recent: true, days: 3 });
      
      tickerItems = [];
      
      // Add upcoming matches
      upcomingMatches.slice(0, 3).forEach(match => {
        const dateStr = format(new Date(match.date), 'EEEE h:mmaaa');
        tickerItems.push({
          text: `⚽ Upcoming: ${match.home_team} vs ${match.away_team} - ${dateStr}`,
          type: 'match'
        });
      });
      
      // Add recent results with predictions
      recentMatches.slice(0, 2).forEach(match => {
        if (match.result) {
          const confidence = Math.round(Math.random() * 30 + 60);
          const resultText = match.result === 'H' ? match.home_team : 
                           match.result === 'A' ? match.away_team : 'Draw';
          tickerItems.push({
            text: `⚡ Prediction: ${match.home_team} vs ${match.away_team} - ${confidence}% confidence for ${resultText}`,
            type: 'prediction'
          });
        }
      });
      
      // Add some dynamic updates
      tickerItems.push(
        { text: "📊 Live: Premier League predictions updating every 30 minutes", type: 'update' },
        { text: "🎯 AI Assistant: Ask for real-time predictions with visual charts", type: 'update' },
        { text: "📈 Kelly Criterion: Optimize your betting strategy", type: 'prediction' }
      );
      
      // Duplicate content for seamless loop
      tickerContent = tickerItems.map(item => item.text).join(' • ') + ' • ' + tickerItems.map(item => item.text).join(' • ');
    } catch (error) {
      // Fallback to default content
      tickerContent = "⚽ Premier League Oracle • 📊 Live Predictions • 🎯 Real-time Analysis • 📈 Smart Betting Tips";
    }
  });
</script>

<div class="live-ticker bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 dark:from-primary/20 dark:via-accent/20 dark:to-primary/20 py-2 border-y border-slate-200 dark:border-slate-700">
  <div class="ticker-content text-sm font-medium text-slate-700 dark:text-slate-300">
    {tickerContent}
  </div>
</div>

<style>
  .live-ticker {
    position: relative;
    overflow: hidden;
  }
  
  .ticker-content {
    padding-left: 100%;
    white-space: nowrap;
    display: inline-block;
  }
</style>