// Bunamo Advanced Scoring Model for Coffee-Pastry Pairings
// Based on flavor profiles, texture compatibility, and seasonal factors

export interface BunamoScore {
  overall: number;
  flavor: number;
  texture: number;
  seasonal: number;
  popularity: number;
  balance: number;
  complexity: number;
  factors: {
    flavorMatch: number;
    textureComplement: number;
    seasonalAlignment: number;
    popularityBoost: number;
    balanceScore: number;
    complexityScore: number;
  };
  explanation: string;
}

export interface FlavorProfile {
  primary: string[];
  secondary: string[];
  intensity: number; // 1-10
  acidity: number; // 1-10
  sweetness: number; // 1-10
  bitterness: number; // 1-10
  body: number; // 1-10
}

export interface TextureProfile {
  primary: string[];
  secondary: string[];
  density: number; // 1-10
  moisture: number; // 1-10
  temperature: 'hot' | 'warm' | 'room' | 'cold';
  crunchiness: number; // 1-10
}

export class BunamoScoringModel {
  // Flavor compatibility matrix
  private static flavorCompatibility: Record<string, string[]> = {
    // Coffee flavors -> Compatible pastry flavors
    'chocolate': ['vanilla', 'caramel', 'nuts', 'cinnamon', 'cocoa'],
    'vanilla': ['chocolate', 'caramel', 'cream', 'honey', 'almond'],
    'caramel': ['chocolate', 'vanilla', 'nuts', 'honey', 'toffee'],
    'nuts': ['chocolate', 'vanilla', 'honey', 'almond', 'walnut'],
    'cinnamon': ['chocolate', 'vanilla', 'apple', 'pumpkin', 'spice'],
    'citrus': ['lemon', 'orange', 'berry', 'cream', 'honey'],
    'berry': ['chocolate', 'vanilla', 'cream', 'citrus', 'honey'],
    'floral': ['honey', 'vanilla', 'cream', 'lemon', 'almond'],
    'spice': ['chocolate', 'vanilla', 'cinnamon', 'nuts', 'honey'],
    'smoky': ['chocolate', 'nuts', 'caramel', 'vanilla', 'spice'],
    'earthy': ['nuts', 'chocolate', 'honey', 'vanilla', 'spice'],
    'fruity': ['cream', 'vanilla', 'honey', 'citrus', 'berry'],
    'creamy': ['vanilla', 'chocolate', 'honey', 'nuts', 'caramel'],
    'honey': ['vanilla', 'cream', 'nuts', 'citrus', 'floral'],
    'almond': ['vanilla', 'chocolate', 'honey', 'nuts', 'cream']
  };

  // Texture compatibility matrix
  private static textureCompatibility: Record<string, string[]> = {
    // Coffee body -> Compatible pastry textures
    'light': ['flaky', 'airy', 'delicate', 'crispy', 'light'],
    'medium': ['flaky', 'creamy', 'moist', 'tender', 'balanced'],
    'full': ['dense', 'rich', 'chewy', 'creamy', 'substantial'],
    'heavy': ['dense', 'rich', 'chewy', 'creamy', 'substantial']
  };

  // Seasonal factors
  private static seasonalFactors: Record<string, { multiplier: number; description: string }> = {
    'spring': { multiplier: 1.1, description: 'Fresh, light pairings preferred' },
    'summer': { multiplier: 0.9, description: 'Cool, refreshing pairings preferred' },
    'autumn': { multiplier: 1.2, description: 'Warm, spiced pairings preferred' },
    'winter': { multiplier: 1.3, description: 'Rich, hearty pairings preferred' },
    'all-year': { multiplier: 1.0, description: 'Balanced pairings work well' }
  };

