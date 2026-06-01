/**
 * Normalize Indonesian academic title casing to follow proper conventions.
 * Examples: S.PD -> S.Pd, M.PD -> M.Pd, S.AG -> S.Ag, etc.
 * 
 * Adopted from mandaapp normalizeGelar utility.
 */
export function normalizeGelar(str: string): string {
  return str
    // Normalize comma separators to dots (e.g. S,AG -> S.AG, S, PD -> S.PD)
    .replace(/([SM])\s*,\s*(PD\.I|PD|AG|UD|SY|SOS|KOM|SI|HUM|KED|IP|FIL|AP|SS|E|H|T|S)\b/gi, '$1.$2')
    // Normalize optional space after dot (e.g. "S. PD" or "M. PD" -> compact form first)
    .replace(/([SM])\.\s+(PD\.I|PD|AG|SY|UD|SOS|KOM|SI|HUM|KED|IP|FIL|AP|SS|S)\b/gi, '$1.$2')
    // Fix casing for each gelar (compact form, no space)
    .replace(/M\.PD\.I\b/gi, 'M.Pd.I')
    .replace(/S\.PD\.I\b/gi, 'S.Pd.I')
    .replace(/S\.PD\b/gi, 'S.Pd')
    .replace(/M\.PD\b/gi, 'M.Pd')
    .replace(/S\.AG\b/gi, 'S.Ag')
    .replace(/M\.AG\b/gi, 'M.Ag')
    .replace(/S\.SY\b/gi, 'S.Sy')
    .replace(/M\.SY\b/gi, 'M.Sy')
    .replace(/S\.UD\b/gi, 'S.Ud')
    .replace(/M\.UD\b/gi, 'M.Ud')
    .replace(/S\.SOS\b/gi, 'S.Sos')
    .replace(/M\.SOS\b/gi, 'M.Sos')
    .replace(/S\.KOM\b/gi, 'S.Kom')
    .replace(/M\.KOM\b/gi, 'M.Kom')
    .replace(/M\.SI\b/gi, 'M.Si')
    .replace(/S\.SI\b/gi, 'S.Si')
    .replace(/S\.HUM\b/gi, 'S.Hum')
    .replace(/M\.HUM\b/gi, 'M.Hum')
    .replace(/S\.KED\b/gi, 'S.Ked')
    .replace(/S\.IP\b/gi, 'S.IP')
    .replace(/M\.IP\b/gi, 'M.IP')
    .replace(/S\.FIL\b/gi, 'S.Fil')
    .replace(/M\.FIL\b/gi, 'M.Fil')
    .replace(/S\.SS\b/gi, 'S.SS')
    .replace(/S\.S\b/gi, 'S.S')
    .replace(/S\.E\b/gi, 'S.E')
    .replace(/M\.E\b/gi, 'M.E')
    .replace(/S\.H\b/gi, 'S.H')
    .replace(/M\.H\b/gi, 'M.H')
    .replace(/S\.T\b/gi, 'S.T')
    .replace(/M\.T\b/gi, 'M.T')
    .replace(/S\.AP\b/gi, 'S.AP')
    .replace(/M\.AP\b/gi, 'M.AP')
    .replace(/\bLC\b/gi, 'Lc')
    .replace(/\bDRS\b/gi, 'Drs')
    .replace(/\bDRA\b/gi, 'Dra')
    .replace(/\bDR\b/gi, 'Dr');
}

/**
 * Uppercase a name string while preserving academic title casing.
 * CSS `text-transform: uppercase` would break gelar like S.Pd -> S.PD,
 * so we uppercase programmatically but protect gelar patterns.
 * 
 * Example: "Mehram, S.Pd, M.AP" -> "MEHRAM, S.Pd, M.AP"
 */
export function smartUpperCase(str: string): string {
  // First normalize gelar
  const normalized = normalizeGelar(str);

  // Gelar patterns to preserve (with correct casing)
  const gelarPatterns = [
    /S\.Pd\.I\b/g, /M\.Pd\.I\b/g,
    /S\.Pd\b/g, /M\.Pd\b/g,
    /S\.Ag\b/g, /M\.Ag\b/g,
    /S\.Sy\b/g, /M\.Sy\b/g,
    /S\.Ud\b/g, /M\.Ud\b/g,
    /S\.Sos\b/g, /M\.Sos\b/g,
    /S\.Kom\b/g, /M\.Kom\b/g,
    /M\.Si\b/g, /S\.Si\b/g,
    /S\.Hum\b/g, /M\.Hum\b/g,
    /S\.Ked\b/g,
    /S\.IP\b/g, /M\.IP\b/g,
    /S\.AP\b/g, /M\.AP\b/g,
    /S\.Fil\b/g, /M\.Fil\b/g,
    /S\.SS\b/g, /S\.S\b/g,
    /S\.E\b/g, /M\.E\b/g,
    /S\.H\b/g, /M\.H\b/g,
    /S\.T\b/g, /M\.T\b/g,
    /M\.M\b/g,
    /\bLc\b/g, /\bDrs\b/g, /\bDra\b/g, /\bDr\b/g,
  ];

  // Collect gelar positions and their correct casing
  const preserveList: { start: number; end: number; text: string }[] = [];
  for (const pattern of gelarPatterns) {
    let match;
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    while ((match = pattern.exec(normalized)) !== null) {
      preserveList.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }
  }

  // Sort by start position descending to replace from end
  preserveList.sort((a, b) => b.start - a.start);

  // Uppercase the whole string first
  let result = normalized.toUpperCase();

  // Restore gelar casing
  for (const item of preserveList) {
    result = result.substring(0, item.start) + item.text + result.substring(item.end);
  }

  return result;
}
