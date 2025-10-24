import { GoogleGenAI } from '@google/genai';
import type { Coffee, Pastry, PairingResponse } from '../types';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: generatePairingPrompt(selectedCoffee, allPastries),
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ googleSearch: {} }],
        }
    });

    // The response may be wrapped in markdown JSON backticks, so clean it before parsing.
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    const result = JSON.parse(jsonText);
    return result as PairingResponse;

  } catch (error) {
    console.error("Error generating pairings with Gemini:", error);
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
            notes: "An error occurred while generating pairings. The AI model might be unavailable or the request failed. Please check the console for details and try again.",
        },
    };
    return errorResponse;
  }
};