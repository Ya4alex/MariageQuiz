import { useState, useEffect } from "react";
import type { TableEvent } from "../../data/events";
import Timer from "../../components/Timer";
import "./QuestionForm.css";

interface QuestionFormProps {
  tableState: TableEvent;
  sendTableAnswers: (answers: number[]) => void;
  sendAnswerQuestion: (answers: number[]) => void;
}

export default function QuestionForm({
  tableState,
  sendTableAnswers,
  sendAnswerQuestion,
}: QuestionFormProps) {
  const { role, question, table_answers, answered, table_state } = tableState;
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(table_answers || []);
  const [isTimeOver, setIsTimeOver] = useState(false);

  // Сброс выбранных ответов и таймера при новом вопросе или изменении таймера
  useEffect(() => {
    setSelectedAnswers(table_answers || []);
    setIsTimeOver(false);
  }, [question?.id, question?.timer, table_answers]);

  if (!question) return null;

  const isLeader = role === "leader";
  const isAnswered = answered;
  const isMultiple = question.question_type === "multiple_choice";
  const isInAnswers = table_state === "in_answers";
  const isBlocked = isTimeOver || isAnswered || isInAnswers || question.timer <= 0;
  const imgs = tableState.table_state === "in_answers" ? question.answer_images : question.images;

  const handleSelect = (idx: number) => {
    if (!isLeader || isBlocked) return;
    let newAnswers: number[];
    if (isMultiple) {
      if (selectedAnswers.includes(idx)) {
        newAnswers = selectedAnswers.filter((i) => i !== idx);
      } else {
        newAnswers = [...selectedAnswers, idx];
      }
    } else {
      newAnswers = [idx];
    }
    setSelectedAnswers(newAnswers);
    sendTableAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!isLeader || isBlocked) return;
    sendAnswerQuestion(selectedAnswers);
  };

  const correctSet = new Set(question.correct_answers);
  const selectedSet = new Set(selectedAnswers);

  return (
    <>
      {table_state === "in_question" && !isAnswered && (
        <Timer
          total_time={question.timer}
          time_left={question.time_left}
          onTimeEnd={() => setIsTimeOver(true)}
          style={{ borderRadius: 0 }}
        />
      )}
      <div className="question-form-container">
        <div className="question-images">
          {imgs.map((img, idx) => (
            <img key={idx} src={img} />
          ))}
        </div>
        <h2>{question.question}</h2>
        <em className="question-type">
          {tableState.table_state === "in_question" &&
            (isMultiple ? "Нужно выбрать несколько вариантов" : "Выберите один вариант")}
        </em>
        <ul style={{ listStyle: "none", padding: 0 }} className="question-answers-list">
          {question.answers.map((answer, idx) => {
            let inputClass = "";
            if (isInAnswers) {
              if (correctSet.has(idx)) {
                inputClass = "correct";
              } else if (!correctSet.has(idx) && selectedSet.has(idx)) {
                inputClass = "incorrect";
              }
            }
            return (
              <li key={idx}>
                <label className={`answer-label ${!isLeader && "disabled-answer"}`}>
                  <input
                    type={isMultiple ? "checkbox" : "radio"}
                    name="answer"
                    value={idx}
                    checked={selectedAnswers.includes(idx)}
                    disabled={!isLeader || isBlocked}
                    onChange={() => handleSelect(idx)}
                    className={inputClass}
                  />
                  {answer}
                </label>
              </li>
            );
          })}
        </ul>

        {!isInAnswers && isLeader && !isAnswered && !isTimeOver && question.timer > 0 && (
          <button onClick={handleSubmit} disabled={selectedAnswers.length === 0}>
            Отправить ответ
          </button>
        )}
        {!isInAnswers && isAnswered && (
          <div style={{ color: "green", marginTop: 8 }}>Ответ отправлен.</div>
        )}
        {!isInAnswers && !isLeader && (
          <div style={{ color: "#888", marginTop: 8 }}>Вы наблюдаете за действиями лидера.</div>
        )}
        {(isTimeOver || question.timer <= 0) && !isInAnswers && !isAnswered && (
          <div style={{ color: "#dc3545", marginTop: 8 }}>Время вышло! Ответить уже нельзя.</div>
        )}
        {isInAnswers && (
          <div style={{ color: "#005cbf", marginTop: 8 }}>
            <b>Показаны правильные ответы</b>
          </div>
        )}
      </div>
    </>
  );
}
