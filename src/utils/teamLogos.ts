/**
 * Team logo generator utility
 * Creates SVG data URIs for team badges
 */

// Premier League team colors (2025/26 season)
const teamColors: Record<string, string> = {
  'Arsenal': '#EF0107',
  'Aston Villa': '#670E36',
  'Bournemouth': '#DA020E',
  'Brentford': '#FF0000',
  'Brighton': '#0057B8',
  'Burnley': '#6C1D45',
  'Chelsea': '#034694',
  'Crystal Palace': '#1B458F',
  'Everton': '#003399',
  'Fulham': '#000000',
  'Ipswich': '#0000FF',
  'Ipswich Town': '#0000FF',
  'Leeds': '#FFCD00',
  'Leeds United': '#FFCD00',
  'Leicester': '#003090',
  'Leicester City': '#003090',
  'Liverpool': '#C8102E',
  'Luton': '#F78F1E',
  'Luton Town': '#F78F1E',
  'Man City': '#6CABDD',
  'Manchester City': '#6CABDD',
  'Man United': '#DA020E',
  'Manchester United': '#DA020E',
  'Newcastle': '#241F20',
  'Newcastle United': '#241F20',
  'Nottingham Forest': '#DD0000',
  'Nott\'m Forest': '#DD0000',
  'Sheffield United': '#EE2737',
  'Sheffield Utd': '#EE2737',
  'Southampton': '#D71920',
  'Tottenham': '#132257',
  'Spurs': '#132257',
  'West Ham': '#7A263A',
  'West Ham United': '#7A263A',
  'Wolves': '#FDB913',
  'Wolverhampton': '#FDB913',
  // Championship teams that might be promoted
  'Norwich': '#FFF200',
  'Norwich City': '#FFF200',
  'Watford': '#FBEE23',
  'West Brom': '#122F67',
  'West Bromwich Albion': '#122F67'
};

/**
 * Generate a team logo as an SVG data URI
 * @param teamName - The name of the team
 * @param size - Size of the logo in pixels (default: 40)
 * @returns SVG data URI string
 */
export function getTeamLogo(teamName: string, size: number = 40): string {
  const initials = getTeamInitials(teamName);
  const color = teamColors[teamName] || '#666666';
  const textColor = isLightColor(color) ? '#000000' : '#FFFFFF';
  
  // Create SVG as data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="20" fill="${color}"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${textColor}" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold">
      ${initials}
    </text>
  </svg>`;
  
  // Encode the SVG for use in data URI
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Get team initials (max 3 characters)
 * @param teamName - The name of the team
 * @returns Team initials
 */
function getTeamInitials(teamName: string): string {
  // Handle special cases
  const specialCases: Record<string, string> = {
    'Manchester United': 'MUN',
    'Man United': 'MUN',
    'Manchester City': 'MCI',
    'Man City': 'MCI',
    'Nottingham Forest': 'NFO',
    'Nott\'m Forest': 'NFO',
    'Sheffield United': 'SHU',
    'Sheffield Utd': 'SHU',
    'West Ham': 'WHU',
    'West Ham United': 'WHU',
    'West Brom': 'WBA',
    'West Bromwich Albion': 'WBA',
    'Crystal Palace': 'CRY',
    'Aston Villa': 'AVL',
    'Newcastle United': 'NEW',
    'Newcastle': 'NEW',
    'Leicester City': 'LEI',
    'Leicester': 'LEI',
    'Leeds United': 'LEE',
    'Leeds': 'LEE',
    'Norwich City': 'NOR',
    'Norwich': 'NOR',
    'Ipswich Town': 'IPS',
    'Ipswich': 'IPS',
    'Luton Town': 'LUT',
    'Luton': 'LUT'
  };
  
  if (specialCases[teamName]) {
    return specialCases[teamName];
  }
  
  // Default: first 3 letters
  return teamName.substring(0, 3).toUpperCase();
}

/**
 * Check if a color is light (for text contrast)
 * @param color - Hex color code
 * @returns true if color is light
 */
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Get team color
 * @param teamName - The name of the team
 * @returns Hex color code
 */
export function getTeamColor(teamName: string): string {
  return teamColors[teamName] || '#666666';
}