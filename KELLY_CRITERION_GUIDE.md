# The Kelly Criterion - Complete Guide

## 📚 What is the Kelly Criterion?

The Kelly Criterion is a mathematical formula used to determine the optimal size of a series of bets. Developed by John L. Kelly Jr. in 1956, it maximises the logarithmic growth of your bankroll over time whilst minimising the risk of ruin.

## 🧮 The Formula

```
f* = (bp - q) / b

Where:
f* = Fraction of bankroll to wager
b = Net odds received on the bet (decimal odds - 1)
p = Probability of winning
q = Probability of losing (1 - p)
```

### Real Example:
```
Arsenal to beat Fulham:
- Bookmaker odds: 1.80 (decimal)
- Your assessed probability: 65% (0.65)

Calculation:
b = 1.80 - 1 = 0.80
p = 0.65
q = 0.35

f* = (0.80 × 0.65 - 0.35) / 0.80
f* = (0.52 - 0.35) / 0.80
f* = 0.17 / 0.80
f* = 0.2125 (21.25% of bankroll)
```

## 🎯 Why Use Kelly Criterion?

### Advantages:
1. **Maximises Growth**: Mathematically proven to maximise long-term bankroll growth
2. **Prevents Ruin**: Never suggests betting entire bankroll
3. **Scales with Edge**: Bigger edge = bigger bet
4. **Self-Adjusting**: Reduces stakes after losses, increases after wins

### Disadvantages:
1. **High Volatility**: Can suggest large bets (20-30% of bankroll)
2. **Requires Accurate Probabilities**: Garbage in, garbage out
3. **Emotionally Difficult**: Large swings can be stressful
4. **Assumes Infinite Betting**: Real-world constraints apply

## 📊 Fractional Kelly Strategy

Full Kelly is often too aggressive. Most professionals use fractional Kelly:

### Kelly Fractions:
```
Full Kelly (100%): Maximum growth, maximum volatility
Half Kelly (50%): 75% of growth, 50% of volatility ✅ RECOMMENDED
Quarter Kelly (25%): 50% of growth, 25% of volatility (beginners)
```

### Comparison Example:
```
Scenario: 60% win probability, 2.00 odds, £1000 bankroll
Full Kelly: Bet £200 (20%)
Half Kelly: Bet £100 (10%) ✅
Quarter Kelly: Bet £50 (5%)
```

## 🎲 Practical Examples

### Example 1: Strong Favourite
```
Man City vs Norwich (relegation candidate)
Your Probability: 85%
Bookmaker Odds: 1.25
Kelly Says: 8% of bankroll

On £1000: Bet £80
Potential profit: £20
Risk/Reward: Low risk, low reward
```

### Example 2: Value Underdog
```
Leicester vs Chelsea
Your Probability: 35% (Leicester win)
Bookmaker Odds: 4.50
Kelly Says: 19.4% of bankroll

On £1000: Bet £194 (use half Kelly = £97)
Potential profit: £339.50
Risk/Reward: High risk, high reward
```

### Example 3: No Bet Scenario
```
Everton vs Wolves
Your Probability: 40%
Bookmaker Odds: 2.30
Kelly Says: -4.3% (NEGATIVE!)

Action: DO NOT BET ❌
Reason: No edge, bookmaker has advantage
```

## 📈 Edge Calculation

Edge is the key to profitable betting:

```
Edge = (Your Probability × Decimal Odds) - 1

Positive edge = Value bet ✅
Negative edge = Bad bet ❌
```

### Edge Examples:
```
High Edge (15%+): Strong bet
Medium Edge (5-15%): Good bet
Low Edge (2-5%): Marginal bet
No Edge (<2%): Skip
```

## 💰 Bankroll Management with Kelly

### Starting Bankroll Rules:
1. **Never bet money you can't afford to lose**
2. **Start with 50-100 betting units**
3. **One unit = comfortable loss amount**

### Example Bankroll Progression:
```
Month 1: £1000 starting
- Week 1: +£120 → £1120
- Week 2: -£80 → £1040
- Week 3: +£150 → £1190
- Week 4: +£95 → £1285
Month 1 Result: +28.5% 🎉
```

## 🔢 Multiple Bets (Simultaneous Kelly)

When betting on multiple matches:

```
Step 1: Calculate Kelly for each bet
Step 2: Scale down if total > 25% of bankroll
Step 3: Prioritise highest edge bets
```

### Multi-Bet Example:
```
Three Saturday matches:
1. Arsenal: 8% Kelly, 12% edge
2. Liverpool: 6% Kelly, 8% edge
3. Man City: 10% Kelly, 15% edge

Total: 24% of bankroll
Action: Bet all three at full amounts ✅
```

## 📉 Handling Losing Streaks

Kelly naturally adjusts for losses:

```
Starting: £1000, betting 10% Kelly
After 3 losses: £729 remaining
Next bet: £72.90 (still 10%, but smaller amount)

This prevents going broke!
```

### Losing Streak Probabilities:
```
With 55% win rate:
- 3 losses in a row: 9.1% chance
- 5 losses in a row: 1.8% chance
- 10 losses in a row: 0.03% chance

Prepare mentally for 5-loss streaks!
```

## 🎯 Advanced Kelly Concepts

### 1. **Kelly with Uncertain Probabilities**
If unsure about probability, use conservative estimate:
```
Think it's 60-65%? Use 60%
Think it's 55-65%? Use 55%
Very uncertain? Don't bet
```

### 2. **Correlated Bets**
Reduce Kelly for correlated outcomes:
```
Both Manchester teams to win:
- Normal Kelly: 8% each
- Correlated adjustment: 5% each
(If one loses, other might too)
```

