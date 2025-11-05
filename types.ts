export interface Coffee {
  id: string;
  created_at: string;
  updated_at: string;
  cafe_id: string;
  name: string;
  slug?: string;
  is_core: boolean;
  is_guest: boolean;
  is_main_shot?: boolean;
  main_shot_until?: string;
  flavor_notes: string;
  season_hint?: string;
  popularity_hint: number;
  image_url?: string;
  image_path?: string;
  online_shop_link?: string;
  price?: number;
  // New fields
  roast_type?: string;
  preparation?: string;
  sort_blend?: string;
  origin?: string;
  acidity?: number; // 1-5
}

export interface Bean {
  id: string;
  created_at: string;
  updated_at: string;
  cafe_id: string;
  name: string;
  slug?: string;
  is_core?: boolean;
  is_guest?: boolean;
  flavor_notes?: string;
  image_url?: string;
  image_path?: string;
  roast_type?: string;
  sort_blend?: string;
  origin?: string;
  acidity?: number; // 1-5
}

export interface Preparation {
  id: string;
  created_at: string;
  updated_at: string;
  bean_id: string;
  cafe_id: string;
  method_name: string; // e.g., Espresso, Cappuccino
  price: number;
}

export interface Pastry {
  id: string;
  created_at: string;
  updated_at: string;
  cafe_id: string;
  name: string;
  slug?: string;
  is_core?: boolean;
  flavor_tags: string;
  texture_tags: string;
  season_hint?: string;
  popularity_hint: number;
  image_url?: string;
  image_path?: string;
  allergen_info?: string;
  price?: number;
  // New fields
  sweetness?: number; // 1-5
  richness?: number; // 1-5
}

export interface Tenant {
    id: string;
    name: string;
    created_at: string;
}

export interface Fact {
  summary: string;
  source_url: string;
}

export interface ScoreBreakdown {
  flavor: number;
  texture: number;
  popularity: number;
  season: number;
}

export interface Reasoning {
  flavor: string;
  texture: string;
  popularity: string;
  season: string;
  fallback_note?: string;
}

export interface Pairing {
  pastry: {
    id: string;
    name: string;
    image: string;
  };
  score: number;
  score_breakdown: ScoreBreakdown;
  reasoning: Reasoning;
  why_marketing: string;
  facts: Fact[];
  badges: string[];
  flavor_tags_standardized: string[];
  allergen_info?: string;
}

export interface PairingResponse {
  coffee: {
    id: string;
    name: string;
    image: string;
  };
  pairs: Pairing[];
  ui: {
    layout: string;
    show_downloads: string[];
    notes: string;
  };
}