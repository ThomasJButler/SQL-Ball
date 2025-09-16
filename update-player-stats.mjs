#!/usr/bin/env node

/**
 * Update Player Stats in Supabase
 * Aggregates goals and assists from player match stats
 * Updates the player_stats table with actual performance data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Track player stats aggregation
const playerStatsMap = new Map();

async function processGameweekStats(season, gameweek) {
  const gwPath = path.join('FPL-Elo-Insights/data', season, 'playermatchstats', `GW${gameweek}`, 'playermatchstats.csv');

  if (!fs.existsSync(gwPath)) {
    console.log(`⚠️  No data for GW${gameweek}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const stats = [];

    fs.createReadStream(gwPath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.player_id && row.minutes_played > 0) {
          const playerId = parseInt(row.player_id);

          // Initialize player stats if not exists
          if (!playerStatsMap.has(playerId)) {
            playerStatsMap.set(playerId, {
              player_id: playerId,
              season: season,
              total_goals: 0,
              total_assists: 0,
              total_xg: 0,
              total_xa: 0,
              total_minutes: 0,
              matches_played: 0,
              penalties_scored: 0,
              penalties_missed: 0,
              yellow_cards: 0,
              red_cards: 0,
              saves: 0,
              goals_conceded: 0,
              clean_sheets: 0
            });
          }

          const playerStats = playerStatsMap.get(playerId);

          // Update aggregated stats
          playerStats.total_goals += parseInt(row.goals || 0);
          playerStats.total_assists += parseInt(row.assists || 0);
          playerStats.total_xg += parseFloat(row.xg || 0);
          playerStats.total_xa += parseFloat(row.xa || 0);
          playerStats.total_minutes += parseInt(row.minutes_played || 0);
          playerStats.matches_played += 1;
          playerStats.penalties_scored += parseInt(row.penalties_scored || 0);
          playerStats.penalties_missed += parseInt(row.penalties_missed || 0);

          // For goalkeepers
          if (row.saves) {
            playerStats.saves += parseInt(row.saves || 0);
            playerStats.goals_conceded += parseInt(row.goals_conceded || 0);
            if (parseInt(row.goals_conceded || 0) === 0 && parseInt(row.minutes_played) >= 60) {
              playerStats.clean_sheets += 1;
            }
          }

          // For outfield players - clean sheet if team conceded 0
          if (!row.saves && parseInt(row.team_goals_conceded || 0) === 0 && parseInt(row.minutes_played) >= 60) {
            playerStats.clean_sheets += 1;
          }

          // Store individual match stat
          stats.push({
            player_id: playerId,
            gameweek: gameweek,
            season: season,
            minutes_played: parseInt(row.minutes_played || 0),
            goals: parseInt(row.goals || 0),
            assists: parseInt(row.assists || 0),
            xg: parseFloat(row.xg || 0),
            xa: parseFloat(row.xa || 0),
            shots: parseInt(row.total_shots || 0),
            shots_on_target: parseInt(row.shots_on_target || 0),
            chances_created: parseInt(row.chances_created || 0),
            tackles: parseInt(row.tackles_won || 0),
            interceptions: parseInt(row.interceptions || 0),
            saves: parseInt(row.saves || 0) || null,
            goals_conceded: parseInt(row.goals_conceded || 0) || null,
            penalties_scored: parseInt(row.penalties_scored || 0),
            penalties_missed: parseInt(row.penalties_missed || 0)
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Processed GW${gameweek}: ${stats.length} player performances`);
        resolve(stats);
      })
      .on('error', reject);
  });
}

async function updateSupabasePlayerStats() {
  console.log('\n📊 Updating Supabase player_stats table...\n');

  // Convert map to array
  const aggregatedStats = Array.from(playerStatsMap.values());

  // Filter for players with actual game time
  const activeStats = aggregatedStats.filter(p => p.matches_played > 0);

  console.log(`📈 Updating stats for ${activeStats.length} active players`);

  // Update in batches
  const batchSize = 50;
  for (let i = 0; i < activeStats.length; i += batchSize) {
    const batch = activeStats.slice(i, i + batchSize);

    // Update player_stats table
    for (const stats of batch) {
      try {
        // Check if record exists
        const { data: existing } = await supabase
          .from('player_stats')
          .select('id')
          .eq('player_id', stats.player_id)
          .eq('season', stats.season)
          .single();

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('player_stats')
            .update({
              goals_scored: stats.total_goals,
              assists: stats.total_assists,
              expected_goals: stats.total_xg,
              expected_assists: stats.total_xa,
              minutes: stats.total_minutes,
              clean_sheets: stats.clean_sheets,
              saves: stats.saves > 0 ? stats.saves : null,
              goals_conceded: stats.goals_conceded > 0 ? stats.goals_conceded : null,
              penalties_scored: stats.penalties_scored,
              penalties_missed: stats.penalties_missed
            })
            .eq('id', existing.id);

          if (error) {
            console.error(`❌ Error updating player ${stats.player_id}:`, error.message);
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('player_stats')
            .insert({
              player_id: stats.player_id,
              season: stats.season,
              gameweek: 38, // End of season
              goals_scored: stats.total_goals,
              assists: stats.total_assists,
              expected_goals: stats.total_xg,
              expected_assists: stats.total_xa,
              minutes: stats.total_minutes,
              clean_sheets: stats.clean_sheets,
              saves: stats.saves > 0 ? stats.saves : null,
              goals_conceded: stats.goals_conceded > 0 ? stats.goals_conceded : null,
              penalties_scored: stats.penalties_scored,
              penalties_missed: stats.penalties_missed,
              total_points: 0 // Will be calculated separately
            });

          if (error) {
            console.error(`❌ Error inserting player ${stats.player_id}:`, error.message);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing player ${stats.player_id}:`, err.message);
      }
    }

    console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activeStats.length / batchSize)}`);
  }

  // Show top scorers
  const topScorers = activeStats
    .sort((a, b) => b.total_goals - a.total_goals)
    .slice(0, 10);

  console.log('\n🏆 Top 10 Scorers:');
  topScorers.forEach((p, i) => {
    console.log(`${i + 1}. Player ${p.player_id}: ${p.total_goals} goals, ${p.total_assists} assists`);
  });
}

async function main() {
  console.log('🚀 Starting Player Stats Update\n');
  console.log('=' .repeat(50));

  const seasons = ['2024-2025', '2025-2026'];

  for (const season of seasons) {
    console.log(`\n📅 Processing ${season} season...`);
    playerStatsMap.clear(); // Reset for each season

    // Process all gameweeks
    for (let gw = 1; gw <= 38; gw++) {
      await processGameweekStats(season, gw);
    }

    // Update Supabase with aggregated stats
    if (playerStatsMap.size > 0) {
      await updateSupabasePlayerStats();
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Player stats update complete!');
  console.log('\nYou can now query:');
  console.log('- Top scorers with actual goals');
  console.log('- Players with most assists');
  console.log('- xG vs actual goals analysis');
  console.log('- Clean sheets by position');
}

// Run the update
main().catch(console.error);