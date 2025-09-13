# Premier League Oracle: Implementation Plan

This document outlines the steps needed to complete the Premier League Oracle project, which aims to be the ultimate prediction tool for the English Premier League.

## Tasks

### Completed Features
- ✅ Fixed sidebar toggle functionality on desktop
- ✅ Reduced ticker animation speed for better readability
- ✅ Fixed TypeScript errors across components
- ✅ Consolidated dark mode logic
- ✅ Added Season Stats component with unique insights
- ✅ Enhanced AI Assistant with free/pro tiers

## AI Assistant Feature

### Overview
The AI Assistant provides intelligent, context-aware responses about Premier League data, predictions, and insights. It features a free tier with smart database queries and a pro tier for users who bring their own API keys.

### Implementation Details

#### Free Mode
- Uses Supabase queries to provide intelligent responses
- Can answer questions about:
  - Best performing teams
  - Top scorers and goal statistics  
  - Clean sheets and defensive records
  - Upcoming matches
  - Fun facts and historical data
- Limited to database-driven responses
- No external API calls required

#### Pro Mode  
- Users can add their own API keys (OpenAI, Anthropic, etc.)
- Keys stored locally in browser storage
- Never sent to backend servers
- Enables advanced AI-powered analysis:
  - Complex match predictions
  - Personalised betting strategies
  - Deep tactical analysis
  - Custom insights based on user preferences

#### UI/UX Features
- Chat-style interface with typing indicators
- Message timestamps and sender identification
- Smooth animations and transitions
- Modal for API key management
- Responsive design for all screen sizes

### Security Considerations
- API keys stored only in localStorage
- No server-side storage of sensitive data
- Clear messaging about data privacy
- Optional feature - users can use app without it

## Future Enhancements

See the detailed roadmap in `future-enhancements.md` for a comprehensive breakdown of planned features.

### Advanced AI Integration
Connect to a real LLM API (like OpenAI or Claude) for more sophisticated football analysis. This would allow the assistant to provide more detailed insights and answer complex questions about team performance, player statistics, and match predictions.

### Pattern Detection System
Develop a dedicated module for identifying unusual patterns in the data that traditional analysis might miss. This could include things like:
- Teams that perform unusually well after certain weather conditions
- Referees that correlate with higher/lower scoring games
- Time-based patterns (e.g., teams that score disproportionately in the final 15 minutes)

### Multiple Prediction Models
Implement several prediction models using different statistical approaches:
- Traditional statistical models
- Machine learning models (Random Forest, XGBoost)
- Deep learning models for sequence prediction
- Ensemble methods combining multiple approaches
Track each model's performance over time to identify strengths and weaknesses.

### Social Features
Add social components to allow users to:
- Share predictions on social media
- Create private prediction leagues with friends
- Comment on upcoming matches and discuss strategies
- Follow top predictors and see their analysis

### Mobile Application
Convert the project to a progressive web app or develop native mobile applications to provide:
- Push notifications for prediction alerts
- Offline access to historical data
- Touch-optimized interfaces for quick predictions
- Widget support for viewing upcoming match predictions

### Betting Integration and Simulation
Develop a simulated betting feature that allows users to:
- Test prediction strategies without real money
- Track performance over time with virtual currency
- Compare betting strategies against historical odds
- Identify value bets where our model differs significantly from bookmakers

### Visualization Enhancements
Expand visualization capabilities with:
- Interactive head-to-head comparison graphs
- Heat maps of team performance by pitch position
- Timeline views showing team form over the season
- Expected goals (xG) timeline visualizations for matches