### 3. **Maximum Bet Constraints**
Bookmaker limits affect Kelly:
```
Kelly says bet £500
Bookmaker max: £200
Solution: Bet £200, find another bookmaker
```

## 📊 Performance Tracking

### Key Metrics:
```
Closing Line Value (CLV): Your odds vs closing odds
Yield: Profit / Total Staked
ROI: (Ending - Starting) / Starting
Sharpe Ratio: Risk-adjusted returns
Max Drawdown: Largest peak-to-trough decline
```

### Good Performance Benchmarks:
```
Win Rate: 52-56%
Yield: 3-8%
Monthly ROI: 5-15%
Sharpe Ratio: >1.0
Max Drawdown: <30%
```

## ⚠️ Common Kelly Mistakes

### 1. **Overestimating Edge**
```
Wrong: "I think Arsenal wins 70%" (gut feeling)
Right: "Model says 62%, form suggests 64%, average 63%"
```

### 2. **Not Using Fractional Kelly**
```
Wrong: Betting 25% of bankroll regularly
Right: Using half Kelly (12.5% max)
```

### 3. **Chasing Losses**
```
Wrong: Doubling stakes after losses
Right: Maintaining consistent Kelly percentage
```

### 4. **Ignoring Correlation**
```
Wrong: Full Kelly on Man Utd + Ronaldo to score
Right: Reduced stakes on correlated bets
```

## 🏆 Real-World Application

### Professional Approach:
```
Monday: Research and model building
Tuesday: Identify value bets for weekend
Wednesday: Early betting (best odds)
Thursday: Final research, adjust stakes
Friday: Last-minute team news check
Weekend: Track results
Sunday: Review and analyse
```

### Bet Sizing Framework:
```
Edge > 15%: Up to 5% of bankroll
Edge 10-15%: Up to 3% of bankroll
Edge 5-10%: Up to 2% of bankroll
Edge 2-5%: Up to 1% of bankroll
Edge < 2%: No bet
```

## 📱 Using Kelly in The Oracle App

### Step-by-Step:
1. Go to **Kelly Calculator**
2. Input match details:
   ```
   Match: Arsenal vs Fulham
   Your Probability: 65%
   Bookmaker Odds: 1.80
   Bankroll: £1000
   ```
3. Review recommendations:
   ```
   Full Kelly: £212.50 (aggressive)
   Half Kelly: £106.25 (recommended) ✅
   Quarter Kelly: £53.13 (conservative)
   ```
4. Check risk assessment:
   ```
   Expected Value: +17%
   Confidence: HIGH
   Risk Level: MEDIUM
   ```
5. Place bet with bookmaker

## 🎓 Learning Path

### Beginner (Months 1-3):
- Use Quarter Kelly (25%)
- Paper trade first
- Track everything
- Learn from mistakes

### Intermediate (Months 4-9):
- Move to Half Kelly (50%)
- Develop own probabilities
- Understand correlations
- Build consistent process

### Advanced (Months 10+):
- Adjust Kelly based on confidence
- Multi-market strategies
- Arbitrage integration
- Portfolio approach

## 📈 Expected Journey

### Realistic Expectations:
```
Month 1-3: -5% to +10% (learning phase)
Month 4-6: +5% to +15% (improvement)
Month 7-12: +10% to +20% (consistency)
Year 2+: +15% to +30% (mastery)
```

### Variance Reality:
```
Good month: +40%
Average month: +8%
Bad month: -20%
Worst month: -35%

Key: Survive bad months, compound good ones
```

## 🔑 Kelly Success Formula

```
Success = (Accurate Probabilities × Discipline × Time)

Where:
- Accurate Probabilities = Research + Models + Experience
- Discipline = Following Kelly + No Emotional Betting
- Time = Minimum 500+ bets for edge to show
```

## 📚 Essential Kelly Resources

### Books:
- "Fortune's Formula" by William Poundstone
- "The Kelly Capital Growth Investment Criterion" by MacLean
- "Beat the Market" by Ed Thorp

### Online:
- [Kelly Calculator](https://www.sportsbookreview.com/picks/tools/kelly-calculator/)
- [Wikipedia: Kelly Criterion](https://en.wikipedia.org/wiki/Kelly_criterion)
- [Football Trading](https://www.footballtrading.com/)

## ⚠️ Final Warnings

1. **Kelly assumes infinite wealth** - You don't have infinite money
2. **Requires accurate probabilities** - Models can be wrong
3. **High volatility** - 40% drawdowns are possible
4. **Not for everyone** - Requires strong discipline
5. **Gambling addiction is real** - Set hard limits

## 🎯 Quick Reference Card

```
KELLY QUICK CHECKS:
□ Edge > 5%? (If no, don't bet)
□ Confidence > 60%? (If no, reduce stake)
□ Kelly < 10%? (If no, use fractional)
□ Correlation checked? (Reduce if correlated)
□ Within daily limit? (Max 3-5 bets)
□ Tracked in spreadsheet? (Always record)

STAKE SIZING:
Edge 15%+ → Max 5% bankroll
Edge 10-15% → Max 3% bankroll
Edge 5-10% → Max 2% bankroll
Edge 2-5% → Max 1% bankroll
Edge <2% → NO BET

KELLY FRACTIONS:
Aggressive: 75% Kelly
Standard: 50% Kelly ✅
Conservative: 25% Kelly
Beginner: 10% Kelly
```

---

*"The Kelly Criterion is like a compass for betting - it points you in the right direction, but you still need to navigate the journey yourself."*

**Remember: The goal isn't to get rich quick, it's to get rich surely.**