import { GoogleGenAI } from '@google/genai';

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

const ai = new GoogleGenAI({ 
    apiKey
});

export interface CoffeeMetadata {
    roast_type: string;
    preparation: string;
    sort_blend: string;
    origin: string;
    acidity: number;
    flavor_notes: string;
    season_hint: string;
    popularity_hint: number;
    is_core: boolean;
    is_guest: boolean;
}

export interface PastryMetadata {
    flavor_tags: string;
    texture_tags: string;
    sweetness: number;
    richness: number;
    popularity_hint: number;
    allergen_info: string;
}

const COFFEE_METADATA_PROMPT = (coffeeName: string): string => `
You are a coffee expert AI assistant. Your task is to search the web and extract detailed metadata about a coffee based on its name.

**Coffee Name:** ${coffeeName}

**Instructions:**
1. Use Google Search to find information about this coffee
2. Extract the following information and return ONLY a valid JSON object (no markdown, no extra text):
   - roast_type: One of ["Light", "Medium", "Medium-Dark", "Dark", "Espresso"]
   - preparation: Common brewing methods (e.g., "Espresso, French Press, Moka Pot")
   - sort_blend: Bean composition (e.g., "100% Arabica", "70% Arabica, 30% Robusta")
   - origin: Country/region of origin (e.g., "Ethiopia", "Colombia")
   - acidity: Number 1-5 (1=low, 5=high)
   - flavor_notes: Comma-separated flavor descriptors (e.g., "chocolate, nutty, caramel")
   - season_hint: One of ["fall", "winter", "spring", "summer", ""] or empty string
   - popularity_hint: Number 0.0-1.0 (0=rare, 1=bestseller)
   - is_core: Boolean (true if commonly available year-round)
   - is_guest: Boolean (true if seasonal/limited edition)

**Important:**
- Base ALL information on actual search results
- If information is not found, use reasonable defaults:
  - roast_type: "Medium"
  - acidity: 3
  - popularity_hint: 0.5
  - is_core: true
  - is_guest: false
  - flavor_notes: Use coffee name characteristics if no specific info found
  - origin: Leave empty if unknown
- Return ONLY the JSON object, no explanations

**Response Format (JSON only):**
{
  "roast_type": "Medium",
  "preparation": "Espresso, French Press",
  "sort_blend": "100% Arabica",
  "origin": "Ethiopia",
  "acidity": 4,
  "flavor_notes": "floral, citrus, jasmine",
  "season_hint": "spring",
  "popularity_hint": 0.7,
  "is_core": true,
  "is_guest": false
}
`;

const PASTRY_METADATA_PROMPT = (pastryName: string): string => `
You are a pastry and bakery expert AI assistant. Your task is to search the web and extract detailed metadata about a pastry based on its name.

**Pastry Name:** ${pastryName}

**Instructions:**
1. Use Google Search to find information about this pastry
2. Extract the following information and return ONLY a valid JSON object (no markdown, no extra text):
   - flavor_tags: Comma-separated flavor descriptors (e.g., "almond, butter, vanilla")
   - texture_tags: Comma-separated texture descriptors (e.g., "flaky, crispy, buttery")
   - sweetness: Number 1-5 (1=low, 5=very sweet)
   - richness: Number 1-5 (1=light, 5=very rich)
   - popularity_hint: Number 0.0-1.0 (0=rare, 1=bestseller)
   - allergen_info: Common allergens or "None known" or empty string

**Important:**
- Base ALL information on actual search results
- If information is not found, use reasonable defaults:
  - sweetness: 3
  - richness: 3
  - popularity_hint: 0.6
  - flavor_tags: Use pastry name characteristics
  - texture_tags: Infer from pastry type
  - allergen_info: "Contains gluten" if unknown
- Return ONLY the JSON object, no explanations

**Response Format (JSON only):**
{
  "flavor_tags": "almond, butter, vanilla",
  "texture_tags": "flaky, crispy, buttery",
  "sweetness": 4,
  "richness": 4,
  "popularity_hint": 0.8,
  "allergen_info": "Contains gluten, almonds"
}
`;

export const generateCoffeeMetadata = async (coffeeName: string): Promise<CoffeeMetadata> => {
    try {
        const prompt = COFFEE_METADATA_PROMPT(coffeeName);
        
        // Call Gemini with Google Search enabled
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });

        if (!response.text) {
            throw new Error('AI response text is undefined');
        }

        let text = response.text.trim();
        
        // Extract JSON from markdown code blocks if present
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }
        
        // Parse JSON response
        const metadata = JSON.parse(text) as CoffeeMetadata;
        
        // Validate and set defaults if needed
        return {
            roast_type: metadata.roast_type || 'Medium',
            preparation: metadata.preparation || '',
            sort_blend: metadata.sort_blend || '',
            origin: metadata.origin || '',
            acidity: metadata.acidity || 3,
            flavor_notes: metadata.flavor_notes || '',
            season_hint: metadata.season_hint || '',
            popularity_hint: metadata.popularity_hint || 0.5,
            is_core: metadata.is_core !== undefined ? metadata.is_core : true,
            is_guest: metadata.is_guest !== undefined ? metadata.is_guest : false
        };
    } catch (error) {
        console.error('Error generating coffee metadata:', error);
        // Return safe defaults
        return {
            roast_type: 'Medium',
            preparation: '',
            sort_blend: '',
            origin: '',
            acidity: 3,
            flavor_notes: '',
            season_hint: '',
            popularity_hint: 0.5,
            is_core: true,
            is_guest: false
        };
    }
};

export const generatePastryMetadata = async (pastryName: string): Promise<PastryMetadata> => {
    try {
        const prompt = PASTRY_METADATA_PROMPT(pastryName);
        
        // Call Gemini with Google Search enabled
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                temperature: 0.3
            }
        });

        if (!response.text) {
            throw new Error('AI response text is undefined');
        }

        let text = response.text.trim();
        
        // Extract JSON from markdown code blocks if present
        if (text.startsWith('```json')) {
            text = text.substring(7, text.length - 3).trim();
        } else if (text.startsWith('```')) {
            text = text.substring(3, text.length - 3).trim();
        }
        
        // Parse JSON response
        const metadata = JSON.parse(text) as PastryMetadata;
        
        // Validate and set defaults if needed
        return {
            flavor_tags: metadata.flavor_tags || '',
            texture_tags: metadata.texture_tags || '',
            sweetness: metadata.sweetness || 3,
            richness: metadata.richness || 3,
            popularity_hint: metadata.popularity_hint || 0.6,
            allergen_info: metadata.allergen_info || ''
        };
    } catch (error) {
        console.error('Error generating pastry metadata:', error);
        // Return safe defaults
        return {
            flavor_tags: '',
            texture_tags: '',
            sweetness: 3,
            richness: 3,
            popularity_hint: 0.6,
            allergen_info: ''
        };
    }
};
