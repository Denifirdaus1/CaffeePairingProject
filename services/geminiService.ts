import { GoogleGenAI } from '@google/genai';
import type { Coffee, Pastry, PairingResponse } from '../types';
import { calculateBunamoScore } from './bunamoService';

// Get API key from environment with fallback
const getApiKey = () => {
    // Try Vite env first
    if (import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Fallback to process.env for production
    if ((process.env as any)?.VITE_GEMINI_API_KEY) {
        return (process.env as any).VITE_GEMINI_API_KEY;
    }
    return '';
};

const apiKey = getApiKey();

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey });

const generatePairingPrompt = (coffee: Coffee, pastries: Pastry[]): string => `
You are Café Owner Dashboard AI. Your role is to help a café owner find the best coffee and pastry pairings.
You are an expert in flavor science and coffee culture, referencing established standards like the SCA Flavor Wheel. Your persona is concise, operational, and transparent. You never hallucinate.
You must follow these instructions strictly.

CONTEXT:
The café owner has selected the following coffee for pairing:
${JSON.stringify(coffee, null, 2)}

They want to pair it with one of the following available pastries from their inventory:
${JSON.stringify(pastries, null, 2)}

TASK:
1.  **ANALYZE & SCORE:** Analyze the selected coffee and compare it against ALL available pastries. Calculate a pairing score (0 to 1) for each potential pair using the provided formula.
2.  **RANK:** Rank the pastries from highest to lowest score. Limit the final output to the top 3.
3.  **GENERATE BADGES & TAGS:** For each of the top 3 pastries, generate:
    - \`badges\`: An array of 1-3 relevant status tags (e.g., "Core", "Guest/Fall", "New", "Popular").
    - \`flavor_tags_standardized\`: An array of 2-4 standardized flavor tags based on the pastry's \`flavor_tags\`. Use terms from the Specialty Coffee Association (SCA) Flavor Wheel where appropriate (e.g., "Citrus", "Floral", "Nutty", "Cocoa").
4.  **GROUND WITH SEARCH:** For the top 2 ranked pairings, perform a Google Search to find 2 concise supporting facts. You MUST provide the source URLs. If you cannot find high-confidence sources, state that clearly in the \`reasoning.fallback_note\` and return an empty \`facts\` array.
5.  **EXPLAIN & REASON:** For each of the top 3 pairings, provide:
    - \`why_marketing\`: A short, catchy marketing subtitle.
    - \`score_breakdown\`: The numerical result for each component of the scoring formula.
    - \`reasoning\`: A "Why you're seeing this" micro-explanation. Provide a single, explicit sentence for EACH component of the score (flavor, texture, popularity, season).
6.  **ASSEMBLE OUTPUT:** Assemble the final result into a single JSON object that strictly adheres to the OUTPUT CONTRACT.

SCORING FORMULA (use this exactly):
score = (0.4 * flavor_similarity) + (0.3 * texture_balance) + (0.2 * popularity_score) + (0.1 * seasonal_match)
- \`flavor_similarity\` (0-1): Based on semantic similarity between coffee.flavor_notes and pastry.flavor_tags.
- \`texture_balance\` (0-1): Higher scores for complementary textures (creamy ↔ crisp).
- \`popularity_score\` (0-1): Average of the coffee's and pastry's 'popularity_hint'.
- \`seasonal_match\` (0 or 1): Score is 1.0 if coffee.season_hint matches the current season (assume it's Fall/Autumn) or if coffee.is_guest is true. Otherwise, 0.

OUTPUT CONTRACT (Your entire response must be ONLY this JSON object):
{
  "coffee": { "id": "${coffee.id}", "name": "${coffee.name}", "image": "${coffee.image_url}" },
  "pairs": [
    {
      "pastry": { "id": "...", "name": "...", "image": "..." },
      "score": 0.00,
      "score_breakdown": {
          "flavor": 0.0,
          "texture": 0.0,
          "popularity": 0.0,
          "season": 0.0
      },
      "reasoning": {
          "flavor": "One sentence explaining the flavor synergy.",
          "texture": "One sentence explaining the texture contrast or harmony.",
          "popularity": "One sentence explaining why their popularity levels match.",
          "season": "One sentence explaining the seasonal relevance.",
          "fallback_note": "No high-confidence sources found—showing DB-only rationale."
      },
      "why_marketing": "Short, catchy line.",
      "facts": [
        {"summary": "fact 1", "source_url": "https://..."},
        {"summary": "fact 2", "source_url": "https://..."}
      ],
      "badges": ["Core", "Popular"],
      "flavor_tags_standardized": ["Nutty", "Cocoa", "Sweet"],
      "allergen_info": "Contains nuts, gluten."
    }
  ],
  "ui": {
    "layout": "cards",
    "show_downloads": ["pdf"],
    "notes": "Top 3 AI-generated pairings based on your inventory and real-time data."
  }
}

Proceed with your multi-step reasoning to plan, retrieve, score, rank, verify with search, and present the final, clean JSON.
`;


