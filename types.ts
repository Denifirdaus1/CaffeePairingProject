export interface Coffee {
  id: string;
  created_at: string;
  updated_at: string;
  cafe_id: string;
  name: string;
  is_core: boolean;
  is_guest: boolean;
  flavor_notes: string;
  season_hint?: string;
  popularity_hint: number;
  image_url?: string;
  image_path?: string;
}

export interface Pastry {
  id: string;
  created_at: string;
  updated_at: string;
  cafe_id: string;
  name: string;
  flavor_tags: string;
  texture_tags: string;
  popularity_hint: number;
  image_url?: string;
  image_path?: string;
  allergen_info?: string;
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