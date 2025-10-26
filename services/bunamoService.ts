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
  // Flavor compatibility matrix with synonyms
  private static flavorCompatibility: Record<string, string[]> = {
    // Coffee flavors -> Compatible pastry flavors (with synonyms)
    'chocolate': ['vanilla', 'caramel', 'nuts', 'cinnamon', 'cocoa', 'nutty', 'almond', 'hazelnut', 'walnut'],
    'cocoa': ['chocolate', 'vanilla', 'caramel', 'nuts', 'nutty', 'almond'],
    'vanilla': ['chocolate', 'caramel', 'cream', 'honey', 'almond', 'cocoa', 'creamy'],
    'caramel': ['chocolate', 'vanilla', 'nuts', 'honey', 'toffee', 'nutty', 'almond'],
    'nuts': ['chocolate', 'vanilla', 'honey', 'almond', 'walnut', 'nutty', 'cocoa', 'hazelnut'],
    'nutty': ['chocolate', 'cocoa', 'nuts', 'almond', 'walnut', 'hazelnut', 'vanilla'],
    'cinnamon': ['chocolate', 'vanilla', 'apple', 'pumpkin', 'spice', 'cocoa'],
    'citrus': ['lemon', 'orange', 'berry', 'cream', 'honey', 'creamy', 'floral'],
    'lemon': ['citrus', 'berry', 'cream', 'honey', 'floral', 'orange'],
    'orange': ['citrus', 'berry', 'cream', 'honey', 'lemon', 'floral'],
    'berry': ['chocolate', 'vanilla', 'cream', 'citrus', 'honey', 'creamy', 'jam'],
    'jam': ['berry', 'vanilla', 'chocolate', 'cream', 'citrus'],
    'floral': ['honey', 'vanilla', 'cream', 'lemon', 'almond', 'citrus'],
    'spice': ['chocolate', 'vanilla', 'cinnamon', 'nuts', 'honey', 'cocoa'],
    'smoky': ['chocolate', 'nuts', 'caramel', 'vanilla', 'spice', 'cocoa'],
    'earthy': ['nuts', 'chocolate', 'honey', 'vanilla', 'spice', 'nutty'],
    'fruity': ['cream', 'vanilla', 'honey', 'citrus', 'berry', 'creamy', 'jam'],
    'creamy': ['vanilla', 'chocolate', 'honey', 'nuts', 'caramel', 'cocoa', 'cream'],
    'honey': ['vanilla', 'cream', 'nuts', 'citrus', 'floral', 'creamy', 'almond'],
    'almond': ['vanilla', 'chocolate', 'honey', 'nuts', 'cream', 'nutty', 'cocoa'],
    'hazelnut': ['chocolate', 'cocoa', 'vanilla', 'nutty', 'nuts'],
    'walnut': ['chocolate', 'nuts', 'honey', 'nutty', 'cocoa'],
    'apple': ['cinnamon', 'caramel', 'spice', 'nuts', 'honey'],
    'pumpkin': ['cinnamon', 'spice', 'caramel', 'honey', 'nuts']
  };

  // Origin affinity matrix
  private static originCompatibility: Record<string, string[]> = {
    'brazil': ['chocolate', 'nuts', 'nutty', 'caramel', 'cocoa', 'almond'],
    'colombia': ['nuts', 'caramel', 'chocolate', 'citrus', 'berry'],
    'ethiopia': ['citrus', 'berry', 'floral', 'lemon', 'orange', 'jam'],
    'kenya': ['citrus', 'berry', 'floral', 'lemon', 'orange', 'jam'],
    'guatemala': ['chocolate', 'nuts', 'citrus', 'berry', 'honey'],
    'costa rica': ['nuts', 'caramel', 'chocolate', 'citrus', 'citrus'],
    'honduras': ['nuts', 'chocolate', 'caramel', 'citrus'],
    'peru': ['nuts', 'chocolate', 'berry', 'caramel'],
    'tanzania': ['citrus', 'berry', 'floral', 'lemon'],
    'rwanda': ['berry', 'citrus', 'floral', 'lemon'],
    'sumatra': ['earthy', 'nuts', 'chocolate', 'cocoa'],
    'java': ['earthy', 'nuts', 'chocolate', 'cocoa'],
    'mexico': ['nuts', 'chocolate', 'citrus', 'berry']
  };

  // Texture compatibility matrix
  private static textureCompatibility: Record<string, string[]> = {
    'light': ['flaky', 'airy', 'delicate', 'crispy', 'light'],
    'medium': ['flaky', 'creamy', 'moist', 'tender', 'balanced'],
    'full': ['dense', 'rich', 'chewy', 'creamy', 'substantial'],
    'heavy': ['dense', 'rich', 'chewy', 'creamy', 'substantial']
  };

  // Seasonal factors
  private static seasonalFactors: Record<string, { multiplier: number; description: string }> = {
    'fall': { multiplier: 1.05, description: 'Autumn boost for seasonal pairings' },
    'autumn': { multiplier: 1.05, description: 'Autumn boost for seasonal pairings' },
    'winter': { multiplier: 1.0, description: 'Winter pairings' },
    'spring': { multiplier: 1.0, description: 'Spring pairings' },
    'summer': { multiplier: 0.95, description: 'Summer pairings' }
  };

  // Popularity boost factors
  private static popularityFactors: Record<number, { multiplier: number; description: string }> = {
    0.9: { multiplier: 1.05, description: 'Highly popular combination' },
    0.8: { multiplier: 1.04, description: 'Very popular combination' },
    0.7: { multiplier: 1.03, description: 'Popular combination' },
    0.6: { multiplier: 1.02, description: 'Moderately popular' },
    0.5: { multiplier: 1.01, description: 'Average popularity' },
    0.4: { multiplier: 1.0, description: 'Less popular' },
    0.3: { multiplier: 0.99, description: 'Unpopular combination' }
  };

  static calculateBunamoScore(
    coffee: { 
      flavor_notes?: string; 
      season_hint?: string; 
      popularity_hint: number;
      origin?: string;
      acidity?: number;
      roast_type?: string;
    },
    pastry: { 
      flavor_tags?: string; 
      texture_tags?: string; 
      popularity_hint: number;
      sweetness?: number;
      richness?: number;
    }
  ): BunamoScore {
    // Parse flavor profiles
    const coffeeFlavors = BunamoScoringModel.parseFlavors(coffee.flavor_notes || '');
    const pastryFlavors = BunamoScoringModel.parseFlavors(pastry.flavor_tags || '');
    const pastryTextures = BunamoScoringModel.parseTextures(pastry.texture_tags || '');

    // Calculate individual scores using NEW formula
    // 45% FlavorMatch, 20% OriginAffinity, 20% AcidityBalance, 10% RoastTextureHarmony, 5% Popularity
    const flavorScore = BunamoScoringModel.calculateFlavorScore(coffeeFlavors, pastryFlavors);
    const originScore = BunamoScoringModel.calculateOriginAffinity(coffee.origin || '', pastryFlavors);
    const acidityScore = BunamoScoringModel.calculateAcidityBalance(coffee.acidity, pastry.sweetness, pastry.richness);
    const roastTextureScore = BunamoScoringModel.calculateRoastTextureHarmony(coffee.roast_type, pastryTextures);
    const popularityScore = BunamoScoringModel.calculatePopularityScore(coffee.popularity_hint, pastry.popularity_hint);

    // Apply seasonal boost if applicable (max 1.0)
    let seasonalMultiplier = BunamoScoringModel.calculateSeasonalBoost(coffee.season_hint);
    
    // Calculate overall score with NEW weighted formula
    const rawOverall = (
      flavorScore * 0.45 +
      originScore * 0.20 +
      acidityScore * 0.20 +
      roastTextureScore * 0.10 +
      popularityScore * 0.05
    ) * seasonalMultiplier;

    // Clamp between 0 and 1
    const overall = Math.min(Math.max(rawOverall, 0), 1);

    // Legacy scores for backward compatibility
    const textureScore = roastTextureScore;
    const seasonalScore = seasonalMultiplier;
    const balanceScore = BunamoScoringModel.calculateBalanceScore(flavorScore, textureScore);
    const complexityScore = BunamoScoringModel.calculateComplexityScore(coffeeFlavors, pastryFlavors);

    // Generate explanation
    const explanation = BunamoScoringModel.generateExplanation({
      flavorScore,
      originScore,
      acidityScore,
      roastTextureScore,
      popularityScore,
      seasonalMultiplier,
      coffeeFlavors,
      pastryFlavors,
      pastryTextures,
      coffeeOrigin: coffee.origin
    });

    return {
      overall,
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

  private static calculateOriginAffinity(origin: string, pastryFlavors: string[]): number {
    if (!origin || pastryFlavors.length === 0) return 0.5;

    const originLower = origin.toLowerCase().trim();
    const expectedFlavors = BunamoScoringModel.originCompatibility[originLower];
    
    if (!expectedFlavors) return 0.5; // Unknown origin, neutral score

    // Count matches
    let matches = 0;
    for (const flavor of pastryFlavors) {
      if (expectedFlavors.includes(flavor)) {
        matches++;
      }
    }

    // Return score based on match ratio
    return Math.min(matches / Math.max(expectedFlavors.length, 1), 1);
  }

  private static calculateAcidityBalance(coffeeAcidity?: number, pastrySweetness?: number, pastryRichness?: number): number {
    // Default values if not provided
    const acidity = coffeeAcidity || 3;
    const sweetness = pastrySweetness || 3;
    const richness = pastryRichness || 3;

    // High acidity (4-5) pairs well with high sweetness (4-5) and creamy textures
    if (acidity >= 4) {
      if (sweetness >= 4 && richness >= 3) return 1.0;
      if (sweetness >= 3 && richness >= 3) return 0.8;
      if (sweetness >= 2) return 0.6;
      return 0.4;
    }
    
    // Medium acidity (2-3) is flexible
    if (acidity === 3) {
      return 0.9; // Always good
    }
    
    // Low acidity (1-2) pairs well with buttery/laminated/rich pastries
    if (acidity <= 2) {
      if (richness >= 4) return 1.0;
      if (richness >= 3) return 0.8;
      if (richness >= 2) return 0.6;
      return 0.4;
    }

    return 0.7; // Default neutral score
  }

  private static calculateRoastTextureHarmony(roastType?: string, pastryTextures: string[]): number {
    if (!roastType || pastryTextures.length === 0) return 0.5;

    const roast = roastType.toLowerCase();

    // Dark/Espresso roasts pair well with dense/fudgy/buttery textures
    if (roast.includes('dark') || roast.includes('espresso')) {
      const compatibleTextures = ['dense', 'rich', 'chewy', 'creamy', 'substantial', 'buttery', 'fudgy', 'laminated'];
      let matches = 0;
      for (const texture of pastryTextures) {
        if (compatibleTextures.includes(texture)) matches++;
      }
      return matches > 0 ? Math.min(matches / pastryTextures.length, 1) : 0.3;
    }

    // Light/Filter roasts pair well with flaky/airy/fruity textures
    if (roast.includes('light') || roast.includes('filter')) {
      const compatibleTextures = ['flaky', 'airy', 'delicate', 'light', 'crispy', 'fruity'];
      let matches = 0;
      for (const texture of pastryTextures) {
        if (compatibleTextures.includes(texture)) matches++;
      }
      return matches > 0 ? Math.min(matches / pastryTextures.length, 1) : 0.3;
    }

    // Medium roasts are flexible
    return 0.7;
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

  private static calculateSeasonalBoost(seasonHint?: string): number {
    if (!seasonHint) return 1.0;
    const season = seasonHint.toLowerCase();
    return BunamoScoringModel.seasonalFactors[season]?.multiplier || 1.0;
  }

  private static calculatePopularityScore(coffeePopularity: number, pastryPopularity: number): number {
    const avgPopularity = (coffeePopularity + pastryPopularity) / 2;
    const rounded = Math.round(avgPopularity * 10) / 10;
    const factor = BunamoScoringModel.popularityFactors[rounded];
    
    // Return normalized score (0-1 range)
    return (factor?.multiplier || 1.0) * 0.5 + 0.5;
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

    if (factors.originScore > 0.7) {
      explanations.push(`Strong origin affinity with ${factors.coffeeOrigin || 'regional'} flavors`);
    } else if (factors.originScore > 0.5) {
      explanations.push('Moderate origin compatibility');
    }

    if (factors.acidityScore > 0.8) {
      explanations.push('Perfect acidity-sweetness balance');
    } else if (factors.acidityScore > 0.6) {
      explanations.push('Good acidity complement');
    }

    if (factors.roastTextureScore > 0.8) {
      explanations.push('Excellent roast-texture harmony');
    } else if (factors.roastTextureScore > 0.6) {
      explanations.push('Good texture pairing');
    }

    if (factors.popularityScore > 0.9) {
      explanations.push('Highly popular combination');
    } else if (factors.popularityScore < 0.5) {
      explanations.push('Less popular but potentially unique');
    }

    if (factors.seasonalMultiplier > 1.0) {
      explanations.push('Seasonally enhanced pairing');
    }

    return explanations.join('. ') + '.';
  }
}

// Export the main function for easy use
export const calculateBunamoScore = BunamoScoringModel.calculateBunamoScore;
