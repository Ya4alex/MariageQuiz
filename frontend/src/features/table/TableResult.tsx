import type { TableEvent } from "../../data/events";
import { categoryMorphMap, type category } from "../../data/models";
import "./TableResult.css";
import { useState } from "react";

interface TableResultProps {
  tableState: TableEvent;
}

const TableResult = ({ tableState }: TableResultProps) => {
  const { result } = tableState;
  const [openIdxs, setOpenIdxs] = useState<Set<number>>(new Set());

  if (!result) {
    return (
      <div className="table-result-container">
        <h2>Результаты</h2>
        <p>Результаты пока не загружены.</p>
      </div>
    );
  }

  const place = result.place !== null ? result.place : null;
  const placeEmoji = place === 1 ? "🥇" : "";

  // Для вопросов и ответов
  const questions = result.questions || [];
  const answers = result.answers || {};
  const questionScore = result.question_score || {};

  const toggleQuestion = (idx: number) => {
    setOpenIdxs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div className="table-result-container">
      <h2 className="table-result-title">
        {placeEmoji} Итоги стола №{tableState.table_id}
      </h2>
      <em>{tableState.table_name}</em>
      <div className="table-result-main">
        <div className="table-result-row">
          <span className="table-result-label">Место в общем зачёте:</span>
          <span className="table-result-value">
            <b className="table-result-place-number">{place !== null ? `${place}` : "—"}</b>
            <span className="table-result-place-amount"> из {result.place_amount}</span>
          </span>
        </div>
        <div className="table-result-row">
          <span className="table-result-label">Общие баллы:</span>
          <span className="table-result-value table-result-score">
            <b>{+result.score.toFixed(2)}</b>
          </span>
        </div>
      </div>
      <div className="table-result-categories">
        <h3 className="table-result-categories-title">Места по категориям</h3>
        <ul className="table-result-categories-list">
          {result.place_categories &&
            Object.entries(result.categories).map(([cat, score]) => {
              const catPlace = result.place_categories?.[cat as category];
              return (
                <li key={cat} className="table-result-category-item">
                  <span className="table-result-category-name">
                    {categoryMorphMap[cat as category].short}
                  </span>
                  <span className="table-result-category-place">
                    {catPlace === 1 ? "🥇" : ""}
                    {catPlace !== null && catPlace !== undefined ? `${catPlace} место` : "—"}
                  </span>
                  <span className="table-result-category-score">{+score.toFixed(2)} баллов</span>
                </li>
              );
            })}
        </ul>
      </div>

      {/* Список вопросов и баллы */}
      {questions.length > 0 && (
        <div className="table-result-questions">
          <h3 className="table-result-categories-title" style={{ marginTop: 24 }}>Вопросы</h3>
          <ul className="table-result-questions-list">
            {questions.map((q, idx) => {
              const userAnswers = answers[q.id] || [];
              const isOpen = openIdxs.has(idx);

              // Используем question_score для баллов
              const userScore = questionScore[q.id] ?? 0;
              const maxScore = q.score ?? q.correct_answers.length;

              return (
                <li
                  key={q.id}
                  className={`table-result-question-item${isOpen ? " open" : ""}`}
                  onClick={() => toggleQuestion(idx)}
                >
                  <div className="table-result-question-header">
                    <span className="table-result-question-number">{idx + 1}.</span>
                    <span className="table-result-question-title">{q.question}</span>
                    <span className="table-result-question-score">
                      {userScore} / {maxScore}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="table-result-question-details">
                      <div>
                        <b>Ваш ответ:</b>{" "}
                        {userAnswers.length
                          ? userAnswers.map((aIdx: number) => q.answers[aIdx]).join(", ")
                          : <span style={{ color: "#dc3545" }}>нет ответа</span>}
                      </div>
                      <div>
                        <b>Правильный:</b>{" "}
                        {q.correct_answers.map((aIdx: number) => q.answers[aIdx]).join(", ")}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TableResult;
