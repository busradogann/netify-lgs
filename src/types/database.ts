export interface School {
  id: string;
  name: string;
  type: "fen" | "anadolu" | "sosyal" | "imam_hatip" | "meslek";
  city: string;
  district: string;
  program: string | null;
  language: string | null;
  created_at: string;
}

export interface PlacementScore {
  id: string;
  school_id: string;
  year: number;
  quota: number | null;
  placed: number | null;
  min_score: number | null;
  min_ranking: number | null;
  max_ranking: number | null;
  created_at: string;
}

export interface SchoolWithScore extends School {
  placement: PlacementScore | null;
  placements?: PlacementScore[];
}

export interface SchoolWithYearlyScores extends SchoolWithScore {
  yearlyScores: Record<number, number | null>;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: "ogrenci" | "ebeveyn";
  target_ranking: number | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  school_id: string;
  created_at: string;
}

export interface ScoreHistory {
  id: string;
  user_id: string;
  turkce: number;
  matematik: number;
  fen: number;
  inkilap: number;
  din: number;
  yabanci_dil: number;
  total_net: number;
  estimated_score: number | null;
  estimated_ranking: number | null;
  source: "manual" | "deneme";
  created_at: string;
}

export type Subject = "turkce" | "matematik" | "fen" | "inkilap" | "din" | "yabanciDil";

export interface Question {
  id: string;
  subject: Subject;
  text: string;
  options: string[];
  correct_index: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      schools: { Row: School };
      placement_scores: { Row: PlacementScore };
      profiles: { Row: Profile };
      favorites: { Row: Favorite };
      score_history: { Row: ScoreHistory };
      questions: { Row: Question };
    };
  };
}
