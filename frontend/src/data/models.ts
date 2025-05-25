export type category = "stepa" | "katya" | "stepa_katya";

export interface Question {
  id: number;
  categories: category[];
  question_type: "single_choice" | "multiple_choice";
  question: string;
  images: string[];
  answer_images: string[];
  answers: string[];
  correct_answers: number[];
  score: number;
  timer: number;
  time_left: number;
}

export interface TableData {
  table_id: number;
  table_name: string | null;
  table_state:
    | "waiting_leader"
    | "waiting_game_start"
    | "in_question"
    | "in_answers"
    | "in_results";
  clients: number;
  table_answers?: number[];
  answered?: boolean;
}

export interface TableResult {
  table_id: number;
  table_name: string;
  score: number;
  categories: Record<category, number>;
  answers: Record<number, number[]>;
}

export interface ScreenResults {
  winers: TableResult[];
  category_winners: Record<category, TableResult | null>;
}