  // Popularity boost factors
  private static popularityFactors: Record<number, { multiplier: number; description: string }> = {
    0.9: { multiplier: 1.3, description: 'Highly popular combination' },
    0.8: { multiplier: 1.2, description: 'Very popular combination' },
    0.7: { multiplier: 1.1, description: 'Popular combination' },
    0.6: { multiplier: 1.0, description: 'Moderately popular' },
    0.5: { multiplier: 0.9, description: 'Less popular' },
    0.4: { multiplier: 0.8, description: 'Unpopular combination' }
  };

  static calculateBunamoScore(
    coffee: { flavor_notes?: string; season_hint?: string; popularity_hint: number },
    pastry: { flavor_tags?: string; texture_tags?: string; popularity_hint: number }
  ): BunamoScore {
    // Parse flavor profiles
    const coffeeFlavors = BunamoScoringModel.parseFlavors(coffee.flavor_notes || '');
    const pastryFlavors = BunamoScoringModel.parseFlavors(pastry.flavor_tags || '');
    const pastryTextures = BunamoScoringModel.parseTextures(pastry.texture_tags || '');

    // Calculate individual scores
    const flavorScore = BunamoScoringModel.calculateFlavorScore(coffeeFlavors, pastryFlavors);
    const textureScore = BunamoScoringModel.calculateTextureScore(coffee, pastryTextures);
    const seasonalScore = BunamoScoringModel.calculateSeasonalScore(coffee.season_hint);
    const popularityScore = BunamoScoringModel.calculatePopularityScore(coffee.popularity_hint, pastry.popularity_hint);
    const balanceScore = BunamoScoringModel.calculateBalanceScore(flavorScore, textureScore);
    const complexityScore = BunamoScoringModel.calculateComplexityScore(coffeeFlavors, pastryFlavors);

    // Calculate overall score with weighted factors
    const overall = (
      flavorScore * 0.25 +
      textureScore * 0.20 +
      seasonalScore * 0.15 +
      popularityScore * 0.20 +
      balanceScore * 0.10 +
      complexityScore * 0.10
    );

    // Generate explanation
    const explanation = BunamoScoringModel.generateExplanation({
      flavorScore,
      textureScore,
      seasonalScore,
      popularityScore,
      balanceScore,
      complexityScore,
      coffeeFlavors,
      pastryFlavors,
      pastryTextures
    });

    return {
      overall: Math.min(Math.max(overall, 0), 1),
      flavor: flavorScore,
      texture: textureScore,
      seasonal: seasonalScore,
      popularity: popularityScore,
      balance: balanceScore,
      complexity: complexityScore,
      factors: {
        flavorMatch: flavorScore,
        textureComplement: textureScore,
        seasonalAlignment: seasonalScore,
        popularityBoost: popularityScore,
        balanceScore: balanceScore,
        complexityScore: complexityScore
      },
      explanation
    };
  }

  private static parseFlavors(flavorString: string): string[] {
    if (!flavorString) return [];
    return flavorString
      .toLowerCase()
      .split(/[,;|&]/)
      .map(flavor => flavor.trim())
      .filter(flavor => flavor.length > 0);
  }

  private static parseTextures(textureString: string): string[] {
    if (!textureString) return [];
    return textureString
      .toLowerCase()
      .split(/[,;|&]/)
      .map(texture => texture.trim())
      .filter(texture => texture.length > 0);
  }

  private static calculateFlavorScore(coffeeFlavors: string[], pastryFlavors: string[]): number {
    if (coffeeFlavors.length === 0 || pastryFlavors.length === 0) return 0.5;

    let totalScore = 0;
    let matches = 0;

    for (const coffeeFlavor of coffeeFlavors) {
      const compatibleFlavors = BunamoScoringModel.flavorCompatibility[coffeeFlavor] || [];
      for (const pastryFlavor of pastryFlavors) {
        if (compatibleFlavors.includes(pastryFlavor)) {
          totalScore += 1;
          matches++;
        } else if (coffeeFlavor === pastryFlavor) {
          totalScore += 0.8;
          matches++;
        }
      }
    }

    return matches > 0 ? Math.min(totalScore / Math.max(coffeeFlavors.length, pastryFlavors.length), 1) : 0.3;
  }

