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

export interface ToTableResult {
  score: number;
  question_score: Record<number, number>;
  categories: Record<category, number>;
  answers: Record<number, number[]>;
  questions: Question[];
  place: number | null;
  place_categories: Record<category, number | null> | null;
  place_amount: number;
}

export interface ScreenResults {
  winers: TableResult[];
  category_winners: Record<category, TableResult | null>;
}

export const categoryMorphMap = {
  stepa: {
    short: "Стёпа",
    full: (
      <>
        <b style={{ fontSize: "1.5em" }}>🎉</b> Лучше всех знают Стёпу
      </>
    ),
  },
  katya: {
    short: "Катя",
    full: (
      <>
        <b style={{ fontSize: "1.5em" }}>🎊</b> Лучше всех знают Катю
      </>
    ),
  },
  stepa_katya: {
    short: "Катя и Стёпа",
    full: (
      <>
        <b style={{ fontSize: "1.5em" }}>✨</b> Лучше всех знают Катю и Стёпу
      </>
    ),
  },
};