export const generatePairings = async (
  selectedCoffee: Coffee,
  allPastries: Pastry[]
): Promise<PairingResponse> => {
  try {
    // First, calculate Bunamo scores for all pastries
    const bunamoScores = allPastries.map(pastry => ({
      pastry,
      bunamoScore: calculateBunamoScore(selectedCoffee, pastry)
    }));

    // Sort by Bunamo overall score and take top 3
    const topPairings = bunamoScores
      .sort((a, b) => b.bunamoScore.overall - a.bunamoScore.overall)
      .slice(0, 3);

    // Generate AI-enhanced explanations for top pairings
    const enhancedPairings = await Promise.all(
      topPairings.map(async ({ pastry, bunamoScore }) => {
        try {
          const aiPrompt = `
            You are a coffee expert. Provide a brief, marketing-friendly explanation for why this coffee-pastry pairing works well.
            
            Coffee: ${selectedCoffee.name}
            Coffee Notes: ${selectedCoffee.flavor_notes || 'No notes'}
            Pastry: ${pastry.name}
            Pastry Flavors: ${pastry.flavor_tags || 'No tags'}
            Pastry Textures: ${pastry.texture_tags || 'No tags'}
            
            Bunamo Score: ${Math.round(bunamoScore.overall * 100)}%
            Flavor Score: ${Math.round(bunamoScore.flavor * 100)}%
            Texture Score: ${Math.round(bunamoScore.texture * 100)}%
            
            Provide:
            1. A short marketing tagline (max 20 words)
            2. A brief explanation of why this pairing works (max 50 words)
            3. 2-3 flavor tags that describe this combination
            4. Any allergen information if relevant
            
            Format as JSON:
            {
              "marketing_tagline": "...",
              "explanation": "...",
              "flavor_tags": ["tag1", "tag2", "tag3"],
              "allergen_info": "..."
            }
          `;

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: aiPrompt,
            config: {
              thinkingConfig: { thinkingBudget: 8192 }
            }
          });

          let aiData;
          try {
            if (!aiResponse.text) {
              throw new Error('AI response text is undefined');
            }
            let jsonText = aiResponse.text.trim();
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.substring(7, jsonText.length - 3).trim();
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.substring(3, jsonText.length - 3).trim();
            }
            aiData = JSON.parse(jsonText);
          } catch (error) {
            console.warn('AI generation failed, using enhanced fallback:', error);
            
            // Enhanced fallback based on Bunamo scores
            const flavorDesc = bunamoScore.flavor > 0.7 ? "excellent flavor harmony" : 
                              bunamoScore.flavor > 0.5 ? "complementary flavors" : "contrasting flavor notes";
            const textureDesc = bunamoScore.texture > 0.7 ? "perfect texture balance" : 
                               bunamoScore.texture > 0.5 ? "pleasant texture contrast" : "interesting texture pairing";
            
            const coffeeNotes = selectedCoffee.flavor_notes?.split(',').slice(0, 2).join(' and ') || 'rich coffee';
            const pastryFlavors = pastry.flavor_tags?.split(',').slice(0, 2).join(' and ') || pastry.name;
            
            aiData = {
              marketing_tagline: `${selectedCoffee.name} meets ${pastry.name} - ${flavorDesc}`,
              explanation: `This pairing brings together ${coffeeNotes} with ${pastryFlavors}, creating ${flavorDesc} and ${textureDesc}. A delightful combination scoring ${Math.round(bunamoScore.overall * 100)}% compatibility.`,
              flavor_tags: [
                ...(selectedCoffee.flavor_notes?.split(',').slice(0, 2).map(t => t.trim()) || []),
                ...(pastry.flavor_tags?.split(',').slice(0, 1).map(t => t.trim()) || [])
              ].filter(Boolean),
              allergen_info: "Please check with staff for allergen information"
            };
          }

          return {
            pastry: {
              id: pastry.id,
              name: pastry.name,
              image: pastry.image_url || ''
            },
            score: bunamoScore.overall,
            score_breakdown: {
              flavor: bunamoScore.flavor,
              texture: bunamoScore.texture,
              popularity: bunamoScore.popularity,
              season: bunamoScore.seasonal
            },
            reasoning: {
              flavor: `Flavor compatibility score: ${Math.round(bunamoScore.flavor * 100)}%`,
              texture: `Texture balance score: ${Math.round(bunamoScore.texture * 100)}%`,
              popularity: `Popularity alignment: ${Math.round(bunamoScore.popularity * 100)}%`,
              season: `Seasonal relevance: ${Math.round(bunamoScore.seasonal * 100)}%`,
              fallback_note: "Bunamo scoring model used for analysis"
            },
            why_marketing: aiData.marketing_tagline || "Perfect pairing discovered",
            facts: [
              {
                summary: aiData.explanation || bunamoScore.explanation,
                source_url: "https://bunamo-model.com"
              }
            ],
            badges: ["Bunamo", "AI-Enhanced"],
            flavor_tags_standardized: aiData.flavor_tags || ["Harmonious", "Balanced"],
            allergen_info: aiData.allergen_info || "Check ingredients"
          };
        } catch (aiError) {
          console.error("Error enhancing pairing with AI:", aiError);
          // Fallback to Bunamo-only data
          return {
            pastry: {
              id: pastry.id,
              name: pastry.name,
              image: pastry.image_url || ''
            },
            score: bunamoScore.overall,
            score_breakdown: {
              flavor: bunamoScore.flavor,
              texture: bunamoScore.texture,
              popularity: bunamoScore.popularity,
              season: bunamoScore.seasonal
            },
            reasoning: {
              flavor: `Flavor compatibility: ${Math.round(bunamoScore.flavor * 100)}%`,
              texture: `Texture balance: ${Math.round(bunamoScore.texture * 100)}%`,
              popularity: `Popularity match: ${Math.round(bunamoScore.popularity * 100)}%`,
              season: `Seasonal fit: ${Math.round(bunamoScore.seasonal * 100)}%`,
              fallback_note: "Bunamo scoring model analysis"
            },
            why_marketing: "Perfect pairing discovered",
            facts: [
              {
                summary: bunamoScore.explanation,
                source_url: "https://bunamo-model.com"
              }
            ],
            badges: ["Bunamo"],
            flavor_tags_standardized: ["Harmonious", "Balanced"],
            allergen_info: "Check ingredients"
          };
        }
      })
    );

    return {
      coffee: {
        id: selectedCoffee.id,
        name: selectedCoffee.name,
        image: selectedCoffee.image_url || ''
      },
      pairs: enhancedPairings,
      ui: {
        layout: 'cards',
        show_downloads: ['pdf'],
        notes: "Top 3 pairings using advanced Bunamo scoring model with AI enhancement."
      }
    };

  } catch (error) {
    console.error("Error generating pairings with Bunamo:", error);
    // Create a dummy error response that fits the schema
    const errorResponse: PairingResponse = {
        coffee: {
            id: selectedCoffee.id,
            name: selectedCoffee.name,
            image: selectedCoffee.image_url ?? '',
        },
        pairs: [],
        ui: {
            layout: 'error',
            show_downloads: [],
            notes: "An error occurred while generating pairings. The Bunamo scoring model might be unavailable. Please try again.",
        },
    };
    return errorResponse;
  }
};