  private static calculateTextureScore(coffee: any, pastryTextures: string[]): number {
    if (pastryTextures.length === 0) return 0.5;

    // Determine coffee body from flavor notes
    const coffeeBody = BunamoScoringModel.determineCoffeeBody(coffee.flavor_notes || '');
    const compatibleTextures = BunamoScoringModel.textureCompatibility[coffeeBody] || [];

    let totalScore = 0;
    let matches = 0;

    for (const texture of pastryTextures) {
      if (compatibleTextures.includes(texture)) {
        totalScore += 1;
        matches++;
      }
    }

    return matches > 0 ? Math.min(totalScore / pastryTextures.length, 1) : 0.4;
  }

  private static determineCoffeeBody(flavorNotes: string): string {
    const notes = flavorNotes.toLowerCase();
    if (notes.includes('light') || notes.includes('delicate') || notes.includes('bright')) return 'light';
    if (notes.includes('full') || notes.includes('rich') || notes.includes('heavy')) return 'full';
    if (notes.includes('medium') || notes.includes('balanced')) return 'medium';
    return 'medium'; // default
  }

  private static calculateSeasonalScore(seasonHint?: string): number {
    if (!seasonHint) return 1.0;
    const season = seasonHint.toLowerCase();
    return BunamoScoringModel.seasonalFactors[season]?.multiplier || 1.0;
  }

  private static calculatePopularityScore(coffeePopularity: number, pastryPopularity: number): number {
    const avgPopularity = (coffeePopularity + pastryPopularity) / 2;
    const rounded = Math.round(avgPopularity * 10) / 10;
    return BunamoScoringModel.popularityFactors[rounded]?.multiplier || 1.0;
  }

  private static calculateBalanceScore(flavorScore: number, textureScore: number): number {
    // Balance is better when both scores are similar and high
    const difference = Math.abs(flavorScore - textureScore);
    const average = (flavorScore + textureScore) / 2;
    return average * (1 - difference);
  }

  private static calculateComplexityScore(coffeeFlavors: string[], pastryFlavors: string[]): number {
    // Complexity is good when there are multiple flavor notes but they work together
    const totalFlavors = coffeeFlavors.length + pastryFlavors.length;
    if (totalFlavors <= 2) return 0.6; // Too simple
    if (totalFlavors >= 8) return 0.8; // Good complexity
    return 0.7; // Moderate complexity
  }

  private static generateExplanation(factors: any): string {
    const explanations: string[] = [];

    if (factors.flavorScore > 0.8) {
      explanations.push('Excellent flavor harmony between coffee and pastry');
    } else if (factors.flavorScore > 0.6) {
      explanations.push('Good flavor compatibility');
    } else {
      explanations.push('Flavor profiles may not complement each other well');
    }

    if (factors.textureScore > 0.8) {
      explanations.push('Perfect texture balance');
    } else if (factors.textureScore > 0.6) {
      explanations.push('Good texture contrast');
    } else {
      explanations.push('Texture pairing could be improved');
    }

    if (factors.seasonalScore > 1.1) {
      explanations.push('Seasonally perfect timing');
    } else if (factors.seasonalScore < 0.9) {
      explanations.push('Consider seasonal preferences');
    }

    if (factors.popularityScore > 1.1) {
      explanations.push('Highly popular combination');
    } else if (factors.popularityScore < 0.9) {
      explanations.push('Less popular but potentially unique');
    }

    if (factors.balanceScore > 0.8) {
      explanations.push('Well-balanced pairing');
    } else {
      explanations.push('Balance could be improved');
    }

    return explanations.join('. ') + '.';
  }
}

// Export the main function for easy use
export const calculateBunamoScore = BunamoScoringModel.calculateBunamoScore;
