import type { TableData, Question, ScreenResults, TableResult } from "./models";

// Базовое событие
export interface WsEvent {
  event_type: string;
}

// Ошибка
export interface ErrorWsEvent extends WsEvent {
  error: string;
}

// Событие для стола
export interface TableEvent extends WsEvent, TableData {
  role: "leader" | "observer";
  question: Question | null;
  result: TableResult | null;
}

// Событие для экрана: состояние всех столов, вопрос, результаты
export interface ScreenTablesStateEvent extends WsEvent {
  event_type: "screen_tables_state";
  game_state: "waiting" | "in_question" | "in_answers" | "in_results";
  tables: TableData[];
  question?: Question | null;
  results?: ScreenResults | null;
}

// Событие: стол дал ответ
export interface ScreenTableAnsweredEvent extends WsEvent {
  event_type: "screen_table_answered";
  table_id: number;
  table_name: string | null;
  last: boolean;
}
