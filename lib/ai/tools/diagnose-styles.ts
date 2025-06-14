import { getStyles } from '../api/get-styles';
import type { MediaOption } from '@/lib/types/media-settings';

export interface StyleDiagnosticResult {
  success: boolean;
  totalStyles: number;
  sampleStyles: string[];
  styleMapping: Record<string, string>;
  recommendations: string[];
  error?: string;
}

export async function diagnoseStyles(): Promise<StyleDiagnosticResult> {
  try {
    console.log('🔍 Starting style diagnostic...');
    
    const response = await getStyles();
    
    if ("error" in response) {
      return {
        success: false,
        totalStyles: 0,
        sampleStyles: [],
        styleMapping: {},
        recommendations: [
          'API request failed. Check authentication token.',
          'Verify API endpoint is accessible.',
          'Check network connectivity.'
        ],
        error: response.error
      };
    }

    const styles: MediaOption[] = response.items.map(style => ({
      id: style.name,
      label: style.title ?? style.name,
      description: style.title ?? style.name,
    }));

    const sampleStyles = styles.slice(0, 10).map(s => `${s.id} -> "${s.label}"`);
    
    // Analyze style patterns
    const styleMapping: Record<string, string> = {};
    const commonTerms = ['realistic', 'cinematic', 'anime', 'fantasy', 'steampunk', 'cartoon'];
    
    for (const term of commonTerms) {
      const matchingStyle = styles.find(s => 
        s.id.toLowerCase().includes(term) || 
        s.label.toLowerCase().includes(term)
      );
      if (matchingStyle) {
        styleMapping[term] = matchingStyle.id;
      }
    }

    const recommendations = [
      `Found ${styles.length} styles from API`,
      'Common style patterns:',
      ...Object.entries(styleMapping).map(([term, id]) => `  "${term}" -> ${id}`),
      '',
      'Recommendations:',
      '1. Use exact style IDs when possible',
      '2. Implement fallback to available styles',
      '3. Add validation before API calls'
    ];

    console.log('🔍 ✅ Style diagnostic completed successfully');
    
    return {
      success: true,
      totalStyles: styles.length,
      sampleStyles,
      styleMapping,
      recommendations,
    };

  } catch (error: any) {
    console.error('🔍 ❌ Style diagnostic failed:', error);
    
    return {
      success: false,
      totalStyles: 0,
      sampleStyles: [],
      styleMapping: {},
      recommendations: [
        'Diagnostic failed. Check:',
        '1. API endpoint availability',
        '2. Authentication token validity', 
        '3. Network configuration',
        '4. CORS settings if running in browser'
      ],
      error: error.message
    };
  }
}

// Function to test style matching
export function testStyleMatching(userInput: string, availableStyles: MediaOption[]): {
  found: boolean;
  matchedStyle?: MediaOption;
  suggestions: string[];
} {
  // This would use the same logic as findStyle function
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Try exact matches first
  const exactMatch = availableStyles.find(s => 
    s.id.toLowerCase() === normalizedInput ||
    s.label.toLowerCase() === normalizedInput
  );
  
  if (exactMatch) {
    return {
      found: true,
      matchedStyle: exactMatch,
      suggestions: [`Exact match found: ${exactMatch.id}`]
    };
  }

  // Try partial matches
  const partialMatches = availableStyles.filter(s => 
    s.id.toLowerCase().includes(normalizedInput) ||
    s.label.toLowerCase().includes(normalizedInput) ||
    normalizedInput.includes(s.id.toLowerCase()) ||
    normalizedInput.includes(s.label.toLowerCase())
  );

  if (partialMatches.length > 0) {
    return {
      found: true,
      matchedStyle: partialMatches[0],
      suggestions: partialMatches.slice(0, 3).map(s => `Partial match: ${s.id} (${s.label})`)
    };
  }

  // Generate suggestions based on similar styles
  const suggestions = availableStyles
    .slice(0, 5)
    .map(s => `Available: ${s.id} (${s.label})`);

  return {
    found: false,
    suggestions: [
      `No match found for "${userInput}"`,
      'Available options:',
      ...suggestions
    ]
  };
} 