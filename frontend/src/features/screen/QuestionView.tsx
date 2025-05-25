import type { ScreenTablesStateEvent } from "../../data/events";
import Timer from "../../components/Timer";
import "./QuestionView.css";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";

interface QuestionProps {
  screenState: ScreenTablesStateEvent;
}

export const QuestionView = ({ screenState }: QuestionProps) => {
  const question = screenState.question;
  if (!question) return null;
  const { width, height } = useWindowSize();

  // Показывать таймер только если есть время и нужное состояние
  const in_question = screenState.game_state === "in_question";
  const in_answers = screenState.game_state === "in_answers";
  const isMultiple = question.question_type === "multiple_choice";
  const imgs = screenState.game_state === "in_answers" ? question.answer_images : question.images;

  return (
    <>
      <ReactConfetti
        width={width}
        height={height}
        numberOfPieces={in_answers ? 5 : 0}
        recycle={true}
      />
      <div className="question-view">
        <div className="question-view-item" style={imgs.length > 0 ? { maxWidth: "50vw" } : {}}>
          <h2>Вопрос № {question.id + 1}</h2>
          <div className="question-images">
            {imgs.map((img, idx) => (
              <img key={idx} src={img} />
            ))}
          </div>
          <div className="question">{question.question}</div>
          {in_question && <Timer total_time={question.timer} time_left={question.time_left} />}
        </div>
        <div className="question-view-item">
          <em className="question-type">
            {in_question &&
              (isMultiple ? "Нужно выбрать несколько вариантов" : "Выберите один вариант")}
          </em>
          <div className="question-answers">
            {question.answers.map((answer, idx) => (
              <div
                key={idx}
                className={
                  `question-answer ` +
                  (in_answers && screenState.question?.correct_answers.includes(idx)
                    ? "question-answer-correct"
                    : "")
                }
              >
                {answer}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
